import { useMemo, useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router'
import { nanoid } from 'nanoid'
import { format, parseISO } from 'date-fns'
import {
  CalendarDays, Clock, MapPin, Users, ChevronDown, ChevronRight,
  Plus, Trash2, Check, AlertTriangle, Lightbulb, ArrowRight,
  Sparkles, Loader2, RefreshCw, CheckSquare, Flag, X,
  MonitorPlay, Link2,
} from 'lucide-react'
import { useWorkspaceStore } from '@/store/workspaceStore'
import { useAutoSave } from '@/hooks/useAutoSave'
import { useAuthStore } from '@/store/authStore'
import { useCalendarStore } from '@/store/calendarStore'
import Breadcrumb from '@/components/dashboard/Breadcrumb'
import NoteTitleInput from '@/components/dashboard/NoteTitleInput'
import { CloudAiService } from '@/lib/cloudAiService'
import type {
  MeetingData, MeetingActionItem, AgendaItem, DiscussionTopic,
  Decision, Blocker, FollowUp, AiSummary, ActionItemPriority,
} from '@/types/meeting'
import { createDefaultMeetingData } from '@/types/meeting'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toLocalDateTimeInput(iso: string) {
  try { return format(parseISO(iso), "yyyy-MM-dd'T'HH:mm") } catch { return '' }
}

const PRIORITY_STYLES: Record<ActionItemPriority, string> = {
  high: 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30',
  medium: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 border-yellow-500/30',
  low: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
}

// ─── Collapsible Section wrapper ──────────────────────────────────────────────

function Section({
  icon, title, count, accent, children, defaultOpen = true,
}: {
  icon: React.ReactNode; title: string; count?: number
  accent?: string; children: React.ReactNode; defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2.5 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
      >
        <span className={accent ?? 'text-muted-foreground'}>{icon}</span>
        <span className="flex-1 text-sm font-semibold text-foreground">{title}</span>
        {count !== undefined && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {count}
          </span>
        )}
        {open ? <ChevronDown size={14} className="text-muted-foreground" /> : <ChevronRight size={14} className="text-muted-foreground" />}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  )
}

// ─── Agenda Section ───────────────────────────────────────────────────────────

function AgendaSection({ items, onChange }: { items: AgendaItem[]; onChange: (v: AgendaItem[]) => void }) {
  const [draft, setDraft] = useState('')
  const add = () => {
    if (!draft.trim()) return
    onChange([...items, { id: nanoid(), text: draft.trim(), covered: false }])
    setDraft('')
  }
  return (
    <Section icon={<CheckSquare size={16} />} title="Agenda" count={items.length}>
      <div className="space-y-1.5 mb-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-2 group">
            <input
              type="checkbox"
              checked={item.covered}
              onChange={() => onChange(items.map((i) => i.id === item.id ? { ...i, covered: !i.covered } : i))}
              className="h-4 w-4 rounded accent-primary shrink-0"
            />
            <span className={`flex-1 text-sm ${item.covered ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
              {item.text}
            </span>
            <button
              onClick={() => onChange(items.filter((i) => i.id !== item.id))}
              className="opacity-0 group-hover:opacity-100 rounded p-0.5 hover:bg-accent text-muted-foreground"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder="Add agenda item…"
          className="flex-1 rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button onClick={add} className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors">
          Add
        </button>
      </div>
    </Section>
  )
}

// ─── Discussion Section ───────────────────────────────────────────────────────

function DiscussionSection({ topics, onChange }: { topics: DiscussionTopic[]; onChange: (v: DiscussionTopic[]) => void }) {
  const addTopic = () =>
    onChange([...topics, { id: nanoid(), title: '', notes: '', highlights: [] }])

  const update = (id: string, patch: Partial<DiscussionTopic>) =>
    onChange(topics.map((t) => t.id === id ? { ...t, ...patch } : t))

  return (
    <Section icon={<MonitorPlay size={16} />} title="Discussion Notes" count={topics.length}>
      <div className="space-y-3 mb-3">
        {topics.map((topic) => (
          <div key={topic.id} className="rounded-lg border border-border bg-muted/20 p-3 space-y-2 group">
            <div className="flex items-center gap-2">
              <input
                value={topic.title}
                onChange={(e) => update(topic.id, { title: e.target.value })}
                placeholder="Topic title…"
                className="flex-1 rounded-md border-0 bg-transparent text-sm font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <button
                onClick={() => onChange(topics.filter((t) => t.id !== topic.id))}
                className="opacity-0 group-hover:opacity-100 rounded p-0.5 hover:bg-accent text-muted-foreground"
              >
                <Trash2 size={12} />
              </button>
            </div>
            <textarea
              value={topic.notes}
              onChange={(e) => update(topic.id, { notes: e.target.value })}
              placeholder="Key discussion points, highlights, decisions…"
              rows={3}
              className="w-full rounded-md border-0 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none"
            />
          </div>
        ))}
      </div>
      <button
        onClick={addTopic}
        className="flex items-center gap-1.5 text-sm text-primary hover:underline"
      >
        <Plus size={14} /> Add topic
      </button>
    </Section>
  )
}

// ─── Action Items Section ─────────────────────────────────────────────────────

function ActionItemsSection({
  items, onChange, noteId,
}: {
  items: MeetingActionItem[]
  onChange: (v: MeetingActionItem[]) => void
  noteId: string
}) {
  const { addItem: addCalendarItem } = useCalendarStore()
  const [draft, setDraft] = useState('')

  const add = () => {
    if (!draft.trim()) return
    onChange([...items, {
      id: nanoid(), title: draft.trim(),
      priority: 'medium', status: 'pending',
    }])
    setDraft('')
  }

  const update = (id: string, patch: Partial<MeetingActionItem>) =>
    onChange(items.map((i) => i.id === id ? { ...i, ...patch } : i))

  const sendToCalendar = (item: MeetingActionItem) => {
    const start = item.due_date ? new Date(item.due_date) : new Date()
    start.setHours(9, 0, 0, 0)
    const end = new Date(start.getTime() + 60 * 60 * 1000)
    const calItem = addCalendarItem({
      type: 'task',
      title: item.title,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      space: 'online',
      status: 'pending',
      linked_note_id: noteId,
      description: item.assigned_to ? `Assigned to: ${item.assigned_to}` : undefined,
    })
    update(item.id, { calendar_item_id: calItem.id })
  }

  return (
    <Section icon={<CheckSquare size={16} />} title="Action Items" count={items.length} accent="text-green-500">
      <div className="space-y-2 mb-3">
        {items.map((item) => (
          <div key={item.id} className="group rounded-xl border border-border bg-background p-3 space-y-2">
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={item.status === 'done'}
                onChange={() => update(item.id, { status: item.status === 'done' ? 'pending' : 'done' })}
                className="mt-0.5 h-4 w-4 rounded accent-primary shrink-0"
              />
              <input
                value={item.title}
                onChange={(e) => update(item.id, { title: e.target.value })}
                placeholder="Task title…"
                className={`flex-1 bg-transparent text-sm font-medium focus:outline-none ${item.status === 'done' ? 'line-through text-muted-foreground' : 'text-foreground'}`}
              />
              <button
                onClick={() => onChange(items.filter((i) => i.id !== item.id))}
                className="opacity-0 group-hover:opacity-100 rounded p-0.5 hover:bg-accent text-muted-foreground shrink-0"
              >
                <Trash2 size={12} />
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2 pl-6">
              {/* Assigned to */}
              <input
                value={item.assigned_to ?? ''}
                onChange={(e) => update(item.id, { assigned_to: e.target.value || undefined })}
                placeholder="@assign"
                className="w-24 rounded-md bg-muted/40 px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
              {/* Due date */}
              <input
                type="date"
                value={item.due_date?.slice(0, 10) ?? ''}
                onChange={(e) => update(item.id, { due_date: e.target.value || undefined })}
                className="rounded-md bg-muted/40 px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
              {/* Priority */}
              <select
                value={item.priority}
                onChange={(e) => update(item.id, { priority: e.target.value as ActionItemPriority })}
                className={`rounded-md border px-2 py-1 text-xs font-medium focus:outline-none ${PRIORITY_STYLES[item.priority]}`}
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              {/* Add to calendar */}
              {!item.calendar_item_id ? (
                <button
                  onClick={() => sendToCalendar(item)}
                  className="flex items-center gap-1 rounded-md bg-sky-500/10 px-2 py-1 text-[11px] font-medium text-sky-600 dark:text-sky-400 hover:bg-sky-500/20 transition-colors"
                >
                  <CalendarDays size={11} /> Add to calendar
                </button>
              ) : (
                <span className="flex items-center gap-1 text-[11px] text-green-600 dark:text-green-400">
                  <Check size={11} /> In calendar
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder="Add action item… (Enter to add)"
          className="flex-1 rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button onClick={add} className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors">
          Add
        </button>
      </div>
    </Section>
  )
}

// ─── Decisions Section ────────────────────────────────────────────────────────

function DecisionsSection({ items, onChange }: { items: Decision[]; onChange: (v: Decision[]) => void }) {
  const [draft, setDraft] = useState('')
  const add = () => {
    if (!draft.trim()) return
    onChange([...items, { id: nanoid(), text: draft.trim() }])
    setDraft('')
  }
  const update = (id: string, patch: Partial<Decision>) =>
    onChange(items.map((d) => d.id === id ? { ...d, ...patch } : d))

  return (
    <Section icon={<Lightbulb size={16} />} title="Decisions Made" count={items.length} accent="text-emerald-500">
      <div className="space-y-2 mb-3">
        {items.map((d) => (
          <div key={d.id} className="group flex gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
            <Lightbulb size={14} className="text-emerald-500 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1.5">
              <input
                value={d.text}
                onChange={(e) => update(d.id, { text: e.target.value })}
                className="w-full bg-transparent text-sm text-foreground focus:outline-none"
              />
              <div className="flex gap-2">
                <input
                  value={d.owner ?? ''}
                  onChange={(e) => update(d.id, { owner: e.target.value || undefined })}
                  placeholder="Owner"
                  className="w-28 rounded-md bg-muted/40 px-2 py-0.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                <input
                  value={d.context ?? ''}
                  onChange={(e) => update(d.id, { context: e.target.value || undefined })}
                  placeholder="Context / reason"
                  className="flex-1 rounded-md bg-muted/40 px-2 py-0.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
              </div>
            </div>
            <button
              onClick={() => onChange(items.filter((i) => i.id !== d.id))}
              className="opacity-0 group-hover:opacity-100 rounded p-0.5 hover:bg-accent text-muted-foreground shrink-0"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder="Record a decision…"
          className="flex-1 rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button onClick={add} className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors">
          Add
        </button>
      </div>
    </Section>
  )
}

// ─── Blockers Section ─────────────────────────────────────────────────────────

function BlockersSection({ items, onChange }: { items: Blocker[]; onChange: (v: Blocker[]) => void }) {
  const [draft, setDraft] = useState('')
  const add = () => {
    if (!draft.trim()) return
    onChange([...items, { id: nanoid(), text: draft.trim(), type: 'blocker' }])
    setDraft('')
  }
  const BLOCKER_STYLES = {
    blocker: 'border-red-500/20 bg-red-500/5 text-red-600 dark:text-red-400',
    risk: 'border-orange-500/20 bg-orange-500/5 text-orange-600 dark:text-orange-400',
    dependency: 'border-blue-500/20 bg-blue-500/5 text-blue-600 dark:text-blue-400',
  }
  return (
    <Section icon={<AlertTriangle size={16} />} title="Blockers & Risks" count={items.length} accent="text-red-500" defaultOpen={false}>
      <div className="space-y-2 mb-3">
        {items.map((b) => (
          <div key={b.id} className={`group flex gap-2 rounded-xl border p-3 ${BLOCKER_STYLES[b.type]}`}>
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1.5">
              <input
                value={b.text}
                onChange={(e) => onChange(items.map((i) => i.id === b.id ? { ...i, text: e.target.value } : i))}
                className="w-full bg-transparent text-sm text-foreground focus:outline-none"
              />
              <select
                value={b.type}
                onChange={(e) => onChange(items.map((i) => i.id === b.id ? { ...i, type: e.target.value as Blocker['type'] } : i))}
                className="rounded-md bg-muted/40 px-2 py-0.5 text-xs text-foreground focus:outline-none"
              >
                <option value="blocker">Blocker</option>
                <option value="risk">Risk</option>
                <option value="dependency">Dependency</option>
              </select>
            </div>
            <button
              onClick={() => onChange(items.filter((i) => i.id !== b.id))}
              className="opacity-0 group-hover:opacity-100 rounded p-0.5 hover:bg-accent text-muted-foreground shrink-0"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder="Describe a blocker or risk…"
          className="flex-1 rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button onClick={add} className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors">
          Add
        </button>
      </div>
    </Section>
  )
}

// ─── Follow-ups Section ───────────────────────────────────────────────────────

function FollowUpsSection({
  items, onChange, nextMeeting, onNextMeeting,
}: {
  items: FollowUp[]
  onChange: (v: FollowUp[]) => void
  nextMeeting?: string
  onNextMeeting: (v: string) => void
}) {
  const [draft, setDraft] = useState('')
  const add = () => {
    if (!draft.trim()) return
    onChange([...items, { id: nanoid(), text: draft.trim() }])
    setDraft('')
  }
  return (
    <Section icon={<ArrowRight size={16} />} title="Follow-ups" count={items.length} accent="text-violet-500" defaultOpen={false}>
      <div className="space-y-1.5 mb-3">
        {items.map((f) => (
          <div key={f.id} className="flex items-center gap-2 group">
            <ArrowRight size={12} className="text-violet-400 shrink-0" />
            <input
              value={f.text}
              onChange={(e) => onChange(items.map((i) => i.id === f.id ? { ...i, text: e.target.value } : i))}
              className="flex-1 bg-transparent text-sm text-foreground focus:outline-none"
            />
            <button
              onClick={() => onChange(items.filter((i) => i.id !== f.id))}
              className="opacity-0 group-hover:opacity-100 rounded p-0.5 hover:bg-accent text-muted-foreground"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2 mb-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder="Add follow-up…"
          className="flex-1 rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button onClick={add} className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors">
          Add
        </button>
      </div>
      {/* Next meeting */}
      <div className="flex items-center gap-3 pt-2 border-t border-border">
        <CalendarDays size={14} className="text-muted-foreground shrink-0" />
        <span className="text-xs font-medium text-muted-foreground">Next meeting:</span>
        <input
          type="datetime-local"
          value={nextMeeting ?? ''}
          onChange={(e) => onNextMeeting(e.target.value)}
          className="flex-1 rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
    </Section>
  )
}

// ─── AI Summary Section ───────────────────────────────────────────────────────

function AiSummarySection({
  summary, onGenerate, loading,
}: {
  summary?: AiSummary
  onGenerate: () => void
  loading: boolean
}) {
  return (
    <Section icon={<Sparkles size={16} />} title="AI Summary" accent="text-violet-500">
      {!summary && !loading && (
        <div className="rounded-xl border border-dashed border-violet-500/30 bg-violet-500/5 p-5 text-center">
          <Sparkles size={20} className="mx-auto mb-2 text-violet-400" />
          <p className="text-sm font-medium text-foreground mb-1">Generate meeting summary</p>
          <p className="text-xs text-muted-foreground mb-3">
            AI will extract action items, key decisions, and suggest follow-ups.
          </p>
          <button
            onClick={onGenerate}
            className="flex items-center gap-1.5 mx-auto rounded-xl bg-violet-500 px-4 py-2 text-sm font-medium text-white hover:bg-violet-600 transition-colors"
          >
            <Sparkles size={14} /> Summarize meeting
          </button>
        </div>
      )}
      {loading && (
        <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
          <Loader2 size={20} className="animate-spin text-violet-500" />
          <p className="text-sm">Analyzing meeting notes…</p>
        </div>
      )}
      {summary && !loading && (
        <div className="space-y-4">
          {/* Short summary */}
          <div className="rounded-xl bg-violet-500/8 border border-violet-500/15 px-4 py-3">
            <p className="text-sm text-foreground leading-relaxed">{summary.short}</p>
            <p className="text-[10px] text-muted-foreground mt-2">
              Generated {format(parseISO(summary.generated_at), 'MMM d, yyyy h:mm a')}
            </p>
          </div>
          {summary.key_takeaways.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1.5">Key Takeaways</p>
              <ul className="space-y-1">
                {summary.key_takeaways.map((t, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {summary.suggested_follow_ups.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1.5">Suggested Follow-ups</p>
              <ul className="space-y-1">
                {summary.suggested_follow_ups.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <ArrowRight size={12} className="mt-1 shrink-0 text-violet-400" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <button
            onClick={onGenerate}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw size={11} /> Regenerate
          </button>
        </div>
      )}
    </Section>
  )
}

// ─── Participants Sidebar ─────────────────────────────────────────────────────

function ParticipantsSidebar({
  participants, onChange,
}: {
  participants: string[]
  onChange: (v: string[]) => void
}) {
  const [draft, setDraft] = useState('')
  const add = () => {
    const name = draft.trim()
    if (!name || participants.includes(name)) return
    onChange([...participants, name])
    setDraft('')
  }
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Users size={14} className="text-muted-foreground" />
        <span className="text-xs font-semibold text-foreground">Participants</span>
        <span className="ml-auto text-[10px] text-muted-foreground">{participants.length}</span>
      </div>
      <div className="space-y-1.5 mb-3">
        {participants.map((p) => (
          <div key={p} className="flex items-center gap-2 group">
            <div className="h-6 w-6 shrink-0 rounded-full bg-primary/15 flex items-center justify-center text-[10px] font-bold text-primary uppercase">
              {p[0]}
            </div>
            <span className="flex-1 text-xs text-foreground truncate">{p}</span>
            <button
              onClick={() => onChange(participants.filter((x) => x !== p))}
              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground"
            >
              <X size={11} />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-1.5">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder="Add participant…"
          className="flex-1 rounded-lg border border-border bg-muted/30 px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
        />
        <button onClick={add} className="rounded-lg bg-muted px-2 py-1.5 hover:bg-accent transition-colors">
          <Plus size={12} className="text-muted-foreground" />
        </button>
      </div>
    </div>
  )
}

// ─── Main MeetingEditor ───────────────────────────────────────────────────────

export default function MeetingEditor() {
  const { noteId } = useParams<{ noteId: string }>()
  const navigate = useNavigate()
  const { notes, setActiveNote, updateNote } = useWorkspaceStore()
  const { isAuthenticated, isGuest } = useAuthStore()
  const isOnline = isAuthenticated && !isGuest

  const note = useMemo(() => notes.find((n) => n.id === noteId), [notes, noteId])

  const [data, setData] = useState<MeetingData>(() => {
    if (note?.content && typeof note.content === 'object' && 'participants' in note.content) {
      return note.content as MeetingData
    }
    return createDefaultMeetingData()
  })
  const [aiLoading, setAiLoading] = useState(false)

  const { save } = useAutoSave(noteId ?? '')

  useEffect(() => { if (noteId) setActiveNote(noteId) }, [noteId, setActiveNote])
  useEffect(() => {
    if (!note && noteId) navigate('/dashboard', { replace: true })
  }, [note, noteId, navigate])

  // Sync content from store if note loads after mount
  useEffect(() => {
    if (note?.content && typeof note.content === 'object' && 'participants' in note.content) {
      setData(note.content as MeetingData)
    }
  }, [note?.id]) // only on note id change, not every content update

  const updateData = useCallback((patch: Partial<MeetingData>) => {
    setData((prev) => {
      const next = { ...prev, ...patch }
      updateNote(noteId!, { content: next })
      save({ content: next })
      return next
    })
  }, [noteId, updateNote, save])

  const generateAiSummary = async () => {
    if (!isOnline) return
    setAiLoading(true)
    try {
      // Build a text summary of all sections to send to AI
      const sections: string[] = []
      if (note?.title) sections.push(`Meeting: ${note.title}`)
      if (data.agenda.length) sections.push(`Agenda: ${data.agenda.map((a) => a.text).join(', ')}`)
      if (data.discussions.length) {
        sections.push(data.discussions.map((d) => `${d.title}: ${d.notes}`).join('\n'))
      }
      if (data.action_items.length) {
        sections.push(`Action items: ${data.action_items.map((a) => a.title).join(', ')}`)
      }
      if (data.decisions.length) {
        sections.push(`Decisions: ${data.decisions.map((d) => d.text).join(', ')}`)
      }
      const contentText = sections.join('\n\n')

      const res = await CloudAiService.meetingExtract({
        content: contentText,
        title: note?.title ?? '',
      })

      const aiSummary: AiSummary = {
        short: res.action_items.length > 0
          ? `This meeting covered ${data.discussions.length} topic(s) with ${res.action_items.length} action item(s) identified.`
          : `Meeting notes summarized. ${res.decisions.length} decision(s) recorded.`,
        key_takeaways: res.decisions.slice(0, 5),
        action_items: res.action_items.map((a) => a.text),
        suggested_follow_ups: res.open_questions.slice(0, 3),
        generated_at: new Date().toISOString(),
      }

      // Auto-populate action items from AI if none exist
      if (data.action_items.length === 0 && res.action_items.length > 0) {
        const newItems: MeetingActionItem[] = res.action_items.map((a) => ({
          id: nanoid(),
          title: a.text,
          assigned_to: a.assignee ?? undefined,
          due_date: a.due_date ?? undefined,
          priority: 'medium' as ActionItemPriority,
          status: 'pending' as const,
        }))
        updateData({ ai_summary: aiSummary, action_items: newItems })
      } else {
        updateData({ ai_summary: aiSummary })
      }
    } catch {
      // silent fail
    } finally {
      setAiLoading(false)
    }
  }

  if (!note) return null

  return (
    <div className="flex h-full overflow-hidden bg-background">
      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Sticky top bar */}
        <div className="shrink-0 border-b border-border px-6 py-2">
          <Breadcrumb note={note} />
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5" style={{ scrollbarWidth: 'thin' }}>
          <div className="max-w-3xl mx-auto space-y-5">
            {/* Title + date subtitle */}
            <div>
              <NoteTitleInput note={note} placeholder="What is this meeting about?" />
              <p className="text-sm text-muted-foreground -mt-0.5">
                {format(parseISO(data.date_time), 'EEEE, MMMM d, yyyy · h:mm a')}
                {data.duration ? ` · ${data.duration} min` : ''}
                {data.platform ? ` · ${data.platform}` : ''}
              </p>
            </div>

            {/* Meeting header card */}
            <div className="rounded-xl border border-border bg-card p-4 grid grid-cols-2 gap-3">
              {/* Date & time */}
              <div className="flex items-center gap-2">
                <CalendarDays size={14} className="text-muted-foreground shrink-0" />
                <input
                  type="datetime-local"
                  value={toLocalDateTimeInput(data.date_time)}
                  onChange={(e) => updateData({ date_time: e.target.value ? new Date(e.target.value).toISOString() : new Date().toISOString() })}
                  className="flex-1 rounded-lg border border-border bg-muted/30 px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>
              {/* Duration */}
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-muted-foreground shrink-0" />
                <input
                  type="number"
                  value={data.duration ?? ''}
                  onChange={(e) => updateData({ duration: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="Duration (mins)"
                  className="flex-1 rounded-lg border border-border bg-muted/30 px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>
              {/* Location */}
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-muted-foreground shrink-0" />
                <input
                  value={data.location ?? ''}
                  onChange={(e) => updateData({ location: e.target.value || undefined })}
                  placeholder="Location"
                  className="flex-1 rounded-lg border border-border bg-muted/30 px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>
              {/* Platform */}
              <div className="flex items-center gap-2">
                <MonitorPlay size={14} className="text-muted-foreground shrink-0" />
                <input
                  value={data.platform ?? ''}
                  onChange={(e) => updateData({ platform: e.target.value || undefined })}
                  placeholder="Platform (Zoom, Meet…)"
                  className="flex-1 rounded-lg border border-border bg-muted/30 px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>
              {/* Organizer */}
              <div className="col-span-2 flex items-center gap-2">
                <Users size={14} className="text-muted-foreground shrink-0" />
                <input
                  value={data.organizer ?? ''}
                  onChange={(e) => updateData({ organizer: e.target.value || undefined })}
                  placeholder="Organizer"
                  className="flex-1 rounded-lg border border-border bg-muted/30 px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>
            </div>

            {/* Sections */}
            <AgendaSection
              items={data.agenda}
              onChange={(agenda) => updateData({ agenda })}
            />
            <DiscussionSection
              topics={data.discussions}
              onChange={(discussions) => updateData({ discussions })}
            />
            <ActionItemsSection
              items={data.action_items}
              onChange={(action_items) => updateData({ action_items })}
              noteId={noteId ?? ''}
            />
            <DecisionsSection
              items={data.decisions}
              onChange={(decisions) => updateData({ decisions })}
            />
            <BlockersSection
              items={data.blockers}
              onChange={(blockers) => updateData({ blockers })}
            />
            <FollowUpsSection
              items={data.follow_ups}
              onChange={(follow_ups) => updateData({ follow_ups })}
              nextMeeting={data.next_meeting_date}
              onNextMeeting={(v) => updateData({ next_meeting_date: v || undefined })}
            />
            <AiSummarySection
              summary={data.ai_summary}
              onGenerate={generateAiSummary}
              loading={aiLoading}
            />
          </div>
        </div>
      </div>

      {/* Right sidebar */}
      <div className="w-60 shrink-0 border-l border-border bg-sidebar overflow-y-auto px-3 py-4 space-y-4" style={{ scrollbarWidth: 'thin' }}>
        <ParticipantsSidebar
          participants={data.participants}
          onChange={(participants) => updateData({ participants })}
        />

        {/* Quick stats */}
        <div className="rounded-xl border border-border bg-card p-3 space-y-2">
          <p className="text-xs font-semibold text-foreground">Meeting Stats</p>
          {[
            { label: 'Agenda items', value: data.agenda.length },
            { label: 'Action items', value: data.action_items.length },
            { label: 'Decisions', value: data.decisions.length },
            { label: 'Blockers', value: data.blockers.length },
            { label: 'Follow-ups', value: data.follow_ups.length },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between text-xs">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium text-foreground">{value}</span>
            </div>
          ))}
          {data.duration && (
            <div className="flex justify-between text-xs pt-1 border-t border-border">
              <span className="text-muted-foreground">Duration</span>
              <span className="font-medium text-foreground">{data.duration}m</span>
            </div>
          )}
        </div>

        {/* AI actions */}
        <div className="rounded-xl border border-border bg-card p-3 space-y-2">
          <p className="text-xs font-semibold text-foreground">AI Tools</p>
          <button
            onClick={generateAiSummary}
            disabled={!isOnline || aiLoading}
            className="flex w-full items-center gap-2 rounded-lg bg-violet-500/10 px-3 py-2 text-xs font-medium text-violet-700 dark:text-violet-300 hover:bg-violet-500/20 disabled:opacity-40 transition-colors"
          >
            {aiLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            {data.ai_summary ? 'Regenerate Summary' : 'Summarize Meeting'}
          </button>
          {!isOnline && (
            <p className="text-[10px] text-muted-foreground text-center">Sign in to use AI</p>
          )}
        </div>

        {/* Calendar link */}
        {data.linked_calendar_id ? (
          <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-3">
            <div className="flex items-center gap-2">
              <Link2 size={12} className="text-sky-500" />
              <span className="text-xs font-medium text-sky-600 dark:text-sky-400">Linked to Calendar</span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
