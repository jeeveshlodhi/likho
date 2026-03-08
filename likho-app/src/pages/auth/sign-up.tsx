import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useForm } from 'react-hook-form';
import { useSignUp } from '@/hooks/useAuth';
import { FormInput } from '@/components/forms/FormInput';
import { Button } from '@/components/forms/Button';
import { Alert } from '@/components/forms/Alert';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { SignUpRequest } from '@/types/auth';

interface FormInputs extends SignUpRequest {
    confirm_password: string;
}

const SignUp = () => {
    const navigate = useNavigate();
    const [serverError, setServerError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const { mutate: signUp, isPending } = useSignUp();

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

        // Validate password confirmation
        if (data.password !== data.confirm_password) {
            setServerError('Passwords do not match');
            return;
        }

        const { confirm_password, ...submitData } = data;

        signUp(submitData, {
            onSuccess: () => {
                setSuccessMessage('Account created successfully! Redirecting...');
                setTimeout(() => {
                    navigate('/auth/sign-in');
                }, 1500);
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

    return (
        <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
            <div className="absolute top-4 right-4">
                <ThemeToggle showLabel={false} />
            </div>
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-foreground mb-2">
                        Join Likho
                    </h1>
                    <p className="text-muted-foreground">
                        Create your AI-powered workspace
                    </p>
                </div>

                {/* Card */}
                <div className="bg-popover text-popover-foreground rounded-2xl shadow-xl border border-border p-8">
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
                            className="mt-6"
                        >
                            {isPending ? 'Creating account...' : 'Create account'}
                        </Button>
                    </form>

                    {/* Divider */}
                    <div className="my-6 flex items-center gap-3">
                        <div className="flex-1 h-px bg-border"></div>
                        <span className="text-sm text-muted-foreground">
                            Or sign up with
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

                    {/* Sign In Link */}
                    <div className="mt-6 text-center text-sm text-muted-foreground">
                        Already have an account?{' '}
                        <Link
                            to="/auth/sign-in"
                            className="font-medium text-primary hover:opacity-90"
                        >
                            Sign in
                        </Link>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center text-xs text-muted-foreground">
                    <p>
                        By creating an account, you agree to our{' '}
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

export default SignUp;