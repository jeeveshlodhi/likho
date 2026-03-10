import { useState } from 'react';
import {
  Sparkles, Zap, FileText, ArrowRight, Languages,
  MessageSquare, Check, X, Loader2, ChevronDown,
} from 'lucide-react';
import { CloudAiService, type WriteAction } from '@/lib/cloudAiService';
import { useAuthStore } from '@/store/authStore';

interface Props {
  noteId: string;
  content: string;
  getSelectedText: () => string;
  onApply: (text: string) => void;
  onTitleApply?: (title: string) => void;
  pageType?: string;
}

interface ActionDef {
  action: WriteAction;
  label: string;
  icon: React.ReactNode;
  desc: string;
  usesSelection: boolean;
}

const ACTIONS: ActionDef[] = [
  { action: 'improve',     label: 'Improve',     icon: <Sparkles size={13} />,     desc: 'Sharpen clarity & flow',       usesSelection: true },
  { action: 'expand',      label: 'Expand',      icon: <ArrowRight size={13} />,   desc: 'Make it more detailed',        usesSelection: true },
  { action: 'summarize',   label: 'Summarize',   icon: <FileText size={13} />,     desc: 'Extract key points',           usesSelection: false },
  { action: 'continue',    label: 'Continue',    icon: <Zap size={13} />,          desc: 'Keep writing from here',       usesSelection: false },
  { action: 'fix_grammar', label: 'Fix Grammar', icon: <Check size={13} />,        desc: 'Correct grammar & spelling',   usesSelection: true },
  { action: 'formal',      label: 'Formal tone', icon: <Languages size={13} />,    desc: 'Rewrite professionally',       usesSelection: true },
  { action: 'casual',      label: 'Casual tone', icon: <MessageSquare size={13} />, desc: 'Rewrite conversationally',   usesSelection: true },
];

export function CloudWritingAssist({ content, getSelectedText, onApply, pageType = 'note' }: Props) {
  const { isAuthenticated, isGuest } = useAuthStore();
  const [result, setResult] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<WriteAction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const isOnline = isAuthenticated && !isGuest;
  const displayedActions = showAll ? ACTIONS : ACTIONS.slice(0, 4);

  const run = async (action: WriteAction) => {
    if (!isOnline) return;
    const selection = getSelectedText();
    setLoading(true);
    setActiveAction(action);
    setResult(null);
    setError(null);
    try {
      const res = await CloudAiService.writeAssist({
        action,
        content,
        selection: selection || undefined,
        page_type: pageType,
      });
      setResult(res.result);
    } catch (e: any) {
      const msg = e?.response?.data?.detail ?? e?.message ?? String(e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const apply = () => {
    if (!result) return;
    onApply(result);
    setResult(null);
    setActiveAction(null);
  };

  const dismiss = () => {
    setResult(null);
    setActiveAction(null);
    setError(null);
  };

  if (!isOnline) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/30 px-3 py-4 text-center">
        <Sparkles size={18} className="mx-auto mb-2 text-muted-foreground/50" />
        <p className="text-xs text-muted-foreground">
          Cloud AI writing assist requires sign-in.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-1">
        {displayedActions.map(({ action, label, icon, desc }) => (
          <button
            key={action}
            onClick={() => run(action)}
            disabled={loading}
            title={desc}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-all text-left
              ${activeAction === action && loading
                ? 'bg-primary/10 text-primary ring-1 ring-primary/30'
                : loading
                ? 'opacity-40 cursor-not-allowed text-muted-foreground'
                : 'bg-muted/50 hover:bg-accent text-foreground hover:shadow-sm'
              }`}
          >
            <span className="shrink-0 text-muted-foreground">
              {activeAction === action && loading
                ? <Loader2 size={13} className="animate-spin" />
                : icon}
            </span>
            {label}
          </button>
        ))}
      </div>

      {ACTIONS.length > 4 && (
        <button
          onClick={() => setShowAll((v) => !v)}
          className="flex w-full items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors py-0.5"
        >
          <ChevronDown size={12} className={`transition-transform ${showAll ? 'rotate-180' : ''}`} />
          {showAll ? 'Show less' : `${ACTIONS.length - 4} more actions`}
        </button>
      )}

      {error && (
        <div className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}

      {result && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-2.5">
          <p className="text-xs leading-relaxed text-foreground whitespace-pre-wrap max-h-40 overflow-y-auto">
            {result}
          </p>
          <div className="flex gap-2">
            <button
              onClick={apply}
              className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Check size={11} /> Insert
            </button>
            <button
              onClick={dismiss}
              className="flex items-center gap-1 rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent transition-colors"
            >
              <X size={11} /> Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
