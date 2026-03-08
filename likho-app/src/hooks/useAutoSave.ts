import { useCallback, useRef, useEffect } from 'react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import type { Note } from '@/types/workspace';

export function useAutoSave(noteId: string, delay = 500) {
  const updateNote = useWorkspaceStore((s) => s.updateNote);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [noteId]);

  const save = useCallback(
    (updates: Partial<Pick<Note, 'title' | 'content' | 'icon'>>) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        updateNote(noteId, updates);
      }, delay);
    },
    [noteId, delay, updateNote]
  );

  return save;
}
