/**
 * Types for feedback and monitoring system
 */

export type FeedbackType = 'bug' | 'feature' | 'praise';
export type FeedbackStatus = 'new' | 'in_progress' | 'resolved' | 'closed';
export type ErrorType = 'crash' | 'exception' | 'warning' | 'network' | 'sync';

export interface Feedback {
  id: string;
  type: FeedbackType;
  message: string;
  screenshot_url?: string;
  user_email?: string;
  app_version: string;
  platform: string;
  status: FeedbackStatus;
  created_at: string;
}

export interface FeedbackCreateRequest {
  type: FeedbackType;
  message: string;
  screenshot_url?: string;
  user_email?: string;
  include_system_info?: boolean;
  metadata?: Record<string, unknown>;
}

export interface FeedbackStatusUpdate {
  status: FeedbackStatus;
}

export interface ErrorLog {
  id: string;
  error_type: ErrorType;
  message: string;
  stack_trace?: string;
  component?: string;
  action?: string;
  app_version: string;
  platform: string;
  created_at: string;
}

export interface ErrorLogCreateRequest {
  error_type: ErrorType;
  message: string;
  stack_trace?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, unknown>;
}

export interface SystemInfo {
  appVersion: string;
  platform: string;
  userAgent?: string;
  osVersion?: string;
  screenResolution?: string;
}

export interface AnalyticsEvent {
  id: string;
  event_name: string;
  properties?: Record<string, unknown>;
  session_id?: string;
  app_version: string;
  platform: string;
  created_at: string;
}

export interface AnalyticsEventCreateRequest {
  event_name: string;
  properties?: Record<string, unknown>;
  session_id?: string;
}

export interface FeatureUsageStats {
  event_name: string;
  count: number;
  unique_users: number;
}

export interface DailyStats {
  date: string;
  total_sessions: number;
  unique_users: number;
  avg_session_duration_seconds?: number;
  total_events: number;
  total_errors: number;
  unique_error_types: number;
  total_feedback: number;
  bug_reports: number;
  feature_requests: number;
}

export interface FeedbackStats {
  total: number;
  by_type: Record<FeedbackType, number>;
  by_status: Record<FeedbackStatus, number>;
}

export interface ErrorStats {
  total: number;
  by_type: Record<ErrorType, number>;
  top_components: Array<{ component: string; count: number }>;
}
