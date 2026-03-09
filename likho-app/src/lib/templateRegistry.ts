import type { PageType, SpaceType } from '@/types/workspace';
import type { LucideIcon } from 'lucide-react';
import {
  FileText,
  Layout,
  KanbanSquare,
  Calendar,
  CheckSquare,
  Table,
  BookOpen,
  Target,
  Lightbulb,
  Briefcase,
  Users,
  Sparkles,
  type LucideIcon as LucideIconType
} from 'lucide-react';

export interface TemplateContent {
  type: 'blocknote' | 'canvas' | 'kanban' | 'database';
  data: any;
}

export interface PageTemplate {
  id: PageType;
  label: string;
  description: string;
  icon: LucideIconType;
  category: TemplateCategory;
  color: string;
  gradient: string;
  defaultTitle: string;
  supportsSpaces: SpaceType[];
  contentGenerator: () => TemplateContent;
  features?: string[];
  isNew?: boolean;
  isBeta?: boolean;
}

export type TemplateCategory =
  | 'documents'
  | 'planning'
  | 'knowledge'
  | 'visual'
  | 'productivity';

export interface CategoryInfo {
  id: TemplateCategory;
  label: string;
  description: string;
  icon: LucideIconType;
  color: string;
}

// Template Categories
export const TEMPLATE_CATEGORIES: CategoryInfo[] = [
  {
    id: 'documents',
    label: 'Documents',
    description: 'Start writing with rich text documents',
    icon: FileText,
    color: '#3b82f6',
  },
  {
    id: 'planning',
    label: 'Planning',
    description: 'Organize tasks and projects',
    icon: Target,
    color: '#f59e0b',
  },
  {
    id: 'knowledge',
    label: 'Knowledge',
    description: 'Build wikis and documentation',
    icon: BookOpen,
    color: '#8b5cf6',
  },
  {
    id: 'visual',
    label: 'Visual',
    description: 'Create diagrams and boards',
    icon: Layout,
    color: '#ec4899',
  },
  {
    id: 'productivity',
    label: 'Productivity',
    description: 'Tools to get things done',
    icon: Sparkles,
    color: '#10b981',
  },
];

// Default BlockNote content structure
const createBlockNoteContent = (blocks: any[] = []) => ({
  type: 'blocknote' as const,
  data: {
    type: 'doc',
    content: blocks.length > 0 ? blocks : [{ type: 'paragraph' }],
  },
});

// Canvas default content
const createCanvasContent = () => ({
  type: 'canvas' as const,
  data: {
    elements: [],
    camera: { x: 0, y: 0, zoom: 1 },
  },
});

// Kanban default content
const createKanbanContent = () => ({
  type: 'kanban' as const,
  data: {
    columns: ['todo', 'inprogress', 'done'],
    columnData: {
      todo: {
        id: 'todo',
        title: 'To Do',
        cardIds: [],
        color: '#94a3b8',
      },
      inprogress: {
        id: 'inprogress',
        title: 'In Progress',
        cardIds: [],
        color: '#3b82f6',
      },
      done: {
        id: 'done',
        title: 'Done',
        cardIds: [],
        color: '#10b981',
      },
    },
    cardData: {},
  },
});

// Empty kanban for custom boards
const createEmptyKanbanContent = () => ({
  type: 'kanban' as const,
  data: {
    columns: [],
    columnData: {},
    cardData: {},
  },
});

// Meeting notes template
const createMeetingNotesContent = () =>
  createBlockNoteContent([
    {
      type: 'heading',
      attrs: { level: 1 },
      content: [{ type: 'text', text: 'Meeting Notes' }],
    },
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'Date: ' }],
    },
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'Attendees: ' }],
    },
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: 'Agenda' }],
    },
    {
      type: 'bulletListItem',
      content: [{ type: 'text', text: '' }],
    },
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: 'Notes' }],
    },
    {
      type: 'paragraph',
      content: [{ type: 'text', text: '' }],
    },
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: 'Action Items' }],
    },
    {
      type: 'checkListItem',
      content: [{ type: 'text', text: '' }],
    },
  ]);

// Project plan template
const createProjectPlanContent = () =>
  createBlockNoteContent([
    {
      type: 'heading',
      attrs: { level: 1 },
      content: [{ type: 'text', text: 'Project Plan' }],
    },
    {
      type: 'paragraph',
      content: [{ type: 'text', text: '' }],
    },
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: 'Overview' }],
    },
    {
      type: 'paragraph',
      content: [{ type: 'text', text: '' }],
    },
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: 'Goals' }],
    },
    {
      type: 'bulletListItem',
      content: [{ type: 'text', text: '' }],
    },
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: 'Timeline' }],
    },
    {
      type: 'paragraph',
      content: [{ type: 'text', text: '' }],
    },
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: 'Resources' }],
    },
    {
      type: 'bulletListItem',
      content: [{ type: 'text', text: '' }],
    },
  ]);

// Daily journal template
const createJournalContent = () =>
  createBlockNoteContent([
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: '🌅 Morning Thoughts' }],
    },
    {
      type: 'paragraph',
      content: [{ type: 'text', text: '' }],
    },
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: '✅ Today\'s Priorities' }],
    },
    {
      type: 'checkListItem',
      content: [{ type: 'text', text: '' }],
    },
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: '📝 Notes & Ideas' }],
    },
    {
      type: 'paragraph',
      content: [{ type: 'text', text: '' }],
    },
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: '🌙 Evening Reflection' }],
    },
    {
      type: 'paragraph',
      content: [{ type: 'text', text: '' }],
    },
  ]);

// Documentation template
const createDocumentationContent = () =>
  createBlockNoteContent([
    {
      type: 'heading',
      attrs: { level: 1 },
      content: [{ type: 'text', text: 'Documentation' }],
    },
    {
      type: 'paragraph',
      content: [{ type: 'text', text: '' }],
    },
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: 'Introduction' }],
    },
    {
      type: 'paragraph',
      content: [{ type: 'text', text: '' }],
    },
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: 'Getting Started' }],
    },
    {
      type: 'paragraph',
      content: [{ type: 'text', text: '' }],
    },
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: 'Usage' }],
    },
    {
      type: 'paragraph',
      content: [{ type: 'text', text: '' }],
    },
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: 'FAQ' }],
    },
    {
      type: 'paragraph',
      content: [{ type: 'text', text: '' }],
    },
  ]);

// Brainstorm canvas with starter elements
const createBrainstormCanvasContent = () => ({
  type: 'canvas' as const,
  data: {
    elements: [
      {
        id: 'center',
        type: 'text',
        x: 0,
        y: 0,
        width: 200,
        height: 60,
        text: 'Central Idea',
        fontSize: 24,
        textAlign: 'center',
        backgroundColor: '#fef3c7',
        strokeColor: '#f59e0b',
      },
    ],
    camera: { x: 0, y: 0, zoom: 1 },
  },
});

// Page Templates Registry
export const PAGE_TEMPLATES: PageTemplate[] = [
  // Documents
  {
    id: 'note',
    label: 'Blank Note',
    description: 'Start with a clean slate for writing',
    icon: FileText,
    category: 'documents',
    color: '#3b82f6',
    gradient: 'from-blue-500/20 to-blue-600/5',
    defaultTitle: 'Untitled',
    supportsSpaces: ['online', 'offline'],
    contentGenerator: () => createBlockNoteContent(),
    features: ['Rich text', 'Blocks', 'Collaboration'],
  },
  {
    id: 'meeting',
    label: 'Meeting Notes',
    description: 'Structured template for meetings',
    icon: Users,
    category: 'documents',
    color: '#06b6d4',
    gradient: 'from-cyan-500/20 to-cyan-600/5',
    defaultTitle: 'Meeting Notes',
    supportsSpaces: ['online', 'offline'],
    contentGenerator: createMeetingNotesContent,
    features: ['Agenda', 'Action items', 'Attendees'],
  },
  {
    id: 'documentation',
    label: 'Documentation',
    description: 'Template for guides and docs',
    icon: BookOpen,
    category: 'documents',
    color: '#6366f1',
    gradient: 'from-indigo-500/20 to-indigo-600/5',
    defaultTitle: 'Documentation',
    supportsSpaces: ['online', 'offline'],
    contentGenerator: createDocumentationContent,
    features: ['Structure', 'Navigation', 'Examples'],
  },

  // Planning
  {
    id: 'kanban',
    label: 'Kanban Board',
    description: 'Visual task management with columns',
    icon: KanbanSquare,
    category: 'planning',
    color: '#f59e0b',
    gradient: 'from-amber-500/20 to-amber-600/5',
    defaultTitle: 'Kanban Board',
    supportsSpaces: ['online', 'offline'],
    contentGenerator: createKanbanContent,
    features: ['Drag & drop', 'Columns', 'Cards'],
  },
  {
    id: 'project',
    label: 'Project Plan',
    description: 'Plan and track your projects',
    icon: Briefcase,
    category: 'planning',
    color: '#8b5cf6',
    gradient: 'from-violet-500/20 to-violet-600/5',
    defaultTitle: 'Project Plan',
    supportsSpaces: ['online', 'offline'],
    contentGenerator: createProjectPlanContent,
    features: ['Goals', 'Timeline', 'Resources'],
  },

  // Knowledge
  {
    id: 'journal',
    label: 'Daily Journal',
    description: 'Reflect and plan your day',
    icon: Calendar,
    category: 'knowledge',
    color: '#ec4899',
    gradient: 'from-pink-500/20 to-pink-600/5',
    defaultTitle: "Today's Journal",
    supportsSpaces: ['online', 'offline'],
    contentGenerator: createJournalContent,
    features: ['Reflection', 'Priorities', 'Ideas'],
  },

  // Visual
  {
    id: 'canvas',
    label: 'Blank Canvas',
    description: 'Whiteboard for diagrams and ideas',
    icon: Layout,
    category: 'visual',
    color: '#ec4899',
    gradient: 'from-fuchsia-500/20 to-fuchsia-600/5',
    defaultTitle: 'Untitled Canvas',
    supportsSpaces: ['online', 'offline'],
    contentGenerator: createCanvasContent,
    features: ['Drawing', 'Shapes', 'Freehand'],
  },
  {
    id: 'brainstorm',
    label: 'Brainstorm',
    description: 'Canvas with central idea node',
    icon: Lightbulb,
    category: 'visual',
    color: '#eab308',
    gradient: 'from-yellow-500/20 to-yellow-600/5',
    defaultTitle: 'Brainstorm',
    supportsSpaces: ['online', 'offline'],
    contentGenerator: createBrainstormCanvasContent,
    features: ['Mind map', 'Ideas', 'Connections'],
  },
];

// Helper functions
export function getTemplatesByCategory(category: TemplateCategory): PageTemplate[] {
  return PAGE_TEMPLATES.filter((t) => t.category === category);
}

export function getTemplateById(id: PageType): PageTemplate | undefined {
  return PAGE_TEMPLATES.find((t) => t.id === id);
}

export function getTemplatesForSpace(spaceType: SpaceType): PageTemplate[] {
  return PAGE_TEMPLATES.filter((t) => t.supportsSpaces.includes(spaceType));
}

export function getAllCategories(): CategoryInfo[] {
  return TEMPLATE_CATEGORIES;
}

export function getCategoryById(id: TemplateCategory): CategoryInfo | undefined {
  return TEMPLATE_CATEGORIES.find((c) => c.id === id);
}

// Register a new template dynamically
export function registerTemplate(template: PageTemplate): void {
  const existingIndex = PAGE_TEMPLATES.findIndex((t) => t.id === template.id);
  if (existingIndex >= 0) {
    PAGE_TEMPLATES[existingIndex] = template;
  } else {
    PAGE_TEMPLATES.push(template);
  }
}

// Get default content for a template
export function getTemplateContent(templateId: PageType): TemplateContent {
  const template = getTemplateById(templateId);
  if (template) {
    return template.contentGenerator();
  }
  return createBlockNoteContent();
}

// Check if template supports a space type
export function templateSupportsSpace(
  templateId: PageType,
  spaceType: SpaceType
): boolean {
  const template = getTemplateById(templateId);
  return template ? template.supportsSpaces.includes(spaceType) : true;
}
