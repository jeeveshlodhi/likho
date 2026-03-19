import { format, isToday, isTomorrow, isThisWeek, parseISO, isSameDay } from 'date-fns'
import { useCalendarStore } from '@/store/calendarStore'
import type { CalendarItem } from '@/types/calendar'
import { CALENDAR_TYPE_BG } from '@/types/calendar'
import { FileText, CheckSquare, Bell, Sparkles, Flag, Check, Clock } from 'lucide-react'

const TYPE_ICONS: Record<string, React.ReactNode> = {
  note: <FileText size={14} />,
  task: <CheckSquare size={14} />,
  reminder: <Bell size={14} />,
  ai: <Sparkles size={14} />,
  deadline: <Flag size={14} />,
}

function groupByDay(items: CalendarItem[]): [string, CalendarItem[]][] {
  const map = new Map<string, CalendarItem[]>()
  const sorted = [...items].sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  )
  for (const item of sorted) {
    const key = format(parseISO(item.start_time), 'yyyy-MM-dd')
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(item)
  }
  return Array.from(map.entries())
}

function dayLabel(dateStr: string) {
  const d = parseISO(dateStr)
  if (isToday(d)) return 'Today'
  if (isTomorrow(d)) return 'Tomorrow'
  if (isThisWeek(d)) return format(d, 'EEEE')
  return format(d, 'EEEE, MMMM d, yyyy')
}

interface AgendaViewProps {
  currentDate: Date
  onItemClick: (item: CalendarItem) => void
}

export function AgendaView({ currentDate, onItemClick }: AgendaViewProps) {
  const { getItemsForDateRange } = useCalendarStore()

  // Show 60 days ahead from current date
  const end = new Date(currentDate)
  end.setDate(end.getDate() + 60)
  const items = getItemsForDateRange(currentDate, end)
  const groups = groupByDay(items)

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4">
        <Clock size={32} className="text-muted-foreground/30 mb-3" />
        <p className="text-sm font-medium text-foreground">No upcoming events</p>
        <p className="text-xs text-muted-foreground mt-1">
          Click on the calendar to create an event, or use the + button
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3" style={{ scrollbarWidth: 'thin' }}>
      <div className="max-w-2xl mx-auto space-y-6">
        {groups.map(([dateKey, dayItems]) => (
          <div key={dateKey}>
            {/* Day header */}
            <div className={`sticky top-0 z-10 flex items-center gap-3 py-2 bg-background border-b border-border mb-2`}>
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold
                ${isToday(parseISO(dateKey)) ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}
              `}>
                {format(parseISO(dateKey), 'd')}
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">{dayLabel(dateKey)}</div>
                <div className="text-[10px] text-muted-foreground">
                  {format(parseISO(dateKey), 'MMMM yyyy')} · {dayItems.length} event{dayItems.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>

            {/* Events */}
            <div className="space-y-1.5 pl-11">
              {dayItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onItemClick(item)}
                  className={`w-full text-left flex items-start gap-3 rounded-xl border px-3 py-2.5 transition-colors hover:opacity-90 ${CALENDAR_TYPE_BG[item.type]}
                    ${item.status === 'done' ? 'opacity-60' : ''}
                  `}
                >
                  <span className="mt-0.5 shrink-0">{TYPE_ICONS[item.type]}</span>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium truncate ${item.status === 'done' ? 'line-through' : ''}`}>
                      {item.title || '(No title)'}
                    </div>
                    {!item.all_day && (
                      <div className="text-[11px] opacity-70 mt-0.5">
                        {format(parseISO(item.start_time), 'h:mm a')} – {format(parseISO(item.end_time), 'h:mm a')}
                      </div>
                    )}
                    {item.description && (
                      <div className="text-[11px] opacity-70 mt-0.5 truncate">{item.description}</div>
                    )}
                  </div>
                  {item.status === 'done' && (
                    <Check size={14} className="shrink-0 mt-0.5 opacity-60" />
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
