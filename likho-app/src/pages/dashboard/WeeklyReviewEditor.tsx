import { useMemo, useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router'
import { nanoid } from 'nanoid'
import { format, parseISO, startOfWeek, endOfWeek, addWeeks, subWeeks, isSameWeek } from 'date-fns'
import {
  Sparkles, Loader2, Plus, Trash2, Check, ChevronDown, ChevronRight,
  RefreshCw, X, Trophy, AlertCircle, Lightbulb, Target, Calendar,
  BarChart3, TrendingUp, TrendingDown, ChevronLeft, ChevronUp, GripVertical,
  Heart, Zap, StickyNote, CheckCircle2, Clock, MoreHorizontal,
} from 'lucide-react'
import { useWorkspaceStore } from '@/store/workspaceStore'
import { useAutoSave } from '@/hooks/useAutoSave'
import { useAuthStore } from '@/store/authStore'
import Breadcrumb from '@/components/dashboard/Breadcrumb'
import NoteTitleInput from '@/components/dashboard/NoteTitleInput'
import { CloudAiService } from '@/lib/cloudAiService'
import type { 
  WeeklyReviewData, 
  WeeklyReviewTask, 
  WeeklyReviewMoodLog,
  WeeklyReviewAiInsight 
} from '@/types/journal'
import { createDefaultWeeklyReviewData, formatWeekRange, getWeekStart } from '@/types/journal'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// ─── Types ────────────────────────────────────────────────────────────────────

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const MOOD_OPTIONS = [
  { emoji: '😞', label: 'Rough', value: 1, color: '#ef4444' },
  { emoji: '😕', label: 'Low', value: 2, color: '#f97316' },
  { emoji: '😐', label: 'Neutral', value: 3, color: '#eab308' },
  { emoji: '🙂', label: 'Good', value: 4, color: '#3b82f6' },
  { emoji: '😊', label: 'Great', value: 5, color: '#22c55e' },
  { emoji: '😄', label: 'Amazing', value: 6, color: '#10b981' },
]

// ─── Section wrapper (Collapsible) ────────────────────────────────────────────

function Section({
  icon, title, accent = 'text-muted-foreground', children, defaultOpen = true,
  action,
}: {
  icon: React.ReactNode; title: string; accent?: string
  children: React.ReactNode; defaultOpen?: boolean
  action?: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden transition-shadow hover:shadow-sm">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2.5 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
      >
        <span className={accent}>{icon}</span>
        <span className="flex-1 text-sm font-semibold text-foreground">{title}</span>
        {action && <span onClick={(e) => e.stopPropagation()}>{action}</span>}
        {open
          ? <ChevronDown size={14} className="text-muted-foreground" />
          : <ChevronRight size={14} className="text-muted-foreground" />}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  )
}

// ─── List editor (add/remove items) ───────────────────────────────────────────

function ListEditor({
  items, onChange, placeholder, maxItems, accentColor = 'bg-primary/60',
}: {
  items: string[]; onChange: (v: string[]) => void
  placeholder: string; maxItems?: number
  accentColor?: string
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
          <span className={`h-1.5 w-1.5 rounded-full ${accentColor} shrink-0`} />
          <span className="flex-1 text-sm text-foreground">{item}</span>
          <button
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="opacity-0 group-hover:opacity-100 rounded p-0.5 hover:bg-accent text-muted-foreground transition-opacity"
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
            className="flex-1 rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
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

// ─── Sortable Priority Item ───────────────────────────────────────────────────

function SortablePriority({ 
  id, item, index, onRemove, onUpdate 
}: { 
  id: string; item: string; index: number; 
  onRemove: () => void; onUpdate: (val: string) => void 
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 group p-2 rounded-lg border ${
        isDragging ? 'border-primary/50 bg-primary/5 shadow-lg' : 'border-border bg-muted/20'
      } transition-all`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground"
      >
        <GripVertical size={14} />
      </button>
      <span className="text-xs font-semibold text-muted-foreground w-5">{index + 1}</span>
      <input
        value={item}
        onChange={(e) => onUpdate(e.target.value)}
        className="flex-1 bg-transparent text-sm text-foreground focus:outline-none"
        placeholder={`Priority ${index + 1}`}
      />
      <button
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 rounded p-1 hover:bg-accent text-muted-foreground transition-opacity"
      >
        <X size={12} />
      </button>
    </div>
  )
}

// ─── Draggable Priorities List ────────────────────────────────────────────────

function DraggablePriorities({
  items, onChange,
}: {
  items: string[]; onChange: (v: string[]) => void
}) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (active.id !== over?.id) {
      const oldIndex = items.findIndex((_, i) => `priority-${i}` === active.id)
      const newIndex = items.findIndex((_, i) => `priority-${i}` === over?.id)
      onChange(arrayMove(items, oldIndex, newIndex))
    }
  }

  const addPriority = () => {
    if (items.length < 5) {
      onChange([...items, ''])
    }
  }

  const updatePriority = (index: number, value: string) => {
    const newItems = [...items]
    newItems[index] = value
    onChange(newItems)
  }

  const removePriority = (index: number) => {
    onChange(items.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-2">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={items.map((_, i) => `priority-${i}`)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {items.map((item, i) => (
              <SortablePriority
                key={`priority-${i}`}
                id={`priority-${i}`}
                item={item}
                index={i}
                onRemove={() => removePriority(i)}
                onUpdate={(val) => updatePriority(i, val)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      
      {items.length < 5 && (
        <button
          onClick={addPriority}
          className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/20 py-2 text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all"
        >
          <Plus size={14} /> Add Priority
        </button>
      )}
    </div>
  )
}

// ─── Week Selector ────────────────────────────────────────────────────────────

function WeekSelector({
  weekStart, onChange,
}: {
  weekStart: string; onChange: (date: Date) => void
}) {
  const currentWeek = useMemo(() => new Date(weekStart), [weekStart])
  const today = new Date()
  const isCurrentWeek = isSameWeek(currentWeek, today, { weekStartsOn: 1 })

  const prevWeek = () => onChange(subWeeks(currentWeek, 1))
  const nextWeek = () => onChange(addWeeks(currentWeek, 1))
  const thisWeek = () => onChange(getWeekStart(today))

  const weekEnd = useMemo(() => {
    const end = new Date(currentWeek)
    end.setDate(end.getDate() + 6)
    return end
  }, [currentWeek])

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={prevWeek}
        className="p-1.5 rounded-lg hover:bg-muted transition-colors"
      >
        <ChevronLeft size={16} className="text-muted-foreground" />
      </button>
      
      <div className="flex-1 text-center">
        <div className="text-sm font-medium text-foreground">
          {formatWeekRange(currentWeek.toISOString(), weekEnd.toISOString())}
        </div>
        <div className="text-xs text-muted-foreground">
          {isCurrentWeek ? 'Current week' : format(currentWeek, 'yyyy')}
        </div>
      </div>
      
      <button
        onClick={nextWeek}
        className="p-1.5 rounded-lg hover:bg-muted transition-colors"
      >
        <ChevronRight size={16} className="text-muted-foreground" />
      </button>
      
      {!isCurrentWeek && (
        <button
          onClick={thisWeek}
          className="ml-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
        >
          Today
        </button>
      )}
    </div>
  )
}

// ─── Task Comparison Chart ────────────────────────────────────────────────────

function TaskComparison({
  tasks, onTaskToggle,
}: {
  tasks: WeeklyReviewTask[]; onTaskToggle: (id: string) => void
}) {
  const stats = useMemo(() => {
    const planned = tasks.filter(t => t.source === 'planned')
    const unplanned = tasks.filter(t => t.source === 'unplanned')
    return {
      planned: { total: planned.length, completed: planned.filter(t => t.completed).length },
      unplanned: { total: unplanned.length, completed: unplanned.filter(t => t.completed).length },
      total: tasks.length,
      completed: tasks.filter(t => t.completed).length,
    }
  }, [tasks])

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0

  // Simple bar chart visualization
  const BarSegment = ({ 
    label, completed, total, color 
  }: { 
    label: string; completed: number; total: number; color: string 
  }) => {
    const rate = total > 0 ? (completed / total) * 100 : 0
    return (
      <div className="flex-1">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-medium">{completed}/{total}</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${rate}%`, backgroundColor: color }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Overall progress */}
      <div className="flex items-center gap-4">
        <div className="relative w-16 h-16">
          <svg className="w-16 h-16 transform -rotate-90">
            <circle
              cx="32" cy="32" r="28"
              stroke="currentColor"
              strokeWidth="6"
              fill="none"
              className="text-muted"
            />
            <circle
              cx="32" cy="32" r="28"
              stroke="currentColor"
              strokeWidth="6"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 28}`}
              strokeDashoffset={`${2 * Math.PI * 28 * (1 - completionRate / 100)}`}
              className="text-primary transition-all duration-500"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold">{completionRate}%</span>
          </div>
        </div>
        <div>
          <div className="text-sm font-medium">Task Completion</div>
          <div className="text-xs text-muted-foreground">
            {stats.completed} of {stats.total} tasks completed
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="flex gap-4">
        <BarSegment 
          label="Planned" 
          completed={stats.planned.completed} 
          total={stats.planned.total} 
          color="#3b82f6" 
        />
        <BarSegment 
          label="Unplanned" 
          completed={stats.unplanned.completed} 
          total={stats.unplanned.total} 
          color="#10b981" 
        />
      </div>

      {/* Quick add tasks */}
      <TaskQuickAdd onAdd={(title, source) => {
        // This is handled by parent component
      }} />
    </div>
  )
}

// ─── Task Quick Add ───────────────────────────────────────────────────────────

function TaskQuickAdd({
  onAdd,
}: {
  onAdd: (title: string, source: 'planned' | 'unplanned') => void
}) {
  const [title, setTitle] = useState('')
  const [source, setSource] = useState<'planned' | 'unplanned'>('planned')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onAdd(title.trim(), source)
    setTitle('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add a task..."
        className="flex-1 rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
      <select
        value={source}
        onChange={(e) => setSource(e.target.value as 'planned' | 'unplanned')}
        className="rounded-lg border border-border bg-muted/30 px-2 py-1.5 text-xs text-foreground focus:outline-none"
      >
        <option value="planned">Planned</option>
        <option value="unplanned">Unplanned</option>
      </select>
      <button
        type="submit"
        className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
      >
        <Plus size={14} />
      </button>
    </form>
  )
}

// ─── Mood Weekly View ─────────────────────────────────────────────────────────

function WeeklyMoodView({
  moodLogs, weekStart, onMoodLog,
}: {
  moodLogs: WeeklyReviewMoodLog[]; weekStart: string;
  onMoodLog: (day: number, mood: string, energy?: number) => void
}) {
  const weekStartDate = new Date(weekStart)
  const days = useMemo(() => {
    return WEEK_DAYS.map((day, i) => {
      const date = new Date(weekStartDate)
      date.setDate(date.getDate() + i)
      const existing = moodLogs.find(m => m.day === date.toISOString().split('T')[0])
      return { day, date, log: existing }
    })
  }, [weekStartDate, moodLogs])

  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-7 gap-1">
        {days.map(({ day, date, log }, i) => (
          <button
            key={day}
            onClick={() => setSelectedDay(selectedDay === i ? null : i)}
            className={`flex flex-col items-center p-2 rounded-lg border transition-all ${
              selectedDay === i 
                ? 'border-primary bg-primary/10' 
                : log 
                  ? 'border-primary/30 bg-primary/5' 
                  : 'border-border bg-muted/20 hover:border-primary/20'
            }`}
          >
            <span className="text-[10px] text-muted-foreground uppercase">{day}</span>
            <span className="text-xs font-medium">{date.getDate()}</span>
            {log ? (
              <span className="text-lg mt-1">{log.mood}</span>
            ) : (
              <span className="h-5 w-5 rounded-full border-2 border-dashed border-muted-foreground/30 mt-1" />
            )}
          </button>
        ))}
      </div>

      {selectedDay !== null && (
        <div className="rounded-lg border border-border bg-muted/20 p-3">
          <div className="text-xs text-muted-foreground mb-2">
            {format(days[selectedDay].date, 'EEEE, MMMM d')} — How was your day?
          </div>
          <div className="flex gap-2 flex-wrap">
            {MOOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  onMoodLog(selectedDay, opt.emoji, opt.value)
                  setSelectedDay(null)
                }}
                className="flex flex-col items-center gap-0.5 rounded-lg border border-border bg-background px-2 py-1.5 text-center hover:border-primary/40 hover:bg-primary/5 transition-all"
              >
                <span className="text-lg">{opt.emoji}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── AI Insight Section ───────────────────────────────────────────────────────

function AiInsightSection({
  insight, onGenerate, loading, isOnline,
}: {
  insight?: WeeklyReviewAiInsight
  onGenerate: () => void
  loading: boolean
  isOnline: boolean
}) {
  return (
    <div className="rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-purple-500/5 overflow-hidden">
      <div className="px-4 py-3 border-b border-violet-500/10 flex items-center gap-2">
        <Sparkles size={16} className="text-violet-500" />
        <span className="text-sm font-semibold text-foreground">AI Weekly Insights</span>
      </div>
      
      <div className="p-4">
        {!insight && !loading && (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full bg-violet-500/10 flex items-center justify-center mx-auto mb-3">
              <Sparkles size={20} className="text-violet-500" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">Analyze your week</p>
            <p className="text-xs text-muted-foreground mb-4 max-w-xs mx-auto">
              AI will analyze your wins, learnings, and tasks to generate insights, themes, and recommendations for next week.
            </p>
            <button
              onClick={onGenerate}
              disabled={!isOnline}
              className="inline-flex items-center gap-1.5 rounded-lg bg-violet-500 px-4 py-2 text-sm font-medium text-white hover:bg-violet-600 transition-colors disabled:opacity-50"
            >
              <Sparkles size={14} /> Generate Insights
            </button>
            {!isOnline && <p className="text-[10px] text-muted-foreground mt-2">Requires online connection</p>}
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
            <Loader2 size={24} className="animate-spin text-violet-500" />
            <p className="text-sm">Analyzing your week...</p>
          </div>
        )}

        {insight && !loading && (
          <div className="space-y-4">
            {/* Productivity Score */}
            <div className="flex items-center gap-4">
              <div className="relative w-14 h-14">
                <svg className="w-14 h-14 transform -rotate-90">
                  <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="none" className="text-violet-500/20" />
                  <circle 
                    cx="28" cy="28" r="24" 
                    stroke="currentColor" 
                    strokeWidth="4" 
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 24}`}
                    strokeDashoffset={`${2 * Math.PI * 24 * (1 - insight.productivity_score / 100)}`}
                    className="text-violet-500"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-violet-600">{insight.productivity_score}</span>
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-violet-600">Productivity Score</div>
                <div className="text-xs text-muted-foreground">Based on your task completion & mood</div>
              </div>
            </div>

            {/* Summary */}
            <div className="rounded-lg bg-violet-500/10 border border-violet-500/20 px-3 py-2">
              <p className="text-xs font-semibold text-violet-600 mb-1">Week Summary</p>
              <p className="text-sm text-foreground leading-relaxed">{insight.summary}</p>
            </div>

            {/* Themes */}
            {insight.themes.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1.5">Weekly Themes</p>
                <div className="flex flex-wrap gap-1.5">
                  {insight.themes.map((theme, i) => (
                    <span key={i} className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                      {theme}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Highlights */}
            {insight.highlights.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1.5">Key Highlights</p>
                <ul className="space-y-1">
                  {insight.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                      <Trophy size={12} className="mt-1 shrink-0 text-amber-500" />
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Insights */}
            {insight.insights && (
              <div className="rounded-lg bg-blue-500/8 border border-blue-500/15 px-3 py-2">
                <p className="text-xs font-semibold text-blue-500 mb-1">Deep Insights</p>
                <p className="text-sm text-foreground leading-relaxed">{insight.insights}</p>
              </div>
            )}

            {/* Recommendations */}
            {insight.recommendations.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1.5">Recommendations for Next Week</p>
                <ul className="space-y-1">
                  {insight.recommendations.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                      <Lightbulb size={12} className="mt-1 shrink-0 text-yellow-500" />
                      {r}
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
      </div>
    </div>
  )
}

// ─── Main WeeklyReviewEditor ──────────────────────────────────────────────────

export default function WeeklyReviewEditor() {
  const { noteId } = useParams<{ noteId: string }>()
  const navigate = useNavigate()
  const { notes, setActiveNote, updateNote } = useWorkspaceStore()
  const { isAuthenticated, isGuest } = useAuthStore()
  const isOnline = isAuthenticated && !isGuest

  const note = useMemo(() => notes.find((n) => n.id === noteId), [notes, noteId])

  const [data, setData] = useState<WeeklyReviewData>(() => {
    if (note?.content && typeof note.content === 'object' && 'weekStart' in note.content) {
      return note.content as WeeklyReviewData
    }
    return createDefaultWeeklyReviewData()
  })

  const [aiLoading, setAiLoading] = useState(false)

  const { save } = useAutoSave(noteId ?? '')

  useEffect(() => { if (noteId) setActiveNote(noteId) }, [noteId, setActiveNote])
  useEffect(() => {
    if (!note && noteId) navigate('/dashboard', { replace: true })
  }, [note, noteId, navigate])

  useEffect(() => {
    if (note?.content && typeof note.content === 'object' && 'weekStart' in note.content) {
      setData(note.content as WeeklyReviewData)
    }
  }, [note?.id])

  const updateData = useCallback((patch: Partial<WeeklyReviewData>) => {
    setData((prev) => {
      const next = { ...prev, ...patch }
      updateNote(noteId!, { content: next })
      save({ content: next })
      return next
    })
  }, [noteId, updateNote, save])

  const handleWeekChange = useCallback((newWeekStart: Date) => {
    const weekEnd = new Date(newWeekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    updateData({
      weekStart: newWeekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
    })
  }, [updateData])

  const handleMoodLog = useCallback((dayIndex: number, mood: string, energyLevel?: number) => {
    const date = new Date(data.weekStart)
    date.setDate(date.getDate() + dayIndex)
    const dayStr = date.toISOString().split('T')[0]
    
    const existingIndex = data.moodLogs.findIndex(m => m.day === dayStr)
    let newMoodLogs: WeeklyReviewMoodLog[]
    
    if (existingIndex >= 0) {
      newMoodLogs = [...data.moodLogs]
      newMoodLogs[existingIndex] = { day: dayStr, mood, energyLevel }
    } else {
      newMoodLogs = [...data.moodLogs, { day: dayStr, mood, energyLevel }]
    }
    
    updateData({ moodLogs: newMoodLogs })
  }, [data.weekStart, data.moodLogs, updateData])

  const handleTaskAdd = useCallback((title: string, source: 'planned' | 'unplanned') => {
    const newTask: WeeklyReviewTask = {
      id: nanoid(),
      title,
      completed: false,
      source,
      dayOfWeek: 0,
    }
    updateData({ tasks: [...data.tasks, newTask] })
  }, [data.tasks, updateData])

  const handleTaskToggle = useCallback((taskId: string) => {
    updateData({
      tasks: data.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t)
    })
  }, [data.tasks, updateData])

  const generateAiInsight = async () => {
    if (!isOnline) return
    setAiLoading(true)
    try {
      const result = await CloudAiService.weeklyReviewSummary({
        wins: data.wins,
        failures: data.failures,
        learnings: data.learnings,
        tasks: data.tasks,
        moodLogs: data.moodLogs,
        notes: data.notes,
        weekStart: data.weekStart,
      })

      const insight: WeeklyReviewAiInsight = {
        summary: result.summary,
        themes: result.themes,
        productivity_score: result.productivity_score,
        highlights: result.highlights,
        insights: result.insights,
        recommendations: result.recommendations,
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

  const weekEnd = new Date(data.weekEnd)
  const completionRate = data.tasks.length > 0 
    ? Math.round((data.tasks.filter(t => t.completed).length / data.tasks.length) * 100) 
    : 0

  return (
    <div className="flex h-full overflow-hidden bg-background">
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <div className="shrink-0 border-b border-border px-6 py-2">
          <Breadcrumb note={note} />
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5" style={{ scrollbarWidth: 'thin' }}>
          <div className="max-w-3xl mx-auto space-y-5">
            {/* Title + Week Selector */}
            <div className="space-y-3">
              <NoteTitleInput note={note} placeholder="Weekly Review" />
              <div className="rounded-xl border border-border bg-card p-3">
                <WeekSelector 
                  weekStart={data.weekStart} 
                  onChange={handleWeekChange}
                />
              </div>
            </div>

            {/* Stats Strip */}
            <div className="grid grid-cols-4 gap-3">
              <div className="rounded-xl border border-border bg-card p-3 text-center">
                <div className="text-2xl font-bold text-emerald-500">{data.wins.length}</div>
                <div className="text-xs text-muted-foreground">Wins</div>
              </div>
              <div className="rounded-xl border border-border bg-card p-3 text-center">
                <div className="text-2xl font-bold text-rose-500">{data.failures.length}</div>
                <div className="text-xs text-muted-foreground">Failures</div>
              </div>
              <div className="rounded-xl border border-border bg-card p-3 text-center">
                <div className="text-2xl font-bold text-amber-500">{data.learnings.length}</div>
                <div className="text-xs text-muted-foreground">Learnings</div>
              </div>
              <div className="rounded-xl border border-border bg-card p-3 text-center">
                <div className="text-2xl font-bold text-blue-500">{completionRate}%</div>
                <div className="text-xs text-muted-foreground">Tasks Done</div>
              </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Left Column */}
              <div className="space-y-5">
                {/* Wins */}
                <Section 
                  icon={<Trophy size={16} />} 
                  title="Wins" 
                  accent="text-emerald-500"
                >
                  <ListEditor
                    items={data.wins}
                    onChange={(v) => updateData({ wins: v })}
                    placeholder="What went well this week?"
                    accentColor="bg-emerald-500"
                  />
                </Section>

                {/* Failures */}
                <Section 
                  icon={<AlertCircle size={16} />} 
                  title="Failures & Challenges" 
                  accent="text-rose-500"
                >
                  <ListEditor
                    items={data.failures}
                    onChange={(v) => updateData({ failures: v })}
                    placeholder="What didn't go as planned?"
                    accentColor="bg-rose-500"
                  />
                </Section>

                {/* Learnings */}
                <Section 
                  icon={<Lightbulb size={16} />} 
                  title="Key Learnings" 
                  accent="text-amber-500"
                >
                  <ListEditor
                    items={data.learnings}
                    onChange={(v) => updateData({ learnings: v })}
                    placeholder="What did you learn?"
                    accentColor="bg-amber-500"
                  />
                </Section>

                {/* Mood Tracking */}
                <Section 
                  icon={<Heart size={16} />} 
                  title="Mood This Week" 
                  accent="text-pink-500"
                >
                  <WeeklyMoodView
                    moodLogs={data.moodLogs}
                    weekStart={data.weekStart}
                    onMoodLog={handleMoodLog}
                  />
                </Section>
              </div>

              {/* Right Column */}
              <div className="space-y-5">
                {/* Task Comparison */}
                <Section 
                  icon={<BarChart3 size={16} />} 
                  title="Task Comparison" 
                  accent="text-blue-500"
                >
                  <div className="space-y-4">
                    <TaskComparison tasks={data.tasks} onTaskToggle={handleTaskToggle} />
                    
                    {/* Task list */}
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {data.tasks.map((task) => (
                        <div 
                          key={task.id} 
                          className="flex items-center gap-2 p-2 rounded-lg bg-muted/20 group"
                        >
                          <button
                            onClick={() => handleTaskToggle(task.id)}
                            className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${
                              task.completed 
                                ? 'bg-primary border-primary text-primary-foreground' 
                                : 'border-border hover:border-primary'
                            }`}
                          >
                            {task.completed && <Check size={10} />}
                          </button>
                          <span className={`flex-1 text-sm ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                            {task.title}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                            task.source === 'planned' 
                              ? 'bg-blue-500/10 text-blue-500' 
                              : 'bg-green-500/10 text-green-500'
                          }`}>
                            {task.source}
                          </span>
                          <button
                            onClick={() => updateData({ tasks: data.tasks.filter(t => t.id !== task.id) })}
                            className="opacity-0 group-hover:opacity-100 rounded p-0.5 hover:bg-accent text-muted-foreground transition-opacity"
                          >
                            <X size={11} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <TaskQuickAdd onAdd={handleTaskAdd} />
                  </div>
                </Section>

                {/* Next Week's Priorities */}
                <Section 
                  icon={<Target size={16} />} 
                  title="Next Week's Priorities" 
                  accent="text-violet-500"
                >
                  <DraggablePriorities
                    items={data.priorities}
                    onChange={(v) => updateData({ priorities: v })}
                  />
                </Section>

                {/* Notes */}
                <Section 
                  icon={<StickyNote size={16} />} 
                  title="Additional Notes" 
                  accent="text-muted-foreground"
                  defaultOpen={false}
                >
                  <textarea
                    value={data.notes}
                    onChange={(e) => updateData({ notes: e.target.value })}
                    placeholder="Any additional thoughts, reflections, or notes..."
                    rows={6}
                    className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  />
                </Section>
              </div>
            </div>

            {/* AI Insights - Full Width */}
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
