export type CalendarItemType = 'note' | 'task' | 'reminder' | 'ai' | 'deadline'
export type CalendarSpace = 'offline' | 'online' | 'both'
export type CalendarItemStatus = 'pending' | 'done' | 'cancelled'
export type CalendarView = 'day' | 'week' | 'month' | 'agenda'

export interface CalendarItem {
  id: string
  type: CalendarItemType
  title: string
  start_time: string  // ISO string
  end_time: string    // ISO string
  linked_note_id?: string
  space: 'offline' | 'online'
  status: CalendarItemStatus
  description?: string
  all_day?: boolean
  color?: string      // override default type color
}

export const CALENDAR_TYPE_COLORS: Record<CalendarItemType, string> = {
  note: '#3b82f6',       // blue-500
  task: '#22c55e',       // green-500
  reminder: '#eab308',   // yellow-500
  ai: '#a855f7',         // purple-500
  deadline: '#ef4444',   // red-500
}

export const CALENDAR_TYPE_BG: Record<CalendarItemType, string> = {
  note: 'bg-blue-500/15 border-blue-500/40 text-blue-700 dark:text-blue-300',
  task: 'bg-green-500/15 border-green-500/40 text-green-700 dark:text-green-300',
  reminder: 'bg-yellow-500/15 border-yellow-500/40 text-yellow-700 dark:text-yellow-300',
  ai: 'bg-purple-500/15 border-purple-500/40 text-purple-700 dark:text-purple-300',
  deadline: 'bg-red-500/15 border-red-500/40 text-red-700 dark:text-red-300',
}
