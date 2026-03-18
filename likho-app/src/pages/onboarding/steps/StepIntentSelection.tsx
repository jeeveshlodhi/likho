import { useState } from 'react';
import { BookOpen, Code2, GraduationCap, Users, LayoutTemplate, ChevronRight } from 'lucide-react';
import { useOnboardingWizardStore } from '@/store/onboardingWizardStore';
import StepShell from './StepShell';

interface IntentOption {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const INTENTS: IntentOption[] = [
  {
    id: 'notes',
    label: 'Notes / Second Brain',
    description: 'Capture ideas, journal, manage knowledge',
    icon: <BookOpen className="w-5 h-5" />,
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  },
  {
    id: 'development',
    label: 'Development / Projects',
    description: 'Track tasks, docs, and code projects',
    icon: <Code2 className="w-5 h-5" />,
    color: 'text-green-400 bg-green-500/10 border-green-500/20',
  },
  {
    id: 'study',
    label: 'Study / Learning',
    description: 'Organize courses, notes, and flashcards',
    icon: <GraduationCap className="w-5 h-5" />,
    color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  },
  {
    id: 'team',
    label: 'Team Collaboration',
    description: 'Shared workspaces, meetings, and docs',
    icon: <Users className="w-5 h-5" />,
    color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  },
  {
    id: 'templates',
    label: 'Templates / Systems',
    description: 'Build reusable structures and workflows',
    icon: <LayoutTemplate className="w-5 h-5" />,
    color: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
  },
];

const StepIntentSelection = () => {
  const { data, updateData, nextStep } = useOnboardingWizardStore();
  const [selected, setSelected] = useState<string[]>(data.intent);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const onNext = () => {
    updateData({ intent: selected });
    nextStep();
  };

  const onSkip = () => {
    updateData({ intent: [] });
    nextStep();
  };

  return (
    <StepShell
      title="What do you want to use Likho for?"
      subtitle="Select everything that applies — we'll personalise your workspace"
      onSkip={onSkip}
    >
      <div className="space-y-2.5 mb-6">
        {INTENTS.map((intent) => {
          const isSelected = selected.includes(intent.id);
          return (
            <button
              key={intent.id}
              type="button"
              onClick={() => toggle(intent.id)}
              className={`w-full flex items-center gap-3.5 p-3.5 rounded-xl border transition-all text-left
                ${isSelected
                  ? 'border-indigo-500/50 bg-indigo-500/10 ring-1 ring-indigo-500/30'
                  : 'border-border/40 bg-surface/50 hover:border-border hover:bg-accent/30'
                }`}
            >
              {/* Icon badge */}
              <div className={`w-9 h-9 rounded-lg border flex-shrink-0 flex items-center justify-center ${intent.color}`}>
                {intent.icon}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{intent.label}</p>
                <p className="text-xs text-muted-foreground truncate">{intent.description}</p>
              </div>

              {/* Checkmark */}
              <div
                className={`w-5 h-5 rounded-full border flex-shrink-0 flex items-center justify-center transition-all
                  ${isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-border/50'}`}
              >
                {isSelected && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onNext}
        disabled={selected.length === 0}
        className="w-full py-2.5 rounded-xl bg-foreground text-background font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
      >
        Continue
        <ChevronRight className="w-4 h-4" />
      </button>
    </StepShell>
  );
};

export default StepIntentSelection;
