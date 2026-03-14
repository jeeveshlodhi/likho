"""
Pydantic schemas for Remote Config, Feature Flags, and App Version management.
"""
from datetime import datetime
from typing import Any, Optional, Union
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, model_validator


# ═══════════════════════════════════════════════════════════════════════════════
# Enums (mirrored from models for API use)
# ═══════════════════════════════════════════════════════════════════════════════

class ConfigPlatform(str):
    """Platform values for API use."""
    ALL = "all"
    WINDOWS = "windows"
    MACOS = "macos"
    LINUX = "linux"
    IOS = "ios"
    ANDROID = "android"


class ConfigValueType(str):
    """Config value types for API use."""
    STRING = "string"
    INTEGER = "integer"
    FLOAT = "float"
    BOOLEAN = "boolean"
    JSON = "json"


# ═══════════════════════════════════════════════════════════════════════════════
# Base Schemas
# ═══════════════════════════════════════════════════════════════════════════════

class FeatureFlagBase(BaseModel):
    """Base schema for FeatureFlag."""
    key: str = Field(..., min_length=1, max_length=100, description="Unique feature identifier")
    name: str = Field(..., min_length=1, max_length=255, description="Display name")
    description: Optional[str] = Field(None, max_length=1000)
    enabled: bool = False
    rollout_percentage: int = Field(100, ge=0, le=100, description="Percentage of users to enable (0-100)")
    target_platform: str = "all"
    min_version: Optional[str] = Field(None, max_length=20, description="Minimum app version (semver)")
    max_version: Optional[str] = Field(None, max_length=20, description="Maximum app version (semver)")
    conditions: dict = Field(default_factory=dict, description="Additional targeting conditions")
    is_kill_switch: bool = False


class RemoteConfigBase(BaseModel):
    """Base schema for RemoteConfig."""
    key: str = Field(..., min_length=1, max_length=100, description="Unique config identifier")
    name: str = Field(..., min_length=1, max_length=255, description="Display name")
    description: Optional[str] = Field(None, max_length=1000)
    value_type: str = "string"
    default_value: str
    platform_overrides: dict = Field(default_factory=dict)
    version_overrides: list[dict] = Field(default_factory=list)
    requires_restart: bool = False


class AppVersionBase(BaseModel):
    """Base schema for AppVersion."""
    platform: str = "all"
    version: str = Field(..., max_length=20, description="Semantic version (e.g., 1.2.3)")
    build_number: Optional[int] = None
    is_latest: bool = False
    min_required_version: str = Field(..., max_length=20, description="Minimum required app version")
    force_update: bool = False
    update_url: Optional[str] = None
    release_notes: Optional[str] = None
    release_summary: Optional[str] = Field(None, max_length=500)
    file_size: Optional[int] = None
    file_hash: Optional[str] = Field(None, max_length=64)
    released_at: Optional[datetime] = None


# ═══════════════════════════════════════════════════════════════════════════════
# Create Schemas (for POST requests)
# ═══════════════════════════════════════════════════════════════════════════════

class FeatureFlagCreate(FeatureFlagBase):
    """Schema for creating a new feature flag."""
    
    @field_validator("key")
    @classmethod
    def validate_key(cls, v: str) -> str:
        """Ensure key uses only lowercase letters, numbers, and underscores."""
        import re
        if not re.match(r"^[a-z][a-z0-9_]*$", v):
            raise ValueError("Key must start with lowercase letter and contain only lowercase letters, numbers, and underscores")
        return v
    
    @field_validator("target_platform")
    @classmethod
    def validate_platform(cls, v: str) -> str:
        """Validate platform value."""
        valid = {"all", "windows", "macos", "linux", "ios", "android"}
        if v not in valid:
            raise ValueError(f"Platform must be one of: {valid}")
        return v


class RemoteConfigCreate(RemoteConfigBase):
    """Schema for creating a new remote config."""
    
    @field_validator("key")
    @classmethod
    def validate_key(cls, v: str) -> str:
        """Ensure key uses only lowercase letters, numbers, and underscores."""
        import re
        if not re.match(r"^[a-z][a-z0-9_]*$", v):
            raise ValueError("Key must start with lowercase letter and contain only lowercase letters, numbers, and underscores")
        return v
    
    @field_validator("value_type")
    @classmethod
    def validate_value_type(cls, v: str) -> str:
        """Validate value type."""
        valid = {"string", "integer", "float", "boolean", "json"}
        if v not in valid:
            raise ValueError(f"Value type must be one of: {valid}")
        return v


class AppVersionCreate(AppVersionBase):
    """Schema for creating a new app version. Accepts download_url (alias for update_url) for admin dashboard."""
    download_url: Optional[str] = None  # alias for update_url; admin form uses this name

    @field_validator("version", "min_required_version")
    @classmethod
    def validate_semver(cls, v: str) -> str:
        """Validate semantic versioning format."""
        import re
        if not re.match(r"^\d+\.\d+\.\d+(-[a-zA-Z0-9._]+)?(\+[a-zA-Z0-9._]+)?$", v):
            raise ValueError("Version must follow semantic versioning (e.g., 1.2.3 or 1.2.3-beta.1)")
        return v

    @model_validator(mode="after")
    def copy_download_url_to_update_url(self) -> "AppVersionCreate":
        """If download_url is set and update_url is not, use download_url for update_url."""
        if self.download_url and self.update_url is None:
            object.__setattr__(self, "update_url", self.download_url)
        return self


# ═══════════════════════════════════════════════════════════════════════════════
# Update Schemas (for PATCH requests)
# ═══════════════════════════════════════════════════════════════════════════════

class FeatureFlagUpdate(BaseModel):
    """Schema for updating an existing feature flag."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    enabled: Optional[bool] = None
    rollout_percentage: Optional[int] = Field(None, ge=0, le=100)
    target_platform: Optional[str] = None
    min_version: Optional[str] = Field(None, max_length=20)
    max_version: Optional[str] = Field(None, max_length=20)
    conditions: Optional[dict] = None
    is_kill_switch: Optional[bool] = None
    
    @field_validator("target_platform")
    @classmethod
    def validate_platform(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        valid = {"all", "windows", "macos", "linux", "ios", "android"}
        if v not in valid:
            raise ValueError(f"Platform must be one of: {valid}")
        return v


class RemoteConfigUpdate(BaseModel):
    """Schema for updating an existing remote config."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    value_type: Optional[str] = None
    default_value: Optional[str] = None
    platform_overrides: Optional[dict] = None
    version_overrides: Optional[list[dict]] = None
    requires_restart: Optional[bool] = None
    
    @field_validator("value_type")
    @classmethod
    def validate_value_type(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        valid = {"string", "integer", "float", "boolean", "json"}
        if v not in valid:
            raise ValueError(f"Value type must be one of: {valid}")
        return v


class AppVersionUpdate(BaseModel):
    """Schema for updating an existing app version. Accepts download_url (alias for update_url)."""
    build_number: Optional[int] = None
    is_latest: Optional[bool] = None
    min_required_version: Optional[str] = Field(None, max_length=20)
    force_update: Optional[bool] = None
    update_url: Optional[str] = None
    download_url: Optional[str] = None
    release_notes: Optional[str] = None
    release_summary: Optional[str] = Field(None, max_length=500)
    file_size: Optional[int] = None
    file_hash: Optional[str] = Field(None, max_length=64)
    released_at: Optional[datetime] = None

    @model_validator(mode="after")
    def copy_download_url_to_update_url(self) -> "AppVersionUpdate":
        if self.download_url is not None and self.update_url is None:
            object.__setattr__(self, "update_url", self.download_url)
        return self

    @field_validator("min_required_version")
    @classmethod
    def validate_semver(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        import re
        if not re.match(r"^\d+\.\d+\.\d+(-[a-zA-Z0-9._]+)?(\+[a-zA-Z0-9._]+)?$", v):
            raise ValueError("Version must follow semantic versioning (e.g., 1.2.3)")
        return v


# ═══════════════════════════════════════════════════════════════════════════════
# Response Schemas (for API responses)
# ═══════════════════════════════════════════════════════════════════════════════

class FeatureFlagResponse(FeatureFlagBase):
    """Schema for feature flag responses."""
    id: UUID
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None
    
    model_config = {"from_attributes": True}


class RemoteConfigResponse(RemoteConfigBase):
    """Schema for remote config responses."""
    id: UUID
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None
    
    model_config = {"from_attributes": True}


class AppVersionResponse(AppVersionBase):
    """Schema for app version responses. Serializes update_url as download_url for admin dashboard."""
    id: UUID
    created_at: datetime
    updated_at: datetime
    # Expose update_url as download_url in JSON for admin dashboard
    update_url: Optional[str] = Field(None, serialization_alias="download_url")

    model_config = {"from_attributes": True}


# ═══════════════════════════════════════════════════════════════════════════════
# Device/Client Request/Response Schemas
# ═══════════════════════════════════════════════════════════════════════════════

class DeviceConfigRequest(BaseModel):
    """Schema for device configuration requests."""
    version: str = Field(..., description="App version (semver)")
    platform: str = Field(..., description="Platform (windows, macos, linux, etc.)")
    device_id: Optional[str] = Field(None, description="Unique device identifier for A/B testing")
    user_id: Optional[UUID] = None


class FeatureCheckRequest(BaseModel):
    """Schema for checking if a specific feature is enabled."""
    feature_key: str
    version: str
    platform: str
    device_id: Optional[str] = None
    user_id: Optional[UUID] = None


class ConfigValueResponse(BaseModel):
    """Schema for a single config value with metadata."""
    key: str
    value: Any
    value_type: str
    requires_restart: bool


class FeatureCheckResponse(BaseModel):
    """Schema for feature check response."""
    feature_key: str
    enabled: bool
    rollout_percentage: int
    reason: Optional[str] = None  # "flag_disabled", "version_mismatch", "platform_mismatch", "rollout_excluded"


class DeviceConfigResponse(BaseModel):
    """Schema for device configuration response."""
    configs: dict[str, Any]
    features: dict[str, bool]
    feature_details: dict[str, FeatureCheckResponse]


class VersionInfoResponse(BaseModel):
    """Schema for version information response."""
    current_version: str
    latest_version: str
    min_required_version: str
    is_update_available: bool
    is_update_required: bool
    force_update: bool
    update_url: Optional[str]
    release_notes: Optional[str]
    release_summary: Optional[str]


class DesktopReleaseResponse(BaseModel):
    """Public schema for latest desktop app download (homepage Download button)."""
    version: str
    download_url: str


# ═══════════════════════════════════════════════════════════════════════════════
# Admin Schemas
# ═══════════════════════════════════════════════════════════════════════════════

class FeatureToggleRequest(BaseModel):
    """Schema for toggling a feature flag."""
    enabled: bool
    rollout_percentage: Optional[int] = Field(None, ge=0, le=100)
    reason: Optional[str] = Field(None, description="Reason for the change")


class BulkConfigUpdateRequest(BaseModel):
    """Schema for bulk updating multiple configs."""
    configs: list[dict[str, Any]]
    reason: Optional[str] = None


class ConfigAuditLogResponse(BaseModel):
    """Schema for config audit log entries."""
    id: UUID
    entity_type: str
    entity_id: UUID
    action: str
    changed_by: Optional[UUID]
    old_values: Optional[dict]
    new_values: Optional[dict]
    reason: Optional[str]
    created_at: datetime
    
    model_config = {"from_attributes": True}
