import { useMemo, useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router'
import { nanoid } from 'nanoid'
import { format, parseISO, isAfter, isBefore, differenceInDays, addDays } from 'date-fns'
import {
  Plus, Trash2, ChevronDown, ChevronRight, Sparkles, Loader2, Flag,
  LayoutList, Kanban, BarChart2, Calendar, CheckCircle2, Circle,
  AlertTriangle, Clock, Tag, User, Link2, ChevronUp, X, Edit3,
  GripVertical, Target, TrendingUp, Zap, RefreshCw,
} from 'lucide-react'
import { useWorkspaceStore } from '@/store/workspaceStore'
import { useAutoSave } from '@/hooks/useAutoSave'
import { useAuthStore } from '@/store/authStore'
import Breadcrumb from '@/components/dashboard/Breadcrumb'
import NoteTitleInput from '@/components/dashboard/NoteTitleInput'
import { CloudAiService } from '@/lib/cloudAiService'
import type {
  ProjectData, ProjectTask, ProjectMilestone, ProjectStatusDef,
  ProjectSubtask, TaskPriority,
} from '@/types/project'
import {
  createDefaultProjectData, calcMilestoneProgress, calcProjectHealth,
  PRIORITY_CONFIG, DEFAULT_STATUSES,
} from '@/types/project'

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewMode = 'list' | 'board' | 'timeline'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  planning:   'bg-slate-500/15 text-slate-600 dark:text-slate-300',
  active:     'bg-blue-500/15 text-blue-600 dark:text-blue-300',
  on_hold:    'bg-yellow-500/15 text-yellow-600 dark:text-yellow-300',
  completed:  'bg-green-500/15 text-green-600 dark:text-green-300',
}

const HEALTH_CONFIG = {
  on_track: { label: 'On Track',  icon: TrendingUp,     color: 'text-green-500' },
  at_risk:  { label: 'At Risk',   icon: AlertTriangle,   color: 'text-yellow-500' },
  delayed:  { label: 'Delayed',   icon: AlertTriangle,   color: 'text-red-500' },
}

// ─── Priority Badge ───────────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const cfg = PRIORITY_CONFIG[priority]
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${cfg.bg} ${cfg.color}`}>
      <Flag size={9} />
      {cfg.label}
    </span>
  )
}

// ─── Task Row (List view) ─────────────────────────────────────────────────────

function TaskRow({
  task, statuses, onToggleDone, onSelect, onDelete,
}: {
  task: ProjectTask
  statuses: ProjectStatusDef[]
  onToggleDone: (id: string) => void
  onSelect: (task: ProjectTask) => void
  onDelete: (id: string) => void
}) {
  const statusDef = statuses.find((s) => s.id === task.statusId)
  const isDone = statusDef?.label.toLowerCase() === 'done'
  const isOverdue = task.dueDate && isAfter(new Date(), parseISO(task.dueDate)) && !isDone
  const doneSubs = task.subtasks.filter((s) => s.done).length

  return (
    <div
      className="group flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-muted/40 transition-colors cursor-pointer"
      onClick={() => onSelect(task)}
    >
      <button
        className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
        onClick={(e) => { e.stopPropagation(); onToggleDone(task.id) }}
      >
        {isDone
          ? <CheckCircle2 size={16} className="text-green-500" />
          : <Circle size={16} />}
      </button>

      <span className={`flex-1 text-sm truncate ${isDone ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
        {task.title || <span className="text-muted-foreground italic">Untitled task</span>}
      </span>

      <div className="flex items-center gap-2 shrink-0">
        {task.subtasks.length > 0 && (
          <span className="text-[10px] text-muted-foreground">{doneSubs}/{task.subtasks.length}</span>
        )}
        <PriorityBadge priority={task.priority} />
        {statusDef && (
          <span
            className="h-2 w-2 rounded-full shrink-0"
            style={{ backgroundColor: statusDef.color }}
          />
        )}
        {task.dueDate && (
          <span className={`text-[10px] ${isOverdue ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
            {format(parseISO(task.dueDate), 'MMM d')}
          </span>
        )}
        {task.assignedTo && (
          <span className="text-[10px] text-muted-foreground truncate max-w-[60px]">{task.assignedTo}</span>
        )}
        <button
          className="opacity-0 group-hover:opacity-100 rounded p-0.5 hover:bg-accent text-muted-foreground"
          onClick={(e) => { e.stopPropagation(); onDelete(task.id) }}
        >
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  )
}

// ─── List View ────────────────────────────────────────────────────────────────

function ListView({
  data, onUpdate, onSelectTask,
}: {
  data: ProjectData
  onUpdate: (patch: Partial<ProjectData>) => void
  onSelectTask: (task: ProjectTask) => void
}) {
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [addingToMilestone, setAddingToMilestone] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const ungrouped = data.tasks.filter((t) => !t.milestoneId)

  const toggleDone = (taskId: string) => {
    const doneStatus = data.statuses.find((s) => s.label.toLowerCase() === 'done')
    const firstStatus = data.statuses[0]
    const task = data.tasks.find((t) => t.id === taskId)
    if (!task) return
    const currentDef = data.statuses.find((s) => s.id === task.statusId)
    const newStatusId = currentDef?.label.toLowerCase() === 'done'
      ? (firstStatus?.id ?? task.statusId)
      : (doneStatus?.id ?? task.statusId)
    onUpdate({
      tasks: data.tasks.map((t) => t.id === taskId ? { ...t, statusId: newStatusId, updatedAt: new Date().toISOString() } : t),
    })
  }

  const deleteTask = (taskId: string) => {
    onUpdate({
      tasks: data.tasks.filter((t) => t.id !== taskId),
      milestones: data.milestones.map((m) => ({ ...m, taskIds: m.taskIds.filter((id) => id !== taskId) })),
    })
  }

  const addTask = (milestoneId: string | null) => {
    if (!newTaskTitle.trim()) return
    const newTask: ProjectTask = {
      id: nanoid(),
      title: newTaskTitle.trim(),
      statusId: data.statuses[0]?.id ?? 'todo',
      priority: 'medium',
      labels: [],
      subtasks: [],
      dependencies: [],
      milestoneId: milestoneId ?? undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const updates: Partial<ProjectData> = { tasks: [...data.tasks, newTask] }
    if (milestoneId) {
      updates.milestones = data.milestones.map((m) =>
        m.id === milestoneId ? { ...m, taskIds: [...m.taskIds, newTask.id] } : m
      )
    }
    onUpdate(updates)
    setNewTaskTitle('')
    setAddingToMilestone(null)
  }

  const addMilestone = () => {
    const m: ProjectMilestone = {
      id: nanoid(), title: 'New Milestone',
      status: 'pending', taskIds: [],
    }
    onUpdate({ milestones: [...data.milestones, m] })
  }

  return (
    <div className="space-y-4">
      {/* Milestones */}
      {data.milestones.map((milestone) => {
        const tasks = data.tasks.filter((t) => milestone.taskIds.includes(t.id))
        const doneIds = data.statuses.filter((s) => s.label.toLowerCase() === 'done').map((s) => s.id)
        const progress = calcMilestoneProgress(milestone, data.tasks, doneIds)
        return (
          <MilestoneSection
            key={milestone.id}
            milestone={milestone}
            tasks={tasks}
            progress={progress}
            statuses={data.statuses}
            onToggleDone={toggleDone}
            onSelectTask={onSelectTask}
            onDeleteTask={deleteTask}
            onUpdateMilestone={(patch) =>
              onUpdate({ milestones: data.milestones.map((m) => m.id === milestone.id ? { ...m, ...patch } : m) })
            }
            onDeleteMilestone={() =>
              onUpdate({ milestones: data.milestones.filter((m) => m.id !== milestone.id) })
            }
            addingHere={addingToMilestone === milestone.id}
            newTaskTitle={newTaskTitle}
            onNewTaskTitle={setNewTaskTitle}
            onAddTask={() => addTask(milestone.id)}
            onStartAdding={() => { setAddingToMilestone(milestone.id); setTimeout(() => inputRef.current?.focus(), 50) }}
            inputRef={inputRef}
          />
        )
      })}

      {/* Ungrouped tasks */}
      {(ungrouped.length > 0 || !data.milestones.length) && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {data.milestones.length ? 'No Milestone' : 'Tasks'}
            </span>
          </div>
          <div className="p-2">
            {ungrouped.map((t) => (
              <TaskRow
                key={t.id} task={t} statuses={data.statuses}
                onToggleDone={toggleDone} onSelect={onSelectTask} onDelete={deleteTask}
              />
            ))}
          </div>
          {/* Add task row */}
          <div className="px-4 pb-3">
            {addingToMilestone === 'none' ? (
              <div className="flex gap-2 mt-1">
                <input
                  ref={inputRef}
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') addTask(null); if (e.key === 'Escape') { setAddingToMilestone(null); setNewTaskTitle('') } }}
                  placeholder="Task title… (Enter to add)"
                  autoFocus
                  className="flex-1 rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button onClick={() => addTask(null)} className="rounded-lg bg-primary px-3 py-1.5 text-xs text-primary-foreground">Add</button>
                <button onClick={() => { setAddingToMilestone(null); setNewTaskTitle('') }} className="rounded-lg border border-border px-3 py-1.5 text-xs">Cancel</button>
              </div>
            ) : (
              <button
                onClick={() => { setAddingToMilestone('none'); setTimeout(() => inputRef.current?.focus(), 50) }}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mt-1"
              >
                <Plus size={14} /> Add task
              </button>
            )}
          </div>
        </div>
      )}

      {/* Bottom actions */}
      <div className="flex gap-3">
        <button
          onClick={addMilestone}
          className="flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <Target size={14} /> Add milestone
        </button>
        {data.milestones.length > 0 && (
          <button
            onClick={() => { setAddingToMilestone('none'); setTimeout(() => inputRef.current?.focus(), 50) }}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <Plus size={14} /> Add ungrouped task
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Milestone Section ────────────────────────────────────────────────────────

function MilestoneSection({
  milestone, tasks, progress, statuses,
  onToggleDone, onSelectTask, onDeleteTask,
  onUpdateMilestone, onDeleteMilestone,
  addingHere, newTaskTitle, onNewTaskTitle, onAddTask, onStartAdding, inputRef,
}: {
  milestone: ProjectMilestone
  tasks: ProjectTask[]
  progress: number
  statuses: ProjectStatusDef[]
  onToggleDone: (id: string) => void
  onSelectTask: (t: ProjectTask) => void
  onDeleteTask: (id: string) => void
  onUpdateMilestone: (patch: Partial<ProjectMilestone>) => void
  onDeleteMilestone: () => void
  addingHere: boolean
  newTaskTitle: string
  onNewTaskTitle: (v: string) => void
  onAddTask: () => void
  onStartAdding: () => void
  inputRef: React.RefObject<HTMLInputElement | null>
}) {
  const [open, setOpen] = useState(true)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState(milestone.title)

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Milestone header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border hover:bg-muted/20 group">
        <button onClick={() => setOpen((v) => !v)} className="text-muted-foreground">
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        <Target size={14} className="text-violet-500 shrink-0" />
        {editingTitle ? (
          <input
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={() => { onUpdateMilestone({ title: titleDraft }); setEditingTitle(false) }}
            onKeyDown={(e) => { if (e.key === 'Enter') { onUpdateMilestone({ title: titleDraft }); setEditingTitle(false) } }}
            autoFocus
            className="flex-1 bg-transparent text-sm font-semibold text-foreground outline-none border-b border-primary"
          />
        ) : (
          <span
            className="flex-1 text-sm font-semibold text-foreground cursor-text"
            onDoubleClick={() => setEditingTitle(true)}
          >
            {milestone.title}
          </span>
        )}
        {milestone.dueDate && (
          <span className="text-[10px] text-muted-foreground shrink-0">
            Due {format(parseISO(milestone.dueDate), 'MMM d')}
          </span>
        )}
        <span className="text-[10px] font-medium text-muted-foreground shrink-0">{progress}%</span>
        <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden shrink-0">
          <div
            className="h-full rounded-full transition-all bg-violet-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <button
          onClick={onDeleteMilestone}
          className="opacity-0 group-hover:opacity-100 rounded p-0.5 hover:bg-accent text-muted-foreground ml-1"
        >
          <Trash2 size={11} />
        </button>
      </div>

      {open && (
        <div className="p-2">
          {tasks.map((t) => (
            <TaskRow
              key={t.id} task={t} statuses={statuses}
              onToggleDone={onToggleDone} onSelect={onSelectTask} onDelete={onDeleteTask}
            />
          ))}
          <div className="px-2 mt-1">
            {addingHere ? (
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  value={newTaskTitle}
                  onChange={(e) => onNewTaskTitle(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') onAddTask(); if (e.key === 'Escape') onNewTaskTitle('') }}
                  placeholder="Task title… (Enter to add)"
                  autoFocus
                  className="flex-1 rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button onClick={onAddTask} className="rounded-lg bg-primary px-3 py-1.5 text-xs text-primary-foreground">Add</button>
              </div>
            ) : (
              <button
                onClick={onStartAdding}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                <Plus size={14} /> Add task
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Board View ───────────────────────────────────────────────────────────────

function BoardView({
  data, onUpdate, onSelectTask,
}: {
  data: ProjectData
  onUpdate: (patch: Partial<ProjectData>) => void
  onSelectTask: (task: ProjectTask) => void
}) {
  const [dragging, setDragging] = useState<string | null>(null)
  const [newTaskStatus, setNewTaskStatus] = useState<string | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState('')

  const moveTask = (taskId: string, toStatusId: string) => {
    onUpdate({
      tasks: data.tasks.map((t) =>
        t.id === taskId ? { ...t, statusId: toStatusId, updatedAt: new Date().toISOString() } : t
      ),
    })
  }

  const addTask = (statusId: string) => {
    if (!newTaskTitle.trim()) return
    const task: ProjectTask = {
      id: nanoid(), title: newTaskTitle.trim(), statusId,
      priority: 'medium', labels: [], subtasks: [], dependencies: [],
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    }
    onUpdate({ tasks: [...data.tasks, task] })
    setNewTaskTitle('')
    setNewTaskStatus(null)
  }

  const deleteTask = (id: string) => {
    onUpdate({
      tasks: data.tasks.filter((t) => t.id !== id),
      milestones: data.milestones.map((m) => ({ ...m, taskIds: m.taskIds.filter((tid) => tid !== id) })),
    })
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2" style={{ minHeight: 400 }}>
      {[...data.statuses].sort((a, b) => a.order - b.order).map((status) => {
        const columnTasks = data.tasks.filter((t) => t.statusId === status.id)
        return (
          <div
            key={status.id}
            className="flex flex-col rounded-xl border border-border bg-muted/20 shrink-0"
            style={{ width: 260 }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              if (dragging) moveTask(dragging, status.id)
              setDragging(null)
            }}
          >
            {/* Column header */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border">
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: status.color }} />
              <span className="flex-1 text-xs font-semibold uppercase tracking-wide text-foreground">{status.label}</span>
              <span className="text-[10px] text-muted-foreground">{columnTasks.length}</span>
            </div>

            {/* Cards */}
            <div className="flex-1 p-2 space-y-2 overflow-y-auto" style={{ maxHeight: 480 }}>
              {columnTasks.map((task) => (
                <BoardCard
                  key={task.id}
                  task={task}
                  onSelect={() => onSelectTask(task)}
                  onDelete={() => deleteTask(task.id)}
                  onDragStart={() => setDragging(task.id)}
                  onDragEnd={() => setDragging(null)}
                />
              ))}
            </div>

            {/* Add task */}
            <div className="p-2 border-t border-border">
              {newTaskStatus === status.id ? (
                <div className="space-y-1.5">
                  <input
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') addTask(status.id); if (e.key === 'Escape') { setNewTaskStatus(null); setNewTaskTitle('') } }}
                    placeholder="Task title…"
                    autoFocus
                    className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <div className="flex gap-1.5">
                    <button onClick={() => addTask(status.id)} className="flex-1 rounded-lg bg-primary py-1 text-xs text-primary-foreground">Add</button>
                    <button onClick={() => { setNewTaskStatus(null); setNewTaskTitle('') }} className="rounded-lg border border-border px-2 py-1 text-xs">Cancel</button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setNewTaskStatus(status.id)}
                  className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                >
                  <Plus size={13} /> Add task
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function BoardCard({
  task, onSelect, onDelete, onDragStart, onDragEnd,
}: {
  task: ProjectTask
  onSelect: () => void
  onDelete: () => void
  onDragStart: () => void
  onDragEnd: () => void
}) {
  const isOverdue = task.dueDate && isAfter(new Date(), parseISO(task.dueDate))
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onSelect}
      className="group rounded-lg border border-border bg-card p-2.5 cursor-pointer hover:border-primary/40 hover:shadow-sm transition-all"
    >
      <div className="flex items-start gap-1.5 mb-2">
        <GripVertical size={12} className="mt-0.5 text-muted-foreground/40 shrink-0" />
        <p className="flex-1 text-sm text-foreground leading-snug">{task.title}</p>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="opacity-0 group-hover:opacity-100 shrink-0 rounded p-0.5 hover:bg-accent text-muted-foreground"
        >
          <X size={11} />
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <PriorityBadge priority={task.priority} />
        {task.subtasks.length > 0 && (
          <span className="text-[10px] text-muted-foreground">
            {task.subtasks.filter((s) => s.done).length}/{task.subtasks.length} subtasks
          </span>
        )}
        {task.dueDate && (
          <span className={`text-[10px] ${isOverdue ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
            {format(parseISO(task.dueDate), 'MMM d')}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Timeline View ────────────────────────────────────────────────────────────

function TimelineView({ data }: { data: ProjectData }) {
  // Compute date range
  const allDates = data.tasks
    .flatMap((t) => [t.startDate, t.dueDate].filter(Boolean) as string[])
  if (!allDates.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
        <BarChart2 size={32} className="mb-3 opacity-40" />
        <p className="text-sm">No tasks with dates yet.</p>
        <p className="text-xs mt-1">Add start/due dates to tasks to see them on the timeline.</p>
      </div>
    )
  }

  const earliest = allDates.reduce((a, b) => (a < b ? a : b))
  const latest = allDates.reduce((a, b) => (a > b ? a : b))
  const rangeStart = parseISO(earliest)
  const rangeEnd = parseISO(latest)
  const totalDays = Math.max(differenceInDays(rangeEnd, rangeStart), 1)

  // Generate week labels
  const weeks: Date[] = []
  let d = rangeStart
  while (!isAfter(d, addDays(rangeEnd, 7))) {
    weeks.push(d)
    d = addDays(d, 7)
  }

  const getBar = (task: ProjectTask) => {
    if (!task.dueDate) return null
    const start = task.startDate ? parseISO(task.startDate) : parseISO(task.dueDate)
    const end = parseISO(task.dueDate)
    const left = Math.max(0, (differenceInDays(start, rangeStart) / totalDays) * 100)
    const width = Math.max(1, (differenceInDays(end, start) / totalDays) * 100)
    const statusDef = data.statuses.find((s) => s.id === task.statusId)
    return { left, width, color: statusDef?.color ?? '#94a3b8' }
  }

  const tasksWithDates = data.tasks.filter((t) => t.dueDate)

  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: 700 }}>
        {/* Header row with week labels */}
        <div className="flex items-center border-b border-border mb-1">
          <div className="w-48 shrink-0 px-3 py-2 text-xs font-semibold text-muted-foreground">Task</div>
          <div className="flex-1 relative h-8">
            {weeks.map((w, i) => (
              <span
                key={i}
                className="absolute text-[10px] text-muted-foreground"
                style={{ left: `${(differenceInDays(w, rangeStart) / totalDays) * 100}%` }}
              >
                {format(w, 'MMM d')}
              </span>
            ))}
          </div>
        </div>

        {/* Task rows */}
        {tasksWithDates.map((task) => {
          const bar = getBar(task)
          if (!bar) return null
          const isOverdue = task.dueDate && isAfter(new Date(), parseISO(task.dueDate))
          const statusDef = data.statuses.find((s) => s.id === task.statusId)
          return (
            <div key={task.id} className="flex items-center border-b border-border/50 hover:bg-muted/20">
              <div className="w-48 shrink-0 px-3 py-2.5 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: statusDef?.color ?? '#94a3b8' }} />
                <span className={`text-xs truncate ${isOverdue ? 'text-red-500' : 'text-foreground'}`}>{task.title}</span>
              </div>
              <div className="flex-1 relative h-9 flex items-center">
                <div
                  className="absolute h-5 rounded-full flex items-center px-2"
                  style={{
                    left: `${bar.left}%`,
                    width: `${bar.width}%`,
                    backgroundColor: bar.color + '33',
                    border: `1px solid ${bar.color}66`,
                    minWidth: 8,
                  }}
                >
                  <span className="text-[9px] truncate font-medium" style={{ color: bar.color }}>{task.title}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Task Detail Panel ────────────────────────────────────────────────────────

function TaskDetailPanel({
  task, data, onUpdate, onClose,
}: {
  task: ProjectTask
  data: ProjectData
  onUpdate: (patch: Partial<ProjectData>) => void
  onClose: () => void
}) {
  const [localTask, setLocalTask] = useState<ProjectTask>(task)

  useEffect(() => { setLocalTask(task) }, [task.id])

  const save = (patch: Partial<ProjectTask>) => {
    const updated = { ...localTask, ...patch, updatedAt: new Date().toISOString() }
    setLocalTask(updated)
    onUpdate({ tasks: data.tasks.map((t) => t.id === task.id ? updated : t) })
  }

  const addSubtask = () => {
    const st: ProjectSubtask = { id: nanoid(), title: '', done: false }
    save({ subtasks: [...localTask.subtasks, st] })
  }

  const updateSubtask = (id: string, patch: Partial<ProjectSubtask>) => {
    save({ subtasks: localTask.subtasks.map((s) => s.id === id ? { ...s, ...patch } : s) })
  }

  const deleteSubtask = (id: string) => {
    save({ subtasks: localTask.subtasks.filter((s) => s.id !== id) })
  }

  const milestone = data.milestones.find((m) => m.id === localTask.milestoneId)

  return (
    <div className="flex flex-col h-full bg-background border-l border-border overflow-hidden" style={{ width: 340 }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
        <span className="flex-1 text-sm font-semibold text-foreground truncate">Task Detail</span>
        <button onClick={onClose} className="rounded p-1 hover:bg-accent text-muted-foreground">
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Title */}
        <input
          value={localTask.title}
          onChange={(e) => save({ title: e.target.value })}
          placeholder="Task title…"
          className="w-full bg-transparent text-base font-semibold text-foreground outline-none placeholder:text-muted-foreground"
        />

        {/* Description */}
        <textarea
          value={localTask.description ?? ''}
          onChange={(e) => save({ description: e.target.value })}
          placeholder="Add description…"
          rows={3}
          className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none"
        />

        <div className="grid grid-cols-2 gap-3 text-xs">
          {/* Status */}
          <div>
            <label className="block text-muted-foreground mb-1 font-medium">Status</label>
            <select
              value={localTask.statusId}
              onChange={(e) => save({ statusId: e.target.value })}
              className="w-full rounded-lg border border-border bg-muted/30 px-2 py-1.5 text-foreground focus:outline-none"
            >
              {data.statuses.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>
          {/* Priority */}
          <div>
            <label className="block text-muted-foreground mb-1 font-medium">Priority</label>
            <select
              value={localTask.priority}
              onChange={(e) => save({ priority: e.target.value as TaskPriority })}
              className="w-full rounded-lg border border-border bg-muted/30 px-2 py-1.5 text-foreground focus:outline-none"
            >
              {(['urgent', 'high', 'medium', 'low'] as TaskPriority[]).map((p) => (
                <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>
              ))}
            </select>
          </div>
          {/* Assignee */}
          <div>
            <label className="block text-muted-foreground mb-1 font-medium">Assignee</label>
            <input
              value={localTask.assignedTo ?? ''}
              onChange={(e) => save({ assignedTo: e.target.value || undefined })}
              placeholder="Name…"
              className="w-full rounded-lg border border-border bg-muted/30 px-2 py-1.5 text-foreground focus:outline-none"
            />
          </div>
          {/* Milestone */}
          <div>
            <label className="block text-muted-foreground mb-1 font-medium">Milestone</label>
            <select
              value={localTask.milestoneId ?? ''}
              onChange={(e) => {
                const newMilestoneId = e.target.value || undefined
                const oldMilestoneId = localTask.milestoneId
                save({ milestoneId: newMilestoneId })
                // Update milestone taskIds
                const milestones = data.milestones.map((m) => {
                  if (m.id === oldMilestoneId) return { ...m, taskIds: m.taskIds.filter((id) => id !== task.id) }
                  if (m.id === newMilestoneId) return { ...m, taskIds: [...m.taskIds, task.id] }
                  return m
                })
                onUpdate({ milestones })
              }}
              className="w-full rounded-lg border border-border bg-muted/30 px-2 py-1.5 text-foreground focus:outline-none"
            >
              <option value="">None</option>
              {data.milestones.map((m) => (
                <option key={m.id} value={m.id}>{m.title}</option>
              ))}
            </select>
          </div>
          {/* Start date */}
          <div>
            <label className="block text-muted-foreground mb-1 font-medium">Start Date</label>
            <input
              type="date"
              value={localTask.startDate ? localTask.startDate.slice(0, 10) : ''}
              onChange={(e) => save({ startDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
              className="w-full rounded-lg border border-border bg-muted/30 px-2 py-1.5 text-foreground focus:outline-none"
            />
          </div>
          {/* Due date */}
          <div>
            <label className="block text-muted-foreground mb-1 font-medium">Due Date</label>
            <input
              type="date"
              value={localTask.dueDate ? localTask.dueDate.slice(0, 10) : ''}
              onChange={(e) => save({ dueDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
              className="w-full rounded-lg border border-border bg-muted/30 px-2 py-1.5 text-foreground focus:outline-none"
            />
          </div>
        </div>

        {/* Subtasks */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-muted-foreground">
              Subtasks ({localTask.subtasks.filter((s) => s.done).length}/{localTask.subtasks.length})
            </label>
            <button onClick={addSubtask} className="text-xs text-primary hover:underline flex items-center gap-1">
              <Plus size={11} /> Add
            </button>
          </div>
          <div className="space-y-1.5">
            {localTask.subtasks.map((st) => (
              <div key={st.id} className="flex items-center gap-2 group">
                <input
                  type="checkbox"
                  checked={st.done}
                  onChange={() => updateSubtask(st.id, { done: !st.done })}
                  className="h-3.5 w-3.5 rounded accent-primary shrink-0"
                />
                <input
                  value={st.title}
                  onChange={(e) => updateSubtask(st.id, { title: e.target.value })}
                  placeholder="Subtask…"
                  className={`flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground ${st.done ? 'line-through text-muted-foreground' : 'text-foreground'}`}
                />
                <button
                  onClick={() => deleteSubtask(st.id)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground"
                >
                  <X size={11} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Linked note */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Linked Note ID</label>
          <input
            value={localTask.linkedNoteId ?? ''}
            onChange={(e) => save({ linkedNoteId: e.target.value || undefined })}
            placeholder="Note ID…"
            className="w-full rounded-lg border border-border bg-muted/30 px-2 py-1.5 text-xs text-foreground focus:outline-none"
          />
        </div>
      </div>
    </div>
  )
}

// ─── AI Planning Panel ────────────────────────────────────────────────────────

function AiPlanningPanel({
  note, data, onUpdate, onClose, isOnline,
}: {
  note: { title: string }
  data: ProjectData
  onUpdate: (patch: Partial<ProjectData>) => void
  onClose: () => void
  isOnline: boolean
}) {
  const [loading, setLoading] = useState(false)
  const [plan, setPlan] = useState(data.aiPlan ?? '')
  const [error, setError] = useState('')

  const generate = async () => {
    if (!isOnline) { setError('Requires online connection.'); return }
    setLoading(true)
    setError('')
    try {
      const goalsText = data.goals.length ? `Goals:\n${data.goals.join('\n')}` : ''
      const context = [
        `Project: ${note.title}`,
        data.description && `Description: ${data.description}`,
        goalsText,
        data.startDate && `Start: ${format(parseISO(data.startDate), 'MMM d, yyyy')}`,
        data.endDate && `End: ${format(parseISO(data.endDate), 'MMM d, yyyy')}`,
      ].filter(Boolean).join('\n')

      const result = await CloudAiService.planProject({ context, title: note.title })
      setPlan(result.plan)
      onUpdate({ aiPlan: result.plan })

      // Parse suggested tasks from result
      if (result.tasks?.length) {
        const newTasks: ProjectTask[] = result.tasks.map((t) => ({
          id: nanoid(),
          title: t.title,
          statusId: data.statuses[0]?.id ?? 'todo',
          priority: (t.priority as TaskPriority) ?? 'medium',
          labels: [],
          subtasks: [],
          dependencies: [],
          dueDate: t.due_date ? new Date(t.due_date).toISOString() : undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }))
        onUpdate({ tasks: [...data.tasks, ...newTasks] })
      }

      if (result.milestones?.length && data.milestones.length === 0) {
        const newMilestones: ProjectMilestone[] = result.milestones.map((m) => ({
          id: nanoid(),
          title: m.title,
          status: 'pending' as const,
          taskIds: [],
          dueDate: m.due_date ? new Date(m.due_date).toISOString() : undefined,
        }))
        onUpdate({ milestones: newMilestones })
      }
    } catch {
      setError('Failed to generate plan. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-background border-l border-border overflow-hidden" style={{ width: 320 }}>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
        <Sparkles size={14} className="text-violet-500" />
        <span className="flex-1 text-sm font-semibold text-foreground">AI Planning</span>
        <button onClick={onClose} className="rounded p-1 hover:bg-accent text-muted-foreground">
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {!plan && !loading && (
          <div className="rounded-xl border border-dashed border-violet-500/30 bg-violet-500/5 p-5 text-center">
            <Sparkles size={20} className="mx-auto mb-2 text-violet-400" />
            <p className="text-sm font-medium text-foreground mb-1">Plan this project</p>
            <p className="text-xs text-muted-foreground mb-4">
              AI will generate milestones, tasks, and a structured timeline based on your project goals.
            </p>
            <button
              onClick={generate}
              disabled={!isOnline}
              className="flex items-center gap-1.5 mx-auto rounded-xl bg-violet-500 px-4 py-2 text-sm font-medium text-white hover:bg-violet-600 transition-colors disabled:opacity-50"
            >
              <Zap size={14} /> Generate plan
            </button>
            {!isOnline && (
              <p className="text-[10px] text-muted-foreground mt-2">Requires online connection</p>
            )}
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center gap-3 py-10 text-muted-foreground">
            <Loader2 size={22} className="animate-spin text-violet-500" />
            <p className="text-sm">Analyzing project and generating plan…</p>
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {plan && !loading && (
          <div className="space-y-3">
            <div className="rounded-xl bg-violet-500/8 border border-violet-500/15 px-4 py-3">
              <p className="text-xs font-semibold text-violet-500 mb-1.5">Generated Plan</p>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{plan}</p>
            </div>
            <button
              onClick={generate}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <RefreshCw size={11} /> Regenerate
            </button>
          </div>
        )}

        {/* Quick tips */}
        <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">Tips</p>
          <ul className="space-y-1">
            {[
              'Add goals in the header for better AI planning',
              'Set start/end dates to get time-aware suggestions',
              'AI will auto-create tasks and milestones',
            ].map((tip, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <span className="mt-1.5 h-1 w-1 rounded-full bg-muted-foreground/50 shrink-0" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

// ─── Project Header ───────────────────────────────────────────────────────────

function ProjectHeaderSection({
  data, onUpdate,
}: {
  data: ProjectData
  onUpdate: (patch: Partial<ProjectData>) => void
}) {
  const [goalDraft, setGoalDraft] = useState('')
  const [memberDraft, setMemberDraft] = useState('')
  const [expanded, setExpanded] = useState(false)
  const health = HEALTH_CONFIG[data.health]
  const HealthIcon = health.icon

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Summary row */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        <select
          value={data.status}
          onChange={(e) => onUpdate({ status: e.target.value as ProjectData['status'] })}
          className={`rounded-full border-0 px-3 py-1 text-xs font-semibold focus:outline-none cursor-pointer ${STATUS_COLORS[data.status]}`}
        >
          <option value="planning">Planning</option>
          <option value="active">Active</option>
          <option value="on_hold">On Hold</option>
          <option value="completed">Completed</option>
        </select>

        <span className={`flex items-center gap-1 text-xs font-medium ${health.color}`}>
          <HealthIcon size={12} /> {health.label}
        </span>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar size={12} />
          <input
            type="date"
            value={data.startDate ? data.startDate.slice(0, 10) : ''}
            onChange={(e) => onUpdate({ startDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
            placeholder="Start date"
            className="bg-transparent border-0 text-xs text-muted-foreground focus:outline-none w-28"
          />
          <span>→</span>
          <input
            type="date"
            value={data.endDate ? data.endDate.slice(0, 10) : ''}
            onChange={(e) => onUpdate({ endDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
            placeholder="End date"
            className="bg-transparent border-0 text-xs text-muted-foreground focus:outline-none w-28"
          />
        </div>

        <button
          onClick={() => setExpanded((v) => !v)}
          className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          {expanded ? 'Less' : 'More'} {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-border px-4 py-4 space-y-4">
          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Description</label>
            <textarea
              value={data.description}
              onChange={(e) => onUpdate({ description: e.target.value })}
              placeholder="Describe the project…"
              rows={2}
              className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none"
            />
          </div>

          {/* Goals */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Goals</label>
            <div className="space-y-1 mb-2">
              {data.goals.map((g, i) => (
                <div key={i} className="flex items-center gap-2 group">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <span className="flex-1 text-sm text-foreground">{g}</span>
                  <button
                    onClick={() => onUpdate({ goals: data.goals.filter((_, j) => j !== i) })}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground"
                  >
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={goalDraft}
                onChange={(e) => setGoalDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && goalDraft.trim()) {
                    onUpdate({ goals: [...data.goals, goalDraft.trim()] })
                    setGoalDraft('')
                  }
                }}
                placeholder="Add a goal…"
                className="flex-1 rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                onClick={() => { if (goalDraft.trim()) { onUpdate({ goals: [...data.goals, goalDraft.trim()] }); setGoalDraft('') } }}
                className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20"
              >Add</button>
            </div>
          </div>

          {/* Members */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Members</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {data.members.map((m, i) => (
                <span key={i} className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-foreground">
                  <User size={10} /> {m}
                  <button
                    onClick={() => onUpdate({ members: data.members.filter((_, j) => j !== i) })}
                    className="ml-0.5 text-muted-foreground hover:text-foreground"
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={memberDraft}
                onChange={(e) => setMemberDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && memberDraft.trim()) {
                    onUpdate({ members: [...data.members, memberDraft.trim()] })
                    setMemberDraft('')
                  }
                }}
                placeholder="Add member name…"
                className="flex-1 rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                onClick={() => { if (memberDraft.trim()) { onUpdate({ members: [...data.members, memberDraft.trim()] }); setMemberDraft('') } }}
                className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20"
              >Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main ProjectEditor ───────────────────────────────────────────────────────

export default function ProjectEditor() {
  const { noteId } = useParams<{ noteId: string }>()
  const navigate = useNavigate()
  const { notes, setActiveNote, updateNote } = useWorkspaceStore()
  const { isAuthenticated, isGuest } = useAuthStore()
  const isOnline = isAuthenticated && !isGuest

  const note = useMemo(() => notes.find((n) => n.id === noteId), [notes, noteId])

  const [data, setData] = useState<ProjectData>(() => {
    if (note?.content && typeof note.content === 'object' && 'tasks' in note.content) {
      return note.content as ProjectData
    }
    return createDefaultProjectData()
  })

  const [view, setView] = useState<ViewMode>('list')
  const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null)
  const [showAi, setShowAi] = useState(false)

  const { save } = useAutoSave(noteId ?? '')

  useEffect(() => { if (noteId) setActiveNote(noteId) }, [noteId, setActiveNote])
  useEffect(() => {
    if (!note && noteId) navigate('/dashboard', { replace: true })
  }, [note, noteId, navigate])

  // Sync if note loaded after mount
  useEffect(() => {
    if (note?.content && typeof note.content === 'object' && 'tasks' in note.content) {
      setData(note.content as ProjectData)
    }
  }, [note?.id])

  const updateData = useCallback((patch: Partial<ProjectData>) => {
    setData((prev) => {
      const next = { ...prev, ...patch }
      // Recalculate health
      next.health = calcProjectHealth(next)
      updateNote(noteId!, { content: next })
      save({ content: next })
      return next
    })
  }, [noteId, updateNote, save])

  // Sync selectedTask when data.tasks changes
  useEffect(() => {
    if (selectedTask) {
      const updated = data.tasks.find((t) => t.id === selectedTask.id)
      if (updated) setSelectedTask(updated)
      else setSelectedTask(null)
    }
  }, [data.tasks])

  const stats = useMemo(() => {
    const total = data.tasks.length
    const doneIds = data.statuses.filter((s) => s.label.toLowerCase() === 'done').map((s) => s.id)
    const done = data.tasks.filter((t) => doneIds.includes(t.statusId)).length
    const overdue = data.tasks.filter(
      (t) => t.dueDate && isAfter(new Date(), parseISO(t.dueDate)) && !doneIds.includes(t.statusId)
    ).length
    return { total, done, overdue, progress: total ? Math.round((done / total) * 100) : 0 }
  }, [data.tasks, data.statuses])

  if (!note) return null

  const rightPanelOpen = selectedTask || showAi

  return (
    <div className="flex h-full overflow-hidden bg-background">
      {/* Main */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <div className="shrink-0 border-b border-border px-6 py-2 flex items-center gap-3">
          <Breadcrumb note={note} />
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => { setShowAi((v) => !v); setSelectedTask(null) }}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${showAi ? 'bg-violet-500 text-white' : 'border border-border text-muted-foreground hover:text-foreground hover:bg-muted/40'}`}
            >
              <Sparkles size={13} /> AI Plan
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5" style={{ scrollbarWidth: 'thin' }}>
          <div className="max-w-5xl mx-auto space-y-5">
            {/* Title */}
            <NoteTitleInput note={note} placeholder="What is this project?" />

            {/* Stats strip */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{stats.total} tasks</span>
              <span>{stats.done} done</span>
              {stats.overdue > 0 && <span className="text-red-500 font-medium">{stats.overdue} overdue</span>}
              <div className="flex items-center gap-2 ml-2">
                <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${stats.progress}%` }} />
                </div>
                <span>{stats.progress}%</span>
              </div>
            </div>

            {/* Header section (status, health, dates, goals) */}
            <ProjectHeaderSection data={data} onUpdate={updateData} />

            {/* View switcher */}
            <div className="flex items-center gap-1 border-b border-border pb-0">
              {([
                { id: 'list',     label: 'List',     icon: LayoutList },
                { id: 'board',    label: 'Board',    icon: Kanban },
                { id: 'timeline', label: 'Timeline', icon: BarChart2 },
              ] as { id: ViewMode; label: string; icon: React.ElementType }[]).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setView(id)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                    view === id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon size={13} /> {label}
                </button>
              ))}
            </div>

            {/* Active view */}
            <div className="pb-10">
              {view === 'list' && (
                <ListView data={data} onUpdate={updateData} onSelectTask={(t) => { setSelectedTask(t); setShowAi(false) }} />
              )}
              {view === 'board' && (
                <BoardView data={data} onUpdate={updateData} onSelectTask={(t) => { setSelectedTask(t); setShowAi(false) }} />
              )}
              {view === 'timeline' && <TimelineView data={data} />}
            </div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      {rightPanelOpen && (
        <div className="shrink-0 flex h-full border-l border-border overflow-hidden">
          {selectedTask && (
            <TaskDetailPanel
              task={selectedTask}
              data={data}
              onUpdate={updateData}
              onClose={() => setSelectedTask(null)}
            />
          )}
          {showAi && !selectedTask && (
            <AiPlanningPanel
              note={note}
              data={data}
              onUpdate={updateData}
              onClose={() => setShowAi(false)}
              isOnline={isOnline}
            />
          )}
        </div>
      )}
    </div>
  )
}
