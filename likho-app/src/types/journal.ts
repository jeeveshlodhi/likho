export interface JournalHabit {
  id: string;
  name: string;
  completed: boolean;
}

export interface JournalAiInsight {
  summary: string;
  mood_insight: string;
  productivity_feedback: string;
  tomorrow_suggestions: string[];
  generated_at: string;
}

export interface JournalData {
  date: string;              // ISO date string
  mood?: string;             // emoji character
  mood_note?: string;
  energy_level?: number;     // 1–5
  priorities: string[];      // top 3 for the day
  success_criteria?: string;
  free_writing?: string;
  accomplishments: string[];
  went_well: string[];
  didnt_go_well: string[];
  learnings: string[];
  gratitude: string[];
  habits: JournalHabit[];
  ai_insight?: JournalAiInsight;
}

export const DEFAULT_HABITS: Omit<JournalHabit, 'completed'>[] = [
  { id: 'exercise',   name: 'Exercise' },
  { id: 'reading',    name: 'Reading' },
  { id: 'deep_work',  name: 'Deep Work' },
  { id: 'meditation', name: 'Meditation' },
];

export const MOOD_OPTIONS = [
  { emoji: '😞', label: 'Rough',   value: 1 },
  { emoji: '😕', label: 'Low',     value: 2 },
  { emoji: '😐', label: 'Neutral', value: 3 },
  { emoji: '🙂', label: 'Good',    value: 4 },
  { emoji: '😊', label: 'Great',   value: 5 },
  { emoji: '😄', label: 'Amazing', value: 6 },
];

export function createDefaultJournalData(): JournalData {
  return {
    date: new Date().toISOString(),
    priorities: [],
    accomplishments: [],
    went_well: [],
    didnt_go_well: [],
    learnings: [],
    gratitude: [],
    habits: DEFAULT_HABITS.map((h) => ({ ...h, completed: false })),
  };
}

// ─── Weekly Review Types ──────────────────────────────────────────────────────

export interface WeeklyReviewTask {
  id: string;
  title: string;
  completed: boolean;
  source: 'planned' | 'unplanned';
  dayOfWeek: number; // 0-6 (Mon-Sun)
}

export interface WeeklyReviewMoodLog {
  day: string; // ISO date
  mood: string;
  energyLevel?: number;
}

export interface WeeklyReviewAiInsight {
  summary: string;
  themes: string[];
  productivity_score: number;
  highlights: string[];
  insights: string;
  recommendations: string[];
  generated_at: string;
}

export interface WeeklyReviewData {
  weekStart: string; // ISO date (Monday)
  weekEnd: string;   // ISO date (Sunday)
  wins: string[];
  failures: string[];
  learnings: string[];
  priorities: string[]; // Next week's priorities (draggable)
  moodLogs: WeeklyReviewMoodLog[];
  tasks: WeeklyReviewTask[];
  notes: string;
  ai_insight?: WeeklyReviewAiInsight;
}

export function createDefaultWeeklyReviewData(weekStart?: Date): WeeklyReviewData {
  const start = weekStart || getWeekStart(new Date());
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  
  return {
    weekStart: start.toISOString(),
    weekEnd: end.toISOString(),
    wins: [],
    failures: [],
    learnings: [],
    priorities: [],
    moodLogs: [],
    tasks: [],
    notes: '',
  };
}

// Helper to get Monday of current week
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
  return new Date(d.setDate(diff));
}

// Helper to format week range
export function formatWeekRange(weekStart: string, weekEnd: string): string {
  const start = new Date(weekStart);
  const end = new Date(weekEnd);
  const sameMonth = start.getMonth() === end.getMonth();
  
  if (sameMonth) {
    return `${start.toLocaleDateString('en-US', { month: 'short' })} ${start.getDate()} - ${end.getDate()}, ${end.getFullYear()}`;
  }
  return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

// ─── Reading Notes Types ──────────────────────────────────────────────────────

export type ReadingType = 'book' | 'article' | 'paper' | 'podcast' | 'video';
export type ReadingStatus = 'to_read' | 'reading' | 'completed' | 'abandoned';

export interface ReadingHighlight {
  id: string;
  text: string;
  location?: string; // page number, timestamp, or location
  note?: string; // user's note on this highlight
  color: 'yellow' | 'green' | 'blue' | 'pink' | 'purple';
  createdAt: string;
}

export interface ReadingTakeaway {
  id: string;
  text: string;
  category?: string;
}

export interface ReadingQuestion {
  id: string;
  question: string;
  answered: boolean;
  answer?: string;
}

export interface ReadingActionItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface RelatedNote {
  noteId: string;
  title: string;
  similarity: number;
}

export interface ReadingNotesAiInsight {
  summary: string;
  key_concepts: string[];
  themes: string[];
  suggested_questions: string[];
  action_items: string[];
  generated_at: string;
}

export interface ReadingNotesData {
  // Metadata
  title: string;
  author: string;
  sourceUrl?: string;
  type: ReadingType;
  status: ReadingStatus;
  rating?: number; // 1-5
  progress: number; // 0-100
  startedAt?: string;
  completedAt?: string;
  
  // Content
  highlights: ReadingHighlight[];
  takeaways: ReadingTakeaway[];
  questions: ReadingQuestion[];
  actionItems: ReadingActionItem[];
  synthesis?: string; // Rich text content
  
  // Related
  relatedNotes: RelatedNote[];
  tags: string[];
  
  // AI
  ai_insight?: ReadingNotesAiInsight;
}

export const READING_TYPE_OPTIONS: { value: ReadingType; label: string; icon: string }[] = [
  { value: 'book', label: 'Book', icon: '📚' },
  { value: 'article', label: 'Article', icon: '📄' },
  { value: 'paper', label: 'Paper', icon: '📑' },
  { value: 'podcast', label: 'Podcast', icon: '🎧' },
  { value: 'video', label: 'Video', icon: '🎬' },
];

export const READING_STATUS_OPTIONS: { value: ReadingStatus; label: string; color: string }[] = [
  { value: 'to_read', label: 'To Read', color: '#94a3b8' },
  { value: 'reading', label: 'Reading', color: '#3b82f6' },
  { value: 'completed', label: 'Completed', color: '#22c55e' },
  { value: 'abandoned', label: 'Abandoned', color: '#ef4444' },
];

export const HIGHLIGHT_COLORS: { value: ReadingHighlight['color']; label: string; bg: string; border: string }[] = [
  { value: 'yellow', label: 'Yellow', bg: 'bg-yellow-100 dark:bg-yellow-900/30', border: 'border-yellow-400' },
  { value: 'green', label: 'Green', bg: 'bg-green-100 dark:bg-green-900/30', border: 'border-green-400' },
  { value: 'blue', label: 'Blue', bg: 'bg-blue-100 dark:bg-blue-900/30', border: 'border-blue-400' },
  { value: 'pink', label: 'Pink', bg: 'bg-pink-100 dark:bg-pink-900/30', border: 'border-pink-400' },
  { value: 'purple', label: 'Purple', bg: 'bg-purple-100 dark:bg-purple-900/30', border: 'border-purple-400' },
];

export function createDefaultReadingNotesData(): ReadingNotesData {
  return {
    title: '',
    author: '',
    type: 'article',
    status: 'to_read',
    progress: 0,
    highlights: [],
    takeaways: [],
    questions: [],
    actionItems: [],
    relatedNotes: [],
    tags: [],
  };
}
