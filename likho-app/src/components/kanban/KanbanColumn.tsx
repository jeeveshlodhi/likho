import { Droppable, Draggable } from '@hello-pangea/dnd';
import { KanbanColumn, KanbanCard, KanbanLabel } from '@/types/workspace';
import KanbanCardComponent from './KanbanCard';
import ColumnActionsMenu from './ColumnActionsMenu';
import { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';

interface KanbanColumnProps {
    column: KanbanColumn;
    cards: KanbanCard[];
    index: number;
    boardLabels: KanbanLabel[];
    onAddCard: () => void;
    onUpdateCard: (id: string, content: string) => void;
    onDeleteCard: (id: string) => void;
    onOpenCardDetail: (cardId: string) => void;
    onUpdateTitle: (title: string) => void;
    onSetColor: (color: string | undefined) => void;
    onSetWipLimit: (limit: number | undefined) => void;
    onClearCards: () => void;
    onDeleteColumn: () => void;
}

export default function KanbanColumnComponent({
    column, cards, index, boardLabels,
    onAddCard, onUpdateCard, onDeleteCard, onOpenCardDetail,
    onUpdateTitle, onSetColor, onSetWipLimit, onClearCards, onDeleteColumn,
}: KanbanColumnProps) {
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [titleVal, setTitleVal] = useState(column.title);
    const titleRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditingTitle && titleRef.current) {
            titleRef.current.focus();
            titleRef.current.select();
        }
    }, [isEditingTitle]);

    const commitTitle = () => {
        setIsEditingTitle(false);
        if (titleVal.trim() && titleVal !== column.title) {
            onUpdateTitle(titleVal.trim());
        } else {
            setTitleVal(column.title);
        }
    };

    const isOverWip = column.wipLimit ? cards.length >= column.wipLimit : false;

    return (
        <Draggable draggableId={column.id} index={index}>
            {(provided) => (
                <div
                    {...provided.draggableProps}
                    ref={provided.innerRef}
                    className="flex h-full max-h-full flex-col w-[280px] shrink-0 rounded-xl bg-muted/50 border border-border"
                    style={{
                        ...provided.draggableProps.style,
                        borderTopColor: column.color || undefined,
                        borderTopWidth: column.color ? 3 : undefined,
                    }}
                >
                    {/* Column Header */}
                    <div
                        {...provided.dragHandleProps}
                        className="flex items-center justify-between p-3 pb-2"
                    >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            {isEditingTitle ? (
                                <input
                                    ref={titleRef}
                                    value={titleVal}
                                    onChange={e => setTitleVal(e.target.value)}
                                    onBlur={commitTitle}
                                    onKeyDown={e => { if (e.key === 'Enter') commitTitle(); if (e.key === 'Escape') { setIsEditingTitle(false); setTitleVal(column.title); } }}
                                    className="font-semibold text-sm text-foreground bg-transparent outline-none border-b border-primary w-full"
                                />
                            ) : (
                                <h3
                                    className="font-semibold text-sm text-foreground truncate cursor-text"
                                    onDoubleClick={() => setIsEditingTitle(true)}
                                >
                                    {column.title}
                                </h3>
                            )}
                            <span className={clsx(
                                'text-xs px-2 py-0.5 rounded-full border shrink-0',
                                isOverWip
                                    ? 'bg-destructive/15 text-destructive border-destructive/30 font-medium'
                                    : 'bg-background text-muted-foreground border-border'
                            )}>
                                {cards.length}{column.wipLimit ? `/${column.wipLimit}` : ''}
                            </span>
                        </div>
                        <ColumnActionsMenu
                            onEditTitle={() => setIsEditingTitle(true)}
                            onSetColor={onSetColor}
                            onSetWipLimit={onSetWipLimit}
                            onClearCards={onClearCards}
                            onDeleteColumn={onDeleteColumn}
                            currentColor={column.color}
                            currentWipLimit={column.wipLimit}
                        />
                    </div>

                    {/* Cards Area */}
                    <Droppable droppableId={column.id} type="card">
                        {(provided, snapshot) => (
                            <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                className={clsx(
                                    'flex-1 overflow-y-auto p-2 min-h-[150px] transition-colors',
                                    snapshot.isDraggingOver ? 'bg-muted/80' : '',
                                    snapshot.isDraggingOver && isOverWip ? 'ring-1 ring-destructive/50 rounded-lg' : '',
                                )}
                            >
                                {cards.map((card, idx) => (
                                    <KanbanCardComponent
                                        key={card.id}
                                        card={card}
                                        index={idx}
                                        boardLabels={boardLabels}
                                        onUpdate={(newContent: string) => onUpdateCard(card.id, newContent)}
                                        onDelete={() => onDeleteCard(card.id)}
                                        onOpenDetail={() => onOpenCardDetail(card.id)}
                                    />
                                ))}
                                {provided.placeholder}

                                <button
                                    onClick={onAddCard}
                                    className="w-full mt-2 py-2 flex items-center gap-2 px-2 text-sm text-muted-foreground hover:bg-background hover:text-foreground rounded-lg transition-colors group"
                                >
                                    <span className="text-lg leading-none">+</span> Add a card
                                </button>
                            </div>
                        )}
                    </Droppable>
                </div>
            )}
        </Draggable>
    );
}
