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
