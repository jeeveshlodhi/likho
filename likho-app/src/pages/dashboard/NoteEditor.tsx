import { useEffect, useMemo } from 'react';
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
import { Sparkles } from 'lucide-react';
import { AskAIBlock } from '@/components/dashboard/editor/AskAIBlock';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useAutoSave } from '@/hooks/useAutoSave';
import Breadcrumb from '@/components/dashboard/Breadcrumb';
import NoteTitleInput from '@/components/dashboard/NoteTitleInput';
import NoteHeader from '@/components/dashboard/NoteHeader';
import NoteExportActions from '@/components/dashboard/NoteExportActions';

import { useTheme } from '@/providers/ThemeProvider';

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

  const note = useMemo(() => notes.find((n) => n.id === noteId), [notes, noteId]);

  const save = useAutoSave(noteId || '');

  const editor = useCreateBlockNote({
    schema,
    initialContent: note?.content || undefined,
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
      <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-2 dark:border-neutral-800">
        <Breadcrumb note={note} />
        {editor && <NoteExportActions editor={editor} note={note} />}
      </div>

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
                save({ content: editor.document });
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
