import { KanbanLabel } from '@/types/workspace';

export const DEFAULT_LABEL_COLORS = [
    '#ef4444', '#f97316', '#eab308', '#22c55e',
    '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280',
];

export default function LabelBadge({ label }: { label: KanbanLabel }) {
    return (
        <span
            className="inline-block h-1.5 w-8 rounded-full"
            style={{ backgroundColor: label.color }}
            title={label.name}
        />
    );
}
