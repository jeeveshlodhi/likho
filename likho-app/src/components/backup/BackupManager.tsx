"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  Upload,
  Trash2,
  Clock,
  HardDrive,
  Settings,
  AlertCircle,
  Check,
  Loader2,
  FolderOpen,
  Shield,
  Database,
  FileJson,
  FileArchive,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useBackup, UseBackupReturn } from "@/hooks/useBackup";
import { BackupFormat, formatBytes, formatBackupDate } from "@/lib/backup";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { RestoreDialog } from "./RestoreDialog";

interface BackupManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BackupManager({ isOpen, onClose }: BackupManagerProps) {
  const backup = useBackup();
  const [showSettings, setShowSettings] = useState(false);
  const [restorePath, setRestorePath] = useState<string | null>(null);
  const [deletePath, setDeletePath] = useState<string | null>(null);
  const [format, setFormat] = useState<BackupFormat>("sqlite");
  const [includeEmbeddings, setIncludeEmbeddings] = useState(true);

  const handleCreateBackup = useCallback(async () => {
    await backup.createManualBackup(format, includeEmbeddings);
  }, [backup, format, includeEmbeddings]);

  const handleSelectRestore = useCallback(async () => {
    const result = await backup.selectAndRestore();
    if (result.success && result.preview) {
      // This shouldn't happen with selectAndRestore, but handle it
    }
  }, [backup]);

  const handleRestoreClick = useCallback((path: string) => {
    setRestorePath(path);
  }, []);

  const handleRestoreComplete = useCallback(
    (success: boolean) => {
      setRestorePath(null);
      if (success) {
        // App will restart, no need to do anything
      }
    },
    [backup]
  );

  const handleDeleteClick = useCallback((path: string) => {
    setDeletePath(path);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (deletePath) {
      await backup.removeBackup(deletePath);
      setDeletePath(null);
    }
  }, [backup, deletePath]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Data Backup & Restore
          </DialogTitle>
          <DialogDescription>
            Manage your Likho data backups and configure automatic backup settings.
          </DialogDescription>
        </DialogHeader>

        {/* Status Section */}
        <BackupStatus backup={backup} />

        {/* Create Backup Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
            <Database className="w-4 h-4" />
            Create Backup
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="format">Backup Format</Label>
              <Select value={format} onValueChange={(v) => setFormat(v as BackupFormat)}>
                <SelectTrigger id="format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sqlite">
                    <span className="flex items-center gap-2">
                      <Database className="w-4 h-4" />
                      SQLite (Fast)
                    </span>
                  </SelectItem>
                  <SelectItem value="json">
                    <span className="flex items-center gap-2">
                      <FileJson className="w-4 h-4" />
                      JSON (Portable)
                    </span>
                  </SelectItem>
                  <SelectItem value="gzip">
                    <span className="flex items-center gap-2">
                      <FileArchive className="w-4 h-4" />
                      Gzip (Compressed)
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                Include Embeddings
                <Switch
                  checked={includeEmbeddings}
                  onCheckedChange={setIncludeEmbeddings}
                />
              </Label>
              <p className="text-xs text-zinc-500">
                {includeEmbeddings
                  ? "Includes AI search data (larger file)"
                  : "Search will need re-indexing after restore"}
              </p>
            </div>
          </div>

          <Button
            onClick={handleCreateBackup}
            disabled={backup.isCreating}
            className="w-full"
          >
            {backup.isCreating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Backup...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Create Backup Now
              </>
            )}
          </Button>

          {/* Progress */}
          {backup.progress && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600">{backup.progress.message}</span>
                <span className="text-zinc-500">{backup.progress.progress}%</span>
              </div>
              <Progress value={backup.progress.progress} />
            </div>
          )}
        </div>

        <Separator />

        {/* Auto-Backup Settings */}
        <div className="space-y-4">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center justify-between w-full text-sm font-semibold text-zinc-900"
          >
            <span className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Auto-Backup Settings
            </span>
            {showSettings ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <AutoBackupSettings backup={backup} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Separator />

        {/* Restore Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Restore from Backup
          </h3>

          <Button
            variant="outline"
            onClick={handleSelectRestore}
            disabled={backup.isRestoring}
            className="w-full"
          >
            {backup.isRestoring ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Restoring...
              </>
            ) : (
              <>
                <FolderOpen className="w-4 h-4 mr-2" />
                Select Backup File to Restore
              </>
            )}
          </Button>
        </div>

        <Separator />

        {/* Existing Backups */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
              <HardDrive className="w-4 h-4" />
              Existing Backups
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => backup.refreshBackups()}
              disabled={backup.isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${backup.isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>

          <BackupList
            backups={backup.backups}
            onRestore={handleRestoreClick}
            onDelete={handleDeleteClick}
            isLoading={backup.isLoading}
          />
        </div>

        {/* Error Display */}
        {backup.error && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{backup.error}</AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Restore Dialog */}
      {restorePath && (
        <RestoreDialog
          backupPath={restorePath}
          onClose={() => setRestorePath(null)}
          onRestore={handleRestoreComplete}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletePath} onOpenChange={() => setDeletePath(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              Delete Backup?
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. The backup file will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeletePath(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

// Backup Status Component
function BackupStatus({ backup }: { backup: UseBackupReturn }) {
  const status = backup.autoBackupStatus;
  const lastBackup = backup.lastBackup;

  return (
    <div className="grid grid-cols-2 gap-4 p-4 bg-zinc-50 rounded-lg">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm text-zinc-600">
          <Clock className="w-4 h-4" />
          Last Backup
        </div>
        <div className="font-medium">
          {lastBackup ? (
            <span className="text-zinc-900">
              {formatBackupDate(lastBackup.created_at)}
            </span>
          ) : (
            <span className="text-zinc-400">Never</span>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm text-zinc-600">
          <HardDrive className="w-4 h-4" />
          Storage Used
        </div>
        <div className="font-medium text-zinc-900">
          {formatBytes(status?.total_size || 0)}
        </div>
      </div>

      {status?.enabled && status.next_backup && (
        <div className="col-span-2 flex items-center gap-2 text-sm text-blue-600">
          <Check className="w-4 h-4" />
          Next auto-backup: {formatBackupDate(status.next_backup)}
        </div>
      )}
    </div>
  );
}

// Auto-Backup Settings Component
function AutoBackupSettings({ backup }: { backup: UseBackupReturn }) {
  const settings = backup.settings;
  const [localDir, setLocalDir] = useState(settings.backup_dir);

  const handleSelectDir = async () => {
    const dir = await backup.selectBackupDirectory();
    if (dir) {
      setLocalDir(dir);
      await backup.updateSettings({ backup_dir: dir });
    }
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="auto-backup">Enable Auto-Backup</Label>
          <p className="text-xs text-zinc-500">
            Automatically backup your data on a schedule
          </p>
        </div>
        <Switch
          id="auto-backup"
          checked={settings.enabled}
          onCheckedChange={(checked) =>
            backup.updateSettings({ enabled: checked })
          }
        />
      </div>

      {settings.enabled && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4 pl-4 border-l-2 border-zinc-200"
        >
          <div className="space-y-2">
            <Label>Backup Frequency</Label>
            <Select
              value={settings.frequency}
              onValueChange={(v) =>
                backup.updateSettings({
                  frequency: v as "daily" | "weekly" | "monthly",
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Backup Location</Label>
            <div className="flex gap-2">
              <input
                type="text"
                value={localDir}
                readOnly
                className="flex-1 px-3 py-2 text-sm border rounded-md bg-zinc-50"
                placeholder="Select backup directory..."
              />
              <Button variant="outline" size="sm" onClick={handleSelectDir}>
                <FolderOpen className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Keep Backups (max)</Label>
            <Select
              value={String(settings.max_backups)}
              onValueChange={(v) =>
                backup.updateSettings({ max_backups: parseInt(v) })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 backups</SelectItem>
                <SelectItem value="10">10 backups</SelectItem>
                <SelectItem value="20">20 backups</SelectItem>
                <SelectItem value="50">50 backups</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Default Format</Label>
            <Select
              value={settings.format}
              onValueChange={(v) =>
                backup.updateSettings({ format: v as BackupFormat })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sqlite">SQLite</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="gzip">Gzip</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Backup List Component
function BackupList({
  backups,
  onRestore,
  onDelete,
  isLoading,
}: {
  backups: UseBackupReturn["backups"];
  onRestore: (path: string) => void;
  onDelete: (path: string) => void;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (backups.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-400">
        <HardDrive className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No backups found</p>
        <p className="text-xs mt-1">
          Create your first backup to protect your data
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      <AnimatePresence>
        {backups.map((backup) => (
          <motion.div
            key={backup.path}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="flex items-center justify-between p-3 bg-white border rounded-lg hover:border-zinc-300 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Database className="w-4 h-4 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm text-zinc-900 truncate">
                  {backup.filename}
                </p>
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <span>{formatBackupDate(backup.created_at)}</span>
                  <span>•</span>
                  <span>{formatBytes(backup.size)}</span>
                  {backup.metadata?.format && (
                    <>
                      <span>•</span>
                      <span className="uppercase">{backup.metadata.format}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRestore(backup.path)}
                title="Restore from this backup"
              >
                <Upload className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(backup.path)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                title="Delete backup"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default BackupManager;
