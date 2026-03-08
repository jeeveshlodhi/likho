import { useState, useCallback } from 'react';
import { ChevronRight, Folder, Pencil, Trash2, MoreHorizontal, Plus } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useWorkspaceStore } from '@/store/workspaceStore';
import type { FolderWithChildren, PageType, SpaceType } from '@/types/workspace';
import ContextMenu, { type ContextMenuItem } from '@/components/shared/ContextMenu';
import InlineEdit from '@/components/shared/InlineEdit';
import NoteItem from './NoteItem';
import NewPageModal from './NewPageModal';
import { SIDEBAR_NOTE_DRAG_TYPE } from './NoteItem';

interface FolderItemProps {
  folder: FolderWithChildren;
  depth?: number;
  onDropNote?: (noteId: string, targetFolderId: string) => void;
}

export default function FolderItem({ folder, depth = 0, onDropNote }: FolderItemProps) {
  const navigate = useNavigate();
  const {
    activeFolderId,
    toggleFolderExpanded,
    renameFolder,
    deleteFolder,
    createNote,
    createCanvas,
    createFolder,
    setActiveNote,
    setActiveFolder,
  } = useWorkspaceStore();

  const [newPageModalOpen, setNewPageModalOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const isActiveFolder = activeFolderId === folder.id;

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      if (!e.dataTransfer.types.includes(SIDEBAR_NOTE_DRAG_TYPE)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setIsDragOver(true);
    },
    []
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      setIsDragOver(false);
      if (!e.dataTransfer.types.includes(SIDEBAR_NOTE_DRAG_TYPE) || !onDropNote) return;
      e.preventDefault();
      try {
        const payload = JSON.parse(e.dataTransfer.getData(SIDEBAR_NOTE_DRAG_TYPE)) as {
          noteId: string;
          spaceType: string;
        };
        if (payload.spaceType !== folder.spaceType) return;
        if (!folder.isExpanded) toggleFolderExpanded(folder.id);
        onDropNote(payload.noteId, folder.id);
      } catch {
        // ignore invalid data
      }
    },
    [folder.id, folder.spaceType, folder.isExpanded, toggleFolderExpanded, onDropNote]
  );

  const handleChevronClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      toggleFolderExpanded(folder.id);
    },
    [folder.id, toggleFolderExpanded]
  );

  const handleOpenIndex = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setActiveFolder(folder.id);
      navigate(`/dashboard/folder/${folder.id}`);
    },
    [folder.id, setActiveFolder, navigate]
  );

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuPos({ x: e.clientX, y: e.clientY });
  }, []);

  const openNewPageModal = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setNewPageModalOpen(true);
  }, []);

  const handleNewPageSelect = useCallback(
    (_spaceType: SpaceType, templateId: PageType) => {
      if (!folder.isExpanded) toggleFolderExpanded(folder.id);
      const note =
        templateId === 'canvas'
          ? createCanvas(folder.id, folder.spaceType)
          : createNote(folder.id, folder.spaceType);
      setActiveNote(note.id);
      navigate(`/dashboard/note/${note.id}`);
    },
    [folder.id, folder.spaceType, folder.isExpanded, createNote, createCanvas, toggleFolderExpanded, setActiveNote, navigate]
  );

  const menuItems: ContextMenuItem[] = [
    {
      label: 'New page…',
      icon: <Plus size={14} />,
      onClick: openNewPageModal,
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
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`group flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-sm transition-colors hover:bg-accent ${
            isDragOver ? 'bg-primary/15 ring-1 ring-primary/30' : ''
          } ${
            isActiveFolder
              ? 'bg-primary/10 text-primary'
              : 'text-foreground'
          }`}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          <button
            type="button"
            onClick={handleChevronClick}
            className="flex-shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground"
            aria-label={folder.isExpanded ? 'Collapse folder' : 'Expand folder'}
          >
            <ChevronRight
              size={14}
              className={`transition-transform ${
                folder.isExpanded ? 'rotate-90' : ''
              }`}
            />
          </button>
          <button
            type="button"
            onClick={(e) => {
              if (!editing) handleOpenIndex(e);
            }}
            className="flex min-w-0 flex-1 items-center gap-1 rounded text-left"
          >
            <span className="flex-shrink-0">
              {folder.icon || <Folder size={14} className="text-muted-foreground" />}
            </span>
            <InlineEdit
              value={folder.name}
              editing={editing}
              onEditEnd={() => setEditing(false)}
              onSave={(name) => renameFolder(folder.id, name)}
              className="min-w-0 flex-1 text-sm"
            />
          </button>
          <div className="flex flex-shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            <button onClick={openNewPageModal} title="New page">
              <Plus size={14} className="text-muted-foreground hover:text-foreground" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                setMenuPos({ x: rect.left, y: rect.bottom + 4 });
              }}
            >
              <MoreHorizontal size={14} className="text-muted-foreground hover:text-foreground" />
            </button>
          </div>
        </div>

        {folder.isExpanded && (
          <div>
            {folder.children.map((child) => (
              <FolderItem key={child.id} folder={child} depth={depth + 1} onDropNote={onDropNote} />
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
      <NewPageModal
        open={newPageModalOpen}
        onClose={() => setNewPageModalOpen(false)}
        context={{ folderId: folder.id, spaceType: folder.spaceType }}
        onSelect={handleNewPageSelect}
      />
    </>
  );
}
