use crate::models::{Chunk, Note};
use chrono::Utc;
use rusqlite::{params, Connection, OptionalExtension, Result};
use std::path::Path;
use std::sync::Mutex;

pub struct Database {
    conn: Mutex<Connection>,
}

impl Database {
    pub fn new(db_path: &Path) -> Result<Self> {
        let conn = Connection::open(db_path)?;

        // Disable FK enforcement — this DB is a search index, not the source of truth.
        // Workspace folder IDs (nanoid) don't exist in this DB's folders table.
        conn.execute_batch("PRAGMA foreign_keys = OFF;")?;

        Ok(Database {
            conn: Mutex::new(conn),
        })
    }

    pub fn init_schema(&self) -> Result<()> {
        let conn = self.conn.lock().unwrap();

        // Folders table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS folders (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                parent_id TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE
            )",
            [],
        )?;

        // Notes table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS notes (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL DEFAULT 'Untitled',
                content TEXT,
                folder_id TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE
            )",
            [],
        )?;

        // Chunks table with embeddings
        conn.execute(
            "CREATE TABLE IF NOT EXISTS chunks (
                id TEXT PRIMARY KEY,
                note_id TEXT NOT NULL,
                folder_path TEXT NOT NULL,
                text TEXT NOT NULL,
                embedding BLOB,
                chunk_index INTEGER NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
            )",
            [],
        )?;

        // Create index on note_id for faster lookups
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_chunks_note_id ON chunks(note_id)",
            [],
        )?;

        // Create index on folder_path for hierarchical filtering
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_chunks_folder_path ON chunks(folder_path)",
            [],
        )?;

        // Create virtual table for FTS5
        conn.execute(
            "CREATE VIRTUAL TABLE IF NOT EXISTS fts_chunks USING fts5(
                chunk_id,
                text,
                content='chunks',
                content_rowid='rowid'
            )",
            [],
        )?;

        // Triggers to keep FTS index in sync
        conn.execute(
            "CREATE TRIGGER IF NOT EXISTS chunks_ai AFTER INSERT ON chunks BEGIN
                INSERT INTO fts_chunks(rowid, chunk_id, text)
                VALUES (new.rowid, new.id, new.text);
            END",
            [],
        )?;

        conn.execute(
            "CREATE TRIGGER IF NOT EXISTS chunks_ad AFTER DELETE ON chunks BEGIN
                INSERT INTO fts_chunks(fts_chunks, rowid, chunk_id, text)
                VALUES ('delete', old.rowid, old.id, old.text);
            END",
            [],
        )?;

        conn.execute(
            "CREATE TRIGGER IF NOT EXISTS chunks_au AFTER UPDATE ON chunks BEGIN
                INSERT INTO fts_chunks(fts_chunks, rowid, chunk_id, text)
                VALUES ('delete', old.rowid, old.id, old.text);
                INSERT INTO fts_chunks(rowid, chunk_id, text)
                VALUES (new.rowid, new.id, new.text);
            END",
            [],
        )?;

        Ok(())
    }

    // Folder operations
    pub fn create_folder(&self, id: &str, name: &str, parent_id: Option<&str>) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        let now = Utc::now().to_rfc3339();

        conn.execute(
            "INSERT INTO folders (id, name, parent_id, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5)",
            params![id, name, parent_id, now, now],
        )?;

        Ok(())
    }

    pub fn get_folder_path(&self, folder_id: &str) -> Result<String> {
        let conn = self.conn.lock().unwrap();
        let mut path_parts = vec![];
        let mut current_id = folder_id.to_string();

        loop {
            let result: Option<(String, Option<String>)> = conn
                .query_row(
                    "SELECT name, parent_id FROM folders WHERE id = ?1",
                    params![&current_id],
                    |row| Ok((row.get(0)?, row.get(1)?)),
                )
                .optional()?;

            match result {
                Some((name, parent_id)) => {
                    path_parts.insert(0, name);
                    match parent_id {
                        Some(pid) => current_id = pid,
                        None => break,
                    }
                }
                None => break,
            }
        }

        Ok(format!("/{}", path_parts.join("/")))
    }

    // Note operations
    pub fn create_note(&self, id: &str, title: &str, content: &str, folder_id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        let now = Utc::now().to_rfc3339();

        conn.execute(
            "INSERT INTO notes (id, title, content, folder_id, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![id, title, content, folder_id, now, now],
        )?;

        Ok(())
    }

    pub fn update_note(
        &self,
        id: &str,
        title: Option<&str>,
        content: Option<&str>,
        folder_id: Option<&str>,
    ) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        let now = Utc::now().to_rfc3339();

        if let Some(title) = title {
            conn.execute(
                "UPDATE notes SET title = ?1, updated_at = ?2 WHERE id = ?3",
                params![title, now, id],
            )?;
        }

        if let Some(content) = content {
            conn.execute(
                "UPDATE notes SET content = ?1, updated_at = ?2 WHERE id = ?3",
                params![content, now, id],
            )?;
        }

        if let Some(folder_id) = folder_id {
            conn.execute(
                "UPDATE notes SET folder_id = ?1, updated_at = ?2 WHERE id = ?3",
                params![folder_id, now, id],
            )?;
        }

        Ok(())
    }

    pub fn get_note(&self, id: &str) -> Result<Option<Note>> {
        let conn = self.conn.lock().unwrap();

        let note = conn
            .query_row(
                "SELECT id, title, content, folder_id, created_at, updated_at 
             FROM notes WHERE id = ?1",
                params![id],
                |row| {
                    let created_at_str: String = row.get(4)?;
                    let updated_at_str: String = row.get(5)?;
                    Ok(Note {
                        id: row.get(0)?,
                        title: row.get(1)?,
                        content: row.get(2)?,
                        folder_id: row.get(3)?,
                        created_at: chrono::DateTime::parse_from_rfc3339(&created_at_str)
                            .map_err(|e| {
                                rusqlite::Error::FromSqlConversionFailure(
                                    4,
                                    rusqlite::types::Type::Text,
                                    Box::new(e),
                                )
                            })?
                            .with_timezone(&chrono::Utc),
                        updated_at: chrono::DateTime::parse_from_rfc3339(&updated_at_str)
                            .map_err(|e| {
                                rusqlite::Error::FromSqlConversionFailure(
                                    5,
                                    rusqlite::types::Type::Text,
                                    Box::new(e),
                                )
                            })?
                            .with_timezone(&chrono::Utc),
                    })
                },
            )
            .optional()?;

        Ok(note)
    }

    pub fn get_all_notes(&self) -> Result<Vec<Note>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, title, content, folder_id, created_at, updated_at 
             FROM notes ORDER BY updated_at DESC",
        )?;

        let notes = stmt
            .query_map([], |row| {
                let created_at_str: String = row.get(4)?;
                let updated_at_str: String = row.get(5)?;
                Ok(Note {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    content: row.get(2)?,
                    folder_id: row.get(3)?,
                    created_at: chrono::DateTime::parse_from_rfc3339(&created_at_str)
                        .map_err(|e| {
                            rusqlite::Error::FromSqlConversionFailure(
                                4,
                                rusqlite::types::Type::Text,
                                Box::new(e),
                            )
                        })?
                        .with_timezone(&chrono::Utc),
                    updated_at: chrono::DateTime::parse_from_rfc3339(&updated_at_str)
                        .map_err(|e| {
                            rusqlite::Error::FromSqlConversionFailure(
                                5,
                                rusqlite::types::Type::Text,
                                Box::new(e),
                            )
                        })?
                        .with_timezone(&chrono::Utc),
                })
            })?
            .collect::<Result<Vec<_>>>()?;

        Ok(notes)
    }

    // Chunk operations
    pub fn delete_note_chunks(&self, note_id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM chunks WHERE note_id = ?1", params![note_id])?;
        Ok(())
    }

    pub fn insert_chunk(&self, chunk: &Chunk) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        let now = Utc::now().to_rfc3339();

        let embedding_blob = chunk.embedding.as_ref().map(|emb| {
            let bytes: Vec<u8> = emb.iter().flat_map(|f| f.to_le_bytes().to_vec()).collect();
            bytes
        });

        conn.execute(
            "INSERT INTO chunks (id, note_id, folder_path, text, embedding, chunk_index, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                chunk.id,
                chunk.note_id,
                chunk.folder_path,
                chunk.text,
                embedding_blob,
                chunk.chunk_index,
                now,
            ],
        )?;

        Ok(())
    }

    pub fn get_note_chunks(&self, note_id: &str) -> Result<Vec<Chunk>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, note_id, folder_path, text, embedding, chunk_index, created_at
             FROM chunks WHERE note_id = ?1 ORDER BY chunk_index",
        )?;

        let chunks = stmt
            .query_map(params![note_id], |row| {
                let embedding_blob: Option<Vec<u8>> = row.get(4)?;
                let embedding = embedding_blob.map(|blob| {
                    blob.chunks_exact(4)
                        .map(|chunk| f32::from_le_bytes([chunk[0], chunk[1], chunk[2], chunk[3]]))
                        .collect()
                });
                let created_at_str: String = row.get(6)?;

                Ok(Chunk {
                    id: row.get(0)?,
                    note_id: row.get(1)?,
                    folder_path: row.get(2)?,
                    text: row.get(3)?,
                    embedding,
                    chunk_index: row.get(5)?,
                    created_at: chrono::DateTime::parse_from_rfc3339(&created_at_str)
                        .map_err(|e| {
                            rusqlite::Error::FromSqlConversionFailure(
                                6,
                                rusqlite::types::Type::Text,
                                Box::new(e),
                            )
                        })?
                        .with_timezone(&chrono::Utc),
                })
            })?
            .collect::<Result<Vec<_>>>()?;

        Ok(chunks)
    }

    // Search operations
    pub fn search_vector(
        &self,
        query_embedding: &Vec<f32>,
        folder_path: &str,
        limit: i64,
    ) -> Result<Vec<(String, f64)>> {
        let conn = self.conn.lock().unwrap();

        // Fetch all chunks in the folder path
        let mut stmt = conn.prepare(
            "SELECT id, embedding
             FROM chunks
             WHERE folder_path LIKE ?1 || '%' AND embedding IS NOT NULL",
        )?;

        let results: Vec<(String, Vec<f32>)> = stmt
            .query_map(params![folder_path], |row| {
                let id: String = row.get(0)?;
                let embedding_blob: Vec<u8> = row.get(1)?;
                let embedding: Vec<f32> = embedding_blob
                    .chunks_exact(4)
                    .map(|chunk| f32::from_le_bytes([chunk[0], chunk[1], chunk[2], chunk[3]]))
                    .collect();
                Ok((id, embedding))
            })?
            .collect::<Result<Vec<_>>>()?;

        // Calculate cosine similarity for each chunk
        let mut similarities: Vec<(String, f64)> = results
            .into_iter()
            .map(|(id, embedding)| {
                let similarity = cosine_similarity(query_embedding, &embedding) as f64;
                (id, similarity)
            })
            .collect();

        // Sort by similarity descending
        similarities.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap());

        // Take top N
        Ok(similarities.into_iter().take(limit as usize).collect())
    }

    pub fn search_keyword(
        &self,
        query: &str,
        folder_path: &str,
        limit: i64,
    ) -> Result<Vec<(String, f64)>> {
        let conn = self.conn.lock().unwrap();

        let mut stmt = conn.prepare(
            "SELECT c.id, f.rank
             FROM fts_chunks f
             JOIN chunks c ON c.rowid = f.rowid
             WHERE f MATCH ?1
             AND c.folder_path LIKE ?2 || '%'
             ORDER BY f.rank
             LIMIT ?3",
        )?;

        let results = stmt
            .query_map(params![query, folder_path, limit], |row| {
                let id: String = row.get(0)?;
                let rank: f64 = row.get(1)?;
                // Convert rank to score (lower rank = better match)
                let score = 1.0 / (1.0 + rank.abs());
                Ok((id, score))
            })?
            .collect::<Result<Vec<_>>>()?;

        Ok(results)
    }

    pub fn get_chunks_by_ids(&self, ids: &[String]) -> Result<Vec<Chunk>> {
        if ids.is_empty() {
            return Ok(vec![]);
        }

        let conn = self.conn.lock().unwrap();
        let placeholders: Vec<String> = ids.iter().map(|_| "?".to_string()).collect();
        let sql = format!(
            "SELECT id, note_id, folder_path, text, embedding, chunk_index, created_at
             FROM chunks WHERE id IN ({})",
            placeholders.join(",")
        );

        let mut stmt = conn.prepare(&sql)?;
        let params: Vec<&dyn rusqlite::ToSql> =
            ids.iter().map(|id| id as &dyn rusqlite::ToSql).collect();

        let chunks = stmt
            .query_map(params.as_slice(), |row| {
                let embedding_blob: Option<Vec<u8>> = row.get(4)?;
                let embedding = embedding_blob.map(|blob| {
                    blob.chunks_exact(4)
                        .map(|chunk| f32::from_le_bytes([chunk[0], chunk[1], chunk[2], chunk[3]]))
                        .collect()
                });
                let created_at_str: String = row.get(6)?;

                Ok(Chunk {
                    id: row.get(0)?,
                    note_id: row.get(1)?,
                    folder_path: row.get(2)?,
                    text: row.get(3)?,
                    embedding,
                    chunk_index: row.get(5)?,
                    created_at: chrono::DateTime::parse_from_rfc3339(&created_at_str)
                        .map_err(|e| {
                            rusqlite::Error::FromSqlConversionFailure(
                                6,
                                rusqlite::types::Type::Text,
                                Box::new(e),
                            )
                        })?
                        .with_timezone(&chrono::Utc),
                })
            })?
            .collect::<Result<Vec<_>>>()?;

        Ok(chunks)
    }

    pub fn get_note_title(&self, note_id: &str) -> Result<Option<String>> {
        let conn = self.conn.lock().unwrap();
        let title: Option<String> = conn
            .query_row(
                "SELECT title FROM notes WHERE id = ?1",
                params![note_id],
                |row| row.get(0),
            )
            .optional()?;

        Ok(title)
    }

    /// Search notes by title (fallback when no chunks indexed)
    pub fn search_notes_by_title(
        &self,
        query: &str,
        folder_path: &str,
        limit: i64,
    ) -> Result<Vec<(String, String, String)>> {
        let conn = self.conn.lock().unwrap();

        // Simple title search with LIKE
        let pattern = format!("%{}%", query);
        let mut stmt = conn.prepare(
            "SELECT id, title, folder_id FROM notes 
             WHERE title LIKE ?1 
             LIMIT ?2",
        )?;

        let results = stmt
            .query_map(params![&pattern, limit], |row| {
                let id: String = row.get(0)?;
                let title: String = row.get(1)?;
                let folder_id: String = row.get(2)?;
                Ok((id, title, folder_id))
            })?
            .collect::<Result<Vec<_>>>()?;

        // Filter by folder path if specified
        if folder_path != "/" {
            let filtered: Vec<(String, String, String)> = results
                .into_iter()
                .filter(|(_, _, folder_id)| {
                    // Get folder path and check if it starts with folder_path
                    if let Ok(path) = self.get_folder_path(folder_id) {
                        path.starts_with(folder_path)
                    } else {
                        false
                    }
                })
                .take(limit as usize)
                .collect();
            Ok(filtered)
        } else {
            Ok(results)
        }
    }
}

/// Calculate cosine similarity between two embedding vectors
fn cosine_similarity(a: &[f32], b: &[f32]) -> f32 {
    if a.len() != b.len() || a.is_empty() {
        return 0.0;
    }

    let dot_product: f32 = a.iter().zip(b.iter()).map(|(x, y)| x * y).sum();
    let norm_a: f32 = a.iter().map(|x| x * x).sum::<f32>().sqrt();
    let norm_b: f32 = b.iter().map(|x| x * x).sum::<f32>().sqrt();

    if norm_a > 0.0 && norm_b > 0.0 {
        dot_product / (norm_a * norm_b)
    } else {
        0.0
    }
}
