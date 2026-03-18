import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { useRequestPasswordReset } from '@/hooks/useAuth';
import { FormInput } from '@/components/forms/FormInput';
import { ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';

interface ForgotPasswordForm {
  email: string;
}

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const { mutate: requestReset, isPending } = useRequestPasswordReset();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({ mode: 'onBlur' });

  const onSubmit = (data: ForgotPasswordForm) => {
    setServerError(null);
    requestReset(data.email, {
      onSuccess: () => {
        setIsSuccess(true);
      },
      onError: (error: unknown) => {
        const errorMessage =
          (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
          (error as Error)?.message ||
          'Failed to send reset email. Please try again.';
        setServerError(errorMessage);
      },
    });
  };

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
            Password Recovery
          </p>
          <h2
            className="font-black tracking-[-0.04em] leading-[0.9] mb-6"
            style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)', color: '#09090b' }}
          >
            Forgot your
            <br />
            <span
              style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              password?
            </span>
          </h2>
          <p className="text-base leading-relaxed" style={{ color: '#71717a', maxWidth: '36ch' }}>
            Don't worry, we'll help you get back into your account securely.
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
                Check your email
              </h1>
              <p className="text-sm mb-6" style={{ color: '#71717a' }}>
                If an account exists with this email, you'll receive password reset instructions shortly.
              </p>
              <button
                onClick={() => navigate('/auth/sign-in')}
                className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold transition-all"
                style={{ backgroundColor: '#09090b', color: '#fafafa' }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                Return to sign in
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
                  <Mail className="w-6 h-6" style={{ color: '#6366f1' }} />
                </div>
                <h1
                  className="font-black tracking-[-0.03em] mb-2"
                  style={{ fontSize: '1.75rem', color: '#09090b' }}
                >
                  Reset your password
                </h1>
                <p className="text-sm" style={{ color: '#71717a' }}>
                  Enter your email address and we'll send you a link to reset your password.
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

                <FormInput
                  label="Email address"
                  type="email"
                  placeholder="you@example.com"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  })}
                  error={errors.email?.message}
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
                      Sending...
                    </>
                  ) : 'Send reset link'}
                </button>
              </motion.form>

              <p className="mt-8 text-sm text-center" style={{ color: '#71717a' }}>
                Remember your password?{' '}
                <Link
                  to="/auth/sign-in"
                  className="font-semibold transition-colors"
                  style={{ color: '#6366f1' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#4f46e5')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#6366f1')}
                >
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
