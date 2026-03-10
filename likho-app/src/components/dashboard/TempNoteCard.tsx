import { useState } from 'react';
import { formatDistanceToNow, parseISO, differenceInHours } from 'date-fns';
import {
  Bookmark, Trash2, FolderInput, Clock, Sparkles,
  AlertTriangle, Check, X, Tag,
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

  // Border / background variant
  let cardClass = 'border-border';
  if (note.isPermanent) cardClass = 'border-emerald-400/50 bg-emerald-50/20 dark:bg-emerald-900/10';
  else if (isExpiringSoon) cardClass = 'border-amber-400/50 bg-amber-50/30 dark:bg-amber-900/10';

  return (
    <div
      className={`group relative flex flex-col rounded-xl border bg-card p-4 shadow-sm
        transition-all hover:shadow-md ${cardClass}`}
    >
      {/* ── Status stripe (top-right corner badge) ── */}
      {note.isPermanent && (
        <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full
          bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 text-[10px]
          font-medium text-emerald-700 dark:text-emerald-400">
          <Bookmark size={9} />
          Kept
        </span>
      )}
      {isExpiringSoon && !note.isPermanent && (
        <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full
          bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 text-[10px]
          font-medium text-amber-700 dark:text-amber-400">
          <AlertTriangle size={9} />
          Expiring
        </span>
      )}

      {/* ── Content ── */}
      <p className="flex-1 text-sm leading-relaxed text-foreground line-clamp-5
        whitespace-pre-wrap mb-3 pr-14">
        {note.content || <span className="text-muted-foreground italic">Empty note</span>}
      </p>

      {/* ── Tags ── */}
      {note.tags && note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          <Tag size={10} className="self-center text-muted-foreground/60" />
          {note.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full bg-primary/10
                px-2 py-0.5 text-[10px] font-medium text-primary"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* ── AI suggestion banner ── */}
      {suggestedName && !note.isPermanent && (
        <div
          className={`mb-3 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs
            ${note.aiConfidence === 'high'
              ? 'bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300'
              : 'bg-muted text-muted-foreground'
            }`}
        >
          <Sparkles size={10} />
          <span>
            Suggested:{' '}
            <button
              onClick={() => handleMoveToFolder(suggestedName)}
              className="font-semibold underline-offset-2 hover:underline"
            >
              {suggestedName}
            </button>
          </span>
          {note.aiConfidence === 'low' && (
            <span className="ml-auto text-[10px] opacity-60">low confidence</span>
          )}
        </div>
      )}

      {/* ── Footer ── */}
      <div className="flex items-center justify-between mt-auto pt-1">
        {/* Time label */}
        <div
          className={`flex items-center gap-1 text-[11px] ${
            isExpiringSoon && !note.isPermanent
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-muted-foreground'
          }`}
        >
          <Clock size={11} />
          <span>{timeLabel}</span>
        </div>

        {/* Action buttons — visible on hover */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
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
            <span className="flex items-center gap-1 rounded-md px-2 py-1 text-xs
              font-medium text-emerald-600">
              <Check size={12} />
              Kept
            </span>
          )}

          <button
            onClick={() => setShowFolderPicker((v) => !v)}
            title="Move to folder"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent
              hover:text-foreground transition-colors"
          >
            <FolderInput size={13} />
          </button>

          <button
            onClick={() => deleteNote(note.id)}
            title="Delete note"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-red-50
              hover:text-red-500 dark:hover:bg-red-900/20 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* ── Folder picker dropdown ── */}
      {showFolderPicker && (
        <div className="absolute bottom-full left-0 right-0 mb-1.5 z-20
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
                  className="w-full rounded-md px-2.5 py-1.5 text-left text-sm
                    hover:bg-accent transition-colors"
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
