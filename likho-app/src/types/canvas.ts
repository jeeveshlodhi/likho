// ─── Element Types ───────────────────────────────────────────────────────────

export type ElementType =
  | 'rectangle'
  | 'ellipse'
  | 'diamond'
  | 'arrow'
  | 'line'
  | 'pen'
  | 'text'
  | 'image';

export type FillStyle = 'hachure' | 'solid' | 'cross-hatch' | 'none';
export type StrokeStyle = 'solid' | 'dashed' | 'dotted';
export type TextAlign = 'left' | 'center' | 'right';
export type EdgeStyle = 'sharp' | 'round';

export type ToolType =
  | 'select'
  | 'rectangle'
  | 'ellipse'
  | 'diamond'
  | 'arrow'
  | 'line'
  | 'pen'
  | 'text'
  | 'eraser'
  | 'image'
  | 'hand';

// ─── Geometry ────────────────────────────────────────────────────────────────

export interface Point {
  x: number;
  y: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ─── Canvas Element ───────────────────────────────────────────────────────────

export interface CanvasElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;               // radians
  strokeColor: string;
  backgroundColor: string;
  fillStyle: FillStyle;
  strokeWidth: number;
  strokeStyle: StrokeStyle;
  roughness: number;           // 0–3
  opacity: number;             // 0–100
  points?: Point[];            // for pen, arrow, line (relative to element origin)
  text?: string;               // text elements
  fontSize?: number;
  fontFamily?: string;
  textAlign?: TextAlign;
  src?: string;                // base64 for images
  groupId?: string | null;
  seed: number;                // for rough.js deterministic rendering
  version: number;
  edgeStyle?: EdgeStyle;       // for rectangles
}

// ─── Camera ───────────────────────────────────────────────────────────────────

export interface CameraState {
  x: number;   // world origin offset from canvas top-left (screen px)
  y: number;
  zoom: number;
}

// ─── Scene ────────────────────────────────────────────────────────────────────

export interface CanvasScene {
  elements: CanvasElement[];
  camera: CameraState;
}

// ─── Selection Handles ────────────────────────────────────────────────────────

export type HandlePosition =
  | 'nw' | 'n' | 'ne'
  | 'e'  |       'w'
  | 'sw' | 's' | 'se'
  | 'rotation';

// ─── Application State ────────────────────────────────────────────────────────

export interface AppState {
  tool: ToolType;
  strokeColor: string;
  backgroundColor: string;
  fillStyle: FillStyle;
  strokeWidth: number;
  strokeStyle: StrokeStyle;
  roughness: number;
  opacity: number;
  fontSize: number;
  fontFamily: string;
  textAlign: TextAlign;
  edgeStyle: EdgeStyle;
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
}

export const DEFAULT_APP_STATE: AppState = {
  tool: 'select',
  strokeColor: '#1e1e1e',
  backgroundColor: 'transparent',
  fillStyle: 'hachure',
  strokeWidth: 2,
  strokeStyle: 'solid',
  roughness: 1,
  opacity: 100,
  fontSize: 20,
  fontFamily: "'Virgil', 'Segoe UI', sans-serif",
  textAlign: 'left',
  edgeStyle: 'round',
  showGrid: false,
  snapToGrid: false,
  gridSize: 20,
};

// ─── Interaction State ────────────────────────────────────────────────────────

export type InteractionState =
  | { type: 'idle' }
  | { type: 'drawing'; element: CanvasElement; startWorld: Point }
  | { type: 'pen'; element: CanvasElement; points: Point[] }
  | { type: 'moving'; startWorld: Point; origPositions: Map<string, Point> }
  | { type: 'resizing'; elementId: string; handle: HandlePosition; startWorld: Point; origElement: CanvasElement }
  | { type: 'rotating'; elementId: string; centerWorld: Point; startAngle: number; origAngle: number }
  | { type: 'panning'; startScreen: Point; origCamera: CameraState }
  | { type: 'selecting'; startWorld: Point; currentWorld: Point }
  | { type: 'erasing'; erasedIds: Set<string> };
