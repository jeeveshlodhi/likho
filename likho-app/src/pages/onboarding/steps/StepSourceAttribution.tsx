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
      icon={<Megaphone className="w-5 h-5" style={{ color: '#6366f1' }} />}
      title="Where did you hear about Likho?"
      subtitle="Optional — helps us understand how people find us"
      onSkip={onSkip}
    >
      <div className="grid grid-cols-2 gap-2 mb-6">
        {SOURCE_OPTIONS.map((opt) => {
          const isSelected = selected === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setSelected(opt.id === selected ? '' : opt.id)}
              className="p-3 rounded-xl text-sm text-left transition-all"
              style={{
                border: isSelected ? '1px solid #c7d2fe' : '1px solid #e4e4e7',
                backgroundColor: isSelected ? '#eef2ff' : '#fafafa',
                color: isSelected ? '#3730a3' : '#71717a',
                boxShadow: isSelected ? '0 0 0 3px rgba(99,102,241,0.08)' : 'none',
                fontWeight: isSelected ? 500 : 400,
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = '#f4f4f5';
                  e.currentTarget.style.borderColor = '#d4d4d8';
                  e.currentTarget.style.color = '#3f3f46';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = '#fafafa';
                  e.currentTarget.style.borderColor = '#e4e4e7';
                  e.currentTarget.style.color = '#71717a';
                }
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onNext}
        className="w-full py-2.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
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

export default StepSourceAttribution;
