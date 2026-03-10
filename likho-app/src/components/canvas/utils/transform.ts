import type { CanvasElement, HandlePosition, Point } from '@/types/canvas';
import { rotatePoint } from '../core/geometry';

interface ResizeResult {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Compute new element bounds after dragging a resize handle.
 * All coordinates are in world space.
 */
export function applyResize(
  orig: CanvasElement,
  handle: HandlePosition,
  delta: Point,
  keepAspect: boolean
): ResizeResult {
  let { x, y, width, height, angle } = orig;

  // Rotate delta into element's local space
  const localDelta = angle !== 0
    ? (() => {
        const p = rotatePoint({ x: delta.x, y: delta.y }, { x: 0, y: 0 }, -angle);
        return p;
      })()
    : delta;

  const dx = localDelta.x;
  const dy = localDelta.y;
  const aspect = width / height;

  switch (handle) {
    case 'se': {
      let nw = width + dx;
      let nh = height + dy;
      if (keepAspect) { nh = nw / aspect; }
      width = Math.max(10, nw);
      height = Math.max(10, keepAspect ? width / aspect : nh);
      break;
    }
    case 'sw': {
      let nw = width - dx;
      let nh = height + dy;
      if (keepAspect) { nh = nw / aspect; }
      width = Math.max(10, nw);
      height = Math.max(10, keepAspect ? width / aspect : nh);
      x = orig.x + orig.width - width;
      break;
    }
    case 'ne': {
      let nw = width + dx;
      let nh = height - dy;
      if (keepAspect) { nh = nw / aspect; }
      width = Math.max(10, nw);
      height = Math.max(10, keepAspect ? width / aspect : nh);
      y = orig.y + orig.height - height;
      break;
    }
    case 'nw': {
      let nw = width - dx;
      let nh = height - dy;
      if (keepAspect) { nh = nw / aspect; }
      width = Math.max(10, nw);
      height = Math.max(10, keepAspect ? width / aspect : nh);
      x = orig.x + orig.width - width;
      y = orig.y + orig.height - height;
      break;
    }
    case 'e': {
      width = Math.max(10, width + dx);
      break;
    }
    case 'w': {
      const nw = Math.max(10, width - dx);
      x = orig.x + orig.width - nw;
      width = nw;
      break;
    }
    case 's': {
      height = Math.max(10, height + dy);
      break;
    }
    case 'n': {
      const nh = Math.max(10, height - dy);
      y = orig.y + orig.height - nh;
      height = nh;
      break;
    }
    default:
      break;
  }

  return { x, y, width, height };
}

/**
 * Compute new angle after rotating by mouse movement around element center.
 */
export function applyRotation(
  centerWorld: Point,
  currentScreenPt: Point,
  camera: { x: number; y: number; zoom: number },
  origAngle: number,
  startAngle: number
): number {
  const cx = centerWorld.x * camera.zoom + camera.x;
  const cy = centerWorld.y * camera.zoom + camera.y;
  const currentAngle = Math.atan2(currentScreenPt.y - cy, currentScreenPt.x - cx);
  return origAngle + (currentAngle - startAngle);
}
