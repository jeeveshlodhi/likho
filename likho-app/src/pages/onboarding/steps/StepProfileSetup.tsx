import { useEffect, useState, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { User2, ChevronRight, Check, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useOnboardingWizardStore } from '@/store/onboardingWizardStore';
import { api } from '@/lib/api';
import StepShell from './StepShell';

interface ProfileForm {
  full_name: string;
  username: string;
}

interface UsernameStatus {
  checking: boolean;
  available: boolean | null;
  message: string;
}

const inputStyle = {
  width: '100%',
  padding: '0.625rem 0.875rem',
  borderRadius: '0.75rem',
  border: '1px solid #e4e4e7',
  backgroundColor: '#ffffff',
  color: '#09090b',
  fontSize: '0.875rem',
  outline: 'none',
  transition: 'border-color 0.15s, box-shadow 0.15s',
};

const StepProfileSetup = () => {
  const { user } = useAuthStore();
  const { data, updateData, nextStep } = useOnboardingWizardStore();
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>({
    checking: false,
    available: null,
    message: '',
  });
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProfileForm>({ mode: 'onBlur' });

  const username = watch('username');

  useEffect(() => {
    setValue('full_name', data.full_name || user?.full_name || '');
    setValue('username', data.username || user?.username || '');
  }, [data.full_name, data.username, user, setValue]);

  // Check username availability with debounce
  const checkUsername = useCallback(async (value: string) => {
    if (!value || value.length < 3) {
      setUsernameStatus({ checking: false, available: null, message: '' });
      return;
    }

    setUsernameStatus(prev => ({ ...prev, checking: true }));

    try {
      const res = await api.get(`/users/check-username?username=${encodeURIComponent(value)}`);
      setUsernameStatus({
        checking: false,
        available: res.data.available,
        message: res.data.message,
      });
    } catch {
      setUsernameStatus({
        checking: false,
        available: false,
        message: 'Unable to check username',
      });
    }
  }, []);

  // Debounce username check
  useEffect(() => {
    // Skip if user already owns this username
    if (username === user?.username) {
      setUsernameStatus({ checking: false, available: null, message: '' });
      return;
    }

    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Validate format first
    if (username && username.length >= 3) {
      const validFormat = /^[a-zA-Z0-9_-]*$/.test(username);
      if (!validFormat) {
        setUsernameStatus({ checking: false, available: false, message: '' });
        return;
      }
    }

    // Debounce API call
    debounceTimer.current = setTimeout(() => {
      checkUsername(username);
    }, 400);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [username, checkUsername, user?.username]);

  const onNext = (values: ProfileForm) => {
    updateData({ full_name: values.full_name, username: values.username });
    nextStep();
  };

  const onSkip = () => {
    updateData({ full_name: user?.full_name || '', username: user?.username || '' });
    nextStep();
  };

  return (
    <StepShell
      icon={<User2 className="w-5 h-5" style={{ color: '#6366f1' }} />}
      title="Let's set up your profile"
      subtitle="You can update this anytime from settings"
      onSkip={onSkip}
    >
      <form onSubmit={handleSubmit(onNext)} className="space-y-4">
        {/* Full name */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#3f3f46' }}>
            Full name
          </label>
          <input
            type="text"
            placeholder="Jane Doe"
            className="likho-input"
            style={inputStyle}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#6366f1';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)';
            }}
            {...register('full_name', {
              minLength: { value: 2, message: 'At least 2 characters' },
            })}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = errors.full_name ? '#ef4444' : '#e4e4e7';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
          {errors.full_name && (
            <p className="mt-1 text-xs font-medium" style={{ color: '#ef4444' }}>{errors.full_name.message}</p>
          )}
        </div>

        {/* Username */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#3f3f46' }}>
            Username{' '}
            <span className="font-normal" style={{ color: '#a1a1aa' }}>(optional)</span>
          </label>
          <div className="relative">
            <span
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm select-none"
              style={{ color: '#a1a1aa' }}
            >
              @
            </span>
            <input
              type="text"
              placeholder="janedoe"
              className="likho-input"
              style={{ ...inputStyle, paddingLeft: '2rem' }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#6366f1';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)';
              }}
              {...register('username', {
                minLength: { value: 3, message: 'At least 3 characters' },
                pattern: {
                  value: /^[a-zA-Z0-9_-]*$/,
                  message: 'Letters, numbers, hyphens and underscores only',
                },
                validate: () => {
                  if (usernameStatus.available === false) {
                    return usernameStatus.message || 'Username is already taken';
                  }
                  return true;
                },
              })}
              onBlur={(e) => {
                const hasError = errors.username || usernameStatus.available === false;
                e.currentTarget.style.borderColor = hasError ? '#ef4444' : '#e4e4e7';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            {/* Status indicator */}
            {usernameStatus.checking && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#a1a1aa' }} />
              </span>
            )}
            {!usernameStatus.checking && usernameStatus.available === true && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                <Check className="w-4 h-4" style={{ color: '#22c55e' }} />
              </span>
            )}
          </div>
          {/* Error message - show either validation error or availability error */}
          {(errors.username || usernameStatus.available === false) && (
            <p className="mt-1 text-xs font-medium" style={{ color: '#ef4444' }}>
              {errors.username?.message || usernameStatus.message}
            </p>
          )}
          {/* Available message */}
          {!errors.username && usernameStatus.available === true && (
            <p className="mt-1 text-xs font-medium" style={{ color: '#22c55e' }}>
              {usernameStatus.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          className="w-full py-2.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 mt-2"
          style={{ backgroundColor: '#09090b', color: '#fafafa' }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          Continue
          <ChevronRight className="w-4 h-4" />
        </button>
      </form>
    </StepShell>
  );
};

export default StepProfileSetup;
