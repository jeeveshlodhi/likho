"""
Remote Config module for Likho.

Provides feature flags, remote configuration, and app version management
for the Tauri desktop application with support for:
- Feature toggles with A/B testing (rollout percentages)
- Platform-specific configuration (windows, mac, linux)
- Version-gated features
- Maintenance mode / kill switches
"""

from .models import FeatureFlag, RemoteConfig, AppVersion, ConfigPlatform
from .schemas import (
    FeatureFlagResponse,
    RemoteConfigResponse,
    AppVersionResponse,
    DeviceConfigRequest,
    DeviceConfigResponse,
    FeatureCheckResponse,
    VersionInfoResponse,
    FeatureFlagCreate,
    FeatureFlagUpdate,
    RemoteConfigCreate,
    RemoteConfigUpdate,
    AppVersionCreate,
    AppVersionUpdate,
)
from .crud import (
    get_feature_flag,
    get_feature_flags,
    create_feature_flag,
    update_feature_flag,
    delete_feature_flag,
    get_remote_config,
    get_remote_configs,
    create_remote_config,
    update_remote_config,
    delete_remote_config,
    get_app_version,
    get_latest_app_version,
    create_app_version,
    update_app_version,
)
from .service import (
    is_feature_enabled,
    get_effective_config,
    check_version_requirements,
    parse_version,
    compare_versions,
)

__all__ = [
    # Models
    "FeatureFlag",
    "RemoteConfig",
    "AppVersion",
    "ConfigPlatform",
    # Schemas
    "FeatureFlagResponse",
    "RemoteConfigResponse",
    "AppVersionResponse",
    "DeviceConfigRequest",
    "DeviceConfigResponse",
    "FeatureCheckResponse",
    "VersionInfoResponse",
    "FeatureFlagCreate",
    "FeatureFlagUpdate",
    "RemoteConfigCreate",
    "RemoteConfigUpdate",
    "AppVersionCreate",
    "AppVersionUpdate",
    # CRUD
    "get_feature_flag",
    "get_feature_flags",
    "create_feature_flag",
    "update_feature_flag",
    "delete_feature_flag",
    "get_remote_config",
    "get_remote_configs",
    "create_remote_config",
    "update_remote_config",
    "delete_remote_config",
    "get_app_version",
    "get_latest_app_version",
    "create_app_version",
    "update_app_version",
    # Service
    "is_feature_enabled",
    "get_effective_config",
    "check_version_requirements",
    "parse_version",
    "compare_versions",
]
