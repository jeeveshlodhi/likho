/**
 * Cloud AI service — calls the FastAPI backend's /api/v1/ai/* and /temp-notes endpoints.
 * Requires the user to be authenticated (bearer token in localStorage).
 */
import { api } from '@/lib/api';

// ── Write Assist ──────────────────────────────────────────────────────────────

export type WriteAction =
  | 'improve'
  | 'expand'
  | 'summarize'
  | 'continue'
  | 'fix_grammar'
  | 'formal'
  | 'casual';

export interface WriteAssistRequest {
  content: string;
  selection?: string;
  action: WriteAction;
  page_type?: string;
}

export interface WriteAssistResponse {
  result: string;
  action: WriteAction;
}

// ── Auto-tagging ──────────────────────────────────────────────────────────────

export interface TagSuggestion {
  label: string;
  confidence: number;
}

export interface SuggestTagsRequest {
  title: string;
  content: string;
  existing_tags?: string[];
}

export interface SuggestTagsResponse {
  tags: TagSuggestion[];
}

// ── Meeting Intelligence ──────────────────────────────────────────────────────

export interface MeetingExtractRequest {
  content: string;
  title?: string;
}

export interface ActionItem {
  text: string;
  assignee?: string | null;
  due_date?: string | null;
}

export interface MeetingExtractResponse {
  action_items: ActionItem[];
  decisions: string[];
  open_questions: string[];
  attendees: string[];
  next_date: string | null;
}

// ── Temp Note Classification ──────────────────────────────────────────────────

export type TempNoteConfidence = 'high' | 'medium' | 'low' | 'uncertain';

export interface ClassifyTempNoteRequest {
  content: string;
  existing_folders?: string[];
}

export interface ClassifyTempNoteResponse {
  folder: string | null;
  confidence: TempNoteConfidence;
  tags: string[];
}

// ── Health Report ─────────────────────────────────────────────────────────────

export interface HealthReportItem {
  page_id: string;
  title: string;
  reason: string;
  updated_at: string | null;
}

export interface HealthReportResponse {
  stale: HealthReportItem[];
  orphans: HealthReportItem[];
  incomplete: HealthReportItem[];
  total_pages: number;
}

// ── AI Link Suggestions ───────────────────────────────────────────────────────

export interface SuggestLinksRequest {
  title: string;
  content: string;
  workspace_id: string;
  current_page_id?: string | null;
}

export interface LinkSuggestion {
  target_page_id: string;
  title: string;
  reason: string;
  insert_text: string;
}

export interface SuggestLinksResponse {
  suggestions: LinkSuggestion[];
}

// ── Workspace RAG ─────────────────────────────────────────────────────────────

export interface RagQueryRequest {
  workspace_id: string;
  question: string;
  top_k?: number;
}

export interface RagSource {
  page_id: string;
  title: string;
  excerpt: string;
}

export interface RagQueryResponse {
  answer: string;
  sources: RagSource[];
}

// ── Note Digest ───────────────────────────────────────────────────────────────

export type DigestPeriod = 'daily' | 'weekly';

export interface DigestRequest {
  workspace_id: string;
  period: DigestPeriod;
}

export interface DigestResponse {
  period: string;
  summary: string;
  themes: string[];
  highlights: string[];
  action_items: string[];
  page_count: number;
}

// ── Journal Insights ──────────────────────────────────────────────────────────

export interface JournalTheme {
  label: string;
  count: number;
}

export interface SentimentEntry {
  date: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  note: string;
}

export interface JournalInsightsResponse {
  themes: JournalTheme[];
  sentiment_trend: SentimentEntry[];
  reflection_prompt: string;
  entry_count: number;
}

// ── Brainstorm Expansion ──────────────────────────────────────────────────────

export interface ExpandBrainstormRequest {
  node_title: string;
  node_type: string;
  canvas_context?: string; // other node titles for context
}

export interface BrainstormIdea {
  title: string;
  type: string; // idea | question | task | note | risk
}

export interface ExpandBrainstormResponse {
  ideas: BrainstormIdea[];
}

// ── Journal Summary ───────────────────────────────────────────────────────────

export interface JournalSummaryRequest {
  content: string;
  date: string;
  title?: string;
}

export interface JournalSummaryResponse {
  summary: string;
  mood_insight: string;
  productivity_feedback: string;
  tomorrow_suggestions: string[];
}

// ── Project Planning ──────────────────────────────────────────────────────────

export interface PlanProjectRequest {
  title: string;
  context: string; // description + goals + dates as text
}

export interface PlanProjectTask {
  title: string;
  priority: string;
  due_date?: string;
}

export interface PlanProjectMilestone {
  title: string;
  due_date?: string;
}

export interface PlanProjectResponse {
  plan: string;
  tasks: PlanProjectTask[];
  milestones: PlanProjectMilestone[];
}

// ── Cloud Temp Notes (sync) ───────────────────────────────────────────────────

export interface CloudTempNoteCreate {
  id?: string;
  content: string;
  expires_at: string;
  is_permanent?: boolean;
  suggested_folder?: string | null;
  ai_confidence?: string | null;
  tags?: string[];
}

export interface CloudTempNoteOut {
  id: string;
  content: string;
  expires_at: string;
  is_permanent: boolean;
  suggested_folder: string | null;
  ai_confidence: string | null;
  tags: string[];
  created_at: string;
}

// ── Service ───────────────────────────────────────────────────────────────────

export const CloudAiService = {
  async writeAssist(req: WriteAssistRequest): Promise<WriteAssistResponse> {
    const { data } = await api.post<WriteAssistResponse>('/ai/write-assist', req);
    return data;
  },

  async suggestTags(req: SuggestTagsRequest): Promise<SuggestTagsResponse> {
    const { data } = await api.post<SuggestTagsResponse>('/ai/suggest-tags', req);
    return data;
  },

  async meetingExtract(req: MeetingExtractRequest): Promise<MeetingExtractResponse> {
    const { data } = await api.post<MeetingExtractResponse>('/ai/meeting-extract', req);
    return data;
  },

  async classifyTempNote(req: ClassifyTempNoteRequest): Promise<ClassifyTempNoteResponse> {
    const { data } = await api.post<ClassifyTempNoteResponse>('/ai/classify-temp-note', req);
    return data;
  },

  async healthReport(workspaceId: string): Promise<HealthReportResponse> {
    const { data } = await api.get<HealthReportResponse>('/ai/health-report', {
      params: { workspace_id: workspaceId },
    });
    return data;
  },

  async suggestLinks(req: SuggestLinksRequest): Promise<SuggestLinksResponse> {
    const { data } = await api.post<SuggestLinksResponse>('/ai/suggest-links', req);
    return data;
  },

  async ragQuery(req: RagQueryRequest): Promise<RagQueryResponse> {
    const { data } = await api.post<RagQueryResponse>('/ai/rag-query', req);
    return data;
  },

  async generateDigest(req: DigestRequest): Promise<DigestResponse> {
    const { data } = await api.post<DigestResponse>('/ai/digest', req);
    return data;
  },

  async journalInsights(workspaceId: string): Promise<JournalInsightsResponse> {
    const { data } = await api.get<JournalInsightsResponse>('/ai/journal-insights', {
      params: { workspace_id: workspaceId },
    });
    return data;
  },

  async planProject(req: PlanProjectRequest): Promise<PlanProjectResponse> {
    const { data } = await api.post<PlanProjectResponse>('/ai/plan-project', req);
    return data;
  },

  async summarizeJournal(req: JournalSummaryRequest): Promise<JournalSummaryResponse> {
    const { data } = await api.post<JournalSummaryResponse>('/ai/journal-summary', req);
    return data;
  },

  async expandBrainstormNode(req: ExpandBrainstormRequest): Promise<ExpandBrainstormResponse> {
    const { data } = await api.post<ExpandBrainstormResponse>('/ai/expand-brainstorm', req);
    return data;
  },
};

export const CloudTempNotesService = {
  async list(): Promise<CloudTempNoteOut[]> {
    const { data } = await api.get<CloudTempNoteOut[]>('/temp-notes/');
    return data;
  },

  async sync(note: CloudTempNoteCreate): Promise<CloudTempNoteOut> {
    const { data } = await api.post<CloudTempNoteOut>('/temp-notes/', note);
    return data;
  },

  async keep(noteId: string): Promise<CloudTempNoteOut> {
    const { data } = await api.patch<CloudTempNoteOut>(`/temp-notes/${noteId}/keep`);
    return data;
  },

  async remove(noteId: string): Promise<void> {
    await api.delete(`/temp-notes/${noteId}`);
  },

  async purgeExpired(): Promise<{ deleted: number }> {
    const { data } = await api.delete<{ deleted: number }>('/temp-notes/');
    return data;
  },
};

export default CloudAiService;
