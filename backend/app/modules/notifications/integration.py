"""
Integration module for notifications with other parts of the app.
Provides helper functions to trigger notifications from various events.
"""
import asyncio
from typing import Optional

from sqlalchemy.orm import Session

from app.modules.feedback.models import Feedback, ErrorLog
from app.modules.users.models import User

from .service import NotificationService


class NotificationIntegration:
    """
    Integration helper for sending notifications from various app events.
    
    Usage:
        # In feedback router after creating feedback
        await notify_feedback_submitted(db, feedback)
        
        # In auth router after user signup
        await notify_new_user_signup(db, user)
        
        # In error tracking after critical error
        await notify_critical_error(db, error_log)
    """
    
    @staticmethod
    async def notify_feedback_submitted(db: Session, feedback: Feedback) -> None:
        """
        Notify when new feedback is submitted.
        
        Call this after creating a feedback entry.
        """
        service = NotificationService(db)
        try:
            await service.notify_feedback(feedback)
        finally:
            await service.close()
    
    @staticmethod
    async def notify_critical_error(db: Session, error: ErrorLog) -> None:
        """
        Notify when a critical error occurs.
        
        Call this after creating an error log entry.
        Only sends notifications for error types: crash, exception
        """
        if error.error_type.value not in ["crash", "exception"]:
            return
        
        service = NotificationService(db)
        try:
            await service.notify_error(error)
        finally:
            await service.close()
    
    @staticmethod
    async def notify_new_user_signup(db: Session, user: User) -> None:
        """
        Notify when a new user signs up.
        
        Call this after creating a user account.
        """
        service = NotificationService(db)
        try:
            await service.notify_new_user(user)
        finally:
            await service.close()
    
    @staticmethod
    async def send_system_alert(
        db: Session,
        title: str,
        message: str,
        level: str = "info",
        metadata: Optional[dict] = None,
    ) -> None:
        """
        Send a system alert notification.
        
        Args:
            db: Database session
            title: Alert title
            message: Alert message
            level: Alert level (info, warning, error, success)
            metadata: Additional metadata to include
        """
        service = NotificationService(db)
        try:
            await service.notify_system_alert(title, message, level, metadata)
        finally:
            await service.close()


# ============== Convenience Functions ==============

async def notify_feedback_submitted(db: Session, feedback: Feedback) -> None:
    """Convenience function to notify on new feedback."""
    await NotificationIntegration.notify_feedback_submitted(db, feedback)


async def notify_critical_error(db: Session, error: ErrorLog) -> None:
    """Convenience function to notify on critical error."""
    await NotificationIntegration.notify_critical_error(db, error)


async def notify_new_user_signup(db: Session, user: User) -> None:
    """Convenience function to notify on new user signup."""
    await NotificationIntegration.notify_new_user_signup(db, user)


async def send_system_alert(
    db: Session,
    title: str,
    message: str,
    level: str = "info",
    metadata: Optional[dict] = None,
) -> None:
    """Convenience function to send system alert."""
    await NotificationIntegration.send_system_alert(db, title, message, level, metadata)


# ============== Synchronous Wrappers (for use in sync contexts) ==============

def notify_feedback_submitted_sync(db: Session, feedback: Feedback) -> None:
    """Synchronous wrapper for notify_feedback_submitted."""
    try:
        asyncio.run(notify_feedback_submitted(db, feedback))
    except Exception:
        # Fail silently - don't break the user experience
        pass


def notify_critical_error_sync(db: Session, error: ErrorLog) -> None:
    """Synchronous wrapper for notify_critical_error."""
    try:
        asyncio.run(notify_critical_error(db, error))
    except Exception:
        # Fail silently - don't break error reporting
        pass


def notify_new_user_signup_sync(db: Session, user: User) -> None:
    """Synchronous wrapper for notify_new_user_signup."""
    try:
        asyncio.run(notify_new_user_signup(db, user))
    except Exception:
        # Fail silently - don't break the signup flow
        pass
