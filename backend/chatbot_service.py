"""
ZenTrack Backend - AI Chatbot Service
Using Groq API for fast, reliable AI responses with generous free tier
"""

from groq import Groq
from datetime import datetime
import os
import random

class ChatbotService:
    """Service for handling AI chatbot interactions with Groq"""
    
    def __init__(self, api_key):
        """Initialize Groq API"""
        self.client = Groq(api_key=api_key)
        
        # Using llama-3.3-70b-versatile - Latest Llama 3.3 model, fast and powerful
        # This is currently available on Groq (as of Jan 2026)
        self.model = "llama-3.3-70b-versatile"
        
        # System prompt for stress management assistant - MULTILINGUAL
        self.system_prompt = """You are a helpful, multilingual stress management assistant for ZenTrack app.

🌍 LANGUAGE RULE: ALWAYS respond in the SAME language the user writes in. 
- If user writes in Hindi, respond in Hindi
- If user writes in Spanish, respond in Spanish  
- If user writes in French, respond in French
- If user writes in any language, respond in THAT language
- Automatically detect the language and match it perfectly

IMPORTANT: Keep ALL responses between 50-90 words. Be concise, clear, and meaningful.

Be empathetic, supportive, and provide practical advice for managing stress and anxiety. Focus on:
- Breathing techniques and meditation
- Stress reduction strategies
- Sleep improvement tips
- Mental wellness practices
- Encouraging and positive tone

Give ONE specific, actionable tip per response. Avoid long explanations.
Never provide medical advice. For serious concerns, suggest consulting healthcare professionals.

Remember: 
1. MATCH THE USER'S LANGUAGE automatically
2. 50-90 words maximum
3. Quality over quantity"""
    
    def generate_response(self, user_message, conversation_history=None):
        """
        Generate AI response to user message with proper quota error handling
        """
        try:
            # Build messages array
            messages = [
                {"role": "system", "content": self.system_prompt}
            ]
            
            # Add conversation history if available
            if conversation_history:
                for chat in conversation_history[-5:]:  # Last 5 messages
                    messages.append({"role": "user", "content": chat.get('user_message', '')})
                    messages.append({"role": "assistant", "content": chat.get('bot_response', '')})
            
            # Add current user message
            messages.append({"role": "user", "content": user_message})
            
            # Generate response using Groq
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.7,
                max_tokens=200,
                top_p=0.95
            )
            
            bot_message = response.choices[0].message.content.strip()
            
            return {
                'success': True,
                'message': bot_message,
                'timestamp': datetime.utcnow().isoformat(),
                'model': 'llama-3.3-70b-versatile'
            }
            
        except Exception as e:
            error_msg = str(e)
            print(f"❌ Chatbot Error: {error_msg}")
            
            # Check for quota/rate limit errors (429)
            if "429" in error_msg or "quota" in error_msg.lower() or "rate" in error_msg.lower():
                return {
                    'success': False,
                    'type': 'QUOTA_ERROR',
                    'retry_after': 60,
                    'message': "I'm currently receiving too many requests. Please wait a moment before sending another message 🙏",
                    'error': error_msg,
                    'timestamp': datetime.utcnow().isoformat()
                }
            
            # Other errors - return fallback
            return {
                'success': False,
                'type': 'SERVER_ERROR',
                'message': self._get_fallback_response(),
                'error': error_msg,
                'timestamp': datetime.utcnow().isoformat()
            }
    
    def _get_fallback_response(self):
        """Fallback response when API fails"""
        tips = [
            "Try the 4-7-8 breathing technique: Inhale for 4 seconds, hold for 7, exhale for 8.",
            "Take a 20-minute walk to reduce stress by up to 28%.",
            "Practice mindfulness meditation for 10 minutes daily.",
            "Ensure you get 7-8 hours of quality sleep each night.",
            "Listen to calming music or nature sounds for relaxation.",
            "Journal your thoughts and feelings to process emotions.",
            "Connect with friends or family for emotional support.",
            "Try progressive muscle relaxation to release tension."
        ]
        
        return f"I'm having trouble connecting right now. Here's a helpful tip: {random.choice(tips)}"
    
    def get_stress_tip(self):
        """Get a random stress management tip"""
        try:
            messages = [
                {"role": "system", "content": self.system_prompt},
                {"role": "user", "content": "Provide one practical stress management tip in 2-3 sentences."}
            ]
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.7,
                max_tokens=100
            )
            
            return {
                'success': True,
                'tip': response.choices[0].message.content.strip(),
                'timestamp': datetime.utcnow().isoformat()
            }
        except Exception as e:
            error_msg = str(e)
            if "429" in error_msg or "quota" in error_msg.lower():
                tip_text = "Take a moment to breathe deeply and focus on the present."
            else:
                tip_text = self._get_fallback_response()
                
            return {
                'success': False,
                'tip': tip_text,
                'error': error_msg
            }
