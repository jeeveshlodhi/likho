import { useParams } from 'react-router';
import { useWorkspaceStore } from '@/store/workspaceStore';
import NoteEditor from './NoteEditor';
import CanvasEditor from './CanvasEditor';

/** Routes to NoteEditor or CanvasEditor based on page type. */
export default function PageEditor() {
  const { noteId } = useParams<{ noteId: string }>();
  const notes = useWorkspaceStore((s) => s.notes);
  const note = noteId ? notes.find((n) => n.id === noteId) : null;

  if (!note) {
    return null;
  }

  if (note.pageType === 'canvas') {
    return <CanvasEditor />;
  }

  return <NoteEditor />;
}
