import { HardDrive, Cloud, ChevronRight } from 'lucide-react';
import { useOnboardingWizardStore, DefaultSpace } from '@/store/onboardingWizardStore';
import StepShell from './StepShell';

const StepSpacePreferences = () => {
  const { data, updateData, nextStep } = useOnboardingWizardStore();

  const setSpace = (v: DefaultSpace) => updateData({ default_space: v });

  const onNext = () => {
    updateData({ sync_mode: 'auto' });
    nextStep();
  };

  const onSkip = () => {
    updateData({ default_space: 'online', sync_mode: 'auto' });
    nextStep();
  };

  const options: { id: DefaultSpace; icon: React.ReactNode; label: string; desc: string; iconColor: string; iconBg: string }[] = [
    {
      id: 'offline',
      icon: <HardDrive className="w-4 h-4" />,
      label: 'Offline',
      desc: 'Stored locally, works without internet',
      iconColor: '#f97316',
      iconBg: '#fff7ed',
    },
    {
      id: 'online',
      icon: <Cloud className="w-4 h-4" />,
      label: 'Online',
      desc: 'Synced to cloud, accessible everywhere',
      iconColor: '#3b82f6',
      iconBg: '#eff6ff',
    },
  ];

  return (
    <StepShell
      title="Where do you want to store your notes?"
      subtitle="You can switch between spaces anytime from the sidebar"
      onSkip={onSkip}
    >
      <div className="grid grid-cols-2 gap-3 mb-6">
        {options.map((opt) => {
          const isSelected = data.default_space === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setSpace(opt.id)}
              className="p-4 rounded-xl flex flex-col items-start gap-3 transition-all"
              style={{
                border: isSelected ? '1px solid #c7d2fe' : '1px solid #e4e4e7',
                backgroundColor: isSelected ? '#eef2ff' : '#fafafa',
                boxShadow: isSelected ? '0 0 0 3px rgba(99,102,241,0.08)' : '0 1px 2px rgba(0,0,0,0.04)',
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
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: opt.iconBg, color: opt.iconColor }}
              >
                {opt.icon}
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: '#09090b' }}>{opt.label}</p>
                <p className="text-xs mt-0.5" style={{ color: '#71717a' }}>{opt.desc}</p>
              </div>
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

export default StepSpacePreferences;
