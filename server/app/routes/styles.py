"""
Saved styles routes: CRUD per user.
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import SavedStyle

styles_bp = Blueprint('styles', __name__, url_prefix='/api/styles')


@styles_bp.route('', methods=['GET'])
@jwt_required()
def list_styles():
    account_id = get_jwt_identity()
    styles = SavedStyle.query.filter_by(account_id=account_id).order_by(SavedStyle.created_at.desc()).all()
    return jsonify({'styles': [s.to_dict() for s in styles]}), 200


@styles_bp.route('', methods=['POST'])
@jwt_required()
def create_style():
    account_id = get_jwt_identity()
    data = request.get_json()
    if not data or not data.get('name'):
        return jsonify({'error': 'Name is required'}), 400

    style = SavedStyle(
        account_id=account_id,
        name=data['name'],
        color=data.get('color', '#EC4899'),
        pattern=data.get('pattern', 'solid'),
        sleeve_length=float(data.get('sleeve_length', 70)),
        neckline=data.get('neckline', 'v-neck'),
        train_length=float(data.get('train_length', 50)),
        texture=data.get('texture', 'satin'),
        texture_intensity=float(data.get('texture_intensity', 40)),
        skirt_volume=float(data.get('skirt_volume', 60)),
    )
    db.session.add(style)
    db.session.commit()
    return jsonify({'style': style.to_dict(), 'message': 'Style saved'}), 201


@styles_bp.route('/<style_id>', methods=['DELETE'])
@jwt_required()
def delete_style(style_id):
    account_id = get_jwt_identity()
    style = SavedStyle.query.filter_by(id=style_id, account_id=account_id).first()
    if not style:
        return jsonify({'error': 'Style not found'}), 404
    db.session.delete(style)
    db.session.commit()
    return jsonify({'message': 'Style deleted'}), 200
