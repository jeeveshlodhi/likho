import { useCallback, useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useAuthStore } from '@/store/authStore';
import { createPage, updatePage } from '@/lib/workspaceApi';
import { SearchService } from '@/lib/search-service';
import { isTauri } from '@/utils/platform';
import type { Note } from '@/types/workspace';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/**
 * Autosave hook for note content.
 *
 * @param noteId       - Current note ID (may be a nanoid or a UUID)
 * @param onlineSpaceId - ID of the user's online space
 * @param delay        - Local debounce delay in ms (default 500)
 *
 * Returns { save, saveStatus } where saveStatus reflects the last backend persist attempt.
 */
export function useAutoSave(noteId: string, onlineSpaceId?: string, delay = 500) {
  const updateNote = useWorkspaceStore((s) => s.updateNote);
  const replaceNote = useWorkspaceStore((s) => s.replaceNote);
  const navigate = useNavigate();

  // Use refs for values that change frequently so `save` callback stays stable
  const notesRef = useRef(useWorkspaceStore.getState().notes);
  const isAuthenticatedRef = useRef(useAuthStore.getState().isAuthenticated);
  const isGuestRef = useRef(useAuthStore.getState().isGuest);
  const onlineSpaceIdRef = useRef(onlineSpaceId);
  onlineSpaceIdRef.current = onlineSpaceId;

  // Keep refs in sync with store without adding them to useCallback deps
  useEffect(() => {
    const unsub = useWorkspaceStore.subscribe((s) => {
      notesRef.current = s.notes;
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = useAuthStore.subscribe((s) => {
      isAuthenticatedRef.current = s.isAuthenticated;
      isGuestRef.current = s.isGuest;
    });
    return unsub;
  }, []);

  const localTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backendTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Abort controller for the current in-flight PATCH — cancel on each new save
  const abortControllerRef = useRef<AbortController | null>(null);
  // Prevent concurrent create calls when saves fire quickly
  const isCreatingRef = useRef(false);

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (localTimeoutRef.current) clearTimeout(localTimeoutRef.current);
      if (backendTimeoutRef.current) clearTimeout(backendTimeoutRef.current);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      // Abort any in-flight save when unmounting / switching notes
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [noteId]);

  const save = useCallback(
    (updates: Partial<Pick<Note, 'title' | 'content' | 'icon'>>) => {
      // ── Local fast path (always runs) ───────────────────────────────────
      if (localTimeoutRef.current) clearTimeout(localTimeoutRef.current);
      localTimeoutRef.current = setTimeout(() => {
        updateNote(noteId, updates);

        // Sync to local Rust DB and index for RAG (Tauri desktop only)
        const note = notesRef.current.find((n) => n.id === noteId);
        if (note && isTauri()) {
          const contentVal = updates.content !== undefined ? updates.content : note.content;
          const contentStr =
            contentVal == null
              ? ''
              : typeof contentVal === 'string'
              ? contentVal
              : JSON.stringify(contentVal);

          const noteForBackend = {
            id: noteId,
            title: (updates.title !== undefined ? updates.title : note.title) || 'Untitled',
            content: contentStr,
            folder_id: note.folderId || '',
            created_at: note.createdAt,
            updated_at: new Date().toISOString(),
          };

          SearchService.syncNote(noteForBackend)
            .then(() => {
              if (updates.content !== undefined) {
                return SearchService.indexNote(noteId);
              }
            })
            .catch((err) => {
              console.warn('Failed to sync/index note for search:', err);
            });
        }
      }, delay);

      // ── Backend persist path (online notes only) ─────────────────────────
      const note = notesRef.current.find((n) => n.id === noteId);
      const isOnline = note?.spaceType === 'online';
      const isSharedRemote = !note && UUID_REGEX.test(noteId);
      if ((!isOnline && !isSharedRemote) || !isAuthenticatedRef.current || isGuestRef.current) return;

      if (backendTimeoutRef.current) clearTimeout(backendTimeoutRef.current);
      backendTimeoutRef.current = setTimeout(async () => {
        const isUuid = UUID_REGEX.test(noteId);

        if (isUuid) {
          // ── Normal update path ───────────────────────────────────────────
          const backendUpdates: Record<string, unknown> = {};
          if (updates.title !== undefined) backendUpdates.title = updates.title;
          if (updates.content !== undefined) backendUpdates.content = updates.content;
          if (updates.icon !== undefined) backendUpdates.icon = updates.icon;

          if (Object.keys(backendUpdates).length === 0) return;

          // Cancel any previous in-flight save to prevent stale writes racing ahead
          if (abortControllerRef.current) abortControllerRef.current.abort();
          abortControllerRef.current = new AbortController();

          setSaveStatus('saving');
          if (savedTimerRef.current) clearTimeout(savedTimerRef.current);

          try {
            await updatePage(noteId, backendUpdates, abortControllerRef.current.signal);
            setSaveStatus('saved');
            // Auto-reset to idle after 2 s
            savedTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
          } catch (err: any) {
            // AbortError means a newer save superseded this one — not a real error
            if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED' || err?.name === 'AbortError') return;
            setSaveStatus('error');
          }
        } else {
          // ── Create-on-first-save path ────────────────────────────────────
          if (isCreatingRef.current) return;
          if (!onlineSpaceIdRef.current) return;

          isCreatingRef.current = true;

          const currentNote = notesRef.current.find((n) => n.id === noteId);
          if (!currentNote) {
            isCreatingRef.current = false;
            return;
          }

          setSaveStatus('saving');
          try {
            const newPage = await createPage({
              title: (updates.title ?? currentNote.title) || 'Untitled',
              space_id: onlineSpaceIdRef.current,
              content: updates.content ?? currentNote.content,
              page_type: currentNote.pageType ?? 'note',
              parent_id:
                currentNote.folderId && UUID_REGEX.test(currentNote.folderId)
                  ? currentNote.folderId
                  : null,
            });

            replaceNote(noteId, newPage.id);
            navigate(`/dashboard/note/${newPage.id}`, { replace: true });
            setSaveStatus('saved');
            savedTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
          } catch (err) {
            console.warn('Failed to register online note with backend:', err);
            setSaveStatus('error');
          } finally {
            isCreatingRef.current = false;
          }
        }
      }, Math.max(delay, 1000)); // backend debounce: at least 1 s
    },
    // Only `noteId`, `delay`, and stable store actions in deps — everything else via refs
    [noteId, delay, updateNote, replaceNote, navigate]
  );

  return { save, saveStatus };
}
