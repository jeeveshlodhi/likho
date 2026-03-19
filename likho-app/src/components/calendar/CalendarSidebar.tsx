import { MiniCalendar } from './MiniCalendar'
import { useCalendarStore } from '@/store/calendarStore'
import { parseISO, isSameDay } from 'date-fns'
import type { CalendarItemType, CalendarSpace } from '@/types/calendar'
import { FileText, CheckSquare, Bell, Sparkles, Flag } from 'lucide-react'

const TYPE_FILTERS: { type: CalendarItemType; label: string; icon: React.ReactNode; colorClass: string }[] = [
  { type: 'note', label: 'Notes', icon: <FileText size={13} />, colorClass: 'text-blue-500' },
  { type: 'task', label: 'Tasks', icon: <CheckSquare size={13} />, colorClass: 'text-green-500' },
  { type: 'reminder', label: 'Reminders', icon: <Bell size={13} />, colorClass: 'text-yellow-500' },
  { type: 'ai', label: 'AI Plans', icon: <Sparkles size={13} />, colorClass: 'text-purple-500' },
  { type: 'deadline', label: 'Deadlines', icon: <Flag size={13} />, colorClass: 'text-red-500' },
]

const SPACE_OPTS: { value: CalendarSpace; label: string }[] = [
  { value: 'both', label: 'All' },
  { value: 'online', label: 'Online' },
  { value: 'offline', label: 'Offline' },
]

export function CalendarSidebar() {
  const {
    currentDate, setCurrentDate,
    activeFilters, toggleFilter,
    spaceFilter, setSpaceFilter,
    items,
  } = useCalendarStore()

  const selected = new Date(currentDate)

  const hasEvents = (date: Date) =>
    items.some((item) => isSameDay(parseISO(item.start_time), date))

  return (
    <div className="flex h-full w-56 shrink-0 flex-col gap-4 border-r border-border bg-sidebar px-3 py-4 overflow-y-auto">
      {/* Mini calendar */}
      <MiniCalendar
        selected={selected}
        onSelect={(d) => setCurrentDate(d.toISOString())}
        hasEvents={hasEvents}
      />

      {/* Type filters */}
      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Filter by type
        </p>
        <div className="space-y-0.5">
          {TYPE_FILTERS.map(({ type, label, icon, colorClass }) => {
            const active = activeFilters.includes(type)
            return (
              <button
                key={type}
                onClick={() => toggleFilter(type)}
                className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors
                  ${active ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent/50'}
                `}
              >
                <span className={active ? colorClass : 'text-muted-foreground/50'}>{icon}</span>
                <span>{label}</span>
                {active && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Space filter */}
      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Space
        </p>
        <div className="flex rounded-xl bg-muted p-0.5">
          {SPACE_OPTS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSpaceFilter(opt.value)}
              className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors ${
                spaceFilter === opt.value
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
