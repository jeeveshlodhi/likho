/**
 * useHistory — undo/redo with draft support
 *
 * Three update modes:
 *   setState(value)  — atomic commit: truncates future, pushes new entry.
 *                      Use for: element creation, deletion, property changes.
 *   setLive(value)   — live/draft update: no history entry, just updates the
 *                      visible state while a drag is in progress.
 *                      Use for: every mousemove during move/resize/rotate/erase.
 *   commit()         — seals the current draft into a new history entry.
 *                      Call on mouseup to close a continuous operation.
 *
 * All returned functions have stable references (no closure over changing index),
 * which avoids cascading useCallback invalidations in the canvas component.
 */

import { useState, useCallback, useRef } from 'react';

const MAX_HISTORY = 100;

export function useHistory<T>(initialValue: T) {
  // Committed history stack — only grows via setState or commit
  const historyRef = useRef<T[]>([initialValue]);
  // Pointer into the committed stack
  const indexRef   = useRef(0);
  // In-progress draft: non-null only during continuous interactions (drag etc.)
  const draftRef   = useRef<T | null>(null);

  // Trigger re-renders when any of the above refs change
  const [renderCount, setRenderCount] = useState(0);
  const rerender = useCallback(() => setRenderCount((n) => n + 1), []);

  // ── Derived visible state ─────────────────────────────────────────────────
  // Draft takes priority over the committed present during a live operation.
  const state: T = draftRef.current ?? historyRef.current[indexRef.current];

  // ── Atomic commit ─────────────────────────────────────────────────────────
  // Clears any draft, truncates the redo stack, pushes the new value.
  const setState = useCallback(
    (value: T | ((prev: T) => T)) => {
      const base = draftRef.current ?? historyRef.current[indexRef.current];
      const next = typeof value === 'function' ? (value as (p: T) => T)(base) : value;

      draftRef.current = null;

      const newHistory = [
        ...historyRef.current.slice(0, indexRef.current + 1),
        next,
      ];
      if (newHistory.length > MAX_HISTORY) newHistory.shift();

      historyRef.current = newHistory;
      indexRef.current   = newHistory.length - 1;
      rerender();
    },
    [rerender],
  );

  // ── Live draft update ─────────────────────────────────────────────────────
  // Updates the visible state without touching the committed history.
  // Safe to call on every mousemove — creates zero extra history entries.
  const setLive = useCallback(
    (value: T | ((prev: T) => T)) => {
      const base = draftRef.current ?? historyRef.current[indexRef.current];
      const next = typeof value === 'function' ? (value as (p: T) => T)(base) : value;
      draftRef.current = next;
      rerender();
    },
    [rerender],
  );

  // ── Commit draft → history ────────────────────────────────────────────────
  // Seals the current draft (or committed state if no draft) into a new entry.
  // Call this on mouseup after a continuous interaction.
  // If there is no draft (nothing actually changed), this is a no-op.
  const commit = useCallback(() => {
    if (draftRef.current === null) return; // nothing to commit

    const current = draftRef.current;
    draftRef.current = null;

    const newHistory = [
      ...historyRef.current.slice(0, indexRef.current + 1),
      current,
    ];
    if (newHistory.length > MAX_HISTORY) newHistory.shift();

    historyRef.current = newHistory;
    indexRef.current   = newHistory.length - 1;
    rerender();
  }, [rerender]);

  // ── Undo ─────────────────────────────────────────────────────────────────
  const undo = useCallback(() => {
    // Discard any in-progress draft — pressing Ctrl+Z mid-drag reverts cleanly
    if (draftRef.current !== null) {
      draftRef.current = null;
      rerender();
      return;
    }
    if (indexRef.current > 0) {
      indexRef.current -= 1;
      rerender();
    }
  }, [rerender]);

  // ── Redo ─────────────────────────────────────────────────────────────────
  const redo = useCallback(() => {
    draftRef.current = null;
    if (indexRef.current < historyRef.current.length - 1) {
      indexRef.current += 1;
      rerender();
    }
  }, [rerender]);

  // ── Flags ─────────────────────────────────────────────────────────────────
  // Recomputed on every render via the renderCount trigger.
  void renderCount; // consumed to suppress unused-variable lint
  const canUndo = draftRef.current !== null || indexRef.current > 0;
  const canRedo = draftRef.current === null && indexRef.current < historyRef.current.length - 1;

  return [state, setState, setLive, commit, undo, redo, canUndo, canRedo] as const;
}
