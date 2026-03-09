import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { 
  Link2, 
  AlertTriangle, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft,
  RefreshCw,
  Search,
  Filter,
  ExternalLink,
  Trash2,
  Edit3
} from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useLinkStore } from '@/store/linkStore';
import type { NoteLink } from '@/types/links';

type LinkStatus = 'all' | 'resolved' | 'unresolved';
type LinkDirection = 'all' | 'incoming' | 'outgoing';

export default function LinkManager() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<LinkStatus>('all');
  const [directionFilter, setDirectionFilter] = useState<LinkDirection>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  
  const notes = useWorkspaceStore((s) => s.notes);
  const folders = useWorkspaceStore((s) => s.folders);
  const links = useLinkStore((s) => s.links);
  const getBacklinksForNote = useLinkStore((s) => s.getBacklinksForNote);
  const getOutgoingLinksForNote = useLinkStore((s) => s.getOutgoingLinksForNote);
  
  const stats = useMemo(() => {
    const total = links.length;
    const resolved = links.filter(l => l.resolved).length;
    const unresolved = total - resolved;
    const orphaned = notes.filter(n => {
      const outgoing = getOutgoingLinksForNote(n.id);
      const incoming = getBacklinksForNote(n.id);
      return outgoing.length === 0 && incoming.length === 0;
    }).length;
    
    return { total, resolved, unresolved, orphaned };
  }, [links, notes, getOutgoingLinksForNote, getBacklinksForNote]);
  
  const filteredLinks = useMemo(() => {
    let filtered = [...links];
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(l => 
        statusFilter === 'resolved' ? l.resolved : !l.resolved
      );
    }
    
    // Apply direction filter
    if (directionFilter !== 'all' && selectedNoteId) {
      if (directionFilter === 'incoming') {
        filtered = filtered.filter(l => l.targetNoteId === selectedNoteId);
      } else {
        filtered = filtered.filter(l => l.sourceNoteId === selectedNoteId);
      }
    }
    
    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(l => {
        const sourceNote = notes.find(n => n.id === l.sourceNoteId);
        const targetNote = notes.find(n => n.id === l.targetNoteId);
        return (
          (sourceNote?.title || '').toLowerCase().includes(query) ||
          (targetNote?.title || '').toLowerCase().includes(query) ||
          l.displayText.toLowerCase().includes(query)
        );
      });
    }
    
    return filtered;
  }, [links, statusFilter, directionFilter, selectedNoteId, searchQuery, notes]);
  
  const handleResolveLink = (link: NoteLink) => {
    // Find matching note or folder
    const targetNote = notes.find(n => 
      n.title.toLowerCase() === link.displayText.toLowerCase()
    );
    if (targetNote) {
      useLinkStore.getState().resolveLink(link.id, targetNote.id, null);
    } else {
      const targetFolder = folders.find(f => 
        f.name.toLowerCase() === link.displayText.toLowerCase()
      );
      if (targetFolder) {
        useLinkStore.getState().resolveLink(link.id, null, targetFolder.id);
      }
    }
  };
  
  const handleDeleteLink = (linkId: string) => {
    const { links, removeNoteLinks } = useLinkStore.getState();
    const link = links.find(l => l.id === linkId);
    if (link) {
      // Remove all links for this source note and rebuild
      useLinkStore.setState({
        links: links.filter(l => l.id !== linkId),
      });
    }
  };
  
  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Link2 className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Link Manager</h1>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Links</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
            <div className="text-sm text-muted-foreground">Resolved</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.unresolved}</div>
            <div className="text-sm text-muted-foreground">Unresolved</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.orphaned}</div>
            <div className="text-sm text-muted-foreground">Orphaned Notes</div>
          </div>
        </div>
      </div>
      
      {/* Filters */}
      <div className="border-b border-border px-6 py-3 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as LinkStatus)}
            className="bg-background border border-input rounded px-3 py-1.5 text-sm"
          >
            <option value="all">All Status</option>
            <option value="resolved">Resolved</option>
            <option value="unresolved">Unresolved</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={directionFilter}
            onChange={(e) => setDirectionFilter(e.target.value as LinkDirection)}
            className="bg-background border border-input rounded px-3 py-1.5 text-sm"
          >
            <option value="all">All Directions</option>
            <option value="incoming">Incoming</option>
            <option value="outgoing">Outgoing</option>
          </select>
        </div>
        
        <div className="flex-1" />
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search links..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-1.5 bg-background border border-input rounded text-sm w-64"
          />
        </div>
      </div>
      
      {/* Links Table */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Source</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground"></th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Target</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Link Text</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredLinks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No links found matching your filters
                  </td>
                </tr>
              ) : (
                filteredLinks.map((link) => {
                  const sourceNote = notes.find(n => n.id === link.sourceNoteId);
                  const targetNote = link.targetNoteId 
                    ? notes.find(n => n.id === link.targetNoteId)
                    : null;
                  const targetFolder = link.targetFolderId
                    ? folders.find(f => f.id === link.targetFolderId)
                    : null;
                  
                  return (
                    <tr key={link.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        {link.resolved ? (
                          <span className="inline-flex items-center gap-1 text-green-600 text-sm">
                            <CheckCircle className="h-4 w-4" />
                            Resolved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-yellow-600 text-sm">
                            <AlertTriangle className="h-4 w-4" />
                            Unresolved
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => navigate(`/dashboard/note/${link.sourceNoteId}`)}
                          className="text-sm text-primary hover:underline"
                        >
                          {sourceNote?.title || 'Untitled'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <ArrowRight className="h-4 w-4 text-muted-foreground inline" />
                      </td>
                      <td className="px-4 py-3">
                        {targetNote ? (
                          <button
                            onClick={() => navigate(`/dashboard/note/${targetNote.id}`)}
                            className="text-sm text-primary hover:underline"
                          >
                            {targetNote.title || 'Untitled'}
                          </button>
                        ) : targetFolder ? (
                          <button
                            onClick={() => navigate(`/dashboard/folder/${targetFolder.id}`)}
                            className="text-sm text-purple-600 hover:underline"
                          >
                            📁 {targetFolder.name}
                          </button>
                        ) : (
                          <span className="text-sm text-yellow-600">
                            {link.displayText}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                          {link.rawText}
                        </code>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!link.resolved && (
                            <button
                              onClick={() => handleResolveLink(link)}
                              className="p-1.5 text-muted-foreground hover:text-primary transition-colors"
                              title="Resolve link"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteLink(link.id)}
                            className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                            title="Delete link"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
