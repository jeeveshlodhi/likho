import { Search, X } from 'lucide-react';
import { KanbanPriority, KanbanLabel } from '@/types/workspace';
import PriorityBadge from './PriorityBadge';
import { clsx } from 'clsx';

export interface KanbanFilter {
    query: string;
    priorities: KanbanPriority[];
    labelIds: string[];
}

export const EMPTY_FILTER: KanbanFilter = { query: '', priorities: [], labelIds: [] };

export function isFilterActive(filter: KanbanFilter): boolean {
    return filter.query !== '' || filter.priorities.length > 0 || filter.labelIds.length > 0;
}

interface KanbanFilterBarProps {
    filter: KanbanFilter;
    onChange: (filter: KanbanFilter) => void;
    labels: KanbanLabel[];
}

const ALL_PRIORITIES: KanbanPriority[] = ['critical', 'high', 'medium', 'low'];

export default function KanbanFilterBar({ filter, onChange, labels }: KanbanFilterBarProps) {
    const togglePriority = (p: KanbanPriority) => {
        const next = filter.priorities.includes(p)
            ? filter.priorities.filter(x => x !== p)
            : [...filter.priorities, p];
        onChange({ ...filter, priorities: next });
    };

    const toggleLabel = (id: string) => {
        const next = filter.labelIds.includes(id)
            ? filter.labelIds.filter(x => x !== id)
            : [...filter.labelIds, id];
        onChange({ ...filter, labelIds: next });
    };

    const active = isFilterActive(filter);

    return (
        <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                    type="text"
                    value={filter.query}
                    onChange={e => onChange({ ...filter, query: e.target.value })}
                    placeholder="Search cards..."
                    className="pl-8 pr-3 py-1.5 text-sm bg-muted/50 border border-border rounded-lg text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary w-48"
                />
            </div>

            {/* Priority filter */}
            <div className="flex items-center gap-1">
                {ALL_PRIORITIES.map(p => (
                    <button
                        key={p}
                        onClick={() => togglePriority(p)}
                        className={clsx(
                            'rounded-md border transition-all',
                            filter.priorities.includes(p) ? 'border-primary ring-1 ring-primary/30' : 'border-transparent opacity-60 hover:opacity-100'
                        )}
                    >
                        <PriorityBadge priority={p} />
                    </button>
                ))}
            </div>

            {/* Label filter */}
            {labels.length > 0 && (
                <div className="flex items-center gap-1">
                    {labels.map(label => (
                        <button
                            key={label.id}
                            onClick={() => toggleLabel(label.id)}
                            className={clsx(
                                'flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border transition-all',
                                filter.labelIds.includes(label.id)
                                    ? 'border-primary ring-1 ring-primary/30'
                                    : 'border-border opacity-60 hover:opacity-100'
                            )}
                        >
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: label.color }} />
                            {label.name}
                        </button>
                    ))}
                </div>
            )}

            {/* Clear */}
            {active && (
                <button
                    onClick={() => onChange(EMPTY_FILTER)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                    <X size={12} /> Clear filters
                </button>
            )}
        </div>
    );
}
