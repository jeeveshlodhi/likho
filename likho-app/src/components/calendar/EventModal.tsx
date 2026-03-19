import { useState, useEffect } from 'react'
import { format, parseISO, addHours } from 'date-fns'
import { X, Trash2 } from 'lucide-react'
import { useCalendarStore } from '@/store/calendarStore'
import type { CalendarItem, CalendarItemType, CalendarItemStatus } from '@/types/calendar'
import { useNavigate } from 'react-router'
import { useWorkspaceStore } from '@/store/workspaceStore'

interface EventModalProps {
  item?: CalendarItem | null      // null = create mode
  defaultStart?: Date
  onClose: () => void
}

const TYPES: { value: CalendarItemType; label: string }[] = [
  { value: 'task', label: 'Task' },
  { value: 'note', label: 'Note' },
  { value: 'reminder', label: 'Reminder' },
  { value: 'ai', label: 'AI Plan' },
  { value: 'deadline', label: 'Deadline' },
]

const STATUSES: { value: CalendarItemStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'done', label: 'Done' },
  { value: 'cancelled', label: 'Cancelled' },
]

function toLocalInput(iso: string) {
  // datetime-local input needs YYYY-MM-DDTHH:mm
  return iso.slice(0, 16)
}

function fromLocalInput(local: string): string {
  return new Date(local).toISOString()
}

export function EventModal({ item, defaultStart, onClose }: EventModalProps) {
  const { addItem, updateItem, deleteItem } = useCalendarStore()
  const { notes } = useWorkspaceStore()
  const navigate = useNavigate()
  const isEdit = !!item

  const start = item
    ? item.start_time
    : defaultStart
    ? defaultStart.toISOString()
    : new Date().toISOString()
  const end = item
    ? item.end_time
    : addHours(new Date(start), 1).toISOString()

  const [title, setTitle] = useState(item?.title ?? '')
  const [type, setType] = useState<CalendarItemType>(item?.type ?? 'task')
  const [status, setStatus] = useState<CalendarItemStatus>(item?.status ?? 'pending')
  const [startTime, setStartTime] = useState(toLocalInput(start))
  const [endTime, setEndTime] = useState(toLocalInput(end))
  const [allDay, setAllDay] = useState(item?.all_day ?? false)
  const [description, setDescription] = useState(item?.description ?? '')
  const [linkedNoteId, setLinkedNoteId] = useState(item?.linked_note_id ?? '')
  const [space, setSpace] = useState<'offline' | 'online'>(item?.space ?? 'online')

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleSave = () => {
    if (!title.trim()) return
    const payload: Omit<CalendarItem, 'id'> = {
      title: title.trim(),
      type,
      status,
      start_time: fromLocalInput(startTime),
      end_time: fromLocalInput(endTime),
      all_day: allDay,
      description: description.trim() || undefined,
      linked_note_id: linkedNoteId || undefined,
      space,
    }
    if (isEdit && item) {
      updateItem(item.id, payload)
    } else {
      addItem(payload)
    }
    onClose()
  }

  const handleDelete = () => {
    if (item) {
      deleteItem(item.id)
      onClose()
    }
  }

  const openLinkedNote = () => {
    if (linkedNoteId) {
      navigate(`/dashboard/note/${linkedNoteId}`)
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold text-foreground">
            {isEdit ? 'Edit Event' : 'New Event'}
          </h2>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-accent text-muted-foreground">
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Title */}
          <div>
            <input
              autoFocus
              type="text"
              placeholder="Event title…"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {/* Type + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as CalendarItemType)}
                className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as CalendarItemStatus)}
                className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* All day toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
              className="h-4 w-4 rounded accent-primary"
            />
            <span className="text-sm text-foreground">All day</span>
          </label>

          {/* Times */}
          {!allDay && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Start</label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">End</label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>
          )}

          {/* Space */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Space</label>
            <div className="flex gap-2">
              {(['online', 'offline'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSpace(s)}
                  className={`flex-1 rounded-xl py-2 text-sm font-medium transition-colors ${
                    space === s
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Link to note */}
          {notes.length > 0 && (
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Linked Note (optional)
              </label>
              <div className="flex gap-2">
                <select
                  value={linkedNoteId}
                  onChange={(e) => setLinkedNoteId(e.target.value)}
                  className="flex-1 rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="">None</option>
                  {notes.map((n) => (
                    <option key={n.id} value={n.id}>{n.title || 'Untitled'}</option>
                  ))}
                </select>
                {linkedNoteId && (
                  <button
                    onClick={openLinkedNote}
                    className="rounded-xl border border-border bg-muted/30 px-3 py-2 text-xs text-foreground hover:bg-accent"
                  >
                    Open
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Optional notes…"
              className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-5 py-3">
          {isEdit ? (
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 size={14} />
              Delete
            </button>
          ) : <div />}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!title.trim()}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors"
            >
              {isEdit ? 'Save' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
