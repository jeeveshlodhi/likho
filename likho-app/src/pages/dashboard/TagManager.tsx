import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Hash,
  Search,
  Trash2,
  FileText,
  X,
  Plus,
  Tag as TagIcon,
  RefreshCw,
} from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useLinkStore } from '@/store/linkStore';
import type { Tag } from '@/types/links';

const TAG_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#eab308', // yellow
  '#84cc16', // lime
  '#22c55e', // green
  '#10b981', // emerald
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#0ea5e9', // sky
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#d946ef', // fuchsia
  '#ec4899', // pink
  '#f43f5e', // rose
];

export default function TagManager() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const notes = useWorkspaceStore((s) => s.notes);
  const folders = useWorkspaceStore((s) => s.folders);
  const tags = useLinkStore((s) => s.tags);
  const tagUsages = useLinkStore((s) => s.tagUsages);
  const getNotesForTag = useLinkStore((s) => s.getNotesForTag);
  const { createTag, updateTag, deleteTag, scanNoteForLinks } = useLinkStore();

  // On mount: only do a full rescan if the store has no tag-usage data yet.
  // If tags already exist (scanned by NoteEditorBody when notes were opened,
  // or from a previous session via persist), trust that data and don't
  // overwrite it — scanning here uses workspaceStore content which may be
  // stale or in a different format than editor.document.
  useEffect(() => {
    if (!notes.length) return;
    if (tagUsages.length > 0) return; // already have scan data — skip
    notes.forEach(note => scanNoteForLinks(note, notes, folders));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRescanAll = () => {
    setIsScanning(true);
    notes.forEach(note => scanNoteForLinks(note, notes, folders));
    setTimeout(() => setIsScanning(false), 600);
  };
  
  const filteredTags = useMemo(() => {
    if (!searchQuery) return tags;
    const query = searchQuery.toLowerCase();
    return tags.filter(t => t.name.toLowerCase().includes(query));
  }, [tags, searchQuery]);
  
  const tagCloud = useMemo(() => {
    const maxCount = Math.max(...tags.map(t => t.usageCount), 1);
    return filteredTags
      .map(tag => ({
        ...tag,
        size: Math.max(0.8, Math.min(2, tag.usageCount / maxCount * 2)),
      }))
      .sort((a, b) => b.usageCount - a.usageCount);
  }, [filteredTags]);
  
  const selectedTagNotes = useMemo(() => {
    if (!selectedTag) return [];
    return getNotesForTag(selectedTag.id, notes);
  }, [selectedTag, getNotesForTag, notes]);
  
  const handleCreateTag = () => {
    if (!newTagName.trim()) return;
    const randomColor = TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)];
    createTag(newTagName.trim(), randomColor);
    setNewTagName('');
    setShowCreateForm(false);
  };
  
  const handleColorChange = (tagId: string, color: string) => {
    updateTag(tagId, { color });
  };
  
  const handleDeleteTag = (tagId: string) => {
    if (confirm('Are you sure you want to delete this tag?')) {
      deleteTag(tagId);
      if (selectedTag?.id === tagId) {
        setSelectedTag(null);
      }
    }
  };
  
  return (
    <div className="h-full flex bg-background">
      {/* Sidebar */}
      <div className="w-80 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TagIcon className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Tags</h2>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleRescanAll}
                disabled={isScanning}
                title="Rescan all notes for tags"
                className="p-1.5 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${isScanning ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="p-1.5 text-muted-foreground hover:text-primary transition-colors"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          {showCreateForm && (
            <div className="mb-4 p-3 bg-muted rounded-lg">
              <input
                type="text"
                placeholder="New tag name..."
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
                className="w-full px-3 py-2 bg-background border border-input rounded text-sm mb-2"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCreateTag}
                  disabled={!newTagName.trim()}
                  className="flex-1 px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm font-medium
                           disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewTagName('');
                  }}
                  className="px-3 py-1.5 border border-input rounded text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-background border border-input rounded text-sm"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-auto p-4">
          <div className="flex flex-wrap gap-2">
            {tagCloud.map((tag) => (
              <button
                key={tag.id}
                onClick={() => setSelectedTag(tag)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
                         transition-all duration-150 hover:scale-105
                         ${selectedTag?.id === tag.id ? 'ring-2 ring-offset-2' : ''}`}
                style={{
                  backgroundColor: `${tag.color || '#f59e0b'}20`,
                  color: tag.color || '#f59e0b',
                  fontSize: `${0.875 * tag.size}rem`,
                }}
              >
                <Hash className="h-3.5 w-3.5" />
                {tag.name}
                <span className="opacity-60 text-xs">{tag.usageCount}</span>
              </button>
            ))}
          </div>
          
          {tagCloud.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <Hash className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>No tags yet</p>
              <p className="text-sm mt-1">Use #tag in your notes</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {selectedTag ? (
          <>
            <div className="border-b border-border px-6 py-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${selectedTag.color || '#f59e0b'}20` }}
                  >
                    <Hash 
                      className="h-6 w-6"
                      style={{ color: selectedTag.color || '#f59e0b' }}
                    />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">#{selectedTag.name}</h1>
                    <p className="text-sm text-muted-foreground">
                      Used in {selectedTag.usageCount} {selectedTag.usageCount === 1 ? 'note' : 'notes'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {TAG_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => handleColorChange(selectedTag.id, color)}
                        className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110
                          ${selectedTag.color === color ? 'border-foreground' : 'border-transparent'}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  
                  <button
                    onClick={() => handleDeleteTag(selectedTag.id)}
                    className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                    title="Delete tag"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={() => setSelectedTag(null)}
                    className="p-2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto p-6">
              {selectedTagNotes.length === 0 ? (
                <div className="text-center text-muted-foreground py-12">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p>No notes with this tag</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {selectedTagNotes.map((note) => (
                    <button
                      key={note.id}
                      onClick={() => navigate(`/dashboard/note/${note.id}`)}
                      className="flex items-start gap-3 p-4 bg-card border border-border rounded-lg
                               hover:border-primary/50 hover:shadow-sm transition-all text-left"
                    >
                      <div className="text-2xl">{note.icon || '📄'}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {note.title || 'Untitled'}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {note.pageType || 'note'} • {new Date(note.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Hash className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <h2 className="text-xl font-semibold mb-2">Select a tag</h2>
              <p>Click on a tag to see all notes using it</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
