import { Mail, Bell, Smartphone, Monitor } from 'lucide-react';
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

export function NotificationSettings() {
  const notifications = useSettingsStore((state) => state.notifications);
  const updateEmailNotification = useSettingsStore((state) => state.updateEmailNotification);
  const updatePushNotification = useSettingsStore((state) => state.updatePushNotification);
  const updateInAppNotification = useSettingsStore((state) => state.updateInAppNotification);

  return (
    <div className="space-y-6">
      <SettingsSection
        title="Email Notifications"
        description="Configure which emails you receive"
      >
        <div className="space-y-4">
          {[
            { key: 'mentions', label: 'Mentions', desc: 'When someone mentions you' },
            { key: 'comments', label: 'Comments', desc: 'When someone comments on your pages' },
            { key: 'shares', label: 'Shares', desc: 'When someone shares a page with you' },
            { key: 'pageUpdates', label: 'Page Updates', desc: 'When pages you follow are updated' },
            { key: 'workspaceUpdates', label: 'Workspace Updates', desc: 'Important workspace announcements' },
          ].map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between rounded-lg border border-border p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Mail size={18} />
                </div>
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
              <Switch
                checked={notifications.email[item.key as keyof typeof notifications.email] as boolean}
                onCheckedChange={(checked) =>
                  updateEmailNotification(item.key as keyof typeof notifications.email, checked)
                }
              />
            </div>
          ))}

          <div className="space-y-2">
            <Label>Email Digest</Label>
            <Select
              value={notifications.email.digest}
              onValueChange={(value) => updateEmailNotification('digest', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily Digest</SelectItem>
                <SelectItem value="weekly">Weekly Digest</SelectItem>
                <SelectItem value="never">No Digest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </SettingsSection>

      <Separator />

      <SettingsSection
        title="Push Notifications"
        description="Configure mobile and desktop push notifications"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Smartphone size={18} />
              </div>
              <div>
                <p className="font-medium">Enable Push Notifications</p>
                <p className="text-sm text-muted-foreground">Receive notifications on your devices</p>
              </div>
            </div>
            <Switch
              checked={notifications.push.enabled}
              onCheckedChange={(checked) => updatePushNotification('enabled', checked)}
            />
          </div>

          {notifications.push.enabled && (
            <div className="space-y-4 pl-4">
              {[
                { key: 'mentions', label: 'Mentions', desc: 'When someone mentions you' },
                { key: 'comments', label: 'Comments', desc: 'When someone comments' },
                { key: 'shares', label: 'Shares', desc: 'When content is shared' },
                { key: 'reminders', label: 'Reminders', desc: 'Page and task reminders' },
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between rounded-lg border border-border p-4"
                >
                  <div>
                    <p className="font-medium">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch
                    checked={notifications.push[item.key as keyof typeof notifications.push] as boolean}
                    onCheckedChange={(checked) =>
                      updatePushNotification(item.key as keyof typeof notifications.push, checked)
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </SettingsSection>

      <Separator />

      <SettingsSection
        title="In-App Notifications"
        description="Configure notifications within the application"
      >
        <div className="space-y-4">
          {[
            { key: 'mentions', label: 'Mentions', desc: '@mentions in pages and comments' },
            { key: 'comments', label: 'Comments', desc: 'New comments on your content' },
            { key: 'shares', label: 'Shares', desc: 'When content is shared with you' },
            { key: 'pageUpdates', label: 'Page Updates', desc: 'Changes to pages you follow' },
            { key: 'workspaceUpdates', label: 'Workspace Updates', desc: 'Workspace announcements' },
          ].map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between rounded-lg border border-border p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Monitor size={18} />
                </div>
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
              <Switch
                checked={notifications.inApp[item.key as keyof typeof notifications.inApp] as boolean}
                onCheckedChange={(checked) =>
                  updateInAppNotification(item.key as keyof typeof notifications.inApp, checked)
                }
              />
            </div>
          ))}
        </div>
      </SettingsSection>
    </div>
  );
}
