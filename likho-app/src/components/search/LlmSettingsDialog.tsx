import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Loader2, Cpu, HardDrive, Zap, Download } from "lucide-react";
import { useLlmModel, useLlmConfig } from "@/hooks/useLlmModel";
import {
  LlmConfig,
  ModelInfo,
  DEFAULT_LLM_CONFIG,
  RECOMMENDED_MODELS,
} from "@/types/search";

interface LlmSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LlmSettingsDialog: React.FC<LlmSettingsDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const { modelInfo, isLoading, loadModel, unloadModel } = useLlmModel();
  const { config } = useLlmConfig();
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [localConfig, setLocalConfig] = useState<LlmConfig>(DEFAULT_LLM_CONFIG);

  // Update local config when fetched config changes
  React.useEffect(() => {
    if (config) {
      setLocalConfig(config);
    }
  }, [config]);

  const handleLoadModel = async () => {
    const modelConfig: LlmConfig = {
      ...localConfig,
      model_path: `models/${selectedModel}.gguf`,
    };
    await loadModel(modelConfig);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>LLM Model Settings</DialogTitle>
          <DialogDescription>
            Configure and load local AI models for RAG queries
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Model Status */}
          <div className="rounded-lg bg-gray-50 p-4">
            <h3 className="font-medium mb-2">Current Model</h3>
            {modelInfo ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500"></span>
                  <span className="font-medium">{modelInfo.name}</span>
                  <span className="text-sm text-gray-500">
                    ({modelInfo.parameters})
                  </span>
                </div>
                <div className="text-sm text-gray-600 grid grid-cols-2 gap-2">
                  <div>Size: {modelInfo.size_mb} MB</div>
                  <div>Context: {modelInfo.context_length} tokens</div>
                  <div className="col-span-2">{modelInfo.description}</div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => unloadModel()}
                  disabled={isLoading}
                >
                  Unload Model
                </Button>
              </div>
            ) : (
              <div className="text-gray-500">
                No model loaded. Select and load a model below.
              </div>
            )}
          </div>

          {/* Model Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Model</label>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a model..." />
              </SelectTrigger>
              <SelectContent>
                {RECOMMENDED_MODELS.map((model) => (
                  <SelectItem key={model.name} value={model.name}>
                    <div className="flex items-center justify-between w-full">
                      <span>{model.name}</span>
                      <span className="text-xs text-gray-500">
                        {model.parameters}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Configuration */}
          <div className="space-y-4">
            <h3 className="font-medium">Configuration</h3>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm">Temperature</label>
                <span className="text-sm text-gray-500">
                  {localConfig.temperature}
                </span>
              </div>
              <Slider
                value={[localConfig.temperature]}
                onValueChange={([v]) =>
                  setLocalConfig((prev) => ({ ...prev, temperature: v }))
                }
                min={0}
                max={2}
                step={0.1}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm">Max Tokens</label>
                <span className="text-sm text-gray-500">
                  {localConfig.max_tokens}
                </span>
              </div>
              <Slider
                value={[localConfig.max_tokens]}
                onValueChange={([v]) =>
                  setLocalConfig((prev) => ({ ...prev, max_tokens: v }))
                }
                min={128}
                max={2048}
                step={128}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm">Context Size</label>
                <Select
                  value={localConfig.context_size.toString()}
                  onValueChange={(v) =>
                    setLocalConfig((prev) => ({
                      ...prev,
                      context_size: parseInt(v),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2048">2K tokens</SelectItem>
                    <SelectItem value="4096">4K tokens</SelectItem>
                    <SelectItem value="8192">8K tokens</SelectItem>
                    <SelectItem value="16384">16K tokens</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm">CPU Threads</label>
                <Select
                  value={localConfig.threads.toString()}
                  onValueChange={(v) =>
                    setLocalConfig((prev) => ({
                      ...prev,
                      threads: parseInt(v),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 threads</SelectItem>
                    <SelectItem value="4">4 threads</SelectItem>
                    <SelectItem value="6">6 threads</SelectItem>
                    <SelectItem value="8">8 threads</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Load Button */}
          <Button
            onClick={handleLoadModel}
            disabled={!selectedModel || isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading Model...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Load Model
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};