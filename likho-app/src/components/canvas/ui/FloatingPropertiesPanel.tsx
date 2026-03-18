import React, { useRef, useMemo } from 'react';
import type { CanvasElement, CameraState, StrokeStyle } from '@/types/canvas';
import { worldToScreen, getMultiSelectBounds } from '../core/geometry';
import {
  ChevronsUp, ChevronsDown, MoveUp, MoveDown,
  AlignLeft, AlignCenter, AlignRight,
} from 'lucide-react';

// ─── Layout constants ────────────────────────────────────────────────────────

const PANEL_W = 372;
const ROW_H   = 48;   // one row of controls
const GAP     = 12;   // gap between panel and selection bbox
const TOP_CLEAR    = 56;  // clear of the TopBar
const BOTTOM_CLEAR = 64;  // clear of the Toolbar

// ─── Internal primitives ─────────────────────────────────────────────────────

function Divider() {
  return <div className="w-px h-5 bg-border mx-1 flex-shrink-0" />;
}

/** Segmented control — renders a row of toggle buttons. */
function Seg<T extends string | number>({
  value, options, onChange, render,
}: {
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
  render: (v: T) => React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {options.map((opt) => (
        <button
          key={String(opt)}
          onClick={() => onChange(opt)}
          className={`w-7 h-7 rounded flex items-center justify-center text-xs transition-all ${
            value === opt
              ? 'bg-blue-500 text-white shadow-sm'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground'
          }`}
        >
          {render(opt)}
        </button>
      ))}
    </div>
  );
}

/** Color swatch that opens a native colour picker on click. */
function ColorSwatch({
  label, value, onChange,
}: {
  label: string;
  value: string;
  onChange: (c: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const transparent = value === 'transparent' || value === '';

  return (
    <div className="flex flex-col items-center gap-0.5" title={label}>
      <button
        onClick={() => ref.current?.click()}
        className="w-6 h-6 rounded border-2 border-border shadow-sm hover:scale-110 transition-transform overflow-hidden"
        style={{
          background: transparent
            ? 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 0 0 / 8px 8px'
            : value,
        }}
      />
      <span className="text-[9px] text-muted-foreground leading-none select-none">{label}</span>
      <input
        ref={ref}
        type="color"
        value={transparent ? '#ffffff' : value}
        onChange={(e) => onChange(e.target.value)}
        className="sr-only"
      />
    </div>
  );
}

/** Small icon button. */
function IBtn({
  title, onClick, children,
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="w-7 h-7 rounded flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
    >
      {children}
    </button>
  );
}

// ─── Stroke-width dot preview ─────────────────────────────────────────────────

function StrokeDot({ w }: { w: number }) {
  return (
    <div
      className="rounded-full bg-current"
      style={{ width: 14, height: Math.min(w + 1, 6) }}
    />
  );
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface Props {
  selectedElements: CanvasElement[];
  allElements: CanvasElement[];
  camera: CameraState;
  containerWidth: number;
  containerHeight: number;
  onElementsChange: (elements: CanvasElement[]) => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FloatingPropertiesPanel({
  selectedElements,
  allElements,
  camera,
  containerWidth,
  containerHeight,
  onElementsChange,
  onBringForward,
  onSendBackward,
  onBringToFront,
  onSendToBack,
}: Props) {
  if (selectedElements.length === 0 || containerWidth === 0) return null;

  const el = selectedElements[0];

  // Derive flags
  const allText  = selectedElements.every((e) => e.type === 'text');
  const noFill   = selectedElements.every(
    (e) => e.type === 'line' || e.type === 'arrow' || e.type === 'pen' || e.type === 'text'
  );
  const panelRows = allText ? 2 : 1;
  const panelH    = ROW_H * panelRows + (panelRows > 1 ? 1 : 0); // +1 for divider

  // Apply patch to all selected elements
  const update = (patch: Partial<CanvasElement>) => {
    const ids = new Set(selectedElements.map((e) => e.id));
    onElementsChange(allElements.map((e) => (ids.has(e.id) ? { ...e, ...patch } : e)));
  };

  // ── Panel position ─────────────────────────────────────────────────────────
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { panelX, panelY } = useMemo(() => {
    const bounds = getMultiSelectBounds(selectedElements);
    if (!bounds) return { panelX: 8, panelY: TOP_CLEAR };

    const topLeft     = worldToScreen(bounds.x, bounds.y, camera);
    const bottomRight = worldToScreen(bounds.x + bounds.width, bounds.y + bounds.height, camera);

    const centerX = (topLeft.x + bottomRight.x) / 2;
    const x = Math.max(8, Math.min(containerWidth - PANEL_W - 8, centerX - PANEL_W / 2));

    // prefer above the selection
    let y = topLeft.y - panelH - GAP;
    if (y < TOP_CLEAR) {
      // fall back below
      y = bottomRight.y + GAP;
    }
    // clamp from the bottom
    y = Math.min(y, containerHeight - BOTTOM_CLEAR - panelH);

    return { panelX: x, panelY: y };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedElements, camera, containerWidth, containerHeight, panelH]);

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        position: 'absolute',
        left: panelX,
        top: panelY,
        width: PANEL_W,
        zIndex: 25,
      }}
      className="bg-background/95 backdrop-blur-sm border border-border rounded-xl shadow-xl"
      // stop canvas from intercepting mouse events while interacting with the panel
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* ── Row 1: shared style controls ──────────────────────────────── */}
      <div className="flex items-center gap-0.5 px-3 py-2.5">

        {/* Colors */}
        <div className="flex items-center gap-2.5">
          <ColorSwatch
            label="Stroke"
            value={el.strokeColor}
            onChange={(c) => update({ strokeColor: c })}
          />
          {!noFill && (
            <ColorSwatch
              label="Fill"
              value={el.backgroundColor}
              onChange={(c) => update({ backgroundColor: c })}
            />
          )}
        </div>

        <Divider />

        {/* Stroke width */}
        <Seg
          value={el.strokeWidth}
          options={[1, 2, 4, 6] as const}
          onChange={(w) => update({ strokeWidth: w })}
          render={(w) => <StrokeDot w={w} />}
        />

        <Divider />

        {/* Stroke style */}
        <Seg
          value={el.strokeStyle}
          options={['solid', 'dashed', 'dotted'] as const}
          onChange={(s) => update({ strokeStyle: s as StrokeStyle })}
          render={(s) => (
            <span className="font-mono text-sm leading-none">
              {s === 'solid' ? '─' : s === 'dashed' ? '╌' : '⋯'}
            </span>
          )}
        />

        <Divider />

        {/* Opacity */}
        <div className="flex items-center gap-1.5">
          <input
            type="range"
            min={10} max={100} step={5}
            value={el.opacity}
            onChange={(e) => update({ opacity: Number(e.target.value) })}
            className="w-14 h-1 accent-blue-500"
            title={`Opacity: ${el.opacity}%`}
          />
          <span className="text-[11px] text-muted-foreground w-7 tabular-nums text-right">
            {el.opacity}%
          </span>
        </div>

        <Divider />

        {/* Layer / Z-order */}
        <div className="flex items-center gap-0.5">
          <IBtn title="Bring to front (Ctrl+Shift+])" onClick={onBringToFront}>
            <ChevronsUp size={14} />
          </IBtn>
          <IBtn title="Bring forward (Ctrl+])" onClick={onBringForward}>
            <MoveUp size={13} />
          </IBtn>
          <IBtn title="Send backward (Ctrl+[)" onClick={onSendBackward}>
            <MoveDown size={13} />
          </IBtn>
          <IBtn title="Send to back (Ctrl+Shift+[)" onClick={onSendToBack}>
            <ChevronsDown size={14} />
          </IBtn>
        </div>

      </div>

      {/* ── Row 2: text-specific controls (only when all selected are text) ── */}
      {allText && (
        <>
          <div className="h-px bg-border mx-3" />
          <div className="flex items-center gap-0.5 px-3 py-2">

            {/* Font family */}
            <select
              value={el.fontFamily ?? "'Virgil', cursive"}
              onChange={(e) => update({ fontFamily: e.target.value })}
              className="text-xs bg-muted border border-border rounded-lg px-1.5 h-7"
            >
              <option value="'Virgil', cursive">Virgil</option>
              <option value="'Segoe UI', sans-serif">Sans</option>
              <option value="Georgia, serif">Serif</option>
              <option value="'Courier New', monospace">Mono</option>
            </select>

            {/* Font size */}
            <input
              type="number"
              min={8} max={96}
              value={el.fontSize ?? 20}
              onChange={(e) => update({ fontSize: Number(e.target.value) })}
              className="w-12 text-xs bg-muted border border-border rounded-lg px-1.5 h-7 ml-1"
              title="Font size"
            />

            <Divider />

            {/* Text alignment */}
            {(['left', 'center', 'right'] as const).map((a) => (
              <button
                key={a}
                title={`Align ${a}`}
                onClick={() => update({ textAlign: a })}
                className={`w-7 h-7 rounded flex items-center justify-center transition-all ${
                  el.textAlign === a
                    ? 'bg-blue-500 text-white'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                {a === 'left' ? <AlignLeft size={12} /> : a === 'center' ? <AlignCenter size={12} /> : <AlignRight size={12} />}
              </button>
            ))}

          </div>
        </>
      )}
    </div>
  );
}
