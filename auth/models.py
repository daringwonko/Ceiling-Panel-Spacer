"""
User and Organization models for multi-tenancy.
"""

from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
import uuid
import hashlib
import secrets


class UserRole(str, Enum):
    """User roles within an organization."""
    OWNER = "owner"
    ADMIN = "admin"
    EDITOR = "editor"
    VIEWER = "viewer"


class SubscriptionTier(str, Enum):
    """Subscription tiers."""
    FREE = "free"
    PRO = "pro"
    ENTERPRISE = "enterprise"


@dataclass
class User:
    """User model."""
    id: str = field(default_factory=lambda: f"user_{uuid.uuid4().hex[:12]}")
    email: str = ""
    name: str = ""
    password_hash: str = ""
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    email_verified: bool = False
    is_active: bool = True
    profile_image_url: Optional[str] = None
    settings: Dict[str, Any] = field(default_factory=dict)

    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password using SHA-256 with salt."""
        salt = secrets.token_hex(16)
        hash_obj = hashlib.sha256(f"{salt}{password}".encode())
        return f"{salt}:{hash_obj.hexdigest()}"

    def verify_password(self, password: str) -> bool:
        """Verify a password against the stored hash."""
        if ':' not in self.password_hash:
            return False
        salt, stored_hash = self.password_hash.split(':', 1)
        hash_obj = hashlib.sha256(f"{salt}{password}".encode())
        return hash_obj.hexdigest() == stored_hash

    def to_dict(self, include_private: bool = False) -> Dict[str, Any]:
        """Convert to dictionary."""
        data = {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'created_at': self.created_at.isoformat(),
            'email_verified': self.email_verified,
            'is_active': self.is_active,
            'profile_image_url': self.profile_image_url,
        }
        if include_private:
            data['settings'] = self.settings
        return data


@dataclass
class Organization:
    """Organization model for multi-tenancy."""
    id: str = field(default_factory=lambda: f"org_{uuid.uuid4().hex[:12]}")
    name: str = ""
    slug: str = ""
    owner_id: str = ""
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    subscription_tier: SubscriptionTier = SubscriptionTier.FREE
    settings: Dict[str, Any] = field(default_factory=dict)
    logo_url: Optional[str] = None
    billing_email: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'slug': self.slug,
            'owner_id': self.owner_id,
            'created_at': self.created_at.isoformat(),
            'subscription_tier': self.subscription_tier.value,
            'logo_url': self.logo_url,
        }


@dataclass
class Membership:
    """Membership linking users to organizations."""
    id: str = field(default_factory=lambda: f"mem_{uuid.uuid4().hex[:12]}")
    user_id: str = ""
    organization_id: str = ""
    role: UserRole = UserRole.VIEWER
    joined_at: datetime = field(default_factory=datetime.utcnow)
    invited_by: Optional[str] = None
    is_active: bool = True

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'organization_id': self.organization_id,
            'role': self.role.value,
            'joined_at': self.joined_at.isoformat(),
            'is_active': self.is_active,
        }


@dataclass
class APIKey:
    """API Key for programmatic access."""
    id: str = field(default_factory=lambda: f"key_{uuid.uuid4().hex[:12]}")
    user_id: str = ""
    organization_id: Optional[str] = None
    name: str = ""
    key_hash: str = ""
    prefix: str = ""  # First 8 chars of key for identification
    created_at: datetime = field(default_factory=datetime.utcnow)
    last_used_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    scopes: List[str] = field(default_factory=list)
    is_active: bool = True

    @staticmethod
    def generate_key() -> tuple:
        """Generate a new API key. Returns (full_key, prefix, hash)."""
        key = f"cpk_{secrets.token_urlsafe(32)}"
        prefix = key[:12]
        key_hash = hashlib.sha256(key.encode()).hexdigest()
        return key, prefix, key_hash

    def verify_key(self, key: str) -> bool:
        """Verify an API key."""
        return hashlib.sha256(key.encode()).hexdigest() == self.key_hash

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary (never includes the actual key)."""
        return {
            'id': self.id,
            'name': self.name,
            'prefix': self.prefix,
            'created_at': self.created_at.isoformat(),
            'last_used_at': self.last_used_at.isoformat() if self.last_used_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'scopes': self.scopes,
            'is_active': self.is_active,
        }


@dataclass
class Session:
    """User session."""
    id: str = field(default_factory=lambda: f"sess_{uuid.uuid4().hex[:16]}")
    user_id: str = ""
    token_hash: str = ""
    created_at: datetime = field(default_factory=datetime.utcnow)
    expires_at: datetime = field(default_factory=datetime.utcnow)
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    is_active: bool = True

    @staticmethod
    def generate_token() -> tuple:
        """Generate session token. Returns (token, hash)."""
        token = secrets.token_urlsafe(48)
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        return token, token_hash


@dataclass
class Invitation:
    """Organization invitation."""
    id: str = field(default_factory=lambda: f"inv_{uuid.uuid4().hex[:12]}")
    organization_id: str = ""
    email: str = ""
    role: UserRole = UserRole.VIEWER
    invited_by: str = ""
    token: str = field(default_factory=lambda: secrets.token_urlsafe(32))
    created_at: datetime = field(default_factory=datetime.utcnow)
    expires_at: datetime = field(default_factory=datetime.utcnow)
    accepted_at: Optional[datetime] = None
    is_active: bool = True

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            'id': self.id,
            'organization_id': self.organization_id,
            'email': self.email,
            'role': self.role.value,
            'created_at': self.created_at.isoformat(),
            'expires_at': self.expires_at.isoformat(),
            'accepted': self.accepted_at is not None,
        }
