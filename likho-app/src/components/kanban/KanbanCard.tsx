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
                    ref={provided.innerRef}
                    className={clsx(
                        'group relative mb-2 flex min-h-[40px] flex-col rounded-lg border bg-card p-3 shadow-sm transition-all focus-within:ring-2 focus-within:ring-ring cursor-pointer',
                        snapshot.isDragging
                            ? 'shadow-lg ring-1 ring-ring border-transparent z-50'
                            : 'border-border hover:border-muted-foreground/30'
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
                    {/* Drag Handle */}
                    <div
                        {...provided.dragHandleProps}
                        className="absolute left-1 top-1/2 -translate-y-1/2 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground cursor-grab active:cursor-grabbing hover:bg-muted rounded"
                    >
                        <GripVertical size={14} />
                    </div>

                    <div className="pl-4">
                        {/* Labels row */}
                        {cardLabels.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-1.5">
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
                            <div className="text-sm text-foreground whitespace-pre-wrap break-words min-h-[20px]">
                                {card.content || <span className="text-muted-foreground italic">Empty card</span>}
                            </div>
                        )}

                        {/* Footer: priority + due date */}
                        {(card.priority || card.dueDate) && (
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                                {card.priority && <PriorityBadge priority={card.priority} />}
                                {card.dueDate && (
                                    <span className={clsx(
                                        'inline-flex items-center gap-1 text-[10px]',
                                        isPast(parseISO(card.dueDate)) ? 'text-destructive font-medium' : 'text-muted-foreground'
                                    )}>
                                        <Calendar size={10} />
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
