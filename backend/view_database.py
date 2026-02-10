"""
View ZenTrack Database Contents
Simple script to display all database data in a readable format
"""

import sys
import os
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app, db
from models import User, StressSession, ChatHistory, StressFeatures

def view_database():
    """Display database contents in a readable format"""
    
    with app.app_context():
        print("=" * 80)
        print("📊 ZENTRACK DATABASE VIEWER")
        print("=" * 80)
        print()
        
        # Users Table
        print("👥 USERS")
        print("-" * 80)
        users = User.query.all()
        
        if not users:
            print("❌ No users found.")
            print("💡 Tip: Register a user on the website first!")
        else:
            for user in users:
                print(f"ID: {user.id}")
                print(f"Name: {user.name}")
                print(f"Email: {user.email}")
                print(f"Created: {user.created_at}")
                print(f"Last Login: {user.last_login or 'Never'}")
                print(f"Total Assessments: {user.total_assessments or 0}")
                print(f"Last Anxiety Score: {user.last_anxiety_score or 'N/A'}")
                print(f"Admin: {'Yes' if user.is_admin else 'No'}")
                print("-" * 80)
        
        print()
        
        # Stress Sessions Table
        print("📈 STRESS SESSIONS")
        print("-" * 80)
        sessions = StressSession.query.order_by(StressSession.created_at.desc()).limit(10).all()
        total_sessions = StressSession.query.count()
        
        if not sessions:
            print("❌ No stress sessions found.")
            print("💡 Tip: Complete a stress assessment on the website!")
        else:
            print(f"Showing last 10 sessions (Total: {total_sessions})")
            print()
            for session in sessions:
                user = User.query.get(session.user_id)
                print(f"Session ID: {session.id}")
                print(f"User: {user.name if user else 'Unknown'}")
                print(f"Stress Level: {session.stress_level}")
                print(f"Anxiety Score: {session.anxiety_score}%")
                print(f"Confidence: {session.confidence:.2%}")
                print(f"Date: {session.created_at}")
                
                # Show HRV features if available
                features = StressFeatures.query.filter_by(session_id=session.id).first()
                if features:
                    print(f"  HRV - Mean HR: {features.mean_hr:.1f}, SDNN: {features.sdnn:.1f}, RMSSD: {features.rmssd:.1f}")
                
                print("-" * 80)
        
        print()
        
        # Chat Messages Table
        print("💬 CHAT MESSAGES")
        print("-" * 80)
        messages = ChatHistory.query.order_by(ChatHistory.timestamp.desc()).limit(5).all()
        total_messages = ChatHistory.query.count()
        
        if not messages:
            print("❌ No chat messages found.")
            print("💡 Tip: Send a message to the AI chatbot!")
        else:
            print(f"Showing last 5 messages (Total: {total_messages})")
            print()
            for msg in messages:
                user = User.query.get(msg.user_id)
                print(f"Message ID: {msg.id}")
                print(f"User: {user.name if user else 'Unknown'}")
                print(f"User Message: {msg.user_message[:100]}{'...' if len(msg.user_message) > 100 else ''}")
                print(f"Bot Response: {msg.bot_response[:100]}{'...' if len(msg.bot_response) > 100 else ''}")
                print(f"Date: {msg.timestamp}")
                print("-" * 80)
        
        print()
        
        # Database Statistics
        print("📊 DATABASE STATISTICS")
        print("-" * 80)
        print(f"Total Users: {User.query.count()}")
        print(f"Total Stress Sessions: {StressSession.query.count()}")
        print(f"Total Chat Messages: {ChatHistory.query.count()}")
        print(f"Total Stress Features: {StressFeatures.query.count()}")
        print("-" * 80)
        
        # Stress Distribution
        if total_sessions > 0:
            print()
            print("📊 STRESS LEVEL DISTRIBUTION")
            print("-" * 80)
            low_count = StressSession.query.filter_by(stress_level='Low').count()
            mod_count = StressSession.query.filter_by(stress_level='Moderate').count()
            high_count = StressSession.query.filter_by(stress_level='High').count()
            
            print(f"Low Stress:      {low_count:3d} ({low_count/total_sessions*100:.1f}%)")
            print(f"Moderate Stress: {mod_count:3d} ({mod_count/total_sessions*100:.1f}%)")
            print(f"High Stress:     {high_count:3d} ({high_count/total_sessions*100:.1f}%)")
            print("-" * 80)
        
        print()
        print("=" * 80)
        print("✅ Database view complete!")
        print()
        print("💡 Tips:")
        print("   - Use DB Browser for SQLite for visual database exploration")
        print("   - Download: https://sqlitebrowser.org/")
        print("   - Database location: backend/instance/zentrack.db")
        print("=" * 80)

if __name__ == '__main__':
    print()
    view_database()
