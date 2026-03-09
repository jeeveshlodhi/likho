import { useState } from 'react';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { KanbanBoardData, KanbanCard, KanbanLabel } from '@/types/workspace';
import KanbanColumnComponent from './KanbanColumn';
import CardDetailModal from './CardDetailModal';
import { v4 as uuidv4 } from 'uuid';
import { KanbanFilter, isFilterActive } from './KanbanFilterBar';

interface KanbanBoardProps {
    data: KanbanBoardData;
    onChange: (data: KanbanBoardData) => void;
    filter: KanbanFilter;
}

export default function KanbanBoard({ data, onChange, filter }: KanbanBoardProps) {
    const [detailCardId, setDetailCardId] = useState<string | null>(null);
    const [detailColumnId, setDetailColumnId] = useState<string | null>(null);

    const boardLabels = data.labels || [];

    // Filter cards
    const filterCardIds = (cardIds: string[]): string[] => {
        if (!isFilterActive(filter)) return cardIds;
        return cardIds.filter(id => {
            const card = data.cardData[id];
            if (!card) return false;
            if (filter.query) {
                const q = filter.query.toLowerCase();
                if (!card.content.toLowerCase().includes(q) && !(card.description || '').toLowerCase().includes(q)) return false;
            }
            if (filter.priorities.length > 0 && (!card.priority || !filter.priorities.includes(card.priority))) return false;
            if (filter.labelIds.length > 0 && (!card.labels || !card.labels.some(l => filter.labelIds.includes(l)))) return false;
            return true;
        });
    };

    const onDragEnd = (result: DropResult) => {
        const { destination, source, draggableId, type } = result;
        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        if (type === 'column') {
            const newColumnOrder = Array.from(data.columns);
            newColumnOrder.splice(source.index, 1);
            newColumnOrder.splice(destination.index, 0, draggableId);
            onChange({ ...data, columns: newColumnOrder });
            return;
        }

        const sourceCol = data.columnData[source.droppableId];
        const destCol = data.columnData[destination.droppableId];

        if (sourceCol === destCol) {
            const newCardIds = Array.from(sourceCol.cardIds);
            newCardIds.splice(source.index, 1);
            newCardIds.splice(destination.index, 0, draggableId);
            onChange({
                ...data,
                columnData: { ...data.columnData, [sourceCol.id]: { ...sourceCol, cardIds: newCardIds } },
            });
            return;
        }

        const sourceCardIds = Array.from(sourceCol.cardIds);
        sourceCardIds.splice(source.index, 1);
        const destCardIds = Array.from(destCol.cardIds);
        destCardIds.splice(destination.index, 0, draggableId);
        onChange({
            ...data,
            columnData: {
                ...data.columnData,
                [sourceCol.id]: { ...sourceCol, cardIds: sourceCardIds },
                [destCol.id]: { ...destCol, cardIds: destCardIds },
            },
        });
    };

    const addCard = (columnId: string) => {
        const newCardId = `card-${uuidv4()}`;
        const newCard: KanbanCard = { id: newCardId, content: '', createdAt: new Date().toISOString() };
        const col = data.columnData[columnId];
        onChange({
            ...data,
            cardData: { ...data.cardData, [newCardId]: newCard },
            columnData: { ...data.columnData, [columnId]: { ...col, cardIds: [...col.cardIds, newCardId] } },
        });
    };

    const updateCardContent = (cardId: string, content: string) => {
        onChange({
            ...data,
            cardData: { ...data.cardData, [cardId]: { ...data.cardData[cardId], content } },
        });
    };

    const updateCardDetails = (cardId: string, updates: Partial<KanbanCard>) => {
        onChange({
            ...data,
            cardData: { ...data.cardData, [cardId]: { ...data.cardData[cardId], ...updates } },
        });
    };

    const deleteCard = (columnId: string, cardId: string) => {
        const col = data.columnData[columnId];
        const newCardIds = col.cardIds.filter(id => id !== cardId);
        const newCardData = { ...data.cardData };
        delete newCardData[cardId];
        onChange({
            ...data,
            cardData: newCardData,
            columnData: { ...data.columnData, [columnId]: { ...col, cardIds: newCardIds } },
        });
    };

    const updateColumnTitle = (columnId: string, title: string) => {
        onChange({
            ...data,
            columnData: { ...data.columnData, [columnId]: { ...data.columnData[columnId], title } },
        });
    };

    const setColumnColor = (columnId: string, color: string | undefined) => {
        onChange({
            ...data,
            columnData: { ...data.columnData, [columnId]: { ...data.columnData[columnId], color } },
        });
    };

    const setColumnWipLimit = (columnId: string, wipLimit: number | undefined) => {
        onChange({
            ...data,
            columnData: { ...data.columnData, [columnId]: { ...data.columnData[columnId], wipLimit } },
        });
    };

    const clearColumn = (columnId: string) => {
        const col = data.columnData[columnId];
        const newCardData = { ...data.cardData };
        col.cardIds.forEach(id => delete newCardData[id]);
        onChange({
            ...data,
            cardData: newCardData,
            columnData: { ...data.columnData, [columnId]: { ...col, cardIds: [] } },
        });
    };

    const deleteColumn = (columnId: string) => {
        const col = data.columnData[columnId];
        const newCardData = { ...data.cardData };
        col.cardIds.forEach(id => delete newCardData[id]);
        const { [columnId]: _, ...remainingColumnData } = data.columnData;
        onChange({
            ...data,
            columns: data.columns.filter(id => id !== columnId),
            columnData: remainingColumnData,
            cardData: newCardData,
        });
    };

    const updateBoardLabels = (labels: KanbanLabel[]) => {
        onChange({ ...data, labels });
    };

    // Find which column a card belongs to
    const findColumnForCard = (cardId: string): string | null => {
        for (const colId of data.columns) {
            if (data.columnData[colId]?.cardIds.includes(cardId)) return colId;
        }
        return null;
    };

    const detailCard = detailCardId ? data.cardData[detailCardId] : null;
    const detailColId = detailCardId ? (detailColumnId || findColumnForCard(detailCardId)) : null;

    return (
        <>
            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="all-columns" direction="horizontal" type="column">
                    {(provided) => (
                        <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="flex h-full items-start gap-4"
                        >
                            {data.columns.map((columnId, index) => {
                                const column = data.columnData[columnId];
                                if (!column) return null;
                                const filteredCardIds = filterCardIds(column.cardIds);
                                const cards = filteredCardIds.map(cardId => data.cardData[cardId]).filter(Boolean);

                                return (
                                    <KanbanColumnComponent
                                        key={column.id}
                                        column={column}
                                        cards={cards}
                                        index={index}
                                        boardLabels={boardLabels}
                                        onAddCard={() => addCard(column.id)}
                                        onUpdateCard={updateCardContent}
                                        onDeleteCard={(cardId) => deleteCard(column.id, cardId)}
                                        onOpenCardDetail={(cardId) => { setDetailCardId(cardId); setDetailColumnId(column.id); }}
                                        onUpdateTitle={(title) => updateColumnTitle(column.id, title)}
                                        onSetColor={(color) => setColumnColor(column.id, color)}
                                        onSetWipLimit={(limit) => setColumnWipLimit(column.id, limit)}
                                        onClearCards={() => clearColumn(column.id)}
                                        onDeleteColumn={() => deleteColumn(column.id)}
                                    />
                                );
                            })}
                            {provided.placeholder}

                            <button
                                onClick={() => {
                                    const newColId = `col-${uuidv4()}`;
                                    onChange({
                                        ...data,
                                        columns: [...data.columns, newColId],
                                        columnData: { ...data.columnData, [newColId]: { id: newColId, title: 'New Column', cardIds: [] } },
                                    });
                                }}
                                className="flex-shrink-0 w-[280px] h-12 rounded-lg border-2 border-dashed border-border flex items-center justify-center text-muted-foreground hover:bg-muted/50 transition-colors"
                            >
                                + Add List
                            </button>
                        </div>
                    )}
                </Droppable>
            </DragDropContext>

            {/* Card Detail Modal */}
            {detailCard && detailColId && (
                <CardDetailModal
                    card={detailCard}
                    columnTitle={data.columnData[detailColId]?.title || ''}
                    boardLabels={boardLabels}
                    onUpdate={(updates) => updateCardDetails(detailCard.id, updates)}
                    onDelete={() => { deleteCard(detailColId, detailCard.id); setDetailCardId(null); }}
                    onClose={() => setDetailCardId(null)}
                    onLabelsChange={updateBoardLabels}
                />
            )}
        </>
    );
}
