import { useState } from 'react';
import { BookOpen, Code2, GraduationCap, Users, LayoutTemplate, ChevronRight } from 'lucide-react';
import { useOnboardingWizardStore } from '@/store/onboardingWizardStore';
import StepShell from './StepShell';

interface IntentOption {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
}

const INTENTS: IntentOption[] = [
  {
    id: 'notes',
    label: 'Notes / Second Brain',
    description: 'Capture ideas, journal, manage knowledge',
    icon: <BookOpen className="w-4.5 h-4.5" />,
    iconColor: '#3b82f6',
    iconBg: '#eff6ff',
  },
  {
    id: 'development',
    label: 'Development / Projects',
    description: 'Track tasks, docs, and code projects',
    icon: <Code2 className="w-4.5 h-4.5" />,
    iconColor: '#22c55e',
    iconBg: '#f0fdf4',
  },
  {
    id: 'study',
    label: 'Study / Learning',
    description: 'Organize courses, notes, and flashcards',
    icon: <GraduationCap className="w-4.5 h-4.5" />,
    iconColor: '#f59e0b',
    iconBg: '#fffbeb',
  },
  {
    id: 'team',
    label: 'Team Collaboration',
    description: 'Shared workspaces, meetings, and docs',
    icon: <Users className="w-4.5 h-4.5" />,
    iconColor: '#8b5cf6',
    iconBg: '#f5f3ff',
  },
  {
    id: 'templates',
    label: 'Templates / Systems',
    description: 'Build reusable structures and workflows',
    icon: <LayoutTemplate className="w-4.5 h-4.5" />,
    iconColor: '#ec4899',
    iconBg: '#fdf2f8',
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
      <div className="space-y-2 mb-6">
        {INTENTS.map((intent) => {
          const isSelected = selected.includes(intent.id);
          return (
            <button
              key={intent.id}
              type="button"
              onClick={() => toggle(intent.id)}
              className="w-full flex items-center gap-3.5 p-3.5 rounded-xl text-left transition-all"
              style={{
                border: isSelected ? '1px solid #c7d2fe' : '1px solid #e4e4e7',
                backgroundColor: isSelected ? '#eef2ff' : '#fafafa',
                boxShadow: isSelected ? '0 0 0 3px rgba(99,102,241,0.08)' : 'none',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = '#f4f4f5';
                  e.currentTarget.style.borderColor = '#d4d4d8';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = '#fafafa';
                  e.currentTarget.style.borderColor = '#e4e4e7';
                }
              }}
            >
              {/* Icon */}
              <div
                className="w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center"
                style={{ backgroundColor: intent.iconBg, color: intent.iconColor }}
              >
                {intent.icon}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: '#09090b' }}>{intent.label}</p>
                <p className="text-xs truncate" style={{ color: '#71717a' }}>{intent.description}</p>
              </div>

              {/* Checkmark */}
              <div
                className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center transition-all"
                style={{
                  backgroundColor: isSelected ? '#6366f1' : 'transparent',
                  border: isSelected ? '1px solid #6366f1' : '1px solid #d4d4d8',
                }}
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
        className="w-full py-2.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
        style={{
          backgroundColor: selected.length === 0 ? '#e4e4e7' : '#09090b',
          color: selected.length === 0 ? '#a1a1aa' : '#fafafa',
          cursor: selected.length === 0 ? 'not-allowed' : 'pointer',
        }}
      >
        Continue
        <ChevronRight className="w-4 h-4" />
      </button>
    </StepShell>
  );
};

export default StepIntentSelection;
