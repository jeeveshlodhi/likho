import { useState } from 'react';
import { formatDistanceToNow, parseISO, differenceInHours } from 'date-fns';
import {
  Bookmark, Trash2, FolderInput, Clock, Sparkles,
  AlertTriangle, Check, X, Tag, MoreHorizontal,
} from 'lucide-react';
import { useTempNotesStore } from '@/store/tempNotesStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import type { TempNote } from '@/types/tempNote';

interface Props {
  note: TempNote;
}

export function TempNoteCard({ note }: Props) {
  const { keepNote, deleteNote } = useTempNotesStore();
  const { folders, createFolder, createNote, addNote, setActiveNote } = useWorkspaceStore();
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [kept, setKept] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const hoursLeft      = differenceInHours(parseISO(note.expiresAt), new Date());
  const isExpiringSoon = hoursLeft <= 24 && !note.isPermanent;
  const isExpired      = hoursLeft <= 0  && !note.isPermanent;

  const timeLabel = note.isPermanent
    ? 'Kept permanently'
    : isExpired
    ? 'Expired'
    : `Expires ${formatDistanceToNow(parseISO(note.expiresAt), { addSuffix: true })}`;

  const handleKeep = () => {
    keepNote(note.id);
    setKept(true);
  };

  const handleMoveToFolder = (folderName: string) => {
    const offlineFolders = folders.filter((f) => f.spaceType === 'offline');
    const existingFolder = offlineFolders.find(
      (f) => f.name.toLowerCase() === folderName.toLowerCase()
    );
    const targetFolder = existingFolder ?? createFolder(folderName, 'offline');

    const newNote = createNote(targetFolder.id, 'offline', 'note', [
      {
        id: 'initial-block',
        type: 'paragraph',
        content: [{ type: 'text', text: note.content, styles: {} }],
      },
    ]);
    addNote(newNote);
    setActiveNote(newNote.id);
    deleteNote(note.id);
    setShowFolderPicker(false);
  };

  const offlineFolders = folders.filter((f) => f.spaceType === 'offline');
  const suggestedName  = note.suggestedFolder;

  // Status badge configuration
  const getStatusBadge = () => {
    if (note.isPermanent) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full
          bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 text-[10px]
          font-medium text-emerald-700 dark:text-emerald-400">
          <Bookmark size={9} />
          Kept
        </span>
      );
    }
    if (isExpiringSoon) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full
          bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 text-[10px]
          font-medium text-amber-700 dark:text-amber-400">
          <AlertTriangle size={9} />
          {hoursLeft <= 0 ? 'Expired' : `${hoursLeft}h left`}
        </span>
      );
    }
    return null;
  };

  // Card border/background based on status
  const getCardStyles = () => {
    if (note.isPermanent) {
      return 'border-emerald-200/60 dark:border-emerald-800/40 bg-emerald-50/30 dark:bg-emerald-900/10';
    }
    if (isExpiringSoon) {
      return 'border-amber-200/60 dark:border-amber-800/40 bg-amber-50/30 dark:bg-amber-900/10';
    }
    return 'border-border bg-card hover:border-primary/30';
  };

  return (
    <div
      className={`group relative flex flex-col h-full rounded-xl border shadow-sm
        transition-all duration-200 hover:shadow-md ${getCardStyles()}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Card Header with Status */}
      <div className="flex items-start justify-between gap-2 p-4 pb-2">
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Clock size={11} />
          <span>{timeLabel}</span>
        </div>
        {getStatusBadge()}
      </div>

      {/* Card Content */}
      <div className="flex-1 px-4 py-2 min-h-0">
        <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap line-clamp-6">
          {note.content || <span className="text-muted-foreground italic">Empty note</span>}
        </p>
      </div>

      {/* Tags */}
      {note.tags && note.tags.length > 0 && (
        <div className="px-4 py-2">
          <div className="flex flex-wrap gap-1">
            {note.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-primary/8
                  px-2 py-0.5 text-[10px] font-medium text-primary"
              >
                {tag}
              </span>
            ))}
            {note.tags.length > 3 && (
              <span className="text-[10px] text-muted-foreground px-1">
                +{note.tags.length - 3}
              </span>
            )}
          </div>
        </div>
      )}

      {/* AI Suggestion */}
      {suggestedName && !note.isPermanent && (
        <div className="px-4 py-2">
          <button
            onClick={() => handleMoveToFolder(suggestedName)}
            className={`w-full flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px]
              transition-colors ${note.aiConfidence === 'high'
                ? 'bg-violet-50 text-violet-700 hover:bg-violet-100 dark:bg-violet-900/20 dark:text-violet-300 dark:hover:bg-violet-900/30'
                : 'bg-muted text-muted-foreground hover:bg-accent'
              }`}
          >
            <Sparkles size={10} />
            <span className="truncate">Move to "{suggestedName}"</span>
          </button>
        </div>
      )}

      {/* Card Footer with Actions */}
      <div className="mt-auto p-4 pt-3 border-t border-border/50">
        <div className="flex items-center justify-between">
          {/* Left: Created time */}
          <span className="text-[10px] text-muted-foreground">
            {formatDistanceToNow(parseISO(note.createdAt), { addSuffix: true })}
          </span>

          {/* Right: Action Buttons */}
          <div className={`flex items-center gap-0.5 transition-opacity duration-200 ${showActions ? 'opacity-100' : 'opacity-0'}`}>
            {!note.isPermanent && !kept && (
              <button
                onClick={handleKeep}
                title="Keep permanently"
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium
                  text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
              >
                <Bookmark size={12} />
                Keep
              </button>
            )}

            {kept && (
              <span className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-emerald-600">
                <Check size={12} />
                Kept
              </span>
            )}

            <button
              onClick={() => setShowFolderPicker((v) => !v)}
              title="Move to folder"
              className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <FolderInput size={13} />
            </button>

            <button
              onClick={() => deleteNote(note.id)}
              title="Delete note"
              className="rounded-md p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 transition-colors"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Folder Picker Dropdown */}
      {showFolderPicker && (
        <div className="absolute bottom-16 left-4 right-4 z-20
          rounded-xl border border-border bg-popover p-2 shadow-xl">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-semibold text-foreground">Move to folder</span>
            <button
              onClick={() => setShowFolderPicker(false)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={13} />
            </button>
          </div>

          {offlineFolders.length > 0 ? (
            <div className="max-h-40 overflow-y-auto space-y-0.5 mb-1.5">
              {offlineFolders.map((f) => (
                <button
                  key={f.id}
                  onClick={() => handleMoveToFolder(f.name)}
                  className="w-full rounded-md px-2.5 py-1.5 text-left text-sm hover:bg-accent transition-colors"
                >
                  {f.name}
                </button>
              ))}
            </div>
          ) : (
            <p className="px-1 py-1 text-xs text-muted-foreground mb-1.5">
              No folders yet — create one below.
            </p>
          )}

          <div className="border-t border-border pt-1.5 px-1">
            <NewFolderInput onSubmit={handleMoveToFolder} />
          </div>
        </div>
      )}
    </div>
  );
}

function NewFolderInput({ onSubmit }: { onSubmit: (name: string) => void }) {
  const [value, setValue] = useState('');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) onSubmit(value.trim());
      }}
      className="flex gap-1"
    >
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="New folder name…"
        className="flex-1 rounded-md border border-input bg-background px-2.5 py-1.5
          text-xs outline-none focus:ring-1 focus:ring-primary/50"
      />
      <button
        type="submit"
        disabled={!value.trim()}
        className="rounded-md px-2.5 py-1.5 text-xs font-semibold bg-primary
          text-primary-foreground disabled:opacity-40 hover:bg-primary/90 transition-colors"
      >
        Create
      </button>
    </form>
  );
}
