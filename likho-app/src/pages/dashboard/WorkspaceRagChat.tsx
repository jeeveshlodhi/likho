import { useState, useRef, useEffect } from 'react';
import {
  Send, Loader2, Bot, User, FileText,
  MessageSquare, ExternalLink, Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { CloudAiService, type RagQueryResponse, type RagSource } from '@/lib/cloudAiService';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useAuthStore } from '@/store/authStore';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: RagSource[];
  loading?: boolean;
}

function SourceChip({ source }: { source: RagSource }) {
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

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className={`shrink-0 flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium mt-0.5
        ${isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
        {isUser ? <User size={13} /> : <Bot size={13} />}
      </div>

      {/* Bubble */}
      <div className={`max-w-[85%] space-y-2 ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed
          ${isUser
            ? 'bg-primary text-primary-foreground rounded-tr-sm'
            : 'bg-muted text-foreground rounded-tl-sm'
          }`}>
          {msg.loading ? (
            <span className="flex items-center gap-2 text-muted-foreground">
              <Loader2 size={13} className="animate-spin" />
              Searching your notes…
            </span>
          ) : (
            msg.content
          )}
        </div>

        {/* Sources */}
        {msg.sources && msg.sources.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <span className="text-[10px] text-muted-foreground self-center">From:</span>
            {msg.sources.map((s) => (
              <SourceChip key={s.page_id} source={s} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const SUGGESTED_QUESTIONS = [
  'What are my open action items?',
  'Summarise my recent project notes',
  'What decisions have I made this month?',
  'What topics appear most in my notes?',
];

export function WorkspaceRagChat() {
  const { isAuthenticated, isGuest } = useAuthStore();
  const { data: workspace } = useWorkspace();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const isOnline = isAuthenticated && !isGuest;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (question: string) => {
    if (!question.trim() || !workspace?.id || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: question.trim(),
    };
    const loadingMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      loading: true,
    };

    setMessages((prev) => [...prev, userMsg, loadingMsg]);
    setInput('');
    setLoading(true);

    try {
      const res: RagQueryResponse = await CloudAiService.ragQuery({
        workspace_id: workspace.id,
        question: question.trim(),
        top_k: 5,
      });

      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingMsg.id
            ? { ...m, content: res.answer, sources: res.sources, loading: false }
            : m
        )
      );
    } catch (e: any) {
      const errMsg = e?.response?.data?.detail ?? e?.message ?? 'Something went wrong.';
      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingMsg.id
            ? { ...m, content: `Error: ${errMsg}`, loading: false }
            : m
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="shrink-0 border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <MessageSquare size={18} className="text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Ask Your Notes</h1>
            <p className="text-xs text-muted-foreground">
              Ask questions — Claude answers from your workspace notes
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {!isOnline && (
          <div className="flex flex-col items-center justify-center gap-3 h-full text-center py-16">
            <Bot size={36} className="text-muted-foreground/30" />
            <p className="text-sm font-medium text-foreground">Sign in to chat with your notes</p>
            <p className="text-xs text-muted-foreground">
              Workspace Q&A requires cloud access.
            </p>
          </div>
        )}

        {isOnline && messages.length === 0 && (
          <div className="flex flex-col items-center gap-6 py-12">
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <Sparkles size={24} className="text-primary" />
              </div>
              <p className="text-sm font-semibold text-foreground">Chat with your notes</p>
              <p className="text-xs text-muted-foreground text-center max-w-sm">
                Ask anything about your workspace — Claude searches your notes and answers with citations.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2 w-full max-w-sm">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="rounded-xl border border-border bg-card px-4 py-2.5 text-left text-sm text-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {isOnline && (
        <div className="shrink-0 border-t border-border px-6 py-3">
          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about your notes…"
              rows={1}
              disabled={loading}
              className="flex-1 resize-none rounded-xl border border-input bg-background px-4 py-2.5 text-sm leading-relaxed placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50 min-h-[42px] max-h-32"
              style={{ height: 'auto' }}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = 'auto';
                el.style.height = Math.min(el.scrollHeight, 128) + 'px';
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </form>
          <p className="mt-1.5 text-[10px] text-muted-foreground text-center">
            Enter ↵ to send · Shift+Enter for new line
          </p>
        </div>
      )}
    </div>
  );
}
