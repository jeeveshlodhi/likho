/**
 * Settings types and interfaces for the application
 */

export type ThemeType = 'light' | 'dark' | 'system';
export type FontSize = 'small' | 'medium' | 'large';
export type Density = 'compact' | 'comfortable' | 'spacious';

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  fullName: string;
  avatarUrl: string | null;
  bio: string;
  timezone: string;
  locale: string;
}

export interface NotificationSettings {
  email: {
    mentions: boolean;
    comments: boolean;
    shares: boolean;
    pageUpdates: boolean;
    workspaceUpdates: boolean;
    digest: 'daily' | 'weekly' | 'never';
  };
  push: {
    mentions: boolean;
    comments: boolean;
    shares: boolean;
    reminders: boolean;
    enabled: boolean;
  };
  inApp: {
    mentions: boolean;
    comments: boolean;
    shares: boolean;
    pageUpdates: boolean;
    workspaceUpdates: boolean;
  };
}

export interface EditorSettings {
  defaultFontSize: FontSize;
  defaultLineHeight: number;
  spellCheck: boolean;
  autoSave: boolean;
  autoSaveInterval: number; // seconds
  showWordCount: boolean;
  showReadingTime: boolean;
  defaultPageTemplate: string;
  enableSlashCommands: boolean;
  enableAIAssistance: boolean;
}

export interface AppearanceSettings {
  theme: ThemeType;
  sidebarWidth: number;
  sidebarCollapsed: boolean;
  density: Density;
  accentColor: string;
  reducedMotion: boolean;
  highContrast: boolean;
  codeBlockTheme: 'light' | 'dark' | 'system';
  showBreadcrumbs: boolean;
  showPageIcon: boolean;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'workspace' | 'private';
  showEmail: boolean;
  allowSearchEngines: boolean;
  dataCollection: boolean;
  analyticsOptIn: boolean;
}

export interface WorkspaceSettings {
  id: string;
  name: string;
  icon: string | null;
  defaultSpace: 'online' | 'offline';
  allowGuests: boolean;
  memberLimit: number;
  storageLimit: number; // bytes
  publicSharing: boolean;
  allowComments: boolean;
  allowTemplates: boolean;
}

export interface IntegrationSettings {
  connectedApps: {
    id: string;
    name: string;
    icon: string;
    connected: boolean;
    lastUsed: string | null;
  }[];
  apiKeys: {
    id: string;
    name: string;
    keyPreview: string;
    createdAt: string;
    lastUsed: string | null;
    scopes: string[];
  }[];
  webhooks: {
    id: string;
    url: string;
    events: string[];
    active: boolean;
    createdAt: string;
  }[];
}

export interface ShortcutSettings {
  shortcuts: Record<string, string>;
  vimMode: boolean;
  customShortcuts: Record<string, string>;
}

export interface AdvancedSettings {
  developerMode: boolean;
  experimentalFeatures: string[];
  cacheSize: number;
  clearCacheOnExit: boolean;
  exportFormat: 'markdown' | 'html' | 'pdf' | 'json';
  backupEnabled: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
}

export interface SettingsState {
  profile: UserProfile;
  notifications: NotificationSettings;
  editor: EditorSettings;
  appearance: AppearanceSettings;
  privacy: PrivacySettings;
  workspace: WorkspaceSettings;
  integrations: IntegrationSettings;
  shortcuts: ShortcutSettings;
  advanced: AdvancedSettings;
}

export type SettingsSection =
  | 'account'
  | 'appearance'
  | 'notifications'
  | 'editor'
  | 'privacy'
  | 'workspace'
  | 'integrations'
  | 'shortcuts'
  | 'advanced';

export interface SettingsSectionInfo {
  id: SettingsSection;
  label: string;
  description: string;
  icon: string;
}
