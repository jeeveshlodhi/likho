import { useEffect, useState } from 'react';
import { isBefore, parseISO, differenceInHours, formatDistanceToNow } from 'date-fns';
import { 
  Clock, Plus, Sparkles, Bookmark, ListFilter, Trash2, 
  LayoutGrid, AlertCircle, Zap 
} from 'lucide-react';
import { useTempNotesStore } from '@/store/tempNotesStore';
import { TempNoteCard } from '@/components/dashboard/TempNoteCard';
import { motion, AnimatePresence } from 'framer-motion';

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

  const filterTabs = [
    { key: 'active' as FilterMode, label: 'Active', count: activeCount, icon: Clock, color: 'blue' },
    { key: 'expiring' as FilterMode, label: 'Expiring Soon', count: expiringCount, icon: AlertCircle, color: 'amber' },
    { key: 'permanent' as FilterMode, label: 'Kept', count: permanentCount, icon: Bookmark, color: 'emerald' },
    { key: 'all' as FilterMode, label: 'All', count: notes.length, icon: LayoutGrid, color: 'slate' },
  ];

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
            <Zap size={20} className="text-white" fill="currentColor" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">Temporary Notes</h1>
            <p className="text-xs text-muted-foreground">
              {activeCount} active · {expiringCount} expiring soon · {permanentCount} kept
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* TTL default setting */}
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
            <Clock size={14} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Default TTL</span>
            <select
              value={settings.defaultTtlDays}
              onChange={(e) => updateSettings({ defaultTtlDays: Number(e.target.value) })}
              className="bg-transparent text-xs font-medium outline-none cursor-pointer"
            >
              {[1, 3, 7, 14, 30].map((d) => (
                <option key={d} value={d}>
                  {d} days
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setQuickCaptureOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus size={16} />
            New Note
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="border-b border-border px-6 py-3">
        <div className="flex items-center gap-2">
          <ListFilter size={14} className="text-muted-foreground mr-1" />
          {filterTabs.map(({ key, label, count, icon: Icon, color }) => (
            <button
              key={key}
              onClick={() => setFilter(key as FilterMode)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                filter === key
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              <Icon size={14} />
              {label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] leading-none ${
                  filter === key
                    ? 'bg-white/20 text-white'
                    : count > 0 && key === 'expiring'
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Notes Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredNotes.length === 0 ? (
          <EmptyState filter={filter} onNew={() => setQuickCaptureOpen(true)} />
        ) : (
          <motion.div 
            layout
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-fr"
          >
            <AnimatePresence mode="popLayout">
              {filteredNotes.map((note, index) => (
                <motion.div
                  key={note.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ 
                    duration: 0.2, 
                    delay: index * 0.03,
                    layout: { duration: 0.2 }
                  }}
                  className="h-full"
                >
                  <TempNoteCard note={note} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
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
  const messages: Record<FilterMode, { icon: React.ReactNode; title: string; desc: string; action?: string }> = {
    active: {
      icon: <Clock size={48} className="text-muted-foreground/30" />,
      title: 'No active notes',
      desc: 'Capture a quick thought. It will auto-delete after the set period.',
      action: 'Capture a note',
    },
    expiring: {
      icon: <AlertCircle size={48} className="text-amber-400/40" />,
      title: 'Nothing expiring soon',
      desc: 'Notes expiring within 48 hours will appear here.',
    },
    permanent: {
      icon: <Bookmark size={48} className="text-emerald-400/40" />,
      title: 'No kept notes',
      desc: 'Press "Keep" on any note to save it permanently.',
    },
    all: {
      icon: <Sparkles size={48} className="text-muted-foreground/30" />,
      title: 'No notes yet',
      desc: 'Start capturing temporary notes that auto-delete after a set time.',
      action: 'Create your first note',
    },
  };

  const { icon, title, desc, action } = messages[filter];

  return (
    <div className="flex h-full flex-col items-center justify-center py-20 text-center">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-muted/50">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mb-8 max-w-sm text-sm text-muted-foreground">{desc}</p>
      {action && (
        <button
          onClick={onNew}
          className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus size={16} />
          {action}
        </button>
      )}
    </div>
  );
}
