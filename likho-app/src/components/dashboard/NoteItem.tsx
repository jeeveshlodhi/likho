import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { FileText, Layout, Pencil, Trash2, MoreHorizontal } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import type { Note } from '@/types/workspace';
import ContextMenu, { type ContextMenuItem } from '@/components/shared/ContextMenu';
import InlineEdit from '@/components/shared/InlineEdit';

export const SIDEBAR_NOTE_DRAG_TYPE = 'application/x-likho-sidebar-note';

interface NoteItemProps {
  note: Note;
}

export default function NoteItem({ note }: NoteItemProps) {
  const navigate = useNavigate();
  const { activeNoteId, setActiveNote, deleteNote, updateNote } = useWorkspaceStore();
  const [editing, setEditing] = useState(false);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const isActive = activeNoteId === note.id;

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      e.dataTransfer.setData(SIDEBAR_NOTE_DRAG_TYPE, JSON.stringify({ noteId: note.id, spaceType: note.spaceType }));
      e.dataTransfer.effectAllowed = 'move';
      setIsDragging(true);
    },
    [note.id, note.spaceType]
  );

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

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
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        className={`group flex cursor-grab active:cursor-grabbing items-center gap-1.5 rounded-md px-2 py-1 text-sm transition-colors ${
          isDragging ? 'opacity-50' : ''
        } ${
          isActive
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-accent'
        }`}
      >
        <span className="flex-shrink-0">
          {note.icon || (note.pageType === 'canvas' ? <Layout size={14} className="text-muted-foreground" /> : <FileText size={14} className="text-muted-foreground" />)}
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
          <MoreHorizontal size={14} className="text-muted-foreground" />
        </button>
      </div>
      <ContextMenu items={menuItems} position={menuPos} onClose={() => setMenuPos(null)} />
    </>
  );
}
