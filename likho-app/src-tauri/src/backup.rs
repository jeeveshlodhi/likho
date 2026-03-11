//! Database backup and restore functionality
//!
//! Provides commands for:
//! - Exporting SQLite database to backup files
//! - Importing database from backup files
//! - Verifying backup integrity
//! - Automatic backup scheduling support

use crate::models::{BackupInfo, BackupMetadata, RestorePreview};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::fs;
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use thiserror::Error;

/// Errors that can occur during backup operations
#[derive(Debug, Error)]
pub enum BackupError {
    #[error("Database not found at: {0}")]
    DatabaseNotFound(PathBuf),
    
    #[error("Backup file not found: {0}")]
    BackupNotFound(PathBuf),
    
    #[error("Invalid backup file: {0}")]
    InvalidBackup(String),
    
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    
    #[error("SQLite error: {0}")]
    Sqlite(#[from] rusqlite::Error),
    
    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),
    
    #[error("Compression error: {0}")]
    Compression(String),
    
    #[error("Restore failed: {0}")]
    RestoreFailed(String),
}

/// Type of backup format
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub enum BackupFormat {
    /// Raw SQLite database file
    Sqlite,
    /// JSON export (portable)
    Json,
    /// Gzip compressed SQLite
    Gzip,
}

impl std::fmt::Display for BackupFormat {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            BackupFormat::Sqlite => write!(f, "sqlite"),
            BackupFormat::Json => write!(f, "json"),
            BackupFormat::Gzip => write!(f, "gzip"),
        }
    }
}

/// Backup service for managing database backups
pub struct BackupService {
    db_path: PathBuf,
}

impl BackupService {
    /// Create a new backup service instance
    pub fn new(db_path: PathBuf) -> Self {
        Self { db_path }
    }

    /// Get the current database path
    pub fn get_database_path(&self) -> &Path {
        &self.db_path
    }

    /// Export database to a backup file
    /// 
    /// # Arguments
    /// * `target_path` - Where to save the backup
    /// * `format` - Backup format (SQLite, JSON, or Gzip)
    /// * `include_embeddings` - Whether to include vector embeddings
    pub fn export_database(
        &self,
        target_path: &Path,
        format: BackupFormat,
        include_embeddings: bool,
    ) -> Result<BackupMetadata, BackupError> {
        // Verify source database exists
        if !self.db_path.exists() {
            return Err(BackupError::DatabaseNotFound(self.db_path.clone()));
        }

        // Get database info
        let metadata = fs::metadata(&self.db_path)?;
        let original_size = metadata.len();

        // Create backup based on format
        let (final_size, checksum) = match format {
            BackupFormat::Sqlite => {
                self.export_sqlite(target_path, include_embeddings)?
            }
            BackupFormat::Json => {
                self.export_json(target_path, include_embeddings)?
            }
            BackupFormat::Gzip => {
                self.export_gzip(target_path, include_embeddings)?
            }
        };

        let backup_metadata = BackupMetadata {
            version: env!("CARGO_PKG_VERSION").to_string(),
            created_at: Utc::now(),
            original_size,
            compressed_size: final_size,
            format: format.to_string(),
            checksum,
            include_embeddings,
            app_version: env!("CARGO_PKG_VERSION").to_string(),
        };

        // Write metadata alongside backup
        let meta_path = target_path.with_extension("meta.json");
        let meta_json = serde_json::to_string_pretty(&backup_metadata)?;
        fs::write(&meta_path, meta_json)?;

        Ok(backup_metadata)
    }

    /// Export as raw SQLite file
    fn export_sqlite(
        &self,
        target_path: &Path,
        _include_embeddings: bool,
    ) -> Result<(u64, String), BackupError> {
        // Use SQLite's backup API for consistency
        let source_conn = rusqlite::Connection::open(&self.db_path)?;
        let mut target_conn = rusqlite::Connection::open(target_path)?;
        
        {
            let backup = rusqlite::backup::Backup::new(&source_conn, &mut target_conn)?;
            backup.run_to_completion(100, std::time::Duration::from_millis(100), None)?;
            // backup is dropped here, releasing the borrow
        }

        // Calculate checksum
        let checksum = Self::calculate_file_checksum(target_path)?;
        let size = fs::metadata(target_path)?.len();

        Ok((size, checksum))
    }

    /// Export as JSON (portable format)
    fn export_json(
        &self,
        target_path: &Path,
        include_embeddings: bool,
    ) -> Result<(u64, String), BackupError> {
        let conn = rusqlite::Connection::open(&self.db_path)?;
        
        let export = DatabaseExport::export_from_connection(&conn, include_embeddings)?;
        let json = serde_json::to_string_pretty(&export)?;
        
        fs::write(target_path, &json)?;
        
        let checksum = Self::calculate_checksum(&json);
        let size = fs::metadata(target_path)?.len();

        Ok((size, checksum))
    }

    /// Export as Gzip compressed SQLite
    fn export_gzip(
        &self,
        target_path: &Path,
        _include_embeddings: bool,
    ) -> Result<(u64, String), BackupError> {
        use flate2::write::GzEncoder;
        use flate2::Compression;

        // First create temporary SQLite backup
        let temp_dir = std::env::temp_dir();
        let temp_backup = temp_dir.join(format!("likho_backup_{}.db", chrono::Utc::now().timestamp()));
        
        self.export_sqlite(&temp_backup, true)?;
        
        // Compress it
        let mut input = fs::File::open(&temp_backup)?;
        let output = fs::File::create(target_path)?;
        let mut encoder = GzEncoder::new(output, Compression::default());
        
        let mut buffer = Vec::new();
        input.read_to_end(&mut buffer)?;
        encoder.write_all(&buffer)?;
        encoder.finish()?;
        
        // Cleanup temp file
        let _ = fs::remove_file(&temp_backup);
        
        let checksum = Self::calculate_file_checksum(target_path)?;
        let size = fs::metadata(target_path)?.len();

        Ok((size, checksum))
    }

    /// Import database from a backup file
    pub fn import_database(
        &self,
        source_path: &Path,
    ) -> Result<RestorePreview, BackupError> {
        // Verify backup exists
        if !source_path.exists() {
            return Err(BackupError::BackupNotFound(source_path.to_path_buf()));
        }

        // Detect format and verify integrity
        let (_format, metadata) = self.detect_backup_format(source_path)?;
        
        // Create preview
        let preview = RestorePreview {
            backup_date: metadata.created_at,
            original_size: metadata.original_size,
            format: metadata.format.clone(),
            version: metadata.version.clone(),
            warnings: self.generate_restore_warnings(&metadata),
        };

        Ok(preview)
    }

    /// Execute the actual restore after confirmation
    pub fn execute_restore(&self, source_path: &Path) -> Result<(), BackupError> {
        let (format, _) = self.detect_backup_format(source_path)?;

        // Close any existing connections by renaming current DB temporarily
        let temp_backup = self.db_path.with_extension("db.restore-temp");
        
        // Backup current database first (safety net)
        if self.db_path.exists() {
            fs::rename(&self.db_path, &temp_backup)?;
        }

        // Perform restore based on format
        let result = match format {
            BackupFormat::Sqlite => self.restore_sqlite(source_path),
            BackupFormat::Json => self.restore_json(source_path),
            BackupFormat::Gzip => self.restore_gzip(source_path),
        };

        match result {
            Ok(()) => {
                // Remove temp backup on success
                let _ = fs::remove_file(&temp_backup);
                Ok(())
            }
            Err(e) => {
                // Restore original on failure
                if temp_backup.exists() {
                    let _ = fs::rename(&temp_backup, &self.db_path);
                }
                Err(e)
            }
        }
    }

    /// Restore from SQLite file
    fn restore_sqlite(&self, source_path: &Path) -> Result<(), BackupError> {
        let source_conn = rusqlite::Connection::open(source_path)?;
        let mut target_conn = rusqlite::Connection::open(&self.db_path)?;
        
        {
            let backup = rusqlite::backup::Backup::new(&source_conn, &mut target_conn)?;
            backup.run_to_completion(100, std::time::Duration::from_millis(100), None)?;
        }
        
        Ok(())
    }

    /// Restore from JSON export
    fn restore_json(&self, source_path: &Path) -> Result<(), BackupError> {
        let json = fs::read_to_string(source_path)?;
        let export: DatabaseExport = serde_json::from_str(&json)?;
        
        // Create new database and import data
        let conn = rusqlite::Connection::open(&self.db_path)?;
        export.import_to_connection(&conn)?;
        
        Ok(())
    }

    /// Restore from Gzip compressed file
    fn restore_gzip(&self, source_path: &Path) -> Result<(), BackupError> {
        use flate2::read::GzDecoder;
        
        let input = fs::File::open(source_path)?;
        let mut decoder = GzDecoder::new(input);
        let mut buffer = Vec::new();
        decoder.read_to_end(&mut buffer)?;
        
        // Write to temp file and restore
        let temp_dir = std::env::temp_dir();
        let temp_db = temp_dir.join(format!("likho_restore_{}.db", chrono::Utc::now().timestamp()));
        fs::write(&temp_db, &buffer)?;
        
        let result = self.restore_sqlite(&temp_db);
        let _ = fs::remove_file(&temp_db);
        
        result
    }

    /// Verify backup file integrity
    pub fn verify_backup_integrity(&self, path: &Path) -> Result<bool, BackupError> {
        if !path.exists() {
            return Ok(false);
        }

        // Try to detect format
        let (format, metadata) = match self.detect_backup_format(path) {
            Ok((f, m)) => (f, m),
            Err(_) => return Ok(false),
        };

        // Verify checksum
        let calculated_checksum = Self::calculate_file_checksum(path)?;
        if calculated_checksum != metadata.checksum {
            return Ok(false);
        }

        // Format-specific verification
        let valid = match format {
            BackupFormat::Sqlite => Self::verify_sqlite_file(path),
            BackupFormat::Json => Self::verify_json_file(path),
            BackupFormat::Gzip => Self::verify_gzip_file(path),
        };

        Ok(valid)
    }

    /// Detect backup format from file
    fn detect_backup_format(&self, path: &Path) -> Result<(BackupFormat, BackupMetadata), BackupError> {
        // Try to load metadata file
        let meta_path = path.with_extension("meta.json");
        if meta_path.exists() {
            let meta_json = fs::read_to_string(&meta_path)?;
            let metadata: BackupMetadata = serde_json::from_str(&meta_json)?;
            
            let format = match metadata.format.as_str() {
                "json" => BackupFormat::Json,
                "gzip" => BackupFormat::Gzip,
                _ => BackupFormat::Sqlite,
            };
            
            return Ok((format, metadata));
        }

        // Auto-detect from content
        let mut file = fs::File::open(path)?;
        let mut header = [0u8; 16];
        file.read_exact(&mut header)?;

        // Check for SQLite magic number
        if &header[0..6] == b"SQLite" {
            return Ok((BackupFormat::Sqlite, self.create_default_metadata(path)?));
        }

        // Check for Gzip magic number
        if header[0] == 0x1f && header[1] == 0x8b {
            return Ok((BackupFormat::Gzip, self.create_default_metadata(path)?));
        }

        // Try to parse as JSON
        let content = fs::read_to_string(path)?;
        if serde_json::from_str::<serde_json::Value>(&content).is_ok() {
            return Ok((BackupFormat::Json, self.create_default_metadata(path)?));
        }

        Err(BackupError::InvalidBackup("Unknown file format".to_string()))
    }

    /// Create default metadata for backups without metadata files
    fn create_default_metadata(&self, path: &Path) -> Result<BackupMetadata, BackupError> {
        let metadata = fs::metadata(path)?;
        let checksum = Self::calculate_file_checksum(path)?;
        
        Ok(BackupMetadata {
            version: "unknown".to_string(),
            created_at: DateTime::from_timestamp(
                metadata.modified()?
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap_or_default()
                    .as_secs() as i64,
                0
            ).unwrap_or_else(|| Utc::now()),
            original_size: metadata.len(),
            compressed_size: metadata.len(),
            format: "unknown".to_string(),
            checksum,
            include_embeddings: true,
            app_version: "unknown".to_string(),
        })
    }

    /// Calculate SHA256 checksum of file
    fn calculate_file_checksum(path: &Path) -> Result<String, BackupError> {
        use sha2::{Sha256, Digest};
        
        let mut file = fs::File::open(path)?;
        let mut hasher = Sha256::new();
        let mut buffer = [0u8; 8192];
        
        loop {
            let bytes_read = file.read(&mut buffer)?;
            if bytes_read == 0 {
                break;
            }
            hasher.update(&buffer[..bytes_read]);
        }
        
        Ok(format!("{:x}", hasher.finalize()))
    }

    /// Calculate SHA256 checksum of string
    fn calculate_checksum(data: &str) -> String {
        use sha2::{Sha256, Digest};
        let mut hasher = Sha256::new();
        hasher.update(data.as_bytes());
        format!("{:x}", hasher.finalize())
    }

    /// Verify SQLite file format
    fn verify_sqlite_file(path: &Path) -> bool {
        match fs::read(path) {
            Ok(data) if data.len() >= 16 => &data[0..6] == b"SQLite",
            _ => false,
        }
    }

    /// Verify JSON file format
    fn verify_json_file(path: &Path) -> bool {
        match fs::read_to_string(path) {
            Ok(content) => serde_json::from_str::<DatabaseExport>(&content).is_ok(),
            _ => false,
        }
    }

    /// Verify Gzip file format
    fn verify_gzip_file(path: &Path) -> bool {
        use flate2::read::GzDecoder;
        
        match fs::File::open(path) {
            Ok(file) => {
                let mut decoder = GzDecoder::new(file);
                let mut buffer = Vec::new();
                decoder.read_to_end(&mut buffer).is_ok() && buffer.len() > 16
            }
            _ => false,
        }
    }

    /// Generate warnings for restore operation
    fn generate_restore_warnings(&self, metadata: &BackupMetadata) -> Vec<String> {
        let mut warnings = Vec::new();
        
        let current_version = env!("CARGO_PKG_VERSION");
        if metadata.version != current_version && metadata.version != "unknown" {
            warnings.push(format!(
                "Backup was created with a different app version ({} vs {})",
                metadata.version, current_version
            ));
        }

        if !metadata.include_embeddings {
            warnings.push("Backup does not include vector embeddings. Search functionality may be limited until re-indexing.".to_string());
        }

        warnings
    }

    /// List all backups in a directory
    pub fn list_backups(&self, backup_dir: &Path) -> Result<Vec<BackupInfo>, BackupError> {
        let mut backups = Vec::new();

        if !backup_dir.exists() {
            return Ok(backups);
        }

        for entry in fs::read_dir(backup_dir)? {
            let entry = entry?;
            let path = entry.path();
            
            // Look for metadata files
            if path.extension().and_then(|s| s.to_str()) == Some("json") 
                && path.file_stem().and_then(|s| s.to_str()).map(|s| s.ends_with(".meta")).unwrap_or(false) {
                continue;
            }

            // Try to get metadata
            let meta_path = path.with_extension("meta.json");
            let metadata = if meta_path.exists() {
                match fs::read_to_string(&meta_path) {
                    Ok(json) => serde_json::from_str(&json).ok(),
                    _ => None,
                }
            } else {
                None
            };

            let file_meta = entry.metadata()?;
            let filename = path.file_name()
                .and_then(|s| s.to_str())
                .unwrap_or("unknown")
                .to_string();

            backups.push(BackupInfo {
                path: path.to_string_lossy().to_string(),
                filename,
                size: file_meta.len(),
                created_at: metadata.as_ref().map(|m: &BackupMetadata| m.created_at)
                    .unwrap_or_else(|| {
                        file_meta.modified()
                            .ok()
                            .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                            .map(|d| DateTime::from_timestamp(d.as_secs() as i64, 0).unwrap_or_else(|| Utc::now()))
                            .unwrap_or_else(|| Utc::now())
                    }),
                metadata,
            });
        }

        // Sort by creation date, newest first
        backups.sort_by(|a, b| b.created_at.cmp(&a.created_at));

        Ok(backups)
    }

    /// Delete a backup file and its metadata
    pub fn delete_backup(&self, path: &Path) -> Result<(), BackupError> {
        if !path.exists() {
            return Err(BackupError::BackupNotFound(path.to_path_buf()));
        }

        fs::remove_file(path)?;

        // Also remove metadata if exists
        let meta_path = path.with_extension("meta.json");
        if meta_path.exists() {
            let _ = fs::remove_file(&meta_path);
        }

        Ok(())
    }
}

/// Database export structure for JSON format
#[derive(Debug, Clone, Serialize, Deserialize)]
struct DatabaseExport {
    version: String,
    exported_at: DateTime<Utc>,
    folders: Vec<FolderExport>,
    notes: Vec<NoteExport>,
    chunks: Vec<ChunkExport>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct FolderExport {
    id: String,
    name: String,
    parent_id: Option<String>,
    created_at: String,
    updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct NoteExport {
    id: String,
    title: String,
    content: String,
    folder_id: String,
    created_at: String,
    updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct ChunkExport {
    id: String,
    note_id: String,
    folder_path: String,
    text: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    embedding: Option<Vec<f32>>,
    chunk_index: i32,
    created_at: String,
}

impl DatabaseExport {
    /// Export all data from a connection
    fn export_from_connection(
        conn: &rusqlite::Connection,
        include_embeddings: bool,
    ) -> Result<Self, BackupError> {
        let mut folders = Vec::new();
        let mut notes = Vec::new();
        let mut chunks = Vec::new();

        // Export folders
        let mut stmt = conn.prepare("SELECT id, name, parent_id, created_at, updated_at FROM folders")?;
        let folder_rows = stmt.query_map([], |row| {
            Ok(FolderExport {
                id: row.get(0)?,
                name: row.get(1)?,
                parent_id: row.get(2)?,
                created_at: row.get(3)?,
                updated_at: row.get(4)?,
            })
        })?;
        for folder in folder_rows {
            folders.push(folder?);
        }

        // Export notes
        let mut stmt = conn.prepare("SELECT id, title, content, folder_id, created_at, updated_at FROM notes")?;
        let note_rows = stmt.query_map([], |row| {
            Ok(NoteExport {
                id: row.get(0)?,
                title: row.get(1)?,
                content: row.get(2)?,
                folder_id: row.get(3)?,
                created_at: row.get(4)?,
                updated_at: row.get(5)?,
            })
        })?;
        for note in note_rows {
            notes.push(note?);
        }

        // Export chunks
        let mut stmt = conn.prepare("SELECT id, note_id, folder_path, text, embedding, chunk_index, created_at FROM chunks")?;
        let chunk_rows = stmt.query_map([], |row| {
            let embedding_blob: Option<Vec<u8>> = row.get(4)?;
            let embedding = if include_embeddings {
                embedding_blob.map(|blob| {
                    blob.chunks_exact(4)
                        .map(|c| f32::from_le_bytes([c[0], c[1], c[2], c[3]]))
                        .collect()
                })
            } else {
                None
            };

            Ok(ChunkExport {
                id: row.get(0)?,
                note_id: row.get(1)?,
                folder_path: row.get(2)?,
                text: row.get(3)?,
                embedding,
                chunk_index: row.get(5)?,
                created_at: row.get(6)?,
            })
        })?;
        for chunk in chunk_rows {
            chunks.push(chunk?);
        }

        Ok(DatabaseExport {
            version: env!("CARGO_PKG_VERSION").to_string(),
            exported_at: Utc::now(),
            folders,
            notes,
            chunks,
        })
    }

    /// Import data to a connection
    fn import_to_connection(&self, conn: &rusqlite::Connection) -> Result<(), BackupError> {
        // Create schema
        conn.execute_batch(include_str!("db_schema.sql"))?;

        // Import folders
        for folder in &self.folders {
            conn.execute(
                "INSERT INTO folders (id, name, parent_id, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5)",
                rusqlite::params![folder.id, folder.name, folder.parent_id, folder.created_at, folder.updated_at],
            )?;
        }

        // Import notes
        for note in &self.notes {
            conn.execute(
                "INSERT INTO notes (id, title, content, folder_id, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
                rusqlite::params![note.id, note.title, note.content, note.folder_id, note.created_at, note.updated_at],
            )?;
        }

        // Import chunks
        for chunk in &self.chunks {
            let embedding_blob = chunk.embedding.as_ref().map(|emb| {
                emb.iter().flat_map(|f| f.to_le_bytes().to_vec()).collect::<Vec<u8>>()
            });

            conn.execute(
                "INSERT INTO chunks (id, note_id, folder_path, text, embedding, chunk_index, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                rusqlite::params![chunk.id, chunk.note_id, chunk.folder_path, chunk.text, embedding_blob, chunk.chunk_index, chunk.created_at],
            )?;
        }

        Ok(())
    }
}

// Include schema SQL for creating tables during restore
const _: &str = include_str!("db_schema.sql");
