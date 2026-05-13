"""
AI image generation routes: Pollinations.ai + Gemini-enhanced prompts.
"""
import base64
import io
import json
import requests
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity

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

    subject = prompt_text.strip() if prompt_text and prompt_text.strip() else f"a garment"

    if hints_str:
        return f"{subject}, {hints_str}, fashion photography, studio lighting, clean background, sharp focus, high detail"
    return f"{subject}, fashion photography, studio lighting, clean background, sharp focus, high detail"


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
        {
            'id': 'pollinations',
            'name': 'Pollinations.ai',
            'provider': 'Pollinations.ai',
            'requires_key': False,
            'key_configured': True,
        },
    ]

    api_key = current_app.config.get('GOOGLE_API_KEY')
    if api_key:
        models.append({
            'id': 'gemini-enhanced',
            'name': 'Gemini-Enhanced',
            'provider': 'Google + Pollinations',
            'requires_key': True,
            'key_configured': True,
        })

    try:
        resp = requests.get(f"{SUBNP_BASE_URL}/api/free/models", timeout=10)
        if resp.ok:
            for m in resp.json().get('models', []):
                models.append({
                    'id': f"subnp-{m['model']}", 'name': f"SubNP ({m['model']})",
                    'provider': m.get('provider', 'SubNP'),
                    'requires_key': False, 'key_configured': True,
                })
        else:
            for m in ['turbo', 'flux', 'magic']:
                models.append({
                    'id': f"subnp-{m}", 'name': f"SubNP ({m})",
                    'provider': 'SubNP', 'requires_key': False, 'key_configured': True,
                })
    except Exception:
        for m in ['turbo', 'flux', 'magic']:
            models.append({
                'id': f"subnp-{m}", 'name': f"SubNP ({m})",
                'provider': 'SubNP', 'requires_key': False, 'key_configured': True,
            })

    return jsonify({'models': models}), 200


def generate_pollinations_image(prompt, params):
    detailed = build_dress_prompt(prompt, params)
    try:
        url = f"{POLLINATIONS_BASE}/{requests.utils.quote(detailed)}"
        resp = requests.get(url, timeout=60)
        if resp.status_code == 200 and len(resp.content) > 1000:
            b64 = base64.b64encode(resp.content).decode('utf-8')
            return f"data:image/jpeg;base64,{b64}", None
        return None, f"Pollinations returned {resp.status_code}"
    except Exception as e:
        return None, f'Pollinations failed: {str(e)}'


def generate_enhanced_image(prompt, params):
    api_key = current_app.config.get('GOOGLE_API_KEY')
    if not api_key:
        return generate_pollinations_image(prompt, params)

    enhanced = enhance_prompt_with_gemini(prompt, params)
    final_prompt = enhanced if enhanced else build_dress_prompt(prompt, params)

    try:
        url = f"{POLLINATIONS_BASE}/{requests.utils.quote(final_prompt)}"
        resp = requests.get(url, timeout=60)
        if resp.status_code == 200 and len(resp.content) > 1000:
            b64 = base64.b64encode(resp.content).decode('utf-8')
            return f"data:image/jpeg;base64,{b64}", None
        return None, f"Generation returned {resp.status_code}"
    except Exception as e:
        return None, f'Generation failed: {str(e)}'


def generate_subnp_image(prompt, params, subnp_model='turbo'):
    subnp_prompt = build_dress_prompt(prompt, params)
    try:
        resp = requests.post(
            f"{SUBNP_BASE_URL}/api/free/generate",
            json={'prompt': subnp_prompt, 'model': subnp_model},
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
            return f"data:image/png;base64,{base64.b64encode(img_resp.content).decode('utf-8')}", None
        return image_url, None

    except requests.exceptions.Timeout:
        return None, 'SubNP request timed out.'
    except requests.exceptions.ConnectionError:
        return None, 'Could not reach SubNP API.'
    except Exception as e:
        return None, f'SubNP generation failed: {str(e)}'


@ai_bp.route('/generate-image', methods=['POST'])
@jwt_required()
def generate_image():
    try:
        data = request.get_json()
        if not data or not data.get('prompt'):
            return jsonify({'error': 'Missing prompt'}), 400

        prompt = data.get('prompt', '')
        params = data.get('params', {})
        model = data.get('model', 'pollinations')

        if model == 'gemini-enhanced':
            image_url, error = generate_enhanced_image(prompt, params)
        elif model.startswith('subnp-'):
            image_url, error = generate_subnp_image(prompt, params, model.split('-', 1)[1])
        else:
            image_url, error = generate_pollinations_image(prompt, params)

        if error:
            return jsonify({'error': error}), 500

        return jsonify({
            'success': True, 'image': image_url,
            'prompt': prompt, 'model': model,
            'message': 'Image generated successfully',
        }), 200

    except Exception as e:
        import traceback
        print(f"Image generation error: {traceback.format_exc()}")
        return jsonify({'error': f'Image generation failed: {str(e)}'}), 500
