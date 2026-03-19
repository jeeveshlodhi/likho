import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useLinkStore } from '@/store/linkStore';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useCollaboration, usePageRole, usePageComments } from '@/hooks/useCollaboration';
import { useWorkspace, useSpaces, usePage } from '@/hooks/useWorkspace';
import { usePagePermissions, usePageShareLinks } from '@/hooks/useSharing';
import { NoteEditorBody } from './NoteEditorBody';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(s: string) {
  return UUID_REGEX.test(s);
}

/**
 * Outer NoteEditor: resolves note (local or remote), collaboration state,
 * and renders NoteEditorBody with the correct key so it re-mounts when
 * the Yjs provider becomes available.
 */
export default function NoteEditor() {
  const { noteId } = useParams<{ noteId: string }>();
  const navigate = useNavigate();
  const { notes, folders, setActiveNote } = useWorkspaceStore();
  const { scanNoteForLinks } = useLinkStore();

  const localNote = notes.find((n) => n.id === noteId);
  const isUuidId = !!(noteId && isUuid(noteId));
  const { data: remotePage, isLoading: remoteLoading, isError: remoteError } =
    usePage(!localNote && isUuidId ? noteId : undefined);

  const remoteNote = useMemo(() => {
    if (!remotePage) return undefined;
    return {
      id: String(remotePage.id),
      title: remotePage.title || '',
      content: remotePage.content,
      folderId: remotePage.parent_id ? String(remotePage.parent_id) : null,
      spaceType: 'online' as const,
      pageType: (remotePage.page_type as any) ?? 'note',
      icon: remotePage.icon ?? null,
      coverImage: remotePage.cover_url ?? undefined,
      sortOrder: remotePage.sort_order ?? 0,
      createdAt: remotePage.created_at,
      updatedAt: remotePage.updated_at,
    };
  }, [remotePage?.id, remotePage?.updated_at]);

  const note = localNote ?? remoteNote;
  const isOnline = isUuidId || note?.spaceType === 'online';
  const canCollab = !!(isOnline && noteId && isUuid(noteId));

  const { data: permissions } = usePagePermissions(canCollab ? noteId : undefined);
  const { data: shareLinks } = usePageShareLinks(canCollab ? noteId : undefined);
  const hasCollaborators =
    (permissions?.length ?? 0) > 0 || (shareLinks?.length ?? 0) > 0;
  const collabEnabled = canCollab && hasCollaborators;

  const {
    provider,
    isConnected,
    isReadOnly,
    canComment,
    users,
    error,
    role,
  } = useCollaboration({
    pageId: noteId || '',
    enabled: collabEnabled,
  });

  const { data: pageRole } = usePageRole(canCollab ? noteId : undefined);
  const canShare = !canCollab || pageRole === 'owner' || pageRole === 'admin';

  const { comments } = usePageComments(canCollab ? noteId : undefined);

  const { data: workspace } = useWorkspace();
  const { data: spaces } = useSpaces(workspace?.id);
  const onlineSpaceId = spaces?.find((s) => s.type === 'online')?.id;

  const { save, saveStatus } = useAutoSave(noteId || '', onlineSpaceId);

  const [shareOpen, setShareOpen] = useState(false);
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    if (noteId) setActiveNote(noteId);
  }, [noteId, setActiveNote]);

  useEffect(() => {
    if (!noteId) return;
    if (!isUuidId) {
      if (!localNote) {
        navigate('/dashboard', { replace: true });
      }
    } else {
      if (!localNote && remoteError) {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [localNote, remoteError, noteId, isUuidId, navigate]);

  if (!note) {
    if (remoteLoading) {
      return (
        <div className="flex h-full items-center justify-center text-muted-foreground">
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
        </div>
      );
    }
    return null;
  }

  const editorKey = canCollab
    ? provider
      ? `collab-${noteId}`
      : `static-${noteId}`
    : `local-${noteId}`;

  return (
    <NoteEditorBody
      key={editorKey}
      note={note}
      noteId={noteId!}
      provider={provider ?? null}
      isReadOnly={isReadOnly}
      canComment={canComment}
      canCollab={canCollab}
      canShare={canShare}
      users={users}
      error={error ?? null}
      isConnected={isConnected}
      comments={comments ?? []}
      shareOpen={shareOpen}
      setShareOpen={setShareOpen}
      showComments={showComments}
      setShowComments={setShowComments}
      save={save}
      saveStatus={saveStatus}
      notes={notes}
      folders={folders}
      scanNoteForLinks={scanNoteForLinks}
    />
  );
}
