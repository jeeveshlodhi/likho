import React, { useState } from 'react';
import type { AppState, CanvasElement } from '@/types/canvas';
import { ColorPicker } from './ColorPicker';
import { Grid, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

interface TopBarProps {
  appState: AppState;
  onAppStateChange: (patch: Partial<AppState>) => void;
  selectedElements: CanvasElement[];
}

function Divider() {
  return <div className="w-px h-5 bg-border mx-1 flex-shrink-0" />;
}

function Btn({
  active, onClick, title, children,
}: { active: boolean; onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition-all flex-shrink-0 ${
        active
          ? 'bg-blue-500 text-white'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
      }`}
    >
      {children}
    </button>
  );
}

export function TopBar({ appState, onAppStateChange, selectedElements }: TopBarProps) {
  const [openPicker, setOpenPicker] = useState<null | 'stroke' | 'fill'>(null);

  const showTextOpts =
    selectedElements.some((el) => el.type === 'text') || appState.tool === 'text';
  const showEdgeOpts =
    appState.tool === 'rectangle' || selectedElements.some((e) => e.type === 'rectangle');

  const set = (patch: Partial<AppState>) => onAppStateChange(patch);

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center bg-background border border-border rounded-xl shadow-md px-2 py-1.5 max-w-[92vw] overflow-x-auto">

      {/* Color swatches */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {/* Stroke color */}
        <div className="relative">
          <button
            className="w-7 h-7 rounded-lg border-2 border-border shadow-sm flex-shrink-0 hover:scale-105 transition-transform"
            style={{ background: appState.strokeColor }}
            onClick={() => setOpenPicker(openPicker === 'stroke' ? null : 'stroke')}
            title="Stroke color"
          />
          {openPicker === 'stroke' && (
            <div className="absolute top-9 left-0 z-50 bg-background border border-border rounded-xl shadow-xl p-3 w-52">
              <ColorPicker
                value={appState.strokeColor}
                onChange={(c) => { set({ strokeColor: c }); setOpenPicker(null); }}
              />
            </div>
          )}
        </div>

        {/* Fill color */}
        <div className="relative">
          <button
            className="w-7 h-7 rounded-lg border-2 border-border shadow-sm flex-shrink-0 hover:scale-105 transition-transform"
            style={{
              background:
                appState.backgroundColor === 'transparent'
                  ? 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 0 0 / 8px 8px'
                  : appState.backgroundColor,
            }}
            onClick={() => setOpenPicker(openPicker === 'fill' ? null : 'fill')}
            title="Fill color"
          />
          {openPicker === 'fill' && (
            <div className="absolute top-9 left-0 z-50 bg-background border border-border rounded-xl shadow-xl p-3 w-52">
              <ColorPicker
                value={appState.backgroundColor}
                onChange={(c) => { set({ backgroundColor: c }); setOpenPicker(null); }}
                allowTransparent
              />
            </div>
          )}
        </div>
      </div>

      <Divider />

      {/* Fill style */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        {(['none', 'hachure', 'solid', 'cross-hatch'] as const).map((fs) => (
          <Btn key={fs} active={appState.fillStyle === fs} onClick={() => set({ fillStyle: fs })} title={fs}>
            {fs === 'none' ? '∅' : fs === 'hachure' ? '≡' : fs === 'solid' ? '■' : '#'}
          </Btn>
        ))}
      </div>

      <Divider />

      {/* Stroke width */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        {([1, 2, 4, 6] as const).map((w) => (
          <Btn key={w} active={appState.strokeWidth === w} onClick={() => set({ strokeWidth: w })} title={`${w}px`}>
            <div className="w-5 bg-current rounded-full" style={{ height: Math.min(w + 1, 5) }} />
          </Btn>
        ))}
      </div>

      <Divider />

      {/* Stroke style */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        {(['solid', 'dashed', 'dotted'] as const).map((ss) => (
          <Btn key={ss} active={appState.strokeStyle === ss} onClick={() => set({ strokeStyle: ss })} title={ss}>
            {ss === 'solid' ? '—' : ss === 'dashed' ? '╌' : '···'}
          </Btn>
        ))}
      </div>

      <Divider />

      {/* Roughness */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        {([0, 1, 2, 3] as const).map((r) => (
          <Btn key={r} active={appState.roughness === r} onClick={() => set({ roughness: r })} title={`Roughness ${r}`}>
            <span className="text-xs font-medium">{r}</span>
          </Btn>
        ))}
      </div>

      <Divider />

      {/* Opacity */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <input
          type="range"
          min={10}
          max={100}
          step={5}
          value={appState.opacity}
          onChange={(e) => set({ opacity: Number(e.target.value) })}
          className="w-16 h-1 accent-blue-500"
          title="Opacity"
        />
        <span className="text-xs text-muted-foreground w-7 text-right tabular-nums">
          {appState.opacity}%
        </span>
      </div>

      {/* Edge style — only for rectangles */}
      {showEdgeOpts && (
        <>
          <Divider />
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <Btn active={appState.edgeStyle === 'sharp'} onClick={() => set({ edgeStyle: 'sharp' })} title="Sharp edges">
              ▪
            </Btn>
            <Btn active={appState.edgeStyle === 'round'} onClick={() => set({ edgeStyle: 'round' })} title="Round edges">
              ◉
            </Btn>
          </div>
        </>
      )}

      {/* Text options — only for text tool / selected text */}
      {showTextOpts && (
        <>
          <Divider />
          <div className="flex items-center gap-1 flex-shrink-0">
            <select
              value={appState.fontFamily}
              onChange={(e) => set({ fontFamily: e.target.value })}
              className="text-xs bg-muted rounded-lg px-1.5 border border-border h-7"
            >
              <option value="'Virgil', cursive">Virgil</option>
              <option value="'Segoe UI', sans-serif">Sans</option>
              <option value="Georgia, serif">Serif</option>
              <option value="'Courier New', monospace">Mono</option>
            </select>
            <input
              type="number"
              min={10}
              max={96}
              value={appState.fontSize}
              onChange={(e) => set({ fontSize: Number(e.target.value) })}
              className="w-11 text-xs bg-muted rounded-lg px-1.5 border border-border h-7"
            />
            {(['left', 'center', 'right'] as const).map((a) => (
              <Btn key={a} active={appState.textAlign === a} onClick={() => set({ textAlign: a })} title={`Align ${a}`}>
                {a === 'left' ? <AlignLeft size={12} /> : a === 'center' ? <AlignCenter size={12} /> : <AlignRight size={12} />}
              </Btn>
            ))}
          </div>
        </>
      )}

      <Divider />

      {/* Grid controls */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <Btn active={appState.showGrid} onClick={() => set({ showGrid: !appState.showGrid })} title="Toggle grid">
          <Grid size={13} />
        </Btn>
        <Btn active={appState.snapToGrid} onClick={() => set({ snapToGrid: !appState.snapToGrid })} title="Snap to grid">
          ⊹
        </Btn>
      </div>
    </div>
  );
}
