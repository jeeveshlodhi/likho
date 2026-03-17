/**
 * Space Transfer Service
 *
 * Handles moving notes and folders between Online Space and Offline Space.
 * Uses a safe copy-then-verify-then-delete pattern where possible.
 *
 * Key behaviours:
 * - Online → Offline: update spaceType in local store, then delete from backend (best-effort).
 * - Offline → Online: create on backend first, then update local store with the new UUID.
 * - Folder transfers process items in batches with progress callbacks.
 */

import type { Note, Folder, SpaceType } from '@/types/workspace';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { createPage, deletePage } from '@/lib/workspaceApi';
import type { SpaceResponse } from '@/lib/workspaceApi';
import { getDescendantFolderIds } from '@/utils/folderTree';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(id: string): boolean {
  return UUID_REGEX.test(id);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Public types ─────────────────────────────────────────────────────────────

export interface TransferContext {
  spaces: SpaceResponse[];
  onProgress?: (done: number, total: number) => void;
  isCancelled?: () => boolean;
}

export interface NoteTransferResult {
  success: boolean;
  /** New note ID (unchanged for online→offline; new UUID for offline→online). */
  newId?: string;
  error?: string;
}

export interface FolderTransferResult {
  successCount: number;
  failCount: number;
  error?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Return the total number of items (folders + notes) inside a folder subtree.
 * Used to pre-calculate the progress denominator.
 */
export function countFolderItems(folderId: string): number {
  const { folders, notes } = useWorkspaceStore.getState();
  const descendantIds = getDescendantFolderIds(folders, folderId);
  const allFolderIds = [folderId, ...descendantIds];
  const noteCount = notes.filter(
    (n) => n.folderId && allFolderIds.includes(n.folderId)
  ).length;
  return allFolderIds.length + noteCount;
}

// ── Single note transfer ──────────────────────────────────────────────────────

/**
 * Transfer a single note to the opposite space.
 *
 * Online → Offline:
 *   1. Update spaceType to 'offline' in the local store.
 *   2. Best-effort DELETE of the backend page (so next sync doesn't resurrect it).
 *
 * Offline → Online:
 *   1. POST /pages to create on the backend.
 *   2. Update note's ID and spaceType in the local store.
 */
export async function transferSingleNote(
  note: Note,
  targetSpace: SpaceType,
  context: TransferContext
): Promise<NoteTransferResult> {
  const getStore = () => useWorkspaceStore.getState();

  if (targetSpace === 'offline') {
    // ── Online → Offline ──────────────────────────────────────────────────
    getStore().updateNoteSpace(note.id, 'offline');

    if (isUuid(note.id)) {
      try {
        await deletePage(note.id);
      } catch {
        // Non-critical — local change is already committed
      }
    }

    return { success: true, newId: note.id };
  } else {
    // ── Offline → Online ──────────────────────────────────────────────────
    const onlineSpace = context.spaces.find((s) => s.type === 'online');
    if (!onlineSpace) return { success: false, error: 'No online space found' };

    // Only use an existing folder as parent if it is already online
    const currentFolder = note.folderId
      ? getStore().folders.find((f) => f.id === note.folderId)
      : null;
    const parentId = currentFolder?.spaceType === 'online' ? currentFolder.id : null;

    try {
      const page = await createPage({
        space_id: onlineSpace.id,
        parent_id: parentId,
        title: note.title || 'Untitled',
        page_type: note.pageType || 'note',
        content: note.content,
      });
      getStore().updateNoteSpace(note.id, 'online', page.id, parentId);
      return { success: true, newId: page.id };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Network error' };
    }
  }
}

// ── Folder transfer ───────────────────────────────────────────────────────────

/**
 * Transfer a folder and all its contents to the opposite space.
 * Processes items sequentially to avoid UI freezes, yielding to the event loop
 * between items.
 */
export async function transferFolderContents(
  folderId: string,
  targetSpace: SpaceType,
  context: TransferContext
): Promise<FolderTransferResult> {
  if (targetSpace === 'offline') {
    return _toOffline(folderId, context);
  }

  const onlineSpace = context.spaces.find((s) => s.type === 'online');
  if (!onlineSpace) return { successCount: 0, failCount: 0, error: 'No online space found' };

  const total = countFolderItems(folderId);
  const progress = { done: 0, total };
  return _toOnline(folderId, null, onlineSpace.id, context, progress);
}

// ── Online → Offline (folder) ─────────────────────────────────────────────────

async function _toOffline(
  rootFolderId: string,
  context: TransferContext
): Promise<FolderTransferResult> {
  const { folders, notes } = useWorkspaceStore.getState();
  const descendantIds = getDescendantFolderIds(folders, rootFolderId);
  const allFolderIds = [rootFolderId, ...descendantIds];

  const noteIds = notes
    .filter((n) => n.folderId && allFolderIds.includes(n.folderId))
    .map((n) => n.id);

  const total = noteIds.length + allFolderIds.length;
  let done = 0;
  let successCount = 0;
  let failCount = 0;

  // Move all notes to offline first
  for (const noteId of noteIds) {
    if (context.isCancelled?.()) break;

    useWorkspaceStore.getState().updateNoteSpace(noteId, 'offline');
    successCount++;
    done++;
    context.onProgress?.(done, total);

    // Best-effort backend delete
    if (isUuid(noteId)) {
      try {
        await deletePage(noteId);
      } catch {
        /* ignore */
      }
    }

    // Yield to prevent UI freezing
    await sleep(0);
  }

  // Change all folders' spaceType to offline (children before parent preserves hierarchy)
  for (const fId of [...descendantIds, rootFolderId]) {
    if (context.isCancelled?.()) break;
    useWorkspaceStore.getState().updateFolderSpace(fId, 'offline');
    successCount++;
    done++;
    context.onProgress?.(done, total);
  }

  return { successCount, failCount };
}

// ── Offline → Online (folder) — recursive BFS ────────────────────────────────

interface ProgressRef {
  done: number;
  total: number;
}

async function _toOnline(
  folderId: string,
  parentOnlineId: string | null,
  spaceId: string,
  context: TransferContext,
  progress: ProgressRef
): Promise<FolderTransferResult> {
  if (context.isCancelled?.()) return { successCount: 0, failCount: 0 };

  let successCount = 0;
  let failCount = 0;

  // ── 1. Create this folder on the backend ────────────────────────────────────
  const folder = useWorkspaceStore.getState().folders.find((f) => f.id === folderId);
  if (!folder) return { successCount, failCount };

  let newFolderId: string;
  try {
    const page = await createPage({
      space_id: spaceId,
      parent_id: parentOnlineId,
      title: folder.name,
      is_folder: true,
    });
    // replaceFolder updates all children's parentId and all notes' folderId atomically
    useWorkspaceStore.getState().replaceFolder(folderId, page.id);
    useWorkspaceStore.getState().updateFolderSpace(page.id, 'online');
    newFolderId = page.id;
    successCount++;
    progress.done++;
    context.onProgress?.(progress.done, progress.total);
  } catch (e: any) {
    failCount++;
    return { successCount, failCount, error: e?.message };
  }

  // ── 2. Recurse into child folders ───────────────────────────────────────────
  // Read fresh state after the replaceFolder call above has updated parentIds
  const childFolders = useWorkspaceStore
    .getState()
    .folders.filter((f) => f.parentId === newFolderId);

  for (const child of childFolders) {
    if (context.isCancelled?.()) break;
    const result = await _toOnline(child.id, newFolderId, spaceId, context, progress);
    successCount += result.successCount;
    failCount += result.failCount;
  }

  // ── 3. Move notes in this folder to online ─────────────────────────────────
  const notesInFolder = useWorkspaceStore
    .getState()
    .notes.filter((n) => n.folderId === newFolderId);

  for (const note of notesInFolder) {
    if (context.isCancelled?.()) break;

    try {
      const page = await createPage({
        space_id: spaceId,
        parent_id: newFolderId,
        title: note.title || 'Untitled',
        page_type: note.pageType || 'note',
        content: note.content,
      });
      useWorkspaceStore.getState().updateNoteSpace(note.id, 'online', page.id, newFolderId);
      successCount++;
    } catch {
      failCount++;
    }

    progress.done++;
    context.onProgress?.(progress.done, progress.total);
    await sleep(0);
  }

  return { successCount, failCount };
}
