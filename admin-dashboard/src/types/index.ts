// Stats types
export interface DashboardStats {
  total_users: number;
  active_today: number;
  feedback_count: number;
  error_count_24h: number;
}

export interface VersionDistribution {
  version: string;
  count: number;
  percentage: number;
}

// Feature Flag types
export interface FeatureFlag {
  id: string;
  key: string;
  enabled: boolean;
  rollout_percentage: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

// Remote Config types
export interface RemoteConfig {
  id: string;
  key: string;
  value: string | number | boolean;
  value_type: 'string' | 'number' | 'boolean' | 'json';
  description?: string;
  created_at: string;
  updated_at: string;
}

// Feedback types
export type FeedbackType = 'bug' | 'feature' | 'praise' | 'other';
export type FeedbackStatus = 'new' | 'in_progress' | 'resolved' | 'closed';

export interface Feedback {
  id: string;
  user_id?: string;
  user_email?: string;
  type: FeedbackType;
  status: FeedbackStatus;
  title: string;
  content: string;
  app_version?: string;
  platform?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  admin_notes?: string;
}

// Error types
export interface ErrorLog {
  id: string;
  error_type: string;
  message: string;
  stack_trace?: string;
  user_id?: string;
  app_version?: string;
  platform?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  resolved: boolean;
}

// App Version types (backend may return platform "all" for desktop)
export interface AppVersion {
  id: string;
  version: string;
  platform: 'ios' | 'android' | 'desktop' | 'web' | 'all';
  release_notes?: string;
  force_update: boolean;
  min_required_version?: string;
  download_url?: string;
  released_at?: string;
  created_at: string;
  updated_at: string;
}

// User types
export interface User {
  id: string;
  email: string;
  full_name?: string;
  username?: string;
  plan: 'free' | 'pro' | 'team' | 'enterprise';
  is_active: boolean;
  last_seen_at?: string;
  created_at: string;
}
