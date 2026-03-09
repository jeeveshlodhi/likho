use crate::models::Chunk;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::Mutex;

/// Embedding engine using fastembed for local semantic embeddings
/// Models are downloaded automatically on first use and cached locally
pub struct EmbeddingEngine {
    model: Option<Arc<Mutex<Box<dyn Fn(Vec<String>) -> Result<Vec<Vec<f32>>, String> + Send>>>>,
    model_name: String,
    embedding_dim: usize,
}

#[derive(Debug, Clone)]
pub enum EmbeddingError {
    ModelNotLoaded,
    LoadError(String),
    InferenceError(String),
    InvalidInput(String),
}

impl std::fmt::Display for EmbeddingError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            EmbeddingError::ModelNotLoaded => write!(f, "Embedding model not loaded"),
            EmbeddingError::LoadError(e) => write!(f, "Failed to load model: {}", e),
            EmbeddingError::InferenceError(e) => write!(f, "Inference error: {}", e),
            EmbeddingError::InvalidInput(e) => write!(f, "Invalid input: {}", e),
        }
    }
}

impl std::error::Error for EmbeddingError {}

impl EmbeddingEngine {
    /// Create new embedding engine (doesn't load model yet)
    pub fn new() -> Result<Self, Box<dyn std::error::Error>> {
        Ok(EmbeddingEngine {
            model: None,
            model_name: "all-MiniLM-L6-v2".to_string(),
            embedding_dim: 384,
        })
    }
    
    /// Load the embedding model using fastembed
    /// Models are downloaded automatically on first use
    pub async fn load_model(
        &mut self,
        _model: Option<String>
    ) -> Result<(), EmbeddingError> {
        // Initialize fastembed model
        let model_result: Result<fastembed::TextEmbedding, String> = tokio::task::spawn_blocking(|| {
            fastembed::TextEmbedding::try_new(
                fastembed::InitOptions::default()
            ).map_err(|e| format!("Failed to load model: {}", e))
        }).await.map_err(|e| EmbeddingError::LoadError(e.to_string()))?;
        
        let embedding_model = model_result.map_err(|e| EmbeddingError::LoadError(e))?;
        
        // Wrap the model in a closure that can be called from async context
        let model_arc: Arc<Mutex<Box<dyn Fn(Vec<String>) -> Result<Vec<Vec<f32>>, String> + Send>>> = 
            Arc::new(Mutex::new(Box::new(move |texts: Vec<String>| {
                embedding_model.embed(texts, None)
                    .map_err(|e| format!("Embedding error: {}", e))
            })));
        
        self.model = Some(model_arc);
        self.model_name = "all-MiniLM-L6-v2".to_string();
        self.embedding_dim = 384;
        
        tracing::info!("Embedding model loaded: {}", self.model_name);
        Ok(())
    }
    
    /// Generate embeddings for chunks asynchronously
    pub async fn embed_chunks_async(
        &self,
        mut chunks: Vec<Chunk>
    ) -> Result<Vec<Chunk>, EmbeddingError> {
        let model = self.model.as_ref()
            .ok_or(EmbeddingError::ModelNotLoaded)?;
        
        let texts: Vec<String> = chunks.iter()
            .map(|c| c.text.clone())
            .collect();
        
        // Generate embeddings
        let model_clone = Arc::clone(model);
        let embeddings: Vec<Vec<f32>> = tokio::task::spawn_blocking(move || {
            let embed_fn = model_clone.blocking_lock();
            embed_fn(texts).map_err(|e| EmbeddingError::InferenceError(e))
        })
        .await
        .map_err(|e| EmbeddingError::InferenceError(e.to_string()))??;
        
        // Assign embeddings to chunks
        for (chunk, embedding) in chunks.iter_mut().zip(embeddings) {
            chunk.embedding = Some(embedding);
        }
        
        Ok(chunks)
    }
    
    /// Generate embedding for a single query
    pub async fn embed_query(
        &self, 
        query: &str
    ) -> Result<Vec<f32>, EmbeddingError> {
        let model = self.model.as_ref()
            .ok_or(EmbeddingError::ModelNotLoaded)?;
        
        let query = query.to_string();
        let model_clone = Arc::clone(model);
        
        let embeddings: Vec<Vec<f32>> = tokio::task::spawn_blocking(move || {
            let embed_fn = model_clone.blocking_lock();
            embed_fn(vec![query]).map_err(|e| EmbeddingError::InferenceError(e))
        })
        .await
        .map_err(|e| EmbeddingError::InferenceError(e.to_string()))??;
        
        embeddings.into_iter()
            .next()
            .ok_or_else(|| EmbeddingError::InferenceError("No embedding generated".to_string()))
    }
    
    /// Get embedding dimension
    pub fn embedding_dim(&self) -> usize {
        self.embedding_dim
    }
    
    /// Check if model is loaded
    pub fn is_model_loaded(&self) -> bool {
        self.model.is_some()
    }
    
    /// Get model name
    pub fn model_name(&self) -> &str {
        &self.model_name
    }
}

/// Initialize embedding model with custom cache directory
pub fn setup_embedding_cache(app_data_dir: &PathBuf) {
    // Set cache directory for fastembed models
    std::env::set_var("HF_HOME", app_data_dir.join("hf_cache").to_string_lossy().to_string());
    std::env::set_var("FASTEMBED_CACHE_PATH", app_data_dir.join("models").to_string_lossy().to_string());
}