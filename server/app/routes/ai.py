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
from app.models import Conversation, ChatMessage, GownDesign

ai_bp = Blueprint('ai', __name__)

SUBNP_BASE_URL = "https://subnp.com"
POLLINATIONS_BASE = "https://image.pollinations.ai/prompt"


def build_dress_prompt(prompt_text, params):
    color_map = {
        '#111827': 'black', '#2457F5': 'blue', '#E11D48': 'red',
        '#10B981': 'emerald green', '#A855F7': 'purple', '#F59E0B': 'gold',
        '#FFFFFF': 'white', '#EC4899': 'pink', '#1E3A8A': 'navy',
        '#EAB308': 'yellow', '#8B5CF6': 'violet', '#2D5016': 'forest green',
    }
    color_hex = params.get('color', '#EC4899')
    color_name = color_map.get(color_hex.upper(), color_hex)

    hints = []
    if color_name:
        hints.append(color_name)
    if params.get('pattern') and params['pattern'] != 'solid':
        hints.append(f"{params['pattern']} pattern")
    if params.get('texture'):
        hints.append(f"{params['texture']} fabric")
    hints_str = ", ".join(hints)

    subject = prompt_text.strip() if prompt_text and prompt_text.strip() else "a garment"

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


def save_design_record(account_id, prompt, params, image_url):
    design = GownDesign(
        account_id=account_id,
        name=prompt.strip() or "Untitled Design",
        prompt=prompt,
        color=params.get('color', '#EC4899'),
        pattern=params.get('pattern', 'solid'),
        sleeve_length=float(params.get('sleeve_length', 70)),
        neckline=params.get('neckline', 'v-neck'),
        train_length=float(params.get('train_length', 50)),
        texture=params.get('texture', 'satin'),
        texture_intensity=float(params.get('texture_intensity', 40)),
        skirt_volume=float(params.get('skirt_volume', 60)),
        image_url=image_url,
    )
    db.session.add(design)
    return design


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
            model='gemini-2.0-flash',
            contents=f"Generate a photorealistic fashion image prompt for: {prompt_text or 'a garment'}",
            config={'system_instruction': system},
        )
        return response.text.strip()
    except Exception:
        return None


@ai_bp.route('/models', methods=['GET'])
@jwt_required()
def list_models():
    models = [
        {'id': 'pollinations', 'name': 'Pollinations.ai', 'provider': 'Pollinations.ai',
         'requires_key': False, 'key_configured': True},
    ]
    api_key = current_app.config.get('GOOGLE_API_KEY')
    if api_key:
        models.append({'id': 'gemini-enhanced', 'name': 'Gemini-Enhanced', 'provider': 'Google + Pollinations',
                       'requires_key': True, 'key_configured': True})

    try:
        resp = requests.get(f"{SUBNP_BASE_URL}/api/free/models", timeout=10)
        if resp.ok:
            for m in resp.json().get('models', []):
                models.append({'id': f"subnp-{m['model']}", 'name': f"SubNP ({m['model']})",
                               'provider': m.get('provider', 'SubNP'), 'requires_key': False, 'key_configured': True})
        else:
            for m in ['turbo', 'flux', 'magic']:
                models.append({'id': f"subnp-{m}", 'name': f"SubNP ({m})",
                               'provider': 'SubNP', 'requires_key': False, 'key_configured': True})
    except Exception:
        for m in ['turbo', 'flux', 'magic']:
            models.append({'id': f"subnp-{m}", 'name': f"SubNP ({m})",
                           'provider': 'SubNP', 'requires_key': False, 'key_configured': True})

    return jsonify({'models': models}), 200


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

        # Generate the image
        if model == 'gemini-enhanced':
            enhanced = enhance_prompt_with_gemini(prompt, params)
            final_prompt = enhanced if enhanced else build_dress_prompt(prompt, params)
        else:
            final_prompt = build_dress_prompt(prompt, params)

        # Hit the image provider
        if model.startswith('subnp-'):
            image_bytes, error = fetch_subnp_image(final_prompt, model.split('-', 1)[1])
        else:
            image_bytes, error = fetch_pollinations_image(final_prompt)

        if error:
            return jsonify({'error': error}), 500

        # Save image to disk
        image_path = save_image_to_disk(image_bytes)

        # Save to conversation
        conv = ensure_conversation(account_id, conv_id, prompt)
        add_chat_message(conv.id, 'user', prompt)
        add_chat_message(conv.id, 'assistant', 'Generated design', image_url=image_path)
        conv.updated_at = datetime.utcnow()

        # Save design record
        save_design_record(account_id, prompt, params, image_path)

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


def fetch_pollinations_image(prompt):
    try:
        url = f"{POLLINATIONS_BASE}/{requests.utils.quote(prompt)}"
        resp = requests.get(url, timeout=60)
        if resp.status_code == 200 and len(resp.content) > 1000:
            return resp.content, None
        return None, f"Pollinations returned {resp.status_code}"
    except Exception as e:
        return None, f'Pollinations failed: {str(e)}'


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
