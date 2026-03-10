import { useState } from 'react';
import {
  Activity, Clock, Network, FileText,
  Loader2, RefreshCw, AlertCircle, CheckCircle2,
  ChevronDown, ChevronRight,
} from 'lucide-react';
import { CloudAiService, type HealthReportResponse, type HealthReportItem } from '@/lib/cloudAiService';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useAuthStore } from '@/store/authStore';
import { formatDistanceToNow, parseISO } from 'date-fns';

interface CategoryProps {
  icon: React.ReactNode;
  label: string;
  color: string;
  items: HealthReportItem[];
  description: string;
}

function HealthCategory({ icon, label, color, items, description }: CategoryProps) {
  const [expanded, setExpanded] = useState(true);
  const isEmpty = items.length === 0;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
      >
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${color}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground truncate">{description}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isEmpty ? (
            <span className="flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 size={10} /> All good
            </span>
          ) : (
            <span className="rounded-full bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-400">
              {items.length}
            </span>
          )}
          {!isEmpty && (
            expanded
              ? <ChevronDown size={14} className="text-muted-foreground" />
              : <ChevronRight size={14} className="text-muted-foreground" />
          )}
        </div>
      </button>

      {!isEmpty && expanded && (
        <div className="border-t border-border divide-y divide-border">
          {items.map((item) => (
            <div key={item.page_id} className="flex items-start gap-3 px-4 py-2.5">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{item.title || 'Untitled'}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{item.reason}</p>
              </div>
              {item.updated_at && (
                <span className="shrink-0 text-[10px] text-muted-foreground">
                  {formatDistanceToNow(parseISO(item.updated_at), { addSuffix: true })}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function WorkspaceHealth() {
  const { isAuthenticated, isGuest } = useAuthStore();
  const { data: workspace } = useWorkspace();
  const [report, setReport] = useState<HealthReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOnline = isAuthenticated && !isGuest;

  const runReport = async () => {
    if (!workspace?.id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await CloudAiService.healthReport(workspace.id);
      setReport(res);
    } catch (e: any) {
      const msg = e?.response?.data?.detail ?? e?.message ?? String(e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const totalIssues = report
    ? report.stale.length + report.orphans.length + report.incomplete.length
    : 0;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="shrink-0 border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <Activity size={18} className="text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Workspace Health</h1>
              <p className="text-xs text-muted-foreground">
                Scan for stale, orphaned, and incomplete notes
              </p>
            </div>
          </div>
          {report && (
            <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${
              totalIssues === 0
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
            }`}>
              {totalIssues === 0 ? (
                <><CheckCircle2 size={14} /> Healthy</>
              ) : (
                <><AlertCircle size={14} /> {totalIssues} issues</>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        {!isOnline && (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center">
            <Activity size={28} className="mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm font-medium text-foreground">Sign in to run workspace health checks</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Health reports scan your online workspace pages.
            </p>
          </div>
        )}

        {isOnline && !report && !loading && (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center">
            <Activity size={28} className="mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm font-medium text-foreground">Run a health scan</p>
            <p className="mt-1 text-xs text-muted-foreground mb-4">
              Identifies stale, orphaned, and incomplete notes in your workspace.
            </p>
            <button
              onClick={runReport}
              disabled={!workspace?.id}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors"
            >
              <Activity size={14} />
              Scan Workspace
            </button>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
            <Loader2 size={24} className="animate-spin" />
            <p className="text-sm">Scanning workspace…</p>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        {report && !loading && (
          <>
            {/* Summary bar */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Total Pages', value: report.total_pages, icon: <FileText size={14} /> },
                { label: 'Issues Found', value: totalIssues, icon: <AlertCircle size={14} /> },
                { label: 'Health Score', value: report.total_pages > 0 ? `${Math.round(((report.total_pages - totalIssues) / report.total_pages) * 100)}%` : '—', icon: <CheckCircle2 size={14} /> },
              ].map(({ label, value, icon }) => (
                <div key={label} className="rounded-xl bg-muted/40 px-3 py-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                    {icon}
                    {label}
                  </div>
                  <p className="text-xl font-bold text-foreground">{value}</p>
                </div>
              ))}
            </div>

            {/* Category details */}
            <HealthCategory
              icon={<Clock size={15} className="text-amber-600" />}
              label="Stale Notes"
              color="bg-amber-100 dark:bg-amber-900/30"
              items={report.stale}
              description="Not updated in 30+ days"
            />
            <HealthCategory
              icon={<Network size={15} className="text-blue-600" />}
              label="Orphaned Notes"
              color="bg-blue-100 dark:bg-blue-900/30"
              items={report.orphans}
              description="No other note links to these"
            />
            <HealthCategory
              icon={<FileText size={15} className="text-purple-600" />}
              label="Incomplete Notes"
              color="bg-purple-100 dark:bg-purple-900/30"
              items={report.incomplete}
              description="Very short content — likely stubs"
            />

            {/* Rescan button */}
            <button
              onClick={runReport}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-2.5 text-sm text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors"
            >
              <RefreshCw size={13} />
              Re-scan
            </button>
          </>
        )}
      </div>
    </div>
  );
}
