/**
 * Stores AI-generated metadata (tags, etc.) per note, persisted locally.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TagSuggestion } from '@/lib/cloudAiService';

export interface NoteAiMeta {
  noteId: string;
  /** AI-suggested tags with confidence scores */
  aiTags: TagSuggestion[];
  /** Tags the user has accepted (label only) */
  acceptedTags: string[];
  /** ISO timestamp of last classification */
  classifiedAt?: string;
}

interface NoteMetaState {
  meta: Record<string, NoteAiMeta>;
  setAiTags: (noteId: string, tags: TagSuggestion[]) => void;
  acceptTag: (noteId: string, label: string) => void;
  rejectTag: (noteId: string, label: string) => void;
  getMeta: (noteId: string) => NoteAiMeta | undefined;
}

export const useNoteMetaStore = create<NoteMetaState>()(
  persist(
    (set, get) => ({
      meta: {},

      setAiTags: (noteId, tags) =>
        set((s) => ({
          meta: {
            ...s.meta,
            [noteId]: {
              noteId,
              aiTags: tags,
              acceptedTags: s.meta[noteId]?.acceptedTags ?? [],
              classifiedAt: new Date().toISOString(),
            },
          },
        })),

      acceptTag: (noteId, label) =>
        set((s) => {
          const existing = s.meta[noteId];
          if (!existing) return s;
          const already = existing.acceptedTags.includes(label);
          return {
            meta: {
              ...s.meta,
              [noteId]: {
                ...existing,
                acceptedTags: already
                  ? existing.acceptedTags
                  : [...existing.acceptedTags, label],
              },
            },
          };
        }),

      rejectTag: (noteId, label) =>
        set((s) => {
          const existing = s.meta[noteId];
          if (!existing) return s;
          return {
            meta: {
              ...s.meta,
              [noteId]: {
                ...existing,
                aiTags: existing.aiTags.filter((t) => t.label !== label),
                acceptedTags: existing.acceptedTags.filter((t) => t !== label),
              },
            },
          };
        }),

      getMeta: (noteId) => get().meta[noteId],
    }),
    { name: 'likho-note-meta' }
  )
);
