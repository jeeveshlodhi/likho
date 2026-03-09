# Embedding System for Likho RAG

## Current Status: Mock Embeddings (Testing Only)

We're currently using **deterministic mock embeddings** based on text hashing. This allows the RAG system to function for testing, but the embeddings are NOT semantically meaningful.

### Why Mock Embeddings?
- ✅ Fast - no model loading
- ✅ Deterministic - same results every time
- ✅ Works offline immediately
- ❌ NOT semantically accurate
- ❌ Similar texts don't have similar embeddings

## Production Options

### Option 1: ONNX Runtime (Recommended)
Use sentence-transformers models converted to ONNX format.

**Best Models:**
- **all-MiniLM-L6-v2** (384D) - Fast, good quality, 23MB
- **all-MiniLM-L12-v2** (384D) - Slower, better quality, 33MB
- **all-mpnet-base-v2** (768D) - Best quality, 109MB

**Implementation:**
```rust
// Add to Cargo.toml
ort = { version = "2", features = ["ndarray"] }

// Load model
let session = ort::Session::builder()?
    .commit_from_file("models/all-MiniLM-L6-v2.onnx")?;

// Run inference
let outputs = session.run(inputs!(
    "input_ids" => input_ids,
    "attention_mask" => attention_mask,
))?;
```

### Option 2: FastEmbed-rs
Rust-native implementation inspired by Qdrant's FastEmbed.

```rust
// Add to Cargo.toml
fastembed = "0.1"

// Usage
let model = fastembed::TextEmbedding::new(
    fastembed::InitOptions::default()
        .with_model_name(fastembed::EmbeddingModel::AllMiniLML6V2)
)?;

let embeddings = model.embed(vec!["Hello world"], None)?;
```

### Option 3: Use llama.cpp for Both
Load a small model and use its hidden states as embeddings.

**Pros:**
- One model for both embeddings and generation
- Consistent embedding space

**Cons:**
- Slower than dedicated embedding models
- More memory usage

## Recommended: Setup ONNX Runtime

### 1. Download ONNX Model

```bash
# Download all-MiniLM-L6-v2 ONNX model
mkdir -p models
cd models

# Option A: Hugging Face (official)
wget https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2/resolve/main/onnx/model.onnx
mv model.onnx all-MiniLM-L6-v2.onnx

# Option B: Use optimum-cli
pip install optimum[onnx]
optimum-cli export onnx --model sentence-transformers/all-MiniLM-L6-v2 ./all-MiniLM-L6-v2
```

### 2. Update Rust Code

Replace the `generate_mock_embedding` function in `src/embeddings.rs`:

```rust
use ort::{Session, Value};
use ndarray::{Array1, Array2};
use tokenizers::Tokenizer;

pub struct EmbeddingEngine {
    session: Session,
    tokenizer: Tokenizer,
    embedding_dim: usize,
}

impl EmbeddingEngine {
    pub fn new(model_path: &Path) -> Result<Self> {
        let session = Session::builder()?
            .commit_from_file(model_path)?;
        
        let tokenizer = Tokenizer::from_file(
            model_path.with_file_name("tokenizer.json")
        )?;
        
        Ok(Self {
            session,
            tokenizer,
            embedding_dim: 384,
        })
    }
    
    pub fn embed(&self, text: &str) -> Result<Vec<f32>> {
        // Tokenize
        let encoding = self.tokenizer.encode(text, true)?;
        let input_ids: Vec<i64> = encoding.get_ids()
            .iter().map(|&x| x as i64).collect();
        let attention_mask: Vec<i64> = encoding.get_attention_mask()
            .iter().map(|&x| x as i64).collect();
        
        // Create tensors
        let input_ids = ndarray::Array2::from_shape_vec(
            (1, input_ids.len()),
            input_ids
        )?;
        let attention_mask = ndarray::Array2::from_shape_vec(
            (1, attention_mask.len()),
            attention_mask
        )?;
        
        // Run inference
        let outputs = self.session.run(inputs!(
            "input_ids" => input_ids,
            "attention_mask" => attention_mask,
        ))?;
        
        // Extract embeddings (mean pooling)
        let embeddings = outputs["sentence_embedding"]
            .try_extract_tensor::<f32>()?;
        
        // Normalize
        let embedding = embeddings.slice(s![0, ..]).to_vec();
        normalize_embedding(&mut embedding);
        
        Ok(embedding)
    }
}
```

### 3. Update Dependencies

```toml
[dependencies]
# ONNX Runtime
ort = { version = "2", features = ["ndarray"] }

# Tokenization
tokenizers = "0.21"

# Already included
ndarray = { version = "0.16", features = ["serde"] }
```

## Quick Implementation

Want me to implement the ONNX Runtime version? Just run:

```bash
# Download the model
mkdir -p likho-app/models
cd likho-app/models
wget https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2/resolve/main/onnx/model.onnx -O all-MiniLM-L6-v2.onnx

# Download tokenizer
wget https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2/resolve/main/tokenizer.json
```

Then I can update the Rust code to use real embeddings.

## Performance

| Model | Size | Speed | Quality |
|-------|------|-------|---------|
| Mock | - | 1000+ docs/sec | ❌ None |
| MiniLM-L6 | 23MB | ~100 docs/sec | ✅ Good |
| MiniLM-L12 | 33MB | ~50 docs/sec | ✅ Better |
| MPNet | 109MB | ~30 docs/sec | ✅ Best |

## Memory Usage

- ONNX Runtime: ~100MB RAM
- Model file: 23-109MB disk
- Per embedding: 384-768 floats (~1.5-3KB)

For 10,000 notes:
- Embeddings: ~30MB storage
- Search memory: ~50MB RAM