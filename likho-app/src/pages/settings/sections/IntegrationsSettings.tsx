import { useState } from 'react';
import { Plug, Key, Webhook, Copy, Trash2, Plus, ExternalLink, Check } from 'lucide-react';
import { useSettingsStore } from '@/store/settingsStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { SettingsSection } from './SettingsSection';

const mockConnectedApps = [
  { id: '1', name: 'Slack', icon: '💬', connected: true, lastUsed: '2024-03-01T10:00:00Z' },
  { id: '2', name: 'GitHub', icon: '🐙', connected: true, lastUsed: '2024-03-05T14:30:00Z' },
  { id: '3', name: 'Google Drive', icon: '📁', connected: false, lastUsed: null },
  { id: '4', name: 'Notion', icon: '📝', connected: false, lastUsed: null },
  { id: '5', name: 'Figma', icon: '🎨', connected: true, lastUsed: '2024-03-08T09:15:00Z' },
];

export function IntegrationsSettings() {
  const { integrations, addApiKey, revokeApiKey, addWebhook, removeWebhook, toggleWebhook } =
    useSettingsStore();
  const [newApiKeyName, setNewApiKeyName] = useState('');
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopyKey = (id: string) => {
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <SettingsSection
        title="Connected Apps"
        description="Manage your connected third-party applications"
      >
        <div className="space-y-3">
          {mockConnectedApps.map((app) => (
            <div
              key={app.id}
              className="flex items-center justify-between rounded-lg border border-border p-4"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{app.icon}</span>
                <div>
                  <p className="font-medium">{app.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {app.connected ? `Last used ${formatDate(app.lastUsed)}` : 'Not connected'}
                  </p>
                </div>
              </div>
              <Button variant={app.connected ? 'outline' : 'default'} size="sm">
                {app.connected ? (
                  <>
                    <ExternalLink size={14} className="mr-2" />
                    Manage
                  </>
                ) : (
                  'Connect'
                )}
              </Button>
            </div>
          ))}
        </div>
      </SettingsSection>

      <Separator />

      <SettingsSection
        title="API Keys"
        description="Manage API keys for programmatic access"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {integrations.apiKeys.length} active API key
              {integrations.apiKeys.length !== 1 ? 's' : ''}
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus size={14} className="mr-2" />
                  Create API Key
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create API Key</DialogTitle>
                  <DialogDescription>
                    Create a new API key for programmatic access to your workspace.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="keyName">Key Name</Label>
                    <Input
                      id="keyName"
                      placeholder="e.g., Production API"
                      value={newApiKeyName}
                      onChange={(e) => setNewApiKeyName(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={() => {
                      if (newApiKeyName) {
                        addApiKey(newApiKeyName, '••••••••••••••••', ['read', 'write']);
                        setNewApiKeyName('');
                      }
                    }}
                  >
                    Create Key
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {integrations.apiKeys.length > 0 ? (
            <div className="space-y-3">
              {integrations.apiKeys.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center justify-between rounded-lg border border-border p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <Key size={18} />
                    </div>
                    <div>
                      <p className="font-medium">{key.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {key.keyPreview} • Created {formatDate(key.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyKey(key.id)}
                    >
                      {copiedKey === key.id ? (
                        <Check size={14} className="text-green-600" />
                      ) : (
                        <Copy size={14} />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => revokeApiKey(key.id)}
                    >
                      <Trash2 size={14} className="text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-8 text-center">
              <Key className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">No API keys created yet</p>
            </div>
          )}
        </div>
      </SettingsSection>

      <Separator />

      <SettingsSection
        title="Webhooks"
        description="Configure webhooks for real-time event notifications"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {integrations.webhooks.length} configured webhook
              {integrations.webhooks.length !== 1 ? 's' : ''}
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus size={14} className="mr-2" />
                  Add Webhook
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Webhook</DialogTitle>
                  <DialogDescription>
                    Add a webhook URL to receive event notifications.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="webhookUrl">Webhook URL</Label>
                    <Input
                      id="webhookUrl"
                      placeholder="https://example.com/webhook"
                      value={newWebhookUrl}
                      onChange={(e) => setNewWebhookUrl(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={() => {
                      if (newWebhookUrl) {
                        addWebhook(newWebhookUrl, ['page.created', 'page.updated']);
                        setNewWebhookUrl('');
                      }
                    }}
                  >
                    Add Webhook
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {integrations.webhooks.length > 0 ? (
            <div className="space-y-3">
              {integrations.webhooks.map((webhook) => (
                <div
                  key={webhook.id}
                  className="flex items-center justify-between rounded-lg border border-border p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <Webhook size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{webhook.url}</p>
                      <p className="text-sm text-muted-foreground">
                        {webhook.events.join(', ')} • Created {formatDate(webhook.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={webhook.active}
                      onCheckedChange={() => toggleWebhook(webhook.id)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeWebhook(webhook.id)}
                    >
                      <Trash2 size={14} className="text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-8 text-center">
              <Webhook className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">No webhooks configured yet</p>
            </div>
          )}
        </div>
      </SettingsSection>

      {/* Note: Integrations are saved automatically */}
      <div className="flex items-center justify-end gap-4 pt-4">
        <span className="text-sm text-muted-foreground">Changes saved automatically</span>
      </div>
    </div>
  );
}
