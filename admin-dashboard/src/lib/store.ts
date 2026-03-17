import { create } from 'zustand';
import type {
  DashboardStats,
  VersionDistribution,
  FeatureFlag,
  RemoteConfig,
  Feedback,
  ErrorLog,
  AppVersion,
} from '@/types';

interface DashboardState {
  stats: DashboardStats | null;
  versionDistribution: VersionDistribution[];
  recentFeedback: Feedback[];
  recentErrors: ErrorLog[];
  isLoading: boolean;
  lastUpdated: Date | null;
  fetchDashboard: () => Promise<void>;
}

interface FeatureFlagState {
  flags: FeatureFlag[];
  isLoading: boolean;
  fetchFlags: () => Promise<void>;
  updateFlag: (id: string, data: Partial<FeatureFlag>) => Promise<void>;
  createFlag: (data: Partial<FeatureFlag>) => Promise<void>;
  deleteFlag: (id: string) => Promise<void>;
}

interface RemoteConfigState {
  configs: RemoteConfig[];
  isLoading: boolean;
  fetchConfigs: () => Promise<void>;
  updateConfig: (id: string, data: Partial<RemoteConfig>) => Promise<void>;
  createConfig: (data: Partial<RemoteConfig>) => Promise<void>;
  deleteConfig: (id: string) => Promise<void>;
}

interface FeedbackState {
  items: Feedback[];
  total: number;
  page: number;
  pages: number;
  isLoading: boolean;
  selectedFeedback: Feedback | null;
  fetchFeedback: (params?: { type?: string; status?: string; page?: number }) => Promise<void>;
  updateFeedback: (id: string, data: Partial<Feedback>) => Promise<void>;
  setSelectedFeedback: (feedback: Feedback | null) => void;
}

interface VersionState {
  versions: AppVersion[];
  isLoading: boolean;
  fetchVersions: () => Promise<void>;
  createVersion: (data: Partial<AppVersion>) => Promise<void>;
  updateVersion: (id: string, data: Partial<AppVersion>) => Promise<void>;
  deleteVersion: (id: string) => Promise<void>;
}

interface ErrorState {
  items: ErrorLog[];
  total: number;
  page: number;
  pages: number;
  isLoading: boolean;
  fetchErrors: (params?: { resolved?: boolean; page?: number }) => Promise<void>;
  updateError: (id: string, data: Partial<ErrorLog>) => Promise<void>;
}

interface AuthState {
  apiKey: string;
  setApiKey: (key: string) => void;
}

import { activeApi, api } from './api';

export const useDashboardStore = create<DashboardState>((set) => ({
  stats: null,
  versionDistribution: [],
  recentFeedback: [],
  recentErrors: [],
  isLoading: false,
  lastUpdated: null,

  fetchDashboard: async () => {
    set({ isLoading: true });
    try {
      const [stats, versionDistribution, recentFeedback, recentErrors] = await Promise.all([
        activeApi.getDashboardStats(),
        activeApi.getVersionDistribution(),
        activeApi.getRecentFeedback(5),
        activeApi.getRecentErrors(5),
      ]);
      set({
        stats,
        versionDistribution,
        recentFeedback,
        recentErrors,
        lastUpdated: new Date(),
      });
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      set({ isLoading: false });
    }
  },
}));

export const useFeatureFlagStore = create<FeatureFlagState>((set, get) => ({
  flags: [],
  isLoading: false,

  fetchFlags: async () => {
    set({ isLoading: true });
    try {
      const flags = await activeApi.getFeatureFlags();
      set({ flags });
    } catch (error) {
      console.error('Failed to fetch feature flags:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  updateFlag: async (id, data) => {
    try {
      const updated = await activeApi.updateFeatureFlag(id, data);
      set({
        flags: get().flags.map((f) => (f.id === id ? updated : f)),
      });
    } catch (error) {
      console.error('Failed to update feature flag:', error);
      throw error;
    }
  },

  createFlag: async (data) => {
    try {
      const created = await activeApi.createFeatureFlag(data);
      set({ flags: [...get().flags, created] });
    } catch (error) {
      console.error('Failed to create feature flag:', error);
      throw error;
    }
  },

  deleteFlag: async (id) => {
    try {
      await activeApi.deleteFeatureFlag(id);
      set({ flags: get().flags.filter((f) => f.id !== id) });
    } catch (error) {
      console.error('Failed to delete feature flag:', error);
      throw error;
    }
  },
}));

export const useRemoteConfigStore = create<RemoteConfigState>((set, get) => ({
  configs: [],
  isLoading: false,

  fetchConfigs: async () => {
    set({ isLoading: true });
    try {
      const configs = await activeApi.getRemoteConfig();
      set({ configs });
    } catch (error) {
      console.error('Failed to fetch remote config:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  updateConfig: async (id, data) => {
    try {
      const updated = await activeApi.updateRemoteConfig(id, data);
      set({
        configs: get().configs.map((c) => (c.id === id ? updated : c)),
      });
    } catch (error) {
      console.error('Failed to update remote config:', error);
      throw error;
    }
  },

  createConfig: async (data) => {
    try {
      const created = await activeApi.createRemoteConfig(data);
      set({ configs: [...get().configs, created] });
    } catch (error) {
      console.error('Failed to create remote config:', error);
      throw error;
    }
  },

  deleteConfig: async (id) => {
    try {
      await activeApi.deleteRemoteConfig(id);
      set({ configs: get().configs.filter((c) => c.id !== id) });
    } catch (error) {
      console.error('Failed to delete remote config:', error);
      throw error;
    }
  },
}));

export const useFeedbackStore = create<FeedbackState>((set, get) => ({
  items: [],
  total: 0,
  page: 1,
  pages: 1,
  isLoading: false,
  selectedFeedback: null,

  fetchFeedback: async (params = {}) => {
    set({ isLoading: true });
    try {
      const result = await activeApi.getFeedback(
        params.type as any,
        params.status as any,
        params.page || 1
      );
      set({
        items: result.items,
        total: result.total,
        page: result.page,
        pages: result.pages,
      });
    } catch (error) {
      console.error('Failed to fetch feedback:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  updateFeedback: async (id, data) => {
    try {
      const updated = await activeApi.updateFeedback(id, data);
      set({
        items: get().items.map((f) => (f.id === id ? updated : f)),
        selectedFeedback: get().selectedFeedback?.id === id ? updated : get().selectedFeedback,
      });
    } catch (error) {
      console.error('Failed to update feedback:', error);
      throw error;
    }
  },

  setSelectedFeedback: (feedback) => set({ selectedFeedback: feedback }),
}));

export const useVersionStore = create<VersionState>((set, get) => ({
  versions: [],
  isLoading: false,

  fetchVersions: async () => {
    set({ isLoading: true });
    try {
      const versions = await activeApi.getVersions();
      set({ versions });
    } catch (error) {
      console.error('Failed to fetch versions:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  createVersion: async (data) => {
    try {
      const created = await activeApi.createVersion(data);
      set({ versions: [...get().versions, created] });
    } catch (error) {
      console.error('Failed to create version:', error);
      throw error;
    }
  },

  updateVersion: async (id, data) => {
    try {
      const updated = await activeApi.updateVersion(id, data);
      set({
        versions: get().versions.map((v) => (v.id === id ? updated : v)),
      });
    } catch (error) {
      console.error('Failed to update version:', error);
      throw error;
    }
  },

  deleteVersion: async (id) => {
    try {
      await activeApi.deleteVersion(id);
      set({ versions: get().versions.filter((v) => v.id !== id) });
    } catch (error) {
      console.error('Failed to delete version:', error);
      throw error;
    }
  },
}));

export const useErrorStore = create<ErrorState>((set, get) => ({
  items: [],
  total: 0,
  page: 1,
  pages: 1,
  isLoading: false,

  fetchErrors: async (params = {}) => {
    set({ isLoading: true });
    try {
      const result = await (activeApi as any).getErrors?.(params.resolved, params.page || 1) ?? { items: [], total: 0, page: 1, pages: 1 };
      set({
        items: result.items,
        total: result.total,
        page: result.page,
        pages: result.pages,
      });
    } catch (error) {
      console.error('Failed to fetch errors:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  updateError: async (id, data) => {
    try {
      const updated = await (activeApi as any).updateError?.(id, data) ?? data;
      set({
        items: get().items.map((e) => (e.id === id ? updated : e)),
      });
    } catch (error) {
      console.error('Failed to update error:', error);
      throw error;
    }
  },
}));

export const useAuthStore = create<AuthState>((set) => ({
  apiKey: localStorage.getItem('admin_api_key') || '',
  setApiKey: (key) => {
    api.setApiKey(key); // updates localStorage + any future requests
    set({ apiKey: key });
  },
}));
