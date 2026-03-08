import { useNavigate } from 'react-router';
import { FileText, Plus } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';

export default function DashboardHome() {
  const navigate = useNavigate();
  const { createNote, setActiveNote } = useWorkspaceStore();

  const handleNewNote = (spaceType: 'online' | 'offline') => {
    const note = createNote(null, spaceType);
    setActiveNote(note.id);
    navigate(`/dashboard/note/${note.id}`);
  };

  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100 dark:bg-neutral-800">
          <FileText size={32} className="text-neutral-400" />
        </div>
        <h2 className="mb-2 text-xl font-semibold text-neutral-800 dark:text-neutral-200">
          Welcome to Likho
        </h2>
        <p className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
          Select a note from the sidebar or create a new one to get started.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => handleNewNote('online')}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <Plus size={16} />
            Online Note
          </button>
          <button
            onClick={() => handleNewNote('offline')}
            className="flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
          >
            <Plus size={16} />
            Offline Note
          </button>
        </div>
      </div>
    </div>
  );
}
