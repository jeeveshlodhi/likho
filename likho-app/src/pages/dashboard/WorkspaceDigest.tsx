import { useState } from 'react';
import {
  FileText, Loader2, RefreshCw, Sparkles, Tag, Lightbulb,
  CheckSquare, AlertCircle, CalendarDays, BarChart3,
} from 'lucide-react';
import { CloudAiService, type DigestResponse, type DigestPeriod } from '@/lib/cloudAiService';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useAuthStore } from '@/store/authStore';

const PERIOD_OPTIONS: { value: DigestPeriod; label: string; description: string }[] = [
  { value: 'daily', label: 'Daily', description: 'Notes from the last 24 hours' },
  { value: 'weekly', label: 'Weekly', description: 'Notes from the last 7 days' },
];

function Section({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5 bg-muted/30">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="px-4 py-3">{children}</div>
    </div>
  );
}

export function WorkspaceDigest() {
  const { isAuthenticated, isGuest } = useAuthStore();
  const { data: workspace } = useWorkspace();
  const [digest, setDigest] = useState<DigestResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<DigestPeriod>('weekly');

  const isOnline = isAuthenticated && !isGuest;

  const generate = async () => {
    if (!workspace?.id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await CloudAiService.generateDigest({
        workspace_id: workspace.id,
        period,
      });
      setDigest(res);
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <BarChart3 size={18} className="text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Note Digest</h1>
              <p className="text-xs text-muted-foreground">
                AI summary of recent workspace activity
              </p>
            </div>
          </div>
          {digest && (
            <div className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs text-muted-foreground">
              <CalendarDays size={12} />
              {digest.period} · {digest.page_count} notes
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        {!isOnline && (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center">
            <Sparkles size={28} className="mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm font-medium text-foreground">Sign in to generate digests</p>
          </div>
        )}

        {isOnline && (
          <>
            {/* Controls */}
            <div className="flex items-center gap-3">
              <div className="flex flex-1 gap-1 rounded-xl bg-muted p-1">
                {PERIOD_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setPeriod(opt.value)}
                    className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                      period === opt.value
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <button
                onClick={generate}
                disabled={loading}
                className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {loading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : digest ? (
                  <RefreshCw size={14} />
                ) : (
                  <Sparkles size={14} />
                )}
                {digest ? 'Regenerate' : 'Generate'}
              </button>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
                <Loader2 size={24} className="animate-spin" />
                <p className="text-sm">Reading your notes…</p>
              </div>
            )}

            {digest && !loading && (
              <div className="space-y-3">
                {/* Summary */}
                <Section icon={<FileText size={14} />} label="Summary">
                  <p className="text-sm text-foreground leading-relaxed">{digest.summary}</p>
                </Section>

                {/* Themes */}
                {digest.themes.length > 0 && (
                  <Section icon={<Tag size={14} />} label="Key Themes">
                    <div className="flex flex-wrap gap-2">
                      {digest.themes.map((theme) => (
                        <span
                          key={theme}
                          className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                        >
                          {theme}
                        </span>
                      ))}
                    </div>
                  </Section>
                )}

                {/* Highlights */}
                {digest.highlights.length > 0 && (
                  <Section icon={<Lightbulb size={14} />} label="Highlights">
                    <ul className="space-y-2">
                      {digest.highlights.map((h, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                          {h}
                        </li>
                      ))}
                    </ul>
                  </Section>
                )}

                {/* Action Items */}
                {digest.action_items.length > 0 && (
                  <Section icon={<CheckSquare size={14} />} label="Action Items">
                    <ul className="space-y-1.5">
                      {digest.action_items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                          <input
                            type="checkbox"
                            className="mt-1 h-3.5 w-3.5 rounded accent-primary shrink-0"
                            readOnly
                          />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </Section>
                )}

                {digest.page_count === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-4">
                    No notes were updated in this period.
                  </p>
                )}
              </div>
            )}

            {!digest && !loading && (
              <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-10 text-center">
                <BarChart3 size={28} className="mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-sm font-medium text-foreground">Generate a digest</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {PERIOD_OPTIONS.find((o) => o.value === period)?.description}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
