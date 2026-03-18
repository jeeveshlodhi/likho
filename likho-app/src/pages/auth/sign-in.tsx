import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { useSignIn } from '@/hooks/useAuth';
import { FormInput } from '@/components/forms/FormInput';
import { Button } from '@/components/forms/Button';
import { Alert } from '@/components/forms/Alert';
import { SignInRequest } from '@/types/auth';
import { ArrowLeft, FileText, LayoutGrid, Palette, CheckCircle2 } from 'lucide-react';

const SignIn = () => {
    const navigate = useNavigate();
    const [serverError, setServerError] = useState<string | null>(null);
    const { mutate: signIn, isPending } = useSignIn();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<SignInRequest>({ mode: 'onBlur' });

    const onSubmit = (data: SignInRequest) => {
        setServerError(null);
        signIn(data, {
            onSuccess: (res) => {
                if (!res.user.onboarded_at) {
                    navigate('/onboarding', { replace: true });
                } else {
                    navigate('/dashboard', { replace: true });
                }
            },
            onError: (error) => {
                const errorMessage =
                    error.response?.data?.detail ||
                    error.response?.data?.error ||
                    error.message ||
                    'Failed to sign in. Please try again.';
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
                {/* Subtle radial glow */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: 'radial-gradient(ellipse 80% 60% at 20% 80%, rgba(99,102,241,0.08) 0%, transparent 70%)',
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
                        Note-taking, reimagined
                    </p>
                    <h2
                        className="font-black tracking-[-0.04em] leading-[0.9] mb-6"
                        style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)', color: '#09090b' }}
                    >
                        Every great idea
                        <br />
                        <span
                            style={{
                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                            }}
                        >
                            starts as a note.
                        </span>
                    </h2>
                    <p className="text-base leading-relaxed mb-10" style={{ color: '#71717a', maxWidth: '36ch' }}>
                        Capture, organise, and build with AI-powered templates — all in one workspace.
                    </p>

                    {/* Mini feature cards */}
                    <div className="grid grid-cols-3 gap-3 mb-10">
                        {[
                            { Icon: FileText, label: 'Notes', color: '#6366f1', bg: '#eef2ff' },
                            { Icon: LayoutGrid, label: 'Kanban', color: '#8b5cf6', bg: '#f5f3ff' },
                            { Icon: Palette, label: 'Canvas', color: '#ec4899', bg: '#fdf2f8' },
                        ].map(({ Icon, label, color, bg }) => (
                            <div
                                key={label}
                                className="rounded-xl p-4"
                                style={{ backgroundColor: '#ffffff', border: '1px solid #e4e4e7' }}
                            >
                                <div
                                    className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
                                    style={{ backgroundColor: bg }}
                                >
                                    <Icon className="w-4 h-4" style={{ color }} />
                                </div>
                                <p className="text-xs font-semibold" style={{ color: '#3f3f46' }}>{label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Social proof */}
                    <div className="flex items-center gap-3">
                        <div className="flex -space-x-2">
                            {['#6366f1', '#8b5cf6', '#ec4899', '#06b6d4'].map((bg, i) => (
                                <div
                                    key={i}
                                    className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-white text-xs font-bold"
                                    style={{ backgroundColor: bg, borderColor: '#f4f4f5' }}
                                >
                                    {String.fromCharCode(65 + i)}
                                </div>
                            ))}
                        </div>
                        <p className="text-sm" style={{ color: '#71717a' }}>
                            <span className="font-semibold" style={{ color: '#09090b' }}>2,000+</span> thinkers already inside
                        </p>
                    </div>
                </div>

                {/* Bottom tagline */}
                <p className="text-xs relative z-10" style={{ color: '#a1a1aa' }}>
                    © {new Date().getFullYear()} Likho · Built for deep work
                </p>
            </div>

            {/* ── Right panel: form ── */}
            <div className="flex-1 flex items-center justify-center p-5 sm:p-8 lg:p-10 relative overflow-y-auto" style={{ backgroundColor: '#ffffff' }}>
                <div className="w-full max-w-[400px]">
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
                        className="mb-8"
                    >
                        <h1
                            className="font-black tracking-[-0.03em] mb-2"
                            style={{ fontSize: '1.75rem', color: '#09090b' }}
                        >
                            Welcome back
                        </h1>
                        <p className="text-sm" style={{ color: '#71717a' }}>
                            Sign in to continue to your workspace
                        </p>
                    </motion.div>

                    {/* OAuth first (Google) */}
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
                        <span className="text-xs font-medium" style={{ color: '#a1a1aa' }}>or sign in with email</span>
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
                        {serverError && (
                            <Alert type="error" message={serverError} onClose={() => setServerError(null)} />
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

                        <div>
                            <FormInput
                                label="Password"
                                type="password"
                                placeholder="••••••••"
                                {...register('password', {
                                    required: 'Password is required',
                                    minLength: { value: 8, message: 'Password must be at least 8 characters' },
                                })}
                                error={errors.password?.message}
                            />
                            <div className="mt-1.5 flex justify-end">
                                <Link
                                    to="/forgot-password"
                                    className="text-xs font-medium transition-colors"
                                    style={{ color: '#6366f1' }}
                                    onMouseEnter={(e) => (e.currentTarget.style.color = '#4f46e5')}
                                    onMouseLeave={(e) => (e.currentTarget.style.color = '#6366f1')}
                                >
                                    Forgot password?
                                </Link>
                            </div>
                        </div>

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
                                    Signing in…
                                </>
                            ) : 'Sign in'}
                        </button>
                    </motion.form>

                    {/* Sign up link */}
                    <p className="mt-8 text-sm text-center" style={{ color: '#71717a' }}>
                        Don't have an account?{' '}
                        <Link
                            to="/auth/sign-up"
                            className="font-semibold transition-colors"
                            style={{ color: '#6366f1' }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#4f46e5')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = '#6366f1')}
                        >
                            Create one free
                        </Link>
                    </p>

                    <p className="mt-6 text-xs text-center" style={{ color: '#d4d4d8' }}>
                        By signing in you agree to our{' '}
                        <a href="#" style={{ color: '#a1a1aa' }} className="hover:underline">Terms</a>
                        {' '}and{' '}
                        <a href="#" style={{ color: '#a1a1aa' }} className="hover:underline">Privacy Policy</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SignIn;
