import { useState } from 'react';
import { Terminal, FlaskConical, HardDrive, Download, Save, Trash2, AlertTriangle } from 'lucide-react';
import { useSettingsStore } from '@/store/settingsStore';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { SettingsSection } from './SettingsSection';

const exportFormats = [
  { value: 'markdown', label: 'Markdown (.md)' },
  { value: 'html', label: 'HTML (.html)' },
  { value: 'pdf', label: 'PDF (.pdf)' },
  { value: 'json', label: 'JSON (.json)' },
];

const backupFrequencies = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

const experimentalFeaturesList = [
  { id: 'beta-editor', name: 'Beta Editor', description: 'Try the new block-based editor' },
  { id: 'realtime-collab', name: 'Real-time Collaboration', description: 'Collaborate on pages in real-time' },
  { id: 'ai-summarizer', name: 'AI Summarizer', description: 'Automatically summarize long pages' },
  { id: 'smart-links', name: 'Smart Links', description: 'Intelligent link suggestions' },
];

export function AdvancedSettings() {
  const advanced = useSettingsStore((state) => state.advanced);
  const updateAdvancedSettings = useSettingsStore((state) => state.updateAdvancedSettings);
  const toggleExperimentalFeature = useSettingsStore((state) => state.toggleExperimentalFeature);
  const clearCache = useSettingsStore((state) => state.clearCache);
  const [isClearing, setIsClearing] = useState(false);

  const handleClearCache = async () => {
    setIsClearing(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    clearCache();
    setIsClearing(false);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <SettingsSection
        title="Developer Mode"
        description="Enable advanced developer features"
      >
        <div className="flex items-center justify-between rounded-lg border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <Terminal size={18} />
            </div>
            <div>
              <p className="font-medium">Developer Mode</p>
              <p className="text-sm text-muted-foreground">
                Enable console logging and debugging tools
              </p>
            </div>
          </div>
          <Switch
            checked={advanced.developerMode}
            onCheckedChange={(checked) => updateAdvancedSettings({ developerMode: checked })}
          />
        </div>

        {advanced.developerMode && (
          <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/20">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              Developer mode is enabled. Open the browser console to see debug logs.
            </p>
          </div>
        )}
      </SettingsSection>

      <Separator />

      <SettingsSection
        title="Experimental Features"
        description="Try out upcoming features (may be unstable)"
      >
        <div className="space-y-3">
          {experimentalFeaturesList.map((feature) => (
            <div
              key={feature.id}
              className="flex items-center justify-between rounded-lg border border-border p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <FlaskConical size={18} />
                </div>
                <div>
                  <p className="font-medium">{feature.name}</p>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
              <Switch
                checked={advanced.experimentalFeatures.includes(feature.id)}
                onCheckedChange={() => toggleExperimentalFeature(feature.id)}
              />
            </div>
          ))}
        </div>
      </SettingsSection>

      <Separator />

      <SettingsSection
        title="Cache & Storage"
        description="Manage local cache and storage settings"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <HardDrive size={18} />
              </div>
              <div>
                <p className="font-medium">Clear Cache on Exit</p>
                <p className="text-sm text-muted-foreground">
                  Automatically clear cache when closing the app
                </p>
              </div>
            </div>
            <Switch
              checked={advanced.clearCacheOnExit}
              onCheckedChange={(checked) => updateAdvancedSettings({ clearCacheOnExit: checked })}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Trash2 size={18} />
              </div>
              <div>
                <p className="font-medium">Cache Size</p>
                <p className="text-sm text-muted-foreground">
                  {formatBytes(advanced.cacheSize)} used
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearCache}
              disabled={isClearing || advanced.cacheSize === 0}
            >
              {isClearing ? 'Clearing...' : 'Clear Cache'}
            </Button>
          </div>
        </div>
      </SettingsSection>

      <Separator />

      <SettingsSection
        title="Export Settings"
        description="Configure default export behavior"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="exportFormat">Default Export Format</Label>
            <Select
              value={advanced.exportFormat}
              onValueChange={(value) =>
                updateAdvancedSettings({ exportFormat: value as typeof advanced.exportFormat })
              }
            >
              <SelectTrigger id="exportFormat">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {exportFormats.map((format) => (
                  <SelectItem key={format.value} value={format.value}>
                    {format.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </SettingsSection>

      <Separator />

      <SettingsSection
        title="Backup"
        description="Configure automatic backup settings"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Save size={18} />
              </div>
              <div>
                <p className="font-medium">Enable Backups</p>
                <p className="text-sm text-muted-foreground">
                  Automatically backup your data
                </p>
              </div>
            </div>
            <Switch
              checked={advanced.backupEnabled}
              onCheckedChange={(checked) => updateAdvancedSettings({ backupEnabled: checked })}
            />
          </div>

          {advanced.backupEnabled && (
            <div className="space-y-2 pl-4">
              <Label htmlFor="backupFrequency">Backup Frequency</Label>
              <Select
                value={advanced.backupFrequency}
                onValueChange={(value) =>
                  updateAdvancedSettings({ backupFrequency: value as typeof advanced.backupFrequency })
                }
              >
                <SelectTrigger id="backupFrequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {backupFrequencies.map((freq) => (
                    <SelectItem key={freq.value} value={freq.value}>
                      {freq.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </SettingsSection>

      <Separator />

      <SettingsSection
        title="Danger Zone"
        description="Irreversible actions"
        variant="destructive"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-4">
            <div>
              <p className="font-medium text-destructive">Reset All Settings</p>
              <p className="text-sm text-muted-foreground">
                Reset all settings to their default values. This cannot be undone.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <AlertTriangle size={14} className="mr-2" />
                  Reset
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will reset all settings to their default values. Your data will not be
                    affected, but all custom settings will be lost.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => useSettingsStore.getState().resetSettings()}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Reset All Settings
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </SettingsSection>

      {/* Note: Advanced settings are saved automatically */}
      <div className="flex items-center justify-end gap-4 pt-4">
        <span className="text-sm text-muted-foreground">Changes saved automatically</span>
      </div>
    </div>
  );
}
