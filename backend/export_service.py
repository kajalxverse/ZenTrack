"""
ZenTrack - Data Export Service
Generate PDF and CSV reports for stress sessions and analytics
"""

from datetime import datetime
import csv
import io

class DataExporter:
    """Service for exporting user data in various formats"""
    
    def __init__(self):
        pass
    
    def export_sessions_csv(self, sessions):
        """
        Export stress sessions to CSV format
        
        Args:
            sessions (list): List of StressSession objects
            
        Returns:
            str: CSV content as string
        """
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            'Session ID',
            'Date',
            'Time',
            'Stress Level',
            'Confidence (%)',
            'Anxiety Score',
            'Mean HR (BPM)',
            'SDNN',
            'RMSSD',
            'LF/HF Ratio'
        ])
        
        # Write data
        for session in sessions:
            features = session.stress_features
            writer.writerow([
                session.id,
                session.created_at.strftime('%Y-%m-%d'),
                session.created_at.strftime('%H:%M:%S'),
                session.stress_level,
                round(session.confidence * 100, 2) if session.confidence else 'N/A',
                session.anxiety_score or 'N/A',
                features.mean_hr if features else 'N/A',
                features.sdnn if features else 'N/A',
                features.rmssd if features else 'N/A',
                features.lf_hf_ratio if features else 'N/A'
            ])
        
        return output.getvalue()
    
    def export_analytics_csv(self, analytics_data):
        """
        Export analytics data to CSV
        
        Args:
            analytics_data (dict): Analytics dictionary
            
        Returns:
            str: CSV content
        """
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Summary section
        writer.writerow(['ZenTrack Stress Analytics Report'])
        writer.writerow(['Generated:', datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')])
        writer.writerow([])
        
        # Statistics
        writer.writerow(['Summary Statistics'])
        writer.writerow(['Total Sessions', analytics_data.get('total_sessions', 0)])
        writer.writerow(['Average Anxiety Score', analytics_data.get('average_anxiety_score', 0)])
        writer.writerow(['Period (Days)', analytics_data.get('period_days', 0)])
        writer.writerow([])
        
        # Stress distribution
        writer.writerow(['Stress Distribution'])
        dist = analytics_data.get('stress_distribution', {})
        writer.writerow(['Low Stress Sessions', dist.get('Low', 0)])
        writer.writerow(['Moderate Stress Sessions', dist.get('Moderate', 0)])
        writer.writerow(['High Stress Sessions', dist.get('High', 0)])
        writer.writerow([])
        
        # Timeline
        writer.writerow(['Timeline Data'])
        writer.writerow(['Date', 'Stress Level', 'Anxiety Score', 'Confidence'])
        
        for entry in analytics_data.get('timeline', []):
            writer.writerow([
                entry.get('date', ''),
                entry.get('stress_level', ''),
                entry.get('anxiety_score', ''),
                entry.get('confidence', '')
            ])
        
        return output.getvalue()
    
    def generate_text_report(self, user, sessions, analytics):
        """
        Generate a comprehensive text report
        
        Args:
            user: User object
            sessions: List of sessions
            analytics: Analytics data
            
        Returns:
            str: Formatted text report
        """
        report = []
        report.append("=" * 60)
        report.append("ZENTRACK - STRESS MANAGEMENT REPORT")
        report.append("=" * 60)
        report.append("")
        
        # User info
        report.append(f"User: {user.name or user.email}")
        report.append(f"Email: {user.email}")
        report.append(f"Report Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}")
        report.append("")
        
        # Summary
        report.append("-" * 60)
        report.append("SUMMARY")
        report.append("-" * 60)
        report.append(f"Total Assessments: {user.total_assessments or 0}")
        report.append(f"Last Assessment: {user.last_assessment_date.strftime('%Y-%m-%d') if user.last_assessment_date else 'Never'}")
        report.append(f"Last Anxiety Score: {user.last_anxiety_score or 'N/A'}")
        report.append("")
        
        # Analytics
        if analytics:
            report.append("-" * 60)
            report.append("ANALYTICS")
            report.append("-" * 60)
            report.append(f"Total Sessions: {analytics.get('total_sessions', 0)}")
            report.append(f"Average Anxiety Score: {analytics.get('average_anxiety_score', 0)}")
            report.append("")
            
            dist = analytics.get('stress_distribution', {})
            report.append("Stress Distribution:")
            report.append(f"  • Low Stress: {dist.get('Low', 0)} sessions")
            report.append(f"  • Moderate Stress: {dist.get('Moderate', 0)} sessions")
            report.append(f"  • High Stress: {dist.get('High', 0)} sessions")
            report.append("")
        
        # Recent sessions
        if sessions:
            report.append("-" * 60)
            report.append("RECENT SESSIONS")
            report.append("-" * 60)
            
            for i, session in enumerate(sessions[:10], 1):
                report.append(f"\nSession #{i}")
                report.append(f"  Date: {session.created_at.strftime('%Y-%m-%d %H:%M:%S')}")
                report.append(f"  Stress Level: {session.stress_level}")
                report.append(f"  Confidence: {round(session.confidence * 100, 2)}%" if session.confidence else "  Confidence: N/A")
                report.append(f"  Anxiety Score: {session.anxiety_score or 'N/A'}")
                
                if session.stress_features:
                    f = session.stress_features
                    report.append(f"  Mean HR: {f.mean_hr} BPM")
                    report.append(f"  SDNN: {f.sdnn}")
                    report.append(f"  RMSSD: {f.rmssd}")
                    report.append(f"  LF/HF Ratio: {f.lf_hf_ratio}")
        
        report.append("")
        report.append("=" * 60)
        report.append("End of Report")
        report.append("=" * 60)
        
        return "\n".join(report)
    
    def get_recommendations_text(self, stress_level):
        """
        Get detailed text recommendations based on stress level
        
        Args:
            stress_level (str): Low, Moderate, or High
            
        Returns:
            str: Formatted recommendations
        """
        recommendations = {
            'Low': """
✅ GREAT NEWS! Your stress level is LOW.

Recommendations:
• Continue your current stress management practices
• Maintain regular sleep schedule (7-8 hours)
• Enjoy calming music or nature sounds
• Practice gratitude journaling
• Stay physically active with light exercises
• Connect with friends and family

Keep up the good work! 🌟
""",
            'Moderate': """
⚠️ ATTENTION: Your stress level is MODERATE.

Immediate Actions:
• Practice 4-7-8 breathing technique (Inhale 4s, Hold 7s, Exhale 8s)
• Try 10-15 minutes of yoga or meditation
• Take short breaks every hour
• Limit caffeine intake
• Get 15 minutes of sunlight
• Listen to calming music

Consider:
• Talking to a friend or counselor
• Reviewing your daily schedule
• Identifying stress triggers
• Improving sleep quality

You've got this! 💪
""",
            'High': """
🚨 IMPORTANT: Your stress level is HIGH.

Urgent Recommendations:
• Stop what you're doing and take deep breaths
• Talk to our AI chatbot for immediate support
• Practice progressive muscle relaxation
• Take a 20-minute walk outdoors
• Call a friend or family member
• Consider professional counseling

Immediate Relief Techniques:
• 5-4-3-2-1 Grounding: Name 5 things you see, 4 you touch, 3 you hear, 2 you smell, 1 you taste
• Cold water on face or wrists
• Listen to guided meditation
• Write down your feelings

⚠️ If you're experiencing severe anxiety or thoughts of self-harm, 
please contact a mental health professional immediately.

National Mental Health Helpline: 1800-599-0019 (India)

Remember: This too shall pass. You're not alone. 🤗
"""
        }
        
        return recommendations.get(stress_level, recommendations['Moderate'])
