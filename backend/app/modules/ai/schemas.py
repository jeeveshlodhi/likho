from pydantic import BaseModel
from typing import Literal


# ── Write Assist ──────────────────────────────────────────────────────────────

WriteAction = Literal[
    "improve",
    "expand",
    "summarize",
    "continue",
    "fix_grammar",
    "formal",
    "casual",
]


class WriteAssistRequest(BaseModel):
    content: str
    """Full note content as plain text (BlockNote blocks → joined text)."""
    selection: str | None = None
    """Selected text to act on (if any)."""
    action: WriteAction
    page_type: str = "note"


class WriteAssistResponse(BaseModel):
    result: str
    action: WriteAction


# ── Auto-tagging ──────────────────────────────────────────────────────────────


class SuggestTagsRequest(BaseModel):
    title: str
    content: str
    """Plain-text note content."""
    existing_tags: list[str] = []


class TagSuggestion(BaseModel):
    label: str
    confidence: float  # 0–1


class SuggestTagsResponse(BaseModel):
    tags: list[TagSuggestion]


# ── Semantic Search ───────────────────────────────────────────────────────────


class SemanticSearchRequest(BaseModel):
    query: str
    workspace_id: str
    limit: int = 10


class SemanticSearchResult(BaseModel):
    page_id: str
    title: str
    snippet: str
    score: float


class SemanticSearchResponse(BaseModel):
    results: list[SemanticSearchResult]


# ── Meeting Intelligence ──────────────────────────────────────────────────────


class MeetingExtractRequest(BaseModel):
    content: str
    """Plain-text meeting note content."""
    title: str = ""


class ActionItem(BaseModel):
    text: str
    assignee: str | None = None
    due_date: str | None = None


class MeetingExtractResponse(BaseModel):
    action_items: list[ActionItem] = []
    decisions: list[str] = []
    open_questions: list[str] = []
    attendees: list[str] = []
    next_date: str | None = None


# ── Temp Note Cloud Classification ───────────────────────────────────────────


class ClassifyTempNoteRequest(BaseModel):
    content: str
    existing_folders: list[str] = []


class ClassifyTempNoteResponse(BaseModel):
    folder: str | None = None
    confidence: Literal["high", "medium", "low", "uncertain"]
    tags: list[str] = []


# ── Note Health Report ────────────────────────────────────────────────────────


class HealthReportItem(BaseModel):
    page_id: str
    title: str
    reason: str
    updated_at: str | None = None


class HealthReportResponse(BaseModel):
    stale: list[HealthReportItem] = []
    orphans: list[HealthReportItem] = []
    incomplete: list[HealthReportItem] = []
    total_pages: int = 0


# ── AI Link Suggestions ───────────────────────────────────────────────────────


class SuggestLinksRequest(BaseModel):
    title: str
    content: str
    """Plain-text content of the current note."""
    workspace_id: str
    current_page_id: str | None = None


class LinkSuggestion(BaseModel):
    target_page_id: str
    title: str
    reason: str
    insert_text: str  # e.g. [[Page Title]]


class SuggestLinksResponse(BaseModel):
    suggestions: list[LinkSuggestion] = []


# ── Workspace RAG Q&A ─────────────────────────────────────────────────────────


class RagQueryRequest(BaseModel):
    workspace_id: str
    question: str
    top_k: int = 5


class RagSource(BaseModel):
    page_id: str
    title: str
    excerpt: str


class RagQueryResponse(BaseModel):
    answer: str
    sources: list[RagSource] = []


# ── Note Digest ───────────────────────────────────────────────────────────────


class DigestRequest(BaseModel):
    workspace_id: str
    period: Literal["daily", "weekly"] = "weekly"


class DigestResponse(BaseModel):
    period: str
    summary: str
    themes: list[str] = []
    highlights: list[str] = []
    action_items: list[str] = []
    page_count: int = 0


# ── Journal Insights ──────────────────────────────────────────────────────────


class JournalTheme(BaseModel):
    label: str
    count: int


class SentimentEntry(BaseModel):
    date: str
    sentiment: Literal["positive", "neutral", "negative"]
    note: str


class JournalInsightsResponse(BaseModel):
    themes: list[JournalTheme] = []
    sentiment_trend: list[SentimentEntry] = []
    reflection_prompt: str = ""
    entry_count: int = 0

# ── Project Planning ───────────────────────────────────────────────────────────


class PlanProjectRequest(BaseModel):
    title: str
    context: str
    """Project description, goals, and dates as plain text."""


class PlanProjectTask(BaseModel):
    title: str
    priority: str = "medium"  # urgent | high | medium | low
    due_date: str | None = None


class PlanProjectMilestone(BaseModel):
    title: str
    due_date: str | None = None


class PlanProjectResponse(BaseModel):
    plan: str
    tasks: list[PlanProjectTask] = []
    milestones: list[PlanProjectMilestone] = []

# ── Journal Summary ────────────────────────────────────────────────────────────


class JournalSummaryRequest(BaseModel):
    content: str
    """All journal sections joined as plain text."""
    date: str
    title: str = ""


class JournalSummaryResponse(BaseModel):
    summary: str
    mood_insight: str = ""
    productivity_feedback: str = ""
    tomorrow_suggestions: list[str] = []
