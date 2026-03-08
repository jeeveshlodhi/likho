import { useState } from 'react';
import { useNavigate } from 'react-router';
import { FileText, Plus } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useWorkspace, useSpaces, useCreatePage } from '@/hooks/useWorkspace';
import type { PageType, SpaceType } from '@/types/workspace';
import NewPageModal from '@/components/dashboard/NewPageModal';

export default function DashboardHome() {
  const navigate = useNavigate();
  const { createNote, createCanvas, addNote, setActiveNote } = useWorkspaceStore();
  const { data: workspace } = useWorkspace();
  const { data: spaces } = useSpaces(workspace?.id);
  const createPageMutation = useCreatePage();
  const [newPageModalOpen, setNewPageModalOpen] = useState(false);

  const handleNewPageSelect = async (spaceType: SpaceType, templateId: PageType) => {
    if (templateId === 'canvas') {
      const note = createCanvas(null, spaceType);
      setActiveNote(note.id);
      navigate(`/dashboard/note/${note.id}`);
      return;
    }
    if (spaceType === 'online' && workspace?.id && spaces?.length && createPageMutation.mutateAsync) {
      const onlineSpace = spaces.find((s) => s.type === 'online');
      if (onlineSpace) {
        try {
          const page = await createPageMutation.mutateAsync({
            space_id: onlineSpace.id,
            title: '',
          });
          const note = {
            id: page.id,
            title: page.title || '',
            content: page.content ?? undefined,
            folderId: page.parent_id,
            spaceType: 'online' as const,
            icon: page.icon ?? null,
            coverImage: page.cover_url ?? undefined,
            sortOrder: page.sort_order ?? 0,
            createdAt: page.created_at,
            updatedAt: page.updated_at,
          };
          addNote(note);
          setActiveNote(note.id);
          navigate(`/dashboard/note/${note.id}`);
          return;
        } catch {
          const note = createNote(null, 'online');
          setActiveNote(note.id);
          navigate(`/dashboard/note/${note.id}`);
          return;
        }
      }
    }
    const note = createNote(null, spaceType);
    setActiveNote(note.id);
    navigate(`/dashboard/note/${note.id}`);
  };

  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <FileText size={32} className="text-muted-foreground" />
        </div>
        <h2 className="mb-2 text-xl font-semibold text-foreground">
          Welcome to Likho
        </h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Select a page from the sidebar or create a new one to get started.
        </p>
        <button
          onClick={() => setNewPageModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
        >
          <Plus size={16} />
          New page
        </button>
      </div>

      <NewPageModal
        open={newPageModalOpen}
        onClose={() => setNewPageModalOpen(false)}
        context={{ folderId: null }}
        onSelect={handleNewPageSelect}
      />
    </div>
  );
}
