"""
Conversation routes: list, get, delete chat history.
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Conversation

conversations_bp = Blueprint('conversations', __name__, url_prefix='/api/conversations')


@conversations_bp.route('', methods=['GET'])
@jwt_required()
def list_conversations():
    account_id = get_jwt_identity()
    convs = Conversation.query.filter_by(account_id=account_id).order_by(Conversation.updated_at.desc()).all()
    return jsonify({'conversations': [c.to_dict() for c in convs]}), 200


@conversations_bp.route('/<conv_id>', methods=['GET'])
@jwt_required()
def get_conversation(conv_id):
    account_id = get_jwt_identity()
    conv = Conversation.query.filter_by(id=conv_id, account_id=account_id).first()
    if not conv:
        return jsonify({'error': 'Conversation not found'}), 404
    return jsonify(conv.to_dict(include_messages=True)), 200


@conversations_bp.route('/<conv_id>', methods=['DELETE'])
@jwt_required()
def delete_conversation(conv_id):
    account_id = get_jwt_identity()
    conv = Conversation.query.filter_by(id=conv_id, account_id=account_id).first()
    if not conv:
        return jsonify({'error': 'Conversation not found'}), 404
    db.session.delete(conv)
    db.session.commit()
    return jsonify({'message': 'Conversation deleted'}), 200
