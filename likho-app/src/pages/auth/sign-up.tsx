import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { useSignUp, useSignIn } from '@/hooks/useAuth';
import { FormInput } from '@/components/forms/FormInput';
import { Alert } from '@/components/forms/Alert';
import { SignUpRequest } from '@/types/auth';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useOnboardingWizardStore } from '@/store/onboardingWizardStore';

interface FormInputs extends SignUpRequest {
    confirm_password: string;
}

const SignUp = () => {
    const navigate = useNavigate();
    const [serverError, setServerError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const { mutate: signUp, isPending: isSigningUp } = useSignUp();
    const { mutate: signIn, isPending: isSigningIn } = useSignIn();
    const updateOnboardingData = useOnboardingWizardStore((s) => s.updateData);
    const isPending = isSigningUp || isSigningIn;

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<FormInputs>({ mode: 'onBlur' });

    const password = watch('password');

    const onSubmit = (data: FormInputs) => {
        setServerError(null);
        setSuccessMessage(null);

        if (data.password !== data.confirm_password) {
            setServerError('Passwords do not match');
            return;
        }

        const { confirm_password, ...submitData } = data;

        signUp(submitData, {
            onSuccess: () => {
                setSuccessMessage('Account created! Setting up your workspace…');
                if (submitData.full_name) {
                    updateOnboardingData({ full_name: submitData.full_name });
                }
                signIn(
                    { email: submitData.email, password: submitData.password },
                    {
                        onSuccess: () => navigate('/onboarding', { replace: true }),
                        onError: () => {
                            setTimeout(() => navigate('/auth/sign-in'), 1000);
                        },
                    }
                );
            },
            onError: (error) => {
                const errorMessage =
                    error.response?.data?.detail ||
                    error.response?.data?.error ||
                    error.message ||
                    'Failed to create account. Please try again.';
                setServerError(errorMessage);
            },
        });
    };

    const benefits = [
        { text: '50+ ready-to-use templates', color: '#6366f1' },
        { text: 'Unlimited notes & boards', color: '#8b5cf6' },
        { text: 'Visual canvas workspace', color: '#ec4899' },
        { text: 'Local AI — works fully offline', color: '#06b6d4' },
        { text: 'Free forever plan', color: '#22c55e' },
    ];

    return (
        <div className="min-h-screen flex" style={{ backgroundColor: '#ffffff' }}>
            {/* ── Left panel: branding ── */}
            <div
                className="hidden md:flex md:w-[42%] lg:w-[46%] flex-col justify-between p-8 lg:p-12 relative overflow-hidden"
                style={{ backgroundColor: '#f4f4f5', borderRight: '1px solid #e4e4e7' }}
            >
                {/* Subtle glow */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: 'radial-gradient(ellipse 80% 50% at 80% 20%, rgba(139,92,246,0.08) 0%, transparent 70%)',
                    }}
                />

                {/* Logo */}
                <Link to="/" className="flex items-center gap-2.5 relative z-10">
                    <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                    >
                        <span className="text-white text-base font-bold">L</span>
                    </div>
                    <span className="text-lg font-semibold" style={{ color: '#09090b' }}>Likho</span>
                </Link>

                {/* Main copy */}
                <div className="relative z-10">
                    <p
                        className="text-xs font-semibold tracking-widest uppercase mb-6"
                        style={{ color: '#a1a1aa' }}
                    >
                        Free to get started
                    </p>
                    <h2
                        className="font-black tracking-[-0.04em] leading-[0.9] mb-6"
                        style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)', color: '#09090b' }}
                    >
                        Build your best
                        <br />
                        <span
                            style={{
                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                            }}
                        >
                            ideas here.
                        </span>
                    </h2>
                    <p className="text-base leading-relaxed mb-10" style={{ color: '#71717a', maxWidth: '36ch' }}>
                        Everything you need to think, plan, and create — set up in seconds.
                    </p>

                    {/* Benefits */}
                    <div className="space-y-3.5 mb-10">
                        {benefits.map(({ text, color }, i) => (
                            <motion.div
                                key={text}
                                initial={{ opacity: 0, x: -16 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.08 * i, duration: 0.4 }}
                                className="flex items-center gap-3"
                            >
                                <div
                                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                                    style={{ backgroundColor: `${color}18` }}
                                >
                                    <CheckCircle2 className="w-3.5 h-3.5" style={{ color }} />
                                </div>
                                <span className="text-sm font-medium" style={{ color: '#3f3f46' }}>{text}</span>
                            </motion.div>
                        ))}
                    </div>

                    {/* Social proof */}
                    <div
                        className="flex items-center gap-3 p-4 rounded-2xl"
                        style={{ backgroundColor: '#ffffff', border: '1px solid #e4e4e7' }}
                    >
                        <div className="flex -space-x-2 flex-shrink-0">
                            {['#6366f1', '#8b5cf6', '#ec4899', '#06b6d4'].map((bg, i) => (
                                <div
                                    key={i}
                                    className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-white text-xs font-bold"
                                    style={{ backgroundColor: bg, borderColor: '#ffffff' }}
                                >
                                    {String.fromCharCode(65 + i)}
                                </div>
                            ))}
                        </div>
                        <div>
                            <p className="text-sm font-semibold" style={{ color: '#09090b' }}>2,000+ thinkers</p>
                            <p className="text-xs" style={{ color: '#a1a1aa' }}>already building with Likho</p>
                        </div>
                    </div>
                </div>

                <p className="text-xs relative z-10" style={{ color: '#a1a1aa' }}>
                    © {new Date().getFullYear()} Likho · Built for deep work
                </p>
            </div>

            {/* ── Right panel: form ── */}
            <div
                className="flex-1 flex items-start justify-center p-6 sm:p-10 overflow-y-auto"
                style={{ backgroundColor: '#ffffff' }}
            >
                <div className="w-full max-w-[400px] py-4">
                    {/* Back link */}
                    <Link
                        to="/"
                        className="inline-flex items-center gap-1.5 text-sm mb-10 transition-colors"
                        style={{ color: '#a1a1aa' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#09090b')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#a1a1aa')}
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Back to home
                    </Link>

                    {/* Mobile logo */}
                    <Link to="/" className="flex items-center gap-2 mb-8 md:hidden">
                        <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                        >
                            <span className="text-white text-sm font-bold">L</span>
                        </div>
                        <span className="font-semibold" style={{ color: '#09090b' }}>Likho</span>
                    </Link>

                    {/* Heading */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="mb-7"
                    >
                        <h1
                            className="font-black tracking-[-0.03em] mb-2"
                            style={{ fontSize: '1.75rem', color: '#09090b' }}
                        >
                            Create your account
                        </h1>
                        <p className="text-sm" style={{ color: '#71717a' }}>
                            Free forever · No credit card needed
                        </p>
                    </motion.div>

                    {/* Google OAuth */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.05 }}
                        className="mb-6"
                    >
                        <button
                            type="button"
                            onClick={() => console.log('Google OAuth not yet implemented')}
                            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all"
                            style={{
                                backgroundColor: '#ffffff',
                                border: '1px solid #e4e4e7',
                                color: '#3f3f46',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#fafafa';
                                e.currentTarget.style.borderColor = '#d4d4d8';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#ffffff';
                                e.currentTarget.style.borderColor = '#e4e4e7';
                            }}
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Continue with Google
                        </button>
                    </motion.div>

                    {/* Divider */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="flex-1 h-px" style={{ backgroundColor: '#f4f4f5' }} />
                        <span className="text-xs font-medium" style={{ color: '#a1a1aa' }}>or sign up with email</span>
                        <div className="flex-1 h-px" style={{ backgroundColor: '#f4f4f5' }} />
                    </div>

                    {/* Form */}
                    <motion.form
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        onSubmit={handleSubmit(onSubmit)}
                        className="space-y-4"
                    >
                        {successMessage && <Alert type="success" message={successMessage} />}
                        {serverError && (
                            <Alert type="error" message={serverError} onClose={() => setServerError(null)} />
                        )}

                        <FormInput
                            label="Full Name"
                            type="text"
                            placeholder="John Doe"
                            {...register('full_name', {
                                minLength: { value: 2, message: 'Full name must be at least 2 characters' },
                            })}
                            error={errors.full_name?.message}
                        />

                        <FormInput
                            label="Username (Optional)"
                            type="text"
                            placeholder="johndoe"
                            {...register('username', {
                                minLength: { value: 3, message: 'Username must be at least 3 characters' },
                                pattern: {
                                    value: /^[a-zA-Z0-9_-]*$/,
                                    message: 'Letters, numbers, hyphens, and underscores only',
                                },
                            })}
                            error={errors.username?.message}
                        />

                        <FormInput
                            label="Email Address"
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

                        <FormInput
                            label="Password"
                            type="password"
                            placeholder="••••••••"
                            {...register('password', {
                                required: 'Password is required',
                                minLength: { value: 8, message: 'Password must be at least 8 characters' },
                                validate: {
                                    hasUpperCase: (v) => /[A-Z]/.test(v) || 'Must contain an uppercase letter',
                                    hasLowerCase: (v) => /[a-z]/.test(v) || 'Must contain a lowercase letter',
                                    hasNumber: (v) => /[0-9]/.test(v) || 'Must contain a number',
                                },
                            })}
                            error={errors.password?.message}
                            helpText="Min. 8 chars with uppercase, lowercase, and number"
                        />

                        <FormInput
                            label="Confirm Password"
                            type="password"
                            placeholder="••••••••"
                            {...register('confirm_password', {
                                required: 'Please confirm your password',
                                validate: (v) => v === password || 'Passwords do not match',
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
                                    Creating account…
                                </>
                            ) : 'Create account'}
                        </button>
                    </motion.form>

                    {/* Sign in link */}
                    <p className="mt-8 text-sm text-center" style={{ color: '#71717a' }}>
                        Already have an account?{' '}
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

                    <p className="mt-6 text-xs text-center" style={{ color: '#d4d4d8' }}>
                        By creating an account you agree to our{' '}
                        <a href="#" style={{ color: '#a1a1aa' }} className="hover:underline">Terms</a>
                        {' '}and{' '}
                        <a href="#" style={{ color: '#a1a1aa' }} className="hover:underline">Privacy Policy</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SignUp;
