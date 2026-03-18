import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useOnboardingWizardStore } from '@/store/onboardingWizardStore';

import StepIntentSelection from './steps/StepIntentSelection';
import StepDynamicPersonalization from './steps/StepDynamicPersonalization';
import StepSourceAttribution from './steps/StepSourceAttribution';
import StepWorkspaceSetup from './steps/StepWorkspaceSetup';
import StepAIWorkspace from './steps/StepAIWorkspace';
import StepSpacePreferences from './steps/StepSpacePreferences';
import StepSetupLoading from './steps/StepSetupLoading';

const BASE_STEPS = [
  'intent',
  'personalization',
  'source',
  'workspace',
  'ai-workspace',
  'preferences',
  'loading',
] as const;

export type StepId = (typeof BASE_STEPS)[number];

const stepVariants = {
  enter: { opacity: 0, x: 32 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -32 },
};

const OnboardingWizard = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { currentStep, completed, data } = useOnboardingWizardStore();

  useEffect(() => {
    if (!isAuthenticated) navigate('/auth/sign-in', { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (completed && user?.onboarded_at) navigate('/dashboard', { replace: true });
  }, [completed, user, navigate]);

  const visibleSteps: StepId[] = (() => {
    const steps: StepId[] = ['intent'];
    const needsPersonalization =
      data.intent.includes('development') || data.intent.includes('team');
    if (needsPersonalization) steps.push('personalization');
    steps.push('source', 'workspace');
    if (data.workspace_mode === 'ai') steps.push('ai-workspace');
    steps.push('preferences', 'loading');
    return steps;
  })();

  const totalSteps = visibleSteps.length;
  const clampedStep = Math.min(currentStep, totalSteps - 1);
  const activeStepId = visibleSteps[clampedStep];
  const progressPct = Math.round((clampedStep / (totalSteps - 1)) * 100);

  const stepMap: Record<StepId, React.ReactNode> = {
    intent: <StepIntentSelection />,
    personalization: <StepDynamicPersonalization />,
    source: <StepSourceAttribution />,
    workspace: <StepWorkspaceSetup />,
    'ai-workspace': <StepAIWorkspace />,
    preferences: <StepSpacePreferences />,
    loading: <StepSetupLoading />,
  };

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ backgroundColor: '#fafafa' }}
    >
      {/* Dot pattern background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #d4d4d8 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 30%, rgba(250,250,250,1) 0%, rgba(250,250,250,0.85) 50%, rgba(250,250,250,0.1) 100%)',
        }}
      />
      {/* Subtle indigo top glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.07) 0%, transparent 70%)' }}
      />

      {/* Top bar */}
      <header
        className="relative z-10 flex items-center justify-between px-6 py-4"
        style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #f4f4f5' }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            <span className="text-white text-sm font-bold">L</span>
          </div>
          <span className="text-base font-semibold" style={{ color: '#09090b' }}>Likho</span>
        </div>

        <span className="text-sm font-medium" style={{ color: '#a1a1aa' }}>
          {activeStepId !== 'loading'
            ? `Step ${clampedStep + 1} of ${totalSteps - 1}`
            : 'Setting up your workspace…'}
        </span>
      </header>

      {/* Progress bar */}
      {activeStepId !== 'loading' && (
        <div className="relative z-10 h-[2px]" style={{ backgroundColor: '#f4f4f5' }}>
          <motion.div
            className="h-full"
            style={{ background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }}
            initial={false}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          />
        </div>
      )}

      {/* Step content */}
      <main className="relative z-10 flex-1 flex items-start sm:items-center justify-center p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStepId}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="w-full max-w-lg sm:max-w-xl my-4 sm:my-0"
          >
            {stepMap[activeStepId]}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default OnboardingWizard;
