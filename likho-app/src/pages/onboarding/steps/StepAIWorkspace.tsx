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
      icon={<Sparkles className="w-5 h-5" style={{ color: '#10b981' }} />}
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
          className="likho-input w-full px-3.5 py-3 rounded-xl text-sm resize-none transition-all focus:outline-none"
          style={{
            border: '1px solid #e4e4e7',
            backgroundColor: '#ffffff',
            color: '#09090b',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#10b981';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#e4e4e7';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
      </div>

      {/* Example prompts */}
      {!preview && (
        <div className="mb-5">
          <p className="text-xs mb-2" style={{ color: '#a1a1aa' }}>Try an example:</p>
          <div className="space-y-1.5">
            {EXAMPLE_PROMPTS.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => setPrompt(ex)}
                className="w-full text-left text-xs px-3 py-2 rounded-lg transition-all"
                style={{
                  border: '1px solid #e4e4e7',
                  backgroundColor: '#fafafa',
                  color: '#71717a',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f4f4f5';
                  e.currentTarget.style.color = '#3f3f46';
                  e.currentTarget.style.borderColor = '#d4d4d8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#fafafa';
                  e.currentTarget.style.color = '#71717a';
                  e.currentTarget.style.borderColor = '#e4e4e7';
                }}
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <p
          className="text-xs mb-4 px-3 py-2 rounded-lg"
          style={{ color: '#92400e', backgroundColor: '#fffbeb', border: '1px solid #fde68a' }}
        >
          {error}
        </p>
      )}

      {/* Preview result */}
      {preview && (
        <div
          className="mb-5 p-4 rounded-xl"
          style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}
        >
          {preview.summary && (
            <p className="text-sm font-semibold mb-3" style={{ color: '#09090b' }}>{preview.summary}</p>
          )}
          <div className="space-y-1.5">
            {preview.folders.slice(0, 4).map((f) => (
              <div key={f.name} className="flex items-center gap-2 text-xs" style={{ color: '#71717a' }}>
                <span>{f.icon ?? '📁'}</span>
                <span>{f.name}</span>
              </div>
            ))}
            {preview.folders.length > 4 && (
              <p className="text-xs" style={{ color: '#a1a1aa' }}>
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
            className="flex-1 py-2.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
            style={{
              backgroundColor: !prompt.trim() || isGenerating ? '#d1fae5' : '#10b981',
              color: !prompt.trim() || isGenerating ? '#a7f3d0' : '#ffffff',
              cursor: !prompt.trim() || isGenerating ? 'not-allowed' : 'pointer',
            }}
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
              className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                border: '1px solid #e4e4e7',
                color: '#71717a',
                backgroundColor: '#ffffff',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#fafafa';
                e.currentTarget.style.color = '#3f3f46';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.color = '#71717a';
              }}
            >
              Try again
            </button>
            <button
              type="button"
              onClick={onNext}
              className="flex-1 py-2.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
              style={{ backgroundColor: '#09090b', color: '#fafafa' }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
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
