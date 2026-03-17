import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { FileText, Pencil, Trash2, MoreHorizontal, Cloud, HardDrive } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import type { Note } from '@/types/workspace';
import ContextMenu, { type ContextMenuItem } from '@/components/shared/ContextMenu';
import InlineEdit from '@/components/shared/InlineEdit';
import { getTemplateById } from '@/lib/templateRegistry';

export const SIDEBAR_NOTE_DRAG_TYPE = 'application/x-likho-sidebar-note';
/** Space-specific drag type markers — present during dragover so drop zones can
 *  detect cross-space drags without reading the data payload (which is restricted). */
export const SIDEBAR_NOTE_ONLINE_TYPE = 'application/x-likho-sidebar-note-online';
export const SIDEBAR_NOTE_OFFLINE_TYPE = 'application/x-likho-sidebar-note-offline';

interface NoteItemProps {
  note: Note;
  /** Called when the user triggers "Move to Online/Offline" from the context menu. */
  onMoveToSpace?: (note: Note) => void;
}

// Get the appropriate icon for a note based on its pageType
function getNoteIcon(note: Note) {
  // If note has a custom icon set, use that
  if (note.icon) {
    return note.icon;
  }

  // Otherwise, get icon from template
  const template = note.pageType ? getTemplateById(note.pageType) : null;
  if (template) {
    const Icon = template.icon;
    return <Icon size={14} className="text-muted-foreground" />;
  }

  // Default fallback
  return <FileText size={14} className="text-muted-foreground" />;
}

export default function NoteItem({ note, onMoveToSpace }: NoteItemProps) {
  const navigate = useNavigate();
  const { activeNoteId, setActiveNote, deleteNote, updateNote } = useWorkspaceStore();
  const [editing, setEditing] = useState(false);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const isActive = activeNoteId === note.id;

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      e.dataTransfer.setData(
        SIDEBAR_NOTE_DRAG_TYPE,
        JSON.stringify({ noteId: note.id, spaceType: note.spaceType })
      );
      // Set space-specific marker so drop zones can detect cross-space drags during dragover
      e.dataTransfer.setData(
        note.spaceType === 'online' ? SIDEBAR_NOTE_ONLINE_TYPE : SIDEBAR_NOTE_OFFLINE_TYPE,
        ''
      );
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
    ...(onMoveToSpace
      ? [
          {
            label: note.spaceType === 'online' ? 'Move to Offline' : 'Move to Online',
            icon:
              note.spaceType === 'online' ? (
                <HardDrive size={14} />
              ) : (
                <Cloud size={14} />
              ),
            onClick: () => onMoveToSpace(note),
          },
        ]
      : []),
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
          {getNoteIcon(note)}
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
