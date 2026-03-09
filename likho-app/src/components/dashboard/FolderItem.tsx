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
import {
  getTemplateContent,
} from '@/lib/templateRegistry';

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

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newPageModalOpen, setNewPageModalOpen] = useState(false);

  const isActive = activeFolderId === folder.id;
  const isExpanded = folder.isExpanded;
  const paddingLeft = 8 + depth * 12;

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuPosition({ x: e.clientX, y: e.clientY });
    setIsMenuOpen(true);
  }, []);

  const openNewPageModal = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      setNewPageModalOpen(true);
    },
    [setNewPageModalOpen]
  );

  const handleNewPageSelect = useCallback(
    (_spaceType: SpaceType, templateId: PageType) => {
      if (!folder.isExpanded) toggleFolderExpanded(folder.id);

      const content = getTemplateContent(templateId);

      // Handle different content types
      let note;
      if (content.type === 'canvas') {
        note = createCanvas(folder.id, folder.spaceType);
        // Update with proper canvas content if needed
        if (content.data.elements?.length > 0) {
          note.content = content.data;
        }
      } else {
        // For all other types (note, kanban, meeting, etc.)
        note = createNote(folder.id, folder.spaceType, templateId, content.data);
      }

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
      onClick: () => setIsRenaming(true),
    },
    {
      label: 'Delete',
      icon: <Trash2 size={14} />,
      destructive: true,
      onClick: () => deleteFolder(folder.id),
    },
  ];

  const goToFolderIndex = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setActiveFolder(folder.id);
      navigate(`/dashboard/folder/${folder.id}`);
    },
    [folder.id, setActiveFolder, navigate]
  );

  // Drag and drop handlers
  const [isDragOver, setIsDragOver] = useState(false);
  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes(SIDEBAR_NOTE_DRAG_TYPE)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragOver(false);
  }, []);
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      setIsDragOver(false);
      if (!e.dataTransfer.types.includes(SIDEBAR_NOTE_DRAG_TYPE)) return;
      e.preventDefault();
      try {
        const payload = JSON.parse(e.dataTransfer.getData(SIDEBAR_NOTE_DRAG_TYPE)) as {
          noteId: string;
          spaceType: string;
        };
        if (payload.spaceType !== folder.spaceType) return;
        onDropNote?.(payload.noteId, folder.id);
      } catch {
        // ignore
      }
    },
    [folder.id, folder.spaceType, onDropNote]
  );

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div
        onContextMenu={handleContextMenu}
        className={`group mb-0.5 flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors ${
          isDragOver
            ? 'bg-primary/10 text-primary'
            : isActive
              ? 'bg-accent text-accent-foreground'
              : 'hover:bg-accent'
        }`}
        style={{ paddingLeft }}
      >
        <button
          onClick={() => toggleFolderExpanded(folder.id)}
          className="flex flex-1 items-center gap-1 overflow-hidden"
        >
          <ChevronRight
            size={14}
            className={`flex-shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
          />
          <Folder size={14} className="flex-shrink-0 text-muted-foreground" />
          {isRenaming ? (
            <InlineEdit
              initialValue={folder.name}
              onSave={(newName) => {
                renameFolder(folder.id, newName);
                setIsRenaming(false);
              }}
              onCancel={() => setIsRenaming(false)}
              className="min-w-0 flex-1"
            />
          ) : (
            <span
              onClick={goToFolderIndex}
              className="min-w-0 flex-1 truncate text-left"
              title={folder.name}
            >
              {folder.name}
            </span>
          )}
        </button>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
          <button
            onClick={openNewPageModal}
            title="New page"
            className="rounded p-0.5 hover:bg-accent"
          >
            <Plus size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuPosition({ x: e.clientX, y: e.clientY });
              setIsMenuOpen(true);
            }}
            className="rounded p-0.5 hover:bg-accent"
          >
            <MoreHorizontal size={14} />
          </button>
        </div>
      </div>

      <NewPageModal
        open={newPageModalOpen}
        onClose={() => setNewPageModalOpen(false)}
        context={{ folderId: folder.id, spaceType: folder.spaceType }}
        onSelect={handleNewPageSelect}
      />

      <ContextMenu
        items={menuItems}
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        position={menuPosition}
      />

      {isExpanded && (
        <div className="mb-0.5">
          {folder.children.map((child) => (
            <FolderItem
              key={child.id}
              folder={child}
              depth={depth + 1}
              onDropNote={onDropNote}
            />
          ))}
          {folder.notes.map((note) => (
            <div key={note.id} style={{ paddingLeft: paddingLeft + 16 }}>
              <NoteItem note={note} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
