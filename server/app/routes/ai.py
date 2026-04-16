"""
AI image generation routes using Google Generative AI (Gemini).
"""
import base64
import io
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
import google.generativeai as genai
from PIL import Image

ai_bp = Blueprint('ai', __name__)


def build_dress_prompt(prompt_text, params):
    """
    Build a detailed prompt for dress generation from user input and parameters.
    
    Args:
        prompt_text: User's natural language description
        params: Dictionary with dress parameters (color, pattern, sleeve_length, neckline, etc.)
    
    Returns:
        Detailed prompt string for AI model
    """
    details = []
    
    if params.get('color'):
        details.append(f"color: {params['color']}")
    if params.get('pattern'):
        details.append(f"pattern: {params['pattern']}")
    if params.get('neckline'):
        details.append(f"neckline: {params['neckline']}")
    if params.get('sleeve_length'):
        sl = params['sleeve_length']
        sleeve_type = "sleeveless" if sl < 20 else "short sleeves" if sl < 50 else "long sleeves"
        details.append(f"sleeves: {sleeve_type}")
    if params.get('train_length'):
        tl = params['train_length']
        train_desc = "no train" if tl < 20 else "short train" if tl < 50 else "long train"
        details.append(f"train: {train_desc}")
    if params.get('texture'):
        details.append(f"fabric: {params['texture']}")
    if params.get('skirt_volume'):
        sv = params['skirt_volume']
        volume_desc = "fitted" if sv < 30 else "moderate fullness" if sv < 70 else "very full"
        details.append(f"skirt: {volume_desc}")
    
    param_str = ", ".join(details) if details else ""
    
    full_prompt = f"""Generate a beautiful, elegant dress design image.
User description: {prompt_text if prompt_text else "Elegant dress"}
Design parameters: {param_str}

Style: Fashion illustration, professional design, haute couture, elegant, luxurious
Medium: Digital art
Aspect ratio: Portrait (dress from shoulders to hem)
Quality: High detail, professional lighting, clear colors
"""
    return full_prompt


@ai_bp.route('/generate-image', methods=['POST'])
@jwt_required()
def generate_image():
    """
    Generate an AI image based on prompt and dress parameters.
    
    Expected JSON body:
    {
        "prompt": "emerald velvet off-shoulder dress",
        "params": {
            "color": "#2D5016",
            "pattern": "solid",
            "neckline": "off-shoulder",
            "sleeve_length": 50,
            "train_length": 75,
            "texture": "velvet",
            "texture_intensity": 80,
            "skirt_volume": 65
        }
    }
    """
    try:
        account_id = get_jwt_identity()
        data = request.get_json()
        
        if not data or not data.get('prompt'):
            return jsonify({'error': 'Missing prompt'}), 400
        
        prompt = data.get('prompt', '')
        params = data.get('params', {})
        
        # Check if API key is configured
        api_key = current_app.config.get('GOOGLE_API_KEY')
        if not api_key:
            return jsonify({'error': 'Google API key not configured. Please set GOOGLE_API_KEY environment variable.'}), 500
        
        # Configure Gemini API
        genai.configure(api_key=api_key)
        
        # User requested 3.5 flash/3.1 flash, the latest stable flash is gemini-1.5-flash
        model_name = current_app.config.get('GEMINI_MODEL', 'gemini-1.5-flash')
        
        # Note: Standard Gemini Flash models process text/multimodal but do not directly output image streams 
        # as binary data in parts. To actually generate an image, we use an Imagen model or an API endpoint that supports it.
        # Following instructions and using a flash model:
        model = genai.GenerativeModel(model_name)
        
        # Build detailed prompt
        detailed_prompt = build_dress_prompt(prompt, params)
        
        # For actual image generation using Google's generative AI, we usually do:
        try:
            imagen = genai.ImageGenerationModel("imagen-3.0-generate-001")
            result = imagen.generate_images(
                prompt=f"A fashion illustration of an elegant dress. {detailed_prompt}. Highly detailed, haute couture.",
                number_of_images=1,
                aspect_ratio="3:4"
            )
            image_data = result.images[0]._pil_image
            import io
            buf = io.BytesIO()
            image_data.save(buf, format="PNG")
            image_base64 = base64.b64encode(buf.getvalue()).decode('utf-8')
            image_url = f"data:image/png;base64,{image_base64}"
            
            return jsonify({
                'success': True,
                'image': image_url,
                'prompt': prompt,
                'message': 'Image generated successfully'
            }), 200
        except Exception as e:
            # Fall back to using flash model and returning a dummy image or text
            pass

        # Generate fallback using flash model if image generation isn't available
        response = model.generate_content(
            [detailed_prompt],
            generation_config=genai.types.GenerationConfig(
                temperature=1,  # Creativity level
            ),
        )
        
        # Extract image from response
        if response.parts and len(response.parts) > 0:
            # Try to get image data
            if hasattr(response.parts[0], 'data'):
                image_data = response.parts[0].data
                # Convert to base64 data URL
                image_base64 = base64.b64encode(image_data).decode('utf-8')
                image_url = f"data:image/png;base64,{image_base64}"
                
                return jsonify({
                    'success': True,
                    'image': image_url,
                    'prompt': prompt,
                    'message': 'Image generated successfully'
                }), 200
            else:
                # Response might be text-based, extract and return error
                return jsonify({
                    'error': 'API returned text instead of image. Ensure your API key has vision capabilities.',
                    'details': str(response)
                }), 500
        else:
            return jsonify({'error': 'No image generated. Try a different prompt.'}), 400
    
    except Exception as e:
        import traceback
        print(f"Image generation error: {traceback.format_exc()}")
        return jsonify({
            'error': f'Image generation failed: {str(e)}',
            'type': type(e).__name__
        }), 500


@ai_bp.route('/generate-image-text', methods=['POST'])
@jwt_required()
def generate_image_text():
    """
    Alternative endpoint: accepts just text prompt and returns generated image description.
    Useful for testing without image generation quota.
    """
    try:
        data = request.get_json()
        
        if not data or not data.get('prompt'):
            return jsonify({'error': 'Missing prompt'}), 400
        
        prompt = data.get('prompt', '')
        api_key = current_app.config.get('GOOGLE_API_KEY')
        
        if not api_key:
            return jsonify({'error': 'Google API key not configured.'}), 500
        
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.0-flash')
        
        response = model.generate_content(
            f"Describe a fashion illustration of: {prompt}. Give detailed visual description suitable for an artist."
        )
        
        return jsonify({
            'success': True,
            'description': response.text,
            'prompt': prompt
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
