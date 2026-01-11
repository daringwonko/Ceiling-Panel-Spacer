"""
JWT Authentication middleware for the API.
"""

import os
import jwt
import hashlib
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Callable
from functools import wraps
from dataclasses import dataclass

# Default secret (should be overridden in production)
JWT_SECRET = os.getenv("JWT_SECRET", "ceiling-panel-calculator-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24


@dataclass
class User:
    """User data structure."""
    id: str
    email: str
    name: str
    organization_id: Optional[str] = None
    role: str = "user"
    permissions: list = None

    def __post_init__(self):
        if self.permissions is None:
            self.permissions = []

    def has_permission(self, permission: str) -> bool:
        """Check if user has a specific permission."""
        if self.role == "admin":
            return True
        return permission in self.permissions

    def to_dict(self) -> Dict[str, Any]:
        """Convert user to dictionary."""
        return {
            "id": self.id,
            "email": self.email,
            "name": self.name,
            "organization_id": self.organization_id,
            "role": self.role,
            "permissions": self.permissions
        }


class JWTManager:
    """JWT token management."""

    def __init__(self, secret: str = None, algorithm: str = JWT_ALGORITHM):
        self.secret = secret or JWT_SECRET
        self.algorithm = algorithm

    def create_token(
        self,
        user: User,
        expires_delta: timedelta = None
    ) -> str:
        """Create a JWT token for a user."""
        if expires_delta is None:
            expires_delta = timedelta(hours=JWT_EXPIRATION_HOURS)

        expire = datetime.utcnow() + expires_delta
        payload = {
            "sub": user.id,
            "email": user.email,
            "name": user.name,
            "org": user.organization_id,
            "role": user.role,
            "exp": expire,
            "iat": datetime.utcnow()
        }

        return jwt.encode(payload, self.secret, algorithm=self.algorithm)

    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify and decode a JWT token."""
        try:
            payload = jwt.decode(token, self.secret, algorithms=[self.algorithm])
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None

    def refresh_token(self, token: str) -> Optional[str]:
        """Refresh an existing token."""
        payload = self.verify_token(token)
        if payload is None:
            return None

        user = User(
            id=payload["sub"],
            email=payload["email"],
            name=payload["name"],
            organization_id=payload.get("org"),
            role=payload.get("role", "user")
        )

        return self.create_token(user)


# Global JWT manager instance
_jwt_manager = JWTManager()


def create_access_token(user: User, expires_delta: timedelta = None) -> str:
    """Create an access token for a user."""
    return _jwt_manager.create_token(user, expires_delta)


def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """Verify a JWT token."""
    return _jwt_manager.verify_token(token)


def get_current_user(request) -> Optional[User]:
    """
    Extract and validate user from request.

    Works with both Flask and FastAPI request objects.
    """
    # Try to get Authorization header
    auth_header = None

    # Flask-style
    if hasattr(request, 'headers'):
        auth_header = request.headers.get('Authorization')

    # FastAPI-style
    if auth_header is None and hasattr(request, 'headers'):
        auth_header = request.headers.get('authorization')

    if not auth_header:
        return None

    # Parse Bearer token
    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != 'bearer':
        return None

    token = parts[1]
    payload = verify_token(token)

    if payload is None:
        return None

    return User(
        id=payload["sub"],
        email=payload["email"],
        name=payload["name"],
        organization_id=payload.get("org"),
        role=payload.get("role", "user")
    )


def require_auth(permissions: list = None):
    """
    Decorator to require authentication for a route.

    Args:
        permissions: Optional list of required permissions

    Usage:
        @require_auth()
        def my_endpoint():
            pass

        @require_auth(permissions=["projects:write"])
        def create_project():
            pass
    """
    if permissions is None:
        permissions = []

    def decorator(func: Callable):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # This is a framework-agnostic decorator
            # The actual request extraction is handled by the framework adapter
            from flask import request, jsonify, g

            user = get_current_user(request)

            if user is None:
                return jsonify({
                    "success": False,
                    "data": None,
                    "error": {
                        "code": "UNAUTHORIZED",
                        "message": "Authentication required"
                    }
                }), 401

            # Check permissions
            for perm in permissions:
                if not user.has_permission(perm):
                    return jsonify({
                        "success": False,
                        "data": None,
                        "error": {
                            "code": "FORBIDDEN",
                            "message": f"Missing permission: {perm}"
                        }
                    }), 403

            # Store user in request context
            g.current_user = user

            return func(*args, **kwargs)

        return wrapper
    return decorator


def hash_password(password: str, salt: str = None) -> tuple:
    """Hash a password with a salt."""
    if salt is None:
        salt = os.urandom(32).hex()

    hashed = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100000
    ).hex()

    return hashed, salt


def verify_password(password: str, hashed: str, salt: str) -> bool:
    """Verify a password against a hash."""
    new_hash, _ = hash_password(password, salt)
    return new_hash == hashed


class APIKeyManager:
    """API Key management for service-to-service auth."""

    def __init__(self):
        self._keys: Dict[str, Dict[str, Any]] = {}

    def create_key(self, name: str, permissions: list = None) -> str:
        """Create a new API key."""
        import secrets
        key = f"cpk_{secrets.token_urlsafe(32)}"
        key_hash = hashlib.sha256(key.encode()).hexdigest()

        self._keys[key_hash] = {
            "name": name,
            "permissions": permissions or [],
            "created_at": datetime.utcnow(),
            "last_used": None
        }

        return key

    def verify_key(self, key: str) -> Optional[Dict[str, Any]]:
        """Verify an API key."""
        key_hash = hashlib.sha256(key.encode()).hexdigest()
        if key_hash in self._keys:
            self._keys[key_hash]["last_used"] = datetime.utcnow()
            return self._keys[key_hash]
        return None

    def revoke_key(self, key: str) -> bool:
        """Revoke an API key."""
        key_hash = hashlib.sha256(key.encode()).hexdigest()
        if key_hash in self._keys:
            del self._keys[key_hash]
            return True
        return False
