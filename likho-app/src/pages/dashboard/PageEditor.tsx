import { useParams } from 'react-router';
import { useWorkspaceStore } from '@/store/workspaceStore';
import type { PageType } from '@/types/workspace';
import NoteEditor from './NoteEditor';
import CanvasEditor from './CanvasEditor';
import KanbanEditor from './KanbanEditor';

// Define which page types use which editor
const EDITOR_ROUTES: Record<string, 'note' | 'canvas' | 'kanban'> = {
  // Document-based templates use NoteEditor
  note: 'note',
  meeting: 'note',
  project: 'note',
  journal: 'note',
  documentation: 'note',
  // Visual templates
  canvas: 'canvas',
  brainstorm: 'canvas',
  // Planning templates
  kanban: 'kanban',
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Routes to appropriate editor based on page type. */
export default function PageEditor() {
  const { noteId } = useParams<{ noteId: string }>();
  const notes = useWorkspaceStore((s) => s.notes);
  const note = noteId ? notes.find((n) => n.id === noteId) : null;

  if (!note) {
    // The note isn't in the local Zustand store. If the ID is a UUID it could
    // be a shared/remote page — NoteEditor has a usePage() fallback that fetches
    // the page from the backend and handles access control.
    if (noteId && UUID_REGEX.test(noteId)) {
      return <NoteEditor />;
    }
    return null;
  }

  const editorType = EDITOR_ROUTES[note.pageType || 'note'] || 'note';

  switch (editorType) {
    case 'canvas':
      return <CanvasEditor />;
    case 'kanban':
      return <KanbanEditor />;
    case 'note':
    default:
      return <NoteEditor />;
  }
}
