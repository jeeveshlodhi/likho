import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useForm } from 'react-hook-form';
import { useSignIn } from '@/hooks/useAuth';
import { FormInput } from '@/components/forms/FormInput';
import { Button } from '@/components/forms/Button';
import { Alert } from '@/components/forms/Alert';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { SignInRequest } from '@/types/auth';

const SignIn = () => {
    const navigate = useNavigate();
    const [serverError, setServerError] = useState<string | null>(null);
    const { mutate: signIn, isPending } = useSignIn();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<SignInRequest>({
        mode: 'onBlur',
    });

    const onSubmit = (data: SignInRequest) => {
        setServerError(null);
        signIn(data, {
            onSuccess: () => {
                navigate('/dashboard');
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
        <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
            <div className="absolute top-4 right-4">
                <ThemeToggle showLabel={false} />
            </div>
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-foreground mb-2">
                        Welcome back
                    </h1>
                    <p className="text-muted-foreground">
                        Your AI-powered workspace awaits
                    </p>
                </div>

                {/* Card */}
                <div className="bg-popover text-popover-foreground rounded-2xl shadow-xl border border-border p-8">
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
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
                        <div>
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
                                })}
                                error={errors.password?.message}
                            />
                            <div className="mt-2">
                                <Link
                                    to="/forgot-password"
                                    className="text-sm text-primary hover:opacity-90"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                        </div>

                        {/* Sign In Button */}
                        <Button
                            type="submit"
                            fullWidth
                            isLoading={isPending}
                            className="mt-6"
                        >
                            {isPending ? 'Signing in...' : 'Sign in'}
                        </Button>
                    </form>

                    {/* Divider */}
                    <div className="my-6 flex items-center gap-3">
                        <div className="flex-1 h-px bg-border"></div>
                        <span className="text-sm text-muted-foreground">
                            Or continue with
                        </span>
                        <div className="flex-1 h-px bg-border"></div>
                    </div>

                    {/* OAuth Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            variant="outline"
                            disabled={isPending}
                            onClick={() => {
                                // TODO: Implement Google OAuth
                                console.log('Google OAuth not yet implemented');
                            }}
                        >
                            Google
                        </Button>
                        <Button
                            variant="outline"
                            disabled={isPending}
                            onClick={() => {
                                // TODO: Implement GitHub OAuth
                                console.log('GitHub OAuth not yet implemented');
                            }}
                        >
                            GitHub
                        </Button>
                    </div>

                    {/* Sign Up Link */}
                    <div className="mt-6 text-center text-sm text-muted-foreground">
                        Don't have an account?{' '}
                        <Link
                            to="/auth/sign-up"
                            className="font-medium text-primary hover:opacity-90"
                        >
                            Sign up
                        </Link>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center text-xs text-muted-foreground">
                    <p>
                        By signing in, you agree to our{' '}
                        <a href="#" className="text-muted-foreground hover:text-foreground underline">
                            Terms of Service
                        </a>{' '}
                        and{' '}
                        <a href="#" className="text-muted-foreground hover:text-foreground underline">
                            Privacy Policy
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SignIn;