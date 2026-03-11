-- ============================================================
-- COLLABORATION V2 - Database Schema Updates
-- ============================================================

-- Ensure extensions exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Ensure member_role type exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'member_role') THEN
        CREATE TYPE member_role AS ENUM ('owner', 'admin', 'editor', 'commenter', 'viewer');
    END IF;
END
$$;

-- ============================================================
-- ADD COLUMNS TO EXISTING TABLES
-- ============================================================

-- Add new columns to share_links
ALTER TABLE share_links 
    ADD COLUMN IF NOT EXISTS require_email BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS max_views INT,
    ADD COLUMN IF NOT EXISTS allow_comments BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS allow_export BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS ip_restrictions TEXT[],
    ADD COLUMN IF NOT EXISTS domain_restrictions TEXT[];

-- Add expires_at to page_permissions
ALTER TABLE page_permissions 
    ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================================
-- COLLABORATION SESSIONS (Active editing sessions)
-- ============================================================

DROP TABLE IF EXISTS collaboration_sessions CASCADE;

CREATE TABLE collaboration_sessions (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_id           UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Session info
    client_id         TEXT NOT NULL,
    connection_id     TEXT NOT NULL UNIQUE,
    
    -- Permissions at connection time
    role              member_role NOT NULL,
    can_edit          BOOLEAN DEFAULT FALSE,
    can_comment       BOOLEAN DEFAULT FALSE,
    
    -- Activity
    connected_at      TIMESTAMPTZ DEFAULT NOW(),
    last_activity_at  TIMESTAMPTZ DEFAULT NOW(),
    disconnected_at   TIMESTAMPTZ,
    
    -- Device info
    ip_address        INET,
    user_agent        TEXT,
    
    UNIQUE (page_id, user_id, client_id)
);

CREATE INDEX idx_collab_sessions_page 
    ON collaboration_sessions(page_id) 
    WHERE disconnected_at IS NULL;
    
CREATE INDEX idx_collab_sessions_user 
    ON collaboration_sessions(user_id);
    
CREATE INDEX idx_collab_sessions_active 
    ON collaboration_sessions(disconnected_at) 
    WHERE disconnected_at IS NULL;

-- ============================================================
-- COMMENTS (Threaded)
-- ============================================================

DROP TABLE IF EXISTS comment_reactions CASCADE;
DROP TABLE IF EXISTS comments CASCADE;

CREATE TABLE comments (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_id           UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    
    -- Location (optional block reference - only if blocks table exists)
    block_id          UUID,  -- References blocks(id) if table exists
    yjs_mark_id       TEXT,
    
    -- Threading
    parent_id         UUID REFERENCES comments(id) ON DELETE CASCADE,
    thread_order      INT DEFAULT 0,
    
    -- Content
    author_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content           JSONB NOT NULL DEFAULT '{}',
    resolved_at       TIMESTAMPTZ,
    resolved_by       UUID REFERENCES users(id),
    
    -- Timestamps
    edited_at         TIMESTAMPTZ,
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    deleted_at        TIMESTAMPTZ
);

CREATE INDEX idx_comments_page ON comments(page_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_comments_block ON comments(block_id) WHERE deleted_at IS NULL AND block_id IS NOT NULL;
CREATE INDEX idx_comments_thread ON comments(parent_id, thread_order);
CREATE INDEX idx_comments_author ON comments(author_id);

-- Comment reactions
CREATE TABLE comment_reactions (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comment_id        UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    emoji             TEXT NOT NULL,
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (comment_id, user_id, emoji)
);

CREATE INDEX idx_comment_reactions_comment ON comment_reactions(comment_id);

-- ============================================================
-- COLLABORATION ACTIVITY LOG
-- ============================================================

DROP TABLE IF EXISTS collaboration_logs CASCADE;

CREATE TABLE collaboration_logs (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_id           UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    user_id           UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Action details
    action            TEXT NOT NULL,
    metadata          JSONB DEFAULT '{}',
    update_size       INT,
    
    created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_collab_logs_page ON collaboration_logs(page_id, created_at DESC);
CREATE INDEX idx_collab_logs_user ON collaboration_logs(user_id, created_at DESC);
CREATE INDEX idx_collab_logs_action ON collaboration_logs(action, created_at DESC);

-- ============================================================
-- UPDATE YJS_DOCUMENTS TABLE
-- ============================================================

-- Add new columns
ALTER TABLE yjs_documents 
    ADD COLUMN IF NOT EXISTS state_vector BYTEA,
    ADD COLUMN IF NOT EXISTS last_update BYTEA,
    ADD COLUMN IF NOT EXISTS version INT DEFAULT 1,
    ADD COLUMN IF NOT EXISTS client_count INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_modified_by UUID REFERENCES users(id);

-- Migrate existing data
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'yjs_documents' AND column_name = 'yjs_state') THEN
        UPDATE yjs_documents 
        SET state_vector = yjs_state 
        WHERE state_vector IS NULL AND yjs_state IS NOT NULL;
        
        ALTER TABLE yjs_documents DROP COLUMN IF EXISTS yjs_state;
    END IF;
END $$;

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to page_permissions
DROP TRIGGER IF EXISTS trg_page_permissions_updated_at ON page_permissions;
CREATE TRIGGER trg_page_permissions_updated_at
    BEFORE UPDATE ON page_permissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to cleanup stale sessions
CREATE OR REPLACE FUNCTION cleanup_stale_sessions()
RETURNS void AS $$
BEGIN
    UPDATE collaboration_sessions
    SET disconnected_at = NOW()
    WHERE disconnected_at IS NULL
      AND last_activity_at < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql;

-- Function to log collaboration activity
CREATE OR REPLACE FUNCTION log_collab_activity(
    p_page_id UUID,
    p_user_id UUID,
    p_action TEXT,
    p_metadata JSONB DEFAULT '{}',
    p_update_size INT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    INSERT INTO collaboration_logs (page_id, user_id, action, metadata, update_size)
    VALUES (p_page_id, p_user_id, p_action, p_metadata, p_update_size);
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_share_links_active 
    ON share_links(revoked_at, expires_at) 
    WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_page_permissions_expires 
    ON page_permissions(expires_at) 
    WHERE expires_at IS NOT NULL;

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE collaboration_sessions IS 'Tracks active WebSocket connections for real-time collaboration';
COMMENT ON TABLE comments IS 'Threaded comments on pages and blocks';
COMMENT ON TABLE collaboration_logs IS 'Audit log for collaboration activities';
COMMENT ON COLUMN collaboration_sessions.connection_id IS 'Unique WebSocket connection identifier';
COMMENT ON COLUMN comments.yjs_mark_id IS 'Yjs text annotation mark for inline comments';
