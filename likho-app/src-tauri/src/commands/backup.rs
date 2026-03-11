//! Backup commands for Tauri
//!
//! These commands provide the interface between the frontend and the backup system.

use tauri::State;
use crate::AppState;
use crate::backup::{BackupFormat, BackupService};
use crate::models::{
    AutoBackupSettings, AutoBackupStatus, BackupInfo, BackupMetadata, 
    ExportBackupRequest, ImportBackupRequest, RestorePreview
};
use std::path::PathBuf;
use std::sync::Mutex;

/// Get the current database path
#[tauri::command]
pub fn get_database_path(state: State<AppState>) -> Result<String, String> {
    Ok(state.db_path.to_string_lossy().to_string())
}

/// Export database to a backup file
#[tauri::command]
pub fn export_database(
    state: State<AppState>,
    request: ExportBackupRequest,
) -> Result<BackupMetadata, String> {
    let service = BackupService::new(state.db_path.clone());
    
    let format = match request.format.as_str() {
        "json" => BackupFormat::Json,
        "gzip" => BackupFormat::Gzip,
        _ => BackupFormat::Sqlite,
    };
    
    let target_path = PathBuf::from(&request.target_path);
    
    service.export_database(&target_path, format, request.include_embeddings)
        .map_err(|e| format!("Export failed: {}", e))
}

/// Import database from a backup file (preview only)
#[tauri::command]
pub fn preview_restore(
    state: State<AppState>,
    request: ImportBackupRequest,
) -> Result<RestorePreview, String> {
    let service = BackupService::new(state.db_path.clone());
    let source_path = PathBuf::from(&request.source_path);
    
    service.import_database(&source_path)
        .map_err(|e| format!("Failed to preview restore: {}", e))
}

/// Execute database restore
#[tauri::command]
pub fn execute_restore(
    state: State<AppState>,
    request: ImportBackupRequest,
) -> Result<(), String> {
    let service = BackupService::new(state.db_path.clone());
    let source_path = PathBuf::from(&request.source_path);
    
    service.execute_restore(&source_path)
        .map_err(|e| format!("Restore failed: {}", e))
}

/// Verify backup file integrity
#[tauri::command]
pub fn verify_backup_integrity(
    state: State<AppState>,
    path: String,
) -> Result<bool, String> {
    let service = BackupService::new(state.db_path.clone());
    let backup_path = PathBuf::from(&path);
    
    service.verify_backup_integrity(&backup_path)
        .map_err(|e| format!("Verification failed: {}", e))
}

/// List all backups in a directory
#[tauri::command]
pub fn list_backups(
    state: State<AppState>,
    backup_dir: String,
) -> Result<Vec<BackupInfo>, String> {
    let service = BackupService::new(state.db_path.clone());
    let dir = PathBuf::from(&backup_dir);
    
    service.list_backups(&dir)
        .map_err(|e| format!("Failed to list backups: {}", e))
}

/// Delete a backup file
#[tauri::command]
pub fn delete_backup(
    state: State<AppState>,
    path: String,
) -> Result<(), String> {
    let service = BackupService::new(state.db_path.clone());
    let backup_path = PathBuf::from(&path);
    
    service.delete_backup(&backup_path)
        .map_err(|e| format!("Failed to delete backup: {}", e))
}

// Auto-backup state management
pub struct AutoBackupState {
    settings: Mutex<AutoBackupSettings>,
}

impl AutoBackupState {
    pub fn new() -> Self {
        Self {
            settings: Mutex::new(AutoBackupSettings {
                enabled: false,
                frequency: "weekly".to_string(),
                backup_dir: String::new(),
                max_backups: 10,
                include_embeddings: true,
                format: "sqlite".to_string(),
            }),
        }
    }
}

/// Get auto-backup settings
#[tauri::command]
pub fn get_auto_backup_settings(
    state: State<AutoBackupState>,
) -> Result<AutoBackupSettings, String> {
    let settings = state.settings.lock().unwrap();
    Ok(settings.clone())
}

/// Update auto-backup settings
#[tauri::command]
pub fn set_auto_backup_settings(
    state: State<AutoBackupState>,
    settings: AutoBackupSettings,
) -> Result<(), String> {
    let mut current = state.settings.lock().unwrap();
    *current = settings;
    Ok(())
}

/// Get auto-backup status
#[tauri::command]
pub fn get_auto_backup_status(
    state: State<AppState>,
    settings_state: State<AutoBackupState>,
) -> Result<AutoBackupStatus, String> {
    let settings = settings_state.settings.lock().unwrap();
    let service = BackupService::new(state.db_path.clone());
    
    let backups = if !settings.backup_dir.is_empty() {
        service.list_backups(&PathBuf::from(&settings.backup_dir))
            .unwrap_or_default()
    } else {
        Vec::new()
    };
    
    let last_backup = backups.first().map(|b| b.created_at);
    let backups_count = backups.len() as i32;
    let total_size = backups.iter().map(|b| b.size).sum();
    
    // Calculate next backup time based on frequency
    let next_backup = last_backup.map(|last| {
        use chrono::Duration;
        match settings.frequency.as_str() {
            "daily" => last + Duration::days(1),
            "weekly" => last + Duration::weeks(1),
            "monthly" => last + Duration::days(30),
            _ => last + Duration::weeks(1),
        }
    });
    
    Ok(AutoBackupStatus {
        enabled: settings.enabled,
        last_backup,
        next_backup,
        backups_count,
        total_size,
    })
}

/// Trigger an auto-backup if needed
#[tauri::command]
pub async fn trigger_auto_backup(
    state: State<'_, AppState>,
    settings_state: State<'_, AutoBackupState>,
) -> Result<Option<BackupMetadata>, String> {
    let settings = settings_state.settings.lock().unwrap().clone();
    
    if !settings.enabled || settings.backup_dir.is_empty() {
        return Ok(None);
    }
    
    let service = BackupService::new(state.db_path.clone());
    
    // Check if backup is needed
    let backups = service.list_backups(&PathBuf::from(&settings.backup_dir))
        .unwrap_or_default();
    
    let should_backup = if let Some(last) = backups.first() {
        use chrono::{Duration, Utc};
        let elapsed = Utc::now() - last.created_at;
        match settings.frequency.as_str() {
            "daily" => elapsed >= Duration::days(1),
            "weekly" => elapsed >= Duration::weeks(1),
            "monthly" => elapsed >= Duration::days(30),
            _ => elapsed >= Duration::weeks(1),
        }
    } else {
        true // No backups yet
    };
    
    if !should_backup {
        return Ok(None);
    }
    
    // Generate backup filename
    let timestamp = chrono::Local::now().format("%Y%m%d_%H%M%S");
    let extension = match settings.format.as_str() {
        "json" => "json",
        "gzip" => "db.gz",
        _ => "db",
    };
    let filename = format!("likho_backup_{}.{}_in_progress", timestamp, extension);
    let target_path = PathBuf::from(&settings.backup_dir).join(&filename);
    
    // Perform backup
    let format = match settings.format.as_str() {
        "json" => BackupFormat::Json,
        "gzip" => BackupFormat::Gzip,
        _ => BackupFormat::Sqlite,
    };
    
    let metadata = service.export_database(&target_path, format, settings.include_embeddings)
        .map_err(|e| format!("Auto-backup failed: {}", e))?;
    
    // Rename to remove "_in_progress" suffix
    let final_filename = format!("likho_backup_{}.{}", timestamp, extension);
    let final_path = PathBuf::from(&settings.backup_dir).join(&final_filename);
    let _ = std::fs::rename(&target_path, &final_path);
    
    // Rename metadata file too
    let meta_in_progress = target_path.with_extension("meta.json");
    let meta_final = final_path.with_extension("meta.json");
    let _ = std::fs::rename(&meta_in_progress, &meta_final);
    
    // Clean up old backups
    if backups.len() >= settings.max_backups as usize {
        for old_backup in &backups[settings.max_backups as usize - 1..] {
            let _ = service.delete_backup(&PathBuf::from(&old_backup.path));
        }
    }
    
    Ok(Some(metadata))
}

/// Clean up old backups based on retention policy
#[tauri::command]
pub fn cleanup_old_backups(
    state: State<AppState>,
    backup_dir: String,
    max_backups: i32,
) -> Result<i32, String> {
    let service = BackupService::new(state.db_path.clone());
    let dir = PathBuf::from(&backup_dir);
    
    let backups = service.list_backups(&dir)
        .map_err(|e| format!("Failed to list backups: {}", e))?;
    
    let mut deleted = 0;
    if backups.len() > max_backups as usize {
        for old_backup in &backups[max_backups as usize..] {
            if service.delete_backup(&PathBuf::from(&old_backup.path)).is_ok() {
                deleted += 1;
            }
        }
    }
    
    Ok(deleted)
}
