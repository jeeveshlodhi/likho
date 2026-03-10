import rough from 'roughjs';
import type { CanvasElement, CameraState, AppState, InteractionState } from '@/types/canvas';
import { getHandlePositions } from './hitTest';
import {
  getArrowheadPoints,
  getLineEndpoints,
  normalizeRect,
} from './geometry';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RenderContext {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  rc: ReturnType<typeof rough.canvas>;
  elements: CanvasElement[];
  camera: CameraState;
  selectedIds: Set<string>;
  interaction: InteractionState;
  appState: AppState;
  theme: 'light' | 'dark';
}

// ─── Stroke line dash ────────────────────────────────────────────────────────

function getLineDash(style: string, width: number): number[] {
  if (style === 'dashed') return [width * 4, width * 3];
  if (style === 'dotted') return [width, width * 3];
  return [];
}

// ─── Rough options ────────────────────────────────────────────────────────────

function getRoughOptions(el: CanvasElement) {
  // Defensive defaults so undefined fields from old-format elements don't crash rough.js
  const fillStyle = el.fillStyle ?? 'hachure';
  const strokeStyle = el.strokeStyle ?? 'solid';
  const roughness = (typeof el.roughness === 'number' && isFinite(el.roughness)) ? el.roughness : 1;
  const seed = (typeof el.seed === 'number' && el.seed > 0) ? el.seed : Math.floor(Math.random() * 100000);
  const strokeWidth = (typeof el.strokeWidth === 'number' && el.strokeWidth > 0) ? el.strokeWidth : 2;
  const bg = el.backgroundColor ?? 'transparent';

  const hasFill = bg !== 'transparent' && bg !== '' && fillStyle !== 'none';
  const lineDash = getLineDash(strokeStyle, strokeWidth);

  return {
    stroke: el.strokeColor ?? '#1e1e1e',
    strokeWidth,
    roughness,
    seed,
    fill: hasFill ? bg : undefined,
    fillStyle: hasFill
      ? (fillStyle === 'cross-hatch' ? 'cross-hatch' : fillStyle === 'solid' ? 'solid' : 'hachure')
      : undefined,
    ...(lineDash.length ? { strokeLineDash: lineDash } : {}),
  };
}

// ─── Image cache ─────────────────────────────────────────────────────────────

const imageCache = new Map<string, HTMLImageElement>();

function loadImage(src: string): HTMLImageElement | null {
  if (imageCache.has(src)) return imageCache.get(src)!;
  const img = new Image();
  img.src = src;
  img.onload = () => imageCache.set(src, img);
  return null;
}

// ─── Element Rendering ────────────────────────────────────────────────────────

function renderElement(
  ctx: CanvasRenderingContext2D,
  rc: ReturnType<typeof rough.canvas>,
  el: CanvasElement
) {
  // Skip degenerate shapes that would crash rough.js
  const isShapeType = ['rectangle', 'ellipse', 'diamond'].includes(el.type);
  if (isShapeType && (el.width < 2 || el.height < 2)) return;

  ctx.save();
  ctx.globalAlpha = el.opacity / 100;

  const { x, y, width, height, angle } = el;
  const cx = x + width / 2;
  const cy = y + height / 2;

  if (angle !== 0) {
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.translate(-cx, -cy);
  }

  const opts = getRoughOptions(el);

  switch (el.type) {
    case 'rectangle': {
      const r = el.edgeStyle === 'round' ? Math.min(8, width / 4, height / 4) : 0;
      if (r > 0) {
        // Rounded rectangle via clip path then rough fill
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, r);
        if (opts.fill) {
          ctx.fillStyle = opts.fill;
          ctx.fill();
        }
        ctx.strokeStyle = el.strokeColor;
        ctx.lineWidth = el.strokeWidth;
        ctx.setLineDash(getLineDash(el.strokeStyle, el.strokeWidth));
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        rc.rectangle(x, y, width, height, opts);
      }
      break;
    }

    case 'ellipse': {
      rc.ellipse(x + width / 2, y + height / 2, width, height, opts);
      break;
    }

    case 'diamond': {
      const pts: [number, number][] = [
        [cx, y],
        [x + width, cy],
        [cx, y + height],
        [x, cy],
      ];
      rc.polygon(pts, opts);
      break;
    }

    case 'line': {
      if (!el.points || el.points.length < 2) break;
      const abs = el.points.map((p) => [p.x + el.x, p.y + el.y] as [number, number]);
      if (abs.length === 2) {
        rc.line(abs[0][0], abs[0][1], abs[1][0], abs[1][1], opts);
      } else {
        rc.linearPath(abs, opts);
      }
      break;
    }

    case 'arrow': {
      if (!el.points || el.points.length < 2) break;
      const abs = el.points.map((p) => [p.x + el.x, p.y + el.y] as [number, number]);
      if (abs.length === 2) {
        rc.line(abs[0][0], abs[0][1], abs[1][0], abs[1][1], opts);
      } else {
        rc.linearPath(abs, opts);
      }

      // Arrowhead
      const [start, end] = getLineEndpoints(el);
      const [a1, a2] = getArrowheadPoints(start, end, 14 + el.strokeWidth * 2);
      ctx.beginPath();
      ctx.moveTo(end.x, end.y);
      ctx.lineTo(a1.x, a1.y);
      ctx.lineTo(a2.x, a2.y);
      ctx.closePath();
      ctx.fillStyle = el.strokeColor;
      ctx.fill();
      break;
    }

    case 'pen': {
      if (!el.points || el.points.length < 2) break;
      const abs = el.points.map((p) => [p.x + el.x, p.y + el.y] as [number, number]);
      // Use canvas path for smoother pen
      ctx.beginPath();
      ctx.moveTo(abs[0][0], abs[0][1]);
      for (let i = 1; i < abs.length - 1; i++) {
        const mx = (abs[i][0] + abs[i + 1][0]) / 2;
        const my = (abs[i][1] + abs[i + 1][1]) / 2;
        ctx.quadraticCurveTo(abs[i][0], abs[i][1], mx, my);
      }
      ctx.lineTo(abs[abs.length - 1][0], abs[abs.length - 1][1]);
      ctx.strokeStyle = el.strokeColor;
      ctx.lineWidth = el.strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.setLineDash(getLineDash(el.strokeStyle, el.strokeWidth));
      ctx.stroke();
      ctx.setLineDash([]);
      break;
    }

    case 'text': {
      if (!el.text) break;
      const fs = el.fontSize ?? 20;
      const ff = el.fontFamily ?? 'sans-serif';
      ctx.font = `${fs}px ${ff}`;
      ctx.fillStyle = el.strokeColor;
      ctx.textAlign = el.textAlign ?? 'left';
      ctx.textBaseline = 'top';
      const lines = el.text.split('\n');
      const lineHeight = fs * 1.35;
      let startX = x;
      if (el.textAlign === 'center') startX = x + width / 2;
      if (el.textAlign === 'right') startX = x + width;
      lines.forEach((line, i) => {
        ctx.fillText(line, startX, y + i * lineHeight);
      });
      break;
    }

    case 'image': {
      if (!el.src) break;
      const img = loadImage(el.src);
      if (img) {
        ctx.drawImage(img, x, y, width, height);
      } else {
        // Placeholder
        ctx.strokeStyle = '#aaa';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(x, y, width, height);
        ctx.fillStyle = '#aaa';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '14px sans-serif';
        ctx.fillText('Loading…', cx, cy);
      }
      break;
    }
  }

  ctx.restore();
}

// ─── Grid ─────────────────────────────────────────────────────────────────────

function renderGrid(
  ctx: CanvasRenderingContext2D,
  camera: CameraState,
  width: number,
  height: number,
  gridSize: number,
  theme: 'light' | 'dark'
) {
  const color = theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';
  const zoom = camera.zoom;
  const scaledGrid = gridSize * zoom;

  const startX = ((camera.x % scaledGrid) + scaledGrid) % scaledGrid;
  const startY = ((camera.y % scaledGrid) + scaledGrid) % scaledGrid;

  ctx.save();
  ctx.fillStyle = color;

  for (let x = startX; x < width; x += scaledGrid) {
    for (let y = startY; y < height; y += scaledGrid) {
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

// ─── Selection Overlay ────────────────────────────────────────────────────────

function renderSelection(
  ctx: CanvasRenderingContext2D,
  elements: CanvasElement[],
  selectedIds: Set<string>,
  interaction: InteractionState,
  camera: CameraState,
  _theme: 'light' | 'dark'
) {
  const selected = elements.filter((el) => selectedIds.has(el.id));
  if (selected.length === 0) {
    // Draw selection box if dragging
    if (interaction.type === 'selecting') {
      const { startWorld, currentWorld } = interaction;
      const box = normalizeRect(startWorld.x, startWorld.y, currentWorld.x, currentWorld.y);
      const sx = box.x * camera.zoom + camera.x;
      const sy = box.y * camera.zoom + camera.y;
      const sw = box.width * camera.zoom;
      const sh = box.height * camera.zoom;
      ctx.save();
      ctx.strokeStyle = '#5b8af6';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(sx, sy, sw, sh);
      ctx.fillStyle = 'rgba(91,138,246,0.07)';
      ctx.fillRect(sx, sy, sw, sh);
      ctx.setLineDash([]);
      ctx.restore();
    }
    return;
  }

  ctx.save();

  const accent = '#5b8af6';
  const handleFill = '#fff';
  const handleStroke = accent;

  if (selected.length === 1) {
    const el = selected[0];
    const handles = getHandlePositions(el, camera);

    // Selection border
    const { x, y, width, height, angle } = el;
    const cx = (x + width / 2) * camera.zoom + camera.x;
    const cy = (y + height / 2) * camera.zoom + camera.y;
    const sw = width * camera.zoom;
    const sh = height * camera.zoom;
    const sx = cx - sw / 2;
    const sy = cy - sh / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.translate(-cx, -cy);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 3]);
    ctx.strokeRect(sx - 4, sy - 4, sw + 8, sh + 8);
    ctx.setLineDash([]);

    // Rotation handle line
    const rotHandle = handles.get('rotation')!;
    const topMid = handles.get('n')!;
    ctx.beginPath();
    ctx.moveTo(topMid.x, topMid.y - 4);
    ctx.lineTo(rotHandle.x, rotHandle.y);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    // Draw handles
    for (const [pos, pt] of handles.entries()) {
      ctx.beginPath();
      if (pos === 'rotation') {
        ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = accent;
        ctx.fill();
      } else {
        ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = handleFill;
        ctx.strokeStyle = handleStroke;
        ctx.lineWidth = 1.5;
        ctx.fill();
        ctx.stroke();
      }
    }
  } else {
    // Multi-select: draw bounding box around all
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const el of selected) {
      const sx = el.x * camera.zoom + camera.x;
      const sy = el.y * camera.zoom + camera.y;
      const ex = (el.x + el.width) * camera.zoom + camera.x;
      const ey = (el.y + el.height) * camera.zoom + camera.y;
      minX = Math.min(minX, sx);
      minY = Math.min(minY, sy);
      maxX = Math.max(maxX, ex);
      maxY = Math.max(maxY, ey);
    }
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 3]);
    ctx.strokeRect(minX - 6, minY - 6, maxX - minX + 12, maxY - minY + 12);
    ctx.setLineDash([]);
  }

  ctx.restore();
}

// ─── Main Scene Render ────────────────────────────────────────────────────────

export function renderScene({
  canvas,
  ctx,
  rc,
  elements,
  camera,
  selectedIds,
  interaction,
  appState,
  theme,
}: RenderContext) {
  const dpr = window.devicePixelRatio || 1;
  const cssW = canvas.width / dpr;
  const cssH = canvas.height / dpr;

  // Reset to a clean DPR-scaled transform on every frame.
  // This avoids stacking from multiple ctx.scale() calls on resize.
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // Clear in CSS pixels (DPR scale already applied above)
  ctx.clearRect(0, 0, cssW, cssH);

  // Background
  ctx.fillStyle = theme === 'dark' ? '#1a1a1a' : '#fafafa';
  ctx.fillRect(0, 0, cssW, cssH);

  // Grid
  if (appState.showGrid) {
    renderGrid(ctx, camera, cssW, cssH, appState.gridSize, theme);
  }

  // World transform (camera pan + zoom, on top of DPR scale)
  ctx.save();
  ctx.translate(camera.x, camera.y);
  ctx.scale(camera.zoom, camera.zoom);

  // Render elements in order
  for (const el of elements) {
    renderElement(ctx, rc, el);
  }

  ctx.restore();

  // Selection overlay (in CSS/screen coords, DPR scale still applied)
  renderSelection(ctx, elements, selectedIds, interaction, camera, theme);
}
