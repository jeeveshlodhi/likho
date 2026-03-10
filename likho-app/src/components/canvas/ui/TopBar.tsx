import React, { useState } from 'react';
import type { AppState, CanvasElement } from '@/types/canvas';
import { ColorPicker } from './ColorPicker';
import { Grid, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

interface TopBarProps {
  appState: AppState;
  onAppStateChange: (patch: Partial<AppState>) => void;
  selectedElements: CanvasElement[];
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 px-2 border-r border-border last:border-r-0">
      <span className="text-[9px] text-muted-foreground uppercase tracking-wider">{label}</span>
      <div className="flex items-center gap-1">{children}</div>
    </div>
  );
}

function ToggleBtn({
  active, onClick, title, children,
}: { active: boolean; onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`px-2 py-1 rounded text-xs transition-all ${
        active ? 'bg-blue-500 text-white' : 'bg-muted hover:bg-accent text-muted-foreground'
      }`}
    >
      {children}
    </button>
  );
}

export function TopBar({ appState, onAppStateChange, selectedElements }: TopBarProps) {
  const [openPicker, setOpenPicker] = useState<null | 'stroke' | 'fill'>(null);

  const showTextOpts = selectedElements.some((el) => el.type === 'text') ||
    appState.tool === 'text';

  const set = (patch: Partial<AppState>) => onAppStateChange(patch);

  return (
    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 flex items-end bg-background border border-border rounded-xl shadow-lg px-2 py-2 gap-0 max-w-[90vw] overflow-x-auto">

      {/* Stroke Color */}
      <Section label="Stroke">
        <div className="relative">
          <button
            className="w-7 h-7 rounded border-2 border-border flex items-center justify-center"
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
      </Section>

      {/* Background Color */}
      <Section label="Fill">
        <div className="relative">
          <button
            className="w-7 h-7 rounded border-2 border-border flex items-center justify-center"
            style={{
              background: appState.backgroundColor === 'transparent'
                ? 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 0 0 / 8px 8px'
                : appState.backgroundColor,
            }}
            onClick={() => setOpenPicker(openPicker === 'fill' ? null : 'fill')}
            title="Background color"
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
      </Section>

      {/* Fill Style */}
      <Section label="Fill Style">
        {(['none', 'hachure', 'solid', 'cross-hatch'] as const).map((fs) => (
          <ToggleBtn
            key={fs}
            active={appState.fillStyle === fs}
            onClick={() => set({ fillStyle: fs })}
            title={fs}
          >
            {fs === 'none' ? '∅' : fs === 'hachure' ? '≡' : fs === 'solid' ? '■' : '#'}
          </ToggleBtn>
        ))}
      </Section>

      {/* Stroke Width */}
      <Section label="Width">
        {([1, 2, 4, 6] as const).map((w) => (
          <ToggleBtn
            key={w}
            active={appState.strokeWidth === w}
            onClick={() => set({ strokeWidth: w })}
            title={`${w}px`}
          >
            <div
              className="w-6 bg-current rounded-full"
              style={{ height: Math.min(w + 1, 5) }}
            />
          </ToggleBtn>
        ))}
      </Section>

      {/* Stroke Style */}
      <Section label="Stroke">
        {(['solid', 'dashed', 'dotted'] as const).map((ss) => (
          <ToggleBtn
            key={ss}
            active={appState.strokeStyle === ss}
            onClick={() => set({ strokeStyle: ss })}
            title={ss}
          >
            {ss === 'solid' ? '—' : ss === 'dashed' ? '- -' : '···'}
          </ToggleBtn>
        ))}
      </Section>

      {/* Roughness */}
      <Section label="Roughness">
        {([0, 1, 2, 3] as const).map((r) => (
          <ToggleBtn
            key={r}
            active={appState.roughness === r}
            onClick={() => set({ roughness: r })}
            title={`Roughness ${r}`}
          >
            {r}
          </ToggleBtn>
        ))}
      </Section>

      {/* Opacity */}
      <Section label="Opacity">
        <div className="flex items-center gap-1">
          <input
            type="range"
            min={10}
            max={100}
            step={5}
            value={appState.opacity}
            onChange={(e) => set({ opacity: Number(e.target.value) })}
            className="w-20 h-1 accent-blue-500"
          />
          <span className="text-xs text-muted-foreground w-8">{appState.opacity}%</span>
        </div>
      </Section>

      {/* Edge Style (rectangles) */}
      {(appState.tool === 'rectangle' || selectedElements.some((e) => e.type === 'rectangle')) && (
        <Section label="Edge">
          <ToggleBtn active={appState.edgeStyle === 'sharp'} onClick={() => set({ edgeStyle: 'sharp' })} title="Sharp edges">
            ▪
          </ToggleBtn>
          <ToggleBtn active={appState.edgeStyle === 'round'} onClick={() => set({ edgeStyle: 'round' })} title="Round edges">
            ◉
          </ToggleBtn>
        </Section>
      )}

      {/* Text options */}
      {showTextOpts && (
        <Section label="Text">
          <select
            value={appState.fontFamily}
            onChange={(e) => set({ fontFamily: e.target.value })}
            className="text-xs bg-muted rounded px-1 py-0.5 border border-border h-6"
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
            className="w-12 text-xs bg-muted rounded px-1 py-0.5 border border-border h-6"
          />
          {([['left', <AlignLeft size={12} />], ['center', <AlignCenter size={12} />], ['right', <AlignRight size={12} />]] as const).map(([a, icon]) => (
            <ToggleBtn key={a} active={appState.textAlign === a} onClick={() => set({ textAlign: a })} title={`Align ${a}`}>
              {icon}
            </ToggleBtn>
          ))}
        </Section>
      )}

      {/* Grid toggle */}
      <Section label="Grid">
        <ToggleBtn
          active={appState.showGrid}
          onClick={() => set({ showGrid: !appState.showGrid })}
          title="Toggle grid"
        >
          <Grid size={14} />
        </ToggleBtn>
        <ToggleBtn
          active={appState.snapToGrid}
          onClick={() => set({ snapToGrid: !appState.snapToGrid })}
          title="Snap to grid"
        >
          ⊹
        </ToggleBtn>
      </Section>
    </div>
  );
}
