import { Rocket, LayoutTemplate, Sparkles } from 'lucide-react';
import { useOnboardingWizardStore, WorkspaceMode } from '@/store/onboardingWizardStore';
import StepShell from './StepShell';

interface ModeCard {
  id: WorkspaceMode;
  icon: React.ReactNode;
  title: string;
  description: string;
  iconColor: string;
  iconBg: string;
  badge?: string;
}

const MODES: ModeCard[] = [
  {
    id: 'blank',
    icon: <Rocket className="w-5 h-5" />,
    title: 'Start from scratch',
    description: 'A clean workspace — build exactly what you need',
    iconColor: '#3b82f6',
    iconBg: '#eff6ff',
  },
  {
    id: 'template',
    icon: <LayoutTemplate className="w-5 h-5" />,
    title: 'Use a template',
    description: 'Pre-built structures for notes, projects, and more',
    iconColor: '#8b5cf6',
    iconBg: '#f5f3ff',
  },
  {
    id: 'ai',
    icon: <Sparkles className="w-5 h-5" />,
    title: 'Generate with AI',
    description: "Describe what you need — we'll build it instantly",
    iconColor: '#10b981',
    iconBg: '#f0fdf4',
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
        {MODES.map((mode) => {
          const isSelected = data.workspace_mode === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => select(mode.id)}
              className="w-full p-4 rounded-xl text-left transition-all"
              style={{
                border: isSelected ? '1px solid #c7d2fe' : '1px solid #e4e4e7',
                backgroundColor: isSelected ? '#eef2ff' : '#fafafa',
                boxShadow: isSelected ? '0 0 0 3px rgba(99,102,241,0.08)' : '0 1px 2px rgba(0,0,0,0.04)',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = '#f4f4f5';
                  e.currentTarget.style.borderColor = '#d4d4d8';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = '#fafafa';
                  e.currentTarget.style.borderColor = '#e4e4e7';
                  e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)';
                }
              }}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: mode.iconBg, color: mode.iconColor }}
                >
                  {mode.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold" style={{ color: '#09090b' }}>{mode.title}</p>
                    {mode.badge && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}
                      >
                        {mode.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: '#71717a' }}>{mode.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </StepShell>
  );
};

export default StepWorkspaceSetup;
