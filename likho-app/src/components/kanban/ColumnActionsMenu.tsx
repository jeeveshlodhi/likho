import { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Pencil, Palette, Hash, Trash2, XCircle } from 'lucide-react';

const COLUMN_COLORS = [
    '#ef4444', '#f97316', '#eab308', '#22c55e',
    '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280',
];

interface ColumnActionsMenuProps {
    onEditTitle: () => void;
    onSetColor: (color: string | undefined) => void;
    onSetWipLimit: (limit: number | undefined) => void;
    onClearCards: () => void;
    onDeleteColumn: () => void;
    currentColor?: string;
    currentWipLimit?: number;
}

export default function ColumnActionsMenu({
    onEditTitle, onSetColor, onSetWipLimit, onClearCards, onDeleteColumn,
    currentColor, currentWipLimit,
}: ColumnActionsMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [showWipInput, setShowWipInput] = useState(false);
    const [wipVal, setWipVal] = useState(currentWipLimit?.toString() || '');
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [confirmClear, setConfirmClear] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;
        const handleClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setIsOpen(false);
                setShowColorPicker(false);
                setShowWipInput(false);
                setConfirmDelete(false);
                setConfirmClear(false);
            }
        };
        document.addEventListener('pointerdown', handleClick);
        return () => document.removeEventListener('pointerdown', handleClick);
    }, [isOpen]);

    const close = () => {
        setIsOpen(false);
        setShowColorPicker(false);
        setShowWipInput(false);
        setConfirmDelete(false);
        setConfirmClear(false);
    };

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
            >
                <MoreHorizontal size={16} />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-1 w-52 bg-popover border border-border rounded-lg shadow-lg z-50 py-1 text-sm">
                    <button
                        onClick={() => { onEditTitle(); close(); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left text-foreground hover:bg-muted transition-colors"
                    >
                        <Pencil size={14} /> Edit title
                    </button>

                    {/* Color picker */}
                    <button
                        onClick={() => setShowColorPicker(!showColorPicker)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left text-foreground hover:bg-muted transition-colors"
                    >
                        <Palette size={14} /> Set color
                    </button>
                    {showColorPicker && (
                        <div className="px-3 py-2 flex flex-wrap gap-1.5">
                            <button
                                onClick={() => { onSetColor(undefined); close(); }}
                                className="w-5 h-5 rounded-full border border-border bg-background text-[8px] flex items-center justify-center"
                                title="None"
                            >✕</button>
                            {COLUMN_COLORS.map(c => (
                                <button
                                    key={c}
                                    onClick={() => { onSetColor(c); close(); }}
                                    className={`w-5 h-5 rounded-full border ${currentColor === c ? 'ring-2 ring-primary' : 'border-transparent'}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    )}

                    {/* WIP Limit */}
                    <button
                        onClick={() => setShowWipInput(!showWipInput)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left text-foreground hover:bg-muted transition-colors"
                    >
                        <Hash size={14} /> WIP limit {currentWipLimit ? `(${currentWipLimit})` : ''}
                    </button>
                    {showWipInput && (
                        <div className="px-3 py-2 flex gap-1.5">
                            <input
                                type="number"
                                min={0}
                                value={wipVal}
                                onChange={e => setWipVal(e.target.value)}
                                placeholder="No limit"
                                className="flex-1 text-xs px-2 py-1 bg-background border border-border rounded text-foreground outline-none"
                            />
                            <button
                                onClick={() => { onSetWipLimit(wipVal ? parseInt(wipVal) : undefined); close(); }}
                                className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded"
                            >Set</button>
                        </div>
                    )}

                    <div className="my-1 border-t border-border" />

                    {/* Clear cards */}
                    {confirmClear ? (
                        <div className="px-3 py-2 flex items-center gap-2">
                            <span className="text-xs text-destructive">Remove all cards?</span>
                            <button onClick={() => { onClearCards(); close(); }} className="text-xs px-2 py-0.5 bg-destructive text-white rounded">Yes</button>
                            <button onClick={() => setConfirmClear(false)} className="text-xs text-muted-foreground">No</button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setConfirmClear(true)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-left text-muted-foreground hover:bg-muted transition-colors"
                        >
                            <XCircle size={14} /> Clear all cards
                        </button>
                    )}

                    {/* Delete column */}
                    {confirmDelete ? (
                        <div className="px-3 py-2 flex items-center gap-2">
                            <span className="text-xs text-destructive">Delete column?</span>
                            <button onClick={() => { onDeleteColumn(); close(); }} className="text-xs px-2 py-0.5 bg-destructive text-white rounded">Yes</button>
                            <button onClick={() => setConfirmDelete(false)} className="text-xs text-muted-foreground">No</button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setConfirmDelete(true)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-left text-destructive hover:bg-destructive/10 transition-colors"
                        >
                            <Trash2 size={14} /> Delete column
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
