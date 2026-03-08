import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { ChevronDown, Plus, Cloud, HardDrive, FolderPlus } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import type { SpaceType } from '@/types/workspace';
import { buildFolderTree, getRootNotes } from '@/utils/folderTree';
import FolderItem from './FolderItem';
import NoteItem from './NoteItem';

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
    createNote,
    setActiveNote,
  } = useWorkspaceStore();

  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

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

  const handleNewNote = useCallback(() => {
    const note = createNote(null, spaceType);
    setActiveNote(note.id);
    navigate(`/dashboard/note/${note.id}`);
  }, [spaceType, createNote, setActiveNote, navigate]);

  const handleCreateFolder = useCallback(() => {
    const name = newFolderName.trim();
    if (name) {
      createFolder(name, spaceType);
      setNewFolderName('');
      setCreatingFolder(false);
    }
  }, [newFolderName, spaceType, createFolder]);

  return (
    <div className="mb-2">
      {/* Space header */}
      <div
        onClick={() => toggleSpaceExpanded(spaceType)}
        className="flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-500 transition-colors hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-700/50"
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
            className="rounded p-0.5 hover:bg-neutral-200 dark:hover:bg-neutral-600"
          >
            <FolderPlus size={14} />
          </button>
          <button
            onClick={handleNewNote}
            title="New note"
            className="rounded p-0.5 hover:bg-neutral-200 dark:hover:bg-neutral-600"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

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
                className="w-full rounded border border-blue-400 bg-white px-1 py-0.5 text-sm outline-none dark:bg-neutral-800"
              />
            </div>
          )}

          {/* Folders */}
          {folderTree.map((folder) => (
            <FolderItem key={folder.id} folder={folder} />
          ))}

          {/* Root notes (not in any folder) */}
          {rootNotes.map((note) => (
            <div key={note.id} className="pl-2">
              <NoteItem note={note} />
            </div>
          ))}

          {/* Empty state */}
          {folderTree.length === 0 && rootNotes.length === 0 && !creatingFolder && (
            <p className="px-3 py-2 text-xs text-neutral-400 dark:text-neutral-500">
              No notes yet. Click + to create one.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
