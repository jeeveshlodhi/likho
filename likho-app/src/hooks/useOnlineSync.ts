/**
 * Hook to sync online pages from backend into the local Zustand store.
 * Called once when an authenticated (non-guest) user enters the dashboard.
 * Syncs both notes and folders (pages with is_folder) so sidebar has server folders with UUIDs.
 */
import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useWorkspace, useSpaces } from '@/hooks/useWorkspace';
import { fetchPages } from '@/lib/workspaceApi';
import type { Folder, Note, PageType } from '@/types/workspace';

export function useOnlineSync() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isGuest = useAuthStore((s) => s.isGuest);
  const addNote = useWorkspaceStore((s) => s.addNote);
  const addFolder = useWorkspaceStore((s) => s.addFolder);
  const { data: workspace } = useWorkspace();
  const { data: spaces } = useSpaces(workspace?.id);
  const hasSynced = useRef(false);

  useEffect(() => {
    // Only sync once per mount for authenticated non-guest users
    if (!isAuthenticated || isGuest || hasSynced.current) return;
    if (!workspace?.id || !spaces?.length) return;

    const onlineSpace = spaces.find((s) => s.type === 'online');
    if (!onlineSpace) return;

    hasSynced.current = true;

    fetchPages(onlineSpace.id)
      .then((pages) => {
        for (const page of pages) {
          if (page.is_folder) {
            const folder: Folder = {
              id: page.id,
              name: page.title || 'Folder',
              spaceType: 'online',
              parentId: page.parent_id,
              icon: page.icon ?? null,
              sortOrder: page.sort_order ?? 0,
              isExpanded: false,
              createdAt: page.created_at,
              updatedAt: page.updated_at,
            };
            addFolder(folder);
          } else {
            const note: Note = {
              id: page.id,
              title: page.title || '',
              content: page.content ?? undefined,
              folderId: page.parent_id,
              spaceType: 'online',
              pageType: (page.page_type as PageType) || 'note',
              icon: page.icon ?? null,
              coverImage: page.cover_url ?? undefined,
              sortOrder: page.sort_order ?? 0,
              createdAt: page.created_at,
              updatedAt: page.updated_at,
            };
            addNote(note);
          }
        }
      })
      .catch(() => {
        // Silent fail — user can still work with locally cached data
      });
  }, [isAuthenticated, isGuest, workspace?.id, spaces, addNote, addFolder]);
}
