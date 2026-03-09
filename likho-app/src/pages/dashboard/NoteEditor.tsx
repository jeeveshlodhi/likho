import { useEffect, useMemo, useRef, useState } from 'react';
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
      // If parsing fails, return undefined to let BlockNote use defaults
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
import { Sparkles, Share2, Link2, Hash, PanelRight, PanelRightClose } from 'lucide-react';
import { AskAIBlock } from '@/components/dashboard/editor/AskAIBlock';
import { WikilinkBlock } from '@/components/dashboard/editor/WikilinkBlock';
import { TagBlock } from '@/components/dashboard/editor/TagBlock';
import { LinkSuggestionMenu } from '@/components/dashboard/editor/LinkSuggestionMenu';
import { BacklinksPanel } from '@/components/dashboard/editor/BacklinksPanel';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useLinkStore } from '@/store/linkStore';
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
import { parseContentForLinks, buildWikilink } from '@/lib/linkParser';

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
      [{ type: "askAi", props: { response: "I am thinking..." } }],
      currentBlock,
      "after"
    );
  },
  aliases: ["ai", "ask"],
  group: "AI",
  icon: <Sparkles size={18} />,
  subtext: "Connect to your AI assistant.",
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
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const userName = user?.full_name || user?.email || 'Anonymous';
  const prevCollabRef = useRef<ReturnType<typeof createCollaborationProvider> | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [showLinkSuggestions, setShowLinkSuggestions] = useState(false);
  const [linkQuery, setLinkQuery] = useState('');
  const [suggestionPosition, setSuggestionPosition] = useState({ top: 0, left: 0 });
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false);

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
      // Clear link scanning timeout on unmount
      if (linkScanTimeoutRef.current) {
        clearTimeout(linkScanTimeoutRef.current);
      }
    };
  }, []);

  const save = useAutoSave(noteId || '');

  const editor = useCreateBlockNote({
    schema,
    initialContent: collabSession ? undefined : getInitialContent(note?.content),
    collaboration: collabSession
      ? {
          provider: collabSession.provider,
          fragment: collabSession.doc.getXmlFragment('document-store'),
          user: collabSession.user,
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

  // Update editor content when note changes
  useEffect(() => {
    if (!editor || !note) return;
    
    // Only update if this is not a collaboration session
    if (collabSession) return;
    
    const content = getInitialContent(note.content);
    if (content) {
      // Replace the entire document with the new note's content
      editor.replaceBlocks(editor.document, content);
    } else {
      // If no content, clear to a single empty paragraph
      editor.replaceBlocks(editor.document, [{ type: 'paragraph' }]);
    }
  }, [note?.id, editor, collabSession]);

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
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-4xl pb-8">
            <NoteHeader note={note} />

            <div className="px-4 sm:px-8">
              <NoteTitleInput note={note} />
            </div>

            <div className="min-h-[60vh] mt-4 px-4 sm:px-8 relative">
              <BlockNoteView
                editor={editor}
                slashMenu={false}
                onChange={() => {
                  if (!collabSession) save({ content: editor.document });
                  
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
        
        {/* Right Sidebar - Backlinks Panel */}
        <div className={`border-l border-border bg-card hidden xl:flex flex-col transition-all duration-200 ${rightSidebarCollapsed ? 'w-12' : 'w-80'}`}>
          {rightSidebarCollapsed ? (
            <div className="flex-1 flex flex-col items-center py-2">
              <button
                onClick={() => setRightSidebarCollapsed(false)}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                title="Show backlinks panel"
              >
                <PanelRight size={20} />
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between px-4 py-2 border-b border-border">
                <span className="text-sm font-medium">Connections</span>
                <button
                  onClick={() => setRightSidebarCollapsed(true)}
                  className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors"
                  title="Hide backlinks panel"
                >
                  <PanelRightClose size={16} />
                </button>
              </div>
              <div className="flex-1 overflow-auto">
                <BacklinksPanel noteId={noteId!} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
