import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import {
  SignUpRequest,
  SignInRequest,
  SignUpResponse,
  SignInResponse,
  UserResponse,
  ApiError,
} from '@/types/auth';
import { AxiosError } from 'axios';

const authQueryKeys = {
  all: ['auth'] as const,
  me: () => [...authQueryKeys.all, 'me'] as const,
};

// Sign Up Hook
export const useSignUp = () => {

  return useMutation<SignUpResponse, AxiosError<ApiError>, SignUpRequest>({
    mutationFn: async (credentials: SignUpRequest) => {
      const response = await api.post<SignUpResponse>('/auth/signup', credentials);
      return response.data;
    },
    onSuccess: () => {
      // Backend only returns the user object, not tokens on signup.
      // So we just rely on redirects in the UI to login next.
    },
  });
};

// Sign In Hook
export const useSignIn = () => {
  const { setTokens } = useAuthStore();

  return useMutation<SignInResponse, AxiosError<ApiError>, SignInRequest>({
    mutationFn: async (credentials: SignInRequest) => {
      const response = await api.post<SignInResponse>('/auth/login', credentials);
      return response.data;
    },
    onSuccess: (data) => {
      setTokens(data.access_token, data.refresh_token || null);
      // Store tokens in localStorage
      localStorage.setItem('access_token', data.access_token);
      if (data.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token);
      }
    },
  });
};

import { useEffect } from 'react';

// Get Current User Hook
export const useCurrentUser = () => {
  const { setUser } = useAuthStore();
  const accessToken = useAuthStore((state) => state.accessToken);

  const query = useQuery<UserResponse, AxiosError<ApiError>>({
    queryKey: authQueryKeys.me(),
    queryFn: async () => {
      const response = await api.get<UserResponse>('/auth/me');
      return response.data;
    },
    enabled: !!accessToken,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });

  useEffect(() => {
    if (query.data) {
      setUser(query.data);
    }
  }, [query.data, setUser]);

  return query;
};

// Logout Hook
export const useLogout = () => {
  const { logout } = useAuthStore();

  return useMutation({
    mutationFn: async () => {
      try {
        await api.post('/auth/logout');
      } catch (error) {
        // Even if logout fails on server, we still want to clear local state
        console.error('Logout error:', error);
      }
    },
    onSettled: () => {
      logout();
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    },
  });
};

// Change Password Hook
export const useChangePassword = () => {
  return useMutation({
    mutationFn: async (payload: {
      current_password: string;
      new_password: string;
      confirm_password: string;
    }) => {
      const response = await api.post('/auth/change-password', payload);
      return response.data;
    },
  });
};

// Request Password Reset Hook
export const useRequestPasswordReset = () => {
  return useMutation({
    mutationFn: async (email: string) => {
      const response = await api.post('/auth/request-password-reset', { email });
      return response.data;
    },
  });
};

// Confirm Password Reset Hook
export const useConfirmPasswordReset = () => {
  return useMutation({
    mutationFn: async (payload: {
      token: string;
      new_password: string;
      confirm_password: string;
    }) => {
      const response = await api.post('/auth/confirm-password-reset', payload);
      return response.data;
    },
  });
};

// Verify Email Hook
export const useVerifyEmail = () => {
  return useMutation({
    mutationFn: async (token: string) => {
      const response = await api.post('/auth/verify-email', { token });
      return response.data;
    },
  });
};

// Request Email Verification Hook
export const useRequestEmailVerification = () => {
  return useMutation({
    mutationFn: async (email: string) => {
      const response = await api.post('/auth/request-email-verification', { email });
      return response.data;
    },
  });
};

// Check Auth Status Hook
export const useAuthStatus = () => {
  const { isAuthenticated, accessToken } = useAuthStore();
  const { data: user, isLoading } = useCurrentUser();

  return {
    isAuthenticated: isAuthenticated && !!accessToken,
    user,
    isLoading,
  };
};
