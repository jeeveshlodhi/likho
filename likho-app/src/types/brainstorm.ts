export type NodeType = 'idea' | 'question' | 'task' | 'note' | 'risk';

export interface BrainstormNode {
  id: string;
  title: string;
  content?: string;
  type: NodeType;
  x: number;   // world coordinates
  y: number;
  linkedNoteId?: string;
  isRoot?: boolean;
}

export interface BrainstormEdge {
  id: string;
  fromId: string;
  toId: string;
}

export interface BrainstormData {
  nodes: BrainstormNode[];
  edges: BrainstormEdge[];
  camera: { x: number; y: number; zoom: number };
}

export const NODE_TYPE_CONFIG: Record<NodeType, {
  label: string; emoji: string; color: string; bg: string; border: string;
}> = {
  idea:     { label: 'Idea',     emoji: '💡', color: '#92400e', bg: '#fef3c7', border: '#fbbf24' },
  question: { label: 'Question', emoji: '❓', color: '#1e40af', bg: '#dbeafe', border: '#60a5fa' },
  task:     { label: 'Task',     emoji: '✅', color: '#065f46', bg: '#d1fae5', border: '#34d399' },
  note:     { label: 'Note',     emoji: '📝', color: '#4c1d95', bg: '#ede9fe', border: '#a78bfa' },
  risk:     { label: 'Risk',     emoji: '⚠️', color: '#991b1b', bg: '#fee2e2', border: '#f87171' },
};

export function createDefaultBrainstormData(title = 'Central Idea'): BrainstormData {
  return {
    nodes: [
      {
        id: 'root',
        title,
        type: 'idea',
        x: 0,
        y: 0,
        isRoot: true,
      },
    ],
    edges: [],
    camera: { x: 0, y: 0, zoom: 1 },
  };
}

/** Convert world coords → screen coords */
export function worldToScreen(
  wx: number, wy: number,
  cam: { x: number; y: number; zoom: number },
  containerW: number, containerH: number,
) {
  return {
    sx: wx * cam.zoom + cam.x + containerW / 2,
    sy: wy * cam.zoom + cam.y + containerH / 2,
  };
}

/** Convert screen coords → world coords */
export function screenToWorld(
  sx: number, sy: number,
  cam: { x: number; y: number; zoom: number },
  containerW: number, containerH: number,
) {
  return {
    wx: (sx - cam.x - containerW / 2) / cam.zoom,
    wy: (sy - cam.y - containerH / 2) / cam.zoom,
  };
}
