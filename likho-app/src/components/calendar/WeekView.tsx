import { useRef, useState } from 'react'
import {
  startOfWeek, addDays, format, isSameDay, isToday,
  differenceInMinutes, startOfDay, addMinutes, parseISO, getHours, getMinutes
} from 'date-fns'
import { useCalendarStore } from '@/store/calendarStore'
import { EventCard } from './EventCard'
import type { CalendarItem } from '@/types/calendar'

const HOUR_HEIGHT = 64  // px per hour
const TOTAL_HEIGHT = HOUR_HEIGHT * 24
const HOURS = Array.from({ length: 24 }, (_, i) => i)

interface WeekViewProps {
  currentDate: Date
  onItemClick: (item: CalendarItem) => void
  onSlotClick: (date: Date) => void
}

function positionStyle(item: CalendarItem) {
  const dayStart = startOfDay(parseISO(item.start_time))
  const startMin = differenceInMinutes(parseISO(item.start_time), dayStart)
  const endMin = differenceInMinutes(parseISO(item.end_time), dayStart)
  const duration = Math.max(endMin - startMin, 30)  // min 30 min display
  const top = (startMin / 60) * HOUR_HEIGHT
  const height = (duration / 60) * HOUR_HEIGHT
  return { top, height }
}

export function WeekView({ currentDate, onItemClick, onSlotClick }: WeekViewProps) {
  const { getItemsForDateRange, updateItem } = useCalendarStore()
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  // Dragging state
  const draggingId = useRef<string | null>(null)
  const dragOffsetMin = useRef(0)
  const [dragOverDay, setDragOverDay] = useState<number | null>(null)

  const dayStart = startOfDay(weekStart)
  const dayEnd = addDays(dayStart, 7)
  const allItems = getItemsForDateRange(dayStart, dayEnd)

  const getItemsForDay = (day: Date) =>
    allItems.filter((item) => isSameDay(parseISO(item.start_time), day))

  const handleDragStart = (e: React.DragEvent, item: CalendarItem) => {
    draggingId.current = item.id
    const startMin = getHours(parseISO(item.start_time)) * 60 + getMinutes(parseISO(item.start_time))
    const endMin = getHours(parseISO(item.end_time)) * 60 + getMinutes(parseISO(item.end_time))
    dragOffsetMin.current = endMin - startMin
    e.dataTransfer.effectAllowed = 'move'
  }

  const getMinutesFromY = (y: number, rect: DOMRect) => {
    const relY = y - rect.top
    const pct = Math.max(0, Math.min(1, relY / TOTAL_HEIGHT))
    return Math.round((pct * 24 * 60) / 15) * 15  // snap to 15min
  }

  const handleDrop = (e: React.DragEvent, day: Date) => {
    e.preventDefault()
    if (!draggingId.current) return
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const startMin = getMinutesFromY(e.clientY, rect)
    const newStart = addMinutes(startOfDay(day), startMin)
    const newEnd = addMinutes(newStart, dragOffsetMin.current)
    updateItem(draggingId.current, {
      start_time: newStart.toISOString(),
      end_time: newEnd.toISOString(),
    })
    draggingId.current = null
    setDragOverDay(null)
  }

  const handleSlotClick = (e: React.MouseEvent, day: Date, colRef: HTMLDivElement | null) => {
    if (!colRef) return
    const rect = colRef.getBoundingClientRect()
    const minutes = getMinutesFromY(e.clientY, rect)
    onSlotClick(addMinutes(startOfDay(day), minutes))
  }

  // Now indicator
  const now = new Date()
  const nowTop = (differenceInMinutes(now, startOfDay(now)) / 60) * HOUR_HEIGHT

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Day headers */}
      <div className="flex border-b border-border shrink-0">
        <div className="w-14 shrink-0" />
        {weekDays.map((day) => (
          <div
            key={day.toISOString()}
            className={`flex-1 flex flex-col items-center py-2 border-l border-border first:border-l-0
              ${isToday(day) ? 'bg-primary/5' : ''}
            `}
          >
            <span className="text-[10px] font-medium text-muted-foreground uppercase">
              {format(day, 'EEE')}
            </span>
            <span className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold
              ${isToday(day) ? 'bg-primary text-primary-foreground' : 'text-foreground'}
            `}>
              {format(day, 'd')}
            </span>
          </div>
        ))}
      </div>

      {/* Time grid */}
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

        {/* Day columns */}
        {weekDays.map((day, dayIdx) => {
          let colRef: HTMLDivElement | null = null
          const dayItems = getItemsForDay(day)

          return (
            <div
              key={day.toISOString()}
              className={`flex-1 relative border-l border-border cursor-pointer
                ${dragOverDay === dayIdx ? 'bg-primary/5' : ''}
              `}
              style={{ height: TOTAL_HEIGHT }}
              ref={(el) => { colRef = el }}
              onClick={(e) => handleSlotClick(e, day, colRef)}
              onDragOver={(e) => { e.preventDefault(); setDragOverDay(dayIdx) }}
              onDragLeave={() => setDragOverDay(null)}
              onDrop={(e) => handleDrop(e, day)}
            >
              {/* Hour lines */}
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="absolute inset-x-0 border-t border-border/40"
                  style={{ top: h * HOUR_HEIGHT }}
                />
              ))}
              {/* 30-min lines */}
              {HOURS.map((h) => (
                <div
                  key={`${h}-half`}
                  className="absolute inset-x-0 border-t border-border/20"
                  style={{ top: h * HOUR_HEIGHT + HOUR_HEIGHT / 2 }}
                />
              ))}

              {/* Now indicator */}
              {isToday(day) && (
                <div
                  className="absolute inset-x-0 z-10 flex items-center"
                  style={{ top: nowTop }}
                >
                  <div className="h-2 w-2 rounded-full bg-red-500 -ml-1 shrink-0" />
                  <div className="flex-1 border-t-2 border-red-500" />
                </div>
              )}

              {/* Events */}
              {dayItems.map((item) => {
                const { top, height } = positionStyle(item)
                return (
                  <EventCard
                    key={item.id}
                    item={item}
                    onClick={(e?: any) => {
                      e?.stopPropagation()
                      onItemClick(item)
                    }}
                    onDragStart={(e) => { e.stopPropagation(); handleDragStart(e, item) }}
                    style={{ top, height: height - 2, zIndex: 5 }}
                  />
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
