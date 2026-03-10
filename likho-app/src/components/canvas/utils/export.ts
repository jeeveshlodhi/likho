import rough from 'roughjs';
import type { CanvasElement, CameraState } from '@/types/canvas';
import { renderScene } from '../core/renderer';
import { DEFAULT_APP_STATE } from '@/types/canvas';

interface ExportOptions {
  background: 'transparent' | 'white';
  padding?: number;
}

function getSceneBounds(elements: CanvasElement[]) {
  if (elements.length === 0) return { x: 0, y: 0, width: 800, height: 600 };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const el of elements) {
    minX = Math.min(minX, el.x);
    minY = Math.min(minY, el.y);
    maxX = Math.max(maxX, el.x + el.width);
    maxY = Math.max(maxY, el.y + el.height);
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

export async function exportToPng(
  elements: CanvasElement[],
  options: ExportOptions = { background: 'white', padding: 40 }
): Promise<void> {
  const padding = options.padding ?? 40;
  const bounds = getSceneBounds(elements);

  const canvas = document.createElement('canvas');
  const dpr = 2;
  canvas.width = (bounds.width + padding * 2) * dpr;
  canvas.height = (bounds.height + padding * 2) * dpr;
  canvas.style.width = `${bounds.width + padding * 2}px`;
  canvas.style.height = `${bounds.height + padding * 2}px`;

  const ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);

  if (options.background === 'white') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  const camera: CameraState = {
    x: -bounds.x + padding,
    y: -bounds.y + padding,
    zoom: 1,
  };

  const rc = rough.canvas(canvas);
  renderScene({
    canvas,
    ctx,
    rc,
    elements,
    camera,
    selectedIds: new Set(),
    interaction: { type: 'idle' },
    appState: { ...DEFAULT_APP_STATE, showGrid: false },
    theme: 'light',
  });

  const url = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = url;
  link.download = `canvas-export-${Date.now()}.png`;
  link.click();
}

export function exportToJson(elements: CanvasElement[], camera: CameraState): void {
  const data = JSON.stringify({ elements, camera }, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `canvas-scene-${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportToSvg(elements: CanvasElement[]): void {
  const bounds = getSceneBounds(elements);
  const padding = 40;
  const w = bounds.width + padding * 2;
  const h = bounds.height + padding * 2;
  const offsetX = -bounds.x + padding;
  const offsetY = -bounds.y + padding;

  let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`;
  svgContent += `<rect width="${w}" height="${h}" fill="white"/>`;

  for (const el of elements) {
    const x = el.x + offsetX;
    const y = el.y + offsetY;
    const { width, height, strokeColor, backgroundColor, strokeWidth, opacity } = el;

    const strokeAttr = `stroke="${strokeColor}" stroke-width="${strokeWidth}"`;
    const fillAttr = `fill="${backgroundColor === 'transparent' ? 'none' : backgroundColor}"`;
    const opacityAttr = `opacity="${opacity / 100}"`;

    switch (el.type) {
      case 'rectangle':
        svgContent += `<rect x="${x}" y="${y}" width="${width}" height="${height}" ${fillAttr} ${strokeAttr} ${opacityAttr}/>`;
        break;
      case 'ellipse':
        svgContent += `<ellipse cx="${x + width / 2}" cy="${y + height / 2}" rx="${width / 2}" ry="${height / 2}" ${fillAttr} ${strokeAttr} ${opacityAttr}/>`;
        break;
      case 'text':
        if (el.text) {
          svgContent += `<text x="${x}" y="${y + (el.fontSize ?? 20)}" font-size="${el.fontSize ?? 20}" fill="${strokeColor}" ${opacityAttr}>${el.text}</text>`;
        }
        break;
      case 'line':
      case 'arrow':
        if (el.points?.length) {
          const pts = el.points.map((p) => `${p.x + el.x + offsetX},${p.y + el.y + offsetY}`).join(' ');
          svgContent += `<polyline points="${pts}" ${strokeAttr} fill="none" ${opacityAttr}/>`;
        }
        break;
    }
  }

  svgContent += '</svg>';

  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `canvas-export-${Date.now()}.svg`;
  link.click();
  URL.revokeObjectURL(url);
}

export async function loadFromJson(): Promise<{ elements: CanvasElement[]; camera: CameraState } | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) { resolve(null); return; }
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          resolve(data);
        } catch {
          resolve(null);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  });
}
