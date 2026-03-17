import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import type { Folder, Note, SpaceType, PageType } from '@/types/workspace';
import { getDescendantFolderIds } from '@/utils/folderTree';

interface WorkspaceState {
  folders: Folder[];
  notes: Note[];
  activeNoteId: string | null;
  activeFolderId: string | null;
  sidebarCollapsed: boolean;
  sidebarWidth: number;
  expandedSpaces: Record<SpaceType, boolean>;

  // Folder actions
  createFolder: (name: string, spaceType: SpaceType, parentId?: string | null) => Folder;
  addFolder: (folder: Folder) => void;
  renameFolder: (id: string, name: string) => void;
  deleteFolder: (id: string) => void;
  toggleFolderExpanded: (id: string) => void;
  moveFolder: (id: string, newParentId: string | null) => void;

  // Note actions
  createNote: (folderId: string | null, spaceType: SpaceType, pageType?: PageType, content?: any) => Note;
  createCanvas: (folderId: string | null, spaceType: SpaceType) => Note;
  addNote: (note: Note) => void;
  updateNote: (id: string, updates: Partial<Pick<Note, 'title' | 'content' | 'icon' | 'coverImage' | 'pageType'>>) => void;
  replaceNote: (oldId: string, newId: string) => void;
  deleteNote: (id: string) => void;
  moveNote: (noteId: string, targetFolderId: string | null) => void;

  // Space transfer actions
  /** Change a note's space and optionally update its ID (when offline→online creates a new UUID). */
  updateNoteSpace: (noteId: string, newSpaceType: SpaceType, newId?: string, newFolderId?: string | null) => void;
  /** Replace a folder's ID everywhere in the store (all child folder parentIds and note folderIds are updated). */
  replaceFolder: (oldId: string, newId: string) => void;
  /** Change a folder's spaceType without changing its ID. */
  updateFolderSpace: (folderId: string, newSpaceType: SpaceType) => void;

  // UI actions
  setActiveNote: (id: string | null) => void;
  setActiveFolder: (id: string | null) => void;
  toggleSidebar: () => void;
  setSidebarWidth: (width: number) => void;
  toggleSpaceExpanded: (spaceType: SpaceType) => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      folders: [],
      notes: [],
      activeNoteId: null,
      activeFolderId: null,
      sidebarCollapsed: false,
      sidebarWidth: 260,
      expandedSpaces: { online: true, offline: true },

      createFolder: (name, spaceType, parentId = null) => {
        const now = new Date().toISOString();
        const siblings = get().folders.filter(
          (f) => f.spaceType === spaceType && f.parentId === parentId
        );
        const folder: Folder = {
          id: nanoid(),
          name,
          spaceType,
          parentId,
          icon: null,
          sortOrder: siblings.length,
          isExpanded: false,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ folders: [...state.folders, folder] }));
        return folder;
      },

      addFolder: (folder) =>
        set((state) => ({
          folders: state.folders.some((f) => f.id === folder.id)
            ? state.folders.map((f) => (f.id === folder.id ? { ...f, ...folder } : f))
            : [...state.folders, folder],
        })),

      renameFolder: (id, name) =>
        set((state) => ({
          folders: state.folders.map((f) =>
            f.id === id ? { ...f, name, updatedAt: new Date().toISOString() } : f
          ),
        })),

      deleteFolder: (id) => {
        const { folders, notes, activeNoteId } = get();
        const descendantIds = getDescendantFolderIds(folders, id);
        const allIds = new Set([id, ...descendantIds]);
        const deletedNoteIds = new Set(
          notes.filter((n) => n.folderId && allIds.has(n.folderId)).map((n) => n.id)
        );
        set({
          folders: folders.filter((f) => !allIds.has(f.id)),
          notes: notes.filter((n) => !deletedNoteIds.has(n.id)),
          activeNoteId: activeNoteId && deletedNoteIds.has(activeNoteId) ? null : activeNoteId,
          activeFolderId: null,
        });
      },

      toggleFolderExpanded: (id) =>
        set((state) => ({
          folders: state.folders.map((f) =>
            f.id === id ? { ...f, isExpanded: !f.isExpanded } : f
          ),
        })),

      moveFolder: (id, newParentId) =>
        set((state) => ({
          folders: state.folders.map((f) =>
            f.id === id ? { ...f, parentId: newParentId, updatedAt: new Date().toISOString() } : f
          ),
        })),

      createNote: (folderId, spaceType, pageType = 'note', content) => {
        const now = new Date().toISOString();
        const siblings = get().notes.filter(
          (n) => n.spaceType === spaceType && n.folderId === folderId
        );
        
        // Ensure content is properly structured for new notes
        // If content is undefined or null, create empty BlockNote structure
        let processedContent = content;
        if (!content || (typeof content === 'object' && !content.type && !Array.isArray(content))) {
          processedContent = {
            type: 'doc',
            content: [{ type: 'paragraph' }],
          };
        }
        
        const note: Note = {
          id: nanoid(),
          title: pageType === 'canvas' ? 'Untitled canvas' : '',
          content: processedContent,
          folderId,
          spaceType,
          pageType,
          icon: null,
          coverImage: undefined,
          sortOrder: siblings.length,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          notes: [...state.notes, note],
          activeNoteId: note.id,
        }));
        return note;
      },

      createCanvas: (folderId, spaceType) =>
        get().createNote(folderId, spaceType, 'canvas'),

      addNote: (note) =>
        set((state) => ({
          notes: state.notes.some((n) => n.id === note.id)
            ? state.notes.map((n) => {
                if (n.id !== note.id) return n;
                // Merge: prefer the incoming value for every field EXCEPT:
                // - `content`: only overwrite when explicitly provided (not undefined).
                //   List API responses don't include page content, so keep the local copy.
                // - `folderId`: don't overwrite a known local folder with null from the
                //   server. This can happen when useAutoSave creates a note on the backend
                //   with parent_id=null (because the folder has a local nanoid ID not yet
                //   synced). The server is then wrong; keep the local association.
                return {
                  ...n,
                  ...note,
                  content: note.content !== undefined ? note.content : n.content,
                  folderId: note.folderId ?? n.folderId,
                };
              })
            : [...state.notes, note],
        })),

      updateNote: (id, updates) =>
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n
          ),
        })),

      replaceNote: (oldId, newId) =>
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === oldId ? { ...n, id: newId } : n
          ),
          activeNoteId: state.activeNoteId === oldId ? newId : state.activeNoteId,
        })),

      deleteNote: (id) =>
        set((state) => ({
          notes: state.notes.filter((n) => n.id !== id),
          activeNoteId: state.activeNoteId === id ? null : state.activeNoteId,
        })),

      moveNote: (noteId, targetFolderId) =>
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === noteId
              ? { ...n, folderId: targetFolderId, updatedAt: new Date().toISOString() }
              : n
          ),
        })),

      updateNoteSpace: (noteId, newSpaceType, newId, newFolderId) =>
        set((state) => {
          const notes = state.notes.map((n) => {
            if (n.id !== noteId) return n;
            return {
              ...n,
              id: newId ?? n.id,
              spaceType: newSpaceType,
              folderId: newFolderId !== undefined ? newFolderId : n.folderId,
              updatedAt: new Date().toISOString(),
            };
          });
          return {
            notes,
            activeNoteId:
              newId && state.activeNoteId === noteId ? newId : state.activeNoteId,
          };
        }),

      replaceFolder: (oldId, newId) =>
        set((state) => ({
          folders: state.folders.map((f) => {
            if (f.id === oldId) return { ...f, id: newId, updatedAt: new Date().toISOString() };
            if (f.parentId === oldId) return { ...f, parentId: newId };
            return f;
          }),
          notes: state.notes.map((n) =>
            n.folderId === oldId ? { ...n, folderId: newId } : n
          ),
          activeFolderId: state.activeFolderId === oldId ? newId : state.activeFolderId,
        })),

      updateFolderSpace: (folderId, newSpaceType) =>
        set((state) => ({
          folders: state.folders.map((f) =>
            f.id === folderId
              ? { ...f, spaceType: newSpaceType, updatedAt: new Date().toISOString() }
              : f
          ),
        })),

      setActiveNote: (id) => set({ activeNoteId: id }),
      setActiveFolder: (id) => set({ activeFolderId: id }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarWidth: (width) => set({ sidebarWidth: Math.max(200, Math.min(480, width)) }),
      toggleSpaceExpanded: (spaceType) =>
        set((state) => ({
          expandedSpaces: {
            ...state.expandedSpaces,
            [spaceType]: !state.expandedSpaces[spaceType],
          },
        })),
    }),
    {
      name: 'workspace-storage',
    }
  )
);
