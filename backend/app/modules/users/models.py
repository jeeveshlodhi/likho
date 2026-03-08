from datetime import datetime
from sqlalchemy import (
    Boolean, Column, String, Text, BigInteger, DateTime,
    Enum as SQLEnum, ForeignKey, Index
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, INET
import uuid

from app.core.base import Base
from .enums import PlanType, ThemeType, AuthProvider, DeviceType


class User(Base):
    """Core user account model"""
    __tablename__ = "users"

    # Primary key
    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Basic information
    email = Column(String(255), unique=True, index=True, nullable=False)
    email_verified = Column(Boolean, default=False)
    username = Column(String(100), unique=True, nullable=True, index=True)
    full_name = Column(String(255), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    bio = Column(Text, nullable=True)

    # User preferences
    timezone = Column(String(50), default="UTC")
    locale = Column(String(10), default="en")
    theme = Column(SQLEnum(ThemeType), default=ThemeType.SYSTEM)

    # Subscription & storage
    plan = Column(SQLEnum(PlanType), default=PlanType.FREE)
    plan_expires_at = Column(DateTime(timezone=True), nullable=True)
    storage_used = Column(BigInteger, default=0)  # in bytes
    storage_limit = Column(BigInteger, default=1073741824)  # 1GB default

    # Account status
    is_active = Column(Boolean, default=True)
    last_seen_at = Column(DateTime(timezone=True), nullable=True)
    onboarded_at = Column(DateTime(timezone=True), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime(timezone=True), nullable=True)  # soft delete

    # Relationships
    auth_methods = relationship("UserAuth", back_populates="user", cascade="all, delete-orphan")
    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan")
    api_keys = relationship("APIKey", back_populates="user", cascade="all, delete-orphan")
    preferences = relationship("UserPreference", back_populates="user", cascade="all, delete-orphan")
    devices = relationship("DeviceRegistry", back_populates="user", cascade="all, delete-orphan")

    # Indexes
    __table_args__ = (
        Index("idx_users_email", "email"),
        Index("idx_users_deleted_at", "deleted_at", postgresql_where=deleted_at.isnot(None)),
    )


class UserAuth(Base):
    """Authentication methods for a user (email, Google, GitHub, etc.)"""
    __tablename__ = "user_auth"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Auth provider info
    provider = Column(String(50), nullable=False)  # 'email', 'google', 'github', 'apple'
    provider_id = Column(String(255), nullable=True)  # external provider user ID

    # Credentials
    password_hash = Column(String(255), nullable=True)  # for email auth only
    access_token = Column(Text, nullable=True)
    refresh_token = Column(Text, nullable=True)
    token_expires_at = Column(DateTime(timezone=True), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="auth_methods")

    __table_args__ = (
        Index("idx_user_auth_user_id", "user_id"),
        Index("idx_user_auth_provider", "provider", "provider_id"),
    )


class Session(Base):
    """User sessions for tracking active logins"""
    __tablename__ = "sessions"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Session token
    token_hash = Column(String(255), unique=True, nullable=False, index=True)

    # Device info
    device_name = Column(String(255), nullable=True)
    device_type = Column(SQLEnum(DeviceType), nullable=True)
    ip_address = Column(INET, nullable=True)
    user_agent = Column(Text, nullable=True)
    is_tauri = Column(Boolean, default=False)  # desktop app session

    # Session lifecycle
    last_active_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="sessions")

    __table_args__ = (
        Index("idx_sessions_user_id", "user_id"),
        Index("idx_sessions_expires_at", "expires_at"),
    )


class APIKey(Base):
    """API keys for programmatic access"""
    __tablename__ = "api_keys"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Key info
    name = Column(String(255), nullable=False)
    key_hash = Column(String(255), unique=True, nullable=False, index=True)
    key_prefix = Column(String(8), nullable=False)  # first 8 chars for display

    # Permissions and lifecycle
    scopes = Column(String(255), default="")  # comma-separated: 'read,write,admin'
    last_used_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    revoked_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="api_keys")

    __table_args__ = (
        Index("idx_api_keys_user_id", "user_id"),
    )


class UserPreference(Base):
    """User-specific preferences and settings"""
    __tablename__ = "user_preferences"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Preference key-value
    key = Column(String(100), nullable=False)
    value = Column(Text, nullable=False)  # stored as JSON string

    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="preferences")

    __table_args__ = (
        Index("idx_user_preferences_user_id", "user_id"),
        Index("idx_user_preferences_key", "user_id", "key"),
    )


class DeviceRegistry(Base):
    """Registry of user devices for sync and multi-device support"""
    __tablename__ = "device_registry"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Device identification
    device_id = Column(String(255), unique=True, nullable=False, index=True)
    device_name = Column(String(255), nullable=True)
    device_type = Column(SQLEnum(DeviceType), nullable=True)
    platform = Column(String(50), nullable=True)  # 'macos', 'windows', 'linux', 'ios', 'android'

    # Sync tracking
    last_sync_at = Column(DateTime(timezone=True), nullable=True)
    last_seen_at = Column(DateTime(timezone=True), nullable=True)
    vector_clock = Column(String(2000), default="{}")  # CRDT vector clock for sync

    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="devices")

    __table_args__ = (
        Index("idx_device_registry_user_id", "user_id"),
    )
