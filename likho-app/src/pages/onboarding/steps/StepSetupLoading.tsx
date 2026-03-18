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
            <div
              className="absolute inset-0 rounded-full blur-lg opacity-30"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            />
            <div
              className="absolute inset-2 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            </div>
          </motion.div>

          <h2 className="text-xl font-bold mb-2" style={{ color: '#09090b', letterSpacing: '-0.02em' }}>
            Setting up your workspace
          </h2>
          <motion.p
            key={copyIdx}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm"
            style={{ color: '#71717a' }}
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
            className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
            style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}
          >
            <CheckCircle2 className="w-9 h-9" style={{ color: '#22c55e' }} />
          </motion.div>
          <h2 className="text-xl font-bold mb-2" style={{ color: '#09090b', letterSpacing: '-0.02em' }}>
            You're all set!
          </h2>
          <p className="text-sm" style={{ color: '#71717a' }}>Taking you to your workspace…</p>
        </>
      )}

      {phase === 'error' && (
        <>
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
            style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}
          >
            <AlertCircle className="w-9 h-9" style={{ color: '#ef4444' }} />
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: '#09090b', letterSpacing: '-0.02em' }}>
            Something went wrong
          </h2>
          <p className="text-sm mb-6" style={{ color: '#71717a' }}>{errorMsg}</p>
          <div className="flex gap-3">
            <button
              onClick={retry}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{ backgroundColor: '#09090b', color: '#fafafa' }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              Try again
            </button>
            <button
              onClick={() => navigate('/dashboard', { replace: true })}
              className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                border: '1px solid #e4e4e7',
                color: '#71717a',
                backgroundColor: '#ffffff',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#fafafa';
                e.currentTarget.style.color = '#3f3f46';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.color = '#71717a';
              }}
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
