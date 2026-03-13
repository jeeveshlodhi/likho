import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AiModel } from '@/lib/aiService';

export interface AiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  model: AiModel;
  sources?: { page_id: string; title: string; excerpt: string }[];
  loading?: boolean;
  error?: boolean;
}

interface AiChatState {
  messages: AiMessage[];
  selectedModel: AiModel;
  /** Whether the floating AI panel (Cmd+J) is open */
  panelOpen: boolean;
  /** Plain-text content of the currently active note (set by NoteEditor) */
  noteContext: string | null;
  noteContextTitle: string | null;
  noteContextId: string | null;

  addMessage: (msg: AiMessage) => void;
  updateMessage: (id: string, updates: Partial<AiMessage>) => void;
  clearMessages: () => void;
  setModel: (model: AiModel) => void;
  setPanelOpen: (open: boolean) => void;
  togglePanel: () => void;
  setNoteContext: (text: string | null, title: string | null, noteId: string | null) => void;
}

export const useAiChatStore = create<AiChatState>()(
  persist(
    (set) => ({
      messages: [],
      selectedModel: 'gemini-1.5-flash',
      panelOpen: false,
      noteContext: null,
      noteContextTitle: null,
      noteContextId: null,

      addMessage: (msg) =>
        set((s) => ({ messages: [...s.messages, msg] })),

      updateMessage: (id, updates) =>
        set((s) => ({
          messages: s.messages.map((m) => (m.id === id ? { ...m, ...updates } : m)),
        })),

      clearMessages: () => set({ messages: [] }),

      setModel: (selectedModel) => set({ selectedModel }),

      setPanelOpen: (panelOpen) => set({ panelOpen }),

      togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),

      setNoteContext: (noteContext, noteContextTitle, noteContextId) =>
        set({ noteContext, noteContextTitle, noteContextId }),
    }),
    {
      name: 'ai-chat-store',
      // Only persist model selection and last 50 messages
      partialize: (s) => ({
        messages: s.messages.slice(-50),
        selectedModel: s.selectedModel,
      }),
    },
  ),
);
