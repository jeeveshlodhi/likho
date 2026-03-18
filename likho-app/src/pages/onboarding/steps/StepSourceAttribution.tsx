import { useState } from 'react';
import { Megaphone, ChevronRight } from 'lucide-react';
import { useOnboardingWizardStore } from '@/store/onboardingWizardStore';
import StepShell from './StepShell';

const SOURCE_OPTIONS = [
  { id: 'search', label: '🔍 Search engine' },
  { id: 'social', label: '📱 Social media' },
  { id: 'friend', label: '👋 Friend or colleague' },
  { id: 'product_hunt', label: '🚀 Product Hunt' },
  { id: 'github', label: '💻 GitHub' },
  { id: 'newsletter', label: '📧 Newsletter / blog' },
  { id: 'podcast', label: '🎙 Podcast' },
  { id: 'other', label: '✨ Other' },
];

const StepSourceAttribution = () => {
  const { data, updateData, nextStep } = useOnboardingWizardStore();
  const [selected, setSelected] = useState<string>(data.source);

  const onNext = () => {
    updateData({ source: selected });
    nextStep();
  };

  const onSkip = () => {
    updateData({ source: '' });
    nextStep();
  };

  return (
    <StepShell
      icon={<Megaphone className="w-6 h-6 text-indigo-400" />}
      title="Where did you hear about Likho?"
      subtitle="Optional — helps us understand how people find us"
      onSkip={onSkip}
    >
      <div className="grid grid-cols-2 gap-2.5 mb-6">
        {SOURCE_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setSelected(opt.id === selected ? '' : opt.id)}
            className={`p-3 rounded-xl border text-sm text-left transition-all
              ${selected === opt.id
                ? 'border-indigo-500/50 bg-indigo-500/10 text-foreground ring-1 ring-indigo-500/30'
                : 'border-border/40 bg-surface/50 text-muted-foreground hover:border-border hover:text-foreground'
              }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onNext}
        className="w-full py-2.5 rounded-xl bg-foreground text-background font-medium hover:opacity-90 transition flex items-center justify-center gap-2"
      >
        Continue
        <ChevronRight className="w-4 h-4" />
      </button>
    </StepShell>
  );
};

export default StepSourceAttribution;
