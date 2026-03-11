"""
CRUD operations for feedback and error tracking.
"""
from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session

from .models import Feedback, ErrorLog, AnalyticsEvent, DailyStats, FeedbackStatus, FeedbackType, ErrorType


# ============== Feedback CRUD ==============

def create_feedback(
    db: Session,
    type: str,
    message: str,
    app_version: str,
    platform: str,
    screenshot_url: Optional[str] = None,
    user_email: Optional[str] = None,
    user_id: Optional[UUID] = None,
    metadata: Optional[dict] = None,
) -> Feedback:
    """Create a new feedback entry."""
    feedback = Feedback(
        type=FeedbackType(type),
        message=message,
        app_version=app_version,
        platform=platform,
        screenshot_url=screenshot_url,
        user_email=user_email,
        user_id=user_id,
        metadata_json=metadata,
        status=FeedbackStatus.NEW,
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return feedback


def get_feedback(db: Session, feedback_id: UUID) -> Optional[Feedback]:
    """Get a feedback entry by ID."""
    return db.query(Feedback).filter(Feedback.id == feedback_id).first()


def list_feedback(
    db: Session,
    status: Optional[str] = None,
    type: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[Feedback], int]:
    """List feedback entries with optional filtering."""
    query = db.query(Feedback)
    
    if status:
        query = query.filter(Feedback.status == FeedbackStatus(status))
    if type:
        query = query.filter(Feedback.type == FeedbackType(type))
    
    total = query.count()
    items = (
        query
        .order_by(Feedback.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return items, total


def update_feedback_status(
    db: Session,
    feedback_id: UUID,
    status: str,
) -> Optional[Feedback]:
    """Update the status of a feedback entry."""
    feedback = get_feedback(db, feedback_id)
    if feedback:
        feedback.status = FeedbackStatus(status)
        db.commit()
        db.refresh(feedback)
    return feedback


def get_feedback_stats(db: Session, days: int = 30) -> dict:
    """Get feedback statistics for the last N days."""
    since = datetime.utcnow() - timedelta(days=days)
    
    total = (
        db.query(Feedback)
        .filter(Feedback.created_at >= since)
        .count()
    )
    
    by_type = (
        db.query(Feedback.type, func.count(Feedback.id))
        .filter(Feedback.created_at >= since)
        .group_by(Feedback.type)
        .all()
    )
    
    by_status = (
        db.query(Feedback.status, func.count(Feedback.id))
        .filter(Feedback.created_at >= since)
        .group_by(Feedback.status)
        .all()
    )
    
    return {
        "total": total,
        "by_type": {t.value: c for t, c in by_type},
        "by_status": {s.value: c for s, c in by_status},
    }


# ============== Error Log CRUD ==============

def create_error_log(
    db: Session,
    error_type: str,
    message: str,
    app_version: str,
    platform: str,
    stack_trace: Optional[str] = None,
    component: Optional[str] = None,
    action: Optional[str] = None,
    user_id: Optional[UUID] = None,
    metadata: Optional[dict] = None,
) -> ErrorLog:
    """Create a new error log entry."""
    # Check for similar recent errors (within 1 hour) to aggregate
    one_hour_ago = datetime.utcnow() - timedelta(hours=1)
    similar = (
        db.query(ErrorLog)
        .filter(
            ErrorLog.error_type == ErrorType(error_type),
            ErrorLog.message == message,
            ErrorLog.component == component,
            ErrorLog.created_at >= one_hour_ago,
        )
        .first()
    )
    
    if similar:
        # Aggregate with existing error
        similar.occurrence_count += 1
        similar.last_seen_at = datetime.utcnow()
        db.commit()
        db.refresh(similar)
        return similar
    
    error_log = ErrorLog(
        error_type=ErrorType(error_type),
        message=message,
        stack_trace=stack_trace,
        component=component,
        action=action,
        app_version=app_version,
        platform=platform,
        user_id=user_id,
        metadata_json=metadata,
    )
    db.add(error_log)
    db.commit()
    db.refresh(error_log)
    return error_log


def list_error_logs(
    db: Session,
    error_type: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[ErrorLog], int]:
    """List error logs with optional filtering."""
    query = db.query(ErrorLog)
    
    if error_type:
        query = query.filter(ErrorLog.error_type == ErrorType(error_type))
    
    total = query.count()
    items = (
        query
        .order_by(ErrorLog.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return items, total


def get_error_stats(db: Session, days: int = 7) -> dict:
    """Get error statistics for the last N days."""
    since = datetime.utcnow() - timedelta(days=days)
    
    total = (
        db.query(ErrorLog)
        .filter(ErrorLog.created_at >= since)
        .count()
    )
    
    by_type = (
        db.query(ErrorLog.error_type, func.count(ErrorLog.id))
        .filter(ErrorLog.created_at >= since)
        .group_by(ErrorLog.error_type)
        .all()
    )
    
    # Top erroring components
    top_components = (
        db.query(ErrorLog.component, func.count(ErrorLog.id))
        .filter(ErrorLog.created_at >= since)
        .group_by(ErrorLog.component)
        .order_by(func.count(ErrorLog.id).desc())
        .limit(5)
        .all()
    )
    
    return {
        "total": total,
        "by_type": {t.value: c for t, c in by_type},
        "top_components": [{"component": c, "count": n} for c, n in top_components if c],
    }


# ============== Analytics CRUD ==============

def create_analytics_event(
    db: Session,
    event_name: str,
    app_version: str,
    platform: str,
    properties: Optional[dict] = None,
    user_id: Optional[UUID] = None,
    session_id: Optional[str] = None,
) -> AnalyticsEvent:
    """Create a new analytics event."""
    event = AnalyticsEvent(
        event_name=event_name,
        properties=properties,
        user_id=user_id,
        session_id=session_id,
        app_version=app_version,
        platform=platform,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


def get_feature_usage_stats(
    db: Session,
    days: int = 7,
    limit: int = 20,
) -> list[dict]:
    """Get feature usage statistics for the last N days."""
    since = datetime.utcnow() - timedelta(days=days)
    
    stats = (
        db.query(
            AnalyticsEvent.event_name,
            func.count(AnalyticsEvent.id).label("count"),
            func.count(func.distinct(AnalyticsEvent.user_id)).label("unique_users"),
        )
        .filter(AnalyticsEvent.created_at >= since)
        .group_by(AnalyticsEvent.event_name)
        .order_by(func.count(AnalyticsEvent.id).desc())
        .limit(limit)
        .all()
    )
    
    return [
        {
            "event_name": name,
            "count": count,
            "unique_users": unique_users,
        }
        for name, count, unique_users in stats
    ]


def get_daily_active_users(db: Session, days: int = 30) -> list[dict]:
    """Get daily active users for the last N days."""
    since = datetime.utcnow() - timedelta(days=days)
    
    # Group by date and count unique sessions/users
    daily_stats = (
        db.query(
            func.date(AnalyticsEvent.created_at).label("date"),
            func.count(func.distinct(AnalyticsEvent.session_id)).label("sessions"),
            func.count(func.distinct(AnalyticsEvent.user_id)).label("users"),
            func.count(AnalyticsEvent.id).label("events"),
        )
        .filter(AnalyticsEvent.created_at >= since)
        .group_by(func.date(AnalyticsEvent.created_at))
        .order_by(func.date(AnalyticsEvent.created_at))
        .all()
    )
    
    return [
        {
            "date": date.isoformat() if date else None,
            "sessions": sessions,
            "users": users,
            "events": events,
        }
        for date, sessions, users, events in daily_stats
    ]


# ============== Daily Stats CRUD ==============

def get_or_create_daily_stats(db: Session, date: datetime) -> DailyStats:
    """Get or create daily stats for a specific date."""
    stats = (
        db.query(DailyStats)
        .filter(func.date(DailyStats.date) == date.date())
        .first()
    )
    
    if not stats:
        stats = DailyStats(date=date)
        db.add(stats)
        db.commit()
        db.refresh(stats)
    
    return stats


def update_daily_stats(db: Session, date: datetime = None) -> DailyStats:
    """Update daily stats by aggregating data from related tables."""
    if date is None:
        date = datetime.utcnow()
    
    stats = get_or_create_daily_stats(db, date)
    
    # Calculate date range
    start_of_day = date.replace(hour=0, minute=0, second=0, microsecond=0)
    end_of_day = start_of_day + timedelta(days=1)
    
    # Aggregate feedback
    feedback_count = (
        db.query(Feedback)
        .filter(
            Feedback.created_at >= start_of_day,
            Feedback.created_at < end_of_day,
        )
        .count()
    )
    
    bug_count = (
        db.query(Feedback)
        .filter(
            Feedback.created_at >= start_of_day,
            Feedback.created_at < end_of_day,
            Feedback.type == FeedbackType.BUG,
        )
        .count()
    )
    
    feature_count = (
        db.query(Feedback)
        .filter(
            Feedback.created_at >= start_of_day,
            Feedback.created_at < end_of_day,
            Feedback.type == FeedbackType.FEATURE,
        )
        .count()
    )
    
    # Aggregate errors
    error_count = (
        db.query(ErrorLog)
        .filter(
            ErrorLog.created_at >= start_of_day,
            ErrorLog.created_at < end_of_day,
        )
        .count()
    )
    
    error_types = (
        db.query(func.count(func.distinct(ErrorLog.error_type)))
        .filter(
            ErrorLog.created_at >= start_of_day,
            ErrorLog.created_at < end_of_day,
        )
        .scalar()
    )
    
    # Aggregate events
    event_count = (
        db.query(AnalyticsEvent)
        .filter(
            AnalyticsEvent.created_at >= start_of_day,
            AnalyticsEvent.created_at < end_of_day,
        )
        .count()
    )
    
    sessions = (
        db.query(func.count(func.distinct(AnalyticsEvent.session_id)))
        .filter(
            AnalyticsEvent.created_at >= start_of_day,
            AnalyticsEvent.created_at < end_of_day,
        )
        .scalar()
    )
    
    unique_users = (
        db.query(func.count(func.distinct(AnalyticsEvent.user_id)))
        .filter(
            AnalyticsEvent.created_at >= start_of_day,
            AnalyticsEvent.created_at < end_of_day,
        )
        .scalar()
    )
    
    # Update stats
    stats.total_feedback = feedback_count
    stats.bug_reports = bug_count
    stats.feature_requests = feature_count
    stats.total_errors = error_count
    stats.unique_error_types = error_types or 0
    stats.total_events = event_count
    stats.total_sessions = sessions or 0
    stats.unique_users = unique_users or 0
    
    db.commit()
    db.refresh(stats)
    return stats
