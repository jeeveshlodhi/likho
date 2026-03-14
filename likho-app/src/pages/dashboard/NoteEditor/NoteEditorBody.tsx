import { useEffect, useRef, useState } from 'react';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/shadcn';
import { getDefaultReactSlashMenuItems, SuggestionMenuController } from '@blocknote/react';
import '@blocknote/shadcn/style.css';
import { Share2, MessageSquare, Eye } from 'lucide-react';
import { useAiChatStore } from '@/store/aiChatStore';
import { LinkSuggestionMenu } from '@/components/dashboard/editor/LinkSuggestionMenu';
import { RightSidebar } from '@/components/ai';
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
import type { NoteEditorBodyProps } from './types';
import {
  getInitialContent,
  noteEditorSchema,
  insertAIBlock,
  insertWikilinkBlock,
  insertTagBlock,
} from './editorSchema';

export function NoteEditorBody({
  note,
  noteId,
  provider,
  isReadOnly,
  canComment,
  canCollab,
  canShare,
  error,
  comments,
  shareOpen,
  setShareOpen,
  showComments,
  setShowComments,
  save,
  notes,
  folders,
  scanNoteForLinks,
}: NoteEditorBodyProps) {
  const [showLinkSuggestions, setShowLinkSuggestions] = useState(false);
  const [linkQuery, setLinkQuery] = useState('');
  const [suggestionPosition, setSuggestionPosition] = useState({ top: 0, left: 0 });
  const { theme } = useTheme();
  const { setNoteContext } = useAiChatStore();

  const editor = useCreateBlockNote({
    schema: noteEditorSchema,
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
  }, [note?.id, note?.title]);

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

  const linkScanTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!editor) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '[' && e.ctrlKey) {
        e.preventDefault();
        setShowLinkSuggestions(true);
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

  useEffect(() => {
    if (!provider || !editor) return;
    const handleSync = (isSynced: boolean) => {
      if (!isSynced) return;
      const fragment = provider.doc.getXmlFragment('document-store');
      if (fragment.length > 0) return;
      const restContent = getInitialContent(note?.content);
      if (!restContent || restContent.length === 0) return;
      editor.replaceBlocks(editor.document, restContent);
    };
    provider.on('sync', handleSync);
    return () => provider.off('sync', handleSync);
  }, [provider, editor]);

  const handleLinkSelect = (suggestion: { id: string; title: string; type: 'note' | 'folder' }) => {
    if (!editor) return;
    const wikilink = buildWikilink(suggestion.title);
    editor.insertInlineContent([
      { type: 'text', text: wikilink, styles: {} },
    ]);
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
      <div className="flex items-center justify-between border-b border-border px-6 py-2">
        <div className="flex items-center gap-3">
          <Breadcrumb note={note} />
          {provider && (
            <>
              <CollaboratorAvatars provider={provider} />
              {isReadOnly && (
                <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                  <Eye size={12} />
                  View only
                </div>
              )}
              {error && (
                <span className="text-xs text-destructive">Connection error</span>
              )}
            </>
          )}
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
          {canCollab && canComment && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className={cn('gap-1.5', showComments && 'bg-accent')}
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
        <div className="flex-1 overflow-y-auto flex flex-col">
          <div className="flex-1 flex flex-col mx-auto w-full max-w-5xl">
            <NoteHeader note={note} />
            <div className="px-4 sm:px-8">
              <NoteTitleInput note={note} />
            </div>
            <div className="flex-1 min-h-0 mt-4 px-4 sm:px-8 pb-24 relative">
              {isReadOnly && (
                <div className="absolute inset-0 z-10 bg-background/50 pointer-events-none" />
              )}
              <BlockNoteView
                editor={editor}
                slashMenu={false}
                editable={!isReadOnly}
                onChange={() => {
                  if (!isReadOnly) {
                    save({ content: editor.document });
                  }
                  if (linkScanTimeoutRef.current) {
                    clearTimeout(linkScanTimeoutRef.current);
                  }
                  linkScanTimeoutRef.current = setTimeout(() => {
                    if (note && editor) {
                      scanNoteForLinks(
                        { ...note, content: editor.document },
                        notes,
                        folders
                      );
                    }
                  }, 1000);
                }}
                theme={resolvedTheme}
              >
                <SuggestionMenuController
                  triggerCharacter="/"
                  getItems={async (query) => {
                    const allItems = [
                      insertAIBlock(editor),
                      insertWikilinkBlock(editor),
                      insertTagBlock(editor),
                      ...getDefaultReactSlashMenuItems(editor),
                    ];
                    return allItems.filter(
                      (item) =>
                        item.title.toLowerCase().includes(query.toLowerCase()) ||
                        (item.aliases?.some((alias: string) =>
                          alias.toLowerCase().includes(query.toLowerCase())
                        ))
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
                [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text, styles: {} }],
                  },
                ],
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
