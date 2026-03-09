import { useState, useCallback, useEffect } from "react";
import { SearchService } from "../lib/search-service";
import { LlmConfig, ModelInfo } from "../types/search";

interface UseLlmModelReturn {
  modelInfo: ModelInfo | null;
  isLoading: boolean;
  error: string | null;
  loadModel: (config: LlmConfig) => Promise<void>;
  unloadModel: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useLlmModel(): UseLlmModelReturn {
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const info = await SearchService.getLlmModelInfo();
      setModelInfo(info);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get model info");
    }
  }, []);

  const loadModel = useCallback(async (config: LlmConfig) => {
    setIsLoading(true);
    setError(null);

    try {
      const info = await SearchService.loadLlmModel(config);
      setModelInfo(info);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load model");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const unloadModel = useCallback(async () => {
    setIsLoading(true);
    try {
      await SearchService.unloadLlmModel();
      setModelInfo(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unload model");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    modelInfo,
    isLoading,
    error,
    loadModel,
    unloadModel,
    refresh,
  };
}

interface UseLlmModelsReturn {
  models: ModelInfo[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useLlmModels(): UseLlmModelsReturn {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const models = await SearchService.listLlmModels();
      setModels(models);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to list models");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    models,
    isLoading,
    error,
    refresh,
  };
}

interface UseLlmConfigReturn {
  config: LlmConfig | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useLlmConfig(): UseLlmConfigReturn {
  const [config, setConfig] = useState<LlmConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const config = await SearchService.getLlmConfig();
      setConfig(config);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get config");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    config,
    isLoading,
    error,
    refresh,
  };
}