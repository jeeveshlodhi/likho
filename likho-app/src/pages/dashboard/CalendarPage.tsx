import { useState, useEffect, useCallback } from 'react'
import { parseISO } from 'date-fns'
import { useCalendarStore, makeDefaultItem } from '@/store/calendarStore'
import { CalendarHeader } from '@/components/calendar/CalendarHeader'
import { CalendarSidebar } from '@/components/calendar/CalendarSidebar'
import { WeekView } from '@/components/calendar/WeekView'
import { DayView } from '@/components/calendar/DayView'
import { MonthView } from '@/components/calendar/MonthView'
import { AgendaView } from '@/components/calendar/AgendaView'
import { EventModal } from '@/components/calendar/EventModal'
import { AiPlanPanel } from '@/components/calendar/AiPlanPanel'
import type { CalendarItem, CalendarView } from '@/types/calendar'

export default function CalendarPage() {
  const { currentDate, setCurrentDate, view, setView, addItem } = useCalendarStore()

  const [modalItem, setModalItem] = useState<CalendarItem | null | undefined>(undefined)
  // undefined = closed, null = create mode, CalendarItem = edit mode
  const [defaultSlot, setDefaultSlot] = useState<Date | undefined>(undefined)
  const [aiPanelOpen, setAiPanelOpen] = useState(false)

  const currentDateObj = parseISO(currentDate)

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return

      switch (e.key) {
        case 'c':
        case 'C':
          setDefaultSlot(new Date())
          setModalItem(null)
          break
        case 'ArrowLeft':
          setCurrentDate(navigate(currentDateObj, view, -1).toISOString())
          break
        case 'ArrowRight':
          setCurrentDate(navigate(currentDateObj, view, 1).toISOString())
          break
        case 't':
        case 'T':
          setCurrentDate(new Date().toISOString())
          break
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [currentDate, view])

  const handleItemClick = useCallback((item: CalendarItem) => {
    setModalItem(item)
  }, [])

  const handleSlotClick = useCallback((date: Date) => {
    setDefaultSlot(date)
    setModalItem(null)
  }, [])

  const handleNewEvent = () => {
    setDefaultSlot(new Date())
    setModalItem(null)
  }

  const handleCloseModal = () => {
    setModalItem(undefined)
    setDefaultSlot(undefined)
  }

  return (
    <div className="flex h-full bg-background overflow-hidden">
      {/* Left sidebar */}
      <CalendarSidebar />

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header toolbar */}
        <CalendarHeader
          currentDate={currentDateObj}
          view={view}
          onNavigate={(d) => setCurrentDate(d.toISOString())}
          onViewChange={(v) => setView(v)}
          onNewEvent={handleNewEvent}
          onAiPlan={() => setAiPanelOpen(true)}
        />

        {/* Calendar view */}
        <div className="flex-1 overflow-hidden">
          {view === 'week' && (
            <WeekView
              currentDate={currentDateObj}
              onItemClick={handleItemClick}
              onSlotClick={handleSlotClick}
            />
          )}
          {view === 'day' && (
            <DayView
              currentDate={currentDateObj}
              onItemClick={handleItemClick}
              onSlotClick={handleSlotClick}
            />
          )}
          {view === 'month' && (
            <MonthView
              currentDate={currentDateObj}
              onItemClick={handleItemClick}
              onSlotClick={handleSlotClick}
            />
          )}
          {view === 'agenda' && (
            <AgendaView
              currentDate={currentDateObj}
              onItemClick={handleItemClick}
            />
          )}
        </div>
      </div>

      {/* Event create/edit modal */}
      {modalItem !== undefined && (
        <EventModal
          item={modalItem}
          defaultStart={defaultSlot}
          onClose={handleCloseModal}
        />
      )}

      {/* AI plan panel */}
      {aiPanelOpen && (
        <AiPlanPanel
          date={currentDateObj}
          onClose={() => setAiPanelOpen(false)}
        />
      )}
    </div>
  )
}

// ---- Navigation helper ----
import { addDays, subDays, addWeeks, subWeeks, addMonths, subMonths } from 'date-fns'

function navigate(date: Date, view: CalendarView, dir: -1 | 1): Date {
  switch (view) {
    case 'day':    return dir === 1 ? addDays(date, 1) : subDays(date, 1)
    case 'week':   return dir === 1 ? addWeeks(date, 1) : subWeeks(date, 1)
    case 'month':  return dir === 1 ? addMonths(date, 1) : subMonths(date, 1)
    case 'agenda': return dir === 1 ? addDays(date, 7) : subDays(date, 7)
  }
}
