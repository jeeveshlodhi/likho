export type LinkType = 'wikilink' | 'tag' | 'embedded' | 'heading' | 'block';

export interface ParsedLink {
  type: LinkType;
  raw: string;
  target: string;
  displayText?: string;
  alias?: string;
  heading?: string;
  blockId?: string;
  line: number;
  column: number;
}

export interface NoteLink {
  id: string;
  sourceNoteId: string;
  targetNoteId: string | null;
  targetFolderId: string | null;
  type: LinkType;
  displayText: string;
  rawText: string;
  createdAt: string;
  line?: number;
  resolved: boolean;
}

export interface Backlink {
  id: string;
  sourceNoteId: string;
  sourceNoteTitle: string;
  linkType: LinkType;
  context: string;
  line: number;
  createdAt: string;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TagUsage {
  id: string;
  tagId: string;
  noteId: string;
  line: number;
  createdAt: string;
}

export interface LinkGraphNode {
  id: string;
  type: 'note' | 'folder' | 'tag';
  label: string;
  color?: string;
  x?: number;
  y?: number;
}

export interface LinkGraphEdge {
  id: string;
  source: string;
  target: string;
  type: LinkType;
}

export interface LinkGraph {
  nodes: LinkGraphNode[];
  edges: LinkGraphEdge[];
}

export interface LinkSuggestion {
  id: string;
  title: string;
  type: 'note' | 'folder';
  icon?: string | null;
  path: string;
  similarity?: number;
}

export interface UnlinkedReference {
  noteId: string;
  noteTitle: string;
  matches: Array<{
    line: number;
    context: string;
    text: string;
  }>;
}
