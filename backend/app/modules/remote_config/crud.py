"""
CRUD operations for Remote Config, Feature Flags, and App Version management.
"""
from datetime import datetime
from typing import Optional, List
from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from .models import FeatureFlag, RemoteConfig, AppVersion, ConfigPlatform, ConfigAuditLog


# ═══════════════════════════════════════════════════════════════════════════════
# Feature Flag CRUD
# ═══════════════════════════════════════════════════════════════════════════════

def get_feature_flag(db: Session, flag_id: UUID) -> Optional[FeatureFlag]:
    """Get a feature flag by ID."""
    return db.query(FeatureFlag).filter(
        FeatureFlag.id == flag_id,
        FeatureFlag.deleted_at.is_(None),
    ).first()


def get_feature_flag_by_key(
    db: Session, 
    key: str, 
    include_deleted: bool = False
) -> Optional[FeatureFlag]:
    """Get a feature flag by its unique key."""
    query = db.query(FeatureFlag).filter(FeatureFlag.key == key)
    if not include_deleted:
        query = query.filter(FeatureFlag.deleted_at.is_(None))
    return query.first()


def get_feature_flags(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    enabled_only: bool = False,
    platform: Optional[str] = None,
    include_deleted: bool = False,
) -> List[FeatureFlag]:
    """Get all feature flags with optional filtering."""
    query = db.query(FeatureFlag)
    
    if not include_deleted:
        query = query.filter(FeatureFlag.deleted_at.is_(None))
    
    if enabled_only:
        query = query.filter(FeatureFlag.enabled == True)
    
    if platform:
        query = query.filter(
            or_(
                FeatureFlag.target_platform == ConfigPlatform.ALL,
                FeatureFlag.target_platform == platform,
            )
        )
    
    return query.order_by(FeatureFlag.key).offset(skip).limit(limit).all()


def create_feature_flag(
    db: Session,
    flag_data: dict,
    changed_by: Optional[UUID] = None,
) -> FeatureFlag:
    """Create a new feature flag."""
    # Check for duplicate key
    existing = get_feature_flag_by_key(db, flag_data["key"], include_deleted=True)
    if existing:
        raise ValueError(f"Feature flag with key '{flag_data['key']}' already exists")
    
    flag = FeatureFlag(**flag_data)
    db.add(flag)
    db.commit()
    db.refresh(flag)
    
    # Create audit log
    _create_audit_log(
        db=db,
        entity_type="feature_flag",
        entity_id=flag.id,
        action="create",
        changed_by=changed_by,
        new_values=flag_data,
    )
    
    return flag


def update_feature_flag(
    db: Session,
    flag: FeatureFlag,
    update_data: dict,
    changed_by: Optional[UUID] = None,
    reason: Optional[str] = None,
) -> FeatureFlag:
    """Update an existing feature flag."""
    old_values = {
        "enabled": flag.enabled,
        "rollout_percentage": flag.rollout_percentage,
        "target_platform": flag.target_platform.value,
        "min_version": flag.min_version,
        "max_version": flag.max_version,
        "conditions": flag.conditions,
    }
    
    for field, value in update_data.items():
        if hasattr(flag, field):
            setattr(flag, field, value)
    
    flag.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(flag)
    
    # Create audit log
    _create_audit_log(
        db=db,
        entity_type="feature_flag",
        entity_id=flag.id,
        action="update",
        changed_by=changed_by,
        old_values=old_values,
        new_values=update_data,
        reason=reason,
    )
    
    return flag


def delete_feature_flag(
    db: Session,
    flag: FeatureFlag,
    changed_by: Optional[UUID] = None,
    reason: Optional[str] = None,
) -> None:
    """Soft delete a feature flag."""
    flag.deleted_at = datetime.utcnow()
    db.commit()
    
    # Create audit log
    _create_audit_log(
        db=db,
        entity_type="feature_flag",
        entity_id=flag.id,
        action="delete",
        changed_by=changed_by,
        reason=reason,
    )


def toggle_feature_flag(
    db: Session,
    flag: FeatureFlag,
    enabled: bool,
    rollout_percentage: Optional[int] = None,
    changed_by: Optional[UUID] = None,
    reason: Optional[str] = None,
) -> FeatureFlag:
    """Toggle a feature flag on/off with optional rollout percentage."""
    old_values = {"enabled": flag.enabled, "rollout_percentage": flag.rollout_percentage}
    
    flag.enabled = enabled
    if rollout_percentage is not None:
        flag.rollout_percentage = rollout_percentage
    flag.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(flag)
    
    # Create audit log
    _create_audit_log(
        db=db,
        entity_type="feature_flag",
        entity_id=flag.id,
        action="toggle",
        changed_by=changed_by,
        old_values=old_values,
        new_values={
            "enabled": enabled,
            "rollout_percentage": flag.rollout_percentage,
        },
        reason=reason,
    )
    
    return flag


# ═══════════════════════════════════════════════════════════════════════════════
# Remote Config CRUD
# ═══════════════════════════════════════════════════════════════════════════════

def get_remote_config(db: Session, config_id: UUID) -> Optional[RemoteConfig]:
    """Get a remote config by ID."""
    return db.query(RemoteConfig).filter(
        RemoteConfig.id == config_id,
        RemoteConfig.deleted_at.is_(None),
    ).first()


def get_remote_config_by_key(
    db: Session,
    key: str,
    include_deleted: bool = False,
) -> Optional[RemoteConfig]:
    """Get a remote config by its unique key."""
    query = db.query(RemoteConfig).filter(RemoteConfig.key == key)
    if not include_deleted:
        query = query.filter(RemoteConfig.deleted_at.is_(None))
    return query.first()


def get_remote_configs(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    include_deleted: bool = False,
) -> List[RemoteConfig]:
    """Get all remote configs."""
    query = db.query(RemoteConfig)
    if not include_deleted:
        query = query.filter(RemoteConfig.deleted_at.is_(None))
    return query.order_by(RemoteConfig.key).offset(skip).limit(limit).all()


def create_remote_config(
    db: Session,
    config_data: dict,
    changed_by: Optional[UUID] = None,
) -> RemoteConfig:
    """Create a new remote config."""
    # Check for duplicate key
    existing = get_remote_config_by_key(db, config_data["key"], include_deleted=True)
    if existing:
        raise ValueError(f"Remote config with key '{config_data['key']}' already exists")
    
    config = RemoteConfig(**config_data)
    db.add(config)
    db.commit()
    db.refresh(config)
    
    # Create audit log
    _create_audit_log(
        db=db,
        entity_type="remote_config",
        entity_id=config.id,
        action="create",
        changed_by=changed_by,
        new_values=config_data,
    )
    
    return config


def update_remote_config(
    db: Session,
    config: RemoteConfig,
    update_data: dict,
    changed_by: Optional[UUID] = None,
    reason: Optional[str] = None,
) -> RemoteConfig:
    """Update an existing remote config."""
    old_values = {}
    for key in update_data.keys():
        if hasattr(config, key):
            old_values[key] = getattr(config, key)
    
    for field, value in update_data.items():
        if hasattr(config, field):
            setattr(config, field, value)
    
    config.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(config)
    
    # Create audit log
    _create_audit_log(
        db=db,
        entity_type="remote_config",
        entity_id=config.id,
        action="update",
        changed_by=changed_by,
        old_values=old_values,
        new_values=update_data,
        reason=reason,
    )
    
    return config


def delete_remote_config(
    db: Session,
    config: RemoteConfig,
    changed_by: Optional[UUID] = None,
    reason: Optional[str] = None,
) -> None:
    """Soft delete a remote config."""
    config.deleted_at = datetime.utcnow()
    db.commit()
    
    # Create audit log
    _create_audit_log(
        db=db,
        entity_type="remote_config",
        entity_id=config.id,
        action="delete",
        changed_by=changed_by,
        reason=reason,
    )


# ═══════════════════════════════════════════════════════════════════════════════
# App Version CRUD
# ═══════════════════════════════════════════════════════════════════════════════

def get_app_version(db: Session, version_id: UUID) -> Optional[AppVersion]:
    """Get an app version by ID."""
    return db.query(AppVersion).filter(AppVersion.id == version_id).first()


def get_app_version_by_platform_and_version(
    db: Session,
    platform: str,
    version: str,
) -> Optional[AppVersion]:
    """Get an app version by platform and version string."""
    try:
        platform_enum = ConfigPlatform(platform)
    except ValueError:
        platform_enum = ConfigPlatform.ALL
    
    return db.query(AppVersion).filter(
        AppVersion.platform == platform_enum,
        AppVersion.version == version,
    ).first()


def get_latest_app_version(
    db: Session,
    platform: str,
) -> Optional[AppVersion]:
    """Get the latest app version for a platform."""
    try:
        platform_enum = ConfigPlatform(platform)
    except ValueError:
        platform_enum = ConfigPlatform.ALL
    
    # First try to get the one marked as latest
    latest = db.query(AppVersion).filter(
        AppVersion.platform == platform_enum,
        AppVersion.is_latest == True,
    ).first()
    
    if latest:
        return latest
    
    # Otherwise, get the most recently released version
    return db.query(AppVersion).filter(
        AppVersion.platform == platform_enum,
    ).order_by(AppVersion.released_at.desc()).first()


def get_app_versions(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    platform: Optional[str] = None,
) -> List[AppVersion]:
    """Get all app versions with optional platform filter."""
    query = db.query(AppVersion)
    
    if platform:
        try:
            platform_enum = ConfigPlatform(platform)
            query = query.filter(
                or_(
                    AppVersion.platform == platform_enum,
                    AppVersion.platform == ConfigPlatform.ALL,
                )
            )
        except ValueError:
            pass
    
    return query.order_by(AppVersion.created_at.desc()).offset(skip).limit(limit).all()


def create_app_version(
    db: Session,
    version_data: dict,
    changed_by: Optional[UUID] = None,
) -> AppVersion:
    """Create a new app version."""
    # Check for existing version
    platform = version_data.get("platform", "all")
    version = version_data["version"]
    existing = get_app_version_by_platform_and_version(db, platform, version)
    if existing:
        raise ValueError(f"Version '{version}' for platform '{platform}' already exists")
    
    # If this is marked as latest, unmark any other latest versions for this platform
    if version_data.get("is_latest"):
        db.query(AppVersion).filter(
            AppVersion.platform == platform,
            AppVersion.is_latest == True,
        ).update({"is_latest": False})
    
    app_version = AppVersion(**version_data)
    db.add(app_version)
    db.commit()
    db.refresh(app_version)
    
    # Create audit log
    _create_audit_log(
        db=db,
        entity_type="app_version",
        entity_id=app_version.id,
        action="create",
        changed_by=changed_by,
        new_values=version_data,
    )
    
    return app_version


def update_app_version(
    db: Session,
    app_version: AppVersion,
    update_data: dict,
    changed_by: Optional[UUID] = None,
    reason: Optional[str] = None,
) -> AppVersion:
    """Update an existing app version."""
    old_values = {}
    for key in update_data.keys():
        if hasattr(app_version, key):
            old_values[key] = getattr(app_version, key)
    
    # If marking as latest, unmark others
    if update_data.get("is_latest") and not app_version.is_latest:
        db.query(AppVersion).filter(
            AppVersion.platform == app_version.platform,
            AppVersion.is_latest == True,
        ).update({"is_latest": False})
    
    for field, value in update_data.items():
        if hasattr(app_version, field):
            setattr(app_version, field, value)
    
    app_version.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(app_version)
    
    # Create audit log
    _create_audit_log(
        db=db,
        entity_type="app_version",
        entity_id=app_version.id,
        action="update",
        changed_by=changed_by,
        old_values=old_values,
        new_values=update_data,
        reason=reason,
    )
    
    return app_version


# ═══════════════════════════════════════════════════════════════════════════════
# Audit Log
# ═══════════════════════════════════════════════════════════════════════════════

def _create_audit_log(
    db: Session,
    entity_type: str,
    entity_id: UUID,
    action: str,
    changed_by: Optional[UUID] = None,
    old_values: Optional[dict] = None,
    new_values: Optional[dict] = None,
    reason: Optional[str] = None,
) -> ConfigAuditLog:
    """Create an audit log entry."""
    log = ConfigAuditLog(
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        changed_by=changed_by,
        old_values=old_values or {},
        new_values=new_values or {},
        reason=reason,
    )
    db.add(log)
    db.commit()
    return log


def get_audit_logs(
    db: Session,
    entity_type: Optional[str] = None,
    entity_id: Optional[UUID] = None,
    skip: int = 0,
    limit: int = 100,
) -> List[ConfigAuditLog]:
    """Get audit logs with optional filtering."""
    query = db.query(ConfigAuditLog)
    
    if entity_type:
        query = query.filter(ConfigAuditLog.entity_type == entity_type)
    
    if entity_id:
        query = query.filter(ConfigAuditLog.entity_id == entity_id)
    
    return query.order_by(ConfigAuditLog.created_at.desc()).offset(skip).limit(limit).all()
