import { useState, useCallback, useRef } from 'react';
import { CanvasElement } from '@/types/canvas';

const MAX_HISTORY = 50;

export function useCanvasHistory(initialElements: CanvasElement[]) {
    const [history, setHistory] = useState<CanvasElement[][]>([structuredClone(initialElements)]);
    const [index, setIndex] = useState(0);
    const skipNextPush = useRef(false);

    const pushState = useCallback((elements: CanvasElement[]) => {
        if (skipNextPush.current) {
            skipNextPush.current = false;
            return;
        }
        setHistory(prev => {
            const trimmed = prev.slice(0, index + 1);
            const next = [...trimmed, structuredClone(elements)];
            if (next.length > MAX_HISTORY) next.shift();
            return next;
        });
        setIndex(prev => Math.min(prev + 1, MAX_HISTORY - 1));
    }, [index]);

    const undo = useCallback((): CanvasElement[] | null => {
        if (index <= 0) return null;
        const newIndex = index - 1;
        setIndex(newIndex);
        skipNextPush.current = true;
        return structuredClone(history[newIndex]);
    }, [index, history]);

    const redo = useCallback((): CanvasElement[] | null => {
        if (index >= history.length - 1) return null;
        const newIndex = index + 1;
        setIndex(newIndex);
        skipNextPush.current = true;
        return structuredClone(history[newIndex]);
    }, [index, history]);

    return {
        pushState,
        undo,
        redo,
        canUndo: index > 0,
        canRedo: index < history.length - 1,
    };
}
