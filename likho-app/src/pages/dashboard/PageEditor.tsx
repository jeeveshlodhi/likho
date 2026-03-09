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

/** Routes to appropriate editor based on page type. */
export default function PageEditor() {
  const { noteId } = useParams<{ noteId: string }>();
  const notes = useWorkspaceStore((s) => s.notes);
  const note = noteId ? notes.find((n) => n.id === noteId) : null;

  if (!note) {
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
