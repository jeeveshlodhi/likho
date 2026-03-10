import { useState } from 'react';
import type { CanvasElement, CameraState } from '@/types/canvas';
import { exportToPng, exportToSvg, exportToJson, loadFromJson } from '../utils/export';
import { X, Download, Upload, FileImage, FileCode, FileJson } from 'lucide-react';

interface ExportModalProps {
  elements: CanvasElement[];
  camera: CameraState;
  onClose: () => void;
  onImport: (data: { elements: CanvasElement[]; camera: CameraState }) => void;
}

export function ExportModal({ elements, camera, onClose, onImport }: ExportModalProps) {
  const [bg, setBg] = useState<'white' | 'transparent'>('white');
  const [loading, setLoading] = useState<string | null>(null);

  const handle = async (action: () => Promise<void> | void, key: string) => {
    setLoading(key);
    try { await action(); } finally { setLoading(null); }
  };

  const handleImport = async () => {
    const data = await loadFromJson();
    if (data) { onImport(data); onClose(); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-background border border-border rounded-2xl shadow-2xl w-96 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-base">Export / Import</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-accent transition-all">
            <X size={16} />
          </button>
        </div>

        {/* Background option for PNG */}
        <div className="flex items-center gap-3 mb-5">
          <span className="text-sm text-muted-foreground">PNG Background:</span>
          {(['white', 'transparent'] as const).map((b) => (
            <button
              key={b}
              onClick={() => setBg(b)}
              className={`px-3 py-1 rounded-lg text-sm transition-all ${
                bg === b ? 'bg-blue-500 text-white' : 'bg-muted hover:bg-accent'
              }`}
            >
              {b}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => handle(() => exportToPng(elements, { background: bg }), 'png')}
            disabled={loading === 'png'}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted hover:bg-accent transition-all text-sm"
          >
            <FileImage size={18} className="text-blue-500" />
            <div className="text-left">
              <div className="font-medium">Export as PNG</div>
              <div className="text-xs text-muted-foreground">Raster image with {bg} background</div>
            </div>
            <Download size={14} className="ml-auto text-muted-foreground" />
          </button>

          <button
            onClick={() => handle(() => exportToSvg(elements), 'svg')}
            disabled={loading === 'svg'}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted hover:bg-accent transition-all text-sm"
          >
            <FileCode size={18} className="text-green-500" />
            <div className="text-left">
              <div className="font-medium">Export as SVG</div>
              <div className="text-xs text-muted-foreground">Scalable vector format</div>
            </div>
            <Download size={14} className="ml-auto text-muted-foreground" />
          </button>

          <button
            onClick={() => handle(() => exportToJson(elements, camera), 'json')}
            disabled={loading === 'json'}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted hover:bg-accent transition-all text-sm"
          >
            <FileJson size={18} className="text-orange-500" />
            <div className="text-left">
              <div className="font-medium">Save as JSON</div>
              <div className="text-xs text-muted-foreground">Reload the scene later</div>
            </div>
            <Download size={14} className="ml-auto text-muted-foreground" />
          </button>

          <div className="h-px bg-border" />

          <button
            onClick={handleImport}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted hover:bg-accent transition-all text-sm"
          >
            <Upload size={18} className="text-purple-500" />
            <div className="text-left">
              <div className="font-medium">Load from JSON</div>
              <div className="text-xs text-muted-foreground">Open a saved scene file</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
