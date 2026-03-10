import { useState } from 'react';
import {
  Sparkles, Loader2, RefreshCw, Users, CheckSquare,
  Lightbulb, HelpCircle, CalendarDays, AlertCircle,
} from 'lucide-react';
import { CloudAiService, type MeetingExtractResponse, type ActionItem } from '@/lib/cloudAiService';
import { useAuthStore } from '@/store/authStore';

interface Props {
  noteTitle?: string;
  contentText: string;
}

function ActionItemRow({ item }: { item: ActionItem }) {
  const [done, setDone] = useState(false);
  return (
    <label
      className={`flex items-start gap-2 cursor-pointer group py-1 ${done ? 'opacity-50' : ''}`}
    >
      <input
        type="checkbox"
        checked={done}
        onChange={() => setDone((v) => !v)}
        className="mt-0.5 h-3.5 w-3.5 rounded accent-primary shrink-0"
      />
      <div className="flex-1 min-w-0">
        <span className={`text-xs leading-snug ${done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
          {item.text}
        </span>
        {(item.assignee || item.due_date) && (
          <div className="flex gap-2 mt-0.5 text-[10px] text-muted-foreground">
            {item.assignee && <span>@{item.assignee}</span>}
            {item.due_date && <span>{item.due_date}</span>}
          </div>
        )}
      </div>
    </label>
  );
}

function Section({
  icon,
  label,
  children,
  count,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  count?: number;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
        {count !== undefined && (
          <span className="ml-auto rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-medium">
            {count}
          </span>
        )}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

export function MeetingInsightsPanel({ noteTitle = '', contentText }: Props) {
  const { isAuthenticated, isGuest } = useAuthStore();
  const [result, setResult] = useState<MeetingExtractResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOnline = isAuthenticated && !isGuest;

  const extract = async () => {
    if (!isOnline || !contentText.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await CloudAiService.meetingExtract({
        content: contentText,
        title: noteTitle,
      });
      setResult(res);
    } catch (e: any) {
      const msg = e?.response?.data?.detail ?? e?.message ?? String(e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOnline) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/30 px-3 py-4 text-center">
        <Sparkles size={18} className="mx-auto mb-2 text-muted-foreground/50" />
        <p className="text-xs text-muted-foreground">Meeting insights require sign-in.</p>
      </div>
    );
  }

  const hasResults = result && (
    result.action_items.length > 0 ||
    result.decisions.length > 0 ||
    result.open_questions.length > 0 ||
    result.attendees.length > 0 ||
    result.next_date
  );

  return (
    <div className="space-y-3">
      {/* Extract button */}
      <button
        onClick={extract}
        disabled={loading || !contentText.trim()}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-primary/40 py-2 text-xs font-medium text-primary hover:bg-primary/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <RefreshCw size={12} />
        )}
        {loading ? 'Extracting…' : result ? 'Re-extract Insights' : 'Extract Meeting Insights'}
      </button>

      {error && (
        <div className="flex items-start gap-1.5 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <AlertCircle size={12} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {result && !hasResults && (
        <p className="text-center text-xs text-muted-foreground py-2">
          No structured insights found. Try adding more content to the note.
        </p>
      )}

      {result && hasResults && (
        <div className="space-y-4">
          {result.attendees.length > 0 && (
            <Section icon={<Users size={10} />} label="Attendees" count={result.attendees.length}>
              <div className="flex flex-wrap gap-1">
                {result.attendees.map((a) => (
                  <span
                    key={a}
                    className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-foreground"
                  >
                    {a}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {result.action_items.length > 0 && (
            <Section icon={<CheckSquare size={10} />} label="Action Items" count={result.action_items.length}>
              <div className="space-y-1">
                {result.action_items.map((item, i) => (
                  <ActionItemRow key={i} item={item} />
                ))}
              </div>
            </Section>
          )}

          {result.decisions.length > 0 && (
            <Section icon={<Lightbulb size={10} />} label="Decisions" count={result.decisions.length}>
              <ul className="space-y-1">
                {result.decisions.map((d, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-foreground">
                    <span className="mt-1.5 h-1 w-1 rounded-full bg-emerald-500 shrink-0" />
                    {d}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {result.open_questions.length > 0 && (
            <Section icon={<HelpCircle size={10} />} label="Open Questions" count={result.open_questions.length}>
              <ul className="space-y-1">
                {result.open_questions.map((q, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-foreground">
                    <span className="mt-1.5 h-1 w-1 rounded-full bg-amber-500 shrink-0" />
                    {q}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {result.next_date && (
            <Section icon={<CalendarDays size={10} />} label="Next Meeting">
              <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                {result.next_date}
              </span>
            </Section>
          )}
        </div>
      )}
    </div>
  );
}
