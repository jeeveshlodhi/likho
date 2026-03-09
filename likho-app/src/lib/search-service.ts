import { invoke } from "@tauri-apps/api/core";
import {
  SearchResult,
  RagResponse,
  EmbeddingStatus,
  Chunk,
  CreateFolderRequest,
  CreateNoteRequest,
  UpdateNoteRequest,
  SearchQuery,
  RagQuery,
  LlmConfig,
  ModelInfo,
  Note,
  RelatedNote,
  TopicGroup,
} from "../types/search";

export class SearchService {
  /**
   * Search notes using hybrid retrieval (vector + keyword)
   */
  static async searchNotes(query: SearchQuery): Promise<SearchResult[]> {
    try {
      console.log("[SearchService] Calling search_notes with:", query);
      const results = await invoke<SearchResult[]>("search_notes", {
        query: query.query,
        folderPath: query.folder_path || "/",
        limit: query.limit || 10,
      });
      console.log("[SearchService] Results:", results);
      return results;
    } catch (error) {
      console.error("[SearchService] Search error:", error);
      throw new Error(`Failed to search notes: ${error}`);
    }
  }

  /**
   * Execute RAG query with LLM generation
   */
  static async ragQuery(query: RagQuery): Promise<RagResponse> {
    try {
      const response = await invoke<RagResponse>("rag_query", {
        query: query.query,
        folderPath: query.folder_path || "/",
        topK: query.top_k || 5,
      });
      return response;
    } catch (error) {
      console.error("RAG query error:", error);
      throw new Error(`Failed to execute RAG query: ${error}`);
    }
  }

  /**
   * Index a note for search (chunk and generate embeddings)
   */
  static async indexNote(noteId: string): Promise<void> {
    try {
      console.log("[SearchService] Indexing note:", noteId);
      await invoke("index_note", { noteId });
      console.log("[SearchService] Note indexed successfully:", noteId);
    } catch (error) {
      console.error("[SearchService] Indexing error:", error);
      throw new Error(`Failed to index note: ${error}`);
    }
  }

  /**
   * Sync a note from frontend to backend database
   */
  static async syncNote(note: Note): Promise<void> {
    try {
      console.log("[SearchService] Syncing note:", note.id);
      await invoke("sync_note", { note });
      console.log("[SearchService] Note synced successfully:", note.id);
    } catch (error) {
      console.error("[SearchService] Sync error:", error);
      throw new Error(`Failed to sync note: ${error}`);
    }
  }

  /**
   * Sync multiple notes from frontend to backend database
   */
  static async syncNotes(notes: Note[]): Promise<void> {
    try {
      console.log("[SearchService] Syncing", notes.length, "notes");
      await invoke("sync_notes", { notes });
      console.log("[SearchService] Notes synced successfully");
    } catch (error) {
      console.error("[SearchService] Sync error:", error);
      throw new Error(`Failed to sync notes: ${error}`);
    }
  }

  /**
   * Get all notes from backend database
   */
  static async getAllNotes(): Promise<Note[]> {
    try {
      console.log("[SearchService] Getting all notes from database");
      const notes = await invoke<Note[]>("get_all_notes");
      console.log("[SearchService] Found", notes.length, "notes");
      return notes;
    } catch (error) {
      console.error("[SearchService] Get notes error:", error);
      throw new Error(`Failed to get notes: ${error}`);
    }
  }

  /**
   * Get folder hierarchical path
   */
  static async getFolderPath(folderId: string): Promise<string> {
    try {
      const path = await invoke<string>("get_folder_path", { folderId });
      return path;
    } catch (error) {
      console.error("Get folder path error:", error);
      throw new Error(`Failed to get folder path: ${error}`);
    }
  }

  /**
   * Create a new folder
   */
  static async createFolder(request: CreateFolderRequest): Promise<string> {
    try {
      const folderId = await invoke<string>("create_folder", { request });
      return folderId;
    } catch (error) {
      console.error("Create folder error:", error);
      throw new Error(`Failed to create folder: ${error}`);
    }
  }

  /**
   * Create a new note
   */
  static async createNote(request: CreateNoteRequest): Promise<string> {
    try {
      const noteId = await invoke<string>("create_note", { request });
      return noteId;
    } catch (error) {
      console.error("Create note error:", error);
      throw new Error(`Failed to create note: ${error}`);
    }
  }

  /**
   * Update a note
   */
  static async updateNote(request: UpdateNoteRequest): Promise<void> {
    try {
      await invoke("update_note", { request });
    } catch (error) {
      console.error("Update note error:", error);
      throw new Error(`Failed to update note: ${error}`);
    }
  }

  /**
   * Get chunks for a note
   */
  static async getNoteChunks(noteId: string): Promise<Chunk[]> {
    try {
      const chunks = await invoke<Chunk[]>("get_note_chunks", { noteId });
      return chunks;
    } catch (error) {
      console.error("Get chunks error:", error);
      throw new Error(`Failed to get note chunks: ${error}`);
    }
  }

  /**
   * Get embedding engine status
   */
  static async getEmbeddingStatus(): Promise<EmbeddingStatus> {
    try {
      const status = await invoke<EmbeddingStatus>("get_embedding_status");
      return status;
    } catch (error) {
      console.error("Get embedding status error:", error);
      throw new Error(`Failed to get embedding status: ${error}`);
    }
  }

  // LLM Model Management

  /**
   * Load an LLM model with configuration
   */
  static async loadLlmModel(config: LlmConfig): Promise<ModelInfo> {
    try {
      const modelInfo = await invoke<ModelInfo>("load_llm_model", { config });
      return modelInfo;
    } catch (error) {
      console.error("Load LLM model error:", error);
      throw new Error(`Failed to load LLM model: ${error}`);
    }
  }

  /**
   * Get current LLM model info
   */
  static async getLlmModelInfo(): Promise<ModelInfo | null> {
    try {
      const info = await invoke<ModelInfo | null>("get_llm_model_info");
      return info;
    } catch (error) {
      console.error("Get LLM model info error:", error);
      throw new Error(`Failed to get LLM model info: ${error}`);
    }
  }

  /**
   * List available LLM models
   */
  static async listLlmModels(): Promise<ModelInfo[]> {
    try {
      const models = await invoke<ModelInfo[]>("list_llm_models");
      return models;
    } catch (error) {
      console.error("List LLM models error:", error);
      throw new Error(`Failed to list LLM models: ${error}`);
    }
  }

  /**
   * Unload current LLM model
   */
  static async unloadLlmModel(): Promise<void> {
    try {
      await invoke("unload_llm_model");
    } catch (error) {
      console.error("Unload LLM model error:", error);
      throw new Error(`Failed to unload LLM model: ${error}`);
    }
  }

  /**
   * Get LLM configuration
   */
  static async getLlmConfig(): Promise<LlmConfig> {
    try {
      const config = await invoke<LlmConfig>("get_llm_config");
      return config;
    } catch (error) {
      console.error("Get LLM config error:", error);
      throw new Error(`Failed to get LLM config: ${error}`);
    }
  }

  /**
   * Check if LLM model is loaded
   */
  static async isLlmModelLoaded(): Promise<boolean> {
    try {
      const loaded = await invoke<boolean>("is_llm_model_loaded");
      return loaded;
    } catch (error) {
      console.error("Check LLM model loaded error:", error);
      throw new Error(`Failed to check LLM model status: ${error}`);
    }
  }

  // ─── AI methods ──────────────────────────────────────────────────────────

  static async aiFindRelatedNotes(noteId: string, limit = 5): Promise<RelatedNote[]> {
    return invoke<RelatedNote[]>("ai_find_related_notes", { noteId, limit });
  }

  static async aiSuggestTitle(noteId: string): Promise<string> {
    return invoke<string>("ai_suggest_title", { noteId });
  }

  static async aiSummarizeNote(noteId: string): Promise<string> {
    return invoke<string>("ai_summarize_note", { noteId });
  }

  static async aiGroupNotesByTopic(): Promise<TopicGroup[]> {
    return invoke<TopicGroup[]>("ai_group_notes_by_topic");
  }

  static async aiCompleteText(cursorText: string): Promise<string> {
    return invoke<string>("ai_complete_text", { cursorText });
  }

  static async aiImproveText(text: string): Promise<string> {
    return invoke<string>("ai_improve_text", { text });
  }
}

export default SearchService;