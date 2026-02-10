"""
ZenTrack Backend - Database Models
SQLAlchemy models for User, ChatHistory, Therapy, and MusicTherapy
"""

from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class User(db.Model):
    """User model for authentication and profile management"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(256), nullable=False)
    name = db.Column(db.String(100))
    is_admin = db.Column(db.Boolean, default=False)
    
    # Assessment data
    has_completed_assessment = db.Column(db.Boolean, default=False)
    last_anxiety_score = db.Column(db.Integer)
    total_assessments = db.Column(db.Integer, default=0)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    last_assessment_date = db.Column(db.DateTime)
    
    # Relationships
    chat_history = db.relationship('ChatHistory', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def set_password(self, password):
        """Hash and set password"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Verify password"""
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        """Convert user to dictionary"""
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'is_admin': self.is_admin,
            'has_completed_assessment': self.has_completed_assessment,
            'last_anxiety_score': self.last_anxiety_score,
            'total_assessments': self.total_assessments,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'last_assessment_date': self.last_assessment_date.isoformat() if self.last_assessment_date else None
        }


class ChatHistory(db.Model):
    """Chat conversation history with AI assistant"""
    __tablename__ = 'chat_history'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    user_message = db.Column(db.Text, nullable=False)
    bot_response = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    def to_dict(self):
        """Convert chat to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user_message': self.user_message,
            'bot_response': self.bot_response,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }


class Therapy(db.Model):
    """Therapy techniques and exercises"""
    __tablename__ = 'therapies'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(50))  # breathing, meditation, exercise, etc.
    duration_minutes = db.Column(db.Integer)
    difficulty_level = db.Column(db.String(20))  # beginner, intermediate, advanced
    benefits = db.Column(db.Text)
    instructions = db.Column(db.Text)
    image_url = db.Column(db.String(500))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        """Convert therapy to dictionary"""
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'category': self.category,
            'duration_minutes': self.duration_minutes,
            'difficulty_level': self.difficulty_level,
            'benefits': self.benefits,
            'instructions': self.instructions,
            'image_url': self.image_url,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class MusicTherapy(db.Model):
    """Music therapy tracks and playlists"""
    __tablename__ = 'music_therapy'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    artist = db.Column(db.String(100))
    description = db.Column(db.Text)
    category = db.Column(db.String(50))  # meditation, sleep, focus, relaxation
    duration_seconds = db.Column(db.Integer)
    audio_url = db.Column(db.String(500), nullable=False)
    thumbnail_url = db.Column(db.String(500))
    mood = db.Column(db.String(50))  # calm, peaceful, energizing, etc.
    is_active = db.Column(db.Boolean, default=True)
    play_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        """Convert music therapy to dictionary"""
        return {
            'id': self.id,
            'title': self.title,
            'artist': self.artist,
            'description': self.description,
            'category': self.category,
            'duration_seconds': self.duration_seconds,
            'audio_url': self.audio_url,
            'thumbnail_url': self.thumbnail_url,
            'mood': self.mood,
            'is_active': self.is_active,
            'play_count': self.play_count,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class StressSession(db.Model):
    """Stress detection sessions with ML predictions"""
    __tablename__ = 'stress_sessions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    stress_level = db.Column(db.String(20), nullable=False)  # Low, Moderate, High
    confidence = db.Column(db.Float)  # ML model confidence (0-1)
    model_version = db.Column(db.String(50))  # random_forest or svm
    anxiety_score = db.Column(db.Integer)  # Assessment score
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    hrv_data = db.relationship('HRVData', backref='session', uselist=False, cascade='all, delete-orphan')
    stress_features = db.relationship('StressFeatures', backref='session', uselist=False, cascade='all, delete-orphan')
    
    def to_dict(self):
        """Convert session to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'stress_level': self.stress_level,
            'confidence': self.confidence,
            'model_version': self.model_version,
            'anxiety_score': self.anxiety_score,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class HRVData(db.Model):
    """Heart Rate Variability data storage"""
    __tablename__ = 'hrv_data'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    session_id = db.Column(db.Integer, db.ForeignKey('stress_sessions.id'), unique=True)
    raw_data_path = db.Column(db.String(255))  # Path to uploaded file
    rr_intervals = db.Column(db.Text)  # JSON string of RR intervals
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        """Convert HRV data to dictionary"""
        import json
        return {
            'id': self.id,
            'user_id': self.user_id,
            'session_id': self.session_id,
            'raw_data_path': self.raw_data_path,
            'rr_intervals': json.loads(self.rr_intervals) if self.rr_intervals else [],
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }


class StressFeatures(db.Model):
    """Extracted HRV features for stress detection"""
    __tablename__ = 'stress_features'
    
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('stress_sessions.id'), unique=True, nullable=False)
    mean_hr = db.Column(db.Float)  # Mean heart rate (BPM)
    sdnn = db.Column(db.Float)  # Standard deviation of NN intervals
    rmssd = db.Column(db.Float)  # Root mean square of successive differences
    lf_hf_ratio = db.Column(db.Float)  # Low frequency / High frequency ratio
    other_features = db.Column(db.Text)  # JSON for additional features
    
    def to_dict(self):
        """Convert features to dictionary"""
        import json
        return {
            'id': self.id,
            'session_id': self.session_id,
            'mean_hr': self.mean_hr,
            'sdnn': self.sdnn,
            'rmssd': self.rmssd,
            'lf_hf_ratio': self.lf_hf_ratio,
            'other_features': json.loads(self.other_features) if self.other_features else {}
        }


class SecurityLog(db.Model):
    """Security and activity logs"""
    __tablename__ = 'security_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    action = db.Column(db.String(100), nullable=False)  # login, logout, assessment, etc.
    status = db.Column(db.String(20), nullable=False)  # Success, Failure
    ip_address = db.Column(db.String(50))
    user_agent = db.Column(db.String(255))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    def to_dict(self):
        """Convert log to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'action': self.action,
            'status': self.status,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }
