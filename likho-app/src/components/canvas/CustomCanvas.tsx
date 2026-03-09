import React, { useRef, useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
    CanvasElement,
    CameraState,
    CanvasScene,
    ToolType,
    Point,
    HandlePosition,
} from '@/types/canvas';
import { FreehandRender } from './elements/FreehandElement';
import { RectangleRender } from './elements/RectangleElement';
import { TextRender } from './elements/TextElement';
import { EllipseRender } from './elements/EllipseElement';
import { LineRender } from './elements/LineElement';
import { ArrowRender } from './elements/ArrowElement';
import Toolbar from './Toolbar';
import SelectionOverlay from './SelectionOverlay';
import { hitTestElements, getElementBounds } from './utils/hitTest';
import { useCanvasHistory } from './hooks/useCanvasHistory';

interface CustomCanvasProps {
    initialData?: CanvasScene | null;
    onChange?: (scene: CanvasScene) => void;
    theme?: 'light' | 'dark';
}

type InteractionMode = 'none' | 'drawing' | 'panning' | 'moving' | 'resizing' | 'selecting';

export default function CustomCanvas({ initialData, onChange, theme }: CustomCanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    // Elements & Camera
    const [elements, setElements] = useState<CanvasElement[]>(initialData?.elements || []);
    const [camera, setCamera] = useState<CameraState>(initialData?.camera || { x: 0, y: 0, zoom: 1 });
    const [currentTool, setCurrentTool] = useState<ToolType>('select');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Draw settings
    const [strokeColor, setStrokeColor] = useState(theme === 'dark' ? '#ffffff' : '#000000');
    const [fillColor, setFillColor] = useState('transparent');
    const [strokeWidth, setStrokeWidth] = useState(2);

    // Interaction state
    const [mode, setMode] = useState<InteractionMode>('none');
    const [startPoint, setStartPoint] = useState<Point>({ x: 0, y: 0 });
    const [draftElement, setDraftElement] = useState<CanvasElement | null>(null);

    // Move state
    const [dragOriginals, setDragOriginals] = useState<Record<string, { x: number; y: number; endX?: number; endY?: number }>>({});

    // Resize state
    const [resizeHandle, setResizeHandle] = useState<HandlePosition | null>(null);
    const [resizeElementId, setResizeElementId] = useState<string | null>(null);
    const [resizeOriginal, setResizeOriginal] = useState<{ x: number; y: number; width: number; height: number; endX?: number; endY?: number } | null>(null);

    // Selection rectangle
    const [selectionRect, setSelectionRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

    // Pan
    const [panStart, setPanStart] = useState<Point>({ x: 0, y: 0 });

    // Spacebar pan override
    const isSpaceRef = useRef(false);
    const prevToolRef = useRef<ToolType>('select');

    // Undo/Redo
    const { pushState, undo, redo, canUndo, canRedo } = useCanvasHistory(initialData?.elements || []);

    const handleUndo = useCallback(() => {
        const prev = undo();
        if (prev) {
            setElements(prev);
            setSelectedIds(new Set());
        }
    }, [undo]);

    const handleRedo = useCallback(() => {
        const next = redo();
        if (next) {
            setElements(next);
            setSelectedIds(new Set());
        }
    }, [redo]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement) return;

            // Spacebar pan
            if (e.code === 'Space' && !isSpaceRef.current) {
                isSpaceRef.current = true;
                setCurrentTool(prev => { prevToolRef.current = prev; return 'pan'; });
                return;
            }

            // Tool shortcuts
            if (e.key === 'v') setCurrentTool('select');
            if (e.key === 'p') setCurrentTool('freehand');
            if (e.key === 'r') setCurrentTool('rectangle');
            if (e.key === 't') setCurrentTool('text');
            if (e.key === 'e') setCurrentTool('ellipse');
            if (e.key === 'l') setCurrentTool('line');
            if (e.key === 'a') setCurrentTool('arrow');

            // Delete
            if ((e.key === 'Backspace' || e.key === 'Delete') && selectedIds.size > 0) {
                setElements(prev => {
                    const next = prev.filter(el => !selectedIds.has(el.id));
                    pushState(next);
                    return next;
                });
                setSelectedIds(new Set());
            }

            // Undo/Redo
            if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); handleUndo(); }
            if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) { e.preventDefault(); handleRedo(); }
            if ((e.metaKey || e.ctrlKey) && e.key === 'y') { e.preventDefault(); handleRedo(); }

            // Select all
            if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
                e.preventDefault();
                setSelectedIds(new Set(elements.map(el => el.id)));
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                isSpaceRef.current = false;
                setCurrentTool(prevToolRef.current);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [selectedIds, elements, handleUndo, handleRedo, pushState]);

    // Notify parent of changes
    useEffect(() => {
        onChange?.({ elements, camera });
    }, [elements, camera, onChange]);

    const screenToCanvas = (clientX: number, clientY: number): Point => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return { x: 0, y: 0 };
        return {
            x: (clientX - rect.left - camera.x) / camera.zoom,
            y: (clientY - rect.top - camera.y) / camera.zoom,
        };
    };

    // --- Pointer handlers ---

    const onPointerDown = (e: React.PointerEvent) => {
        const pos = screenToCanvas(e.clientX, e.clientY);

        // Pan mode
        if (e.button === 1 || currentTool === 'pan' || (e.button === 0 && e.altKey)) {
            setMode('panning');
            setPanStart({ x: e.clientX, y: e.clientY });
            return;
        }

        if (currentTool === 'select') {
            const hitId = hitTestElements(pos, elements, camera.zoom);
            if (hitId) {
                let newSelected: Set<string>;
                if (e.shiftKey) {
                    newSelected = new Set(selectedIds);
                    newSelected.has(hitId) ? newSelected.delete(hitId) : newSelected.add(hitId);
                } else if (selectedIds.has(hitId)) {
                    newSelected = selectedIds;
                } else {
                    newSelected = new Set([hitId]);
                }
                setSelectedIds(newSelected);

                // Start move
                setMode('moving');
                setStartPoint(pos);
                const originals: Record<string, { x: number; y: number; endX?: number; endY?: number }> = {};
                elements.forEach(el => {
                    if (newSelected.has(el.id)) {
                        originals[el.id] = { x: el.x, y: el.y };
                        if (el.type === 'line' || el.type === 'arrow') {
                            originals[el.id].endX = el.endX;
                            originals[el.id].endY = el.endY;
                        }
                    }
                });
                setDragOriginals(originals);
            } else {
                setSelectedIds(new Set());
                // Start selection rectangle
                setMode('selecting');
                setStartPoint(pos);
                setSelectionRect({ x: pos.x, y: pos.y, width: 0, height: 0 });
            }
            return;
        }

        // Drawing tools
        setMode('drawing');
        setStartPoint(pos);

        if (currentTool === 'freehand') {
            setDraftElement({
                id: uuidv4(), type: 'freehand', x: pos.x, y: pos.y,
                width: 0, height: 0, strokeColor, backgroundColor: fillColor, strokeWidth,
                points: [[0, 0]],
            });
        } else if (currentTool === 'rectangle') {
            setDraftElement({
                id: uuidv4(), type: 'rectangle', x: pos.x, y: pos.y,
                width: 0, height: 0, strokeColor, backgroundColor: fillColor, strokeWidth,
            });
        } else if (currentTool === 'ellipse') {
            setDraftElement({
                id: uuidv4(), type: 'ellipse', x: pos.x, y: pos.y,
                width: 0, height: 0, strokeColor, backgroundColor: fillColor, strokeWidth,
            });
        } else if (currentTool === 'line') {
            setDraftElement({
                id: uuidv4(), type: 'line', x: pos.x, y: pos.y,
                width: 0, height: 0, strokeColor, backgroundColor: 'transparent', strokeWidth,
                endX: pos.x, endY: pos.y,
            });
        } else if (currentTool === 'arrow') {
            setDraftElement({
                id: uuidv4(), type: 'arrow', x: pos.x, y: pos.y,
                width: 0, height: 0, strokeColor, backgroundColor: 'transparent', strokeWidth,
                endX: pos.x, endY: pos.y,
            });
        } else if (currentTool === 'text') {
            const newText: CanvasElement = {
                id: uuidv4(), type: 'text', x: pos.x, y: pos.y,
                width: 100, height: 30, strokeColor, backgroundColor: 'transparent', strokeWidth,
                text: '', fontSize: 16,
            };
            setElements(prev => {
                const next = [...prev, newText];
                pushState(next);
                return next;
            });
            setSelectedIds(new Set([newText.id]));
            setCurrentTool('select');
            setMode('none');
        }
    };

    const onPointerMove = (e: React.PointerEvent) => {
        if (mode === 'none') return;

        if (mode === 'panning') {
            const dx = e.clientX - panStart.x;
            const dy = e.clientY - panStart.y;
            setCamera(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
            setPanStart({ x: e.clientX, y: e.clientY });
            return;
        }

        const pos = screenToCanvas(e.clientX, e.clientY);

        if (mode === 'moving') {
            const dx = pos.x - startPoint.x;
            const dy = pos.y - startPoint.y;
            setElements(prev => prev.map(el => {
                const orig = dragOriginals[el.id];
                if (!orig) return el;
                const updated = { ...el, x: orig.x + dx, y: orig.y + dy };
                if ((el.type === 'line' || el.type === 'arrow') && orig.endX !== undefined && orig.endY !== undefined) {
                    (updated as any).endX = orig.endX + dx;
                    (updated as any).endY = orig.endY + dy;
                }
                return updated;
            }));
            return;
        }

        if (mode === 'resizing' && resizeHandle && resizeElementId && resizeOriginal) {
            const dx = pos.x - startPoint.x;
            const dy = pos.y - startPoint.y;
            setElements(prev => prev.map(el => {
                if (el.id !== resizeElementId) return el;

                // For line/arrow, resize endpoints
                if (el.type === 'line' || el.type === 'arrow') {
                    if (resizeHandle === 'nw' || resizeHandle === 'w' || resizeHandle === 'sw') {
                        return { ...el, x: resizeOriginal.x + dx, y: resizeOriginal.y + dy };
                    } else {
                        return { ...el, endX: (resizeOriginal.endX || 0) + dx, endY: (resizeOriginal.endY || 0) + dy };
                    }
                }

                const o = resizeOriginal;
                let newX = o.x, newY = o.y, newW = o.width, newH = o.height;

                if (resizeHandle.includes('w')) { newX = o.x + dx; newW = o.width - dx; }
                if (resizeHandle.includes('e')) { newW = o.width + dx; }
                if (resizeHandle.includes('n')) { newY = o.y + dy; newH = o.height - dy; }
                if (resizeHandle.includes('s')) { newH = o.height + dy; }

                // Enforce minimum size
                if (newW < 10) { newW = 10; if (resizeHandle.includes('w')) newX = o.x + o.width - 10; }
                if (newH < 10) { newH = 10; if (resizeHandle.includes('n')) newY = o.y + o.height - 10; }

                return { ...el, x: newX, y: newY, width: newW, height: newH };
            }));
            return;
        }

        if (mode === 'selecting') {
            const w = pos.x - startPoint.x;
            const h = pos.y - startPoint.y;
            setSelectionRect({
                x: w < 0 ? pos.x : startPoint.x,
                y: h < 0 ? pos.y : startPoint.y,
                width: Math.abs(w),
                height: Math.abs(h),
            });
            return;
        }

        if (mode === 'drawing' && draftElement) {
            if (draftElement.type === 'freehand') {
                const newPoints = [...draftElement.points, [pos.x - draftElement.x, pos.y - draftElement.y] as [number, number]];
                let minX = 0, minY = 0, maxX = 0, maxY = 0;
                newPoints.forEach(p => {
                    if (p[0] < minX) minX = p[0];
                    if (p[1] < minY) minY = p[1];
                    if (p[0] > maxX) maxX = p[0];
                    if (p[1] > maxY) maxY = p[1];
                });
                setDraftElement({ ...draftElement, points: newPoints, width: maxX - minX, height: maxY - minY });
            } else if (draftElement.type === 'rectangle' || draftElement.type === 'ellipse') {
                setDraftElement({ ...draftElement, width: pos.x - draftElement.x, height: pos.y - draftElement.y });
            } else if (draftElement.type === 'line' || draftElement.type === 'arrow') {
                setDraftElement({ ...draftElement, endX: pos.x, endY: pos.y } as any);
            }
        }
    };

    const onPointerUp = () => {
        if (mode === 'moving') {
            pushState(elements);
        }

        if (mode === 'resizing') {
            pushState(elements);
        }

        if (mode === 'selecting' && selectionRect) {
            const rect = selectionRect;
            const ids = new Set<string>();
            elements.forEach(el => {
                const bounds = getElementBounds(el);
                if (
                    bounds.x < rect.x + rect.width &&
                    bounds.x + bounds.width > rect.x &&
                    bounds.y < rect.y + rect.height &&
                    bounds.y + bounds.height > rect.y
                ) {
                    ids.add(el.id);
                }
            });
            setSelectedIds(ids);
            setSelectionRect(null);
        }

        if (mode === 'drawing' && draftElement) {
            let final = { ...draftElement };
            if (final.type === 'rectangle' || final.type === 'ellipse') {
                if (final.width < 0) { final.x += final.width; final.width = Math.abs(final.width); }
                if (final.height < 0) { final.y += final.height; final.height = Math.abs(final.height); }
            }
            const hasSize = final.type === 'freehand'
                ? final.points.length > 2
                : (final.type === 'line' || final.type === 'arrow')
                    ? Math.abs(final.endX - final.x) > 2 || Math.abs(final.endY - final.y) > 2
                    : final.width > 2 || final.height > 2;

            if (hasSize) {
                setElements(prev => {
                    const next = [...prev, final];
                    pushState(next);
                    return next;
                });
            }
            setDraftElement(null);
        }

        setMode('none');
        setDragOriginals({});
        setResizeHandle(null);
        setResizeElementId(null);
        setResizeOriginal(null);
    };

    const onWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        if (e.ctrlKey || e.metaKey) {
            const zoomFactor = -e.deltaY / 500;
            const zoomAmount = Math.exp(zoomFactor);
            const rect = containerRef.current?.getBoundingClientRect();
            if (!rect) return;
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;
            setCamera(prev => {
                const newZoom = Math.min(Math.max(prev.zoom * zoomAmount, 0.1), 10);
                const scaleChange = newZoom / prev.zoom;
                return { x: mx - (mx - prev.x) * scaleChange, y: my - (my - prev.y) * scaleChange, zoom: newZoom };
            });
        } else {
            setCamera(prev => ({ ...prev, x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
        }
    };

    const onResizeStart = (e: React.PointerEvent, handle: HandlePosition, elementId: string) => {
        e.stopPropagation();
        const pos = screenToCanvas(e.clientX, e.clientY);
        const el = elements.find(el => el.id === elementId);
        if (!el) return;
        setMode('resizing');
        setStartPoint(pos);
        setResizeHandle(handle);
        setResizeElementId(elementId);
        const bounds = getElementBounds(el);
        setResizeOriginal({
            ...bounds,
            endX: (el.type === 'line' || el.type === 'arrow') ? el.endX : undefined,
            endY: (el.type === 'line' || el.type === 'arrow') ? el.endY : undefined,
        });
    };

    const handleTextChange = (id: string, newText: string) => {
        setElements(prev => {
            const next = prev.map(el => el.id === id && el.type === 'text' ? { ...el, text: newText } : el);
            pushState(next);
            return next;
        });
    };

    const getCursor = (): string => {
        if (mode === 'panning' || currentTool === 'pan') return 'grab';
        if (mode === 'moving') return 'move';
        if (currentTool === 'freehand' || currentTool === 'rectangle' || currentTool === 'ellipse' || currentTool === 'line' || currentTool === 'arrow') return 'crosshair';
        return 'default';
    };

    const renderElement = (el: CanvasElement, isSelected: boolean) => {
        switch (el.type) {
            case 'freehand': return <FreehandRender key={el.id} element={el} isSelected={isSelected} />;
            case 'rectangle': return <RectangleRender key={el.id} element={el} isSelected={isSelected} />;
            case 'text': return <TextRender key={el.id} element={el} isSelected={isSelected} onTextChange={handleTextChange} />;
            case 'ellipse': return <EllipseRender key={el.id} element={el} isSelected={isSelected} />;
            case 'line': return <LineRender key={el.id} element={el} isSelected={isSelected} />;
            case 'arrow': return <ArrowRender key={el.id} element={el} isSelected={isSelected} />;
            default: return null;
        }
    };

    return (
        <div
            className="relative w-full h-full overflow-hidden bg-background touch-none outline-none"
            ref={containerRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            onWheel={onWheel}
            onContextMenu={(e) => e.preventDefault()}
            tabIndex={0}
            style={{ cursor: getCursor() }}
        >
            <Toolbar
                currentTool={currentTool}
                setTool={setCurrentTool}
                strokeColor={strokeColor}
                fillColor={fillColor}
                strokeWidth={strokeWidth}
                onStrokeColorChange={setStrokeColor}
                onFillColorChange={setFillColor}
                onStrokeWidthChange={setStrokeWidth}
                canUndo={canUndo}
                canRedo={canRedo}
                onUndo={handleUndo}
                onRedo={handleRedo}
            />

            {/* Grid Background */}
            <div
                className="absolute inset-0 pointer-events-none text-muted-foreground/40"
                style={{
                    backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
                    backgroundSize: `${24 * camera.zoom}px ${24 * camera.zoom}px`,
                    backgroundPosition: `${camera.x}px ${camera.y}px`,
                }}
            />

            {/* Canvas transform layer */}
            <div
                className="absolute top-0 left-0 w-full h-full pointer-events-none origin-top-left"
                style={{ transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})` }}
            >
                {elements.map(el => renderElement(el, selectedIds.has(el.id)))}
                {draftElement && renderElement(draftElement, false)}

                <SelectionOverlay
                    elements={elements}
                    selectedIds={selectedIds}
                    zoom={camera.zoom}
                    onResizeStart={onResizeStart}
                />

                {selectionRect && (
                    <div
                        style={{
                            position: 'absolute',
                            left: selectionRect.x,
                            top: selectionRect.y,
                            width: selectionRect.width,
                            height: selectionRect.height,
                            border: `${1 / camera.zoom}px solid #3b82f6`,
                            backgroundColor: 'rgba(59, 130, 246, 0.08)',
                            pointerEvents: 'none',
                        }}
                    />
                )}
            </div>
        </div>
    );
}
