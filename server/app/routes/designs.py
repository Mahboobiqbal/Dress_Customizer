"""
Design routes: CRUD operations for dress designs.
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Design
import base64
import mimetypes
import os
from huggingface_hub import InferenceClient
from PIL import Image
import io

designs_bp = Blueprint('designs', __name__)


@designs_bp.route('/generate-image', methods=['POST'])
@jwt_required()
def generate_image():
    """Generate an image using Google Generative AI (Gemini)."""
    try:
        data = request.get_json()
        prompt = data.get('prompt')

        if not prompt:
            return jsonify({'error': 'Prompt is required'}), 400

        # Get API key from environment
        import google.generativeai as genai
        api_key = os.environ.get("GOOGLE_API_KEY")
        if not api_key:
            return jsonify({'error': 'GOOGLE_API_KEY not configured'}), 500

        genai.configure(api_key=api_key)
        
        # User requested the latest gemini model (flash) for image generation
        # Note: Gemini's general text/multimodal models (like flash) don't output images.
        # Image output from Google's API strictly requires Imagen models.
        # But per user request we'll use imagen-3.0-generate-001 which is the Google AI 
        # standard for image generation in this SDK.
        imagen = genai.ImageGenerationModel("imagen-3.0-generate-001")
        
        result = imagen.generate_images(
            prompt=f"A fashion illustration of an elegant dress, {prompt}. Highly detailed, haute couture.",
            number_of_images=1,
            aspect_ratio="3:4"
        )

        image = result.images[0]._pil_image
        
        # Convert PIL.Image to base64 data URL
        buffer = io.BytesIO()
        image.save(buffer, format="PNG")
        buffer.seek(0)
        image_data = buffer.getvalue()
        encoded = base64.b64encode(image_data).decode('utf-8')
        data_url = f"data:image/png;base64,{encoded}"

        return jsonify({
            'image_urls': [data_url],
            'prompt': prompt
        }), 200

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@designs_bp.route('/modify-image', methods=['POST'])
@jwt_required()
def modify_image():
    """Modify an image function (Coming soon)"""
    return jsonify({
        'error': 'This modification functionality is coming soon. Please use generate image.',
        'coming_soon': True
    }), 501


@designs_bp.route('', methods=['GET'])
@jwt_required()
def get_designs():
    """Get all designs for the current user."""
    try:
        user_id = get_jwt_identity()
        designs = Design.query.filter_by(user_id=user_id).order_by(Design.created_at.desc()).all()

        return jsonify({
            'designs': [d.to_dict() for d in designs]
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@designs_bp.route('/<design_id>', methods=['GET'])
@jwt_required()
def get_design(design_id):
    """Get a specific design."""
    try:
        user_id = get_jwt_identity()
        design = Design.query.filter_by(id=design_id, user_id=user_id).first()

        if not design:
            return jsonify({'error': 'Design not found'}), 404

        return jsonify(design.to_dict()), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@designs_bp.route('', methods=['POST'])
@jwt_required()
def create_design():
    """Create a new design."""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()

        if not data or not data.get('name'):
            return jsonify({'error': 'Missing required fields'}), 400

        design = Design(
            user_id=user_id,
            name=data.get('name'),
            prompt=data.get('prompt'),
            color=data.get('color', '#EC4899'),
            pattern=data.get('pattern', 'solid'),
            sleeve_length=float(data.get('sleeve_length', 70)),
            neckline=data.get('neckline', 'v-neck'),
            train_length=float(data.get('train_length', 50)),
            texture=data.get('texture', 'satin'),
            texture_intensity=float(data.get('texture_intensity', 40)),
            skirt_volume=float(data.get('skirt_volume', 60)),
            svg=data.get('svg'),
            thumbnail=data.get('thumbnail')
        )

        db.session.add(design)
        db.session.commit()

        return jsonify({
            'message': 'Design created successfully',
            'design': design.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@designs_bp.route('/<design_id>', methods=['PUT'])
@jwt_required()
def update_design(design_id):
    """Update an existing design."""
    return jsonify({
        'error': 'This modification functionality is coming soon.',
        'coming_soon': True
    }), 501


@designs_bp.route('/<design_id>', methods=['DELETE'])
@jwt_required()
def delete_design(design_id):
    """Delete a design."""
    try:
        user_id = get_jwt_identity()
        design = Design.query.filter_by(id=design_id, user_id=user_id).first()

        if not design:
            return jsonify({'error': 'Design not found'}), 404

        db.session.delete(design)
        db.session.commit()

        return jsonify({'message': 'Design deleted successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
