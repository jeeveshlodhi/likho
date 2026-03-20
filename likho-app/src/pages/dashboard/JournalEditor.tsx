import { useMemo, useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router'
import { nanoid } from 'nanoid'
import { format, parseISO } from 'date-fns'
import {
  Sun, Moon, Sunset, Sparkles, Loader2, Plus, Trash2, Check,
  ChevronDown, ChevronRight, RefreshCw, X, Heart, Zap, Star,
  BookOpen, CheckSquare, Edit3, Battery,
} from 'lucide-react'
import { useWorkspaceStore } from '@/store/workspaceStore'
import { useAutoSave } from '@/hooks/useAutoSave'
import { useAuthStore } from '@/store/authStore'
import Breadcrumb from '@/components/dashboard/Breadcrumb'
import NoteTitleInput from '@/components/dashboard/NoteTitleInput'
import { CloudAiService } from '@/lib/cloudAiService'
import type { JournalData, JournalHabit, JournalAiInsight } from '@/types/journal'
import { createDefaultJournalData, MOOD_OPTIONS } from '@/types/journal'

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  icon, title, accent = 'text-muted-foreground', children, defaultOpen = true,
}: {
  icon: React.ReactNode; title: string; accent?: string
  children: React.ReactNode; defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2.5 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
      >
        <span className={accent}>{icon}</span>
        <span className="flex-1 text-sm font-semibold text-foreground">{title}</span>
        {open
          ? <ChevronDown size={14} className="text-muted-foreground" />
          : <ChevronRight size={14} className="text-muted-foreground" />}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  )
}

// ─── Simple list editor (priorities, accomplishments, etc.) ───────────────────

function ListEditor({
  items, onChange, placeholder, maxItems,
}: {
  items: string[]; onChange: (v: string[]) => void
  placeholder: string; maxItems?: number
}) {
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const add = () => {
    if (!draft.trim()) return
    if (maxItems && items.length >= maxItems) return
    onChange([...items, draft.trim()])
    setDraft('')
    inputRef.current?.focus()
  }

  return (
    <div className="space-y-1.5">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2 group">
          <span className="h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0" />
          <span className="flex-1 text-sm text-foreground">{item}</span>
          <button
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="opacity-0 group-hover:opacity-100 rounded p-0.5 hover:bg-accent text-muted-foreground"
          >
            <X size={11} />
          </button>
        </div>
      ))}
      {(!maxItems || items.length < maxItems) && (
        <div className="flex gap-2 mt-2">
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder={placeholder}
            className="flex-1 rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            onClick={add}
            className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
          >
            Add
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Mood Selector ────────────────────────────────────────────────────────────

function MoodSelector({
  mood, onMood, moodNote, onMoodNote,
}: {
  mood?: string; onMood: (v: string) => void
  moodNote?: string; onMoodNote: (v: string) => void
}) {
  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        {MOOD_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onMood(opt.emoji)}
            className={`flex flex-col items-center gap-0.5 rounded-xl border px-3 py-2 text-center transition-all ${
              mood === opt.emoji
                ? 'border-primary bg-primary/10 scale-105'
                : 'border-border bg-muted/20 hover:border-primary/40 hover:bg-muted/40'
            }`}
          >
            <span className="text-2xl">{opt.emoji}</span>
            <span className="text-[10px] text-muted-foreground">{opt.label}</span>
          </button>
        ))}
      </div>
      {mood && (
        <input
          value={moodNote ?? ''}
          onChange={(e) => onMoodNote(e.target.value)}
          placeholder="What's driving this mood? (optional)"
          className="w-full rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      )}
    </div>
  )
}

// ─── Energy Level ─────────────────────────────────────────────────────────────

function EnergySelector({
  level, onChange,
}: {
  level?: number; onChange: (v: number) => void
}) {
  const levels = [
    { value: 1, label: 'Drained',   color: 'bg-red-500' },
    { value: 2, label: 'Low',       color: 'bg-orange-500' },
    { value: 3, label: 'Moderate',  color: 'bg-yellow-500' },
    { value: 4, label: 'Energized', color: 'bg-blue-500' },
    { value: 5, label: 'Peak',      color: 'bg-green-500' },
  ]
  return (
    <div className="flex items-center gap-3">
      <Battery size={14} className="text-muted-foreground shrink-0" />
      <div className="flex gap-2">
        {levels.map((l) => (
          <button
            key={l.value}
            onClick={() => onChange(l.value)}
            title={l.label}
            className={`h-6 rounded transition-all ${
              level === l.value ? `${l.color} scale-110 opacity-100` : 'bg-muted/50 hover:bg-muted opacity-60'
            }`}
            style={{ width: 28 + l.value * 6 }}
          />
        ))}
      </div>
      {level && (
        <span className="text-xs text-muted-foreground">
          {levels.find((l) => l.value === level)?.label}
        </span>
      )}
    </div>
  )
}

// ─── Habit Tracker ────────────────────────────────────────────────────────────

function HabitTracker({
  habits, onChange,
}: {
  habits: JournalHabit[]; onChange: (v: JournalHabit[]) => void
}) {
  const [newHabit, setNewHabit] = useState('')

  const toggle = (id: string) =>
    onChange(habits.map((h) => h.id === id ? { ...h, completed: !h.completed } : h))

  const add = () => {
    if (!newHabit.trim()) return
    onChange([...habits, { id: nanoid(), name: newHabit.trim(), completed: false }])
    setNewHabit('')
  }

  const remove = (id: string) => onChange(habits.filter((h) => h.id !== id))

  const done = habits.filter((h) => h.completed).length

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: habits.length ? `${(done / habits.length) * 100}%` : '0%' }}
          />
        </div>
        <span className="text-xs text-muted-foreground shrink-0">{done}/{habits.length}</span>
      </div>
      <div className="space-y-1.5">
        {habits.map((habit) => (
          <div key={habit.id} className="flex items-center gap-2 group">
            <button
              onClick={() => toggle(habit.id)}
              className={`h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                habit.completed
                  ? 'bg-primary border-primary text-primary-foreground'
                  : 'border-border hover:border-primary'
              }`}
            >
              {habit.completed && <Check size={11} />}
            </button>
            <span className={`flex-1 text-sm ${habit.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
              {habit.name}
            </span>
            <button
              onClick={() => remove(habit.id)}
              className="opacity-0 group-hover:opacity-100 rounded p-0.5 hover:bg-accent text-muted-foreground"
            >
              <X size={11} />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-2">
        <input
          value={newHabit}
          onChange={(e) => setNewHabit(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder="Add habit…"
          className="flex-1 rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button onClick={add} className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20">
          Add
        </button>
      </div>
    </div>
  )
}

// ─── AI Insight Panel ─────────────────────────────────────────────────────────

function AiInsightSection({
  insight, onGenerate, loading, isOnline,
}: {
  insight?: JournalAiInsight
  onGenerate: () => void
  loading: boolean
  isOnline: boolean
}) {
  return (
    <Section icon={<Sparkles size={16} />} title="AI Insights" accent="text-violet-500">
      {!insight && !loading && (
        <div className="rounded-xl border border-dashed border-violet-500/30 bg-violet-500/5 p-5 text-center">
          <Sparkles size={20} className="mx-auto mb-2 text-violet-400" />
          <p className="text-sm font-medium text-foreground mb-1">Summarize your day</p>
          <p className="text-xs text-muted-foreground mb-4">
            AI will analyze your journal entry and provide emotional insights, productivity feedback, and suggestions for tomorrow.
          </p>
          <button
            onClick={onGenerate}
            disabled={!isOnline}
            className="flex items-center gap-1.5 mx-auto rounded-xl bg-violet-500 px-4 py-2 text-sm font-medium text-white hover:bg-violet-600 transition-colors disabled:opacity-50"
          >
            <Sparkles size={14} /> Summarize my day
          </button>
          {!isOnline && <p className="text-[10px] text-muted-foreground mt-2">Requires online connection</p>}
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
          <Loader2 size={20} className="animate-spin text-violet-500" />
          <p className="text-sm">Reflecting on your day…</p>
        </div>
      )}

      {insight && !loading && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="rounded-xl bg-violet-500/8 border border-violet-500/15 px-4 py-3">
            <p className="text-xs font-semibold text-violet-500 mb-1.5">Day Summary</p>
            <p className="text-sm text-foreground leading-relaxed">{insight.summary}</p>
            <p className="text-[10px] text-muted-foreground mt-2">
              Generated {format(parseISO(insight.generated_at), 'h:mm a')}
            </p>
          </div>

          {/* Mood insight */}
          {insight.mood_insight && (
            <div className="rounded-xl bg-pink-500/8 border border-pink-500/15 px-4 py-3">
              <p className="text-xs font-semibold text-pink-500 mb-1">Emotional Insight</p>
              <p className="text-sm text-foreground leading-relaxed">{insight.mood_insight}</p>
            </div>
          )}

          {/* Productivity feedback */}
          {insight.productivity_feedback && (
            <div className="rounded-xl bg-blue-500/8 border border-blue-500/15 px-4 py-3">
              <p className="text-xs font-semibold text-blue-500 mb-1">Productivity</p>
              <p className="text-sm text-foreground leading-relaxed">{insight.productivity_feedback}</p>
            </div>
          )}

          {/* Tomorrow suggestions */}
          {insight.tomorrow_suggestions.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1.5">Suggestions for Tomorrow</p>
              <ul className="space-y-1">
                {insight.tomorrow_suggestions.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <Star size={11} className="mt-1 shrink-0 text-amber-400" />
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

// ─── Main JournalEditor ───────────────────────────────────────────────────────

export default function JournalEditor() {
  const { noteId } = useParams<{ noteId: string }>()
  const navigate = useNavigate()
  const { notes, setActiveNote, updateNote } = useWorkspaceStore()
  const { isAuthenticated, isGuest } = useAuthStore()
  const isOnline = isAuthenticated && !isGuest

  const note = useMemo(() => notes.find((n) => n.id === noteId), [notes, noteId])

  const [data, setData] = useState<JournalData>(() => {
    if (note?.content && typeof note.content === 'object' && 'priorities' in note.content) {
      return note.content as JournalData
    }
    return createDefaultJournalData()
  })

  const [aiLoading, setAiLoading] = useState(false)

  const { save } = useAutoSave(noteId ?? '')

  useEffect(() => { if (noteId) setActiveNote(noteId) }, [noteId, setActiveNote])
  useEffect(() => {
    if (!note && noteId) navigate('/dashboard', { replace: true })
  }, [note, noteId, navigate])

  useEffect(() => {
    if (note?.content && typeof note.content === 'object' && 'priorities' in note.content) {
      setData(note.content as JournalData)
    }
  }, [note?.id])

  const updateData = useCallback((patch: Partial<JournalData>) => {
    setData((prev) => {
      const next = { ...prev, ...patch }
      updateNote(noteId!, { content: next })
      save({ content: next })
      return next
    })
  }, [noteId, updateNote, save])

  const generateAiInsight = async () => {
    if (!isOnline) return
    setAiLoading(true)
    try {
      const lines: string[] = []
      if (data.mood) lines.push(`Mood: ${data.mood} ${MOOD_OPTIONS.find((m) => m.emoji === data.mood)?.label ?? ''}`)
      if (data.energy_level) lines.push(`Energy: ${data.energy_level}/5`)
      if (data.priorities.length) lines.push(`Priorities: ${data.priorities.join(', ')}`)
      if (data.free_writing) lines.push(`Journal: ${data.free_writing}`)
      if (data.accomplishments.length) lines.push(`Accomplished: ${data.accomplishments.join(', ')}`)
      if (data.went_well.length) lines.push(`Went well: ${data.went_well.join(', ')}`)
      if (data.didnt_go_well.length) lines.push(`Challenges: ${data.didnt_go_well.join(', ')}`)
      if (data.learnings.length) lines.push(`Learned: ${data.learnings.join(', ')}`)
      if (data.gratitude.length) lines.push(`Grateful for: ${data.gratitude.join(', ')}`)
      const habitsText = data.habits.filter((h) => h.completed).map((h) => h.name).join(', ')
      if (habitsText) lines.push(`Completed habits: ${habitsText}`)

      const result = await CloudAiService.summarizeJournal({
        content: lines.join('\n'),
        date: data.date,
        title: note?.title ?? '',
      })

      const insight: JournalAiInsight = {
        summary: result.summary,
        mood_insight: result.mood_insight,
        productivity_feedback: result.productivity_feedback,
        tomorrow_suggestions: result.tomorrow_suggestions,
        generated_at: new Date().toISOString(),
      }
      updateData({ ai_insight: insight })
    } catch {
      // silent fail
    } finally {
      setAiLoading(false)
    }
  }

  if (!note) return null

  const journalDate = parseISO(data.date)
  const dayLabel = format(journalDate, 'EEEE, MMMM d, yyyy')

  // Gratitude items limited to 3
  const gratitudePlaceholders = ['Something that made you smile…', 'Someone you appreciate…', 'A small win today…']

  return (
    <div className="flex h-full overflow-hidden bg-background">
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <div className="shrink-0 border-b border-border px-6 py-2">
          <Breadcrumb note={note} />
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5" style={{ scrollbarWidth: 'thin' }}>
          <div className="max-w-2xl mx-auto space-y-5">
            {/* Title + day label */}
            <div>
              <NoteTitleInput note={note} placeholder="Journal title…" />
              <p className="text-sm text-muted-foreground -mt-0.5">{dayLabel}</p>
            </div>

            {/* Mood + Energy strip */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-4">
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Heart size={12} /> How are you feeling?
                </p>
                <MoodSelector
                  mood={data.mood}
                  onMood={(v) => updateData({ mood: v })}
                  moodNote={data.mood_note}
                  onMoodNote={(v) => updateData({ mood_note: v })}
                />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Zap size={12} /> Energy level
                </p>
                <EnergySelector
                  level={data.energy_level}
                  onChange={(v) => updateData({ energy_level: v })}
                />
              </div>
            </div>

            {/* Morning section */}
            <Section icon={<Sun size={16} />} title="Morning Intent" accent="text-amber-500">
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Top 3 priorities for today</p>
                  <ListEditor
                    items={data.priorities}
                    onChange={(v) => updateData({ priorities: v })}
                    placeholder="Priority (Enter to add)…"
                    maxItems={3}
                  />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">What would make today successful?</p>
                  <textarea
                    value={data.success_criteria ?? ''}
                    onChange={(e) => updateData({ success_criteria: e.target.value })}
                    placeholder="Today will be a success if…"
                    rows={2}
                    className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none"
                  />
                </div>
              </div>
            </Section>

            {/* Free writing */}
            <Section icon={<BookOpen size={16} />} title="Thoughts & Notes" accent="text-blue-500">
              <textarea
                value={data.free_writing ?? ''}
                onChange={(e) => updateData({ free_writing: e.target.value })}
                placeholder="Write freely… ideas, observations, anything on your mind."
                rows={8}
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none leading-relaxed"
              />
            </Section>

            {/* Habit tracker */}
            <Section icon={<CheckSquare size={16} />} title="Habit Tracker" accent="text-green-500">
              <HabitTracker
                habits={data.habits}
                onChange={(v) => updateData({ habits: v })}
              />
            </Section>

            {/* Evening reflection */}
            <Section icon={<Sunset size={16} />} title="Evening Reflection" accent="text-orange-500" defaultOpen={false}>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">What did I accomplish today?</p>
                  <ListEditor
                    items={data.accomplishments}
                    onChange={(v) => updateData({ accomplishments: v })}
                    placeholder="I accomplished…"
                  />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">What went well?</p>
                  <ListEditor
                    items={data.went_well}
                    onChange={(v) => updateData({ went_well: v })}
                    placeholder="Something that went well…"
                  />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">What didn't go well?</p>
                  <ListEditor
                    items={data.didnt_go_well}
                    onChange={(v) => updateData({ didnt_go_well: v })}
                    placeholder="Something to improve…"
                  />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">What did I learn?</p>
                  <ListEditor
                    items={data.learnings}
                    onChange={(v) => updateData({ learnings: v })}
                    placeholder="I learned…"
                  />
                </div>
              </div>
            </Section>

            {/* Gratitude */}
            <Section icon={<Star size={16} />} title="Gratitude" accent="text-yellow-500" defaultOpen={false}>
              <div className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-base shrink-0">🙏</span>
                    <input
                      value={data.gratitude[i] ?? ''}
                      onChange={(e) => {
                        const next = [...data.gratitude]
                        next[i] = e.target.value
                        // Remove trailing empty items
                        while (next.length > 0 && !next[next.length - 1]) next.pop()
                        updateData({ gratitude: next })
                      }}
                      placeholder={gratitudePlaceholders[i]}
                      className="flex-1 rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-yellow-500/30"
                    />
                  </div>
                ))}
              </div>
            </Section>

            {/* AI Insights */}
            <AiInsightSection
              insight={data.ai_insight}
              onGenerate={generateAiInsight}
              loading={aiLoading}
              isOnline={isOnline}
            />

            <div className="pb-10" />
          </div>
        </div>
      </div>
    </div>
  )
}
