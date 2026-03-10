export type AiConfidence = 'high' | 'medium' | 'low' | 'uncertain';

export interface TempNote {
  id: string;
  content: string;
  createdAt: string;
  expiresAt: string;
  isPermanent: boolean;
  /** AI-suggested folder name */
  suggestedFolder?: string;
  /** AI classification confidence */
  aiConfidence?: AiConfidence;
  /** Tags extracted by AI */
  tags?: string[];
}

export interface TempNotesSettings {
  /** Default time-to-live in days */
  defaultTtlDays: number;
}
