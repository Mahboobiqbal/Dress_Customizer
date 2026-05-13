"""
Database models for Dress Customizer application.
"""
from datetime import datetime
from app import db
import uuid


class Account(db.Model):
    """Account model for authentication and profile management."""
    __tablename__ = 'accounts'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(120), nullable=True)
    last_name = db.Column(db.String(120), nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    account_type = db.Column(db.String(50), nullable=False, default='individual')  # individual, business, student
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    body_profile = db.relationship('BodyProfile', backref='account', uselist=False, cascade='all, delete-orphan')
    gown_designs = db.relationship('GownDesign', backref='account', cascade='all, delete-orphan')
    conversations = db.relationship('Conversation', backref='account', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Account {self.email}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'phone': self.phone,
            'account_type': self.account_type,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }


class BodyProfile(db.Model):
    """BodyProfile model for body measurements and customization."""
    __tablename__ = 'body_profiles'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    account_id = db.Column(db.String(36), db.ForeignKey('accounts.id'), nullable=False, unique=True)
    height = db.Column(db.Float, nullable=False, default=100)
    width = db.Column(db.Float, nullable=False, default=100)
    build = db.Column(db.Float, nullable=False, default=0)
    head = db.Column(db.Float, nullable=False, default=100)
    measurement_unit = db.Column(db.String(20), nullable=False, default='cm')  # 'cm' or 'inches'
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'account_id': self.account_id,
            'height': self.height,
            'width': self.width,
            'build': self.build,
            'head': self.head,
            'measurement_unit': self.measurement_unit,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }


class GownDesign(db.Model):
    """GownDesign model for storing dress design variants."""
    __tablename__ = 'gown_designs'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    account_id = db.Column(db.String(36), db.ForeignKey('accounts.id'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    prompt = db.Column(db.Text, nullable=True)
    
    # Design parameters
    color = db.Column(db.String(7), nullable=False, default='#EC4899')
    pattern = db.Column(db.String(50), nullable=False, default='solid')
    sleeve_length = db.Column(db.Float, nullable=False, default=70)
    neckline = db.Column(db.String(50), nullable=False, default='v-neck')
    train_length = db.Column(db.Float, nullable=False, default=50)
    texture = db.Column(db.String(50), nullable=False, default='satin')
    texture_intensity = db.Column(db.Float, nullable=False, default=40)
    skirt_volume = db.Column(db.Float, nullable=False, default=60)
    
    # SVG data
    svg = db.Column(db.Text, nullable=True)
    thumbnail = db.Column(db.LargeBinary, nullable=True)
    image_url = db.Column(db.String(512), nullable=True)
    
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self, include_large_fields=False):
        import base64
        result = {
            'id': self.id,
            'account_id': self.account_id,
            'name': self.name,
            'prompt': self.prompt,
            'color': self.color,
            'pattern': self.pattern,
            'sleeve_length': self.sleeve_length,
            'neckline': self.neckline,
            'train_length': self.train_length,
            'texture': self.texture,
            'texture_intensity': self.texture_intensity,
            'skirt_volume': self.skirt_volume,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
        
        result['image_url'] = self.image_url

        # Include large fields if requested (e.g., for detail views)
        if include_large_fields:
            result['svg'] = self.svg
            # Convert binary thumbnail to base64 for JSON
            if self.thumbnail:
                result['thumbnail'] = f"data:image/png;base64,{base64.b64encode(self.thumbnail).decode('utf-8')}"
            else:
                result['thumbnail'] = None
        
        return result


class Conversation(db.Model):
    """Conversation model for chat/discussion history."""
    __tablename__ = 'conversations'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    account_id = db.Column(db.String(36), db.ForeignKey('accounts.id'), nullable=False)
    title = db.Column(db.String(255), nullable=True)
    messages = db.relationship('ChatMessage', backref='conversation', cascade='all, delete-orphan')
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self, include_messages=False):
        result = {
            'id': self.id,
            'account_id': self.account_id,
            'title': self.title,
            'message_count': len(self.messages),
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
        if include_messages:
            result['messages'] = [m.to_dict() for m in self.messages]
        return result


class ChatMessage(db.Model):
    """ChatMessage model for storing conversation messages."""
    __tablename__ = 'chat_messages'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id = db.Column(db.String(36), db.ForeignKey('conversations.id'), nullable=False)
    sender_role = db.Column(db.String(20), nullable=False)  # 'user' or 'assistant'
    content = db.Column(db.Text, nullable=False)
    image_url = db.Column(db.String(512), nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'conversation_id': self.conversation_id,
            'sender_role': self.sender_role,
            'content': self.content,
            'image_url': self.image_url,
            'created_at': self.created_at.isoformat()
        }


class Design(db.Model):
    """Design model for storing AI-generated dress designs."""
    __tablename__ = 'designs'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('accounts.id'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    prompt = db.Column(db.Text, nullable=True)
    
    # Design parameters
    color = db.Column(db.String(7), nullable=False, default='#EC4899')
    pattern = db.Column(db.String(50), nullable=False, default='solid')
    sleeve_length = db.Column(db.Float, nullable=False, default=70)
    neckline = db.Column(db.String(50), nullable=False, default='v-neck')
    train_length = db.Column(db.Float, nullable=False, default=50)
    texture = db.Column(db.String(50), nullable=False, default='satin')
    texture_intensity = db.Column(db.Float, nullable=False, default=40)
    skirt_volume = db.Column(db.Float, nullable=False, default=60)
    
    # Image data
    svg = db.Column(db.Text, nullable=True)
    thumbnail = db.Column(db.LargeBinary, nullable=True)
    image_url = db.Column(db.String(512), nullable=True)
    
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'prompt': self.prompt,
            'color': self.color,
            'pattern': self.pattern,
            'sleeve_length': self.sleeve_length,
            'neckline': self.neckline,
            'train_length': self.train_length,
            'texture': self.texture,
            'texture_intensity': self.texture_intensity,
            'skirt_volume': self.skirt_volume,
            'image_url': self.image_url,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
