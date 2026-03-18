import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { useSignUp, useSignIn } from '@/hooks/useAuth';
import { FormInput } from '@/components/forms/FormInput';
import { Button } from '@/components/forms/Button';
import { Alert } from '@/components/forms/Alert';
import { SignUpRequest } from '@/types/auth';
import { Sparkles, ArrowLeft, FileText, LayoutGrid, Palette, CheckCircle2 } from 'lucide-react';
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
    } = useForm<FormInputs>({
        mode: 'onBlur',
    });

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
                // Pre-fill name in onboarding wizard
                if (submitData.full_name) {
                    updateOnboardingData({ full_name: submitData.full_name });
                }
                // Auto sign-in to get tokens, then redirect to onboarding
                signIn(
                    { email: submitData.email, password: submitData.password },
                    {
                        onSuccess: () => navigate('/onboarding', { replace: true }),
                        onError: () => {
                            // Sign-in failed — fall back to manual sign-in
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
        '50+ ready-to-use templates',
        'Unlimited notes & boards',
        'Visual canvas workspace',
        'Free forever plan',
    ];

    return (
        <div className="min-h-screen bg-background flex relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
            </div>

            {/* Left Side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12">
                <div className="relative max-w-md">
                    <Link to="/" className="flex items-center gap-2 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <span className="text-white text-lg font-bold">L</span>
                        </div>
                        <span className="text-2xl font-semibold text-foreground">Likho</span>
                    </Link>

                    <h2 className="text-4xl font-bold text-foreground mb-4">
                        Start building{' '}
                        <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                            ideas today
                        </span>
                    </h2>
                    <p className="text-lg text-muted-foreground mb-8">
                        Join thousands of thinkers who use Likho to bring their ideas to life.
                    </p>

                    {/* Benefits */}
                    <div className="space-y-4">
                        {benefits.map((benefit, i) => (
                            <motion.div
                                key={benefit}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 * i, duration: 0.5 }}
                                className="flex items-center gap-3"
                            >
                                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                                <span className="text-muted-foreground">{benefit}</span>
                            </motion.div>
                        ))}
                    </div>

                    {/* Feature Preview */}
                    <div className="grid grid-cols-3 gap-4 mt-8">
                        <div className="bg-surface/50 border border-border/50 rounded-xl p-4 backdrop-blur-sm">
                            <FileText className="w-6 h-6 text-blue-400 mb-2" />
                            <p className="text-xs text-muted-foreground">Notes</p>
                        </div>
                        <div className="bg-surface/50 border border-border/50 rounded-xl p-4 backdrop-blur-sm">
                            <LayoutGrid className="w-6 h-6 text-purple-400 mb-2" />
                            <p className="text-xs text-muted-foreground">Kanban</p>
                        </div>
                        <div className="bg-surface/50 border border-border/50 rounded-xl p-4 backdrop-blur-sm">
                            <Palette className="w-6 h-6 text-pink-400 mb-2" />
                            <p className="text-xs text-muted-foreground">Canvas</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-y-auto">
                <div className="w-full max-w-md py-8">
                    {/* Back Link */}
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to home
                    </Link>

                    {/* Header */}
                    <div className="mb-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium mb-4">
                            <Sparkles className="w-4 h-4" />
                            <span>Free to get started</span>
                        </div>
                        <h1 className="text-3xl font-bold text-foreground mb-2">
                            Create your account
                        </h1>
                        <p className="text-muted-foreground">
                            Start your workspace journey today
                        </p>
                    </div>

                    {/* Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="bg-surface/50 border border-border/50 rounded-2xl p-6 backdrop-blur-sm"
                    >
                        {/* Success Alert */}
                        {successMessage && (
                            <div className="mb-6">
                                <Alert type="success" message={successMessage} />
                            </div>
                        )}

                        {/* Error Alert */}
                        {serverError && (
                            <div className="mb-6">
                                <Alert
                                    type="error"
                                    message={serverError}
                                    onClose={() => setServerError(null)}
                                />
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            {/* Full Name Input */}
                            <FormInput
                                label="Full Name"
                                type="text"
                                placeholder="John Doe"
                                {...register('full_name', {
                                    minLength: {
                                        value: 2,
                                        message: 'Full name must be at least 2 characters',
                                    },
                                })}
                                error={errors.full_name?.message}
                            />

                            {/* Username Input */}
                            <FormInput
                                label="Username (Optional)"
                                type="text"
                                placeholder="johndoe"
                                {...register('username', {
                                    minLength: {
                                        value: 3,
                                        message: 'Username must be at least 3 characters',
                                    },
                                    pattern: {
                                        value: /^[a-zA-Z0-9_-]*$/,
                                        message: 'Username can only contain letters, numbers, hyphens, and underscores',
                                    },
                                })}
                                error={errors.username?.message}
                            />

                            {/* Email Input */}
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

                            {/* Password Input */}
                            <FormInput
                                label="Password"
                                type="password"
                                placeholder="••••••••"
                                {...register('password', {
                                    required: 'Password is required',
                                    minLength: {
                                        value: 8,
                                        message: 'Password must be at least 8 characters',
                                    },
                                    validate: {
                                        hasUpperCase: (value) =>
                                            /[A-Z]/.test(value) ||
                                            'Password must contain at least one uppercase letter',
                                        hasLowerCase: (value) =>
                                            /[a-z]/.test(value) ||
                                            'Password must contain at least one lowercase letter',
                                        hasNumber: (value) =>
                                            /[0-9]/.test(value) ||
                                            'Password must contain at least one number',
                                    },
                                })}
                                error={errors.password?.message}
                                helpText="At least 8 characters with uppercase, lowercase, and number"
                            />

                            {/* Confirm Password Input */}
                            <FormInput
                                label="Confirm Password"
                                type="password"
                                placeholder="••••••••"
                                {...register('confirm_password', {
                                    required: 'Please confirm your password',
                                    validate: (value) =>
                                        value === password || 'Passwords do not match',
                                })}
                                error={errors.confirm_password?.message}
                            />

                            {/* Sign Up Button */}
                            <Button
                                type="submit"
                                fullWidth
                                isLoading={isPending}
                                className="mt-6 bg-foreground text-background hover:opacity-90"
                            >
                                {isPending ? 'Creating account...' : 'Create account'}
                            </Button>
                        </form>

                        {/* Divider */}
                        <div className="my-6 flex items-center gap-3">
                            <div className="flex-1 h-px bg-border/50"></div>
                            <span className="text-sm text-muted-foreground">
                                Or sign up with
                            </span>
                            <div className="flex-1 h-px bg-border/50"></div>
                        </div>

                        {/* OAuth Buttons */}
                        <div className="grid grid-cols-2 gap-3">
                            <Button
                                variant="outline"
                                disabled={isPending}
                                onClick={() => {
                                    console.log('Google OAuth not yet implemented');
                                }}
                                className="border-border/50 hover:border-indigo-500/30 hover:bg-accent"
                            >
                                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                                    <path
                                        fill="currentColor"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    />
                                </svg>
                                Google
                            </Button>
                            <Button
                                variant="outline"
                                disabled={isPending}
                                onClick={() => {
                                    console.log('GitHub OAuth not yet implemented');
                                }}
                                className="border-border/50 hover:border-indigo-500/30 hover:bg-accent"
                            >
                                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                </svg>
                                GitHub
                            </Button>
                        </div>
                    </motion.div>

                    {/* Sign In Link */}
                    <p className="mt-6 text-center text-sm text-muted-foreground">
                        Already have an account?{' '}
                        <Link
                            to="/auth/sign-in"
                            className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                            Sign in
                        </Link>
                    </p>

                    {/* Footer */}
                    <p className="mt-8 text-center text-xs text-muted-foreground">
                        By creating an account, you agree to our{' '}
                        <a href="#" className="hover:text-foreground transition-colors">
                            Terms of Service
                        </a>{' '}
                        and{' '}
                        <a href="#" className="hover:text-foreground transition-colors">
                            Privacy Policy
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SignUp;
