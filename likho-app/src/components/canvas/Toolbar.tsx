import React from 'react';
import {
    MousePointer2, Pencil, Square, Hand, Type,
    Circle, Minus, ArrowRight, Undo2, Redo2,
} from 'lucide-react';
import { ToolType } from '@/types/canvas';
import { clsx } from 'clsx';
import ColorPicker from './ColorPicker';

interface ToolbarProps {
    currentTool: ToolType;
    setTool: (tool: ToolType) => void;
    strokeColor: string;
    fillColor: string;
    strokeWidth: number;
    onStrokeColorChange: (color: string) => void;
    onFillColorChange: (color: string) => void;
    onStrokeWidthChange: (width: number) => void;
    canUndo: boolean;
    canRedo: boolean;
    onUndo: () => void;
    onRedo: () => void;
}

const STROKE_WIDTHS = [1, 2, 4, 8];

export default function Toolbar({
    currentTool, setTool,
    strokeColor, fillColor, strokeWidth,
    onStrokeColorChange, onFillColorChange, onStrokeWidthChange,
    canUndo, canRedo, onUndo, onRedo,
}: ToolbarProps) {
    const toolGroups: { id: ToolType; icon: React.ReactNode; tooltip: string }[][] = [
        [
            { id: 'select', icon: <MousePointer2 size={18} />, tooltip: 'Select (V)' },
            { id: 'pan', icon: <Hand size={18} />, tooltip: 'Pan (Space)' },
        ],
        [
            { id: 'rectangle', icon: <Square size={18} />, tooltip: 'Rectangle (R)' },
            { id: 'ellipse', icon: <Circle size={18} />, tooltip: 'Ellipse (E)' },
        ],
        [
            { id: 'line', icon: <Minus size={18} />, tooltip: 'Line (L)' },
            { id: 'arrow', icon: <ArrowRight size={18} />, tooltip: 'Arrow (A)' },
        ],
        [
            { id: 'freehand', icon: <Pencil size={18} />, tooltip: 'Draw (P)' },
            { id: 'text', icon: <Type size={18} />, tooltip: 'Text (T)' },
        ],
    ];

    return (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-background border border-border rounded-xl shadow-md p-1.5 z-10">
            {/* Undo/Redo */}
            <button
                onClick={onUndo}
                disabled={!canUndo}
                title="Undo (Ctrl+Z)"
                className={clsx(
                    "p-2 rounded-lg flex items-center justify-center transition-colors",
                    canUndo ? "text-muted-foreground hover:bg-muted" : "text-muted-foreground/30 cursor-not-allowed"
                )}
            >
                <Undo2 size={16} />
            </button>
            <button
                onClick={onRedo}
                disabled={!canRedo}
                title="Redo (Ctrl+Shift+Z)"
                className={clsx(
                    "p-2 rounded-lg flex items-center justify-center transition-colors",
                    canRedo ? "text-muted-foreground hover:bg-muted" : "text-muted-foreground/30 cursor-not-allowed"
                )}
            >
                <Redo2 size={16} />
            </button>

            <div className="w-px h-6 bg-border mx-1" />

            {/* Tool groups */}
            {toolGroups.map((group, gi) => (
                <React.Fragment key={gi}>
                    {gi > 0 && <div className="w-px h-6 bg-border mx-0.5" />}
                    {group.map((tool) => (
                        <button
                            key={tool.id}
                            onClick={() => setTool(tool.id)}
                            title={tool.tooltip}
                            className={clsx(
                                "p-2 rounded-lg flex items-center justify-center transition-colors",
                                currentTool === tool.id
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-muted"
                            )}
                        >
                            {tool.icon}
                        </button>
                    ))}
                </React.Fragment>
            ))}

            <div className="w-px h-6 bg-border mx-1" />

            {/* Color pickers */}
            <ColorPicker color={strokeColor} onChange={onStrokeColorChange} label="Stroke" />
            <ColorPicker color={fillColor} onChange={onFillColorChange} label="Fill" />

            {/* Stroke width */}
            <select
                value={strokeWidth}
                onChange={(e) => onStrokeWidthChange(Number(e.target.value))}
                title="Stroke width"
                className="text-xs px-1.5 py-1.5 bg-background border border-border rounded-md text-foreground outline-none cursor-pointer hover:bg-muted transition-colors"
            >
                {STROKE_WIDTHS.map(w => (
                    <option key={w} value={w}>{w}px</option>
                ))}
            </select>
        </div>
    );
}
