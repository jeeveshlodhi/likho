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

import jwt as jwt_lib
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import ALGORITHM
from app.modules.users.models import User

from . import crud, service
from . import s3_releases as s3_releases_mod
from .models import AppVersion as AppVersionModel
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

def require_admin(
    request: Request,
    db: Session = Depends(get_db),
) -> Optional[User]:
    """Dependency to require admin privileges.

    Supports two auth methods (checked in order):
    1. X-Admin-API-Key header — matches settings.ADMIN_API_KEY
    2. Bearer JWT token — must belong to a user with admin plan/email
    """
    # --- API key auth (for admin dashboard) ---
    api_key = request.headers.get("x-admin-api-key")
    if api_key:
        if settings.ADMIN_API_KEY and api_key == settings.ADMIN_API_KEY:
            return None  # Authorized; no user object needed
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin API key",
        )

    # --- Bearer JWT auth ---
    auth_header = request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin authentication required. Provide X-Admin-API-Key header or Bearer token.",
        )

    token = auth_header.split(" ", 1)[1]
    try:
        payload = jwt_lib.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        user_id: Optional[str] = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except jwt_lib.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt_lib.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()  # noqa: E712
    if not user:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User not found or inactive")

    admin_plans = {"enterprise", "team"}
    admin_email_prefixes = {"admin@", "jeevesh@"}
    is_admin = (
        user.plan.value in admin_plans
        or any(user.email.startswith(p) for p in admin_email_prefixes)
        or "admin" in user.email.lower()
    )
    if not is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin privileges required")

    return user


def _user_id(user: Optional[User]) -> Optional[UUID]:
    """Return user.id or None (when authenticated via API key)."""
    return user.id if user else None


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
    configs = service.get_effective_config(db, version, platform)

    feature_statuses = service.get_all_feature_statuses(
        db=db,
        version=version,
        platform=platform,
        device_id=device_id,
    )

    features = {
        key: status_val["enabled"]
        for key, status_val in feature_statuses.items()
    }

    feature_details = {
        key: FeatureCheckResponse(
            feature_key=key,
            enabled=status_val["enabled"],
            rollout_percentage=status_val["rollout_percentage"],
            reason=status_val.get("reason"),
        )
        for key, status_val in feature_statuses.items()
    }

    return DeviceConfigResponse(
        configs=configs,
        features=features,
        feature_details=feature_details,
    )


@public_router.get("/config/features", response_model=dict[str, FeatureCheckResponse])
def get_feature_flags_public(
    version: str = Query(..., description="App version (e.g., 1.2.3)"),
    platform: str = Query(..., description="Platform (windows, macos, linux)"),
    device_id: Optional[str] = Query(None, description="Unique device ID for A/B testing"),
    feature_key: Optional[str] = Query(None, description="Check specific feature only"),
    db: Session = Depends(get_db),
):
    """Get feature flags for a device."""
    if feature_key:
        status_val = service.is_feature_enabled(
            db=db,
            feature_key=feature_key,
            version=version,
            platform=platform,
            device_id=device_id,
        )
        return {
            feature_key: FeatureCheckResponse(
                feature_key=feature_key,
                enabled=status_val["enabled"],
                rollout_percentage=status_val["rollout_percentage"],
                reason=status_val.get("reason"),
            )
        }

    statuses = service.get_all_feature_statuses(
        db=db,
        version=version,
        platform=platform,
        device_id=device_id,
    )

    return {
        key: FeatureCheckResponse(
            feature_key=key,
            enabled=status_val["enabled"],
            rollout_percentage=status_val["rollout_percentage"],
            reason=status_val.get("reason"),
        )
        for key, status_val in statuses.items()
    }


@public_router.get("/config/version", response_model=VersionInfoResponse)
def get_version_info(
    version: str = Query(..., description="Current app version (e.g., 1.2.3)"),
    platform: str = Query(..., description="Platform (windows, macos, linux)"),
    db: Session = Depends(get_db),
):
    """Get version information for update checking."""
    result = service.check_version_requirements(db, version, platform)
    return VersionInfoResponse(**result)


@public_router.get("/config/maintenance")
def check_maintenance_mode(
    db: Session = Depends(get_db),
):
    """Check if maintenance mode is enabled."""
    return service.is_maintenance_mode(db)


@public_router.get("/config/releases/desktop", response_model=DesktopReleaseResponse)
def get_latest_desktop_release(
    db: Session = Depends(get_db),
):
    """Get the latest desktop app download URL for the homepage Download button."""
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
# Admin Endpoints - Dashboard Stats
# ═══════════════════════════════════════════════════════════════════════════════

@admin_router.get("/admin/stats")
def get_admin_stats(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(require_admin),
):
    """Get basic admin dashboard stats."""
    from app.modules.users.models import User as UserModel

    total_users = db.query(func.count(UserModel.id)).scalar() or 0
    total_versions = db.query(func.count(AppVersionModel.id)).scalar() or 0

    return {
        "total_users": total_users,
        "active_today": 0,  # requires last_seen_at tracking
        "feedback_count": 0,
        "error_count_24h": 0,
        "total_versions": total_versions,
    }


@admin_router.get("/admin/versions/distribution")
def get_version_distribution(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(require_admin),
):
    """Get version distribution stats (placeholder)."""
    versions = crud.get_app_versions(db, limit=20)
    return [
        {
            "version": v.version,
            "platform": v.platform.value if hasattr(v.platform, "value") else v.platform,
            "count": 0,
            "percentage": 0.0,
        }
        for v in versions
    ]


# ═══════════════════════════════════════════════════════════════════════════════
# Admin Endpoints - Releases (S3 presigned upload)
# ═══════════════════════════════════════════════════════════════════════════════

@admin_router.get("/admin/releases/presigned-upload")
def get_presigned_upload_url(
    filename: str = Query(..., min_length=1, description="Release file name (e.g. likho-0.1.0.dmg)"),
    current_user: Optional[User] = Depends(require_admin),
):
    """
    Get a presigned S3 URL to upload a release artifact.
    Requires AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_RELEASES_BUCKET to be set.
    Returns upload_url (PUT the file here) and public_url (use as download_url when registering).
    """
    if not settings.s3_releases_configured:
        raise HTTPException(
            status_code=503,
            detail="S3 releases not configured. Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_RELEASES_BUCKET.",
        )
    try:
        upload_url, public_url = s3_releases_mod.get_presigned_upload_url(filename)
        return {"upload_url": upload_url, "public_url": public_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@admin_router.get("/admin/releases/s3-status")
def get_s3_status(
    current_user: Optional[User] = Depends(require_admin),
):
    """Check S3 configuration status."""
    return {
        "configured": settings.s3_releases_configured,
        "bucket": settings.AWS_RELEASES_BUCKET or None,
        "region": settings.AWS_REGION,
        "prefix": settings.AWS_RELEASES_PREFIX,
    }


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
    current_user: Optional[User] = Depends(require_admin),
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
    current_user: Optional[User] = Depends(require_admin),
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
    current_user: Optional[User] = Depends(require_admin),
):
    """Create a new feature flag (admin only)."""
    try:
        flag = crud.create_feature_flag(
            db,
            flag_data=data.model_dump(),
            changed_by=_user_id(current_user),
        )
        return flag
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@admin_router.patch("/admin/features/{flag_id}", response_model=FeatureFlagResponse)
def update_feature_flag(
    flag_id: UUID,
    data: FeatureFlagUpdate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(require_admin),
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
        changed_by=_user_id(current_user),
    )
    return flag


@admin_router.post("/admin/features/{flag_id}/toggle", response_model=FeatureFlagResponse)
def toggle_feature_flag(
    flag_id: UUID,
    data: FeatureToggleRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(require_admin),
):
    """Toggle a feature flag on/off (admin only)."""
    flag = crud.get_feature_flag(db, flag_id)
    if not flag:
        raise HTTPException(status_code=404, detail="Feature flag not found")

    flag = crud.toggle_feature_flag(
        db,
        flag=flag,
        enabled=data.enabled,
        rollout_percentage=data.rollout_percentage,
        changed_by=_user_id(current_user),
        reason=data.reason,
    )
    return flag


@admin_router.delete("/admin/features/{flag_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_feature_flag(
    flag_id: UUID,
    reason: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(require_admin),
):
    """Soft delete a feature flag (admin only)."""
    flag = crud.get_feature_flag(db, flag_id)
    if not flag:
        raise HTTPException(status_code=404, detail="Feature flag not found")

    crud.delete_feature_flag(
        db,
        flag=flag,
        changed_by=_user_id(current_user),
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
    current_user: Optional[User] = Depends(require_admin),
):
    """List all remote configs (admin only)."""
    configs = crud.get_remote_configs(db, skip=skip, limit=limit)
    return configs


@admin_router.get("/admin/configs/{config_id}", response_model=RemoteConfigResponse)
def get_remote_config(
    config_id: UUID,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(require_admin),
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
    current_user: Optional[User] = Depends(require_admin),
):
    """Create a new remote config (admin only)."""
    try:
        config = crud.create_remote_config(
            db,
            config_data=data.model_dump(),
            changed_by=_user_id(current_user),
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
    current_user: Optional[User] = Depends(require_admin),
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
        changed_by=_user_id(current_user),
        reason=reason,
    )
    return config


@admin_router.delete("/admin/configs/{config_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_remote_config(
    config_id: UUID,
    reason: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(require_admin),
):
    """Soft delete a remote config (admin only)."""
    config = crud.get_remote_config(db, config_id)
    if not config:
        raise HTTPException(status_code=404, detail="Remote config not found")

    crud.delete_remote_config(
        db,
        config=config,
        changed_by=_user_id(current_user),
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
    current_user: Optional[User] = Depends(require_admin),
):
    """List all app versions (admin only)."""
    versions = crud.get_app_versions(db, skip=skip, limit=limit, platform=platform)
    return versions


@admin_router.get("/admin/versions/{version_id}", response_model=AppVersionResponse)
def get_app_version(
    version_id: UUID,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(require_admin),
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
    current_user: Optional[User] = Depends(require_admin),
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
            changed_by=_user_id(current_user),
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
    current_user: Optional[User] = Depends(require_admin),
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
        changed_by=_user_id(current_user),
        reason=reason,
    )
    return version


@admin_router.delete("/admin/versions/{version_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_app_version(
    version_id: UUID,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(require_admin),
):
    """Delete an app version (admin only)."""
    version = crud.get_app_version(db, version_id)
    if not version:
        raise HTTPException(status_code=404, detail="App version not found")
    db.delete(version)
    db.commit()


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
    current_user: Optional[User] = Depends(require_admin),
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
    current_user: Optional[User] = Depends(require_admin),
):
    """Emergency kill switch to immediately disable a feature."""
    try:
        flag = service.trigger_kill_switch(
            db,
            feature_key=feature_key,
            enabled=enabled,
            reason=reason,
            changed_by=_user_id(current_user),
        )
        return flag
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
