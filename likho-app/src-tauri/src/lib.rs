use tauri::Manager;
use std::sync::Arc;
use std::path::PathBuf;
use tokio::sync::RwLock;

pub mod db;
pub mod chunking;
pub mod embeddings;
pub mod search;
pub mod llm;
pub mod rag;
pub mod updater;
pub mod models;
pub mod backup;

// Commands module - needs special handling for Tauri commands
pub mod commands {
    include!("commands/mod.rs");
}

use db::Database;
use embeddings::{EmbeddingEngine, setup_embedding_cache};
use llm::LlmEngine;
use search::SearchEngine;
use updater::UpdaterConfig;

pub struct AppState {
    pub db: Arc<Database>,
    pub db_path: PathBuf,
    pub embedding_engine: Arc<RwLock<EmbeddingEngine>>,
    pub llm_engine: Arc<RwLock<LlmEngine>>,
    pub search_engine: Arc<SearchEngine>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_updater::Builder::default().build())
        .setup(|app| {
            let app_handle = app.handle();
            let app_data_dir = app_handle
                .path()
                .app_data_dir()
                .expect("Failed to get app data dir");
            
            // Create app data directory if it doesn't exist
            std::fs::create_dir_all(&app_data_dir)
                .map_err(|e| format!("Failed to create app data dir: {}", e))?;
            
            let db_path = app_data_dir.join("likho.db");
            
            // Initialize database with full schema
            let db = Arc::new(Database::new(&db_path)?);
            db.init_schema()?;
            
            // Setup embedding cache directory
            setup_embedding_cache(&app_data_dir);
            
            // Initialize embedding engine and load model in background
            let embedding_engine = Arc::new(RwLock::new(EmbeddingEngine::new()?));
            
            // Spawn background task to load embedding model
            let embedding_engine_clone = Arc::clone(&embedding_engine);
            tauri::async_runtime::spawn(async move {
                let mut engine = embedding_engine_clone.write().await;
                match engine.load_model(None).await {
                    Ok(_) => tracing::info!("Embedding model loaded successfully"),
                    Err(e) => tracing::error!("Failed to load embedding model: {}", e),
                }
            });
            
            // Initialize LLM engine with bundled model
            let llm_engine = Arc::new(RwLock::new(
                LlmEngine::new().expect("Failed to initialize LLM backend")
            ));
            
            // Initialize search engine
            let search_engine = Arc::new(SearchEngine::new(db.clone()));
            
            let state = AppState {
                db: db.clone(),
                db_path: db_path.clone(),
                embedding_engine,
                llm_engine,
                search_engine,
            };
            
            app.manage(state);
            
            // Initialize updater module
            let updater_config = UpdaterConfig {
                endpoint: std::env::var("LIKHO_UPDATE_ENDPOINT")
                    .unwrap_or_else(|_| "https://releases.likho.app/updates.json".to_string()),
                check_on_startup: true,
                startup_delay_secs: 60, // Check after 1 minute
                auto_install: false,
            };
            updater::init(&app_handle, updater_config)?;
            
            // Initialize auto-backup state
            app.manage(crate::commands::backup::AutoBackupState::new());
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::search_notes,
            commands::rag_query,
            commands::index_note,
            commands::sync_note,
            commands::sync_notes,
            commands::get_all_notes,
            commands::get_folder_path,
            commands::create_folder,
            commands::create_note,
            commands::update_note,
            commands::get_note_chunks,
            commands::get_embedding_status,
            commands::load_llm_model,
            commands::get_llm_model_info,
            commands::list_llm_models,
            commands::unload_llm_model,
            commands::get_llm_config,
            commands::is_llm_model_loaded,
            commands::ai_find_related_notes,
            commands::ai_suggest_title,
            commands::ai_summarize_note,
            commands::ai_group_notes_by_topic,
            commands::ai_complete_text,
            commands::ai_improve_text,
            commands::download_ai_model,
            crate::commands::updater::check_update,
            crate::commands::updater::install_update,
            crate::commands::updater::skip_version_cmd,
            crate::commands::updater::get_update_status,
            crate::commands::updater::get_download_progress,
            crate::commands::updater::get_current_update_info,
            crate::commands::updater::dismiss_update,
            // Backup commands
            crate::commands::backup::get_database_path,
            crate::commands::backup::export_database,
            crate::commands::backup::preview_restore,
            crate::commands::backup::execute_restore,
            crate::commands::backup::verify_backup_integrity,
            crate::commands::backup::list_backups,
            crate::commands::backup::delete_backup,
            crate::commands::backup::get_auto_backup_settings,
            crate::commands::backup::set_auto_backup_settings,
            crate::commands::backup::get_auto_backup_status,
            crate::commands::backup::trigger_auto_backup,
            crate::commands::backup::cleanup_old_backups,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}