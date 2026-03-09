/// Text chunking module for splitting notes into manageable chunks
/// Target: 300-500 tokens per chunk for optimal embedding

pub struct TextChunker {
    /// Target chunk size in tokens (approximate)
    target_chunk_size: usize,
    /// Maximum chunk size in tokens
    max_chunk_size: usize,
    /// Overlap between chunks to maintain context
    chunk_overlap: usize,
}

impl Default for TextChunker {
    fn default() -> Self {
        Self {
            target_chunk_size: 400,
            max_chunk_size: 512,
            chunk_overlap: 50,
        }
    }
}

impl TextChunker {
    pub fn new(target_chunk_size: usize, max_chunk_size: usize, chunk_overlap: usize) -> Self {
        Self {
            target_chunk_size,
            max_chunk_size,
            chunk_overlap,
        }
    }

    /// Chunk text using a simple but effective approach:
    /// 1. Split by paragraphs first
    /// 2. If paragraph too large, split by sentences
    /// 3. If sentence too large, split by words
    pub fn chunk_text(&self, text: &str) -> Vec<String> {
        let text = text.trim();
        if text.is_empty() {
            return vec![];
        }

        // Rough token estimation: ~4 characters per token for English text
        let estimated_tokens = text.len() / 4;

        // If text is small enough, return as single chunk
        if estimated_tokens <= self.target_chunk_size {
            return vec![text.to_string()];
        }

        let mut chunks = vec![];
        let mut current_chunk = String::new();
        let mut current_token_count = 0;

        // Split by paragraphs first
        let paragraphs: Vec<&str> = text.split("\n\n").collect();

        for paragraph in paragraphs {
            let paragraph = paragraph.trim();
            if paragraph.is_empty() {
                continue;
            }

            let para_tokens = paragraph.len() / 4;

            if para_tokens > self.max_chunk_size {
                // Paragraph too large, split by sentences
                let sentences = self.split_into_sentences(paragraph);
                for sentence in sentences {
                    let sent_tokens = sentence.len() / 4;

                    if current_token_count + sent_tokens > self.target_chunk_size
                        && !current_chunk.is_empty()
                    {
                        // Save current chunk and start new one with overlap
                        chunks.push(current_chunk.trim().to_string());

                        // Get overlap text (last ~50 tokens worth)
                        let overlap_start =
                            current_chunk.len().saturating_sub(self.chunk_overlap * 4);
                        let overlap = &current_chunk[overlap_start..];
                        current_chunk = overlap.to_string();
                        current_token_count = current_chunk.len() / 4;
                    }

                    current_chunk.push_str(&sentence);
                    current_chunk.push(' ');
                    current_token_count += sent_tokens;
                }
            } else if current_token_count + para_tokens > self.target_chunk_size
                && !current_chunk.is_empty()
            {
                // Save current chunk and start new one
                chunks.push(current_chunk.trim().to_string());

                // Add overlap
                let overlap_start = current_chunk.len().saturating_sub(self.chunk_overlap * 4);
                let overlap = &current_chunk[overlap_start..];
                current_chunk = format!("{}\n\n{}", overlap.trim(), paragraph);
                current_token_count = current_chunk.len() / 4;
            } else {
                // Add paragraph to current chunk
                if !current_chunk.is_empty() {
                    current_chunk.push_str("\n\n");
                }
                current_chunk.push_str(paragraph);
                current_token_count += para_tokens;
            }
        }

        // Don't forget the last chunk
        if !current_chunk.trim().is_empty() {
            chunks.push(current_chunk.trim().to_string());
        }

        // Post-process: ensure no chunk exceeds max size
        self.enforce_max_size(chunks)
    }

    /// Split text into sentences using simple heuristics
    fn split_into_sentences(&self, text: &str) -> Vec<String> {
        let mut sentences = vec![];
        let mut current = String::new();
        let chars: Vec<char> = text.chars().collect();

        for i in 0..chars.len() {
            current.push(chars[i]);

            // Check for sentence end
            if chars[i] == '.' || chars[i] == '!' || chars[i] == '?' {
                // Check if next char is whitespace or end of text
                if i + 1 >= chars.len() || chars[i + 1].is_whitespace() {
                    sentences.push(current.trim().to_string());
                    current = String::new();
                }
            }
        }

        if !current.trim().is_empty() {
            sentences.push(current.trim().to_string());
        }

        sentences
    }

    /// Ensure no chunk exceeds max size by splitting oversized chunks
    fn enforce_max_size(&self, chunks: Vec<String>) -> Vec<String> {
        let mut result = vec![];

        for chunk in chunks {
            let token_count = chunk.len() / 4;

            if token_count <= self.max_chunk_size {
                result.push(chunk);
            } else {
                // Split by words
                let words: Vec<&str> = chunk.split_whitespace().collect();
                let mut current = String::new();
                let mut current_tokens = 0;
                let _target_word_count = self.target_chunk_size / 2; // Rough estimate

                for word in words {
                    let word_tokens = word.len() / 4 + 1;

                    if current_tokens + word_tokens > self.target_chunk_size && !current.is_empty()
                    {
                        result.push(current.trim().to_string());
                        current = word.to_string();
                        current_tokens = word_tokens;
                    } else {
                        if !current.is_empty() {
                            current.push(' ');
                        }
                        current.push_str(word);
                        current_tokens += word_tokens;
                    }
                }

                if !current.trim().is_empty() {
                    result.push(current.trim().to_string());
                }
            }
        }

        result
    }

    /// Get chunk with metadata
    pub fn chunk_with_metadata(
        &self,
        text: &str,
        note_id: &str,
        folder_path: &str,
    ) -> Vec<ChunkMetadata> {
        let chunks = self.chunk_text(text);
        chunks
            .into_iter()
            .enumerate()
            .map(|(idx, text)| ChunkMetadata {
                id: format!("{}_chunk_{}", note_id, idx),
                note_id: note_id.to_string(),
                folder_path: folder_path.to_string(),
                text,
                chunk_index: idx as i32,
            })
            .collect()
    }
}

#[derive(Debug, Clone)]
pub struct ChunkMetadata {
    pub id: String,
    pub note_id: String,
    pub folder_path: String,
    pub text: String,
    pub chunk_index: i32,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_small_text_single_chunk() {
        let chunker = TextChunker::default();
        let text = "This is a small piece of text.";
        let chunks = chunker.chunk_text(text);
        assert_eq!(chunks.len(), 1);
        assert_eq!(chunks[0], text);
    }

    #[test]
    fn test_paragraph_splitting() {
        let chunker = TextChunker::new(50, 100, 10);
        let text = "First paragraph with some content.\n\nSecond paragraph with different content.\n\nThird paragraph here.";
        let chunks = chunker.chunk_text(text);
        assert!(!chunks.is_empty());
        // Should preserve some paragraph structure
        assert!(
            chunks[0].contains("First paragraph")
                || chunks[0].contains("First")
                || chunks[0].contains("paragraph")
        );
    }
}
