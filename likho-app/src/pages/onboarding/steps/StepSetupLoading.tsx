import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useOnboardingWizardStore } from '@/store/onboardingWizardStore';

type Phase = 'loading' | 'done' | 'error';

const STEPS_COPY = [
  'Personalising your workspace…',
  'Applying your preferences…',
  'Creating your first space…',
  'Almost there…',
];

const StepSetupLoading = () => {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const { data, markCompleted } = useOnboardingWizardStore();

  const [phase, setPhase] = useState<Phase>('loading');
  const [copyIdx, setCopyIdx] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const hasRun = useRef(false);

  const submit = async () => {
    const res = await api.post('/onboarding/complete', {
      full_name: data.full_name || undefined,
      username: data.username || undefined,
      intent: data.intent,
      dev_tasks: data.dev_tasks,
      team_size: data.team_size || undefined,
      source: data.source || undefined,
      workspace_mode: data.workspace_mode,
      workspace_prompt: data.workspace_prompt || undefined,
      default_space: data.default_space,
      sync_mode: data.sync_mode,
    });
    // Patch onboarded_at in auth store so the wizard guard won't bounce back
    const currentUser = useAuthStore.getState().user;
    if (currentUser && res.data?.onboarded_at) {
      setUser({ ...currentUser, onboarded_at: res.data.onboarded_at });
    }
  };

  const run = async () => {
    const interval = setInterval(() => {
      setCopyIdx((i) => Math.min(i + 1, STEPS_COPY.length - 1));
    }, 800);

    try {
      await submit();
      clearInterval(interval);
      setPhase('done');
      markCompleted();
      setTimeout(() => navigate('/dashboard', { replace: true }), 1200);
    } catch (err: unknown) {
      clearInterval(interval);
      const detail =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined;
      setErrorMsg(detail ?? 'Something went wrong. Please try again.');
      setPhase('error');
    }
  };

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const retry = () => {
    setPhase('loading');
    setCopyIdx(0);
    setErrorMsg('');
    hasRun.current = false;
    run();
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      {phase === 'loading' && (
        <>
          <motion.div
            className="relative w-20 h-20 mb-8"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 opacity-20 blur-lg" />
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            </div>
          </motion.div>

          <h2 className="text-xl font-semibold text-foreground mb-2">
            Setting up your workspace
          </h2>
          <motion.p
            key={copyIdx}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-muted-foreground"
          >
            {STEPS_COPY[copyIdx]}
          </motion.p>
        </>
      )}

      {phase === 'done' && (
        <>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="w-20 h-20 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mb-6"
          >
            <CheckCircle2 className="w-9 h-9 text-green-400" />
          </motion.div>
          <h2 className="text-xl font-semibold text-foreground mb-2">You're all set!</h2>
          <p className="text-sm text-muted-foreground">Taking you to your workspace…</p>
        </>
      )}

      {phase === 'error' && (
        <>
          <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
            <AlertCircle className="w-9 h-9 text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Something went wrong</h2>
          <p className="text-sm text-muted-foreground mb-6">{errorMsg}</p>
          <div className="flex gap-3">
            <button
              onClick={retry}
              className="px-5 py-2.5 rounded-xl bg-foreground text-background text-sm font-medium hover:opacity-90 transition"
            >
              Try again
            </button>
            <button
              onClick={() => navigate('/dashboard', { replace: true })}
              className="px-5 py-2.5 rounded-xl border border-border/50 text-sm text-muted-foreground hover:text-foreground transition"
            >
              Skip to dashboard
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default StepSetupLoading;
