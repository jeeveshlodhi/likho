use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use llama_cpp_2::{
    context::params::LlamaContextParams,
    llama_backend::LlamaBackend,
    llama_batch::LlamaBatch,
    model::{params::LlamaModelParams, AddBos, LlamaModel},
    token::LlamaToken,
};

// Default model: TinyLlama-1.1B-Chat (~637 MB, fast on CPU)
const DEFAULT_MODEL_REPO: &str = "bartowski/TinyLlama-1.1B-Chat-v1.0-GGUF";
const DEFAULT_MODEL_FILE: &str = "TinyLlama-1.1B-Chat-v1.0-Q4_K_M.gguf";

/// LLM configuration (serialisable for frontend ↔ backend)
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct LlmConfig {
    pub model_repo: String,
    pub model_file: String,
    pub temperature: f32,
    pub max_tokens: usize,
    /// 0 = CPU only; 99 = all layers on GPU (Metal / CUDA)
    pub n_gpu_layers: u32,
    pub context_size: usize,
}

impl Default for LlmConfig {
    fn default() -> Self {
        Self {
            model_repo: DEFAULT_MODEL_REPO.to_string(),
            model_file: DEFAULT_MODEL_FILE.to_string(),
            temperature: 0.7,
            max_tokens: 512,
            n_gpu_layers: 0,
            context_size: 2048,
        }
    }
}

/// Information about the currently-loaded model (returned to frontend)
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

#[derive(Debug)]
pub enum LlmError {
    ModelNotLoaded,
    DownloadError(String),
    LoadError(String),
    InferenceError(String),
}

impl std::fmt::Display for LlmError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            LlmError::ModelNotLoaded => write!(
                f,
                "No AI model loaded. Click 'Download AI Model' to download TinyLlama (~637 MB)."
            ),
            LlmError::DownloadError(e) => write!(f, "Download failed: {}", e),
            LlmError::LoadError(e) => write!(f, "Failed to load model: {}", e),
            LlmError::InferenceError(e) => write!(f, "Inference error: {}", e),
        }
    }
}

impl std::error::Error for LlmError {}

/// Owns the llama.cpp backend + loaded model
pub struct LlmEngine {
    config: LlmConfig,
    // Kept alive as long as the model is loaded
    _backend: Option<LlamaBackend>,
    model: Option<LlamaModel>,
    model_info: Option<ModelInfo>,
}

// Safety: LlamaModel is internally reference-counted and safe to move across
// threads when accessed through a RwLock (single-writer at a time).
unsafe impl Send for LlmEngine {}
unsafe impl Sync for LlmEngine {}

impl LlmEngine {
    pub fn new() -> Result<Self, LlmError> {
        Ok(Self {
            config: LlmConfig::default(),
            _backend: None,
            model: None,
            model_info: None,
        })
    }

    /// Download a GGUF model from HuggingFace Hub and load it.
    /// Uses the hf-hub cache so repeated calls are instant.
    pub async fn download_and_load(&mut self, config: Option<LlmConfig>) -> Result<(), LlmError> {
        let cfg = config.unwrap_or_else(|| self.config.clone());
        tracing::info!("[LLM] Downloading {}/{} …", cfg.model_repo, cfg.model_file);

        let api = hf_hub::api::tokio::Api::new()
            .map_err(|e| LlmError::DownloadError(e.to_string()))?;

        let repo = api.repo(hf_hub::Repo::new(cfg.model_repo.clone(), hf_hub::RepoType::Model));

        let model_path = repo
            .get(&cfg.model_file)
            .await
            .map_err(|e| LlmError::DownloadError(format!("HuggingFace: {}", e)))?;

        tracing::info!("[LLM] Downloaded to {:?}", model_path);
        self.load_from_path(model_path, cfg)
    }

    /// Load a GGUF file that is already on disk.
    pub fn load_from_path(&mut self, model_path: PathBuf, cfg: LlmConfig) -> Result<(), LlmError> {
        let backend = LlamaBackend::init()
            .map_err(|e| LlmError::LoadError(format!("backend init: {:?}", e)))?;

        let model_params = LlamaModelParams::default()
            .with_n_gpu_layers(cfg.n_gpu_layers);

        let model = LlamaModel::load_from_file(&backend, &model_path, &model_params)
            .map_err(|e| LlmError::LoadError(format!("GGUF load: {:?}", e)))?;

        let size_mb = std::fs::metadata(&model_path)
            .map(|m| m.len() / 1024 / 1024)
            .unwrap_or(0);

        self.model_info = Some(ModelInfo {
            name: cfg.model_file.clone(),
            path: model_path,
            size_mb,
            parameters: infer_parameters(&cfg.model_file),
            context_length: cfg.context_size,
            is_bundled: false,
            description: format!("HuggingFace: {}", cfg.model_repo),
        });

        self._backend = Some(backend);
        self.model = Some(model);
        self.config = cfg;

        tracing::info!("[LLM] Model loaded");
        Ok(())
    }

    /// Run inference synchronously (llama.cpp is synchronous).
    pub fn generate_sync(&mut self, prompt: &str) -> Result<String, LlmError> {
        let (backend, model) = match (&self._backend, &self.model) {
            (Some(b), Some(m)) => (b, m),
            _ => return Err(LlmError::ModelNotLoaded),
        };

        // Wrap in TinyLlama chat template
        let formatted = format_tinyllama_prompt(prompt);

        // Tokenise
        let tokens: Vec<LlamaToken> = model
            .str_to_token(&formatted, AddBos::Always)
            .map_err(|e| LlmError::InferenceError(format!("tokenise: {:?}", e)))?;

        if tokens.is_empty() {
            return Err(LlmError::InferenceError("empty token sequence".to_string()));
        }

        // Create fresh context (clears KV cache each call)
        let ctx_params = LlamaContextParams::default()
            .with_n_ctx(std::num::NonZeroU32::new(self.config.context_size as u32));

        let mut ctx = model
            .new_context(backend, ctx_params)
            .map_err(|e| LlmError::InferenceError(format!("create context: {:?}", e)))?;

        // ── Prefill prompt ────────────────────────────────────────────────────
        let prompt_len = tokens.len();
        let batch_cap = (prompt_len + self.config.max_tokens + 4).max(512);
        let mut batch = LlamaBatch::new(batch_cap, 1);

        for (i, &tok) in tokens.iter().enumerate() {
            batch
                .add(tok, i as i32, &[0], i == prompt_len - 1)
                .map_err(|e| LlmError::InferenceError(format!("batch.add: {:?}", e)))?;
        }

        ctx.decode(&mut batch)
            .map_err(|e| LlmError::InferenceError(format!("decode prompt: {:?}", e)))?;

        // ── Generation loop ───────────────────────────────────────────────────
        let mut generated: Vec<LlamaToken> = Vec::new();
        let mut n_cur = batch.n_tokens();
        let temperature = self.config.temperature;

        loop {
            if generated.len() >= self.config.max_tokens {
                break;
            }

            let logits = ctx.get_logits_ith(batch.n_tokens() - 1);
            let next_tok = LlamaToken(sample_token(logits, temperature));

            if model.is_eog_token(next_tok) {
                break;
            }

            generated.push(next_tok);

            batch.clear();
            batch
                .add(next_tok, n_cur, &[0], true)
                .map_err(|e| LlmError::InferenceError(format!("batch.add gen: {:?}", e)))?;

            ctx.decode(&mut batch)
                .map_err(|e| LlmError::InferenceError(format!("decode gen: {:?}", e)))?;

            n_cur += 1;
        }

        // Detokenise — token_to_piece needs a shared UTF-8 decoder
        let mut decoder = encoding_rs::UTF_8.new_decoder();
        let output: String = generated
            .iter()
            .filter_map(|&t| model.token_to_piece(t, &mut decoder, true, None).ok())
            .collect();

        Ok(output.trim().to_string())
    }

    /// Async wrapper (just calls generate_sync — acceptable for desktop)
    pub async fn generate(&mut self, prompt: &str) -> Result<String, LlmError> {
        self.generate_sync(prompt)
    }

    pub fn is_model_loaded(&self) -> bool {
        self.model.is_some()
    }

    pub fn config(&self) -> &LlmConfig {
        &self.config
    }

    pub fn model_info(&self) -> Option<&ModelInfo> {
        self.model_info.as_ref()
    }

    pub fn unload_model(&mut self) {
        self.model = None;
        self._backend = None;
        self.model_info = None;
    }

    pub fn list_available_models(&self) -> Vec<ModelInfo> {
        vec![ModelInfo {
            name: DEFAULT_MODEL_FILE.to_string(),
            path: PathBuf::from(DEFAULT_MODEL_FILE),
            size_mb: 637,
            parameters: "1.1B".to_string(),
            context_length: 2048,
            is_bundled: false,
            description: "TinyLlama-1.1B-Chat (Q4_K_M) — auto-downloaded from HuggingFace".to_string(),
        }]
    }
}

// ─── Private helpers ─────────────────────────────────────────────────────────

fn format_tinyllama_prompt(prompt: &str) -> String {
    format!(
        "<|system|>\nYou are a helpful writing assistant for a note-taking app. Be concise.</s>\n\
         <|user|>\n{}</s>\n<|assistant|>\n",
        prompt
    )
}

/// Temperature sampling over raw logits slice → token index
fn sample_token(logits: &[f32], temperature: f32) -> i32 {
    if temperature < 1e-6 {
        return logits
            .iter()
            .enumerate()
            .max_by(|(_, a), (_, b)| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal))
            .map(|(i, _)| i as i32)
            .unwrap_or(0);
    }

    let max_l = logits.iter().cloned().fold(f32::NEG_INFINITY, f32::max);
    let exp: Vec<f64> = logits
        .iter()
        .map(|&l| (((l - max_l) as f64) / temperature as f64).exp())
        .collect();
    let sum: f64 = exp.iter().sum();
    if sum == 0.0 {
        return 0;
    }

    let mut r: f64 = rand::random::<f64>() * sum;
    for (i, &e) in exp.iter().enumerate() {
        r -= e;
        if r <= 0.0 {
            return i as i32;
        }
    }
    (exp.len() - 1) as i32
}

fn infer_parameters(name: &str) -> String {
    let lower = name.to_lowercase();
    for pat in &["0.5b", "1.1b", "1b", "3b", "7b", "8b", "13b", "70b"] {
        if lower.contains(pat) {
            return pat.to_uppercase();
        }
    }
    "Unknown".to_string()
}

// ─── RAG helpers ─────────────────────────────────────────────────────────────

pub fn build_rag_prompt(context_chunks: &[crate::models::SearchResult], query: &str) -> String {
    let context = context_chunks
        .iter()
        .enumerate()
        .map(|(i, c)| format!("[{}] From \"{}\":\n{}\n", i + 1, c.note_title, c.text))
        .collect::<String>();

    format!(
        "Answer the question using only the notes context below. \
         Cite note numbers. If the context doesn't contain the answer, say so.\n\n\
         Context:\n{}\n\nQuestion: {}\n\nAnswer:",
        context, query
    )
}

pub fn build_context_only_response(context_chunks: &[crate::models::SearchResult]) -> String {
    if context_chunks.is_empty() {
        return "No relevant notes found.".to_string();
    }
    let mut r = "Relevant notes (no AI model loaded for synthesis):\n\n".to_string();
    for (i, c) in context_chunks.iter().enumerate() {
        r.push_str(&format!(
            "{}. **{}**:\n{}\n\n",
            i + 1,
            c.note_title,
            c.text.chars().take(200).collect::<String>()
        ));
    }
    r
}
