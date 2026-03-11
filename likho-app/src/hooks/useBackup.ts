/**
 * useBackup Hook
 * 
 * React hook for managing backup operations with state tracking.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import {
  BackupFormat,
  BackupMetadata,
  BackupInfo,
  RestorePreview,
  AutoBackupSettings,
  AutoBackupStatus,
  BackupProgress,
  createBackup,
  restoreBackup,
  previewRestore,
  selectBackupFile,
  listBackups,
  deleteBackup,
  getAutoBackupStatus,
  setAutoBackupSettings,
  loadBackupSettings,
  saveBackupSettings,
  formatBytes,
  formatBackupDate,
  getDefaultBackupDir,
  cleanupOldBackups,
  initializeAutoBackup,
} from "@/lib/backup";

export interface UseBackupReturn {
  // State
  backups: BackupInfo[];
  isLoading: boolean;
  isCreating: boolean;
  isRestoring: boolean;
  progress: BackupProgress | null;
  lastBackup: BackupInfo | null;
  autoBackupStatus: AutoBackupStatus | null;
  settings: AutoBackupSettings;
  error: string | null;

  // Actions
  refreshBackups: (backupDir?: string) => Promise<void>;
  createManualBackup: (
    format?: BackupFormat,
    includeEmbeddings?: boolean
  ) => Promise<{ success: boolean; metadata?: BackupMetadata }>;
  selectAndRestore: () => Promise<{ success: boolean; preview?: RestorePreview }>;
  restoreFromPath: (path: string) => Promise<boolean>;
  previewRestoreFromPath: (path: string) => Promise<RestorePreview | null>;
  removeBackup: (path: string) => Promise<boolean>;
  updateSettings: (settings: Partial<AutoBackupSettings>) => Promise<boolean>;
  selectBackupDirectory: () => Promise<string | null>;
  cleanupBackups: () => Promise<number>;
  clearError: () => void;
}

export function useBackup(): UseBackupReturn {
  // State
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [progress, setProgress] = useState<BackupProgress | null>(null);
  const [autoBackupStatus, setAutoBackupStatus] = useState<AutoBackupStatus | null>(null);
  const [settings, setSettings] = useState<AutoBackupSettings>(loadBackupSettings());
  const [error, setError] = useState<string | null>(null);

  // Refs for async operations
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  // Computed
  const lastBackup = backups.length > 0 ? backups[0] : null;

  /**
   * Refresh the list of backups
   */
  const refreshBackups = useCallback(async (backupDir?: string) => {
    const dir = backupDir || settingsRef.current.backup_dir;
    if (!dir) {
      setBackups([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const list = await listBackups(dir);
      setBackups(list);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load backups";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Create a manual backup
   */
  const createManualBackup = useCallback(
    async (
      format: BackupFormat = "sqlite",
      includeEmbeddings: boolean = true
    ): Promise<{ success: boolean; metadata?: BackupMetadata }> => {
      setIsCreating(true);
      setProgress(null);
      setError(null);

      try {
        const result = await createBackup(format, includeEmbeddings, (p) => {
          setProgress(p);
        });

        if (result.success && result.metadata) {
          // Refresh the backup list
          await refreshBackups();
          return { success: true, metadata: result.metadata };
        } else {
          setError(result.error || "Backup failed");
          return { success: false };
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Backup failed";
        setError(message);
        return { success: false };
      } finally {
        setIsCreating(false);
        setProgress(null);
      }
    },
    [refreshBackups]
  );

  /**
   * Select a backup file and get restore preview
   */
  const selectAndRestore = useCallback(async (): Promise<{
    success: boolean;
    preview?: RestorePreview;
  }> => {
    const filePath = await selectBackupFile();
    if (!filePath) {
      return { success: false };
    }

    setIsRestoring(true);
    setError(null);

    try {
      const result = await previewRestore(filePath);
      if (result.success && result.preview) {
        return { success: true, preview: result.preview };
      } else {
        setError(result.error || "Failed to preview restore");
        return { success: false };
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to preview restore";
      setError(message);
      return { success: false };
    } finally {
      setIsRestoring(false);
    }
  }, []);

  /**
   * Preview restore from a specific path
   */
  const previewRestoreFromPath = useCallback(async (
    path: string
  ): Promise<RestorePreview | null> => {
    try {
      const result = await previewRestore(path);
      if (result.success && result.preview) {
        return result.preview;
      }
      return null;
    } catch (err) {
      console.error("Failed to preview restore:", err);
      return null;
    }
  }, []);

  /**
   * Restore from a specific path
   */
  const restoreFromPath = useCallback(
    async (path: string): Promise<boolean> => {
      setIsRestoring(true);
      setProgress(null);
      setError(null);

      try {
        const result = await restoreBackup(path, (p) => {
          setProgress(p);
        });

        if (result.success) {
          // App should reload after successful restore
          return true;
        } else {
          setError(result.error || "Restore failed");
          return false;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Restore failed";
        setError(message);
        return false;
      } finally {
        setIsRestoring(false);
        setProgress(null);
      }
    },
    []
  );

  /**
   * Delete a backup
   */
  const removeBackup = useCallback(
    async (path: string): Promise<boolean> => {
      setError(null);

      try {
        const result = await deleteBackup(path);
        if (result.success) {
          await refreshBackups();
          return true;
        } else {
          setError(result.error || "Failed to delete backup");
          return false;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to delete backup";
        setError(message);
        return false;
      }
    },
    [refreshBackups]
  );

  /**
   * Update auto-backup settings
   */
  const updateSettings = useCallback(
    async (newSettings: Partial<AutoBackupSettings>): Promise<boolean> => {
      const updated = { ...settingsRef.current, ...newSettings };
      
      // If enabling auto-backup without a directory, set default
      if (updated.enabled && !updated.backup_dir) {
        updated.backup_dir = await getDefaultBackupDir();
      }

      setError(null);

      try {
        const result = await setAutoBackupSettings(updated);
        if (result.success) {
          setSettings(updated);
          saveBackupSettings(updated);
          // Refresh status after settings change
          const status = await getAutoBackupStatus();
          setAutoBackupStatus(status);
          return true;
        } else {
          setError(result.error || "Failed to update settings");
          return false;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update settings";
        setError(message);
        return false;
      }
    },
    []
  );

  /**
   * Select backup directory using dialog
   */
  const selectBackupDirectory = useCallback(async (): Promise<string | null> => {
    try {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Select Backup Directory",
        defaultPath: settingsRef.current.backup_dir || undefined,
      });
      return selected as string | null;
    } catch (err) {
      console.error("Failed to select directory:", err);
      return null;
    }
  }, []);

  /**
   * Clean up old backups based on retention policy
   */
  const cleanupBackups = useCallback(async (): Promise<number> => {
    const dir = settingsRef.current.backup_dir;
    if (!dir) return 0;

    try {
      const deleted = await cleanupOldBackups(dir, settingsRef.current.max_backups);
      if (deleted > 0) {
        await refreshBackups();
      }
      return deleted;
    } catch (err) {
      console.error("Failed to cleanup backups:", err);
      return 0;
    }
  }, [refreshBackups]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Initialize on mount
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      
      try {
        // Initialize auto-backup system
        await initializeAutoBackup();

        // Load auto-backup status
        const status = await getAutoBackupStatus();
        setAutoBackupStatus(status);

        // Load backups if we have a directory
        if (settingsRef.current.backup_dir) {
          await refreshBackups();
        }
      } catch (err) {
        console.error("Failed to initialize backup system:", err);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [refreshBackups]);

  // Refresh backups when settings change
  useEffect(() => {
    if (settings.backup_dir) {
      refreshBackups();
    }
  }, [settings.backup_dir, refreshBackups]);

  return {
    // State
    backups,
    isLoading,
    isCreating,
    isRestoring,
    progress,
    lastBackup,
    autoBackupStatus,
    settings,
    error,

    // Actions
    refreshBackups,
    createManualBackup,
    selectAndRestore,
    restoreFromPath,
    previewRestoreFromPath,
    removeBackup,
    updateSettings,
    selectBackupDirectory,
    cleanupBackups,
    clearError,
  };
}

export default useBackup;
