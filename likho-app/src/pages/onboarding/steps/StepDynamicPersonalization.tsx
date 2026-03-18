import { useState } from 'react';
import { Sliders, ChevronRight } from 'lucide-react';
import { useOnboardingWizardStore } from '@/store/onboardingWizardStore';
import StepShell from './StepShell';

const DEV_TASK_OPTIONS = [
  { id: 'tasks', label: 'Task management' },
  { id: 'docs', label: 'Documentation' },
  { id: 'code', label: 'Code snippets' },
  { id: 'projects', label: 'Project planning' },
];

const TEAM_SIZE_OPTIONS = [
  { id: 'solo', label: 'Just me' },
  { id: 'small', label: '2–5 people' },
  { id: 'medium', label: '6–20 people' },
  { id: 'large', label: '20+ people' },
];

const ToggleChip = ({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
    style={{
      border: selected ? '1px solid #c7d2fe' : '1px solid #e4e4e7',
      backgroundColor: selected ? '#eef2ff' : '#fafafa',
      color: selected ? '#3730a3' : '#71717a',
      boxShadow: selected ? '0 0 0 3px rgba(99,102,241,0.08)' : 'none',
    }}
    onMouseEnter={(e) => {
      if (!selected) {
        e.currentTarget.style.backgroundColor = '#f4f4f5';
        e.currentTarget.style.borderColor = '#d4d4d8';
        e.currentTarget.style.color = '#3f3f46';
      }
    }}
    onMouseLeave={(e) => {
      if (!selected) {
        e.currentTarget.style.backgroundColor = '#fafafa';
        e.currentTarget.style.borderColor = '#e4e4e7';
        e.currentTarget.style.color = '#71717a';
      }
    }}
  >
    {label}
  </button>
);

const StepDynamicPersonalization = () => {
  const { data, updateData, nextStep } = useOnboardingWizardStore();

  const isDev = data.intent.includes('development');
  const isTeam = data.intent.includes('team');

  const [devTasks, setDevTasks] = useState<string[]>(data.dev_tasks);
  const [teamSize, setTeamSize] = useState<string>(data.team_size);

  const toggleDev = (id: string) =>
    setDevTasks((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );

  const onNext = () => {
    updateData({ dev_tasks: devTasks, team_size: teamSize });
    nextStep();
  };

  const onSkip = () => {
    updateData({ dev_tasks: [], team_size: '' });
    nextStep();
  };

  return (
    <StepShell
      icon={<Sliders className="w-5 h-5" style={{ color: '#6366f1' }} />}
      title="A couple more questions"
      subtitle="Help us tune your workspace even further"
      onSkip={onSkip}
    >
      <div className="space-y-6">
        {isDev && (
          <div>
            <p className="text-sm font-semibold mb-3" style={{ color: '#09090b' }}>
              Which development activities matter most?
            </p>
            <div className="flex flex-wrap gap-2">
              {DEV_TASK_OPTIONS.map((opt) => (
                <ToggleChip
                  key={opt.id}
                  label={opt.label}
                  selected={devTasks.includes(opt.id)}
                  onClick={() => toggleDev(opt.id)}
                />
              ))}
            </div>
          </div>
        )}

        {isTeam && (
          <div>
            <p className="text-sm font-semibold mb-3" style={{ color: '#09090b' }}>
              How large is your team?
            </p>
            <div className="flex flex-wrap gap-2">
              {TEAM_SIZE_OPTIONS.map((opt) => (
                <ToggleChip
                  key={opt.id}
                  label={opt.label}
                  selected={teamSize === opt.id}
                  onClick={() => setTeamSize(opt.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onNext}
        className="w-full mt-6 py-2.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
        style={{ backgroundColor: '#09090b', color: '#fafafa' }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
      >
        Continue
        <ChevronRight className="w-4 h-4" />
      </button>
    </StepShell>
  );
};

export default StepDynamicPersonalization;
