"""
Admin API endpoints for notification configuration.
"""
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.modules.users.models import User

from . import service as notification_service
from .schemas import (
    WebhookConfigCreate,
    WebhookConfigUpdate,
    WebhookConfigResponse,
    WebhookConfigDetailedResponse,
    TestNotificationRequest,
    TestNotificationResponse,
    NotificationStatsResponse,
)
from .models import WebhookConfig, NotificationLog

router = APIRouter()


def mask_webhook_url(url: str) -> str:
    """Create a masked preview of webhook URL."""
    if len(url) <= 20:
        return "***"
    return f"{url[:10]}...{url[-5:]}"


def _check_admin_access(user: User) -> None:
    """Check if user has admin access."""
    # TODO: Implement proper admin role check
    # For now, any active user can access
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )


# ============== Webhook Configuration Endpoints ==============

@router.post(
    "/admin/notifications/webhook",
    response_model=WebhookConfigDetailedResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_webhook_config(
    data: WebhookConfigCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Create a new webhook configuration for Discord or Slack.
    
    Requires admin privileges.
    """
    _check_admin_access(current_user)
    
    # Check if webhook URL already exists
    url_hash = notification_service.hash_webhook_url(data.webhook_url)
    existing = (
        db.query(WebhookConfig)
        .filter(WebhookConfig.webhook_url_hash == url_hash)
        .first()
    )
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A webhook configuration with this URL already exists",
        )
    
    # Encrypt webhook URL
    encrypted_url = notification_service.encrypt_webhook_url(data.webhook_url)
    
    # Create config
    config = WebhookConfig(
        platform=data.platform,
        webhook_url_encrypted=encrypted_url,
        webhook_url_hash=url_hash,
        enabled_events=data.enabled_events,
        rate_limit_per_minute=data.rate_limit_per_minute,
        rate_limit_per_hour=data.rate_limit_per_hour,
        include_user_info=data.include_user_info,
        include_stack_traces=data.include_stack_traces,
        include_metadata=data.include_metadata,
        admin_dashboard_url=data.admin_dashboard_url,
        is_active=True,
    )
    
    db.add(config)
    db.commit()
    db.refresh(config)
    
    # Build response with URL preview
    response_data = {
        **{k: v for k, v in config.__dict__.items() if not k.startswith("_")},
        "webhook_url_preview": mask_webhook_url(data.webhook_url),
    }
    return response_data


@router.get(
    "/admin/notifications/webhook",
    response_model=list[WebhookConfigDetailedResponse],
)
async def list_webhook_configs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    List all webhook configurations.
    
    Requires admin privileges.
    """
    _check_admin_access(current_user)
    
    configs = db.query(WebhookConfig).order_by(WebhookConfig.created_at.desc()).all()
    
    # Add URL preview to each config
    response_data = []
    for config in configs:
        try:
            decrypted_url = notification_service.decrypt_webhook_url(config.webhook_url_encrypted)
            url_preview = mask_webhook_url(decrypted_url)
        except Exception:
            url_preview = "***decryption-error***"
        
        response_data.append({
            **{k: v for k, v in config.__dict__.items() if not k.startswith("_")},
            "webhook_url_preview": url_preview,
        })
    
    return response_data


@router.get(
    "/admin/notifications/webhook/{config_id}",
    response_model=WebhookConfigDetailedResponse,
)
async def get_webhook_config(
    config_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get a specific webhook configuration.
    
    Requires admin privileges.
    """
    _check_admin_access(current_user)
    
    config = db.query(WebhookConfig).filter(WebhookConfig.id == config_id).first()
    
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Webhook configuration not found",
        )
    
    # Add URL preview
    try:
        decrypted_url = notification_service.decrypt_webhook_url(config.webhook_url_encrypted)
        url_preview = mask_webhook_url(decrypted_url)
    except Exception:
        url_preview = "***decryption-error***"
    
    response_data = {
        **{k: v for k, v in config.__dict__.items() if not k.startswith("_")},
        "webhook_url_preview": url_preview,
    }
    return response_data


@router.patch(
    "/admin/notifications/webhook/{config_id}",
    response_model=WebhookConfigDetailedResponse,
)
async def update_webhook_config(
    config_id: UUID,
    data: WebhookConfigUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Update a webhook configuration.
    
    Requires admin privileges.
    """
    _check_admin_access(current_user)
    
    config = db.query(WebhookConfig).filter(WebhookConfig.id == config_id).first()
    
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Webhook configuration not found",
        )
    
    # Update fields
    if data.platform is not None:
        config.platform = data.platform
    
    if data.webhook_url is not None:
        config.webhook_url_encrypted = notification_service.encrypt_webhook_url(data.webhook_url)
        config.webhook_url_hash = notification_service.hash_webhook_url(data.webhook_url)
    
    if data.enabled_events is not None:
        config.enabled_events = data.enabled_events
    
    if data.rate_limit_per_minute is not None:
        config.rate_limit_per_minute = data.rate_limit_per_minute
    
    if data.rate_limit_per_hour is not None:
        config.rate_limit_per_hour = data.rate_limit_per_hour
    
    if data.include_user_info is not None:
        config.include_user_info = data.include_user_info
    
    if data.include_stack_traces is not None:
        config.include_stack_traces = data.include_stack_traces
    
    if data.include_metadata is not None:
        config.include_metadata = data.include_metadata
    
    if data.admin_dashboard_url is not None:
        config.admin_dashboard_url = data.admin_dashboard_url
    
    if data.is_active is not None:
        config.is_active = data.is_active
    
    db.commit()
    db.refresh(config)
    
    # Add URL preview
    try:
        decrypted_url = notification_service.decrypt_webhook_url(config.webhook_url_encrypted)
        url_preview = mask_webhook_url(decrypted_url)
    except Exception:
        url_preview = "***decryption-error***"
    
    response_data = {
        **{k: v for k, v in config.__dict__.items() if not k.startswith("_")},
        "webhook_url_preview": url_preview,
    }
    return response_data


@router.delete(
    "/admin/notifications/webhook/{config_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_webhook_config(
    config_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Delete a webhook configuration.
    
    Requires admin privileges.
    """
    _check_admin_access(current_user)
    
    config = db.query(WebhookConfig).filter(WebhookConfig.id == config_id).first()
    
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Webhook configuration not found",
        )
    
    db.delete(config)
    db.commit()
    
    return None


# ============== Test Notification Endpoint ==============

@router.post(
    "/admin/notifications/webhook/{config_id}/test",
    response_model=TestNotificationResponse,
)
async def test_webhook_config(
    config_id: UUID,
    data: Optional[TestNotificationRequest] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Send a test notification to verify webhook configuration.
    
    Requires admin privileges.
    """
    _check_admin_access(current_user)
    
    config = db.query(WebhookConfig).filter(WebhookConfig.id == config_id).first()
    
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Webhook configuration not found",
        )
    
    event_type = data.event_type if data else "system_alert"
    custom_message = data.custom_message if data else None
    
    success, status, error, response_time = await notification_service.send_test_notification(
        db, config, event_type, custom_message
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={
                "success": False,
                "message": f"Failed to send test notification: {error}",
                "platform": config.platform,
                "response_status": status,
                "response_time_ms": round(response_time, 2),
            },
        )
    
    return {
        "success": True,
        "message": f"Test notification sent successfully to {config.platform}",
        "platform": config.platform,
        "response_status": status,
        "response_time_ms": round(response_time, 2),
    }


@router.post(
    "/admin/notifications/test-all",
    response_model=list[TestNotificationResponse],
)
async def test_all_webhook_configs(
    data: Optional[TestNotificationRequest] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Send test notifications to all active webhook configurations.
    
    Requires admin privileges.
    """
    _check_admin_access(current_user)
    
    configs = db.query(WebhookConfig).filter(WebhookConfig.is_active == True).all()
    
    if not configs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active webhook configurations found",
        )
    
    results = []
    event_type = data.event_type if data else "system_alert"
    custom_message = data.custom_message if data else None
    
    for config in configs:
        success, status, error, response_time = await notification_service.send_test_notification(
            db, config, event_type, custom_message
        )
        
        results.append({
            "success": success,
            "message": f"Test {'successful' if success else 'failed'} for {config.platform}",
            "platform": config.platform,
            "response_status": status,
            "response_time_ms": round(response_time, 2),
        })
    
    return results


# ============== Statistics Endpoint ==============

@router.get(
    "/admin/notifications/stats",
    response_model=NotificationStatsResponse,
)
async def get_notification_stats(
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get notification statistics and recent logs.
    
    Requires admin privileges.
    """
    _check_admin_access(current_user)
    
    from datetime import datetime, timedelta
    from sqlalchemy import func
    
    # Calculate statistics
    total_sent = db.query(NotificationLog).filter(NotificationLog.success == True).count()
    total_failed = db.query(NotificationLog).filter(NotificationLog.success == False).count()
    
    last_24h = datetime.utcnow() - timedelta(hours=24)
    last_24h_sent = (
        db.query(NotificationLog)
        .filter(NotificationLog.success == True, NotificationLog.created_at >= last_24h)
        .count()
    )
    last_24h_failed = (
        db.query(NotificationLog)
        .filter(NotificationLog.success == False, NotificationLog.created_at >= last_24h)
        .count()
    )
    
    # Stats by event type
    event_type_stats = (
        db.query(NotificationLog.event_type, func.count(NotificationLog.id))
        .group_by(NotificationLog.event_type)
        .all()
    )
    
    by_event_type = {event: count for event, count in event_type_stats}
    
    # Recent logs
    recent_logs = (
        db.query(NotificationLog)
        .order_by(NotificationLog.created_at.desc())
        .limit(limit)
        .all()
    )
    
    return {
        "total_sent": total_sent,
        "total_failed": total_failed,
        "last_24h_sent": last_24h_sent,
        "last_24h_failed": last_24h_failed,
        "by_event_type": by_event_type,
        "recent_logs": recent_logs,
    }
