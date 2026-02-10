"""
ZenTrack Backend - Main Flask Application
Complete REST API with JWT authentication, AI chatbot, and admin panel
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager, create_access_token, jwt_required, 
    get_jwt_identity, get_jwt
)
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os

from models import db, User, ChatHistory, Therapy, MusicTherapy, StressSession, HRVData, StressFeatures, SecurityLog
from chatbot_service import ChatbotService
from stress_detector import StressDetector
from export_service import DataExporter
from logging_config import setup_logging, log_api_request, log_security_event, log_ml_prediction
from utils import rate_limiter, cache, rate_limit, validate_input, cleanup_caches

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__, 
            static_folder='../frontend',  # Serve frontend folder as static
            static_url_path='')

# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'zentrack_secret_key')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt_secret_key')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URI', 'sqlite:///zentrack.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)

# Initialize extensions
CORS(app, resources={r"/*": {"origins": "*"}})
db.init_app(app)
jwt = JWTManager(app)

# JWT Error Handlers
@jwt.invalid_token_loader
def invalid_token_callback(error):
    return jsonify({
        'success': False,
        'message': 'Signature verification failed.',
        'error': 'invalid_token',
        'details': str(error)
    }), 422

@jwt.unauthorized_loader
def missing_token_callback(error):
    return jsonify({
        'success': False,
        'message': 'Request does not contain an access token.',
        'error': 'authorization_required',
        'details': str(error)
    }), 401

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({
        'success': False,
        'message': 'The token has expired.',
        'error': 'token_expired'
    }), 401

# Initialize chatbot service with Groq
chatbot = ChatbotService(api_key=os.getenv('GROQ_API_KEY'))


# Initialize stress detector
stress_detector = StressDetector(model_type='random_forest')

# Initialize data exporter
data_exporter = DataExporter()

# Setup logging
app_logger, security_logger = setup_logging(app)

# ==================== Database Initialization ====================

def init_database():
    """Initialize database and create admin user"""
    with app.app_context():
        db.create_all()
        
        # Create admin user if not exists
        admin_email = os.getenv('ADMIN_EMAIL', 'kajal2001@gmail.com')
        admin = User.query.filter_by(email=admin_email).first()
        
        if not admin:
            admin = User(
                email=admin_email,
                name='Admin Kajal',
                is_admin=True
            )
            admin.set_password(os.getenv('ADMIN_PASSWORD', 'kajal@iloveyou'))
            db.session.add(admin)
            db.session.commit()
            print(f"✅ Admin user created: {admin_email}")
        else:
            print(f"✅ Admin user already exists: {admin_email}")
        
        # Create demo user if not exists
        demo_email = 'demo@zentrack.com'
        demo_user = User.query.filter_by(email=demo_email).first()
        
        if not demo_user:
            demo_user = User(
                email=demo_email,
                name='Demo User',
                is_admin=False
            )
            demo_user.set_password('demo123')
            db.session.add(demo_user)
            db.session.commit()
            print(f"✅ Demo user created: {demo_email}")
        else:
            print(f"✅ Demo user already exists: {demo_email}")
        
        # Add sample therapies if empty
        if Therapy.query.count() == 0:
            sample_therapies = [
                Therapy(
                    title="4-7-8 Breathing Technique",
                    description="A powerful breathing exercise to reduce anxiety and promote relaxation",
                    category="breathing",
                    duration_minutes=5,
                    difficulty_level="beginner",
                    benefits="Reduces anxiety, improves sleep, lowers blood pressure",
                    instructions="1. Inhale through nose for 4 seconds\n2. Hold breath for 7 seconds\n3. Exhale through mouth for 8 seconds\n4. Repeat 4 times",
                    is_active=True
                ),
                Therapy(
                    title="Mindfulness Meditation",
                    description="Focus on present moment awareness to reduce stress",
                    category="meditation",
                    duration_minutes=10,
                    difficulty_level="beginner",
                    benefits="Reduces stress, improves focus, enhances emotional regulation",
                    instructions="1. Sit comfortably\n2. Focus on your breath\n3. Notice thoughts without judgment\n4. Return focus to breath",
                    is_active=True
                ),
                Therapy(
                    title="Progressive Muscle Relaxation",
                    description="Systematically tense and relax muscle groups",
                    category="relaxation",
                    duration_minutes=15,
                    difficulty_level="intermediate",
                    benefits="Reduces muscle tension, improves sleep, decreases anxiety",
                    instructions="1. Start with feet, tense for 5 seconds\n2. Release and relax\n3. Move up through body groups\n4. End with facial muscles",
                    is_active=True
                )
            ]
            db.session.add_all(sample_therapies)
            db.session.commit()
            print("✅ Sample therapies added")
        
        # Add sample music therapy if empty
        if MusicTherapy.query.count() == 0:
            sample_music = [
                MusicTherapy(
                    title="Ocean Waves Meditation",
                    artist="Nature Sounds",
                    description="Calming ocean waves for deep relaxation",
                    category="meditation",
                    duration_seconds=600,
                    audio_url="https://example.com/ocean-waves.mp3",
                    mood="peaceful",
                    is_active=True
                ),
                MusicTherapy(
                    title="Forest Rain Ambience",
                    artist="Nature Sounds",
                    description="Gentle rain sounds for sleep and relaxation",
                    category="sleep",
                    duration_seconds=900,
                    audio_url="https://example.com/forest-rain.mp3",
                    mood="calm",
                    is_active=True
                )
            ]
            db.session.add_all(sample_music)
            db.session.commit()
            print("✅ Sample music therapy added")

# Initialize database on startup
with app.app_context():
    init_database()

# ==================== Authentication Routes ====================

@app.route('/api/auth/register', methods=['POST'])
def register():
    """Register new user"""
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        name = data.get('name', '')
        
        if not email or not password:
            return jsonify({'error': 'Email and password required'}), 400
        
        # Check if user exists
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email already registered'}), 400
        
        # Create new user
        user = User(email=email, name=name)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        
        # Create access token for the new user
        access_token = create_access_token(identity=str(user.id))
        
        return jsonify({
            'message': 'User registered successfully',
            'access_token': access_token,
            'user': user.to_dict()
        }), 201

        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/auth/login', methods=['POST'])
def login():
    """User login with JWT token"""
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'error': 'Email and password required'}), 400
        
        user = User.query.filter_by(email=email).first()
        
        if not user or not user.check_password(password):
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Update last login
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        # Create JWT token with user info
        additional_claims = {
            'is_admin': user.is_admin,
            'email': user.email
        }
        access_token = create_access_token(
            identity=str(user.id),
            additional_claims=additional_claims
        )

        
        return jsonify({
            'message': 'Login successful',
            'access_token': access_token,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/auth/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user info"""
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({'user': user.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== Chatbot Routes ====================

@app.route('/api/chat/message', methods=['POST'])
@jwt_required()
def send_chat_message():
    """Send message to AI chatbot and get response"""
    try:
        # Get identity as string to ensure compatibility
        user_identity = get_jwt_identity()
        user_id = int(user_identity) if user_identity else None
        
        if not user_id:
            return jsonify({'success': False, 'message': 'Invalid user session'}), 401

        data = request.get_json()
        user_message = data.get('message', '').strip()

        
        if not user_message:
            return jsonify({'error': 'Message is required'}), 400
        
        # Get recent conversation history
        recent_chats = ChatHistory.query.filter_by(user_id=user_id)\
            .order_by(ChatHistory.timestamp.desc())\
            .limit(5)\
            .all()
        
        history = [chat.to_dict() for chat in reversed(recent_chats)]
        
        # Generate AI response
        response = chatbot.generate_response(user_message, history)
        
        if response['success']:
            # Save to database
            chat = ChatHistory(
                user_id=user_id,
                user_message=user_message,
                bot_response=response['message']
            )
            db.session.add(chat)
            db.session.commit()
            
            return jsonify({
                'response': response['message'],  # Changed from 'message' to 'response'
                'timestamp': response['timestamp'],
                'chat_id': chat.id,
                'success': True
            }), 200
        else:
            return jsonify({
                'response': response['message'],  # Changed from 'message' to 'response'
                'error': response.get('error'),
                'timestamp': response['timestamp'],
                'success': False
            }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/chat/history', methods=['GET'])
@jwt_required()
def get_chat_history():
    """Get user's chat history"""
    try:
        user_id = int(get_jwt_identity())
        limit = request.args.get('limit', 50, type=int)
        
        chats = ChatHistory.query.filter_by(user_id=user_id)\
            .order_by(ChatHistory.timestamp.desc())\
            .limit(limit)\
            .all()
        
        return jsonify({
            'history': [chat.to_dict() for chat in reversed(chats)],
            'count': len(chats)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/chat/clear', methods=['DELETE'])
@jwt_required()
def clear_chat_history():
    """Clear user's chat history"""
    try:
        user_id = int(get_jwt_identity())
        
        ChatHistory.query.filter_by(user_id=user_id).delete()
        db.session.commit()
        
        return jsonify({'message': 'Chat history cleared'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/chat/tip', methods=['GET'])
@jwt_required()
def get_stress_tip():
    """Get random stress management tip"""
    try:
        tip = chatbot.get_stress_tip()
        return jsonify(tip), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== Stress Detection & Assessment Routes ====================

@app.route('/api/stress/assess', methods=['POST'])
@jwt_required()
def assess_stress():
    """
    Complete stress assessment with ML prediction
    Accepts anxiety questionnaire answers and/or HRV data
    Returns stress level and therapy recommendations
    """
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json()
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get assessment data
        anxiety_answers = data.get('answers', [])  # List of answer values (0-3)
        rr_intervals = data.get('rr_intervals')  # Optional HRV data
        
        if not anxiety_answers and not rr_intervals:
            return jsonify({'error': 'Either anxiety answers or HRV data required'}), 400
        
        # Calculate anxiety score
        anxiety_score = stress_detector.calculate_anxiety_score(anxiety_answers) if anxiety_answers else None
        
        # Predict stress level using ML
        prediction = stress_detector.predict_stress_level(
            anxiety_score=anxiety_score,
            rr_intervals=rr_intervals
        )
        
        # Create stress session
        session = StressSession(
            user_id=user_id,
            stress_level=prediction['stress_level'],
            confidence=prediction['confidence'] / 100,  # Convert to 0-1
            model_version=stress_detector.model_type,
            anxiety_score=prediction['anxiety_score']
        )
        db.session.add(session)
        db.session.flush()  # Get session ID
        
        # Save HRV data if provided
        if rr_intervals:
            import json
            hrv_data = HRVData(
                user_id=user_id,
                session_id=session.id,
                rr_intervals=json.dumps(rr_intervals)
            )
            db.session.add(hrv_data)
        
        # Save extracted features
        hrv_features = prediction['hrv_features']
        features = StressFeatures(
            session_id=session.id,
            mean_hr=hrv_features['mean_hr'],
            sdnn=hrv_features['sdnn'],
            rmssd=hrv_features['rmssd'],
            lf_hf_ratio=hrv_features['lf_hf_ratio']
        )
        db.session.add(features)
        
        # Update user assessment data
        user.has_completed_assessment = True
        user.last_anxiety_score = prediction['anxiety_score']
        user.total_assessments = (user.total_assessments or 0) + 1
        user.last_assessment_date = datetime.utcnow()
        
        # Log security event
        log = SecurityLog(
            user_id=user_id,
            action='stress_assessment',
            status='Success',
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent', '')[:255]
        )
        db.session.add(log)
        
        db.session.commit()
        
        # Get therapy recommendations
        therapy_rec = stress_detector.recommend_therapy(prediction['stress_level'])
        
        return jsonify({
            'session_id': session.id,
            'stress_level': prediction['stress_level'],
            'confidence': prediction['confidence'],
            'probabilities': prediction['probabilities'],
            'anxiety_score': prediction['anxiety_score'],
            'hrv_features': hrv_features,
            'therapy_recommendation': therapy_rec,
            'message': therapy_rec['message'],
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/stress/sessions', methods=['GET'])
@jwt_required()
def get_stress_sessions():
    """Get user's stress session history"""
    try:
        user_id = int(get_jwt_identity())
        limit = request.args.get('limit', 50, type=int)
        
        sessions = StressSession.query.filter_by(user_id=user_id)\
            .order_by(StressSession.created_at.desc())\
            .limit(limit)\
            .all()
        
        # Include features in response
        sessions_data = []
        for session in sessions:
            session_dict = session.to_dict()
            if session.stress_features:
                session_dict['features'] = session.stress_features.to_dict()
            sessions_data.append(session_dict)
        
        return jsonify({
            'sessions': sessions_data,
            'count': len(sessions_data)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/stress/sessions/<int:session_id>', methods=['GET'])
@jwt_required()
def get_stress_session(session_id):
    """Get detailed stress session with HRV data and features"""
    try:
        user_id = int(get_jwt_identity())
        
        session = StressSession.query.filter_by(id=session_id, user_id=user_id).first()
        if not session:
            return jsonify({'error': 'Session not found'}), 404
        
        session_data = session.to_dict()
        
        # Add HRV data if available
        if session.hrv_data:
            session_data['hrv_data'] = session.hrv_data.to_dict()
        
        # Add features
        if session.stress_features:
            session_data['features'] = session.stress_features.to_dict()
        
        # Add therapy recommendation
        therapy_rec = stress_detector.recommend_therapy(session.stress_level)
        session_data['therapy_recommendation'] = therapy_rec
        
        return jsonify(session_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/stress/analytics', methods=['GET'])
@jwt_required()
def get_stress_analytics():
    """Get stress analytics and trends for dashboard"""
    try:
        user_id = int(get_jwt_identity())
        days = request.args.get('days', 30, type=int)
        
        from datetime import timedelta
        start_date = datetime.utcnow() - timedelta(days=days)
        
        sessions = StressSession.query.filter(
            StressSession.user_id == user_id,
            StressSession.created_at >= start_date
        ).order_by(StressSession.created_at.asc()).all()
        
        # Calculate analytics
        total_sessions = len(sessions)
        stress_counts = {'Low': 0, 'Moderate': 0, 'High': 0}
        avg_anxiety_score = 0
        
        timeline_data = []
        for session in sessions:
            stress_counts[session.stress_level] += 1
            avg_anxiety_score += session.anxiety_score or 0
            
            timeline_data.append({
                'date': session.created_at.isoformat(),
                'stress_level': session.stress_level,
                'anxiety_score': session.anxiety_score,
                'confidence': session.confidence
            })
        
        avg_anxiety_score = round(avg_anxiety_score / total_sessions, 2) if total_sessions > 0 else 0
        
        return jsonify({
            'total_sessions': total_sessions,
            'stress_distribution': stress_counts,
            'average_anxiety_score': avg_anxiety_score,
            'timeline': timeline_data,
            'period_days': days
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Keep old simple assessment endpoint for backward compatibility
@app.route('/api/user/assessment', methods=['POST'])
@jwt_required()
def save_assessment():
    """Save user assessment results (legacy endpoint)"""
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json()
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        user.has_completed_assessment = True
        user.last_anxiety_score = data.get('score')
        user.total_assessments = (user.total_assessments or 0) + 1
        user.last_assessment_date = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Assessment saved successfully',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ==================== Therapy Routes ====================

@app.route('/api/therapies', methods=['GET'])
@jwt_required()
def get_therapies():
    """Get all active therapies"""
    try:
        category = request.args.get('category')
        
        query = Therapy.query.filter_by(is_active=True)
        if category:
            query = query.filter_by(category=category)
        
        therapies = query.all()
        
        return jsonify({
            'therapies': [t.to_dict() for t in therapies],
            'count': len(therapies)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/therapies/<int:therapy_id>', methods=['GET'])
@jwt_required()
def get_therapy(therapy_id):
    """Get specific therapy"""
    try:
        therapy = Therapy.query.get(therapy_id)
        if not therapy:
            return jsonify({'error': 'Therapy not found'}), 404
        
        return jsonify({'therapy': therapy.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== Music Therapy Routes ====================

@app.route('/api/music', methods=['GET'])
@jwt_required()
def get_music_therapy():
    """Get all active music therapy"""
    try:
        category = request.args.get('category')
        
        query = MusicTherapy.query.filter_by(is_active=True)
        if category:
            query = query.filter_by(category=category)
        
        music = query.all()
        
        return jsonify({
            'music': [m.to_dict() for m in music],
            'count': len(music)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/music/<int:music_id>/play', methods=['POST'])
@jwt_required()
def play_music(music_id):
    """Increment play count for music"""
    try:
        music = MusicTherapy.query.get(music_id)
        if not music:
            return jsonify({'error': 'Music not found'}), 404
        
        music.play_count += 1
        db.session.commit()
        
        return jsonify({'music': music.to_dict()}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ==================== Admin Routes ====================

def admin_required():
    """Check if user is admin"""
    claims = get_jwt()
    if not claims.get('is_admin'):
        return jsonify({'error': 'Admin access required'}), 403
    return None


@app.route('/api/admin/users', methods=['GET'])
@jwt_required()
def get_all_users():
    """Admin: Get all users"""
    error = admin_required()
    if error:
        return error
    
    try:
        users = User.query.all()
        return jsonify({
            'users': [u.to_dict() for u in users],
            'count': len(users)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/admin/users/<int:user_id>', methods=['GET', 'DELETE'])
@jwt_required()
def manage_user(user_id):
    """Admin: Get or delete user"""
    error = admin_required()
    if error:
        return error
    
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if request.method == 'DELETE':
            if user.is_admin:
                return jsonify({'error': 'Cannot delete admin user'}), 400
            
            db.session.delete(user)
            db.session.commit()
            return jsonify({'message': 'User deleted successfully'}), 200
        
        return jsonify({'user': user.to_dict()}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/admin/therapies', methods=['GET', 'POST'])
@jwt_required()
def admin_therapies():
    """Admin: Get all or create therapy"""
    error = admin_required()
    if error:
        return error
    
    try:
        if request.method == 'POST':
            data = request.get_json()
            
            therapy = Therapy(
                title=data.get('title'),
                description=data.get('description'),
                category=data.get('category'),
                duration_minutes=data.get('duration_minutes'),
                difficulty_level=data.get('difficulty_level'),
                benefits=data.get('benefits'),
                instructions=data.get('instructions'),
                image_url=data.get('image_url'),
                is_active=data.get('is_active', True)
            )
            
            db.session.add(therapy)
            db.session.commit()
            
            return jsonify({
                'message': 'Therapy created successfully',
                'therapy': therapy.to_dict()
            }), 201
        
        # GET all therapies
        therapies = Therapy.query.all()
        return jsonify({
            'therapies': [t.to_dict() for t in therapies],
            'count': len(therapies)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/admin/therapies/<int:therapy_id>', methods=['PUT', 'DELETE'])
@jwt_required()
def admin_manage_therapy(therapy_id):
    """Admin: Update or delete therapy"""
    error = admin_required()
    if error:
        return error
    
    try:
        therapy = Therapy.query.get(therapy_id)
        if not therapy:
            return jsonify({'error': 'Therapy not found'}), 404
        
        if request.method == 'DELETE':
            db.session.delete(therapy)
            db.session.commit()
            return jsonify({'message': 'Therapy deleted successfully'}), 200
        
        # UPDATE
        data = request.get_json()
        
        therapy.title = data.get('title', therapy.title)
        therapy.description = data.get('description', therapy.description)
        therapy.category = data.get('category', therapy.category)
        therapy.duration_minutes = data.get('duration_minutes', therapy.duration_minutes)
        therapy.difficulty_level = data.get('difficulty_level', therapy.difficulty_level)
        therapy.benefits = data.get('benefits', therapy.benefits)
        therapy.instructions = data.get('instructions', therapy.instructions)
        therapy.image_url = data.get('image_url', therapy.image_url)
        therapy.is_active = data.get('is_active', therapy.is_active)
        therapy.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Therapy updated successfully',
            'therapy': therapy.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/admin/music', methods=['GET', 'POST'])
@jwt_required()
def admin_music():
    """Admin: Get all or create music therapy"""
    error = admin_required()
    if error:
        return error
    
    try:
        if request.method == 'POST':
            data = request.get_json()
            
            music = MusicTherapy(
                title=data.get('title'),
                artist=data.get('artist'),
                description=data.get('description'),
                category=data.get('category'),
                duration_seconds=data.get('duration_seconds'),
                audio_url=data.get('audio_url'),
                thumbnail_url=data.get('thumbnail_url'),
                mood=data.get('mood'),
                is_active=data.get('is_active', True)
            )
            
            db.session.add(music)
            db.session.commit()
            
            return jsonify({
                'message': 'Music therapy created successfully',
                'music': music.to_dict()
            }), 201
        
        # GET all music
        music = MusicTherapy.query.all()
        return jsonify({
            'music': [m.to_dict() for m in music],
            'count': len(music)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/admin/music/<int:music_id>', methods=['PUT', 'DELETE'])
@jwt_required()
def admin_manage_music(music_id):
    """Admin: Update or delete music therapy"""
    error = admin_required()
    if error:
        return error
    
    try:
        music = MusicTherapy.query.get(music_id)
        if not music:
            return jsonify({'error': 'Music not found'}), 404
        
        if request.method == 'DELETE':
            db.session.delete(music)
            db.session.commit()
            return jsonify({'message': 'Music therapy deleted successfully'}), 200
        
        # UPDATE
        data = request.get_json()
        
        music.title = data.get('title', music.title)
        music.artist = data.get('artist', music.artist)
        music.description = data.get('description', music.description)
        music.category = data.get('category', music.category)
        music.duration_seconds = data.get('duration_seconds', music.duration_seconds)
        music.audio_url = data.get('audio_url', music.audio_url)
        music.thumbnail_url = data.get('thumbnail_url', music.thumbnail_url)
        music.mood = data.get('mood', music.mood)
        music.is_active = data.get('is_active', music.is_active)
        music.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Music therapy updated successfully',
            'music': music.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/admin/stats', methods=['GET'])
@jwt_required()
def admin_stats():
    """Admin: Get dashboard statistics"""
    error = admin_required()
    if error:
        return error
    
    try:
        total_users = User.query.count()
        total_chats = ChatHistory.query.count()
        total_therapies = Therapy.query.filter_by(is_active=True).count()
        total_music = MusicTherapy.query.filter_by(is_active=True).count()
        
        # Users who completed assessment
        assessed_users = User.query.filter_by(has_completed_assessment=True).count()
        
        return jsonify({
            'total_users': total_users,
            'total_chats': total_chats,
            'total_therapies': total_therapies,
            'total_music': total_music,
            'assessed_users': assessed_users,
            'assessment_rate': round((assessed_users / total_users * 100) if total_users > 0 else 0, 2)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== Health Check ====================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'ZenTrack Backend API',
        'version': '1.0.0',
        'timestamp': datetime.utcnow().isoformat()
    }), 200


# Commented out - Frontend HTML now serves at /
# @app.route('/', methods=['GET'])
# def index():
#     """API root endpoint"""
#     return jsonify({
#         'message': 'Welcome to ZenTrack Backend API',
#         'version': '1.0.0',
#         'endpoints': {
#             'auth': '/api/auth/*',
#             'chat': '/api/chat/*',
#             'therapies': '/api/therapies',
#             'music': '/api/music',
#             'admin': '/api/admin/*',
#             'health': '/api/health'
#         }
#     }), 200


# ==================== Error Handlers ====================

@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'Endpoint not found'}), 404



@app.errorhandler(500)
def internal_error(e):
    return jsonify({'error': 'Internal server error'}), 500


# ==================== Frontend & Admin Panel Routes ====================

@app.route('/')
def serve_frontend():
    """Serve main frontend application"""
    from flask import send_from_directory
    return send_from_directory('../frontend', 'landing.html')


@app.route('/admin')
def serve_admin():
    """Serve admin panel"""
    from flask import send_from_directory
    return send_from_directory('.', 'admin_panel.html')


@app.route('/admin.js')
def serve_admin_js():
    """Serve admin panel JavaScript"""
    from flask import send_from_directory
    return send_from_directory('.', 'admin.js')





# ==================== Run Application ====================

if __name__ == '__main__':
    init_database()
    print("\n" + "="*60)
    print("🚀 ZenTrack - Complete Mental Wellness Platform")
    print("="*60)
    print(f"📍 Backend API: http://localhost:5000/api")
    print(f"🌐 Frontend App: http://localhost:5000/")
    print(f"👑 Admin Panel: http://localhost:5000/admin")
    print("")
    print(f"👤 Admin Email: {os.getenv('ADMIN_EMAIL')}")
    print(f"🔑 Admin Password: {os.getenv('ADMIN_PASSWORD')}")
    print("="*60)
    print("✅ ML Stress Detection: Active")
    print("✅ AI Chatbot (Gemini): Active")
    print("✅ Database: SQLite (zentrack.db)")
    print("✅ Logging: Enabled (logs/ directory)")
    print("="*60 + "\n")
    
    # Auto-open browser after server starts
    import threading
    import webbrowser
    
    def open_browser():
        """Open browser automatically after server starts"""
        import time
        time.sleep(2)  # Wait for server to start
        print("🌐 Opening browser automatically...")
        webbrowser.open('http://localhost:5000/')
    
    # Start browser in separate thread
    threading.Thread(target=open_browser, daemon=True).start()
    
    app.run(debug=True, host='0.0.0.0', port=5000, use_reloader=False)


