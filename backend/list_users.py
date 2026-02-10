"""
List all users in the database
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app, db
from models import User

def list_users():
    """List all users in the database"""
    
    with app.app_context():
        users = User.query.all()
        
        if not users:
            print("❌ No users found in the database!")
            print("\n💡 Please register a user account first:")
            print("   1. Go to http://localhost:5000/login.html")
            print("   2. Click 'Register'")
            print("   3. Create an account")
            return False
        
        print(f"✅ Found {len(users)} user(s):\n")
        
        for i, user in enumerate(users, 1):
            print(f"{i}. Email: {user.email}")
            print(f"   Name: {user.name}")
            print(f"   Assessments: {user.total_assessments or 0}")
            print(f"   Last Score: {user.last_anxiety_score or 'N/A'}")
            print(f"   Admin: {'Yes' if user.is_admin else 'No'}")
            print()
        
        return True

if __name__ == '__main__':
    print("=" * 60)
    print("👥 ZenTrack Users List")
    print("=" * 60)
    print()
    
    list_users()
    
    print("=" * 60)
