-- Database schema for backup restoration
-- This schema is used when restoring from JSON backups

-- Folders table
CREATE TABLE IF NOT EXISTS folders (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    parent_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE
);

-- Notes table
CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL DEFAULT 'Untitled',
    content TEXT,
    folder_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE
);

-- Chunks table with embeddings
CREATE TABLE IF NOT EXISTS chunks (
    id TEXT PRIMARY KEY,
    note_id TEXT NOT NULL,
    folder_path TEXT NOT NULL,
    text TEXT NOT NULL,
    embedding BLOB,
    chunk_index INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
);

-- Create index on note_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_chunks_note_id ON chunks(note_id);

-- Create index on folder_path for hierarchical filtering
CREATE INDEX IF NOT EXISTS idx_chunks_folder_path ON chunks(folder_path);

-- Create virtual table for FTS5
CREATE VIRTUAL TABLE IF NOT EXISTS fts_chunks USING fts5(
    chunk_id,
    text,
    content='chunks',
    content_rowid='rowid'
);

-- Triggers to keep FTS index in sync
CREATE TRIGGER IF NOT EXISTS chunks_ai AFTER INSERT ON chunks BEGIN
    INSERT INTO fts_chunks(rowid, chunk_id, text)
    VALUES (new.rowid, new.id, new.text);
END;

CREATE TRIGGER IF NOT EXISTS chunks_ad AFTER DELETE ON chunks BEGIN
    INSERT INTO fts_chunks(fts_chunks, rowid, chunk_id, text)
    VALUES ('delete', old.rowid, old.id, old.text);
END;

CREATE TRIGGER IF NOT EXISTS chunks_au AFTER UPDATE ON chunks BEGIN
    INSERT INTO fts_chunks(fts_chunks, rowid, chunk_id, text)
    VALUES ('delete', old.rowid, old.id, old.text);
    INSERT INTO fts_chunks(rowid, chunk_id, text)
    VALUES (new.rowid, new.id, new.text);
END;
