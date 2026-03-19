import { useRef, useState } from 'react'
import {
  format, isToday, differenceInMinutes, startOfDay,
  addMinutes, parseISO, getHours, getMinutes
} from 'date-fns'
import { useCalendarStore } from '@/store/calendarStore'
import { EventCard } from './EventCard'
import type { CalendarItem } from '@/types/calendar'

const HOUR_HEIGHT = 64
const TOTAL_HEIGHT = HOUR_HEIGHT * 24
const HOURS = Array.from({ length: 24 }, (_, i) => i)

interface DayViewProps {
  currentDate: Date
  onItemClick: (item: CalendarItem) => void
  onSlotClick: (date: Date) => void
}

function positionStyle(item: CalendarItem) {
  const dayStart = startOfDay(parseISO(item.start_time))
  const startMin = differenceInMinutes(parseISO(item.start_time), dayStart)
  const endMin = differenceInMinutes(parseISO(item.end_time), dayStart)
  const duration = Math.max(endMin - startMin, 30)
  return {
    top: (startMin / 60) * HOUR_HEIGHT,
    height: (duration / 60) * HOUR_HEIGHT,
  }
}

export function DayView({ currentDate, onItemClick, onSlotClick }: DayViewProps) {
  const { getItemsForDay, updateItem } = useCalendarStore()
  const dayItems = getItemsForDay(currentDate)
  const draggingId = useRef<string | null>(null)
  const dragDuration = useRef(60)
  const [isDragOver, setIsDragOver] = useState(false)

  const getMinutesFromY = (y: number, rect: DOMRect) => {
    const relY = y - rect.top
    const pct = Math.max(0, Math.min(1, relY / TOTAL_HEIGHT))
    return Math.round((pct * 24 * 60) / 15) * 15
  }

  const handleDragStart = (e: React.DragEvent, item: CalendarItem) => {
    draggingId.current = item.id
    const startMin = getHours(parseISO(item.start_time)) * 60 + getMinutes(parseISO(item.start_time))
    const endMin = getHours(parseISO(item.end_time)) * 60 + getMinutes(parseISO(item.end_time))
    dragDuration.current = endMin - startMin
    e.dataTransfer.effectAllowed = 'move'
  }

  let colRef: HTMLDivElement | null = null

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (!draggingId.current || !colRef) return
    const rect = colRef.getBoundingClientRect()
    const startMin = getMinutesFromY(e.clientY, rect)
    const newStart = addMinutes(startOfDay(currentDate), startMin)
    const newEnd = addMinutes(newStart, dragDuration.current)
    updateItem(draggingId.current, {
      start_time: newStart.toISOString(),
      end_time: newEnd.toISOString(),
    })
    draggingId.current = null
    setIsDragOver(false)
  }

  const now = new Date()
  const nowTop = isToday(currentDate)
    ? (differenceInMinutes(now, startOfDay(now)) / 60) * HOUR_HEIGHT
    : null

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Day header */}
      <div className="flex items-center justify-center gap-3 border-b border-border py-3 shrink-0">
        <span className="text-sm font-medium text-muted-foreground">
          {format(currentDate, 'EEEE')}
        </span>
        <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold
          ${isToday(currentDate) ? 'bg-primary text-primary-foreground' : 'text-foreground'}
        `}>
          {format(currentDate, 'd')}
        </span>
        <span className="text-sm font-medium text-muted-foreground">
          {format(currentDate, 'MMMM yyyy')}
        </span>
      </div>

      {/* Grid */}
      <div className="flex flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
        {/* Hour labels */}
        <div className="w-14 shrink-0 relative" style={{ height: TOTAL_HEIGHT }}>
          {HOURS.map((h) => (
            <div
              key={h}
              className="absolute w-full pr-2 text-right"
              style={{ top: h * HOUR_HEIGHT - 8 }}
            >
              {h > 0 && (
                <span className="text-[10px] text-muted-foreground">
                  {format(new Date().setHours(h, 0, 0, 0), 'h a')}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Single day column */}
        <div
          className={`flex-1 relative border-l border-border cursor-pointer ${isDragOver ? 'bg-primary/5' : ''}`}
          style={{ height: TOTAL_HEIGHT }}
          ref={(el) => { colRef = el }}
          onClick={(e) => {
            if (!colRef) return
            const rect = colRef.getBoundingClientRect()
            const minutes = getMinutesFromY(e.clientY, rect)
            onSlotClick(addMinutes(startOfDay(currentDate), minutes))
          }}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
        >
          {HOURS.map((h) => (
            <div
              key={h}
              className="absolute inset-x-0 border-t border-border/40"
              style={{ top: h * HOUR_HEIGHT }}
            />
          ))}
          {HOURS.map((h) => (
            <div
              key={`${h}-half`}
              className="absolute inset-x-0 border-t border-border/20"
              style={{ top: h * HOUR_HEIGHT + HOUR_HEIGHT / 2 }}
            />
          ))}

          {nowTop !== null && (
            <div className="absolute inset-x-0 z-10 flex items-center" style={{ top: nowTop }}>
              <div className="h-2 w-2 rounded-full bg-red-500 -ml-1 shrink-0" />
              <div className="flex-1 border-t-2 border-red-500" />
            </div>
          )}

          {dayItems.map((item) => {
            const { top, height } = positionStyle(item)
            return (
              <EventCard
                key={item.id}
                item={item}
                onClick={(e?: any) => { e?.stopPropagation(); onItemClick(item) }}
                onDragStart={(e) => { e.stopPropagation(); handleDragStart(e, item) }}
                style={{ top, height: height - 2, zIndex: 5 }}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
