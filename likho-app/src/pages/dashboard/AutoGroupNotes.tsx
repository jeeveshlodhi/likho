import { useState } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd';
import { SearchService } from '@/lib/search-service';
import { useWorkspaceStore } from '@/store/workspaceStore';
import type { TopicGroup } from '@/types/search';
import type { Folder, SpaceType } from '@/types/workspace';
import {
  FolderOpen,
  Loader2,
  RefreshCw,
  Check,
  AlertCircle,
  Cpu,
  GripVertical,
  X,
  Pencil,
  Trash2,
  FolderPlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isTauri } from '@/utils/platform';
import { nanoid } from 'nanoid';

// ─── Local types ─────────────────────────────────────────────────────────────

interface EditableGroup {
  id: string;
  folderName: string;
  noteIds: string[];
  similarityScore: number;
}

type SpaceFilter = 'all' | 'offline' | 'online';

const UNGROUPED_ID = '__ungrouped__';

// ─── Component ────────────────────────────────────────────────────────────────

export function AutoGroupNotes() {
  const { folders, notes, createFolder, moveNote, deleteFolder } = useWorkspaceStore();

  const [spaceFilter, setSpaceFilter] = useState<SpaceFilter>('all');
  const [groups, setGroups] = useState<EditableGroup[]>([]);
  const [ungrouped, setUngrouped] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [hasGenerated, setHasGenerated] = useState(false);
  const [emptyFoldersToClean, setEmptyFoldersToClean] = useState<Folder[]>([]);

  const isTauriEnv = isTauri();

  // All notes in scope based on filter
  const filteredNoteIds = new Set(
    spaceFilter === 'all'
      ? notes.map((n) => n.id)
      : notes.filter((n) => n.spaceType === spaceFilter).map((n) => n.id)
  );

  const getNoteTitle = (id: string) => notes.find((n) => n.id === id)?.title || 'Untitled';

  // Current folder name for a note (used as badge on note cards)
  const getNoteFolderName = (noteId: string): string | null => {
    const note = notes.find((n) => n.id === noteId);
    if (!note?.folderId) return null;
    return folders.find((f) => f.id === note.folderId)?.name ?? null;
  };

  // ── Generate ────────────────────────────────────────────────────────────────

  const generate = async () => {
    setLoading(true);
    setError(null);
    setApplied(false);
    setEmptyFoldersToClean([]);
    try {
      const result: TopicGroup[] = await SearchService.aiGroupNotesByTopic();

      const mapped: EditableGroup[] = result
        .map((g) => ({
          id: nanoid(),
          folderName: g.suggested_folder,
          noteIds: g.note_ids.filter((id) => filteredNoteIds.has(id)),
          similarityScore: g.similarity_score,
        }))
        .filter((g) => g.noteIds.length > 0);

      setGroups(mapped);
      setHasGenerated(true);

      // Notes not placed in any group
      const allGroupedIds = new Set(mapped.flatMap((g) => g.noteIds));
      const leftover = [...filteredNoteIds].filter((id) => !allGroupedIds.has(id));
      setUngrouped(leftover);
    } catch (e: any) {
      setError(
        e?.message ?? 'Auto-grouping failed. Make sure the local AI model is loaded.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Apply ────────────────────────────────────────────────────────────────────

  const applyChanges = () => {
    // Capture which folders will lose notes so we can detect empties afterward
    const movedNoteIds = new Set(groups.flatMap((g) => g.noteIds));
    const sourceFolderIds = new Set<string>();
    for (const note of notes) {
      if (movedNoteIds.has(note.id) && note.folderId) {
        sourceFolderIds.add(note.folderId);
      }
    }

    // Perform moves
    for (const group of groups) {
      if (group.noteIds.length === 0) continue;
      const matchingNotes = notes.filter((n) => group.noteIds.includes(n.id));
      if (matchingNotes.length === 0) continue;

      const spaceType: SpaceType = matchingNotes[0].spaceType;
      const existing = folders.find(
        (f) =>
          f.name.toLowerCase() === group.folderName.toLowerCase() &&
          f.spaceType === spaceType
      );
      const folder = existing ?? createFolder(group.folderName, spaceType);
      for (const note of matchingNotes) {
        moveNote(note.id, folder.id);
      }
    }

    // Read fresh state from Zustand after synchronous moves to detect empty folders
    const freshState = useWorkspaceStore.getState();
    const emptySourceFolders = freshState.folders.filter(
      (f) =>
        sourceFolderIds.has(f.id) &&
        !freshState.notes.some((n) => n.folderId === f.id)
    );

    setApplied(true);
    setGroups([]);
    setUngrouped([]);
    setHasGenerated(false);

    if (emptySourceFolders.length > 0) {
      setEmptyFoldersToClean(emptySourceFolders);
    }
  };

  const deleteEmptyFolders = () => {
    for (const folder of emptyFoldersToClean) {
      deleteFolder(folder.id);
    }
    setEmptyFoldersToClean([]);
  };

  // ── Drag and Drop ────────────────────────────────────────────────────────────

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination, draggableId: noteId } = result;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return;

    if (source.droppableId === UNGROUPED_ID) {
      setUngrouped((prev) => prev.filter((id) => id !== noteId));
    } else {
      setGroups((prev) =>
        prev.map((g) =>
          g.id === source.droppableId
            ? { ...g, noteIds: g.noteIds.filter((id) => id !== noteId) }
            : g
        )
      );
    }

    if (destination.droppableId === UNGROUPED_ID) {
      setUngrouped((prev) => {
        const next = [...prev];
        next.splice(destination.index, 0, noteId);
        return next;
      });
    } else {
      setGroups((prev) =>
        prev.map((g) => {
          if (g.id !== destination.droppableId) return g;
          const next = [...g.noteIds];
          next.splice(destination.index, 0, noteId);
          return { ...g, noteIds: next };
        })
      );
    }
  };

  // ── Group mutations ──────────────────────────────────────────────────────────

  const startRename = (group: EditableGroup) => {
    setEditingGroupId(group.id);
    setEditName(group.folderName);
  };

  const commitRename = () => {
    if (editName.trim()) {
      setGroups((prev) =>
        prev.map((g) =>
          g.id === editingGroupId ? { ...g, folderName: editName.trim() } : g
        )
      );
    }
    setEditingGroupId(null);
    setEditName('');
  };

  const deleteGroup = (groupId: string) => {
    const group = groups.find((g) => g.id === groupId);
    if (group) setUngrouped((prev) => [...prev, ...group.noteIds]);
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
  };

  const addGroup = () => {
    const newGroup: EditableGroup = {
      id: nanoid(),
      folderName: 'New Group',
      noteIds: [],
      similarityScore: 0,
    };
    setGroups((prev) => [...prev, newGroup]);
    setEditingGroupId(newGroup.id);
    setEditName(newGroup.folderName);
  };

  const removeNoteFromGroup = (groupId: string, noteId: string) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? { ...g, noteIds: g.noteIds.filter((id) => id !== noteId) }
          : g
      )
    );
    setUngrouped((prev) => [...prev, noteId]);
  };

  // ── Stats ────────────────────────────────────────────────────────────────────

  const totalNotes = groups.reduce((s, g) => s + g.noteIds.length, 0);

  // ── Note card ────────────────────────────────────────────────────────────────

  function NoteCard({
    noteId,
    index,
    onRemove,
  }: {
    noteId: string;
    index: number;
    onRemove?: () => void;
  }) {
    const folderName = getNoteFolderName(noteId);
    return (
      <Draggable key={noteId} draggableId={noteId} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors ${
              snapshot.isDragging
                ? 'bg-primary/10 shadow-md ring-1 ring-primary/20'
                : 'bg-background hover:bg-muted/40'
            }`}
          >
            <span
              {...provided.dragHandleProps}
              className="text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing shrink-0"
            >
              <GripVertical size={13} />
            </span>
            <span className="flex-1 truncate text-foreground">{getNoteTitle(noteId)}</span>
            {folderName && (
              <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                {folderName}
              </span>
            )}
            {onRemove && (
              <button
                onClick={onRemove}
                className="rounded p-0.5 text-muted-foreground/40 hover:text-muted-foreground transition-colors shrink-0"
                title="Remove from group"
              >
                <X size={12} />
              </button>
            )}
          </div>
        )}
      </Draggable>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="shrink-0 border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <FolderOpen size={18} className="text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Auto-Group Notes</h1>
              <p className="text-xs text-muted-foreground">
                Use local AI to suggest folder structure for your notes
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground">
            <Cpu size={12} />
            Runs offline · llama.cpp
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {/* Tauri guard */}
        {!isTauriEnv && (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center">
            <Cpu size={28} className="mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm font-medium text-foreground">Desktop app required</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Auto-grouping uses a local AI model and is only available in the Tauri desktop app.
            </p>
          </div>
        )}

        {isTauriEnv && (
          <>
            {/* Controls */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-4">
              <div>
                <p className="mb-2 text-xs font-medium text-foreground">Notes to analyze</p>
                <div className="flex gap-2">
                  {(
                    [
                      { value: 'all', label: 'All Notes' },
                      { value: 'offline', label: 'Offline Notes' },
                      { value: 'online', label: 'Online Notes' },
                    ] as { value: SpaceFilter; label: string }[]
                  ).map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setSpaceFilter(value)}
                      className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                        spaceFilter === value
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  {filteredNoteIds.size} note{filteredNoteIds.size !== 1 ? 's' : ''} selected
                  {folders.length > 0 && ` · ${folders.filter(f => spaceFilter === 'all' || f.spaceType === spaceFilter).length} existing folder${folders.length !== 1 ? 's' : ''} will be considered`}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  onClick={generate}
                  disabled={loading || filteredNoteIds.size === 0}
                  className="gap-2"
                >
                  {loading ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : hasGenerated ? (
                    <RefreshCw size={15} />
                  ) : (
                    <Cpu size={15} />
                  )}
                  {loading
                    ? 'Analyzing notes…'
                    : hasGenerated
                    ? 'Regenerate'
                    : 'Generate Suggested Structure'}
                </Button>
                {loading && (
                  <p className="text-xs text-muted-foreground animate-pulse">
                    Local model is running — this may take a few seconds…
                  </p>
                )}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            {/* Applied success */}
            {applied && !hasGenerated && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
                <Check size={16} />
                Changes applied — notes have been moved to their new folders.
              </div>
            )}

            {/* Empty folder cleanup prompt */}
            {emptyFoldersToClean.length > 0 && (
              <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <AlertCircle size={15} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                      {emptyFoldersToClean.length} folder
                      {emptyFoldersToClean.length !== 1 ? 's are' : ' is'} now empty
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                      All notes were moved out of these folders during regrouping.
                    </p>
                  </div>
                </div>
                <ul className="space-y-1 pl-1">
                  {emptyFoldersToClean.map((f) => (
                    <li
                      key={f.id}
                      className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-300"
                    >
                      <FolderOpen size={13} />
                      {f.name}
                    </li>
                  ))}
                </ul>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={deleteEmptyFolders}
                    className="gap-1.5"
                  >
                    <Trash2 size={13} />
                    Delete Empty Folders
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEmptyFoldersToClean([])}
                    className="gap-1.5 text-amber-700 dark:text-amber-400 hover:text-amber-900"
                  >
                    Keep Them
                  </Button>
                </div>
              </div>
            )}

            {/* Suggested Organization */}
            {hasGenerated && !loading && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">Suggested Organization</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {groups.length} group{groups.length !== 1 ? 's' : ''} · {totalNotes} note
                      {totalNotes !== 1 ? 's' : ''} organized
                      {ungrouped.length > 0 && ` · ${ungrouped.length} ungrouped`}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={addGroup} className="gap-1.5">
                    <FolderPlus size={14} />
                    Add Group
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground -mt-2">
                  Drag notes between groups to adjust. Badges show a note's current folder.
                </p>

                <DragDropContext onDragEnd={onDragEnd}>
                  <div className="space-y-3">
                    {groups.map((group) => (
                      <div
                        key={group.id}
                        className="rounded-xl border border-border bg-card overflow-hidden"
                      >
                        {/* Group header */}
                        <div className="flex items-center gap-2 px-3 py-2.5 bg-muted/30 border-b border-border">
                          <FolderOpen size={15} className="text-primary shrink-0" />
                          {editingGroupId === group.id ? (
                            <input
                              autoFocus
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              onBlur={commitRename}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') commitRename();
                                if (e.key === 'Escape') {
                                  setEditingGroupId(null);
                                  setEditName('');
                                }
                              }}
                              className="flex-1 bg-transparent text-sm font-medium text-foreground outline-none border-b border-primary"
                            />
                          ) : (
                            <span className="flex-1 text-sm font-medium text-foreground">
                              {group.folderName}
                            </span>
                          )}
                          <span className="text-[11px] text-muted-foreground">
                            {group.noteIds.length} note{group.noteIds.length !== 1 ? 's' : ''}
                          </span>
                          <button
                            onClick={() => startRename(group)}
                            className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                            title="Rename group"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            onClick={() => deleteGroup(group.id)}
                            className="rounded p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            title="Delete group"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>

                        <Droppable droppableId={group.id}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className={`min-h-[40px] p-2 space-y-1 transition-colors ${
                                snapshot.isDraggingOver ? 'bg-primary/5' : ''
                              }`}
                            >
                              {group.noteIds.length === 0 && !snapshot.isDraggingOver && (
                                <p className="text-center text-xs text-muted-foreground/50 py-2">
                                  Drop notes here
                                </p>
                              )}
                              {group.noteIds.map((noteId, index) => (
                                <NoteCard
                                  key={noteId}
                                  noteId={noteId}
                                  index={index}
                                  onRemove={() => removeNoteFromGroup(group.id, noteId)}
                                />
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </div>
                    ))}

                    {/* Ungrouped */}
                    {ungrouped.length > 0 && (
                      <div className="rounded-xl border border-dashed border-border bg-muted/20 overflow-hidden">
                        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/50">
                          <span className="flex-1 text-sm font-medium text-muted-foreground">
                            Ungrouped
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {ungrouped.length} note{ungrouped.length !== 1 ? 's' : ''} · will not be moved
                          </span>
                        </div>
                        <Droppable droppableId={UNGROUPED_ID}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className={`min-h-[40px] p-2 space-y-1 transition-colors ${
                                snapshot.isDraggingOver ? 'bg-primary/5' : ''
                              }`}
                            >
                              {ungrouped.map((noteId, index) => (
                                <NoteCard key={noteId} noteId={noteId} index={index} />
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </div>
                    )}
                  </div>
                </DragDropContext>

                {/* Action bar */}
                <div className="flex items-center gap-3 pt-1 pb-2">
                  <Button
                    onClick={applyChanges}
                    disabled={groups.every((g) => g.noteIds.length === 0)}
                    className="gap-2"
                  >
                    <Check size={15} />
                    Apply Changes
                  </Button>
                  <Button variant="outline" onClick={generate} disabled={loading} className="gap-2">
                    {loading ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <RefreshCw size={14} />
                    )}
                    Regenerate
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Creates folders and moves notes. Empty source folders will be flagged.
                  </p>
                </div>
              </>
            )}

            {/* Empty state */}
            {!hasGenerated && !loading && filteredNoteIds.size === 0 && (
              <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center">
                <FolderOpen size={28} className="mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-sm font-medium text-foreground">No notes found</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Create some notes first, then generate a grouping suggestion.
                </p>
              </div>
            )}

            {/* Initial prompt */}
            {!hasGenerated && !loading && filteredNoteIds.size > 0 && !error && (
              <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center">
                <Cpu size={28} className="mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-sm font-medium text-foreground">Ready to analyze</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Click "Generate Suggested Structure" to let the local AI analyze your{' '}
                  {filteredNoteIds.size} note{filteredNoteIds.size !== 1 ? 's' : ''} — including
                  notes already in folders.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
