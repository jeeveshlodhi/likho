import { useEffect, useRef, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import type { WebsocketProvider } from 'y-websocket';

// Helper function to safely parse note content for BlockNote
function getInitialContent(content: any): any[] | undefined {
  if (!content) return undefined;

  // If it's already an array, use it
  if (Array.isArray(content)) {
    return content.length > 0 ? content : undefined;
  }

  // If it's a string, try to parse it
  if (typeof content === 'string') {
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {
      return undefined;
    }
  }

  // If it's an object with a data property (template format), extract the blocks
  if (typeof content === 'object' && content !== null) {
    if (content.data && Array.isArray(content.data)) {
      return content.data;
    }
    if (content.content && Array.isArray(content.content)) {
      return content.content;
    }
    // Check for BlockNote document format
    if (content.type === 'doc' && Array.isArray(content.content)) {
      return content.content;
    }
  }

  return undefined;
}

import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/shadcn';
import {
  BlockNoteSchema,
  defaultBlockSpecs,
} from "@blocknote/core";
import {
  getDefaultReactSlashMenuItems,
  SuggestionMenuController,
} from "@blocknote/react";
import '@blocknote/shadcn/style.css';
import { Sparkles, Share2, Hash, Link2, MessageSquare, Eye } from 'lucide-react';
import { useAiChatStore } from '@/store/aiChatStore';
import { AskAIBlock } from '@/components/dashboard/editor/AskAIBlock';
import { WikilinkBlock } from '@/components/dashboard/editor/WikilinkBlock';
import { TagBlock } from '@/components/dashboard/editor/TagBlock';
import { LinkSuggestionMenu } from '@/components/dashboard/editor/LinkSuggestionMenu';
import { RightSidebar } from '@/components/ai';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useLinkStore } from '@/store/linkStore';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useCollaboration, usePageComments } from '@/hooks/useCollaboration';
import { useWorkspace, useSpaces, usePage } from '@/hooks/useWorkspace';
import Breadcrumb from '@/components/dashboard/Breadcrumb';
import NoteTitleInput from '@/components/dashboard/NoteTitleInput';
import NoteHeader from '@/components/dashboard/NoteHeader';
import NoteExportActions from '@/components/dashboard/NoteExportActions';
import CollaboratorAvatars from '@/components/dashboard/CollaboratorAvatars';
import ShareModal from '@/components/dashboard/ShareModal';
import { CommentThread } from '@/components/dashboard/CommentThread';
import { useTheme } from '@/providers/ThemeProvider';
import { buildWikilink } from '@/lib/linkParser';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function isUuid(s: string) {
  return UUID_REGEX.test(s);
}

// Setup custom schema with link blocks
const schema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    askAi: AskAIBlock(),
    wikilink: WikilinkBlock(),
    tag: TagBlock(),
  },
});

// Insert AI block command
const insertAIBlock = (editor: typeof schema.BlockNoteEditor) => ({
  title: "Ask AI",
  onItemClick: () => {
    const currentBlock = editor.getTextCursorPosition().block;
    editor.insertBlocks(
      [{ type: "askAi", props: { query: "", response: "", status: "idle" } }],
      currentBlock,
      "after"
    );
  },
  aliases: ["ai", "ask", "?"],
  group: "AI",
  icon: <Sparkles size={18} />,
  subtext: "Ask a question answered from your notes",
});

// Insert wikilink command
const insertWikilinkBlock = (editor: typeof schema.BlockNoteEditor) => ({
  title: "Insert Link",
  onItemClick: () => {
    const currentBlock = editor.getTextCursorPosition().block;
    editor.insertBlocks(
      [{
        type: "wikilink",
        props: {
          target: "New Link",
          displayText: "New Link",
          resolved: false,
        }
      }],
      currentBlock,
      "after"
    );
  },
  aliases: ["link", "wikilink", "[["],
  group: "Links",
  icon: <Link2 size={18} />,
  subtext: "Link to another note",
});

// Insert tag command
const insertTagBlock = (editor: typeof schema.BlockNoteEditor) => ({
  title: "Insert Tag",
  onItemClick: () => {
    const currentBlock = editor.getTextCursorPosition().block;
    editor.insertBlocks(
      [{
        type: "tag",
        props: {
          tagName: "new-tag",
          color: "#f59e0b",
        }
      }],
      currentBlock,
      "after"
    );
  },
  aliases: ["tag", "#"],
  group: "Links",
  icon: <Hash size={18} />,
  subtext: "Add a tag",
});

// ─────────────────────────────────────────────────────────────────────────────
// Inner component: owns the BlockNote editor instance.
// Receives provider as a prop so useCreateBlockNote gets the correct
// collaboration config on its very first call.
// Re-mounts (via key) when provider availability changes, ensuring BlockNote
// always sees the right config from mount time.
// ─────────────────────────────────────────────────────────────────────────────

interface NoteEditorBodyProps {
  note: any;
  noteId: string;
  provider: WebsocketProvider | null;
  isReadOnly: boolean;
  canComment: boolean;
  canCollab: boolean;
  canShare: boolean;
  users: any[];
  error: string | null;
  isConnected: boolean;
  comments: any[];
  shareOpen: boolean;
  setShareOpen: (v: boolean) => void;
  showComments: boolean;
  setShowComments: (v: boolean) => void;
  save: (updates: any) => void;
  notes: any[];
  folders: any[];
  scanNoteForLinks: (note: any, notes: any[], folders: any[]) => void;
}

function NoteEditorBody({
  note, noteId, provider, isReadOnly, canComment, canCollab, canShare,
  users, error, isConnected, comments, shareOpen, setShareOpen,
  showComments, setShowComments, save, notes, folders, scanNoteForLinks,
}: NoteEditorBodyProps) {
  const [showLinkSuggestions, setShowLinkSuggestions] = useState(false);
  const [linkQuery, setLinkQuery] = useState('');
  const [suggestionPosition, setSuggestionPosition] = useState({ top: 0, left: 0 });
  const { theme } = useTheme();
  const { setNoteContext } = useAiChatStore();

  const editor = useCreateBlockNote({
    schema,
    // When provider is available, Yjs owns the content — don't pre-populate.
    // When provider is null (local or pre-collab), use REST content as initial state.
    initialContent: provider ? undefined : getInitialContent(note?.content),
    collaboration: provider
      ? {
          provider,
          fragment: provider.doc.getXmlFragment('document-store'),
          user: {
            name: note?.user?.full_name || note?.user?.email || 'You',
            color: '#4ECDC4',
          },
          showCursorLabels: 'activity' as const,
        }
      : undefined,
  });

  // ── AI context: push note plain-text to aiChatStore so the floating panel
  //    has context about the currently open note. Clear on unmount.
  useEffect(() => {
    if (!note) return;
    const extractText = () => {
      if (!editor) return '';
      return editor.document
        .flatMap((b: any) => b.content ?? [])
        .filter((c: any) => c.type === 'text')
        .map((c: any) => c.text)
        .join(' ');
    };
    setNoteContext(extractText(), note.title || 'Untitled', note.id);
    return () => setNoteContext(null, null, null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note?.id, note?.title]);

  // ── AI insert: listen for ai:insert-content events dispatched from AiChat
  useEffect(() => {
    if (!editor || isReadOnly) return;
    const handler = (e: Event) => {
      const blocks = (e as CustomEvent).detail?.blocks;
      if (!Array.isArray(blocks) || blocks.length === 0) return;
      const currentBlock = editor.getTextCursorPosition().block;
      editor.insertBlocks(blocks, currentBlock, 'after');
    };
    window.addEventListener('ai:insert-content', handler);
    return () => window.removeEventListener('ai:insert-content', handler);
  }, [editor, isReadOnly]);

  // Link scanning timeout ref
  const linkScanTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle [[ shortcut for link suggestions
  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '[' && e.ctrlKey) {
        e.preventDefault();
        setShowLinkSuggestions(true);
        // Get cursor position
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          setSuggestionPosition({
            top: rect.bottom + window.scrollY + 5,
            left: rect.left + window.scrollX,
          });
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editor]);

  // Update editor content when note changes (only if not in collaboration mode).
  // In collab mode, Yjs drives the content — do not manually replace blocks.
  useEffect(() => {
    if (!editor || !note) return;
    if (provider) return;

    const content = getInitialContent(note.content);
    if (content) {
      editor.replaceBlocks(editor.document, content);
    } else {
      editor.replaceBlocks(editor.document, [{ type: 'paragraph' }]);
    }
  }, [note?.id, editor, provider]);

  // Bootstrap Y.Doc from REST content when the server has no Yjs state.
  // This covers: first-ever collab open, sessions after clearing corrupt DB state,
  // and the window between editor mount and Yjs state arrival.
  //
  // After provider syncs, if the XmlFragment is still empty (no state came from
  // the server or any peer), we write the REST content into the Y.Doc.
  // Because BlockNote is in collab mode, this write propagates to the server
  // and all connected peers, making it the canonical initial state.
  useEffect(() => {
    if (!provider || !editor) return;

    const handleSync = (isSynced: boolean) => {
      if (!isSynced) return;

      // The XmlFragment is BlockNote's Yjs backing store. If it has children,
      // Yjs already loaded real content — don't overwrite it.
      const fragment = provider.doc.getXmlFragment('document-store');
      if (fragment.length > 0) return;

      // Y.Doc is empty: seed from REST content.
      const restContent = getInitialContent(note?.content);
      if (!restContent || restContent.length === 0) return;

      editor.replaceBlocks(editor.document, restContent);
    };

    provider.on('sync', handleSync);
    return () => provider.off('sync', handleSync);
  // note is intentionally excluded: REST content is only a seed source.
  // After initial sync, Yjs is the source of truth — note changes don't override it.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, editor]);

  const handleLinkSelect = (suggestion: { id: string; title: string; type: 'note' | 'folder' }) => {
    if (!editor) return;

    const wikilink = buildWikilink(suggestion.title);
    editor.insertInlineContent([{
      type: "text",
      text: wikilink,
      styles: {},
    }]);

    setShowLinkSuggestions(false);
    setLinkQuery('');
  };

  const resolvedTheme =
    theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
      ? 'dark'
      : 'light';

  return (
    <div className="flex h-full flex-col">
      {/* Breadcrumb and Actions */}
      <div className="flex items-center justify-between border-b border-border px-6 py-2">
        <div className="flex items-center gap-3">
          <Breadcrumb note={note} />

          {/* Collaboration Status */}
          {provider && (
            <>
              <CollaboratorAvatars provider={provider} />

              {/* Read-only indicator for viewers */}
              {isReadOnly && (
                <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                  <Eye size={12} />
                  View only
                </div>
              )}

              {/* Connection error */}
              {error && (
                <span className="text-xs text-destructive">
                  Connection error
                </span>
              )}
            </>
          )}

          {/* Share button — only for owner/admin, not for collaborators */}
          {note.spaceType === 'online' && canShare && (
            <button
              type="button"
              onClick={() => setShareOpen(true)}
              className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
              title="Share"
            >
              <Share2 size={16} />
              Share
            </button>
          )}

          {/* Comments button — only shown for synced pages (UUID ID) */}
          {canCollab && canComment && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className={cn("gap-1.5", showComments && "bg-accent")}
            >
              <MessageSquare size={16} />
              {comments.length > 0 && <span>{comments.length}</span>}
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {editor && <NoteExportActions editor={editor} note={note} />}
        </div>
      </div>

      {note.spaceType === 'online' && canShare && (
        <ShareModal
          pageId={note.id}
          pageTitle={note.title || 'Untitled'}
          open={shareOpen}
          onClose={() => setShareOpen(false)}
        />
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Main Editor */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          <div className="flex-1 flex flex-col mx-auto w-full max-w-5xl">
            <NoteHeader note={note} />

            <div className="px-4 sm:px-8">
              <NoteTitleInput note={note} />
            </div>

            <div className="flex-1 min-h-0 mt-4 px-4 sm:px-8 pb-24 relative">
              {/* Read-only overlay for viewers */}
              {isReadOnly && (
                <div className="absolute inset-0 z-10 bg-background/50 pointer-events-none" />
              )}

              <BlockNoteView
                editor={editor}
                slashMenu={false}
                editable={!isReadOnly}
                onChange={() => {
                  // Always save via REST on change.
                  // For collaborative sessions, this provides belt-and-suspenders persistence
                  // in addition to Yjs real-time sync.
                  if (!isReadOnly) {
                    save({ content: editor.document });
                  }

                  // Debounced link scanning
                  if (linkScanTimeoutRef.current) {
                    clearTimeout(linkScanTimeoutRef.current);
                  }
                  linkScanTimeoutRef.current = setTimeout(() => {
                    if (note && editor) {
                      scanNoteForLinks({ ...note, content: editor.document }, notes, folders);
                    }
                  }, 1000);
                }}
                theme={resolvedTheme}
              >
                <SuggestionMenuController
                  triggerCharacter={"/"}
                  getItems={async (query) => {
                    const allItems = [
                      insertAIBlock(editor),
                      insertWikilinkBlock(editor),
                      insertTagBlock(editor),
                      ...getDefaultReactSlashMenuItems(editor),
                    ];
                    return allItems.filter((item) =>
                      item.title.toLowerCase().includes(query.toLowerCase()) ||
                      (item.aliases && item.aliases.some(alias => alias.toLowerCase().includes(query.toLowerCase())))
                    );
                  }}
                />
              </BlockNoteView>

              <LinkSuggestionMenu
                query={linkQuery}
                isOpen={showLinkSuggestions}
                onSelect={handleLinkSelect}
                onClose={() => {
                  setShowLinkSuggestions(false);
                  setLinkQuery('');
                }}
                position={suggestionPosition}
              />
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        {!showComments || !canCollab ? (
          <RightSidebar
            note={note}
            contentText={
              editor
                ? editor.document
                    .flatMap((b: any) => b.content ?? [])
                    .filter((c: any) => c.type === 'text')
                    .map((c: any) => c.text)
                    .join(' ')
                : ''
            }
            getSelectedText={() => {
              if (!editor) return '';
              return editor.document
                .flatMap((b: any) => b.content ?? [])
                .filter((c: any) => c.type === 'text')
                .map((c: any) => c.text)
                .join(' ');
            }}
            onApplyText={(text) => {
              if (!editor) return;
              const block = editor.getTextCursorPosition().block;
              editor.insertBlocks(
                [{ type: 'paragraph', content: [{ type: 'text', text, styles: {} }] }],
                block,
                'after'
              );
            }}
            onApplyTitle={(title) => save({ title })}
            defaultCollapsed={true}
          />
        ) : canCollab ? (
          <div className="w-80 border-l border-border bg-background overflow-y-auto">
            <CommentThread
              pageId={noteId}
              canComment={canComment}
              canResolve={!isReadOnly}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Outer component: manages collaboration state, computes the editor key,
// and renders NoteEditorBody with the right key so it re-mounts exactly once
// when the Yjs provider becomes available.
// ─────────────────────────────────────────────────────────────────────────────

export default function NoteEditor() {
  const { noteId } = useParams<{ noteId: string }>();
  const navigate = useNavigate();
  const { notes, folders, setActiveNote } = useWorkspaceStore();
  const { scanNoteForLinks } = useLinkStore();

  const localNote = notes.find((n) => n.id === noteId);

  // For shared pages that live in another user's workspace, fall back to a
  // server-side fetch. Only fires when the local store has no match and
  // the ID looks like a real UUID (shared pages always have UUIDs).
  const isUuidId = !!(noteId && isUuid(noteId));
  const { data: remotePage, isLoading: remoteLoading, isError: remoteError } = usePage(
    !localNote && isUuidId ? noteId : undefined
  );

  // Memoize the remote→local Note conversion so we don't produce a new object
  // on every render. A new object would make `note` always "change", causing
  // `canCollab` to appear to flip and the WebSocket to reconnect in a loop.
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remotePage?.id, remotePage?.updated_at]);

  const note = localNote ?? remoteNote;

  // `canCollab` is derived from the note ID being a UUID — we know this
  // immediately from the URL, before the note has finished loading.
  // This keeps `canCollab` stable from the very first render so the WebSocket
  // doesn't rapidly connect → disconnect → reconnect as the note loads.
  const isOnline = isUuidId || note?.spaceType === 'online';
  const canCollab = !!(isOnline && noteId && isUuid(noteId));

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
    enabled: canCollab,
  });

  // Only workspace owner or admin collaborators may share the page.
  // Non-collab (local) notes are owned by the user so sharing is always allowed.
  const canShare = !canCollab || role === 'owner' || role === 'admin';

  const { comments } = usePageComments(canCollab ? noteId : undefined);

  // Resolve the online space ID here (top-level component, safe to use React Query).
  const { data: workspace } = useWorkspace();
  const { data: spaces } = useSpaces(workspace?.id);
  const onlineSpaceId = spaces?.find((s) => s.type === 'online')?.id;

  const save = useAutoSave(noteId || '', onlineSpaceId);

  const [shareOpen, setShareOpen] = useState(false);
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    if (noteId) setActiveNote(noteId);
  }, [noteId, setActiveNote]);

  useEffect(() => {
    if (!noteId) return;

    if (!isUuidId) {
      // Nanoid note: if it's not in the local store, it doesn't exist anywhere
      if (!localNote) {
        navigate('/dashboard', { replace: true });
      }
    } else {
      // UUID note: if it's not in local store, we rely on the backend fetch.
      // If the backend returns an error (e.g. 404 Not Found or 403 Forbidden), redirect.
      if (!localNote && remoteError) {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [localNote, remoteError, noteId, isUuidId, navigate]);

  // Show a spinner while the remote page is being fetched (shared/remote notes).
  // Without this the user sees a completely blank panel during loading.
  if (!note) {
    if (remoteLoading) {
      return (
        <div className="flex h-full items-center justify-center text-muted-foreground">
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        </div>
      );
    }
    return null;
  }

  // The key controls when NoteEditorBody re-mounts:
  // - Local notes: stable 'local-{id}' key — never re-mounts
  // - Online notes before provider: 'static-{id}' — renders with local content + REST saves
  // - Online notes after provider: 'collab-{id}' — re-mounts with Yjs collaboration
  // This one-time re-mount ensures useCreateBlockNote gets the correct
  // collaboration config on its first call in the collab phase.
  const editorKey = canCollab
    ? (provider ? `collab-${noteId}` : `static-${noteId}`)
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
      notes={notes}
      folders={folders}
      scanNoteForLinks={scanNoteForLinks}
    />
  );
}
