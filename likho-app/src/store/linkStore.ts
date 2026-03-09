import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import type { 
  NoteLink, 
  Backlink, 
  Tag, 
  TagUsage,
  LinkGraph,
  LinkGraphNode,
  LinkGraphEdge,
  LinkType,
  LinkSuggestion,
  UnlinkedReference
} from '@/types/links';
import type { Note, Folder } from '@/types/workspace';
import { parseContentForLinks } from '@/lib/linkParser';

interface LinkState {
  // Links storage
  links: NoteLink[];
  tags: Tag[];
  tagUsages: TagUsage[];
  
  // Actions
  scanNoteForLinks: (note: Note, allNotes: Note[], allFolders: Folder[]) => void;
  removeNoteLinks: (noteId: string) => void;
  resolveLink: (linkId: string, targetNoteId: string | null, targetFolderId: string | null) => void;
  
  // Tag actions
  createTag: (name: string, color?: string) => Tag;
  updateTag: (id: string, updates: Partial<Pick<Tag, 'name' | 'color'>>) => void;
  deleteTag: (id: string) => void;
  getTagsForNote: (noteId: string) => Tag[];
  getNotesForTag: (tagId: string, notes: Note[]) => Note[];
  
  // Backlinks
  getBacklinksForNote: (noteId: string) => Backlink[];
  getOutgoingLinksForNote: (noteId: string) => NoteLink[];
  
  // Graph
  generateGraph: (notes: Note[], folders: Folder[]) => LinkGraph;
  
  // Suggestions
  getLinkSuggestions: (query: string, notes: Note[], folders: Folder[]) => LinkSuggestion[];
  getUnlinkedReferences: (noteId: string, notes: Note[]) => UnlinkedReference[];
  
  // Stats
  getTagCloud: () => Array<Tag & { size: number }>;
  getOrphanNotes: (notes: Note[]) => Note[];
}

export const useLinkStore = create<LinkState>()(
  persist(
    (set, get) => ({
      links: [],
      tags: [],
      tagUsages: [],

      scanNoteForLinks: (note, allNotes, allFolders) => {
        const { links, tags, tagUsages } = get();
        const now = new Date().toISOString();
        
        // Remove existing links for this note
        const filteredLinks = links.filter(l => l.sourceNoteId !== note.id);
        const filteredTagUsages = tagUsages.filter(t => t.noteId !== note.id);
        
        // Parse content for links
        const parsedLinks = parseContentForLinks(note);
        const newLinks: NoteLink[] = [];
        const newTagUsages: TagUsage[] = [];
        
        parsedLinks.forEach(parsed => {
          if (parsed.type === 'tag') {
            // Handle tag
            let tag = tags.find(t => t.name.toLowerCase() === parsed.target.toLowerCase());
            if (!tag) {
              tag = {
                id: nanoid(),
                name: parsed.target,
                usageCount: 0,
                createdAt: now,
                updatedAt: now,
              };
              tags.push(tag);
            }
            
            newTagUsages.push({
              id: nanoid(),
              tagId: tag.id,
              noteId: note.id,
              line: parsed.line,
              createdAt: now,
            });
            
            tag.usageCount++;
            tag.updatedAt = now;
          } else {
            // Handle wikilink
            let targetNoteId: string | null = null;
            let targetFolderId: string | null = null;
            
            // Try to find by exact title match
            const targetNote = allNotes.find(n => 
              n.title.toLowerCase() === parsed.target.toLowerCase()
            );
            
            if (targetNote) {
              targetNoteId = targetNote.id;
            } else {
              // Try to find by folder name
              const targetFolder = allFolders.find(f =>
                f.name.toLowerCase() === parsed.target.toLowerCase()
              );
              if (targetFolder) {
                targetFolderId = targetFolder.id;
              }
            }
            
            newLinks.push({
              id: nanoid(),
              sourceNoteId: note.id,
              targetNoteId,
              targetFolderId,
              type: parsed.type,
              displayText: parsed.displayText || parsed.target,
              rawText: parsed.raw,
              createdAt: now,
              line: parsed.line,
              resolved: !!targetNoteId || !!targetFolderId,
            });
          }
        });
        
        set({
          links: [...filteredLinks, ...newLinks],
          tags,
          tagUsages: [...filteredTagUsages, ...newTagUsages],
        });
      },

      removeNoteLinks: (noteId) => {
        const { links, tagUsages, tags } = get();
        
        // Count tag usages to remove
        const removedTagUsages = tagUsages.filter(t => t.noteId === noteId);
        const updatedTags = tags.map(tag => {
          const count = removedTagUsages.filter(t => t.tagId === tag.id).length;
          return {
            ...tag,
            usageCount: Math.max(0, tag.usageCount - count),
          };
        }).filter(tag => tag.usageCount > 0 || !removedTagUsages.some(t => t.tagId === tag.id));
        
        set({
          links: links.filter(l => l.sourceNoteId !== noteId && l.targetNoteId !== noteId),
          tags: updatedTags,
          tagUsages: tagUsages.filter(t => t.noteId !== noteId),
        });
      },

      resolveLink: (linkId, targetNoteId, targetFolderId) => {
        set((state) => ({
          links: state.links.map(l =>
            l.id === linkId
              ? { ...l, targetNoteId, targetFolderId, resolved: true }
              : l
          ),
        }));
      },

      createTag: (name, color) => {
        const existing = get().tags.find(t => 
          t.name.toLowerCase() === name.toLowerCase()
        );
        if (existing) return existing;
        
        const now = new Date().toISOString();
        const tag: Tag = {
          id: nanoid(),
          name,
          color,
          usageCount: 0,
          createdAt: now,
          updatedAt: now,
        };
        
        set((state) => ({
          tags: [...state.tags, tag],
        }));
        
        return tag;
      },

      updateTag: (id, updates) => {
        set((state) => ({
          tags: state.tags.map(t =>
            t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
          ),
        }));
      },

      deleteTag: (id) => {
        set((state) => ({
          tags: state.tags.filter(t => t.id !== id),
          tagUsages: state.tagUsages.filter(t => t.tagId !== id),
        }));
      },

      getTagsForNote: (noteId) => {
        const { tags, tagUsages } = get();
        const usageIds = tagUsages.filter(t => t.noteId === noteId).map(t => t.tagId);
        return tags.filter(t => usageIds.includes(t.id));
      },

      getNotesForTag: (tagId, notes) => {
        const { tagUsages } = get();
        const noteIds = tagUsages.filter(t => t.tagId === tagId).map(t => t.noteId);
        return notes.filter(n => noteIds.includes(n.id));
      },

      getBacklinksForNote: (noteId) => {
        const { links } = get();
        return links
          .filter(l => l.targetNoteId === noteId)
          .map(l => ({
            id: l.id,
            sourceNoteId: l.sourceNoteId,
            sourceNoteTitle: '', // Will be resolved by caller
            linkType: l.type,
            context: l.rawText,
            line: l.line || 0,
            createdAt: l.createdAt,
          }));
      },

      getOutgoingLinksForNote: (noteId) => {
        return get().links.filter(l => l.sourceNoteId === noteId);
      },

      generateGraph: (notes, folders) => {
        const { links, tags, tagUsages } = get();
        const nodes: LinkGraphNode[] = [];
        const edges: LinkGraphEdge[] = [];
        const nodeIds = new Set<string>();
        
        // Add note nodes
        notes.forEach(note => {
          nodes.push({
            id: note.id,
            type: 'note',
            label: note.title || 'Untitled',
          });
          nodeIds.add(note.id);
        });
        
        // Add folder nodes
        folders.forEach(folder => {
          nodes.push({
            id: folder.id,
            type: 'folder',
            label: folder.name,
            color: '#8b5cf6',
          });
          nodeIds.add(folder.id);
        });
        
        // Add tag nodes
        tags.forEach(tag => {
          nodes.push({
            id: `tag:${tag.id}`,
            type: 'tag',
            label: tag.name,
            color: tag.color || '#f59e0b',
          });
          nodeIds.add(`tag:${tag.id}`);
        });
        
        // Add edges for links
        links.forEach(link => {
          if (link.targetNoteId && nodeIds.has(link.targetNoteId)) {
            edges.push({
              id: link.id,
              source: link.sourceNoteId,
              target: link.targetNoteId,
              type: link.type,
            });
          }
          if (link.targetFolderId && nodeIds.has(link.targetFolderId)) {
            edges.push({
              id: `${link.id}-folder`,
              source: link.sourceNoteId,
              target: link.targetFolderId,
              type: link.type,
            });
          }
        });
        
        // Add edges for tags
        tagUsages.forEach(usage => {
          if (nodeIds.has(usage.noteId)) {
            edges.push({
              id: usage.id,
              source: usage.noteId,
              target: `tag:${usage.tagId}`,
              type: 'tag',
            });
          }
        });
        
        return { nodes, edges };
      },

      getLinkSuggestions: (query, notes, folders) => {
        const normalizedQuery = query.toLowerCase();
        const suggestions: LinkSuggestion[] = [];
        
        // Search notes
        notes.forEach(note => {
          if (note.title.toLowerCase().includes(normalizedQuery)) {
            suggestions.push({
              id: note.id,
              title: note.title || 'Untitled',
              type: 'note',
              icon: note.icon,
              path: '', // Could build full path
              similarity: note.title.toLowerCase().startsWith(normalizedQuery) ? 1 : 0.5,
            });
          }
        });
        
        // Search folders
        folders.forEach(folder => {
          if (folder.name.toLowerCase().includes(normalizedQuery)) {
            suggestions.push({
              id: folder.id,
              title: folder.name,
              type: 'folder',
              path: '',
              similarity: folder.name.toLowerCase().startsWith(normalizedQuery) ? 0.9 : 0.4,
            });
          }
        });
        
        return suggestions.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
      },

      getUnlinkedReferences: (noteId, notes) => {
        const targetNote = notes.find(n => n.id === noteId);
        if (!targetNote) return [];
        
        const references: UnlinkedReference[] = [];
        const targetTitle = targetNote.title.toLowerCase();
        
        if (!targetTitle) return [];
        
        notes.forEach(note => {
          if (note.id === noteId || !note.content) return;
          
          const content = JSON.stringify(note.content).toLowerCase();
          const matches: Array<{ line: number; context: string; text: string }> = [];
          
          // Check for unlinked mentions of the note title
          if (content.includes(targetTitle)) {
            // Find all occurrences (simplified - in real implementation, parse blocks)
            matches.push({
              line: 1,
              context: `Mentioned in "${note.title || 'Untitled'}"`,
              text: targetNote.title,
            });
          }
          
          if (matches.length > 0) {
            references.push({
              noteId: note.id,
              noteTitle: note.title || 'Untitled',
              matches,
            });
          }
        });
        
        return references;
      },

      getTagCloud: () => {
        const { tags } = get();
        const maxCount = Math.max(...tags.map(t => t.usageCount), 1);
        
        return tags.map(tag => ({
          ...tag,
          size: Math.max(0.8, Math.min(2, tag.usageCount / maxCount * 2)),
        })).sort((a, b) => b.usageCount - a.usageCount);
      },

      getOrphanNotes: (notes) => {
        const { links } = get();
        const linkedNoteIds = new Set(
          links.flatMap(l => [l.sourceNoteId, l.targetNoteId].filter(Boolean) as string[])
        );
        
        return notes.filter(n => !linkedNoteIds.has(n.id));
      },
    }),
    {
      name: 'link-storage',
    }
  )
);
