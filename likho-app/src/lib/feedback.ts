import { invoke } from "@tauri-apps/api/core";
import { Store } from "@tauri-apps/plugin-store";
import { getCurrentWindow } from "@tauri-apps/api/window";

// Feedback types
export type FeedbackType = "bug" | "feature" | "praise" | "other";

// Feedback data structure
export interface FeedbackData {
  type: FeedbackType;
  message: string;
  email?: string;
  includeScreenshot: boolean;
  screenshotData?: string;
  metadata?: Record<string, unknown>;
}

// System info for feedback
export interface SystemInfo {
  appVersion: string;
  platform: string;
  arch: string;
  osVersion?: string;
  timestamp: string;
}

// Store keys
const SETTINGS_STORE = "app-settings.json";
const FEEDBACK_OPT_IN_KEY = "feedback_opt_in";

// API endpoint (configurable)
const FEEDBACK_API_URL = import.meta.env.VITE_FEEDBACK_API_URL || 
  "https://api.likho.app/api/v1/feedback";
const ERROR_API_URL = import.meta.env.VITE_ERROR_API_URL || 
  "https://api.likho.app/api/v1/errors";

/**
 * Submit feedback to the backend
 */
export async function submitFeedback(data: FeedbackData): Promise<{ success: boolean; error?: string }> {
  try {
    const systemInfo = await getSystemInfo();
    
    const payload = {
      ...data,
      app_version: systemInfo.appVersion,
      platform: systemInfo.platform,
      arch: systemInfo.arch,
      os_version: systemInfo.osVersion,
      timestamp: systemInfo.timestamp,
    };

    // Try to send to backend
    try {
      const response = await fetch(FEEDBACK_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return { success: true };
    } catch (apiError) {
      console.warn("Failed to send feedback to API, storing locally:", apiError);
      
      // Store locally for later sync
      await storeFeedbackLocally(payload);
      
      // Still return success to user
      return { success: true };
    }
  } catch (error) {
    console.error("Failed to submit feedback:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

/**
 * Capture a screenshot of the current window
 */
export async function captureScreenshot(): Promise<string | null> {
  try {
    // Get the current window
    const window = getCurrentWindow();
    
    // Use Tauri's screenshot API
    // Note: This requires the `screenshot` permission in tauri.conf.json
    const response = await window.capture();
    
    // Convert to base64 for transmission
    // The response is a PNG in bytes, we need to convert it
    const base64 = btoa(
      new Uint8Array(response).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ""
      )
    );
    
    return `data:image/png;base64,${base64}`;
  } catch (error) {
    console.error("Failed to capture screenshot:", error);
    return null;
  }
}

/**
 * Get system information for feedback context
 */
export async function getSystemInfo(): Promise<SystemInfo> {
  const platform = await invoke<{ os: string; arch: string; family: string }>(
    "get_platform_info"
  );
  const version = await invoke<string>("get_app_version");

  return {
    appVersion: version,
    platform: platform.os,
    arch: platform.arch,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Store feedback locally for later sync
 */
async function storeFeedbackLocally(data: unknown): Promise<void> {
  const store = await Store.load("pending-feedback.json");
  const pending = (await store.get<unknown[]>("feedback")) || [];
  pending.push({
    ...data,
    stored_at: new Date().toISOString(),
  });
  await store.set("feedback", pending);
  await store.save();
}

/**
 * Sync pending feedback to the server
 */
export async function syncPendingFeedback(): Promise<void> {
  const store = await Store.load("pending-feedback.json");
  const pending = (await store.get<unknown[]>("feedback")) || [];
  
  if (pending.length === 0) return;

  const successful: number[] = [];

  for (let i = 0; i < pending.length; i++) {
    try {
      const response = await fetch(FEEDBACK_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(pending[i]),
      });

      if (response.ok) {
        successful.push(i);
      }
    } catch (error) {
      console.warn("Failed to sync feedback item:", error);
    }
  }

  // Remove successfully synced items
  const remaining = pending.filter((_, i) => !successful.includes(i));
  await store.set("feedback", remaining);
  await store.save();
}

/**
 * Submit an error report
 */
export async function submitErrorReport(
  error: Error,
  context?: Record<string, unknown>
): Promise<void> {
  try {
    const systemInfo = await getSystemInfo();
    
    const payload = {
      error_type: error.name,
      message: error.message,
      stack_trace: error.stack,
      app_version: systemInfo.appVersion,
      platform: systemInfo.platform,
      arch: systemInfo.arch,
      context,
      timestamp: systemInfo.timestamp,
    };

    // Send to backend (fire and forget)
    fetch(ERROR_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }).catch((err) => {
      console.warn("Failed to send error report:", err);
    });
  } catch (e) {
    console.error("Failed to submit error report:", e);
  }
}

/**
 * Check if user has opted into feedback collection
 */
export async function isFeedbackOptedIn(): Promise<boolean> {
  const store = await Store.load(SETTINGS_STORE);
  const value = await store.get<boolean>(FEEDBACK_OPT_IN_KEY);
  return value === true;
}

/**
 * Set feedback opt-in preference
 */
export async function setFeedbackOptIn(optIn: boolean): Promise<void> {
  const store = await Store.load(SETTINGS_STORE);
  await store.set(FEEDBACK_OPT_IN_KEY, optIn);
  await store.save();
}

/**
 * Track a feature usage event (lightweight analytics)
 */
export async function trackEvent(
  eventName: string,
  properties?: Record<string, unknown>
): Promise<void> {
  // Only track if user opted in
  const optedIn = await isFeedbackOptedIn();
  if (!optedIn) return;

  try {
    const systemInfo = await getSystemInfo();
    
    const event = {
      event_name: eventName,
      properties,
      app_version: systemInfo.appVersion,
      platform: systemInfo.platform,
      timestamp: systemInfo.timestamp,
    };

    // Fire and forget
    fetch(`${FEEDBACK_API_URL}/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    }).catch(() => {
      // Silently fail for analytics
    });
  } catch {
    // Silently fail for analytics
  }
}

// Default export
export default {
  submitFeedback,
  captureScreenshot,
  getSystemInfo,
  syncPendingFeedback,
  submitErrorReport,
  isFeedbackOptedIn,
  setFeedbackOptIn,
  trackEvent,
};
