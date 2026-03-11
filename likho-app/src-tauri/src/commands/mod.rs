// Tauri commands module
//
// This module exports all command handlers for the Tauri application.

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

// Submodules
pub mod updater;
pub mod backup;

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

/// Download a GGUF model from HuggingFace and load it.
/// Uses the hf-hub cache — subsequent calls for the same file are instant.
#[tauri::command]
pub async fn download_ai_model(
    state: State<'_, AppState>,
    config: Option<LlmConfig>,
) -> Result<ModelInfo, String> {
    let mut engine = state.llm_engine.write().await;
    engine
        .download_and_load(config)
        .await
        .map_err(|e| e.to_string())?;
    engine
        .model_info()
        .cloned()
        .ok_or_else(|| "Model loaded but no info available".to_string())
}

/// Load an LLM model from a local file path (kept for backward compat).
#[tauri::command]
pub async fn load_llm_model(
    state: State<'_, AppState>,
    config: LlmConfig,
) -> Result<ModelInfo, String> {
    // Try to download/load from HuggingFace using the provided config
    let mut engine = state.llm_engine.write().await;
    engine
        .download_and_load(Some(config))
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


// ─── AI Commands ────────────────────────────────────────────────────────────

/// AI: Find semantically related notes via embedding similarity
#[tauri::command]
pub async fn ai_find_related_notes(
    state: State<'_, AppState>,
    note_id: String,
    limit: Option<usize>,
) -> Result<Vec<crate::models::RelatedNote>, String> {
    let limit = limit.unwrap_or(5);
    let source_chunks = state.db.get_note_chunks(&note_id).map_err(|e| e.to_string())?;
    if source_chunks.is_empty() { return Ok(vec![]); }

    let embeddings: Vec<Vec<f32>> = source_chunks.iter().filter_map(|c| c.embedding.clone()).collect();
    if embeddings.is_empty() { return Ok(vec![]); }

    let dim = embeddings[0].len();
    let mut avg = vec![0.0f32; dim];
    for emb in &embeddings { for (i, v) in emb.iter().enumerate() { avg[i] += v; } }
    let n = embeddings.len() as f32;
    for v in &mut avg { *v /= n; }

    let similar = state.db.search_vector(&avg, "/", (limit * 10) as i64).map_err(|e| e.to_string())?;
    let chunk_ids: Vec<String> = similar.iter().map(|(id, _)| id.clone()).collect();
    let chunks = state.db.get_chunks_by_ids(&chunk_ids).map_err(|e| e.to_string())?;

    let mut note_scores: std::collections::HashMap<String, f64> = std::collections::HashMap::new();
    for (chunk_id, score) in &similar {
        if let Some(chunk) = chunks.iter().find(|c| &c.id == chunk_id) {
            if chunk.note_id != note_id {
                let entry = note_scores.entry(chunk.note_id.clone()).or_insert(0.0);
                *entry = entry.max(*score);
            }
        }
    }

    let mut sorted: Vec<(String, f64)> = note_scores.into_iter().collect();
    sorted.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap());
    sorted.truncate(limit);

    let mut results = vec![];
    for (related_id, similarity) in sorted {
        if let Ok(Some(title)) = state.db.get_note_title(&related_id) {
            results.push(crate::models::RelatedNote { note_id: related_id, note_title: title, similarity });
        }
    }
    Ok(results)
}

/// AI: Suggest a title from note content (extractive — no LLM)
#[tauri::command]
pub fn ai_suggest_title(state: State<AppState>, note_id: String) -> Result<String, String> {
    let note = state.db.get_note(&note_id).map_err(|e| e.to_string())?.ok_or("Note not found")?;
    let text = extract_text_from_blocknote(&note.content);
    if text.trim().is_empty() { return Ok("Untitled".to_string()); }
    let first = text
        .split(|c| c == '.' || c == '!' || c == '?' || c == '\n')
        .find(|s| s.split_whitespace().count() >= 2)
        .unwrap_or("").trim();
    let title = if first.len() > 60 { format!("{}…", &first[..57]) } else { first.to_string() };
    Ok(if title.is_empty() { "Untitled".to_string() } else { title })
}

/// AI: Extractive summary (no LLM)
#[tauri::command]
pub fn ai_summarize_note(state: State<AppState>, note_id: String) -> Result<String, String> {
    let note = state.db.get_note(&note_id).map_err(|e| e.to_string())?.ok_or("Note not found")?;
    let text = extract_text_from_blocknote(&note.content);
    if text.trim().is_empty() { return Ok("This note is empty.".to_string()); }
    Ok(extractive_summary(&text, 3))
}

/// AI: Group all indexed notes by topic using embedding clustering
#[tauri::command]
pub async fn ai_group_notes_by_topic(
    state: State<'_, AppState>,
) -> Result<Vec<crate::models::TopicGroup>, String> {
    let all_chunks = state.db.get_all_chunks_with_embeddings().map_err(|e| e.to_string())?;
    if all_chunks.is_empty() { return Ok(vec![]); }

    let mut acc: std::collections::HashMap<String, (Vec<f32>, usize)> = std::collections::HashMap::new();
    for (_, note_id, embedding) in &all_chunks {
        let entry = acc.entry(note_id.clone()).or_insert_with(|| (vec![0.0f32; embedding.len()], 0));
        for (i, v) in embedding.iter().enumerate() { entry.0[i] += v; }
        entry.1 += 1;
    }
    let note_embeddings: Vec<(String, Vec<f32>)> = acc.into_iter().map(|(id, (mut emb, n))| {
        for v in &mut emb { *v /= n as f32; }
        (id, emb)
    }).collect();

    let mut titles: std::collections::HashMap<String, String> = std::collections::HashMap::new();
    for (id, _) in &note_embeddings {
        if let Ok(Some(t)) = state.db.get_note_title(id) { titles.insert(id.clone(), t); }
    }

    const THRESHOLD: f32 = 0.65;
    let mut clusters: Vec<Vec<usize>> = vec![];
    let mut assigned = vec![false; note_embeddings.len()];

    for i in 0..note_embeddings.len() {
        if assigned[i] { continue; }
        let mut cluster = vec![i];
        assigned[i] = true;
        for j in (i + 1)..note_embeddings.len() {
            if assigned[j] { continue; }
            if cosine_sim_f32(&note_embeddings[i].1, &note_embeddings[j].1) >= THRESHOLD {
                cluster.push(j);
                assigned[j] = true;
            }
        }
        if cluster.len() > 1 { clusters.push(cluster); }
    }

    let groups = clusters.into_iter().map(|cluster| {
        let note_ids: Vec<String> = cluster.iter().map(|&i| note_embeddings[i].0.clone()).collect();
        let note_titles_list: Vec<String> = note_ids.iter()
            .map(|id| titles.get(id).cloned().unwrap_or_else(|| "Untitled".to_string())).collect();
        let topic = topic_name_from_titles(&note_titles_list);
        crate::models::TopicGroup {
            suggested_folder: topic.clone(), topic_name: topic,
            note_ids, note_titles: note_titles_list, similarity_score: THRESHOLD as f64,
        }
    }).collect();

    Ok(groups)
}

/// AI: Complete text using LLM (requires a loaded model)
#[tauri::command]
pub async fn ai_complete_text(
    state: State<'_, AppState>,
    cursor_text: String,
) -> Result<String, String> {
    let mut llm = state.llm_engine.write().await;
    if !llm.is_model_loaded() {
        return Err(crate::llm::LlmError::ModelNotLoaded.to_string());
    }
    let prompt = format!("Continue the following text naturally. Output only the continuation:\n\n{}", cursor_text);
    llm.generate(&prompt).await.map_err(|e| e.to_string())
}

/// AI: Improve/reformat text using LLM (requires a loaded model)
#[tauri::command]
pub async fn ai_improve_text(
    state: State<'_, AppState>,
    text: String,
) -> Result<String, String> {
    let mut llm = state.llm_engine.write().await;
    if !llm.is_model_loaded() {
        return Err(crate::llm::LlmError::ModelNotLoaded.to_string());
    }
    let prompt = format!("Improve the following text for clarity and readability. Keep the original meaning:\n\n{}", text);
    llm.generate(&prompt).await.map_err(|e| e.to_string())
}

// ─── AI helpers ─────────────────────────────────────────────────────────────

fn extractive_summary(text: &str, num_sentences: usize) -> String {
    let sentences: Vec<&str> = text
        .split(|c| c == '.' || c == '!' || c == '?')
        .map(str::trim)
        .filter(|s| s.split_whitespace().count() >= 5)
        .collect();
    if sentences.len() <= num_sentences { return sentences.join(". "); }

    let mut freq: std::collections::HashMap<String, usize> = std::collections::HashMap::new();
    for word in text.split_whitespace() {
        let w = word.to_lowercase().trim_matches(|c: char| !c.is_alphabetic()).to_string();
        if w.len() > 3 { *freq.entry(w).or_insert(0) += 1; }
    }

    let mut scored: Vec<(usize, f64, &str)> = sentences.iter().enumerate().map(|(i, s)| {
        let score = s.split_whitespace().map(|w| {
            let w = w.to_lowercase().trim_matches(|c: char| !c.is_alphabetic()).to_string();
            *freq.get(&w).unwrap_or(&0) as f64
        }).sum::<f64>() / (s.split_whitespace().count() as f64).max(1.0);
        (i, score, *s)
    }).collect();

    scored.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap());
    scored.truncate(num_sentences);
    scored.sort_by_key(|s| s.0);
    scored.iter().map(|(_, _, s)| *s).collect::<Vec<_>>().join(". ")
}

fn topic_name_from_titles(titles: &[String]) -> String {
    let stop: std::collections::HashSet<&str> = [
        "the","a","an","and","or","but","in","on","at","to","for","of","with","by","is","are","was","were",
    ].iter().cloned().collect();
    let mut freq: std::collections::HashMap<String, usize> = std::collections::HashMap::new();
    for title in titles {
        for word in title.split_whitespace() {
            let w = word.to_lowercase().trim_matches(|c: char| !c.is_alphabetic()).to_string();
            if w.len() > 2 && !stop.contains(w.as_str()) { *freq.entry(w).or_insert(0) += 1; }
        }
    }
    let mut words: Vec<(String, usize)> = freq.into_iter().collect();
    words.sort_by(|a, b| b.1.cmp(&a.1));
    let top: Vec<String> = words.iter().take(2).map(|(w, _)| {
        let mut c = w.chars();
        c.next().map(|f| f.to_uppercase().collect::<String>() + c.as_str()).unwrap_or_default()
    }).collect();
    if top.is_empty() { "Mixed Notes".to_string() } else { top.join(" ") }
}

fn cosine_sim_f32(a: &[f32], b: &[f32]) -> f32 {
    if a.len() != b.len() || a.is_empty() { return 0.0; }
    let dot: f32 = a.iter().zip(b.iter()).map(|(x, y)| x * y).sum();
    let na: f32 = a.iter().map(|x| x * x).sum::<f32>().sqrt();
    let nb: f32 = b.iter().map(|x| x * x).sum::<f32>().sqrt();
    if na > 0.0 && nb > 0.0 { dot / (na * nb) } else { 0.0 }
}

// ─── Text extraction ─────────────────────────────────────────────────────────

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
