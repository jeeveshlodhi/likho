export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';
export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed';
export type ProjectHealth = 'on_track' | 'at_risk' | 'delayed';

export interface ProjectStatusDef {
  id: string;
  label: string;
  color: string; // hex
  order: number;
}

export interface ProjectLabel {
  id: string;
  name: string;
  color: string; // hex
}

export interface ProjectSubtask {
  id: string;
  title: string;
  done: boolean;
}

export interface ProjectTask {
  id: string;
  title: string;
  description?: string;
  statusId: string;    // references a ProjectStatusDef id
  priority: TaskPriority;
  labels: string[];    // label ids
  assignedTo?: string;
  dueDate?: string;    // ISO date
  startDate?: string;  // ISO date
  subtasks: ProjectSubtask[];
  dependencies: string[]; // task ids
  milestoneId?: string;
  linkedNoteId?: string;
  linkedMeetingId?: string;
  linkedCalendarEventId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMilestone {
  id: string;
  title: string;
  description?: string;
  dueDate?: string; // ISO date
  status: 'pending' | 'in_progress' | 'completed';
  taskIds: string[];
}

export interface ProjectData {
  status: ProjectStatus;
  health: ProjectHealth;
  description: string;
  startDate?: string;
  endDate?: string;
  members: string[];
  goals: string[];
  statuses: ProjectStatusDef[];
  tasks: ProjectTask[];
  milestones: ProjectMilestone[];
  labels: ProjectLabel[];
  aiPlan?: string;
}

export const DEFAULT_STATUSES: ProjectStatusDef[] = [
  { id: 'todo',        label: 'To Do',       color: '#94a3b8', order: 0 },
  { id: 'inprogress',  label: 'In Progress',  color: '#3b82f6', order: 1 },
  { id: 'review',      label: 'In Review',    color: '#f59e0b', order: 2 },
  { id: 'done',        label: 'Done',         color: '#10b981', order: 3 },
];

export const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; bg: string }> = {
  urgent: { label: 'Urgent', color: 'text-red-600 dark:text-red-400',    bg: 'bg-red-500/10 border-red-500/30' },
  high:   { label: 'High',   color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30' },
  medium: { label: 'Medium', color: 'text-blue-600 dark:text-blue-400',  bg: 'bg-blue-500/10 border-blue-500/30' },
  low:    { label: 'Low',    color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-500/10 border-slate-500/30' },
};

export function createDefaultProjectData(): ProjectData {
  return {
    status: 'planning',
    health: 'on_track',
    description: '',
    members: [],
    goals: [],
    statuses: DEFAULT_STATUSES,
    tasks: [],
    milestones: [],
    labels: [],
  };
}

export function calcMilestoneProgress(milestone: ProjectMilestone, tasks: ProjectTask[], doneStatusIds: string[]): number {
  if (!milestone.taskIds.length) return 0;
  const linked = tasks.filter((t) => milestone.taskIds.includes(t.id));
  if (!linked.length) return 0;
  const done = linked.filter((t) => doneStatusIds.includes(t.statusId)).length;
  return Math.round((done / linked.length) * 100);
}

export function calcProjectHealth(data: ProjectData): ProjectHealth {
  const now = new Date();
  const overdue = data.tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < now && !data.statuses.find((s) => s.id === t.statusId && s.label.toLowerCase().includes('done'))
  );
  if (overdue.length > data.tasks.length * 0.3) return 'delayed';
  if (overdue.length > 0) return 'at_risk';
  return 'on_track';
}
