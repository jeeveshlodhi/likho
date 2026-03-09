# LLM Model Management for Likho RAG

This document describes the LLM (Large Language Model) management system integrated into Likho's RAG (Retrieval-Augmented Generation) search.

## Overview

The system supports:
- ✅ Multiple local GGUF models (bundled or user-provided)
- ✅ Dynamic model loading/unloading
- ✅ GPU acceleration (Metal on macOS, CUDA on Linux/Windows)
- ✅ Model configuration (temperature, context size, threads)
- ✅ Automatic model detection and metadata extraction

## Recommended Models

### For Testing (Fast, Small)
**TinyLlama-1.1B-Chat** (660MB)
- Ultra-fast inference
- Good for basic Q&A
- Perfect for testing the system

```bash
./scripts/download-models.sh tinyllama
```

### For Production (Better Quality)
**Phi-3-Mini-4K-Instruct** (2.3GB)
- Microsoft's efficient 3.8B model
- Excellent quality-to-size ratio
- 4K context length

```bash
./scripts/download-models.sh phi3
```

**Llama-3.2-3B-Instruct** (1.9GB)
- Meta's latest small model
- Great performance
- 128K context length

```bash
./scripts/download-models.sh llama3.2
```

**Qwen2.5-7B-Instruct** (4.7GB)
- Alibaba's powerful model
- Complex reasoning capabilities
- 128K context length

```bash
./scripts/download-models.sh qwen2.5
```

### Download All Models

```bash
./scripts/download-models.sh all
```

## Model Configuration

Each model can be configured with:

```typescript
interface LlmConfig {
  model_path: string;      // Path to .gguf file
  context_size: number;    // Context window (2048, 4096, 8192, 16384)
  threads: number;         // CPU threads (2, 4, 6, 8)
  temperature: number;     // Creativity (0.0 - 2.0)
  max_tokens: number;      // Max response length (128 - 2048)
  gpu_layers: number;      // GPU layers (-1 for all)
  use_mmap: boolean;       // Memory mapping
  use_mlock: boolean;      // Lock memory
}
```

### Default Configuration

```typescript
{
  model_path: "models/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf",
  context_size: 2048,
  threads: 4,
  temperature: 0.7,
  max_tokens: 512,
  gpu_layers: -1,    // Use all GPU layers
  use_mmap: true,
  use_mlock: false
}
```

## API Reference

### TypeScript/React Hooks

```typescript
import { useLlmModel, useLlmModels, useLlmConfig } from "@/hooks/useLlmModel";

// Current model management
const { 
  modelInfo,      // Currently loaded model info
  isLoading,      // Loading state
  loadModel,      // Load a model with config
  unloadModel,    // Unload current model
  refresh         // Refresh model info
} = useLlmModel();

// List available models
const { 
  models,         // Array of available models
  refresh: refreshModels 
} = useLlmModels();

// Get current configuration
const { 
  config,         // Current LLM config
  refresh: refreshConfig 
} = useLlmConfig();
```

### Service Methods

```typescript
import { SearchService } from "@/lib/search-service";

// Load a model
await SearchService.loadLlmModel({
  model_path: "models/my-model.gguf",
  context_size: 4096,
  threads: 4,
  temperature: 0.7,
  max_tokens: 512,
  gpu_layers: -1,
  use_mmap: true,
  use_mlock: false
});

// Get current model info
const info = await SearchService.getLlmModelInfo();

// List available models
const models = await SearchService.listLlmModels();

// Unload model
await SearchService.unloadLlmModel();

// Get configuration
const config = await SearchService.getLlmConfig();

// Check if loaded
const isLoaded = await SearchService.isLlmModelLoaded();
```

### Rust Commands

```rust
// Load LLM model
#[tauri::command]
pub async fn load_llm_model(
    state: State<'_, AppState>,
    config: LlmConfig,
) -> Result<ModelInfo, String>

// Get current model info
#[tauri::command]
pub async fn get_llm_model_info(
    state: State<'_, AppState>,
) -> Result<Option<ModelInfo>, String>

// List available models
#[tauri::command]
pub async fn list_llm_models(
    state: State<'_, AppState>,
) -> Result<Vec<ModelInfo>, String>

// Unload current model
#[tauri::command]
pub async fn unload_llm_model(state: State<'_, AppState>) -> Result<(), String>

// Get configuration
#[tauri::command]
pub async fn get_llm_config(state: State<'_, AppState>) -> Result<LlmConfig, String>

// Check if model is loaded
#[tauri::command]
pub async fn is_llm_model_loaded(state: State<'_, AppState>) -> Result<bool, String>
```

## UI Components

### LlmSettingsDialog

A dialog for managing LLM models:

```tsx
import { LlmSettingsDialog } from "@/components/search";

function SettingsPage() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        Manage AI Models
      </Button>
      
      <LlmSettingsDialog 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
      />
    </>
  );
}
```

Features:
- Model selection dropdown
- Real-time configuration (temperature, max tokens, etc.)
- Current model status display
- Load/unload controls

## Model Storage

Models are stored in the `models/` directory relative to the application:

```
models/
├── tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf
├── phi-3-mini-4k-instruct.Q4_K_M.gguf
├── llama-3.2-3b-instruct.Q4_K_M.gguf
└── qwen2.5-7b-instruct.Q4_K_M.gguf
```

You can also place your own GGUF models in this directory and they will be automatically detected.

## Hardware Acceleration

### macOS (Metal)
The system automatically uses Metal Performance Shaders on Apple Silicon and Intel Macs for GPU acceleration.

### Linux/Windows (CUDA)
To enable CUDA support:
1. Install CUDA toolkit (11.8 or 12.x)
2. Uncomment CUDA features in Cargo.toml:
   ```toml
   llama-cpp-2 = { version = "0.1", features = ["cuda"] }
   ```

### CPU-Only
Works on any modern CPU. Set `gpu_layers: 0` to disable GPU acceleration.

## Performance Tips

1. **Use smaller models** for faster inference (TinyLlama, Phi-3 Mini)
2. **Reduce context size** if you don't need long contexts
3. **Increase threads** for better CPU utilization
4. **Enable GPU layers** to offload computation to GPU
5. **Use memory mapping** (use_mmap: true) for faster loading

## Troubleshooting

### Model won't load
- Check that the GGUF file exists at the specified path
- Verify the file is not corrupted (check file size)
- Ensure you have enough RAM (model size × 1.5 recommended)

### Out of memory
- Reduce context_size (e.g., from 4096 to 2048)
- Reduce gpu_layers (e.g., from -1 to 20)
- Use a smaller model (e.g., TinyLlama instead of Qwen2.5)

### Slow inference
- Increase threads to match your CPU cores
- Enable GPU acceleration
- Use a smaller model
- Reduce max_tokens for shorter responses

### Compilation errors with llama.cpp
- Install required build tools: CMake, C++ compiler
- On macOS: `xcode-select --install`
- On Linux: `sudo apt-get install build-essential cmake`
- On Windows: Install Visual Studio Build Tools

## Custom Models

You can use any GGUF format model:

1. Download a GGUF model from Hugging Face (e.g., TheBloke's quantized models)
2. Place it in the `models/` directory
3. Select it in the UI or load it via API

Example sources:
- [TheBloke on Hugging Face](https://huggingface.co/TheBloke)
- [bartowski on Hugging Face](https://huggingface.co/bartowski)

## Security & Privacy

- All models run locally on your device
- No data is sent to external servers
- Models are stored in your application directory
- No API keys or internet connection required

## Future Enhancements

- [ ] Model auto-download from UI
- [ ] Multiple model support (switch without restart)
- [ ] Model comparison/benchmarking
- [ ] Quantization options (Q4, Q5, Q8)
- [ ] Model merging/blending
- [ ] Fine-tuning support