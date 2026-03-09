import { useMemo } from 'react';
import type { Note, Folder } from '@/types/workspace';
import type { Tag, NoteLink } from '@/types/links';

export interface SearchFilters {
  tags?: string[];
  excludeTags?: string[];
  linkTo?: string;
  linkedFrom?: string;
  folder?: string;
  spaceType?: 'online' | 'offline';
  pageType?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  modifiedAfter?: Date;
  modifiedBefore?: Date;
}

export interface SearchResult {
  id: string;
  type: 'note' | 'folder';
  title: string;
  snippet?: string;
  score: number;
  matches: Array<{
    field: string;
    indices: [number, number][];
  }>;
}

export class LinkSearchEngine {
  private notes: Note[];
  private folders: Folder[];
  private tags: Tag[];
  private links: NoteLink[];
  
  constructor(
    notes: Note[],
    folders: Folder[],
    tags: Tag[],
    links: NoteLink[]
  ) {
    this.notes = notes;
    this.folders = folders;
    this.tags = tags;
    this.links = links;
  }
  
  /**
   * Parse search query for special operators
   * - tag:#project - Files with specific tag
   * - link:filename - Files linking to specific file
   * - linked:filename - Files linked from specific file
   * - folder:notes - Files in specific folder
   * - type:canvas - Specific file type
   * - space:online - Specific space type
   * - after:2024-01-01 - Created after date
   * - before:2024-12-31 - Created before date
   */
  parseQuery(query: string): { text: string; filters: SearchFilters } {
    const filters: SearchFilters = {};
    let textQuery = query;
    
    // Extract tag filters
    const tagMatches = query.match(/tag:(\S+)/g);
    if (tagMatches) {
      filters.tags = tagMatches.map(m => m.replace('tag:', '').replace('#', ''));
      textQuery = textQuery.replace(/tag:\S+/g, '');
    }
    
    // Extract link filters
    const linkMatch = query.match(/link:(\S+)/);
    if (linkMatch) {
      filters.linkTo = linkMatch[1];
      textQuery = textQuery.replace(/link:\S+/g, '');
    }
    
    // Extract linked from filters
    const linkedMatch = query.match(/linked:(\S+)/);
    if (linkedMatch) {
      filters.linkedFrom = linkedMatch[1];
      textQuery = textQuery.replace(/linked:\S+/g, '');
    }
    
    // Extract folder filters
    const folderMatch = query.match(/folder:(\S+)/);
    if (folderMatch) {
      filters.folder = folderMatch[1];
      textQuery = textQuery.replace(/folder:\S+/g, '');
    }
    
    // Extract space type
    const spaceMatch = query.match(/space:(online|offline)/);
    if (spaceMatch) {
      filters.spaceType = spaceMatch[1] as 'online' | 'offline';
      textQuery = textQuery.replace(/space:\S+/g, '');
    }
    
    // Extract page type
    const typeMatch = query.match(/type:(\S+)/);
    if (typeMatch) {
      filters.pageType = typeMatch[1];
      textQuery = textQuery.replace(/type:\S+/g, '');
    }
    
    // Extract date filters
    const afterMatch = query.match(/after:(\d{4}-\d{2}-\d{2})/);
    if (afterMatch) {
      filters.createdAfter = new Date(afterMatch[1]);
      textQuery = textQuery.replace(/after:\S+/g, '');
    }
    
    const beforeMatch = query.match(/before:(\d{4}-\d{2}-\d{2})/);
    if (beforeMatch) {
      filters.createdBefore = new Date(beforeMatch[1]);
      textQuery = textQuery.replace(/before:\S+/g, '');
    }
    
    return { text: textQuery.trim(), filters };
  }
  
  /**
   * Search notes and folders
   */
  search(query: string, limit: number = 50): SearchResult[] {
    const { text, filters } = this.parseQuery(query);
    const results: SearchResult[] = [];
    
    // Get IDs that match filter criteria
    const matchingNoteIds = this.applyFilters(filters);
    
    if (text) {
      // Text search
      const normalizedQuery = text.toLowerCase();
      const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 0);
      
      this.notes.forEach(note => {
        if (!matchingNoteIds.has(note.id)) return;
        
        const score = this.calculateTextScore(note, queryWords);
        if (score > 0) {
          results.push({
            id: note.id,
            type: 'note',
            title: note.title || 'Untitled',
            snippet: this.generateSnippet(note, queryWords),
            score,
            matches: this.findMatches(note, queryWords),
          });
        }
      });
      
      // Search folders too
      this.folders.forEach(folder => {
        const folderScore = this.calculateFolderScore(folder, queryWords);
        if (folderScore > 0) {
          results.push({
            id: folder.id,
            type: 'folder',
            title: folder.name,
            score: folderScore,
            matches: [],
          });
        }
      });
    } else {
      // Filter-only search - return all matching
      this.notes.forEach(note => {
        if (!matchingNoteIds.has(note.id)) return;
        
        results.push({
          id: note.id,
          type: 'note',
          title: note.title || 'Untitled',
          snippet: this.getFirstParagraph(note),
          score: 1,
          matches: [],
        });
      });
    }
    
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
  
  private applyFilters(filters: SearchFilters): Set<string> {
    let noteIds = new Set(this.notes.map(n => n.id));
    
    if (filters.tags && filters.tags.length > 0) {
      // Filter by tags
      const tagIds = filters.tags.map(t => 
        this.tags.find(tag => tag.name.toLowerCase() === t.toLowerCase())?.id
      ).filter(Boolean) as string[];
      
      // Get notes that have these tags
      const notesWithTags = new Set(
        this.links
          .filter(l => tagIds.some(tagId => l.targetNoteId === tagId))
          .map(l => l.sourceNoteId)
      );
      noteIds = new Set([...noteIds].filter(id => notesWithTags.has(id)));
    }
    
    if (filters.linkTo) {
      // Filter notes that link to specific note
      const targetNote = this.notes.find(n => 
        n.title.toLowerCase() === filters.linkTo!.toLowerCase()
      );
      if (targetNote) {
        const linkingNotes = new Set(
          this.links
            .filter(l => l.targetNoteId === targetNote.id)
            .map(l => l.sourceNoteId)
        );
        noteIds = new Set([...noteIds].filter(id => linkingNotes.has(id)));
      }
    }
    
    if (filters.linkedFrom) {
      // Filter notes that are linked from specific note
      const sourceNote = this.notes.find(n => 
        n.title.toLowerCase() === filters.linkedFrom!.toLowerCase()
      );
      if (sourceNote) {
        const linkedNotes = new Set(
          this.links
            .filter(l => l.sourceNoteId === sourceNote.id && l.targetNoteId)
            .map(l => l.targetNoteId!)
        );
        noteIds = new Set([...noteIds].filter(id => linkedNotes.has(id)));
      }
    }
    
    if (filters.folder) {
      // Filter by folder
      const folder = this.folders.find(f => 
        f.name.toLowerCase() === filters.folder!.toLowerCase()
      );
      if (folder) {
        noteIds = new Set(
          [...noteIds].filter(id => {
            const note = this.notes.find(n => n.id === id);
            return note?.folderId === folder.id;
          })
        );
      }
    }
    
    if (filters.spaceType) {
      noteIds = new Set(
        [...noteIds].filter(id => {
          const note = this.notes.find(n => n.id === id);
          return note?.spaceType === filters.spaceType;
        })
      );
    }
    
    if (filters.pageType) {
      noteIds = new Set(
        [...noteIds].filter(id => {
          const note = this.notes.find(n => n.id === id);
          return note?.pageType === filters.pageType;
        })
      );
    }
    
    if (filters.createdAfter) {
      noteIds = new Set(
        [...noteIds].filter(id => {
          const note = this.notes.find(n => n.id === id);
          return note && new Date(note.createdAt) >= filters.createdAfter!;
        })
      );
    }
    
    if (filters.createdBefore) {
      noteIds = new Set(
        [...noteIds].filter(id => {
          const note = this.notes.find(n => n.id === id);
          return note && new Date(note.createdAt) <= filters.createdBefore!;
        })
      );
    }
    
    return noteIds;
  }
  
  private calculateTextScore(note: Note, queryWords: string[]): number {
    let score = 0;
    const title = (note.title || '').toLowerCase();
    const content = this.extractTextContent(note).toLowerCase();
    
    queryWords.forEach(word => {
      // Title matches are worth more
      if (title.includes(word)) {
        score += title.startsWith(word) ? 10 : 5;
        if (title === word) score += 5;
      }
      
      // Content matches
      if (content.includes(word)) {
        score += 1;
      }
    });
    
    // Boost recent notes
    const daysSinceCreation = (Date.now() - new Date(note.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    score += Math.max(0, 2 - daysSinceCreation / 30);
    
    return score;
  }
  
  private calculateFolderScore(folder: Folder, queryWords: string[]): number {
    let score = 0;
    const name = folder.name.toLowerCase();
    
    queryWords.forEach(word => {
      if (name.includes(word)) {
        score += name.startsWith(word) ? 8 : 4;
        if (name === word) score += 3;
      }
    });
    
    return score;
  }
  
  private extractTextContent(note: Note): string {
    if (!note.content) return '';
    
    if (typeof note.content === 'string') {
      return note.content;
    }
    
    if (note.content.data && Array.isArray(note.content.data.content)) {
      return this.extractTextFromBlocks(note.content.data.content);
    }
    
    return JSON.stringify(note.content);
  }
  
  private extractTextFromBlocks(blocks: any[]): string {
    let text = '';
    
    const extract = (block: any) => {
      if (typeof block === 'string') {
        text += block + ' ';
        return;
      }
      
      if (block.content) {
        if (Array.isArray(block.content)) {
          block.content.forEach((c: any) => {
            if (typeof c === 'string') text += c + ' ';
            else if (c.text) text += c.text + ' ';
          });
        } else if (typeof block.content === 'string') {
          text += block.content + ' ';
        }
      }
      
      if (block.children && Array.isArray(block.children)) {
        block.children.forEach(extract);
      }
    };
    
    blocks.forEach(extract);
    return text;
  }
  
  private generateSnippet(note: Note, queryWords: string[]): string {
    const content = this.extractTextContent(note);
    if (!content) return '';
    
    // Find the first occurrence of any query word
    let bestIndex = -1;
    queryWords.forEach(word => {
      const index = content.toLowerCase().indexOf(word);
      if (index !== -1 && (bestIndex === -1 || index < bestIndex)) {
        bestIndex = index;
      }
    });
    
    if (bestIndex === -1) {
      return this.getFirstParagraph(note);
    }
    
    // Extract snippet around the match
    const start = Math.max(0, bestIndex - 60);
    const end = Math.min(content.length, bestIndex + 100);
    let snippet = content.slice(start, end);
    
    if (start > 0) snippet = '...' + snippet;
    if (end < content.length) snippet = snippet + '...';
    
    return snippet;
  }
  
  private getFirstParagraph(note: Note): string {
    const content = this.extractTextContent(note);
    const paragraphs = content.split(/\n\n+/);
    return paragraphs[0]?.slice(0, 150) + (paragraphs[0]?.length > 150 ? '...' : '') || '';
  }
  
  private findMatches(note: Note, queryWords: string[]): Array<{ field: string; indices: [number, number][] }> {
    const matches: Array<{ field: string; indices: [number, number][] }> = [];
    const title = (note.title || '').toLowerCase();
    
    const titleIndices: [number, number][] = [];
    queryWords.forEach(word => {
      let index = title.indexOf(word);
      while (index !== -1) {
        titleIndices.push([index, index + word.length]);
        index = title.indexOf(word, index + 1);
      }
    });
    
    if (titleIndices.length > 0) {
      matches.push({ field: 'title', indices: titleIndices });
    }
    
    return matches;
  }
  
  /**
   * Get search suggestions as user types
   */
  getSuggestions(query: string): string[] {
    if (query.length < 2) return [];
    
    const suggestions: string[] = [];
    const normalizedQuery = query.toLowerCase();
    
    // Suggest note titles
    this.notes.forEach(note => {
      const title = (note.title || '').toLowerCase();
      if (title.includes(normalizedQuery) && title !== normalizedQuery) {
        suggestions.push(note.title || 'Untitled');
      }
    });
    
    // Suggest tags
    this.tags.forEach(tag => {
      if (tag.name.toLowerCase().includes(normalizedQuery)) {
        suggestions.push(`#${tag.name}`);
      }
    });
    
    // Suggest search operators
    const operators = ['tag:', 'link:', 'linked:', 'folder:', 'type:', 'space:', 'after:', 'before:'];
    operators.forEach(op => {
      if (op.startsWith(normalizedQuery)) {
        suggestions.push(op);
      }
    });
    
    return [...new Set(suggestions)].slice(0, 10);
  }
}

// Hook for using the search engine
export function useLinkSearchEngine() {
  return { LinkSearchEngine };
}
