#!/usr/bin/env python3
"""
IoT Security and Authentication Module
Implements secure authentication, authorization, and encryption for IoT endpoints.
"""

import hashlib
import hmac
import secrets
import jwt
import time
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from typing import Dict, List, Optional, Any, Tuple
from enum import Enum
import json
import sqlite3
from pathlib import Path
import logging

from flask import request, jsonify, g
from functools import wraps


class SecurityLevel(Enum):
    """Security levels for different operations"""
    PUBLIC = "public"          # No authentication required
    BASIC = "basic"           # API key authentication
    SECURE = "secure"         # JWT token authentication
    ADMIN = "admin"           # Administrative access only


class UserRole(Enum):
    """User roles for authorization"""
    GUEST = "guest"
    OPERATOR = "operator"
    MAINTENANCE = "maintenance"
    ADMINISTRATOR = "administrator"


@dataclass
class APIKey:
    """API key for basic authentication"""
    key_id: str
    key_hash: str
    name: str
    role: UserRole
    permissions: List[str]
    created_at: datetime
    expires_at: Optional[datetime]
    is_active: bool
    rate_limit: int  # requests per minute

    def to_dict(self) -> Dict:
        return {
            'key_id': self.key_id,
            'name': self.name,
            'role': self.role.value,
            'permissions': self.permissions,
            'created_at': self.created_at.isoformat(),
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'is_active': self.is_active,
            'rate_limit': self.rate_limit
        }


@dataclass
class JWTToken:
    """JWT token data"""
    token_id: str
    user_id: str
    role: UserRole
    permissions: List[str]
    issued_at: datetime
    expires_at: datetime
    is_revoked: bool

    def to_dict(self) -> Dict:
        return {
            'token_id': self.token_id,
            'user_id': self.user_id,
            'role': self.role.value,
            'permissions': self.permissions,
            'issued_at': self.issued_at.isoformat(),
            'expires_at': self.expires_at.isoformat(),
            'is_revoked': self.is_revoked
        }


@dataclass
class SecurityEvent:
    """Security event log"""
    event_id: str
    timestamp: datetime
    event_type: str
    user_id: Optional[str]
    ip_address: str
    user_agent: str
    resource: str
    action: str
    success: bool
    details: Dict[str, Any]

    def to_dict(self) -> Dict:
        return {
            'event_id': self.event_id,
            'timestamp': self.timestamp.isoformat(),
            'event_type': self.event_type,
            'user_id': self.user_id,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'resource': self.resource,
            'action': self.action,
            'success': self.success,
            'details': self.details
        }


class SecurityDatabase:
    """Database for security-related data"""

    def __init__(self, db_path: str = "security.db"):
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        """Initialize security database"""
        with sqlite3.connect(self.db_path) as conn:
            # API Keys table
            conn.execute('''
                CREATE TABLE IF NOT EXISTS api_keys (
                    key_id TEXT PRIMARY KEY,
                    key_hash TEXT NOT NULL,
                    name TEXT NOT NULL,
                    role TEXT NOT NULL,
                    permissions TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    expires_at TEXT,
                    is_active INTEGER NOT NULL,
                    rate_limit INTEGER NOT NULL,
                    last_used TEXT,
                    use_count INTEGER DEFAULT 0
                )
            ''')

            # JWT Tokens table
            conn.execute('''
                CREATE TABLE IF NOT EXISTS jwt_tokens (
                    token_id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    role TEXT NOT NULL,
                    permissions TEXT NOT NULL,
                    issued_at TEXT NOT NULL,
                    expires_at TEXT NOT NULL,
                    is_revoked INTEGER NOT NULL,
                    device_info TEXT
                )
            ''')

            # Security events table
            conn.execute('''
                CREATE TABLE IF NOT EXISTS security_events (
                    event_id TEXT PRIMARY KEY,
                    timestamp TEXT NOT NULL,
                    event_type TEXT NOT NULL,
                    user_id TEXT,
                    ip_address TEXT NOT NULL,
                    user_agent TEXT,
                    resource TEXT NOT NULL,
                    action TEXT NOT NULL,
                    success INTEGER NOT NULL,
                    details TEXT
                )
            ''')

            # Rate limiting table
            conn.execute('''
                CREATE TABLE IF NOT EXISTS rate_limits (
                    identifier TEXT PRIMARY KEY,
                    requests INTEGER NOT NULL,
                    window_start TEXT NOT NULL
                )
            ''')

            # Create indexes
            conn.execute('CREATE INDEX IF NOT EXISTS idx_api_keys_name ON api_keys(name)')
            conn.execute('CREATE INDEX IF NOT EXISTS idx_security_events_timestamp ON security_events(timestamp)')
            conn.execute('CREATE INDEX IF NOT EXISTS idx_security_events_user ON security_events(user_id)')

    def save_api_key(self, api_key: APIKey):
        """Save API key"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute('''
                INSERT OR REPLACE INTO api_keys
                (key_id, key_hash, name, role, permissions, created_at, expires_at, is_active, rate_limit)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                api_key.key_id,
                api_key.key_hash,
                api_key.name,
                api_key.role.value,
                json.dumps(api_key.permissions),
                api_key.created_at.isoformat(),
                api_key.expires_at.isoformat() if api_key.expires_at else None,
                1 if api_key.is_active else 0,
                api_key.rate_limit
            ))

    def get_api_key(self, key_id: str) -> Optional[APIKey]:
        """Get API key by ID"""
        with sqlite3.connect(self.db_path) as conn:
            row = conn.execute('SELECT * FROM api_keys WHERE key_id = ?', (key_id,)).fetchone()

        if row:
            return APIKey(
                key_id=row[0],
                key_hash=row[1],
                name=row[2],
                role=UserRole(row[3]),
                permissions=json.loads(row[4]),
                created_at=datetime.fromisoformat(row[5]),
                expires_at=datetime.fromisoformat(row[6]) if row[6] else None,
                is_active=bool(row[7]),
                rate_limit=row[8]
            )
        return None

    def validate_api_key(self, provided_key: str) -> Optional[APIKey]:
        """Validate API key and return key data"""
        key_hash = hashlib.sha256(provided_key.encode()).hexdigest()

        with sqlite3.connect(self.db_path) as conn:
            row = conn.execute('SELECT * FROM api_keys WHERE key_hash = ? AND is_active = 1',
                             (key_hash,)).fetchone()

        if row:
            api_key = APIKey(
                key_id=row[0],
                key_hash=row[1],
                name=row[2],
                role=UserRole(row[3]),
                permissions=json.loads(row[4]),
                created_at=datetime.fromisoformat(row[5]),
                expires_at=datetime.fromisoformat(row[6]) if row[6] else None,
                is_active=bool(row[7]),
                rate_limit=row[8]
            )

            # Check expiration
            if api_key.expires_at and datetime.now() > api_key.expires_at:
                return None

            # Update last used
            conn.execute('UPDATE api_keys SET last_used = ?, use_count = use_count + 1 WHERE key_id = ?',
                        (datetime.now().isoformat(), api_key.key_id))

            return api_key
        return None

    def save_jwt_token(self, token: JWTToken):
        """Save JWT token"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute('''
                INSERT OR REPLACE INTO jwt_tokens
                (token_id, user_id, role, permissions, issued_at, expires_at, is_revoked, device_info)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                token.token_id,
                token.user_id,
                token.role.value,
                json.dumps(token.permissions),
                token.issued_at.isoformat(),
                token.expires_at.isoformat(),
                1 if token.is_revoked else 0,
                json.dumps(token.__dict__.get('device_info', {}))
            ))

    def validate_jwt_token(self, token_id: str) -> Optional[JWTToken]:
        """Validate JWT token"""
        with sqlite3.connect(self.db_path) as conn:
            row = conn.execute('SELECT * FROM jwt_tokens WHERE token_id = ? AND is_revoked = 0',
                             (token_id,)).fetchone()

        if row:
            token = JWTToken(
                token_id=row[0],
                user_id=row[1],
                role=UserRole(row[2]),
                permissions=json.loads(row[3]),
                issued_at=datetime.fromisoformat(row[4]),
                expires_at=datetime.fromisoformat(row[5]),
                is_revoked=bool(row[6])
            )

            # Check expiration
            if datetime.now() > token.expires_at:
                return None

            return token
        return None

    def revoke_jwt_token(self, token_id: str):
        """Revoke JWT token"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute('UPDATE jwt_tokens SET is_revoked = 1 WHERE token_id = ?', (token_id,))

    def log_security_event(self, event: SecurityEvent):
        """Log security event"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute('''
                INSERT INTO security_events
                (event_id, timestamp, event_type, user_id, ip_address, user_agent, resource, action, success, details)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                event.event_id,
                event.timestamp.isoformat(),
                event.event_type,
                event.user_id,
                event.ip_address,
                event.user_agent,
                event.resource,
                event.action,
                1 if event.success else 0,
                json.dumps(event.details)
            ))

    def check_rate_limit(self, identifier: str, max_requests: int, window_minutes: int = 1) -> bool:
        """Check if request is within rate limit"""
        now = datetime.now()
        window_start = now - timedelta(minutes=window_minutes)

        with sqlite3.connect(self.db_path) as conn:
            # Clean old entries
            conn.execute('DELETE FROM rate_limits WHERE window_start < ?',
                        (window_start.isoformat(),))

            # Get current count
            row = conn.execute('SELECT requests FROM rate_limits WHERE identifier = ?',
                             (identifier,)).fetchone()

            current_requests = row[0] if row else 0

            if current_requests >= max_requests:
                return False

            # Update or insert
            conn.execute('''
                INSERT OR REPLACE INTO rate_limits (identifier, requests, window_start)
                VALUES (?, ?, ?)
            ''', (identifier, current_requests + 1, now.isoformat()))

            return True


class IoTSecurityManager:
    """Main IoT security manager"""

    def __init__(self, jwt_secret: str = None, db_path: str = "security.db"):
        self.db = SecurityDatabase(db_path)
        self.jwt_secret = jwt_secret or secrets.token_hex(32)
        self.logger = logging.getLogger('IoTSecurity')
        self.logger.setLevel(logging.INFO)

        # Create default API keys
        self._create_default_keys()

    def _create_default_keys(self):
        """Create default API keys for development"""
        default_keys = [
            {
                'name': 'admin_key',
                'role': UserRole.ADMINISTRATOR,
                'permissions': ['*'],
                'rate_limit': 1000
            },
            {
                'name': 'operator_key',
                'role': UserRole.OPERATOR,
                'permissions': ['read:sensors', 'read:maintenance', 'read:energy', 'write:commands'],
                'rate_limit': 100
            },
            {
                'name': 'maintenance_key',
                'role': UserRole.MAINTENANCE,
                'permissions': ['read:sensors', 'read:maintenance', 'write:maintenance'],
                'rate_limit': 50
            },
            {
                'name': 'guest_key',
                'role': UserRole.GUEST,
                'permissions': ['read:sensors'],
                'rate_limit': 10
            }
        ]

        for key_data in default_keys:
            if not self.db.get_api_key(f"{key_data['name']}_id"):
                api_key = self.create_api_key(
                    name=key_data['name'],
                    role=key_data['role'],
                    permissions=key_data['permissions'],
                    rate_limit=key_data['rate_limit']
                )
                print(f"Created default API key: {key_data['name']} - Key: {api_key}")

    def create_api_key(self, name: str, role: UserRole, permissions: List[str],
                      expires_in_days: int = 365, rate_limit: int = 100) -> str:
        """Create a new API key"""
        key_id = f"{name}_{secrets.token_hex(4)}"
        raw_key = secrets.token_hex(32)
        key_hash = hashlib.sha256(raw_key.encode()).hexdigest()

        expires_at = datetime.now() + timedelta(days=expires_in_days)

        api_key = APIKey(
            key_id=key_id,
            key_hash=key_hash,
            name=name,
            role=role,
            permissions=permissions,
            created_at=datetime.now(),
            expires_at=expires_at,
            is_active=True,
            rate_limit=rate_limit
        )

        self.db.save_api_key(api_key)
        self.logger.info(f"Created API key: {name} ({role.value})")

        return raw_key  # Return the actual key (only shown once)

    def authenticate_api_key(self, provided_key: str) -> Optional[APIKey]:
        """Authenticate using API key"""
        return self.db.validate_api_key(provided_key)

    def create_jwt_token(self, user_id: str, role: UserRole, permissions: List[str],
                        expires_in_hours: int = 24, device_info: Dict = None) -> str:
        """Create JWT token"""
        token_id = secrets.token_hex(16)
        issued_at = datetime.now()
        expires_at = issued_at + timedelta(hours=expires_in_hours)

        # Create JWT payload
        payload = {
            'token_id': token_id,
            'user_id': user_id,
            'role': role.value,
            'permissions': permissions,
            'iat': int(issued_at.timestamp()),
            'exp': int(expires_at.timestamp())
        }

        token = jwt.encode(payload, self.jwt_secret, algorithm='HS256')

        # Save token data
        jwt_token = JWTToken(
            token_id=token_id,
            user_id=user_id,
            role=role,
            permissions=permissions,
            issued_at=issued_at,
            expires_at=expires_at,
            is_revoked=False
        )
        setattr(jwt_token, 'device_info', device_info or {})
        self.db.save_jwt_token(jwt_token)

        self.logger.info(f"Created JWT token for user: {user_id}")
        return token

    def validate_jwt_token(self, token: str) -> Optional[JWTToken]:
        """Validate JWT token"""
        try:
            # Decode token
            payload = jwt.decode(token, self.jwt_secret, algorithms=['HS256'])
            token_id = payload['token_id']

            # Check if token exists and is valid in database
            token_data = self.db.validate_jwt_token(token_id)
            if token_data:
                return token_data

        except jwt.ExpiredSignatureError:
            self.logger.warning("JWT token expired")
        except jwt.InvalidTokenError:
            self.logger.warning("Invalid JWT token")
        except Exception as e:
            self.logger.error(f"JWT validation error: {e}")

        return None

    def revoke_jwt_token(self, token: str):
        """Revoke JWT token"""
        try:
            payload = jwt.decode(token, self.jwt_secret, algorithms=['HS256'], verify_exp=False)
            token_id = payload['token_id']
            self.db.revoke_jwt_token(token_id)
            self.logger.info(f"Revoked JWT token: {token_id}")
        except Exception as e:
            self.logger.error(f"Error revoking JWT token: {e}")

    def check_permission(self, user_permissions: List[str], required_permission: str) -> bool:
        """Check if user has required permission"""
        if '*' in user_permissions:
            return True

        # Check exact match
        if required_permission in user_permissions:
            return True

        # Check wildcard permissions (e.g., 'read:*' covers 'read:sensors')
        for perm in user_permissions:
            if perm.endswith('*'):
                prefix = perm[:-1]
                if required_permission.startswith(prefix):
                    return True

        return False

    def log_security_event(self, event_type: str, user_id: Optional[str], resource: str,
                          action: str, success: bool, details: Dict = None):
        """Log security event"""
        event = SecurityEvent(
            event_id=secrets.token_hex(8),
            timestamp=datetime.now(),
            event_type=event_type,
            user_id=user_id,
            ip_address=request.remote_addr if request else 'unknown',
            user_agent=request.headers.get('User-Agent', 'unknown') if request else 'unknown',
            resource=resource,
            action=action,
            success=success,
            details=details or {}
        )

        self.db.log_security_event(event)

        if not success:
            self.logger.warning(f"Security event: {event_type} - {action} on {resource} by {user_id}")

    def check_rate_limit(self, identifier: str, max_requests: int, window_minutes: int = 1) -> bool:
        """Check rate limiting"""
        return self.db.check_rate_limit(identifier, max_requests, window_minutes)


# Flask decorators for authentication and authorization
def require_auth(security_level: SecurityLevel = SecurityLevel.SECURE):
    """Decorator to require authentication"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            security_manager = getattr(g, 'security_manager', None)
            if not security_manager:
                return jsonify({'success': False, 'error': 'Security manager not initialized'}), 500

            auth_header = request.headers.get('Authorization', '')
            api_key = request.headers.get('X-API-Key')

            user_data = None

            # Try API key authentication
            if api_key:
                user_data = security_manager.authenticate_api_key(api_key)
                if user_data:
                    auth_method = 'api_key'

            # Try JWT authentication
            elif auth_header.startswith('Bearer '):
                token = auth_header[7:]  # Remove 'Bearer ' prefix
                user_data = security_manager.validate_jwt_token(token)
                if user_data:
                    auth_method = 'jwt'

            if not user_data:
                security_manager.log_security_event(
                    'authentication_failed',
                    None,
                    request.path,
                    'access',
                    False,
                    {'auth_header': bool(auth_header), 'api_key': bool(api_key)}
                )
                return jsonify({'success': False, 'error': 'Authentication required'}), 401

            # Check rate limiting
            identifier = user_data.key_id if hasattr(user_data, 'key_id') else user_data.token_id
            rate_limit = getattr(user_data, 'rate_limit', 100)

            if not security_manager.check_rate_limit(identifier, rate_limit):
                security_manager.log_security_event(
                    'rate_limit_exceeded',
                    getattr(user_data, 'name', user_data.user_id),
                    request.path,
                    'access',
                    False
                )
                return jsonify({'success': False, 'error': 'Rate limit exceeded'}), 429

            # Store user data in Flask g object
            g.user = user_data
            g.auth_method = auth_method

            security_manager.log_security_event(
                'authentication_success',
                getattr(user_data, 'name', user_data.user_id),
                request.path,
                'access',
                True,
                {'method': auth_method}
            )

            return f(*args, **kwargs)
        return decorated_function
    return decorator


def require_permission(permission: str):
    """Decorator to require specific permission"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            security_manager = getattr(g, 'security_manager', None)
            if not security_manager:
                return jsonify({'success': False, 'error': 'Security manager not initialized'}), 500

            user = getattr(g, 'user', None)
            if not user:
                return jsonify({'success': False, 'error': 'Authentication required'}), 401

            permissions = user.permissions

            if not security_manager.check_permission(permissions, permission):
                security_manager.log_security_event(
                    'authorization_failed',
                    getattr(user, 'name', user.user_id),
                    request.path,
                    'access',
                    False,
                    {'required_permission': permission, 'user_permissions': permissions}
                )
                return jsonify({'success': False, 'error': 'Insufficient permissions'}), 403

            return f(*args, **kwargs)
        return decorated_function
    return decorator


# Example usage and testing
if __name__ == "__main__":
    # Initialize security manager
    security = IoTSecurityManager()

    print("=== IoT Security Manager Demo ===")

    # Create a test API key
    test_key = security.create_api_key(
        name="test_sensor",
        role=UserRole.OPERATOR,
        permissions=["read:sensors", "write:sensor_data"],
        rate_limit=50
    )
    print(f"Created test API key: {test_key}")

    # Test API key authentication
    authenticated_user = security.authenticate_api_key(test_key)
    if authenticated_user:
        print(f"API key authentication successful: {authenticated_user.name} ({authenticated_user.role.value})")

        # Test permission checking
        has_read_permission = security.check_permission(authenticated_user.permissions, "read:sensors")
        has_admin_permission = security.check_permission(authenticated_user.permissions, "admin:users")

        print(f"Has read:sensors permission: {has_read_permission}")
        print(f"Has admin:users permission: {has_admin_permission}")
    else:
        print("API key authentication failed")

    # Create JWT token
    jwt_token = security.create_jwt_token(
        user_id="test_user",
        role=UserRole.OPERATOR,
        permissions=["read:sensors", "write:commands"]
    )
    print(f"Created JWT token: {jwt_token[:50]}...")

    # Test JWT validation
    validated_token = security.validate_jwt_token(jwt_token)
    if validated_token:
        print(f"JWT validation successful: {validated_token.user_id} ({validated_token.role.value})")
    else:
        print("JWT validation failed")

    print("Security manager demo completed")