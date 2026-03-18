import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { User2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useOnboardingWizardStore } from '@/store/onboardingWizardStore';
import StepShell from './StepShell';

interface ProfileForm {
  full_name: string;
  username: string;
}

const StepProfileSetup = () => {
  const { user } = useAuthStore();
  const { data, updateData, nextStep } = useOnboardingWizardStore();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProfileForm>({ mode: 'onBlur' });

  // Pre-fill from auth user or previously saved wizard data
  useEffect(() => {
    setValue('full_name', data.full_name || user?.full_name || '');
    setValue('username', data.username || user?.username || '');
  }, [data.full_name, data.username, user, setValue]);

  const onNext = (values: ProfileForm) => {
    updateData({ full_name: values.full_name, username: values.username });
    nextStep();
  };

  const onSkip = () => {
    updateData({
      full_name: user?.full_name || '',
      username: user?.username || '',
    });
    nextStep();
  };

  return (
    <StepShell
      icon={<User2 className="w-6 h-6 text-indigo-400" />}
      title="Let's set up your profile"
      subtitle="You can update this anytime from settings"
      onSkip={onSkip}
    >
      <form onSubmit={handleSubmit(onNext)} className="space-y-5">
        {/* Full name */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Full name
          </label>
          <input
            type="text"
            placeholder="Jane Doe"
            className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition"
            {...register('full_name', {
              minLength: { value: 2, message: 'At least 2 characters' },
            })}
          />
          {errors.full_name && (
            <p className="mt-1 text-xs text-red-400">{errors.full_name.message}</p>
          )}
        </div>

        {/* Username */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Username <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
            <input
              type="text"
              placeholder="janedoe"
              className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-surface border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition"
              {...register('username', {
                minLength: { value: 3, message: 'At least 3 characters' },
                pattern: {
                  value: /^[a-zA-Z0-9_-]*$/,
                  message: 'Letters, numbers, hyphens and underscores only',
                },
              })}
            />
          </div>
          {errors.username && (
            <p className="mt-1 text-xs text-red-400">{errors.username.message}</p>
          )}
        </div>

        <button
          type="submit"
          className="w-full py-2.5 rounded-xl bg-foreground text-background font-medium hover:opacity-90 transition mt-2"
        >
          Continue
        </button>
      </form>
    </StepShell>
  );
};

export default StepProfileSetup;
