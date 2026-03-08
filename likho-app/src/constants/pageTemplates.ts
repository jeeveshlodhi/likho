import type { PageType } from '@/types/workspace';
import type { LucideIcon } from 'lucide-react';
import { FileText, Layout } from 'lucide-react';

export interface PageTemplate {
  id: PageType;
  label: string;
  description: string;
  icon: LucideIcon;
}

/** Ordered list of page templates for the "New page" modal. Add more here later. */
export const PAGE_TEMPLATES: PageTemplate[] = [
  {
    id: 'note',
    label: 'Simple note',
    description: 'Rich text document for writing and editing.',
    icon: FileText,
  },
  {
    id: 'canvas',
    label: 'Canvas',
    description: 'Whiteboard for brainstorming, diagrams, and sticky notes.',
    icon: Layout,
  },
];
