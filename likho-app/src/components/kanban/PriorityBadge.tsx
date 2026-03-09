import { KanbanPriority } from '@/types/workspace';
import { AlertTriangle, ArrowUp, Minus, ArrowDown } from 'lucide-react';
import { clsx } from 'clsx';

const PRIORITY_CONFIG: Record<KanbanPriority, { label: string; classes: string; icon: React.ReactNode }> = {
    critical: {
        label: 'Critical',
        classes: 'bg-red-500/15 text-red-600 dark:text-red-400',
        icon: <AlertTriangle size={10} />,
    },
    high: {
        label: 'High',
        classes: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
        icon: <ArrowUp size={10} />,
    },
    medium: {
        label: 'Medium',
        classes: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
        icon: <Minus size={10} />,
    },
    low: {
        label: 'Low',
        classes: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
        icon: <ArrowDown size={10} />,
    },
};

export default function PriorityBadge({ priority }: { priority: KanbanPriority }) {
    const config = PRIORITY_CONFIG[priority];
    return (
        <span className={clsx('inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium', config.classes)}>
            {config.icon}
            {config.label}
        </span>
    );
}
