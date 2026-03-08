import { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { ChevronRight, Cloud, HardDrive } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { getNoteBreadcrumb } from '@/utils/folderTree';
import type { Note } from '@/types/workspace';

interface BreadcrumbProps {
  note: Note;
}

export default function Breadcrumb({ note }: BreadcrumbProps) {
  const navigate = useNavigate();
  const folders = useWorkspaceStore((s) => s.folders);
  const setActiveFolder = useWorkspaceStore((s) => s.setActiveFolder);

  const path = useMemo(() => getNoteBreadcrumb(folders, note), [folders, note]);

  const goToFolderIndex = useCallback(
    (folderId: string) => {
      setActiveFolder(folderId);
      navigate(`/dashboard/folder/${folderId}`);
    },
    [setActiveFolder, navigate]
  );

  const SpaceIcon = note.spaceType === 'online' ? Cloud : HardDrive;
  const spaceLabel = note.spaceType === 'online' ? 'Online Space' : 'Offline Space';

  return (
    <div className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
      <SpaceIcon size={14} className="flex-shrink-0" />
      <span>{spaceLabel}</span>
      {path.map((folder) => (
        <div key={folder.id} className="flex items-center gap-1">
          <ChevronRight size={12} className="flex-shrink-0" />
          <button
            type="button"
            onClick={() => goToFolderIndex(folder.id)}
            className="hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 rounded px-0.5 -mx-0.5"
          >
            {folder.name}
          </button>
        </div>
      ))}
      <ChevronRight size={12} className="flex-shrink-0" />
      <span className="text-foreground">
        {note.title || 'Untitled'}
      </span>
    </div>
  );
}
