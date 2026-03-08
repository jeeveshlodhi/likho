-- ============================================================
-- SOCHIX — Full PostgreSQL Schema
-- Future-ready, local-first, AI-native Notion alternative
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- NOTE: pgvector NOT used — vectors live in LanceDB (offline) and Qdrant (online)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";          -- trigram fuzzy search
CREATE EXTENSION IF NOT EXISTS "btree_gist";       -- advanced indexing
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements"; -- query performance monitoring

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE workspace_type AS ENUM ('personal', 'team', 'enterprise');
CREATE TYPE space_type AS ENUM ('online', 'offline');
CREATE TYPE member_role AS ENUM ('owner', 'admin', 'editor', 'commenter', 'viewer');
CREATE TYPE block_type AS ENUM (
  'page', 'text', 'heading_1', 'heading_2', 'heading_3',
  'bullet_list', 'numbered_list', 'todo', 'toggle',
  'code', 'quote', 'callout', 'divider', 'image',
  'video', 'audio', 'file', 'embed', 'bookmark',
  'table', 'table_row', 'database', 'database_row',
  'equation', 'mermaid', 'excalidraw', 'ai_block',
  'template_button', 'synced_block', 'column_list', 'column'
);
CREATE TYPE sync_status AS ENUM ('synced', 'pending', 'conflict', 'local_only');
CREATE TYPE ai_provider AS ENUM ('openai', 'anthropic', 'ollama', 'gemini', 'custom');
CREATE TYPE ai_task_type AS ENUM (
  'summarize', 'expand', 'rewrite', 'translate',
  'explain', 'fix_grammar', 'generate', 'embed',
  'chat', 'extract', 'classify', 'search'
);
CREATE TYPE notification_type AS ENUM (
  'mention', 'comment', 'share', 'reminder',
  'page_update', 'member_join', 'ai_complete'
);
CREATE TYPE plan_type AS ENUM ('free', 'pro', 'team', 'enterprise');
CREATE TYPE property_type AS ENUM (
  'text', 'number', 'select', 'multi_select', 'date',
  'person', 'file', 'checkbox', 'url', 'email',
  'phone', 'formula', 'relation', 'rollup',
  'created_time', 'created_by', 'last_edited_time', 'last_edited_by'
);
CREATE TYPE theme_type AS ENUM ('light', 'dark', 'system');

-- ============================================================
-- USERS & AUTH
-- ============================================================

CREATE TABLE users (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email             TEXT UNIQUE NOT NULL,
  email_verified    BOOLEAN DEFAULT FALSE,
  username          TEXT UNIQUE,
  full_name         TEXT,
  avatar_url        TEXT,
  bio               TEXT,
  timezone          TEXT DEFAULT 'UTC',
  locale            TEXT DEFAULT 'en',
  theme             theme_type DEFAULT 'system',
  plan              plan_type DEFAULT 'free',
  plan_expires_at   TIMESTAMPTZ,
  storage_used      BIGINT DEFAULT 0,         -- bytes
  storage_limit     BIGINT DEFAULT 1073741824, -- 1GB default
  is_active         BOOLEAN DEFAULT TRUE,
  last_seen_at      TIMESTAMPTZ,
  onboarded_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ               -- soft delete
);

CREATE TABLE user_auth (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider          TEXT NOT NULL,             -- 'email', 'google', 'github', 'apple'
  provider_id       TEXT,                      -- external provider user id
  password_hash     TEXT,                      -- for email auth
  access_token      TEXT,
  refresh_token     TEXT,
  token_expires_at  TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (provider, provider_id)
);

CREATE TABLE sessions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash        TEXT NOT NULL UNIQUE,
  device_name       TEXT,
  device_type       TEXT,                      -- 'desktop', 'mobile', 'web'
  ip_address        INET,
  user_agent        TEXT,
  is_tauri          BOOLEAN DEFAULT FALSE,     -- desktop app session
  last_active_at    TIMESTAMPTZ DEFAULT NOW(),
  expires_at        TIMESTAMPTZ NOT NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE api_keys (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  key_hash          TEXT NOT NULL UNIQUE,
  key_prefix        TEXT NOT NULL,             -- first 8 chars for display
  scopes            TEXT[] DEFAULT '{}',       -- ['read', 'write', 'admin']
  last_used_at      TIMESTAMPTZ,
  expires_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  revoked_at        TIMESTAMPTZ
);

-- ============================================================
-- WORKSPACES
-- ============================================================

CREATE TABLE workspaces (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name              TEXT NOT NULL,
  slug              TEXT UNIQUE NOT NULL,
  icon              TEXT,
  cover_url         TEXT,
  description       TEXT,
  type              workspace_type DEFAULT 'personal',
  plan              plan_type DEFAULT 'free',
  plan_expires_at   TIMESTAMPTZ,
  owner_id          UUID NOT NULL REFERENCES users(id),
  storage_used      BIGINT DEFAULT 0,
  storage_limit     BIGINT DEFAULT 10737418240, -- 10GB default
  member_limit      INT DEFAULT 5,
  settings          JSONB DEFAULT '{}',         -- workspace-level settings
  is_active         BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ
);

CREATE TABLE workspace_members (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id      UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role              member_role DEFAULT 'viewer',
  invited_by        UUID REFERENCES users(id),
  joined_at         TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (workspace_id, user_id)
);

CREATE TABLE workspace_invites (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id      UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email             TEXT NOT NULL,
  role              member_role DEFAULT 'viewer',
  token             TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by        UUID NOT NULL REFERENCES users(id),
  accepted_at       TIMESTAMPTZ,
  expires_at        TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SPACES (Online / Offline split)
-- ============================================================

CREATE TABLE spaces (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id      UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  icon              TEXT,
  type              space_type NOT NULL DEFAULT 'online',
  description       TEXT,
  is_default        BOOLEAN DEFAULT FALSE,
  sort_order        INT DEFAULT 0,
  settings          JSONB DEFAULT '{}',
  created_by        UUID REFERENCES users(id),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ
);

-- ============================================================
-- PAGES & BLOCKS
-- ============================================================

CREATE TABLE pages (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id      UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  space_id          UUID REFERENCES spaces(id) ON DELETE SET NULL,
  parent_id         UUID REFERENCES pages(id) ON DELETE CASCADE,  -- nested pages
  created_by        UUID REFERENCES users(id) ON DELETE SET NULL,
  last_edited_by    UUID REFERENCES users(id) ON DELETE SET NULL,

  title             TEXT NOT NULL DEFAULT 'Untitled',
  icon              TEXT,                      -- emoji or image url
  cover_url         TEXT,
  cover_position    FLOAT DEFAULT 0.5,         -- vertical position 0-1

  is_template       BOOLEAN DEFAULT FALSE,
  template_id       UUID REFERENCES pages(id), -- if created from template
  is_locked         BOOLEAN DEFAULT FALSE,
  is_published      BOOLEAN DEFAULT FALSE,
  published_at      TIMESTAMPTZ,
  publish_slug      TEXT UNIQUE,               -- public URL slug

  full_text         TEXT,                      -- denormalized for FTS
  word_count        INT DEFAULT 0,
  read_time_minutes INT DEFAULT 0,

  sort_order        FLOAT DEFAULT 0,           -- fractional indexing
  depth             INT DEFAULT 0,             -- nesting depth cache
  path              TEXT,                      -- materialized path e.g. /uuid/uuid/uuid

  sync_status       sync_status DEFAULT 'synced',
  local_id          TEXT,                      -- ID used in offline/Tauri version
  synced_at         TIMESTAMPTZ,
  version           INT DEFAULT 1,             -- optimistic concurrency

  metadata          JSONB DEFAULT '{}',        -- extensible metadata
  settings          JSONB DEFAULT '{}',        -- page-level settings

  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ               -- soft delete / trash
);

CREATE TABLE blocks (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id           UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  parent_block_id   UUID REFERENCES blocks(id) ON DELETE CASCADE, -- nested blocks
  workspace_id      UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  type              block_type NOT NULL DEFAULT 'text',
  content           JSONB NOT NULL DEFAULT '{}',  -- BlockNote JSON content
  props             JSONB DEFAULT '{}',            -- block-specific properties
  attrs             JSONB DEFAULT '{}',            -- custom attributes

  sort_order        FLOAT DEFAULT 0,              -- fractional indexing
  depth             INT DEFAULT 0,
  is_synced_block   BOOLEAN DEFAULT FALSE,
  synced_source_id  UUID REFERENCES blocks(id),   -- source for synced blocks

  created_by        UUID REFERENCES users(id),
  last_edited_by    UUID REFERENCES users(id),
  version           INT DEFAULT 1,

  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ
);

-- ============================================================
-- DATABASES (Notion-style)
-- ============================================================

CREATE TABLE databases (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id           UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  workspace_id      UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name              TEXT NOT NULL DEFAULT 'Untitled Database',
  icon              TEXT,
  description       TEXT,
  default_view      UUID,                     -- FK set after views table
  created_by        UUID REFERENCES users(id),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ
);

CREATE TABLE database_properties (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  database_id       UUID NOT NULL REFERENCES databases(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  type              property_type NOT NULL,
  config            JSONB DEFAULT '{}',        -- type-specific config (options, formula, etc)
  sort_order        INT DEFAULT 0,
  is_primary        BOOLEAN DEFAULT FALSE,     -- the title property
  is_hidden         BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE database_views (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  database_id       UUID NOT NULL REFERENCES databases(id) ON DELETE CASCADE,
  name              TEXT NOT NULL DEFAULT 'Default View',
  type              TEXT NOT NULL DEFAULT 'table', -- table, board, calendar, gallery, list, timeline
  filters           JSONB DEFAULT '[]',
  sorts             JSONB DEFAULT '[]',
  group_by          JSONB DEFAULT '{}',
  properties        JSONB DEFAULT '{}',        -- which properties are visible + order
  layout            JSONB DEFAULT '{}',        -- view-specific layout settings
  created_by        UUID REFERENCES users(id),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Add default_view FK now that database_views exists
ALTER TABLE databases ADD CONSTRAINT fk_default_view
  FOREIGN KEY (default_view) REFERENCES database_views(id) ON DELETE SET NULL;

CREATE TABLE database_rows (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  database_id       UUID NOT NULL REFERENCES databases(id) ON DELETE CASCADE,
  page_id           UUID REFERENCES pages(id) ON DELETE SET NULL, -- each row can be a full page
  properties        JSONB DEFAULT '{}',        -- { property_id: value }
  sort_order        FLOAT DEFAULT 0,
  created_by        UUID REFERENCES users(id),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ
);

-- ============================================================
-- TAGS & ORGANIZATION
-- ============================================================

CREATE TABLE tags (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id      UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  color             TEXT DEFAULT '#6B7280',
  icon              TEXT,
  created_by        UUID REFERENCES users(id),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (workspace_id, name)
);

CREATE TABLE page_tags (
  page_id           UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  tag_id            UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (page_id, tag_id)
);

-- ============================================================
-- BIDIRECTIONAL LINKS & GRAPH
-- ============================================================

CREATE TABLE page_links (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id      UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  source_page_id    UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  target_page_id    UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  source_block_id   UUID REFERENCES blocks(id) ON DELETE SET NULL,
  context_text      TEXT,                     -- surrounding text for backlink preview
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (source_page_id, target_page_id, source_block_id)
);

-- ============================================================
-- COMMENTS & COLLABORATION
-- ============================================================

CREATE TABLE comments (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id      UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  page_id           UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  block_id          UUID REFERENCES blocks(id) ON DELETE SET NULL,
  parent_id         UUID REFERENCES comments(id) ON DELETE CASCADE, -- threaded replies
  author_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content           TEXT NOT NULL,
  rich_content      JSONB,                    -- for formatted comments
  is_resolved       BOOLEAN DEFAULT FALSE,
  resolved_by       UUID REFERENCES users(id),
  resolved_at       TIMESTAMPTZ,
  edited_at         TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ
);

CREATE TABLE comment_reactions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comment_id        UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji             TEXT NOT NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (comment_id, user_id, emoji)
);

CREATE TABLE mentions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id      UUID NOT NULL REFERENCES workspaces(id),
  mentioned_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mentioned_by_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  page_id           UUID REFERENCES pages(id) ON DELETE CASCADE,
  block_id          UUID REFERENCES blocks(id) ON DELETE SET NULL,
  comment_id        UUID REFERENCES comments(id) ON DELETE CASCADE,
  is_read           BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- VERSION HISTORY
-- ============================================================

CREATE TABLE page_versions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id           UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  version           INT NOT NULL,
  title             TEXT,
  snapshot          JSONB NOT NULL,           -- full block tree snapshot
  diff              JSONB,                    -- incremental diff from previous version
  created_by        UUID REFERENCES users(id),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (page_id, version)
);

-- ============================================================
-- SHARING & PERMISSIONS
-- ============================================================

CREATE TABLE page_permissions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id           UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  user_id           UUID REFERENCES users(id) ON DELETE CASCADE,
  workspace_id      UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  role              member_role NOT NULL DEFAULT 'viewer',
  granted_by        UUID REFERENCES users(id),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  CHECK (user_id IS NOT NULL OR workspace_id IS NOT NULL)
);

CREATE TABLE share_links (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id           UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  token             TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  role              member_role DEFAULT 'viewer',
  password_hash     TEXT,                     -- optional password protection
  allow_duplicate   BOOLEAN DEFAULT FALSE,    -- can visitors duplicate the page
  view_count        INT DEFAULT 0,
  expires_at        TIMESTAMPTZ,
  created_by        UUID REFERENCES users(id),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  revoked_at        TIMESTAMPTZ
);

-- ============================================================
-- AI & EMBEDDINGS
-- ============================================================

CREATE TABLE ai_settings (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id      UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id           UUID REFERENCES users(id) ON DELETE CASCADE, -- user-level override
  provider          ai_provider NOT NULL DEFAULT 'anthropic',
  model             TEXT,                     -- e.g. 'claude-sonnet-4-20250514'
  api_key_encrypted TEXT,                     -- encrypted with pgcrypto
  base_url          TEXT,                     -- for custom/ollama endpoints
  is_local          BOOLEAN DEFAULT FALSE,    -- ollama / local model
  config            JSONB DEFAULT '{}',       -- temp, max_tokens, etc
  is_active         BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (workspace_id, user_id, provider)
);

-- Vectors live externally:
--   Offline (Tauri desktop) → LanceDB embedded (Rust-native, zero server)
--   Online  (server)        → Qdrant (self-hosted or qdrant.cloud)
-- This table is a lightweight reference bridge between Postgres and the vector store.
CREATE TABLE embedding_refs (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id      UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  page_id           UUID REFERENCES pages(id) ON DELETE CASCADE,
  block_id          UUID REFERENCES blocks(id) ON DELETE CASCADE,
  content_hash      TEXT NOT NULL,            -- sha256 of chunk_text, skip re-embedding if unchanged
  vector_id         TEXT NOT NULL,            -- point/record ID inside Qdrant or LanceDB
  vector_store      TEXT NOT NULL,            -- 'qdrant' or 'lancedb'
  collection        TEXT NOT NULL,            -- Qdrant collection or LanceDB table name
  model             TEXT NOT NULL,            -- e.g. 'nomic-embed-text', 'text-embedding-3-small'
  provider          ai_provider NOT NULL,     -- 'ollama' for local, 'openai'/'anthropic' for online
  chunk_index       INT DEFAULT 0,            -- position when doc split into multiple chunks
  chunk_text        TEXT,                     -- the actual text chunk embedded (for preview)
  space_type        space_type NOT NULL DEFAULT 'online',
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (page_id, block_id, chunk_index)
);

CREATE TABLE ai_conversations (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id      UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  page_id           UUID REFERENCES pages(id) ON DELETE SET NULL, -- context page
  title             TEXT,
  messages          JSONB NOT NULL DEFAULT '[]', -- full conversation history
  provider          ai_provider,
  model             TEXT,
  token_count       INT DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ai_tasks (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id      UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  page_id           UUID REFERENCES pages(id) ON DELETE SET NULL,
  block_id          UUID REFERENCES blocks(id) ON DELETE SET NULL,
  task_type         ai_task_type NOT NULL,
  input             TEXT,
  output            TEXT,
  provider          ai_provider,
  model             TEXT,
  prompt_tokens     INT,
  completion_tokens INT,
  duration_ms       INT,
  status            TEXT DEFAULT 'pending',   -- pending, running, done, failed
  error             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  completed_at      TIMESTAMPTZ
);

-- ============================================================
-- TEMPLATES
-- ============================================================

CREATE TABLE templates (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id      UUID REFERENCES workspaces(id) ON DELETE CASCADE, -- null = global
  created_by        UUID REFERENCES users(id) ON DELETE SET NULL,
  name              TEXT NOT NULL,
  description       TEXT,
  icon              TEXT,
  cover_url         TEXT,
  category          TEXT,                     -- 'meeting', 'project', 'journal', etc.
  tags              TEXT[] DEFAULT '{}',
  snapshot          JSONB NOT NULL,           -- full page block tree
  use_count         INT DEFAULT 0,
  is_public         BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FILES & MEDIA
-- ============================================================

CREATE TABLE files (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id      UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  uploaded_by       UUID REFERENCES users(id) ON DELETE SET NULL,
  page_id           UUID REFERENCES pages(id) ON DELETE SET NULL,
  block_id          UUID REFERENCES blocks(id) ON DELETE SET NULL,
  name              TEXT NOT NULL,
  mime_type         TEXT,
  size_bytes        BIGINT,
  storage_path      TEXT NOT NULL,            -- s3/r2/local path
  storage_bucket    TEXT,
  cdn_url           TEXT,
  thumbnail_url     TEXT,
  width             INT,
  height            INT,
  duration_seconds  FLOAT,                   -- for video/audio
  metadata          JSONB DEFAULT '{}',
  is_external       BOOLEAN DEFAULT FALSE,   -- embedded from URL vs uploaded
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id      UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  type              notification_type NOT NULL,
  title             TEXT,
  body              TEXT,
  data              JSONB DEFAULT '{}',       -- contextual data (page_id, comment_id, etc)
  is_read           BOOLEAN DEFAULT FALSE,
  read_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SYNC ENGINE (Offline/Online reconciliation)
-- ============================================================

CREATE TABLE sync_operations (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id      UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id         TEXT NOT NULL,            -- unique per device/session
  operation         TEXT NOT NULL,            -- 'insert', 'update', 'delete'
  table_name        TEXT NOT NULL,
  record_id         UUID NOT NULL,
  payload           JSONB NOT NULL,           -- the change data
  vector_clock      JSONB DEFAULT '{}',       -- CRDT vector clock per device
  applied_at        TIMESTAMPTZ,
  conflict_with     UUID REFERENCES sync_operations(id),
  conflict_resolved BOOLEAN DEFAULT FALSE,
  resolution        TEXT,                     -- 'local_wins', 'remote_wins', 'merged'
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE device_registry (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id         TEXT NOT NULL UNIQUE,
  device_name       TEXT,
  device_type       TEXT,                     -- 'tauri_desktop', 'web', 'mobile'
  platform          TEXT,                     -- 'macos', 'windows', 'linux', 'ios', 'android'
  last_sync_at      TIMESTAMPTZ,
  last_seen_at      TIMESTAMPTZ,
  vector_clock      JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AUDIT LOG
-- ============================================================

CREATE TABLE audit_logs (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id      UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  user_id           UUID REFERENCES users(id) ON DELETE SET NULL,
  action            TEXT NOT NULL,            -- 'page.create', 'member.invite', etc
  resource_type     TEXT,
  resource_id       UUID,
  metadata          JSONB DEFAULT '{}',
  ip_address        INET,
  user_agent        TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- USER PREFERENCES & FAVORITES
-- ============================================================

CREATE TABLE user_preferences (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id      UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  key               TEXT NOT NULL,
  value             JSONB NOT NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, workspace_id, key)
);

CREATE TABLE favorites (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id      UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  page_id           UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  sort_order        INT DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, page_id)
);

CREATE TABLE recently_visited (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  page_id           UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  visited_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, page_id)
);

-- ============================================================
-- SEARCH
-- ============================================================

CREATE TABLE search_index (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id      UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  page_id           UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  content           TEXT NOT NULL,
  tsv               TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', content)) STORED,
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (page_id)
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NULL;

-- Pages
CREATE INDEX idx_pages_workspace ON pages(workspace_id);
CREATE INDEX idx_pages_space ON pages(space_id);
CREATE INDEX idx_pages_parent ON pages(parent_id);
CREATE INDEX idx_pages_created_by ON pages(created_by);
CREATE INDEX idx_pages_deleted_at ON pages(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_pages_published ON pages(is_published) WHERE is_published = TRUE;
CREATE INDEX idx_pages_path ON pages USING GIST (path gist_trgm_ops);
CREATE INDEX idx_pages_updated_at ON pages(updated_at DESC);
CREATE INDEX idx_pages_sync_status ON pages(sync_status);

-- Blocks
CREATE INDEX idx_blocks_page ON blocks(page_id);
CREATE INDEX idx_blocks_parent ON blocks(parent_block_id);
CREATE INDEX idx_blocks_type ON blocks(type);
CREATE INDEX idx_blocks_deleted_at ON blocks(deleted_at) WHERE deleted_at IS NULL;

-- Workspaces
CREATE INDEX idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX idx_workspace_members_workspace ON workspace_members(workspace_id);

-- Tags
CREATE INDEX idx_page_tags_page ON page_tags(page_id);
CREATE INDEX idx_page_tags_tag ON page_tags(tag_id);

-- Links
CREATE INDEX idx_page_links_source ON page_links(source_page_id);
CREATE INDEX idx_page_links_target ON page_links(target_page_id);

-- Embedding refs (vectors live in LanceDB / Qdrant, not Postgres)
CREATE INDEX idx_embedding_refs_page ON embedding_refs(page_id);
CREATE INDEX idx_embedding_refs_block ON embedding_refs(block_id);
CREATE INDEX idx_embedding_refs_workspace ON embedding_refs(workspace_id);
CREATE INDEX idx_embedding_refs_vector_id ON embedding_refs(vector_id);
CREATE INDEX idx_embedding_refs_space_type ON embedding_refs(space_type);
CREATE INDEX idx_embedding_refs_content_hash ON embedding_refs(content_hash);

-- Search
CREATE INDEX idx_search_tsv ON search_index USING GIN (tsv);
CREATE INDEX idx_search_workspace ON search_index(workspace_id);

-- Notifications
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id) WHERE is_read = FALSE;

-- Sync
CREATE INDEX idx_sync_ops_workspace ON sync_operations(workspace_id);
CREATE INDEX idx_sync_ops_device ON sync_operations(device_id);
CREATE INDEX idx_sync_ops_record ON sync_operations(table_name, record_id);

-- Audit
CREATE INDEX idx_audit_workspace ON audit_logs(workspace_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- AI
CREATE INDEX idx_ai_tasks_workspace ON ai_tasks(workspace_id);
CREATE INDEX idx_ai_tasks_status ON ai_tasks(status);
CREATE INDEX idx_ai_conversations_user ON ai_conversations(user_id);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users', 'workspaces', 'workspace_members', 'spaces',
    'pages', 'blocks', 'databases', 'database_properties',
    'database_views', 'database_rows', 'tags', 'ai_settings',
    'embedding_refs', 'ai_conversations', 'templates', 'user_preferences'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at
       BEFORE UPDATE ON %s
       FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
      t, t
    );
  END LOOP;
END;
$$;

-- Auto-update word count on page full_text change
CREATE OR REPLACE FUNCTION update_page_word_count()
RETURNS TRIGGER AS $$
BEGIN
  NEW.word_count = array_length(string_to_array(trim(NEW.full_text), ' '), 1);
  NEW.read_time_minutes = GREATEST(1, ROUND(NEW.word_count / 200.0));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_pages_word_count
  BEFORE INSERT OR UPDATE OF full_text ON pages
  FOR EACH ROW EXECUTE FUNCTION update_page_word_count();

-- Update search index when page full_text changes
CREATE OR REPLACE FUNCTION sync_search_index()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO search_index (workspace_id, page_id, content)
  VALUES (NEW.workspace_id, NEW.id, COALESCE(NEW.full_text, NEW.title))
  ON CONFLICT (page_id) DO UPDATE
    SET content = COALESCE(NEW.full_text, NEW.title),
        updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_pages_search_index
  AFTER INSERT OR UPDATE OF full_text, title ON pages
  FOR EACH ROW EXECUTE FUNCTION sync_search_index();

-- Increment template use count
CREATE OR REPLACE FUNCTION increment_template_use()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.template_id IS NOT NULL THEN
    UPDATE templates SET use_count = use_count + 1 WHERE id = NEW.template_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_pages_template_use
  AFTER INSERT ON pages
  FOR EACH ROW EXECUTE FUNCTION increment_template_use();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see themselves
CREATE POLICY users_self ON users
  USING (id = current_setting('app.user_id')::UUID);

-- Workspace members can see workspace
CREATE POLICY workspaces_members ON workspaces
  USING (
    id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = current_setting('app.user_id')::UUID
    )
  );

-- Pages visible to workspace members
CREATE POLICY pages_workspace_members ON pages
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = current_setting('app.user_id')::UUID
    )
    AND deleted_at IS NULL
  );

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE users IS 'Core user accounts';
COMMENT ON TABLE workspaces IS 'Top-level organizational unit (like a Notion workspace)';
COMMENT ON TABLE spaces IS 'Online/offline split spaces within a workspace';
COMMENT ON TABLE pages IS 'Documents/pages — the primary content unit';
COMMENT ON TABLE blocks IS 'Individual content blocks within a page (BlockNote JSON)';
COMMENT ON TABLE databases IS 'Notion-style databases with structured properties';
COMMENT ON TABLE embedding_refs IS 'Reference bridge to external vector stores — LanceDB (offline/Tauri) and Qdrant (online)';
COMMENT ON TABLE sync_operations IS 'CRDT-based sync log for offline/online reconciliation';
COMMENT ON TABLE ai_tasks IS 'Log of all AI operations for billing and debugging';
COMMENT ON COLUMN pages.path IS 'Materialized path for efficient tree queries e.g. /root-id/parent-id/this-id';
COMMENT ON COLUMN blocks.content IS 'BlockNote JSON block content';
COMMENT ON COLUMN sync_operations.vector_clock IS 'Lamport/vector clock per device for CRDT conflict resolution';
COMMENT ON COLUMN embedding_refs.vector_id IS 'ID of the point/record inside Qdrant (online) or LanceDB (offline)';
COMMENT ON COLUMN embedding_refs.collection IS 'Qdrant collection name (e.g. workspace_<uuid>) or LanceDB table name';
COMMENT ON COLUMN embedding_refs.space_type IS 'online = Qdrant, offline = LanceDB embedded in Tauri';