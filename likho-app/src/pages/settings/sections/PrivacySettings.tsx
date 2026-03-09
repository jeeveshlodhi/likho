import { Eye, EyeOff, Mail, Search, Database, BarChart3 } from 'lucide-react';
import { useSettingsStore } from '@/store/settingsStore';
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
import { SettingsSection } from './SettingsSection';

const visibilityOptions = [
  { value: 'public', label: 'Public', description: 'Anyone can view your profile' },
  { value: 'workspace', label: 'Workspace', description: 'Only workspace members can view' },
  { value: 'private', label: 'Private', description: 'Only you can view your profile' },
];

export function PrivacySettings() {
  const privacy = useSettingsStore((state) => state.privacy);
  const updatePrivacySettings = useSettingsStore((state) => state.updatePrivacySettings);

  return (
    <div className="space-y-6">
      <SettingsSection
        title="Profile Visibility"
        description="Control who can see your profile information"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="visibility">Profile Visibility</Label>
            <Select
              value={privacy.profileVisibility}
              onValueChange={(value) =>
                updatePrivacySettings({ profileVisibility: value as typeof privacy.profileVisibility })
              }
            >
              <SelectTrigger id="visibility">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {visibilityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {visibilityOptions.find((o) => o.value === privacy.profileVisibility)?.description}
            </p>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Mail size={18} />
              </div>
              <div>
                <p className="font-medium">Show Email Address</p>
                <p className="text-sm text-muted-foreground">Display your email on your public profile</p>
              </div>
            </div>
            <Switch
              checked={privacy.showEmail}
              onCheckedChange={(checked) => updatePrivacySettings({ showEmail: checked })}
            />
          </div>
        </div>
      </SettingsSection>

      <Separator />

      <SettingsSection
        title="Search Engine Visibility"
        description="Control how search engines index your content"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Search size={18} />
              </div>
              <div>
                <p className="font-medium">Allow Search Engines</p>
                <p className="text-sm text-muted-foreground">
                  Let search engines index your public pages
                </p>
              </div>
            </div>
            <Switch
              checked={privacy.allowSearchEngines}
              onCheckedChange={(checked) => updatePrivacySettings({ allowSearchEngines: checked })}
            />
          </div>

          {!privacy.allowSearchEngines && (
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/20">
              <EyeOff className="mt-0.5 h-5 w-5 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="font-medium text-amber-900 dark:text-amber-100">Search engines blocked</p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Your public pages will not appear in search engine results. This may take some time to take effect.
                </p>
              </div>
            </div>
          )}
        </div>
      </SettingsSection>

      <Separator />

      <SettingsSection
        title="Data & Analytics"
        description="Manage how your data is collected and used"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <BarChart3 size={18} />
              </div>
              <div>
                <p className="font-medium">Analytics Opt-in</p>
                <p className="text-sm text-muted-foreground">
                  Share anonymous usage data to help improve Likho
                </p>
              </div>
            </div>
            <Switch
              checked={privacy.analyticsOptIn}
              onCheckedChange={(checked) => updatePrivacySettings({ analyticsOptIn: checked })}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Database size={18} />
              </div>
              <div>
                <p className="font-medium">Data Collection</p>
                <p className="text-sm text-muted-foreground">
                  Allow collection of data for personalized features
                </p>
              </div>
            </div>
            <Switch
              checked={privacy.dataCollection}
              onCheckedChange={(checked) => updatePrivacySettings({ dataCollection: checked })}
            />
          </div>

          <div className="rounded-lg border border-border bg-muted/50 p-4">
            <div className="flex items-start gap-3">
              <Eye className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Privacy Policy</p>
                <p className="text-sm text-muted-foreground">
                  Learn more about how we handle your data in our{' '}
                  <a href="#" className="text-primary hover:underline">
                    Privacy Policy
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </SettingsSection>
    </div>
  );
}
