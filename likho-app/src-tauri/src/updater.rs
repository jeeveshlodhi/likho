use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};
use tauri_plugin_updater::UpdaterExt;
use std::sync::Arc;
use tokio::sync::Mutex;

/// Update information sent to the frontend
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateInfo {
    pub version: String,
    pub current_version: String,
    pub notes: Option<String>,
    pub pub_date: Option<String>,
    pub mandatory: bool,
}

/// Update check result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum UpdateCheckResult {
    Available(UpdateInfo),
    NotAvailable,
    Error(String),
}

/// Updater configuration
#[derive(Debug, Clone)]
pub struct UpdaterConfig {
    pub endpoint: String,
    pub check_on_startup: bool,
    pub startup_delay_secs: u64,
    pub auto_install: bool,
}

impl Default for UpdaterConfig {
    fn default() -> Self {
        Self {
            endpoint: "https://releases.likho.app/updates.json".to_string(),
            check_on_startup: true,
            startup_delay_secs: 60,
            auto_install: false,
        }
    }
}

/// Updater state to track update progress
#[derive(Debug, Default)]
pub struct UpdaterState {
    pub checking: bool,
    pub downloading: bool,
    pub download_progress: f32,
    pub update_available: Option<UpdateInfo>,
    pub last_check: Option<String>,
}

/// Global updater state
pub type UpdaterStateHandle = Arc<Mutex<UpdaterState>>;

/// Initialize the updater state
pub fn init_updater_state() -> UpdaterStateHandle {
    Arc::new(Mutex::new(UpdaterState::default()))
}

/// Initialize the updater module
pub fn init(app: &AppHandle, config: UpdaterConfig) -> Result<(), String> {
    if config.check_on_startup {
        let app_handle = app.clone();
        let delay = config.startup_delay_secs;
        
        tauri::async_runtime::spawn(async move {
            // Wait for startup delay
            tokio::time::sleep(tokio::time::Duration::from_secs(delay)).await;
            
            match check_for_updates(app_handle.clone()).await {
                Ok(UpdateCheckResult::Available(info)) => {
                    if !should_skip_version(&app_handle, &info.version) {
                        let _ = app_handle.emit("update-available", info);
                    }
                }
                _ => {}
            }
        });
    }
    
    Ok(())
}

/// Check for available updates
pub async fn check_for_updates(app: AppHandle) -> Result<UpdateCheckResult, String> {
    let updater = app.updater().map_err(|e| e.to_string())?;
    
    // Get current version
    let current_version = app.package_info().version.to_string();
    
    match updater.check().await {
        Ok(Some(update)) => {
            let update_info = UpdateInfo {
                version: update.version.to_string(),
                current_version,
                notes: update.body.clone(),
                pub_date: update.date.map(|d| d.to_string()),
                mandatory: false, // Set based on your business logic
            };
            
            Ok(UpdateCheckResult::Available(update_info))
        }
        Ok(None) => Ok(UpdateCheckResult::NotAvailable),
        Err(e) => Ok(UpdateCheckResult::Error(e.to_string())),
    }
}

/// Download and install update
pub async fn download_and_install(app: AppHandle) -> Result<(), String> {
    let updater = app.updater().map_err(|e| e.to_string())?;
    
    let update = updater
        .check()
        .await
        .map_err(|e| e.to_string())?
        .ok_or("No update available")?;
    
    // Download with progress callback
    update
        .download_and_install(
            |chunk_length, content_length| {
                let downloaded = chunk_length as f64;
                let total = content_length.map(|c| c as f64).unwrap_or(downloaded);
                let progress = if total > 0.0 {
                    (downloaded / total * 100.0) as f32
                } else {
                    0.0
                };
                
                // Emit progress event to frontend
                let _ = app.emit("update-download-progress", progress);
            },
            || {
                // Download finished
                let _ = app.emit("update-download-finished", ());
            },
        )
        .await
        .map_err(|e| e.to_string())?;
    
    Ok(())
}

/// Get the update endpoint URL based on environment
pub fn get_update_endpoint() -> String {
    // This can be configured via environment variables
    std::env::var("LIKHO_UPDATE_ENDPOINT")
        .unwrap_or_else(|_| "https://releases.likho.app/updates.json".to_string())
}

/// Check if auto-check is enabled
pub fn is_auto_check_enabled(_app: &AppHandle) -> bool {
    // You can store this preference in app storage
    // For now, default to true
    true
}

/// Check if a version should be skipped
pub fn should_skip_version(_app: &AppHandle, version: &str) -> bool {
    // Check app storage for skipped versions using local storage
    // For now, use a simple in-memory check or local file
    // This would need tauri-plugin-store which requires additional setup
    
    // For now, just return false (no versions skipped)
    // In production, you'd read from a settings file or plugin store
    let _ = version;
    false
}

/// Mark a version as skipped
pub fn skip_version(_app: &AppHandle, version: String) -> Result<(), String> {
    // Store skipped version in local storage
    // For now, just log it
    // In production, you'd use tauri-plugin-store
    println!("Skipping version: {}", version);
    Ok(())
}

/// Schedule periodic update checks
pub fn schedule_update_checks(app: AppHandle) {
    tauri::async_runtime::spawn(async move {
        // Wait 30 seconds after startup before first check
        tokio::time::sleep(tokio::time::Duration::from_secs(30)).await;
        
        loop {
            if is_auto_check_enabled(&app) {
                match check_for_updates(app.clone()).await {
                    Ok(UpdateCheckResult::Available(info)) => {
                        if !should_skip_version(&app, &info.version) {
                            let _ = app.emit("update-available", info);
                        }
                    }
                    _ => {}
                }
            }
            
            // Check every 4 hours
            tokio::time::sleep(tokio::time::Duration::from_secs(4 * 60 * 60)).await;
        }
    });
}

/// Get the update info JSON format for the updater endpoint
/// This generates the update JSON that Tauri's updater expects
pub fn generate_update_json(
    version: &str,
    notes: &str,
    pub_date: &str,
    platforms: &[(String, String, String)], // (platform, signature, url)
) -> serde_json::Value {
    let mut platforms_map = serde_json::Map::new();
    
    for (platform, signature, url) in platforms {
        platforms_map.insert(platform.clone(), serde_json::json!({
            "signature": signature,
            "url": url
        }));
    }
    
    serde_json::json!({
        "version": version,
        "notes": notes,
        "pub_date": pub_date,
        "platforms": platforms_map
    })
}
