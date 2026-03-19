import { useState } from 'react';
import { useNavigate } from 'react-router';
import { FileText, Plus } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useAuthStore } from '@/store/authStore';
import { useWorkspace, useSpaces, useCreatePage } from '@/hooks/useWorkspace';
import type { PageType, SpaceType } from '@/types/workspace';
import NewPageModal from '@/components/dashboard/NewPageModal';
import {
  getTemplateById,
  getTemplateContent,
} from '@/lib/templateRegistry';

export default function DashboardHome() {
  const navigate = useNavigate();
  const { createNote, createCanvas, addNote, setActiveNote } = useWorkspaceStore();
  const { isGuest } = useAuthStore();
  const { data: workspace } = useWorkspace();
  const { data: spaces } = useSpaces(workspace?.id);
  const createPageMutation = useCreatePage();

  const [newPageModalOpen, setNewPageModalOpen] = useState(false);

  const handleNewPageSelect = async (spaceType: SpaceType, templateId: PageType) => {
    // Calendar is a workspace-level view, not a per-note document
    if (templateId === 'calendar') {
      navigate('/dashboard/calendar');
      return;
    }

    const template = getTemplateById(templateId);
    const templateContent = getTemplateContent(templateId);
    const defaultTitle = template?.defaultTitle || 'Untitled';

    // For online space, create on backend first (all page types)
    if (spaceType === 'online' && workspace?.id && spaces?.length && createPageMutation.mutateAsync) {
      const onlineSpace = spaces.find((s) => s.type === 'online');
      if (onlineSpace) {
        try {
          const page = await createPageMutation.mutateAsync({
            space_id: onlineSpace.id,
            title: defaultTitle,
            page_type: templateId,
            content: templateContent.data,
          });
          const note = {
            id: page.id,
            title: page.title || defaultTitle,
            content: page.content ?? templateContent.data,
            folderId: page.parent_id,
            spaceType: 'online' as const,
            pageType: (page.page_type as PageType) || templateId,
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
          // Fallback to local-only
        }
      }
    }

    // Offline / fallback: create locally using template registry
    const content = getTemplateContent(templateId);

    // Handle different content types
    if (content.type === 'canvas') {
      const note = createCanvas(null, spaceType);
      // Update with proper canvas content if needed
      if (content.data.elements?.length > 0) {
        note.content = content.data;
      }
      setActiveNote(note.id);
      navigate(`/dashboard/note/${note.id}`);
      return;
    }

    // For all other types (note, kanban, meeting, etc.)
    const note = createNote(null, spaceType, templateId, content.data);
    setActiveNote(note.id);
    navigate(`/dashboard/note/${note.id}`);
  };

  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted"
        >
          <FileText size={32} className="text-muted-foreground" />
        </div>
        <h2 className="mb-2 text-2xl font-bold">Welcome to your workspace</h2>
        <p className="mb-6 text-muted-foreground">
          {isGuest
            ? 'Start creating notes. Sign in to sync across devices.'
            : 'Create your first page to get started.'}
        </p>
        <button
          onClick={() => setNewPageModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus size={18} />
          Create your first page
        </button>

        <NewPageModal
          open={newPageModalOpen}
          onClose={() => setNewPageModalOpen(false)}
          context={{ folderId: null }}
          onSelect={handleNewPageSelect}
        />
      </div>
    </div>
  );
}
