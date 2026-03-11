/**
 * Backup Service
 * 
 * Provides comprehensive backup and restore functionality for the Likho app.
 * Supports SQLite, JSON, and Gzip formats with automatic scheduling.
 */

import { invoke } from "@tauri-apps/api/core";
import { save, open } from "@tauri-apps/plugin-dialog";
import { homeDir, join } from "@tauri-apps/api/path";

// Types matching Rust backend
export type BackupFormat = "sqlite" | "json" | "gzip";

export interface BackupMetadata {
  version: string;
  created_at: string;
  original_size: number;
  compressed_size: number;
  format: string;
  checksum: string;
  include_embeddings: boolean;
  app_version: string;
}

export interface BackupInfo {
  path: string;
  filename: string;
  size: number;
  created_at: string;
  metadata?: BackupMetadata;
}

export interface RestorePreview {
  backup_date: string;
  original_size: number;
  format: string;
  version: string;
  warnings: string[];
}

export interface AutoBackupSettings {
  enabled: boolean;
  frequency: "daily" | "weekly" | "monthly";
  backup_dir: string;
  max_backups: number;
  include_embeddings: boolean;
  format: BackupFormat;
}

export interface AutoBackupStatus {
  enabled: boolean;
  last_backup: string | null;
  next_backup: string | null;
  backups_count: number;
  total_size: number;
}

export interface BackupProgress {
  stage: "preparing" | "exporting" | "compressing" | "finalizing" | "completed" | "error";
  progress: number;
  message: string;
  error?: string;
}

// Default settings
const DEFAULT_SETTINGS: AutoBackupSettings = {
  enabled: false,
  frequency: "weekly",
  backup_dir: "",
  max_backups: 10,
  include_embeddings: true,
  format: "sqlite",
};

// Settings storage key
const SETTINGS_KEY = "likho_auto_backup_settings";

/**
 * Get the default backup directory
 */
export async function getDefaultBackupDir(): Promise<string> {
  const home = await homeDir();
  return await join(home, "Likho", "Backups");
}

/**
 * Load auto-backup settings from localStorage
 */
export function loadBackupSettings(): AutoBackupSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch {
    console.error("Failed to load backup settings");
  }
  return { ...DEFAULT_SETTINGS };
}

/**
 * Save auto-backup settings to localStorage
 */
export function saveBackupSettings(settings: AutoBackupSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    console.error("Failed to save backup settings");
  }
}

/**
 * Create a manual backup
 * Opens a save dialog and exports the database
 */
export async function createBackup(
  format: BackupFormat = "sqlite",
  includeEmbeddings: boolean = true,
  onProgress?: (progress: BackupProgress) => void
): Promise<{ success: boolean; path?: string; metadata?: BackupMetadata; error?: string }> {
  try {
    onProgress?.({
      stage: "preparing",
      progress: 0,
      message: "Preparing backup...",
    });

    // Get default file name
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const extension = format === "json" ? "json" : format === "gzip" ? "db.gz" : "db";
    const defaultName = `likho_backup_${timestamp}.${extension}`;

    onProgress?.({
      stage: "preparing",
      progress: 20,
      message: "Opening save dialog...",
    });

    // Open save dialog
    const savePath = await save({
      defaultPath: defaultName,
      filters: [
        { name: "SQLite Database", extensions: ["db"] },
        { name: "JSON Backup", extensions: ["json"] },
        { name: "Gzip Compressed", extensions: ["gz", "db.gz"] },
        { name: "All Files", extensions: ["*"] },
      ],
      title: "Save Likho Backup",
    });

    if (!savePath) {
      return { success: false, error: "Save cancelled by user" };
    }

    onProgress?.({
      stage: "exporting",
      progress: 30,
      message: "Exporting database...",
    });

    // Call Rust backend to export
    const metadata = await invoke<BackupMetadata>("export_database", {
      request: {
        targetPath: savePath,
        format,
        includeEmbeddings,
      },
    });

    onProgress?.({
      stage: "completed",
      progress: 100,
      message: "Backup completed successfully!",
    });

    return { success: true, path: savePath, metadata };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    onProgress?.({
      stage: "error",
      progress: 0,
      message: "Backup failed",
      error: errorMessage,
    });
    return { success: false, error: errorMessage };
  }
}

/**
 * Preview a restore operation
 * Returns information about the backup without performing the restore
 */
export async function previewRestore(
  filePath: string
): Promise<{ success: boolean; preview?: RestorePreview; error?: string }> {
  try {
    const preview = await invoke<RestorePreview>("preview_restore", {
      request: { sourcePath: filePath },
    });
    return { success: true, preview };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Restore database from a backup file
 * WARNING: This will overwrite current data!
 */
export async function restoreBackup(
  filePath: string,
  onProgress?: (progress: BackupProgress) => void
): Promise<{ success: boolean; error?: string }> {
  try {
    onProgress?.({
      stage: "preparing",
      progress: 0,
      message: "Preparing restore...",
    });

    // First verify the backup
    onProgress?.({
      stage: "preparing",
      progress: 10,
      message: "Verifying backup integrity...",
    });

    const isValid = await invoke<boolean>("verify_backup_integrity", {
      path: filePath,
    });

    if (!isValid) {
      throw new Error("Backup file is corrupted or invalid");
    }

    onProgress?.({
      stage: "exporting",
      progress: 30,
      message: "Restoring database...",
    });

    // Execute restore
    await invoke("execute_restore", {
      request: { sourcePath: filePath },
    });

    onProgress?.({
      stage: "completed",
      progress: 100,
      message: "Restore completed successfully!",
    });

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    onProgress?.({
      stage: "error",
      progress: 0,
      message: "Restore failed",
      error: errorMessage,
    });
    return { success: false, error: errorMessage };
  }
}

/**
 * Open file dialog to select a backup file for restore
 */
export async function selectBackupFile(): Promise<string | null> {
  const selected = await open({
    multiple: false,
    filters: [
      { name: "Backup Files", extensions: ["db", "json", "gz", "db.gz"] },
      { name: "SQLite Database", extensions: ["db"] },
      { name: "JSON Backup", extensions: ["json"] },
      { name: "Gzip Compressed", extensions: ["gz", "db.gz"] },
      { name: "All Files", extensions: ["*"] },
    ],
    title: "Select Likho Backup",
  });

  return selected as string | null;
}

/**
 * Verify backup file integrity
 */
export async function verifyBackupIntegrity(filePath: string): Promise<boolean> {
  try {
    return await invoke<boolean>("verify_backup_integrity", { path: filePath });
  } catch {
    return false;
  }
}

/**
 * List all backups in a directory
 */
export async function listBackups(backupDir: string): Promise<BackupInfo[]> {
  try {
    return await invoke<BackupInfo[]>("list_backups", { backupDir });
  } catch (error) {
    console.error("Failed to list backups:", error);
    return [];
  }
}

/**
 * Delete a backup file
 */
export async function deleteBackup(filePath: string): Promise<{ success: boolean; error?: string }> {
  try {
    await invoke("delete_backup", { path: filePath });
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Get auto-backup status
 */
export async function getAutoBackupStatus(): Promise<AutoBackupStatus> {
  try {
    return await invoke<AutoBackupStatus>("get_auto_backup_status");
  } catch (error) {
    console.error("Failed to get auto-backup status:", error);
    return {
      enabled: false,
      last_backup: null,
      next_backup: null,
      backups_count: 0,
      total_size: 0,
    };
  }
}

/**
 * Update auto-backup settings
 */
export async function setAutoBackupSettings(
  settings: AutoBackupSettings
): Promise<{ success: boolean; error?: string }> {
  try {
    await invoke("set_auto_backup_settings", { settings });
    saveBackupSettings(settings);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Trigger an auto-backup if needed (based on schedule)
 * Returns the metadata if a backup was created, null if not needed
 */
export async function triggerAutoBackup(): Promise<BackupMetadata | null> {
  try {
    return await invoke<BackupMetadata | null>("trigger_auto_backup");
  } catch (error) {
    console.error("Auto-backup failed:", error);
    return null;
  }
}

/**
 * Clean up old backups based on retention policy
 */
export async function cleanupOldBackups(
  backupDir: string,
  maxBackups: number
): Promise<number> {
  try {
    return await invoke<number>("cleanup_old_backups", { backupDir, maxBackups });
  } catch (error) {
    console.error("Failed to cleanup old backups:", error);
    return 0;
  }
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Format date to human-readable string
 */
export function formatBackupDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins === 0) return "Just now";
      return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
    }
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
}

/**
 * Get the next scheduled backup date based on settings
 */
export function getNextBackupDate(
  lastBackup: Date | null,
  frequency: "daily" | "weekly" | "monthly"
): Date {
  const now = new Date();
  const next = lastBackup ? new Date(lastBackup) : now;

  switch (frequency) {
    case "daily":
      next.setDate(next.getDate() + 1);
      break;
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      break;
  }

  return next > now ? next : now;
}

/**
 * Initialize auto-backup on app start
 * Should be called when the app initializes
 */
export async function initializeAutoBackup(): Promise<void> {
  const settings = loadBackupSettings();

  if (!settings.enabled) {
    return;
  }

  // Set default backup dir if not set
  if (!settings.backup_dir) {
    settings.backup_dir = await getDefaultBackupDir();
    saveBackupSettings(settings);
  }

  // Sync settings with Rust backend
  await setAutoBackupSettings(settings);

  // Check if backup is needed
  await triggerAutoBackup();
}
