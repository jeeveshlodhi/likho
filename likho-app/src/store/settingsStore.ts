import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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
  // Profile actions
  updateProfile: (updates: Partial<UserProfile>) => void;
  
  // Notification actions
  updateNotificationSettings: (updates: Partial<NotificationSettings>) => void;
  updateEmailNotification: (key: keyof NotificationSettings['email'], value: boolean | string) => void;
  updatePushNotification: (key: keyof NotificationSettings['push'], value: boolean) => void;
  updateInAppNotification: (key: keyof NotificationSettings['inApp'], value: boolean) => void;
  
  // Editor actions
  updateEditorSettings: (updates: Partial<EditorSettings>) => void;
  
  // Appearance actions
  updateAppearanceSettings: (updates: Partial<AppearanceSettings>) => void;
  setTheme: (theme: AppearanceSettings['theme']) => void;
  setAccentColor: (color: string) => void;
  setDensity: (density: AppearanceSettings['density']) => void;
  
  // Privacy actions
  updatePrivacySettings: (updates: Partial<PrivacySettings>) => void;
  
  // Workspace actions
  updateWorkspaceSettings: (updates: Partial<WorkspaceSettings>) => void;
  
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

      // Profile actions
      updateProfile: (updates) =>
        set((state) => ({
          profile: { ...state.profile, ...updates },
        })),

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

      // Editor actions
      updateEditorSettings: (updates) =>
        set((state) => ({
          editor: { ...state.editor, ...updates },
        })),

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

      // Privacy actions
      updatePrivacySettings: (updates) =>
        set((state) => ({
          privacy: { ...state.privacy, ...updates },
        })),

      // Workspace actions
      updateWorkspaceSettings: (updates) =>
        set((state) => ({
          workspace: { ...state.workspace, ...updates },
        })),

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

      // Reset all settings
      resetSettings: () => set(defaultSettings),
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
