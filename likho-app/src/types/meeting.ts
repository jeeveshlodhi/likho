export type ActionItemStatus = 'pending' | 'done'
export type ActionItemPriority = 'high' | 'medium' | 'low'

export interface MeetingActionItem {
  id: string
  title: string
  assigned_to?: string
  due_date?: string     // ISO date string
  priority: ActionItemPriority
  status: ActionItemStatus
  linked_note_id?: string
  calendar_item_id?: string  // linked calendar event id
}

export interface AgendaItem {
  id: string
  text: string
  covered: boolean
}

export interface DiscussionTopic {
  id: string
  title: string
  notes: string
  highlights: string[]
}

export interface Decision {
  id: string
  text: string
  owner?: string
  context?: string
}

export interface Blocker {
  id: string
  text: string
  type: 'blocker' | 'risk' | 'dependency'
}

export interface FollowUp {
  id: string
  text: string
}

export interface AiSummary {
  short: string
  key_takeaways: string[]
  action_items: string[]
  suggested_follow_ups: string[]
  generated_at: string
}

export interface MeetingData {
  date_time: string
  duration?: number          // minutes
  location?: string
  platform?: string          // Zoom, Meet, Teams, etc.
  organizer?: string
  participants: string[]
  agenda: AgendaItem[]
  discussions: DiscussionTopic[]
  action_items: MeetingActionItem[]
  decisions: Decision[]
  blockers: Blocker[]
  follow_ups: FollowUp[]
  next_meeting_date?: string
  ai_summary?: AiSummary
  linked_calendar_id?: string
}

export function createDefaultMeetingData(): MeetingData {
  return {
    date_time: new Date().toISOString(),
    participants: [],
    agenda: [],
    discussions: [],
    action_items: [],
    decisions: [],
    blockers: [],
    follow_ups: [],
  }
}
