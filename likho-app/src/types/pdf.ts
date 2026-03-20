/** Coordinate system: all x/y/width/height are fractions (0–1) of the page's
 *  rendered CSS dimensions, making them zoom-independent.
 *  strokeWidth and fontSize are in "base pixels" at a 800px page width; scale
 *  them by (renderedPageWidth / 800) when drawing to canvas.
 */

export type PdfToolType =
  | 'select'
  | 'text'
  | 'draw'
  | 'highlight'
  | 'rectangle'
  | 'circle'
  | 'sticky'
  | 'edit-text';  // click existing PDF text to replace it

export interface Point {
  x: number; // fraction of page width
  y: number; // fraction of page height
}

export interface TextAnnotation {
  id: string;
  type: 'text';
  pageIndex: number;
  x: number;
  y: number;
  text: string;
  fontSize: number;  // base pixels (at 800px page width)
  color: string;     // hex
}

export interface DrawAnnotation {
  id: string;
  type: 'draw';
  pageIndex: number;
  points: Point[];
  color: string;
  strokeWidth: number; // base pixels
}

export interface HighlightAnnotation {
  id: string;
  type: 'highlight';
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;   // hex — typically a pale yellow/green
  opacity: number; // 0–1
}

export interface ShapeAnnotation {
  id: string;
  type: 'rectangle' | 'circle';
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  strokeColor: string;
  fillColor: string;   // 'transparent' or hex
  strokeWidth: number;
}

export interface StickyAnnotation {
  id: string;
  type: 'sticky';
  pageIndex: number;
  x: number; // fraction
  y: number;
  text: string;
  color: string; // background hex
}

/** Overlays white rectangle on original PDF text, then draws replacement text */
export interface TextReplacement {
  id: string;
  type: 'text-replacement';
  pageIndex: number;
  x: number; y: number; width: number; height: number;
  originalText: string;
  newText: string;
  fontSize: number;   // base px at 800px page width
  color: string;
}

export type Annotation =
  | TextAnnotation
  | DrawAnnotation
  | HighlightAnnotation
  | ShapeAnnotation
  | StickyAnnotation
  | TextReplacement;

export interface ToolStyle {
  color: string;          // primary color (stroke / text)
  highlightColor: string; // highlight fill
  strokeWidth: number;    // base px
  fillColor: string;      // shape fill ('transparent' | hex)
  fontSize: number;       // base px
  opacity: number;        // highlight opacity
}

export interface PdfWorkspaceData {
  pdfBase64: string | null;
  pdfName: string | null;
  annotations: Record<number, Annotation[]>; // pageIndex → list
  zoom: number;
}

export const DEFAULT_TOOL_STYLE: ToolStyle = {
  color: '#ef4444',
  highlightColor: '#fef08a',
  strokeWidth: 2,
  fillColor: 'transparent',
  fontSize: 16,
  opacity: 0.35,
};

export const DEFAULT_PDF_WORKSPACE: PdfWorkspaceData = {
  pdfBase64: null,
  pdfName: null,
  annotations: {},
  zoom: 1.0,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getAnnotationBBox(ann: Annotation): {
  x: number; y: number; width: number; height: number;
} {
  switch (ann.type) {
    case 'draw': {
      if (ann.points.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
      const xs = ann.points.map((p) => p.x);
      const ys = ann.points.map((p) => p.y);
      const x = Math.min(...xs);
      const y = Math.min(...ys);
      return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
    }
    case 'text': {
      const approxW = (ann.text.length * ann.fontSize * 0.55) / 800;
      const approxH = (ann.fontSize * 1.3) / 600;
      return { x: ann.x, y: ann.y - approxH, width: approxW, height: approxH };
    }
    case 'sticky':
      return { x: ann.x, y: ann.y, width: 200 / 800, height: 130 / 600 };
    case 'text-replacement':
      return { x: ann.x, y: ann.y, width: ann.width, height: ann.height };
    default:
      return { x: ann.x, y: ann.y, width: ann.width, height: ann.height };
  }
}

export function hitTestAnnotation(ann: Annotation, fx: number, fy: number): boolean {
  const EPS = 0.012;
  if (ann.type === 'text-replacement') {
    return fx >= ann.x && fx <= ann.x + ann.width && fy >= ann.y && fy <= ann.y + ann.height;
  }
  switch (ann.type) {
    case 'draw': {
      for (let i = 1; i < ann.points.length; i++) {
        if (pointSegDist({ x: fx, y: fy }, ann.points[i - 1], ann.points[i]) < EPS) return true;
      }
      return false;
    }
    case 'highlight':
    case 'rectangle': {
      const { x, y, width, height } = ann;
      return fx >= x && fx <= x + width && fy >= y && fy <= y + height;
    }
    case 'circle': {
      const { x, y, width, height } = ann;
      const cx = x + width / 2;
      const cy = y + height / 2;
      const rx = Math.abs(width / 2);
      const ry = Math.abs(height / 2);
      if (!rx || !ry) return false;
      return ((fx - cx) / rx) ** 2 + ((fy - cy) / ry) ** 2 <= 1;
    }
    case 'text': {
      const bbox = getAnnotationBBox(ann);
      return fx >= bbox.x && fx <= bbox.x + bbox.width && fy >= bbox.y && fy <= bbox.y + bbox.height;
    }
    case 'sticky':
      return fx >= ann.x && fx <= ann.x + 200 / 800 && fy >= ann.y && fy <= ann.y + 130 / 600;
  }
}

function pointSegDist(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (!lenSq) return Math.hypot(p.x - a.x, p.y - a.y);
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

export function moveAnnotation(ann: Annotation, dfx: number, dfy: number): Annotation {
  switch (ann.type) {
    case 'draw':
      return { ...ann, points: ann.points.map((p) => ({ x: p.x + dfx, y: p.y + dfy })) };
    case 'text':
    case 'sticky':
    case 'text-replacement':
      return { ...ann, x: ann.x + dfx, y: ann.y + dfy };
    default:
      return { ...ann, x: ann.x + dfx, y: ann.y + dfy } as Annotation;
  }
}
