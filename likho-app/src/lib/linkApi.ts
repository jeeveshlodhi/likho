/**
 * Link System Developer API
 * 
 * Provides programmatic access to the knowledge graph system
 */

import { useWorkspaceStore } from '@/store/workspaceStore';
import { useLinkStore } from '@/store/linkStore';
import { parseContentForLinks, buildWikilink } from '@/lib/linkParser';
import { LinkSearchEngine } from '@/lib/linkSearchEngine';
import type { NoteLink, Tag, LinkGraph, Note } from '@/types/links';

export interface LinkAPI {
  // Link Management
  createLink: (sourceNoteId: string, targetNoteId: string, type?: string) => NoteLink;
  getBacklinks: (noteId: string) => NoteLink[];
  getOutgoingLinks: (noteId: string) => NoteLink[];
  resolveLink: (linkId: string, targetNoteId: string) => void;
  deleteLink: (linkId: string) => void;
  
  // Tag Management
  createTag: (name: string, color?: string) => Tag;
  getFilesByTag: (tagName: string) => Note[];
  addTagToFile: (noteId: string, tagName: string) => void;
  removeTagFromFile: (noteId: string, tagName: string) => void;
  
  // File/Folder Operations
  getFilesInFolder: (folderId: string) => Note[];
  getFolderByName: (name: string) => { id: string; name: string } | null;
  createFileReference: (noteId: string, targetFileName: string) => string;
  createFolderReference: (noteId: string, folderName: string) => string;
  
  // Search
  search: (query: string) => ReturnType<LinkSearchEngine['search']>;
  parseQuery: (query: string) => ReturnType<LinkSearchEngine['parseQuery']>;
  
  // Graph Operations
  getGraph: () => LinkGraph;
  getOrphanFiles: () => Note[];
  getBrokenLinks: () => NoteLink[];
  
  // Parsing
  parseLinks: (content: any) => ReturnType<typeof parseContentForLinks>;
  buildLink: typeof buildWikilink;
}

export function useLinkAPI(): LinkAPI {
  const notes = useWorkspaceStore((s) => s.notes);
  const folders = useWorkspaceStore((s) => s.folders);
  const { 
    links, 
    tags, 
    createTag, 
    getNotesForTag, 
    getBacklinksForNote,
    getOutgoingLinksForNote,
    resolveLink,
    generateGraph,
    getOrphanNotes,
  } = useLinkStore();
  
  const searchEngine = new LinkSearchEngine(notes, folders, tags, links);
  
  return {
    createLink: (sourceNoteId, targetNoteId, type = 'wikilink') => {
      const targetNote = notes.find(n => n.id === targetNoteId);
      if (!targetNote) throw new Error('Target note not found');
      
      const link: NoteLink = {
        id: crypto.randomUUID(),
        sourceNoteId,
        targetNoteId,
        targetFolderId: null,
        type: type as any,
        displayText: targetNote.title || 'Untitled',
        rawText: `[[${targetNote.title}]]`,
        createdAt: new Date().toISOString(),
        resolved: true,
      };
      
      useLinkStore.setState((state) => ({
        links: [...state.links, link],
      }));
      
      return link;
    },
    
    getBacklinks: (noteId) => {
      return getBacklinksForNote(noteId).map(bl => ({
        ...links.find(l => l.id === bl.id)!,
      })).filter(Boolean);
    },
    
    getOutgoingLinks: getOutgoingLinksForNote,
    
    resolveLink: (linkId, targetNoteId) => {
      resolveLink(linkId, targetNoteId, null);
    },
    
    deleteLink: (linkId) => {
      useLinkStore.setState((state) => ({
        links: state.links.filter(l => l.id !== linkId),
      }));
    },
    
    createTag: (name, color) => createTag(name, color),
    
    getFilesByTag: (tagName) => {
      const tag = tags.find(t => t.name.toLowerCase() === tagName.toLowerCase());
      if (!tag) return [];
      return getNotesForTag(tag.id, notes);
    },
    
    addTagToFile: (noteId, tagName) => {
      const tag = createTag(tagName);
      useLinkStore.setState((state) => ({
        tagUsages: [...state.tagUsages, {
          id: crypto.randomUUID(),
          tagId: tag.id,
          noteId,
          line: 0,
          createdAt: new Date().toISOString(),
        }],
      }));
    },
    
    removeTagFromFile: (noteId, tagName) => {
      const tag = tags.find(t => t.name.toLowerCase() === tagName.toLowerCase());
      if (!tag) return;
      
      useLinkStore.setState((state) => ({
        tagUsages: state.tagUsages.filter(t => !(t.noteId === noteId && t.tagId === tag.id)),
      }));
    },
    
    getFilesInFolder: (folderId) => {
      return notes.filter(n => n.folderId === folderId);
    },
    
    getFolderByName: (name) => {
      const folder = folders.find(f => f.name.toLowerCase() === name.toLowerCase());
      return folder ? { id: folder.id, name: folder.name } : null;
    },
    
    createFileReference: (noteId, targetFileName) => {
      return buildWikilink(targetFileName);
    },
    
    createFolderReference: (noteId, folderName) => {
      return `[[folder:${folderName}]]`;
    },
    
    search: (query) => searchEngine.search(query),
    
    parseQuery: (query) => searchEngine.parseQuery(query),
    
    getGraph: () => generateGraph(notes, folders),
    
    getOrphanFiles: () => getOrphanNotes(notes),
    
    getBrokenLinks: () => {
      return links.filter(l => !l.resolved);
    },
    
    parseLinks: parseContentForLinks,
    
    buildLink: buildWikilink,
  };
}

// Standalone API for use outside of React components
export const LinkAPI = {
  parseContentForLinks,
  buildWikilink,
  LinkSearchEngine,
};

export default LinkAPI;
