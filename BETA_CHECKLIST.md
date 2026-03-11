# Likho Beta Launch Checklist

## Pre-Launch Requirements

### Legal & Privacy
- [ ] Review `PrivacyPolicy.tsx` - customize company details
- [ ] Review `TermsOfService.tsx` - customize for your jurisdiction
- [ ] Review `BetaAgreement.tsx` - adjust terms as needed
- [ ] Set up cookie consent banner (`CookieConsent.tsx`)
- [ ] Deploy privacy policy page to website
- [ ] Create beta@likho.app email address

### Backend Setup
- [ ] Deploy backend with health endpoints
- [ ] Configure PostgreSQL database
- [ ] Set up Redis for rate limiting
- [ ] Add rate limit middleware to `main.py`
- [ ] Configure webhook notifications (Discord/Slack)
- [ ] Set up SSL certificates
- [ ] Configure CORS origins for production

### Update Server
- [ ] Set up update server/CDN for releases
- [ ] Generate Ed25519 signing key pair
- [ ] Create `updates.json` endpoint
- [ ] Upload first beta release
- [ ] Test update flow end-to-end

### Monitoring
- [ ] Configure health check alerts
- [ ] Set up error tracking (Sentry/alternative)
- [ ] Set up application logs aggregation
- [ ] Create admin dashboard access
- [ ] Configure backup monitoring

### Beta Testing
- [ ] Create beta tester application form
- [ ] Prepare beta invitation email template
- [ ] Set up beta community (Discord/Slack)
- [ ] Create feedback guidelines document
- [ ] Prepare known issues list

## Configuration

### Environment Variables (Backend)
```bash
# Required
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
SECRET_KEY=your-secret-key

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_DEFAULT_REQUESTS=100
RATE_LIMIT_DEFAULT_WINDOW=60

# Notifications (optional)
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
SLACK_WEBHOOK_URL=https://hooks.slack.com/...

# Updates
LIKHO_UPDATE_ENDPOINT=https://releases.likho.app/updates.json
```

### Environment Variables (Frontend)
```bash
VITE_FEEDBACK_API_URL=https://api.likho.app/api/v1/feedback
VITE_ERROR_API_URL=https://api.likho.app/api/v1/errors
VITE_ADMIN_API_KEY=your-admin-key
```

## Database Setup

```bash
# Run migrations
cd backend
alembic upgrade head

# Create default feature flags
python scripts/init_beta_features.py

# Create admin user
python scripts/create_admin.py --email admin@likho.app
```

## Feature Flags to Create

```sql
INSERT INTO feature_flags (key, enabled, description) VALUES
('maintenance_mode', false, 'Global maintenance mode kill switch'),
('ai_assistant', true, 'AI writing assistant feature'),
('cloud_sync', true, 'Online workspace synchronization'),
('collaboration', false, 'Real-time collaboration (beta)'),
('beta_features', true, 'Enable beta-only features'),
('feedback_button', true, 'Show in-app feedback button'),
('analytics', true, 'Collect anonymous usage analytics'),
('auto_backup', true, 'Enable automatic backups'),
('onboarding', true, 'Show onboarding tutorial'),
('notifications', true, 'Enable push notifications');
```

## Launch Day Tasks

### Morning
- [ ] Final build and testing
- [ ] Deploy backend to production
- [ ] Verify health checks pass
- [ ] Test feature flags working
- [ ] Verify rate limiting active

### Before Sending Invites
- [ ] Send first test notification to Discord/Slack
- [ ] Create first backup and verify restore
- [ ] Test update mechanism manually
- [ ] Verify error reporting works
- [ ] Check feedback submission flow

### During Launch
- [ ] Monitor health endpoints
- [ ] Watch for error spikes
- [ ] Respond to feedback quickly
- [ ] Be ready to disable features if needed

### Post-Launch (Daily)
- [ ] Review new feedback
- [ ] Check error logs
- [ ] Monitor adoption metrics
- [ ] Respond to user questions

### Post-Launch (Weekly)
- [ ] Review analytics
- [ ] Check backup integrity
- [ ] Review and triage feedback
- [ ] Plan next beta iteration

## Emergency Contacts

| Issue | Contact | Action |
|-------|---------|--------|
| Critical bug | Kill switch | Disable feature flag |
| Data loss | Database admin | Restore from backup |
| Backend down | DevOps | Check health, restart |
| Security issue | Security lead | Rotate keys, patch |

## Rollback Plan

If critical issues:
1. Enable `maintenance_mode` feature flag
2. Notify users via Discord/Slack/email
3. Investigate and fix
4. Test fix thoroughly
5. Disable maintenance mode
6. Post-mortem analysis

---

Last updated: 2026-03-11
