import { useMemo, useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router'
import { nanoid } from 'nanoid'
import { format } from 'date-fns'
import {
  Sparkles, Loader2, Plus, Trash2, Check, ChevronDown, ChevronRight,
  RefreshCw, X, BookOpen, Link as LinkIcon, Star, StarOff, MoreHorizontal,
  Highlighter, MessageSquare, HelpCircle, CheckSquare, AlignLeft,
  ExternalLink, Tag, GripVertical, Hash, Quote, Brain, Lightbulb,
  Target, Zap, Search, BookMarked, BarChart3,
} from 'lucide-react'
import { useWorkspaceStore } from '@/store/workspaceStore'
import { useAutoSave } from '@/hooks/useAutoSave'
import { useAuthStore } from '@/store/authStore'
import Breadcrumb from '@/components/dashboard/Breadcrumb'
import NoteTitleInput from '@/components/dashboard/NoteTitleInput'
import { CloudAiService } from '@/lib/cloudAiService'
import type { 
  ReadingNotesData, 
  ReadingHighlight, 
  ReadingTakeaway,
  ReadingQuestion,
  ReadingActionItem,
  RelatedNote,
  ReadingNotesAiInsight,
  ReadingType,
  ReadingStatus,
} from '@/types/journal'
import { 
  createDefaultReadingNotesData, 
  READING_TYPE_OPTIONS, 
  READING_STATUS_OPTIONS,
  HIGHLIGHT_COLORS,
} from '@/types/journal'
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

// ─── Section wrapper (Collapsible) ────────────────────────────────────────────

function Section({
  icon, title, accent = 'text-muted-foreground', children, defaultOpen = true,
  action, badge,
}: {
  icon: React.ReactNode; title: string; accent?: string
  children: React.ReactNode; defaultOpen?: boolean
  action?: React.ReactNode
  badge?: number | string
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
        {badge !== undefined && (typeof badge === 'number' ? badge > 0 : badge) && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            {badge}
          </span>
        )}
        {action && <span onClick={(e) => e.stopPropagation()}>{action}</span>}
        {open
          ? <ChevronDown size={14} className="text-muted-foreground" />
          : <ChevronRight size={14} className="text-muted-foreground" />}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  )
}

// ─── Rating Stars ─────────────────────────────────────────────────────────────

function Rating({ value, onChange }: { value?: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => onChange(star)}
          className="p-0.5 transition-colors hover:scale-110"
        >
          {value && star <= value ? (
            <Star size={18} className="fill-amber-400 text-amber-400" />
          ) : (
            <StarOff size={18} className="text-muted-foreground hover:text-amber-400" />
          )}
        </button>
      ))}
    </div>
  )
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [editing, setEditing] = useState(false)
  
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary rounded-full transition-all"
          style={{ width: `${value}%` }}
        />
      </div>
      {editing ? (
        <input
          type="number"
          min={0}
          max={100}
          value={value}
          onChange={(e) => onChange(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
          onBlur={() => setEditing(false)}
          onKeyDown={(e) => e.key === 'Enter' && setEditing(false)}
          className="w-14 text-xs text-center border border-border rounded px-1 py-0.5"
          autoFocus
        />
      ) : (
        <button 
          onClick={() => setEditing(true)}
          className="text-xs text-muted-foreground hover:text-foreground w-10 text-right"
        >
          {value}%
        </button>
      )}
    </div>
  )
}

// ─── Bulk Highlight Input ─────────────────────────────────────────────────────

function BulkHighlightInput({ 
  onAdd 
}: { 
  onAdd: (highlights: Omit<ReadingHighlight, 'id' | 'createdAt'>[]) => void 
}) {
  const [text, setText] = useState('')
  const [showInput, setShowInput] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = () => {
    if (!text.trim()) return
    
    // Parse highlights - split by newlines and create highlights
    const lines = text.split('\n').filter(line => line.trim())
    const highlights = lines.map(line => {
      // Try to extract location if format is "p.123: text" or "[12:34]: text" or "(page 5): text"
      const locationMatch = line.match(/^(?:p\.?\s*(\d+)|\[(\d+:\d+)\]|\(page\s*(\d+)\):\s*)(.+)/i)
      
      if (locationMatch) {
        const location = locationMatch[1] || locationMatch[2] || locationMatch[3]
        const highlightText = locationMatch[4]
        return { text: highlightText.trim(), location: location.toString(), color: 'yellow' as const }
      }
      
      // Try "text - p.123" format
      const trailingMatch = line.match(/(.+?)\s*(?:[-–])\s*(?:p\.?\s*(\d+)|\[(\d+:\d+)\])$/i)
      if (trailingMatch) {
        const location = trailingMatch[2] || trailingMatch[3]
        return { text: trailingMatch[1].trim(), location, color: 'yellow' as const }
      }
      
      return { text: line.trim(), color: 'yellow' as const }
    })
    
    onAdd(highlights)
    setText('')
    setShowInput(false)
  }

  if (!showInput) {
    return (
      <button
        onClick={() => setShowInput(true)}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed border-border bg-muted/20 text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all"
      >
        <Plus size={14} /> Bulk Add Highlights
      </button>
    )
  }

  return (
    <div className="space-y-2">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste highlights here...&#10;Supports:&#10;- p.123: Highlight text&#10;- [12:34]: Timestamp text&#10;- Highlight text - p.123"
        rows={6}
        className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
        autoFocus
      />
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          className="flex-1 rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
        >
          Add {text.split('\n').filter(l => l.trim()).length} Highlights
        </button>
        <button
          onClick={() => { setText(''); setShowInput(false) }}
          className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ─── Highlight Card ───────────────────────────────────────────────────────────

function HighlightCard({
  highlight, onUpdate, onDelete,
}: {
  highlight: ReadingHighlight
  onUpdate: (h: ReadingHighlight) => void
  onDelete: () => void
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const colorStyle = HIGHLIGHT_COLORS.find(c => c.value === highlight.color) || HIGHLIGHT_COLORS[0]

  return (
    <div className={`rounded-lg border p-3 transition-all ${colorStyle.bg} ${colorStyle.border} border-l-4`}>
      <div className="flex items-start gap-2">
        <Quote size={14} className="mt-1 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground leading-relaxed">{highlight.text}</p>
          {highlight.location && (
            <span className="text-xs text-muted-foreground mt-1 inline-block">
              {highlight.location}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {HIGHLIGHT_COLORS.map((color) => (
            <button
              key={color.value}
              onClick={() => onUpdate({ ...highlight, color: color.value })}
              className={`w-4 h-4 rounded-full border-2 transition-all ${
                highlight.color === color.value 
                  ? 'border-foreground scale-110' 
                  : 'border-transparent hover:scale-105'
              }`}
              style={{ backgroundColor: color.value === 'yellow' ? '#fbbf24' : 
                color.value === 'green' ? '#4ade80' : 
                color.value === 'blue' ? '#60a5fa' : 
                color.value === 'pink' ? '#f472b6' : '#a78bfa' }}
              title={color.label}
            />
          ))}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-muted-foreground hover:text-foreground"
          >
            <MessageSquare size={14} />
          </button>
          <button
            onClick={onDelete}
            className="p-1 text-muted-foreground hover:text-destructive"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="mt-2 pt-2 border-t border-border/50">
          <textarea
            value={highlight.note || ''}
            onChange={(e) => onUpdate({ ...highlight, note: e.target.value })}
            placeholder="Add your note..."
            rows={2}
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none"
          />
        </div>
      )}
    </div>
  )
}

// ─── Editable List Item ───────────────────────────────────────────────────────

function EditableListItem({
  item, onUpdate, onDelete, icon: Icon, accentColor = 'text-primary',
}: {
  item: { id: string; text: string; [key: string]: any }
  onUpdate: (item: any) => void
  onDelete: () => void
  icon: any
  accentColor?: string
}) {
  const [isEditing, setIsEditing] = useState(false)

  return (
    <div className="flex items-start gap-2 group p-2 rounded-lg hover:bg-muted/30 transition-colors">
      <Icon size={14} className={`mt-1 shrink-0 ${accentColor}`} />
      {isEditing ? (
        <input
          value={item.text}
          onChange={(e) => onUpdate({ ...item, text: e.target.value })}
          onBlur={() => setIsEditing(false)}
          onKeyDown={(e) => e.key === 'Enter' && setIsEditing(false)}
          className="flex-1 bg-transparent text-sm text-foreground focus:outline-none"
          autoFocus
        />
      ) : (
        <span 
          onClick={() => setIsEditing(true)}
          className="flex-1 text-sm text-foreground cursor-text"
        >
          {item.text}
        </span>
      )}
      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-opacity"
      >
        <X size={12} />
      </button>
    </div>
  )
}

// ─── Question Item ────────────────────────────────────────────────────────────

function QuestionItem({
  question, onUpdate, onDelete,
}: {
  question: ReadingQuestion
  onUpdate: (q: ReadingQuestion) => void
  onDelete: () => void
}) {
  return (
    <div className="flex flex-col gap-2 p-3 rounded-lg border border-border bg-muted/20">
      <div className="flex items-start gap-2">
        <HelpCircle size={14} className="mt-1 shrink-0 text-amber-500" />
        <div className="flex-1">
          <input
            value={question.question}
            onChange={(e) => onUpdate({ ...question, question: e.target.value })}
            placeholder="Your question..."
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
        <button
          onClick={() => onUpdate({ ...question, answered: !question.answered })}
          className={`p-1 rounded transition-colors ${
            question.answered 
              ? 'text-green-500 bg-green-500/10' 
              : 'text-muted-foreground hover:text-green-500'
          }`}
        >
          <CheckSquare size={14} />
        </button>
        <button
          onClick={onDelete}
          className="p-1 text-muted-foreground hover:text-destructive"
        >
          <Trash2 size={14} />
        </button>
      </div>
      
      {question.answered && (
        <textarea
          value={question.answer || ''}
          onChange={(e) => onUpdate({ ...question, answer: e.target.value })}
          placeholder="Your answer..."
          rows={2}
          className="ml-6 w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none border-l-2 border-green-500/30 pl-3"
        />
      )}
    </div>
  )
}

// ─── Action Item ──────────────────────────────────────────────────────────────

function ActionItem({
  item, onUpdate, onDelete,
}: {
  item: ReadingActionItem
  onUpdate: (i: ReadingActionItem) => void
  onDelete: () => void
}) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/30 transition-colors group">
      <button
        onClick={() => onUpdate({ ...item, completed: !item.completed })}
        className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${
          item.completed 
            ? 'bg-primary border-primary text-primary-foreground' 
            : 'border-border hover:border-primary'
        }`}
      >
        {item.completed && <Check size={10} />}
      </button>
      <Target size={14} className="shrink-0 text-violet-500" />
      <input
        value={item.text}
        onChange={(e) => onUpdate({ ...item, text: e.target.value })}
        className={`flex-1 bg-transparent text-sm focus:outline-none ${
          item.completed ? 'line-through text-muted-foreground' : 'text-foreground'
        }`}
      />
      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-opacity"
      >
        <X size={12} />
      </button>
    </div>
  )
}

// ─── Tag Input ────────────────────────────────────────────────────────────────

function TagInput({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [input, setInput] = useState('')

  const addTag = () => {
    const tag = input.trim().toLowerCase().replace(/\s+/g, '-')
    if (tag && !tags.includes(tag)) {
      onChange([...tags, tag])
    }
    setInput('')
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tags.map((tag) => (
        <span 
          key={tag} 
          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-primary/10 text-primary"
        >
          <Hash size={10} />
          {tag}
          <button 
            onClick={() => onChange(tags.filter(t => t !== tag))}
            className="hover:text-destructive"
          >
            <X size={10} />
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
        onBlur={addTag}
        placeholder={tags.length === 0 ? 'Add tags...' : ''}
        className="text-xs bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none min-w-[80px]"
      />
    </div>
  )
}

// ─── AI Insight Panel ─────────────────────────────────────────────────────────

function AiInsightPanel({
  insight, onGenerate, loading, isOnline, data,
}: {
  insight?: ReadingNotesAiInsight
  onGenerate: () => void
  loading: boolean
  isOnline: boolean
  data: ReadingNotesData
}) {
  return (
    <div className="rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-purple-500/5 overflow-hidden">
      <div className="px-4 py-3 border-b border-violet-500/10 flex items-center gap-2">
        <Sparkles size={16} className="text-violet-500" />
        <span className="text-sm font-semibold text-foreground">AI Knowledge Assistant</span>
      </div>
      
      <div className="p-4">
        {!insight && !loading && (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full bg-violet-500/10 flex items-center justify-center mx-auto mb-3">
              <Brain size={20} className="text-violet-500" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">Turn reading into knowledge</p>
            <p className="text-xs text-muted-foreground mb-4 max-w-xs mx-auto">
              AI will analyze your highlights and generate a summary, extract key concepts, and suggest action items.
            </p>
            
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={onGenerate}
                disabled={!isOnline || data.highlights.length === 0}
                className="inline-flex items-center gap-1.5 rounded-lg bg-violet-500 px-4 py-2 text-sm font-medium text-white hover:bg-violet-600 transition-colors disabled:opacity-50"
              >
                <Sparkles size={14} /> Generate Summary
              </button>
            </div>
            
            {!isOnline && <p className="text-[10px] text-muted-foreground mt-2">Requires online connection</p>}
            {data.highlights.length === 0 && <p className="text-[10px] text-muted-foreground mt-2">Add some highlights first</p>}
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
            <Loader2 size={24} className="animate-spin text-violet-500" />
            <p className="text-sm">Analyzing your notes...</p>
          </div>
        )}

        {insight && !loading && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="rounded-lg bg-violet-500/10 border border-violet-500/20 px-3 py-2">
              <p className="text-xs font-semibold text-violet-600 mb-1 flex items-center gap-1.5">
                <AlignLeft size={12} /> Summary
              </p>
              <p className="text-sm text-foreground leading-relaxed">{insight.summary}</p>
            </div>

            {/* Key Concepts */}
            {insight.key_concepts.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <Lightbulb size={12} /> Key Concepts
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {insight.key_concepts.map((concept, i) => (
                    <span key={i} className="text-xs px-2 py-1 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                      {concept}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Themes */}
            {insight.themes.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1.5">Themes</p>
                <div className="flex flex-wrap gap-1.5">
                  {insight.themes.map((theme, i) => (
                    <span key={i} className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20">
                      {theme}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested Questions */}
            {insight.suggested_questions.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <HelpCircle size={12} /> Questions to Explore
                </p>
                <ul className="space-y-1">
                  {insight.suggested_questions.map((q, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                      <span className="text-muted-foreground">•</span>
                      {q}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Items */}
            {insight.action_items.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <Zap size={12} /> Suggested Actions
                </p>
                <ul className="space-y-1">
                  {insight.action_items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                      <CheckSquare size={12} className="mt-0.5 shrink-0 text-violet-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={onGenerate}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <RefreshCw size={11} /> Regenerate
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Related Notes Panel ──────────────────────────────────────────────────────

function RelatedNotesPanel({
  relatedNotes, onRefresh, loading,
}: {
  relatedNotes: RelatedNote[]
  onRefresh: () => void
  loading: boolean
}) {
  const navigate = useNavigate()

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LinkIcon size={14} className="text-primary" />
          <span className="text-sm font-semibold text-foreground">Related Notes</span>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
      
      <div className="p-2">
        {relatedNotes.length === 0 ? (
          <div className="text-center py-4 text-xs text-muted-foreground">
            No related notes found
          </div>
        ) : (
          <div className="space-y-1">
            {relatedNotes.map((note) => (
              <button
                key={note.noteId}
                onClick={() => navigate(`/dashboard/note/${note.noteId}`)}
                className="w-full text-left p-2 rounded-lg hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground truncate">{note.title}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {Math.round(note.similarity * 100)}%
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main ReadingNotesEditor ──────────────────────────────────────────────────

export default function ReadingNotesEditor() {
  const { noteId } = useParams<{ noteId: string }>()
  const navigate = useNavigate()
  const { notes, setActiveNote, updateNote } = useWorkspaceStore()
  const { isAuthenticated, isGuest } = useAuthStore()
  const isOnline = isAuthenticated && !isGuest

  const note = useMemo(() => notes.find((n) => n.id === noteId), [notes, noteId])

  const [data, setData] = useState<ReadingNotesData>(() => {
    if (note?.content && typeof note.content === 'object' && 'highlights' in note.content) {
      return note.content as ReadingNotesData
    }
    return createDefaultReadingNotesData()
  })

  const [aiLoading, setAiLoading] = useState(false)
  const [relatedLoading, setRelatedLoading] = useState(false)

  const { save } = useAutoSave(noteId ?? '')

  useEffect(() => { if (noteId) setActiveNote(noteId) }, [noteId, setActiveNote])
  useEffect(() => {
    if (!note && noteId) navigate('/dashboard', { replace: true })
  }, [note, noteId, navigate])

  useEffect(() => {
    if (note?.content && typeof note.content === 'object' && 'highlights' in note.content) {
      setData(note.content as ReadingNotesData)
    }
  }, [note?.id])

  const updateData = useCallback((patch: Partial<ReadingNotesData>) => {
    setData((prev) => {
      const next = { ...prev, ...patch }
      updateNote(noteId!, { content: next })
      save({ content: next })
      return next
    })
  }, [noteId, updateNote, save])

  // Highlight operations
  const addHighlights = useCallback((highlights: Omit<ReadingHighlight, 'id' | 'createdAt'>[]) => {
    const newHighlights: ReadingHighlight[] = highlights.map(h => ({
      ...h,
      id: nanoid(),
      createdAt: new Date().toISOString(),
    }))
    updateData({ highlights: [...data.highlights, ...newHighlights] })
  }, [data.highlights, updateData])

  const updateHighlight = useCallback((updated: ReadingHighlight) => {
    updateData({
      highlights: data.highlights.map(h => h.id === updated.id ? updated : h)
    })
  }, [data.highlights, updateData])

  const deleteHighlight = useCallback((id: string) => {
    updateData({ highlights: data.highlights.filter(h => h.id !== id) })
  }, [data.highlights, updateData])

  // Takeaway operations
  const addTakeaway = useCallback(() => {
    const newTakeaway: ReadingTakeaway = {
      id: nanoid(),
      text: '',
    }
    updateData({ takeaways: [...data.takeaways, newTakeaway] })
  }, [data.takeaways, updateData])

  // Question operations
  const addQuestion = useCallback(() => {
    const newQuestion: ReadingQuestion = {
      id: nanoid(),
      question: '',
      answered: false,
    }
    updateData({ questions: [...data.questions, newQuestion] })
  }, [data.questions, updateData])

  // Action item operations
  const addActionItem = useCallback(() => {
    const newItem: ReadingActionItem = {
      id: nanoid(),
      text: '',
      completed: false,
    }
    updateData({ actionItems: [...data.actionItems, newItem] })
  }, [data.actionItems, updateData])

  // AI Generation
  const generateAiInsight = async () => {
    if (!isOnline || data.highlights.length === 0) return
    setAiLoading(true)
    try {
      const result = await CloudAiService.readingNotesAnalysis({
        title: data.title,
        author: data.author,
        highlights: data.highlights.map(h => ({ text: h.text, note: h.note })),
        synthesis: data.synthesis,
      })

      const insight: ReadingNotesAiInsight = {
        summary: result.summary,
        key_concepts: result.key_concepts,
        themes: result.themes,
        suggested_questions: result.suggested_questions,
        action_items: result.action_items,
        generated_at: new Date().toISOString(),
      }
      updateData({ ai_insight: insight })
    } catch {
      // silent fail
    } finally {
      setAiLoading(false)
    }
  }

  // Find related notes
  const findRelatedNotes = async () => {
    if (!isOnline) return
    setRelatedLoading(true)
    try {
      const result = await CloudAiService.suggestRelatedNotes({
        title: data.title,
        content: data.highlights.map(h => h.text).join('\n'),
        tags: data.tags,
      })
      updateData({ relatedNotes: result.related_notes.map(r => ({
        noteId: r.note_id,
        title: r.title,
        similarity: r.similarity,
      })) })
    } catch {
      // silent fail
    } finally {
      setRelatedLoading(false)
    }
  }

  if (!note) return null

  const completedActions = data.actionItems.filter(a => a.completed).length
  const answeredQuestions = data.questions.filter(q => q.answered).length

  return (
    <div className="flex h-full overflow-hidden bg-background">
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <div className="shrink-0 border-b border-border px-6 py-2">
          <Breadcrumb note={note} />
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5" style={{ scrollbarWidth: 'thin' }}>
          <div className="max-w-4xl mx-auto">
            {/* Header Section */}
            <div className="mb-6">
              <NoteTitleInput note={note} placeholder="Reading Notes Title" />
              
              {/* Metadata Grid */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl border border-border bg-card">
                {/* Author */}
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Author</label>
                  <div className="flex items-center gap-2">
                    <BookOpen size={14} className="text-muted-foreground" />
                    <input
                      value={data.author}
                      onChange={(e) => updateData({ author: e.target.value })}
                      placeholder="Author name"
                      className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                    />
                  </div>
                </div>

                {/* Source URL */}
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Source</label>
                  <div className="flex items-center gap-2">
                    <LinkIcon size={14} className="text-muted-foreground" />
                    <input
                      value={data.sourceUrl || ''}
                      onChange={(e) => updateData({ sourceUrl: e.target.value })}
                      placeholder="https://..."
                      className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                    />
                    {data.sourceUrl && (
                      <a 
                        href={data.sourceUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary"
                      >
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </div>

                {/* Type & Status */}
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Type</label>
                  <select
                    value={data.type}
                    onChange={(e) => updateData({ type: e.target.value as ReadingType })}
                    className="w-full bg-transparent text-sm text-foreground focus:outline-none"
                  >
                    {READING_TYPE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.icon} {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Status</label>
                  <select
                    value={data.status}
                    onChange={(e) => updateData({ status: e.target.value as ReadingStatus })}
                    className="w-full bg-transparent text-sm text-foreground focus:outline-none"
                  >
                    {READING_STATUS_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Progress & Rating Row */}
              <div className="mt-3 flex flex-wrap items-center gap-4 px-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Progress</span>
                  <div className="w-32">
                    <ProgressBar value={data.progress} onChange={(v) => updateData({ progress: v })} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Rating</span>
                  <Rating value={data.rating} onChange={(v) => updateData({ rating: v })} />
                </div>
                <div className="flex-1" />
                <TagInput tags={data.tags} onChange={(tags) => updateData({ tags })} />
              </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Left Column - Main Content */}
              <div className="lg:col-span-2 space-y-5">
                {/* Highlights Section */}
                <Section 
                  icon={<Highlighter size={16} />} 
                  title="Highlights" 
                  accent="text-amber-500"
                  badge={data.highlights.length}
                  action={
                    <button
                      onClick={() => addHighlights([{ text: '', color: 'yellow' }])}
                      className="text-xs px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    >
                      <Plus size={12} className="inline mr-1" /> Add
                    </button>
                  }
                >
                  <div className="space-y-2">
                    {data.highlights.map((highlight) => (
                      <HighlightCard
                        key={highlight.id}
                        highlight={highlight}
                        onUpdate={updateHighlight}
                        onDelete={() => deleteHighlight(highlight.id)}
                      />
                    ))}
                    
                    <BulkHighlightInput onAdd={addHighlights} />
                  </div>
                </Section>

                {/* Takeaways Section */}
                <Section 
                  icon={<Lightbulb size={16} />} 
                  title="Key Takeaways" 
                  accent="text-emerald-500"
                  badge={data.takeaways.length}
                  action={
                    <button
                      onClick={addTakeaway}
                      className="text-xs px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    >
                      <Plus size={12} className="inline mr-1" /> Add
                    </button>
                  }
                >
                  <div className="space-y-1">
                    {data.takeaways.map((takeaway) => (
                      <EditableListItem
                        key={takeaway.id}
                        item={takeaway}
                        onUpdate={(updated) => updateData({
                          takeaways: data.takeaways.map(t => t.id === updated.id ? updated : t)
                        })}
                        onDelete={() => updateData({
                          takeaways: data.takeaways.filter(t => t.id !== takeaway.id)
                        })}
                        icon={Zap}
                        accentColor="text-emerald-500"
                      />
                    ))}
                    {data.takeaways.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        Add key takeaways from your reading
                      </p>
                    )}
                  </div>
                </Section>

                {/* Questions Section */}
                <Section 
                  icon={<HelpCircle size={16} />} 
                  title="Questions" 
                  accent="text-blue-500"
                  badge={data.questions.length}
                  action={
                    <button
                      onClick={addQuestion}
                      className="text-xs px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    >
                      <Plus size={12} className="inline mr-1" /> Add
                    </button>
                  }
                >
                  <div className="space-y-2">
                    {data.questions.map((question) => (
                      <QuestionItem
                        key={question.id}
                        question={question}
                        onUpdate={(updated) => updateData({
                          questions: data.questions.map(q => q.id === updated.id ? updated : q)
                        })}
                        onDelete={() => updateData({
                          questions: data.questions.filter(q => q.id !== question.id)
                        })}
                      />
                    ))}
                    {data.questions.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        Record questions that came up during reading
                      </p>
                    )}
                  </div>
                </Section>

                {/* Action Items Section */}
                <Section 
                  icon={<CheckSquare size={16} />} 
                  title="Action Items" 
                  accent="text-violet-500"
                  badge={data.actionItems.length}
                  action={
                    <button
                      onClick={addActionItem}
                      className="text-xs px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    >
                      <Plus size={12} className="inline mr-1" /> Add
                    </button>
                  }
                >
                  <div className="space-y-1">
                    {data.actionItems.map((item) => (
                      <ActionItem
                        key={item.id}
                        item={item}
                        onUpdate={(updated) => updateData({
                          actionItems: data.actionItems.map(i => i.id === updated.id ? updated : i)
                        })}
                        onDelete={() => updateData({
                          actionItems: data.actionItems.filter(i => i.id !== item.id)
                        })}
                      />
                    ))}
                    {data.actionItems.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        Extract actionable items from your reading
                      </p>
                    )}
                  </div>
                </Section>

                {/* Synthesis Section */}
                <Section 
                  icon={<AlignLeft size={16} />} 
                  title="Synthesis & Notes" 
                  accent="text-muted-foreground"
                  defaultOpen={false}
                >
                  <textarea
                    value={data.synthesis || ''}
                    onChange={(e) => updateData({ synthesis: e.target.value })}
                    placeholder="Write your synthesis, connect ideas, and expand on your understanding..."
                    rows={8}
                    className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none leading-relaxed"
                  />
                </Section>
              </div>

              {/* Right Column - AI & Related */}
              <div className="space-y-5">
                {/* AI Insights */}
                <AiInsightPanel
                  insight={data.ai_insight}
                  onGenerate={generateAiInsight}
                  loading={aiLoading}
                  isOnline={isOnline}
                  data={data}
                />

                {/* Related Notes */}
                <RelatedNotesPanel
                  relatedNotes={data.relatedNotes}
                  onRefresh={findRelatedNotes}
                  loading={relatedLoading}
                />

                {/* Reading Stats */}
                <div className="rounded-xl border border-border bg-card p-4">
                  <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <BarChart3 size={14} className="text-primary" />
                    Reading Stats
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Highlights</span>
                      <span className="font-medium">{data.highlights.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Takeaways</span>
                      <span className="font-medium">{data.takeaways.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Questions</span>
                      <span className="font-medium">{answeredQuestions}/{data.questions.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Actions</span>
                      <span className="font-medium">{completedActions}/{data.actionItems.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pb-10" />
          </div>
        </div>
      </div>
    </div>
  )
}
