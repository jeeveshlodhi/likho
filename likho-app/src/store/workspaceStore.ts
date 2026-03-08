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
  renameFolder: (id: string, name: string) => void;
  deleteFolder: (id: string) => void;
  toggleFolderExpanded: (id: string) => void;
  moveFolder: (id: string, newParentId: string | null) => void;

  // Note actions
  createNote: (folderId: string | null, spaceType: SpaceType, pageType?: PageType) => Note;
  createCanvas: (folderId: string | null, spaceType: SpaceType) => Note;
  addNote: (note: Note) => void;
  updateNote: (id: string, updates: Partial<Pick<Note, 'title' | 'content' | 'icon' | 'coverImage' | 'pageType'>>) => void;
  deleteNote: (id: string) => void;
  moveNote: (noteId: string, targetFolderId: string | null) => void;

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

      createNote: (folderId, spaceType, pageType = 'note') => {
        const now = new Date().toISOString();
        const siblings = get().notes.filter(
          (n) => n.spaceType === spaceType && n.folderId === folderId
        );
        const note: Note = {
          id: nanoid(),
          title: pageType === 'canvas' ? 'Untitled canvas' : '',
          content: undefined,
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
            ? state.notes.map((n) => (n.id === note.id ? note : n))
            : [...state.notes, note],
        })),

      updateNote: (id, updates) =>
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n
          ),
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
