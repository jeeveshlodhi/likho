import { useState, useCallback, useRef } from 'react';

const MAX_HISTORY = 100;

export function useHistory<T>(initialValue: T) {
  const [index, setIndex] = useState(0);
  const historyRef = useRef<T[]>([initialValue]);

  const state = historyRef.current[index];

  const setState = useCallback(
    (value: T | ((prev: T) => T), skipHistory = false) => {
      const prev = historyRef.current[index];
      const next = typeof value === 'function' ? (value as (p: T) => T)(prev) : value;

      if (skipHistory) {
        // Overwrite current entry without creating a new history entry
        historyRef.current = [...historyRef.current.slice(0, index), next];
        setIndex(historyRef.current.length - 1);
        return;
      }

      // Truncate forward history
      const newHistory = [...historyRef.current.slice(0, index + 1), next];
      if (newHistory.length > MAX_HISTORY) newHistory.shift();
      historyRef.current = newHistory;
      setIndex(newHistory.length - 1);
    },
    [index]
  );

  const undo = useCallback(() => {
    setIndex((i) => Math.max(0, i - 1));
  }, []);

  const redo = useCallback(() => {
    setIndex((i) => Math.min(historyRef.current.length - 1, i + 1));
  }, []);

  const canUndo = index > 0;
  const canRedo = index < historyRef.current.length - 1;

  return [state, setState, undo, redo, canUndo, canRedo] as const;
}
