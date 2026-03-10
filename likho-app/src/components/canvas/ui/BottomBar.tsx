import type { CameraState, Point } from '@/types/canvas';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface BottomBarProps {
  camera: CameraState;
  cursor: Point;
  elementCount: number;
  selectedCount: number;
  onZoom: (zoom: number) => void;
  onZoomFit: () => void;
}

const ZOOM_STEPS = [0.1, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4];

export function BottomBar({ camera, cursor, elementCount, selectedCount, onZoom, onZoomFit }: BottomBarProps) {
  const pct = Math.round(camera.zoom * 100);

  const zoomIn = () => {
    const next = ZOOM_STEPS.find((z) => z > camera.zoom);
    onZoom(next ?? 4);
  };

  const zoomOut = () => {
    const prev = [...ZOOM_STEPS].reverse().find((z) => z < camera.zoom);
    onZoom(prev ?? 0.1);
  };

  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-background/90 backdrop-blur border border-border rounded-xl shadow-lg px-3 py-1.5 text-xs text-muted-foreground select-none">
      {/* Cursor coords */}
      <span className="font-mono w-28 text-center">
        {Math.round(cursor.x)}, {Math.round(cursor.y)}
      </span>

      <div className="h-4 w-px bg-border" />

      {/* Element count */}
      <span>
        {elementCount} element{elementCount !== 1 ? 's' : ''}
        {selectedCount > 0 ? ` · ${selectedCount} selected` : ''}
      </span>

      <div className="h-4 w-px bg-border" />

      {/* Zoom controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={zoomOut}
          className="w-6 h-6 rounded flex items-center justify-center hover:bg-accent transition-all"
          title="Zoom out (-)"
        >
          <ZoomOut size={13} />
        </button>

        <button
          onClick={() => onZoom(1)}
          className="w-14 text-center font-mono hover:bg-accent rounded px-1 py-0.5 transition-all"
          title="Reset zoom (Ctrl+0)"
        >
          {pct}%
        </button>

        <button
          onClick={zoomIn}
          className="w-6 h-6 rounded flex items-center justify-center hover:bg-accent transition-all"
          title="Zoom in (+)"
        >
          <ZoomIn size={13} />
        </button>

        <button
          onClick={onZoomFit}
          className="w-6 h-6 rounded flex items-center justify-center hover:bg-accent transition-all"
          title="Zoom to fit (Ctrl+Shift+H)"
        >
          <Maximize2 size={13} />
        </button>
      </div>
    </div>
  );
}
