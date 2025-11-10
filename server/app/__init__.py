"""
Flask application factory and configuration.
"""
from flask import Flask, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
import os
from datetime import timedelta

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()


def create_app(config_name='development'):
    """
    Application factory function.
    
    Args:
        config_name: Environment configuration ('development', 'production', 'testing')
    
    Returns:
        Flask application instance
    """
    app = Flask(__name__)
    
    # Load configuration from environment
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv(
        'DATABASE_URL',
        'postgresql://postgres:password@localhost:5432/dress_customizer'
    )
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=30)
    app.config['GOOGLE_API_KEY'] = os.getenv('GOOGLE_API_KEY', '')  # Set via environment variable
    
    # Enable CORS with proper configuration
    cors_config = {
        "origins": ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000", "http://localhost:5000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True,
        "max_age": 3600
    }
    CORS(app, resources={r"/api/*": cors_config})
    
    # Initialize extensions with app
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    
    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.accounts import accounts_bp
    from app.routes.profiles import profiles_bp
    from app.routes.gown_designs import gown_designs_bp
    from app.routes.body_profiles import body_profiles_bp
    from app.routes.designs import designs_bp
    from app.routes.ai import ai_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(accounts_bp, url_prefix='/api/accounts')
    app.register_blueprint(profiles_bp)  # URL prefix already defined in blueprint
    app.register_blueprint(gown_designs_bp, url_prefix='/api/gown-designs')
    app.register_blueprint(body_profiles_bp, url_prefix='/api/body-profiles')
    app.register_blueprint(designs_bp, url_prefix='/api/designs')
    app.register_blueprint(ai_bp, url_prefix='/api/ai')
    
    # Health check endpoint
    @app.route('/api/health', methods=['GET'])
    def health():
        return {'status': 'ok'}, 200
    
    return app
