import { invoke } from "@tauri-apps/api/core";
import { listen, Event } from "@tauri-apps/api/event";
import { Store } from "@tauri-apps/plugin-store";

// Update information from the backend
export interface UpdateInfo {
  version: string;
  current_version: string;
  notes?: string;
  pub_date?: string;
  mandatory: boolean;
}

// Update check response
export interface UpdateCheckResponse {
  available: boolean;
  info?: UpdateInfo;
  error?: string;
}

// Update state
export interface UpdaterState {
  checking: boolean;
  updateAvailable: UpdateInfo | null;
  downloadProgress: number;
  downloading: boolean;
  error: string | null;
}

// Store keys
const SETTINGS_STORE = "app-settings.json";
const LAST_CHECK_KEY = "last_update_check";
const SKIPPED_VERSION_KEY = "skipped_version";
const AUTO_CHECK_KEY = "auto_update_check";

// Event listeners
let unlistenProgress: (() => void) | null = null;
let unlistenFinished: (() => void) | null = null;

/**
 * Initialize the updater service
 */
export async function initUpdater(): Promise<void> {
  // Listen for download progress events
  unlistenProgress = await listen<number>(
    "update-download-progress",
    (event: Event<number>) => {
      console.log(`Download progress: ${event.payload}%`);
    }
  );

  // Listen for download finished events
  unlistenFinished = await listen(
    "update-download-finished",
    () => {
      console.log("Download finished");
    }
  );

  // Schedule periodic checks if enabled
  const autoCheck = await isAutoCheckEnabled();
  if (autoCheck) {
    await checkUpdateOnStartup();
  }
}

/**
 * Cleanup event listeners
 */
export function cleanupUpdater(): void {
  unlistenProgress?.();
  unlistenFinished?.();
}

/**
 * Check for updates
 */
export async function checkForUpdates(): Promise<UpdateCheckResponse> {
  try {
    const result = await invoke<UpdateCheckResponse>("check_update");
    await setLastCheckTime();
    return result;
  } catch (error) {
    console.error("Failed to check for updates:", error);
    return {
      available: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Check for updates on app startup
 * Respects the skipped version setting
 */
export async function checkUpdateOnStartup(): Promise<void> {
  // Don't check if we already checked recently (within 1 hour)
  const lastCheck = await getLastCheckTime();
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  
  if (lastCheck && lastCheck.getTime() > oneHourAgo) {
    console.log("Skipping update check - checked recently");
    return;
  }

  const result = await checkForUpdates();
  
  if (result.available && result.info) {
    const skippedVersion = await getSkippedVersion();
    
    if (result.info.version === skippedVersion) {
      console.log(`Skipping update to ${skippedVersion} - user chose to skip`);
      return;
    }
    
    // Emit an event that the UI can listen for
    window.dispatchEvent(
      new CustomEvent("update-available", { detail: result.info })
    );
  }
}

/**
 * Download and install update
 */
export async function installUpdate(): Promise<void> {
  try {
    await invoke("install_update");
    // App will restart automatically after installation
  } catch (error) {
    console.error("Failed to install update:", error);
    throw error;
  }
}

/**
 * Skip a specific version
 */
export async function skipVersion(version: string): Promise<void> {
  const store = await Store.load(SETTINGS_STORE);
  await store.set(SKIPPED_VERSION_KEY, version);
  await store.save();
}

/**
 * Get the skipped version
 */
export async function getSkippedVersion(): Promise<string | null> {
  const store = await Store.load(SETTINGS_STORE);
  return await store.get<string>(SKIPPED_VERSION_KEY) || null;
}

/**
 * Clear the skipped version
 */
export async function clearSkippedVersion(): Promise<void> {
  const store = await Store.load(SETTINGS_STORE);
  await store.delete(SKIPPED_VERSION_KEY);
  await store.save();
}

/**
 * Set last check time
 */
async function setLastCheckTime(): Promise<void> {
  const store = await Store.load(SETTINGS_STORE);
  await store.set(LAST_CHECK_KEY, new Date().toISOString());
  await store.save();
}

/**
 * Get last check time
 */
async function getLastCheckTime(): Promise<Date | null> {
  const store = await Store.load(SETTINGS_STORE);
  const lastCheck = await store.get<string>(LAST_CHECK_KEY);
  return lastCheck ? new Date(lastCheck) : null;
}

/**
 * Check if auto-check is enabled
 */
export async function isAutoCheckEnabled(): Promise<boolean> {
  const store = await Store.load(SETTINGS_STORE);
  const value = await store.get<boolean>(AUTO_CHECK_KEY);
  return value !== false; // Default to true
}

/**
 * Set auto-check enabled
 */
export async function setAutoCheckEnabled(enabled: boolean): Promise<void> {
  const store = await Store.load(SETTINGS_STORE);
  await store.set(AUTO_CHECK_KEY, enabled);
  await store.save();
}

/**
 * Get current app version
 */
export async function getAppVersion(): Promise<string> {
  return await invoke<string>("get_app_version");
}

/**
 * Get app name
 */
export async function getAppName(): Promise<string> {
  return await invoke<string>("get_app_name");
}

/**
 * Get platform info
 */
export async function getPlatformInfo(): Promise<{
  os: string;
  arch: string;
  family: string;
}> {
  return await invoke("get_platform_info");
}

/**
 * Compare two semantic versions
 * Returns: -1 if v1 < v2, 0 if equal, 1 if v1 > v2
 */
export function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split(".").map(Number);
  const parts2 = v2.split(".").map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    
    if (p1 < p2) return -1;
    if (p1 > p2) return 1;
  }
  
  return 0;
}

/**
 * Check if version is newer than current
 */
export function isNewerVersion(current: string, candidate: string): boolean {
  return compareVersions(candidate, current) > 0;
}

// Default export
export default {
  initUpdater,
  cleanupUpdater,
  checkForUpdates,
  installUpdate,
  skipVersion,
  getSkippedVersion,
  clearSkippedVersion,
  isAutoCheckEnabled,
  setAutoCheckEnabled,
  getAppVersion,
  getAppName,
  getPlatformInfo,
  compareVersions,
  isNewerVersion,
};
