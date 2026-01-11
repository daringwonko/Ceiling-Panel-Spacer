"""
Rate limiting middleware for the API.
"""

import time
from typing import Dict, Tuple, Callable, Optional
from functools import wraps
from dataclasses import dataclass, field
from collections import defaultdict
import threading


@dataclass
class RateLimitConfig:
    """Rate limit configuration."""
    requests_per_minute: int = 100
    requests_per_hour: int = 1000
    requests_per_day: int = 10000
    burst_size: int = 20


@dataclass
class RateLimitState:
    """Rate limit state for a single key."""
    minute_count: int = 0
    hour_count: int = 0
    day_count: int = 0
    minute_reset: float = 0
    hour_reset: float = 0
    day_reset: float = 0
    tokens: float = 0
    last_update: float = 0


class RateLimiter:
    """
    Token bucket rate limiter with sliding window.

    Supports:
    - Per-minute, per-hour, per-day limits
    - Token bucket for burst handling
    - Multiple limit tiers (by user role)
    """

    def __init__(self):
        self._state: Dict[str, RateLimitState] = defaultdict(RateLimitState)
        self._configs: Dict[str, RateLimitConfig] = {
            "default": RateLimitConfig(),
            "free": RateLimitConfig(
                requests_per_minute=20,
                requests_per_hour=200,
                requests_per_day=1000,
                burst_size=5
            ),
            "pro": RateLimitConfig(
                requests_per_minute=100,
                requests_per_hour=2000,
                requests_per_day=20000,
                burst_size=30
            ),
            "enterprise": RateLimitConfig(
                requests_per_minute=500,
                requests_per_hour=10000,
                requests_per_day=100000,
                burst_size=100
            ),
        }
        self._lock = threading.Lock()

    def get_config(self, tier: str = "default") -> RateLimitConfig:
        """Get rate limit config for a tier."""
        return self._configs.get(tier, self._configs["default"])

    def set_config(self, tier: str, config: RateLimitConfig):
        """Set rate limit config for a tier."""
        self._configs[tier] = config

    def check_limit(
        self,
        key: str,
        tier: str = "default"
    ) -> Tuple[bool, Dict[str, int]]:
        """
        Check if a request is within rate limits.

        Returns:
            (allowed, headers) - Whether request is allowed and rate limit headers
        """
        with self._lock:
            now = time.time()
            config = self.get_config(tier)
            state = self._state[key]

            # Reset windows if expired
            if now >= state.minute_reset:
                state.minute_count = 0
                state.minute_reset = now + 60

            if now >= state.hour_reset:
                state.hour_count = 0
                state.hour_reset = now + 3600

            if now >= state.day_reset:
                state.day_count = 0
                state.day_reset = now + 86400

            # Refill tokens (token bucket)
            if state.last_update > 0:
                elapsed = now - state.last_update
                refill = elapsed * (config.requests_per_minute / 60.0)
                state.tokens = min(config.burst_size, state.tokens + refill)
            else:
                state.tokens = config.burst_size

            state.last_update = now

            # Check limits
            headers = {
                "X-RateLimit-Limit-Minute": config.requests_per_minute,
                "X-RateLimit-Remaining-Minute": max(0, config.requests_per_minute - state.minute_count),
                "X-RateLimit-Reset-Minute": int(state.minute_reset),
                "X-RateLimit-Limit-Hour": config.requests_per_hour,
                "X-RateLimit-Remaining-Hour": max(0, config.requests_per_hour - state.hour_count),
            }

            # Check if over limit
            if state.minute_count >= config.requests_per_minute:
                headers["Retry-After"] = int(state.minute_reset - now)
                return False, headers

            if state.hour_count >= config.requests_per_hour:
                headers["Retry-After"] = int(state.hour_reset - now)
                return False, headers

            if state.day_count >= config.requests_per_day:
                headers["Retry-After"] = int(state.day_reset - now)
                return False, headers

            # Check token bucket for burst
            if state.tokens < 1:
                headers["Retry-After"] = 1
                return False, headers

            # Request allowed - update counts
            state.minute_count += 1
            state.hour_count += 1
            state.day_count += 1
            state.tokens -= 1

            return True, headers

    def reset(self, key: str):
        """Reset rate limit state for a key."""
        with self._lock:
            if key in self._state:
                del self._state[key]


# Global rate limiter instance
_rate_limiter = RateLimiter()


def get_rate_limit_key(request, user=None) -> str:
    """
    Generate a rate limit key from request.

    Uses user ID if authenticated, otherwise IP address.
    """
    if user:
        return f"user:{user.id}"

    # Get IP address
    ip = None

    # Flask-style
    if hasattr(request, 'remote_addr'):
        ip = request.remote_addr

    # Check for proxied IP
    if hasattr(request, 'headers'):
        ip = request.headers.get('X-Forwarded-For', ip)
        if ip and ',' in ip:
            ip = ip.split(',')[0].strip()

    return f"ip:{ip or 'unknown'}"


def get_user_tier(user) -> str:
    """Get rate limit tier for a user."""
    if user is None:
        return "free"

    # Check user's subscription/role
    role = getattr(user, 'role', 'user')
    if role == "admin":
        return "enterprise"

    # Could check user.subscription_tier here
    return "default"


def rate_limit(tier: str = None):
    """
    Decorator to apply rate limiting to a route.

    Args:
        tier: Optional tier override. If None, determined from user.

    Usage:
        @rate_limit()
        def my_endpoint():
            pass

        @rate_limit(tier="enterprise")
        def heavy_endpoint():
            pass
    """
    def decorator(func: Callable):
        @wraps(func)
        def wrapper(*args, **kwargs):
            from flask import request, jsonify, g

            # Get user if authenticated
            user = getattr(g, 'current_user', None)

            # Determine rate limit key and tier
            key = get_rate_limit_key(request, user)
            effective_tier = tier or get_user_tier(user)

            # Check rate limit
            allowed, headers = _rate_limiter.check_limit(key, effective_tier)

            if not allowed:
                response = jsonify({
                    "success": False,
                    "data": None,
                    "error": {
                        "code": "RATE_LIMITED",
                        "message": "Too many requests. Please try again later."
                    }
                })
                response.status_code = 429
                for header, value in headers.items():
                    response.headers[header] = str(value)
                return response

            # Call the actual function
            response = func(*args, **kwargs)

            # Add rate limit headers to response
            if hasattr(response, 'headers'):
                for header, value in headers.items():
                    response.headers[header] = str(value)

            return response

        return wrapper
    return decorator


class SlidingWindowRateLimiter:
    """
    Alternative sliding window implementation for more precise limiting.
    """

    def __init__(self, window_size: int = 60, max_requests: int = 100):
        self.window_size = window_size
        self.max_requests = max_requests
        self._requests: Dict[str, list] = defaultdict(list)
        self._lock = threading.Lock()

    def check_limit(self, key: str) -> Tuple[bool, int]:
        """
        Check if request is within limit using sliding window.

        Returns:
            (allowed, remaining) - Whether allowed and remaining requests
        """
        with self._lock:
            now = time.time()
            window_start = now - self.window_size

            # Remove expired entries
            self._requests[key] = [
                t for t in self._requests[key]
                if t > window_start
            ]

            current_count = len(self._requests[key])

            if current_count >= self.max_requests:
                return False, 0

            # Add this request
            self._requests[key].append(now)

            return True, self.max_requests - current_count - 1
