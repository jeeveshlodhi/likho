/**
 * Unified AI service that routes requests to the correct backend:
 *   claude-rag       – FastAPI backend (Claude Haiku + RAG over workspace notes)
 *   gemini-1.5-flash – Google Gemini API, streamed via SSE
 *   gemini-1.5-pro   – Google Gemini API, streamed via SSE
 *   local            – Tauri llama.cpp command
 */
import { api } from '@/lib/api';

export type AiModel = 'claude-rag' | 'gemini-1.5-flash' | 'gemini-1.5-pro' | 'local';

export const AI_MODEL_LABELS: Record<AiModel, string> = {
  'claude-rag': 'Claude (Workspace RAG)',
  'gemini-1.5-flash': 'Gemini 1.5 Flash',
  'gemini-1.5-pro': 'Gemini 1.5 Pro',
  'local': 'Local (llama.cpp)',
};

export const GEMINI_KEY_STORAGE = 'likho_gemini_api_key';

export function getGeminiApiKey(): string | null {
  return localStorage.getItem(GEMINI_KEY_STORAGE);
}
export function setGeminiApiKey(key: string) {
  localStorage.setItem(GEMINI_KEY_STORAGE, key);
}
export function clearGeminiApiKey() {
  localStorage.removeItem(GEMINI_KEY_STORAGE);
}

export interface AiChatRequest {
  prompt: string;
  model: AiModel;
  /** Plain-text content of the current note (optional context) */
  context?: string;
  /** Required for claude-rag */
  workspaceId?: string;
  /** Streaming token callback */
  onToken?: (token: string) => void;
  signal?: AbortSignal;
}

export interface AiChatResponse {
  text: string;
  model: AiModel;
  sources?: { page_id: string; title: string; excerpt: string }[];
}

// ── Gemini (streaming SSE) ────────────────────────────────────────────────────

async function callGemini(
  model: 'gemini-1.5-flash' | 'gemini-1.5-pro',
  prompt: string,
  context: string | undefined,
  onToken: ((token: string) => void) | undefined,
  signal: AbortSignal | undefined,
): Promise<string> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error(
      'Gemini API key not configured. Add it in AI Settings (⌘⇧L).',
    );
  }

  const systemText = context
    ? `You are a helpful AI assistant inside a note-taking workspace.\n\nCurrent note context:\n${context}\n\nUse this context to inform your responses when relevant.`
    : `You are a helpful AI assistant inside a note-taking workspace. Help the user write, think, and organise their notes. Respond in Markdown.`;

  const body = {
    system_instruction: { parts: [{ text: systemText }] },
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
  };

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini error ${res.status}: ${err}`);
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let full = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    for (const line of chunk.split('\n')) {
      if (!line.startsWith('data: ')) continue;
      const raw = line.slice(6).trim();
      if (!raw || raw === '[DONE]') continue;
      try {
        const parsed = JSON.parse(raw);
        const token: string =
          parsed?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        if (token) {
          full += token;
          onToken?.(token);
        }
      } catch {
        // malformed SSE frame — skip
      }
    }
  }

  return full;
}

// ── Local llama.cpp (Tauri) ───────────────────────────────────────────────────

async function callLocal(
  prompt: string,
  context: string | undefined,
  onToken: ((token: string) => void) | undefined,
  _signal: AbortSignal | undefined,
): Promise<string> {
  const { invoke } = await import('@tauri-apps/api/core');
  const fullPrompt = context
    ? `Context:\n${context}\n\nUser: ${prompt}\nAssistant:`
    : `User: ${prompt}\nAssistant:`;
  const result = await invoke<string>('generate_text', { prompt: fullPrompt });
  onToken?.(result);
  return result;
}

// ── Public API ────────────────────────────────────────────────────────────────

export const AiService = {
  async chat(req: AiChatRequest): Promise<AiChatResponse> {
    const { prompt, model, context, workspaceId, onToken, signal } = req;

    if (model === 'claude-rag') {
      if (!workspaceId) throw new Error('Workspace ID required for Claude RAG');
      const { data } = await api.post<{ answer: string; sources: any[] }>(
        '/ai/rag-query',
        { workspace_id: workspaceId, question: prompt, top_k: 5 },
        { signal },
      );
      onToken?.(data.answer);
      return { text: data.answer, model, sources: data.sources };
    }

    if (model === 'gemini-1.5-flash' || model === 'gemini-1.5-pro') {
      const text = await callGemini(model, prompt, context, onToken, signal);
      return { text, model };
    }

    if (model === 'local') {
      const text = await callLocal(prompt, context, onToken, signal);
      return { text, model };
    }

    throw new Error(`Unknown AI model: ${model}`);
  },
};

export default AiService;
