import { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/shadcn';
import '@blocknote/shadcn/style.css';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useAutoSave } from '@/hooks/useAutoSave';
import Breadcrumb from '@/components/dashboard/Breadcrumb';

export default function NoteEditor() {
  const { noteId } = useParams<{ noteId: string }>();
  const navigate = useNavigate();
  const { notes, setActiveNote } = useWorkspaceStore();

  const note = useMemo(() => notes.find((n) => n.id === noteId), [notes, noteId]);

  const save = useAutoSave(noteId || '');

  const editor = useCreateBlockNote({
    initialContent: note?.content || undefined,
  });

  useEffect(() => {
    if (noteId) setActiveNote(noteId);
  }, [noteId, setActiveNote]);

  useEffect(() => {
    if (!note && noteId) {
      navigate('/dashboard', { replace: true });
    }
  }, [note, noteId, navigate]);

  if (!note) return null;

  return (
    <div className="flex h-full flex-col">
      {/* Breadcrumb */}
      <div className="border-b border-neutral-100 px-6 py-2 dark:border-neutral-800">
        <Breadcrumb note={note} />
      </div>

      {/* Editor area */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-6 py-8">
          {/* Title */}
          <input
            type="text"
            value={note.title}
            onChange={(e) => save({ title: e.target.value })}
            placeholder="Untitled"
            className="mb-4 w-full bg-transparent text-4xl font-bold text-neutral-900 outline-none placeholder:text-neutral-300 dark:text-neutral-100 dark:placeholder:text-neutral-600"
          />

          {/* BlockNote editor */}
          <div className="min-h-[60vh]">
            <BlockNoteView
              editor={editor}
              onChange={() => {
                save({ content: editor.document });
              }}
              theme="dark"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
