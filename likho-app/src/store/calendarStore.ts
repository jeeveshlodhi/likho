import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nanoid } from 'nanoid'
import { startOfWeek, endOfWeek, startOfDay, endOfDay, addHours } from 'date-fns'
import type { CalendarItem, CalendarItemType, CalendarView, CalendarSpace } from '@/types/calendar'

interface CalendarState {
  items: CalendarItem[]
  currentDate: string        // ISO — the "focus" date for navigation
  view: CalendarView
  activeFilters: CalendarItemType[]
  spaceFilter: CalendarSpace
  selectedItemId: string | null

  // Actions
  addItem: (item: Omit<CalendarItem, 'id'>) => CalendarItem
  updateItem: (id: string, updates: Partial<Omit<CalendarItem, 'id'>>) => void
  deleteItem: (id: string) => void
  setView: (view: CalendarView) => void
  setCurrentDate: (date: string) => void
  toggleFilter: (type: CalendarItemType) => void
  setSpaceFilter: (space: CalendarSpace) => void
  setSelectedItemId: (id: string | null) => void

  // Derived helpers
  getItemsForDateRange: (start: Date, end: Date) => CalendarItem[]
  getItemsForDay: (date: Date) => CalendarItem[]
  getItemsForWeek: (date: Date) => CalendarItem[]
}

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set, get) => ({
      items: [],
      currentDate: new Date().toISOString(),
      view: 'week',
      activeFilters: ['note', 'task', 'reminder', 'ai', 'deadline'],
      spaceFilter: 'both',
      selectedItemId: null,

      addItem: (item) => {
        const newItem: CalendarItem = { ...item, id: nanoid() }
        set((state) => ({ items: [...state.items, newItem] }))
        return newItem
      },

      updateItem: (id, updates) =>
        set((state) => ({
          items: state.items.map((i) => (i.id === id ? { ...i, ...updates } : i)),
        })),

      deleteItem: (id) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
          selectedItemId: state.selectedItemId === id ? null : state.selectedItemId,
        })),

      setView: (view) => set({ view }),
      setCurrentDate: (date) => set({ currentDate: date }),

      toggleFilter: (type) =>
        set((state) => ({
          activeFilters: state.activeFilters.includes(type)
            ? state.activeFilters.filter((f) => f !== type)
            : [...state.activeFilters, type],
        })),

      setSpaceFilter: (space) => set({ spaceFilter: space }),
      setSelectedItemId: (id) => set({ selectedItemId: id }),

      getItemsForDateRange: (start, end) => {
        const { items, activeFilters, spaceFilter } = get()
        return items.filter((item) => {
          if (!activeFilters.includes(item.type)) return false
          if (spaceFilter !== 'both' && item.space !== spaceFilter) return false
          const itemStart = new Date(item.start_time)
          const itemEnd = new Date(item.end_time)
          return itemStart < end && itemEnd > start
        })
      },

      getItemsForDay: (date) => {
        const { getItemsForDateRange } = get()
        return getItemsForDateRange(startOfDay(date), endOfDay(date))
      },

      getItemsForWeek: (date) => {
        const { getItemsForDateRange } = get()
        return getItemsForDateRange(
          startOfWeek(date, { weekStartsOn: 1 }),
          endOfWeek(date, { weekStartsOn: 1 })
        )
      },
    }),
    { name: 'likho-calendar' }
  )
)

// Helper: create a default new item at a given date/time
export function makeDefaultItem(
  date: Date,
  hour = 9,
  type: CalendarItemType = 'task'
): Omit<CalendarItem, 'id'> {
  const start = addHours(startOfDay(date), hour)
  const end = addHours(start, 1)
  return {
    type,
    title: '',
    start_time: start.toISOString(),
    end_time: end.toISOString(),
    space: 'online',
    status: 'pending',
  }
}
