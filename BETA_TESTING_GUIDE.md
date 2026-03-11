# Likho Beta Testing Guide

This guide covers everything you need to know about preparing, running, and managing the beta testing phase for Likho.

---

## Table of Contents

1. [Pre-Launch Checklist](#pre-launch-checklist)
2. [Infrastructure Overview](#infrastructure-overview)
3. [Feature Flags & Maintenance Mode](#feature-flags--maintenance-mode)
4. [Auto-Updater Setup](#auto-updater-setup)
5. [Beta Tester Onboarding](#beta-tester-onboarding)
6. [Monitoring & Feedback](#monitoring--feedback)
7. [Emergency Procedures](#emergency-procedures)

---

## Pre-Launch Checklist

### ✅ Code & Build

- [ ] Version number bumped (follow semver: `0.1.0-beta.1`)
- [ ] All feature flags configured in database
- [ ] Auto-updater endpoint configured
- [ ] Backend deployed and health checks passing
- [ ] Database migrations applied
- [ ] Admin dashboard deployed
- [ ] Update server configured (GitHub Releases or custom)

### ✅ Security

- [ ] API keys rotated (not using dev keys)
- [ ] Admin endpoints protected with authentication
- [ ] CORS configured for production domains
- [ ] Database connections use SSL
- [ ] Secrets stored in environment variables

### ✅ Legal & Privacy

- [ ] Privacy policy written and linked
- [ ] Terms of service for beta testers
- [ ] Data collection consent implemented
- [ ] GDPR/CCPA compliance checked
- [ ] Crash reporting opt-in implemented

### ✅ Documentation

- [ ] Beta testing guide for users
- [ ] Known issues list
- [ ] Feature limitations documented
- [ ] Feedback process explained

---

## Infrastructure Overview

### Components

```
┌─────────────────────────────────────────────────────────────────┐
│                         BETA TESTING                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐  │
│  │  Likho App   │      │   Backend    │      │   Updates    │  │
│  │   (Tauri)    │◄────►│  (FastAPI)   │◄────►│   Server     │  │
│  │              │      │              │      │              │  │
│  │ - Updater    │      │ - Remote     │      │ - Releases   │  │
│  │ - Feedback   │      │   Config     │      │ - Signatures │  │
│  │ - Analytics  │      │ - Health     │      │              │  │
│  └──────────────┘      └──────────────┘      └──────────────┘  │
│         │                       │                              │
│         │                       │                              │
│         ▼                       ▼                              │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐  │
│  │ Error Log    │      │  Database    │      │    Admin     │  │
│  │ Storage      │      │ (PostgreSQL) │      │  Dashboard   │  │
│  └──────────────┘      └──────────────┘      └──────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Key Features Implemented

1. **Remote Config System** (`/backend/app/modules/remote_config/`)
   - Feature flags with rollout percentages
   - Maintenance mode kill switch
   - Platform-specific configs
   - Version-gated features
   - Audit logging

2. **Auto-Updater** (`/likho-app/src-tauri/src/updater.rs`)
   - Background update checks
   - User notification
   - Download progress
   - Skip version support
   - Automatic restart

3. **Feedback System** (`/likho-app/src/lib/feedback.ts`)
   - In-app bug reports
   - Screenshot capture
   - Error reporting
   - Offline queue (syncs when online)

4. **Admin Dashboard** (`/admin-dashboard/`)
   - Feature flag management
   - Feedback review
   - Version management
   - System health monitoring

---

## Feature Flags & Maintenance Mode

### Default Feature Flags

Create these in your database before launch:

| Flag Key | Default | Description |
|----------|---------|-------------|
| `maintenance_mode` | `false` | Global kill switch - shows maintenance page |
| `ai_assistant` | `true` | AI writing assistant feature |
| `cloud_sync` | `true` | Online workspace sync |
| `collaboration` | `false` | Real-time collaboration (beta) |
| `beta_features` | `true` | Enable beta-only features |
| `feedback_button` | `true` | Show feedback button in UI |
| `analytics` | `true` | Collect usage analytics |

### Emergency Kill Switch

To disable a problematic feature immediately:

```bash
# Via API
curl -X POST https://api.likho.app/api/v1/admin/kill-switch/ai_assistant \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Critical bug in production"}'

# Via Admin Dashboard
# Go to Feature Flags → Toggle off → Add reason
```

### Maintenance Mode

When enabled, the app shows a maintenance page:

```bash
# Enable maintenance mode
curl -X PATCH https://api.likho.app/api/v1/admin/feature-flags/maintenance_mode \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"enabled": true}'
```

---

## Auto-Updater Setup

### Update Server Configuration

The app expects a JSON endpoint at `https://releases.likho.app/updates.json`:

```json
{
  "version": "0.1.0-beta.2",
  "notes": "Bug fixes and performance improvements",
  "pub_date": "2026-03-15T12:00:00Z",
  "platforms": {
    "darwin-x86_64": {
      "signature": "Content of your .tar.gz.sig for Intel Mac",
      "url": "https://releases.likho.app/likho_0.1.0-beta.2_x64.dmg"
    },
    "darwin-aarch64": {
      "signature": "Content of your .tar.gz.sig for Apple Silicon Mac",
      "url": "https://releases.likho.app/likho_0.1.0-beta.2_aarch64.dmg"
    },
    "linux-x86_64": {
      "signature": "Content of your .AppImage.sig",
      "url": "https://releases.likho.app/likho_0.1.0-beta.2_amd64.AppImage"
    },
    "windows-x86_64": {
      "signature": "Content of your .msi.sig or .exe.sig",
      "url": "https://releases.likho.app/likho_0.1.0-beta.2_x64-setup.exe"
    }
  }
}
```

### Release Process

1. **Update version** in:
   - `package.json`
   - `src-tauri/Cargo.toml`
   - `src-tauri/tauri.conf.json`

2. **Build release**:
   ```bash
   cd likho-app
   npm run tauri build
   ```

3. **Sign the update** (using your private key):
   ```bash
   # Tauri updater uses Ed25519 signatures
   # Generate signature for each platform artifact
   ```

4. **Upload to update server**:
   - Upload installers to CDN/releases server
   - Update `updates.json` with new version info

5. **Test update**:
   - Install old version
   - Trigger update check
   - Verify download and install works

---

## Beta Tester Onboarding

### Inviting Beta Testers

1. **Collect information**:
   - Name and email
   - Operating system
   - Use case (personal/team/business)
   - Feature interests

2. **Send welcome email** with:
   - Download link
   - Beta testing guidelines
   - Feedback channels
   - Known issues list
   - How to report bugs

3. **Track signups** in a simple spreadsheet or your admin dashboard

### Beta Tester Agreement

Include these points in your beta agreement:

- ⚠️ Beta software may have bugs and data loss risks
- 🔒 Keep features confidential until public release
- 📝 Provide feedback through designated channels
- 📊 Allow anonymous usage analytics collection
- 🔄 Agree to automatic updates

---

## Monitoring & Feedback

### Key Metrics to Track

| Metric | Target | Alert If |
|--------|--------|----------|
| Daily Active Users | > 50% of total | < 30% |
| Crash Rate | < 1% | > 2% |
| Feedback Response | Review daily | > 10 unreviewed |
| Update Adoption | > 80% in 7 days | < 50% in 7 days |
| API Error Rate | < 0.1% | > 1% |

### Feedback Workflow

1. **User submits** via Feedback Dialog
2. **Stored locally** if offline (syncs later)
3. **Appears in Admin Dashboard** with metadata
4. **Team reviews** and categorizes:
   - Bug → Create ticket
   - Feature → Add to roadmap
   - Praise → Share with team 💚
5. **Respond to user** if email provided

### Weekly Beta Review

Every week, review:

- [ ] New feedback submissions
- [ ] Error reports and crash logs
- [ ] Feature usage analytics
- [ ] Update adoption rates
- [ ] Feature flag effectiveness
- [ ] Performance metrics

---

## Emergency Procedures

### Critical Bug Discovered

1. **Assess impact** (how many users affected?)
2. **If widespread**:
   - Enable `maintenance_mode` feature flag
   - Post in beta Slack/Discord channel
   - Send email to beta testers
3. **If isolated**:
   - Disable specific feature flag
   - Push hotfix update
4. **Document** in incident log

### Data Loss Reported

1. **Immediately** contact affected user
2. **Check** if data exists in cloud backup
3. **Investigate** cause
4. **Compensate** if appropriate (free premium, etc.)
5. **Implement** safeguards to prevent recurrence

### Update Breaking App

1. **Pull** the update immediately from server
2. **Re-release** previous stable version as "new" update
3. **Notify** users who already updated
4. **Fix** and test thoroughly
5. **Re-release** fixed version

### Backend Outage

1. **App falls back** to offline mode automatically
2. **Queue** all sync operations locally
3. **Retry** with exponential backoff
4. **Notify** users of limited functionality
5. **Resolve** backend issue
6. **Sync** queued data when restored

---

## Version Numbering

Use Semantic Versioning with pre-release tags:

```
0.1.0-beta.1    # First beta
0.1.0-beta.2    # Second beta (bug fixes)
0.1.0-beta.3    # Third beta (new features)
0.1.0-rc.1      # Release candidate
0.1.0           # Official release
```

---

## Quick Commands

### Database

```bash
# Connect to production DB
psql $DATABASE_URL

# Check feature flags
SELECT key, enabled FROM feature_flags WHERE deleted_at IS NULL;

# Recent feedback
SELECT * FROM feedback ORDER BY created_at DESC LIMIT 10;

# Error count (last 24h)
SELECT COUNT(*) FROM error_logs WHERE created_at > NOW() - INTERVAL '24 hours';
```

### API

```bash
# Health check
curl https://api.likho.app/health/

# Get config
curl https://api.likho.app/api/v1/config?version=0.1.0&platform=darwin

# Check maintenance mode
curl https://api.likho.app/health/maintenance
```

---

## Resources

- **Admin Dashboard**: https://admin.likho.app
- **Beta Forum/Discord**: [Your community link]
- **Issue Tracker**: [Your bug tracker link]
- **Analytics**: [Your analytics dashboard]

---

## Contact

For urgent beta issues:
- 📧 beta@likho.app
- 💬 [Your Slack/Discord]
- 📱 [Your phone for true emergencies]

---

*Last updated: 2026-03-11*
