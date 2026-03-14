import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
  DashboardStats,
  VersionDistribution,
  FeatureFlag,
  RemoteConfig,
  Feedback,
  FeedbackType,
  FeedbackStatus,
  ErrorLog,
  AppVersion,
  User,
} from '@/types';

// API base URL - can be overridden with env variable
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Admin API key - should be set in environment
const ADMIN_API_KEY = import.meta.env.VITE_ADMIN_API_KEY || '';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-API-Key': ADMIN_API_KEY,
      },
      timeout: 30000,
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          console.error('Admin API key invalid or missing');
        }
        return Promise.reject(error);
      }
    );
  }

  // Update API key
  setApiKey(key: string) {
    this.client.defaults.headers['X-Admin-API-Key'] = key;
  }

  // ===== Dashboard Stats =====
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await this.client.get<DashboardStats>('/admin/stats');
    return response.data;
  }

  async getVersionDistribution(): Promise<VersionDistribution[]> {
    const response = await this.client.get<VersionDistribution[]>('/admin/versions/distribution');
    return response.data;
  }

  async getRecentFeedback(limit = 5): Promise<Feedback[]> {
    const response = await this.client.get<Feedback[]>(`/admin/feedback?limit=${limit}`);
    return response.data;
  }

  async getRecentErrors(limit = 5): Promise<ErrorLog[]> {
    const response = await this.client.get<ErrorLog[]>(`/admin/errors?limit=${limit}`);
    return response.data;
  }

  // ===== Feature Flags =====
  async getFeatureFlags(): Promise<FeatureFlag[]> {
    const response = await this.client.get<FeatureFlag[]>('/admin/feature-flags');
    return response.data;
  }

  async createFeatureFlag(data: Partial<FeatureFlag>): Promise<FeatureFlag> {
    const response = await this.client.post<FeatureFlag>('/admin/feature-flags', data);
    return response.data;
  }

  async updateFeatureFlag(id: string, data: Partial<FeatureFlag>): Promise<FeatureFlag> {
    const response = await this.client.patch<FeatureFlag>(`/admin/feature-flags/${id}`, data);
    return response.data;
  }

  async deleteFeatureFlag(id: string): Promise<void> {
    await this.client.delete(`/admin/feature-flags/${id}`);
  }

  // ===== Remote Config =====
  async getRemoteConfig(): Promise<RemoteConfig[]> {
    const response = await this.client.get<RemoteConfig[]>('/admin/remote-config');
    return response.data;
  }

  async createRemoteConfig(data: Partial<RemoteConfig>): Promise<RemoteConfig> {
    const response = await this.client.post<RemoteConfig>('/admin/remote-config', data);
    return response.data;
  }

  async updateRemoteConfig(id: string, data: Partial<RemoteConfig>): Promise<RemoteConfig> {
    const response = await this.client.patch<RemoteConfig>(`/admin/remote-config/${id}`, data);
    return response.data;
  }

  async deleteRemoteConfig(id: string): Promise<void> {
    await this.client.delete(`/admin/remote-config/${id}`);
  }

  // ===== Feedback =====
  async getFeedback(
    type?: FeedbackType,
    status?: FeedbackStatus,
    page = 1,
    limit = 20
  ): Promise<{ items: Feedback[]; total: number; page: number; pages: number }> {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (status) params.append('status', status);
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    const response = await this.client.get(`/admin/feedback?${params.toString()}`);
    return response.data;
  }

  async getFeedbackById(id: string): Promise<Feedback> {
    const response = await this.client.get<Feedback>(`/admin/feedback/${id}`);
    return response.data;
  }

  async updateFeedback(id: string, data: Partial<Feedback>): Promise<Feedback> {
    const response = await this.client.patch<Feedback>(`/admin/feedback/${id}`, data);
    return response.data;
  }

  async deleteFeedback(id: string): Promise<void> {
    await this.client.delete(`/admin/feedback/${id}`);
  }

  // ===== Errors =====
  async getErrors(
    resolved?: boolean,
    page = 1,
    limit = 20
  ): Promise<{ items: ErrorLog[]; total: number; page: number; pages: number }> {
    const params = new URLSearchParams();
    if (resolved !== undefined) params.append('resolved', resolved.toString());
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    const response = await this.client.get(`/admin/errors?${params.toString()}`);
    return response.data;
  }

  async updateError(id: string, data: Partial<ErrorLog>): Promise<ErrorLog> {
    const response = await this.client.patch<ErrorLog>(`/admin/errors/${id}`, data);
    return response.data;
  }

  // ===== Versions =====
  async getVersions(): Promise<AppVersion[]> {
    const response = await this.client.get<AppVersion[]>('/admin/versions');
    return response.data;
  }

  async createVersion(data: Partial<AppVersion>): Promise<AppVersion> {
    const response = await this.client.post<AppVersion>('/admin/versions', data);
    return response.data;
  }

  async updateVersion(id: string, data: Partial<AppVersion>): Promise<AppVersion> {
    const response = await this.client.patch<AppVersion>(`/admin/versions/${id}`, data);
    return response.data;
  }

  async deleteVersion(id: string): Promise<void> {
    await this.client.delete(`/admin/versions/${id}`);
  }

  // ===== Releases (build, S3 upload) =====
  /** Get presigned S3 upload URL for a build artifact. Returns { upload_url, public_url } or throws. */
  async getPresignedUploadUrl(filename: string): Promise<{ upload_url: string; public_url: string }> {
    const response = await this.client.get<{ upload_url: string; public_url: string }>(
      '/admin/releases/presigned-upload',
      { params: { filename } }
    );
    return response.data;
  }

  // ===== Users =====
  async getUsers(page = 1, limit = 20): Promise<{ items: User[]; total: number; page: number; pages: number }> {
    const response = await this.client.get(`/admin/users?page=${page}&limit=${limit}`);
    return response.data;
  }
}

// Export singleton instance
export const api = new ApiClient();

// For testing/development with mock data
export const mockApi = {
  getDashboardStats: async (): Promise<DashboardStats> => ({
    total_users: 1247,
    active_today: 342,
    feedback_count: 56,
    error_count_24h: 12,
  }),

  getVersionDistribution: async (): Promise<VersionDistribution[]> => [
    { version: '0.5.2', count: 580, percentage: 46.5 },
    { version: '0.5.1', count: 420, percentage: 33.7 },
    { version: '0.5.0', count: 180, percentage: 14.4 },
    { version: '0.4.9', count: 67, percentage: 5.4 },
  ],

  getRecentFeedback: async (): Promise<Feedback[]> => [
    {
      id: '1',
      type: 'feature',
      status: 'new',
      title: 'Add dark mode support',
      content: 'Would love to have a dark mode option for the app',
      user_email: 'user@example.com',
      app_version: '0.5.2',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '2',
      type: 'bug',
      status: 'in_progress',
      title: 'Sync issue on mobile',
      content: 'Notes are not syncing properly on iOS',
      user_email: 'mobile@example.com',
      app_version: '0.5.1',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: '3',
      type: 'praise',
      status: 'resolved',
      title: 'Love the new AI features!',
      content: 'The AI summarization is amazing',
      user_email: 'happy@example.com',
      created_at: new Date(Date.now() - 172800000).toISOString(),
      updated_at: new Date(Date.now() - 172800000).toISOString(),
    },
  ],

  getRecentErrors: async (): Promise<ErrorLog[]> => [
    {
      id: '1',
      error_type: 'SyncError',
      message: 'Failed to sync workspace data',
      user_id: 'user-123',
      app_version: '0.5.2',
      platform: 'ios',
      created_at: new Date().toISOString(),
      resolved: false,
    },
    {
      id: '2',
      error_type: 'AuthError',
      message: 'Token expired',
      app_version: '0.5.1',
      platform: 'web',
      created_at: new Date(Date.now() - 3600000).toISOString(),
      resolved: true,
    },
  ],

  getFeatureFlags: async (): Promise<FeatureFlag[]> => [
    {
      id: '1',
      key: 'ai_features',
      enabled: true,
      rollout_percentage: 100,
      description: 'Enable AI-powered features',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '2',
      key: 'collaboration',
      enabled: true,
      rollout_percentage: 50,
      description: 'Real-time collaboration features',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '3',
      key: 'beta_templates',
      enabled: false,
      rollout_percentage: 0,
      description: 'New template gallery (beta)',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],

  getRemoteConfig: async (): Promise<RemoteConfig[]> => [
    {
      id: '1',
      key: 'max_file_size_mb',
      value: 50,
      value_type: 'number',
      description: 'Maximum upload file size in MB',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '2',
      key: 'enable_public_sharing',
      value: true,
      value_type: 'boolean',
      description: 'Allow users to create public share links',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '3',
      key: 'welcome_message',
      value: 'Welcome to Likho Beta!',
      value_type: 'string',
      description: 'Welcome message shown to new users',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],

  getFeedback: async () => ({
    items: await mockApi.getRecentFeedback(),
    total: 56,
    page: 1,
    pages: 3,
  }),

  getVersions: async (): Promise<AppVersion[]> => [
    {
      id: '1',
      version: '0.5.2',
      platform: 'desktop',
      release_notes: 'Bug fixes and performance improvements',
      force_update: false,
      released_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '2',
      version: '0.5.1',
      platform: 'ios',
      release_notes: 'iOS sync improvements',
      force_update: true,
      min_required_version: '0.5.0',
      released_at: new Date(Date.now() - 604800000).toISOString(),
      created_at: new Date(Date.now() - 604800000).toISOString(),
      updated_at: new Date(Date.now() - 604800000).toISOString(),
    },
  ],

  createFeatureFlag: async (data: Partial<FeatureFlag>): Promise<FeatureFlag> => ({
    id: Math.random().toString(36),
    key: data.key || 'new-flag',
    enabled: data.enabled ?? false,
    rollout_percentage: data.rollout_percentage ?? 0,
    description: data.description,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }),

  updateFeatureFlag: async (id: string, data: Partial<FeatureFlag>): Promise<FeatureFlag> => ({
    id,
    key: data.key || 'updated-flag',
    enabled: data.enabled ?? false,
    rollout_percentage: data.rollout_percentage ?? 0,
    description: data.description,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }),

  deleteFeatureFlag: async () => {},

  createRemoteConfig: async (data: Partial<RemoteConfig>): Promise<RemoteConfig> => ({
    id: Math.random().toString(36),
    key: data.key || 'new-config',
    value: data.value || '',
    value_type: data.value_type || 'string',
    description: data.description,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }),

  updateRemoteConfig: async (id: string, data: Partial<RemoteConfig>): Promise<RemoteConfig> => ({
    id,
    key: data.key || 'updated-config',
    value: data.value || '',
    value_type: data.value_type || 'string',
    description: data.description,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }),

  deleteRemoteConfig: async () => {},

  updateFeedback: async (id: string, data: Partial<Feedback>): Promise<Feedback> => ({
    id,
    type: data.type || 'other',
    status: data.status || 'new',
    title: data.title || 'Feedback',
    content: data.content || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }),

  createVersion: async (data: Partial<AppVersion>): Promise<AppVersion> => ({
    id: Math.random().toString(36),
    version: data.version || '0.0.0',
    platform: data.platform || 'web',
    release_notes: data.release_notes,
    force_update: data.force_update ?? false,
    min_required_version: data.min_required_version,
    released_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }),

  updateVersion: async (id: string, data: Partial<AppVersion>): Promise<AppVersion> => ({
    id,
    version: data.version || '0.0.0',
    platform: data.platform || 'web',
    release_notes: data.release_notes,
    force_update: data.force_update ?? false,
    min_required_version: data.min_required_version,
    released_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }),

  deleteVersion: async () => {},

  getErrors: async (_resolved?: boolean, page = 1) => ({
    items: await mockApi.getRecentErrors(),
    total: 12,
    page,
    pages: 2,
  }),

  updateError: async (id: string, data: Partial<ErrorLog>): Promise<ErrorLog> => ({
    id,
    error_type: data.error_type || 'UnknownError',
    message: data.message || 'Error message',
    resolved: data.resolved ?? false,
    created_at: new Date().toISOString(),
  }),
};

// Use mock API for development if no API key is set
export const activeApi = ADMIN_API_KEY ? api : { ...api, ...mockApi };
