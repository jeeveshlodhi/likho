-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration: Remote Config System
-- Description: Adds tables for feature flags, remote config, and app version management
-- Created: 2026-03-11
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- Enums
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'configplatform') THEN
        CREATE TYPE configplatform AS ENUM ('all', 'windows', 'macos', 'linux', 'ios', 'android');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'configvaluetype') THEN
        CREATE TYPE configvaluetype AS ENUM ('string', 'integer', 'float', 'boolean', 'json');
    END IF;
END$$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- Feature Flags Table
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    enabled BOOLEAN NOT NULL DEFAULT FALSE,
    rollout_percentage INTEGER NOT NULL DEFAULT 100 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
    target_platform configplatform NOT NULL DEFAULT 'all',
    min_version VARCHAR(20),
    max_version VARCHAR(20),
    conditions JSONB DEFAULT '{}',
    is_kill_switch BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Indexes for feature_flags
CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON feature_flags(key);
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags(enabled);
CREATE INDEX IF NOT EXISTS idx_feature_flags_deleted_at ON feature_flags(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_feature_flags_platform ON feature_flags(target_platform);

-- ═══════════════════════════════════════════════════════════════════════════════
-- Remote Config Table
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS remote_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    value_type configvaluetype NOT NULL DEFAULT 'string',
    default_value TEXT NOT NULL,
    platform_overrides JSONB DEFAULT '{}',
    version_overrides JSONB DEFAULT '[]',
    requires_restart BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Indexes for remote_configs
CREATE INDEX IF NOT EXISTS idx_remote_configs_key ON remote_configs(key);
CREATE INDEX IF NOT EXISTS idx_remote_configs_deleted_at ON remote_configs(deleted_at) WHERE deleted_at IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════════
-- App Versions Table
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS app_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform configplatform NOT NULL DEFAULT 'all',
    version VARCHAR(20) NOT NULL,
    build_number INTEGER,
    is_latest BOOLEAN NOT NULL DEFAULT FALSE,
    min_required_version VARCHAR(20) NOT NULL,
    force_update BOOLEAN NOT NULL DEFAULT FALSE,
    update_url TEXT,
    release_notes TEXT,
    release_summary VARCHAR(500),
    file_size INTEGER,
    file_hash VARCHAR(64),
    released_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(platform, version)
);

-- Indexes for app_versions
CREATE INDEX IF NOT EXISTS idx_app_versions_platform_version ON app_versions(platform, version);
CREATE INDEX IF NOT EXISTS idx_app_versions_is_latest ON app_versions(is_latest);
CREATE INDEX IF NOT EXISTS idx_app_versions_platform ON app_versions(platform);

-- ═══════════════════════════════════════════════════════════════════════════════
-- Config Audit Log Table
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS config_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL,
    changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    old_values JSONB,
    new_values JSONB,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for config_audit_logs
CREATE INDEX IF NOT EXISTS idx_config_audit_entity ON config_audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_config_audit_created_at ON config_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_config_audit_changed_by ON config_audit_logs(changed_by);

-- ═══════════════════════════════════════════════════════════════════════════════
-- Update Trigger Function
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create update triggers
DROP TRIGGER IF EXISTS update_feature_flags_updated_at ON feature_flags;
CREATE TRIGGER update_feature_flags_updated_at
    BEFORE UPDATE ON feature_flags
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_remote_configs_updated_at ON remote_configs;
CREATE TRIGGER update_remote_configs_updated_at
    BEFORE UPDATE ON remote_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_app_versions_updated_at ON app_versions;
CREATE TRIGGER update_app_versions_updated_at
    BEFORE UPDATE ON app_versions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════════════
-- Default Data: Essential Feature Flags
-- ═══════════════════════════════════════════════════════════════════════════════

-- Maintenance mode flag
INSERT INTO feature_flags (key, name, description, enabled, is_kill_switch)
VALUES (
    'maintenance_mode',
    'Maintenance Mode',
    'When enabled, puts the app in maintenance mode showing a maintenance screen to users.',
    FALSE,
    TRUE
)
ON CONFLICT (key) DO NOTHING;

-- AI features flag
INSERT INTO feature_flags (key, name, description, enabled, rollout_percentage)
VALUES (
    'ai_assistant',
    'AI Assistant',
    'Enables the AI assistant feature for note editing and suggestions.',
    TRUE,
    100
)
ON CONFLICT (key) DO NOTHING;

-- Collaboration features flag
INSERT INTO feature_flags (key, name, description, enabled, rollout_percentage)
VALUES (
    'realtime_collaboration',
    'Realtime Collaboration',
    'Enables real-time collaboration features for shared notes.',
    TRUE,
    100
)
ON CONFLICT (key) DO NOTHING;

-- New editor flag (for gradual rollout)
INSERT INTO feature_flags (key, name, description, enabled, rollout_percentage)
VALUES (
    'new_editor',
    'New Editor',
    'Enables the new experimental editor with improved performance.',
    FALSE,
    0
)
ON CONFLICT (key) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- Default Data: Essential Remote Configs
-- ═══════════════════════════════════════════════════════════════════════════════

-- Sync interval
INSERT INTO remote_configs (key, name, description, value_type, default_value)
VALUES (
    'sync_interval_seconds',
    'Sync Interval',
    'How often to sync notes with the server (in seconds).',
    'integer',
    '30'
)
ON CONFLICT (key) DO NOTHING;

-- Max file size
INSERT INTO remote_configs (key, name, description, value_type, default_value)
VALUES (
    'max_attachment_size_mb',
    'Max Attachment Size',
    'Maximum size for file attachments in MB.',
    'integer',
    '50'
)
ON CONFLICT (key) DO NOTHING;

-- API timeout
INSERT INTO remote_configs (key, name, description, value_type, default_value)
VALUES (
    'api_timeout_seconds',
    'API Timeout',
    'Timeout for API requests in seconds.',
    'integer',
    '30'
)
ON CONFLICT (key) DO NOTHING;

-- Auto-save interval
INSERT INTO remote_configs (key, name, description, value_type, default_value)
VALUES (
    'auto_save_interval_seconds',
    'Auto Save Interval',
    'How often to auto-save notes locally (in seconds).',
    'integer',
    '5'
)
ON CONFLICT (key) DO NOTHING;

-- Enable analytics
INSERT INTO remote_configs (key, name, description, value_type, default_value)
VALUES (
    'analytics_enabled',
    'Analytics Enabled',
    'Whether to send anonymous usage analytics.',
    'boolean',
    'true'
)
ON CONFLICT (key) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration Complete
-- ═══════════════════════════════════════════════════════════════════════════════
