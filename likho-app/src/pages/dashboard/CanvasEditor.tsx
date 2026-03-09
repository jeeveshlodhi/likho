import { useRef, useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useWorkspaceStore } from '@/store/workspaceStore';
import Breadcrumb from '@/components/dashboard/Breadcrumb';
import NoteTitleInput from '@/components/dashboard/NoteTitleInput';
import { useTheme } from '@/providers/ThemeProvider';
import CustomCanvas from '@/components/canvas/CustomCanvas';
import { CanvasScene } from '@/types/canvas';

function throttle(fn: (...args: any[]) => void, delay: number): (...args: any[]) => void {
  let last = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: any[]) => {
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

  // Initial scene data from persistence
  const [initialData, setInitialData] = useState<CanvasScene | null>(null);
  const lastNoteIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!noteId || !note) return;
    if (lastNoteIdRef.current === noteId) return;
    lastNoteIdRef.current = noteId;

    const raw = note.content;
    if (!raw || typeof raw !== 'object' || (!raw.elements && !raw.camera)) {
      setInitialData({
        elements: [],
        camera: { x: 0, y: 0, zoom: 1 }
      });
      return;
    }

    setInitialData({
      elements: Array.isArray(raw.elements) ? raw.elements : [],
      camera: raw.camera || { x: 0, y: 0, zoom: 1 },
    });
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
    throttle((scene: CanvasScene) => {
      const id = noteIdRef.current;
      const update = updateNoteRef.current;
      if (!id || !update) return;
      update(id, {
        content: scene,
      });
    }, 600)
  ).current;

  const handleChange = useCallback(
    (scene: CanvasScene) => {
      saveScene(scene);
    },
    [saveScene]
  );

  const resolvedTheme =
    theme === 'dark' ||
      (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches)
      ? 'dark'
      : 'light';

  if (!note) return null;
  // Wait until we parsed initialData so we don't start empty by accident
  if (!initialData && lastNoteIdRef.current !== noteId) return null;

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Top Bar matching NoteEditor */}
      <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-2">
        <div className="flex items-center gap-3">
          <Breadcrumb note={note} />
        </div>
      </div>

      <div className="relative flex-1 min-h-0 flex flex-col">
        {/* Title overlay or sticky header inside the canvas space */}
        <div className="absolute top-4 left-6 z-10 w-64 bg-background/80 backdrop-blur-sm rounded-md shadow-sm border border-border p-1">
          <NoteTitleInput note={note} />
        </div>

        {initialData && (
          <CustomCanvas
            initialData={initialData}
            onChange={handleChange}
            theme={resolvedTheme}
          />
        )}
      </div>
    </div>
  );
}
