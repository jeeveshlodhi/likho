import { useState, useRef, useEffect } from 'react';

const PRESET_COLORS = [
    'transparent',
    '#000000', '#ffffff', '#6b7280',
    '#ef4444', '#f97316', '#eab308',
    '#22c55e', '#3b82f6', '#8b5cf6',
    '#ec4899', '#14b8a6',
];

interface ColorPickerProps {
    color: string;
    onChange: (color: string) => void;
    label: string;
}

export default function ColorPicker({ color, onChange, label }: ColorPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [hexInput, setHexInput] = useState(color);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setHexInput(color);
    }, [color]);

    useEffect(() => {
        if (!isOpen) return;
        const handleClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('pointerdown', handleClick);
        return () => document.removeEventListener('pointerdown', handleClick);
    }, [isOpen]);

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:bg-muted transition-colors"
                title={label}
            >
                <div
                    className="w-4 h-4 rounded border border-border"
                    style={{
                        backgroundColor: color === 'transparent' ? undefined : color,
                        backgroundImage: color === 'transparent'
                            ? 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%)'
                            : undefined,
                        backgroundSize: color === 'transparent' ? '6px 6px' : undefined,
                        backgroundPosition: color === 'transparent' ? '0 0, 3px 3px' : undefined,
                    }}
                />
                <span className="hidden sm:inline">{label}</span>
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1 p-2 bg-popover border border-border rounded-lg shadow-lg z-50 w-[180px]">
                    <div className="grid grid-cols-6 gap-1 mb-2">
                        {PRESET_COLORS.map((c) => (
                            <button
                                key={c}
                                onClick={() => { onChange(c); setIsOpen(false); }}
                                className={`w-6 h-6 rounded border transition-all ${color === c ? 'border-primary ring-1 ring-primary scale-110' : 'border-border hover:scale-110'}`}
                                style={{
                                    backgroundColor: c === 'transparent' ? undefined : c,
                                    backgroundImage: c === 'transparent'
                                        ? 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%)'
                                        : undefined,
                                    backgroundSize: c === 'transparent' ? '6px 6px' : undefined,
                                    backgroundPosition: c === 'transparent' ? '0 0, 3px 3px' : undefined,
                                }}
                                title={c === 'transparent' ? 'None' : c}
                            />
                        ))}
                    </div>
                    <div className="flex gap-1">
                        <input
                            type="text"
                            value={hexInput}
                            onChange={(e) => setHexInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    onChange(hexInput);
                                    setIsOpen(false);
                                }
                            }}
                            onBlur={() => onChange(hexInput)}
                            placeholder="#000000"
                            className="flex-1 text-xs px-2 py-1 bg-background border border-border rounded text-foreground outline-none focus:ring-1 focus:ring-primary"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
