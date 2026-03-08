import type { Folder, Note, FolderWithChildren, SpaceType } from '@/types/workspace';

export function buildFolderTree(
  folders: Folder[],
  notes: Note[],
  spaceType: SpaceType
): FolderWithChildren[] {
  const spaceFolders = folders
    .filter((f) => f.spaceType === spaceType)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const spaceNotes = notes
    .filter((n) => n.spaceType === spaceType)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const folderMap = new Map<string, FolderWithChildren>();

  for (const folder of spaceFolders) {
    folderMap.set(folder.id, { ...folder, children: [], notes: [] });
  }

  // Attach notes to their folders
  for (const note of spaceNotes) {
    if (note.folderId && folderMap.has(note.folderId)) {
      folderMap.get(note.folderId)!.notes.push(note);
    }
  }

  // Build tree by attaching children to parents
  const roots: FolderWithChildren[] = [];
  for (const folder of folderMap.values()) {
    if (folder.parentId && folderMap.has(folder.parentId)) {
      folderMap.get(folder.parentId)!.children.push(folder);
    } else {
      roots.push(folder);
    }
  }

  return roots;
}

export function getDescendantFolderIds(
  folders: Folder[],
  parentId: string
): string[] {
  const ids: string[] = [];
  const queue = [parentId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const folder of folders) {
      if (folder.parentId === current) {
        ids.push(folder.id);
        queue.push(folder.id);
      }
    }
  }

  return ids;
}

export function getNoteBreadcrumb(
  folders: Folder[],
  note: Note
): Folder[] {
  const path: Folder[] = [];
  let currentId = note.folderId;

  while (currentId) {
    const folder = folders.find((f) => f.id === currentId);
    if (!folder) break;
    path.unshift(folder);
    currentId = folder.parentId;
  }

  return path;
}

export function getRootNotes(notes: Note[], spaceType: SpaceType): Note[] {
  return notes
    .filter((n) => n.spaceType === spaceType && !n.folderId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}
