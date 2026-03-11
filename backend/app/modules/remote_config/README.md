# Remote Config System

A comprehensive remote configuration, feature flag, and app version management system for the Likho Tauri desktop app.

## Overview

This module provides:

1. **Feature Flags** - Enable/disable features with A/B testing support
2. **Remote Config** - Dynamic configuration values with platform/version overrides
3. **App Version Management** - Update checking and force update capabilities
4. **Audit Logging** - Track all configuration changes

## Key Features

- **A/B Testing**: Rollout percentages for gradual feature releases
- **Platform Targeting**: Windows, macOS, Linux specific configurations
- **Version Gating**: Features enabled only for specific app versions
- **Kill Switches**: Emergency disable features without app update
- **Maintenance Mode**: Global app kill switch for backend maintenance

## API Endpoints

### Public Endpoints (No Auth Required)

These are called by the Tauri app on startup:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/config` | GET | Get all configs and feature flags for device |
| `/api/v1/config/features` | GET | Get feature flags only |
| `/api/v1/config/version` | GET | Check for app updates |
| `/api/v1/config/maintenance` | GET | Check maintenance mode status |

### Admin Endpoints (Require Admin Auth)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/admin/features` | GET | List all feature flags |
| `/api/v1/admin/features` | POST | Create new feature flag |
| `/api/v1/admin/features/{id}` | PATCH | Update feature flag |
| `/api/v1/admin/features/{id}/toggle` | POST | Quick toggle feature |
| `/api/v1/admin/configs` | GET | List all remote configs |
| `/api/v1/admin/configs` | POST | Create new config |
| `/api/v1/admin/configs/{id}` | PATCH | Update config |
| `/api/v1/admin/versions` | GET | List app versions |
| `/api/v1/admin/versions` | POST | Create app version |
| `/api/v1/admin/kill-switch/{key}` | POST | Emergency kill switch |

## Usage Examples

### Get Device Configuration

```bash
# Called by Tauri app on startup
curl "http://localhost:8000/api/v1/config?version=1.2.3&platform=macos&device_id=abc123"
```

Response:
```json
{
  "configs": {
    "sync_interval_seconds": 30,
    "max_attachment_size_mb": 50,
    "analytics_enabled": true
  },
  "features": {
    "ai_assistant": true,
    "realtime_collaboration": true,
    "new_editor": false,
    "maintenance_mode": false
  },
  "feature_details": {
    "ai_assistant": {
      "feature_key": "ai_assistant",
      "enabled": true,
      "rollout_percentage": 100,
      "reason": null
    }
  }
}
```

### Check Single Feature

```bash
curl "http://localhost:8000/api/v1/config/features?feature_key=ai_assistant&version=1.2.3&platform=macos&device_id=abc123"
```

### Create Feature Flag (Admin)

```bash
curl -X POST http://localhost:8000/api/v1/admin/features \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "beta_feature",
    "name": "Beta Feature",
    "description": "A new experimental feature",
    "enabled": true,
    "rollout_percentage": 10,
    "target_platform": "all",
    "min_version": "1.3.0"
  }'
```

### Toggle Feature (Admin)

```bash
# Quick enable/disable
curl -X POST http://localhost:8000/api/v1/admin/features/123/toggle \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": false,
    "reason": "Bug discovered, disabling temporarily"
  }'
```

### Emergency Kill Switch (Admin)

```bash
# Immediately disable a feature for all users
curl -X POST "http://localhost:8000/api/v1/admin/kill-switch/ai_assistant?enabled=false&reason=Critical+bug+found" \
  -H "Authorization: Bearer <token>"
```

## Data Models

### FeatureFlag

| Field | Type | Description |
|-------|------|-------------|
| `key` | string | Unique identifier (e.g., "ai_assistant") |
| `enabled` | boolean | Master switch |
| `rollout_percentage` | int | 0-100, for A/B testing |
| `target_platform` | enum | all, windows, macos, linux |
| `min_version` | string | Minimum app version required |
| `max_version` | string | Maximum supported version |
| `conditions` | JSON | Additional targeting conditions |
| `is_kill_switch` | boolean | Emergency disable flag |

### RemoteConfig

| Field | Type | Description |
|-------|------|-------------|
| `key` | string | Unique identifier |
| `value_type` | enum | string, integer, float, boolean, json |
| `default_value` | string | Default value as string |
| `platform_overrides` | JSON | Platform-specific values |
| `version_overrides` | JSON | Version-specific values |
| `requires_restart` | boolean | Whether app restart needed |

### AppVersion

| Field | Type | Description |
|-------|------|-------------|
| `platform` | enum | Target platform |
| `version` | string | Semantic version |
| `is_latest` | boolean | Marked as latest |
| `min_required_version` | string | Force update if below |
| `force_update` | boolean | Emergency force update |
| `update_url` | string | Download URL |
| `release_notes` | text | Markdown release notes |

## A/B Testing

Feature flags support percentage-based rollouts for A/B testing:

1. Set `rollout_percentage` to desired value (e.g., 10 for 10% of users)
2. Pass `device_id` in API calls for consistent user experience
3. Same device always gets the same feature state

The device hash is calculated as: `MD5(device_id:feature_key) % 100`

## Platform Overrides

Remote configs support platform-specific values:

```json
{
  "key": "default_storage_path",
  "default_value": "/default/path",
  "platform_overrides": {
    "windows": "C:\\Users\\<user>\\Likho",
    "macos": "~/Library/Application Support/Likho",
    "linux": "~/.local/share/likho"
  }
}
```

## Version Overrides

Remote configs can have different values for different app versions:

```json
{
  "key": "api_endpoint",
  "default_value": "https://api.likho.com/v2",
  "version_overrides": [
    {"min_version": "1.0.0", "max_version": "1.5.0", "value": "https://api.likho.com/v1"},
    {"min_version": "1.5.0", "value": "https://api.likho.com/v2"}
  ]
}
```

## Maintenance Mode

Special feature flag `maintenance_mode` controls global app access:

```bash
# Enable maintenance mode
curl -X POST http://localhost:8000/api/v1/admin/features/maintenance_mode/toggle \
  -H "Authorization: Bearer <token>" \
  -d '{"enabled": true, "reason": "Database migration in progress"}'
```

When enabled, the app should show a maintenance screen.

## Database Migration

Run the migration SQL:

```bash
psql -U postgres -d likho -f backend/migrations/001_remote_config.sql
```

Or let SQLAlchemy auto-create tables on startup (for development only).

## Frontend Integration (Tauri)

Example Rust/Tauri integration:

```rust
// Fetch config on app startup
async fn fetch_remote_config(app: &AppHandle) -> Result<RemoteConfig, Error> {
    let device_id = get_device_id(app);
    let version = env!("CARGO_PKG_VERSION");
    let platform = std::env::consts::OS;
    
    let url = format!(
        "{}/api/v1/config?version={}&platform={}&device_id={}",
        API_BASE_URL, version, platform, device_id
    );
    
    let response = reqwest::get(&url).await?.json::<RemoteConfig>().await?;
    Ok(response)
}

// Check if feature is enabled
fn is_feature_enabled(config: &RemoteConfig, feature: &str) -> bool {
    config.features.get(feature).copied().unwrap_or(false)
}
```
