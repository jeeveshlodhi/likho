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

// Admin API key — env var takes priority, then localStorage (set via Settings page)
const getApiKey = () =>
  import.meta.env.VITE_ADMIN_API_KEY || localStorage.getItem('admin_api_key') || '';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    // Inject API key before every request so it picks up runtime changes
    this.client.interceptors.request.use((config) => {
      const key = getApiKey();
      if (key) config.headers['X-Admin-API-Key'] = key;
      return config;
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          console.error('Admin authentication failed — check ADMIN_API_KEY.');
        }
        return Promise.reject(error);
      }
    );
  }

  // Update API key at runtime (called from Settings / useAuthStore)
  setApiKey(key: string) {
    localStorage.setItem('admin_api_key', key);
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
    const response = await this.client.get<FeatureFlag[]>('/admin/features');
    return response.data;
  }

  async createFeatureFlag(data: Partial<FeatureFlag>): Promise<FeatureFlag> {
    const response = await this.client.post<FeatureFlag>('/admin/features', data);
    return response.data;
  }

  async updateFeatureFlag(id: string, data: Partial<FeatureFlag>): Promise<FeatureFlag> {
    const response = await this.client.patch<FeatureFlag>(`/admin/features/${id}`, data);
    return response.data;
  }

  async deleteFeatureFlag(id: string): Promise<void> {
    await this.client.delete(`/admin/features/${id}`);
  }

  // ===== Remote Config =====
  async getRemoteConfig(): Promise<RemoteConfig[]> {
    const response = await this.client.get<RemoteConfig[]>('/admin/configs');
    return response.data;
  }

  async createRemoteConfig(data: Partial<RemoteConfig>): Promise<RemoteConfig> {
    const response = await this.client.post<RemoteConfig>('/admin/configs', data);
    return response.data;
  }

  async updateRemoteConfig(id: string, data: Partial<RemoteConfig>): Promise<RemoteConfig> {
    const response = await this.client.patch<RemoteConfig>(`/admin/configs/${id}`, data);
    return response.data;
  }

  async deleteRemoteConfig(id: string): Promise<void> {
    await this.client.delete(`/admin/configs/${id}`);
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

  // ===== Releases (S3 upload) =====

  /** Check S3 configuration status. */
  async getS3Status(): Promise<{ configured: boolean; bucket: string | null; region: string; prefix: string }> {
    const response = await this.client.get('/admin/releases/s3-status');
    return response.data;
  }

  /** Get presigned S3 upload URL for a build artifact. Returns { upload_url, public_url } or throws. */
  async getPresignedUploadUrl(filename: string): Promise<{ upload_url: string; public_url: string }> {
    const response = await this.client.get<{ upload_url: string; public_url: string }>(
      '/admin/releases/presigned-upload',
      { params: { filename } }
    );
    return response.data;
  }

  /**
   * Upload a file to S3 via presigned URL with progress tracking.
   * Returns the public download URL.
   */
  async uploadToS3(
    file: File,
    uploadUrl: string,
    onProgress?: (pct: number) => void
  ): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
      if (onProgress) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
        };
      }
      xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`S3 upload failed: ${xhr.status}`)));
      xhr.onerror = () => reject(new Error('S3 upload network error'));
      xhr.send(file);
    });
  }

  // ===== Users =====
  async getUsers(page = 1, limit = 20): Promise<{ items: User[]; total: number; page: number; pages: number }> {
    const response = await this.client.get(`/admin/users?page=${page}&limit=${limit}`);
    return response.data;
  }
}

// Export singleton instance
export const api = new ApiClient();

// ─── Mock data (used when no API key is configured) ──────────────────────────

export const mockApi = {
  getDashboardStats: async (): Promise<DashboardStats> => ({
    total_users: 1247,
    active_today: 342,
    feedback_count: 56,
    error_count_24h: 12,
  }),

  getVersionDistribution: async (): Promise<VersionDistribution[]> => [
    { version: '0.1.0', count: 580, percentage: 46.5 },
    { version: '0.0.9', count: 420, percentage: 33.7 },
  ],

  getRecentFeedback: async (): Promise<Feedback[]> => [],
  getRecentErrors: async (): Promise<ErrorLog[]> => [],

  getFeatureFlags: async (): Promise<FeatureFlag[]> => [],
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
    key: data.key || 'flag',
    enabled: data.enabled ?? false,
    rollout_percentage: data.rollout_percentage ?? 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }),
  deleteFeatureFlag: async () => {},

  getRemoteConfig: async (): Promise<RemoteConfig[]> => [],
  createRemoteConfig: async (data: Partial<RemoteConfig>): Promise<RemoteConfig> => ({
    id: Math.random().toString(36),
    key: data.key || 'new-config',
    value: data.value || '',
    value_type: data.value_type || 'string',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }),
  updateRemoteConfig: async (id: string, data: Partial<RemoteConfig>): Promise<RemoteConfig> => ({
    id,
    key: data.key || 'config',
    value: data.value || '',
    value_type: data.value_type || 'string',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }),
  deleteRemoteConfig: async () => {},

  getFeedback: async () => ({ items: [] as Feedback[], total: 0, page: 1, pages: 1 }),
  updateFeedback: async (id: string, data: Partial<Feedback>): Promise<Feedback> => ({
    id,
    type: data.type || 'other',
    status: data.status || 'new',
    title: data.title || 'Feedback',
    content: data.content || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }),

  getErrors: async () => ({ items: [] as ErrorLog[], total: 0, page: 1, pages: 1 }),
  updateError: async (id: string, data: Partial<ErrorLog>): Promise<ErrorLog> => ({
    id,
    error_type: data.error_type || 'UnknownError',
    message: data.message || '',
    resolved: data.resolved ?? false,
    created_at: new Date().toISOString(),
  }),

  getVersions: async (): Promise<AppVersion[]> => [],
  createVersion: async (data: Partial<AppVersion>): Promise<AppVersion> => ({
    id: Math.random().toString(36),
    version: data.version || '0.0.0',
    platform: data.platform || 'all',
    release_notes: data.release_notes,
    force_update: data.force_update ?? false,
    min_required_version: data.min_required_version || '0.0.0',
    is_latest: data.is_latest ?? false,
    released_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }),
  updateVersion: async (id: string, data: Partial<AppVersion>): Promise<AppVersion> => ({
    id,
    version: data.version || '0.0.0',
    platform: data.platform || 'all',
    release_notes: data.release_notes,
    force_update: data.force_update ?? false,
    min_required_version: data.min_required_version || '0.0.0',
    is_latest: data.is_latest ?? false,
    released_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }),
  deleteVersion: async () => {},

  getS3Status: async () => ({ configured: false, bucket: null, region: 'us-east-1', prefix: 'releases' }),
  getPresignedUploadUrl: async (_filename: string) => { throw new Error('S3 not configured'); },
  uploadToS3: async () => {},
};

// Use real API when a key is available, otherwise fall back to mock
export const activeApi: typeof api & typeof mockApi = getApiKey()
  ? (api as unknown as typeof api & typeof mockApi)
  : { ...api, ...mockApi } as unknown as typeof api & typeof mockApi;
