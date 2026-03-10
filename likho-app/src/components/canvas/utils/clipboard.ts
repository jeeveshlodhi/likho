import type { CanvasElement } from '@/types/canvas';
import { nanoid } from 'nanoid';

const PASTE_OFFSET = 20;

export function copyElements(elements: CanvasElement[]): CanvasElement[] {
  return elements.map((el) => ({ ...el }));
}

export function pasteElements(
  clipboard: CanvasElement[],
  offsetX = PASTE_OFFSET,
  offsetY = PASTE_OFFSET
): CanvasElement[] {
  return clipboard.map((el) => ({
    ...el,
    id: nanoid(),
    x: el.x + offsetX,
    y: el.y + offsetY,
    version: el.version + 1,
    seed: Math.floor(Math.random() * 100000),
  }));
}

export function duplicateElements(elements: CanvasElement[]): CanvasElement[] {
  return pasteElements(elements);
}

export async function copyAsPng(
  canvas: HTMLCanvasElement,
  _elements: CanvasElement[],
  _selectedIds: Set<string>
): Promise<void> {
  try {
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
    });
  } catch {
    // ignore
  }
}
