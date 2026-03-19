import { useState } from 'react'
import { Sparkles, X, Loader2, Plus } from 'lucide-react'
import { format, addHours, startOfDay, parseISO } from 'date-fns'
import { useCalendarStore } from '@/store/calendarStore'
import type { CalendarItem, CalendarItemType } from '@/types/calendar'
import { useWorkspaceStore } from '@/store/workspaceStore'

interface AiSuggestion {
  title: string
  type: CalendarItemType
  start_hour: number
  duration_hours: number
  description?: string
}

// Local rule-based planner — no cloud needed for basic scheduling
function generateLocalPlan(date: Date, existingCount: number): AiSuggestion[] {
  const day = format(date, 'EEEE')
  const isWeekend = ['Saturday', 'Sunday'].includes(day)

  if (isWeekend) {
    return [
      { title: 'Morning review', type: 'task', start_hour: 9, duration_hours: 0.5, description: 'Review notes and tasks for the week' },
      { title: 'Deep work block', type: 'task', start_hour: 10, duration_hours: 2, description: 'Focused work session' },
      { title: 'Lunch break', type: 'reminder', start_hour: 12, duration_hours: 1 },
      { title: 'Personal projects', type: 'note', start_hour: 14, duration_hours: 2 },
    ]
  }

  return [
    { title: 'Daily standup', type: 'reminder', start_hour: 9, duration_hours: 0.25, description: 'Team sync' },
    { title: 'Deep work — morning block', type: 'task', start_hour: 9.5, duration_hours: 1.5, description: 'High-focus tasks' },
    { title: 'Email & messages', type: 'task', start_hour: 11, duration_hours: 0.5 },
    { title: 'Lunch', type: 'reminder', start_hour: 12, duration_hours: 1 },
    { title: 'Meetings window', type: 'reminder', start_hour: 14, duration_hours: 2 },
    { title: 'Deep work — afternoon block', type: 'task', start_hour: 16, duration_hours: 1.5 },
    { title: 'End-of-day review', type: 'task', start_hour: 17.5, duration_hours: 0.5, description: 'Review progress and plan tomorrow' },
  ]
}

interface AiPlanPanelProps {
  date: Date
  onClose: () => void
}

export function AiPlanPanel({ date, onClose }: AiPlanPanelProps) {
  const { addItem, getItemsForDay } = useCalendarStore()
  const { notes } = useWorkspaceStore()
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<AiSuggestion[] | null>(null)
  const [added, setAdded] = useState<Set<number>>(new Set())

  const existingItems = getItemsForDay(date)

  const generate = async () => {
    setLoading(true)
    // Simulate async analysis
    await new Promise((r) => setTimeout(r, 800))
    const plan = generateLocalPlan(date, existingItems.length)
    setSuggestions(plan)
    setLoading(false)
  }

  const addSuggestion = (idx: number, s: AiSuggestion) => {
    const start = addHours(startOfDay(date), s.start_hour)
    const end = addHours(start, s.duration_hours)
    addItem({
      title: s.title,
      type: s.type,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      space: 'online',
      status: 'pending',
      description: s.description,
    })
    setAdded((prev) => new Set([...prev, idx]))
  }

  const addAll = () => {
    suggestions?.forEach((s, i) => {
      if (!added.has(i)) addSuggestion(i, s)
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl border border-border bg-background shadow-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500/15">
              <Sparkles size={16} className="text-violet-500" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">AI Day Planner</h2>
              <p className="text-[11px] text-muted-foreground">{format(date, 'EEEE, MMMM d')}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-accent text-muted-foreground">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {!suggestions && !loading && (
            <div className="rounded-xl bg-muted/30 border border-dashed border-border p-6 text-center">
              <Sparkles size={24} className="mx-auto mb-2 text-violet-400" />
              <p className="text-sm font-medium text-foreground mb-1">Generate a smart day plan</p>
              <p className="text-xs text-muted-foreground mb-4">
                AI will suggest a balanced schedule based on your day and existing events
                {existingItems.length > 0 ? ` (${existingItems.length} existing)` : ''}.
              </p>
              <button
                onClick={generate}
                className="flex items-center gap-1.5 mx-auto rounded-xl bg-violet-500 px-4 py-2 text-sm font-medium text-white hover:bg-violet-600 transition-colors"
              >
                <Sparkles size={14} />
                Plan my day
              </button>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center gap-3 py-10 text-muted-foreground">
              <Loader2 size={24} className="animate-spin text-violet-500" />
              <p className="text-sm">Analyzing your schedule…</p>
            </div>
          )}

          {suggestions && !loading && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">
                  {suggestions.length} suggestions
                </p>
                <button
                  onClick={addAll}
                  disabled={added.size === suggestions.length}
                  className="text-xs text-primary font-medium hover:underline disabled:opacity-40"
                >
                  Add all
                </button>
              </div>
              <div className="space-y-2">
                {suggestions.map((s, i) => {
                  const isAdded = added.has(i)
                  const start = addHours(startOfDay(date), s.start_hour)
                  return (
                    <div
                      key={i}
                      className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 transition-opacity ${
                        isAdded ? 'opacity-50 bg-muted/30 border-border' : 'bg-card border-border'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs rounded-full px-2 py-0.5 font-medium
                            ${s.type === 'task' ? 'bg-green-500/15 text-green-700 dark:text-green-300' :
                              s.type === 'reminder' ? 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-300' :
                              'bg-blue-500/15 text-blue-700 dark:text-blue-300'}
                          `}>
                            {s.type}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(start, 'h:mm a')} · {s.duration_hours < 1 ? `${s.duration_hours * 60}m` : `${s.duration_hours}h`}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-foreground mt-0.5">{s.title}</p>
                        {s.description && (
                          <p className="text-[11px] text-muted-foreground mt-0.5">{s.description}</p>
                        )}
                      </div>
                      <button
                        onClick={() => addSuggestion(i, s)}
                        disabled={isAdded}
                        className="shrink-0 flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1 text-[11px] font-medium hover:bg-accent disabled:opacity-40 transition-colors"
                      >
                        <Plus size={11} />
                        {isAdded ? 'Added' : 'Add'}
                      </button>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {suggestions && (
          <div className="border-t border-border px-5 py-3 shrink-0">
            <button
              onClick={onClose}
              className="w-full rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
