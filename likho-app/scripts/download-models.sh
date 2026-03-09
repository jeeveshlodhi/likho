#!/bin/bash

# Download LLM models for Likho RAG system
# Usage: ./download-models.sh [model_name]
# Available models: tinyllama, phi3, llama3.2, qwen2.5

set -e

MODELS_DIR="models"
mkdir -p "$MODELS_DIR"

download_model() {
    local url=$1
    local filename=$2
    
    echo "Downloading $filename..."
    
    if command -v wget &> /dev/null; then
        wget -O "$MODELS_DIR/$filename" "$url"
    elif command -v curl &> /dev/null; then
        curl -L -o "$MODELS_DIR/$filename" "$url"
    else
        echo "Error: wget or curl required"
        exit 1
    fi
    
    echo "✓ Downloaded $filename"
}

# Default to tinyllama if no argument provided
MODEL=${1:-tinyllama}

case $MODEL in
    tinyllama|TinyLlama)
        echo "Downloading TinyLlama 1.1B Chat (660MB)..."
        download_model \
            "https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf" \
            "tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf"
        echo ""
        echo "TinyLlama is ready to use!"
        echo "This is a fast, small model perfect for testing."
        ;;
        
    phi3|Phi-3)
        echo "Downloading Phi-3 Mini 4K Instruct (2.3GB)..."
        download_model \
            "https://huggingface.co/bartowski/Phi-3.1-mini-4k-instruct-GGUF/resolve/main/Phi-3.1-mini-4k-instruct-Q4_K_M.gguf" \
            "phi-3-mini-4k-instruct.Q4_K_M.gguf"
        echo ""
        echo "Phi-3 Mini is ready to use!"
        echo "Microsoft's efficient 3.8B parameter model with excellent quality."
        ;;
        
    llama3.2|Llama-3.2)
        echo "Downloading Llama 3.2 3B Instruct (1.9GB)..."
        download_model \
            "https://huggingface.co/bartowski/Llama-3.2-3B-Instruct-GGUF/resolve/main/Llama-3.2-3B-Instruct-Q4_K_M.gguf" \
            "llama-3.2-3b-instruct.Q4_K_M.gguf"
        echo ""
        echo "Llama 3.2 is ready to use!"
        echo "Meta's latest 3B model with great performance."
        ;;
        
    qwen2.5|Qwen-2.5)
        echo "Downloading Qwen2.5 7B Instruct (4.7GB)..."
        download_model \
            "https://huggingface.co/bartowski/Qwen2.5-7B-Instruct-GGUF/resolve/main/Qwen2.5-7B-Instruct-Q4_K_M.gguf" \
            "qwen2.5-7b-instruct.Q4_K_M.gguf"
        echo ""
        echo "Qwen2.5 is ready to use!"
        echo "Alibaba's powerful 7B model for complex reasoning."
        ;;
        
    all)
        echo "Downloading all recommended models..."
        echo ""
        $0 tinyllama
        $0 phi3
        $0 llama3.2
        $0 qwen2.5
        echo ""
        echo "All models downloaded!"
        ;;
        
    *)
        echo "Usage: $0 [model_name]"
        echo ""
        echo "Available models:"
        echo "  tinyllama  - TinyLlama 1.1B Chat (660MB) - Fast, good for testing"
        echo "  phi3       - Phi-3 Mini 4K (2.3GB) - Efficient 3.8B model"
        echo "  llama3.2   - Llama 3.2 3B (1.9GB) - Meta's latest"
        echo "  qwen2.5    - Qwen2.5 7B (4.7GB) - Powerful reasoning"
        echo "  all        - Download all models"
        echo ""
        echo "Example: $0 tinyllama"
        exit 1
        ;;
esac

echo ""
echo "Model saved to: $MODELS_DIR/"
echo "The model will be automatically loaded when you start Likho."