// Types for RAG search system

// Note type for syncing with backend
export interface Note {
  id: string;
  title: string;
  content: string;
  folder_id: string;
  created_at: string;
  updated_at: string;
}

export interface SearchResult {
  chunk_id: string;
  note_id: string;
  note_title: string;
  folder_path: string;
  text: string;
  vector_score: number;
  keyword_score: number;
  hybrid_score: number;
  chunk_index: number;
}

export interface RagResponse {
  answer: string;
  sources: SearchResult[];
  processing_time_ms: number;
}

export interface EmbeddingStatus {
  model_loaded: boolean;
  model_name: string;
  queue_size: number;
  last_error: string | null;
}

export interface Chunk {
  id: string;
  note_id: string;
  folder_path: string;
  text: string;
  chunk_index: number;
  created_at: string;
}

export interface CreateFolderRequest {
  name: string;
  parent_id?: string;
}

export interface CreateNoteRequest {
  title: string;
  content: string;
  folder_id: string;
}

export interface UpdateNoteRequest {
  id: string;
  title?: string;
  content?: string;
  folder_id?: string;
}

export interface SearchFilters {
  folder_path?: string;
  date_range?: {
    from: Date;
    to: Date;
  };
}

export interface SearchQuery {
  query: string;
  folder_path: string;
  limit?: number;
}

export interface RagQuery {
  query: string;
  folder_path: string;
  top_k?: number;
}

// LLM Model Management Types

export interface LlmConfig {
  model_repo: string;
  model_file: string;
  temperature: number;
  max_tokens: number;
  /** 0 = CPU only; 99 = all layers on GPU (Metal/CUDA) */
  n_gpu_layers: number;
  context_size: number;
  /** Number of CPU threads to use for inference */
  threads: number;
}

export interface ModelInfo {
  name: string;
  path: string;
  size_mb: number;
  parameters: string;
  context_length: number;
  is_bundled: boolean;
  description: string;
}

export interface ModelDownloadRequest {
  url: string;
  name: string;
  description?: string;
}

export interface RelatedNote {
  note_id: string;
  note_title: string;
  similarity: number;
}

export interface TopicGroup {
  topic_name: string;
  suggested_folder: string;
  note_ids: string[];
  note_titles: string[];
  similarity_score: number;
}

export const DEFAULT_LLM_CONFIG: LlmConfig = {
  model_repo: "bartowski/TinyLlama-1.1B-Chat-v1.0-GGUF",
  model_file: "TinyLlama-1.1B-Chat-v1.0-Q4_K_M.gguf",
  temperature: 0.7,
  max_tokens: 512,
  n_gpu_layers: 0,
  context_size: 2048,
  threads: 4,
};

// Recommended models that can be downloaded
export const RECOMMENDED_MODELS: Omit<ModelInfo, "path" | "size_mb">[] = [
  {
    name: "TinyLlama-1.1B-Chat",
    parameters: "1.1B",
    context_length: 2048,
    is_bundled: false,
    description: "Ultra-fast tiny model, perfect for testing and basic Q&A",
  },
  {
    name: "Phi-3-Mini-4K-Instruct",
    parameters: "3.8B",
    context_length: 4096,
    is_bundled: false,
    description: "Microsoft's efficient small model with excellent quality",
  },
  {
    name: "Llama-3.2-3B-Instruct",
    parameters: "3B",
    context_length: 128000,
    is_bundled: false,
    description: "Meta's latest small model with great performance",
  },
  {
    name: "Qwen2.5-7B-Instruct",
    parameters: "7B",
    context_length: 128000,
    is_bundled: false,
    description: "Alibaba's powerful 7B model for complex reasoning",
  },
];