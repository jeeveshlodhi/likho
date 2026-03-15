import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { ChevronDown, Plus, Cloud, HardDrive, FolderPlus } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import type { PageType, SpaceType } from '@/types/workspace';
import { buildFolderTree, getRootNotes } from '@/utils/folderTree';
import { useWorkspace, useSpaces, useCreatePage, useMovePage } from '@/hooks/useWorkspace';
import {
  getTemplateById,
  getTemplateContent,
  type TemplateContent,
} from '@/lib/templateRegistry';
import FolderItem from './FolderItem';
import NoteItem from './NoteItem';
import NewPageModal from './NewPageModal';
import { SIDEBAR_NOTE_DRAG_TYPE } from './NoteItem';

interface SpaceSectionProps {
  spaceType: SpaceType;
}

const spaceConfig = {
  online: { label: 'Online Space', icon: Cloud },
  offline: { label: 'Offline Space', icon: HardDrive },
};

export default function SpaceSection({ spaceType }: SpaceSectionProps) {
  const navigate = useNavigate();
  const {
    folders,
    notes,
    expandedSpaces,
    toggleSpaceExpanded,
    createFolder,
    addFolder,
    createNote,
    createCanvas,
    addNote,
    setActiveNote,
  } = useWorkspaceStore();

  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newPageModalOpen, setNewPageModalOpen] = useState(false);

  const { data: workspace } = useWorkspace();
  const { data: spaces } = useSpaces(workspace?.id);
  const createPageMutation = useCreatePage();
  const movePageMutation = useMovePage();
  const moveNote = useWorkspaceStore((s) => s.moveNote);

  const config = spaceConfig[spaceType];
  const Icon = config.icon;
  const isExpanded = expandedSpaces[spaceType];

  const folderTree = useMemo(
    () => buildFolderTree(folders, notes, spaceType),
    [folders, notes, spaceType]
  );

  const rootNotes = useMemo(
    () => getRootNotes(notes, spaceType),
    [notes, spaceType]
  );

  const handleNewPageSelect = useCallback(
    async (resolvedSpaceType: SpaceType, templateId: PageType) => {
      const template = getTemplateById(templateId);
      const templateContent = getTemplateContent(templateId);
      const defaultTitle = template?.defaultTitle || 'Untitled';

      // For online space, create on backend first (all page types)
      if (resolvedSpaceType === 'online' && workspace?.id && spaces?.length && createPageMutation.mutateAsync) {
        const onlineSpace = spaces.find((s) => s.type === 'online');
        if (onlineSpace) {
          try {
            const page = await createPageMutation.mutateAsync({
              space_id: onlineSpace.id,
              title: defaultTitle,
              page_type: templateId,
              content: templateContent.data,
            });
            const note = {
              id: page.id,
              title: page.title || defaultTitle,
              content: page.content ?? templateContent.data,
              folderId: page.parent_id,
              spaceType: 'online' as const,
              pageType: (page.page_type as PageType) || templateId,
              icon: page.icon ?? null,
              coverImage: page.cover_url ?? undefined,
              sortOrder: page.sort_order ?? 0,
              createdAt: page.created_at,
              updatedAt: page.updated_at,
            };
            addNote(note);
            setActiveNote(note.id);
            navigate(`/dashboard/note/${note.id}`);
            return;
          } catch {
            // Fallback to local-only
          }
        }
      }

      // Offline / fallback: create locally using template registry
      const content = getTemplateContent(templateId);

      // Handle different content types
      if (content.type === 'canvas') {
        const note = createCanvas(null, resolvedSpaceType);
        // Update with proper canvas content if needed
        if (content.data.elements?.length > 0) {
          note.content = content.data;
        }
        setActiveNote(note.id);
        navigate(`/dashboard/note/${note.id}`);
        return;
      }

      // For all other types (note, kanban, meeting, etc.)
      const note = createNote(null, resolvedSpaceType, templateId, content.data);
      setActiveNote(note.id);
      navigate(`/dashboard/note/${note.id}`);
    },
    [spaceType, createNote, createCanvas, addNote, setActiveNote, navigate, workspace?.id, spaces, createPageMutation]
  );

  const handleCreateFolder = useCallback(async () => {
    const name = newFolderName.trim();
    if (!name) return;

    // Online space: create folder on backend first so it gets a UUID; then notes created inside it can use parent_id
    if (spaceType === 'online' && workspace?.id && spaces?.length && createPageMutation.mutateAsync) {
      const onlineSpace = spaces.find((s) => s.type === 'online');
      if (onlineSpace) {
        try {
          const page = await createPageMutation.mutateAsync({
            space_id: onlineSpace.id,
            title: name,
            is_folder: true,
          });
          addFolder({
            id: page.id,
            name: page.title || name,
            spaceType: 'online',
            parentId: page.parent_id,
            icon: page.icon ?? null,
            sortOrder: page.sort_order ?? 0,
            isExpanded: false,
            createdAt: page.created_at,
            updatedAt: page.updated_at,
          });
          setNewFolderName('');
          setCreatingFolder(false);
          return;
        } catch {
          // Fallback to local-only below
        }
      }
    }

    createFolder(name, spaceType);
    setNewFolderName('');
    setCreatingFolder(false);
  }, [newFolderName, spaceType, createFolder, addFolder, workspace?.id, spaces, createPageMutation]);

  const handleDropNote = useCallback(
    (noteId: string, targetFolderId: string | null) => {
      const note = notes.find((n) => n.id === noteId);
      if (!note || note.spaceType !== spaceType) return;
      moveNote(noteId, targetFolderId);
      if (spaceType === 'online' && workspace?.id && spaces?.length && movePageMutation.mutate) {
        const onlineSpace = spaces.find((s) => s.type === 'online');
        if (onlineSpace) {
          movePageMutation.mutate({
            pageId: noteId,
            parentId: targetFolderId,
            spaceId: onlineSpace.id,
          });
        }
      }
    },
    [spaceType, notes, moveNote, workspace?.id, spaces, movePageMutation]
  );

  const [rootZoneDragOver, setRootZoneDragOver] = useState(false);
  const handleRootDragOver = useCallback((e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes(SIDEBAR_NOTE_DRAG_TYPE)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setRootZoneDragOver(true);
  }, []);
  const handleRootDragLeave = useCallback((e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setRootZoneDragOver(false);
  }, []);
  const handleRootDrop = useCallback(
    (e: React.DragEvent) => {
      setRootZoneDragOver(false);
      if (!e.dataTransfer.types.includes(SIDEBAR_NOTE_DRAG_TYPE)) return;
      e.preventDefault();
      try {
        const payload = JSON.parse(e.dataTransfer.getData(SIDEBAR_NOTE_DRAG_TYPE)) as {
          noteId: string;
          spaceType: string;
        };
        if (payload.spaceType !== spaceType) return;
        handleDropNote(payload.noteId, null);
      } catch {
        // ignore
      }
    },
    [spaceType, handleDropNote]
  );

  return (
    <div className="mb-2">
      {/* Space header */}
      <div
        onClick={() => toggleSpaceExpanded(spaceType)}
        className="flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:bg-accent"
      >
        <div className="flex items-center gap-1.5">
          <ChevronDown
            size={12}
            className={`transition-transform ${isExpanded ? '' : '-rotate-90'}`}
          />
          <Icon size={14} />
          <span>{config.label}</span>
        </div>
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setCreatingFolder(true)}
            title="New folder"
            className="rounded p-0.5 hover:bg-accent"
          >
            <FolderPlus size={14} />
          </button>
          <button
            onClick={() => setNewPageModalOpen(true)}
            title="New page"
            className="rounded p-0.5 hover:bg-accent"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      <NewPageModal
        open={newPageModalOpen}
        onClose={() => setNewPageModalOpen(false)}
        context={{ folderId: null, spaceType }}
        onSelect={handleNewPageSelect}
      />

      {/* Content */}
      {isExpanded && (
        <div className="mt-0.5">
          {/* Inline folder creation */}
          {creatingFolder && (
            <div className="flex items-center gap-1 px-2 py-1">
              <FolderPlus size={14} className="flex-shrink-0 text-neutral-400" />
              <input
                autoFocus
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onBlur={() => {
                  if (newFolderName.trim()) handleCreateFolder();
                  else setCreatingFolder(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateFolder();
                  if (e.key === 'Escape') setCreatingFolder(false);
                }}
                placeholder="Folder name..."
                className="w-full rounded border border-input bg-background px-1 py-0.5 text-sm text-foreground outline-none ring-ring focus:ring-2"
              />
            </div>
          )}

          {/* Root drop zone: drop here to remove note from folder */}
          <div
            onDragOver={handleRootDragOver}
            onDragLeave={handleRootDragLeave}
            onDrop={handleRootDrop}
            className={`mb-0.5 rounded-md border border-dashed px-2 py-1.5 text-center text-xs transition-colors ${rootZoneDragOver
              ? 'border-primary/50 bg-primary/10 text-primary'
              : folderTree.length === 0 && rootNotes.length === 0
                ? 'border-border text-muted-foreground'
                : 'border-transparent text-muted-foreground/50 hover:border-border hover:text-muted-foreground'
              }`}
          >
            {rootZoneDragOver ? 'Drop to move out of folder' : folderTree.length === 0 && rootNotes.length === 0 ? 'No folder' : 'Drop here for root level'}
          </div>

          {/* Folders */}
          {folderTree.map((folder) => (
            <FolderItem key={folder.id} folder={folder} onDropNote={(noteId, targetFolderId) => handleDropNote(noteId, targetFolderId)} />
          ))}

          {/* Root notes (not in any folder) */}
          {rootNotes.map((note) => (
            <div key={note.id} className="pl-2">
              <NoteItem note={note} />
            </div>
          ))}

          {/* Empty state */}
          {folderTree.length === 0 && rootNotes.length === 0 && !creatingFolder && (
            <p className="px-3 py-2 text-xs text-muted-foreground">
              No pages yet. Click + to create one.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
