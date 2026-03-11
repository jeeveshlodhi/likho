import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router';

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
import { AskAIBlock } from '@/components/dashboard/editor/AskAIBlock';
import { WikilinkBlock } from '@/components/dashboard/editor/WikilinkBlock';
import { TagBlock } from '@/components/dashboard/editor/TagBlock';
import { LinkSuggestionMenu } from '@/components/dashboard/editor/LinkSuggestionMenu';
import { RightSidebar } from '@/components/ai';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useLinkStore } from '@/store/linkStore';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useCollaboration, usePageComments } from '@/hooks/useCollaboration';
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

export default function NoteEditor() {
  const { noteId } = useParams<{ noteId: string }>();
  const navigate = useNavigate();
  const { notes, folders, setActiveNote } = useWorkspaceStore();
  const { scanNoteForLinks } = useLinkStore();
  const { theme } = useTheme();
  
  const [shareOpen, setShareOpen] = useState(false);
  const [showLinkSuggestions, setShowLinkSuggestions] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [linkQuery, setLinkQuery] = useState('');
  const [suggestionPosition, setSuggestionPosition] = useState({ top: 0, left: 0 });

  const note = notes.find((n) => n.id === noteId);
  
  // Check if collaboration should be enabled
  const isOnline = note?.spaceType === 'online';
  const canCollab = isOnline && noteId && isUuid(noteId);
  
  // Use the new collaboration hook with permission awareness
  const { 
    provider, 
    isConnected, 
    isReadOnly, 
    canComment, 
    users,
    error 
  } = useCollaboration({
    pageId: noteId || '',
    enabled: canCollab,
  });

  // Get comments
  const { comments } = usePageComments(canCollab ? noteId : undefined);

  const save = useAutoSave(noteId || '');

  const editor = useCreateBlockNote({
    schema,
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

  useEffect(() => {
    if (noteId) setActiveNote(noteId);
  }, [noteId, setActiveNote]);

  // Update editor content when note changes (only if not in collaboration mode)
  useEffect(() => {
    if (!editor || !note) return;
    
    // Only update if this is not a collaboration session
    if (provider) return;
    
    const content = getInitialContent(note.content);
    if (content) {
      // Replace the entire document with the new note's content
      editor.replaceBlocks(editor.document, content);
    } else {
      // If no content, clear to a single empty paragraph
      editor.replaceBlocks(editor.document, [{ type: 'paragraph' }]);
    }
  }, [note?.id, editor, provider]);

  useEffect(() => {
    if (!note && noteId) {
      navigate('/dashboard', { replace: true });
    }
  }, [note, noteId, navigate]);

  const handleLinkSelect = (suggestion: { id: string; title: string; type: 'note' | 'folder' }) => {
    if (!editor) return;
    
    const wikilink = buildWikilink(suggestion.title);
    
    // Insert the wikilink as text
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

  if (!note) return null;

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
          
          {/* Share button */}
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
          
          {/* Comments button */}
          {canComment && (
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
      
      {note.spaceType === 'online' && (
        <ShareModal
          pageId={note.id}
          pageTitle={note.title || 'Untitled'}
          open={shareOpen}
          onClose={() => setShareOpen(false)}
        />
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Main Editor */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-4xl pb-8">
            <NoteHeader note={note} />

            <div className="px-4 sm:px-8">
              <NoteTitleInput note={note} />
            </div>

            <div className="min-h-[60vh] mt-4 px-4 sm:px-8 relative">
              {/* Read-only overlay for viewers */}
              {isReadOnly && (
                <div className="absolute inset-0 z-10 bg-background/50 pointer-events-none" />
              )}
              
              <BlockNoteView
                editor={editor}
                slashMenu={false}
                editable={!isReadOnly}
                onChange={() => {
                  // Only save if not in read-only mode and not in collaboration
                  if (!isReadOnly && !provider) {
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
        {!showComments ? (
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
          />
        ) : (
          <div className="w-80 border-l border-border bg-background overflow-y-auto">
            <CommentThread 
              pageId={noteId!}
              canComment={canComment}
              canResolve={!isReadOnly}
            />
          </div>
        )}
      </div>
    </div>
  );
}
