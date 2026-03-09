import { useState } from 'react';
import { SearchService } from '@/lib/search-service';
import { useWorkspaceStore } from '@/store/workspaceStore';
import type { TopicGroup } from '@/types/search';
import { FolderOpen, Loader2, Check, X, ChevronDown, ChevronRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AutoGroupButton() {
  const [groups, setGroups] = useState<TopicGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [applied, setApplied] = useState(false);
  const [regroup, setRegroup] = useState(false);

  const { folders, notes, createFolder, moveNote } = useWorkspaceStore();

  const ungroupedNotes = notes.filter((n) => !n.folderId);

  const analyze = async (forceRegroup = false) => {
    setLoading(true);
    setApplied(false);
    setRegroup(forceRegroup);
    try {
      const result = await SearchService.aiGroupNotesByTopic();

      // Filter groups to only include notes that are ungrouped (unless force-regroup)
      const filtered = forceRegroup
        ? result
        : result
            .map((g) => {
              const ungroupedIds = g.note_ids.filter((id) =>
                notes.some((n) => n.id === id && !n.folderId)
              );
              const ungroupedTitles = ungroupedIds.map((id) => {
                const note = notes.find((n) => n.id === id);
                return note?.title || 'Untitled';
              });
              return { ...g, note_ids: ungroupedIds, note_titles: ungroupedTitles };
            })
            .filter((g) => g.note_ids.length > 0);

      setGroups(filtered);
      setOpen(filtered.length > 0 || forceRegroup);
    } catch (e) {
      console.error('Auto-group failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const applyGroups = () => {
    for (const group of groups) {
      const matchingNotes = notes.filter((n) => group.note_ids.includes(n.id));
      if (matchingNotes.length === 0) continue;

      const spaceType = matchingNotes[0].spaceType;

      const existingFolder = folders.find(
        (f) => f.name.toLowerCase() === group.suggested_folder.toLowerCase() && f.spaceType === spaceType
      );
      const folder = existingFolder ?? createFolder(group.suggested_folder, spaceType);

      for (const note of matchingNotes) {
        moveNote(note.id, folder.id);
      }
    }
    setApplied(true);
    setOpen(false);
    setGroups([]);
  };

  // All notes are already organized
  if (!open && applied && ungroupedNotes.length === 0) {
    return (
      <div className="rounded-md border border-border/50 bg-muted/20 px-2 py-1.5 space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Check size={13} className="text-green-500 shrink-0" />
          <span>All notes organized</span>
        </div>
        <button
          onClick={() => analyze(true)}
          disabled={loading}
          className="w-full flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
          Regroup anyway
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => analyze(false)}
        disabled={loading}
        className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground hover:bg-accent transition-colors disabled:opacity-50"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <FolderOpen size={16} />}
        {loading ? 'Analyzing…' : applied ? 'Auto-group Notes ✓' : 'Auto-group Notes'}
      </button>
    );
  }

  // No new groups found (all already organized)
  if (open && groups.length === 0) {
    return (
      <div className="rounded-md border border-border bg-card p-2 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">All notes are already organized</span>
          <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
            <X size={14} />
          </button>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 text-xs w-full gap-1"
          onClick={() => analyze(true)}
          disabled={loading}
        >
          {loading ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
          Regroup existing notes
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border bg-card p-2 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">
          {regroup ? `Found ${groups.length} groups` : `${groups.length} new groups for ${groups.reduce((s, g) => s + g.note_ids.length, 0)} ungrouped notes`}
        </span>
        <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
          <X size={14} />
        </button>
      </div>

      <div className="space-y-1 max-h-48 overflow-y-auto">
        {groups.map((group, i) => (
          <div key={i} className="rounded border border-border/50 overflow-hidden">
            <button
              onClick={() => setExpanded((e) => ({ ...e, [i]: !e[i] }))}
              className="w-full flex items-center justify-between px-2 py-1 text-xs hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <FolderOpen size={12} />
                <span className="font-medium">{group.suggested_folder}</span>
                <span className="text-muted-foreground">({group.note_ids.length})</span>
              </div>
              {expanded[i] ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </button>
            {expanded[i] && (
              <ul className="px-3 pb-1 space-y-0.5 bg-muted/20">
                {group.note_titles.map((t, j) => (
                  <li key={j} className="text-xs text-muted-foreground truncate">• {t}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-1.5">
        <Button size="sm" className="h-6 text-xs gap-1 flex-1" onClick={applyGroups}>
          <Check size={11} /> Apply & Move Notes
        </Button>
        <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
