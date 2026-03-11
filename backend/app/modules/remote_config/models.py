"""
SQLAlchemy models for Remote Config, Feature Flags, and App Version management.
"""
from datetime import datetime
from enum import Enum as PyEnum
from typing import Optional

from sqlalchemy import (
    Boolean,
    Column,
    String,
    Text,
    Integer,
    Float,
    DateTime,
    Enum as SQLEnum,
    Index,
    CheckConstraint,
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB
import uuid

from app.core.base import Base


class ConfigPlatform(str, PyEnum):
    """Supported platforms for platform-specific configuration."""
    ALL = "all"
    WINDOWS = "windows"
    MACOS = "macos"
    LINUX = "linux"
    IOS = "ios"
    ANDROID = "android"


class ConfigValueType(str, PyEnum):
    """Value types for remote config entries."""
    STRING = "string"
    INTEGER = "integer"
    FLOAT = "float"
    BOOLEAN = "boolean"
    JSON = "json"


class FeatureFlag(Base):
    """
    Feature flags for enabling/disabling features with A/B testing support.
    
    Supports:
    - Simple on/off toggles
    - Percentage-based rollouts (A/B testing)
    - Version-gated features (min/max app version)
    - Platform-specific targeting
    """
    __tablename__ = "feature_flags"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Unique feature key (e.g., "new_editor", "ai_assistant", "maintenance_mode")
    key = Column(String(100), unique=True, nullable=False, index=True)
    
    # Display name for the feature
    name = Column(String(255), nullable=False)
    
    # Feature description
    description = Column(Text, nullable=True)
    
    # Master switch - if False, feature is disabled for everyone
    enabled = Column(Boolean, default=False, nullable=False)
    
    # Rollout percentage (0-100) for gradual feature releases
    # A value of 100 means fully rolled out, 0 means no users get it
    rollout_percentage = Column(
        Integer,
        default=100,
        nullable=False,
    )
    
    # Platform targeting (all, windows, macos, linux, etc.)
    target_platform = Column(
        SQLEnum(ConfigPlatform),
        default=ConfigPlatform.ALL,
        nullable=False,
    )
    
    # Minimum app version required for this feature (inclusive)
    # Uses semantic versioning format: "1.0.0"
    min_version = Column(String(20), nullable=True)
    
    # Maximum app version supported (inclusive)
    max_version = Column(String(20), nullable=True)
    
    # Additional targeting conditions (stored as JSON)
    # Example: {"user_plan": ["pro", "enterprise"], "region": ["US", "EU"]}
    conditions = Column(JSONB, default=dict)
    
    # Whether this is a kill switch (emergency disable)
    is_kill_switch = Column(Boolean, default=False, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )
    
    # Soft delete for audit trail
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    # Constraints
    __table_args__ = (
        CheckConstraint(
            "rollout_percentage >= 0 AND rollout_percentage <= 100",
            name="check_rollout_percentage_range"
        ),
        Index("idx_feature_flags_key", "key"),
        Index("idx_feature_flags_enabled", "enabled"),
        Index("idx_feature_flags_deleted_at", "deleted_at"),
    )

    def __repr__(self) -> str:
        return f"<FeatureFlag(key='{self.key}', enabled={self.enabled}, rollout={self.rollout_percentage}%)>"


class RemoteConfig(Base):
    """
    Remote configuration values for app behavior customization.
    
    Supports:
    - String, integer, float, boolean, and JSON value types
    - Platform-specific overrides
    - Version-specific configuration
    """
    __tablename__ = "remote_configs"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Unique config key (e.g., "sync_interval", "max_file_size", "api_timeout")
    key = Column(String(100), unique=True, nullable=False, index=True)
    
    # Display name
    name = Column(String(255), nullable=False)
    
    # Config description
    description = Column(Text, nullable=True)
    
    # Value type for proper casting
    value_type = Column(SQLEnum(ConfigValueType), default=ConfigValueType.STRING, nullable=False)
    
    # Default value (stored as string, cast based on value_type)
    default_value = Column(Text, nullable=False)
    
    # Platform-specific overrides (JSONB)
    # Example: {"windows": "C:\\path", "macos": "/path", "linux": "/path"}
    platform_overrides = Column(JSONB, default=dict)
    
    # Version-specific overrides (JSONB) - list of {min_version, max_version, value}
    # Example: [{"min_version": "1.0.0", "max_version": "1.5.0", "value": "old_value"}]
    version_overrides = Column(JSONB, default=list)
    
    # Whether this config requires app restart to take effect
    requires_restart = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )
    
    # Soft delete
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    # Indexes
    __table_args__ = (
        Index("idx_remote_configs_key", "key"),
        Index("idx_remote_configs_deleted_at", "deleted_at"),
    )

    def __repr__(self) -> str:
        return f"<RemoteConfig(key='{self.key}', type={self.value_type.value})>"


class AppVersion(Base):
    """
    App version information for update management and version requirements.
    
    Tracks:
    - Latest available version
    - Minimum required version (force update)
    - Release notes and update URLs
    """
    __tablename__ = "app_versions"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Platform this version is for
    platform = Column(
        SQLEnum(ConfigPlatform),
        default=ConfigPlatform.ALL,
        nullable=False,
    )
    
    # Version string (semantic versioning: "1.2.3")
    version = Column(String(20), nullable=False)
    
    # Build number (for mobile/desktop builds)
    build_number = Column(Integer, nullable=True)
    
    # Whether this is the latest stable version
    is_latest = Column(Boolean, default=False, nullable=False)
    
    # Minimum required version - if user's version < this, force update
    # Set to same as version to force all users on older versions to update
    min_required_version = Column(String(20), nullable=False)
    
    # Whether to force update (emergency/security fix)
    force_update = Column(Boolean, default=False, nullable=False)
    
    # Update download URL
    update_url = Column(Text, nullable=True)
    
    # Release notes (markdown supported)
    release_notes = Column(Text, nullable=True)
    
    # Short release summary
    release_summary = Column(String(500), nullable=True)
    
    # File size in bytes
    file_size = Column(Integer, nullable=True)
    
    # SHA256 hash of the update file for integrity verification
    file_hash = Column(String(64), nullable=True)
    
    # Release date
    released_at = Column(DateTime(timezone=True), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    # Constraints - ensure unique version per platform
    __table_args__ = (
        Index("idx_app_versions_platform_version", "platform", "version", unique=True),
        Index("idx_app_versions_is_latest", "is_latest"),
        Index("idx_app_versions_platform", "platform"),
    )

    def __repr__(self) -> str:
        return f"<AppVersion(platform={self.platform.value}, version='{self.version}')>"


class ConfigAuditLog(Base):
    """
    Audit log for configuration changes.
    Tracks who changed what and when for compliance and debugging.
    """
    __tablename__ = "config_audit_logs"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Entity type that was changed
    entity_type = Column(String(50), nullable=False)  # "feature_flag", "remote_config", "app_version"
    
    # Entity ID
    entity_id = Column(PG_UUID(as_uuid=True), nullable=False)
    
    # Type of change
    action = Column(String(20), nullable=False)  # "create", "update", "delete"
    
    # User who made the change (null for system changes)
    changed_by = Column(PG_UUID(as_uuid=True), nullable=True)
    
    # Previous values (JSONB)
    old_values = Column(JSONB, nullable=True)
    
    # New values (JSONB)
    new_values = Column(JSONB, nullable=True)
    
    # Change reason/description
    reason = Column(Text, nullable=True)
    
    # Timestamp
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    # Indexes
    __table_args__ = (
        Index("idx_config_audit_entity", "entity_type", "entity_id"),
        Index("idx_config_audit_created_at", "created_at"),
        Index("idx_config_audit_changed_by", "changed_by"),
    )

    def __repr__(self) -> str:
        return f"<ConfigAuditLog(entity='{self.entity_type}', action='{self.action}')>"
