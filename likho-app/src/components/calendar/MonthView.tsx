import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameMonth, isSameDay,
  isToday, parseISO
} from 'date-fns'
import { useCalendarStore } from '@/store/calendarStore'
import { EventCard } from './EventCard'
import type { CalendarItem } from '@/types/calendar'

const MAX_EVENTS_VISIBLE = 3

interface MonthViewProps {
  currentDate: Date
  onItemClick: (item: CalendarItem) => void
  onSlotClick: (date: Date) => void
}

export function MonthView({ currentDate, onItemClick, onSlotClick }: MonthViewProps) {
  const { getItemsForDateRange } = useCalendarStore()

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })

  const allItems = getItemsForDateRange(gridStart, gridEnd)

  const getItemsForDay = (day: Date) =>
    allItems.filter((item) => isSameDay(parseISO(item.start_time), day))

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header row */}
      <div className="grid grid-cols-7 border-b border-border shrink-0">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground border-r last:border-r-0 border-border">
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="flex-1 grid grid-cols-7 overflow-y-auto" style={{ gridAutoRows: '1fr' }}>
        {days.map((day) => {
          const inMonth = isSameMonth(day, currentDate)
          const today = isToday(day)
          const dayItems = getItemsForDay(day)
          const overflow = dayItems.length - MAX_EVENTS_VISIBLE

          return (
            <div
              key={day.toISOString()}
              onClick={() => onSlotClick(day)}
              className={`min-h-24 border-r border-b border-border last:border-r-0 p-1 cursor-pointer hover:bg-accent/30 transition-colors flex flex-col gap-0.5
                ${!inMonth ? 'bg-muted/20' : ''}
                ${today ? 'bg-primary/5' : ''}
              `}
            >
              {/* Day number */}
              <div className={`text-right pr-0.5 mb-0.5`}>
                <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium
                  ${today ? 'bg-primary text-primary-foreground' : inMonth ? 'text-foreground' : 'text-muted-foreground/50'}
                `}>
                  {format(day, 'd')}
                </span>
              </div>

              {/* Events */}
              {dayItems.slice(0, MAX_EVENTS_VISIBLE).map((item) => (
                <EventCard
                  key={item.id}
                  item={item}
                  compact
                  onClick={(e?: any) => { e?.stopPropagation(); onItemClick(item) }}
                  onDragStart={() => {}}
                />
              ))}

              {overflow > 0 && (
                <span className="text-[10px] text-muted-foreground px-1.5 mt-0.5">
                  +{overflow} more
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
