import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as settingsApi from '@/lib/settingsApi';
import type {
  SettingsState,
  UserProfile,
  NotificationSettings,
  EditorSettings,
  AppearanceSettings,
  PrivacySettings,
  WorkspaceSettings,
  IntegrationSettings,
  ShortcutSettings,
  AdvancedSettings,
} from '@/types/settings';

interface SettingsStore extends SettingsState {
  // Loading states
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  lastSyncedAt: string | null;

  // Profile actions
  updateProfile: (updates: Partial<UserProfile>) => void;
  saveProfileToBackend: () => Promise<boolean>;

  // Notification actions
  updateNotificationSettings: (updates: Partial<NotificationSettings>) => void;
  updateEmailNotification: (key: keyof NotificationSettings['email'], value: boolean | string) => void;
  updatePushNotification: (key: keyof NotificationSettings['push'], value: boolean) => void;
  updateInAppNotification: (key: keyof NotificationSettings['inApp'], value: boolean) => void;
  saveNotificationSettingsToBackend: () => Promise<boolean>;

  // Editor actions
  updateEditorSettings: (updates: Partial<EditorSettings>) => void;
  saveEditorSettingsToBackend: () => Promise<boolean>;

  // Appearance actions
  updateAppearanceSettings: (updates: Partial<AppearanceSettings>) => void;
  setTheme: (theme: AppearanceSettings['theme']) => void;
  setAccentColor: (color: string) => void;
  setDensity: (density: AppearanceSettings['density']) => void;
  saveAppearanceSettingsToBackend: () => Promise<boolean>;

  // Privacy actions
  updatePrivacySettings: (updates: Partial<PrivacySettings>) => void;
  savePrivacySettingsToBackend: () => Promise<boolean>;

  // Workspace actions
  updateWorkspaceSettings: (updates: Partial<WorkspaceSettings>) => void;
  saveWorkspaceSettingsToBackend: () => Promise<boolean>;

  // Integration actions
  addApiKey: (name: string, keyPreview: string, scopes: string[]) => string;
  revokeApiKey: (id: string) => void;
  addWebhook: (url: string, events: string[]) => string;
  removeWebhook: (id: string) => void;
  toggleWebhook: (id: string) => void;

  // Shortcut actions
  updateShortcut: (action: string, shortcut: string) => void;
  resetShortcuts: () => void;
  toggleVimMode: () => void;

  // Advanced actions
  updateAdvancedSettings: (updates: Partial<AdvancedSettings>) => void;
  toggleExperimentalFeature: (feature: string) => void;
  clearCache: () => void;

  // Backend sync actions
  syncFromBackend: () => Promise<boolean>;
  saveAllSettingsToBackend: () => Promise<boolean>;

  // Reset
  resetSettings: () => void;
}

const defaultSettings: SettingsState = {
  profile: {
    id: '',
    email: '',
    username: '',
    fullName: '',
    avatarUrl: null,
    bio: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    locale: navigator.language,
  },
  notifications: {
    email: {
      mentions: true,
      comments: true,
      shares: true,
      pageUpdates: false,
      workspaceUpdates: true,
      digest: 'weekly',
    },
    push: {
      mentions: true,
      comments: true,
      shares: true,
      reminders: true,
      enabled: true,
    },
    inApp: {
      mentions: true,
      comments: true,
      shares: true,
      pageUpdates: true,
      workspaceUpdates: true,
    },
  },
  editor: {
    defaultFontSize: 'medium',
    defaultLineHeight: 1.6,
    spellCheck: true,
    autoSave: true,
    autoSaveInterval: 30,
    showWordCount: true,
    showReadingTime: true,
    defaultPageTemplate: 'note',
    enableSlashCommands: true,
    enableAIAssistance: true,
  },
  appearance: {
    theme: 'system',
    sidebarWidth: 260,
    sidebarCollapsed: false,
    density: 'comfortable',
    accentColor: '#3b82f6',
    reducedMotion: false,
    highContrast: false,
    codeBlockTheme: 'system',
    showBreadcrumbs: true,
    showPageIcon: true,
  },
  privacy: {
    profileVisibility: 'workspace',
    showEmail: false,
    allowSearchEngines: false,
    dataCollection: true,
    analyticsOptIn: true,
  },
  workspace: {
    id: '',
    name: 'My Workspace',
    icon: null,
    defaultSpace: 'online',
    allowGuests: true,
    memberLimit: 5,
    storageLimit: 10737418240, // 10GB
    publicSharing: false,
    allowComments: true,
    allowTemplates: true,
  },
  integrations: {
    connectedApps: [],
    apiKeys: [],
    webhooks: [],
  },
  shortcuts: {
    shortcuts: {
      'new-page': 'Cmd+N',
      'search': 'Cmd+K',
      'command-palette': 'Cmd+Shift+P',
      'save': 'Cmd+S',
      'bold': 'Cmd+B',
      'italic': 'Cmd+I',
      'underline': 'Cmd+U',
      'strikethrough': 'Cmd+Shift+X',
      'link': 'Cmd+K',
      'code': 'Cmd+E',
      'heading-1': 'Cmd+Alt+1',
      'heading-2': 'Cmd+Alt+2',
      'heading-3': 'Cmd+Alt+3',
      'bullet-list': 'Cmd+Shift+8',
      'numbered-list': 'Cmd+Shift+7',
      'todo-list': 'Cmd+Shift+4',
      'quote': 'Cmd+Shift+>',
      'divider': 'Cmd+Shift+-',
    },
    vimMode: false,
    customShortcuts: {},
  },
  advanced: {
    developerMode: false,
    experimentalFeatures: [],
    cacheSize: 0,
    clearCacheOnExit: false,
    exportFormat: 'markdown',
    backupEnabled: true,
    backupFrequency: 'weekly',
  },
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      ...defaultSettings,

      // Loading states
      isLoading: false,
      isSaving: false,
      error: null,
      lastSyncedAt: null,

      // Profile actions
      updateProfile: (updates) =>
        set((state) => ({
          profile: { ...state.profile, ...updates },
        })),

      saveProfileToBackend: async () => {
        const state = get();
        set({ isSaving: true, error: null });

        try {
          await settingsApi.updateUserProfile({
            full_name: state.profile.fullName,
            username: state.profile.username,
            avatar_url: state.profile.avatarUrl,
            bio: state.profile.bio,
          });

          // Also save timezone and locale as preferences
          await settingsApi.updateUserPreferences({
            timezone: state.profile.timezone,
            locale: state.profile.locale,
          });

          set({ isSaving: false, lastSyncedAt: new Date().toISOString() });
          return true;
        } catch (error) {
          set({
            isSaving: false,
            error: error instanceof Error ? error.message : 'Failed to save profile',
          });
          return false;
        }
      },

      // Notification actions
      updateNotificationSettings: (updates) =>
        set((state) => ({
          notifications: { ...state.notifications, ...updates },
        })),

      updateEmailNotification: (key, value) =>
        set((state) => ({
          notifications: {
            ...state.notifications,
            email: { ...state.notifications.email, [key]: value },
          },
        })),

      updatePushNotification: (key, value) =>
        set((state) => ({
          notifications: {
            ...state.notifications,
            push: { ...state.notifications.push, [key]: value },
          },
        })),

      updateInAppNotification: (key, value) =>
        set((state) => ({
          notifications: {
            ...state.notifications,
            inApp: { ...state.notifications.inApp, [key]: value },
          },
        })),

      saveNotificationSettingsToBackend: async () => {
        const state = get();
        set({ isSaving: true, error: null });

        try {
          await settingsApi.saveNotificationSettings(state.notifications);
          set({ isSaving: false, lastSyncedAt: new Date().toISOString() });
          return true;
        } catch (error) {
          set({
            isSaving: false,
            error: error instanceof Error ? error.message : 'Failed to save notification settings',
          });
          return false;
        }
      },

      // Editor actions
      updateEditorSettings: (updates) =>
        set((state) => ({
          editor: { ...state.editor, ...updates },
        })),

      saveEditorSettingsToBackend: async () => {
        const state = get();
        set({ isSaving: true, error: null });

        try {
          await settingsApi.saveEditorSettings(state.editor);
          set({ isSaving: false, lastSyncedAt: new Date().toISOString() });
          return true;
        } catch (error) {
          set({
            isSaving: false,
            error: error instanceof Error ? error.message : 'Failed to save editor settings',
          });
          return false;
        }
      },

      // Appearance actions
      updateAppearanceSettings: (updates) =>
        set((state) => ({
          appearance: { ...state.appearance, ...updates },
        })),

      setTheme: (theme) =>
        set((state) => ({
          appearance: { ...state.appearance, theme },
        })),

      setAccentColor: (accentColor) =>
        set((state) => ({
          appearance: { ...state.appearance, accentColor },
        })),

      setDensity: (density) =>
        set((state) => ({
          appearance: { ...state.appearance, density },
        })),

      saveAppearanceSettingsToBackend: async () => {
        const state = get();
        set({ isSaving: true, error: null });

        try {
          await Promise.all([
            settingsApi.saveAppearanceSettings(state.appearance),
            settingsApi.updateUserPreferences({ theme: state.appearance.theme }),
          ]);
          set({ isSaving: false, lastSyncedAt: new Date().toISOString() });
          return true;
        } catch (error) {
          set({
            isSaving: false,
            error: error instanceof Error ? error.message : 'Failed to save appearance settings',
          });
          return false;
        }
      },

      // Privacy actions
      updatePrivacySettings: (updates) =>
        set((state) => ({
          privacy: { ...state.privacy, ...updates },
        })),

      savePrivacySettingsToBackend: async () => {
        const state = get();
        set({ isSaving: true, error: null });

        try {
          await settingsApi.savePrivacySettings(state.privacy);
          set({ isSaving: false, lastSyncedAt: new Date().toISOString() });
          return true;
        } catch (error) {
          set({
            isSaving: false,
            error: error instanceof Error ? error.message : 'Failed to save privacy settings',
          });
          return false;
        }
      },

      // Workspace actions
      updateWorkspaceSettings: (updates) =>
        set((state) => ({
          workspace: { ...state.workspace, ...updates },
        })),

      saveWorkspaceSettingsToBackend: async () => {
        const state = get();
        set({ isSaving: true, error: null });

        try {
          await settingsApi.saveWorkspaceSettings(state.workspace);
          set({ isSaving: false, lastSyncedAt: new Date().toISOString() });
          return true;
        } catch (error) {
          set({
            isSaving: false,
            error: error instanceof Error ? error.message : 'Failed to save workspace settings',
          });
          return false;
        }
      },

      // Integration actions
      addApiKey: (name, keyPreview, scopes) => {
        const id = crypto.randomUUID();
        set((state) => ({
          integrations: {
            ...state.integrations,
            apiKeys: [
              ...state.integrations.apiKeys,
              {
                id,
                name,
                keyPreview,
                createdAt: new Date().toISOString(),
                lastUsed: null,
                scopes,
              },
            ],
          },
        }));
        return id;
      },

      revokeApiKey: (id) =>
        set((state) => ({
          integrations: {
            ...state.integrations,
            apiKeys: state.integrations.apiKeys.filter((k) => k.id !== id),
          },
        })),

      addWebhook: (url, events) => {
        const id = crypto.randomUUID();
        set((state) => ({
          integrations: {
            ...state.integrations,
            webhooks: [
              ...state.integrations.webhooks,
              {
                id,
                url,
                events,
                active: true,
                createdAt: new Date().toISOString(),
              },
            ],
          },
        }));
        return id;
      },

      removeWebhook: (id) =>
        set((state) => ({
          integrations: {
            ...state.integrations,
            webhooks: state.integrations.webhooks.filter((w) => w.id !== id),
          },
        })),

      toggleWebhook: (id) =>
        set((state) => ({
          integrations: {
            ...state.integrations,
            webhooks: state.integrations.webhooks.map((w) =>
              w.id === id ? { ...w, active: !w.active } : w
            ),
          },
        })),

      // Shortcut actions
      updateShortcut: (action, shortcut) =>
        set((state) => ({
          shortcuts: {
            ...state.shortcuts,
            shortcuts: { ...state.shortcuts.shortcuts, [action]: shortcut },
          },
        })),

      resetShortcuts: () =>
        set((state) => ({
          shortcuts: {
            ...state.shortcuts,
            shortcuts: defaultSettings.shortcuts.shortcuts,
            customShortcuts: {},
          },
        })),

      toggleVimMode: () =>
        set((state) => ({
          shortcuts: {
            ...state.shortcuts,
            vimMode: !state.shortcuts.vimMode,
          },
        })),

      // Advanced actions
      updateAdvancedSettings: (updates) =>
        set((state) => ({
          advanced: { ...state.advanced, ...updates },
        })),

      toggleExperimentalFeature: (feature) =>
        set((state) => {
          const features = state.advanced.experimentalFeatures;
          const newFeatures = features.includes(feature)
            ? features.filter((f) => f !== feature)
            : [...features, feature];
          return {
            advanced: {
              ...state.advanced,
              experimentalFeatures: newFeatures,
            },
          };
        }),

      clearCache: () => {
        // Clear localStorage except for settings
        const settings = localStorage.getItem('settings-storage');
        localStorage.clear();
        if (settings) {
          localStorage.setItem('settings-storage', settings);
        }
        set((state) => ({
          advanced: { ...state.advanced, cacheSize: 0 },
        }));
      },

      // Backend sync actions
      syncFromBackend: async () => {
        set({ isLoading: true, error: null });

        try {
          const { profile, preferences } = await settingsApi.syncSettingsFromBackend();

          // Map backend profile to frontend profile
          const mappedProfile: UserProfile = {
            id: String(profile.id),
            email: profile.email,
            username: profile.username || '',
            fullName: profile.full_name || '',
            avatarUrl: profile.avatar_url,
            bio: profile.bio || '',
            timezone: profile.timezone,
            locale: profile.locale,
          };

          // Update profile
          set((state) => ({
            profile: mappedProfile,
            // Also update theme from backend if present
            appearance: {
              ...state.appearance,
              theme: profile.theme,
            },
            isLoading: false,
            lastSyncedAt: new Date().toISOString(),
          }));

          // Merge preferences from backend
          if (preferences.notifications) {
            set((state) => ({
              notifications: { ...state.notifications, ...preferences.notifications },
            }));
          }
          if (preferences.editor) {
            set((state) => ({
              editor: { ...state.editor, ...preferences.editor },
            }));
          }
          if (preferences.appearance) {
            set((state) => ({
              appearance: { ...state.appearance, ...preferences.appearance },
            }));
          }
          if (preferences.privacy) {
            set((state) => ({
              privacy: { ...state.privacy, ...preferences.privacy },
            }));
          }
          if (preferences.workspace) {
            set((state) => ({
              workspace: { ...state.workspace, ...preferences.workspace },
            }));
          }

          return true;
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to sync settings',
          });
          return false;
        }
      },

      saveAllSettingsToBackend: async () => {
        const state = get();
        set({ isSaving: true, error: null });

        try {
          await Promise.all([
            settingsApi.updateUserProfile({
              full_name: state.profile.fullName,
              username: state.profile.username,
              avatar_url: state.profile.avatarUrl,
              bio: state.profile.bio,
            }),
            settingsApi.updateUserPreferences({
              timezone: state.profile.timezone,
              locale: state.profile.locale,
              theme: state.appearance.theme,
            }),
            settingsApi.saveNotificationSettings(state.notifications),
            settingsApi.saveEditorSettings(state.editor),
            settingsApi.saveAppearanceSettings(state.appearance),
            settingsApi.savePrivacySettings(state.privacy),
            settingsApi.saveWorkspaceSettings(state.workspace),
          ]);

          set({ isSaving: false, lastSyncedAt: new Date().toISOString() });
          return true;
        } catch (error) {
          set({
            isSaving: false,
            error: error instanceof Error ? error.message : 'Failed to save settings',
          });
          return false;
        }
      },

      // Reset all settings
      resetSettings: () =>
        set({
          ...defaultSettings,
          isLoading: false,
          isSaving: false,
          error: null,
          lastSyncedAt: null,
        }),
    }),
    {
      name: 'settings-storage',
      partialize: (state) => ({
        notifications: state.notifications,
        editor: state.editor,
        appearance: state.appearance,
        privacy: state.privacy,
        shortcuts: state.shortcuts,
        advanced: state.advanced,
      }),
    }
  )
);
