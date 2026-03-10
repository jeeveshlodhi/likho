import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Link2, Loader2, RefreshCw, ExternalLink, Copy, Check, AlertCircle, Sparkles } from 'lucide-react';
import { CloudAiService, type LinkSuggestion } from '@/lib/cloudAiService';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useAuthStore } from '@/store/authStore';

interface Props {
  noteId: string;
  noteTitle: string;
  contentText: string;
}

function SuggestionCard({ suggestion }: { suggestion: LinkSuggestion }) {
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const copyLink = async () => {
    await navigator.clipboard.writeText(suggestion.insert_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-2.5 space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-foreground leading-snug truncate flex-1">
          {suggestion.title}
        </p>
        <div className="flex shrink-0 gap-1">
          <button
            onClick={() => navigate(`/dashboard/note/${suggestion.target_page_id}`)}
            title="Open note"
            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <ExternalLink size={12} />
          </button>
          <button
            onClick={copyLink}
            title={copied ? 'Copied!' : 'Copy [[wikilink]]'}
            className={`rounded-md p-1 transition-colors ${
              copied
                ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
          </button>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground leading-snug">{suggestion.reason}</p>
      <code className="block rounded-md bg-muted px-2 py-1 text-[10px] font-mono text-muted-foreground">
        {suggestion.insert_text}
      </code>
    </div>
  );
}

export function SuggestLinksPanel({ noteId, noteTitle, contentText }: Props) {
  const { isAuthenticated, isGuest } = useAuthStore();
  const { data: workspace } = useWorkspace();
  const [suggestions, setSuggestions] = useState<LinkSuggestion[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOnline = isAuthenticated && !isGuest;

  const findLinks = async () => {
    if (!isOnline || !workspace?.id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await CloudAiService.suggestLinks({
        title: noteTitle,
        content: contentText,
        workspace_id: workspace.id,
        current_page_id: noteId,
      });
      setSuggestions(res.suggestions);
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  if (!isOnline) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/30 px-3 py-4 text-center">
        <Sparkles size={16} className="mx-auto mb-1.5 text-muted-foreground/50" />
        <p className="text-xs text-muted-foreground">Sign in to find AI-suggested links.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <button
        onClick={findLinks}
        disabled={loading || !contentText.trim()}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-primary/40 py-2 text-xs font-medium text-primary hover:bg-primary/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
        {loading ? 'Finding links…' : suggestions ? 'Re-scan links' : 'Find AI-suggested links'}
      </button>

      {error && (
        <div className="flex items-start gap-1.5 rounded-lg bg-destructive/10 px-2.5 py-2 text-xs text-destructive">
          <AlertCircle size={12} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {suggestions !== null && suggestions.length === 0 && !loading && (
        <p className="text-center text-xs text-muted-foreground py-2">
          No strong link suggestions found. Add more content to get better results.
        </p>
      )}

      {suggestions && suggestions.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Link2 size={10} />
            Suggested Links
            <span className="ml-auto rounded-full bg-muted px-1.5 py-0.5 text-[9px]">
              {suggestions.length}
            </span>
          </div>
          {suggestions.map((s) => (
            <SuggestionCard key={s.target_page_id} suggestion={s} />
          ))}
        </div>
      )}
    </div>
  );
}
