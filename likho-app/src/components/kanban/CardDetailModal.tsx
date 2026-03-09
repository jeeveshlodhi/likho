import { useState, useEffect } from 'react';
import { X, Calendar, Tag, Flag, AlignLeft, Trash2 } from 'lucide-react';
import { KanbanCard, KanbanPriority, KanbanLabel } from '@/types/workspace';
import PriorityBadge from './PriorityBadge';
import { DEFAULT_LABEL_COLORS } from './LabelBadge';
import { format, parseISO, isPast } from 'date-fns';
import { clsx } from 'clsx';

interface CardDetailModalProps {
    card: KanbanCard;
    columnTitle: string;
    boardLabels: KanbanLabel[];
    onUpdate: (updates: Partial<KanbanCard>) => void;
    onDelete: () => void;
    onClose: () => void;
    onLabelsChange: (labels: KanbanLabel[]) => void;
}

const PRIORITIES: KanbanPriority[] = ['critical', 'high', 'medium', 'low'];

export default function CardDetailModal({
    card, columnTitle, boardLabels, onUpdate, onDelete, onClose, onLabelsChange,
}: CardDetailModalProps) {
    const [title, setTitle] = useState(card.content);
    const [description, setDescription] = useState(card.description || '');
    const [priority, setPriority] = useState<KanbanPriority | undefined>(card.priority);
    const [dueDate, setDueDate] = useState(card.dueDate || '');
    const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>(card.labels || []);
    const [showNewLabel, setShowNewLabel] = useState(false);
    const [newLabelName, setNewLabelName] = useState('');
    const [newLabelColor, setNewLabelColor] = useState(DEFAULT_LABEL_COLORS[0]);

    // Auto-save on change
    useEffect(() => {
        const timeout = setTimeout(() => {
            onUpdate({
                content: title,
                description: description || undefined,
                priority,
                dueDate: dueDate || undefined,
                labels: selectedLabelIds.length > 0 ? selectedLabelIds : undefined,
            });
        }, 300);
        return () => clearTimeout(timeout);
    }, [title, description, priority, dueDate, selectedLabelIds]);

    const handleAddLabel = () => {
        if (!newLabelName.trim()) return;
        const newLabel: KanbanLabel = {
            id: `label-${Date.now()}`,
            name: newLabelName.trim(),
            color: newLabelColor,
        };
        onLabelsChange([...boardLabels, newLabel]);
        setSelectedLabelIds(prev => [...prev, newLabel.id]);
        setNewLabelName('');
        setShowNewLabel(false);
    };

    const toggleLabel = (labelId: string) => {
        setSelectedLabelIds(prev =>
            prev.includes(labelId) ? prev.filter(id => id !== labelId) : [...prev, labelId]
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] bg-black/50" onClick={onClose}>
            <div
                className="w-full max-w-lg bg-popover border border-border rounded-xl shadow-xl max-h-[80vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between p-5 pb-3">
                    <div className="flex-1">
                        <input
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Card title"
                            className="w-full text-lg font-semibold bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                        />
                        <p className="text-xs text-muted-foreground mt-1">in <span className="font-medium">{columnTitle}</span></p>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-muted-foreground hover:bg-muted rounded-lg transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <div className="px-5 pb-5 space-y-5">
                    {/* Description */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                            <AlignLeft size={14} /> Description
                        </label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Add a more detailed description..."
                            rows={3}
                            className="w-full text-sm bg-muted/50 border border-border rounded-lg p-3 text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary resize-none"
                        />
                    </div>

                    {/* Priority */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                            <Flag size={14} /> Priority
                        </label>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setPriority(undefined)}
                                className={clsx(
                                    'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                                    !priority ? 'bg-muted border-primary text-foreground' : 'border-border text-muted-foreground hover:bg-muted'
                                )}
                            >
                                None
                            </button>
                            {PRIORITIES.map(p => (
                                <button
                                    key={p}
                                    onClick={() => setPriority(p)}
                                    className={clsx(
                                        'rounded-lg border transition-colors',
                                        priority === p ? 'border-primary' : 'border-transparent'
                                    )}
                                >
                                    <PriorityBadge priority={p} />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Labels */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                            <Tag size={14} /> Labels
                        </label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {boardLabels.map(label => (
                                <button
                                    key={label.id}
                                    onClick={() => toggleLabel(label.id)}
                                    className={clsx(
                                        'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-all',
                                        selectedLabelIds.includes(label.id)
                                            ? 'border-primary ring-1 ring-primary/30'
                                            : 'border-border hover:bg-muted'
                                    )}
                                >
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: label.color }} />
                                    {label.name}
                                </button>
                            ))}
                        </div>
                        {showNewLabel ? (
                            <div className="flex items-center gap-2">
                                <input
                                    value={newLabelName}
                                    onChange={e => setNewLabelName(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleAddLabel()}
                                    placeholder="Label name"
                                    autoFocus
                                    className="flex-1 text-xs px-2 py-1.5 bg-background border border-border rounded-md text-foreground outline-none focus:ring-1 focus:ring-primary"
                                />
                                <div className="flex gap-1">
                                    {DEFAULT_LABEL_COLORS.slice(0, 6).map(c => (
                                        <button
                                            key={c}
                                            onClick={() => setNewLabelColor(c)}
                                            className={clsx('w-5 h-5 rounded-full border', newLabelColor === c ? 'border-primary scale-110' : 'border-transparent')}
                                            style={{ backgroundColor: c }}
                                        />
                                    ))}
                                </div>
                                <button onClick={handleAddLabel} className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded-md">Add</button>
                                <button onClick={() => setShowNewLabel(false)} className="text-xs text-muted-foreground">Cancel</button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowNewLabel(true)}
                                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                                + Create label
                            </button>
                        )}
                    </div>

                    {/* Due Date */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                            <Calendar size={14} /> Due Date
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={dueDate}
                                onChange={e => setDueDate(e.target.value)}
                                className="text-sm px-3 py-1.5 bg-muted/50 border border-border rounded-lg text-foreground outline-none focus:ring-1 focus:ring-primary"
                            />
                            {dueDate && (
                                <>
                                    <span className={clsx(
                                        'text-xs',
                                        isPast(parseISO(dueDate)) ? 'text-destructive font-medium' : 'text-muted-foreground'
                                    )}>
                                        {isPast(parseISO(dueDate)) ? 'Overdue' : format(parseISO(dueDate), 'MMM d, yyyy')}
                                    </span>
                                    <button onClick={() => setDueDate('')} className="text-xs text-muted-foreground hover:text-foreground">Clear</button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Meta info */}
                    {card.createdAt && (
                        <p className="text-xs text-muted-foreground">
                            Created {format(parseISO(card.createdAt), 'MMM d, yyyy')}
                        </p>
                    )}

                    {/* Delete */}
                    <div className="pt-3 border-t border-border">
                        <button
                            onClick={() => { onDelete(); onClose(); }}
                            className="flex items-center gap-2 text-sm text-destructive hover:bg-destructive/10 px-3 py-2 rounded-lg transition-colors"
                        >
                            <Trash2 size={14} /> Delete card
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
