export type SpaceType = 'online' | 'offline';

export interface Folder {
  id: string;
  name: string;
  spaceType: SpaceType;
  parentId: string | null;
  icon: string | null;
  sortOrder: number;
  isExpanded: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: any; // BlockNote PartialBlock[]
  folderId: string | null;
  spaceType: SpaceType;
  icon: string | null;
  coverImage?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface FolderWithChildren extends Folder {
  children: FolderWithChildren[];
  notes: Note[];
}
