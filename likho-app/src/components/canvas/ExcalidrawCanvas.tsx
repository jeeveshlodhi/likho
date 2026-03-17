import React, {
  useRef, useState, useEffect, useCallback, useMemo,
} from 'react';
import rough from 'roughjs';
import { nanoid } from 'nanoid';

import type {
  CanvasElement, CameraState, AppState, InteractionState,
  ToolType, Point, CanvasScene,
} from '@/types/canvas';
import { DEFAULT_APP_STATE } from '@/types/canvas';

import { renderScene } from './core/renderer';
import { hitTestElement, hitTestHandle, hitTestBox } from './core/hitTest';
import {
  screenToWorld, worldToScreen, getElementCenter, normalizeRect,
  snapToGrid as snap, getBoundingBox,
} from './core/geometry';
import { applyResize, applyRotation } from './utils/transform';
import { copyElements, pasteElements, duplicateElements } from './utils/clipboard';
import { useHistory } from './hooks/useHistory';

import { Toolbar } from './ui/Toolbar';
import { TopBar } from './ui/TopBar';
import { PropertiesPanel } from './ui/PropertiesPanel';
import { ExportModal } from './ui/ExportModal';

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  initialData: CanvasScene;
  onChange: (scene: CanvasScene) => void;
  theme?: 'light' | 'dark';
}

// ─── Factory: create a new element ───────────────────────────────────────────

function createNewElement(
  tool: ToolType,
  worldX: number,
  worldY: number,
  appState: AppState
): CanvasElement {
  const base: CanvasElement = {
    id: nanoid(),
    type: tool as any,
    x: worldX,
    y: worldY,
    width: 0,
    height: 0,
    angle: 0,
    strokeColor: appState.strokeColor,
    backgroundColor: appState.backgroundColor,
    fillStyle: appState.fillStyle,
    strokeWidth: appState.strokeWidth,
    strokeStyle: appState.strokeStyle,
    roughness: appState.roughness,
    opacity: appState.opacity,
    seed: Math.floor(Math.random() * 100000),
    version: 1,
    edgeStyle: appState.edgeStyle,
  };

  if (tool === 'text') {
    return { ...base, text: '', fontSize: appState.fontSize, fontFamily: appState.fontFamily, textAlign: appState.textAlign };
  }
  if (tool === 'line' || tool === 'arrow') {
    return { ...base, points: [{ x: 0, y: 0 }, { x: 0, y: 0 }] };
  }
  return base;
}

// ─── Zoom helpers ─────────────────────────────────────────────────────────────

function zoomAt(
  camera: CameraState,
  screenX: number,
  screenY: number,
  newZoom: number
): CameraState {
  const clamped = Math.max(0.05, Math.min(20, newZoom));
  return {
    zoom: clamped,
    x: screenX - (screenX - camera.x) * (clamped / camera.zoom),
    y: screenY - (screenY - camera.y) * (clamped / camera.zoom),
  };
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ExcalidrawCanvas({ initialData, onChange, theme = 'light' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rcRef = useRef<ReturnType<typeof rough.canvas> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Core state (with history)
  const [elements, setElements, undo, redo, canUndo, canRedo] = useHistory<CanvasElement[]>(
    initialData.elements ?? []
  );
  const [camera, setCamera] = useState<CameraState>(initialData.camera ?? { x: 0, y: 0, zoom: 1 });
  const [appState, setAppState] = useState<AppState>(DEFAULT_APP_STATE);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editingTextPos, setEditingTextPos] = useState<{ screenX: number; screenY: number; width: number; height: number } | null>(null);
  const [cursor, setCursor] = useState<Point>({ x: 0, y: 0 });
  const [showExportModal, setShowExportModal] = useState(false);
  const clipboardRef = useRef<CanvasElement[]>([]);

  // ── Mutable refs (for event handlers without stale closures)
  const elementsRef = useRef(elements);
  const cameraRef = useRef(camera);
  const selectedIdsRef = useRef(selectedIds);
  const appStateRef = useRef(appState);
  const interactionRef = useRef<InteractionState>({ type: 'idle' });
  const spaceHeldRef = useRef(false);
  const shiftHeldRef = useRef(false);

  useEffect(() => { elementsRef.current = elements; }, [elements]);
  useEffect(() => { cameraRef.current = camera; }, [camera]);
  useEffect(() => { selectedIdsRef.current = selectedIds; }, [selectedIds]);
  useEffect(() => { appStateRef.current = appState; }, [appState]);

  // ── Notify parent
  useEffect(() => {
    onChange({ elements, camera });
  }, [elements, camera, onChange]);

  // ── Canvas setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      // Set physical pixel size (never 0)
      canvas.width = Math.max(1, Math.round(canvas.offsetWidth * dpr));
      canvas.height = Math.max(1, Math.round(canvas.offsetHeight * dpr));
      // Reinit rough.js (it holds a canvas ref internally)
      rcRef.current = rough.canvas(canvas);
      renderFrame();
    };

    const ro = new ResizeObserver(resizeCanvas);
    ro.observe(canvas);
    resizeCanvas();
    return () => ro.disconnect();
  }, []); // eslint-disable-line

  // ── Render
  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const rc = rcRef.current;
    if (!canvas || !ctx || !rc) return;

    const inter = interactionRef.current;
    const allElements = [...elementsRef.current];

    // Overlay drawing / pen element
    if (inter.type === 'drawing') allElements.push(inter.element);
    if (inter.type === 'pen') allElements.push(inter.element);

    renderScene({
      canvas,
      ctx,
      rc,
      elements: allElements,
      camera: cameraRef.current,
      selectedIds: selectedIdsRef.current,
      interaction: inter,
      appState: appStateRef.current,
      theme,
    });
  }, [theme]);

  // Re-render on state change
  useEffect(() => { renderFrame(); }, [elements, camera, selectedIds, appState, renderFrame]);

  // ── Selected elements (derived)
  const selectedElements = useMemo(
    () => elements.filter((el) => selectedIds.has(el.id)),
    [elements, selectedIds]
  );

  // ── Update appState
  const setAppStatePatch = useCallback((patch: Partial<AppState>) => {
    setAppState((prev) => ({ ...prev, ...patch }));
  }, []);

  // ── Helper: get canvas-relative coords
  const getCanvasPoint = useCallback((e: MouseEvent | React.MouseEvent | WheelEvent): { screenX: number; screenY: number } => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { screenX: e.clientX - rect.left, screenY: e.clientY - rect.top };
  }, []);

  // ── Text editing ─────────────────────────────────────────────────────────────

  const startEditingText = useCallback((id: string) => {
    const el = elementsRef.current.find((e) => e.id === id);
    if (!el || el.type !== 'text') return;
    const cam = cameraRef.current;
    const sw = worldToScreen(el.x, el.y, cam);
    setEditingTextId(id);
    setEditingTextPos({
      screenX: sw.x,
      screenY: sw.y,
      width: Math.max(100, el.width * cam.zoom),
      height: Math.max(30, el.height * cam.zoom),
    });
  }, []);

  const finishEditingText = useCallback((value: string) => {
    if (!editingTextId) return;
    const id = editingTextId;
    setElements((prev) =>
      prev.map((el) => {
        if (el.id !== id) return el;
        const lines = value.split('\n');
        const fs = el.fontSize ?? 20;
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d')!;
        ctx.font = `${fs}px ${el.fontFamily ?? 'sans-serif'}`;
        const maxW = Math.max(...lines.map((l) => ctx.measureText(l).width), 10);
        return {
          ...el,
          text: value,
          width: maxW + 8,
          height: lines.length * fs * 1.35 + 8,
        };
      })
    );
    setEditingTextId(null);
    setEditingTextPos(null);
  }, [editingTextId, setElements]);

  // ── Image tool ────────────────────────────────────────────────────────────────

  const placeImage = useCallback((worldX: number, worldY: number) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const src = ev.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const aspect = img.width / img.height;
          const w = Math.min(300, img.width);
          const h = w / aspect;
          setElements((prev) => [
            ...prev,
            {
              id: nanoid(),
              type: 'image',
              x: worldX - w / 2,
              y: worldY - h / 2,
              width: w,
              height: h,
              angle: 0,
              strokeColor: '#000',
              backgroundColor: 'transparent',
              fillStyle: 'none',
              strokeWidth: 1,
              strokeStyle: 'solid',
              roughness: 0,
              opacity: 100,
              src,
              seed: Math.floor(Math.random() * 100000),
              version: 1,
            },
          ]);
        };
        img.src = src;
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }, [setElements]);

  // ── Z-order ────────────────────────────────────────────────────────────────

  const bringToFront = useCallback(() => {
    setElements((prev) => {
      const ids = selectedIdsRef.current;
      const rest = prev.filter((e) => !ids.has(e.id));
      const top = prev.filter((e) => ids.has(e.id));
      return [...rest, ...top];
    });
  }, [setElements]);

  const sendToBack = useCallback(() => {
    setElements((prev) => {
      const ids = selectedIdsRef.current;
      const rest = prev.filter((e) => !ids.has(e.id));
      const bot = prev.filter((e) => ids.has(e.id));
      return [...bot, ...rest];
    });
  }, [setElements]);

  const bringForward = useCallback(() => {
    setElements((prev) => {
      const ids = selectedIdsRef.current;
      const arr = [...prev];
      for (let i = arr.length - 2; i >= 0; i--) {
        if (ids.has(arr[i].id) && !ids.has(arr[i + 1].id)) {
          [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
        }
      }
      return arr;
    });
  }, [setElements]);

  const sendBackward = useCallback(() => {
    setElements((prev) => {
      const ids = selectedIdsRef.current;
      const arr = [...prev];
      for (let i = 1; i < arr.length; i++) {
        if (ids.has(arr[i].id) && !ids.has(arr[i - 1].id)) {
          [arr[i], arr[i - 1]] = [arr[i - 1], arr[i]];
        }
      }
      return arr;
    });
  }, [setElements]);

  // ── Group / Ungroup ───────────────────────────────────────────────────────────

  const groupSelected = useCallback(() => {
    const groupId = nanoid();
    const ids = selectedIdsRef.current;
    setElements((prev) => prev.map((el) => ids.has(el.id) ? { ...el, groupId } : el));
  }, [setElements]);

  const ungroupSelected = useCallback(() => {
    const ids = selectedIdsRef.current;
    setElements((prev) => prev.map((el) => ids.has(el.id) ? { ...el, groupId: null } : el));
  }, [setElements]);

  // ── Zoom to fit ───────────────────────────────────────────────────────────────

  const zoomToFit = useCallback(() => {
    const els = elementsRef.current;
    const canvas = canvasRef.current;
    if (!canvas || els.length === 0) { setCamera({ x: 0, y: 0, zoom: 1 }); return; }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const el of els) {
      const b = getBoundingBox(el);
      minX = Math.min(minX, b.x);
      minY = Math.min(minY, b.y);
      maxX = Math.max(maxX, b.x + b.width);
      maxY = Math.max(maxY, b.y + b.height);
    }

    const dpr = window.devicePixelRatio || 1;
    const cw = canvas.width / dpr;
    const ch = canvas.height / dpr;
    const pad = 60;
    const sceneW = maxX - minX + pad * 2;
    const sceneH = maxY - minY + pad * 2;
    const zoom = Math.min(cw / sceneW, ch / sceneH, 2);

    setCamera({
      zoom,
      x: (cw - (maxX - minX) * zoom) / 2 - minX * zoom,
      y: (ch - (maxY - minY) * zoom) / 2 - minY * zoom,
    });
  }, []);

  // ── Mouse handlers ─────────────────────────────────────────────────────────

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 2) return; // right-click: reserved

    const { screenX, screenY } = getCanvasPoint(e);
    const cam = cameraRef.current;
    const worldPt = screenToWorld(screenX, screenY, cam);
    const { tool, snapToGrid, gridSize } = appStateRef.current;
    const snappedPt: Point = snapToGrid
      ? { x: snap(worldPt.x, gridSize), y: snap(worldPt.y, gridSize) }
      : worldPt;

    // Middle mouse or space+drag → pan
    if (e.button === 1 || (spaceHeldRef.current && tool !== 'hand')) {
      interactionRef.current = { type: 'panning', startScreen: { x: screenX, y: screenY }, origCamera: { ...cam } };
      renderFrame();
      return;
    }

    if (tool === 'hand') {
      interactionRef.current = { type: 'panning', startScreen: { x: screenX, y: screenY }, origCamera: { ...cam } };
      renderFrame();
      return;
    }

    if (tool === 'eraser') {
      interactionRef.current = { type: 'erasing', erasedIds: new Set() };
      const hit = [...elementsRef.current].reverse().find((el) => hitTestElement(el, worldPt, cam.zoom));
      if (hit) {
        (interactionRef.current as Extract<InteractionState, { type: 'erasing' }>).erasedIds.add(hit.id);
        setElements((prev) => prev.filter((e) => e.id !== hit.id));
      }
      return;
    }

    if (tool === 'select') {
      const selIds = selectedIdsRef.current;
      const singleSelected = selIds.size === 1;

      // Check rotation / resize handles
      if (singleSelected) {
        const selEl = elementsRef.current.find((e) => selIds.has(e.id));
        if (selEl) {
          // Rotation handle
          const center = getElementCenter(selEl);
          const rotHandleScreen = worldToScreen(center.x, center.y - 28 / cam.zoom, cam);
          const dx = screenX - rotHandleScreen.x;
          const dy = screenY - rotHandleScreen.y;
          if (Math.sqrt(dx * dx + dy * dy) <= 10) {
            const startAngle = Math.atan2(screenY - (center.y * cam.zoom + cam.y), screenX - (center.x * cam.zoom + cam.x));
            interactionRef.current = {
              type: 'rotating',
              elementId: selEl.id,
              centerWorld: center,
              startAngle,
              origAngle: selEl.angle,
            };
            renderFrame();
            return;
          }

          // Resize handles
          const handle = hitTestHandle(selEl, { x: screenX, y: screenY }, cam);
          if (handle) {
            interactionRef.current = {
              type: 'resizing',
              elementId: selEl.id,
              handle,
              startWorld: worldPt,
              origElement: { ...selEl },
            };
            renderFrame();
            return;
          }
        }
      }

      // Check element hit
      const hit = [...elementsRef.current].reverse().find((el) => hitTestElement(el, worldPt, cam.zoom));
      if (hit) {
        // Select group if element belongs to one
        let newSel: Set<string>;
        if (hit.groupId) {
          const groupEls = elementsRef.current.filter((ge) => ge.groupId === hit.groupId);
          newSel = e.shiftKey
            ? new Set([...selIds, ...groupEls.map((ge) => ge.id)])
            : new Set(groupEls.map((ge) => ge.id));
        } else {
          newSel = e.shiftKey ? new Set([...selIds, hit.id]) : (selIds.has(hit.id) ? selIds : new Set([hit.id]));
        }
        setSelectedIds(newSel);

        // Prep move
        const origPositions = new Map<string, Point>();
        for (const id of newSel) {
          const el = elementsRef.current.find((e) => e.id === id)!;
          if (el) origPositions.set(id, { x: el.x, y: el.y });
        }
        interactionRef.current = { type: 'moving', startWorld: worldPt, origPositions };
        renderFrame();
        return;
      }

      // No hit → start box selection
      if (!e.shiftKey) setSelectedIds(new Set());
      interactionRef.current = { type: 'selecting', startWorld: worldPt, currentWorld: worldPt };
      renderFrame();
      return;
    }

    if (tool === 'text') {
      const hit = [...elementsRef.current].reverse().find(
        (el) => el.type === 'text' && hitTestElement(el, worldPt, cam.zoom)
      );
      if (hit) { startEditingText(hit.id); return; }

      // Create new text element
      const el = createNewElement('text', snappedPt.x, snappedPt.y, appStateRef.current);
      setElements((prev) => [...prev, el]);
      setSelectedIds(new Set([el.id]));
      // Start editing it right away
      setTimeout(() => startEditingText(el.id), 10);
      return;
    }

    if (tool === 'image') {
      placeImage(snappedPt.x, snappedPt.y);
      return;
    }

    if (tool === 'pen') {
      const el = createNewElement('pen', snappedPt.x, snappedPt.y, appStateRef.current);
      el.points = [{ x: 0, y: 0 }];
      interactionRef.current = { type: 'pen', element: el, points: [{ x: 0, y: 0 }] };
      renderFrame();
      return;
    }

    // Shape tools: rectangle, ellipse, diamond, line, arrow
    const el = createNewElement(tool as any, snappedPt.x, snappedPt.y, appStateRef.current);
    interactionRef.current = { type: 'drawing', element: el, startWorld: snappedPt };
    renderFrame();
  }, [getCanvasPoint, setElements, setSelectedIds, startEditingText, placeImage, renderFrame]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const { screenX, screenY } = getCanvasPoint(e);
    const cam = cameraRef.current;
    const worldPt = screenToWorld(screenX, screenY, cam);
    const { snapToGrid: doSnap, gridSize } = appStateRef.current;
    const snapped: Point = doSnap ? { x: snap(worldPt.x, gridSize), y: snap(worldPt.y, gridSize) } : worldPt;

    setCursor(worldPt);

    const inter = interactionRef.current;

    switch (inter.type) {
      case 'panning': {
        const dx = screenX - inter.startScreen.x;
        const dy = screenY - inter.startScreen.y;
        cameraRef.current = { ...inter.origCamera, x: inter.origCamera.x + dx, y: inter.origCamera.y + dy };
        setCamera(cameraRef.current);
        break;
      }

      case 'drawing': {
        const { startWorld, element } = inter;
        const dx = snapped.x - startWorld.x;
        const dy = snapped.y - startWorld.y;

        if (element.type === 'line' || element.type === 'arrow') {
          inter.element = { ...element, points: [{ x: 0, y: 0 }, { x: dx, y: dy }], width: dx, height: dy };
        } else {
          const box = normalizeRect(startWorld.x, startWorld.y, snapped.x, snapped.y);
          // Shift = square/circle
          if (shiftHeldRef.current) {
            const size = Math.max(box.width, box.height);
            box.width = size;
            box.height = size;
            if (snapped.x < startWorld.x) box.x = startWorld.x - size;
            if (snapped.y < startWorld.y) box.y = startWorld.y - size;
          }
          inter.element = { ...element, ...box };
        }
        renderFrame();
        break;
      }

      case 'pen': {
        const { element, points } = inter;
        const newPt: Point = { x: snapped.x - element.x, y: snapped.y - element.y };
        const newPoints = [...points, newPt];
        inter.points = newPoints;
        inter.element = { ...element, points: newPoints };
        renderFrame();
        break;
      }

      case 'moving': {
        const { startWorld, origPositions } = inter;
        const dx = snapped.x - startWorld.x;
        const dy = snapped.y - startWorld.y;
        const ids = selectedIdsRef.current;
        setElements((prev) =>
          prev.map((el) => {
            if (!ids.has(el.id)) return el;
            const orig = origPositions.get(el.id);
            if (!orig) return el;
            return { ...el, x: orig.x + dx, y: orig.y + dy };
          })
        );
        break;
      }

      case 'resizing': {
        const { elementId, handle, startWorld, origElement } = inter;
        const dx = snapped.x - startWorld.x;
        const dy = snapped.y - startWorld.y;
        const result = applyResize(origElement, handle, { x: dx, y: dy }, shiftHeldRef.current);
        setElements((prev) =>
          prev.map((el) => (el.id === elementId ? { ...el, ...result } : el))
        );
        break;
      }

      case 'rotating': {
        const { elementId, centerWorld, startAngle, origAngle } = inter;
        const newAngle = applyRotation(centerWorld, { x: screenX, y: screenY }, cam, origAngle, startAngle);
        setElements((prev) =>
          prev.map((el) => (el.id === elementId ? { ...el, angle: newAngle } : el))
        );
        break;
      }

      case 'selecting': {
        inter.currentWorld = worldPt;
        renderFrame();
        break;
      }

      case 'erasing': {
        const hit = [...elementsRef.current].reverse().find(
          (el) => !inter.erasedIds.has(el.id) && hitTestElement(el, worldPt, cam.zoom)
        );
        if (hit) {
          inter.erasedIds.add(hit.id);
          setElements((prev) => prev.filter((e) => e.id !== hit.id));
        }
        break;
      }
    }
  }, [getCanvasPoint, setCamera, setElements, renderFrame]);

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const inter = interactionRef.current;

    if (inter.type === 'drawing') {
      const el = inter.element;
      // Only add if has meaningful size
      const meaningful = (el.type === 'line' || el.type === 'arrow')
        ? (el.points && (Math.abs(el.points[1]?.x ?? 0) > 3 || Math.abs(el.points[1]?.y ?? 0) > 3))
        : (el.width > 3 || el.height > 3);

      if (meaningful) {
        setElements((prev) => [...prev, el]);
        setSelectedIds(new Set([el.id]));
      }
    } else if (inter.type === 'pen') {
      const el = inter.element;
      if (el.points && el.points.length > 2) {
        setElements((prev) => [...prev, el]);
        setSelectedIds(new Set([el.id]));
      }
    } else if (inter.type === 'selecting') {
      const box = normalizeRect(inter.startWorld.x, inter.startWorld.y, inter.currentWorld.x, inter.currentWorld.y);
      if (box.width > 3 || box.height > 3) {
        const inBox = elementsRef.current.filter((el) => hitTestBox(el, box)).map((el) => el.id);
        if (e.shiftKey) {
          setSelectedIds((prev) => new Set([...prev, ...inBox]));
        } else {
          setSelectedIds(new Set(inBox));
        }
      }
    }

    interactionRef.current = { type: 'idle' };
    renderFrame();
  }, [getCanvasPoint, setElements, setSelectedIds, renderFrame]);

  const handleDblClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const { screenX, screenY } = getCanvasPoint(e);
    const cam = cameraRef.current;
    const worldPt = screenToWorld(screenX, screenY, cam);
    const hit = [...elementsRef.current].reverse().find((el) => hitTestElement(el, worldPt, cam.zoom));
    if (hit?.type === 'text') {
      startEditingText(hit.id);
    } else if (hit) {
      // Double-click on non-text: select
      setSelectedIds(new Set([hit.id]));
    } else {
      // Double click empty → text tool
      const el = createNewElement('text', worldPt.x, worldPt.y, appStateRef.current);
      setElements((prev) => [...prev, el]);
      setSelectedIds(new Set([el.id]));
      setTimeout(() => startEditingText(el.id), 10);
    }
  }, [getCanvasPoint, setElements, setSelectedIds, startEditingText]);

  // ── Wheel zoom ────────────────────────────────────────────────────────────

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const { screenX, screenY } = getCanvasPoint(e);
    const cam = cameraRef.current;

    if (e.ctrlKey || e.metaKey) {
      // Normalize to pixels and cap to prevent huge jumps on fast trackpad swipes
      const rawDelta = e.deltaMode === 1 ? e.deltaY * 20 : e.deltaMode === 2 ? e.deltaY * 400 : e.deltaY;
      const delta = Math.sign(rawDelta) * Math.min(Math.abs(rawDelta), 120);
      const factor = Math.pow(0.999, delta);
      const newCam = zoomAt(cam, screenX, screenY, cam.zoom * factor);
      cameraRef.current = newCam;
      setCamera(newCam);
    } else {
      // Pan
      const newCam = { ...cam, x: cam.x - e.deltaX, y: cam.y - e.deltaY };
      cameraRef.current = newCam;
      setCamera(newCam);
    }
  }, [getCanvasPoint]);

  // Attach wheel listener (non-passive to allow preventDefault)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────

  useEffect(() => {
    const toolKeys: Record<string, ToolType> = {
      v: 'select', h: 'hand', r: 'rectangle', e: 'ellipse', o: 'ellipse',
      d: 'diamond', a: 'arrow', l: 'line', p: 'pen', t: 'text',
      x: 'eraser', i: 'image',
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const key = e.key.toLowerCase();
      spaceHeldRef.current = key === ' ';
      shiftHeldRef.current = e.shiftKey;

      if (key === ' ') { e.preventDefault(); return; }

      const ctrl = e.ctrlKey || e.metaKey;

      // Tool shortcuts
      if (!ctrl && toolKeys[key]) {
        setAppStatePatch({ tool: toolKeys[key] });
        return;
      }

      if (ctrl) {
        switch (key) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) redo(); else undo();
            return;
          case 'y': e.preventDefault(); redo(); return;
          case 'a':
            e.preventDefault();
            setSelectedIds(new Set(elementsRef.current.map((el) => el.id)));
            return;
          case 'c':
            e.preventDefault();
            clipboardRef.current = copyElements(elementsRef.current.filter((el) => selectedIdsRef.current.has(el.id)));
            return;
          case 'v':
            e.preventDefault();
            {
              const pasted = pasteElements(clipboardRef.current);
              setElements((prev) => [...prev, ...pasted]);
              setSelectedIds(new Set(pasted.map((el) => el.id)));
            }
            return;
          case 'd':
            e.preventDefault();
            setElements((prev) => {
              const duped = duplicateElements(prev.filter((el) => selectedIdsRef.current.has(el.id)));
              setSelectedIds(new Set(duped.map((el) => el.id)));
              return [...prev, ...duped];
            });
            return;
          case 'g':
            e.preventDefault();
            if (e.shiftKey) ungroupSelected(); else groupSelected();
            return;
          case ']':
            e.preventDefault();
            if (e.shiftKey) bringToFront(); else bringForward();
            return;
          case '[':
            e.preventDefault();
            if (e.shiftKey) sendToBack(); else sendBackward();
            return;
          case '0':
            e.preventDefault();
            setCamera((c) => ({ ...c, zoom: 1 }));
            return;
        }
      }

      // Delete / Backspace
      if ((key === 'delete' || key === 'backspace') && selectedIdsRef.current.size > 0) {
        e.preventDefault();
        const ids = selectedIdsRef.current;
        setElements((prev) => prev.filter((el) => !ids.has(el.id)));
        setSelectedIds(new Set());
        return;
      }

      // Escape
      if (key === 'escape') {
        setSelectedIds(new Set());
        interactionRef.current = { type: 'idle' };
        renderFrame();
        return;
      }

      // Zoom
      if (key === '+' || key === '=') {
        const canvas = canvasRef.current;
        if (canvas) {
          const dpr = window.devicePixelRatio || 1;
          const cx = canvas.width / dpr / 2;
          const cy = canvas.height / dpr / 2;
          setCamera((c) => zoomAt(c, cx, cy, c.zoom * 1.2));
        }
        return;
      }
      if (key === '-') {
        const canvas = canvasRef.current;
        if (canvas) {
          const dpr = window.devicePixelRatio || 1;
          const cx = canvas.width / dpr / 2;
          const cy = canvas.height / dpr / 2;
          setCamera((c) => zoomAt(c, cx, cy, c.zoom / 1.2));
        }
        return;
      }

      // Ctrl+Shift+H = zoom to fit
      if (ctrl && e.shiftKey && key === 'h') {
        e.preventDefault();
        zoomToFit();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') spaceHeldRef.current = false;
      shiftHeldRef.current = e.shiftKey;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [undo, redo, setElements, setSelectedIds, setAppStatePatch, bringToFront, sendToBack,
      bringForward, sendBackward, groupSelected, ungroupSelected, zoomToFit, renderFrame]);

  // ── Drag/drop image files ──────────────────────────────────────────────────

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const { screenX, screenY } = getCanvasPoint(e as any);
    const worldPt = screenToWorld(screenX, screenY, cameraRef.current);

    const file = e.dataTransfer.files[0];
    if (!file?.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const aspect = img.width / img.height;
        const w = Math.min(300, img.width);
        const h = w / aspect;
        setElements((prev) => [
          ...prev,
          {
            id: nanoid(),
            type: 'image',
            x: worldPt.x - w / 2,
            y: worldPt.y - h / 2,
            width: w,
            height: h,
            angle: 0,
            strokeColor: '#000',
            backgroundColor: 'transparent',
            fillStyle: 'none',
            strokeWidth: 1,
            strokeStyle: 'solid',
            roughness: 0,
            opacity: 100,
            src,
            seed: Math.floor(Math.random() * 100000),
            version: 1,
          },
        ]);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  }, [getCanvasPoint, setElements]);

  // ── Cursor style ──────────────────────────────────────────────────────────

  const cursorStyle = useMemo(() => {
    const inter = interactionRef.current;
    const { tool } = appState;
    if (inter.type === 'panning') return 'grabbing';
    if (tool === 'hand') return 'grab';
    if (tool === 'eraser') return 'cell';
    if (tool === 'text') return 'text';
    if (tool === 'select') return 'default';
    return 'crosshair';
  }, [appState.tool]);

  // ── Import ────────────────────────────────────────────────────────────────

  const handleImport = useCallback((data: { elements: CanvasElement[]; camera: CameraState }) => {
    setElements(data.elements);
    setCamera(data.camera);
    setSelectedIds(new Set());
  }, [setElements]);

  // ── Zoom setters for BottomBar ─────────────────────────────────────────────

  const setZoom = useCallback((zoom: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const cx = canvas.width / dpr / 2;
    const cy = canvas.height / dpr / 2;
    setCamera((c) => zoomAt(c, cx, cy, zoom));
  }, []);

  // ── Clear canvas ──────────────────────────────────────────────────────────

  const clearCanvas = useCallback(() => {
    if (window.confirm('Clear all elements?')) {
      setElements([]);
      setSelectedIds(new Set());
    }
  }, [setElements]);

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden select-none"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ cursor: cursorStyle }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDoubleClick={handleDblClick}
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* Text editor overlay */}
      {editingTextId && editingTextPos && (() => {
        const el = elements.find((e) => e.id === editingTextId);
        return (
          <textarea
            autoFocus
            defaultValue={el?.text ?? ''}
            onBlur={(e) => finishEditingText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') { e.preventDefault(); finishEditingText(e.currentTarget.value); }
            }}
            style={{
              position: 'absolute',
              left: editingTextPos.screenX,
              top: editingTextPos.screenY,
              minWidth: Math.max(editingTextPos.width, 100),
              minHeight: Math.max(editingTextPos.height, 32),
              fontSize: (el?.fontSize ?? 20) * camera.zoom,
              fontFamily: el?.fontFamily ?? 'sans-serif',
              color: el?.strokeColor ?? '#1e1e1e',
              background: 'transparent',
              border: '1.5px dashed #5b8af6',
              borderRadius: 4,
              padding: '2px 4px',
              outline: 'none',
              resize: 'both',
              zIndex: 30,
              lineHeight: 1.35,
            }}
          />
        );
      })()}

      {/* Toolbar */}
      <Toolbar
        appState={appState}
        onAppStateChange={setAppStatePatch}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        onClear={clearCanvas}
        onExport={() => setShowExportModal(true)}
        camera={camera}
        onZoom={setZoom}
        onZoomFit={zoomToFit}
      />

      {/* Top style bar */}
      <TopBar
        appState={appState}
        onAppStateChange={setAppStatePatch}
        selectedElements={selectedElements}
      />

      {/* Properties panel */}
      <PropertiesPanel
        selectedElements={selectedElements}
        allElements={elements}
        appState={appState}
        onElementsChange={setElements}
        onAppStateChange={setAppStatePatch}
        onBringToFront={bringToFront}
        onSendToBack={sendToBack}
        onBringForward={bringForward}
        onSendBackward={sendBackward}
        onGroup={groupSelected}
        onUngroup={ungroupSelected}
      />

      {/* Export modal */}
      {showExportModal && (
        <ExportModal
          elements={elements}
          camera={camera}
          onClose={() => setShowExportModal(false)}
          onImport={handleImport}
        />
      )}
    </div>
  );
}
