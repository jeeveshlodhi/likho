import { api } from "./api";
import type {
  NotificationSettings,
  EditorSettings,
  AppearanceSettings,
  PrivacySettings,
  WorkspaceSettings,
} from "@/types/settings";

// User Profile Types
export interface UserProfileUpdate {
  full_name?: string;
  username?: string;
  avatar_url?: string | null;
  bio?: string;
}

export interface UserPreferencesUpdate {
  timezone?: string;
  locale?: string;
  theme?: "light" | "dark" | "system";
}

export interface UserResponse {
  id: string;
  email: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  timezone: string;
  locale: string;
  theme: "light" | "dark" | "system";
  email_verified: boolean;
  is_active: boolean;
  storage_used: number;
  storage_limit: number;
  created_at: string;
  updated_at: string;
}

// Get current user profile
export async function getCurrentUser(): Promise<UserResponse> {
  const { data } = await api.get<UserResponse>("/users/me");
  return data;
}

// Update user profile
export async function updateUserProfile(
  updates: UserProfileUpdate
): Promise<UserResponse> {
  const { data } = await api.put<UserResponse>("/users/me", updates);
  return data;
}

// Update user preferences (timezone, locale, theme)
export async function updateUserPreferences(
  updates: UserPreferencesUpdate
): Promise<UserResponse> {
  const { data } = await api.patch<UserResponse>("/users/me/preferences", updates);
  return data;
}

// Get all user preferences (arbitrary key-value storage)
export async function getAllPreferences(): Promise<Record<string, unknown>> {
  const { data } = await api.get<Record<string, unknown>>("/users/me/preferences/all");
  return data;
}

// Get a specific preference
export async function getPreference<T = unknown>(key: string): Promise<T | null> {
  try {
    const { data } = await api.get<{ key: string; value: T }>(
      `/users/me/preferences/${key}`
    );
    return data.value;
  } catch (error) {
    if ((error as { response?: { status: number } }).response?.status === 404) {
      return null;
    }
    throw error;
  }
}

// Set a preference
export async function setPreference<T = unknown>(
  key: string,
  value: T
): Promise<void> {
  await api.post(`/users/me/preferences/${key}`, value);
}

// Delete a preference
export async function deletePreference(key: string): Promise<void> {
  await api.delete(`/users/me/preferences/${key}`);
}

// Convenience functions for specific settings

// Save notification settings
export async function saveNotificationSettings(
  settings: NotificationSettings
): Promise<void> {
  await setPreference("notifications", settings);
}

// Load notification settings
export async function loadNotificationSettings(): Promise<NotificationSettings | null> {
  return getPreference<NotificationSettings>("notifications");
}

// Save editor settings
export async function saveEditorSettings(settings: EditorSettings): Promise<void> {
  await setPreference("editor", settings);
}

// Load editor settings
export async function loadEditorSettings(): Promise<EditorSettings | null> {
  return getPreference<EditorSettings>("editor");
}

// Save appearance settings
export async function saveAppearanceSettings(
  settings: AppearanceSettings
): Promise<void> {
  await setPreference("appearance", settings);
}

// Load appearance settings
export async function loadAppearanceSettings(): Promise<AppearanceSettings | null> {
  return getPreference<AppearanceSettings>("appearance");
}

// Save privacy settings
export async function savePrivacySettings(settings: PrivacySettings): Promise<void> {
  await setPreference("privacy", settings);
}

// Load privacy settings
export async function loadPrivacySettings(): Promise<PrivacySettings | null> {
  return getPreference<PrivacySettings>("privacy");
}

// Save workspace settings
export async function saveWorkspaceSettings(
  settings: WorkspaceSettings
): Promise<void> {
  await setPreference("workspace", settings);
}

// Load workspace settings
export async function loadWorkspaceSettings(): Promise<WorkspaceSettings | null> {
  return getPreference<WorkspaceSettings>("workspace");
}

// Sync all settings from backend
export async function syncSettingsFromBackend(): Promise<{
  profile: UserResponse;
  preferences: Record<string, unknown>;
}> {
  const [profile, preferences] = await Promise.all([
    getCurrentUser(),
    getAllPreferences(),
  ]);
  return { profile, preferences };
}
