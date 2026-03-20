export type SpaceType = 'online' | 'offline';

/** Page type: note = BlockNote doc, canvas = Custom Canvas, kanban = Task board, etc */
export type PageType =
  | 'note'
  | 'canvas'
  | 'kanban'
  | 'meeting'
  | 'project'
  | 'journal'
  | 'documentation'
  | 'brainstorm'
  | 'pdf'
  | 'weekly_review'
  | 'reading_notes';

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

export type KanbanPriority = 'critical' | 'high' | 'medium' | 'low';

export interface KanbanLabel {
  id: string;
  name: string;
  color: string;
}

export interface KanbanCard {
  id: string;
  content: string;
  description?: string;
  priority?: KanbanPriority;
  labels?: string[]; // label IDs
  dueDate?: string;  // ISO date string
  createdAt?: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  cardIds: string[];
  color?: string;     // accent color hex
  wipLimit?: number;
}

export interface KanbanBoardData {
  columns: string[];
  columnData: Record<string, KanbanColumn>;
  cardData: Record<string, KanbanCard>;
  labels?: KanbanLabel[]; // board-level label definitions
}

export interface Note {
  id: string;
  title: string;
  content?: any | KanbanBoardData; // BlockNote content, CanvasScene, or KanbanBoardData
  folderId: string | null;
  spaceType: SpaceType;
  icon: string | null;
  coverImage?: string;
  sortOrder: number;
  pageType?: PageType;
  createdAt: string;
  updatedAt: string;
}

export interface FolderWithChildren extends Folder {
  children: FolderWithChildren[];
  notes: Note[];
}
