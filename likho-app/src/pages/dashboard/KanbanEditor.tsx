import { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useAutoSave } from '@/hooks/useAutoSave';
import Breadcrumb from '@/components/dashboard/Breadcrumb';
import NoteTitleInput from '@/components/dashboard/NoteTitleInput';
import { KanbanBoardData } from '@/types/workspace';
import KanbanBoard from '@/components/kanban/KanbanBoard';
import KanbanFilterBar, { KanbanFilter, EMPTY_FILTER } from '@/components/kanban/KanbanFilterBar';
import { RightSidebar } from '@/components/ai';

export default function KanbanEditor() {
    const { noteId } = useParams<{ noteId: string }>();
    const navigate = useNavigate();
    const { notes, setActiveNote, updateNote } = useWorkspaceStore();

    const note = useMemo(() => notes.find((n) => n.id === noteId), [notes, noteId]);

    const defaultBoard: KanbanBoardData = {
        columns: ['col-1', 'col-2', 'col-3'],
        columnData: {
            'col-1': { id: 'col-1', title: 'To Do', cardIds: [] },
            'col-2': { id: 'col-2', title: 'In Progress', cardIds: [] },
            'col-3': { id: 'col-3', title: 'Done', cardIds: [] },
        },
        cardData: {},
    };

    const [boardData, setBoardData] = useState<KanbanBoardData>(defaultBoard);
    const [filter, setFilter] = useState<KanbanFilter>(EMPTY_FILTER);

    useEffect(() => {
        if (noteId) setActiveNote(noteId);
    }, [noteId, setActiveNote]);

    useEffect(() => {
        if (!note && noteId) {
            navigate('/dashboard', { replace: true });
        }
    }, [note, noteId, navigate]);

    useEffect(() => {
        if (note?.content && note.content.columns) {
            setBoardData(note.content as KanbanBoardData);
        }
    }, [note?.content]);

    const save = useAutoSave(noteId || '');

    const handleBoardChange = (newData: KanbanBoardData) => {
        setBoardData(newData);
        updateNote(note!.id, { content: newData });
        save({ content: newData });
    };

    if (!note) return null;

    const boardLabels = boardData.labels || [];

    return (
        <div className="flex h-full flex-col bg-background">
            {/* Top Bar */}
            <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-2">
                <div className="flex items-center gap-3">
                    <Breadcrumb note={note} />
                </div>
            </div>

            <div className="flex flex-1 min-h-0 overflow-hidden">
                {/* Main board area */}
                <div className="relative flex-1 min-h-0 flex flex-col overflow-hidden">
                    {/* Title + Filter bar */}
                    <div className="shrink-0 px-6 pt-4 pb-3 space-y-3">
                        <div className="w-64">
                            <NoteTitleInput note={note} />
                        </div>
                        <KanbanFilterBar
                            filter={filter}
                            onChange={setFilter}
                            labels={boardLabels}
                        />
                    </div>

                    {/* Board Area */}
                    <div className="flex-1 overflow-x-auto overflow-y-hidden px-6 pb-6">
                        <KanbanBoard data={boardData} onChange={handleBoardChange} filter={filter} />
                    </div>
                </div>

                {/* Right Sidebar */}
                <RightSidebar
                    note={note}
                    contentText={note.title}
                    getSelectedText={() => ''}
                    onApplyText={() => {}}
                    defaultCollapsed={true}
                />
            </div>
        </div>
    );
}
