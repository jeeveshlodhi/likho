"""
Pydantic schemas for feedback and error tracking.
"""
from datetime import datetime
from typing import Optional, Any
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


# ============== Feedback Schemas ==============

class FeedbackType:
    """Feedback type constants."""
    BUG = "bug"
    FEATURE = "feature"
    PRAISE = "praise"


class FeedbackStatus:
    """Feedback status constants."""
    NEW = "new"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"


class FeedbackCreate(BaseModel):
    """Schema for creating feedback."""
    type: str = Field(..., pattern="^(bug|feature|praise)$")
    message: str = Field(..., min_length=10, max_length=5000)
    screenshot_url: Optional[str] = Field(None, max_length=500)
    user_email: Optional[EmailStr] = None
    include_system_info: bool = Field(default=True, description="Include app version and platform")
    metadata: Optional[dict[str, Any]] = None


class FeedbackResponse(BaseModel):
    """Schema for feedback response."""
    id: UUID
    type: str
    message: str
    screenshot_url: Optional[str]
    user_email: Optional[str]
    app_version: str
    platform: str
    status: str
    created_at: datetime
    
    model_config = {"from_attributes": True}


class FeedbackListItem(BaseModel):
    """Schema for listing feedback (admin view)."""
    id: UUID
    type: str
    message: str
    screenshot_url: Optional[str]
    user_email: Optional[str]
    app_version: str
    platform: str
    status: str
    created_at: datetime
    
    model_config = {"from_attributes": True}


class FeedbackStatusUpdate(BaseModel):
    """Schema for updating feedback status."""
    status: str = Field(..., pattern="^(new|in_progress|resolved|closed)$")


class FeedbackListParams(BaseModel):
    """Query parameters for listing feedback."""
    status: Optional[str] = None
    type: Optional[str] = None
    limit: int = Field(default=50, ge=1, le=100)
    offset: int = Field(default=0, ge=0)


# ============== Error Log Schemas ==============

class ErrorType:
    """Error type constants."""
    CRASH = "crash"
    EXCEPTION = "exception"
    WARNING = "warning"
    NETWORK = "network"
    SYNC = "sync"


class ErrorLogCreate(BaseModel):
    """Schema for submitting error logs from client."""
    error_type: str = Field(..., pattern="^(crash|exception|warning|network|sync)$")
    message: str = Field(..., min_length=1, max_length=2000)
    stack_trace: Optional[str] = Field(None, max_length=10000)
    component: Optional[str] = Field(None, max_length=255)
    action: Optional[str] = Field(None, max_length=255)
    metadata: Optional[dict[str, Any]] = None


class ErrorLogResponse(BaseModel):
    """Schema for error log response."""
    id: UUID
    error_type: str
    message: str
    stack_trace: Optional[str]
    component: Optional[str]
    action: Optional[str]
    app_version: str
    platform: str
    created_at: datetime
    
    model_config = {"from_attributes": True}


# ============== Analytics Schemas ==============

class AnalyticsEventCreate(BaseModel):
    """Schema for creating analytics events."""
    event_name: str = Field(..., min_length=1, max_length=100)
    properties: Optional[dict[str, Any]] = None
    session_id: Optional[str] = Field(None, max_length=64)


class AnalyticsEventResponse(BaseModel):
    """Schema for analytics event response."""
    id: UUID
    event_name: str
    properties: Optional[dict[str, Any]]
    session_id: Optional[str]
    app_version: str
    platform: str
    created_at: datetime
    
    model_config = {"from_attributes": True}


class FeatureUsageStats(BaseModel):
    """Schema for feature usage statistics."""
    event_name: str
    count: int
    unique_users: int


class DailyStatsResponse(BaseModel):
    """Schema for daily statistics."""
    date: datetime
    total_sessions: int
    unique_users: int
    avg_session_duration_seconds: Optional[int]
    total_events: int
    total_errors: int
    unique_error_types: int
    total_feedback: int
    bug_reports: int
    feature_requests: int
    
    model_config = {"from_attributes": True}


# ============== System Info Schema ==============

class SystemInfo(BaseModel):
    """Schema for system information."""
    app_version: str
    platform: str
    user_agent: Optional[str] = None
    os_version: Optional[str] = None
    screen_resolution: Optional[str] = None
