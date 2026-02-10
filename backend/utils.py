"""
ZenTrack - Performance and Security Utilities
Rate limiting, caching, and performance optimization
"""

from functools import wraps
from datetime import datetime, timedelta
import time

# Simple in-memory cache
_cache = {}
_rate_limit_store = {}

class SimpleCache:
    """Simple in-memory cache with TTL support"""
    
    def __init__(self):
        self.cache = {}
    
    def get(self, key):
        """Get value from cache if not expired"""
        if key in self.cache:
            value, expiry = self.cache[key]
            if datetime.utcnow() < expiry:
                return value
            else:
                del self.cache[key]
        return None
    
    def set(self, key, value, ttl_seconds=300):
        """Set value in cache with TTL"""
        expiry = datetime.utcnow() + timedelta(seconds=ttl_seconds)
        self.cache[key] = (value, expiry)
    
    def delete(self, key):
        """Delete key from cache"""
        if key in self.cache:
            del self.cache[key]
    
    def clear(self):
        """Clear entire cache"""
        self.cache.clear()
    
    def cleanup(self):
        """Remove expired entries"""
        now = datetime.utcnow()
        expired_keys = [k for k, (_, expiry) in self.cache.items() if now >= expiry]
        for key in expired_keys:
            del self.cache[key]
        return len(expired_keys)


# Global cache instance
cache = SimpleCache()


def cached(ttl_seconds=300):
    """
    Decorator for caching function results
    
    Args:
        ttl_seconds: Time to live in seconds
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Create cache key from function name and arguments
            cache_key = f"{func.__name__}:{str(args)}:{str(kwargs)}"
            
            # Try to get from cache
            result = cache.get(cache_key)
            if result is not None:
                return result
            
            # Execute function and cache result
            result = func(*args, **kwargs)
            cache.set(cache_key, result, ttl_seconds)
            return result
        
        return wrapper
    return decorator


class RateLimiter:
    """Simple rate limiter using sliding window"""
    
    def __init__(self):
        self.requests = {}
    
    def is_allowed(self, key, max_requests=100, window_seconds=60):
        """
        Check if request is allowed under rate limit
        
        Args:
            key: Unique identifier (e.g., user_id or IP)
            max_requests: Maximum requests allowed
            window_seconds: Time window in seconds
            
        Returns:
            bool: True if allowed, False if rate limited
        """
        now = time.time()
        window_start = now - window_seconds
        
        # Initialize or clean old requests
        if key not in self.requests:
            self.requests[key] = []
        
        # Remove old requests outside window
        self.requests[key] = [req_time for req_time in self.requests[key] if req_time > window_start]
        
        # Check if under limit
        if len(self.requests[key]) < max_requests:
            self.requests[key].append(now)
            return True
        
        return False
    
    def get_remaining(self, key, max_requests=100, window_seconds=60):
        """Get remaining requests in current window"""
        now = time.time()
        window_start = now - window_seconds
        
        if key not in self.requests:
            return max_requests
        
        # Count requests in current window
        current_requests = [req_time for req_time in self.requests[key] if req_time > window_start]
        return max(0, max_requests - len(current_requests))
    
    def reset(self, key):
        """Reset rate limit for a key"""
        if key in self.requests:
            del self.requests[key]
    
    def cleanup(self):
        """Remove expired entries"""
        now = time.time()
        # Remove keys with no recent requests (older than 1 hour)
        expired_keys = []
        for key, requests in self.requests.items():
            if not requests or max(requests) < now - 3600:
                expired_keys.append(key)
        
        for key in expired_keys:
            del self.requests[key]
        
        return len(expired_keys)


# Global rate limiter instance
rate_limiter = RateLimiter()


def rate_limit(max_requests=100, window_seconds=60):
    """
    Decorator for rate limiting endpoints
    
    Args:
        max_requests: Maximum requests allowed
        window_seconds: Time window in seconds
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            from flask import request, jsonify
            from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
            
            # Try to get user ID from JWT
            try:
                verify_jwt_in_request(optional=True)
                user_id = get_jwt_identity()
                rate_key = f"user:{user_id}" if user_id else f"ip:{request.remote_addr}"
            except:
                rate_key = f"ip:{request.remote_addr}"
            
            # Check rate limit
            if not rate_limiter.is_allowed(rate_key, max_requests, window_seconds):
                remaining = rate_limiter.get_remaining(rate_key, max_requests, window_seconds)
                return jsonify({
                    'error': 'Rate limit exceeded',
                    'message': f'Too many requests. Please try again later.',
                    'remaining': remaining,
                    'window_seconds': window_seconds
                }), 429
            
            return func(*args, **kwargs)
        
        return wrapper
    return decorator


def validate_input(required_fields):
    """
    Decorator to validate required fields in request JSON
    
    Args:
        required_fields: List of required field names
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            from flask import request, jsonify
            
            data = request.get_json()
            if not data:
                return jsonify({'error': 'Request body is required'}), 400
            
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                return jsonify({
                    'error': 'Missing required fields',
                    'missing_fields': missing_fields
                }), 400
            
            return func(*args, **kwargs)
        
        return wrapper
    return decorator


def measure_time(func):
    """Decorator to measure function execution time"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()
        execution_time = round((end_time - start_time) * 1000, 2)  # Convert to ms
        
        # Log execution time
        print(f"⏱️  {func.__name__} executed in {execution_time}ms")
        
        return result
    
    return wrapper


# Periodic cleanup task
def cleanup_caches():
    """Clean up expired cache and rate limit entries"""
    cache_cleaned = cache.cleanup()
    rate_limit_cleaned = rate_limiter.cleanup()
    
    return {
        'cache_entries_removed': cache_cleaned,
        'rate_limit_entries_removed': rate_limit_cleaned,
        'timestamp': datetime.utcnow().isoformat()
    }
