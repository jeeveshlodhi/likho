import { useState, useCallback, useEffect } from "react";
import { SearchService } from "../lib/search-service";
import {
  SearchResult,
  RagResponse,
  SearchQuery,
  RagQuery,
  EmbeddingStatus,
} from "../types/search";

interface UseSearchReturn {
  results: SearchResult[];
  isLoading: boolean;
  error: string | null;
  search: (query: string, folderPath?: string) => Promise<void>;
  clearResults: () => void;
}

export function useSearch(): UseSearchReturn {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string, folderPath: string = "/") => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    console.log("[Search] Starting search for:", query);

    try {
      const searchQuery: SearchQuery = {
        query: query.trim(),
        folder_path: folderPath,
        limit: 10,
      };

      console.log("[Search] Query:", searchQuery);
      const searchResults = await SearchService.searchNotes(searchQuery);
      console.log("[Search] Results:", searchResults.length, "items found");
      setResults(searchResults);
    } catch (err) {
      console.error("[Search] Error:", err);
      setError(err instanceof Error ? err.message : "Search failed");
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return {
    results,
    isLoading,
    error,
    search,
    clearResults,
  };
}

interface UseRagReturn {
  response: RagResponse | null;
  isLoading: boolean;
  error: string | null;
  query: (question: string, folderPath?: string) => Promise<void>;
  clearResponse: () => void;
}

export function useRag(): UseRagReturn {
  const [response, setResponse] = useState<RagResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const query = useCallback(async (question: string, folderPath: string = "/") => {
    if (!question.trim()) {
      setResponse(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const ragQuery: RagQuery = {
        query: question.trim(),
        folder_path: folderPath,
        top_k: 5,
      };

      const ragResponse = await SearchService.ragQuery(ragQuery);
      setResponse(ragResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "RAG query failed");
      setResponse(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearResponse = useCallback(() => {
    setResponse(null);
    setError(null);
  }, []);

  return {
    response,
    isLoading,
    error,
    query,
    clearResponse,
  };
}

interface UseEmbeddingStatusReturn {
  status: EmbeddingStatus | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useEmbeddingStatus(): UseEmbeddingStatusReturn {
  const [status, setStatus] = useState<EmbeddingStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const embeddingStatus = await SearchService.getEmbeddingStatus();
      setStatus(embeddingStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get status");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    status,
    isLoading,
    error,
    refresh,
  };
}

interface UseNoteIndexingReturn {
  isIndexing: boolean;
  error: string | null;
  indexNote: (noteId: string) => Promise<void>;
}

export function useNoteIndexing(): UseNoteIndexingReturn {
  const [isIndexing, setIsIndexing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const indexNote = useCallback(async (noteId: string) => {
    setIsIndexing(true);
    setError(null);

    try {
      await SearchService.indexNote(noteId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to index note");
      throw err;
    } finally {
      setIsIndexing(false);
    }
  }, []);

  return {
    isIndexing,
    error,
    indexNote,
  };
}