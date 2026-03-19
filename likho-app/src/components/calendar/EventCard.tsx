import { CheckSquare, Bell, Sparkles, FileText, Flag, Check } from 'lucide-react'
import { format } from 'date-fns'
import type { CalendarItem, CalendarItemType } from '@/types/calendar'
import { CALENDAR_TYPE_BG } from '@/types/calendar'

const TYPE_ICONS: Record<CalendarItemType, React.ReactNode> = {
  note: <FileText size={10} />,
  task: <CheckSquare size={10} />,
  reminder: <Bell size={10} />,
  ai: <Sparkles size={10} />,
  deadline: <Flag size={10} />,
}

interface EventCardProps {
  item: CalendarItem
  compact?: boolean         // for month view dots / small cells
  onClick?: () => void
  onDragStart?: (e: React.DragEvent) => void
  style?: React.CSSProperties
  className?: string
}

export function EventCard({ item, compact, onClick, onDragStart, style, className = '' }: EventCardProps) {
  const colorClass = CALENDAR_TYPE_BG[item.type]
  const isDone = item.status === 'done'

  if (compact) {
    return (
      <div
        role="button"
        tabIndex={0}
        draggable
        onDragStart={onDragStart}
        onClick={onClick}
        onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
        className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium border cursor-pointer truncate select-none ${colorClass} ${isDone ? 'opacity-50 line-through' : ''} ${className}`}
        style={style}
        title={item.title || '(No title)'}
      >
        <span className="shrink-0">{TYPE_ICONS[item.type]}</span>
        <span className="truncate">{item.title || '(No title)'}</span>
      </div>
    )
  }

  return (
    <div
      role="button"
      tabIndex={0}
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      className={`group absolute inset-x-0.5 flex flex-col gap-0.5 rounded-md border px-2 py-1.5 text-xs font-medium cursor-pointer overflow-hidden select-none transition-opacity hover:opacity-90 ${colorClass} ${isDone ? 'opacity-60' : ''} ${className}`}
      style={style}
    >
      <div className="flex items-center gap-1 truncate">
        <span className="shrink-0">{TYPE_ICONS[item.type]}</span>
        <span className={`truncate ${isDone ? 'line-through' : ''}`}>
          {item.title || '(No title)'}
        </span>
        {isDone && <Check size={9} className="shrink-0 ml-auto" />}
      </div>
      {!item.all_day && (
        <div className="text-[10px] opacity-70">
          {format(new Date(item.start_time), 'h:mm a')}
        </div>
      )}
    </div>
  )
}
