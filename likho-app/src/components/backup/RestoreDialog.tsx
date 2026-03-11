"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Upload,
  Clock,
  Database,
  FileJson,
  FileArchive,
  AlertCircle,
  Loader2,
  Check,
  X,
  ChevronRight,
  Shield,
  RotateCcw,
} from "lucide-react";
import { useBackup } from "@/hooks/useBackup";
import { RestorePreview, formatBytes, formatBackupDate } from "@/lib/backup";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

interface RestoreDialogProps {
  backupPath: string;
  onClose: () => void;
  onRestore: (success: boolean) => void;
}

type RestoreStage =
  | "preview"
  | "confirm"
  | "restoring"
  | "success"
  | "error";

export function RestoreDialog({
  backupPath,
  onClose,
  onRestore,
}: RestoreDialogProps) {
  const backup = useBackup();
  const [stage, setStage] = useState<RestoreStage>("preview");
  const [preview, setPreview] = useState<RestorePreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load preview on mount
  useEffect(() => {
    loadPreview();
  }, [backupPath]);

  const loadPreview = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await backup.previewRestoreFromPath(backupPath);
      if (result) {
        setPreview(result);
        setStage("confirm");
      } else {
        setError("Failed to read backup file. The file may be corrupted.");
        setStage("error");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load backup preview");
      setStage("error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartRestore = useCallback(() => {
    setStage("restoring");
    performRestore();
  }, []);

  const performRestore = async () => {
    try {
      const result = await backup.restoreFromPath(backupPath);
      if (result) {
        setStage("success");
        // Notify parent of successful restore
        setTimeout(() => {
          onRestore(true);
        }, 2000);
      } else {
        setError(backup.error || "Restore failed");
        setStage("error");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Restore failed");
      setStage("error");
    }
  };

  const handleClose = () => {
    if (stage === "restoring") {
      // Prevent closing during restore
      return;
    }
    onClose();
  };

  const getFormatIcon = (format: string) => {
    switch (format.toLowerCase()) {
      case "json":
        return <FileJson className="w-5 h-5 text-blue-500" />;
      case "gzip":
        return <FileArchive className="w-5 h-5 text-purple-500" />;
      default:
        return <Database className="w-5 h-5 text-green-500" />;
    }
  };

  return (
    <Dialog open onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {stage === "restoring" ? (
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            ) : stage === "success" ? (
              <Check className="w-5 h-5 text-green-600" />
            ) : stage === "error" ? (
              <AlertCircle className="w-5 h-5 text-red-600" />
            ) : (
              <RotateCcw className="w-5 h-5 text-blue-600" />
            )}
            {stage === "preview" && "Loading Preview..."}
            {stage === "confirm" && "Restore Data?"}
            {stage === "restoring" && "Restoring Data..."}
            {stage === "success" && "Restore Complete!"}
            {stage === "error" && "Restore Failed"}
          </DialogTitle>
          <DialogDescription>
            {stage === "preview" && "Reading backup file information..."}
            {stage === "confirm" &&
              "Please review the backup details before proceeding."}
            {stage === "restoring" && "Please wait while we restore your data."}
            {stage === "success" &&
              "Your data has been restored successfully. The app will restart."}
            {stage === "error" && "An error occurred during the restore process."}
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* Preview/Confirm Stage */}
          {(stage === "preview" || stage === "confirm") && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <p className="text-sm text-zinc-500">
                    Reading backup file...
                  </p>
                </div>
              ) : preview ? (
                <>
                  {/* Backup Details */}
                  <div className="p-4 bg-zinc-50 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-zinc-500">Backup Date</span>
                      <span className="font-medium flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {formatBackupDate(preview.backup_date)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-zinc-500">Size</span>
                      <span className="font-medium">
                        {formatBytes(preview.original_size)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-zinc-500">Format</span>
                      <span className="font-medium flex items-center gap-2">
                        {getFormatIcon(preview.format)}
                        {preview.format.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-zinc-500">
                        App Version
                      </span>
                      <span className="font-medium text-sm">
                        {preview.version}
                      </span>
                    </div>
                  </div>

                  {/* Warnings */}
                  {preview.warnings.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-amber-700 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Warnings
                      </h4>
                      <ul className="space-y-1">
                        {preview.warnings.map((warning, idx) => (
                          <li
                            key={idx}
                            className="text-xs text-amber-600 flex items-start gap-2"
                          >
                            <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            {warning}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Warning Alert */}
                  <Alert variant="destructive" className="border-red-200 bg-red-50">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <AlertTitle className="text-red-900">Warning</AlertTitle>
                    <AlertDescription className="text-red-700 text-sm">
                      Restoring will <strong>overwrite all current data</strong>.
                      This action cannot be undone. Consider creating a backup of
                      your current data first.
                    </AlertDescription>
                  </Alert>
                </>
              ) : null}
            </motion.div>
          )}

          {/* Restoring Stage */}
          {stage === "restoring" && (
            <motion.div
              key="restoring"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4 py-4"
            >
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
                  <Shield className="w-6 h-6 text-blue-600 absolute inset-0 m-auto" />
                </div>
                <p className="text-sm text-zinc-600 text-center">
                  Restoring your data...
                  <br />
                  <span className="text-xs text-zinc-400">
                    Do not close the app
                  </span>
                </p>
              </div>

              {backup.progress && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-600">
                      {backup.progress.message}
                    </span>
                    <span className="text-zinc-500">
                      {backup.progress.progress}%
                    </span>
                  </div>
                  <Progress value={backup.progress.progress} className="h-2" />
                </div>
              )}
            </motion.div>
          )}

          {/* Success Stage */}
          {stage === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="py-4 text-center space-y-4"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900">
                  Restore Successful!
                </h3>
                <p className="text-sm text-zinc-500 mt-1">
                  The app will restart to apply the changes.
                </p>
              </div>
            </motion.div>
          )}

          {/* Error Stage */}
          {stage === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <Alert variant="destructive">
                <X className="w-4 h-4" />
                <AlertTitle>Restore Failed</AlertTitle>
                <AlertDescription className="text-sm">
                  {error || "An unknown error occurred during restore."}
                </AlertDescription>
              </Alert>

              <div className="text-sm text-zinc-600 space-y-2">
                <p>You can try:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Verifying the backup file is not corrupted</li>
                  <li>Checking if you have sufficient disk space</li>
                  <li>Trying a different backup file</li>
                  <li>Contacting support if the problem persists</li>
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <DialogFooter className="gap-2">
          {stage === "confirm" && (
            <>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleStartRestore}
                className="bg-red-600 hover:bg-red-700"
              >
                <Upload className="w-4 h-4 mr-2" />
                Restore Data
              </Button>
            </>
          )}

          {stage === "error" && (
            <>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={loadPreview} variant="outline">
                <RotateCcw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </>
          )}

          {(stage === "preview" || stage === "restoring") && (
            <Button disabled variant="outline">
              Please wait...
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default RestoreDialog;
