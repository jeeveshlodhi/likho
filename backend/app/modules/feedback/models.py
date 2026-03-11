"""
SQLAlchemy models for feedback and error tracking.
"""
from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import (
    Column, String, Text, DateTime, Enum as SQLEnum, Index, JSON, Integer
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
import uuid

from app.core.base import Base


class FeedbackType(str, PyEnum):
    """Types of user feedback."""
    BUG = "bug"
    FEATURE = "feature"
    PRAISE = "praise"


class FeedbackStatus(str, PyEnum):
    """Status of feedback items."""
    NEW = "new"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"


class Feedback(Base):
    """User feedback submissions for beta testing."""
    __tablename__ = "feedback"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Feedback content
    type = Column(SQLEnum(FeedbackType), nullable=False, index=True)
    message = Column(Text, nullable=False)
    screenshot_url = Column(String(500), nullable=True)
    
    # User info (optional for privacy)
    user_email = Column(String(255), nullable=True, index=True)
    user_id = Column(PG_UUID(as_uuid=True), nullable=True, index=True)
    
    # App context
    app_version = Column(String(50), nullable=False)
    platform = Column(String(50), nullable=False)  # 'macos', 'windows', 'linux', 'web'
    metadata_json = Column(JSON, nullable=True)  # Additional context (browser, os version, etc.)
    
    # Tracking
    status = Column(
        SQLEnum(FeedbackStatus), 
        nullable=False, 
        default=FeedbackStatus.NEW,
        index=True
    )
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, index=True)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Indexes
    __table_args__ = (
        Index("idx_feedback_status_created", "status", "created_at"),
        Index("idx_feedback_type_created", "type", "created_at"),
    )


class ErrorType(str, PyEnum):
    """Types of application errors."""
    CRASH = "crash"
    EXCEPTION = "exception"
    WARNING = "warning"
    NETWORK = "network"
    SYNC = "sync"


class ErrorLog(Base):
    """Application error logs from client-side tracking."""
    __tablename__ = "error_logs"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Error details
    error_type = Column(SQLEnum(ErrorType), nullable=False, index=True)
    message = Column(Text, nullable=False)
    stack_trace = Column(Text, nullable=True)
    
    # Context
    component = Column(String(255), nullable=True)  # React component or module name
    action = Column(String(255), nullable=True)  # What user was doing when error occurred
    
    # User and app context
    user_id = Column(PG_UUID(as_uuid=True), nullable=True, index=True)
    app_version = Column(String(50), nullable=False)
    platform = Column(String(50), nullable=False)
    
    # Additional metadata (browser, os, etc.)
    metadata_json = Column(JSON, nullable=True)
    
    # Occurrence tracking
    occurrence_count = Column(Integer, default=1)  # For duplicate error aggregation
    first_seen_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    last_seen_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, index=True)
    
    # Indexes
    __table_args__ = (
        Index("idx_error_logs_type_created", "error_type", "created_at"),
        Index("idx_error_logs_user_created", "user_id", "created_at"),
    )


class AnalyticsEvent(Base):
    """Feature usage analytics events."""
    __tablename__ = "analytics_events"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Event details
    event_name = Column(String(100), nullable=False, index=True)
    properties = Column(JSON, nullable=True)  # Event-specific properties
    
    # User context (hashed/anonymized for privacy)
    user_id = Column(PG_UUID(as_uuid=True), nullable=True, index=True)
    session_id = Column(String(64), nullable=True, index=True)  # Hashed session identifier
    
    # App context
    app_version = Column(String(50), nullable=False)
    platform = Column(String(50), nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, index=True)
    
    # Indexes
    __table_args__ = (
        Index("idx_analytics_event_name_created", "event_name", "created_at"),
        Index("idx_analytics_session_created", "session_id", "created_at"),
    )


class DailyStats(Base):
    """Aggregated daily statistics for app health metrics."""
    __tablename__ = "daily_stats"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Date (unique per day)
    date = Column(DateTime(timezone=True), nullable=False, unique=True, index=True)
    
    # Active users (approximate, using session count)
    total_sessions = Column(Integer, default=0)
    unique_users = Column(Integer, default=0)
    
    # Engagement
    avg_session_duration_seconds = Column(Integer, nullable=True)
    total_events = Column(Integer, default=0)
    
    # Errors
    total_errors = Column(Integer, default=0)
    unique_error_types = Column(Integer, default=0)
    
    # Feedback
    total_feedback = Column(Integer, default=0)
    bug_reports = Column(Integer, default=0)
    feature_requests = Column(Integer, default=0)
    
    # Metadata
    app_version_breakdown = Column(JSON, nullable=True)  # {version: count}
    platform_breakdown = Column(JSON, nullable=True)  # {platform: count}
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
