use serde::{Deserialize, Serialize};
use std::path::PathBuf;

/// Model configuration that can be persisted and changed by user
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct LlmConfig {
    pub model_path: PathBuf,
    pub context_size: usize,
    pub threads: usize,
    pub temperature: f32,
    pub max_tokens: usize,
    pub gpu_layers: i32,  // -1 for all layers on GPU
    pub use_mmap: bool,
    pub use_mlock: bool,
}

impl Default for LlmConfig {
    fn default() -> Self {
        Self {
            model_path: PathBuf::from("models/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf"),
            context_size: 2048,
            threads: 4,
            temperature: 0.7,
            max_tokens: 512,
            gpu_layers: -1,  // Use all layers on GPU if available
            use_mmap: true,
            use_mlock: false,
        }
    }
}

/// Model information for UI display
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ModelInfo {
    pub name: String,
    pub path: PathBuf,
    pub size_mb: u64,
    pub parameters: String,
    pub context_length: usize,
    pub is_bundled: bool,
    pub description: String,
}

/// LLM Engine that manages model loading and inference
/// Note: This is a stub implementation. For production use, you would
/// integrate with llama-cpp-rs or similar.
pub struct LlmEngine {
    config: LlmConfig,
    model_info: Option<ModelInfo>,
    model_loaded: bool,
}

#[derive(Debug)]
pub enum LlmError {
    ModelNotLoaded,
    ModelNotFound(PathBuf),
    LoadError(String),
    InferenceError(String),
    BackendError(String),
}

impl std::fmt::Display for LlmError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            LlmError::ModelNotLoaded => write!(f, "LLM model not loaded"),
            LlmError::ModelNotFound(path) => write!(f, "Model file not found: {:?}", path),
            LlmError::LoadError(e) => write!(f, "Failed to load model: {}", e),
            LlmError::InferenceError(e) => write!(f, "Inference error: {}", e),
            LlmError::BackendError(e) => write!(f, "Backend error: {}", e),
        }
    }
}

impl std::error::Error for LlmError {}

impl LlmEngine {
    /// Create a new LLM engine
    pub fn new() -> Result<Self, LlmError> {
        Ok(Self {
            config: LlmConfig::default(),
            model_info: None,
            model_loaded: false,
        })
    }
    
    /// Load a GGUF model from disk
    pub async fn load_model(
        &mut self,
        config: LlmConfig,
    ) -> Result<(), LlmError> {
        if !config.model_path.exists() {
            return Err(LlmError::ModelNotFound(config.model_path.clone()));
        }
        
        // TODO: Implement actual model loading with llama-cpp-2
        // For now, we just create model info from the file
        
        let file_size = std::fs::metadata(&config.model_path)
            .map(|m| m.len() / 1024 / 1024)
            .unwrap_or(0);
        
        let model_name = config.model_path.file_stem()
            .map(|s| s.to_string_lossy().to_string())
            .unwrap_or_else(|| "Unknown Model".to_string());
        
        // Try to infer parameters from filename
        let parameters = if model_name.contains("1.1b") || model_name.contains("1.1B") {
            "1.1B".to_string()
        } else if model_name.contains("3b") || model_name.contains("3B") {
            "3B".to_string()
        } else if model_name.contains("7b") || model_name.contains("7B") {
            "7B".to_string()
        } else if model_name.contains("8b") || model_name.contains("8B") {
            "8B".to_string()
        } else if model_name.contains("13b") || model_name.contains("13B") {
            "13B".to_string()
        } else {
            "Unknown".to_string()
        };
        
        self.model_info = Some(ModelInfo {
            name: model_name.clone(),
            path: config.model_path.clone(),
            size_mb: file_size,
            parameters,
            context_length: config.context_size,
            is_bundled: config.model_path.to_string_lossy().contains("models/"),
            description: format!("Local LLM model: {}", model_name),
        });
        
        self.config = config;
        self.model_loaded = true;
        
        tracing::info!("LLM model loaded: {:?}", self.model_info);
        Ok(())
    }
    
    /// Generate text using the loaded model
    pub async fn generate(
        &self,
        prompt: &str,
    ) -> Result<String, LlmError> {
        if !self.model_loaded {
            return Err(LlmError::ModelNotLoaded);
        }
        
        // TODO: Implement actual inference with llama-cpp-2
        // For now, return a placeholder response
        Ok(format!(
            "[LLM Response]\n\nI've analyzed your query based on the provided context. \
            The model '{}' is loaded and ready to use.\n\n\
            Note: This is a placeholder response. To enable actual LLM inference, \
            ensure the GGUF model file exists at the configured path.\n\n\
            Query length: {} characters",
            self.model_info.as_ref().map(|m| m.name.as_str()).unwrap_or("Unknown"),
            prompt.len()
        ))
    }
    
    /// Check if a model is loaded
    pub fn is_model_loaded(&self) -> bool {
        self.model_loaded
    }
    
    /// Get current configuration
    pub fn config(&self) -> &LlmConfig {
        &self.config
    }
    
    /// Get model information
    pub fn model_info(&self) -> Option<&ModelInfo> {
        self.model_info.as_ref()
    }
    
    /// Unload current model
    pub fn unload_model(&mut self) {
        self.model_loaded = false;
        self.model_info = None;
    }
    
    /// Get list of available models in the models directory
    pub fn list_available_models(&self) -> Vec<ModelInfo> {
        let mut models = Vec::new();
        
        // Check bundled models
        if let Ok(entries) = std::fs::read_dir("models") {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.extension().map_or(false, |ext| ext == "gguf") {
                    if let Ok(metadata) = std::fs::metadata(&path) {
                        let size_mb = metadata.len() / 1024 / 1024;
                        let name = path.file_stem()
                            .map(|s| s.to_string_lossy().to_string())
                            .unwrap_or_else(|| "Unknown".to_string());
                        
                        // Try to infer parameters from filename
                        let parameters = if name.contains("1.1b") || name.contains("1.1B") {
                            "1.1B".to_string()
                        } else if name.contains("3b") || name.contains("3B") {
                            "3B".to_string()
                        } else if name.contains("7b") || name.contains("7B") {
                            "7B".to_string()
                        } else if name.contains("8b") || name.contains("8B") {
                            "8B".to_string()
                        } else {
                            "Unknown".to_string()
                        };
                        
                        models.push(ModelInfo {
                            name,
                            path: path.clone(),
                            size_mb,
                            parameters,
                            context_length: 2048,
                            is_bundled: true,
                            description: "Local model file".to_string(),
                        });
                    }
                }
            }
        }
        
        models
    }
}

/// Build RAG prompt from context chunks and user query
pub fn build_rag_prompt(context_chunks: &[crate::models::SearchResult], query: &str) -> String {
    let context = context_chunks.iter()
        .enumerate()
        .map(|(i, chunk)| {
            format!(
                "[{}] From note \"{}\" ({}):\n{}\n",
                i + 1,
                chunk.note_title,
                chunk.folder_path,
                chunk.text
            )
        })
        .collect::<String>();
    
    format!(
        "You are a helpful assistant answering questions based on the user's notes. \
         Use only the provided context to answer the question. \
         If the context doesn't contain the answer, say so clearly. \
         Cite the relevant note numbers in your answer.\n\n\
         Context:\n{}\n\n\
         Question: {}\n\n\
         Answer:",
        context,
        query
    )
}

/// Build a simpler prompt for when no LLM is loaded (returns context only)
pub fn build_context_only_response(context_chunks: &[crate::models::SearchResult]) -> String {
    if context_chunks.is_empty() {
        return "No relevant notes found.".to_string();
    }
    
    let mut response = "Relevant notes found:\n\n".to_string();
    
    for (i, chunk) in context_chunks.iter().enumerate() {
        response.push_str(&format!(
            "{}. \"{}\" ({}):\n{}\n\n",
            i + 1,
            chunk.note_title,
            chunk.folder_path,
            chunk.text.chars().take(200).collect::<String>()
        ));
    }
    
    response
}