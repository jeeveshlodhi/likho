import { Building2, Users, HardDrive, Share2, MessageSquare, LayoutTemplate, Globe, Lock } from 'lucide-react';
import { useSettingsStore } from '@/store/settingsStore';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SettingsSection } from './SettingsSection';

const spaceOptions = [
  { value: 'online', label: 'Online', description: 'Sync all changes to the cloud' },
  { value: 'offline', label: 'Offline', description: 'Keep data local by default' },
];

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function WorkspaceSettings() {
  const workspace = useSettingsStore((state) => state.workspace);
  const updateWorkspaceSettings = useSettingsStore((state) => state.updateWorkspaceSettings);

  return (
    <div className="space-y-6">
      <SettingsSection
        title="Workspace Information"
        description="Manage your workspace details"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="workspaceName">Workspace Name</Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                id="workspaceName"
                value={workspace.name}
                onChange={(e) => updateWorkspaceSettings({ name: e.target.value })}
                className="pl-10"
                placeholder="My Workspace"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultSpace">Default Space</Label>
            <Select
              value={workspace.defaultSpace}
              onValueChange={(value) =>
                updateWorkspaceSettings({ defaultSpace: value as typeof workspace.defaultSpace })
              }
            >
              <SelectTrigger id="defaultSpace">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {spaceOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {spaceOptions.find((o) => o.value === workspace.defaultSpace)?.description}
            </p>
          </div>
        </div>
      </SettingsSection>

      <Separator />

      <SettingsSection
        title="Member Management"
        description="Configure member and guest access"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Users size={18} />
              </div>
              <div>
                <p className="font-medium">Allow Guest Access</p>
                <p className="text-sm text-muted-foreground">Let guests join with limited permissions</p>
              </div>
            </div>
            <Switch
              checked={workspace.allowGuests}
              onCheckedChange={(checked) => updateWorkspaceSettings({ allowGuests: checked })}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="memberLimit">Member Limit</Label>
              <span className="text-sm text-muted-foreground">{workspace.memberLimit} members</span>
            </div>
            <Slider
              id="memberLimit"
              value={[workspace.memberLimit]}
              onValueChange={(value) => updateWorkspaceSettings({ memberLimit: value[0] })}
              min={1}
              max={100}
              step={1}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1 member</span>
              <span>100 members</span>
            </div>
          </div>
        </div>
      </SettingsSection>

      <Separator />

      <SettingsSection
        title="Storage"
        description="Manage workspace storage limits"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <HardDrive size={18} />
              </div>
              <div>
                <p className="font-medium">Storage Limit</p>
                <p className="text-sm text-muted-foreground">
                  Current limit: {formatBytes(workspace.storageLimit)}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="storageLimit">Adjust Storage Limit</Label>
              <span className="text-sm text-muted-foreground">{formatBytes(workspace.storageLimit)}</span>
            </div>
            <Slider
              id="storageLimit"
              value={[workspace.storageLimit / 1073741824]}
              onValueChange={(value) =>
                updateWorkspaceSettings({ storageLimit: value[0] * 1073741824 })
              }
              min={1}
              max={100}
              step={1}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1 GB</span>
              <span>100 GB</span>
            </div>
          </div>
        </div>
      </SettingsSection>

      <Separator />

      <SettingsSection
        title="Sharing & Collaboration"
        description="Control sharing and collaboration features"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                {workspace.publicSharing ? (
                  <Globe size={18} className="text-green-600" />
                ) : (
                  <Lock size={18} />
                )}
              </div>
              <div>
                <p className="font-medium">Public Sharing</p>
                <p className="text-sm text-muted-foreground">
                  Allow pages to be shared publicly via links
                </p>
              </div>
            </div>
            <Switch
              checked={workspace.publicSharing}
              onCheckedChange={(checked) => updateWorkspaceSettings({ publicSharing: checked })}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <MessageSquare size={18} />
              </div>
              <div>
                <p className="font-medium">Comments</p>
                <p className="text-sm text-muted-foreground">Enable commenting on pages</p>
              </div>
            </div>
            <Switch
              checked={workspace.allowComments}
              onCheckedChange={(checked) => updateWorkspaceSettings({ allowComments: checked })}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <LayoutTemplate size={18} />
              </div>
              <div>
                <p className="font-medium">Page Templates</p>
                <p className="text-sm text-muted-foreground">Allow creating and using templates</p>
              </div>
            </div>
            <Switch
              checked={workspace.allowTemplates}
              onCheckedChange={(checked) => updateWorkspaceSettings({ allowTemplates: checked })}
            />
          </div>
        </div>
      </SettingsSection>
    </div>
  );
}
