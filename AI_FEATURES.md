# Likho — AI Features Roadmap

> **Focus:** Online space (cloud-powered) first.
> Offline / local features (llama.cpp) are documented at the end for reference.

---

## Stack context

| Layer | Tech | AI hook-in point |
|---|---|---|
| Frontend | React + TypeScript (Tauri shell) | Calls backend REST or Tauri commands |
| Online backend | FastAPI + PostgreSQL (JSONB pages) | Calls Claude / OpenAI / open-source APIs |
| Real-time | Yjs WebSocket (`/ws/collab/{page_id}`) | Presence + AI suggestions via same socket |
| Offline engine | Rust + llama.cpp + SQLite | Local LLM inference, vector embeddings |
| Page content | BlockNote document (JSONB) | Structured blocks, easy to traverse |

---

## Online Space — AI Features

### 1. Cloud Writing Assistant
**What:** Context-aware writing help powered by a capable cloud model (Claude / GPT-4o).
**Surfaces:** Inline toolbar in any `note`, `meeting`, `documentation`, `journal` page.
**Actions available:**
- Rewrite selection (change tone: formal / casual / technical)
- Expand bullet → paragraph
- Condense selection to a summary
- Fix grammar + spelling
- Continue writing from cursor

**API shape:**
```
POST /api/v1/ai/write-assist
{ page_id, selection_text, action, context_blocks[] }
→ { result_text, tokens_used }
```

**Why online-first:** Requires a frontier model for nuanced language quality. Local TinyLlama is insufficient for this.

---

### 2. Semantic Cloud Search
**What:** Server-side vector search across all online pages. No local model needed.
**How:** On each page save, the backend generates an embedding (via OpenAI `text-embedding-3-small` or a self-hosted model) and stores it in a `pgvector` column. Search at query time does cosine similarity.
**Surfaces:** Global search (`Cmd+K`), chat sidebar.

**API shape:**
```
GET /api/v1/ai/search?q=...&workspace_id=...&limit=10
→ [{ page_id, title, snippet, score }]
```

**Why online-first:** pgvector runs on the Postgres instance. No client compute needed.

---

### 3. Meeting Intelligence
**What:** For `page_type = "meeting"` pages, automatically extract structured output on save.
**Extracts:**
- Action items → optionally push to a linked Kanban board
- Decisions made
- Open questions
- Attendees (from page content)
- Next meeting date (if mentioned)

**Surfaces:** Summary panel on the right side of meeting pages. One-click "Push to Kanban" button.

**API shape:**
```
POST /api/v1/ai/meeting-extract
{ page_id }
→ { action_items[], decisions[], open_questions[], attendees[], next_date? }
```

**Why online-first:** Extraction runs once server-side on save. Result is cached in `pages.metadata_` JSONB.

---

### 4. Auto-tagging
**What:** When a page is created or substantially updated, AI suggests 3–5 semantic tags based on content. Tags are stored in `pages.metadata_["ai_tags"]`.
**Surfaces:** Tag pill row beneath page title (with "AI suggested" indicator). User can accept/reject each.

**API shape:**
```
POST /api/v1/ai/suggest-tags
{ page_id, content_text }
→ { tags: [{ label, confidence }] }
```

**Trigger:** Background task on page update (Celery / FastAPI `BackgroundTasks`).

---

### 5. Note Digest (Daily / Weekly)
**What:** Scheduled job generates a digest page in the user's workspace summarising:
- Notes created or updated this period
- Key themes across the space
- Action items that are still open
- Suggested follow-ups

**Surfaces:** A pinned `digest` page that auto-updates. Optional email delivery.

**Why online-first:** Requires access to all pages in the workspace — only possible server-side.

**API shape:**
```
POST /api/v1/ai/digest
{ workspace_id, period: "daily" | "weekly" }
→ { digest_page_id, summary }
```

---

### 6. Contextual Team Q&A (Workspace RAG)
**What:** Team-level RAG — any workspace member can ask "What did we decide about X?" or "Find notes about Y" and the AI answers grounded in the shared workspace.
**Surfaces:** Chat panel (`Cmd+Shift+A` equivalent, but server-powered).

**Why online-first:** Spans all team members' pages, which are only available server-side.

**API shape:**
```
POST /api/v1/ai/rag-query
{ workspace_id, question, top_k: 5 }
→ { answer, sources: [{ page_id, title, excerpt, score }] }
```

---

### 7. Journal Insights
**What:** For `page_type = "journal"` pages, track patterns over time.
**Features:**
- Recurring themes / keywords over the last 30 days
- Sentiment trend (positive / neutral / negative per entry)
- Weekly reflection prompt generated from past entries
- Word cloud of most frequent concepts

**Surfaces:** Sidebar panel on journal pages. "Reflect" button triggers a weekly prompt.

**API shape:**
```
GET /api/v1/ai/journal-insights?workspace_id=...&days=30
→ { themes[], sentiment_trend[], reflection_prompt }
```

---

### 8. Smart Templates (AI-generated)
**What:** Instead of picking from a static list, the user describes what they need ("a weekly review for a software team") and the AI generates a BlockNote-compatible template on the fly.
**Surfaces:** "Generate template" option in the New Page modal.

**API shape:**
```
POST /api/v1/ai/generate-template
{ description, page_type }
→ { title, content: BlockNoteDoc }
```

**Why online-first:** Requires a capable generative model to produce structured BlockNote JSON.

---

### 9. Duplicate & Similarity Detection
**What:** Before saving a new page, check if a semantically similar page already exists. Show a banner "This looks similar to [Note X]" with a link.
**Surfaces:** Save hook on page editor. Also a standalone "Deduplicate" button in workspace settings.

**API shape:**
```
POST /api/v1/ai/find-similar
{ page_id, threshold: 0.85 }
→ { similar_pages: [{ page_id, title, score }] }
```

---

### 10. Note Health & Hygiene Score
**What:** A dashboard that scores each page on:
- **Staleness** — not updated in 30+ days
- **Orphan** — no links from any other page
- **Incomplete** — very short content relative to title
- **Broken links** — wikilinks pointing to deleted pages

**Surfaces:** "Workspace Health" view in settings. Color-coded scores per note.

**API shape:**
```
GET /api/v1/ai/health-report?workspace_id=...
→ { stale: [], orphans: [], incomplete: [], broken_links: [] }
```

---

### 11. Collaborative Write Assist (Real-time)
**What:** During live collaboration (Yjs socket), when a user is idle for 5 seconds, the AI ghost-suggests the next sentence (shown as greyed inline text, accept with Tab).
**Surfaces:** Live note editor — only for online-space pages.

**Implementation:** Frontend sends cursor position + surrounding text via a secondary WebSocket message. Backend returns a streaming token response.

**Why online-first:** Requires the Yjs WebSocket infra and server-side streaming.

---

### 12. AI-powered Note Links (Backlink Suggestions)
**What:** After saving a note, the backend finds existing notes that are topically related and suggests linking them via `[[wikilink]]`. User sees a "Suggested links" side panel with one-click insert.

**Surfaces:** Right panel on any note editor page.

**API shape:**
```
POST /api/v1/ai/suggest-links
{ page_id, top_k: 5 }
→ { suggestions: [{ target_page_id, title, reason, insert_text }] }
```

---

### 13. Temp Notes — Cloud Classification & Sync
**What:** Extend the existing temp-notes feature into the online space:
- Temp notes created on any device sync to the backend (`temp_notes` table with TTL column)
- Classification runs server-side using a stronger model, returning folder suggestion + confidence
- If confidence is low, a push notification / email asks the user to classify manually
- On "Keep", the temp note is promoted to a full online page

**API shape:**
```
POST /api/v1/ai/classify-temp-note
{ content, existing_folders[] }
→ { folder: string | null, confidence: "high"|"low"|"uncertain", tags[] }

POST /api/v1/temp-notes            # create (syncs across devices)
PATCH /api/v1/temp-notes/{id}/keep # promote to page
DELETE /api/v1/temp-notes/{id}     # delete
```

---

### 14. Smart Export
**What:** Convert any note or folder into a formatted document using AI to clean up structure, add a table of contents, and produce a coherent narrative. Export as Markdown, PDF, or email.

**Surfaces:** "Export with AI" option in the page action menu.

**API shape:**
```
POST /api/v1/ai/smart-export
{ page_id, format: "markdown"|"pdf"|"email", audience: "technical"|"executive" }
→ { content_url }
```

---

## Priority Order (Online Space)

| # | Feature | Value | Effort | Ship order |
|---|---|---|---|---|
| 1 | Semantic Cloud Search | High | Medium | P0 |
| 2 | Cloud Writing Assistant | High | Medium | P0 |
| 3 | Auto-tagging | High | Low | P0 |
| 4 | Meeting Intelligence | High | Medium | P1 |
| 5 | Temp Notes Cloud Classification & Sync | High | Medium | P1 |
| 6 | Note Health & Hygiene Score | Medium | Low | P1 |
| 7 | AI-powered Note Links | Medium | Medium | P2 |
| 8 | Contextual Team Q&A | Medium | High | P2 |
| 9 | Note Digest | Medium | Medium | P2 |
| 10 | Journal Insights | Medium | Medium | P2 |
| 11 | Smart Templates | Medium | Medium | P3 |
| 12 | Duplicate Detection | Low | Low | P3 |
| 13 | Collaborative Write Assist | High | High | P3 |
| 14 | Smart Export | Low | Medium | P3 |

---

## Offline Space — Existing AI Features (Reference)

These already exist in the Tauri / Rust / llama.cpp layer:

| Feature | Command | Description |
|---|---|---|
| Hybrid Search | `search_notes` | Vector + keyword search across local notes |
| RAG Chat | `rag_query` | Ask questions about local notes |
| Note Indexing | `index_note` | Chunk + embed a note for local search |
| Suggest Title | `ai_suggest_title` | Generate a title from note content |
| Summarize Note | `ai_summarize_note` | Summarise a note via local LLM |
| Complete Text | `ai_complete_text` | Continue writing from cursor |
| Improve Text | `ai_improve_text` | Rewrite selected text |
| Related Notes | `ai_find_related_notes` | Embedding-based similarity lookup |
| Auto-group Notes | `ai_group_notes_by_topic` | Cluster notes into topic folders |
| Temp Note Classify | `classifyNoteContent()` | Keyword-based folder suggestion (client JS) |
| LLM Management | `download_ai_model` etc. | Download/load/unload GGUF models |

**Default local model:** `TinyLlama-1.1B-Chat-v1.0-Q4_K_M.gguf` (~637 MB).
Upgradeable to Phi-3-Mini, Llama-3.2-3B, Qwen2.5-7B via the LLM settings panel.

---

## Implementation Notes

### Choosing a cloud model provider
- **Claude 3.5 Haiku** — fast, cheap, excellent for classification + tagging + extraction
- **Claude Sonnet 4.6** — best quality for writing assist, RAG answers, template generation
- **OpenAI text-embedding-3-small** — cheapest embeddings for pgvector; or use a self-hosted `nomic-embed` via Ollama

### Adding pgvector to the backend
```sql
CREATE EXTENSION IF NOT EXISTS vector;
ALTER TABLE pages ADD COLUMN embedding vector(1536);
CREATE INDEX ON pages USING ivfflat (embedding vector_cosine_ops);
```

### Background task pattern (FastAPI)
```python
from fastapi import BackgroundTasks

@pages_router.put("/{page_id}")
async def update_page(page_id, data, background_tasks: BackgroundTasks, db=Depends(get_db)):
    page = crud.update_page(db, page_id, data)
    background_tasks.add_task(run_ai_enrichment, page_id, db)
    return page
```

### Streaming responses (writing assist)
Use `StreamingResponse` with `text/event-stream` (SSE) so the frontend can show tokens as they arrive — same UX as Claude.ai.

---

*Last updated: 2026-03-10*
