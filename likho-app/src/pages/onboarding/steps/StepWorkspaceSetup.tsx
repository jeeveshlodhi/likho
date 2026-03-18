import { Rocket, LayoutTemplate, Sparkles } from 'lucide-react';
import { useOnboardingWizardStore, WorkspaceMode } from '@/store/onboardingWizardStore';
import StepShell from './StepShell';

interface ModeCard {
  id: WorkspaceMode;
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
  badge?: string;
}

const MODES: ModeCard[] = [
  {
    id: 'blank',
    icon: <Rocket className="w-6 h-6" />,
    title: 'Start from scratch',
    description: 'A clean workspace — build exactly what you need',
    gradient: 'from-blue-500/20 to-indigo-500/20 border-blue-500/30',
  },
  {
    id: 'template',
    icon: <LayoutTemplate className="w-6 h-6" />,
    title: 'Use a template',
    description: 'Pre-built structures for notes, projects, and more',
    gradient: 'from-purple-500/20 to-pink-500/20 border-purple-500/30',
  },
  {
    id: 'ai',
    icon: <Sparkles className="w-6 h-6" />,
    title: 'Generate with AI',
    description: 'Describe what you need — we\'ll build it instantly',
    gradient: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30',
    badge: 'Magic ✨',
  },
];

const StepWorkspaceSetup = () => {
  const { data, updateData, nextStep } = useOnboardingWizardStore();

  const select = (mode: WorkspaceMode) => {
    updateData({ workspace_mode: mode });
    nextStep();
  };

  return (
    <StepShell
      title="How do you want to start?"
      subtitle="Set up your first workspace — you can always change this later"
    >
      <div className="space-y-3">
        {MODES.map((mode) => (
          <button
            key={mode.id}
            type="button"
            onClick={() => select(mode.id)}
            className={`w-full p-4 rounded-xl border bg-gradient-to-br text-left transition-all hover:scale-[1.01] hover:shadow-lg hover:shadow-black/10
              ${data.workspace_mode === mode.id
                ? `${mode.gradient} ring-1 ring-white/10`
                : 'border-border/40 bg-surface/50 hover:border-border'
              }`}
          >
            <div className="flex items-start gap-3.5">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${mode.gradient} flex items-center justify-center flex-shrink-0 text-foreground`}>
                {mode.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{mode.title}</p>
                  {mode.badge && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                      {mode.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{mode.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </StepShell>
  );
};

export default StepWorkspaceSetup;
