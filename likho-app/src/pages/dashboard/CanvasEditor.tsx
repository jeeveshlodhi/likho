import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Excalidraw } from '@excalidraw/excalidraw';
import { useWorkspaceStore } from '@/store/workspaceStore';
import Breadcrumb from '@/components/dashboard/Breadcrumb';
import NoteTitleInput from '@/components/dashboard/NoteTitleInput';
import { useTheme } from '@/providers/ThemeProvider';

/** Persisted canvas content: elements + appState from Excalidraw (JSON-serializable). */
export interface ExcalidrawScene {
  elements?: unknown[];
  appState?: unknown;
}

function throttle(fn: (...args: unknown[]) => void, delay: number): (...args: unknown[]) => void {
  let last = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: unknown[]) => {
    const now = Date.now();
    if (timer) clearTimeout(timer);
    if (now - last >= delay) {
      last = now;
      fn(...args);
    } else {
      timer = setTimeout(() => {
        last = Date.now();
        timer = null;
        fn(...args);
      }, delay - (now - last));
    }
  };
}

export default function CanvasEditor() {
  const { noteId } = useParams<{ noteId: string }>();
  const navigate = useNavigate();
  const notes = useWorkspaceStore((s) => s.notes);
  const setActiveNote = useWorkspaceStore((s) => s.setActiveNote);
  const updateNote = useWorkspaceStore((s) => s.updateNote);
  const { theme } = useTheme();
  const noteIdRef = useRef(noteId ?? null);
  const updateNoteRef = useRef(updateNote);
  noteIdRef.current = noteId ?? null;
  updateNoteRef.current = updateNote;

  const note = notes.find((n) => n.id === noteId);

  // Initial scene only when opening this note — never from our own saves (would reload canvas).
  const [initialData, setInitialData] = useState<ExcalidrawScene | null>(null);
  const lastNoteIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!noteId || !note) return;
    if (lastNoteIdRef.current === noteId) return;
    lastNoteIdRef.current = noteId;
    const raw = note.content;
    if (!raw || typeof raw !== 'object') {
      setInitialData(null);
      return;
    }
    const content = raw as ExcalidrawScene;
    if (content.elements || content.appState) {
      setInitialData({
        elements: content.elements ?? [],
        appState: content.appState ?? undefined,
      });
    } else {
      setInitialData(null);
    }
  }, [noteId, note]);

  useEffect(() => {
    if (noteId) setActiveNote(noteId);
  }, [noteId, setActiveNote]);

  useEffect(() => {
    if (!note && noteId) {
      navigate('/dashboard', { replace: true });
    }
  }, [note, noteId, navigate]);

  const saveScene = useRef(
    throttle((...args: unknown[]) => {
      const [elements, appState] = args;
      const id = noteIdRef.current;
      const update = updateNoteRef.current;
      if (!id || !update) return;
      update(id, {
        content: {
          elements: Array.isArray(elements) ? [...elements] : [],
          appState: appState && typeof appState === 'object' ? { ...(appState as object) } : {},
        },
      });
    }, 600)
  ).current;

  const handleChange = useCallback(
    (elements: unknown, appState: unknown) => {
      saveScene(
        Array.isArray(elements) ? elements : [],
        appState && typeof appState === 'object' ? appState : {}
      );
    },
    [saveScene]
  );

  const resolvedTheme =
    theme === 'dark' ||
    (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches)
      ? 'dark'
      : 'light';

  if (!note) return null;

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-2">
        <Breadcrumb note={note} />
        <NoteTitleInput note={note} />
      </div>
      <div className="relative flex-1 min-h-0">
        <Excalidraw
          initialData={initialData as React.ComponentProps<typeof Excalidraw>['initialData']}
          onChange={handleChange}
          theme={resolvedTheme}
        />
      </div>
    </div>
  );
}
