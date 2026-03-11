"""
Notification service for Discord and Slack webhooks.
"""
import hashlib
import json
import time
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from uuid import UUID

import httpx
from cryptography.fernet import Fernet
from sqlalchemy.orm import Session

from app.core.config import settings
from app.modules.feedback.models import Feedback, ErrorLog
from app.modules.users.models import User

from .models import (
    WebhookConfig,
    NotificationLog,
    RateLimitBucket,
    NotificationPlatform,
    NotificationEventType,
)


# ============== Encryption Utilities ==============

def get_fernet() -> Fernet:
    """Get or create Fernet cipher for encrypting webhook URLs."""
    # Derive a 32-byte key from SECRET_KEY using SHA-256
    key = hashlib.sha256(settings.SECRET_KEY.encode()).digest()
    # Encode to base64 URL-safe format (Fernet requires this)
    import base64
    fernet_key = base64.urlsafe_b64encode(key)
    return Fernet(fernet_key)


def encrypt_webhook_url(url: str) -> str:
    """Encrypt webhook URL for storage."""
    fernet = get_fernet()
    return fernet.encrypt(url.encode()).decode()


def decrypt_webhook_url(encrypted_url: str) -> str:
    """Decrypt webhook URL from storage."""
    fernet = get_fernet()
    return fernet.decrypt(encrypted_url.encode()).decode()


def hash_webhook_url(url: str) -> str:
    """Create SHA-256 hash of webhook URL for lookup."""
    return hashlib.sha256(url.encode()).hexdigest()


# ============== Discord Embed Builders ==============

# Color codes for Discord embeds
DISCORD_COLORS = {
    "feedback": 0x57F287,     # Green
    "error": 0xED4245,        # Red
    "new_user": 0x5865F2,     # Blue
    "user_upgrade": 0xFEE75C, # Yellow
    "info": 0x5865F2,         # Blue
    "warning": 0xFEE75C,      # Yellow
    "system_alert": 0xEB459E, # Pink
}


def create_discord_embed(
    title: str,
    description: str,
    color: int,
    fields: Optional[List[Dict[str, Any]]] = None,
    footer: Optional[Dict[str, str]] = None,
    timestamp: Optional[str] = None,
    url: Optional[str] = None,
    author: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Create a Discord embed object."""
    embed = {
        "title": title,
        "description": description,
        "color": color,
    }
    if fields:
        embed["fields"] = fields
    if footer:
        embed["footer"] = footer
    if timestamp:
        embed["timestamp"] = timestamp
    if url:
        embed["url"] = url
    if author:
        embed["author"] = author
    return embed


def format_feedback_notification_discord(
    feedback: Feedback,
    admin_url: Optional[str] = None,
    include_metadata: bool = True,
) -> Dict[str, Any]:
    """Format feedback data as a Discord webhook payload."""
    # Map feedback type to emoji
    type_emojis = {
        "bug": "🐛",
        "feature": "✨",
        "praise": "🎉",
    }
    emoji = type_emojis.get(feedback.type.value, "📝")
    
    # Build description
    description_parts = [f"{feedback.message[:500]}{'...' if len(feedback.message) > 500 else ''}"]
    
    if include_metadata and feedback.metadata_json:
        metadata_lines = []
        for key, value in feedback.metadata_json.items():
            if key in ["browser", "os", "screen_resolution", "user_agent"]:
                metadata_lines.append(f"• **{key}**: {value}")
        if metadata_lines:
            description_parts.append("\n\n**System Info:**\n" + "\n".join(metadata_lines))
    
    # Build fields
    fields = [
        {
            "name": "📧 User",
            "value": feedback.user_email or "Anonymous",
            "inline": True,
        },
        {
            "name": "🖥️ Platform",
            "value": feedback.platform or "Unknown",
            "inline": True,
        },
        {
            "name": "📱 Version",
            "value": feedback.app_version or "Unknown",
            "inline": True,
        },
    ]
    
    if feedback.screenshot_url:
        fields.append({
            "name": "📸 Screenshot",
            "value": f"[View Screenshot]({feedback.screenshot_url})",
            "inline": False,
        })
    
    embed = create_discord_embed(
        title=f"{emoji} New {feedback.type.value.title()} Feedback",
        description="\n".join(description_parts),
        color=DISCORD_COLORS["feedback"],
        fields=fields,
        footer={"text": f"Feedback ID: {feedback.id}"},
        timestamp=feedback.created_at.isoformat() if feedback.created_at else None,
        url=f"{admin_url}/feedback/{feedback.id}" if admin_url else None,
    )
    
    return {
        "content": None,
        "embeds": [embed],
    }


def format_error_notification_discord(
    error: ErrorLog,
    admin_url: Optional[str] = None,
    include_stack_trace: bool = True,
) -> Dict[str, Any]:
    """Format error log data as a Discord webhook payload."""
    # Map error type to emoji
    type_emojis = {
        "crash": "💥",
        "exception": "⚠️",
        "warning": "⚡",
        "network": "🌐",
        "sync": "🔄",
    }
    emoji = type_emojis.get(error.error_type.value, "⚠️")
    
    # Build description
    description = f"**{error.message[:400]}{'...' if len(error.message) > 400 else ''}**"
    
    if include_stack_trace and error.stack_trace:
        # Truncate stack trace for Discord (max 1024 chars per field)
        stack = error.stack_trace[:1000] + "..." if len(error.stack_trace) > 1000 else error.stack_trace
        description += f"\n\n```\n{stack}\n```"
    
    # Build fields
    fields = [
        {
            "name": "🔴 Type",
            "value": error.error_type.value,
            "inline": True,
        },
        {
            "name": "🧩 Component",
            "value": error.component or "Unknown",
            "inline": True,
        },
        {
            "name": "⚡ Action",
            "value": error.action or "Unknown",
            "inline": True,
        },
        {
            "name": "🖥️ Platform",
            "value": error.platform or "Unknown",
            "inline": True,
        },
        {
            "name": "📱 Version",
            "value": error.app_version or "Unknown",
            "inline": True,
        },
    ]
    
    if error.occurrence_count and error.occurrence_count > 1:
        fields.append({
            "name": "🔁 Occurrences",
            "value": str(error.occurrence_count),
            "inline": True,
        })
    
    embed = create_discord_embed(
        title=f"{emoji} {error.error_type.value.title()} Error",
        description=description,
        color=DISCORD_COLORS["error"],
        fields=fields,
        footer={"text": f"Error ID: {error.id}"},
        timestamp=error.created_at.isoformat() if error.created_at else None,
        url=f"{admin_url}/errors/{error.id}" if admin_url else None,
    )
    
    return {
        "content": None,
        "embeds": [embed],
    }


def format_new_user_notification_discord(
    user: User,
    admin_url: Optional[str] = None,
) -> Dict[str, Any]:
    """Format new user signup as a Discord webhook payload."""
    fields = [
        {
            "name": "📧 Email",
            "value": user.email,
            "inline": True,
        },
        {
            "name": "👤 Name",
            "value": user.full_name or "Not provided",
            "inline": True,
        },
        {
            "name": "💎 Plan",
            "value": user.plan.value if user.plan else "Free",
            "inline": True,
        },
    ]
    
    embed = create_discord_embed(
        title="🎉 New Beta User Signup!",
        description=f"**{user.full_name or user.email}** just joined the Likho beta!",
        color=DISCORD_COLORS["new_user"],
        fields=fields,
        footer={"text": f"User ID: {user.id}"},
        timestamp=user.created_at.isoformat() if user.created_at else None,
        url=f"{admin_url}/users/{user.id}" if admin_url else None,
    )
    
    return {
        "content": None,
        "embeds": [embed],
    }


def format_system_alert_discord(
    title: str,
    message: str,
    level: str = "info",
    metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Format a system alert as a Discord webhook payload."""
    color_map = {
        "info": DISCORD_COLORS["info"],
        "warning": DISCORD_COLORS["warning"],
        "error": DISCORD_COLORS["error"],
        "success": DISCORD_COLORS["feedback"],
    }
    
    fields = []
    if metadata:
        for key, value in metadata.items():
            fields.append({
                "name": key,
                "value": str(value)[:1000],
                "inline": True,
            })
    
    embed = create_discord_embed(
        title=f"🔔 {title}",
        description=message,
        color=color_map.get(level, DISCORD_COLORS["info"]),
        fields=fields if fields else None,
        timestamp=datetime.utcnow().isoformat(),
    )
    
    return {
        "content": None,
        "embeds": [embed],
    }


# ============== Slack Block Builders ==============

def create_slack_block(
    text: str,
    block_type: str = "section",
    accessory: Optional[Dict] = None,
) -> Dict[str, Any]:
    """Create a Slack block element."""
    block = {
        "type": block_type,
        "text": {
            "type": "mrkdwn",
            "text": text,
        },
    }
    if accessory:
        block["accessory"] = accessory
    return block


def format_feedback_notification_slack(
    feedback: Feedback,
    admin_url: Optional[str] = None,
    include_metadata: bool = True,
) -> Dict[str, Any]:
    """Format feedback data as a Slack webhook payload."""
    type_emojis = {
        "bug": "🐛",
        "feature": "✨",
        "praise": "🎉",
    }
    emoji = type_emojis.get(feedback.type.value, "📝")
    
    # Truncate message if too long
    message = feedback.message[:500] + "..." if len(feedback.message) > 500 else feedback.message
    
    blocks = [
        {
            "type": "header",
            "text": {
                "type": "plain_text",
                "text": f"{emoji} New {feedback.type.value.title()} Feedback",
            },
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f"*{message}*",
            },
        },
        {
            "type": "context",
            "elements": [
                {
                    "type": "mrkdwn",
                    "text": f"📧 *User:* {feedback.user_email or 'Anonymous'} | 🖥️ *Platform:* {feedback.platform or 'Unknown'}",
                },
            ],
        },
    ]
    
    # Add metadata if available
    if include_metadata and feedback.metadata_json:
        metadata_text = ""
        for key, value in feedback.metadata_json.items():
            if key in ["browser", "os", "screen_resolution"]:
                metadata_text += f"• *{key}:* {value}\n"
        if metadata_text:
            blocks.append({
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*System Info:*\n{metadata_text}",
                },
            })
    
    # Add screenshot if available
    if feedback.screenshot_url:
        blocks.append({
            "type": "image",
            "image_url": feedback.screenshot_url,
            "alt_text": "Screenshot",
        })
    
    # Add actions
    actions = {
        "type": "actions",
        "elements": [],
    }
    if admin_url:
        actions["elements"].append({
            "type": "button",
            "text": {
                "type": "plain_text",
                "text": "View in Admin",
            },
            "url": f"{admin_url}/feedback/{feedback.id}",
            "style": "primary",
        })
    blocks.append(actions)
    
    return {
        "blocks": blocks,
    }


def format_error_notification_slack(
    error: ErrorLog,
    admin_url: Optional[str] = None,
    include_stack_trace: bool = True,
) -> Dict[str, Any]:
    """Format error log data as a Slack webhook payload."""
    type_emojis = {
        "crash": "💥",
        "exception": "⚠️",
        "warning": "⚡",
        "network": "🌐",
        "sync": "🔄",
    }
    emoji = type_emojis.get(error.error_type.value, "⚠️")
    
    # Truncate message
    message = error.message[:400] + "..." if len(error.message) > 400 else error.message
    
    blocks = [
        {
            "type": "header",
            "text": {
                "type": "plain_text",
                "text": f"{emoji} {error.error_type.value.title()} Error",
            },
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f"*{message}*",
            },
        },
    ]
    
    # Add context fields
    context_parts = [
        f"🔴 *Type:* {error.error_type.value}",
        f"🧩 *Component:* {error.component or 'Unknown'}",
        f"⚡ *Action:* {error.action or 'Unknown'}",
    ]
    if error.occurrence_count and error.occurrence_count > 1:
        context_parts.append(f"🔁 *Occurrences:* {error.occurrence_count}")
    
    blocks.append({
        "type": "context",
        "elements": [
            {
                "type": "mrkdwn",
                "text": " | ".join(context_parts),
            },
        ],
    })
    
    # Add stack trace in collapsible section (Slack doesn't have true collapsible,
    # but we can use a section with code block)
    if include_stack_trace and error.stack_trace:
        stack = error.stack_trace[:1000] + "..." if len(error.stack_trace) > 1000 else error.stack_trace
        blocks.append({
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f"*Stack Trace:*\n```\n{stack}\n```",
            },
        })
    
    # Add actions
    actions = {
        "type": "actions",
        "elements": [],
    }
    if admin_url:
        actions["elements"].append({
            "type": "button",
            "text": {
                "type": "plain_text",
                "text": "View in Admin",
            },
            "url": f"{admin_url}/errors/{error.id}",
            "style": "danger",
        })
    blocks.append(actions)
    
    return {
        "blocks": blocks,
    }


def format_new_user_notification_slack(
    user: User,
    admin_url: Optional[str] = None,
) -> Dict[str, Any]:
    """Format new user signup as a Slack webhook payload."""
    blocks = [
        {
            "type": "header",
            "text": {
                "type": "plain_text",
                "text": "🎉 New Beta User Signup!",
            },
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f"*<mailto:{user.email}|{user.full_name or user.email}>* just joined the Likho beta!",
            },
        },
        {
            "type": "context",
            "elements": [
                {
                    "type": "mrkdwn",
                    "text": f"📧 *Email:* {user.email} | 💎 *Plan:* {user.plan.value if user.plan else 'Free'}",
                },
            ],
        },
    ]
    
    if admin_url:
        blocks.append({
            "type": "actions",
            "elements": [
                {
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "text": "View User",
                    },
                    "url": f"{admin_url}/users/{user.id}",
                    "style": "primary",
                },
            ],
        })
    
    return {
        "blocks": blocks,
    }


def format_system_alert_slack(
    title: str,
    message: str,
    level: str = "info",
    metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Format a system alert as a Slack webhook payload."""
    emoji_map = {
        "info": "ℹ️",
        "warning": "⚠️",
        "error": "🚨",
        "success": "✅",
    }
    emoji = emoji_map.get(level, "ℹ️")
    
    blocks = [
        {
            "type": "header",
            "text": {
                "type": "plain_text",
                "text": f"{emoji} {title}",
            },
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": message,
            },
        },
    ]
    
    if metadata:
        meta_text = "\n".join([f"*{k}:* {v}" for k, v in metadata.items()])
        blocks.append({
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": meta_text,
            },
        })
    
    return {
        "blocks": blocks,
    }


# ============== Core Notification Service ==============

class NotificationService:
    """Service for sending notifications to Discord and Slack."""
    
    def __init__(self, db: Session):
        self.db = db
        self._http_client: Optional[httpx.AsyncClient] = None
    
    async def _get_http_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client."""
        if self._http_client is None:
            self._http_client = httpx.AsyncClient(timeout=30.0)
        return self._http_client
    
    async def send_discord_notification(
        self,
        webhook_url: str,
        payload: Dict[str, Any],
    ) -> tuple[bool, int, Optional[str]]:
        """
        Send notification to Discord webhook.
        
        Returns:
            Tuple of (success, status_code, error_message)
        """
        try:
            client = await self._get_http_client()
            response = await client.post(
                webhook_url,
                json=payload,
                headers={"Content-Type": "application/json"},
            )
            
            if response.status_code in [200, 204]:
                return True, response.status_code, None
            else:
                return False, response.status_code, f"HTTP {response.status_code}: {response.text}"
        
        except httpx.TimeoutException:
            return False, 0, "Request timeout"
        except Exception as e:
            return False, 0, str(e)
    
    async def send_slack_notification(
        self,
        webhook_url: str,
        payload: Dict[str, Any],
    ) -> tuple[bool, int, Optional[str]]:
        """
        Send notification to Slack webhook.
        
        Returns:
            Tuple of (success, status_code, error_message)
        """
        try:
            client = await self._get_http_client()
            response = await client.post(
                webhook_url,
                json=payload,
                headers={"Content-Type": "application/json"},
            )
            
            if response.status_code == 200 and response.text == "ok":
                return True, response.status_code, None
            else:
                return False, response.status_code, f"HTTP {response.status_code}: {response.text}"
        
        except httpx.TimeoutException:
            return False, 0, "Request timeout"
        except Exception as e:
            return False, 0, str(e)
    
    def get_active_webhook_configs(self) -> List[WebhookConfig]:
        """Get all active webhook configurations."""
        return (
            self.db.query(WebhookConfig)
            .filter(WebhookConfig.is_active == True)
            .all()
        )
    
    def should_notify(
        self,
        config: WebhookConfig,
        event_type: str,
        event_identifier: Optional[str] = None,
    ) -> tuple[bool, Optional[str]]:
        """
        Check if notification should be sent based on rate limits and cooldowns.
        
        Returns:
            Tuple of (should_notify, reason)
        """
        # Check if event type is enabled
        if event_type not in (config.enabled_events or []):
            return False, "Event type not enabled"
        
        # Check rate limits
        recent_count = self._get_recent_notification_count(config.id, minutes=1)
        if recent_count >= config.rate_limit_per_minute:
            return False, "Rate limit exceeded (per minute)"
        
        recent_count_hour = self._get_recent_notification_count(config.id, hours=1)
        if recent_count_hour >= config.rate_limit_per_hour:
            return False, "Rate limit exceeded (per hour)"
        
        # Check cooldown for specific event type
        cooldown_seconds = config.cooldown_seconds or {}
        cooldown = cooldown_seconds.get(event_type, 0)
        
        if cooldown > 0 and event_identifier:
            bucket = self._get_or_create_rate_bucket(event_type, event_identifier)
            time_since_last = datetime.utcnow() - bucket.last_notification_at
            if time_since_last.total_seconds() < cooldown:
                return False, f"Cooldown period not elapsed ({cooldown}s)"
        
        return True, None
    
    def _get_recent_notification_count(
        self,
        config_id: UUID,
        minutes: Optional[int] = None,
        hours: Optional[int] = None,
    ) -> int:
        """Get count of recent notifications for a config."""
        since = datetime.utcnow()
        if minutes:
            since -= timedelta(minutes=minutes)
        elif hours:
            since -= timedelta(hours=hours)
        
        return (
            self.db.query(NotificationLog)
            .filter(
                NotificationLog.webhook_config_id == config_id,
                NotificationLog.created_at >= since,
            )
            .count()
        )
    
    def _get_or_create_rate_bucket(
        self,
        event_type: str,
        event_identifier: str,
    ) -> RateLimitBucket:
        """Get or create rate limit bucket for an event."""
        bucket = (
            self.db.query(RateLimitBucket)
            .filter(
                RateLimitBucket.event_type == event_type,
                RateLimitBucket.event_identifier == event_identifier,
            )
            .first()
        )
        
        if not bucket:
            bucket = RateLimitBucket(
                event_type=event_type,
                event_identifier=event_identifier,
            )
            self.db.add(bucket)
            self.db.commit()
            self.db.refresh(bucket)
        
        return bucket
    
    def log_notification(
        self,
        config_id: UUID,
        event_type: str,
        platform: str,
        success: bool,
        response_status: Optional[int],
        error_message: Optional[str],
        event_id: Optional[str] = None,
        summary: Optional[str] = None,
    ) -> None:
        """Log a notification attempt."""
        log = NotificationLog(
            webhook_config_id=config_id,
            event_type=event_type,
            event_id=event_id,
            platform=platform,
            success=success,
            response_status=response_status,
            error_message=error_message,
            summary=summary,
        )
        self.db.add(log)
        
        # Update config error status if failed
        if not success:
            config = self.db.query(WebhookConfig).filter(WebhookConfig.id == config_id).first()
            if config:
                config.last_error_at = datetime.utcnow()
                config.last_error_message = error_message[:500] if error_message else "Unknown error"
        
        self.db.commit()
    
    def update_rate_bucket(
        self,
        event_type: str,
        event_identifier: str,
    ) -> None:
        """Update rate limit bucket after notification."""
        bucket = self._get_or_create_rate_bucket(event_type, event_identifier)
        bucket.last_notification_at = datetime.utcnow()
        bucket.tokens = max(0, bucket.tokens - 1)
        self.db.commit()
    
    async def send_notification(
        self,
        config: WebhookConfig,
        event_type: str,
        payload: Dict[str, Any],
        event_id: Optional[str] = None,
        event_identifier: Optional[str] = None,
    ) -> tuple[bool, Optional[str]]:
        """
        Send notification through configured platform.
        
        Returns:
            Tuple of (success, error_message)
        """
        # Check if should notify
        should_notify, reason = self.should_notify(config, event_type, event_identifier)
        if not should_notify:
            return False, reason
        
        # Decrypt webhook URL
        try:
            webhook_url = decrypt_webhook_url(config.webhook_url_encrypted)
        except Exception as e:
            error_msg = f"Failed to decrypt webhook URL: {str(e)}"
            self.log_notification(
                config.id, event_type, config.platform,
                False, None, error_msg, event_id, "Decryption failed"
            )
            return False, error_msg
        
        # Send notification
        if config.platform == NotificationPlatform.DISCORD.value:
            success, status, error = await self.send_discord_notification(webhook_url, payload)
        elif config.platform == NotificationPlatform.SLACK.value:
            success, status, error = await self.send_slack_notification(webhook_url, payload)
        else:
            error = f"Unknown platform: {config.platform}"
            success = False
            status = 0
        
        # Log result
        summary = payload.get("content", "")[:200] or json.dumps(payload)[:200]
        self.log_notification(
            config.id, event_type, config.platform,
            success, status, error, event_id, summary
        )
        
        # Update rate bucket
        if success and event_identifier:
            self.update_rate_bucket(event_type, event_identifier)
        
        return success, error
    
    # ============== Format Notification Helpers ==============
    
    def format_feedback_notification(
        self,
        feedback: Feedback,
        config: WebhookConfig,
    ) -> Dict[str, Any]:
        """Format feedback notification based on platform."""
        admin_url = config.admin_dashboard_url
        include_metadata = config.include_metadata
        
        if config.platform == NotificationPlatform.DISCORD.value:
            return format_feedback_notification_discord(feedback, admin_url, include_metadata)
        else:
            return format_feedback_notification_slack(feedback, admin_url, include_metadata)
    
    def format_error_notification(
        self,
        error: ErrorLog,
        config: WebhookConfig,
    ) -> Dict[str, Any]:
        """Format error notification based on platform."""
        admin_url = config.admin_dashboard_url
        include_stack_trace = config.include_stack_traces
        
        if config.platform == NotificationPlatform.DISCORD.value:
            return format_error_notification_discord(error, admin_url, include_stack_trace)
        else:
            return format_error_notification_slack(error, admin_url, include_stack_trace)
    
    def format_new_user_notification(
        self,
        user: User,
        config: WebhookConfig,
    ) -> Dict[str, Any]:
        """Format new user notification based on platform."""
        admin_url = config.admin_dashboard_url
        
        if config.platform == NotificationPlatform.DISCORD.value:
            return format_new_user_notification_discord(user, admin_url)
        else:
            return format_new_user_notification_slack(user, admin_url)
    
    def format_system_alert(
        self,
        title: str,
        message: str,
        level: str,
        config: WebhookConfig,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Format system alert based on platform."""
        if config.platform == NotificationPlatform.DISCORD.value:
            return format_system_alert_discord(title, message, level, metadata)
        else:
            return format_system_alert_slack(title, message, level, metadata)
    
    # ============== High-Level Notification Methods ==============
    
    async def notify_feedback(self, feedback: Feedback) -> List[tuple[bool, Optional[str]]]:
        """Send feedback notification to all active webhooks."""
        configs = self.get_active_webhook_configs()
        results = []
        
        for config in configs:
            payload = self.format_feedback_notification(feedback, config)
            success, error = await self.send_notification(
                config,
                NotificationEventType.FEEDBACK,
                payload,
                event_id=str(feedback.id),
            )
            results.append((success, error))
        
        return results
    
    async def notify_error(self, error: ErrorLog) -> List[tuple[bool, Optional[str]]]:
        """Send error notification to all active webhooks."""
        configs = self.get_active_webhook_configs()
        results = []
        
        # Create event identifier from error hash for cooldown
        error_hash = hashlib.sha256(
            f"{error.error_type.value}:{error.message}:{error.component}".encode()
        ).hexdigest()[:16]
        
        for config in configs:
            payload = self.format_error_notification(error, config)
            success, err = await self.send_notification(
                config,
                NotificationEventType.ERROR,
                payload,
                event_id=str(error.id),
                event_identifier=error_hash,
            )
            results.append((success, err))
        
        return results
    
    async def notify_new_user(self, user: User) -> List[tuple[bool, Optional[str]]]:
        """Send new user notification to all active webhooks."""
        configs = self.get_active_webhook_configs()
        results = []
        
        for config in configs:
            payload = self.format_new_user_notification(user, config)
            success, error = await self.send_notification(
                config,
                NotificationEventType.NEW_USER,
                payload,
                event_id=str(user.id),
            )
            results.append((success, error))
        
        return results
    
    async def notify_system_alert(
        self,
        title: str,
        message: str,
        level: str = "info",
        metadata: Optional[Dict[str, Any]] = None,
    ) -> List[tuple[bool, Optional[str]]]:
        """Send system alert to all active webhooks."""
        configs = self.get_active_webhook_configs()
        results = []
        
        for config in configs:
            payload = self.format_system_alert(title, message, level, config, metadata)
            success, error = await self.send_notification(
                config,
                NotificationEventType.SYSTEM_ALERT,
                payload,
            )
            results.append((success, error))
        
        return results
    
    async def close(self):
        """Close HTTP client."""
        if self._http_client:
            await self._http_client.aclose()
            self._http_client = None


# ============== Convenience Functions ==============

async def send_test_notification(
    db: Session,
    config: WebhookConfig,
    event_type: str = "system_alert",
    custom_message: Optional[str] = None,
) -> tuple[bool, int, Optional[str], float]:
    """
    Send a test notification to verify webhook configuration.
    
    Returns:
        Tuple of (success, status_code, error_message, response_time_ms)
    """
    service = NotificationService(db)
    start_time = time.time()
    
    try:
        webhook_url = decrypt_webhook_url(config.webhook_url_encrypted)
        
        if config.platform == NotificationPlatform.DISCORD.value:
            payload = {
                "embeds": [{
                    "title": "🧪 Test Notification",
                    "description": custom_message or "This is a test notification from Likho!",
                    "color": DISCORD_COLORS["info"],
                    "footer": {"text": f"Platform: {config.platform}"},
                    "timestamp": datetime.utcnow().isoformat(),
                }]
            }
            success, status, error = await service.send_discord_notification(webhook_url, payload)
        else:
            payload = {
                "blocks": [
                    {
                        "type": "header",
                        "text": {"type": "plain_text", "text": "🧪 Test Notification"},
                    },
                    {
                        "type": "section",
                        "text": {"type": "mrkdwn", "text": custom_message or "This is a test notification from Likho!"},
                    },
                ]
            }
            success, status, error = await service.send_slack_notification(webhook_url, payload)
        
        response_time = (time.time() - start_time) * 1000
        
        # Update last tested timestamp
        if success:
            config.last_tested_at = datetime.utcnow()
            db.commit()
        
        return success, status, error, response_time
    
    except Exception as e:
        response_time = (time.time() - start_time) * 1000
        return False, 0, str(e), response_time
    
    finally:
        await service.close()
