use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Folder {
    pub id: String,
    pub name: String,
    pub parent_id: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Note {
    pub id: String,
    pub title: String,
    pub content: String,
    pub folder_id: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Chunk {
    pub id: String,
    pub note_id: String,
    pub folder_path: String,
    pub text: String,
    pub embedding: Option<Vec<f32>>,
    pub chunk_index: i32,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResult {
    pub chunk_id: String,
    pub note_id: String,
    pub note_title: String,
    pub folder_path: String,
    pub text: String,
    pub vector_score: f64,
    pub keyword_score: f64,
    pub hybrid_score: f64,
    pub chunk_index: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RagResponse {
    pub answer: String,
    pub sources: Vec<SearchResult>,
    pub processing_time_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmbeddingStatus {
    pub model_loaded: bool,
    pub model_name: String,
    pub queue_size: usize,
    pub last_error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateFolderRequest {
    pub name: String,
    pub parent_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateNoteRequest {
    pub title: String,
    pub content: String,
    pub folder_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateNoteRequest {
    pub id: String,
    pub title: Option<String>,
    pub content: Option<String>,
    pub folder_id: Option<String>,
}

/// A note semantically related to a source note (embedding-based)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RelatedNote {
    pub note_id: String,
    pub note_title: String,
    pub similarity: f64,
}

/// A cluster of thematically similar notes (for auto-grouping)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TopicGroup {
    pub topic_name: String,
    pub suggested_folder: String,
    pub note_ids: Vec<String>,
    pub note_titles: Vec<String>,
    pub similarity_score: f64,
}

// ─── Backup System Models ───────────────────────────────────────────────────

/// Metadata stored with each backup
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackupMetadata {
    pub version: String,
    pub created_at: DateTime<Utc>,
    pub original_size: u64,
    pub compressed_size: u64,
    pub format: String,
    pub checksum: String,
    pub include_embeddings: bool,
    pub app_version: String,
}

/// Information about a backup file
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackupInfo {
    pub path: String,
    pub filename: String,
    pub size: u64,
    pub created_at: DateTime<Utc>,
    pub metadata: Option<BackupMetadata>,
}

/// Preview of restore operation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RestorePreview {
    pub backup_date: DateTime<Utc>,
    pub original_size: u64,
    pub format: String,
    pub version: String,
    pub warnings: Vec<String>,
}

/// Request to export database
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExportBackupRequest {
    pub target_path: String,
    pub format: String,
    pub include_embeddings: bool,
}

/// Request to import database
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImportBackupRequest {
    pub source_path: String,
}

/// Auto-backup settings
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AutoBackupSettings {
    pub enabled: bool,
    pub frequency: String, // "daily", "weekly", "monthly"
    pub backup_dir: String,
    pub max_backups: i32,
    pub include_embeddings: bool,
    pub format: String,
}

/// Auto-backup status
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AutoBackupStatus {
    pub enabled: bool,
    pub last_backup: Option<DateTime<Utc>>,
    pub next_backup: Option<DateTime<Utc>>,
    pub backups_count: i32,
    pub total_size: u64,
}
