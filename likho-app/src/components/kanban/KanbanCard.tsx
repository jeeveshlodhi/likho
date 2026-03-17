import { Draggable } from '@hello-pangea/dnd';
import { KanbanCard, KanbanLabel } from '@/types/workspace';
import { useState, useRef, useEffect } from 'react';
import { Trash2, GripVertical, Calendar } from 'lucide-react';
import { format, parseISO, isPast } from 'date-fns';
import { clsx } from 'clsx';
import PriorityBadge from './PriorityBadge';
import LabelBadge from './LabelBadge';

interface KanbanCardProps {
    card: KanbanCard;
    index: number;
    boardLabels: KanbanLabel[];
    onUpdate: (content: string) => void;
    onDelete: () => void;
    onOpenDetail: () => void;
}

export default function KanbanCardComponent({ card, index, boardLabels, onUpdate, onDelete, onOpenDetail }: KanbanCardProps) {
    const [isEditing, setIsEditing] = useState(card.content === '');
    const [val, setVal] = useState(card.content);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    const commitEdit = () => {
        setIsEditing(false);
        if (val !== card.content) {
            onUpdate(val);
        }
        if (val.trim() === '') {
            onDelete();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            commitEdit();
        }
        if (e.key === 'Escape') {
            setIsEditing(false);
            setVal(card.content);
            if (card.content.trim() === '') onDelete();
        }
    };

    const cardLabels = (card.labels || [])
        .map(id => boardLabels.find(l => l.id === id))
        .filter(Boolean) as KanbanLabel[];

    return (
        <Draggable draggableId={card.id} index={index}>
            {(provided, snapshot) => (
                <div
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    ref={provided.innerRef}
                    className={clsx(
                        'group relative mb-3 flex min-h-[80px] flex-col rounded-xl border bg-card p-4 shadow-sm transition-all focus-within:ring-2 focus-within:ring-ring cursor-grab active:cursor-grabbing',
                        snapshot.isDragging
                            ? 'shadow-xl ring-2 ring-ring border-transparent z-50 rotate-2 scale-105'
                            : 'border-border hover:border-muted-foreground/30 hover:shadow-md hover:-translate-y-0.5'
                    )}
                    onClick={(e) => {
                        if (!isEditing && !snapshot.isDragging) {
                            e.stopPropagation();
                            onOpenDetail();
                        }
                    }}
                    onDoubleClick={(e) => {
                        e.stopPropagation();
                        setIsEditing(true);
                    }}
                >
                    {/* Drag Handle Indicator - visual only now */}
                    <div
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-1 opacity-0 group-hover:opacity-60 transition-opacity text-muted-foreground hover:bg-muted rounded"
                    >
                        <GripVertical size={16} />
                    </div>

                    <div className="pl-5">
                        {/* Labels row */}
                        {cardLabels.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-2">
                                {cardLabels.map(label => (
                                    <LabelBadge key={label.id} label={label} />
                                ))}
                            </div>
                        )}

                        {/* Content */}
                        {isEditing ? (
                            <textarea
                                ref={inputRef}
                                value={val}
                                onChange={(e) => setVal(e.target.value)}
                                onBlur={commitEdit}
                                onKeyDown={handleKeyDown}
                                onClick={e => e.stopPropagation()}
                                placeholder="What needs to be done?"
                                className="w-full resize-none bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
                                rows={Math.max(2, val.split('\n').length)}
                            />
                        ) : (
                            <div className="text-sm text-foreground whitespace-pre-wrap break-words min-h-[24px] leading-relaxed">
                                {card.content || <span className="text-muted-foreground italic">Empty card</span>}
                            </div>
                        )}

                        {/* Footer: priority + due date */}
                        {(card.priority || card.dueDate) && (
                            <div className="flex items-center gap-2 mt-3 flex-wrap">
                                {card.priority && <PriorityBadge priority={card.priority} />}
                                {card.dueDate && (
                                    <span className={clsx(
                                        'inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-full bg-muted',
                                        isPast(parseISO(card.dueDate)) ? 'text-destructive font-medium' : 'text-muted-foreground'
                                    )}>
                                        <Calendar size={11} />
                                        {format(parseISO(card.dueDate), 'MMM d')}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Delete button */}
                    {!snapshot.isDragging && !isEditing && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete();
                            }}
                            className="absolute right-2 top-2 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md"
                            title="Delete Card"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
            )}
        </Draggable>
    );
}
