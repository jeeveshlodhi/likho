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

// Step ids in order. Dynamic steps are conditionally inserted.
const BASE_STEPS = [
  'intent',
  'personalization', // conditional — only shown when dev/team intent selected
  'source',
  'workspace',
  'ai-workspace',   // conditional — only shown when workspace_mode === 'ai'
  'preferences',
  'loading',
] as const;

export type StepId = (typeof BASE_STEPS)[number];

const stepVariants = {
  enter: { opacity: 0, x: 40 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

const OnboardingWizard = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { currentStep, completed, data } = useOnboardingWizardStore();

  // Guard: must be authenticated
  useEffect(() => {
    if (!isAuthenticated) navigate('/auth/sign-in', { replace: true });
  }, [isAuthenticated, navigate]);

  // Guard: already completed onboarding
  useEffect(() => {
    if (completed && user?.onboarded_at) navigate('/dashboard', { replace: true });
  }, [completed, user, navigate]);

  // Build the visible step list dynamically based on collected data
  const visibleSteps: StepId[] = (() => {
    const steps: StepId[] = ['intent'];

    // Show personalization only when relevant intents are selected
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
  const progressPct = Math.round(((clampedStep) / (totalSteps - 1)) * 100);

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
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-border/30">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <span className="text-white text-sm font-bold">L</span>
          </div>
          <span className="text-base font-semibold text-foreground">Likho</span>
        </div>

        {/* Progress label */}
        <span className="text-sm text-muted-foreground">
          {activeStepId !== 'loading' ? `Step ${clampedStep + 1} of ${totalSteps - 1}` : 'Setting up…'}
        </span>
      </header>

      {/* Progress bar */}
      {activeStepId !== 'loading' && (
        <div className="relative z-10 h-0.5 bg-border/30">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
            initial={false}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          />
        </div>
      )}

      {/* Step content */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStepId}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="w-full max-w-xl"
          >
            {stepMap[activeStepId]}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default OnboardingWizard;
