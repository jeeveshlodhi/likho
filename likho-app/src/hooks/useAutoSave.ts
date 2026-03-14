import { useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useAuthStore } from '@/store/authStore';
import { createPage, updatePage } from '@/lib/workspaceApi';
import { SearchService } from '@/lib/search-service';
import { isTauri } from '@/utils/platform';
import type { Note } from '@/types/workspace';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Autosave hook for note content.
 *
 * @param noteId       - Current note ID (may be a nanoid or a UUID)
 * @param onlineSpaceId - ID of the user's online space (passed in from the editor so
 *                        we don't call useWorkspace/useSpaces here and risk triggering
 *                        React Query updates during a child render cycle)
 * @param delay        - Local debounce delay in ms (default 500)
 */
export function useAutoSave(noteId: string, onlineSpaceId?: string, delay = 500) {
  const updateNote = useWorkspaceStore((s) => s.updateNote);
  const replaceNote = useWorkspaceStore((s) => s.replaceNote);
  const notes = useWorkspaceStore((s) => s.notes);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isGuest = useAuthStore((s) => s.isGuest);
  const navigate = useNavigate();

  const localTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backendTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Prevent concurrent create calls when saves fire quickly
  const isCreatingRef = useRef(false);

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

        // Sync note to local Rust DB and index for RAG only in Tauri desktop (invoke is undefined in web)
        const note = notes.find((n) => n.id === noteId);
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

      // For online notes: persist to backend (slightly longer debounce)
      const note = notes.find((n) => n.id === noteId);
      const isOnline = note?.spaceType === 'online';
      // Also persist for shared remote pages: UUID not in local store (e.g. shared with current user)
      const isSharedRemote = !note && UUID_REGEX.test(noteId);
      if ((!isOnline && !isSharedRemote) || !isAuthenticated || isGuest) return;

      if (backendTimeoutRef.current) clearTimeout(backendTimeoutRef.current);
      backendTimeoutRef.current = setTimeout(async () => {
        const isUuid = UUID_REGEX.test(noteId);

        if (isUuid) {
          // ── Normal update path ──────────────────────────────────────────
          const backendUpdates: Record<string, unknown> = {};
          if (updates.title !== undefined) backendUpdates.title = updates.title;
          if (updates.content !== undefined) backendUpdates.content = updates.content;
          if (updates.icon !== undefined) backendUpdates.icon = updates.icon;

          if (Object.keys(backendUpdates).length > 0) {
            updatePage(noteId, backendUpdates).catch(() => {
              // Silent fail — local copy is source of truth
            });
          }
        } else {
          // ── Create-on-first-save path ───────────────────────────────────
          // The note has a local nanoid ID — it hasn't been registered in the
          // backend yet. Call createPage once, then replace the local nanoid
          // with the returned UUID and navigate to the new route.
          if (isCreatingRef.current) return;
          if (!onlineSpaceId) return; // space ID not yet loaded — will retry on next save

          isCreatingRef.current = true;

          const currentNote = notes.find((n) => n.id === noteId);
          if (!currentNote) {
            isCreatingRef.current = false;
            return;
          }

          try {
            const newPage = await createPage({
              title: (updates.title ?? currentNote.title) || 'Untitled',
              space_id: onlineSpaceId,
              content: updates.content ?? currentNote.content,
              page_type: currentNote.pageType ?? 'note',
              // Only pass parent_id if it's a real UUID — nanoid folder IDs
              // have not been synced to the backend yet.
              parent_id: currentNote.folderId && UUID_REGEX.test(currentNote.folderId)
                ? currentNote.folderId
                : null,
            });

            // Swap the nanoid for the real UUID in the local store
            replaceNote(noteId, newPage.id);
            // Navigate to the UUID-based route
            navigate(`/dashboard/note/${newPage.id}`, { replace: true });
          } catch (err) {
            console.warn('Failed to register online note with backend:', err);
          } finally {
            isCreatingRef.current = false;
          }
        }
      }, Math.max(delay, 1000)); // backend debounce: at least 1s
    },
    [noteId, delay, updateNote, replaceNote, notes, isAuthenticated, isGuest, onlineSpaceId, navigate]
  );

  return save;
}
