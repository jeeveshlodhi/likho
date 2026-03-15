import { useMemo, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ChevronRight,
  Folder,
  FileText,
  Cloud,
  HardDrive,
  Plus,
  Search,
} from 'lucide-react';
import type { PageType, SpaceType, Note } from '@/types/workspace';
import { useWorkspaceStore } from '@/store/workspaceStore';
import {
  getFolderBreadcrumb,
  getNotesInFolder,
  getChildFolders,
} from '@/utils/folderTree';
import NewPageModal from '@/components/dashboard/NewPageModal';
import {
  getTemplateContent,
  getTemplateById,
} from '@/lib/templateRegistry';
import { useWorkspace, useSpaces, useCreatePage } from '@/hooks/useWorkspace';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function FolderIndex() {
  const { folderId } = useParams<{ folderId: string }>();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [newPageModalOpen, setNewPageModalOpen] = useState(false);
  const folders = useWorkspaceStore((s) => s.folders);
  const notes = useWorkspaceStore((s) => s.notes);
  const setActiveNote = useWorkspaceStore((s) => s.setActiveNote);
  const setActiveFolder = useWorkspaceStore((s) => s.setActiveFolder);
  const createNote = useWorkspaceStore((s) => s.createNote);
  const createCanvas = useWorkspaceStore((s) => s.createCanvas);
  const addNote = useWorkspaceStore((s) => s.addNote);

  const { data: workspace } = useWorkspace();
  const { data: spaces } = useSpaces(workspace?.id);
  const createPageMutation = useCreatePage();

  const folder = useMemo(
    () => (folderId ? folders.find((f) => f.id === folderId) : null),
    [folders, folderId]
  );

  const breadcrumb = useMemo(
    () => (folderId ? getFolderBreadcrumb(folders, folderId) : []),
    [folders, folderId]
  );

  const folderNotes = useMemo(
    () => (folderId ? getNotesInFolder(notes, folderId) : []),
    [notes, folderId]
  );

  const childFolders = useMemo(
    () => (folderId ? getChildFolders(folders, folderId) : []),
    [folders, folderId]
  );

  const searchLower = search.trim().toLowerCase();
  const filteredNotes = useMemo(
    () =>
      searchLower
        ? folderNotes.filter((n) =>
            (n.title || 'Untitled').toLowerCase().includes(searchLower)
          )
        : folderNotes,
    [folderNotes, searchLower]
  );

  const handleNoteClick = useCallback(
    (noteId: string) => {
      setActiveFolder(null);
      setActiveNote(noteId);
      navigate(`/dashboard/note/${noteId}`);
    },
    [setActiveFolder, setActiveNote, navigate]
  );

  const handleNewPageSelect = useCallback(
    async (_spaceType: SpaceType, templateId: PageType) => {
      if (!folder) return;
      setActiveFolder(null);

      const template = getTemplateById(templateId);
      const content = getTemplateContent(templateId);
      const defaultTitle = template?.defaultTitle || 'Untitled';

      // Online space + folder has server UUID → create on backend with parent_id so note saves in folder
      const folderIsServerUuid = UUID_REGEX.test(folder.id);
      if (
        folder.spaceType === 'online' &&
        folderIsServerUuid &&
        workspace?.id &&
        spaces?.length &&
        createPageMutation.mutateAsync
      ) {
        const onlineSpace = spaces.find((s) => s.type === 'online');
        if (onlineSpace) {
          try {
            const page = await createPageMutation.mutateAsync({
              space_id: onlineSpace.id,
              parent_id: folder.id,
              title: defaultTitle,
              page_type: templateId,
              content: content.data,
            });
            const note = {
              id: page.id,
              title: page.title || defaultTitle,
              content: page.content ?? content.data,
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
            // Fallback to local create below
          }
        }
      }

      // Offline or fallback: create locally
      let note;
      if (content.type === 'canvas') {
        note = createCanvas(folder.id, folder.spaceType);
        if (content.data.elements?.length > 0) {
          note.content = content.data;
        }
      } else {
        note = createNote(folder.id, folder.spaceType, templateId, content.data);
      }

      setActiveNote(note.id);
      navigate(`/dashboard/note/${note.id}`);
    },
    [
      folder,
      workspace?.id,
      spaces,
      createPageMutation,
      createNote,
      createCanvas,
      addNote,
      setActiveFolder,
      setActiveNote,
      navigate,
    ]
  );

  const goToFolderIndex = useCallback(
    (id: string) => {
      setActiveFolder(id);
      navigate(`/dashboard/folder/${id}`);
    },
    [setActiveFolder, navigate]
  );

  // Helper to get icon for a note
  const getNoteIcon = useCallback((note: Note) => {
    if (note.icon) return note.icon;
    const template = note.pageType ? getTemplateById(note.pageType) : null;
    if (template) {
      const Icon = template.icon;
      return <Icon size={16} className="text-muted-foreground" />;
    }
    return <FileText size={16} className="text-muted-foreground" />;
  }, []);

  if (!folderId || !folder) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="text-sm text-muted-foreground">
          Folder not found. It may have been moved or deleted.
        </p>
      </div>
    );
  }

  const SpaceIcon = folder.spaceType === 'online' ? Cloud : HardDrive;
  const spaceLabel =
    folder.spaceType === 'online' ? 'Online Space' : 'Offline Space';

  return (
    <div className="flex h-full flex-col overflow-auto">
      <div className="border-b border-border bg-muted/30 px-6 py-4">
        {/* Breadcrumb — all segments clickable */}
        <div className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="hover:text-foreground"
          >
            Home
          </button>
          <ChevronRight size={14} className="flex-shrink-0" />
          <SpaceIcon size={14} className="flex-shrink-0" />
          <span>{spaceLabel}</span>
          {breadcrumb.map((f) => (
            <div key={f.id} className="flex items-center gap-1">
              <ChevronRight size={14} className="flex-shrink-0" />
              <button
                type="button"
                onClick={() => goToFolderIndex(f.id)}
                className="hover:text-foreground"
              >
                {f.name}
              </button>
            </div>
          ))}
        </div>
        {/* Folder title and actions */}
        <div className="mt-2 flex items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-semibold text-foreground">
              <Folder size={20} className="text-muted-foreground" />
              {folder.name}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Index — {folderNotes.length} note
              {folderNotes.length !== 1 ? 's' : ''}
              {childFolders.length > 0 &&
                ` · ${childFolders.length} subfolder${childFolders.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setNewPageModalOpen(true)}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-input bg-background px-3 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent"
          >
            <Plus size={16} />
            New page
          </button>
        </div>
      </div>

      {/* Search and content */}
      <div className="flex-1 px-6 py-4">
        {(folderNotes.length > 0 || childFolders.length > 0) && (
          <div className="mb-4">
            <label htmlFor="index-search" className="sr-only">
              Search notes in this folder
            </label>
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                id="index-search"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search in this folder…"
                className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none ring-ring focus:ring-2"
              />
            </div>
          </div>
        )}

        {/* Subfolders */}
        {childFolders.length > 0 && (
          <section className="mb-6">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Subfolders
            </h2>
            <ul className="space-y-0">
              {childFolders.map((sub) => (
                <li key={sub.id}>
                  <button
                    type="button"
                    onClick={() => goToFolderIndex(sub.id)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent"
                  >
                    <Folder
                      size={16}
                      className="flex-shrink-0 text-muted-foreground"
                    />
                    <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                      {sub.name}
                    </span>
                    <ChevronRight
                      size={14}
                      className="flex-shrink-0 text-muted-foreground"
                    />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Notes */}
        <section>
          {childFolders.length > 0 && (
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Notes
            </h2>
          )}
          {folderNotes.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
              <p className="text-sm text-muted-foreground">
                No notes in this folder yet.
              </p>
              <button
                type="button"
                onClick={() => setNewPageModalOpen(true)}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                <Plus size={16} />
                New page
              </button>
            </div>
          ) : filteredNotes.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">
              No notes match "{search}".
            </p>
          ) : (
            <ul className="space-y-0">
              {filteredNotes.map((note, i) => (
                <li key={note.id}>
                  <button
                    type="button"
                    onClick={() => handleNoteClick(note.id)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent"
                  >
                    <span className="flex w-6 shrink-0 justify-end text-xs text-muted-foreground">
                      {i + 1}
                    </span>
                    <span className="flex-shrink-0 text-muted-foreground">
                      {getNoteIcon(note)}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                      {note.title || 'Untitled'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {folder && (
        <NewPageModal
          open={newPageModalOpen}
          onClose={() => setNewPageModalOpen(false)}
          context={{ folderId: folder.id, spaceType: folder.spaceType }}
          onSelect={handleNewPageSelect}
        />
      )}
    </div>
  );
}
