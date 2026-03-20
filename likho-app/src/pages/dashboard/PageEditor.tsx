import { useParams } from 'react-router';
import { useWorkspaceStore } from '@/store/workspaceStore';
import type { PageType } from '@/types/workspace';
import NoteEditor from './NoteEditor';
import CanvasEditor from './CanvasEditor';
import KanbanEditor from './KanbanEditor';
import MeetingEditor from './MeetingEditor';
import ProjectEditor from './ProjectEditor';
import JournalEditor from './JournalEditor';
import BrainstormEditor from './BrainstormEditor';
import PdfEditor from './PdfEditor';

// Define which page types use which editor
const EDITOR_ROUTES: Record<string, 'note' | 'canvas' | 'kanban' | 'meeting' | 'project' | 'journal' | 'brainstorm' | 'pdf'> = {
  // Document-based templates use NoteEditor
  note: 'note',
  documentation: 'note',
  // Journal gets its own structured editor
  journal: 'journal',
  // Project gets its own structured editor
  project: 'project',
  // Meeting gets its own structured editor
  meeting: 'meeting',
  // Visual templates
  canvas: 'canvas',
  brainstorm: 'brainstorm',
  // Planning templates
  kanban: 'kanban',
  // PDF workspace
  pdf: 'pdf',
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
    case 'meeting':
      return <MeetingEditor />;
    case 'project':
      return <ProjectEditor />;
    case 'journal':
      return <JournalEditor />;
    case 'brainstorm':
      return <BrainstormEditor />;
    case 'pdf':
      return <PdfEditor />;
    case 'note':
    default:
      return <NoteEditor />;
  }
}
