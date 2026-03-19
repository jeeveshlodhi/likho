import {
  format, addDays, subDays, addWeeks, subWeeks,
  addMonths, subMonths, startOfWeek, endOfWeek,
  isToday
} from 'date-fns'
import { ChevronLeft, ChevronRight, Plus, Sparkles } from 'lucide-react'
import type { CalendarView } from '@/types/calendar'

interface CalendarHeaderProps {
  currentDate: Date
  view: CalendarView
  onNavigate: (date: Date) => void
  onViewChange: (view: CalendarView) => void
  onNewEvent: () => void
  onAiPlan: () => void
}

const VIEWS: { value: CalendarView; label: string }[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'agenda', label: 'Agenda' },
]

function getTitle(date: Date, view: CalendarView): string {
  switch (view) {
    case 'day':
      return format(date, 'EEEE, MMMM d, yyyy')
    case 'week': {
      const ws = startOfWeek(date, { weekStartsOn: 1 })
      const we = endOfWeek(date, { weekStartsOn: 1 })
      if (format(ws, 'MMM yyyy') === format(we, 'MMM yyyy')) {
        return `${format(ws, 'MMM d')} – ${format(we, 'd, yyyy')}`
      }
      return `${format(ws, 'MMM d')} – ${format(we, 'MMM d, yyyy')}`
    }
    case 'month':
      return format(date, 'MMMM yyyy')
    case 'agenda':
      return 'Upcoming'
  }
}

function navigate(date: Date, view: CalendarView, dir: -1 | 1): Date {
  switch (view) {
    case 'day':
      return dir === 1 ? addDays(date, 1) : subDays(date, 1)
    case 'week':
      return dir === 1 ? addWeeks(date, 1) : subWeeks(date, 1)
    case 'month':
      return dir === 1 ? addMonths(date, 1) : subMonths(date, 1)
    case 'agenda':
      return dir === 1 ? addDays(date, 7) : subDays(date, 7)
  }
}

export function CalendarHeader({
  currentDate, view, onNavigate, onViewChange, onNewEvent, onAiPlan
}: CalendarHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 shrink-0 bg-background">
      {/* Left: Nav */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onNavigate(new Date())}
          className="rounded-xl border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors"
        >
          Today
        </button>
        <div className="flex items-center">
          <button
            onClick={() => onNavigate(navigate(currentDate, view, -1))}
            className="rounded-l-md border border-border p-1.5 hover:bg-accent text-muted-foreground transition-colors"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            onClick={() => onNavigate(navigate(currentDate, view, 1))}
            className="rounded-r-md border-t border-b border-r border-border p-1.5 hover:bg-accent text-muted-foreground transition-colors"
          >
            <ChevronRight size={15} />
          </button>
        </div>
        <h2 className="text-sm font-semibold text-foreground min-w-40">
          {getTitle(currentDate, view)}
        </h2>
      </div>

      {/* Right: View switcher + actions */}
      <div className="flex items-center gap-2">
        {/* View switcher */}
        <div className="flex rounded-xl bg-muted p-0.5">
          {VIEWS.map((v) => (
            <button
              key={v.value}
              onClick={() => onViewChange(v.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                view === v.value
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* AI Plan */}
        <button
          onClick={onAiPlan}
          className="flex items-center gap-1.5 rounded-xl border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-700 dark:text-violet-300 hover:bg-violet-500/20 transition-colors"
        >
          <Sparkles size={13} />
          Plan my day
        </button>

        {/* New event */}
        <button
          onClick={onNewEvent}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus size={14} />
          New Event
        </button>
      </div>
    </div>
  )
}
