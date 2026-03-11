"""
Analytics service for tracking feature usage and app health metrics.
"""
import hashlib
import time
from datetime import datetime, timedelta
from typing import Optional, Any
from uuid import UUID

from sqlalchemy.orm import Session

from app.modules.feedback import crud as feedback_crud
from app.modules.feedback.models import AnalyticsEvent


class AnalyticsService:
    """Service for tracking analytics events and calculating metrics."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def track_event(
        self,
        event_name: str,
        app_version: str,
        platform: str,
        properties: Optional[dict[str, Any]] = None,
        user_id: Optional[UUID] = None,
        session_id: Optional[str] = None,
    ) -> AnalyticsEvent:
        """
        Track a feature usage event.
        
        Args:
            event_name: Name of the event (e.g., "page_created", "export_pdf")
            app_version: Current app version
            platform: Platform (macos, windows, linux, web)
            properties: Additional event properties
            user_id: User ID if authenticated
            session_id: Session identifier for grouping events
        """
        return feedback_crud.create_analytics_event(
            db=self.db,
            event_name=event_name,
            app_version=app_version,
            platform=platform,
            properties=properties,
            user_id=user_id,
            session_id=session_id,
        )
    
    def get_session_id(self, user_id: Optional[UUID] = None) -> str:
        """
        Generate a session ID based on user and time.
        
        This is a simple implementation. In production, you might want to:
        - Use a proper session management system
        - Store session ID in localStorage and reuse across page loads
        - Add more entropy for better uniqueness
        """
        # Create a deterministic session for the day
        today = datetime.utcnow().strftime("%Y-%m-%d")
        user_str = str(user_id) if user_id else "anonymous"
        session_string = f"{user_str}:{today}:{time.time() // 3600}"  # Hourly rotation
        return hashlib.sha256(session_string.encode()).hexdigest()[:32]
    
    def track_page_view(
        self,
        page_id: str,
        app_version: str,
        platform: str,
        user_id: Optional[UUID] = None,
        session_id: Optional[str] = None,
    ) -> AnalyticsEvent:
        """Track a page view event."""
        return self.track_event(
            event_name="page_viewed",
            app_version=app_version,
            platform=platform,
            properties={"page_id": page_id},
            user_id=user_id,
            session_id=session_id,
        )
    
    def track_feature_used(
        self,
        feature_name: str,
        app_version: str,
        platform: str,
        user_id: Optional[UUID] = None,
        session_id: Optional[str] = None,
        metadata: Optional[dict] = None,
    ) -> AnalyticsEvent:
        """
        Track when a specific feature is used.
        
        Args:
            feature_name: Name of the feature (e.g., "ai_suggestions", "collaboration")
        """
        return self.track_event(
            event_name=f"feature_{feature_name}",
            app_version=app_version,
            platform=platform,
            properties=metadata,
            user_id=user_id,
            session_id=session_id,
        )
    
    def track_export(
        self,
        format: str,
        app_version: str,
        platform: str,
        user_id: Optional[UUID] = None,
        session_id: Optional[str] = None,
    ) -> AnalyticsEvent:
        """Track an export event."""
        return self.track_event(
            event_name="content_exported",
            app_version=app_version,
            platform=platform,
            properties={"format": format},
            user_id=user_id,
            session_id=session_id,
        )
    
    def get_feature_usage(
        self,
        days: int = 7,
        limit: int = 20,
    ) -> list[dict]:
        """Get feature usage statistics."""
        return feedback_crud.get_feature_usage_stats(self.db, days=days, limit=limit)
    
    def get_daily_active_users(self, days: int = 30) -> list[dict]:
        """Get daily active users over time."""
        return feedback_crud.get_daily_active_users(self.db, days=days)
    
    def calculate_session_duration(
        self,
        session_id: str,
        user_id: Optional[UUID] = None,
    ) -> Optional[int]:
        """
        Calculate the duration of a session in seconds.
        
        This is approximate based on first and last event timestamps.
        """
        events = (
            self.db.query(AnalyticsEvent)
            .filter(
                AnalyticsEvent.session_id == session_id,
                AnalyticsEvent.user_id == user_id if user_id else True,
            )
            .order_by(AnalyticsEvent.created_at)
            .all()
        )
        
        if len(events) < 2:
            return None
        
        first_event = events[0]
        last_event = events[-1]
        duration = (last_event.created_at - first_event.created_at).total_seconds()
        
        return int(duration)
    
    def get_average_session_duration(
        self,
        days: int = 7,
    ) -> dict:
        """
        Get average session duration statistics.
        
        Returns:
            Dict with average, min, max session durations in seconds
        """
        since = datetime.utcnow() - timedelta(days=days)
        
        # Get all sessions in the period
        sessions = (
            self.db.query(AnalyticsEvent.session_id)
            .filter(
                AnalyticsEvent.created_at >= since,
                AnalyticsEvent.session_id.isnot(None),
            )
            .distinct()
            .all()
        )
        
        durations = []
        for (session_id,) in sessions:
            duration = self.calculate_session_duration(session_id)
            if duration:
                durations.append(duration)
        
        if not durations:
            return {
                "average": 0,
                "min": 0,
                "max": 0,
                "count": 0,
            }
        
        return {
            "average": sum(durations) / len(durations),
            "min": min(durations),
            "max": max(durations),
            "count": len(durations),
        }


# ============== Convenience Functions ==============

def get_analytics_service(db: Session) -> AnalyticsService:
    """Get an analytics service instance."""
    return AnalyticsService(db)


def track_event_safe(
    db: Session,
    event_name: str,
    app_version: str,
    platform: str,
    properties: Optional[dict] = None,
    user_id: Optional[UUID] = None,
    session_id: Optional[str] = None,
) -> Optional[AnalyticsEvent]:
    """
    Track an event safely, catching any errors.
    
    Use this for fire-and-forget analytics that shouldn't crash the app.
    """
    try:
        service = AnalyticsService(db)
        return service.track_event(
            event_name=event_name,
            app_version=app_version,
            platform=platform,
            properties=properties,
            user_id=user_id,
            session_id=session_id,
        )
    except Exception:
        # Silently fail - analytics should never break the app
        return None
