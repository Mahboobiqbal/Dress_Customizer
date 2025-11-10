"""
Comprehensive profile management routes:
- GET: Retrieve user profile and body measurements
- PUT/PATCH: Update profile data
- DELETE: Delete profile
- GET all: List profiles (admin only)

NOTE: Route order matters in Flask - more specific routes (/me/body) 
must come BEFORE generic routes (/<account_id>)
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Account, BodyProfile
from datetime import datetime

profiles_bp = Blueprint('profiles', __name__, url_prefix='/api/profiles')


# ============================================
# GET Routes
# ============================================



@profiles_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_profile():
    """
    Get current user's complete profile.
    Returns: Account info + BodyProfile measurements
    """
    try:
        account_id = get_jwt_identity()
        account = Account.query.get(account_id)
        
        if not account:
            return jsonify({
                'success': False,
                'error': 'Account not found'
            }), 404
        
        # Get or create body profile
        body_profile = BodyProfile.query.filter_by(account_id=account_id).first()
        
        response_data = {
            'success': True,
            'account': account.to_dict(),
            'body_profile': body_profile.to_dict() if body_profile else None
        }
        
        return jsonify(response_data), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# ============================================
# SPECIFIC /me/body Routes (MUST BE BEFORE /<account_id>)
# ============================================

@profiles_bp.route('/me/body', methods=['GET'])
@jwt_required()
def get_body_profile():
    """Get current user's body profile measurements."""
    try:
        account_id = get_jwt_identity()
        body_profile = BodyProfile.query.filter_by(account_id=account_id).first()
        
        if not body_profile:
            # Create default body profile if it doesn't exist
            body_profile = BodyProfile(account_id=account_id)
            db.session.add(body_profile)
            db.session.commit()
        
        return jsonify({
            'success': True,
            'body_profile': body_profile.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@profiles_bp.route('/me/body', methods=['PUT', 'PATCH'])
@jwt_required()
def update_body_profile():
    """Update current user's body profile measurements and unit."""
    try:
        account_id = get_jwt_identity()
        body_profile = BodyProfile.query.filter_by(account_id=account_id).first()
        
        if not body_profile:
            body_profile = BodyProfile(account_id=account_id)
            db.session.add(body_profile)
        
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        # Validate and update measurements
        if 'height' in data:
            try:
                body_profile.height = float(data['height'])
            except (ValueError, TypeError):
                return jsonify({
                    'success': False,
                    'error': 'height must be a number'
                }), 400
        
        if 'width' in data:
            try:
                body_profile.width = float(data['width'])
            except (ValueError, TypeError):
                return jsonify({
                    'success': False,
                    'error': 'width must be a number'
                }), 400
        
        if 'build' in data:
            try:
                body_profile.build = float(data['build'])
            except (ValueError, TypeError):
                return jsonify({
                    'success': False,
                    'error': 'build must be a number'
                }), 400
        
        if 'head' in data:
            try:
                body_profile.head = float(data['head'])
            except (ValueError, TypeError):
                return jsonify({
                    'success': False,
                    'error': 'head must be a number'
                }), 400
        
        # Update measurement unit (cm or inches)
        if 'measurement_unit' in data:
            valid_units = ['cm', 'inches']
            if data['measurement_unit'] not in valid_units:
                return jsonify({
                    'success': False,
                    'error': f'Invalid measurement_unit. Must be one of: {valid_units}'
                }), 400
            body_profile.measurement_unit = data['measurement_unit']
        
        body_profile.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Body profile updated successfully',
            'body_profile': body_profile.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@profiles_bp.route('/me/body', methods=['DELETE'])
@jwt_required()
def delete_body_profile():
    """Reset body profile to default values."""
    try:
        account_id = get_jwt_identity()
        body_profile = BodyProfile.query.filter_by(account_id=account_id).first()
        
        if not body_profile:
            return jsonify({
                'success': False,
                'error': 'Body profile not found'
            }), 404
        
        # Reset to defaults
        body_profile.height = 100
        body_profile.width = 100
        body_profile.build = 0
        body_profile.head = 100
        body_profile.measurement_unit = 'cm'
        body_profile.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Body profile reset to defaults',
            'body_profile': body_profile.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# ============================================
# Generic /<account_id> Routes (AFTER /me/body)
# ============================================

@profiles_bp.route('/<account_id>', methods=['GET'])
@jwt_required()
def get_profile(account_id):
    """
    Get a specific user's profile by ID.
    Only accessible to that user or admin.
    """
    try:
        current_user_id = get_jwt_identity()
        
        # Only allow users to view their own profile (no admin yet)
        if current_user_id != account_id:
            return jsonify({
                'success': False,
                'error': 'Unauthorized: You can only view your own profile'
            }), 403
        
        account = Account.query.get(account_id)
        
        if not account:
            return jsonify({
                'success': False,
                'error': 'Account not found'
            }), 404
        
        body_profile = BodyProfile.query.filter_by(account_id=account_id).first()
        
        response_data = {
            'success': True,
            'account': account.to_dict(),
            'body_profile': body_profile.to_dict() if body_profile else None
        }
        
        return jsonify(response_data), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# ============================================
# PUT/PATCH Routes (Update)
# ============================================

@profiles_bp.route('/me', methods=['PUT', 'PATCH'])
@jwt_required()
def update_current_profile():
    """
    Update current user's profile.
    Accepts: account data and body profile measurements with unit.
    """
    try:
        account_id = get_jwt_identity()
        account = Account.query.get(account_id)
        
        if not account:
            return jsonify({
                'success': False,
                'error': 'Account not found'
            }), 404
        
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        # Update account fields
        if 'first_name' in data:
            account.first_name = data['first_name'].strip()
        
        if 'last_name' in data:
            account.last_name = data['last_name'].strip()
        
        if 'phone' in data:
            account.phone = data['phone'].strip()
        
        if 'account_type' in data:
            valid_types = ['individual', 'business', 'student']
            if data['account_type'] not in valid_types:
                return jsonify({
                    'success': False,
                    'error': f'Invalid account_type. Must be one of: {valid_types}'
                }), 400
            account.account_type = data['account_type']
        
        account.updated_at = datetime.utcnow()
        
        # Update or create body profile
        body_profile = BodyProfile.query.filter_by(account_id=account_id).first()

        if 'body_profile' in data:
            body_data = data['body_profile']

            if not body_profile:
                body_profile = BodyProfile(account_id=account_id)
                db.session.add(body_profile)

            # Basic avatar proportions
            if 'height' in body_data:
                body_profile.height = float(body_data['height'])

            if 'width' in body_data:
                body_profile.width = float(body_data['width'])

            if 'build' in body_data:
                body_profile.build = float(body_data['build'])

            if 'head' in body_data:
                body_profile.head = float(body_data['head'])

            # Personal information
            if 'gender' in body_data:
                body_profile.gender = body_data['gender']

            if 'age' in body_data:
                body_profile.age = int(body_data['age']) if body_data['age'] else None

            if 'weight' in body_data:
                body_profile.weight = float(body_data['weight']) if body_data['weight'] else None

            # Body measurements
            if 'chest' in body_data:
                body_profile.chest = float(body_data['chest']) if body_data['chest'] else None

            if 'waist' in body_data:
                body_profile.waist = float(body_data['waist']) if body_data['waist'] else None

            if 'hips' in body_data:
                body_profile.hips = float(body_data['hips']) if body_data['hips'] else None

            if 'shoulder_width' in body_data:
                body_profile.shoulder_width = float(body_data['shoulder_width']) if body_data['shoulder_width'] else None

            if 'arm_length' in body_data:
                body_profile.arm_length = float(body_data['arm_length']) if body_data['arm_length'] else None

            if 'inseam' in body_data:
                body_profile.inseam = float(body_data['inseam']) if body_data['inseam'] else None

            if 'thigh' in body_data:
                body_profile.thigh = float(body_data['thigh']) if body_data['thigh'] else None

            if 'neck' in body_data:
                body_profile.neck = float(body_data['neck']) if body_data['neck'] else None

            if 'calf' in body_data:
                body_profile.calf = float(body_data['calf']) if body_data['calf'] else None

            if 'wrist' in body_data:
                body_profile.wrist = float(body_data['wrist']) if body_data['wrist'] else None

            # Preferences (JSON fields)
            import json
            if 'patterns' in body_data:
                body_profile.patterns = json.dumps(body_data['patterns']) if body_data['patterns'] else json.dumps([])

            if 'necklines' in body_data:
                body_profile.necklines = json.dumps(body_data['necklines']) if body_data['necklines'] else json.dumps([])

            if 'sleeves' in body_data:
                body_profile.sleeves = json.dumps(body_data['sleeves']) if body_data['sleeves'] else json.dumps([])

            if 'top_styles' in body_data:
                body_profile.top_styles = json.dumps(body_data['top_styles']) if body_data['top_styles'] else json.dumps([])

            if 'fabric_textures' in body_data:
                body_profile.fabric_textures = json.dumps(body_data['fabric_textures']) if body_data['fabric_textures'] else json.dumps([])

            if 'fabric_types' in body_data:
                body_profile.fabric_types = json.dumps(body_data['fabric_types']) if body_data['fabric_types'] else json.dumps({})

            # Measurement unit
            if 'measurement_unit' in body_data:
                valid_units = ['cm', 'inches']
                if body_data['measurement_unit'] not in valid_units:
                    return jsonify({
                        'success': False,
                        'error': f'Invalid measurement_unit. Must be one of: {valid_units}'
                    }), 400
                body_profile.measurement_unit = body_data['measurement_unit']

            body_profile.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        response_data = {
            'success': True,
            'message': 'Profile updated successfully',
            'account': account.to_dict(),
            'body_profile': body_profile.to_dict() if body_profile else None
        }
        
        return jsonify(response_data), 200
        
    except ValueError as ve:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Invalid data format: {str(ve)}'
        }), 400
    
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@profiles_bp.route('/<account_id>', methods=['PUT', 'PATCH'])
@jwt_required()
def update_profile(account_id):
    """
    Update a specific user's profile.
    Only accessible to that user.
    """
    try:
        current_user_id = get_jwt_identity()
        
        if current_user_id != account_id:
            return jsonify({
                'success': False,
                'error': 'Unauthorized: You can only update your own profile'
            }), 403
        
        account = Account.query.get(account_id)
        
        if not account:
            return jsonify({
                'success': False,
                'error': 'Account not found'
            }), 404
        
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        # Update account fields
        if 'first_name' in data:
            account.first_name = data['first_name'].strip()
        
        if 'last_name' in data:
            account.last_name = data['last_name'].strip()
        
        if 'phone' in data:
            account.phone = data['phone'].strip()
        
        if 'account_type' in data:
            valid_types = ['individual', 'business', 'student']
            if data['account_type'] not in valid_types:
                return jsonify({
                    'success': False,
                    'error': f'Invalid account_type. Must be one of: {valid_types}'
                }), 400
            account.account_type = data['account_type']
        
        account.updated_at = datetime.utcnow()
        
        # Update or create body profile
        body_profile = BodyProfile.query.filter_by(account_id=account_id).first()
        
        if 'body_profile' in data:
            body_data = data['body_profile']
            
            if not body_profile:
                body_profile = BodyProfile(account_id=account_id)
                db.session.add(body_profile)
            
            if 'height' in body_data:
                body_profile.height = float(body_data['height'])
            
            if 'width' in body_data:
                body_profile.width = float(body_data['width'])
            
            if 'build' in body_data:
                body_profile.build = float(body_data['build'])
            
            if 'head' in body_data:
                body_profile.head = float(body_data['head'])
            
            if 'measurement_unit' in body_data:
                valid_units = ['cm', 'inches']
                if body_data['measurement_unit'] not in valid_units:
                    return jsonify({
                        'success': False,
                        'error': f'Invalid measurement_unit. Must be one of: {valid_units}'
                    }), 400
                body_profile.measurement_unit = body_data['measurement_unit']
            
            body_profile.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        response_data = {
            'success': True,
            'message': 'Profile updated successfully',
            'account': account.to_dict(),
            'body_profile': body_profile.to_dict() if body_profile else None
        }
        
        return jsonify(response_data), 200
        
    except ValueError as ve:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Invalid data format: {str(ve)}'
        }), 400
    
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# ============================================
# DELETE Routes
# ============================================

@profiles_bp.route('/me', methods=['DELETE'])
@jwt_required()
def delete_current_profile():
    """
    Delete current user's profile and account.
    Cascades delete to all related data:
    - Body profiles
    - Gown designs
    - Conversations (and their messages)
    """
    try:
        account_id = get_jwt_identity()
        account = Account.query.get(account_id)
        
        if not account:
            return jsonify({
                'success': False,
                'error': 'Account not found'
            }), 404
        
        deleted_account_id = account.id
        deleted_account_email = account.email
        
        # Delete account (cascade deletes all related data)
        db.session.delete(account)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Profile and account deleted successfully',
            'deleted_account': {
                'id': deleted_account_id,
                'email': deleted_account_email
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@profiles_bp.route('/<account_id>', methods=['DELETE'])
@jwt_required()
def delete_profile(account_id):
    """
    Delete a specific user's profile.
    Only accessible to that user.
    """
    try:
        current_user_id = get_jwt_identity()
        
        if current_user_id != account_id:
            return jsonify({
                'success': False,
                'error': 'Unauthorized: You can only delete your own profile'
            }), 403
        
        account = Account.query.get(account_id)
        
        if not account:
            return jsonify({
                'success': False,
                'error': 'Account not found'
            }), 404
        
        deleted_account_id = account.id
        deleted_account_email = account.email
        
        # Delete account (cascade deletes all related data)
        db.session.delete(account)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Profile and account deleted successfully',
            'deleted_account': {
                'id': deleted_account_id,
                'email': deleted_account_email
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

