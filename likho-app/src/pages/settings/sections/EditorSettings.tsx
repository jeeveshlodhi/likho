import { useState, useEffect } from 'react';
import { Type, Save, Clock, FileText, Zap, Bot, Loader2, AlertCircle } from 'lucide-react';
import { useSettingsStore } from '@/store/settingsStore';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SettingsSection } from './SettingsSection';

const fontSizes = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
];

const templates = [
  { value: 'blank', label: 'Blank Page' },
  { value: 'note', label: 'Quick Note' },
  { value: 'meeting', label: 'Meeting Notes' },
  { value: 'todo', label: 'To-Do List' },
  { value: 'document', label: 'Document' },
];

export function EditorSettings() {
  const editor = useSettingsStore((state) => state.editor);
  const updateEditorSettings = useSettingsStore((state) => state.updateEditorSettings);
  const saveEditorSettingsToBackend = useSettingsStore((state) => state.saveEditorSettingsToBackend);
  const syncFromBackend = useSettingsStore((state) => state.syncFromBackend);
  const isSaving = useSettingsStore((state) => state.isSaving);
  const isLoading = useSettingsStore((state) => state.isLoading);
  const error = useSettingsStore((state) => state.error);

  const [showSuccess, setShowSuccess] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Sync settings from backend on mount
  useEffect(() => {
    syncFromBackend();
  }, [syncFromBackend]);

  const handleSave = async () => {
    setShowSuccess(false);
    setLocalError(null);

    const success = await saveEditorSettingsToBackend();

    if (success) {
      setShowSuccess(true);
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

      <SettingsSection
        title="Typography"
        description="Customize the default text appearance"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fontSize">Default Font Size</Label>
            <Select
              value={editor.defaultFontSize}
              onValueChange={(value) =>
                updateEditorSettings({ defaultFontSize: value as typeof editor.defaultFontSize })
              }
              disabled={isLoading}
            >
              <SelectTrigger id="fontSize">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fontSizes.map((size) => (
                  <SelectItem key={size.value} value={size.value}>
                    {size.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="lineHeight">Line Height</Label>
              <span className="text-sm text-muted-foreground">{editor.defaultLineHeight.toFixed(1)}</span>
            </div>
            <Slider
              id="lineHeight"
              value={[editor.defaultLineHeight]}
              onValueChange={(value) => updateEditorSettings({ defaultLineHeight: value[0] })}
              min={1.0}
              max={2.5}
              step={0.1}
              disabled={isLoading}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Compact</span>
              <span>Spacious</span>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Type size={18} />
              </div>
              <div>
                <p className="font-medium">Spell Check</p>
                <p className="text-sm text-muted-foreground">Highlight misspelled words</p>
              </div>
            </div>
            <Switch
              checked={editor.spellCheck}
              onCheckedChange={(checked) => updateEditorSettings({ spellCheck: checked })}
              disabled={isLoading}
            />
          </div>
        </div>
      </SettingsSection>

      <Separator />

      <SettingsSection
        title="Auto-Save"
        description="Configure automatic saving behavior"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Save size={18} />
              </div>
              <div>
                <p className="font-medium">Enable Auto-Save</p>
                <p className="text-sm text-muted-foreground">Automatically save your changes</p>
              </div>
            </div>
            <Switch
              checked={editor.autoSave}
              onCheckedChange={(checked) => updateEditorSettings({ autoSave: checked })}
              disabled={isLoading}
            />
          </div>

          {editor.autoSave && (
            <div className="space-y-2 pl-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="autoSaveInterval">Auto-Save Interval</Label>
                <span className="text-sm text-muted-foreground">{editor.autoSaveInterval}s</span>
              </div>
              <Slider
                id="autoSaveInterval"
                value={[editor.autoSaveInterval]}
                onValueChange={(value) => updateEditorSettings({ autoSaveInterval: value[0] })}
                min={5}
                max={300}
                step={5}
                disabled={isLoading}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>5 seconds</span>
                <span>5 minutes</span>
              </div>
            </div>
          )}
        </div>
      </SettingsSection>

      <Separator />

      <SettingsSection
        title="Editor Features"
        description="Enable or disable editor features"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <FileText size={18} />
              </div>
              <div>
                <p className="font-medium">Show Word Count</p>
                <p className="text-sm text-muted-foreground">Display word count in the editor</p>
              </div>
            </div>
            <Switch
              checked={editor.showWordCount}
              onCheckedChange={(checked) => updateEditorSettings({ showWordCount: checked })}
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Clock size={18} />
              </div>
              <div>
                <p className="font-medium">Show Reading Time</p>
                <p className="text-sm text-muted-foreground">Estimate reading time for pages</p>
              </div>
            </div>
            <Switch
              checked={editor.showReadingTime}
              onCheckedChange={(checked) => updateEditorSettings({ showReadingTime: checked })}
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Zap size={18} />
              </div>
              <div>
                <p className="font-medium">Slash Commands</p>
                <p className="text-sm text-muted-foreground">Type / to access quick commands</p>
              </div>
            </div>
            <Switch
              checked={editor.enableSlashCommands}
              onCheckedChange={(checked) => updateEditorSettings({ enableSlashCommands: checked })}
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Bot size={18} />
              </div>
              <div>
                <p className="font-medium">AI Assistance</p>
                <p className="text-sm text-muted-foreground">Enable AI-powered writing suggestions</p>
              </div>
            </div>
            <Switch
              checked={editor.enableAIAssistance}
              onCheckedChange={(checked) => updateEditorSettings({ enableAIAssistance: checked })}
              disabled={isLoading}
            />
          </div>
        </div>
      </SettingsSection>

      <Separator />

      <SettingsSection
        title="Default Template"
        description="Choose the default template for new pages"
      >
        <div className="space-y-2">
          <Label htmlFor="defaultTemplate">New Page Template</Label>
          <Select
            value={editor.defaultPageTemplate}
            onValueChange={(value) => updateEditorSettings({ defaultPageTemplate: value })}
            disabled={isLoading}
          >
            <SelectTrigger id="defaultTemplate">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {templates.map((template) => (
                <SelectItem key={template.value} value={template.value}>
                  {template.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </SettingsSection>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-4 pt-4">
        {showSuccess && (
          <span className="text-sm text-green-600">Changes saved successfully!</span>
        )}
        <Button onClick={handleSave} disabled={isSaving || isLoading}>
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
