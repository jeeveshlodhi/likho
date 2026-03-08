import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { FileText, Pencil, Trash2, MoreHorizontal } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import type { Note } from '@/types/workspace';
import ContextMenu, { type ContextMenuItem } from '@/components/shared/ContextMenu';
import InlineEdit from '@/components/shared/InlineEdit';

interface NoteItemProps {
  note: Note;
}

export default function NoteItem({ note }: NoteItemProps) {
  const navigate = useNavigate();
  const { activeNoteId, setActiveNote, deleteNote, updateNote } = useWorkspaceStore();
  const [editing, setEditing] = useState(false);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);

  const isActive = activeNoteId === note.id;

  const handleClick = useCallback(() => {
    setActiveNote(note.id);
    navigate(`/dashboard/note/${note.id}`);
  }, [note.id, setActiveNote, navigate]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuPos({ x: e.clientX, y: e.clientY });
  }, []);

  const menuItems: ContextMenuItem[] = [
    {
      label: 'Rename',
      icon: <Pencil size={14} />,
      onClick: () => setEditing(true),
    },
    {
      label: 'Delete',
      icon: <Trash2 size={14} />,
      onClick: () => deleteNote(note.id),
      variant: 'danger',
    },
  ];

  return (
    <>
      <div
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        className={`group flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-sm transition-colors ${
          isActive
            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
            : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-700/50'
        }`}
      >
        <span className="flex-shrink-0">
          {note.icon || <FileText size={14} className="text-neutral-400" />}
        </span>
        <InlineEdit
          value={note.title || 'Untitled'}
          editing={editing}
          onEditEnd={() => setEditing(false)}
          onSave={(name) => updateNote(note.id, { title: name })}
          className="flex-1 text-sm"
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            const rect = e.currentTarget.getBoundingClientRect();
            setMenuPos({ x: rect.left, y: rect.bottom + 4 });
          }}
          className="flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
        >
          <MoreHorizontal size={14} className="text-neutral-400" />
        </button>
      </div>
      <ContextMenu items={menuItems} position={menuPos} onClose={() => setMenuPos(null)} />
    </>
  );
}
