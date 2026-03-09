use tauri::State;
use crate::AppState;
use crate::models::{
    SearchResult, RagResponse, EmbeddingStatus, CreateFolderRequest,
    CreateNoteRequest, UpdateNoteRequest, Chunk
};
use crate::chunking::TextChunker;
use crate::rag::RagPipeline;
use crate::llm::{LlmConfig, ModelInfo};
use uuid::Uuid;

/// Search notes using hybrid retrieval (vector + keyword)
#[tauri::command]
pub async fn search_notes(
    state: State<'_, AppState>,
    query: String,
    folder_path: String,
    limit: Option<i64>,
) -> Result<Vec<SearchResult>, String> {
    tracing::info!("[search_notes] Starting search for: '{}' in folder: '{}'", query, folder_path);
    
    let pipeline = RagPipeline::new(
        state.db.clone(),
        state.embedding_engine.clone(),
        state.llm_engine.clone(),
        state.search_engine.clone(),
    );
    
    let results = pipeline.search_only(
        &query,
        &folder_path,
        limit.unwrap_or(10)
    ).await.map_err(|e| {
        tracing::error!("[search_notes] Error: {}", e);
        e.to_string()
    })?;
    
    tracing::info!("[search_notes] Found {} results", results.len());
    Ok(results)
}

/// Execute RAG query with LLM generation
#[tauri::command]
pub async fn rag_query(
    state: State<'_, AppState>,
    query: String,
    folder_path: String,
    top_k: Option<usize>,
) -> Result<RagResponse, String> {
    let pipeline = RagPipeline::new(
        state.db.clone(),
        state.embedding_engine.clone(),
        state.llm_engine.clone(),
        state.search_engine.clone(),
    );
    
    let response = pipeline.query(
        &query,
        &folder_path,
        top_k.unwrap_or(5)
    ).await.map_err(|e| e.to_string())?;
    
    Ok(response)
}

/// Index a note: chunk it and generate embeddings
#[tauri::command]
pub async fn index_note(
    state: State<'_, AppState>,
    note_id: String,
) -> Result<(), String> {
    tracing::info!("[index_note] Starting indexing for note: {}", note_id);
    
    // Get note content
    let note = state.db.get_note(&note_id)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Note not found".to_string())?;
    
    tracing::info!("[index_note] Found note: '{}' with content length: {}", 
        note.title, 
        note.content.len()
    );
    
    // Get folder path
    let folder_path = state.db.get_folder_path(&note.folder_id)
        .map_err(|e| e.to_string())?;
    
    // Delete existing chunks
    state.db.delete_note_chunks(&note_id)
        .map_err(|e| e.to_string())?;
    
    // Extract plain text from BlockNote JSON content
    let plain_text = extract_text_from_blocknote(&note.content);
    tracing::info!("[index_note] Extracted {} chars of plain text", plain_text.len());
    
    if plain_text.trim().is_empty() {
        tracing::warn!("[index_note] Note has no text content to index");
        return Ok(());
    }
    
    // Chunk the note content
    let chunker = TextChunker::default();
    let chunks = chunker.chunk_with_metadata(
        &plain_text,
        &note_id,
        &folder_path
    );
    
    tracing::info!("[index_note] Created {} chunks", chunks.len());
    
    // Convert to Chunk structs
    let chunks: Vec<Chunk> = chunks.into_iter()
        .map(|meta| Chunk {
            id: meta.id,
            note_id: meta.note_id,
            folder_path: meta.folder_path,
            text: meta.text,
            embedding: None,
            chunk_index: meta.chunk_index,
            created_at: chrono::Utc::now(),
        })
        .collect();
    
    // Generate embeddings asynchronously
    let embedding_engine = state.embedding_engine.read().await;
    tracing::info!("[index_note] Generating embeddings...");
    
    let embedded_chunks = embedding_engine.embed_chunks_async(chunks.clone())
        .await
        .map_err(|e| {
            tracing::error!("[index_note] Embedding error: {}", e);
            e.to_string()
        })?;
    
    tracing::info!("[index_note] Generated embeddings for {} chunks", embedded_chunks.len());
    
    // Store chunks with embeddings
    for chunk in &embedded_chunks {
        state.db.insert_chunk(&chunk)
            .map_err(|e| {
                tracing::error!("[index_note] Failed to insert chunk: {}", e);
                e.to_string()
            })?;
    }
    
    tracing::info!("[index_note] Successfully indexed note: {}", note_id);
    Ok(())
}

/// Sync a note from frontend to backend database
#[tauri::command]
pub async fn sync_note(
    state: State<'_, AppState>,
    note: crate::models::Note,
) -> Result<(), String> {
    tracing::info!("[sync_note] Syncing note: {} - {}", note.id, note.title);
    
    // Check if note exists
    let existing = state.db.get_note(&note.id).ok().flatten();
    
    if existing.is_some() {
        // Update existing note
        state.db.update_note(
            &note.id,
            Some(&note.title),
            Some(&note.content),
            Some(&note.folder_id),
        ).map_err(|e| format!("Failed to update note: {}", e))?;
        tracing::info!("[sync_note] Updated existing note: {}", note.id);
    } else {
        // Create new note
        state.db.create_note(
            &note.id,
            &note.title,
            &note.content,
            &note.folder_id,
        ).map_err(|e| format!("Failed to create note: {}", e))?;
        tracing::info!("[sync_note] Created new note: {}", note.id);
    }
    
    Ok(())
}

/// Sync multiple notes from frontend to backend database
#[tauri::command]
pub async fn sync_notes(
    state: State<'_, AppState>,
    notes: Vec<crate::models::Note>,
) -> Result<(), String> {
    tracing::info!("[sync_notes] Syncing {} notes", notes.len());
    
    for note in &notes {
        // Check if note exists
        let existing = state.db.get_note(&note.id).ok().flatten();
        
        if existing.is_some() {
            // Update existing note
            state.db.update_note(
                &note.id,
                Some(&note.title),
                Some(&note.content),
                Some(&note.folder_id),
            ).map_err(|e| format!("Failed to update note {}: {}", note.id, e))?;
        } else {
            // Create new note
            state.db.create_note(
                &note.id,
                &note.title,
                &note.content,
                &note.folder_id,
            ).map_err(|e| format!("Failed to create note {}: {}", note.id, e))?;
        }
    }
    
    tracing::info!("[sync_notes] Successfully synced {} notes", notes.len());
    Ok(())
}

/// Get all notes from backend database
#[tauri::command]
pub fn get_all_notes(
    state: State<AppState>,
) -> Result<Vec<crate::models::Note>, String> {
    tracing::info!("[get_all_notes] Fetching all notes from database");
    
    let notes = state.db.get_all_notes()
        .map_err(|e| format!("Failed to get notes: {}", e))?;
    
    tracing::info!("[get_all_notes] Found {} notes", notes.len());
    Ok(notes)
}

/// Get folder hierarchical path
#[tauri::command]
pub fn get_folder_path(
    state: State<AppState>,
    folder_id: String,
) -> Result<String, String> {
    state.db.get_folder_path(&folder_id)
        .map_err(|e| e.to_string())
}

/// Create a new folder
#[tauri::command]
pub fn create_folder(
    state: State<AppState>,
    request: CreateFolderRequest,
) -> Result<String, String> {
    let id = Uuid::new_v4().to_string();
    state.db.create_folder(
        &id,
        &request.name,
        request.parent_id.as_deref()
    ).map_err(|e| e.to_string())?;
    
    Ok(id)
}

/// Create a new note
#[tauri::command]
pub fn create_note(
    state: State<AppState>,
    request: CreateNoteRequest,
) -> Result<String, String> {
    let id = Uuid::new_v4().to_string();
    state.db.create_note(
        &id,
        &request.title,
        &request.content,
        &request.folder_id
    ).map_err(|e| e.to_string())?;
    
    Ok(id)
}

/// Update a note
#[tauri::command]
pub fn update_note(
    state: State<AppState>,
    request: UpdateNoteRequest,
) -> Result<(), String> {
    state.db.update_note(
        &request.id,
        request.title.as_deref(),
        request.content.as_deref(),
        request.folder_id.as_deref()
    ).map_err(|e| e.to_string())?;
    
    Ok(())
}

/// Get chunks for a note
#[tauri::command]
pub fn get_note_chunks(
    state: State<AppState>,
    note_id: String,
) -> Result<Vec<Chunk>, String> {
    state.db.get_note_chunks(&note_id)
        .map_err(|e| e.to_string())
}

/// Get embedding engine status
#[tauri::command]
pub async fn get_embedding_status(
    state: State<'_, AppState>,
) -> Result<EmbeddingStatus, String> {
    let engine = state.embedding_engine.read().await;

    Ok(EmbeddingStatus {
        model_loaded: engine.is_model_loaded(),
        model_name: engine.model_name().to_string(),
        queue_size: 0, // Would track actual queue in production
        last_error: None,
    })
}

/// Load an LLM model with given configuration
#[tauri::command]
pub async fn load_llm_model(
    state: State<'_, AppState>,
    config: LlmConfig,
) -> Result<ModelInfo, String> {
    let mut engine = state.llm_engine.write().await;

    engine
        .load_model(config)
        .await
        .map_err(|e| e.to_string())?;

    engine
        .model_info()
        .cloned()
        .ok_or_else(|| "Failed to get model info".to_string())
}

/// Get current LLM model info
#[tauri::command]
pub async fn get_llm_model_info(
    state: State<'_, AppState>,
) -> Result<Option<ModelInfo>, String> {
    let engine = state.llm_engine.read().await;
    Ok(engine.model_info().cloned())
}

/// List available LLM models
#[tauri::command]
pub async fn list_llm_models(
    state: State<'_, AppState>,
) -> Result<Vec<ModelInfo>, String> {
    let engine = state.llm_engine.read().await;
    Ok(engine.list_available_models())
}

/// Unload current LLM model
#[tauri::command]
pub async fn unload_llm_model(state: State<'_, AppState>) -> Result<(), String> {
    let mut engine = state.llm_engine.write().await;
    engine.unload_model();
    Ok(())
}

/// Get LLM configuration
#[tauri::command]
pub async fn get_llm_config(state: State<'_, AppState>) -> Result<LlmConfig, String> {
    let engine = state.llm_engine.read().await;
    Ok(engine.config().clone())
}

/// Check if LLM model is loaded
#[tauri::command]
pub async fn is_llm_model_loaded(state: State<'_, AppState>) -> Result<bool, String> {
    let engine = state.llm_engine.read().await;
    Ok(engine.is_model_loaded())
}

/// Extract plain text from BlockNote JSON content
fn extract_text_from_blocknote(content: &str) -> String {
    if content.is_empty() {
        return String::new();
    }

    // Try to parse as JSON
    let json: serde_json::Value = match serde_json::from_str(content) {
        Ok(v) => v,
        Err(_) => {
            // If not valid JSON, treat as plain text
            return content.to_string();
        }
    };

    let mut texts = Vec::new();

    // Handle BlockNote document format: { "type": "doc", "content": [...] }
    if let Some(content_array) = json.get("content").and_then(|c| c.as_array()) {
        for block in content_array {
            extract_text_from_block(block, &mut texts);
        }
    }
    // Handle array of blocks directly
    else if let Some(array) = json.as_array() {
        for block in array {
            extract_text_from_block(block, &mut texts);
        }
    }

    texts.join(" ")
}

fn extract_text_from_block(block: &serde_json::Value, texts: &mut Vec<String>) {
    // Get block type
    let block_type = block.get("type").and_then(|t| t.as_str()).unwrap_or("");

    // Handle different block types
    match block_type {
        "paragraph" | "heading" | "bulletListItem" | "numberedListItem" | "checkListItem" => {
            // Extract text from content array
            if let Some(content) = block.get("content").and_then(|c| c.as_array()) {
                let text: String = content
                    .iter()
                    .filter_map(|c| c.get("text").and_then(|t| t.as_str()))
                    .collect::<Vec<_>>()
                    .join("");
                if !text.is_empty() {
                    texts.push(text);
                }
            }
        }
        _ => {
            // For other block types, try to get text from nested content
            if let Some(content) = block.get("content").and_then(|c| c.as_array()) {
                for item in content {
                    extract_text_from_block(item, texts);
                }
            }
        }
    }

    // Handle nested blocks (for lists, etc.)
    if let Some(children) = block.get("children").and_then(|c| c.as_array()) {
        for child in children {
            extract_text_from_block(child, texts);
        }
    }
}