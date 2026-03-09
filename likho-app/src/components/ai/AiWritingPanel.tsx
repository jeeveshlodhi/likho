import { useState, useEffect } from 'react';
import { SearchService } from '@/lib/search-service';
import { Sparkles, FileText, Wand2, Zap, Loader2, Check, X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AiWritingPanelProps {
  noteId: string;
  getSelectedText: () => string;
  onApply: (text: string) => void;
  onTitleApply: (title: string) => void;
}

type Action = 'summarize' | 'title' | 'complete' | 'improve';

export function AiWritingPanel({ noteId, getSelectedText, onApply, onTitleApply }: AiWritingPanelProps) {
  const [result, setResult] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<Action | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelLoaded, setModelLoaded] = useState<boolean | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    SearchService.isLlmModelLoaded()
      .then(setModelLoaded)
      .catch(() => setModelLoaded(false));
  }, []);

  const run = async (action: Action) => {
    setLoading(true);
    setActiveAction(action);
    setResult(null);
    setError(null);
    try {
      let text = '';
      switch (action) {
        case 'summarize':
          text = await SearchService.aiSummarizeNote(noteId);
          break;
        case 'title':
          text = await SearchService.aiSuggestTitle(noteId);
          break;
        case 'complete':
          text = await SearchService.aiCompleteText(getSelectedText());
          break;
        case 'improve':
          text = await SearchService.aiImproveText(getSelectedText());
          break;
      }
      setResult(text);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  const apply = () => {
    if (!result) return;
    if (activeAction === 'title') onTitleApply(result);
    else onApply(result);
    setResult(null);
    setActiveAction(null);
  };

  const dismiss = () => {
    setResult(null);
    setActiveAction(null);
    setError(null);
  };

  const downloadModel = async () => {
    setDownloading(true);
    setDownloadError(null);
    try {
      await SearchService.downloadAiModel();
      setModelLoaded(true);
    } catch (e: any) {
      setDownloadError(e?.message ?? String(e));
    } finally {
      setDownloading(false);
    }
  };

  const tools: { action: Action; label: string; icon: React.ReactNode; desc: string; needsLlm: boolean }[] = [
    { action: 'summarize', label: 'Summarize', icon: <FileText size={14} />, desc: 'Extract key points', needsLlm: false },
    { action: 'title', label: 'Suggest Title', icon: <Wand2 size={14} />, desc: 'Auto-title from content', needsLlm: false },
    { action: 'complete', label: 'Complete', icon: <Zap size={14} />, desc: 'Continue writing', needsLlm: true },
    { action: 'improve', label: 'Improve', icon: <Sparkles size={14} />, desc: 'Refine selected text', needsLlm: true },
  ];

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        <Sparkles size={12} />
        AI Writing Tools
      </div>

      {/* Download CTA when no model loaded */}
      {modelLoaded === false && (
        <div className="rounded-md border border-border bg-muted/30 p-2.5 space-y-2">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="font-medium text-foreground">Summarize & Suggest Title</span> work now.{' '}
            <span className="font-medium text-foreground">Complete & Improve</span> need a local AI model.
          </p>
          {downloadError && (
            <p className="text-xs text-destructive">{downloadError}</p>
          )}
          <Button
            size="sm"
            className="h-7 text-xs w-full gap-1.5"
            onClick={downloadModel}
            disabled={downloading}
          >
            {downloading
              ? <><Loader2 size={12} className="animate-spin" /> Downloading TinyLlama…</>
              : <><Download size={12} /> Download AI Model (~637 MB)</>
            }
          </Button>
          {downloading && (
            <p className="text-xs text-muted-foreground text-center">
              Downloading via HuggingFace. Cached after first download.
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-1.5">
        {tools.map(({ action, label, icon, desc, needsLlm }) => {
          const isDisabled = loading || (needsLlm && !modelLoaded);
          return (
            <button
              key={action}
              onClick={() => run(action)}
              disabled={isDisabled}
              title={needsLlm && !modelLoaded ? 'Requires AI model — download above' : desc}
              className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-left transition-colors
                ${activeAction === action && loading
                  ? 'bg-primary/10 text-primary'
                  : isDisabled
                  ? 'opacity-40 cursor-not-allowed text-muted-foreground'
                  : 'hover:bg-accent text-foreground'
                }`}
            >
              {activeAction === action && loading
                ? <Loader2 size={12} className="animate-spin shrink-0" />
                : <span className="shrink-0">{icon}</span>
              }
              {label}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-2 space-y-1.5 text-xs text-destructive">
          <p>{error}</p>
          {!modelLoaded && !downloading && (
            <button
              onClick={downloadModel}
              className="flex items-center gap-1 text-primary hover:underline"
            >
              <Download size={11} /> Download AI Model
            </button>
          )}
        </div>
      )}

      {result && (
        <div className="rounded-md border border-border bg-muted/40 p-2 space-y-2">
          <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">{result}</p>
          <div className="flex items-center gap-1.5">
            <Button size="sm" variant="default" className="h-6 text-xs px-2 gap-1" onClick={apply}>
              <Check size={11} /> Apply
            </Button>
            <Button size="sm" variant="ghost" className="h-6 text-xs px-2 gap-1" onClick={dismiss}>
              <X size={11} /> Dismiss
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
