import type { CanvasElement, Point, HandlePosition, CameraState } from '@/types/canvas';
import {
  distance,
  distanceToSegment,
  rotatePoint,
  rectsOverlap,
  getBoundingBox,
  type BoundingBox,
} from './geometry';

const HANDLE_RADIUS = 6;
const ROTATION_OFFSET = 28; // screen px above top edge

// ─── Handles ─────────────────────────────────────────────────────────────────

export function getHandlePositions(
  el: CanvasElement,
  camera: CameraState
): Map<HandlePosition, Point> {
  const { x, y, width, height, angle } = el;
  const cx = x + width / 2;
  const cy = y + height / 2;

  const rawPositions: [HandlePosition, Point][] = [
    ['nw', { x, y }],
    ['n', { x: cx, y }],
    ['ne', { x: x + width, y }],
    ['e', { x: x + width, y: cy }],
    ['se', { x: x + width, y: y + height }],
    ['s', { x: cx, y: y + height }],
    ['sw', { x, y: y + height }],
    ['w', { x, y: cy }],
    ['rotation', { x: cx, y: y - ROTATION_OFFSET / camera.zoom }],
  ];

  const result = new Map<HandlePosition, Point>();
  for (const [pos, pt] of rawPositions) {
    const rotated = angle !== 0 ? rotatePoint(pt, { x: cx, y: cy }, angle) : pt;
    result.set(pos, {
      x: rotated.x * camera.zoom + camera.x,
      y: rotated.y * camera.zoom + camera.y,
    });
  }
  return result;
}

export function hitTestHandle(
  el: CanvasElement,
  screenPoint: Point,
  camera: CameraState
): HandlePosition | null {
  // Skip line/arrow/pen elements – they don't have 8-handle resize
  if (el.type === 'line' || el.type === 'arrow' || el.type === 'pen') {
    return null;
  }
  const handles = getHandlePositions(el, camera);
  for (const [pos, pt] of handles.entries()) {
    if (distance(screenPoint, pt) <= HANDLE_RADIUS + 4) return pos;
  }
  return null;
}

// ─── Element Hit Testing ─────────────────────────────────────────────────────

export function hitTestElement(
  el: CanvasElement,
  worldPoint: Point,
  zoom = 1
): boolean {
  const threshold = Math.max(6, 6 / zoom);
  const { x, y, width, height, angle } = el;
  const cx = x + width / 2;
  const cy = y + height / 2;

  // Rotate point into element local space
  const local = angle !== 0 ? rotatePoint(worldPoint, { x: cx, y: cy }, -angle) : worldPoint;

  switch (el.type) {
    case 'rectangle':
    case 'image': {
      const filled = el.backgroundColor !== 'transparent' && el.backgroundColor !== '' && el.fillStyle !== 'none';
      if (filled) {
        return local.x >= x && local.x <= x + width && local.y >= y && local.y <= y + height;
      }
      const inX = local.x >= x - threshold && local.x <= x + width + threshold;
      const inY = local.y >= y - threshold && local.y <= y + height + threshold;
      const nearEdge =
        Math.abs(local.x - x) <= threshold ||
        Math.abs(local.x - (x + width)) <= threshold ||
        Math.abs(local.y - y) <= threshold ||
        Math.abs(local.y - (y + height)) <= threshold;
      return inX && inY && nearEdge;
    }

    case 'text': {
      return local.x >= x - threshold && local.x <= x + width + threshold &&
             local.y >= y - threshold && local.y <= y + height + threshold;
    }

    case 'diamond': {
      const hw = width / 2;
      const hh = height / 2;
      const normDist = Math.abs(local.x - cx) / hw + Math.abs(local.y - cy) / hh;
      return normDist <= 1 + threshold / Math.min(hw, hh);
    }

    case 'ellipse': {
      const rx = width / 2;
      const ry = height / 2;
      const dx = local.x - cx;
      const dy = local.y - cy;
      const dist = Math.sqrt((dx / rx) ** 2 + (dy / ry) ** 2);
      const filled = el.backgroundColor !== 'transparent' && el.backgroundColor !== '' && el.fillStyle !== 'none';
      const thr = threshold / Math.min(rx, ry);
      return filled ? dist <= 1 + thr : Math.abs(dist - 1) <= thr;
    }

    case 'line':
    case 'arrow': {
      if (!el.points || el.points.length < 2) return false;
      const pts = el.points.map((p) => ({ x: p.x + el.x, y: p.y + el.y }));
      for (let i = 0; i < pts.length - 1; i++) {
        if (distanceToSegment(worldPoint, pts[i], pts[i + 1]) <= threshold + el.strokeWidth) return true;
      }
      return false;
    }

    case 'pen': {
      if (!el.points || el.points.length < 2) return false;
      const pts = el.points.map((p) => ({ x: p.x + el.x, y: p.y + el.y }));
      for (let i = 0; i < pts.length - 1; i++) {
        if (distanceToSegment(worldPoint, pts[i], pts[i + 1]) <= threshold + el.strokeWidth) return true;
      }
      return false;
    }

    default:
      return false;
  }
}

// ─── Box Selection ────────────────────────────────────────────────────────────

export function hitTestBox(el: CanvasElement, box: BoundingBox): boolean {
  const bb = getBoundingBox(el);
  return rectsOverlap(bb, box);
}
