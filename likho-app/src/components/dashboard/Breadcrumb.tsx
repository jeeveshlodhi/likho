import { useMemo } from 'react';
import { ChevronRight, Cloud, HardDrive } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { getNoteBreadcrumb } from '@/utils/folderTree';
import type { Note } from '@/types/workspace';

interface BreadcrumbProps {
  note: Note;
}

export default function Breadcrumb({ note }: BreadcrumbProps) {
  const folders = useWorkspaceStore((s) => s.folders);

  const path = useMemo(() => getNoteBreadcrumb(folders, note), [folders, note]);

  const SpaceIcon = note.spaceType === 'online' ? Cloud : HardDrive;
  const spaceLabel = note.spaceType === 'online' ? 'Online Space' : 'Offline Space';

  return (
    <div className="flex items-center gap-1 text-sm text-neutral-400 dark:text-neutral-500">
      <SpaceIcon size={14} />
      <span>{spaceLabel}</span>
      {path.map((folder) => (
        <div key={folder.id} className="flex items-center gap-1">
          <ChevronRight size={12} />
          <span>{folder.name}</span>
        </div>
      ))}
      <ChevronRight size={12} />
      <span className="text-neutral-600 dark:text-neutral-300">
        {note.title || 'Untitled'}
      </span>
    </div>
  );
}
