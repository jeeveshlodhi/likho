import { useState } from 'react';
import { Tag, Loader2, RefreshCw, Check, X, Sparkles } from 'lucide-react';
import { CloudAiService } from '@/lib/cloudAiService';
import { useNoteMetaStore } from '@/store/noteMetaStore';
import { useAuthStore } from '@/store/authStore';

interface Props {
  noteId: string;
  title: string;
  /** Plain-text content for classification */
  contentText: string;
}

const CONFIDENCE_COLORS: Record<string, string> = {
  high:   'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  low:    'bg-muted text-muted-foreground',
};

function confidenceLevel(score: number) {
  if (score >= 0.8) return 'high';
  if (score >= 0.55) return 'medium';
  return 'low';
}

export function AutoTagPanel({ noteId, title, contentText }: Props) {
  const { isAuthenticated, isGuest } = useAuthStore();
  const { setAiTags, acceptTag, rejectTag, getMeta } = useNoteMetaStore();
  const meta = getMeta(noteId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOnline = isAuthenticated && !isGuest;

  const classify = async () => {
    if (!isOnline) return;
    setLoading(true);
    setError(null);
    try {
      const res = await CloudAiService.suggestTags({
        title,
        content: contentText.slice(0, 3000),
        existing_tags: meta?.acceptedTags ?? [],
      });
      setAiTags(noteId, res.tags);
    } catch (e: any) {
      const msg = e?.response?.data?.detail ?? e?.message ?? String(e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const pendingTags = (meta?.aiTags ?? []).filter(
    (t) => !meta?.acceptedTags.includes(t.label)
  );
  const accepted = meta?.acceptedTags ?? [];

  if (!isOnline) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/30 px-3 py-4 text-center">
        <Tag size={18} className="mx-auto mb-2 text-muted-foreground/50" />
        <p className="text-xs text-muted-foreground">
          Auto-tagging requires sign-in.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Accepted tags */}
      {accepted.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {accepted.map((label) => (
            <span
              key={label}
              className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary"
            >
              <Tag size={9} />
              {label}
            </span>
          ))}
        </div>
      )}

      {/* Pending suggestions */}
      {pendingTags.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <Sparkles size={10} />
            Suggested
          </p>
          <div className="flex flex-col gap-1">
            {pendingTags.map((tag) => {
              const level = confidenceLevel(tag.confidence);
              return (
                <div
                  key={tag.label}
                  className="flex items-center justify-between rounded-lg border border-border bg-card px-2.5 py-1.5"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${CONFIDENCE_COLORS[level]}`}
                    >
                      {tag.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {Math.round(tag.confidence * 100)}%
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => acceptTag(noteId, tag.label)}
                      className="rounded-md p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                      title="Accept"
                    >
                      <Check size={11} />
                    </button>
                    <button
                      onClick={() => rejectTag(noteId, tag.label)}
                      className="rounded-md p-1 text-muted-foreground hover:bg-accent transition-colors"
                      title="Reject"
                    >
                      <X size={11} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}

      {/* Classify button */}
      <button
        onClick={classify}
        disabled={loading || !contentText.trim()}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-primary/40 py-2 text-xs font-medium text-primary hover:bg-primary/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <RefreshCw size={12} />
        )}
        {loading ? 'Classifying…' : meta?.classifiedAt ? 'Re-classify' : 'Suggest Tags'}
      </button>
    </div>
  );
}
