import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
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
import { Sparkles, Share2 } from 'lucide-react';
import { AskAIBlock } from '@/components/dashboard/editor/AskAIBlock';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useAutoSave } from '@/hooks/useAutoSave';
import Breadcrumb from '@/components/dashboard/Breadcrumb';
import NoteTitleInput from '@/components/dashboard/NoteTitleInput';
import NoteHeader from '@/components/dashboard/NoteHeader';
import NoteExportActions from '@/components/dashboard/NoteExportActions';
import CollaboratorAvatars from '@/components/dashboard/CollaboratorAvatars';
import ShareModal from '@/components/dashboard/ShareModal';
import { useAuthStore } from '@/store/authStore';
import { createCollaborationProvider, destroyCollaborationProvider } from '@/lib/collaboration';
import { useTheme } from '@/providers/ThemeProvider';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function isUuid(s: string) {
  return UUID_REGEX.test(s);
}

// 1. Setup custom schema
const schema = BlockNoteSchema.create({
  blockSpecs: {
    // Adds all default blocks.
    ...defaultBlockSpecs,
    // Adds the custom Ask AI block.
    askAi: AskAIBlock(),
  },
});

// 2. Insert AI block command
const insertAIBlock = (editor: typeof schema.BlockNoteEditor) => ({
  title: "Ask AI",
  onItemClick: () => {
    // Standard block insertion for BlockNote
    const currentBlock = editor.getTextCursorPosition().block;
    editor.insertBlocks(
      [
        {
          type: "askAi",
          props: { response: "I am thinking..." },
        },
      ],
      currentBlock,
      "after"
    );
  },
  aliases: ["ai", "ask"],
  group: "AI",
  icon: <Sparkles size={18} />,
  subtext: "Connect to your AI assistant.",
});

export default function NoteEditor() {
  const { noteId } = useParams<{ noteId: string }>();
  const navigate = useNavigate();
  const { notes, setActiveNote } = useWorkspaceStore();
  const { theme } = useTheme();
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const userName = user?.full_name || user?.email || 'Anonymous';
  const prevCollabRef = useRef<ReturnType<typeof createCollaborationProvider> | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  const note = useMemo(() => notes.find((n) => n.id === noteId), [notes, noteId]);

  const collabSession = useMemo(() => {
    if (prevCollabRef.current) {
      destroyCollaborationProvider(prevCollabRef.current);
      prevCollabRef.current = null;
    }
    const isOnline = note?.spaceType === 'online';
    const canCollab = isOnline && noteId && accessToken && isUuid(noteId);
    if (!canCollab) return null;
    const session = createCollaborationProvider(noteId!, accessToken, userName);
    prevCollabRef.current = session;
    return session;
  }, [note?.spaceType, noteId, accessToken, userName]);

  useEffect(() => {
    return () => {
      if (prevCollabRef.current) {
        destroyCollaborationProvider(prevCollabRef.current);
        prevCollabRef.current = null;
      }
    };
  }, []);

  const save = useAutoSave(noteId || '');

  const editor = useCreateBlockNote({
    schema,
    initialContent: collabSession ? undefined : (note?.content || undefined),
    collaboration: collabSession
      ? {
          provider: collabSession.provider,
          fragment: collabSession.doc.getXmlFragment('document-store'),
          user: collabSession.user,
          showCursorLabels: 'activity' as const,
        }
      : undefined,
  });

  useEffect(() => {
    if (noteId) setActiveNote(noteId);
  }, [noteId, setActiveNote]);

  useEffect(() => {
    if (!note && noteId) {
      navigate('/dashboard', { replace: true });
    }
  }, [note, noteId, navigate]);

  const resolvedTheme =
    theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
      ? 'dark'
      : 'light';

  if (!note) return null;

  return (
    <div className="flex h-full flex-col">
      {/* Breadcrumb and Actions */}
      <div className="flex items-center justify-between border-b border-border px-6 py-2">
        <div className="flex items-center gap-3">
          <Breadcrumb note={note} />
          {collabSession && (
            <CollaboratorAvatars provider={collabSession.provider} />
          )}
          {note.spaceType === 'online' && isUuid(note.id) && (
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
        </div>
        {editor && <NoteExportActions editor={editor} note={note} />}
      </div>
      {note.spaceType === 'online' && (
        <ShareModal
          pageId={note.id}
          pageTitle={note.title || 'Untitled'}
          open={shareOpen}
          onClose={() => setShareOpen(false)}
        />
      )}

      {/* Editor area */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl pb-8">
          {/* Header (Cover, Icon) */}
          <NoteHeader note={note} />

          {/* Title */}
          <div className="px-4 sm:px-8">
            <NoteTitleInput note={note} />
          </div>

          {/* BlockNote editor */}
          <div className="min-h-[60vh] mt-4 px-4 sm:px-8">
            <BlockNoteView
              editor={editor}
              slashMenu={false}
              onChange={() => {
                if (!collabSession) save({ content: editor.document });
              }}
              theme={resolvedTheme}
            >
              <SuggestionMenuController
                triggerCharacter={"/"}
                getItems={async (query) => {
                  const allItems = [insertAIBlock(editor), ...getDefaultReactSlashMenuItems(editor)];
                  return allItems.filter((item) =>
                    item.title.toLowerCase().includes(query.toLowerCase()) ||
                    (item.aliases && item.aliases.some(alias => alias.toLowerCase().includes(query.toLowerCase())))
                  );
                }}
              />
            </BlockNoteView>
          </div>
        </div>
      </div>
    </div>
  );
}
