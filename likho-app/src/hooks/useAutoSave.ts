import { useCallback, useRef, useEffect } from 'react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useAuthStore } from '@/store/authStore';
import { updatePage } from '@/lib/workspaceApi';
import type { Note } from '@/types/workspace';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function useAutoSave(noteId: string, delay = 500) {
  const updateNote = useWorkspaceStore((s) => s.updateNote);
  const notes = useWorkspaceStore((s) => s.notes);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isGuest = useAuthStore((s) => s.isGuest);
  const localTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backendTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (localTimeoutRef.current) clearTimeout(localTimeoutRef.current);
      if (backendTimeoutRef.current) clearTimeout(backendTimeoutRef.current);
    };
  }, [noteId]);

  const save = useCallback(
    (updates: Partial<Pick<Note, 'title' | 'content' | 'icon'>>) => {
      // Always save locally (fast debounce)
      if (localTimeoutRef.current) clearTimeout(localTimeoutRef.current);
      localTimeoutRef.current = setTimeout(() => {
        updateNote(noteId, updates);
      }, delay);

      // For online notes: also persist to backend (slightly longer debounce)
      const note = notes.find((n) => n.id === noteId);
      const isOnline = note?.spaceType === 'online';
      const canSync = isOnline && isAuthenticated && !isGuest && UUID_REGEX.test(noteId);

      if (canSync) {
        if (backendTimeoutRef.current) clearTimeout(backendTimeoutRef.current);
        backendTimeoutRef.current = setTimeout(() => {
          const backendUpdates: Record<string, unknown> = {};
          if (updates.title !== undefined) backendUpdates.title = updates.title;
          if (updates.content !== undefined) backendUpdates.content = updates.content;
          if (updates.icon !== undefined) backendUpdates.icon = updates.icon;

          if (Object.keys(backendUpdates).length > 0) {
            updatePage(noteId, backendUpdates).catch(() => {
              // Silent fail — local copy is the source of truth
            });
          }
        }, Math.max(delay, 1000)); // backend debounce: at least 1s
      }
    },
    [noteId, delay, updateNote, notes, isAuthenticated, isGuest]
  );

  return save;
}
