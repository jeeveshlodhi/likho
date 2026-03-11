"""
Pydantic schemas for notification settings and webhooks.
"""
from datetime import datetime
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class NotificationPlatform:
    """Supported notification platforms."""
    DISCORD = "discord"
    SLACK = "slack"


class NotificationEventType:
    """Types of events that can trigger notifications."""
    FEEDBACK = "feedback"
    ERROR = "error"
    NEW_USER = "new_user"
    USER_UPGRADE = "user_upgrade"
    DAILY_STATS = "daily_stats"
    SYSTEM_ALERT = "system_alert"


VALID_EVENT_TYPES = [
    NotificationEventType.FEEDBACK,
    NotificationEventType.ERROR,
    NotificationEventType.NEW_USER,
    NotificationEventType.USER_UPGRADE,
    NotificationEventType.DAILY_STATS,
    NotificationEventType.SYSTEM_ALERT,
]


# ============== Webhook Configuration Schemas ==============

class WebhookConfigCreate(BaseModel):
    """Schema for creating webhook configuration."""
    platform: str = Field(..., pattern="^(discord|slack)$")
    webhook_url: str = Field(..., min_length=10, max_length=1000)
    enabled_events: List[str] = Field(
        default=[
            NotificationEventType.FEEDBACK,
            NotificationEventType.ERROR,
            NotificationEventType.NEW_USER,
        ]
    )
    rate_limit_per_minute: int = Field(default=30, ge=1, le=1000)
    rate_limit_per_hour: int = Field(default=100, ge=1, le=10000)
    include_user_info: bool = True
    include_stack_traces: bool = True
    include_metadata: bool = True
    admin_dashboard_url: Optional[str] = Field(None, max_length=500)
    
    @field_validator("enabled_events")
    @classmethod
    def validate_event_types(cls, v):
        invalid_events = [e for e in v if e not in VALID_EVENT_TYPES]
        if invalid_events:
            raise ValueError(f"Invalid event types: {invalid_events}")
        return v


class WebhookConfigUpdate(BaseModel):
    """Schema for updating webhook configuration."""
    platform: Optional[str] = Field(None, pattern="^(discord|slack)$")
    webhook_url: Optional[str] = Field(None, min_length=10, max_length=1000)
    enabled_events: Optional[List[str]] = None
    rate_limit_per_minute: Optional[int] = Field(None, ge=1, le=1000)
    rate_limit_per_hour: Optional[int] = Field(None, ge=1, le=10000)
    include_user_info: Optional[bool] = None
    include_stack_traces: Optional[bool] = None
    include_metadata: Optional[bool] = None
    admin_dashboard_url: Optional[str] = Field(None, max_length=500)
    is_active: Optional[bool] = None
    
    @field_validator("enabled_events")
    @classmethod
    def validate_event_types(cls, v):
        if v is None:
            return v
        invalid_events = [e for e in v if e not in VALID_EVENT_TYPES]
        if invalid_events:
            raise ValueError(f"Invalid event types: {invalid_events}")
        return v


class WebhookConfigResponse(BaseModel):
    """Schema for webhook configuration response (excluding sensitive data)."""
    id: UUID
    platform: str
    enabled_events: List[str]
    rate_limit_per_minute: int
    rate_limit_per_hour: int
    include_user_info: bool
    include_stack_traces: bool
    include_metadata: bool
    admin_dashboard_url: Optional[str]
    is_active: bool
    last_tested_at: Optional[datetime]
    last_error_at: Optional[datetime]
    last_error_message: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    model_config = {"from_attributes": True}


class WebhookConfigDetailedResponse(WebhookConfigResponse):
    """Schema with additional info like webhook URL preview."""
    webhook_url_preview: str  # First 10 chars + ... + last 5 chars
    
    model_config = {"from_attributes": True}


# ============== Test Notification Schemas ==============

class TestNotificationRequest(BaseModel):
    """Schema for sending test notification."""
    event_type: str = Field(default="system_alert", pattern="^(feedback|error|new_user|user_upgrade|daily_stats|system_alert)$")
    custom_message: Optional[str] = Field(None, max_length=1000)


class TestNotificationResponse(BaseModel):
    """Schema for test notification response."""
    success: bool
    message: str
    platform: str
    response_status: Optional[int] = None
    response_time_ms: Optional[float] = None


# ============== Notification Log Schemas ==============

class NotificationLogResponse(BaseModel):
    """Schema for notification log entry."""
    id: UUID
    event_type: str
    event_id: Optional[str]
    platform: str
    success: bool
    response_status: Optional[int]
    error_message: Optional[str]
    summary: Optional[str]
    created_at: datetime
    
    model_config = {"from_attributes": True}


class NotificationStatsResponse(BaseModel):
    """Schema for notification statistics."""
    total_sent: int
    total_failed: int
    last_24h_sent: int
    last_24h_failed: int
    by_event_type: dict
    recent_logs: List[NotificationLogResponse]
