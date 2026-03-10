import { useEffect, useState } from 'react';
import { isBefore, parseISO, differenceInHours } from 'date-fns';
import { Clock, Plus, Sparkles, Bookmark, ListFilter, Trash2 } from 'lucide-react';
import { useTempNotesStore } from '@/store/tempNotesStore';
import { TempNoteCard } from '@/components/dashboard/TempNoteCard';

type FilterMode = 'active' | 'expiring' | 'permanent' | 'all';

export default function TempNotesDashboard() {
  const {
    notes,
    settings,
    purgeExpired,
    setQuickCaptureOpen,
    updateSettings,
  } = useTempNotesStore();

  const [filter, setFilter] = useState<FilterMode>('active');

  // Purge expired notes on mount
  useEffect(() => {
    purgeExpired();
  }, [purgeExpired]);

  const now = new Date();

  const filteredNotes = notes.filter((n): boolean => {
    switch (filter) {
      case 'active':
        return !n.isPermanent && !isBefore(parseISO(n.expiresAt), now);
      case 'expiring':
        return (
          !n.isPermanent &&
          !isBefore(parseISO(n.expiresAt), now) &&
          differenceInHours(parseISO(n.expiresAt), now) <= 48
        );
      case 'permanent':
        return n.isPermanent;
      case 'all':
        return true;
    }
  });

  const activeCount = notes.filter(
    (n) => !n.isPermanent && !isBefore(parseISO(n.expiresAt), now)
  ).length;
  const expiringCount = notes.filter(
    (n) =>
      !n.isPermanent &&
      !isBefore(parseISO(n.expiresAt), now) &&
      differenceInHours(parseISO(n.expiresAt), now) <= 48
  ).length;
  const permanentCount = notes.filter((n) => n.isPermanent).length;

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <Clock size={18} className="text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">Temporary Notes</h1>
            <p className="text-xs text-muted-foreground">
              {activeCount} active · {expiringCount} expiring soon
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* TTL default setting */}
          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/30 px-3 py-1.5">
            <Clock size={13} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Default TTL</span>
            <select
              value={settings.defaultTtlDays}
              onChange={(e) => updateSettings({ defaultTtlDays: Number(e.target.value) })}
              className="bg-transparent text-xs font-medium outline-none cursor-pointer"
            >
              {[1, 3, 7, 14, 30].map((d) => (
                <option key={d} value={d}>
                  {d}d
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setQuickCaptureOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus size={15} />
            New Note
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 border-b border-border px-6 py-2">
        <ListFilter size={13} className="mr-1 text-muted-foreground" />
        {(
          [
            { key: 'active' as FilterMode, label: 'Active', count: activeCount, warn: false },
            { key: 'expiring' as FilterMode, label: 'Expiring', count: expiringCount, warn: true },
            { key: 'permanent' as FilterMode, label: 'Kept', count: permanentCount, warn: false },
            { key: 'all' as FilterMode, label: 'All', count: notes.length, warn: false },
          ]
        ).map(({ key, label, count, warn }) => (
          <button
            key={key}
            onClick={() => setFilter(key as FilterMode)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filter === key
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
          >
            {label}
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] leading-none ${
                filter === key
                  ? 'bg-white/20 text-white'
                  : warn && count > 0
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Notes grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredNotes.length === 0 ? (
          <EmptyState filter={filter} onNew={() => setQuickCaptureOpen(true)} />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredNotes.map((note) => (
              <TempNoteCard key={note.id} note={note} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({
  filter,
  onNew,
}: {
  filter: FilterMode;
  onNew: () => void;
}) {
  const messages: Record<FilterMode, { icon: React.ReactNode; title: string; desc: string }> = {
    active: {
      icon: <Clock size={36} className="text-muted-foreground/40" />,
      title: 'No active notes',
      desc: 'Capture a quick thought. It will auto-delete after the set period.',
    },
    expiring: {
      icon: <Trash2 size={36} className="text-amber-400/60" />,
      title: 'Nothing expiring soon',
      desc: 'Notes expiring within 48 hours will appear here.',
    },
    permanent: {
      icon: <Bookmark size={36} className="text-emerald-400/60" />,
      title: 'No kept notes',
      desc: 'Press "Keep" on any note to save it permanently.',
    },
    all: {
      icon: <Sparkles size={36} className="text-muted-foreground/40" />,
      title: 'No notes yet',
      desc: 'Start capturing temporary notes below.',
    },
  };

  const { icon, title, desc } = messages[filter];

  return (
    <div className="flex h-full flex-col items-center justify-center py-20 text-center">
      <div className="mb-4">{icon}</div>
      <h3 className="mb-1 text-base font-semibold text-foreground">{title}</h3>
      <p className="mb-6 max-w-xs text-sm text-muted-foreground">{desc}</p>
      {(filter === 'active' || filter === 'all') && (
        <button
          onClick={onNew}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus size={15} />
          Capture a note
        </button>
      )}
    </div>
  );
}
