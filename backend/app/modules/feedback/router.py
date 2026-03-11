"""
API endpoints for feedback and monitoring.
"""
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_active_user, get_current_user_optional
from app.dependencies.rate_limit import rate_limit_feedback, rate_limit_authenticated, rate_limit_anonymous
from app.modules.users.models import User
from app.core.config import settings

from . import crud
from .schemas import (
    FeedbackCreate,
    FeedbackResponse,
    FeedbackListItem,
    FeedbackStatusUpdate,
    FeedbackListParams,
    ErrorLogCreate,
    ErrorLogResponse,
    AnalyticsEventCreate,
    AnalyticsEventResponse,
    FeatureUsageStats,
    DailyStatsResponse,
)

router = APIRouter()


def get_app_version() -> str:
    """Get the current app version."""
    # This could be fetched from config or environment
    return getattr(settings, "APP_VERSION", "0.1.0")


# ============== Feedback Endpoints ==============

@router.post("/feedback", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
def submit_feedback(
    data: FeedbackCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
    x_platform: str = Header(default="web", alias="X-Platform"),
    x_app_version: str = Header(default=None, alias="X-App-Version"),
    _: None = Depends(rate_limit_feedback)
):
    """
    Submit user feedback.
    
    Authentication is optional - anonymous feedback is accepted.
    Include system info headers for better context.
    """
    app_version = x_app_version or get_app_version()
    
    feedback = crud.create_feedback(
        db=db,
        type=data.type,
        message=data.message,
        app_version=app_version,
        platform=x_platform,
        screenshot_url=data.screenshot_url,
        user_email=data.user_email,
        user_id=current_user.id if current_user else None,
        metadata=data.metadata if data.include_system_info else None,
    )
    
    return feedback


@router.get("/admin/feedback", response_model=list[FeedbackListItem])
def list_all_feedback(
    status: Optional[str] = None,
    type: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    _: None = Depends(rate_limit_authenticated)
):
    """
    List all feedback (admin only).
    
    Requires admin privileges. Supports filtering by status and type.
    """
    # TODO: Add admin role check
    # For now, any authenticated user can access
    
    items, total = crud.list_feedback(
        db=db,
        status=status,
        type=type,
        limit=limit,
        offset=offset,
    )
    
    # Add pagination headers
    # response.headers["X-Total-Count"] = str(total)
    
    return items


@router.get("/admin/feedback/stats")
def get_feedback_statistics(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    _: None = Depends(rate_limit_authenticated)
):
    """Get feedback statistics (admin only)."""
    return crud.get_feedback_stats(db, days=days)


@router.patch("/admin/feedback/{feedback_id}/status", response_model=FeedbackResponse)
def update_feedback_status_endpoint(
    feedback_id: UUID,
    data: FeedbackStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    _: None = Depends(rate_limit_authenticated)
):
    """
    Update the status of a feedback item (admin only).
    """
    feedback = crud.update_feedback_status(db, feedback_id, data.status)
    if not feedback:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feedback not found",
        )
    return feedback


# ============== Error Log Endpoints ==============

@router.post("/errors", response_model=ErrorLogResponse, status_code=status.HTTP_201_CREATED)
def submit_error_log(
    data: ErrorLogCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
    x_platform: str = Header(default="web", alias="X-Platform"),
    x_app_version: str = Header(default=None, alias="X-App-Version"),
    _: None = Depends(rate_limit_anonymous)
):
    """
    Submit an error log from the client.
    
    Authentication is optional - anonymous error reports are accepted.
    Errors are aggregated to avoid duplicates within a time window.
    """
    app_version = x_app_version or get_app_version()
    
    error_log = crud.create_error_log(
        db=db,
        error_type=data.error_type,
        message=data.message,
        app_version=app_version,
        platform=x_platform,
        stack_trace=data.stack_trace,
        component=data.component,
        action=data.action,
        user_id=current_user.id if current_user else None,
        metadata=data.metadata,
    )
    
    return error_log


@router.get("/admin/errors", response_model=list[ErrorLogResponse])
def list_error_logs(
    error_type: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    _: None = Depends(rate_limit_authenticated)
):
    """List error logs (admin only)."""
    items, total = crud.list_error_logs(
        db=db,
        error_type=error_type,
        limit=limit,
        offset=offset,
    )
    return items


@router.get("/admin/errors/stats")
def get_error_statistics(
    days: int = 7,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    _: None = Depends(rate_limit_authenticated)
):
    """Get error statistics (admin only)."""
    return crud.get_error_stats(db, days=days)


# ============== Analytics Endpoints ==============

@router.post("/analytics/events", response_model=AnalyticsEventResponse, status_code=status.HTTP_201_CREATED)
def track_analytics_event(
    data: AnalyticsEventCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
    x_platform: str = Header(default="web", alias="X-Platform"),
    x_app_version: str = Header(default=None, alias="X-App-Version"),
    _: None = Depends(rate_limit_anonymous)
):
    """
    Track a feature usage event.
    
    Authentication is optional. Events are associated with users when possible,
    but session-based tracking works for anonymous users too.
    """
    app_version = x_app_version or get_app_version()
    
    event = crud.create_analytics_event(
        db=db,
        event_name=data.event_name,
        app_version=app_version,
        platform=x_platform,
        properties=data.properties,
        user_id=current_user.id if current_user else None,
        session_id=data.session_id,
    )
    
    return event


@router.get("/admin/analytics/features", response_model=list[FeatureUsageStats])
def get_feature_usage(
    days: int = 7,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    _: None = Depends(rate_limit_authenticated)
):
    """Get feature usage statistics (admin only)."""
    return crud.get_feature_usage_stats(db, days=days)


@router.get("/admin/analytics/dau")
def get_daily_active_users(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    _: None = Depends(rate_limit_authenticated)
):
    """Get daily active users (admin only)."""
    return crud.get_daily_active_users(db, days=days)


# ============== Health Check Endpoint ==============

@router.get("/health")
def health_check():
    """Simple health check endpoint for the monitoring system."""
    return {
        "status": "healthy",
        "version": get_app_version(),
        "features": {
            "feedback": True,
            "error_tracking": True,
            "analytics": True,
        },
    }
