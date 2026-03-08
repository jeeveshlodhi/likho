import { useRef, useEffect, useState, type ComponentProps } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Tldraw, getSnapshot, type TLEditorSnapshot } from 'tldraw';
import 'tldraw/tldraw.css';
import { useWorkspaceStore } from '@/store/workspaceStore';
import Breadcrumb from '@/components/dashboard/Breadcrumb';
import NoteTitleInput from '@/components/dashboard/NoteTitleInput';

function throttle<T extends (...args: unknown[]) => void>(fn: T, delay: number): T {
  let last = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  return ((...args: Parameters<T>) => {
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
  }) as T;
}

export default function CanvasEditor() {
  const { noteId } = useParams<{ noteId: string }>();
  const navigate = useNavigate();
  const notes = useWorkspaceStore((s) => s.notes);
  const setActiveNote = useWorkspaceStore((s) => s.setActiveNote);
  const updateNote = useWorkspaceStore((s) => s.updateNote);
  const cleanupRef = useRef<(() => void) | null>(null);
  const noteIdRef = useRef(noteId ?? null);
  const updateNoteRef = useRef(updateNote);
  noteIdRef.current = noteId ?? null;
  updateNoteRef.current = updateNote;

  const note = notes.find((n) => n.id === noteId);

  // Snapshot only when opening this note — never update from store after our own saves (would reload canvas).
  const [snapshotForEditor, setSnapshotForEditor] = useState<TLEditorSnapshot | undefined>(undefined);
  const lastNoteIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!noteId || !note) return;
    if (lastNoteIdRef.current === noteId) return;
    lastNoteIdRef.current = noteId;
    const raw = note.content;
    if (!raw || typeof raw !== 'object' || (!('document' in raw) && !('session' in raw))) {
      setSnapshotForEditor(undefined);
    } else {
      setSnapshotForEditor(raw as TLEditorSnapshot);
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

  useEffect(() => {
    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, []);

  const handleMount = useRef((editor: Parameters<NonNullable<ComponentProps<typeof Tldraw>['onMount']>>[0]) => {
    cleanupRef.current?.();
    const save = throttle(() => {
      const id = noteIdRef.current;
      const update = updateNoteRef.current;
      if (!id || !update) return;
      const { document: doc, session } = getSnapshot(editor.store);
      update(id, { content: { document: doc, session } });
    }, 600);
    cleanupRef.current = editor.store.listen(save, { source: 'user', scope: 'document' });
  }).current;

  if (!note) return null;

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-2">
        <Breadcrumb note={note} />
        <NoteTitleInput note={note} />
      </div>
      <div className="relative flex-1 min-h-0">
        <Tldraw
          snapshot={snapshotForEditor}
          onMount={handleMount}
          className="absolute inset-0"
        />
      </div>
    </div>
  );
}
