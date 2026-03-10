import React from 'react';
import type { CanvasElement, AppState } from '@/types/canvas';
import { ColorPicker } from './ColorPicker';
import {
  AlignHorizontalJustifyStart,
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignHorizontalDistributeCenter,
  AlignVerticalDistributeCenter,
  BringToFront,
  SendToBack,
  MoveUp,
  MoveDown,
  Group,
  Ungroup,
} from 'lucide-react';
import { alignElements, distributeElements } from '../utils/align';

interface PropertiesPanelProps {
  selectedElements: CanvasElement[];
  allElements: CanvasElement[];
  appState: AppState;
  onElementsChange: (updated: CanvasElement[]) => void;
  onAppStateChange: (patch: Partial<AppState>) => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onGroup: () => void;
  onUngroup: () => void;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-muted-foreground w-16 shrink-0">{label}</span>
      <div className="flex items-center gap-1 flex-1">{children}</div>
    </div>
  );
}

function IconBtn({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="w-7 h-7 rounded flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
    >
      {children}
    </button>
  );
}

export function PropertiesPanel({
  selectedElements,
  allElements,
  onElementsChange,
  onBringToFront,
  onSendToBack,
  onBringForward,
  onSendBackward,
  onGroup,
  onUngroup,
}: PropertiesPanelProps) {
  if (selectedElements.length === 0) return null;

  const el = selectedElements[0];
  const multi = selectedElements.length > 1;
  const hasGroup = selectedElements.some((e) => e.groupId);

  const update = (patch: Partial<CanvasElement>) => {
    const ids = new Set(selectedElements.map((e) => e.id));
    onElementsChange(allElements.map((e) => ids.has(e.id) ? { ...e, ...patch } : e));
  };

  const align = (dir: Parameters<typeof alignElements>[1]) => {
    const updated = alignElements(selectedElements, dir);
    const ids = new Set(selectedElements.map((e) => e.id));
    onElementsChange(allElements.map((e) => {
      const u = updated.find((u) => u.id === e.id);
      return ids.has(e.id) && u ? u : e;
    }));
  };

  const distribute = (dir: 'horizontal' | 'vertical') => {
    const updated = distributeElements(selectedElements, dir);
    const ids = new Set(selectedElements.map((e) => e.id));
    onElementsChange(allElements.map((e) => {
      const u = updated.find((u) => u.id === e.id);
      return ids.has(e.id) && u ? u : e;
    }));
  };

  return (
    <div className="absolute right-3 top-20 bottom-20 z-20 w-52 bg-background/95 backdrop-blur border border-border rounded-xl shadow-lg overflow-y-auto">
      <div className="p-3 flex flex-col gap-3">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {multi ? `${selectedElements.length} elements` : el.type}
        </div>

        {/* Position / Size */}
        {!multi && (
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-1">
              {[['X', 'x'], ['Y', 'y'], ['W', 'width'], ['H', 'height']].map(([lbl, key]) => (
                <div key={key} className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-muted-foreground">{lbl}</span>
                  <input
                    type="number"
                    value={Math.round((el as any)[key])}
                    onChange={(e) => update({ [key]: Number(e.target.value) } as any)}
                    className="w-full text-xs bg-muted border border-border rounded px-1.5 py-1 h-7"
                  />
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-muted-foreground">Angle (°)</span>
              <input
                type="number"
                value={Math.round((el.angle * 180) / Math.PI)}
                onChange={(e) => update({ angle: (Number(e.target.value) * Math.PI) / 180 })}
                className="w-full text-xs bg-muted border border-border rounded px-1.5 py-1 h-7"
              />
            </div>
          </div>
        )}

        {/* Colors */}
        <div className="flex flex-col gap-2">
          <ColorPicker
            label="Stroke"
            value={el.strokeColor}
            onChange={(c) => update({ strokeColor: c })}
          />
          {el.type !== 'line' && el.type !== 'arrow' && el.type !== 'pen' && el.type !== 'text' && (
            <ColorPicker
              label="Background"
              value={el.backgroundColor}
              onChange={(c) => update({ backgroundColor: c })}
              allowTransparent
            />
          )}
        </div>

        {/* Stroke width */}
        <Row label="Width">
          <input
            type="range" min={1} max={10} value={el.strokeWidth}
            onChange={(e) => update({ strokeWidth: Number(e.target.value) })}
            className="flex-1 h-1 accent-blue-500"
          />
          <span className="text-xs w-5">{el.strokeWidth}</span>
        </Row>

        {/* Opacity */}
        <Row label="Opacity">
          <input
            type="range" min={10} max={100} step={5} value={el.opacity}
            onChange={(e) => update({ opacity: Number(e.target.value) })}
            className="flex-1 h-1 accent-blue-500"
          />
          <span className="text-xs w-8">{el.opacity}%</span>
        </Row>

        {/* Roughness */}
        <Row label="Rough">
          {([0, 1, 2, 3] as const).map((r) => (
            <button
              key={r}
              onClick={() => update({ roughness: r })}
              className={`w-7 h-6 rounded text-xs transition-all ${
                el.roughness === r ? 'bg-blue-500 text-white' : 'bg-muted text-muted-foreground hover:bg-accent'
              }`}
            >
              {r}
            </button>
          ))}
        </Row>

        {/* Text options */}
        {el.type === 'text' && (
          <div className="flex flex-col gap-2">
            <Row label="Font">
              <select
                value={el.fontFamily}
                onChange={(e) => update({ fontFamily: e.target.value })}
                className="flex-1 text-xs bg-muted rounded px-1 py-0.5 border border-border"
              >
                <option value="'Virgil', cursive">Virgil</option>
                <option value="'Segoe UI', sans-serif">Sans</option>
                <option value="Georgia, serif">Serif</option>
                <option value="'Courier New', monospace">Mono</option>
              </select>
            </Row>
            <Row label="Size">
              <input
                type="number" min={8} max={96} value={el.fontSize}
                onChange={(e) => update({ fontSize: Number(e.target.value) })}
                className="flex-1 text-xs bg-muted border border-border rounded px-1.5 py-1 h-7"
              />
            </Row>
          </div>
        )}

        <div className="h-px bg-border" />

        {/* Z-order */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Z-order</span>
          <div className="grid grid-cols-4 gap-1">
            <IconBtn onClick={onBringToFront} title="Bring to front (Ctrl+Shift+])">
              <BringToFront size={14} />
            </IconBtn>
            <IconBtn onClick={onBringForward} title="Bring forward (Ctrl+])">
              <MoveUp size={14} />
            </IconBtn>
            <IconBtn onClick={onSendBackward} title="Send backward (Ctrl+[)">
              <MoveDown size={14} />
            </IconBtn>
            <IconBtn onClick={onSendToBack} title="Send to back (Ctrl+Shift+[)">
              <SendToBack size={14} />
            </IconBtn>
          </div>
        </div>

        {/* Alignment (multi-select) */}
        {multi && (
          <>
            <div className="h-px bg-border" />
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Align</span>
              <div className="grid grid-cols-3 gap-1">
                <IconBtn onClick={() => align('left')} title="Align left">
                  <AlignHorizontalJustifyStart size={14} />
                </IconBtn>
                <IconBtn onClick={() => align('center')} title="Align center">
                  <AlignHorizontalJustifyCenter size={14} />
                </IconBtn>
                <IconBtn onClick={() => align('right')} title="Align right">
                  <AlignHorizontalJustifyEnd size={14} />
                </IconBtn>
                <IconBtn onClick={() => align('top')} title="Align top">
                  <AlignVerticalJustifyStart size={14} />
                </IconBtn>
                <IconBtn onClick={() => align('middle')} title="Align middle">
                  <AlignVerticalJustifyCenter size={14} />
                </IconBtn>
                <IconBtn onClick={() => align('bottom')} title="Align bottom">
                  <AlignVerticalJustifyEnd size={14} />
                </IconBtn>
              </div>
            </div>

            {selectedElements.length >= 3 && (
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Distribute</span>
                <div className="grid grid-cols-2 gap-1">
                  <IconBtn onClick={() => distribute('horizontal')} title="Distribute horizontally">
                    <AlignHorizontalDistributeCenter size={14} />
                  </IconBtn>
                  <IconBtn onClick={() => distribute('vertical')} title="Distribute vertically">
                    <AlignVerticalDistributeCenter size={14} />
                  </IconBtn>
                </div>
              </div>
            )}
          </>
        )}

        {/* Group / Ungroup */}
        {multi && (
          <>
            <div className="h-px bg-border" />
            <div className="flex gap-1">
              <button
                onClick={onGroup}
                className="flex-1 flex items-center justify-center gap-1 text-xs bg-muted hover:bg-accent rounded py-1.5 transition-all"
              >
                <Group size={13} /> Group
              </button>
              {hasGroup && (
                <button
                  onClick={onUngroup}
                  className="flex-1 flex items-center justify-center gap-1 text-xs bg-muted hover:bg-accent rounded py-1.5 transition-all"
                >
                  <Ungroup size={13} /> Ungroup
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
