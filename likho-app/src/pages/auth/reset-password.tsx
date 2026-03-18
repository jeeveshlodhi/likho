import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { useConfirmPasswordReset } from '@/hooks/useAuth';
import { FormInput } from '@/components/forms/FormInput';
import { ArrowLeft, Lock, CheckCircle2, AlertCircle } from 'lucide-react';

interface ResetPasswordForm {
  new_password: string;
  confirm_password: string;
}

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isInvalidToken, setIsInvalidToken] = useState(false);
  const { mutate: resetPassword, isPending } = useConfirmPasswordReset();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordForm>({ mode: 'onBlur' });

  const newPassword = watch('new_password');

  useEffect(() => {
    if (!token) {
      setIsInvalidToken(true);
    }
  }, [token]);

  const onSubmit = (data: ResetPasswordForm) => {
    if (!token) {
      setIsInvalidToken(true);
      return;
    }

    setServerError(null);
    resetPassword(
      {
        token,
        new_password: data.new_password,
        confirm_password: data.confirm_password,
      },
      {
        onSuccess: () => {
          setIsSuccess(true);
        },
        onError: (error: unknown) => {
          const errorMessage =
            (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
            (error as Error)?.message ||
            'Failed to reset password. Please try again.';
          setServerError(errorMessage);
        },
      }
    );
  };

  // Password strength indicator
  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: '' };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    const labels = ['Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e'];
    
    return {
      strength: score,
      label: labels[score - 1] || '',
      color: colors[score - 1] || '#e4e4e7',
    };
  };

  const passwordStrength = getPasswordStrength(newPassword || '');

  if (isInvalidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center p-5" style={{ backgroundColor: '#ffffff' }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}
          >
            <AlertCircle className="w-8 h-8" style={{ color: '#ef4444' }} />
          </div>
          <h1
            className="font-black tracking-[-0.03em] mb-3"
            style={{ fontSize: '1.75rem', color: '#09090b' }}
          >
            Invalid or expired link
          </h1>
          <p className="text-sm mb-6" style={{ color: '#71717a' }}>
            This password reset link is invalid or has expired. Please request a new one.
          </p>
          <Link
            to="/auth/forgot-password"
            className="inline-block py-2.5 px-6 rounded-xl text-sm font-semibold transition-all"
            style={{ backgroundColor: '#09090b', color: '#fafafa' }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            Request new link
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#ffffff' }}>
      {/* ── Left panel: branding ── */}
      <div
        className="hidden md:flex md:w-[42%] lg:w-[46%] flex-col justify-between p-8 lg:p-12 relative overflow-hidden"
        style={{ backgroundColor: '#f4f4f5', borderRight: '1px solid #e4e4e7' }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 20% 80%, rgba(99,102,241,0.08) 0%, transparent 70%)',
          }}
        />

        <Link to="/" className="flex items-center gap-2.5 relative z-10">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            <span className="text-white text-base font-bold">L</span>
          </div>
          <span className="text-lg font-semibold" style={{ color: '#09090b' }}>Likho</span>
        </Link>

        <div className="relative z-10">
          <p
            className="text-xs font-semibold tracking-widest uppercase mb-6"
            style={{ color: '#a1a1aa' }}
          >
            Security
          </p>
          <h2
            className="font-black tracking-[-0.04em] leading-[0.9] mb-6"
            style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)', color: '#09090b' }}
          >
            Create a new
            <br />
            <span
              style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              password
            </span>
          </h2>
          <p className="text-base leading-relaxed" style={{ color: '#71717a', maxWidth: '36ch' }}>
            Choose a strong password to keep your account secure.
          </p>
        </div>

        <p className="text-xs relative z-10" style={{ color: '#a1a1aa' }}>
          © {new Date().getFullYear()} Likho · Built for deep work
        </p>
      </div>

      {/* ── Right panel: form ── */}
      <div className="flex-1 flex items-center justify-center p-5 sm:p-8 lg:p-10 relative overflow-y-auto" style={{ backgroundColor: '#ffffff' }}>
        <div className="w-full max-w-[400px]">
          <Link
            to="/auth/sign-in"
            className="inline-flex items-center gap-1.5 text-sm mb-10 transition-colors"
            style={{ color: '#a1a1aa' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#09090b')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#a1a1aa')}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to sign in
          </Link>

          <Link to="/" className="flex items-center gap-2 mb-8 md:hidden">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              <span className="text-white text-sm font-bold">L</span>
            </div>
            <span className="font-semibold" style={{ color: '#09090b' }}>Likho</span>
          </Link>

          {isSuccess ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}
              >
                <CheckCircle2 className="w-8 h-8" style={{ color: '#22c55e' }} />
              </div>
              <h1
                className="font-black tracking-[-0.03em] mb-3"
                style={{ fontSize: '1.75rem', color: '#09090b' }}
              >
                Password reset!
              </h1>
              <p className="text-sm mb-6" style={{ color: '#71717a' }}>
                Your password has been successfully reset. You can now sign in with your new password.
              </p>
              <button
                onClick={() => navigate('/auth/sign-in')}
                className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold transition-all"
                style={{ backgroundColor: '#09090b', color: '#fafafa' }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                Sign in
              </button>
            </motion.div>
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-8"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: '#eef2ff' }}
                >
                  <Lock className="w-6 h-6" style={{ color: '#6366f1' }} />
                </div>
                <h1
                  className="font-black tracking-[-0.03em] mb-2"
                  style={{ fontSize: '1.75rem', color: '#09090b' }}
                >
                  Set new password
                </h1>
                <p className="text-sm" style={{ color: '#71717a' }}>
                  Enter your new password below.
                </p>
              </motion.div>

              <motion.form
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-4"
              >
                {serverError && (
                  <div
                    className="px-4 py-3 rounded-xl text-sm"
                    style={{ backgroundColor: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca' }}
                  >
                    {serverError}
                  </div>
                )}

                <div>
                  <FormInput
                    label="New password"
                    type="password"
                    placeholder="••••••••"
                    {...register('new_password', {
                      required: 'Password is required',
                      minLength: { value: 8, message: 'Password must be at least 8 characters' },
                    })}
                    error={errors.new_password?.message}
                  />
                  
                  {/* Password strength indicator */}
                  {newPassword && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[1, 2, 3, 4].map((level) => (
                          <div
                            key={level}
                            className="h-1 flex-1 rounded-full transition-colors"
                            style={{
                              backgroundColor: passwordStrength.strength >= level 
                                ? passwordStrength.color 
                                : '#e4e4e7',
                            }}
                          />
                        ))}
                      </div>
                      <p className="text-xs" style={{ color: passwordStrength.color }}>
                        {passwordStrength.label}
                      </p>
                    </div>
                  )}
                </div>

                <FormInput
                  label="Confirm password"
                  type="password"
                  placeholder="••••••••"
                  {...register('confirm_password', {
                    required: 'Please confirm your password',
                    validate: (value) =>
                      value === newPassword || 'Passwords do not match',
                  })}
                  error={errors.confirm_password?.message}
                />

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all mt-2"
                  style={{
                    backgroundColor: isPending ? '#3f3f46' : '#09090b',
                    color: '#fafafa',
                    opacity: isPending ? 0.7 : 1,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                  }}
                >
                  {isPending ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Resetting...
                    </>
                  ) : 'Reset password'}
                </button>
              </motion.form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
