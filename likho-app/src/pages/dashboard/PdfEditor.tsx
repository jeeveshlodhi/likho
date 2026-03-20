/**
 * PdfEditor — Adobe-style PDF editor.
 *
 * Two modes:
 *   • Annotate  — draw, highlight, shapes, sticky notes, typed text overlays
 *   • Edit Text — pdfjs text items extracted and rendered as contenteditable
 *                 spans directly on the page; edits become TextReplacement
 *                 annotations (white-out + new text) on canvas and in export.
 *
 * Coordinate system: all annotation x/y/width/height are fractions (0–1) of
 * the rendered page CSS dimensions so they stay zoom-independent.
 */

import {
  useCallback, useEffect, useMemo, useRef, useState,
} from 'react';
import { useParams } from 'react-router';
import { nanoid } from 'nanoid';
import { Document, Page, pdfjs } from 'react-pdf';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import {
  MousePointer2, Pen, Highlighter, Square, Circle, StickyNote,
  Type, ZoomIn, ZoomOut, Undo2, Redo2, Download, Save, Upload,
  FileText, Edit2, Check, X, Trash2, ChevronLeft, ChevronRight,
  Bold, Italic, AlignLeft, Layers,
} from 'lucide-react';

import { useWorkspaceStore } from '@/store/workspaceStore';
import { useAutoSave } from '@/hooks/useAutoSave';
import Breadcrumb from '@/components/dashboard/Breadcrumb';
import NoteTitleInput from '@/components/dashboard/NoteTitleInput';

import type {
  Annotation, DrawAnnotation, HighlightAnnotation, ShapeAnnotation,
  StickyAnnotation, TextAnnotation, TextReplacement, ToolStyle,
  PdfWorkspaceData, PdfToolType, Point,
} from '@/types/pdf';
import {
  DEFAULT_PDF_WORKSPACE, DEFAULT_TOOL_STYLE,
  hitTestAnnotation, moveAnnotation, getAnnotationBBox,
} from '@/types/pdf';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// ─── pdfjs worker ──────────────────────────────────────────────────────────────

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

// ─── Constants ────────────────────────────────────────────────────────────────

const BASE_W      = 800;
const ZOOM_MIN    = 0.4;
const ZOOM_MAX    = 3.0;
const ZOOM_STEP   = 0.25;
const STICKY_W    = 200;
const STICKY_H    = 130;
const SIDEBAR_W   = 140; // thumbnail sidebar width in px

// ─── Local types ──────────────────────────────────────────────────────────────

type EditorMode = 'annotate' | 'edit-text';

interface PdfTextItem {
  id: string;
  pageIndex: number;
  /** All coordinates are fractions (0–1) of the native page size at scale=1 */
  x: number;
  y: number;
  width: number;
  height: number;
  originalText: string;
  editedText: string;
  isEdited: boolean;
  /** Raw CSS font-family string derived from PDF font name */
  fontFamily: string;
  fontWeight: string;
  fontStyle: string;
  /** Letter-spacing factor from PDF horizontal scaling (1.0 = normal) */
  letterSpacingScale: number;
}

// ─── Colour palettes ──────────────────────────────────────────────────────────

const STROKE_COLORS    = ['#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#ec4899','#000000','#ffffff'];
const HIGHLIGHT_COLORS = ['#fef08a','#bbf7d0','#bfdbfe','#fbcfe8'];
const STICKY_COLORS    = ['#fef08a','#bbf7d0','#bfdbfe','#fbcfe8','#fde68a'];
const STROKE_WIDTHS    = [1, 2, 4, 8];
const FONT_SIZES       = [10, 12, 14, 16, 18, 24, 32];

// ─── Utilities ────────────────────────────────────────────────────────────────

function applyTransform(pt: [number, number], m: number[]): [number, number] {
  return [m[0]*pt[0] + m[2]*pt[1] + m[4], m[1]*pt[0] + m[3]*pt[1] + m[5]];
}

/** Map a PDF font name to the closest CSS font-family string. */
function mapPdfFont(fontName: string): string {
  const n = fontName.toLowerCase();
  if (/courier|mono|typewriter/.test(n)) return '"Courier New", Courier, monospace';
  if (/times|roman|serif/.test(n))      return '"Times New Roman", Times, serif';
  if (/symbol|dingbat/.test(n))         return 'Symbol, serif';
  if (/georgia/.test(n))                return 'Georgia, serif';
  if (/verdana/.test(n))                return 'Verdana, Geneva, sans-serif';
  if (/tahoma/.test(n))                 return 'Tahoma, Geneva, sans-serif';
  if (/calibri/.test(n))                return 'Calibri, Candara, sans-serif';
  if (/comic/.test(n))                  return '"Comic Sans MS", cursive';
  if (/impact/.test(n))                 return 'Impact, Charcoal, sans-serif';
  // Helvetica / Arial / any other sans-serif
  return 'Helvetica, Arial, sans-serif';
}

/** Extract bold/italic style hints from a PDF font name. */
function mapPdfFontStyle(fontName: string): { fontWeight: string; fontStyle: string } {
  const n = fontName.toLowerCase();
  return {
    fontWeight: /bold|heavy|black/.test(n) ? 'bold' : 'normal',
    fontStyle:  /italic|oblique/.test(n)   ? 'italic' : 'normal',
  };
}

function hexToRgb(hex: string) {
  const h = hex.replace('#', '');
  return rgb(parseInt(h.slice(0,2),16)/255, parseInt(h.slice(2,4),16)/255, parseInt(h.slice(4,6),16)/255);
}

// ─── Canvas annotation drawing ────────────────────────────────────────────────

function drawAnnotation(
  ctx: CanvasRenderingContext2D, ann: Annotation,
  W: number, H: number, isSelected: boolean,
) {
  const cx = (f: number) => f * W;
  const cy = (f: number) => f * H;
  const cw = (f: number) => f * W;
  const ch = (f: number) => f * H;
  const sw = (n: number) => Math.max(0.5, n * W / BASE_W);
  ctx.save();

  switch (ann.type) {
    case 'draw': {
      if (ann.points.length < 2) break;
      ctx.beginPath();
      ctx.strokeStyle = ann.color; ctx.lineWidth = sw(ann.strokeWidth);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ann.points.forEach((p,i) => i===0 ? ctx.moveTo(cx(p.x),cy(p.y)) : ctx.lineTo(cx(p.x),cy(p.y)));
      ctx.stroke(); break;
    }
    case 'highlight': {
      ctx.fillStyle = ann.color; ctx.globalAlpha = ann.opacity;
      ctx.fillRect(cx(ann.x),cy(ann.y),cw(ann.width),ch(ann.height)); break;
    }
    case 'rectangle': {
      ctx.lineWidth = sw(ann.strokeWidth); ctx.strokeStyle = ann.strokeColor;
      if (ann.fillColor !== 'transparent') { ctx.fillStyle = ann.fillColor; ctx.fillRect(cx(ann.x),cy(ann.y),cw(ann.width),ch(ann.height)); }
      ctx.strokeRect(cx(ann.x),cy(ann.y),cw(ann.width),ch(ann.height)); break;
    }
    case 'circle': {
      const ecx = cx(ann.x+ann.width/2), ecy = cy(ann.y+ann.height/2);
      const erx = Math.abs(cw(ann.width/2)), ery = Math.abs(ch(ann.height/2));
      if (!erx||!ery) break;
      ctx.beginPath(); ctx.ellipse(ecx,ecy,erx,ery,0,0,Math.PI*2);
      if (ann.fillColor !== 'transparent') { ctx.fillStyle = ann.fillColor; ctx.fill(); }
      ctx.strokeStyle = ann.strokeColor; ctx.lineWidth = sw(ann.strokeWidth); ctx.stroke(); break;
    }
    case 'text': {
      const fs = sw(ann.fontSize);
      ctx.font = `${fs}px sans-serif`; ctx.fillStyle = ann.color;
      ctx.fillText(ann.text, cx(ann.x), cy(ann.y)); break;
    }
    case 'text-replacement': {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx(ann.x)-1, cy(ann.y)-1, cw(ann.width)+2, ch(ann.height)+2);
      if (ann.newText) {
        ctx.font = `${sw(ann.fontSize)}px sans-serif`;
        ctx.fillStyle = ann.color;
        ctx.fillText(ann.newText, cx(ann.x), cy(ann.y)+ch(ann.height)-sw(1));
      }
      break;
    }
  }

  if (isSelected) {
    const b = getAnnotationBBox(ann);
    ctx.strokeStyle = '#6366f1'; ctx.lineWidth = 1.5; ctx.setLineDash([5,4]);
    ctx.strokeRect(cx(b.x)-4, cy(b.y)-4, cw(b.width)+8, ch(b.height)+8);
    ctx.setLineDash([]);
  }
  ctx.restore();
}

// ─── UploadZone ───────────────────────────────────────────────────────────────

function UploadZone({ onFile }: { onFile: (f: File) => void }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const accept = (f: File) => { if (f.type === 'application/pdf') onFile(f); };
  return (
    <div className="flex-1 flex items-center justify-center p-8"
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); const f=e.dataTransfer.files[0]; if(f) accept(f); }}>
      <div onClick={() => inputRef.current?.click()}
        className={`w-full max-w-lg border-2 border-dashed rounded-2xl p-20 flex flex-col items-center gap-5 cursor-pointer transition-all
          ${dragging ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-border hover:border-primary/50 hover:bg-muted/30'}`}>
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <FileText className="w-10 h-10 text-primary" />
        </div>
        <div className="text-center">
          <p className="text-xl font-semibold">Drop a PDF here</p>
          <p className="text-sm text-muted-foreground mt-1.5">or click to browse files</p>
        </div>
        <span className="text-xs text-muted-foreground px-3 py-1 bg-muted rounded-full">PDF files only</span>
        <input ref={inputRef} type="file" accept="application/pdf" className="hidden"
          onChange={e => { const f=e.target.files?.[0]; if(f) accept(f); }} />
      </div>
    </div>
  );
}

// ─── ThumbnailSidebar ─────────────────────────────────────────────────────────

function ThumbnailSidebar({
  numPages, currentPage, pdfFile, onPageClick,
}: { numPages: number; currentPage: number; pdfFile: string; onPageClick: (n: number) => void }) {
  return (
    <div className="flex flex-col gap-3 py-4 px-2 overflow-y-auto bg-muted/20 border-r"
      style={{ width: SIDEBAR_W, minWidth: SIDEBAR_W }}>
      {Array.from({ length: numPages }, (_, i) => (
        <button key={i} onClick={() => onPageClick(i+1)}
          className={`flex flex-col items-center gap-1 group rounded-lg p-1 transition-all
            ${currentPage === i+1 ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted'}`}>
          <div className="w-full overflow-hidden rounded border bg-white shadow-sm"
            style={{ aspectRatio: '0.707' }}>
            <Page pageNumber={i+1} width={SIDEBAR_W - 20}
              renderAnnotationLayer={false} renderTextLayer={false} />
          </div>
          <span className={`text-[10px] font-medium ${currentPage===i+1 ? 'text-primary' : 'text-muted-foreground'}`}>
            {i+1}
          </span>
        </button>
      ))}
    </div>
  );
}

// ─── MainToolbar ──────────────────────────────────────────────────────────────

interface ToolbarProps {
  mode: EditorMode; activeTool: PdfToolType; style: ToolStyle;
  zoom: number; pageCount: number; currentPage: number;
  canUndo: boolean; canRedo: boolean; saveStatus: string;
  onMode: (m: EditorMode) => void;
  onTool: (t: PdfToolType) => void;
  onStyleChange: (p: Partial<ToolStyle>) => void;
  onZoomIn: () => void; onZoomOut: () => void;
  onPageChange: (n: number) => void;
  onUndo: () => void; onRedo: () => void;
  onSave: () => void; onExport: () => void; onUploadNew: () => void;
}

function MainToolbar(p: ToolbarProps) {
  const annoTools: { id: PdfToolType; icon: React.ReactNode; label: string }[] = [
    { id: 'select',    icon: <MousePointer2 size={15}/>, label: 'Select & Move' },
    { id: 'draw',      icon: <Pen size={15}/>,           label: 'Freehand Draw' },
    { id: 'highlight', icon: <Highlighter size={15}/>,   label: 'Highlight' },
    { id: 'rectangle', icon: <Square size={15}/>,        label: 'Rectangle' },
    { id: 'circle',    icon: <Circle size={15}/>,        label: 'Ellipse' },
    { id: 'text',      icon: <Type size={15}/>,          label: 'Add Text Box' },
    { id: 'sticky',    icon: <StickyNote size={15}/>,    label: 'Sticky Note' },
  ];

  const isColor  = ['draw','text','rectangle','circle'].includes(p.activeTool);
  const isHL     = p.activeTool === 'highlight';
  const isSticky = p.activeTool === 'sticky';
  const isStroke = ['draw','rectangle','circle'].includes(p.activeTool);
  const isFont   = p.activeTool === 'text';
  const isFill   = ['rectangle','circle'].includes(p.activeTool);

  return (
    <div className="flex flex-col border-b bg-background/98 backdrop-blur shrink-0">
      {/* Row 1: mode switch + global actions */}
      <div className="flex items-center gap-2 px-4 py-1.5 border-b">
        {/* Mode pills */}
        <div className="flex items-center gap-0.5 bg-muted rounded-lg p-0.5 text-xs">
          <button onClick={() => p.onMode('annotate')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-colors
              ${p.mode==='annotate' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            <Layers size={13}/> Annotate
          </button>
          <button onClick={() => p.onMode('edit-text')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-colors
              ${p.mode==='edit-text' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            <Edit2 size={13}/> Edit Text
          </button>
        </div>

        <div className="w-px h-5 bg-border" />

        {/* Undo / Redo */}
        <button onClick={p.onUndo} disabled={!p.canUndo} title="Undo (⌘Z)"
          className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><Undo2 size={14}/></button>
        <button onClick={p.onRedo} disabled={!p.canRedo} title="Redo (⌘Y)"
          className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><Redo2 size={14}/></button>

        <div className="w-px h-5 bg-border" />

        {/* Zoom */}
        <button onClick={p.onZoomOut} disabled={p.zoom<=ZOOM_MIN}
          className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ZoomOut size={14}/></button>
        <span className="text-xs text-muted-foreground w-10 text-center font-mono">
          {Math.round(p.zoom*100)}%
        </span>
        <button onClick={p.onZoomIn} disabled={p.zoom>=ZOOM_MAX}
          className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ZoomIn size={14}/></button>

        <div className="w-px h-5 bg-border" />

        {/* Page nav */}
        {p.pageCount > 0 && (
          <div className="flex items-center gap-1 text-xs">
            <button onClick={() => p.onPageChange(p.currentPage-1)} disabled={p.currentPage<=1}
              className="p-1 rounded hover:bg-muted disabled:opacity-30"><ChevronLeft size={13}/></button>
            <span className="text-muted-foreground px-1">{p.currentPage} / {p.pageCount}</span>
            <button onClick={() => p.onPageChange(p.currentPage+1)} disabled={p.currentPage>=p.pageCount}
              className="p-1 rounded hover:bg-muted disabled:opacity-30"><ChevronRight size={13}/></button>
          </div>
        )}

        <div className="flex-1" />

        <button onClick={p.onUploadNew} title="Upload new PDF"
          className="p-1.5 rounded hover:bg-muted text-muted-foreground"><Upload size={14}/></button>
        <button onClick={p.onSave}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-muted hover:bg-muted/80 transition-colors">
          <Save size={13}/>
          {p.saveStatus==='saving' ? 'Saving…' : p.saveStatus==='saved' ? 'Saved ✓' : 'Save'}
        </button>
        <button onClick={p.onExport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
          <Download size={13}/> Export PDF
        </button>
      </div>

      {/* Row 2: context-sensitive tools */}
      {p.mode === 'annotate' && (
        <div className="flex items-center gap-2 px-4 py-1.5 flex-wrap">
          {/* Tool buttons */}
          <div className="flex items-center gap-0.5 bg-muted/60 rounded-lg p-0.5">
            {annoTools.map(t => (
              <button key={t.id} title={t.label} onClick={() => p.onTool(t.id)}
                className={`p-1.5 rounded-md transition-colors ${
                  p.activeTool===t.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`}>
                {t.icon}
              </button>
            ))}
          </div>

          {/* Color */}
          {(isColor||isHL||isSticky) && (
            <>
              <div className="w-px h-5 bg-border" />
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground mr-0.5">Color</span>
                {(isHL ? HIGHLIGHT_COLORS : isSticky ? STICKY_COLORS : STROKE_COLORS).map(c => (
                  <button key={c} onClick={() =>
                    isHL ? p.onStyleChange({highlightColor:c}) :
                    isSticky ? p.onStyleChange({highlightColor:c}) :
                    p.onStyleChange({color:c})}
                    className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110"
                    style={{ background:c, borderColor:
                      (isHL||isSticky ? p.style.highlightColor : p.style.color)===c ? '#6366f1' : 'transparent' }}/>
                ))}
              </div>
            </>
          )}

          {/* Fill */}
          {isFill && (
            <>
              <div className="w-px h-5 bg-border" />
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground mr-0.5">Fill</span>
                <button onClick={() => p.onStyleChange({fillColor:'transparent'})}
                  className={`px-2 py-0.5 rounded text-[10px] transition-colors ${p.style.fillColor==='transparent' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  None
                </button>
                {STROKE_COLORS.slice(0,5).map(c => (
                  <button key={c} onClick={() => p.onStyleChange({fillColor:c})}
                    className="w-4 h-4 rounded-full border-2 transition-transform hover:scale-110"
                    style={{ background:c, borderColor:p.style.fillColor===c?'#6366f1':'transparent' }}/>
                ))}
              </div>
            </>
          )}

          {/* Stroke width */}
          {isStroke && (
            <>
              <div className="w-px h-5 bg-border" />
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground mr-0.5">Width</span>
                {STROKE_WIDTHS.map(w => (
                  <button key={w} onClick={() => p.onStyleChange({strokeWidth:w})}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${p.style.strokeWidth===w ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                    {w}px
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Font size for text tool */}
          {isFont && (
            <>
              <div className="w-px h-5 bg-border" />
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground mr-0.5">Size</span>
                {FONT_SIZES.map(s => (
                  <button key={s} onClick={() => p.onStyleChange({fontSize:s})}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${p.style.fontSize===s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Edit Text mode instruction banner */}
      {p.mode === 'edit-text' && (
        <div className="flex items-center gap-2 px-4 py-1.5 text-xs text-muted-foreground bg-indigo-50/60 dark:bg-indigo-900/10">
          <Edit2 size={12} className="text-indigo-500"/>
          <span>Click any text on the page to edit it directly. Changes are highlighted in indigo.</span>
        </div>
      )}
    </div>
  );
}

// ─── FloatingAnnotationToolbar ────────────────────────────────────────────────

function FloatingAnnotationToolbar({ ann, W, H, onColorChange, onDelete }:
  { ann: Annotation; W: number; H: number; onColorChange:(c:string)=>void; onDelete:()=>void }) {
  const b = getAnnotationBBox(ann);
  return (
    <div className="absolute z-20 flex items-center gap-1 bg-popover border rounded-xl shadow-xl px-2 py-1.5"
      style={{ top: Math.max(0, b.y*H - 44), left: b.x*W }}
      onMouseDown={e => e.stopPropagation()}>
      {STROKE_COLORS.slice(0,7).map(c => (
        <button key={c} onClick={() => onColorChange(c)}
          className="w-4 h-4 rounded-full border-2 border-transparent hover:scale-125 transition-transform"
          style={{ background:c }}/>
      ))}
      <div className="w-px h-4 bg-border mx-0.5"/>
      <button onClick={onDelete} className="p-0.5 rounded hover:bg-destructive/10 text-destructive">
        <Trash2 size={13}/>
      </button>
    </div>
  );
}

// ─── StickyNoteEl ─────────────────────────────────────────────────────────────

function StickyNoteEl({ ann, W, H, zoom, isSelected, onSelect, onUpdate, onDelete }:
  { ann: StickyAnnotation; W:number; H:number; zoom:number;
    isSelected:boolean; onSelect:()=>void;
    onUpdate:(p:Partial<StickyAnnotation>)=>void; onDelete:()=>void }) {
  const w = STICKY_W * zoom, h = STICKY_H * zoom;
  return (
    <div onMouseDown={e=>{e.stopPropagation();onSelect();}}
      style={{ position:'absolute', left:ann.x*W, top:ann.y*H, width:w, height:h,
        background:ann.color, borderRadius:6, zIndex:5,
        boxShadow: isSelected ? '0 0 0 2px #6366f1, 0 4px 12px rgba(0,0,0,0.15)' : '0 2px 8px rgba(0,0,0,0.15)',
        display:'flex', flexDirection:'column', padding:8, cursor:'grab' }}>
      <textarea value={ann.text} placeholder="Note…"
        onChange={e=>onUpdate({text:e.target.value})}
        onMouseDown={e=>e.stopPropagation()}
        style={{ flex:1, background:'transparent', border:'none', resize:'none', outline:'none',
          fontSize:12*zoom, fontFamily:'sans-serif', color:'#1a1a1a' }}/>
      {isSelected && (
        <button onMouseDown={e=>{e.stopPropagation();onDelete();}}
          style={{ position:'absolute', top:4, right:4, background:'rgba(0,0,0,0.1)',
            border:'none', borderRadius:'50%', width:18, height:18,
            display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
          <X size={11}/>
        </button>
      )}
    </div>
  );
}

// ─── TextEditLayer ────────────────────────────────────────────────────────────
// Renders extracted pdfjs text items as contenteditable spans directly on the page.

function TextEditLayer({
  items, W, H, onItemCommit,
}: {
  items: PdfTextItem[];
  W: number; H: number;
  onItemCommit: (id: string, newText: string) => void;
}) {
  const [focusedId, setFocusedId] = useState<string | null>(null);

  if (!items.length) return null;

  return (
    <div className="absolute inset-0" style={{ pointerEvents: 'none' }}>
      {items.map(item => {
        const left   = item.x * W;
        const top    = item.y * H;
        const width  = Math.max(item.width * W, 8);
        // Font size in CSS pixels = fraction of page height × actual CSS page height.
        // This automatically accounts for zoom and PDF-to-viewport scale, giving exact match
        // with the rendered PDF text size.
        const fs     = item.height * H;
        const height = Math.max(fs * 1.2, 10); // slight extra room for descenders
        const isFocused = focusedId === item.id;

        // Letter-spacing: if hScale != 1 the PDF uses horizontal compression/expansion
        const letterSpacing = item.letterSpacingScale !== 1
          ? `${(item.letterSpacingScale - 1) * fs * 0.1}px`
          : 'normal';

        return (
          <div
            key={item.id}
            contentEditable
            suppressContentEditableWarning
            spellCheck={false}
            onFocus={() => setFocusedId(item.id)}
            onBlur={e => {
              const newText = e.currentTarget.textContent ?? '';
              setFocusedId(null);
              if (newText !== item.originalText) {
                onItemCommit(item.id, newText);
              }
            }}
            onKeyDown={e => {
              if (e.key === 'Escape') {
                e.currentTarget.textContent = item.editedText;
                e.currentTarget.blur();
              }
            }}
            style={{
              position:      'absolute',
              left,
              top,
              minWidth:      width,
              height,
              // Match PDF font properties exactly
              fontSize:      fs,
              fontFamily:    item.fontFamily,
              fontWeight:    item.fontWeight,
              fontStyle:     item.fontStyle,
              letterSpacing,
              lineHeight:    1,
              whiteSpace:    'pre',
              pointerEvents: 'all',
              cursor:        'text',
              outline:       'none',
              padding:       0,
              margin:        0,
              userSelect:    'text',
              // Transparent at rest — PDF text visible underneath.
              // White background + black text when focused or already edited.
              background:    isFocused ? 'rgba(255,255,255,0.95)'
                           : item.isEdited ? 'rgba(255,255,255,0.9)'
                           : 'transparent',
              color:         (isFocused || item.isEdited) ? '#111827' : 'transparent',
              border:        isFocused ? '1.5px solid #6366f1'
                           : item.isEdited ? '1px dashed #a5b4fc'
                           : 'none',
              borderRadius:  2,
              boxShadow:     isFocused ? '0 2px 8px rgba(99,102,241,0.18)' : 'none',
              zIndex:        isFocused ? 15 : item.isEdited ? 10 : 5,
              transition:    'background 0.1s, border 0.1s',
            }}
          >
            {item.editedText}
          </div>
        );
      })}
    </div>
  );
}

// ─── PdfPage ──────────────────────────────────────────────────────────────────

interface PdfPageProps {
  pageNumber: number; pageIndex: number; zoom: number;
  mode: EditorMode;
  activeTool: PdfToolType; toolStyle: ToolStyle;
  annotations: Annotation[]; selectedId: string | null;
  textItems: PdfTextItem[];
  visible: boolean; onVisible: () => void;
  onAddAnnotation: (a: Annotation) => void;
  onLiveUpdateAnnotation: (a: Annotation) => void;
  onCommitMove: () => void;
  onSelectAnnotation: (id: string | null) => void;
  onDeleteAnnotation: (id: string) => void;
  onUpdateAnnotation: (id: string, patch: Partial<Annotation>) => void;
  onTextItemCommit: (itemId: string, newText: string, item: PdfTextItem) => void;
}

function PdfPage({
  pageNumber, pageIndex, zoom, mode, activeTool, toolStyle,
  annotations, selectedId, textItems, visible, onVisible,
  onAddAnnotation, onLiveUpdateAnnotation, onCommitMove,
  onSelectAnnotation, onDeleteAnnotation, onUpdateAnnotation,
  onTextItemCommit,
}: PdfPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const [cssW, setCssW] = useState(0);
  const [cssH, setCssH] = useState(0);

  const isDrawingRef  = useRef(false);
  const drawStartRef  = useRef({ fx:0, fy:0 });
  const livePointsRef = useRef<Point[]>([]);
  const tempAnnRef    = useRef<Annotation | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef  = useRef({ fx:0, fy:0 });
  const dragOrigRef   = useRef<Annotation | null>(null);

  const [textInput, setTextInput]   = useState<{ fx:number; fy:number } | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [tick, setTick] = useState(0);
  const repaint = useCallback(() => setTick(t => t+1), []);

  // Lazy visibility
  useEffect(() => {
    if (visible) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) onVisible(); }, { threshold:0.05 });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [visible, onVisible]);

  // Canvas render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !cssW || !cssH) return;
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== Math.round(cssW*dpr) || canvas.height !== Math.round(cssH*dpr)) {
      canvas.width = Math.round(cssW*dpr); canvas.height = Math.round(cssH*dpr);
      canvas.style.width = cssW+'px'; canvas.style.height = cssH+'px';
    }
    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(1,0,0,1,0,0); ctx.scale(dpr,dpr);
    ctx.clearRect(0,0,cssW,cssH);
    for (const ann of annotations) {
      if (ann.type==='sticky') continue;
      drawAnnotation(ctx, ann, cssW, cssH, ann.id===selectedId);
    }
    if (tempAnnRef.current && tempAnnRef.current.type !== 'sticky') {
      drawAnnotation(ctx, tempAnnRef.current, cssW, cssH, false);
    }
  }, [annotations, selectedId, cssW, cssH, tick]);

  useEffect(() => {
    if (textInput) setTimeout(() => textAreaRef.current?.focus(), 30);
  }, [textInput]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.key==='Delete'||e.key==='Backspace') && selectedId) {
        const t = e.target as HTMLElement;
        if (t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.isContentEditable) return;
        onDeleteAnnotation(selectedId);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedId, onDeleteAnnotation]);

  const getCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { fx:(e.clientX-r.left)/r.width, fy:(e.clientY-r.top)/r.height };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode !== 'annotate') return;
    const { fx, fy } = getCoords(e);

    if (activeTool === 'select') {
      const hit = [...annotations].reverse().find(a => hitTestAnnotation(a,fx,fy));
      if (hit) {
        onSelectAnnotation(hit.id);
        isDraggingRef.current = true;
        dragStartRef.current = { fx, fy };
        dragOrigRef.current = JSON.parse(JSON.stringify(hit));
      } else {
        onSelectAnnotation(null);
      }
      return;
    }
    if (activeTool === 'text') { setTextInput({ fx, fy }); return; }
    if (activeTool === 'sticky') {
      const s: StickyAnnotation = { id:nanoid(), type:'sticky', pageIndex,
        x:fx, y:fy, text:'', color:toolStyle.highlightColor };
      onAddAnnotation(s); onSelectAnnotation(s.id); return;
    }

    isDrawingRef.current = true; drawStartRef.current = { fx, fy };
    livePointsRef.current = [{ x:fx, y:fy }];

    if (activeTool === 'draw') {
      tempAnnRef.current = { id:'temp', type:'draw', pageIndex, points:[{x:fx,y:fy}],
        color:toolStyle.color, strokeWidth:toolStyle.strokeWidth } satisfies DrawAnnotation;
    } else if (activeTool === 'highlight') {
      tempAnnRef.current = { id:'temp', type:'highlight', pageIndex,
        x:fx, y:fy, width:0, height:0,
        color:toolStyle.highlightColor, opacity:toolStyle.opacity } satisfies HighlightAnnotation;
    } else if (activeTool==='rectangle'||activeTool==='circle') {
      tempAnnRef.current = { id:'temp', type:activeTool, pageIndex,
        x:fx, y:fy, width:0, height:0,
        strokeColor:toolStyle.color, fillColor:toolStyle.fillColor,
        strokeWidth:toolStyle.strokeWidth } satisfies ShapeAnnotation;
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode !== 'annotate') return;
    const { fx, fy } = getCoords(e);
    if (activeTool==='select' && isDraggingRef.current && dragOrigRef.current) {
      onLiveUpdateAnnotation(moveAnnotation(dragOrigRef.current, fx-dragStartRef.current.fx, fy-dragStartRef.current.fy));
      return;
    }
    if (!isDrawingRef.current || !tempAnnRef.current) return;
    const tmp = tempAnnRef.current;
    if (tmp.type==='draw') {
      const last = livePointsRef.current[livePointsRef.current.length-1];
      if (Math.hypot(fx-last.x, fy-last.y) > 0.002) {
        livePointsRef.current.push({x:fx,y:fy});
        (tmp as DrawAnnotation).points = [...livePointsRef.current];
      }
    } else if ('width' in tmp) {
      const { fx:sx, fy:sy } = drawStartRef.current;
      (tmp as HighlightAnnotation).x = Math.min(sx,fx);
      (tmp as HighlightAnnotation).y = Math.min(sy,fy);
      (tmp as HighlightAnnotation).width  = Math.abs(fx-sx);
      (tmp as HighlightAnnotation).height = Math.abs(fy-sy);
    }
    repaint();
  };

  const handleMouseUp = () => {
    if (mode !== 'annotate') return;
    if (activeTool==='select' && isDraggingRef.current) {
      isDraggingRef.current = false; dragOrigRef.current = null; onCommitMove(); return;
    }
    if (isDrawingRef.current && tempAnnRef.current) {
      const tmp = tempAnnRef.current;
      const ok = tmp.type==='draw' ? livePointsRef.current.length>=3
        : ('width' in tmp ? (tmp as HighlightAnnotation).width>0.005||(tmp as HighlightAnnotation).height>0.005 : true);
      if (ok) onAddAnnotation({ ...tmp, id:nanoid() } as Annotation);
    }
    isDrawingRef.current = false; tempAnnRef.current = null; livePointsRef.current = []; repaint();
  };

  const commitTextInput = (val: string) => {
    if (!textInput || !val.trim()) { setTextInput(null); return; }
    onAddAnnotation({ id:nanoid(), type:'text', pageIndex,
      x:textInput.fx, y:textInput.fy,
      text:val, fontSize:toolStyle.fontSize, color:toolStyle.color } satisfies TextAnnotation);
    setTextInput(null);
  };

  const CURSOR: Record<PdfToolType, string> = {
    select:'default', draw:'crosshair', highlight:'crosshair',
    rectangle:'crosshair', circle:'crosshair', text:'text', sticky:'cell', 'edit-text':'default',
  };

  const selectedAnn = selectedId ? annotations.find(a => a.id===selectedId) : null;
  const renderedW   = BASE_W * zoom;
  const isEditMode  = mode === 'edit-text';

  return (
    <div ref={containerRef} className="relative mb-10 select-none"
      style={{ width:renderedW, boxShadow:'0 6px 30px rgba(0,0,0,0.14)', borderRadius:6 }}>

      {!visible ? (
        <div className="animate-pulse bg-gray-100 rounded"
          style={{ width:renderedW, height:renderedW*1.414 }}/>
      ) : (
        <>
          <Page pageNumber={pageNumber} width={renderedW}
            renderAnnotationLayer={false}
            renderTextLayer={false}
            onRenderSuccess={({ width, height }) => { setCssW(Math.round(width)); setCssH(Math.round(height)); }}/>

          {/* Annotation canvas — always present for annotations + text-replacement white-outs */}
          {cssW > 0 && (
            <canvas ref={canvasRef} className="absolute inset-0"
              style={{
                borderRadius:  6,
                cursor:        isEditMode ? 'default' : CURSOR[activeTool],
                pointerEvents: isEditMode ? 'none' : 'auto',
              }}
              onMouseDown={handleMouseDown} onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}/>
          )}

          {/* Text edit layer — contenteditable spans over PDF text */}
          {isEditMode && cssW > 0 && (
            <TextEditLayer
              items={textItems} W={cssW} H={cssH}
              onItemCommit={(itemId, newText) => {
                const item = textItems.find(i => i.id === itemId);
                if (item) onTextItemCommit(itemId, newText, item);
              }}/>
          )}

          {/* Text annotation input box */}
          {textInput && cssW > 0 && (
            <div style={{ position:'absolute', left:textInput.fx*cssW, top:textInput.fy*cssH, zIndex:20,
              background:'white', border:'2px solid #6366f1', borderRadius:6,
              boxShadow:'0 4px 16px rgba(0,0,0,0.18)', padding:6, minWidth:200 }}
              onMouseDown={e => e.stopPropagation()}>
              <textarea ref={textAreaRef} rows={2} placeholder="Type annotation text…"
                style={{ display:'block', width:'100%', background:'transparent', border:'none',
                  outline:'none', font:`${toolStyle.fontSize*(cssW/BASE_W)}px sans-serif`,
                  color:toolStyle.color, resize:'none', lineHeight:1.4, padding:2 }}
                onKeyDown={e => {
                  if (e.key==='Escape') setTextInput(null);
                  if (e.key==='Enter'&&!e.shiftKey) { e.preventDefault(); commitTextInput((e.target as HTMLTextAreaElement).value); }
                }}/>
              <div style={{ display:'flex', justifyContent:'flex-end', gap:4, marginTop:4 }}>
                <button onClick={() => setTextInput(null)}
                  style={{ fontSize:11, padding:'2px 8px', cursor:'pointer', borderRadius:3, border:'1px solid #d1d5db' }}>
                  Cancel
                </button>
                <button onClick={() => commitTextInput(textAreaRef.current?.value ?? '')}
                  style={{ fontSize:11, padding:'2px 8px', background:'#6366f1', color:'white', border:'none', borderRadius:3, cursor:'pointer' }}>
                  <Check size={11} style={{ display:'inline', marginRight:2 }}/> Add
                </button>
              </div>
            </div>
          )}

          {/* Sticky notes */}
          {annotations.filter((a): a is StickyAnnotation => a.type==='sticky').map(a => (
            <StickyNoteEl key={a.id} ann={a} W={cssW} H={cssH} zoom={zoom}
              isSelected={a.id===selectedId}
              onSelect={() => onSelectAnnotation(a.id)}
              onUpdate={p => onUpdateAnnotation(a.id, p as Partial<Annotation>)}
              onDelete={() => onDeleteAnnotation(a.id)}/>
          ))}

          {/* Floating toolbar for selected annotation */}
          {selectedAnn && selectedAnn.type!=='sticky' && cssW>0 && (
            <FloatingAnnotationToolbar ann={selectedAnn} W={cssW} H={cssH}
              onColorChange={c => {
                const patch: Partial<Annotation> = (selectedAnn.type==='rectangle'||selectedAnn.type==='circle')
                  ? { strokeColor:c } as Partial<ShapeAnnotation>
                  : { color:c } as Partial<TextAnnotation>;
                onUpdateAnnotation(selectedAnn.id, patch);
              }}
              onDelete={() => onDeleteAnnotation(selectedAnn.id)}/>
          )}
        </>
      )}

      <div className="text-center text-[11px] text-muted-foreground py-1.5 font-medium">
        Page {pageNumber}
      </div>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function PdfToast({ message, type }: { message:string; type:'info'|'success'|'error' }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl shadow-xl text-sm font-medium text-white
      ${type==='error'?'bg-destructive':type==='success'?'bg-green-600':'bg-foreground'}`}>
      {message}
    </div>
  );
}

// ─── PdfEditor (main) ─────────────────────────────────────────────────────────

export default function PdfEditor() {
  const { noteId }   = useParams<{ noteId: string }>();
  const notes        = useWorkspaceStore(s => s.notes);
  const updateNote   = useWorkspaceStore(s => s.updateNote);
  const note         = useMemo(() => notes.find(n => n.id===noteId), [notes, noteId]);
  const { save, saveStatus } = useAutoSave(noteId!);

  // ── PDF workspace data ────────────────────────────────────────────────────

  const [pdfData, setPdfData] = useState<PdfWorkspaceData>(() => {
    const c = note?.content;
    return (c && c.pdfBase64 !== undefined) ? c as PdfWorkspaceData : DEFAULT_PDF_WORKSPACE;
  });

  useEffect(() => {
    const c = note?.content;
    if (c && c.pdfBase64 !== undefined) setPdfData(c as PdfWorkspaceData);
  }, [note?.id]); // eslint-disable-line

  // ── Annotation history ────────────────────────────────────────────────────

  const [history, setHistory]   = useState<Array<Record<number, Annotation[]>>>([pdfData.annotations]);
  const [histIdx, setHistIdx]   = useState(0);
  const currentAnns             = history[histIdx] ?? {};

  const pushHistory = useCallback((next: Record<number, Annotation[]>) => {
    setHistory(h => [...h.slice(0, histIdx+1), next]);
    setHistIdx(i => i+1);
  }, [histIdx]);

  const undo = () => { if (histIdx>0) setHistIdx(i => i-1); };
  const redo = () => { if (histIdx<history.length-1) setHistIdx(i => i+1); };

  const persistAnnotations = useCallback((anns: Record<number, Annotation[]>) => {
    const updated = { ...pdfData, annotations: anns };
    setPdfData(updated);
    updateNote(noteId!, { content: updated });
    save({ content: updated });
  }, [pdfData, noteId, updateNote, save]);

  // ── Mode & tool ───────────────────────────────────────────────────────────

  const [mode, setMode]           = useState<EditorMode>('annotate');
  const [activeTool, setActiveTool] = useState<PdfToolType>('select');
  const [toolStyle, setToolStyle]   = useState<ToolStyle>(DEFAULT_TOOL_STYLE);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // ── PDF state ─────────────────────────────────────────────────────────────

  const [numPages, setNumPages]         = useState(0);
  const [currentPage, setCurrentPage]   = useState(1);
  const [visiblePages, setVisiblePages] = useState<Set<number>>(new Set([0]));
  const [toast, setToast]               = useState<{ msg:string; type:'info'|'success'|'error' }|null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const viewerRef    = useRef<HTMLDivElement>(null);
  const pageRefs     = useRef<Array<HTMLDivElement|null>>([]);

  const showToast = (msg: string, type: 'info'|'success'|'error' = 'info') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000);
  };

  // ── Text item extraction (pdfjs) ──────────────────────────────────────────

  const [pdfjsDoc, setPdfjsDoc]       = useState<pdfjs.PDFDocumentProxy | null>(null);
  const [pageTextItems, setPageTextItems] = useState<Record<number, PdfTextItem[]>>({});
  // Track which items have been edited (id → new text)
  const [textEdits, setTextEdits]     = useState<Record<string, string>>({});

  // Load the pdfjs document when PDF changes
  useEffect(() => {
    if (!pdfData.pdfBase64) return;
    const bytes = Uint8Array.from(atob(pdfData.pdfBase64), c => c.charCodeAt(0));
    const task  = pdfjs.getDocument({ data: bytes });
    task.promise.then(doc => setPdfjsDoc(doc)).catch(console.error);
    return () => { task.destroy(); };
  }, [pdfData.pdfBase64]);

  // Extract text items for visible pages when entering edit mode
  useEffect(() => {
    if (!pdfjsDoc || mode !== 'edit-text') return;
    visiblePages.forEach(async pi => {
      if (pageTextItems[pi]) return; // already extracted
      try {
        const page       = await pdfjsDoc.getPage(pi + 1);
        const viewport   = page.getViewport({ scale: 1 });
        const textContent = await page.getTextContent();
        const vt          = viewport.transform; // [a,b,c,d,e,f]

        const items: PdfTextItem[] = textContent.items
          .filter(it => 'str' in it && (it as { str: string }).str.trim())
          .map(it => {
            const i  = it as { str:string; transform:number[]; width:number; fontName:string };
            const tx = i.transform;
            // tx = [scaleX, skewY, skewX, scaleY, x, y] in PDF user space
            // scaleX encodes horizontal scaling (tx[0]), scaleY encodes font height (tx[3])
            const fontH = Math.abs(tx[3]); // font height in PDF user space at scale=1

            // Horizontal-scale factor relative to vertical: used as letter-spacing hint
            const hScale = tx[0] !== 0 && fontH !== 0 ? Math.abs(tx[0]) / fontH : 1;

            // Convert PDF coords (bottom-left origin) → CSS px (top-left) via viewport transform
            const cssX = vt[0]*tx[4] + vt[2]*tx[5] + vt[4];
            const cssY = vt[1]*tx[4] + vt[3]*tx[5] + vt[5];

            const { fontWeight, fontStyle } = mapPdfFontStyle(i.fontName ?? '');

            return {
              id:                 nanoid(),
              pageIndex:          pi,
              x:                  cssX / viewport.width,
              y:                  (cssY - fontH) / viewport.height,
              width:              Math.max(0.005, i.width / viewport.width),
              height:             Math.max(0.008, fontH / viewport.height),
              originalText:       i.str,
              editedText:         i.str,
              isEdited:           false,
              fontFamily:         mapPdfFont(i.fontName ?? ''),
              fontWeight,
              fontStyle,
              letterSpacingScale: hScale,
            };
          });

        setPageTextItems(prev => ({ ...prev, [pi]: items }));
      } catch (e) {
        console.error('text extraction failed', e);
      }
    });
  }, [pdfjsDoc, mode, visiblePages]); // eslint-disable-line

  // Apply saved textEdits to items whenever pageTextItems changes
  useEffect(() => {
    if (!Object.keys(textEdits).length) return;
    setPageTextItems(prev => {
      const next = { ...prev };
      for (const [pi, items] of Object.entries(prev)) {
        next[+pi] = items.map(item =>
          textEdits[item.id] !== undefined
            ? { ...item, editedText: textEdits[item.id], isEdited: true }
            : item
        );
      }
      return next;
    });
  }, [textEdits]); // eslint-disable-line

  // ── Text item commit (in-place edit) ──────────────────────────────────────

  const handleTextItemCommit = useCallback((itemId: string, newText: string, item: PdfTextItem) => {
    // 1. Track the edit so the span stays opaque
    setTextEdits(prev => ({ ...prev, [itemId]: newText }));
    setPageTextItems(prev => {
      const items = prev[item.pageIndex] ?? [];
      return {
        ...prev,
        [item.pageIndex]: items.map(i =>
          i.id===itemId ? { ...i, editedText: newText, isEdited: true } : i
        ),
      };
    });

    // 2. Create / update a TextReplacement annotation so canvas + export reflect it
    const existingId = `tr-${itemId}`;
    const existingAnns = currentAnns[item.pageIndex] ?? [];
    const already = existingAnns.find(a => a.id === existingId);

    if (already) {
      // Update in place (no new history entry to avoid spam)
      const updated: Record<number, Annotation[]> = {};
      for (const [k, arr] of Object.entries(currentAnns)) {
        updated[+k] = arr.map(a => a.id===existingId ? { ...a, newText } as Annotation : a);
      }
      setHistory(h => { const c=[...h]; c[histIdx]=updated; return c; });
      setPdfData(d => ({ ...d, annotations: updated }));
      updateNote(noteId!, { content: { ...pdfData, annotations: updated } });
      save({ content: { ...pdfData, annotations: updated } });
    } else {
      // fontSize stored as a fraction-of-height value (height fraction * BASE_W)
      // so the canvas drawAnnotation helper (which scales by W/BASE_W) yields the
      // correct CSS pixel size when rendering on the annotation canvas.
      const rep: TextReplacement = {
        id: existingId, type: 'text-replacement', pageIndex: item.pageIndex,
        x: item.x, y: item.y, width: item.width, height: item.height,
        originalText: item.originalText, newText,
        fontSize: item.height * BASE_W, color: '#111827',
      };
      addAnnotation(rep);
    }
  }, [currentAnns, histIdx, pdfData, noteId, toolStyle.color]); // eslint-disable-line

  // ── Annotation CRUD ───────────────────────────────────────────────────────

  const addAnnotation = (ann: Annotation) => {
    const next = { ...currentAnns, [ann.pageIndex]: [...(currentAnns[ann.pageIndex]??[]), ann] };
    pushHistory(next); persistAnnotations(next);
  };

  const liveUpdateAnnotation = (ann: Annotation) => {
    const next = { ...currentAnns, [ann.pageIndex]: (currentAnns[ann.pageIndex]??[]).map(a=>a.id===ann.id?ann:a) };
    setHistory(h=>{const c=[...h];c[histIdx]=next;return c;});
    setPdfData(d=>({...d,annotations:next}));
    updateNote(noteId!, { content:{...pdfData,annotations:next} });
  };

  const commitMove = () => { const a=history[histIdx]??{}; pushHistory(a); persistAnnotations(a); };

  const updateAnnotation = (id: string, patch: Partial<Annotation>) => {
    const next: Record<number,Annotation[]> = {};
    for (const [k,arr] of Object.entries(currentAnns)) {
      next[+k] = arr.map(a => a.id===id ? {...a,...patch} as Annotation : a);
    }
    pushHistory(next); persistAnnotations(next);
  };

  const deleteAnnotation = (id: string) => {
    const next: Record<number,Annotation[]> = {};
    for (const [k,arr] of Object.entries(currentAnns)) next[+k]=arr.filter(a=>a.id!==id);
    pushHistory(next); persistAnnotations(next); setSelectedId(null);
  };

  // ── Zoom & navigation ─────────────────────────────────────────────────────

  const zoom    = pdfData.zoom ?? 1;
  const setZoom = (z: number) => {
    const clamped = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z));
    const updated = { ...pdfData, zoom: clamped };
    setPdfData(updated); updateNote(noteId!, { content: updated });
  };

  const scrollToPage = (page: number) => {
    setCurrentPage(page);
    pageRefs.current[page-1]?.scrollIntoView({ behavior:'smooth', block:'start' });
  };

  // ── Keyboard shortcuts ────────────────────────────────────────────────────

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey||e.ctrlKey) && e.key==='z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.metaKey||e.ctrlKey) && (e.key==='y'||(e.key==='z'&&e.shiftKey))) { e.preventDefault(); redo(); }
      if ((e.metaKey||e.ctrlKey) && e.key==='s') { e.preventDefault(); handleSave(); }
      if (e.key==='=' && (e.metaKey||e.ctrlKey)) { e.preventDefault(); setZoom(zoom+ZOOM_STEP); }
      if (e.key==='-' && (e.metaKey||e.ctrlKey)) { e.preventDefault(); setZoom(zoom-ZOOM_STEP); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }); // intentional — captures latest callbacks

  // ── File upload ───────────────────────────────────────────────────────────

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = ev => {
      const base64 = (ev.target?.result as string).split(',')[1];
      const updated: PdfWorkspaceData = { pdfBase64:base64, pdfName:file.name, annotations:{}, zoom:1.0 };
      setPdfData(updated); setHistory([{}]); setHistIdx(0);
      setPageTextItems({}); setTextEdits({});
      updateNote(noteId!, { content:updated, title:file.name.replace(/\.pdf$/i,'') });
      save({ content:updated }); showToast('PDF loaded', 'success');
    };
    reader.readAsDataURL(file);
  };

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = () => {
    const content = { ...pdfData, annotations: currentAnns };
    updateNote(noteId!, { content }); save({ content });
    showToast('Saved', 'success');
  };

  // ── Export ────────────────────────────────────────────────────────────────

  const handleExport = async () => {
    if (!pdfData.pdfBase64) return;
    showToast('Generating PDF…', 'info');
    try {
      const bytes  = Uint8Array.from(atob(pdfData.pdfBase64), c => c.charCodeAt(0));
      const pdfDoc = await PDFDocument.load(bytes);
      const pages  = pdfDoc.getPages();
      const font   = await pdfDoc.embedFont(StandardFonts.Helvetica);

      for (const [idxStr, anns] of Object.entries(currentAnns)) {
        const pi = parseInt(idxStr);
        if (pi >= pages.length) continue;
        const page = pages[pi];
        const { width: pW, height: pH } = page.getSize();
        const flipY = (fy: number, fh = 0) => pH - fy*pH - fh*pH;

        for (const ann of anns) {
          switch (ann.type) {
            case 'highlight':
              page.drawRectangle({ x:ann.x*pW, y:flipY(ann.y,ann.height),
                width:ann.width*pW, height:ann.height*pH,
                color:hexToRgb(ann.color), opacity:ann.opacity }); break;
            case 'rectangle':
              page.drawRectangle({ x:ann.x*pW, y:flipY(ann.y,ann.height),
                width:ann.width*pW, height:ann.height*pH,
                borderColor:hexToRgb(ann.strokeColor), borderWidth:ann.strokeWidth,
                ...(ann.fillColor!=='transparent'?{color:hexToRgb(ann.fillColor)}:{opacity:0}) }); break;
            case 'circle':
              page.drawEllipse({ x:(ann.x+ann.width/2)*pW, y:flipY(ann.y+ann.height/2),
                xScale:(ann.width/2)*pW, yScale:(ann.height/2)*pH,
                borderColor:hexToRgb(ann.strokeColor), borderWidth:ann.strokeWidth,
                ...(ann.fillColor!=='transparent'?{color:hexToRgb(ann.fillColor)}:{opacity:0}) }); break;
            case 'text':
              page.drawText(ann.text, { x:ann.x*pW, y:flipY(ann.y),
                size:ann.fontSize, font, color:hexToRgb(ann.color) }); break;
            case 'draw': {
              if (ann.points.length<2) break;
              let s=`M ${ann.points[0].x*pW} ${flipY(ann.points[0].y)}`;
              for (let i=1;i<ann.points.length;i++) s+=` L ${ann.points[i].x*pW} ${flipY(ann.points[i].y)}`;
              page.drawSvgPath(s, { borderColor:hexToRgb(ann.color), borderWidth:ann.strokeWidth, borderOpacity:1 }); break;
            }
            case 'sticky': {
              const sW=(STICKY_W/BASE_W)*pW, sH=(STICKY_H/600)*pH;
              page.drawRectangle({ x:ann.x*pW, y:flipY(ann.y,STICKY_H/600), width:sW, height:sH, color:hexToRgb(ann.color) });
              if (ann.text) page.drawText(ann.text.slice(0,80), { x:ann.x*pW+6, y:flipY(ann.y,STICKY_H/600)+sH-18, size:10, font, color:rgb(0.1,0.1,0.1) });
              break;
            }
            case 'text-replacement':
              page.drawRectangle({ x:ann.x*pW-1, y:flipY(ann.y,ann.height)-1,
                width:ann.width*pW+2, height:ann.height*pH+2, color:rgb(1,1,1) });
              if (ann.newText) page.drawText(ann.newText, { x:ann.x*pW, y:flipY(ann.y,ann.height)+1,
                size:Math.max(6,ann.fontSize), font, color:hexToRgb(ann.color) }); break;
          }
        }
      }

      const saved = await pdfDoc.save();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const blob = new Blob([saved as any], { type:'application/pdf' });
      const url  = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; link.download = `edited-${pdfData.pdfName ?? 'document'}.pdf`;
      link.click(); URL.revokeObjectURL(url);
      showToast('PDF exported!', 'success');
    } catch(err) {
      console.error(err); showToast('Export failed', 'error');
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (!note) return null;
  const pdfFile = pdfData.pdfBase64 ? `data:application/pdf;base64,${pdfData.pdfBase64}` : null;

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Title bar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b shrink-0">
        <Breadcrumb note={note}/>
        <NoteTitleInput note={note}/>
      </div>

      {/* Main toolbar */}
      {pdfFile && (
        <MainToolbar
          mode={mode} activeTool={activeTool} style={toolStyle}
          zoom={zoom} pageCount={numPages} currentPage={currentPage}
          canUndo={histIdx>0} canRedo={histIdx<history.length-1}
          saveStatus={saveStatus}
          onMode={m => { setMode(m); setSelectedId(null); }}
          onTool={setActiveTool}
          onStyleChange={p => setToolStyle(s => ({ ...s, ...p }))}
          onZoomIn={() => setZoom(zoom+ZOOM_STEP)}
          onZoomOut={() => setZoom(zoom-ZOOM_STEP)}
          onPageChange={scrollToPage}
          onUndo={undo} onRedo={redo}
          onSave={handleSave} onExport={handleExport}
          onUploadNew={() => fileInputRef.current?.click()}
        />
      )}

      <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden"
        onChange={e => { const f=e.target.files?.[0]; if(f) handleFileUpload(f); e.target.value=''; }}/>

      {!pdfFile ? (
        <UploadZone onFile={handleFileUpload}/>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Thumbnail sidebar */}
          {numPages > 0 && (
            <Document file={pdfFile} onLoadSuccess={() => {}}>
              <ThumbnailSidebar
                numPages={numPages} currentPage={currentPage}
                pdfFile={pdfFile} onPageClick={scrollToPage}/>
            </Document>
          )}

          {/* Main viewer */}
          <div ref={viewerRef} className="flex-1 overflow-y-auto overflow-x-auto bg-[#404040]">
            <div className="flex flex-col items-center py-10 px-6 min-h-full">
              <Document file={pdfFile}
                onLoadSuccess={({ numPages: n }) => { setNumPages(n); setVisiblePages(new Set([0])); }}
                onLoadError={err => { console.error(err); showToast('Failed to load PDF','error'); }}
                loading={
                  <div className="flex items-center gap-3 text-white/70 py-24">
                    <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"/>
                    Loading PDF…
                  </div>
                }>
                {Array.from({ length: numPages }, (_,i) => (
                  <div key={i} ref={el => { pageRefs.current[i]=el; }}>
                    <PdfPage
                      pageNumber={i+1} pageIndex={i} zoom={zoom}
                      mode={mode} activeTool={activeTool} toolStyle={toolStyle}
                      annotations={currentAnns[i] ?? []}
                      selectedId={selectedId}
                      textItems={(pageTextItems[i] ?? []).map(item =>
                        textEdits[item.id] !== undefined
                          ? { ...item, editedText: textEdits[item.id], isEdited: true }
                          : item
                      )}
                      visible={visiblePages.has(i)}
                      onVisible={() => { setVisiblePages(s => new Set([...s, i])); setCurrentPage(i+1); }}
                      onAddAnnotation={addAnnotation}
                      onLiveUpdateAnnotation={liveUpdateAnnotation}
                      onCommitMove={commitMove}
                      onSelectAnnotation={setSelectedId}
                      onDeleteAnnotation={deleteAnnotation}
                      onUpdateAnnotation={updateAnnotation}
                      onTextItemCommit={handleTextItemCommit}
                    />
                  </div>
                ))}
              </Document>
            </div>
          </div>
        </div>
      )}

      {toast && <PdfToast message={toast.msg} type={toast.type}/>}
    </div>
  );
}
