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
    className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all
      ${selected
        ? 'bg-indigo-500/15 border-indigo-500/50 text-indigo-300 ring-1 ring-indigo-500/30'
        : 'bg-surface border-border/40 text-muted-foreground hover:border-border hover:text-foreground'
      }`}
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
      icon={<Sliders className="w-6 h-6 text-indigo-400" />}
      title="A couple more questions"
      subtitle="Help us tune your workspace even further"
      onSkip={onSkip}
    >
      <div className="space-y-7">
        {/* Dev-specific question */}
        {isDev && (
          <div>
            <p className="text-sm font-medium text-foreground mb-3">
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

        {/* Team-specific question */}
        {isTeam && (
          <div>
            <p className="text-sm font-medium text-foreground mb-3">
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
        className="w-full mt-6 py-2.5 rounded-xl bg-foreground text-background font-medium hover:opacity-90 transition flex items-center justify-center gap-2"
      >
        Continue
        <ChevronRight className="w-4 h-4" />
      </button>
    </StepShell>
  );
};

export default StepDynamicPersonalization;
