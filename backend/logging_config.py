"""
ZenTrack - Logging and Monitoring Configuration
Comprehensive logging system for debugging and monitoring
"""

import logging
import os
from datetime import datetime
from logging.handlers import RotatingFileHandler

def setup_logging(app):
    """
    Setup comprehensive logging for the application
    
    Args:
        app: Flask application instance
    """
    # Create logs directory if it doesn't exist
    log_dir = os.path.join(os.path.dirname(__file__), 'logs')
    os.makedirs(log_dir, exist_ok=True)
    
    # Configure log format
    log_format = logging.Formatter(
        '[%(asctime)s] %(levelname)s in %(module)s: %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # Main application log
    app_log_file = os.path.join(log_dir, 'zentrack.log')
    app_handler = RotatingFileHandler(
        app_log_file,
        maxBytes=10 * 1024 * 1024,  # 10 MB
        backupCount=5
    )
    app_handler.setFormatter(log_format)
    app_handler.setLevel(logging.INFO)
    
    # Error log
    error_log_file = os.path.join(log_dir, 'errors.log')
    error_handler = RotatingFileHandler(
        error_log_file,
        maxBytes=10 * 1024 * 1024,  # 10 MB
        backupCount=5
    )
    error_handler.setFormatter(log_format)
    error_handler.setLevel(logging.ERROR)
    
    # Security log
    security_log_file = os.path.join(log_dir, 'security.log')
    security_handler = RotatingFileHandler(
        security_log_file,
        maxBytes=10 * 1024 * 1024,  # 10 MB
        backupCount=5
    )
    security_handler.setFormatter(log_format)
    security_handler.setLevel(logging.INFO)
    
    # Console handler for development
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(log_format)
    console_handler.setLevel(logging.DEBUG if app.debug else logging.INFO)
    
    # Add handlers to app logger
    app.logger.addHandler(app_handler)
    app.logger.addHandler(error_handler)
    app.logger.addHandler(console_handler)
    app.logger.setLevel(logging.DEBUG if app.debug else logging.INFO)
    
    # Create separate security logger
    security_logger = logging.getLogger('security')
    security_logger.addHandler(security_handler)
    security_logger.setLevel(logging.INFO)
    
    app.logger.info('=' * 60)
    app.logger.info('ZenTrack Backend Started')
    app.logger.info(f'Environment: {"Development" if app.debug else "Production"}')
    app.logger.info(f'Timestamp: {datetime.utcnow().isoformat()}')
    app.logger.info('=' * 60)
    
    return app.logger, security_logger


def log_api_request(logger, request, user_id=None):
    """
    Log API request details
    
    Args:
        logger: Logger instance
        request: Flask request object
        user_id: Optional user ID
    """
    logger.info(
        f"API Request: {request.method} {request.path} | "
        f"User: {user_id or 'Anonymous'} | "
        f"IP: {request.remote_addr}"
    )


def log_security_event(security_logger, event_type, user_id, status, details=''):
    """
    Log security-related events
    
    Args:
        security_logger: Security logger instance
        event_type: Type of event (login, logout, etc.)
        user_id: User ID
        status: Success or Failure
        details: Additional details
    """
    security_logger.info(
        f"Security Event: {event_type} | "
        f"User: {user_id} | "
        f"Status: {status} | "
        f"Details: {details}"
    )


def log_ml_prediction(logger, user_id, stress_level, confidence, anxiety_score):
    """
    Log ML model predictions
    
    Args:
        logger: Logger instance
        user_id: User ID
        stress_level: Predicted stress level
        confidence: Model confidence
        anxiety_score: Anxiety score
    """
    logger.info(
        f"ML Prediction: User {user_id} | "
        f"Stress: {stress_level} | "
        f"Confidence: {confidence}% | "
        f"Anxiety Score: {anxiety_score}"
    )


def log_error(logger, error, context=''):
    """
    Log error with context
    
    Args:
        logger: Logger instance
        error: Exception object
        context: Additional context
    """
    logger.error(
        f"Error: {str(error)} | "
        f"Type: {type(error).__name__} | "
        f"Context: {context}",
        exc_info=True
    )
