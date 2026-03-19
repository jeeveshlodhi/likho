import { useState } from 'react'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameMonth, isSameDay,
  addMonths, subMonths, isToday
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface MiniCalendarProps {
  selected: Date
  onSelect: (date: Date) => void
  hasEvents?: (date: Date) => boolean
}

export function MiniCalendar({ selected, onSelect, hasEvents }: MiniCalendarProps) {
  const [display, setDisplay] = useState(() => new Date(selected))

  const monthStart = startOfMonth(display)
  const monthEnd = endOfMonth(display)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })

  return (
    <div className="w-full select-none">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => setDisplay((d) => subMonths(d, 1))}
          className="rounded-md p-1 hover:bg-accent text-muted-foreground"
        >
          <ChevronLeft size={14} />
        </button>
        <span className="text-xs font-semibold text-foreground">
          {format(display, 'MMMM yyyy')}
        </span>
        <button
          onClick={() => setDisplay((d) => addMonths(d, 1))}
          className="rounded-md p-1 hover:bg-accent text-muted-foreground"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
          <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-0.5">
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {days.map((day) => {
          const sameMonth = isSameMonth(day, display)
          const isSelected = isSameDay(day, selected)
          const today = isToday(day)
          const hasEv = hasEvents?.(day)

          return (
            <button
              key={day.toISOString()}
              onClick={() => { onSelect(day); setDisplay(day) }}
              className={`relative flex h-6 w-full items-center justify-center rounded-md text-[11px] transition-colors
                ${!sameMonth ? 'text-muted-foreground/40' : 'text-foreground'}
                ${isSelected ? 'bg-primary text-primary-foreground font-semibold' : ''}
                ${!isSelected && today ? 'font-semibold text-primary' : ''}
                ${!isSelected ? 'hover:bg-accent' : ''}
              `}
            >
              {format(day, 'd')}
              {hasEv && !isSelected && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
