# Discord/Slack Notification System

A notification system for the Likho beta that sends alerts to Discord and Slack webhooks for important events like feedback submissions, critical errors, and new user signups.

## Features

- **Dual Platform Support**: Works with both Discord and Slack webhooks
- **Event-Based Notifications**: Subscribe to specific event types:
  - `feedback` - New feedback submitted
  - `error` - Critical errors (crash/exception)
  - `new_user` - New beta user signup
  - `user_upgrade` - User plan upgrade
  - `daily_stats` - Daily statistics summary
  - `system_alert` - System-level alerts

- **Rich Embeds**: Beautiful, color-coded embeds with:
  - User information
  - Timestamps
  - Direct links to admin dashboard
  - Collapsible stack traces (Discord)
  - Screenshot previews

- **Rate Limiting**: Configurable rate limits to prevent spam:
  - Per-minute and per-hour limits
  - Cooldown periods per event type
  - Automatic deduplication for similar errors

- **Security**: Webhook URLs are encrypted at rest using Fernet encryption

## API Endpoints

All endpoints require admin privileges.

### Configure Webhook

```http
POST /api/v1/admin/notifications/webhook
Content-Type: application/json

{
  "platform": "discord",
  "webhook_url": "https://discord.com/api/webhooks/...",
  "enabled_events": ["feedback", "error", "new_user"],
  "rate_limit_per_minute": 30,
  "rate_limit_per_hour": 100,
  "include_user_info": true,
  "include_stack_traces": true,
  "include_metadata": true,
  "admin_dashboard_url": "https://admin.likho.io"
}
```

### List Webhooks

```http
GET /api/v1/admin/notifications/webhook
```

### Update Webhook

```http
PATCH /api/v1/admin/notifications/webhook/{config_id}
Content-Type: application/json

{
  "enabled_events": ["feedback", "error"],
  "is_active": true
}
```

### Delete Webhook

```http
DELETE /api/v1/admin/notifications/webhook/{config_id}
```

### Test Webhook

```http
POST /api/v1/admin/notifications/webhook/{config_id}/test
Content-Type: application/json

{
  "event_type": "system_alert",
  "custom_message": "Test notification from Likho!"
}
```

### Test All Webhooks

```http
POST /api/v1/admin/notifications/test-all
```

### Get Statistics

```http
GET /api/v1/admin/notifications/stats
```

## Integration

The notification system is automatically integrated with:

1. **Feedback Router**: Notifies on new feedback submission
2. **Auth Router**: Notifies on new user signup
3. **Error Tracking**: Notifies on critical errors (crash/exception)

## Discord Embed Format

### Feedback
- **Color**: Green (#57F287)
- **Emoji**: 🐛 Bug | ✨ Feature | 🎉 Praise
- **Fields**: User, Platform, Version, Screenshot (if available)

### Error
- **Color**: Red (#ED4245)
- **Emoji**: 💥 Crash | ⚠️ Exception | ⚡ Warning
- **Fields**: Type, Component, Action, Occurrences, Stack Trace

### New User
- **Color**: Blue (#5865F2)
- **Emoji**: 🎉
- **Fields**: Email, Name, Plan

## Slack Block Format

Similar structure to Discord but using Slack's Block Kit format with:
- Header blocks
- Section blocks with markdown
- Context blocks for metadata
- Action buttons linking to admin dashboard

## Database Schema

### webhook_configs
- Stores encrypted webhook URLs and settings
- Tracks last test/error times
- Supports multiple webhooks per platform

### notification_logs
- Audit trail of all sent notifications
- Tracks success/failure and response codes
- Used for rate limiting calculations

### rate_limit_buckets
- Token bucket implementation for cooldowns
- Per-event-type rate tracking
- Automatic cleanup of old buckets

## Environment Variables

Uses `SECRET_KEY` from settings for encrypting webhook URLs.

## Error Handling

- Notifications are sent in background tasks (don't block main request)
- Failures are logged but don't break user flows
- Automatic retry is not implemented (webhooks are fire-and-forget)

## Testing

Run the test endpoint to verify webhook configuration:

```bash
curl -X POST \
  https://api.likho.io/api/v1/admin/notifications/webhook/{id}/test \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"event_type": "system_alert"}'
```
