"""
Business logic for Remote Config, Feature Flags, and App Version management.

Includes:
- Feature flag evaluation with A/B testing support
- Config value resolution with platform/version overrides
- Semantic version comparison utilities
"""
import hashlib
import json
import re
from typing import Any, Optional, Tuple
from uuid import UUID

from sqlalchemy.orm import Session

from .models import FeatureFlag, RemoteConfig, AppVersion, ConfigPlatform, ConfigValueType
from .crud import get_feature_flags, get_remote_configs, get_latest_app_version


# ═══════════════════════════════════════════════════════════════════════════════
# Version Utilities
# ═══════════════════════════════════════════════════════════════════════════════

def parse_version(version: str) -> Tuple[int, int, int, Optional[str], Optional[str]]:
    """
    Parse a semantic version string into components.
    
    Supports formats like:
    - "1.2.3" -> (1, 2, 3, None, None)
    - "1.2.3-beta" -> (1, 2, 3, "beta", None)
    - "1.2.3+build.123" -> (1, 2, 3, None, "build.123")
    - "1.2.3-beta+build.123" -> (1, 2, 3, "beta", "build.123")
    
    Returns:
        Tuple of (major, minor, patch, pre_release, build_metadata)
    """
    # Semver pattern: MAJOR.MINOR.PATCH[-PRERELEASE][+BUILD]
    pattern = r'^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9._-]+))?(?:\+([a-zA-Z0-9._-]+))?$'
    match = re.match(pattern, version)
    
    if not match:
        raise ValueError(f"Invalid semantic version: {version}")
    
    major = int(match.group(1))
    minor = int(match.group(2))
    patch = int(match.group(3))
    pre_release = match.group(4)
    build_metadata = match.group(5)
    
    return (major, minor, patch, pre_release, build_metadata)


def compare_versions(v1: str, v2: str) -> int:
    """
    Compare two semantic version strings.
    
    Returns:
        -1 if v1 < v2
         0 if v1 == v2
         1 if v1 > v2
    
    Note: Pre-release versions have lower precedence than normal versions.
          Build metadata is ignored in comparison.
    """
    v1_parts = parse_version(v1)
    v2_parts = parse_version(v2)
    
    # Compare major, minor, patch
    for i in range(3):
        if v1_parts[i] < v2_parts[i]:
            return -1
        if v1_parts[i] > v2_parts[i]:
            return 1
    
    # Compare pre-release versions
    v1_pre = v1_parts[3]
    v2_pre = v2_parts[3]
    
    # A version without pre-release has higher precedence
    if v1_pre is None and v2_pre is not None:
        return 1
    if v1_pre is not None and v2_pre is None:
        return -1
    if v1_pre is not None and v2_pre is not None:
        # Compare pre-release identifiers
        v1_identifiers = v1_pre.split('.')
        v2_identifiers = v2_pre.split('.')
        
        for id1, id2 in zip(v1_identifiers, v2_identifiers):
            # Numeric identifiers are compared as integers
            is_num1 = id1.isdigit()
            is_num2 = id2.isdigit()
            
            if is_num1 and is_num2:
                n1, n2 = int(id1), int(id2)
                if n1 < n2:
                    return -1
                if n1 > n2:
                    return 1
            elif is_num1:
                # Numeric identifiers have lower precedence than alphanumeric
                return -1
            elif is_num2:
                return 1
            else:
                # Compare as strings
                if id1 < id2:
                    return -1
                if id1 > id2:
                    return 1
        
        # Longer pre-release has higher precedence if all previous equal
        if len(v1_identifiers) < len(v2_identifiers):
            return -1
        if len(v1_identifiers) > len(v2_identifiers):
            return 1
    
    return 0


def is_version_in_range(
    version: str,
    min_version: Optional[str] = None,
    max_version: Optional[str] = None,
) -> bool:
    """
    Check if a version is within a specified range (inclusive).
    
    Args:
        version: The version to check
        min_version: Minimum version (inclusive), None for no minimum
        max_version: Maximum version (inclusive), None for no maximum
    
    Returns:
        True if version is in range
    """
    if min_version is not None and compare_versions(version, min_version) < 0:
        return False
    if max_version is not None and compare_versions(version, max_version) > 0:
        return False
    return True


# ═══════════════════════════════════════════════════════════════════════════════
# Device/User Hashing for A/B Testing
# ═══════════════════════════════════════════════════════════════════════════════

def _get_user_hash(device_id: str, feature_key: str) -> int:
    """
    Generate a deterministic hash for A/B testing.
    
    Uses MD5 of device_id + feature_key to get a 0-99 value.
    This ensures the same user always gets the same experience for a feature,
    while distributing users evenly across the percentage range.
    """
    hash_input = f"{device_id}:{feature_key}"
    hash_value = hashlib.md5(hash_input.encode()).hexdigest()
    # Take first 8 chars of hex hash and convert to int, then mod 100
    return int(hash_value[:8], 16) % 100


def _is_in_rollout(device_id: str, feature_key: str, rollout_percentage: int) -> bool:
    """
    Check if a device/user is included in a percentage rollout.
    
    Args:
        device_id: Unique device identifier
        feature_key: Feature flag key
        rollout_percentage: Percentage of users to include (0-100)
    
    Returns:
        True if the user should have the feature enabled
    """
    if rollout_percentage <= 0:
        return False
    if rollout_percentage >= 100:
        return True
    
    user_hash = _get_user_hash(device_id, feature_key)
    return user_hash < rollout_percentage


# ═══════════════════════════════════════════════════════════════════════════════
# Feature Flag Evaluation
# ═══════════════════════════════════════════════════════════════════════════════

def is_feature_enabled(
    db: Session,
    feature_key: str,
    version: str,
    platform: str,
    device_id: Optional[str] = None,
    user_id: Optional[UUID] = None,
    user_attributes: Optional[dict] = None,
) -> dict:
    """
    Check if a feature is enabled for a specific device/user.
    
    Args:
        db: Database session
        feature_key: The feature flag key to check
        version: App version (semver)
        platform: Platform name (windows, macos, linux, etc.)
        device_id: Unique device identifier for A/B testing
        user_id: User ID (optional, for user-specific targeting)
        user_attributes: Additional user attributes for targeting (optional)
    
    Returns:
        Dict with:
        - enabled: bool - Whether the feature is enabled
        - rollout_percentage: int - The configured rollout percentage
        - reason: Optional[str] - Reason if disabled (for debugging)
    """
    # Get the feature flag
    flag = db.query(FeatureFlag).filter(
        FeatureFlag.key == feature_key,
        FeatureFlag.deleted_at.is_(None),
    ).first()
    
    if not flag:
        return {
            "enabled": False,
            "rollout_percentage": 0,
            "reason": "flag_not_found",
        }
    
    # Check if master switch is on
    if not flag.enabled:
        return {
            "enabled": False,
            "rollout_percentage": flag.rollout_percentage,
            "reason": "flag_disabled",
        }
    
    # Check platform targeting
    try:
        target_platform = ConfigPlatform(flag.target_platform)
    except ValueError:
        target_platform = ConfigPlatform.ALL
    
    if target_platform != ConfigPlatform.ALL:
        try:
            user_platform = ConfigPlatform(platform.lower())
        except ValueError:
            user_platform = None
        
        if user_platform != target_platform:
            return {
                "enabled": False,
                "rollout_percentage": flag.rollout_percentage,
                "reason": "platform_mismatch",
            }
    
    # Check version constraints
    if flag.min_version or flag.max_version:
        if not is_version_in_range(version, flag.min_version, flag.max_version):
            return {
                "enabled": False,
                "rollout_percentage": flag.rollout_percentage,
                "reason": "version_mismatch",
            }
    
    # Check additional conditions
    if flag.conditions and user_attributes:
        for condition_key, condition_value in flag.conditions.items():
            user_value = user_attributes.get(condition_key)
            if user_value is None:
                return {
                    "enabled": False,
                    "rollout_percentage": flag.rollout_percentage,
                    "reason": f"missing_condition:{condition_key}",
                }
            # Handle list conditions (e.g., user_plan in ["pro", "enterprise"])
            if isinstance(condition_value, list):
                if user_value not in condition_value:
                    return {
                        "enabled": False,
                        "rollout_percentage": flag.rollout_percentage,
                        "reason": f"condition_mismatch:{condition_key}",
                    }
            elif user_value != condition_value:
                return {
                    "enabled": False,
                    "rollout_percentage": flag.rollout_percentage,
                    "reason": f"condition_mismatch:{condition_key}",
                }
    
    # Check rollout percentage (A/B testing)
    if device_id:
        if not _is_in_rollout(device_id, feature_key, flag.rollout_percentage):
            return {
                "enabled": False,
                "rollout_percentage": flag.rollout_percentage,
                "reason": "rollout_excluded",
            }
    elif flag.rollout_percentage < 100:
        # Without device_id, we can't do A/B testing
        # Default to disabled if rollout is partial and no device_id
        return {
            "enabled": False,
            "rollout_percentage": flag.rollout_percentage,
            "reason": "device_id_required_for_rollout",
        }
    
    return {
        "enabled": True,
        "rollout_percentage": flag.rollout_percentage,
        "reason": None,
    }


def get_all_feature_statuses(
    db: Session,
    version: str,
    platform: str,
    device_id: Optional[str] = None,
    user_id: Optional[UUID] = None,
    user_attributes: Optional[dict] = None,
) -> dict[str, dict]:
    """
    Get the status of all feature flags for a device/user.
    
    Returns:
        Dict mapping feature_key -> status dict
    """
    flags = get_feature_flags(db, enabled_only=False)
    statuses = {}
    
    for flag in flags:
        status = is_feature_enabled(
            db=db,
            feature_key=flag.key,
            version=version,
            platform=platform,
            device_id=device_id,
            user_id=user_id,
            user_attributes=user_attributes,
        )
        statuses[flag.key] = status
    
    return statuses


# ═══════════════════════════════════════════════════════════════════════════════
# Config Value Resolution
# ═══════════════════════════════════════════════════════════════════════════════

def _cast_config_value(value: str, value_type: ConfigValueType) -> Any:
    """Cast a string value to the appropriate type."""
    if value_type == ConfigValueType.STRING:
        return value
    elif value_type == ConfigValueType.INTEGER:
        return int(value)
    elif value_type == ConfigValueType.FLOAT:
        return float(value)
    elif value_type == ConfigValueType.BOOLEAN:
        return value.lower() in ('true', '1', 'yes', 'on')
    elif value_type == ConfigValueType.JSON:
        return json.loads(value)
    return value


def _get_version_override(
    config: RemoteConfig,
    version: str,
) -> Optional[str]:
    """
    Get a version-specific override value if applicable.
    
    Version overrides should be a list of dicts:
    [
        {"min_version": "1.0.0", "max_version": "1.5.0", "value": "old_value"},
        {"min_version": "1.5.0", "value": "new_value"},
    ]
    """
    if not config.version_overrides:
        return None
    
    for override in config.version_overrides:
        min_v = override.get("min_version")
        max_v = override.get("max_version")
        
        if is_version_in_range(version, min_v, max_v):
            return override.get("value")
    
    return None


def get_config_value(
    db: Session,
    config_key: str,
    version: str,
    platform: str,
    default: Any = None,
) -> dict:
    """
    Get a single config value with platform and version overrides applied.
    
    Args:
        db: Database session
        config_key: The config key
        version: App version
        platform: Platform name
        default: Default value if config not found
    
    Returns:
        Dict with:
        - value: The config value (typed)
        - value_type: The value type
        - requires_restart: Whether app restart is required
        - source: Where the value came from ("default", "platform_override", "version_override")
    """
    config = db.query(RemoteConfig).filter(
        RemoteConfig.key == config_key,
        RemoteConfig.deleted_at.is_(None),
    ).first()
    
    if not config:
        return {
            "value": default,
            "value_type": "unknown",
            "requires_restart": False,
            "source": "default_fallback",
        }
    
    # Determine the raw value to use
    raw_value = config.default_value
    source = "default"
    
    # Check for version override
    version_override = _get_version_override(config, version)
    if version_override is not None:
        raw_value = version_override
        source = "version_override"
    
    # Check for platform override (platform takes precedence over version)
    if config.platform_overrides:
        platform_key = platform.lower()
        if platform_key in config.platform_overrides:
            raw_value = config.platform_overrides[platform_key]
            source = "platform_override"
    
    # Cast to appropriate type
    try:
        value = _cast_config_value(raw_value, config.value_type)
    except (ValueError, json.JSONDecodeError) as e:
        # Fall back to default value if casting fails
        value = _cast_config_value(config.default_value, config.value_type)
        source = "default_cast_fallback"
    
    return {
        "value": value,
        "value_type": config.value_type.value,
        "requires_restart": config.requires_restart,
        "source": source,
    }


def get_effective_config(
    db: Session,
    version: str,
    platform: str,
) -> dict[str, Any]:
    """
    Get all effective config values for a device.
    
    Returns a flat dict of config_key -> value for easy use in the app.
    """
    configs = get_remote_configs(db)
    effective = {}
    
    for config in configs:
        result = get_config_value(db, config.key, version, platform)
        effective[config.key] = result["value"]
    
    return effective


def get_full_config_with_metadata(
    db: Session,
    version: str,
    platform: str,
) -> dict[str, dict]:
    """
    Get all config values with full metadata.
    
    Returns a dict of config_key -> full result dict.
    """
    configs = get_remote_configs(db)
    result = {}
    
    for config in configs:
        result[config.key] = get_config_value(db, config.key, version, platform)
    
    return result


# ═══════════════════════════════════════════════════════════════════════════════
# Version Requirements
# ═══════════════════════════════════════════════════════════════════════════════

def check_version_requirements(
    db: Session,
    current_version: str,
    platform: str,
) -> dict:
    """
    Check version requirements and return update information.
    
    Args:
        db: Database session
        current_version: Current app version
        platform: Platform name
    
    Returns:
        Dict with:
        - current_version: Current app version
        - latest_version: Latest available version
        - min_required_version: Minimum required version
        - is_update_available: Whether an update is available
        - is_update_required: Whether update is mandatory
        - force_update: Whether to force immediate update
        - update_url: Download URL for the update
        - release_notes: Release notes
        - release_summary: Short release summary
    """
    latest = get_latest_app_version(db, platform)
    
    if not latest:
        return {
            "current_version": current_version,
            "latest_version": current_version,
            "min_required_version": current_version,
            "is_update_available": False,
            "is_update_required": False,
            "force_update": False,
            "update_url": None,
            "release_notes": None,
            "release_summary": None,
        }
    
    latest_version = latest.version
    min_required = latest.min_required_version
    
    is_update_available = compare_versions(current_version, latest_version) < 0
    is_update_required = compare_versions(current_version, min_required) < 0
    
    return {
        "current_version": current_version,
        "latest_version": latest_version,
        "min_required_version": min_required,
        "is_update_available": is_update_available,
        "is_update_required": is_update_required or latest.force_update,
        "force_update": latest.force_update,
        "update_url": latest.update_url,
        "release_notes": latest.release_notes,
        "release_summary": latest.release_summary,
    }


# ═══════════════════════════════════════════════════════════════════════════════
# Maintenance Mode / Kill Switch
# ═══════════════════════════════════════════════════════════════════════════════

def is_maintenance_mode(db: Session) -> dict:
    """
    Check if maintenance mode is enabled.
    
    Returns:
        Dict with:
        - enabled: Whether maintenance mode is active
        - message: Optional maintenance message to display
        - allowed_versions: List of versions exempt from maintenance
    """
    flag = db.query(FeatureFlag).filter(
        FeatureFlag.key == "maintenance_mode",
        FeatureFlag.deleted_at.is_(None),
    ).first()
    
    if not flag or not flag.enabled:
        return {
            "enabled": False,
            "message": None,
            "allowed_versions": [],
        }
    
    conditions = flag.conditions or {}
    
    return {
        "enabled": True,
        "message": conditions.get("message", "The app is under maintenance. Please try again later."),
        "allowed_versions": conditions.get("allowed_versions", []),
    }


def trigger_kill_switch(
    db: Session,
    feature_key: str,
    enabled: bool = False,
    reason: Optional[str] = None,
    changed_by: Optional[UUID] = None,
) -> FeatureFlag:
    """
    Emergency function to disable a feature (kill switch).
    
    This immediately disables a feature for all users.
    """
    from .crud import get_feature_flag_by_key, update_feature_flag
    
    flag = get_feature_flag_by_key(db, feature_key)
    if not flag:
        raise ValueError(f"Feature flag '{feature_key}' not found")
    
    return update_feature_flag(
        db=db,
        flag=flag,
        update_data={"enabled": enabled},
        changed_by=changed_by,
        reason=reason or f"Kill switch {'activated' if not enabled else 'deactivated'}",
    )
