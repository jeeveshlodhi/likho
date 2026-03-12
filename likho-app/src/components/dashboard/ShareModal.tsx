/**
 * Share modal — Google-Docs / Teams-style:
 *
 *  ┌─ Share "{title}" ──────────────────────────── [X] ─┐
 *  │  [email ...]              [role ▾]  [Invite]        │
 *  │                                                      │
 *  │  People with access                                  │
 *  │  ──────────────────────────────────────────────────  │
 *  │  [A] Alice · alice@ex.com          Viewer ▾  [×]    │
 *  │                                                      │
 *  │  General access                                      │
 *  │  ──────────────────────────────────────────────────  │
 *  │  [🌐] Anyone with the link ▾           Editor ▾    │
 *  │       Allow comments  ●  Allow export  ●            │
 *  │                                                      │
 *  │  [ Copy link ]                          [ Done ]    │
 *  └──────────────────────────────────────────────────────┘
 */
import { useEffect, useState } from 'react';
import {
  X, Lock, Globe, Trash2, Clock, Copy, Check,
  ChevronDown, ChevronUp, Mail, Settings,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  usePagePermissions,
  useSharePage,
  useRemovePermission,
  useCreateShareLink,
  usePageShareLinks,
  useRevokeShareLink,
  useUpdateShareLink,
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

// ── Constants ─────────────────────────────────────────────────────────

const ROLE_OPTIONS: { value: CollaborationRole; label: string; description: string }[] = [
  { value: 'viewer',    label: 'Viewer',    description: 'Can read but not edit or comment' },
  { value: 'commenter', label: 'Commenter', description: 'Can read and add comments' },
  { value: 'editor',    label: 'Editor',    description: 'Can edit content and add comments' },
  { value: 'admin',     label: 'Admin',     description: 'Can edit, manage sharing, and delete' },
];

const ROLE_COLOR: Record<string, string> = {
  viewer:    'bg-gray-500/10 text-gray-600 dark:text-gray-400',
  commenter: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  editor:    'bg-green-500/10 text-green-600 dark:text-green-400',
  admin:     'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  owner:     'bg-amber-500/10 text-amber-600 dark:text-amber-400',
};

// ── Component ─────────────────────────────────────────────────────────

interface ShareModalProps {
  pageId: string;
  pageTitle: string;
  open: boolean;
  onClose: () => void;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function ShareModal({ pageId, pageTitle, open, onClose }: ShareModalProps) {
  const { toast } = useToast();

  // Pages start with nanoid IDs locally and get a real UUID once synced to the backend.
  const isPageSynced = UUID_REGEX.test(pageId);

  // Invite form
  const [email, setEmail]           = useState('');
  const [inviteRole, setInviteRole] = useState<CollaborationRole>('viewer');

  // General access
  const [generalAccess, setGeneralAccess] = useState<'restricted' | 'anyone'>('restricted');
  const [linkRole, setLinkRole]           = useState<CollaborationRole>('viewer');

  // Advanced link settings
  const [advancedOpen, setAdvancedOpen]         = useState(false);
  const [linkExpiry, setLinkExpiry]             = useState('');
  const [linkMaxViews, setLinkMaxViews]         = useState('');
  const [linkAllowComments, setLinkAllowComments] = useState(true);
  const [linkAllowExport, setLinkAllowExport]   = useState(true);

  // Copy feedback
  const [copied, setCopied] = useState(false);

  // Queries — only fire when page is synced (UUID) and modal is open
  const { data: permissions = [], isLoading: permsLoading } =
    usePagePermissions(open && isPageSynced ? pageId : undefined);
  const { data: shareLinks = [], isLoading: linksLoading } =
    usePageShareLinks(open && isPageSynced ? pageId : undefined);

  const shareMutation      = useSharePage();
  const removeMutation     = useRemovePermission();
  const createLinkMutation = useCreateShareLink();
  const revokeLinkMutation = useRevokeShareLink();
  const updateLinkMutation = useUpdateShareLink();

  const activeLinks = shareLinks.filter((l: ShareLinkResponse) => !l.revoked_at);
  const activeLink  = activeLinks[0] ?? null;

  // Sync state with fetched links
  useEffect(() => {
    if (linksLoading) return;
    if (activeLink) {
      setGeneralAccess('anyone');
      setLinkRole((activeLink.role as CollaborationRole));
      if (activeLink.expires_at)
        setLinkExpiry(new Date(activeLink.expires_at).toISOString().slice(0, 16));
      if (activeLink.max_views) setLinkMaxViews(String(activeLink.max_views));
      setLinkAllowComments(activeLink.allow_comments);
      setLinkAllowExport(activeLink.allow_export);
    } else {
      setGeneralAccess('restricted');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linksLoading, activeLink?.id]);

  if (!open) return null;

  // ── Handlers ─────────────────────────────────────────────────────────

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || shareMutation.isPending) return;
    try {
      await shareMutation.mutateAsync({ pageId, email: trimmed, role: inviteRole });
      setEmail('');
      toast({ title: 'Invitation sent', description: `${trimmed} invited as ${inviteRole}` });
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
    } catch {
      toast({ title: 'Error', description: 'Failed to remove access', variant: 'destructive' });
    }
  };

  const handleGeneralAccessChange = async (value: 'restricted' | 'anyone') => {
    if (value === 'anyone' && !activeLink) {
      try {
        const newLink = await createLinkMutation.mutateAsync({
          pageId,
          payload: {
            role: linkRole,
            allow_comments: linkAllowComments,
            allow_export: linkAllowExport,
            expires_at: linkExpiry || undefined,
            max_views: linkMaxViews ? parseInt(linkMaxViews) : undefined,
          },
        });
        setGeneralAccess('anyone');
        const url = `${window.location.origin}/shared/${newLink.token}`;
        navigator.clipboard.writeText(url).catch(() => {});
        toast({ title: 'Link created', description: 'Anyone with the link can now access' });
      } catch (err: any) {
        toast({
          title: 'Error',
          description: err.response?.data?.detail || 'Failed to create link',
          variant: 'destructive',
        });
      }
    } else if (value === 'restricted') {
      try {
        for (const link of activeLinks) {
          await revokeLinkMutation.mutateAsync({ linkId: link.id, pageId });
        }
        setGeneralAccess('restricted');
        toast({ title: 'Access restricted', description: 'Public link disabled' });
      } catch {
        toast({ title: 'Error', description: 'Failed to restrict access', variant: 'destructive' });
      }
    } else {
      setGeneralAccess(value);
    }
  };

  const handleLinkRoleChange = async (newRole: CollaborationRole) => {
    setLinkRole(newRole);
    if (activeLink) {
      try {
        await updateLinkMutation.mutateAsync({
          linkId: activeLink.id,
          pageId,
          updates: { role: newRole },
        });
      } catch {
        toast({ title: 'Error', description: 'Failed to update link role', variant: 'destructive' });
      }
    }
  };

  const copyLink = () => {
    if (!activeLink) return;
    const url = `${window.location.origin}/shared/${activeLink.token}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      toast({ title: 'Link copied', description: url });
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      toast({ title: 'Error', description: 'Failed to copy link', variant: 'destructive' });
    });
  };

  // ── Render ───────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-lg rounded-xl bg-popover shadow-xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <h2 className="text-lg font-semibold truncate pr-4">Share "{pageTitle || 'Untitled'}"</h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {!isPageSynced ? (
            /* Page hasn't synced to the backend yet — its ID is still a nanoid. */
            <div className="px-5 py-6 text-sm text-muted-foreground space-y-2">
              <p>This page is still syncing to the server.</p>
              <p>Sharing will be available once it finishes syncing. Please try again in a moment.</p>
            </div>
          ) : (
            <>
          {/* ── Invite form ──────────────────────────────────────────── */}
          <div className="px-5 pb-5">
            <form onSubmit={handleInvite} className="flex gap-2">
              <div className="relative flex-1">
                <Mail
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                />
                <Input
                  type="email"
                  placeholder="Add people by email…"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-8 text-sm"
                />
              </div>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as CollaborationRole)}>
                <SelectTrigger className="w-[120px] shrink-0 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      <div>
                        <p className="font-medium text-sm">{o.label}</p>
                        <p className="text-xs text-muted-foreground">{o.description}</p>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="submit" disabled={!email.trim() || shareMutation.isPending} className="shrink-0 text-sm">
                {shareMutation.isPending ? 'Sending…' : 'Invite'}
              </Button>
            </form>
          </div>

          <div className="border-t border-border" />

          {/* ── People with access ───────────────────────────────────── */}
          <div className="px-5 py-4 space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              People with access
            </h3>
            {permsLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : permissions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No one else has access yet.</p>
            ) : (
              <ul className="space-y-0.5">
                {permissions.map((perm) => (
                  <li
                    key={perm.id}
                    className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/50"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold uppercase">
                      {(perm.user_name || perm.user_email || '?').charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium leading-tight">
                        {perm.user_name || perm.user_email || 'Unknown'}
                      </p>
                      {perm.user_name && perm.user_email && (
                        <p className="truncate text-xs text-muted-foreground">{perm.user_email}</p>
                      )}
                    </div>
                    <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-xs capitalize font-medium', ROLE_COLOR[perm.role] ?? '')}>
                      {perm.role}
                    </span>
                    {perm.expires_at && (
                      <span
                        className="shrink-0 text-muted-foreground"
                        title={`Expires ${format(new Date(perm.expires_at), 'MMM d')}`}
                      >
                        <Clock size={13} />
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemove(perm)}
                      disabled={removeMutation.isPending}
                      className="shrink-0 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
                      title="Remove access"
                    >
                      <Trash2 size={13} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-border" />

          {/* ── General access ───────────────────────────────────────── */}
          <div className="px-5 py-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              General access
            </h3>

            <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-4">
              {/* Access type row */}
              <div className="flex items-center gap-3">
                {/* Icon */}
                <div className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                  generalAccess === 'anyone' ? 'bg-blue-500/15' : 'bg-muted',
                )}>
                  {generalAccess === 'anyone'
                    ? <Globe size={17} className="text-blue-600 dark:text-blue-400" />
                    : <Lock size={17} className="text-muted-foreground" />
                  }
                </div>

                {/* Access type select + description */}
                <div className="flex-1 min-w-0">
                  <Select
                    value={generalAccess}
                    onValueChange={(v) => handleGeneralAccessChange(v as 'restricted' | 'anyone')}
                    disabled={createLinkMutation.isPending || revokeLinkMutation.isPending}
                  >
                    <SelectTrigger className="h-auto border-0 bg-transparent px-0 shadow-none text-sm font-semibold focus:ring-0 w-auto">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="restricted">
                        <div className="flex items-center gap-2 py-0.5">
                          <Lock size={14} />
                          <div>
                            <p className="font-medium">Restricted</p>
                            <p className="text-xs text-muted-foreground">Only invited people can open</p>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="anyone">
                        <div className="flex items-center gap-2 py-0.5">
                          <Globe size={14} />
                          <div>
                            <p className="font-medium">Anyone with the link</p>
                            <p className="text-xs text-muted-foreground">Anyone who has the link can access</p>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {generalAccess === 'restricted'
                      ? 'Only people explicitly invited above can access this page.'
                      : `Anyone with the link can access as ${linkRole}.`
                    }
                  </p>
                </div>

                {/* Role selector — only when "anyone" */}
                {generalAccess === 'anyone' && (
                  <Select
                    value={linkRole}
                    onValueChange={(v) => handleLinkRoleChange(v as CollaborationRole)}
                    disabled={updateLinkMutation.isPending}
                  >
                    <SelectTrigger className="w-[120px] shrink-0 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          <div>
                            <p className="font-medium text-sm">{o.label}</p>
                            <p className="text-xs text-muted-foreground">{o.description}</p>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Advanced options — only when "anyone" and link exists */}
              {generalAccess === 'anyone' && activeLink && (
                <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <Settings size={12} />
                      Link settings
                      {advancedOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-3 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Expires</Label>
                        <Input
                          type="datetime-local"
                          value={linkExpiry}
                          onChange={(e) => setLinkExpiry(e.target.value)}
                          className="text-xs h-8"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Max views</Label>
                        <Input
                          type="number"
                          min="1"
                          placeholder="Unlimited"
                          value={linkMaxViews}
                          onChange={(e) => setLinkMaxViews(e.target.value)}
                          className="text-xs h-8"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground">Allow comments</Label>
                      <Switch checked={linkAllowComments} onCheckedChange={setLinkAllowComments} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground">Allow export</Label>
                      <Switch checked={linkAllowExport} onCheckedChange={setLinkAllowExport} />
                    </div>
                    {(activeLink.view_count > 0 || activeLink.expires_at) && (
                      <p className="text-xs text-muted-foreground pt-1">
                        {activeLink.view_count} view{activeLink.view_count !== 1 ? 's' : ''}
                        {activeLink.max_views ? ` / ${activeLink.max_views} max` : ''}
                        {activeLink.expires_at
                          ? ` · Expires ${format(new Date(activeLink.expires_at), 'MMM d, yyyy')}`
                          : ''}
                      </p>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          </div>
            </>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-t border-border px-5 py-4">
          {generalAccess === 'anyone' && activeLink ? (
            <button
              type="button"
              onClick={copyLink}
              className={cn(
                'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                copied
                  ? 'border-green-500 bg-green-500/10 text-green-700 dark:text-green-400'
                  : 'border-border hover:bg-accent text-foreground',
              )}
            >
              {copied ? <Check size={15} /> : <Copy size={15} />}
              {copied ? 'Copied!' : 'Copy link'}
            </button>
          ) : (
            <div />
          )}
          <Button onClick={onClose}>Done</Button>
        </div>
      </div>
    </div>
  );
}
