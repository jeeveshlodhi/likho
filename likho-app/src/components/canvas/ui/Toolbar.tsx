import React from 'react';
import type { ToolType, AppState } from '@/types/canvas';
import {
  MousePointer2, Square, Circle, Diamond, ArrowRight,
  Minus, Pen, Type, Eraser, Image, Hand,
  Undo2, Redo2, Trash2,
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

interface ToolbarProps {
  appState: AppState;
  onAppStateChange: (patch: Partial<AppState>) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onClear: () => void;
  onExport: () => void;
}

export function Toolbar({
  appState,
  onAppStateChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onClear,
}: ToolbarProps) {
  const setTool = (tool: ToolType) => onAppStateChange({ tool });

  return (
    <div className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-1 bg-background border border-border rounded-xl shadow-lg p-1.5">
      {TOOLS.map(({ id, label, key, Icon }) => (
        <button
          key={id}
          title={`${label} (${key})`}
          onClick={() => setTool(id)}
          className={`
            w-9 h-9 rounded-lg flex items-center justify-center transition-all
            ${appState.tool === id
              ? 'bg-blue-500 text-white shadow-sm'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            }
          `}
        >
          <Icon size={16} />
        </button>
      ))}

      <div className="h-px bg-border my-1" />

      <button
        title="Undo (Ctrl+Z)"
        onClick={onUndo}
        disabled={!canUndo}
        className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30 transition-all"
      >
        <Undo2 size={16} />
      </button>

      <button
        title="Redo (Ctrl+Shift+Z)"
        onClick={onRedo}
        disabled={!canRedo}
        className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30 transition-all"
      >
        <Redo2 size={16} />
      </button>

      <button
        title="Clear canvas"
        onClick={onClear}
        className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
