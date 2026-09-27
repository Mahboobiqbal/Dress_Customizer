"""
AI image generation routes: saves images locally, stores in DB with chat history.
"""
import base64
import io
import json
import os
import uuid
import requests
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Conversation, ChatMessage

ai_bp = Blueprint('ai', __name__)

SUBNP_BASE_URL = "https://subnp.com"
POLLINATIONS_BASE = "https://image.pollinations.ai/prompt"

GEMINI_IMAGE_MODELS = [
    'gemini-3.1-flash-image',
    'gemini-3.1-flash-image-preview',
    'gemini-3-pro-image',
    'gemini-3-pro-image-preview',
]


def build_dress_prompt(prompt_text, params):
    dress_type = params.get('dress_type', 'dress').replace('-', ' ')
    
    color_map = {
        '#111827': 'black', '#2457F5': 'blue', '#E11D48': 'red',
        '#10B981': 'emerald green', '#A855F7': 'purple', '#F59E0B': 'gold',
        '#FFFFFF': 'white', '#EC4899': 'pink', '#1E3A8A': 'navy',
        '#EAB308': 'yellow', '#8B5CF6': 'violet', '#2D5016': 'forest green',
    }
    color_hex = params.get('color', '#EC4899')
    color_name = color_map.get(color_hex.upper(), color_hex)

    hints = [dress_type]
    if color_name:
        hints.append(color_name)
    if params.get('pattern') and params['pattern'] != 'solid':
        hints.append(f"{params['pattern']} pattern")
    if params.get('texture'):
        hints.append(f"{params['texture']} fabric")
    hints_str = ", ".join(hints)

    subject = prompt_text.strip() if prompt_text and prompt_text.strip() else f"a {dress_type}"

    if hints_str:
        return f"{subject}, {hints_str}, fashion photography, studio lighting, clean background, sharp focus, high detail"
    return f"{subject}, fashion photography, studio lighting, clean background, sharp focus, high detail"


def save_image_to_disk(image_bytes, subfolder='designs'):
    folder = os.path.join(current_app.config['UPLOAD_FOLDER'], subfolder)
    os.makedirs(folder, exist_ok=True)
    filename = f"{uuid.uuid4()}.png"
    filepath = os.path.join(folder, filename)
    with open(filepath, 'wb') as f:
        f.write(image_bytes)
    return f"{request.host_url}api/uploads/{subfolder}/{filename}"


def ensure_conversation(account_id, conv_id=None, prompt_text=""):
    if conv_id:
        conv = Conversation.query.filter_by(id=conv_id, account_id=account_id).first()
        if conv:
            return conv
    conv = Conversation(account_id=account_id, title=prompt_text[:80] or "Design Session")
    db.session.add(conv)
    db.session.commit()
    return conv


def add_chat_message(conversation_id, role, content, image_url=None):
    msg = ChatMessage(
        conversation_id=conversation_id,
        sender_role=role,
        content=content,
        image_url=image_url,
    )
    db.session.add(msg)
    return msg


def enhance_prompt_with_gemini(prompt_text, params):
    api_key = current_app.config.get('GOOGLE_API_KEY')
    if not api_key:
        return None

    try:
        from google import genai
        client = genai.Client(api_key=api_key)

        color_map = {
            '#111827': 'black', '#2457F5': 'blue', '#E11D48': 'red',
            '#10B981': 'emerald green', '#A855F7': 'purple', '#F59E0B': 'gold',
            '#FFFFFF': 'white', '#EC4899': 'pink', '#1E3A8A': 'navy',
            '#EAB308': 'yellow', '#8B5CF6': 'violet', '#2D5016': 'forest green',
        }
        color_name = color_map.get(params.get('color', '').upper(), params.get('color', ''))

        system = f"""You are a fashion prompt expert. Rewrite the user's request into a detailed, photorealistic image generation prompt.
Include these details if relevant: color ({color_name}), pattern ({params.get('pattern', 'solid')}), fabric ({params.get('texture', 'satin')}).
Keep it concise (under 200 characters). Output ONLY the prompt text, no explanation."""

        response = client.models.generate_content(
            model='gemini-3.8-flash',
            contents=f"Generate a photorealistic fashion image prompt for: {prompt_text or 'a garment'}",
            config={'system_instruction': system},
        )
        return response.text.strip()
    except Exception:
        return None


@ai_bp.route('/models', methods=['GET'])
@jwt_required()
def list_models():
    # Text generation models (Gemini)
    gemini_key = current_app.config.get('GOOGLE_API_KEY')
    text_models = [
        {'id': 'gemini-3.8-flash', 'name': 'Gemini 3.8 Flash', 'provider': 'Google',
         'type': 'text', 'requires_key': True, 'key_configured': bool(gemini_key)},
    ]

    # Image generation models
    image_models = [
        {'id': 'pollinations', 'name': 'Pollinations.ai', 'provider': 'Pollinations',
         'type': 'image', 'requires_key': False, 'key_configured': True, 'supports_image_input': True},
    ]
    api_key = current_app.config.get('GOOGLE_API_KEY')
    for gm in GEMINI_IMAGE_MODELS:
        pretty = gm.replace('gemini-', 'Gemini ').replace('-image', ' Image').replace('-preview', ' (Preview)')
        image_models.append({'id': f"google-{gm}", 'name': pretty, 'provider': 'Google',
                             'type': 'image', 'requires_key': True, 'key_configured': bool(api_key),
                             'supports_image_input': True})

    try:
        resp = requests.get(f"{SUBNP_BASE_URL}/api/free/models", timeout=10)
        if resp.ok:
            for m in resp.json().get('models', []):
                image_models.append({'id': f"subnp-{m['model']}", 'name': f"SubNP ({m['model']})",
                               'provider': m.get('provider', 'SubNP'), 'type': 'image',
                               'requires_key': False, 'key_configured': True, 'supports_image_input': False})
        else:
            for m in ['turbo', 'flux', 'magic']:
                image_models.append({'id': f"subnp-{m}", 'name': f"SubNP ({m})",
                               'provider': 'SubNP', 'type': 'image',
                               'requires_key': False, 'key_configured': True, 'supports_image_input': False})
    except Exception:
        for m in ['turbo', 'flux', 'magic']:
            image_models.append({'id': f"subnp-{m}", 'name': f"SubNP ({m})",
                           'provider': 'SubNP', 'type': 'image',
                           'requires_key': False, 'key_configured': True, 'supports_image_input': False})

    return jsonify({'text_models': text_models, 'image_models': image_models}), 200


@ai_bp.route('/generate-image', methods=['POST'])
@jwt_required()
def generate_image():
    try:
        account_id = get_jwt_identity()
        data = request.get_json()
        if not data or not data.get('prompt'):
            return jsonify({'error': 'Missing prompt'}), 400

        prompt = data.get('prompt', '')
        params = data.get('params', {})
        model = data.get('model', 'pollinations')
        conv_id = data.get('conversation_id')
        input_image = data.get('input_image')

        # Save uploaded image to disk if provided
        input_image_url = None
        if input_image:
            image_bytes = base64.b64decode(input_image.split(',')[1] if ',' in input_image else input_image)
            input_image_url = save_image_to_disk(image_bytes, subfolder='uploads')

        # Generate the image
        input_image_bytes = None
        if input_image_url:
            # Read back the saved image for passing to Gemini
            upload_path = os.path.join(current_app.config['UPLOAD_FOLDER'], 'uploads',
                                       os.path.basename(input_image_url))
            if os.path.exists(upload_path):
                with open(upload_path, 'rb') as f:
                    input_image_bytes = f.read()

        if model == 'gemini-enhanced':
            if input_image_bytes:
                # Image input: build a prompt that references the uploaded photo
                final_prompt = (
                    f"Look at this photo of me. {prompt or 'Choose the best dress for me and show it worn on me.'} "
                    f"Generate a photorealistic image of me wearing the recommended outfit. "
                    f"Keep my face and body from the original photo. "
                    f"Make it look natural, like a real photo."
                )
            else:
                enhanced = enhance_prompt_with_gemini(prompt, params)
                final_prompt = enhanced if enhanced else build_dress_prompt(prompt, params)
        else:
            final_prompt = build_dress_prompt(prompt, params)

        # Hit the image provider
        if model == 'gemini-enhanced' or model.startswith('google-'):
            api_key = current_app.config.get('GOOGLE_API_KEY')
            if not api_key:
                return jsonify({'error': 'Google Imagen is not available. GOOGLE_API_KEY is not configured. Please select another model.'}), 503
            preferred = model[len('google-'):] if model.startswith('google-') else None
            image_bytes, error = fetch_google_imagen(final_prompt, input_image_bytes, preferred_model=preferred)
            if error:
                return jsonify({'error': f'Google Imagen is not available: {error}. Please select another model.'}), 503
        elif model.startswith('subnp-'):
            image_bytes, error = fetch_subnp_image(final_prompt, model.split('-', 1)[1])
            if error:
                return jsonify({'error': f'SubNP is not available: {error}. Please select another model.'}), 503
        else:
            image_bytes, error = fetch_pollinations_image(final_prompt, input_image_url)
            if error:
                return jsonify({'error': f'Pollinations is not available: {error}. Please select another model.'}), 503

        if not image_bytes:
            return jsonify({'error': f'Model "{model}" failed to generate an image. Please select another model.'}), 500

        # Save image to disk
        image_path = save_image_to_disk(image_bytes)

        # Save to conversation
        conv = ensure_conversation(account_id, conv_id, prompt)
        add_chat_message(conv.id, 'user', prompt)
        add_chat_message(conv.id, 'assistant', 'Generated design', image_url=image_path)
        conv.updated_at = datetime.utcnow()

        db.session.commit()

        return jsonify({
            'success': True,
            'image': image_path,
            'prompt': prompt,
            'model': model,
            'conversation_id': conv.id,
            'message': 'Image generated successfully',
        }), 200

    except Exception as e:
        db.session.rollback()
        import traceback
        print(f"Image generation error: {traceback.format_exc()}")
        return jsonify({'error': f'Image generation failed: {str(e)}'}), 500


def fetch_pollinations_image(prompt, input_image_url=None):
    try:
        url = f"{POLLINATIONS_BASE}/{requests.utils.quote(prompt)}"
        params = {}
        if input_image_url:
            params['image'] = input_image_url
        resp = requests.get(url, params=params, timeout=60)
        if resp.status_code == 200 and len(resp.content) > 1000:
            return resp.content, None
        return None, f"Pollinations returned {resp.status_code}"
    except Exception as e:
        return None, f'Pollinations failed: {str(e)}'


def fetch_google_imagen(prompt, input_image_bytes=None, preferred_model=None):
    api_key = current_app.config.get('GOOGLE_API_KEY')
    if not api_key:
        return None, 'GOOGLE_API_KEY not configured'

    candidates = [m for m in [preferred_model] + GEMINI_IMAGE_MODELS if m]
    errors = []

    from google import genai
    from google.genai import types
    client = genai.Client(api_key=api_key)

    for model_name in candidates:
        try:
            contents = []
            if input_image_bytes:
                contents.append(types.Part.from_bytes(
                    data=input_image_bytes,
                    mime_type='image/png',
                ))
            contents.append(prompt)

            response = client.models.generate_content(
                model=model_name,
                contents=contents,
                config={
                    'response_modalities': ['TEXT', 'IMAGE'],
                }
            )

            # Extract image from response parts
            for part in response.candidates[0].content.parts:
                if hasattr(part, 'inline_data') and part.inline_data:
                    return part.inline_data.data, None
            errors.append(f'{model_name}: returned no image')
        except Exception as e:
            errors.append(f'{model_name}: {str(e)[:100]}')

    return None, '; '.join(errors) or 'Google Gemini failed'


def fetch_subnp_image(prompt, subnp_model='turbo'):
    try:
        resp = requests.post(
            f"{SUBNP_BASE_URL}/api/free/generate",
            json={'prompt': prompt, 'model': subnp_model},
            stream=True, timeout=60,
        )
        if not resp.ok:
            return None, f"SubNP API error: {resp.status_code}"

        image_url = None
        for line in resp.iter_lines(decode_unicode=True):
            if not line or not line.startswith('data: '):
                continue
            try:
                data = json.loads(line[6:])
                if data.get('status') == 'complete':
                    image_url = data.get('imageUrl')
                    break
                elif data.get('status') == 'error':
                    return None, data.get('message', 'SubNP generation error')
            except json.JSONDecodeError:
                continue

        if not image_url:
            return None, 'SubNP did not return an image URL.'

        img_resp = requests.get(image_url, timeout=30)
        if img_resp.ok:
            return img_resp.content, None
        return None, 'Failed to download SubNP image'

    except requests.exceptions.Timeout:
        return None, 'SubNP request timed out.'
    except requests.exceptions.ConnectionError:
        return None, 'Could not reach SubNP API.'
    except Exception as e:
        return None, f'SubNP generation failed: {str(e)}'


@ai_bp.route('/generate-text', methods=['POST'])
@jwt_required()
def generate_text():
    try:
        account_id = get_jwt_identity()
        data = request.get_json()
        if not data or not data.get('prompt'):
            return jsonify({'error': 'Missing prompt'}), 400

        prompt = data.get('prompt', '')
        model = data.get('model', 'gemini-3.8-flash')
        conv_id = data.get('conversation_id')

        gemini_key = current_app.config.get('GOOGLE_API_KEY')
        if not gemini_key:
            return jsonify({'error': 'Google API key not configured.'}), 503

        from google import genai
        client = genai.Client(api_key=gemini_key)

        gemini_model = model if model.startswith('gemini-') else 'gemini-3.8-flash'

        system_msg = (
            "Your name is MenteE AI. You are a fashion design assistant created by MenteE. "
            "Help users with dress designs, outfit suggestions, fabric choices, color combinations, "
            "and style advice. Be concise and helpful. "
            "Always identify yourself as MenteE AI when asked your name. "
            "Never invent a different name or persona."
        )

        response = client.models.generate_content(
            model=gemini_model,
            contents=prompt,
            config={
                'system_instruction': system_msg,
                'max_output_tokens': 1024,
                'temperature': 0.7,
            },
        )

        reply = response.text.strip()

        conv = ensure_conversation(account_id, conv_id, prompt)
        add_chat_message(conv.id, 'user', prompt)
        add_chat_message(conv.id, 'assistant', reply)
        conv.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'success': True,
            'text': reply,
            'model': model,
            'conversation_id': conv.id,
        }), 200

    except Exception as e:
        db.session.rollback()
        import traceback
        print(f"Text generation error: {traceback.format_exc()}")
        return jsonify({'error': f'Text generation failed: {str(e)}'}), 500
