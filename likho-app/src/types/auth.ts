export type PlanType = 'free' | 'pro' | 'team' | 'enterprise';
export type ThemeType = 'light' | 'dark' | 'system';
export type AuthProvider = 'email' | 'google' | 'github' | 'apple';

export interface UserResponse {
  id: string;
  email: string;
  email_verified: boolean;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  timezone: string;
  locale: string;
  theme: ThemeType;
  plan: PlanType;
  is_active: boolean;
  last_seen_at: string | null;
  onboarded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserDetailedResponse extends UserResponse {
  storage_used: number;
  storage_limit: number;
  plan_expires_at: string | null;
}

export interface SignUpRequest {
  email: string;
  password: string;
  full_name?: string;
  username?: string;
}

export interface SignInRequest {
  email: string;
  password: string;
}

export interface SignUpResponse {
  user: UserResponse;
  message: string;
}

export interface SignInResponse {
  user: UserResponse;
  access_token: string;
  refresh_token?: string;
  token_type: string;
}

export interface TokenRefreshRequest {
  refresh_token: string;
}

export interface TokenRefreshResponse {
  access_token: string;
  token_type: string;
}

export interface PasswordChangeRequest {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  new_password: string;
  confirm_password: string;
}

export interface EmailVerificationRequest {
  email: string;
}

export interface EmailVerificationConfirm {
  token: string;
}

export interface ApiError {
  detail?: string;
  error?: string;
  message?: string;
  status?: number;
}
