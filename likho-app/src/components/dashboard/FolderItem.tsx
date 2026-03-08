import { useState, useCallback } from 'react';
import { ChevronRight, Folder, Pencil, Trash2, MoreHorizontal, Plus } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useWorkspaceStore } from '@/store/workspaceStore';
import type { FolderWithChildren } from '@/types/workspace';
import ContextMenu, { type ContextMenuItem } from '@/components/shared/ContextMenu';
import InlineEdit from '@/components/shared/InlineEdit';
import NoteItem from './NoteItem';

interface FolderItemProps {
  folder: FolderWithChildren;
  depth?: number;
}

export default function FolderItem({ folder, depth = 0 }: FolderItemProps) {
  const navigate = useNavigate();
  const {
    toggleFolderExpanded,
    renameFolder,
    deleteFolder,
    createNote,
    createFolder,
    setActiveNote,
  } = useWorkspaceStore();

  const [editing, setEditing] = useState(false);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);

  const handleToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      toggleFolderExpanded(folder.id);
    },
    [folder.id, toggleFolderExpanded]
  );

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuPos({ x: e.clientX, y: e.clientY });
  }, []);

  const handleNewNote = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const note = createNote(folder.id, folder.spaceType);
      if (!folder.isExpanded) toggleFolderExpanded(folder.id);
      setActiveNote(note.id);
      navigate(`/dashboard/note/${note.id}`);
    },
    [folder.id, folder.spaceType, folder.isExpanded, createNote, toggleFolderExpanded, setActiveNote, navigate]
  );

  const menuItems: ContextMenuItem[] = [
    {
      label: 'New Note',
      icon: <Plus size={14} />,
      onClick: () => {
        const note = createNote(folder.id, folder.spaceType);
        if (!folder.isExpanded) toggleFolderExpanded(folder.id);
        setActiveNote(note.id);
        navigate(`/dashboard/note/${note.id}`);
      },
    },
    {
      label: 'New Subfolder',
      icon: <Folder size={14} />,
      onClick: () => {
        createFolder('New Folder', folder.spaceType, folder.id);
        if (!folder.isExpanded) toggleFolderExpanded(folder.id);
      },
    },
    {
      label: 'Rename',
      icon: <Pencil size={14} />,
      onClick: () => setEditing(true),
    },
    {
      label: 'Delete',
      icon: <Trash2 size={14} />,
      onClick: () => deleteFolder(folder.id),
      variant: 'danger',
    },
  ];

  return (
    <>
      <div onContextMenu={handleContextMenu}>
        <div
          onClick={handleToggle}
          className="group flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700/50"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          <ChevronRight
            size={14}
            className={`flex-shrink-0 text-neutral-400 transition-transform ${
              folder.isExpanded ? 'rotate-90' : ''
            }`}
          />
          <span className="flex-shrink-0">
            {folder.icon || <Folder size={14} className="text-neutral-400" />}
          </span>
          <InlineEdit
            value={folder.name}
            editing={editing}
            onEditEnd={() => setEditing(false)}
            onSave={(name) => renameFolder(folder.id, name)}
            className="flex-1 text-sm"
          />
          <div className="flex flex-shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            <button onClick={handleNewNote} title="New note">
              <Plus size={14} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                setMenuPos({ x: rect.left, y: rect.bottom + 4 });
              }}
            >
              <MoreHorizontal size={14} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200" />
            </button>
          </div>
        </div>

        {folder.isExpanded && (
          <div>
            {folder.children.map((child) => (
              <FolderItem key={child.id} folder={child} depth={depth + 1} />
            ))}
            {folder.notes.map((note) => (
              <div key={note.id} style={{ paddingLeft: `${(depth + 1) * 12 + 8}px` }}>
                <NoteItem note={note} />
              </div>
            ))}
          </div>
        )}
      </div>
      <ContextMenu items={menuItems} position={menuPos} onClose={() => setMenuPos(null)} />
    </>
  );
}
