"""
ZenTrack - Export Routes
Add these routes to app.py before the Admin Routes section
"""

# ==================== Data Export Routes ====================

@app.route('/api/export/sessions/csv', methods=['GET'])
@jwt_required()
@rate_limit(max_requests=10, window_seconds=60)
def export_sessions_csv():
    """Export user's stress sessions as CSV"""
    try:
        user_id = get_jwt_identity()
        limit = request.args.get('limit', 100, type=int)
        
        sessions = StressSession.query.filter_by(user_id=user_id)\
            .order_by(StressSession.created_at.desc())\
            .limit(limit)\
            .all()
        
        csv_content = data_exporter.export_sessions_csv(sessions)
        
        from flask import Response
        return Response(
            csv_content,
            mimetype='text/csv',
            headers={'Content-Disposition': f'attachment; filename=zentrack_sessions_{datetime.utcnow().strftime("%Y%m%d")}.csv'}
        )
        
    except Exception as e:
        app_logger.error(f"CSV export error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/export/analytics/csv', methods=['GET'])
@jwt_required()
@rate_limit(max_requests=10, window_seconds=60)
def export_analytics_csv():
    """Export user's analytics as CSV"""
    try:
        user_id = get_jwt_identity()
        days = request.args.get('days', 30, type=int)
        
        # Get analytics data
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
        
        analytics_data = {
            'total_sessions': total_sessions,
            'stress_distribution': stress_counts,
            'average_anxiety_score': avg_anxiety_score,
            'timeline': timeline_data,
            'period_days': days
        }
        
        csv_content = data_exporter.export_analytics_csv(analytics_data)
        
        from flask import Response
        return Response(
            csv_content,
            mimetype='text/csv',
            headers={'Content-Disposition': f'attachment; filename=zentrack_analytics_{datetime.utcnow().strftime("%Y%m%d")}.csv'}
        )
        
    except Exception as e:
        app_logger.error(f"Analytics CSV export error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/export/report/text', methods=['GET'])
@jwt_required()
@rate_limit(max_requests=10, window_seconds=60)
def export_text_report():
    """Export comprehensive text report"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get sessions
        sessions = StressSession.query.filter_by(user_id=user_id)\
            .order_by(StressSession.created_at.desc())\
            .limit(50)\
            .all()
        
        # Get analytics
        days = 30
        start_date = datetime.utcnow() - timedelta(days=days)
        recent_sessions = StressSession.query.filter(
            StressSession.user_id == user_id,
            StressSession.created_at >= start_date
        ).all()
        
        total_sessions = len(recent_sessions)
        stress_counts = {'Low': 0, 'Moderate': 0, 'High': 0}
        avg_anxiety_score = 0
        
        for session in recent_sessions:
            stress_counts[session.stress_level] += 1
            avg_anxiety_score += session.anxiety_score or 0
        
        avg_anxiety_score = round(avg_anxiety_score / total_sessions, 2) if total_sessions > 0 else 0
        
        analytics = {
            'total_sessions': total_sessions,
            'stress_distribution': stress_counts,
            'average_anxiety_score': avg_anxiety_score
        }
        
        # Generate report
        report_content = data_exporter.generate_text_report(user, sessions, analytics)
        
        from flask import Response
        return Response(
            report_content,
            mimetype='text/plain',
            headers={'Content-Disposition': f'attachment; filename=zentrack_report_{datetime.utcnow().strftime("%Y%m%d")}.txt'}
        )
        
    except Exception as e:
        app_logger.error(f"Text report export error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/recommendations/<stress_level>', methods=['GET'])
@jwt_required()
def get_detailed_recommendations(stress_level):
    """Get detailed recommendations for stress level"""
    try:
        if stress_level not in ['Low', 'Moderate', 'High']:
            return jsonify({'error': 'Invalid stress level. Must be Low, Moderate, or High'}), 400
        
        recommendations_text = data_exporter.get_recommendations_text(stress_level)
        therapy_rec = stress_detector.recommend_therapy(stress_level)
        
        return jsonify({
            'stress_level': stress_level,
            'recommendations': recommendations_text,
            'therapy_suggestion': therapy_rec,
            'timestamp': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/system/cleanup', methods=['POST'])
@jwt_required()
def cleanup_system():
    """Cleanup expired cache and rate limit entries (Admin only)"""
    try:
        claims = get_jwt()
        if not claims.get('is_admin'):
            return jsonify({'error': 'Admin access required'}), 403
        
        cleanup_result = cleanup_caches()
        app_logger.info(f"System cleanup performed: {cleanup_result}")
        
        return jsonify({
            'message': 'System cleanup completed',
            'result': cleanup_result
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
