import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useForm } from 'react-hook-form';
import { useSignUp } from '@/hooks/useAuth';
import { FormInput } from '@/components/forms/FormInput';
import { Button } from '@/components/forms/Button';
import { Alert } from '@/components/forms/Alert';
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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                        Join Likho
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Create your AI-powered workspace
                    </p>
                </div>

                {/* Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
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
                        <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600"></div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            Or sign up with
                        </span>
                        <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600"></div>
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
                    <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                        Already have an account?{' '}
                        <Link
                            to="/auth/sign-in"
                            className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                            Sign in
                        </Link>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center text-xs text-gray-500 dark:text-gray-400">
                    <p>
                        By creating an account, you agree to our{' '}
                        <a href="#" className="hover:underline">
                            Terms of Service
                        </a>{' '}
                        and{' '}
                        <a href="#" className="hover:underline">
                            Privacy Policy
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SignUp;