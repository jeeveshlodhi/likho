import React from 'react';

const PRESETS = [
  'transparent',
  '#1e1e1e', '#ffffff', '#f0f0f0',
  '#e03131', '#f76707', '#f59f00', '#2f9e44',
  '#1971c2', '#7048e8', '#c2255c', '#0c8599',
  '#868e96', '#343a40',
];

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
  allowTransparent?: boolean;
}

export function ColorPicker({ value, onChange, label, allowTransparent = false }: ColorPickerProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-1">
      {label && <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</span>}
      <div className="flex flex-wrap gap-1">
        {PRESETS.filter((c) => allowTransparent || c !== 'transparent').map((color) => (
          <button
            key={color}
            title={color}
            className={`w-5 h-5 rounded border transition-all ${
              value === color ? 'ring-2 ring-blue-500 ring-offset-1 scale-110' : 'border-border hover:scale-110'
            }`}
            style={{
              background: color === 'transparent'
                ? 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 0 0 / 8px 8px'
                : color,
            }}
            onClick={() => onChange(color)}
          />
        ))}
        {/* Custom color */}
        <button
          title="Custom color"
          className="w-5 h-5 rounded border border-dashed border-border hover:border-foreground relative overflow-hidden"
          style={{ background: 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)' }}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="color"
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            value={value === 'transparent' ? '#ffffff' : value}
            onChange={(e) => onChange(e.target.value)}
          />
        </button>
      </div>
    </div>
  );
}
