"""
API endpoints for Remote Config, Feature Flags, and App Version management.

Public endpoints (no auth required):
- GET /config - Get all configs for a device
- GET /config/features - Get feature flags
- GET /config/version - Get version info

Admin endpoints (require admin authentication):
- POST /admin/config - Create/update config
- POST /admin/features - Toggle feature flags
- CRUD operations for feature flags, configs, and app versions
"""
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.modules.users.models import User

from . import crud, service
from .schemas import (
    # Responses
    FeatureFlagResponse,
    RemoteConfigResponse,
    AppVersionResponse,
    DeviceConfigRequest,
    DeviceConfigResponse,
    FeatureCheckResponse,
    VersionInfoResponse,
    DesktopReleaseResponse,
    # Create/Update
    FeatureFlagCreate,
    FeatureFlagUpdate,
    RemoteConfigCreate,
    RemoteConfigUpdate,
    AppVersionCreate,
    AppVersionUpdate,
    # Admin
    FeatureToggleRequest,
    ConfigAuditLogResponse,
)

# Router setup
public_router = APIRouter(tags=["remote-config"])
admin_router = APIRouter(tags=["remote-config-admin"])


# ═══════════════════════════════════════════════════════════════════════════════
# Helper Functions
# ═══════════════════════════════════════════════════════════════════════════════

def require_admin(current_user: User = Depends(get_current_active_user)) -> User:
    """Dependency to require admin privileges."""
    # TODO: Implement proper admin role checking
    # For now, we'll check if the user has a specific email domain or plan
    # This should be replaced with proper RBAC
    admin_plans = ["enterprise", "team"]
    admin_emails = ["admin@", "jeevesh@"]  # Add admin email patterns
    
    is_admin = (
        current_user.plan.value in admin_plans
        or any(current_user.email.startswith(pattern) for pattern in admin_emails)
    )
    
    # Also check if user has admin in their email for development
    if not is_admin and "admin" not in current_user.email.lower():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    
    return current_user


# ═══════════════════════════════════════════════════════════════════════════════
# Public Endpoints (for Tauri App)
# ═══════════════════════════════════════════════════════════════════════════════

@public_router.get("/config", response_model=DeviceConfigResponse)
def get_device_config(
    version: str = Query(..., description="App version (e.g., 1.2.3)"),
    platform: str = Query(..., description="Platform (windows, macos, linux)"),
    device_id: Optional[str] = Query(None, description="Unique device ID for A/B testing"),
    db: Session = Depends(get_db),
):
    """
    Get all configuration for a device.
    
    This endpoint returns:
    - All config values (with platform/version overrides applied)
    - All feature flags (with A/B testing applied if device_id provided)
    
    No authentication required - called on app startup.
    """
    # Get effective config values
    configs = service.get_effective_config(db, version, platform)
    
    # Get all feature flags
    feature_statuses = service.get_all_feature_statuses(
        db=db,
        version=version,
        platform=platform,
        device_id=device_id,
    )
    
    # Extract just the enabled status for simple feature checks
    features = {
        key: status["enabled"] 
        for key, status in feature_statuses.items()
    }
    
    # Convert to FeatureCheckResponse objects
    feature_details = {
        key: FeatureCheckResponse(
            feature_key=key,
            enabled=status["enabled"],
            rollout_percentage=status["rollout_percentage"],
            reason=status.get("reason"),
        )
        for key, status in feature_statuses.items()
    }
    
    return DeviceConfigResponse(
        configs=configs,
        features=features,
        feature_details=feature_details,
    )


@public_router.get("/config/features", response_model=dict[str, FeatureCheckResponse])
def get_feature_flags(
    version: str = Query(..., description="App version (e.g., 1.2.3)"),
    platform: str = Query(..., description="Platform (windows, macos, linux)"),
    device_id: Optional[str] = Query(None, description="Unique device ID for A/B testing"),
    feature_key: Optional[str] = Query(None, description="Check specific feature only"),
    db: Session = Depends(get_db),
):
    """
    Get feature flags for a device.
    
    Returns all feature flags with their enabled status for the given
    version, platform, and device. Supports A/B testing via rollout percentages.
    """
    if feature_key:
        # Check specific feature
        status = service.is_feature_enabled(
            db=db,
            feature_key=feature_key,
            version=version,
            platform=platform,
            device_id=device_id,
        )
        return {
            feature_key: FeatureCheckResponse(
                feature_key=feature_key,
                enabled=status["enabled"],
                rollout_percentage=status["rollout_percentage"],
                reason=status.get("reason"),
            )
        }
    
    # Get all features
    statuses = service.get_all_feature_statuses(
        db=db,
        version=version,
        platform=platform,
        device_id=device_id,
    )
    
    return {
        key: FeatureCheckResponse(
            feature_key=key,
            enabled=status["enabled"],
            rollout_percentage=status["rollout_percentage"],
            reason=status.get("reason"),
        )
        for key, status in statuses.items()
    }


@public_router.get("/config/version", response_model=VersionInfoResponse)
def get_version_info(
    version: str = Query(..., description="Current app version (e.g., 1.2.3)"),
    platform: str = Query(..., description="Platform (windows, macos, linux)"),
    db: Session = Depends(get_db),
):
    """
    Get version information for update checking.
    
    Returns:
    - Whether an update is available
    - Whether the update is required (force update)
    - Download URL and release notes
    """
    result = service.check_version_requirements(db, version, platform)
    return VersionInfoResponse(**result)


@public_router.get("/config/maintenance")
def check_maintenance_mode(
    db: Session = Depends(get_db),
):
    """
    Check if maintenance mode is enabled.
    
    Called by the app to check if the backend is under maintenance.
    If maintenance mode is on, the app should show a maintenance screen.
    """
    return service.is_maintenance_mode(db)


@public_router.get("/config/releases/desktop", response_model=DesktopReleaseResponse)
def get_latest_desktop_release(
    db: Session = Depends(get_db),
):
    """
    Get the latest desktop app download URL for the homepage Download button.
    No auth required. Returns version and download_url (e.g. S3 or CloudFront).
    Use a version with platform=all and update_url set to your Tauri build URL.
    """
    # Prefer "all" so one desktop entry works for all OSes; else fall back to any desktop-like platform
    for platform in ("all", "macos", "windows", "linux"):
        version = crud.get_latest_app_version(db, platform)
        if version and version.update_url:
            return DesktopReleaseResponse(
                version=version.version,
                download_url=version.update_url,
            )
    raise HTTPException(
        status_code=404,
        detail="No desktop release found. Add a version with platform=all and update_url in the admin.",
    )


# ═══════════════════════════════════════════════════════════════════════════════
# Admin Endpoints - Feature Flags
# ═══════════════════════════════════════════════════════════════════════════════

@admin_router.get("/admin/features", response_model=list[FeatureFlagResponse])
def list_feature_flags(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    enabled_only: bool = False,
    platform: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """List all feature flags (admin only)."""
    flags = crud.get_feature_flags(
        db,
        skip=skip,
        limit=limit,
        enabled_only=enabled_only,
        platform=platform,
    )
    return flags


@admin_router.get("/admin/features/{flag_id}", response_model=FeatureFlagResponse)
def get_feature_flag(
    flag_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Get a specific feature flag by ID (admin only)."""
    flag = crud.get_feature_flag(db, flag_id)
    if not flag:
        raise HTTPException(status_code=404, detail="Feature flag not found")
    return flag


@admin_router.post("/admin/features", response_model=FeatureFlagResponse, status_code=status.HTTP_201_CREATED)
def create_feature_flag(
    data: FeatureFlagCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Create a new feature flag (admin only)."""
    try:
        flag = crud.create_feature_flag(
            db,
            flag_data=data.model_dump(),
            changed_by=current_user.id,
        )
        return flag
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@admin_router.patch("/admin/features/{flag_id}", response_model=FeatureFlagResponse)
def update_feature_flag(
    flag_id: UUID,
    data: FeatureFlagUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Update a feature flag (admin only)."""
    flag = crud.get_feature_flag(db, flag_id)
    if not flag:
        raise HTTPException(status_code=404, detail="Feature flag not found")
    
    update_data = data.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    flag = crud.update_feature_flag(
        db,
        flag=flag,
        update_data=update_data,
        changed_by=current_user.id,
    )
    return flag


@admin_router.post("/admin/features/{flag_id}/toggle", response_model=FeatureFlagResponse)
def toggle_feature_flag(
    flag_id: UUID,
    data: FeatureToggleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Toggle a feature flag on/off (admin only).
    
    This is a convenience endpoint for quick enable/disable operations.
    """
    flag = crud.get_feature_flag(db, flag_id)
    if not flag:
        raise HTTPException(status_code=404, detail="Feature flag not found")
    
    flag = crud.toggle_feature_flag(
        db,
        flag=flag,
        enabled=data.enabled,
        rollout_percentage=data.rollout_percentage,
        changed_by=current_user.id,
        reason=data.reason,
    )
    return flag


@admin_router.delete("/admin/features/{flag_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_feature_flag(
    flag_id: UUID,
    reason: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Soft delete a feature flag (admin only)."""
    flag = crud.get_feature_flag(db, flag_id)
    if not flag:
        raise HTTPException(status_code=404, detail="Feature flag not found")
    
    crud.delete_feature_flag(
        db,
        flag=flag,
        changed_by=current_user.id,
        reason=reason,
    )


# ═══════════════════════════════════════════════════════════════════════════════
# Admin Endpoints - Remote Config
# ═══════════════════════════════════════════════════════════════════════════════

@admin_router.get("/admin/configs", response_model=list[RemoteConfigResponse])
def list_remote_configs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """List all remote configs (admin only)."""
    configs = crud.get_remote_configs(db, skip=skip, limit=limit)
    return configs


@admin_router.get("/admin/configs/{config_id}", response_model=RemoteConfigResponse)
def get_remote_config(
    config_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Get a specific remote config by ID (admin only)."""
    config = crud.get_remote_config(db, config_id)
    if not config:
        raise HTTPException(status_code=404, detail="Remote config not found")
    return config


@admin_router.post("/admin/configs", response_model=RemoteConfigResponse, status_code=status.HTTP_201_CREATED)
def create_remote_config(
    data: RemoteConfigCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Create a new remote config (admin only)."""
    try:
        config = crud.create_remote_config(
            db,
            config_data=data.model_dump(),
            changed_by=current_user.id,
        )
        return config
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@admin_router.patch("/admin/configs/{config_id}", response_model=RemoteConfigResponse)
def update_remote_config(
    config_id: UUID,
    data: RemoteConfigUpdate,
    reason: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Update a remote config (admin only)."""
    config = crud.get_remote_config(db, config_id)
    if not config:
        raise HTTPException(status_code=404, detail="Remote config not found")
    
    update_data = data.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    config = crud.update_remote_config(
        db,
        config=config,
        update_data=update_data,
        changed_by=current_user.id,
        reason=reason,
    )
    return config


@admin_router.delete("/admin/configs/{config_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_remote_config(
    config_id: UUID,
    reason: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Soft delete a remote config (admin only)."""
    config = crud.get_remote_config(db, config_id)
    if not config:
        raise HTTPException(status_code=404, detail="Remote config not found")
    
    crud.delete_remote_config(
        db,
        config=config,
        changed_by=current_user.id,
        reason=reason,
    )


# ═══════════════════════════════════════════════════════════════════════════════
# Admin Endpoints - App Versions
# ═══════════════════════════════════════════════════════════════════════════════

@admin_router.get("/admin/versions", response_model=list[AppVersionResponse])
def list_app_versions(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    platform: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """List all app versions (admin only)."""
    versions = crud.get_app_versions(db, skip=skip, limit=limit, platform=platform)
    return versions


@admin_router.get("/admin/versions/{version_id}", response_model=AppVersionResponse)
def get_app_version(
    version_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Get a specific app version by ID (admin only)."""
    version = crud.get_app_version(db, version_id)
    if not version:
        raise HTTPException(status_code=404, detail="App version not found")
    return version


@admin_router.post("/admin/versions", response_model=AppVersionResponse, status_code=status.HTTP_201_CREATED)
def create_app_version(
    data: AppVersionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Create a new app version (admin only)."""
    try:
        version_data = data.model_dump()
        version_data.pop("download_url", None)  # stored as update_url
        if version_data.get("platform") == "desktop":
            version_data["platform"] = "all"  # desktop -> all for single installer
        version = crud.create_app_version(
            db,
            version_data=version_data,
            changed_by=current_user.id,
        )
        return version
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@admin_router.patch("/admin/versions/{version_id}", response_model=AppVersionResponse)
def update_app_version(
    version_id: UUID,
    data: AppVersionUpdate,
    reason: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Update an app version (admin only)."""
    version = crud.get_app_version(db, version_id)
    if not version:
        raise HTTPException(status_code=404, detail="App version not found")
    
    update_data = data.model_dump(exclude_unset=True)
    update_data.pop("download_url", None)  # stored as update_url
    if update_data.get("platform") == "desktop":
        update_data["platform"] = "all"
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    version = crud.update_app_version(
        db,
        app_version=version,
        update_data=update_data,
        changed_by=current_user.id,
        reason=reason,
    )
    return version


# ═══════════════════════════════════════════════════════════════════════════════
# Admin Endpoints - Audit Logs
# ═══════════════════════════════════════════════════════════════════════════════

@admin_router.get("/admin/audit-logs", response_model=list[ConfigAuditLogResponse])
def list_audit_logs(
    entity_type: Optional[str] = Query(None, description="Filter by entity type"),
    entity_id: Optional[UUID] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """List configuration audit logs (admin only)."""
    logs = crud.get_audit_logs(
        db,
        entity_type=entity_type,
        entity_id=entity_id,
        skip=skip,
        limit=limit,
    )
    return logs


# ═══════════════════════════════════════════════════════════════════════════════
# Admin Endpoints - Kill Switch
# ═══════════════════════════════════════════════════════════════════════════════

@admin_router.post("/admin/kill-switch/{feature_key}", response_model=FeatureFlagResponse)
def trigger_kill_switch(
    feature_key: str,
    enabled: bool = False,
    reason: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Emergency kill switch to immediately disable a feature.
    
    This is a convenience endpoint for emergency situations.
    """
    try:
        flag = service.trigger_kill_switch(
            db,
            feature_key=feature_key,
            enabled=enabled,
            reason=reason,
            changed_by=current_user.id,
        )
        return flag
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
