/**
 * "Shared With Me" dashboard page.
 * Lists all pages that other users have explicitly shared with the logged-in user.
 * Features: search, role/type filters, sort (newest first).
 */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { formatDistanceToNow } from 'date-fns';
import {
  FileText, Kanban, PenTool, Users, Clock, ChevronRight, Inbox,
  Search, X, SlidersHorizontal, ChevronDown,
} from 'lucide-react';
import { useSharedWithMe, type SharedWithMeItem } from '@/hooks/useSharedWithMe';
import { cn } from '@/lib/utils';

// ── Constants ──────────────────────────────────────────────────────────────────

const ROLE_STYLES: Record<string, string> = {
  viewer:    'bg-gray-500/10 text-gray-600 dark:text-gray-400',
  commenter: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  editor:    'bg-green-500/10 text-green-600 dark:text-green-400',
  admin:     'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  owner:     'bg-amber-500/10 text-amber-600 dark:text-amber-400',
};

const ROLE_OPTIONS = ['viewer', 'commenter', 'editor', 'admin', 'owner'] as const;
const TYPE_OPTIONS = ['note', 'canvas', 'kanban', 'meeting', 'journal', 'project'] as const;
type SortKey = 'newest' | 'oldest' | 'title';

const SORT_LABELS: Record<SortKey, string> = {
  newest: 'Newest first',
  oldest: 'Oldest first',
  title:  'Title A–Z',
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function PageTypeIcon({ type }: { type: string }) {
  if (type === 'canvas' || type === 'brainstorm') return <PenTool size={16} className="text-muted-foreground" />;
  if (type === 'kanban') return <Kanban size={16} className="text-muted-foreground" />;
  return <FileText size={16} className="text-muted-foreground" />;
}

function SharedPageRow({ item }: { item: SharedWithMeItem }) {
  const navigate = useNavigate();
  const sharer = item.granted_by_name || item.granted_by_email;
  const sharerInitial = sharer ? sharer[0].toUpperCase() : '?';
  const isExpiringSoon =
    item.expires_at &&
    new Date(item.expires_at).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000;

  return (
    <button
      type="button"
      onClick={() => navigate(`/dashboard/note/${item.page_id}`)}
      className="w-full group rounded-xl border border-border bg-card text-left transition-all duration-150 hover:border-primary/40 hover:shadow-sm hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      {/* Top strip — icon + title + arrow */}
      <div className="flex items-start gap-3 px-4 pt-3.5 pb-2">
        {/* Page icon */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-lg mt-0.5">
          {item.page_icon ?? <PageTypeIcon type={item.page_type} />}
        </div>

        <div className="flex-1 min-w-0">
          <p className="truncate font-semibold text-sm leading-tight">{item.page_title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground capitalize">{item.page_type}</p>
        </div>

        <ChevronRight
          size={15}
          className="shrink-0 mt-1 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
        />
      </div>

      {/* Divider */}
      <div className="mx-4 border-t border-border/60" />

      {/* Bottom meta row */}
      <div className="flex items-center gap-3 px-4 py-2.5">
        {/* Sharer avatar */}
        {sharer && (
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary">
              {sharerInitial}
            </div>
            <span className="truncate text-xs text-muted-foreground">{sharer}</span>
          </div>
        )}

        <div className="flex-1" />

        {/* Expiry warning */}
        {item.expires_at && (
          <span className={cn(
            'text-xs',
            isExpiringSoon ? 'text-destructive font-medium' : 'text-amber-500'
          )}>
            {isExpiringSoon ? '⚠ ' : ''}expires {formatDistanceToNow(new Date(item.expires_at), { addSuffix: true })}
          </span>
        )}

        {/* Shared time */}
        <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
          <Clock size={11} />
          {formatDistanceToNow(new Date(item.granted_at), { addSuffix: true })}
        </span>

        {/* Role badge */}
        <span className={cn(
          'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
          ROLE_STYLES[item.role] ?? 'bg-muted text-muted-foreground'
        )}>
          {item.role}
        </span>
      </div>
    </button>
  );
}

// ── FilterChip ─────────────────────────────────────────────────────────────────

function FilterChip({
  label, active, onClick,
}: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors',
        active
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
      )}
    >
      {label}
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function SharedWithMe() {
  const { data: items = [], isLoading, isError } = useSharedWithMe();

  const [search, setSearch] = useState('');
  const [activeRoles, setActiveRoles] = useState<Set<string>>(new Set());
  const [activeTypes, setActiveTypes] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<SortKey>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  const toggleRole = (r: string) =>
    setActiveRoles(prev => {
      const next = new Set(prev);
      next.has(r) ? next.delete(r) : next.add(r);
      return next;
    });

  const toggleType = (t: string) =>
    setActiveTypes(prev => {
      const next = new Set(prev);
      next.has(t) ? next.delete(t) : next.add(t);
      return next;
    });

  const clearFilters = () => {
    setSearch('');
    setActiveRoles(new Set());
    setActiveTypes(new Set());
    setSort('newest');
  };

  const hasActiveFilters = search || activeRoles.size > 0 || activeTypes.size > 0 || sort !== 'newest';

  const filtered = useMemo(() => {
    let result = [...items];

    // Search by title or sharer name/email
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        item =>
          item.page_title.toLowerCase().includes(q) ||
          item.granted_by_name?.toLowerCase().includes(q) ||
          item.granted_by_email?.toLowerCase().includes(q)
      );
    }

    // Role filter
    if (activeRoles.size > 0) {
      result = result.filter(item => activeRoles.has(item.role));
    }

    // Type filter
    if (activeTypes.size > 0) {
      result = result.filter(item => activeTypes.has(item.page_type));
    }

    // Sort
    result.sort((a, b) => {
      if (sort === 'newest') return new Date(b.granted_at).getTime() - new Date(a.granted_at).getTime();
      if (sort === 'oldest') return new Date(a.granted_at).getTime() - new Date(b.granted_at).getTime();
      return a.page_title.localeCompare(b.page_title);
    });

    return result;
  }, [items, search, activeRoles, activeTypes, sort]);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-6 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Users size={16} className="text-primary" />
        </div>
        <div>
          <h1 className="text-base font-semibold">Shared With Me</h1>
          <p className="text-xs text-muted-foreground">Pages others have shared with you</p>
        </div>
        {items.length > 0 && (
          <span className="ml-auto rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            {filtered.length !== items.length ? `${filtered.length} / ${items.length}` : items.length}
          </span>
        )}
      </div>

      {/* Search + toolbar */}
      {!isLoading && !isError && items.length > 0 && (
        <div className="flex flex-col gap-2 border-b border-border px-6 py-3">
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search pages or people…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full rounded-lg border border-border bg-background pl-8 pr-8 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Filter toggle */}
            <button
              type="button"
              onClick={() => setShowFilters(v => !v)}
              className={cn(
                'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors',
                showFilters || activeRoles.size > 0 || activeTypes.size > 0
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <SlidersHorizontal size={14} />
              Filters
              {(activeRoles.size + activeTypes.size) > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  {activeRoles.size + activeTypes.size}
                </span>
              )}
            </button>

            {/* Sort dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowSortMenu(v => !v)}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                {SORT_LABELS[sort]}
                <ChevronDown size={13} />
              </button>
              {showSortMenu && (
                <>
                  {/* Backdrop */}
                  <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
                  <div className="absolute right-0 top-full z-20 mt-1 min-w-[140px] rounded-lg border border-border bg-popover shadow-md">
                    {(Object.keys(SORT_LABELS) as SortKey[]).map(k => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => { setSort(k); setShowSortMenu(false); }}
                        className={cn(
                          'w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors first:rounded-t-lg last:rounded-b-lg',
                          sort === k && 'text-primary font-medium'
                        )}
                      >
                        {SORT_LABELS[k]}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Clear all */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filter chips */}
          {showFilters && (
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-muted-foreground w-10">Role</span>
                {ROLE_OPTIONS.map(r => (
                  <FilterChip
                    key={r}
                    label={r}
                    active={activeRoles.has(r)}
                    onClick={() => toggleRole(r)}
                  />
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-muted-foreground w-10">Type</span>
                {TYPE_OPTIONS.map(t => (
                  <FilterChip
                    key={t}
                    label={t}
                    active={activeTypes.has(t)}
                    onClick={() => toggleType(t)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading && (
          <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
            Loading shared pages…
          </div>
        )}

        {isError && (
          <div className="flex items-center justify-center py-16 text-sm text-destructive">
            Failed to load shared pages. Please try again.
          </div>
        )}

        {!isLoading && !isError && items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
              <Inbox size={28} className="text-muted-foreground" />
            </div>
            <p className="font-medium text-sm">Nothing shared yet</p>
            <p className="mt-1 text-xs text-muted-foreground max-w-xs">
              When someone shares a page with you, it will appear here.
            </p>
          </div>
        )}

        {!isLoading && !isError && items.length > 0 && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted mb-3">
              <Search size={20} className="text-muted-foreground" />
            </div>
            <p className="font-medium text-sm">No results</p>
            <p className="mt-1 text-xs text-muted-foreground">Try adjusting your search or filters.</p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-3 text-xs text-primary hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}

        {!isLoading && !isError && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map(item => (
              <SharedPageRow key={item.page_id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
