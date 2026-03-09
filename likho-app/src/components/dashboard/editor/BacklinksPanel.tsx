import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Link2, Hash, FileText, ArrowUpRight } from 'lucide-react';
import type { Backlink, NoteLink } from '@/types/links';
import { useLinkStore } from '@/store/linkStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useNavigate } from 'react-router';

interface BacklinksPanelProps {
  noteId: string;
}

type TabType = 'backlinks' | 'outgoing' | 'unlinked';

export function BacklinksPanel({ noteId }: BacklinksPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('backlinks');
  const navigate = useNavigate();
  
  const notes = useWorkspaceStore((s) => s.notes);
  const folders = useWorkspaceStore((s) => s.folders);
  const getBacklinksForNote = useLinkStore((s) => s.getBacklinksForNote);
  const getOutgoingLinksForNote = useLinkStore((s) => s.getOutgoingLinksForNote);
  const getUnlinkedReferences = useLinkStore((s) => s.getUnlinkedReferences);
  
  const backlinks = useMemo(() => {
    const raw = getBacklinksForNote(noteId);
    return raw.map(bl => ({
      ...bl,
      sourceNoteTitle: notes.find(n => n.id === bl.sourceNoteId)?.title || 'Untitled',
    }));
  }, [noteId, getBacklinksForNote, notes]);
  
  const outgoing = useMemo(() => 
    getOutgoingLinksForNote(noteId),
    [noteId, getOutgoingLinksForNote]
  );
  
  const unlinked = useMemo(() => 
    getUnlinkedReferences(noteId, notes),
    [noteId, getUnlinkedReferences, notes]
  );
  
  const handleNavigate = (id: string, type: 'note' | 'folder') => {
    if (type === 'note') {
      navigate(`/dashboard/note/${id}`);
    } else {
      navigate(`/dashboard/folder/${id}`);
    }
  };
  
  const tabs = [
    { id: 'backlinks' as const, label: 'Backlinks', count: backlinks.length, icon: ArrowLeft },
    { id: 'outgoing' as const, label: 'Outgoing', count: outgoing.length, icon: ArrowRight },
    { id: 'unlinked' as const, label: 'Mentions', count: unlinked.length, icon: Link2 },
  ];
  
  return (
    <div className="border-t border-border bg-card">
      <div className="flex items-center gap-1 px-4 py-2 border-b border-border">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors
              ${activeTab === tab.id 
                ? 'bg-primary/10 text-primary' 
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-1 text-xs bg-muted px-1.5 py-0.5 rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
      
      <div className="max-h-48 overflow-y-auto">
        {activeTab === 'backlinks' && (
          <>
            {backlinks.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                <Link2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p>No backlinks yet</p>
                <p className="text-xs mt-1">Other notes linking here will appear</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {backlinks.map((backlink) => (
                  <button
                    key={backlink.id}
                    onClick={() => handleNavigate(backlink.sourceNoteId, 'note')}
                    className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-accent/50 transition-colors"
                  >
                    <FileText className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {backlink.sourceNoteTitle}
                      </div>
                      {backlink.context && (
                        <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          "{backlink.context}"
                        </div>
                      )}
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground flex-shrink-0 opacity-0 group-hover:opacity-100" />
                  </button>
                ))}
              </div>
            )}
          </>
        )}
        
        {activeTab === 'outgoing' && (
          <>
            {outgoing.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                <ArrowRight className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p>No outgoing links</p>
                <p className="text-xs mt-1">Use [[Note Name]] to create links</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {outgoing.map((link) => {
                  const target = link.targetNoteId 
                    ? notes.find(n => n.id === link.targetNoteId)
                    : folders.find(f => f.id === link.targetFolderId);
                  
                  return (
                    <button
                      key={link.id}
                      onClick={() => handleNavigate(
                        link.targetNoteId || link.targetFolderId!,
                        link.targetNoteId ? 'note' : 'folder'
                      )}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-accent/50 transition-colors
                        ${!link.resolved ? 'opacity-50' : ''}`}
                    >
                      {link.targetFolderId ? (
                        <span className="text-purple-500">📁</span>
                      ) : (
                        <FileText className={`h-4 w-4 ${link.resolved ? 'text-blue-500' : 'text-yellow-500'}`} />
                      )}
                      <span className="text-sm truncate">
                        {link.displayText}
                      </span>
                      {!link.resolved && (
                        <span className="text-xs text-yellow-600 bg-yellow-50 dark:bg-yellow-950 px-1.5 py-0.5 rounded">
                          unresolved
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
        
        {activeTab === 'unlinked' && (
          <>
            {unlinked.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                <Hash className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p>No unlinked mentions</p>
                <p className="text-xs mt-1">Text mentioning this note will appear here</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {unlinked.map((ref) => (
                  <div key={ref.noteId} className="px-4 py-3">
                    <button
                      onClick={() => handleNavigate(ref.noteId, 'note')}
                      className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
                    >
                      <FileText className="h-4 w-4" />
                      {ref.noteTitle}
                    </button>
                    <div className="mt-1 space-y-1">
                      {ref.matches.slice(0, 2).map((match, idx) => (
                        <div 
                          key={idx}
                          className="text-xs text-muted-foreground pl-6 border-l-2 border-border"
                        >
                          "...{match.context}..."
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
