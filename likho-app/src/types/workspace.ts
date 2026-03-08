export type SpaceType = 'online' | 'offline';

/** Page type: note = BlockNote doc, canvas = Excalidraw whiteboard */
export type PageType = 'note' | 'canvas';

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
  content: any; // BlockNote doc (note) or { document?, session? } (canvas)
  folderId: string | null;
  spaceType: SpaceType;
  pageType?: PageType; // default 'note'
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
