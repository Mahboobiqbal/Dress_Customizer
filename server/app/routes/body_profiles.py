"""
Body profile routes: get and update body measurements.
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import BodyProfile

body_profiles_bp = Blueprint('body_profiles', __name__)


@body_profiles_bp.route('', methods=['GET'])
@jwt_required()
def get_body_profile():
    """Get account's body profile measurements."""
    try:
        account_id = get_jwt_identity()
        profile = BodyProfile.query.filter_by(account_id=account_id).first()

        if not profile:
            # Return default body profile if not found
            return jsonify({
                'height': 100,
                'width': 100,
                'build': 0,
                'head': 100,
                'gender': None,
                'age': None,
                'weight': None,
                'chest': None,
                'waist': None,
                'hips': None,
                'shoulder_width': None,
                'arm_length': None,
                'inseam': None,
                'thigh': None,
                'neck': None,
                'calf': None,
                'wrist': None,
                'patterns': [],
                'necklines': [],
                'sleeves': [],
                'top_styles': [],
                'fabric_textures': [],
                'fabric_types': {},
                'measurement_unit': 'cm'
            }), 200

        return jsonify(profile.to_dict()), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@body_profiles_bp.route('', methods=['POST'])
@jwt_required()
def create_or_update_body_profile():
    """Create or update body profile measurements."""
    try:
        account_id = get_jwt_identity()
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Try to get existing body profile
        profile = BodyProfile.query.filter_by(account_id=account_id).first()
        
        import json

        if profile:
            # Update existing
            profile.height = float(data.get('height', profile.height))
            profile.width = float(data.get('width', profile.width))
            profile.build = float(data.get('build', profile.build))
            profile.head = float(data.get('head', profile.head))
            profile.gender = data.get('gender', profile.gender)
            profile.age = int(data.get('age')) if data.get('age') is not None else profile.age
            profile.weight = float(data.get('weight')) if data.get('weight') is not None else profile.weight
            profile.chest = float(data.get('chest')) if data.get('chest') is not None else profile.chest
            profile.waist = float(data.get('waist')) if data.get('waist') is not None else profile.waist
            profile.hips = float(data.get('hips')) if data.get('hips') is not None else profile.hips
            profile.shoulder_width = float(data.get('shoulder_width')) if data.get('shoulder_width') is not None else profile.shoulder_width
            profile.arm_length = float(data.get('arm_length')) if data.get('arm_length') is not None else profile.arm_length
            profile.inseam = float(data.get('inseam')) if data.get('inseam') is not None else profile.inseam
            profile.thigh = float(data.get('thigh')) if data.get('thigh') is not None else profile.thigh
            profile.neck = float(data.get('neck')) if data.get('neck') is not None else profile.neck
            profile.calf = float(data.get('calf')) if data.get('calf') is not None else profile.calf
            profile.wrist = float(data.get('wrist')) if data.get('wrist') is not None else profile.wrist
            profile.patterns = json.dumps(data.get('patterns', [])) if data.get('patterns') is not None else profile.patterns
            profile.necklines = json.dumps(data.get('necklines', [])) if data.get('necklines') is not None else profile.necklines
            profile.sleeves = json.dumps(data.get('sleeves', [])) if data.get('sleeves') is not None else profile.sleeves
            profile.top_styles = json.dumps(data.get('top_styles', [])) if data.get('top_styles') is not None else profile.top_styles
            profile.fabric_textures = json.dumps(data.get('fabric_textures', [])) if data.get('fabric_textures') is not None else profile.fabric_textures
            profile.fabric_types = json.dumps(data.get('fabric_types', {})) if data.get('fabric_types') is not None else profile.fabric_types
            profile.measurement_unit = data.get('measurement_unit', profile.measurement_unit)
            message = 'Body profile updated successfully'
        else:
            # Create new
            profile = BodyProfile(
                account_id=account_id,
                height=float(data.get('height', 100)),
                width=float(data.get('width', 100)),
                build=float(data.get('build', 0)),
                head=float(data.get('head', 100)),
                gender=data.get('gender'),
                age=int(data.get('age')) if data.get('age') is not None else None,
                weight=float(data.get('weight')) if data.get('weight') is not None else None,
                chest=float(data.get('chest')) if data.get('chest') is not None else None,
                waist=float(data.get('waist')) if data.get('waist') is not None else None,
                hips=float(data.get('hips')) if data.get('hips') is not None else None,
                shoulder_width=float(data.get('shoulder_width')) if data.get('shoulder_width') is not None else None,
                arm_length=float(data.get('arm_length')) if data.get('arm_length') is not None else None,
                inseam=float(data.get('inseam')) if data.get('inseam') is not None else None,
                thigh=float(data.get('thigh')) if data.get('thigh') is not None else None,
                neck=float(data.get('neck')) if data.get('neck') is not None else None,
                calf=float(data.get('calf')) if data.get('calf') is not None else None,
                wrist=float(data.get('wrist')) if data.get('wrist') is not None else None,
                patterns=json.dumps(data.get('patterns', [])),
                necklines=json.dumps(data.get('necklines', [])),
                sleeves=json.dumps(data.get('sleeves', [])),
                top_styles=json.dumps(data.get('top_styles', [])),
                fabric_textures=json.dumps(data.get('fabric_textures', [])),
                fabric_types=json.dumps(data.get('fabric_types', {})),
                measurement_unit=data.get('measurement_unit', 'cm')
            )
            db.session.add(profile)
            message = 'Body profile created successfully'
        
        db.session.commit()
        
        return jsonify({
            'message': message,
            'profile': profile.to_dict()
        }), 200 if profile.id else 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
