/**
 * AiChat – full-page AI assistant with:
 *   • Model selector (Claude RAG, Gemini 1.5 Flash/Pro, Local)
 *   • Streaming responses rendered as Markdown (tables, code, lists, etc.)
 *   • Per-message actions: Copy block · Insert into current note · Copy as MD
 *   • Context indicator when a note is open
 *   • Gemini API key settings inline
 *   • Keyboard: Enter to send, Shift+Enter for newline, Cmd+Enter to insert last response
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import {
  Send, Loader2, Bot, User, FileText, ExternalLink, Sparkles,
  Copy, Check, ChevronDown, Settings, Trash2, BookOpen, X,
  Zap, Globe, Cpu,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import {
  AiService, AI_MODEL_LABELS, getGeminiApiKey, setGeminiApiKey,
  type AiModel,
} from '@/lib/aiService';
import { useAiChatStore, type AiMessage } from '@/store/aiChatStore';
import { markdownToBlockNoteBlocks } from '@/lib/markdownToBlockNote';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useAuthStore } from '@/store/authStore';

// ── Constants ─────────────────────────────────────────────────────────────────

const MODEL_ICONS: Record<AiModel, React.ReactNode> = {
  'claude-rag': <BookOpen size={14} />,
  'gemini-1.5-flash': <Zap size={14} />,
  'gemini-1.5-pro': <Globe size={14} />,
  'local': <Cpu size={14} />,
};

const SUGGESTED_PROMPTS = [
  'What are my open action items?',
  'Summarise my recent project notes',
  'Write a weekly review template',
  'Explain the concept of atomic notes',
  'Draft a meeting agenda for a product review',
];

// ── Markdown renderer ─────────────────────────────────────────────────────────

function MdRenderer({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
      components={{
        // Tables
        table: ({ children }) => (
          <div className="overflow-x-auto my-3">
            <table className="min-w-full border-collapse text-sm">{children}</table>
          </div>
        ),
        thead: ({ children }) => <thead className="bg-muted">{children}</thead>,
        th: ({ children }) => (
          <th className="border border-border px-3 py-1.5 text-left font-medium">{children}</th>
        ),
        td: ({ children }) => (
          <td className="border border-border px-3 py-1.5">{children}</td>
        ),
        // Code blocks
        pre: ({ children }) => (
          <pre className="rounded-lg bg-zinc-900 text-zinc-100 p-3 my-3 overflow-x-auto text-xs leading-relaxed">
            {children}
          </pre>
        ),
        code: ({ className, children, ...props }) => {
          // Inline code
          const isBlock = !!className;
          if (!isBlock) {
            return (
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono" {...props}>
                {children}
              </code>
            );
          }
          return <code className={className} {...props}>{children}</code>;
        },
        // Blockquote
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-primary/40 pl-3 my-2 text-muted-foreground italic">
            {children}
          </blockquote>
        ),
        // Headings
        h1: ({ children }) => <h1 className="text-xl font-bold mt-4 mb-2">{children}</h1>,
        h2: ({ children }) => <h2 className="text-lg font-semibold mt-3 mb-1.5">{children}</h2>,
        h3: ({ children }) => <h3 className="text-base font-semibold mt-2 mb-1">{children}</h3>,
        // Lists
        ul: ({ children }) => <ul className="list-disc list-inside space-y-0.5 my-1.5">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside space-y-0.5 my-1.5">{children}</ol>,
        li: ({ children }) => <li className="text-sm">{children}</li>,
        // Links
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer"
            className="text-primary underline underline-offset-2 hover:text-primary/80">
            {children}
          </a>
        ),
        // Paragraphs
        p: ({ children }) => <p className="my-1 leading-relaxed">{children}</p>,
        // Horizontal rule
        hr: () => <hr className="my-3 border-border" />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

// ── Source chip ───────────────────────────────────────────────────────────────

function SourceChip({ source }: { source: { page_id: string; title: string } }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(`/dashboard/note/${source.page_id}`)}
      className="flex items-center gap-1 rounded-full border border-border bg-muted/60 px-2.5 py-1 text-xs text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
    >
      <FileText size={10} />
      <span className="max-w-[120px] truncate">{source.title}</span>
      <ExternalLink size={9} />
    </button>
  );
}

// ── Message block ─────────────────────────────────────────────────────────────

function MessageBlock({
  msg,
  onInsertIntoNote,
}: {
  msg: AiMessage;
  onInsertIntoNote: (content: string) => void;
}) {
  const isUser = msg.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className={`group flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div
        className={`shrink-0 flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium mt-0.5
          ${isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white'
          }`}
      >
        {isUser ? <User size={13} /> : <Bot size={13} />}
      </div>

      <div className={`max-w-[85%] flex flex-col gap-1.5 ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Content */}
        <div
          className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed
            ${isUser
              ? 'bg-primary text-primary-foreground rounded-tr-sm'
              : 'bg-muted text-foreground rounded-tl-sm'
            }`}
        >
          {msg.loading ? (
            <span className="flex items-center gap-2 text-muted-foreground">
              <Loader2 size={13} className="animate-spin" />
              <span className="text-xs">Thinking…</span>
            </span>
          ) : isUser ? (
            <span className="whitespace-pre-wrap">{msg.content}</span>
          ) : (
            <div className="prose-sm max-w-none">
              <MdRenderer content={msg.content} />
            </div>
          )}
        </div>

        {/* Actions (assistant only, visible on hover) */}
        {!isUser && !msg.loading && msg.content && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleCopy}
              title="Copy response"
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              {copied ? <Check size={11} className="text-green-500" /> : <Copy size={11} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              onClick={() => onInsertIntoNote(msg.content)}
              title="Insert into current note (⌘↩)"
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <FileText size={11} />
              Insert into note
            </button>
          </div>
        )}

        {/* Sources */}
        {msg.sources && msg.sources.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-0.5">
            <span className="text-[10px] text-muted-foreground self-center">Sources:</span>
            {msg.sources.map((s) => (
              <SourceChip key={s.page_id} source={s} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Model selector ────────────────────────────────────────────────────────────

function ModelSelector({ value, onChange }: { value: AiModel; onChange: (m: AiModel) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const models: AiModel[] = ['gemini-1.5-flash', 'gemini-1.5-pro', 'claude-rag', 'local'];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground hover:bg-accent transition-colors"
      >
        {MODEL_ICONS[value]}
        <span className="max-w-[130px] truncate">{AI_MODEL_LABELS[value]}</span>
        <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-52 rounded-xl border border-border bg-popover shadow-lg overflow-hidden">
          {models.map((m) => (
            <button
              key={m}
              onClick={() => { onChange(m); setOpen(false); }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-accent transition-colors
                ${m === value ? 'bg-primary/10 text-primary font-medium' : 'text-foreground'}`}
            >
              {MODEL_ICONS[m]}
              {AI_MODEL_LABELS[m]}
              {m === value && <Check size={11} className="ml-auto" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Gemini key settings ───────────────────────────────────────────────────────

function GeminiKeyInput({ onClose }: { onClose: () => void }) {
  const [value, setValue] = useState(() => getGeminiApiKey() ?? '');
  const [saved, setSaved] = useState(false);

  const save = () => {
    if (value.trim()) {
      setGeminiApiKey(value.trim());
      setSaved(true);
      setTimeout(() => { setSaved(false); onClose(); }, 800);
    }
  };

  return (
    <div className="mx-6 mb-3 rounded-xl border border-border bg-muted/50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium text-foreground">Gemini API Key</p>
        <button onClick={onClose} className="rounded p-0.5 hover:bg-accent">
          <X size={13} className="text-muted-foreground" />
        </button>
      </div>
      <div className="flex gap-2">
        <input
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && save()}
          placeholder="AIza…"
          className="flex-1 rounded-lg border border-input bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        <button
          onClick={save}
          className="rounded-lg bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {saved ? <Check size={13} /> : 'Save'}
        </button>
      </div>
      <p className="mt-1.5 text-[10px] text-muted-foreground">
        Get your key at <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="underline">aistudio.google.com</a>
      </p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function AiChat({ compact = false }: { compact?: boolean }) {
  const { isAuthenticated, isGuest } = useAuthStore();
  const { data: workspace } = useWorkspace();
  const isOnline = isAuthenticated && !isGuest;

  const {
    messages, selectedModel, noteContext, noteContextTitle,
    addMessage, updateMessage, clearMessages, setModel,
  } = useAiChatStore();

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /** Dispatch a custom DOM event so NoteEditor can insert blocks */
  const insertIntoNote = useCallback((markdown: string) => {
    const blocks = markdownToBlockNoteBlocks(markdown);
    window.dispatchEvent(
      new CustomEvent('ai:insert-content', { detail: { blocks } }),
    );
  }, []);

  const needsGeminiKey =
    (selectedModel === 'gemini-1.5-flash' || selectedModel === 'gemini-1.5-pro') &&
    !getGeminiApiKey();

  const sendMessage = async (question: string) => {
    if (!question.trim() || loading) return;
    if (selectedModel === 'claude-rag' && !isOnline) return;
    if (needsGeminiKey) { setShowKeyInput(true); return; }

    const userMsg: AiMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: question.trim(),
      model: selectedModel,
    };
    const assistantId = `a-${Date.now() + 1}`;
    const loadingMsg: AiMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      model: selectedModel,
      loading: true,
    };

    addMessage(userMsg);
    addMessage(loadingMsg);
    setInput('');
    setLoading(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const ac = new AbortController();
    setAbortController(ac);

    let streamedContent = '';

    try {
      await AiService.chat({
        prompt: question.trim(),
        model: selectedModel,
        context: noteContext ?? undefined,
        workspaceId: workspace?.id,
        signal: ac.signal,
        onToken: (token) => {
          streamedContent += token;
          updateMessage(assistantId, {
            content: streamedContent,
            loading: false,
          });
        },
      });
    } catch (e: any) {
      if (e?.name === 'AbortError') return;
      const errText = e?.message ?? 'Something went wrong.';
      updateMessage(assistantId, {
        content: `**Error:** ${errText}`,
        loading: false,
        error: true,
      });
    } finally {
      setLoading(false);
      setAbortController(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Cmd+Enter inserts last assistant response into note
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      const last = [...messages].reverse().find((m) => m.role === 'assistant' && m.content);
      if (last) insertIntoNote(last.content);
      return;
    }
    // Enter to send, Shift+Enter for newline
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const stopGeneration = () => {
    abortController?.abort();
    setLoading(false);
    setAbortController(null);
  };

  const isGeminiModel = selectedModel === 'gemini-1.5-flash' || selectedModel === 'gemini-1.5-pro';
  const canSend = input.trim() && !loading &&
    (selectedModel !== 'claude-rag' || isOnline) &&
    (!isGeminiModel || !!getGeminiApiKey());

  return (
    <div className={`flex h-full flex-col bg-background ${compact ? '' : ''}`}>
      {/* Header */}
      <div className={`shrink-0 border-b border-border ${compact ? 'px-3 py-2' : 'px-6 py-3'}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600">
              <Sparkles size={15} className="text-white" />
            </div>
            {!compact && (
              <div>
                <h1 className="text-sm font-semibold text-foreground leading-none">Ask AI</h1>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Chat with Gemini, Claude, or your local model
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <ModelSelector value={selectedModel} onChange={setModel} />

            {isGeminiModel && (
              <button
                onClick={() => setShowKeyInput((v) => !v)}
                title="Gemini API key"
                className={`rounded-lg p-1.5 transition-colors
                  ${showKeyInput ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground'}`}
              >
                <Settings size={14} />
              </button>
            )}

            {messages.length > 0 && (
              <button
                onClick={clearMessages}
                title="Clear conversation"
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Note context indicator */}
        {noteContextTitle && (
          <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-primary/8 px-2.5 py-1.5">
            <FileText size={12} className="text-primary shrink-0" />
            <span className="text-[11px] text-primary truncate">
              Context: {noteContextTitle}
            </span>
          </div>
        )}
      </div>

      {/* API key input */}
      {showKeyInput && (
        <GeminiKeyInput onClose={() => setShowKeyInput(false)} />
      )}

      {/* Messages */}
      <div className={`flex-1 overflow-y-auto space-y-4 ${compact ? 'px-3 py-3' : 'px-6 py-4'}`}>
        {/* Auth gate for Claude RAG */}
        {selectedModel === 'claude-rag' && !isOnline && (
          <div className="flex flex-col items-center justify-center gap-3 h-full text-center py-16">
            <Bot size={36} className="text-muted-foreground/30" />
            <p className="text-sm font-medium text-foreground">Sign in to use Claude RAG</p>
            <p className="text-xs text-muted-foreground">Claude workspace Q&A requires cloud access.</p>
          </div>
        )}

        {/* Gemini key missing */}
        {isGeminiModel && needsGeminiKey && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 h-full text-center py-16">
            <Settings size={32} className="text-muted-foreground/30" />
            <p className="text-sm font-medium text-foreground">Gemini API key required</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Add your Gemini API key using the ⚙ settings button above.
            </p>
            <button
              onClick={() => setShowKeyInput(true)}
              className="rounded-lg bg-primary px-4 py-2 text-xs text-primary-foreground hover:bg-primary/90"
            >
              Add API Key
            </button>
          </div>
        )}

        {/* Empty state */}
        {messages.length === 0 && (selectedModel !== 'claude-rag' || isOnline) && !needsGeminiKey && (
          <div className={`flex flex-col items-center gap-5 ${compact ? 'py-6' : 'py-10'}`}>
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600">
                <Sparkles size={22} className="text-white" />
              </div>
              <p className="text-sm font-semibold text-foreground">What can I help you with?</p>
              {noteContextTitle && (
                <p className="text-xs text-muted-foreground text-center max-w-xs">
                  I have context from <strong>{noteContextTitle}</strong>
                </p>
              )}
            </div>
            <div className={`grid gap-2 w-full ${compact ? 'max-w-full' : 'max-w-sm'}`}>
              {SUGGESTED_PROMPTS.slice(0, compact ? 3 : 5).map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="rounded-xl border border-border bg-card px-3 py-2.5 text-left text-xs text-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message list */}
        {messages.map((msg) => (
          <MessageBlock key={msg.id} msg={msg} onInsertIntoNote={insertIntoNote} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className={`shrink-0 border-t border-border ${compact ? 'px-3 py-2' : 'px-6 py-3'}`}>
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              selectedModel === 'claude-rag'
                ? 'Ask about your notes…'
                : 'Ask anything…'
            }
            rows={1}
            disabled={loading && !abortController}
            className="flex-1 resize-none rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm leading-relaxed placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50 min-h-[40px] max-h-32"
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = 'auto';
              el.style.height = Math.min(el.scrollHeight, 128) + 'px';
            }}
          />
          {loading ? (
            <button
              onClick={stopGeneration}
              title="Stop generation"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground hover:bg-accent transition-colors"
            >
              <div className="h-3.5 w-3.5 rounded-sm bg-current" />
            </button>
          ) : (
            <button
              onClick={() => sendMessage(input)}
              disabled={!canSend}
              title="Send (Enter)"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors"
            >
              <Send size={15} />
            </button>
          )}
        </div>
        <p className="mt-1.5 text-[10px] text-muted-foreground text-center">
          Enter ↵ send · Shift+Enter newline · ⌘↩ insert into note
        </p>
      </div>
    </div>
  );
}

export default AiChat;
