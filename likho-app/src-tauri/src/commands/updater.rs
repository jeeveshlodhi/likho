use tauri::{command, AppHandle};
use crate::updater::{check_for_updates, UpdateCheckResult};
use crate::updater::UpdateInfo;
use serde::{Deserialize, Serialize};
use std::sync::atomic::{AtomicBool, Ordering};
use once_cell::sync::Lazy;

static UPDATE_AVAILABLE: Lazy<AtomicBool> = Lazy::new(|| AtomicBool::new(false));
static CURRENT_UPDATE_INFO: std::sync::Mutex<Option<UpdateInfo>> = std::sync::Mutex::new(None);
static DOWNLOAD_PROGRESS: std::sync::Mutex<f32> = std::sync::Mutex::new(0.0);

/// Response for update check command
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateCheckResponse {
    pub available: bool,
    pub info: Option<UpdateInfo>,
    pub error: Option<String>,
}

/// Update status response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateStatus {
    pub checking: bool,
    pub update_available: bool,
    pub downloading: bool,
    pub download_progress: f32,
    pub dismissed: bool,
}

/// Check for updates command - callable from frontend
#[command]
pub async fn check_update(app: AppHandle) -> Result<UpdateCheckResponse, String> {
    match check_for_updates(app).await {
        Ok(UpdateCheckResult::Available(info)) => {
            UPDATE_AVAILABLE.store(true, Ordering::SeqCst);
            if let Ok(mut guard) = CURRENT_UPDATE_INFO.lock() {
                *guard = Some(info.clone());
            }
            Ok(UpdateCheckResponse {
                available: true,
                info: Some(info),
                error: None,
            })
        }
        Ok(UpdateCheckResult::NotAvailable) => {
            UPDATE_AVAILABLE.store(false, Ordering::SeqCst);
            Ok(UpdateCheckResponse {
                available: false,
                info: None,
                error: None,
            })
        }
        Ok(UpdateCheckResult::Error(e)) => Ok(UpdateCheckResponse {
            available: false,
            info: None,
            error: Some(e),
        }),
        Err(e) => Err(e),
    }
}

/// Download and install update command
#[command]
pub async fn install_update(app: AppHandle) -> Result<(), String> {
    // Set downloading state
    if let Ok(mut progress) = DOWNLOAD_PROGRESS.lock() {
        *progress = 0.0;
    }
    
    crate::updater::download_and_install(app).await
}

/// Skip a specific version
#[command]
pub async fn skip_version_cmd(app: AppHandle, version: String) -> Result<(), String> {
    crate::updater::skip_version(&app, version)?;
    // Clear update available flag
    UPDATE_AVAILABLE.store(false, Ordering::SeqCst);
    Ok(())
}

/// Get current update status
#[command]
pub async fn get_update_status() -> Result<UpdateStatus, String> {
    let progress = DOWNLOAD_PROGRESS.lock()
        .map(|p| *p)
        .unwrap_or(0.0);
    
    Ok(UpdateStatus {
        checking: false, // Would track from state in production
        update_available: UPDATE_AVAILABLE.load(Ordering::SeqCst),
        downloading: progress > 0.0 && progress < 100.0,
        download_progress: progress,
        dismissed: false, // Would track from storage in production
    })
}

/// Get download progress
#[command]
pub async fn get_download_progress() -> Result<f32, String> {
    DOWNLOAD_PROGRESS.lock()
        .map(|p| *p)
        .map_err(|_| "Failed to get progress".to_string())
}

/// Get current update info
#[command]
pub async fn get_current_update_info() -> Result<Option<UpdateInfo>, String> {
    CURRENT_UPDATE_INFO.lock()
        .map(|info| info.clone())
        .map_err(|_| "Failed to get update info".to_string())
}

/// Dismiss current update notification
#[command]
pub async fn dismiss_update() -> Result<(), String> {
    // In production, this would store the dismissed state
    UPDATE_AVAILABLE.store(false, Ordering::SeqCst);
    Ok(())
}

/// Get current app version
#[command]
pub fn get_app_version(app: AppHandle) -> String {
    app.package_info().version.to_string()
}

/// Get app name
#[command]
pub fn get_app_name(app: AppHandle) -> String {
    app.package_info().name.to_string()
}

/// Get platform information
#[command]
pub fn get_platform_info() -> serde_json::Value {
    serde_json::json!({
        "os": std::env::consts::OS,
        "arch": std::env::consts::ARCH,
        "family": std::env::consts::FAMILY,
    })
}
