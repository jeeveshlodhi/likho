import { useState } from 'react';
import {
  Loader2, RefreshCw, Tag, TrendingUp,
  MessageSquare, AlertCircle, Sparkles,
} from 'lucide-react';
import { CloudAiService, type JournalInsightsResponse, type JournalTheme, type SentimentEntry } from '@/lib/cloudAiService';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useAuthStore } from '@/store/authStore';

const SENTIMENT_STYLES = {
  positive: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  neutral: 'bg-muted text-muted-foreground',
  negative: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
} as const;

const SENTIMENT_DOT = {
  positive: 'bg-emerald-500',
  neutral: 'bg-muted-foreground',
  negative: 'bg-red-500',
} as const;

function ThemePill({ theme }: { theme: JournalTheme }) {
  return (
    <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
      <Tag size={9} />
      {theme.label}
      <span className="rounded-full bg-primary/20 px-1 text-[9px]">{theme.count}</span>
    </span>
  );
}

function SentimentRow({ entry }: { entry: SentimentEntry }) {
  return (
    <div className="flex items-start gap-2 py-1">
      <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${SENTIMENT_DOT[entry.sentiment]}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground">{entry.date}</span>
          <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${SENTIMENT_STYLES[entry.sentiment]}`}>
            {entry.sentiment}
          </span>
        </div>
        {entry.note && (
          <p className="text-xs text-foreground mt-0.5 leading-snug">{entry.note}</p>
        )}
      </div>
    </div>
  );
}

export function JournalInsightsPanel() {
  const { isAuthenticated, isGuest } = useAuthStore();
  const { data: workspace } = useWorkspace();
  const [result, setResult] = useState<JournalInsightsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOnline = isAuthenticated && !isGuest;

  const analyze = async () => {
    if (!isOnline || !workspace?.id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await CloudAiService.journalInsights(workspace.id);
      setResult(res);
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
        <p className="text-xs text-muted-foreground">Sign in to analyse journal patterns.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Analyse button */}
      <button
        onClick={analyze}
        disabled={loading}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-primary/40 py-2 text-xs font-medium text-primary hover:bg-primary/5 disabled:opacity-40 transition-colors"
      >
        {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
        {loading ? 'Analysing…' : result ? 'Re-analyse' : 'Analyse Journal Patterns'}
      </button>

      {error && (
        <div className="flex items-start gap-1.5 rounded-lg bg-destructive/10 px-2.5 py-2 text-xs text-destructive">
          <AlertCircle size={12} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {result && result.entry_count === 0 && (
        <p className="text-center text-xs text-muted-foreground py-2">
          No journal entries found in this workspace yet.
        </p>
      )}

      {result && result.entry_count > 0 && (
        <div className="space-y-4">
          {/* Entry count */}
          <p className="text-[11px] text-muted-foreground text-center">
            Based on {result.entry_count} journal {result.entry_count === 1 ? 'entry' : 'entries'}
          </p>

          {/* Themes */}
          {result.themes.length > 0 && (
            <div>
              <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <Tag size={10} />
                Recurring Themes
              </div>
              <div className="flex flex-wrap gap-1.5">
                {result.themes.map((t) => (
                  <ThemePill key={t.label} theme={t} />
                ))}
              </div>
            </div>
          )}

          {/* Sentiment trend */}
          {result.sentiment_trend.length > 0 && (
            <div>
              <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <TrendingUp size={10} />
                Sentiment Trend
              </div>
              <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
                {result.sentiment_trend.slice(0, 8).map((e, i) => (
                  <div key={i} className="px-3">
                    <SentimentRow entry={e} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reflection prompt */}
          {result.reflection_prompt && (
            <div className="rounded-xl bg-primary/5 border border-primary/20 px-3 py-3">
              <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                <MessageSquare size={10} />
                Reflection Prompt
              </div>
              <p className="text-sm text-foreground leading-relaxed italic">
                "{result.reflection_prompt}"
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
