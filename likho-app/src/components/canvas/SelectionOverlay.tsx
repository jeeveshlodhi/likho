import React from 'react';
import { CanvasElement, HandlePosition } from '@/types/canvas';
import { getElementBounds } from './utils/hitTest';

interface SelectionOverlayProps {
    elements: CanvasElement[];
    selectedIds: Set<string>;
    zoom: number;
    onResizeStart: (e: React.PointerEvent, handle: HandlePosition, elementId: string) => void;
}

const HANDLE_SIZE = 8;

const HANDLE_CURSORS: Record<HandlePosition, string> = {
    nw: 'nwse-resize',
    n: 'ns-resize',
    ne: 'nesw-resize',
    e: 'ew-resize',
    se: 'nwse-resize',
    s: 'ns-resize',
    sw: 'nesw-resize',
    w: 'ew-resize',
};

export default function SelectionOverlay({ elements, selectedIds, zoom, onResizeStart }: SelectionOverlayProps) {
    if (selectedIds.size === 0) return null;

    const selected = elements.filter(el => selectedIds.has(el.id));
    if (selected.length === 0) return null;

    // For single selection, show handles on that element
    // For multi-selection, show a bounding box around all
    if (selected.length === 1) {
        const el = selected[0];
        const bounds = getElementBounds(el);
        const hs = HANDLE_SIZE / zoom;

        const handles: { pos: HandlePosition; x: number; y: number }[] = [
            { pos: 'nw', x: bounds.x, y: bounds.y },
            { pos: 'n', x: bounds.x + bounds.width / 2, y: bounds.y },
            { pos: 'ne', x: bounds.x + bounds.width, y: bounds.y },
            { pos: 'e', x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2 },
            { pos: 'se', x: bounds.x + bounds.width, y: bounds.y + bounds.height },
            { pos: 's', x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height },
            { pos: 'sw', x: bounds.x, y: bounds.y + bounds.height },
            { pos: 'w', x: bounds.x, y: bounds.y + bounds.height / 2 },
        ];

        return (
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                {/* Selection border */}
                <div
                    style={{
                        position: 'absolute',
                        left: bounds.x - 1 / zoom,
                        top: bounds.y - 1 / zoom,
                        width: bounds.width + 2 / zoom,
                        height: bounds.height + 2 / zoom,
                        border: `${1 / zoom}px solid #3b82f6`,
                        pointerEvents: 'none',
                    }}
                />
                {/* Resize handles */}
                {handles.map(h => (
                    <div
                        key={h.pos}
                        onPointerDown={(e) => {
                            e.stopPropagation();
                            onResizeStart(e, h.pos, el.id);
                        }}
                        style={{
                            position: 'absolute',
                            left: h.x - hs / 2,
                            top: h.y - hs / 2,
                            width: hs,
                            height: hs,
                            backgroundColor: 'white',
                            border: `${1 / zoom}px solid #3b82f6`,
                            borderRadius: 1 / zoom,
                            cursor: HANDLE_CURSORS[h.pos],
                            pointerEvents: 'auto',
                        }}
                    />
                ))}
            </div>
        );
    }

    // Multi-selection bounding box
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    selected.forEach(el => {
        const b = getElementBounds(el);
        minX = Math.min(minX, b.x);
        minY = Math.min(minY, b.y);
        maxX = Math.max(maxX, b.x + b.width);
        maxY = Math.max(maxY, b.y + b.height);
    });

    return (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
            <div
                style={{
                    position: 'absolute',
                    left: minX - 2 / zoom,
                    top: minY - 2 / zoom,
                    width: maxX - minX + 4 / zoom,
                    height: maxY - minY + 4 / zoom,
                    border: `${1 / zoom}px dashed #3b82f6`,
                }}
            />
        </div>
    );
}
