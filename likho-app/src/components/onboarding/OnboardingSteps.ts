/**
 * Onboarding tour step definitions
 * Define all the steps in the Likho app onboarding tour
 */

export interface TourStep {
  id: string;
  title: string;
  description: string;
  targetSelector?: string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  image?: string;
  gif?: string;
  showSkip?: boolean;
  showBack?: boolean;
  nextButtonText?: string;
  backButtonText?: string;
  spotlightPadding?: number;
  spotlightRadius?: number;
  actionRequired?: boolean;
  actionText?: string;
}

export const ONBOARDING_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Likho! 👋',
    description:
      'Your personal knowledge workspace for notes, ideas, and collaboration. Let\'s take a quick tour to get you started with the essentials.',
    placement: 'center',
    showSkip: true,
    showBack: false,
    nextButtonText: 'Start Tour',
    spotlightPadding: 0,
  },
  {
    id: 'create-note',
    title: 'Create Your First Note ✍️',
    description:
      'Click the "New Note" button to create a note. Use our powerful block-based editor to capture your thoughts with rich text, images, code blocks, and more.',
    targetSelector: '[data-tour="new-note-button"]',
    placement: 'bottom',
    showSkip: true,
    showBack: true,
    nextButtonText: 'Next',
    spotlightPadding: 8,
    spotlightRadius: 8,
  },
  {
    id: 'organize-folders',
    title: 'Organize with Folders 📁',
    description:
      'Keep your notes organized with folders and tags. Drag and drop notes to reorganize, create nested folders, and use smart filters to find anything instantly.',
    targetSelector: '[data-tour="sidebar"]',
    placement: 'right',
    showSkip: true,
    showBack: true,
    nextButtonText: 'Next',
    spotlightPadding: 4,
    spotlightRadius: 8,
  },
  {
    id: 'ai-assistant',
    title: 'AI Assistant 🤖',
    description:
      'Get help from our AI assistant. Summarize notes, generate ideas, translate text, fix grammar, or ask questions about your content.',
    targetSelector: '[data-tour="ai-button"]',
    placement: 'left',
    showSkip: true,
    showBack: true,
    nextButtonText: 'Next',
    spotlightPadding: 8,
    spotlightRadius: 8,
  },
  {
    id: 'cloud-sync',
    title: 'Sync to Cloud ☁️',
    description:
      'Your notes sync seamlessly across all your devices. Access your workspace from anywhere - desktop, mobile, or web. Never lose your work again.',
    targetSelector: '[data-tour="sync-status"]',
    placement: 'bottom',
    showSkip: true,
    showBack: true,
    nextButtonText: 'Next',
    spotlightPadding: 8,
    spotlightRadius: 20,
  },
  {
    id: 'share-team',
    title: 'Share with Team 👥',
    description:
      'Collaborate in real-time. Share notes or entire folders with your team, add comments, and work together on projects with live cursors and instant updates.',
    targetSelector: '[data-tour="share-button"]',
    placement: 'left',
    showSkip: true,
    showBack: true,
    nextButtonText: 'Next',
    spotlightPadding: 8,
    spotlightRadius: 8,
  },
  {
    id: 'keyboard-shortcuts',
    title: 'Keyboard Shortcuts ⌨️',
    description:
      'Work faster with keyboard shortcuts. Press Cmd/Ctrl + K for the command palette, Cmd/Ctrl + N for new note, and Cmd/Ctrl + / for the shortcuts menu.',
    targetSelector: '[data-tour="command-palette"]',
    placement: 'bottom',
    showSkip: true,
    showBack: true,
    nextButtonText: 'Next',
    spotlightPadding: 8,
    spotlightRadius: 8,
  },
  {
    id: 'complete',
    title: 'You\'re All Set! 🎉',
    description:
      'You\'re ready to start capturing ideas and building your knowledge base. Remember, you can always restart this tour from the Help menu. Happy writing!',
    placement: 'center',
    showSkip: false,
    showBack: true,
    nextButtonText: 'Get Started',
    backButtonText: 'Back',
    spotlightPadding: 0,
  },
];

// Quick start checklist items
export interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  tourStepId?: string;
}

export const QUICK_START_CHECKLIST: ChecklistItem[] = [
  { id: 'create-note', label: 'Create your first note', completed: false, tourStepId: 'create-note' },
  { id: 'organize-folder', label: 'Create a folder', completed: false, tourStepId: 'organize-folders' },
  { id: 'try-ai', label: 'Try the AI assistant', completed: false, tourStepId: 'ai-assistant' },
  { id: 'sync-account', label: 'Connect your account', completed: false, tourStepId: 'cloud-sync' },
  { id: 'share-note', label: 'Share a note', completed: false, tourStepId: 'share-team' },
  { id: 'learn-shortcuts', label: 'Learn keyboard shortcuts', completed: false, tourStepId: 'keyboard-shortcuts' },
];

// Helper function to get step by ID
export function getStepById(id: string): TourStep | undefined {
  return ONBOARDING_STEPS.find((step) => step.id === id);
}

// Helper function to get step index by ID
export function getStepIndexById(id: string): number {
  return ONBOARDING_STEPS.findIndex((step) => step.id === id);
}

// Helper function to get total steps count
export function getTotalSteps(): number {
  return ONBOARDING_STEPS.length;
}

// Helper to check if a step is the first step
export function isFirstStep(stepIndex: number): boolean {
  return stepIndex === 0;
}

// Helper to check if a step is the last step
export function isLastStep(stepIndex: number): boolean {
  return stepIndex === ONBOARDING_STEPS.length - 1;
}

// Helper to get progress percentage
export function getStepProgress(stepIndex: number): number {
  return Math.round(((stepIndex + 1) / ONBOARDING_STEPS.length) * 100);
}
