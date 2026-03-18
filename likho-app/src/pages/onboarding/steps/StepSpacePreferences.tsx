import { HardDrive, Cloud, ChevronRight } from 'lucide-react';
import { useOnboardingWizardStore, DefaultSpace } from '@/store/onboardingWizardStore';
import StepShell from './StepShell';

const StepSpacePreferences = () => {
  const { data, updateData, nextStep } = useOnboardingWizardStore();

  const setSpace = (v: DefaultSpace) => updateData({ default_space: v });

  const onNext = () => {
    updateData({ sync_mode: 'auto' }); // always auto
    nextStep();
  };

  const onSkip = () => {
    updateData({ default_space: 'online', sync_mode: 'auto' });
    nextStep();
  };

  return (
    <StepShell
      title="Where do you want to store your notes?"
      subtitle="You can switch between spaces anytime from the sidebar"
      onSkip={onSkip}
    >
      <div className="grid grid-cols-2 gap-3 mb-6">
        {/* Offline */}
        <button
          type="button"
          onClick={() => setSpace('offline')}
          className={`p-4 rounded-xl border flex flex-col items-start gap-3 transition-all
            ${data.default_space === 'offline'
              ? 'border-indigo-500/50 bg-indigo-500/10 ring-1 ring-indigo-500/30'
              : 'border-border/40 bg-surface/50 hover:border-border'
            }`}
        >
          <div className="w-9 h-9 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
            <HardDrive className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Offline</p>
            <p className="text-xs text-muted-foreground mt-0.5">Stored locally, works without internet</p>
          </div>
        </button>

        {/* Online */}
        <button
          type="button"
          onClick={() => setSpace('online')}
          className={`p-4 rounded-xl border flex flex-col items-start gap-3 transition-all
            ${data.default_space === 'online'
              ? 'border-indigo-500/50 bg-indigo-500/10 ring-1 ring-indigo-500/30'
              : 'border-border/40 bg-surface/50 hover:border-border'
            }`}
        >
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Cloud className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Online</p>
            <p className="text-xs text-muted-foreground mt-0.5">Synced to cloud, accessible everywhere</p>
          </div>
        </button>
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

export default StepSpacePreferences;
