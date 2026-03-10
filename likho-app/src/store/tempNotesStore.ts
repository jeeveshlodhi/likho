import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import { addDays, isBefore, parseISO } from 'date-fns';
import type { TempNote, TempNotesSettings } from '@/types/tempNote';

interface TempNotesState {
  notes: TempNote[];
  settings: TempNotesSettings;
  isQuickCaptureOpen: boolean;

  // Actions
  createNote: (content: string, ttlDays?: number) => TempNote;
  updateNote: (id: string, updates: Partial<Pick<TempNote, 'content' | 'suggestedFolder' | 'aiConfidence' | 'tags'>>) => void;
  keepNote: (id: string) => void;
  deleteNote: (id: string) => void;
  purgeExpired: () => void;
  updateSettings: (s: Partial<TempNotesSettings>) => void;
  setQuickCaptureOpen: (open: boolean) => void;
}

export const useTempNotesStore = create<TempNotesState>()(
  persist(
    (set, get) => ({
      notes: [],
      settings: { defaultTtlDays: 7 },
      isQuickCaptureOpen: false,

      createNote: (content, ttlDays) => {
        const { settings } = get();
        const days = ttlDays ?? settings.defaultTtlDays;
        const now = new Date();
        const note: TempNote = {
          id: nanoid(),
          content,
          createdAt: now.toISOString(),
          expiresAt: addDays(now, days).toISOString(),
          isPermanent: false,
        };
        set((state) => ({ notes: [note, ...state.notes] }));
        return note;
      },

      updateNote: (id, updates) =>
        set((state) => ({
          notes: state.notes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
        })),

      keepNote: (id) =>
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id ? { ...n, isPermanent: true } : n
          ),
        })),

      deleteNote: (id) =>
        set((state) => ({ notes: state.notes.filter((n) => n.id !== id) })),

      purgeExpired: () => {
        const now = new Date();
        set((state) => ({
          notes: state.notes.filter(
            (n) => n.isPermanent || !isBefore(parseISO(n.expiresAt), now)
          ),
        }));
      },

      updateSettings: (s) =>
        set((state) => ({ settings: { ...state.settings, ...s } })),

      setQuickCaptureOpen: (open) => set({ isQuickCaptureOpen: open }),
    }),
    { name: 'likho-temp-notes' }
  )
);
