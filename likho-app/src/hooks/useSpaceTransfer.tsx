/**
 * useSpaceTransfer
 *
 * React hook that orchestrates moving notes and folders between Online and Offline
 * spaces. Wraps the transfer service with toast progress notifications and job
 * tracking.
 *
 * Call this once in SpaceSection and pass the returned callbacks as props so
 * child components (NoteItem, FolderItem) don't each subscribe to workspace/spaces.
 */

import { useCallback } from 'react';
import { nanoid } from 'nanoid';
import { toast } from '@/components/ui/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { useWorkspace, useSpaces } from '@/hooks/useWorkspace';
import { useAuthStore } from '@/store/authStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useTransferStore } from '@/store/transferStore';
import {
  transferSingleNote,
  transferFolderContents,
  countFolderItems,
} from '@/lib/spaceTransferService';
import type { Note, Folder, SpaceType } from '@/types/workspace';

export interface SpaceTransferActions {
  /** Move a single note to the opposite space. Shows a toast with an Undo option. */
  moveNote: (note: Note) => Promise<void>;
  /** Start a folder transfer (with progress toast). Call this after the user confirms. */
  moveFolder: (folder: Folder) => Promise<void>;
  /** Cancel an active folder transfer job. */
  cancelTransfer: (jobId: string) => void;
  /** True if the user can transfer items to the online space (authenticated & spaces loaded). */
  canGoOnline: boolean;
}

export function useSpaceTransfer(): SpaceTransferActions {
  const { data: workspace } = useWorkspace();
  const { data: spaces } = useSpaces(workspace?.id);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isGuest = useAuthStore((s) => s.isGuest);
  const { addJob, updateJob, cancelJob, getJob } = useTransferStore();

  const canGoOnline = isAuthenticated && !isGuest && !!spaces?.length;

  // ── Single note ────────────────────────────────────────────────────────────

  const moveNote = useCallback(
    async (note: Note) => {
      const targetSpace: SpaceType = note.spaceType === 'online' ? 'offline' : 'online';
      const targetLabel = targetSpace === 'online' ? 'Online' : 'Offline';

      if (targetSpace === 'online' && !canGoOnline) {
        toast({
          title: 'Not connected',
          description: 'Sign in to move notes to Online Space',
        });
        return;
      }

      const { id: toastId, update, dismiss } = toast({
        title: `Moving "${note.title || 'Untitled'}" to ${targetLabel} Space…`,
      });

      const result = await transferSingleNote(note, targetSpace, { spaces: spaces ?? [] });

      if (result.success) {
        // For online→offline offer an Undo that moves it back online.
        // The note's ID is unchanged (UUIDs stay as-is in offline mode).
        const undoAction =
          targetSpace === 'offline' ? (
            <ToastAction
              altText="Undo"
              onClick={() => {
                dismiss();
                const restoredNote = useWorkspaceStore
                  .getState()
                  .notes.find((n) => n.id === result.newId);
                if (restoredNote) moveNote(restoredNote);
              }}
            >
              Undo
            </ToastAction>
          ) : undefined;

        update({
          id: toastId,
          title: `Moved to ${targetLabel} Space`,
          description: `"${note.title || 'Untitled'}" is now in ${targetLabel} Space`,
          action: undoAction,
        });

        // Auto-dismiss after 6 s
        setTimeout(() => dismiss(), 6000);
      } else {
        update({
          id: toastId,
          title: 'Transfer failed',
          description: result.error || 'Unknown error',
        });
      }
    },
    [canGoOnline, spaces]
  );

  // ── Folder ─────────────────────────────────────────────────────────────────

  const moveFolder = useCallback(
    async (folder: Folder) => {
      const targetSpace: SpaceType = folder.spaceType === 'online' ? 'offline' : 'online';
      const targetLabel = targetSpace === 'online' ? 'Online' : 'Offline';

      if (targetSpace === 'online' && !canGoOnline) {
        toast({
          title: 'Not connected',
          description: 'Sign in to move folders to Online Space',
        });
        return;
      }

      const total = countFolderItems(folder.id);

      const job = addJob({
        id: nanoid(),
        type: 'folder',
        sourceName: folder.name,
        fromSpace: folder.spaceType,
        toSpace: targetSpace,
        status: 'in_progress',
        total,
        done: 0,
        failCount: 0,
      });

      const { id: toastId, update, dismiss } = toast({
        title: `Moving "${folder.name}" to ${targetLabel} Space`,
        description: `0 / ${total} items transferred`,
      });

      const handleProgress = (done: number, tot: number) => {
        updateJob(job.id, { done, total: tot });
        update({
          id: toastId,
          title: `Moving "${folder.name}" to ${targetLabel} Space`,
          description: `${done} / ${tot} items transferred`,
        });
      };

      const isCancelled = () => getJob(job.id)?.isCancelled ?? false;

      const result = await transferFolderContents(folder.id, targetSpace, {
        spaces: spaces ?? [],
        onProgress: handleProgress,
        isCancelled,
      });

      const wasCancelled = getJob(job.id)?.isCancelled;

      if (wasCancelled) {
        update({
          id: toastId,
          title: 'Transfer cancelled',
          description: `${result.successCount} items were transferred before cancellation`,
        });
        updateJob(job.id, { status: 'cancelled' });
      } else if (result.error) {
        update({
          id: toastId,
          title: 'Transfer failed',
          description: result.error,
        });
        updateJob(job.id, { status: 'failed', error: result.error });
      } else if (result.failCount > 0) {
        update({
          id: toastId,
          title: 'Transfer partially complete',
          description: `${result.successCount} transferred, ${result.failCount} failed`,
        });
        updateJob(job.id, { status: 'failed', failCount: result.failCount });
      } else {
        update({
          id: toastId,
          title: 'Transfer complete',
          description: `${result.successCount} items moved to ${targetLabel} Space`,
        });
        updateJob(job.id, { status: 'completed', done: total });
        setTimeout(() => dismiss(), 6000);
      }
    },
    [canGoOnline, spaces, addJob, updateJob, getJob]
  );

  return { moveNote, moveFolder, cancelTransfer: cancelJob, canGoOnline };
}
