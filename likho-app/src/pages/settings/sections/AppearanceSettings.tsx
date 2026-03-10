import { useState, useEffect } from 'react';
import { Monitor, Moon, Sun, Minimize2, Maximize2, Layout, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useSettingsStore } from '@/store/settingsStore';
import { useTheme } from '@/providers/ThemeProvider';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SettingsSection } from './SettingsSection';

const accentColors = [
  { name: 'Blue', value: '#3b82f6', class: 'bg-blue-500' },
  { name: 'Purple', value: '#8b5cf6', class: 'bg-purple-500' },
  { name: 'Pink', value: '#ec4899', class: 'bg-pink-500' },
  { name: 'Red', value: '#ef4444', class: 'bg-red-500' },
  { name: 'Orange', value: '#f97316', class: 'bg-orange-500' },
  { name: 'Green', value: '#10b981', class: 'bg-green-500' },
  { name: 'Teal', value: '#14b8a6', class: 'bg-teal-500' },
  { name: 'Cyan', value: '#06b6d4', class: 'bg-cyan-500' },
];

export function AppearanceSettings() {
  const appearance = useSettingsStore((state) => state.appearance);
  const setTheme = useSettingsStore((state) => state.setTheme);
  const setAccentColor = useSettingsStore((state) => state.setAccentColor);
  const setDensity = useSettingsStore((state) => state.setDensity);
  const updateAppearanceSettings = useSettingsStore((state) => state.updateAppearanceSettings);
  const saveAppearanceSettingsToBackend = useSettingsStore((state) => state.saveAppearanceSettingsToBackend);
  const syncFromBackend = useSettingsStore((state) => state.syncFromBackend);
  const isSaving = useSettingsStore((state) => state.isSaving);
  const isLoading = useSettingsStore((state) => state.isLoading);
  const error = useSettingsStore((state) => state.error);
  
  // Get theme from context to sync with it
  const { setTheme: setContextTheme } = useTheme();

  const [showSuccess, setShowSuccess] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Sync settings from backend on mount
  useEffect(() => {
    syncFromBackend();
  }, [syncFromBackend]);

  // Track if there are unsaved changes
  useEffect(() => {
    setHasChanges(true);
  }, [appearance]);

  const handleThemeChange = (value: typeof appearance.theme) => {
    setTheme(value);
    setContextTheme(value);
    setHasChanges(true);
  };

  const handleAccentColorChange = (color: string) => {
    setAccentColor(color);
    setHasChanges(true);
  };

  const handleDensityChange = (density: typeof appearance.density) => {
    setDensity(density);
    setHasChanges(true);
  };

  const handleSettingChange = (updates: Partial<typeof appearance>) => {
    updateAppearanceSettings(updates);
    setHasChanges(true);
  };

  const handleSave = async () => {
    setShowSuccess(false);
    setLocalError(null);

    const success = await saveAppearanceSettingsToBackend();

    if (success) {
      setShowSuccess(true);
      setHasChanges(false);
      setTimeout(() => setShowSuccess(false), 3000);
    } else {
      setLocalError(error || 'Failed to save changes. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {(localError || error) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{localError || error}</AlertDescription>
        </Alert>
      )}

      {/* Unsaved Changes Warning */}
      {hasChanges && !showSuccess && (
        <Alert>
          <Eye className="h-4 w-4" />
          <AlertDescription>
            You have unsaved changes. Click &quot;Save Changes&quot; to persist them.
          </AlertDescription>
        </Alert>
      )}

      <SettingsSection
        title="Theme"
        description="Choose your preferred color scheme"
      >
        <RadioGroup
          value={appearance.theme}
          onValueChange={(value) => handleThemeChange(value as typeof appearance.theme)}
          className="grid gap-4 sm:grid-cols-3"
        >
          <label
            className={`flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 p-4 transition-all ${
              appearance.theme === 'light'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <RadioGroupItem value="light" className="sr-only" />
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
              <Sun className="text-orange-600" size={24} />
            </div>
            <div className="text-center">
              <p className="font-medium">Light</p>
              <p className="text-xs text-muted-foreground">Clean and bright</p>
            </div>
          </label>

          <label
            className={`flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 p-4 transition-all ${
              appearance.theme === 'dark'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <RadioGroupItem value="dark" className="sr-only" />
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800">
              <Moon className="text-slate-200" size={24} />
            </div>
            <div className="text-center">
              <p className="font-medium">Dark</p>
              <p className="text-xs text-muted-foreground">Easy on the eyes</p>
            </div>
          </label>

          <label
            className={`flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 p-4 transition-all ${
              appearance.theme === 'system'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <RadioGroupItem value="system" className="sr-only" />
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-orange-100 to-slate-800">
              <Monitor className="text-foreground" size={24} />
            </div>
            <div className="text-center">
              <p className="font-medium">System</p>
              <p className="text-xs text-muted-foreground">Match your OS</p>
            </div>
          </label>
        </RadioGroup>
      </SettingsSection>

      <Separator />

      <SettingsSection
        title="Accent Color"
        description="Choose your preferred accent color"
      >
        <div className="flex flex-wrap gap-3">
          {accentColors.map((color) => (
            <button
              key={color.value}
              onClick={() => handleAccentColorChange(color.value)}
              className={`group relative flex h-12 w-12 items-center justify-center rounded-full transition-all ${
                appearance.accentColor === color.value
                  ? 'ring-2 ring-primary ring-offset-2'
                  : 'hover:scale-110'
              }`}
              title={color.name}
            >
              <div className={`h-10 w-10 rounded-full ${color.class}`} />
              {appearance.accentColor === color.value && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
        
        {/* Preview of accent color */}
        <div className="mt-4 flex items-center gap-4 rounded-lg border border-border bg-muted/30 p-4">
          <div 
            className="h-10 w-10 rounded-full"
            style={{ backgroundColor: appearance.accentColor }}
          />
          <div className="flex-1">
            <p className="font-medium">Current Accent</p>
            <p className="text-sm text-muted-foreground">{appearance.accentColor}</p>
          </div>
          <Button 
            size="sm" 
            style={{ backgroundColor: appearance.accentColor }}
            className="text-white hover:opacity-90"
          >
            Preview Button
          </Button>
        </div>
      </SettingsSection>

      <Separator />

      <SettingsSection
        title="Interface Density"
        description="Adjust the spacing and density of the interface"
      >
        <div className="flex gap-4">
          {[
            { value: 'compact', icon: Minimize2, label: 'Compact' },
            { value: 'comfortable', icon: Layout, label: 'Comfortable' },
            { value: 'spacious', icon: Maximize2, label: 'Spacious' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => handleDensityChange(option.value as typeof appearance.density)}
              className={`flex flex-1 flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                appearance.density === option.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <option.icon size={24} />
              <span className="font-medium">{option.label}</span>
            </button>
          ))}
        </div>
      </SettingsSection>

      <Separator />

      <SettingsSection
        title="Accessibility"
        description="Adjust accessibility settings for better usability"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <p className="font-medium">Reduced Motion</p>
              <p className="text-sm text-muted-foreground">Minimize animations throughout the app</p>
            </div>
            <Switch
              checked={appearance.reducedMotion}
              onCheckedChange={(checked) =>
                handleSettingChange({ reducedMotion: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <p className="font-medium">High Contrast</p>
              <p className="text-sm text-muted-foreground">Increase contrast for better visibility</p>
            </div>
            <Switch
              checked={appearance.highContrast}
              onCheckedChange={(checked) =>
                handleSettingChange({ highContrast: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <p className="font-medium">Show Breadcrumbs</p>
              <p className="text-sm text-muted-foreground">Display breadcrumb navigation</p>
            </div>
            <Switch
              checked={appearance.showBreadcrumbs}
              onCheckedChange={(checked) =>
                handleSettingChange({ showBreadcrumbs: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <p className="font-medium">Show Page Icons</p>
              <p className="text-sm text-muted-foreground">Display icons next to page titles</p>
            </div>
            <Switch
              checked={appearance.showPageIcon}
              onCheckedChange={(checked) =>
                handleSettingChange({ showPageIcon: checked })
              }
            />
          </div>
        </div>
      </SettingsSection>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-4 pt-4">
        {showSuccess && (
          <span className="text-sm text-green-600">Changes saved successfully!</span>
        )}
        {hasChanges && !showSuccess && !isSaving && (
          <span className="text-sm text-amber-600">Unsaved changes</span>
        )}
        <Button onClick={handleSave} disabled={isSaving || isLoading || !hasChanges}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
    </div>
  );
}
