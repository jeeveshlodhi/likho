import { Keyboard, RotateCcw, Terminal, Command, FileText, Bold, Italic, Underline, List, ListOrdered, CheckSquare, Quote, Minus } from 'lucide-react';
import { useSettingsStore } from '@/store/settingsStore';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { SettingsSection } from './SettingsSection';

const shortcutGroups = [
  {
    name: 'General',
    icon: Command,
    shortcuts: [
      { key: 'new-page', label: 'New Page', defaultShortcut: 'Cmd+N' },
      { key: 'search', label: 'Search', defaultShortcut: 'Cmd+K' },
      { key: 'command-palette', label: 'Command Palette', defaultShortcut: 'Cmd+Shift+P' },
      { key: 'save', label: 'Save', defaultShortcut: 'Cmd+S' },
    ],
  },
  {
    name: 'Formatting',
    icon: FileText,
    shortcuts: [
      { key: 'bold', label: 'Bold', defaultShortcut: 'Cmd+B' },
      { key: 'italic', label: 'Italic', defaultShortcut: 'Cmd+I' },
      { key: 'underline', label: 'Underline', defaultShortcut: 'Cmd+U' },
      { key: 'strikethrough', label: 'Strikethrough', defaultShortcut: 'Cmd+Shift+X' },
      { key: 'link', label: 'Insert Link', defaultShortcut: 'Cmd+K' },
      { key: 'code', label: 'Inline Code', defaultShortcut: 'Cmd+E' },
    ],
  },
  {
    name: 'Headings',
    icon: FileText,
    shortcuts: [
      { key: 'heading-1', label: 'Heading 1', defaultShortcut: 'Cmd+Alt+1' },
      { key: 'heading-2', label: 'Heading 2', defaultShortcut: 'Cmd+Alt+2' },
      { key: 'heading-3', label: 'Heading 3', defaultShortcut: 'Cmd+Alt+3' },
    ],
  },
  {
    name: 'Lists',
    icon: List,
    shortcuts: [
      { key: 'bullet-list', label: 'Bullet List', defaultShortcut: 'Cmd+Shift+8' },
      { key: 'numbered-list', label: 'Numbered List', defaultShortcut: 'Cmd+Shift+7' },
      { key: 'todo-list', label: 'To-Do List', defaultShortcut: 'Cmd+Shift+4' },
    ],
  },
  {
    name: 'Blocks',
    icon: Quote,
    shortcuts: [
      { key: 'quote', label: 'Quote', defaultShortcut: 'Cmd+Shift+>' },
      { key: 'divider', label: 'Divider', defaultShortcut: 'Cmd+Shift+-' },
    ],
  },
];

export function ShortcutsSettings() {
  const shortcuts = useSettingsStore((state) => state.shortcuts);
  const updateShortcut = useSettingsStore((state) => state.updateShortcut);
  const resetShortcuts = useSettingsStore((state) => state.resetShortcuts);
  const toggleVimMode = useSettingsStore((state) => state.toggleVimMode);

  return (
    <div className="space-y-6">
      <SettingsSection
        title="Keyboard Shortcuts"
        description="Customize keyboard shortcuts for common actions"
      >
        <div className="space-y-6">
          {shortcutGroups.map((group) => (
            <div key={group.name} className="space-y-3">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <group.icon size={16} />
                {group.name}
              </h4>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.key}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <span className="text-sm">{shortcut.label}</span>
                    <Input
                      value={shortcuts.shortcuts[shortcut.key] || shortcut.defaultShortcut}
                      onChange={(e) => updateShortcut(shortcut.key, e.target.value)}
                      className="h-8 w-40 text-center font-mono text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SettingsSection>

      <Separator />

      <SettingsSection
        title="Vim Mode"
        description="Enable Vim-style keyboard navigation"
      >
        <div className="flex items-center justify-between rounded-lg border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <Terminal size={18} />
            </div>
            <div>
              <p className="font-medium">Enable Vim Mode</p>
              <p className="text-sm text-muted-foreground">
                Use Vim keybindings for navigation and editing
              </p>
            </div>
          </div>
          <Switch checked={shortcuts.vimMode} onCheckedChange={toggleVimMode} />
        </div>

        {shortcuts.vimMode && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/20">
            <p className="text-sm text-amber-900 dark:text-amber-100">
              <strong>Note:</strong> Vim mode changes how you interact with the editor.
              Press <kbd className="rounded bg-amber-200 px-1 dark:bg-amber-900">Esc</kbd> to enter
              normal mode and <kbd className="rounded bg-amber-200 px-1 dark:bg-amber-900">i</kbd> to
              enter insert mode.
            </p>
          </div>
        )}
      </SettingsSection>

      <Separator />

      <SettingsSection
        title="Custom Shortcuts"
        description="Add your own custom keyboard shortcuts"
      >
        <div className="space-y-4">
          {Object.entries(shortcuts.customShortcuts).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(shortcuts.customShortcuts).map(([action, shortcut]) => (
                <div
                  key={action}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <span className="text-sm">{action}</span>
                  <code className="rounded bg-muted px-2 py-1 font-mono text-sm">{shortcut}</code>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-8 text-center">
              <Keyboard className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">No custom shortcuts defined</p>
              <p className="text-xs text-muted-foreground">
                Custom shortcuts can be added through the command palette
              </p>
            </div>
          )}
        </div>
      </SettingsSection>

      <Separator />

      <SettingsSection
        title="Reset Shortcuts"
        description="Reset all shortcuts to their default values"
      >
        <div className="flex items-center justify-between rounded-lg border border-border p-4">
          <div>
            <p className="font-medium">Reset to Defaults</p>
            <p className="text-sm text-muted-foreground">
              This will reset all keyboard shortcuts to their default values
            </p>
          </div>
          <Button variant="outline" onClick={resetShortcuts}>
            <RotateCcw size={14} className="mr-2" />
            Reset
          </Button>
        </div>
      </SettingsSection>

      {/* Note: Shortcuts are saved automatically */}
      <div className="flex items-center justify-end gap-4 pt-4">
        <span className="text-sm text-muted-foreground">Changes saved automatically</span>
      </div>
    </div>
  );
}
