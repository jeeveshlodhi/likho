/**
 * Enhanced Modal for sharing pages with full permission support.
 */
import { useState } from 'react';
import { X, Mail, Link2, Copy, Trash2, User, Settings, ChevronDown, ChevronUp, Clock, Eye } from 'lucide-react';
import { format } from 'date-fns';
import {
  usePagePermissions,
  useSharePage,
  useRemovePermission,
  useCreateShareLink,
  usePageShareLinks,
  useRevokeShareLink,
  type PermissionResponse,
  type ShareLinkResponse,
} from '@/hooks/useSharing';
import type { CollaborationRole } from '@/hooks/useCollaboration';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface ShareModalProps {
  pageId: string;
  pageTitle: string;
  open: boolean;
  onClose: () => void;
}

const ROLE_OPTIONS: { value: CollaborationRole; label: string; description: string; color: string }[] = [
  {
    value: 'viewer',
    label: 'Viewer',
    description: 'Can view but not edit or comment',
    color: 'bg-gray-500',
  },
  {
    value: 'commenter',
    label: 'Commenter',
    description: 'Can view and add comments',
    color: 'bg-blue-500',
  },
  {
    value: 'editor',
    label: 'Editor',
    description: 'Can edit content and add comments',
    color: 'bg-green-500',
  },
  {
    value: 'admin',
    label: 'Admin',
    description: 'Can edit, manage sharing, and delete',
    color: 'bg-purple-500',
  },
];

export default function ShareModal({ pageId, pageTitle, open, onClose }: ShareModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<CollaborationRole>('viewer');
  const [activeTab, setActiveTab] = useState('invite');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [linkSettings, setLinkSettings] = useState({
    expiresAt: '',
    maxViews: '',
    requireEmail: false,
    allowComments: true,
    allowExport: true,
  });
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const { toast } = useToast();
  const { data: permissions = [], isLoading: permsLoading } = usePagePermissions(open ? pageId : undefined);
  const { data: shareLinks = [], isLoading: linksLoading } = usePageShareLinks(open ? pageId : undefined);
  
  const shareMutation = useSharePage();
  const removeMutation = useRemovePermission();
  const createLinkMutation = useCreateShareLink();
  const revokeLinkMutation = useRevokeShareLink();

  if (!open) return null;

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || shareMutation.isPending) return;

    try {
      await shareMutation.mutateAsync({
        pageId,
        email: trimmed,
        role,
        expiresAt: linkSettings.expiresAt || undefined,
      });
      setEmail('');
      toast({ title: 'Invitation sent', description: `${trimmed} has been invited as ${role}` });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.detail || 'Failed to send invitation',
        variant: 'destructive',
      });
    }
  };

  const handleRemove = async (perm: PermissionResponse) => {
    if (!perm.user_id || removeMutation.isPending) return;
    try {
      await removeMutation.mutateAsync({ pageId, userId: perm.user_id });
      toast({ title: 'Access removed' });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to remove access', variant: 'destructive' });
    }
  };

  const handleCreateLink = async () => {
    if (createLinkMutation.isPending) return;
    try {
      await createLinkMutation.mutateAsync({
        pageId,
        payload: {
          role,
          expires_at: linkSettings.expiresAt || undefined,
          max_views: linkSettings.maxViews ? parseInt(linkSettings.maxViews) : undefined,
          require_email: linkSettings.requireEmail,
          allow_comments: linkSettings.allowComments,
          allow_export: linkSettings.allowExport,
        },
      });
      toast({ title: 'Share link created' });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.detail || 'Failed to create link',
        variant: 'destructive',
      });
    }
  };

  const handleRevokeLink = async (linkId: string) => {
    try {
      await revokeLinkMutation.mutateAsync({ linkId, pageId });
      toast({ title: 'Link revoked' });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to revoke link', variant: 'destructive' });
    }
  };

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/shared/${token}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(token);
      setTimeout(() => setCopiedLink(null), 2000);
    });
  };

  const activeLinks = shareLinks.filter((l: ShareLinkResponse) => !l.revoked_at);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-lg max-h-[85vh] overflow-hidden rounded-xl bg-popover shadow-xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-lg font-semibold text-popover-foreground truncate">
            Share "{pageTitle || 'Untitled'}"
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="invite">
                <User size={14} className="mr-1.5" />
                Invite People
              </TabsTrigger>
              <TabsTrigger value="link">
                <Link2 size={14} className="mr-1.5" />
                Share Link
              </TabsTrigger>
            </TabsList>

            {/* Invite Tab */}
            <TabsContent value="invite" className="space-y-4 mt-4">
              <form onSubmit={handleInvite} className="space-y-3">
                <div className="space-y-2">
                  <Label>Invite by email</Label>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="flex-1"
                    />
                    <Select value={role} onValueChange={(v) => setRole(v as CollaborationRole)}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            <div className="flex items-center gap-2">
                              <div className={cn("w-2 h-2 rounded-full", opt.color)} />
                              {opt.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {ROLE_OPTIONS.find(r => r.value === role)?.description}
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={!email.trim() || shareMutation.isPending}
                  className="w-full"
                >
                  {shareMutation.isPending ? 'Sending...' : 'Send Invitation'}
                </Button>
              </form>

              {/* People with access */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium">People with access</h3>
                {permsLoading ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : permissions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No one else has access yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {permissions.map((perm) => (
                      <li
                        key={perm.id}
                        className="flex items-center justify-between rounded-lg border border-border bg-muted px-3 py-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium">
                            {(perm.user_name || perm.user_email || '?').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {perm.user_name || perm.user_email || 'Unknown'}
                            </p>
                            {perm.user_name && perm.user_email && (
                              <p className="truncate text-xs text-muted-foreground">
                                {perm.user_email}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={cn(
                            "text-xs capitalize px-2 py-0.5 rounded-full",
                            perm.role === 'viewer' && "bg-gray-500/10 text-gray-600",
                            perm.role === 'commenter' && "bg-blue-500/10 text-blue-600",
                            perm.role === 'editor' && "bg-green-500/10 text-green-600",
                            perm.role === 'admin' && "bg-purple-500/10 text-purple-600",
                          )}>
                            {perm.role}
                          </span>
                          {perm.expires_at && (
                            <span className="text-xs text-muted-foreground" title="Expires">
                              <Clock size={12} />
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemove(perm)}
                            disabled={removeMutation.isPending}
                            className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                            title="Remove access"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </TabsContent>

            {/* Share Link Tab */}
            <TabsContent value="link" className="space-y-4 mt-4">
              {/* Create new link */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Create new link</Label>
                  <Select value={role} onValueChange={(v) => setRole(v as CollaborationRole)}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex items-center gap-2">
                            <div className={cn("w-2 h-2 rounded-full", opt.color)} />
                            {opt.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Advanced options */}
                <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                      <Settings size={14} />
                      Advanced options
                      {advancedOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-3 mt-2">
                    <div className="grid gap-2">
                      <Label className="text-xs">Expires at</Label>
                      <Input
                        type="datetime-local"
                        value={linkSettings.expiresAt}
                        onChange={(e) => setLinkSettings(s => ({ ...s, expiresAt: e.target.value }))}
                        className="text-sm"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-xs">Maximum views</Label>
                      <Input
                        type="number"
                        placeholder="Unlimited"
                        value={linkSettings.maxViews}
                        onChange={(e) => setLinkSettings(s => ({ ...s, maxViews: e.target.value }))}
                        className="text-sm"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Allow comments</Label>
                      <Switch
                        checked={linkSettings.allowComments}
                        onCheckedChange={(v: boolean) => setLinkSettings(s => ({ ...s, allowComments: v }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Allow export</Label>
                      <Switch
                        checked={linkSettings.allowExport}
                        onCheckedChange={(v: boolean) => setLinkSettings(s => ({ ...s, allowExport: v }))}
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <Button
                  onClick={handleCreateLink}
                  disabled={createLinkMutation.isPending}
                  variant="outline"
                  className="w-full"
                >
                  <Link2 size={16} className="mr-1.5" />
                  {createLinkMutation.isPending ? 'Creating...' : 'Create share link'}
                </Button>
              </div>

              {/* Active links */}
              {activeLinks.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Active links</h3>
                  <ul className="space-y-2">
                    {activeLinks.map((link: ShareLinkResponse) => (
                      <li
                        key={link.id}
                        className="rounded-lg border border-border p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "text-xs capitalize px-2 py-0.5 rounded-full",
                              link.role === 'viewer' && "bg-gray-500/10 text-gray-600",
                              link.role === 'commenter' && "bg-blue-500/10 text-blue-600",
                              link.role === 'editor' && "bg-green-500/10 text-green-600",
                            )}>
                              {link.role}
                            </span>
                            {link.expires_at && (
                              <span className="text-xs text-muted-foreground">
                                Expires {format(new Date(link.expires_at), 'MMM d')}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => handleRevokeLink(link.id)}
                            className="text-xs text-destructive hover:underline"
                          >
                            Revoke
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <Input
                            readOnly
                            value={`${window.location.origin}/shared/${link.token}`}
                            className="text-xs font-mono"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyLink(link.token)}
                          >
                            {copiedLink === link.token ? 'Copied!' : <Copy size={14} />}
                          </Button>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye size={12} />
                            {link.view_count}
                            {link.max_views && ` / ${link.max_views}`} views
                          </span>
                          {!link.allow_comments && <span>• No comments</span>}
                          {!link.allow_export && <span>• No export</span>}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
