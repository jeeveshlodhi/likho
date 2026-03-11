"""
SQLAlchemy models for notification settings.
"""
from datetime import datetime
from enum import Enum as PyEnum
from typing import Optional

from sqlalchemy import Column, String, Text, DateTime, Boolean, Integer, JSON, Index
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, ARRAY
import uuid

from app.core.base import Base


class NotificationPlatform(str, PyEnum):
    """Supported notification platforms."""
    DISCORD = "discord"
    SLACK = "slack"


class NotificationEventType(str, PyEnum):
    """Types of events that can trigger notifications."""
    FEEDBACK = "feedback"           # New feedback submitted
    ERROR = "error"                 # Critical error occurred
    NEW_USER = "new_user"           # New user signed up
    USER_UPGRADE = "user_upgrade"   # User upgraded plan
    DAILY_STATS = "daily_stats"     # Daily statistics summary
    SYSTEM_ALERT = "system_alert"   # System-level alerts


class WebhookConfig(Base):
    """
    Webhook configuration for Discord/Slack notifications.
    Stores encrypted webhook URLs and notification preferences.
    """
    __tablename__ = "webhook_configs"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Webhook settings
    platform = Column(
        String(20),
        nullable=False,
        default=NotificationPlatform.DISCORD.value
    )  # 'discord' or 'slack'
    webhook_url_encrypted = Column(Text, nullable=False)  # Fernet encrypted URL
    webhook_url_hash = Column(String(64), nullable=False, index=True)  # SHA-256 hash for lookup
    
    # Event subscriptions (which events to notify on)
    enabled_events = Column(
        ARRAY(String(50)),
        nullable=False,
        default=lambda: [
            NotificationEventType.FEEDBACK.value,
            NotificationEventType.ERROR.value,
            NotificationEventType.NEW_USER.value,
        ]
    )
    
    # Rate limiting settings
    rate_limit_per_minute = Column(Integer, default=30)  # Max notifications per minute
    rate_limit_per_hour = Column(Integer, default=100)   # Max notifications per hour
    
    # Cooldown periods (in seconds) for specific event types to prevent spam
    cooldown_seconds = Column(
        JSON,
        nullable=False,
        default=lambda: {
            NotificationEventType.FEEDBACK.value: 0,      # No cooldown for feedback
            NotificationEventType.ERROR.value: 60,        # 1 min cooldown for same error
            NotificationEventType.NEW_USER.value: 0,      # No cooldown for new users
            NotificationEventType.USER_UPGRADE.value: 0,  # No cooldown for upgrades
            NotificationEventType.DAILY_STATS.value: 3600, # 1 hour between stats
            NotificationEventType.SYSTEM_ALERT.value: 0,  # No cooldown for system alerts
        }
    )
    
    # Notification content settings
    include_user_info = Column(Boolean, default=True)
    include_stack_traces = Column(Boolean, default=True)
    include_metadata = Column(Boolean, default=True)
    admin_dashboard_url = Column(String(500), nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True)
    last_tested_at = Column(DateTime(timezone=True), nullable=True)
    last_error_at = Column(DateTime(timezone=True), nullable=True)
    last_error_message = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Indexes
    __table_args__ = (
        Index("idx_webhook_configs_active", "is_active", "platform"),
    )


class NotificationLog(Base):
    """
    Log of sent notifications for rate limiting and debugging.
    """
    __tablename__ = "notification_logs"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Reference to webhook config
    webhook_config_id = Column(PG_UUID(as_uuid=True), nullable=False, index=True)
    
    # Event details
    event_type = Column(String(50), nullable=False, index=True)
    event_id = Column(String(255), nullable=True)  # ID of the related entity (feedback_id, user_id, etc.)
    
    # Notification details
    platform = Column(String(20), nullable=False)
    success = Column(Boolean, nullable=False)
    response_status = Column(Integer, nullable=True)  # HTTP status code
    error_message = Column(Text, nullable=True)
    
    # Content summary (for debugging, not full content)
    summary = Column(String(500), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, index=True)
    
    # Indexes
    __table_args__ = (
        Index("idx_notification_logs_config_created", "webhook_config_id", "created_at"),
        Index("idx_notification_logs_event_type_created", "event_type", "created_at"),
    )


class RateLimitBucket(Base):
    """
    Token bucket for rate limiting notifications per event type.
    """
    __tablename__ = "rate_limit_buckets"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Composite key components (event_type + event_identifier)
    event_type = Column(String(50), nullable=False, index=True)
    event_identifier = Column(String(255), nullable=False)  # e.g., error message hash for errors
    
    # Token bucket state
    tokens = Column(Integer, default=1)  # Current tokens in bucket
    last_refill_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    
    # Cooldown tracking
    last_notification_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    
    # Indexes
    __table_args__ = (
        Index("idx_rate_limit_buckets_lookup", "event_type", "event_identifier"),
    )
