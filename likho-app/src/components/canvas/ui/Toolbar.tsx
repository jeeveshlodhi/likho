import React from 'react';
import type { ToolType, AppState, CameraState } from '@/types/canvas';
import {
  MousePointer2, Square, Circle, Diamond, ArrowRight,
  Minus, Pen, Type, Eraser, Image, Hand,
  Undo2, Redo2, Trash2, ZoomIn, ZoomOut, Maximize2,
} from 'lucide-react';

interface Tool {
  id: ToolType;
  label: string;
  key: string;
  Icon: React.FC<{ size?: number }>;
}

const TOOLS: Tool[] = [
  { id: 'select',    label: 'Select',    key: 'V', Icon: MousePointer2 },
  { id: 'hand',      label: 'Hand/Pan',  key: 'H', Icon: Hand },
  { id: 'rectangle', label: 'Rectangle', key: 'R', Icon: Square },
  { id: 'ellipse',   label: 'Ellipse',   key: 'E', Icon: Circle },
  { id: 'diamond',   label: 'Diamond',   key: 'D', Icon: Diamond },
  { id: 'arrow',     label: 'Arrow',     key: 'A', Icon: ArrowRight },
  { id: 'line',      label: 'Line',      key: 'L', Icon: Minus },
  { id: 'pen',       label: 'Pen',       key: 'P', Icon: Pen },
  { id: 'text',      label: 'Text',      key: 'T', Icon: Type },
  { id: 'eraser',    label: 'Eraser',    key: 'X', Icon: Eraser },
  { id: 'image',     label: 'Image',     key: 'I', Icon: Image },
];

const ZOOM_STEPS = [0.1, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4];

const DRAWING_TOOLS: ToolType[] = ['rectangle', 'ellipse', 'diamond', 'arrow', 'line', 'pen', 'image', 'eraser'];

interface ToolbarProps {
  appState: AppState;
  onAppStateChange: (patch: Partial<AppState>) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onClear: () => void;
  onExport: () => void;
  camera: CameraState;
  onZoom: (zoom: number) => void;
  onZoomFit: () => void;
}

export function Toolbar({
  appState,
  onAppStateChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onClear,
  camera,
  onZoom,
  onZoomFit,
}: ToolbarProps) {
  const setTool = (tool: ToolType) => onAppStateChange({ tool });
  const pct = Math.round(camera.zoom * 100);

  const zoomIn = () => {
    const next = ZOOM_STEPS.find((z) => z > camera.zoom);
    onZoom(next ?? 4);
  };

  const zoomOut = () => {
    const prev = [...ZOOM_STEPS].reverse().find((z) => z < camera.zoom);
    onZoom(prev ?? 0.1);
  };

  const isDrawingMode = DRAWING_TOOLS.includes(appState.tool);

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1.5">
      {/* Drawing mode hint */}
      {isDrawingMode && (
        <div className="flex items-center gap-1.5 bg-blue-500/10 border border-blue-400/30 text-blue-600 dark:text-blue-400 rounded-lg px-2.5 py-1 text-[10px] font-medium shadow-sm">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          Click and drag to draw · Auto-returns to select · <kbd className="font-mono bg-blue-500/10 px-1 rounded">Esc</kbd> to cancel
        </div>
      )}

      <div className="flex items-center gap-0.5 bg-background border border-border rounded-2xl shadow-lg px-2 py-1.5">

      {/* Drawing tools */}
      {TOOLS.map(({ id, label, key, Icon }) => (
        <button
          key={id}
          title={`${label} (${key})`}
          onClick={() => setTool(id)}
          className={`
            w-8 h-8 rounded-lg flex items-center justify-center transition-all
            ${appState.tool === id
              ? 'bg-blue-500 text-white shadow-sm ring-2 ring-blue-300/50 ring-offset-1'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            }
          `}
        >
          <Icon size={15} />
        </button>
      ))}

      <div className="w-px h-5 bg-border mx-1.5" />

      {/* Undo / Redo */}
      <button
        title="Undo (Ctrl+Z)"
        onClick={onUndo}
        disabled={!canUndo}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30 transition-all"
      >
        <Undo2 size={15} />
      </button>
      <button
        title="Redo (Ctrl+Shift+Z)"
        onClick={onRedo}
        disabled={!canRedo}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30 transition-all"
      >
        <Redo2 size={15} />
      </button>

      <div className="w-px h-5 bg-border mx-1.5" />

      {/* Zoom controls */}
      <button
        onClick={zoomOut}
        title="Zoom out (-)"
        className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
      >
        <ZoomOut size={14} />
      </button>
      <button
        onClick={() => onZoom(1)}
        title="Reset zoom (Ctrl+0)"
        className="min-w-[2.75rem] h-8 px-1 rounded-lg text-xs font-mono text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
      >
        {pct}%
      </button>
      <button
        onClick={zoomIn}
        title="Zoom in (+)"
        className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
      >
        <ZoomIn size={14} />
      </button>
      <button
        onClick={onZoomFit}
        title="Zoom to fit (Ctrl+Shift+H)"
        className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
      >
        <Maximize2 size={14} />
      </button>

      <div className="w-px h-5 bg-border mx-1.5" />

      {/* Clear */}
      <button
        title="Clear canvas"
        onClick={onClear}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
      >
        <Trash2 size={15} />
      </button>
    </div>
    </div>
  );
}
