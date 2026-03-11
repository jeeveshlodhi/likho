import { useState, useEffect, useCallback } from "react";
import { 
  UpdateInfo, 
  checkForUpdates, 
  installUpdate, 
  skipVersion,
  isAutoCheckEnabled,
  setAutoCheckEnabled,
  getAppVersion,
  getPlatformInfo,
  UpdateCheckResponse 
} from "@/lib/updater";

export interface UseUpdaterReturn {
  // State
  isChecking: boolean;
  isDownloading: boolean;
  downloadProgress: number;
  updateAvailable: UpdateInfo | null;
  currentVersion: string;
  error: string | null;
  autoCheckEnabled: boolean;
  
  // Actions
  check: () => Promise<UpdateCheckResponse>;
  install: () => Promise<void>;
  skip: (version: string) => Promise<void>;
  setAutoCheck: (enabled: boolean) => Promise<void>;
  refreshVersion: () => Promise<void>;
}

export function useUpdater(): UseUpdaterReturn {
  const [isChecking, setIsChecking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [updateAvailable, setUpdateAvailable] = useState<UpdateInfo | null>(null);
  const [currentVersion, setCurrentVersion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [autoCheckEnabled, setAutoCheck] = useState(true);

  // Load initial settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [version, autoCheck, platform] = await Promise.all([
          getAppVersion(),
          isAutoCheckEnabled(),
          getPlatformInfo(),
        ]);
        
        setCurrentVersion(version);
        setAutoCheck(autoCheck);
        
        console.log(`Likho v${version} on ${platform.os} (${platform.arch})`);
      } catch (err) {
        console.error("Failed to load updater settings:", err);
      }
    };

    loadSettings();

    // Listen for update-available events
    const handleUpdateAvailable = (event: CustomEvent<UpdateInfo>) => {
      setUpdateAvailable(event.detail);
    };

    window.addEventListener("update-available" as any, handleUpdateAvailable);

    return () => {
      window.removeEventListener("update-available" as any, handleUpdateAvailable);
    };
  }, []);

  // Listen for download progress events
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "update-download-progress") {
        setDownloadProgress(event.data.payload);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const check = useCallback(async (): Promise<UpdateCheckResponse> => {
    setIsChecking(true);
    setError(null);

    try {
      const result = await checkForUpdates();
      
      if (result.error) {
        setError(result.error);
      } else if (result.available && result.info) {
        setUpdateAvailable(result.info);
      }
      
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(errorMsg);
      return { available: false, error: errorMsg };
    } finally {
      setIsChecking(false);
    }
  }, []);

  const install = useCallback(async (): Promise<void> => {
    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      await installUpdate();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(errorMsg);
      throw err;
    } finally {
      setIsDownloading(false);
    }
  }, []);

  const skip = useCallback(async (version: string): Promise<void> => {
    await skipVersion(version);
    setUpdateAvailable(null);
  }, []);

  const setAutoCheckSetting = useCallback(async (enabled: boolean): Promise<void> => {
    await setAutoCheckEnabled(enabled);
    setAutoCheck(enabled);
  }, []);

  const refreshVersion = useCallback(async (): Promise<void> => {
    const version = await getAppVersion();
    setCurrentVersion(version);
  }, []);

  return {
    // State
    isChecking,
    isDownloading,
    downloadProgress,
    updateAvailable,
    currentVersion,
    error,
    autoCheckEnabled,
    
    // Actions
    check,
    install,
    skip,
    setAutoCheck: setAutoCheckSetting,
    refreshVersion,
  };
}

export default useUpdater;
