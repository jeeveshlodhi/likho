use crate::db::Database;
use crate::embeddings::EmbeddingEngine;
use crate::llm::{LlmEngine, build_rag_prompt, build_context_only_response};
use crate::search::{SearchEngine, SearchParams};
use crate::models::{RagResponse, SearchResult};
use std::sync::Arc;
use tokio::sync::RwLock;
use std::time::Instant;

/// RAG pipeline orchestrator
/// Coordinates search, retrieval, and generation
pub struct RagPipeline {
    db: Arc<Database>,
    embedding_engine: Arc<RwLock<EmbeddingEngine>>,
    llm_engine: Arc<RwLock<LlmEngine>>,
    search_engine: Arc<SearchEngine>,
}

impl RagPipeline {
    pub fn new(
        db: Arc<Database>,
        embedding_engine: Arc<RwLock<EmbeddingEngine>>,
        llm_engine: Arc<RwLock<LlmEngine>>,
        search_engine: Arc<SearchEngine>,
    ) -> Self {
        Self {
            db,
            embedding_engine,
            llm_engine,
            search_engine,
        }
    }
    
    /// Execute full RAG query: search → retrieve → generate
    pub async fn query(
        &self,
        user_query: &str,
        folder_path: &str,
        top_k: usize,
    ) -> Result<RagResponse, RagError> {
        let start_time = Instant::now();
        
        // Step 1: Generate query embedding
        let query_embedding = {
            let engine = self.embedding_engine.read().await;
            engine.embed_query(user_query).await
                .map_err(|e| RagError::EmbeddingError(e.to_string()))?
        };
        
        // Step 2: Hybrid search for relevant chunks
        let search_params = SearchParams {
            query: user_query.to_string(),
            folder_path: folder_path.to_string(),
            limit: top_k as i64,
            vector_weight: 0.7,
            keyword_weight: 0.3,
        };
        
        let search_results = self.search_engine
            .search(&query_embedding, search_params)
            .map_err(|e| RagError::SearchError(e.to_string()))?;
        
        if search_results.is_empty() {
            return Ok(RagResponse {
                answer: "No relevant notes found in your collection.".to_string(),
                sources: vec![],
                processing_time_ms: start_time.elapsed().as_millis() as u64,
            });
        }
        
        // Step 3: Generate response using LLM
        let mut llm = self.llm_engine.write().await;
        let answer = if llm.is_model_loaded() {
            let prompt = build_rag_prompt(&search_results[..top_k.min(search_results.len())],
                user_query
            );

            llm.generate(&prompt)
                .await
                .map_err(|e| RagError::LlmError(e.to_string()))?
        } else {
            // Fallback: return context without LLM generation
            build_context_only_response(&search_results[..top_k.min(search_results.len())]
            )
        };
        
        let processing_time_ms = start_time.elapsed().as_millis() as u64;
        
        Ok(RagResponse {
            answer,
            sources: search_results[..top_k.min(search_results.len())].to_vec(),
            processing_time_ms,
        })
    }
    
    /// Search only (no LLM generation)
    pub async fn search_only(
        &self,
        query: &str,
        folder_path: &str,
        limit: i64,
    ) -> Result<Vec<SearchResult>, RagError> {
        tracing::info!("[search_only] Starting search for: '{}' in '{}'", query, folder_path);
        
        // Check if embedding engine is loaded
        let is_embedding_loaded = {
            let engine = self.embedding_engine.read().await;
            engine.is_model_loaded()
        };
        
        tracing::info!("[search_only] Embedding engine loaded: {}", is_embedding_loaded);
        
        if !is_embedding_loaded {
            tracing::warn!("[search_only] Embedding engine not loaded, using title fallback only");
            return self.search_engine
                .search_notes_fallback(query, folder_path, limit)
                .map_err(|e| RagError::SearchError(e.to_string()));
        }
        
        // Generate query embedding
        let query_embedding = {
            let engine = self.embedding_engine.read().await;
            match engine.embed_query(query).await {
                Ok(emb) => emb,
                Err(e) => {
                    tracing::error!("[search_only] Failed to generate embedding: {}", e);
                    // Fallback to title search
                    return self.search_engine
                        .search_notes_fallback(query, folder_path, limit)
                        .map_err(|e| RagError::SearchError(e.to_string()));
                }
            }
        };
        
        tracing::info!("[search_only] Generated query embedding with {} dimensions", query_embedding.len());
        
        // Search
        let search_params = SearchParams {
            query: query.to_string(),
            folder_path: folder_path.to_string(),
            limit,
            vector_weight: 0.7,
            keyword_weight: 0.3,
        };
        
        let results = self.search_engine
            .search(&query_embedding, search_params)
            .map_err(|e| RagError::SearchError(e.to_string()))?;
        
        tracing::info!("[search_only] Found {} results from chunks", results.len());
        
        // If no results from chunks, fallback to searching note titles
        if results.is_empty() {
            tracing::info!("[search_only] No chunks found, falling back to note title search");
            return self.search_engine
                .search_notes_fallback(query, folder_path, limit)
                .map_err(|e| RagError::SearchError(e.to_string()));
        }
        
        Ok(results)
    }
    
    /// Keyword-only search (fallback when embeddings unavailable)
    pub fn search_keyword(
        &self,
        query: &str,
        folder_path: &str,
        limit: i64,
    ) -> Result<Vec<SearchResult>, RagError> {
        self.search_engine
            .search_keyword_only(query, folder_path, limit)
            .map_err(|e| RagError::SearchError(e.to_string()))
    }
}

#[derive(Debug)]
pub enum RagError {
    EmbeddingError(String),
    SearchError(String),
    LlmError(String),
    DatabaseError(String),
}

impl std::fmt::Display for RagError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            RagError::EmbeddingError(e) => write!(f, "Embedding error: {}", e),
            RagError::SearchError(e) => write!(f, "Search error: {}", e),
            RagError::LlmError(e) => write!(f, "LLM error: {}", e),
            RagError::DatabaseError(e) => write!(f, "Database error: {}", e),
        }
    }
}

impl std::error::Error for RagError {}