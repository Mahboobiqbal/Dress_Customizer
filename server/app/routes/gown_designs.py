"""
Gown design routes: CRUD operations for dress designs.
"""
import base64
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import GownDesign


def decode_base64_thumbnail(thumbnail_str):
    """Decode base64 thumbnail string to bytes."""
    if thumbnail_str and thumbnail_str.startswith('data:image/png;base64,'):
        return base64.b64decode(thumbnail_str.split(',')[1])
    return None

gown_designs_bp = Blueprint('gown_designs', __name__)


@gown_designs_bp.route('', methods=['GET'])
@jwt_required()
def get_designs():
    """Get all gown designs for the current account."""
    try:
        account_id = get_jwt_identity()
        designs = GownDesign.query.filter_by(account_id=account_id).order_by(GownDesign.created_at.desc()).all()
        
        return jsonify({
            'designs': [d.to_dict() for d in designs]
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@gown_designs_bp.route('/<design_id>', methods=['GET'])
@jwt_required()
def get_design(design_id):
    """Get a specific gown design."""
    try:
        account_id = get_jwt_identity()
        design = GownDesign.query.filter_by(id=design_id, account_id=account_id).first()
        
        if not design:
            return jsonify({'error': 'Design not found'}), 404
        
        # Include large fields (svg, thumbnail) for single design view
        return jsonify(design.to_dict(include_large_fields=True)), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@gown_designs_bp.route('', methods=['POST'])
@jwt_required()
def create_design():
    """Create a new gown design."""
    try:
        account_id = get_jwt_identity()
        data = request.get_json()
        
        if not data or not data.get('name'):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Decode thumbnail if it's a base64 data URL
        thumbnail_binary = None
        if data.get('thumbnail'):
            thumbnail_binary = decode_base64_thumbnail(data.get('thumbnail'))
        
        design = GownDesign(
            account_id=account_id,
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
            thumbnail=thumbnail_binary
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


@gown_designs_bp.route('/<design_id>', methods=['PUT'])
@jwt_required()
def update_design(design_id):
    """Update an existing gown design."""
    return jsonify({
        'error': 'This modification functionality is coming soon.',
        'coming_soon': True
    }), 501

@gown_designs_bp.route('/<design_id>', methods=['DELETE'])
@jwt_required()
def delete_design(design_id):
    """Delete a gown design."""
    try:
        account_id = get_jwt_identity()
        design = GownDesign.query.filter_by(id=design_id, account_id=account_id).first()
        
        if not design:
            return jsonify({'error': 'Design not found'}), 404
        
        db.session.delete(design)
        db.session.commit()
        
        return jsonify({'message': 'Design deleted successfully'}), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
