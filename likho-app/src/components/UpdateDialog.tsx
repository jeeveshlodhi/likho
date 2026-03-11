import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Download, 
  X, 
  Check, 
  AlertCircle, 
  Loader2,
  RotateCcw,
  Bell
} from "lucide-react";
import { 
  UpdateInfo, 
  checkForUpdates, 
  installUpdate, 
  skipVersion,
  getAppVersion,
  UpdateCheckResponse 
} from "@/lib/updater";

interface UpdateDialogProps {
  forceCheck?: boolean;
  onClose?: () => void;
}

export function UpdateDialog({ forceCheck = false, onClose }: UpdateDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [currentVersion, setCurrentVersion] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  // Check for updates on mount if forceCheck is true
  useEffect(() => {
    if (forceCheck) {
      handleCheck();
    }
    loadCurrentVersion();

    // Listen for update-available events
    const handleUpdateAvailable = (event: CustomEvent<UpdateInfo>) => {
      setUpdateInfo(event.detail);
      setIsOpen(true);
    };

    window.addEventListener("update-available" as any, handleUpdateAvailable);

    return () => {
      window.removeEventListener("update-available" as any, handleUpdateAvailable);
    };
  }, [forceCheck]);

  const loadCurrentVersion = async () => {
    try {
      const version = await getAppVersion();
      setCurrentVersion(version);
    } catch (err) {
      console.error("Failed to get app version:", err);
    }
  };

  const handleCheck = async () => {
    setIsChecking(true);
    setError(null);

    try {
      const result: UpdateCheckResponse = await checkForUpdates();
      
      if (result.error) {
        setError(result.error);
      } else if (result.available && result.info) {
        setUpdateInfo(result.info);
        setIsOpen(true);
      } else {
        setUpdateInfo(null);
        setIsOpen(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check for updates");
      setIsOpen(true);
    } finally {
      setIsChecking(false);
    }
  };

  const handleInstall = async () => {
    if (!updateInfo) return;

    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      await installUpdate();
      setIsComplete(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to install update");
      setIsDownloading(false);
    }
  };

  const handleSkip = async () => {
    if (!updateInfo) return;
    
    await skipVersion(updateInfo.version);
    setIsOpen(false);
    onClose?.();
  };

  const handleLater = () => {
    setIsOpen(false);
    onClose?.();
  };

  const handleClose = useCallback(() => {
    setIsOpen(false);
    onClose?.();
  }, [onClose]);

  // Listen for download progress events from Rust
  useEffect(() => {
    const handleProgress = (event: MessageEvent) => {
      if (event.data?.type === "update-download-progress") {
        setDownloadProgress(event.data.payload);
      }
      if (event.data?.type === "update-download-finished") {
        setIsComplete(true);
      }
    };

    window.addEventListener("message", handleProgress);
    return () => window.removeEventListener("message", handleProgress);
  }, []);

  if (!isOpen) {
    // Return a check button when dialog is closed
    if (forceCheck) return null;
    
    return (
      <button
        onClick={handleCheck}
        disabled={isChecking}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-700 
                   bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 
                   hover:border-zinc-300 transition-colors disabled:opacity-50"
      >
        {isChecking ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <RotateCcw className="w-4 h-4" />
        )}
        {isChecking ? "Checking..." : "Check for Updates"}
      </button>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Bell className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold text-zinc-900">
                  {updateInfo ? "Update Available" : "Check for Updates"}
                </h2>
              </div>
              <button
                onClick={handleClose}
                className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100 
                           transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {error ? (
                <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-red-900">Update Check Failed</h3>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              ) : isChecking ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                  <p className="mt-4 text-zinc-600">Checking for updates...</p>
                </div>
              ) : !updateInfo ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="p-4 bg-green-50 rounded-full">
                    <Check className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="mt-4 font-medium text-zinc-900">You're up to date!</h3>
                  <p className="text-sm text-zinc-500 mt-1">
                    Likho {currentVersion} is the latest version.
                  </p>
                </div>
              ) : isComplete ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="p-4 bg-green-50 rounded-full">
                    <Check className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="mt-4 font-medium text-zinc-900">Update Installed!</h3>
                  <p className="text-sm text-zinc-500 mt-1">
                    The app will restart to apply the update.
                  </p>
                </div>
              ) : isDownloading ? (
                <div className="py-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-zinc-700">
                      Downloading update...
                    </span>
                    <span className="text-sm text-zinc-500">
                      {Math.round(downloadProgress)}%
                    </span>
                  </div>
                  <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-blue-600 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${downloadProgress}%` }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-50 rounded-xl">
                      <Download className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-zinc-900">
                        Version {updateInfo.version} is available
                      </h3>
                      <p className="text-sm text-zinc-500">
                        You have {currentVersion}
                      </p>
                    </div>
                  </div>

                  {updateInfo.notes && (
                    <div className="p-4 bg-zinc-50 rounded-lg">
                      <h4 className="text-sm font-medium text-zinc-700 mb-2">
                        What's new:
                      </h4>
                      <div className="text-sm text-zinc-600 prose prose-sm max-h-32 overflow-y-auto">
                        {updateInfo.notes}
                      </div>
                    </div>
                  )}

                  {updateInfo.mandatory && (
                    <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-amber-700">
                        This is a mandatory update. You must update to continue using Likho.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            {updateInfo && !isChecking && !error && !isComplete && (
              <div className="flex items-center justify-end gap-3 p-6 pt-0">
                {!updateInfo.mandatory && (
                  <button
                    onClick={handleLater}
                    className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 
                               transition-colors"
                  >
                    Later
                  </button>
                )}
                {!updateInfo.mandatory && (
                  <button
                    onClick={handleSkip}
                    className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 
                               transition-colors"
                  >
                    Skip This Version
                  </button>
                )}
                <button
                  onClick={handleInstall}
                  disabled={isDownloading}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white 
                             bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors 
                             disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Download & Install
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Close button for no-update state */}
            {!updateInfo && !isChecking && (
              <div className="flex items-center justify-end gap-3 p-6 pt-0">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-white bg-zinc-900 rounded-lg 
                             hover:bg-zinc-800 transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default UpdateDialog;
