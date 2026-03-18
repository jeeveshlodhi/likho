import { useState } from 'react';
import { Sparkles, ChevronRight, Loader2 } from 'lucide-react';
import { useOnboardingWizardStore } from '@/store/onboardingWizardStore';
import { api } from '@/lib/api';
import StepShell from './StepShell';

const EXAMPLE_PROMPTS = [
  'A software engineering team tracking features and sprints',
  'A student studying for medical exams with flashcards and notes',
  'A freelance designer managing client projects and assets',
  'A writer building a second brain for research and ideas',
];

const StepAIWorkspace = () => {
  const { data, updateData, nextStep } = useOnboardingWizardStore();
  const [prompt, setPrompt] = useState(data.workspace_prompt);
  const [isGenerating, setIsGenerating] = useState(false);
  const [preview, setPreview] = useState<{
    folders: { name: string; icon?: string }[];
    notes: { title: string; folder?: string }[];
    summary?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setError(null);
    try {
      const res = await api.post('/onboarding/generate-workspace', { prompt });
      setPreview(res.data);
      updateData({ workspace_prompt: prompt });
    } catch {
      setError('Could not generate workspace right now. You can continue and set up manually.');
    } finally {
      setIsGenerating(false);
    }
  };

  const onNext = () => {
    updateData({ workspace_prompt: prompt });
    nextStep();
  };

  const onSkip = () => {
    updateData({ workspace_mode: 'blank', workspace_prompt: '' });
    nextStep();
  };

  return (
    <StepShell
      icon={<Sparkles className="w-6 h-6 text-emerald-400" />}
      title="Describe your workspace"
      subtitle="Tell us what you need and AI will build the structure for you"
      onSkip={onSkip}
    >
      {/* Prompt textarea */}
      <div className="mb-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. A product team managing sprints, documentation, and design assets…"
          rows={3}
          className="w-full px-3.5 py-3 rounded-xl bg-surface border border-border/50 text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 transition resize-none"
        />
      </div>

      {/* Example prompts */}
      {!preview && (
        <div className="mb-5">
          <p className="text-xs text-muted-foreground mb-2">Try an example:</p>
          <div className="space-y-1.5">
            {EXAMPLE_PROMPTS.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => setPrompt(ex)}
                className="w-full text-left text-xs px-3 py-2 rounded-lg bg-surface/50 border border-border/30 text-muted-foreground hover:text-foreground hover:border-border transition"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-xs text-amber-400 mb-4 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-lg">
          {error}
        </p>
      )}

      {/* Preview result */}
      {preview && (
        <div className="mb-5 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
          {preview.summary && (
            <p className="text-sm text-foreground mb-3 font-medium">{preview.summary}</p>
          )}
          <div className="space-y-1">
            {preview.folders.slice(0, 4).map((f) => (
              <div key={f.name} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{f.icon ?? '📁'}</span>
                <span>{f.name}</span>
              </div>
            ))}
            {preview.folders.length > 4 && (
              <p className="text-xs text-muted-foreground">
                + {preview.folders.length - 4} more folders
              </p>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {!preview ? (
          <button
            type="button"
            onClick={generate}
            disabled={!prompt.trim() || isGenerating}
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate workspace
              </>
            )}
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setPreview(null)}
              className="px-4 py-2.5 rounded-xl border border-border/50 text-sm text-muted-foreground hover:text-foreground transition"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={onNext}
              className="flex-1 py-2.5 rounded-xl bg-foreground text-background font-medium hover:opacity-90 transition flex items-center justify-center gap-2"
            >
              Looks good
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </StepShell>
  );
};

export default StepAIWorkspace;
