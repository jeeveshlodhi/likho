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
  const [linkInitialQuery, setLinkInitialQuery] = useState('');
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
  // Block that was active when the [[ menu was opened — saved before the
  // suggestion input steals focus from BlockNote.
  const savedCursorBlockRef = useRef<any>(null);

  /** Capture the current cursor viewport rect (for fixed-position popup). */
  const captureCursorViewportRect = (): { top: number; left: number } => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      // Add a small gap below the cursor line
      return { top: rect.bottom + 6, left: rect.left };
    }
    return { top: 0, left: 0 };
  };

  useEffect(() => {
    if (!editor) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+[ shortcut — capture everything synchronously then open
      if (e.key === '[' && e.ctrlKey) {
        e.preventDefault();
        savedCursorBlockRef.current = editor.getTextCursorPosition?.()?.block ?? null;
        setSuggestionPosition(captureCursorViewportRect());
        setLinkInitialQuery('');
        setShowLinkSuggestions(true);
        return;
      }

      // [[ trigger — wait for BlockNote to commit the character to the DOM,
      // then capture both the block ref and the cursor rect in the same tick.
      if (e.key === '[' && !e.ctrlKey && !e.metaKey && !showLinkSuggestions) {
        setTimeout(() => {
          if (!editor) return;
          const pos = editor.getTextCursorPosition?.();
          const block = pos?.block;
          if (!block) return;
          const blockText = (Array.isArray(block.content) ? block.content : [])
            .map((c: any) => (c.type === 'text' ? c.text : ''))
            .join('');
          if (blockText.endsWith('[[')) {
            // Capture position NOW — BlockNote has updated the DOM so the
            // selection rect is valid. Save block ref before input steals focus.
            savedCursorBlockRef.current = block;
            setSuggestionPosition(captureCursorViewportRect());
            setLinkInitialQuery('');
            setShowLinkSuggestions(true);
          }
        }, 0);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, showLinkSuggestions]);

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

  // Scan links/tags when a note is opened so Tags, Links, and Graph views
  // reflect existing content without requiring the user to type anything.
  useEffect(() => {
    if (!editor || !note) return;
    // Small delay so the editor has finished loading content first
    const t = setTimeout(() => {
      scanNoteForLinks({ ...note, content: editor.document }, notes, folders);
    }, 300);
    return () => clearTimeout(t);
  // Only re-run when the note ID changes (i.e. a different note is opened)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note?.id]);

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

    // Use the block saved when the menu was opened — getTextCursorPosition()
    // won't work here because the suggestion input has stolen focus from BlockNote.
    const targetBlock = savedCursorBlockRef.current;

    if (targetBlock) {
      // Strip the trailing [[ the user typed to open the menu
      try {
        const blockContent: any[] = targetBlock.content ?? [];
        const rawText: string = blockContent
          .map((c: any) => (c.type === 'text' ? c.text : ''))
          .join('');
        if (rawText.endsWith('[[')) {
          editor.updateBlock(targetBlock, {
            content: blockContent
              .map((c: any) =>
                c.type === 'text'
                  ? { ...c, text: c.text.replace(/\[\[$/, '') }
                  : c
              )
              .filter((c: any) => c.type !== 'text' || c.text !== ''),
          });
        }
      } catch {
        // Non-critical
      }

      editor.insertBlocks(
        [
          {
            type: 'wikilink',
            props: {
              target: suggestion.title,
              displayText: suggestion.title,
              resolved: true,
              targetNoteId: suggestion.type === 'note' ? suggestion.id : '',
              targetFolderId: suggestion.type === 'folder' ? suggestion.id : '',
            },
          },
        ],
        targetBlock,
        'after'
      );
    }

    savedCursorBlockRef.current = null;
    setShowLinkSuggestions(false);
    setLinkInitialQuery('');
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
                initialQuery={linkInitialQuery}
                isOpen={showLinkSuggestions}
                onSelect={handleLinkSelect}
                onClose={() => {
                  setShowLinkSuggestions(false);
                  setLinkInitialQuery('');
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
          <div className="w-[340px] border-l border-border bg-background flex flex-col shrink-0">
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
