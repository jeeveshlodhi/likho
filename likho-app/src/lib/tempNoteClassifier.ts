import type { AiConfidence } from '@/types/tempNote';

interface ClassificationResult {
  folder: string | null;
  confidence: AiConfidence;
  tags: string[];
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Work: ['meeting', 'project', 'deadline', 'client', 'sprint', 'task', 'email', 'standup', 'review', 'report', 'manager', 'team', 'agenda', 'action item', 'milestone', 'kpi', 'roadmap'],
  Personal: ['family', 'friend', 'birthday', 'grocery', 'shopping', 'health', 'workout', 'gym', 'doctor', 'appointment', 'dentist', 'diet', 'sleep', 'vacation', 'trip'],
  Ideas: ['idea', 'concept', 'brainstorm', 'feature', 'proposal', 'maybe', 'what if', 'could', 'innovation', 'startup', 'product', 'design'],
  Research: ['research', 'study', 'article', 'read', 'learn', 'course', 'paper', 'book', 'reference', 'source', 'data', 'analysis', 'survey'],
  Finance: ['money', 'budget', 'expense', 'cost', 'pay', 'invoice', 'price', 'salary', 'tax', 'invest', 'savings', 'bill', 'purchase', 'subscription'],
  Journal: ['today', 'feeling', 'grateful', 'reflection', 'mood', 'thought', 'realize', 'emotion', 'day was', 'week was', 'diary', 'log'],
};

const TAG_KEYWORDS: Record<string, string[]> = {
  urgent: ['urgent', 'asap', 'immediately', 'critical', 'priority'],
  followup: ['follow up', 'follow-up', 'check back', 'remind', 'reminder'],
  question: ['?', 'question', 'how to', 'why', 'what is'],
  code: ['code', 'bug', 'fix', 'function', 'api', 'script', 'variable', 'deploy', 'commit'],
};

/**
 * Classify note content into a suggested folder and extract tags.
 * Uses keyword scoring as a fast, offline-first approach.
 * Works alongside the existing LLM pipeline without requiring it.
 */
export function classifyNoteContent(
  content: string,
  existingFolders: string[] = []
): ClassificationResult {
  if (!content.trim()) {
    return { folder: null, confidence: 'uncertain', tags: [] };
  }

  const lower = content.toLowerCase();

  // Score each category
  const scores: Record<string, number> = {};
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    scores[category] = keywords.reduce(
      (acc, kw) => acc + (lower.includes(kw) ? 1 : 0),
      0
    );
  }

  const topEntry = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  const [topCategory, topScore] = topEntry;

  // Try to match against an existing folder first (case-insensitive)
  const matchedExisting = existingFolders.find(
    (f) => f.toLowerCase() === topCategory.toLowerCase()
  );
  const suggestedFolder = matchedExisting ?? (topScore > 0 ? topCategory : null);

  const confidence: AiConfidence =
    topScore >= 3 ? 'high' : topScore >= 1 ? 'low' : 'uncertain';

  // Extract tags
  const tags: string[] = [];
  for (const [tag, keywords] of Object.entries(TAG_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      tags.push(tag);
    }
  }

  return { folder: suggestedFolder, confidence, tags };
}
