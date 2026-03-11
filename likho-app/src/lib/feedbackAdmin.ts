/**
 * Admin feedback service
 * 
 * For admin users to view and manage feedback.
 */
import { api } from './api';
import {
  Feedback,
  FeedbackStatus,
  FeedbackType,
  FeedbackStats,
  ErrorLog,
  ErrorStats,
  FeatureUsageStats,
  DailyStats,
} from '@/types/feedback';

interface ListFeedbackParams {
  status?: FeedbackStatus;
  type?: FeedbackType;
  limit?: number;
  offset?: number;
}

interface ListFeedbackResponse {
  items: Feedback[];
  total: number;
}

/**
 * List all feedback (admin only)
 */
export async function listFeedback(
  params: ListFeedbackParams = {}
): Promise<ListFeedbackResponse> {
  const response = await api.get('/admin/feedback', { params });
  return {
    items: response.data,
    total: parseInt(response.headers['x-total-count'] || '0', 10),
  };
}

/**
 * Get feedback statistics (admin only)
 */
export async function getFeedbackStats(days: number = 30): Promise<FeedbackStats> {
  const response = await api.get('/admin/feedback/stats', { params: { days } });
  return response.data;
}

/**
 * Update feedback status (admin only)
 */
export async function updateFeedbackStatus(
  feedbackId: string,
  status: FeedbackStatus
): Promise<Feedback> {
  const response = await api.patch(`/admin/feedback/${feedbackId}/status`, { status });
  return response.data;
}

/**
 * List error logs (admin only)
 */
export async function listErrorLogs(
  params: { errorType?: string; limit?: number; offset?: number } = {}
): Promise<{ items: ErrorLog[]; total: number }> {
  const response = await api.get('/admin/errors', { params });
  return {
    items: response.data,
    total: parseInt(response.headers['x-total-count'] || '0', 10),
  };
}

/**
 * Get error statistics (admin only)
 */
export async function getErrorStats(days: number = 7): Promise<ErrorStats> {
  const response = await api.get('/admin/errors/stats', { params: { days } });
  return response.data;
}

/**
 * Get feature usage statistics (admin only)
 */
export async function getFeatureUsageStats(
  days: number = 7
): Promise<FeatureUsageStats[]> {
  const response = await api.get('/admin/analytics/features', { params: { days } });
  return response.data;
}

/**
 * Get daily active users (admin only)
 */
export async function getDailyActiveUsers(
  days: number = 30
): Promise<DailyStats[]> {
  const response = await api.get('/admin/analytics/dau', { params: { days } });
  return response.data;
}

/**
 * Get health check status
 */
export async function getHealthStatus(): Promise<{
  status: string;
  version: string;
  features: {
    feedback: boolean;
    error_tracking: boolean;
    analytics: boolean;
  };
}> {
  const response = await api.get('/health');
  return response.data;
}
