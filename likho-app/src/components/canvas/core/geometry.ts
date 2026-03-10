import type { Point, CanvasElement, CameraState, BoundingBox } from '@/types/canvas';
export type { BoundingBox };

// ─── Coordinate Conversion ───────────────────────────────────────────────────

export function screenToWorld(x: number, y: number, camera: CameraState): Point {
  return {
    x: (x - camera.x) / camera.zoom,
    y: (y - camera.y) / camera.zoom,
  };
}

export function worldToScreen(x: number, y: number, camera: CameraState): Point {
  return {
    x: x * camera.zoom + camera.x,
    y: y * camera.zoom + camera.y,
  };
}

// ─── Basic Math ───────────────────────────────────────────────────────────────

export function distance(p1: Point, p2: Point): number {
  return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function normalizeAngle(angle: number): number {
  while (angle < 0) angle += Math.PI * 2;
  while (angle >= Math.PI * 2) angle -= Math.PI * 2;
  return angle;
}

export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

// ─── Point / Rotation ─────────────────────────────────────────────────────────

export function rotatePoint(point: Point, center: Point, angle: number): Point {
  if (angle === 0) return point;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
}

export function getElementCenter(el: CanvasElement): Point {
  return { x: el.x + el.width / 2, y: el.y + el.height / 2 };
}

// ─── Distance ─────────────────────────────────────────────────────────────────

export function distanceToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (dx === 0 && dy === 0) return distance(p, a);
  const t = clamp(((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy), 0, 1);
  return distance(p, { x: a.x + t * dx, y: a.y + t * dy });
}

// ─── Bounding Boxes ───────────────────────────────────────────────────────────

export function getBoundingBox(el: CanvasElement): BoundingBox {
  if ((el.type === 'pen' || el.type === 'line' || el.type === 'arrow') && el.points?.length) {
    const xs = el.points.map((p) => p.x + el.x);
    const ys = el.points.map((p) => p.y + el.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    return {
      x: minX,
      y: minY,
      width: Math.max(...xs) - minX || 1,
      height: Math.max(...ys) - minY || 1,
    };
  }
  return { x: el.x, y: el.y, width: el.width || 1, height: el.height || 1 };
}

export function getMultiSelectBounds(elements: CanvasElement[]): BoundingBox | null {
  if (elements.length === 0) return null;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const el of elements) {
    const b = getBoundingBox(el);
    minX = Math.min(minX, b.x);
    minY = Math.min(minY, b.y);
    maxX = Math.max(maxX, b.x + b.width);
    maxY = Math.max(maxY, b.y + b.height);
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

export function normalizeRect(
  x1: number, y1: number, x2: number, y2: number
): BoundingBox {
  return {
    x: Math.min(x1, x2),
    y: Math.min(y1, y2),
    width: Math.abs(x2 - x1),
    height: Math.abs(y2 - y1),
  };
}

// ─── Rect Overlap ─────────────────────────────────────────────────────────────

export function rectsOverlap(a: BoundingBox, b: BoundingBox): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

// ─── Line / Arrow Endpoint helpers ───────────────────────────────────────────

export function getLineEndpoints(el: CanvasElement): [Point, Point] {
  const pts = el.points ?? [];
  if (pts.length >= 2) {
    return [
      { x: pts[0].x + el.x, y: pts[0].y + el.y },
      { x: pts[pts.length - 1].x + el.x, y: pts[pts.length - 1].y + el.y },
    ];
  }
  return [
    { x: el.x, y: el.y },
    { x: el.x + el.width, y: el.y + el.height },
  ];
}

export function getArrowheadPoints(
  from: Point,
  to: Point,
  size: number = 12
): [Point, Point] {
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const a1: Point = {
    x: to.x - size * Math.cos(angle - Math.PI / 7),
    y: to.y - size * Math.sin(angle - Math.PI / 7),
  };
  const a2: Point = {
    x: to.x - size * Math.cos(angle + Math.PI / 7),
    y: to.y - size * Math.sin(angle + Math.PI / 7),
  };
  return [a1, a2];
}
