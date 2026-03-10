import type { CanvasElement } from '@/types/canvas';

type AlignDir = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';
type DistributeDir = 'horizontal' | 'vertical';

export function alignElements(
  elements: CanvasElement[],
  direction: AlignDir
): CanvasElement[] {
  if (elements.length < 2) return elements;

  const bounds = elements.map((el) => ({
    id: el.id,
    x: el.x,
    y: el.y,
    r: el.x + el.width,
    b: el.y + el.height,
    cx: el.x + el.width / 2,
    cy: el.y + el.height / 2,
  }));

  const minX = Math.min(...bounds.map((b) => b.x));
  const minY = Math.min(...bounds.map((b) => b.y));
  const maxR = Math.max(...bounds.map((b) => b.r));
  const maxB = Math.max(...bounds.map((b) => b.b));
  const groupCx = (minX + maxR) / 2;
  const groupCy = (minY + maxB) / 2;

  return elements.map((el) => {
    let newX = el.x;
    let newY = el.y;

    switch (direction) {
      case 'left':    newX = minX; break;
      case 'center':  newX = groupCx - el.width / 2; break;
      case 'right':   newX = maxR - el.width; break;
      case 'top':     newY = minY; break;
      case 'middle':  newY = groupCy - el.height / 2; break;
      case 'bottom':  newY = maxB - el.height; break;
    }

    return { ...el, x: newX, y: newY };
  });
}

export function distributeElements(
  elements: CanvasElement[],
  direction: DistributeDir
): CanvasElement[] {
  if (elements.length < 3) return elements;

  if (direction === 'horizontal') {
    const sorted = [...elements].sort((a, b) => a.x - b.x);
    const first = sorted[0].x;
    const last = sorted[sorted.length - 1].x + sorted[sorted.length - 1].width;
    const totalWidth = sorted.reduce((sum, el) => sum + el.width, 0);
    const gap = (last - first - totalWidth) / (sorted.length - 1);
    let cursor = first;
    return elements.map((el) => {
      const s = sorted.find((e) => e.id === el.id)!;
      const newX = cursor;
      cursor += s.width + gap;
      return el.id === s.id ? { ...el, x: newX } : el;
    });
  } else {
    const sorted = [...elements].sort((a, b) => a.y - b.y);
    const first = sorted[0].y;
    const last = sorted[sorted.length - 1].y + sorted[sorted.length - 1].height;
    const totalHeight = sorted.reduce((sum, el) => sum + el.height, 0);
    const gap = (last - first - totalHeight) / (sorted.length - 1);
    let cursor = first;
    return elements.map((el) => {
      const s = sorted.find((e) => e.id === el.id)!;
      const newY = cursor;
      cursor += s.height + gap;
      return el.id === s.id ? { ...el, y: newY } : el;
    });
  }
}
