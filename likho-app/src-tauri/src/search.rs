use crate::db::Database;
use crate::models::SearchResult;
use std::collections::HashMap;
use std::sync::Arc;

/// Search engine implementing hybrid retrieval (vector + keyword)
pub struct SearchEngine {
    db: Arc<Database>,
}

/// Hybrid search parameters
pub struct SearchParams {
    pub query: String,
    pub folder_path: String,
    pub limit: i64,
    pub vector_weight: f64,
    pub keyword_weight: f64,
}

impl Default for SearchParams {
    fn default() -> Self {
        Self {
            query: String::new(),
            folder_path: "/".to_string(),
            limit: 10,
            vector_weight: 0.7,
            keyword_weight: 0.3,
        }
    }
}

impl SearchEngine {
    pub fn new(db: Arc<Database>) -> Self {
        Self { db }
    }

    /// Perform hybrid search combining vector similarity and keyword matching
    pub fn search(
        &self,
        query_embedding: &Vec<f32>,
        params: SearchParams,
    ) -> Result<Vec<SearchResult>, SearchError> {
        let SearchParams {
            query,
            folder_path,
            limit,
            vector_weight,
            keyword_weight,
        } = params;

        tracing::info!(
            "[SearchEngine] Starting hybrid search for: '{}' in '{}'",
            query,
            folder_path
        );

        // Run vector search
        let vector_results = self
            .db
            .search_vector(query_embedding, &folder_path, limit * 3)
            .map_err(|e| SearchError::DatabaseError(e.to_string()))?;
        tracing::info!(
            "[SearchEngine] Vector search found {} results",
            vector_results.len()
        );

        // Run keyword search using FTS5
        let keyword_results = self
            .db
            .search_keyword(&query, &folder_path, limit * 3)
            .map_err(|e| SearchError::DatabaseError(e.to_string()))?;
        tracing::info!(
            "[SearchEngine] Keyword search found {} results",
            keyword_results.len()
        );

        // Merge and score results
        let merged = self.merge_results(
            vector_results,
            keyword_results,
            vector_weight,
            keyword_weight,
        );

        // Get top N results
        let top_ids: Vec<String> = merged
            .iter()
            .take(limit as usize)
            .map(|(id, _)| id.clone())
            .collect();

        // Fetch full chunk data
        let chunks = self
            .db
            .get_chunks_by_ids(&top_ids)
            .map_err(|e| SearchError::DatabaseError(e.to_string()))?;

        // Build search results with scores
        let mut results = vec![];
        for chunk in chunks {
            if let Some(scores) = merged.iter().find(|(id, _)| id == &chunk.id) {
                let note_title = self
                    .db
                    .get_note_title(&chunk.note_id)
                    .ok()
                    .flatten()
                    .unwrap_or_else(|| "Untitled".to_string());

                results.push(SearchResult {
                    chunk_id: chunk.id,
                    note_id: chunk.note_id,
                    note_title,
                    folder_path: chunk.folder_path,
                    text: chunk.text,
                    vector_score: scores.1.vector_score,
                    keyword_score: scores.1.keyword_score,
                    hybrid_score: scores.1.hybrid_score,
                    chunk_index: chunk.chunk_index,
                });
            }
        }

        // Sort by hybrid score descending
        results.sort_by(|a, b| b.hybrid_score.partial_cmp(&a.hybrid_score).unwrap());

        tracing::info!("[SearchEngine] Returning {} final results", results.len());
        Ok(results)
    }

    /// Merge vector and keyword search results with reciprocal rank fusion
    fn merge_results(
        &self,
        vector_results: Vec<(String, f64)>,
        keyword_results: Vec<(String, f64)>,
        vector_weight: f64,
        keyword_weight: f64,
    ) -> Vec<(String, MergedScores)> {
        let mut scores: HashMap<String, MergedScores> = HashMap::new();

        // Add vector scores
        for (rank, (id, score)) in vector_results.iter().enumerate() {
            let entry = scores.entry(id.clone()).or_insert(MergedScores::default());
            entry.vector_score = *score;
            entry.vector_rank = rank + 1;
        }

        // Add keyword scores
        for (rank, (id, score)) in keyword_results.iter().enumerate() {
            let entry = scores.entry(id.clone()).or_insert(MergedScores::default());
            entry.keyword_score = *score;
            entry.keyword_rank = rank + 1;
        }

        // Calculate hybrid scores using weighted combination
        let mut merged: Vec<(String, MergedScores)> = scores
            .into_iter()
            .map(|(id, mut scores)| {
                // Use reciprocal rank fusion for ranking component
                let vector_rrf = if scores.vector_rank > 0 {
                    1.0 / (60.0 + scores.vector_rank as f64)
                } else {
                    0.0
                };

                let keyword_rrf = if scores.keyword_rank > 0 {
                    1.0 / (60.0 + scores.keyword_rank as f64)
                } else {
                    0.0
                };

                // Combined score: weighted sum of normalized scores
                scores.hybrid_score = vector_weight * scores.vector_score
                    + keyword_weight * scores.keyword_score
                    + 0.1 * (vector_rrf + keyword_rrf); // Small boost from ranking

                (id, scores)
            })
            .collect();

        // Sort by hybrid score descending
        merged.sort_by(|a, b| b.1.hybrid_score.partial_cmp(&a.1.hybrid_score).unwrap());

        merged
    }

    /// Search by keyword only (for when embeddings not available)
    pub fn search_keyword_only(
        &self,
        query: &str,
        folder_path: &str,
        limit: i64,
    ) -> Result<Vec<SearchResult>, SearchError> {
        let keyword_results = self
            .db
            .search_keyword(query, folder_path, limit)
            .map_err(|e| SearchError::DatabaseError(e.to_string()))?;

        let ids: Vec<String> = keyword_results.iter().map(|(id, _)| id.clone()).collect();

        let chunks = self
            .db
            .get_chunks_by_ids(&ids)
            .map_err(|e| SearchError::DatabaseError(e.to_string()))?;

        let mut results = vec![];
        for chunk in chunks {
            if let Some((_, score)) = keyword_results.iter().find(|(id, _)| id == &chunk.id) {
                let note_title = self
                    .db
                    .get_note_title(&chunk.note_id)
                    .ok()
                    .flatten()
                    .unwrap_or_else(|| "Untitled".to_string());

                results.push(SearchResult {
                    chunk_id: chunk.id,
                    note_id: chunk.note_id,
                    note_title,
                    folder_path: chunk.folder_path,
                    text: chunk.text,
                    vector_score: 0.0,
                    keyword_score: *score,
                    hybrid_score: *score,
                    chunk_index: chunk.chunk_index,
                });
            }
        }

        results.sort_by(|a, b| b.hybrid_score.partial_cmp(&a.hybrid_score).unwrap());
        Ok(results)
    }

    /// Search notes by title (fallback for unindexed notes)
    pub fn search_notes_fallback(
        &self,
        query: &str,
        folder_path: &str,
        limit: i64,
    ) -> Result<Vec<SearchResult>, SearchError> {
        let note_results = self
            .db
            .search_notes_by_title(query, folder_path, limit)
            .map_err(|e| SearchError::DatabaseError(e.to_string()))?;

        let mut results = vec![];
        for (note_id, title, folder_id) in note_results {
            let folder_path = self
                .db
                .get_folder_path(&folder_id)
                .unwrap_or_else(|_| format!("/folder/ {}", folder_id));

            // Create a pseudo-chunk result for the note title
            results.push(SearchResult {
                chunk_id: format!("note_{}_title", note_id),
                note_id: note_id.clone(),
                note_title: title.clone(),
                folder_path,
                text: format!("Note title: {}", title),
                vector_score: 0.0,
                keyword_score: 0.8, // High score for title match
                hybrid_score: 0.8,
                chunk_index: 0,
            });
        }

        Ok(results)
    }
}

#[derive(Default, Debug)]
struct MergedScores {
    vector_score: f64,
    keyword_score: f64,
    hybrid_score: f64,
    vector_rank: usize,
    keyword_rank: usize,
}

#[derive(Debug)]
pub enum SearchError {
    DatabaseError(String),
    InvalidQuery(String),
}

impl std::fmt::Display for SearchError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            SearchError::DatabaseError(e) => write!(f, "Database error: {}", e),
            SearchError::InvalidQuery(e) => write!(f, "Invalid query: {}", e),
        }
    }
}

impl std::error::Error for SearchError {}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_merge_results() {
        let engine = SearchEngine::new(Arc::new(
            Database::new(&std::path::Path::new(":memory:")).unwrap(),
        ));

        let vector_results = vec![
            ("chunk1".to_string(), 0.9),
            ("chunk2".to_string(), 0.8),
            ("chunk3".to_string(), 0.7),
        ];

        let keyword_results = vec![
            ("chunk2".to_string(), 0.95),
            ("chunk1".to_string(), 0.6),
            ("chunk4".to_string(), 0.5),
        ];

        let merged = engine.merge_results(vector_results, keyword_results, 0.7, 0.3);

        // chunk2 should be first (high in both)
        assert_eq!(merged[0].0, "chunk2");
        // chunk1 should be second
        assert_eq!(merged[1].0, "chunk1");
    }
}
