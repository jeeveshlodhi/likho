/**
 * Modal for sharing an online page: invite by email, list permissions, create share link.
 */
import { useState } from 'react';
import { X, Mail, Link2, Copy, Trash2, User } from 'lucide-react';
import {
  usePagePermissions,
  useSharePage,
  useRemovePermission,
  useCreateShareLink,
} from '@/hooks/useSharing';
import type { PermissionResponse } from '@/lib/sharingApi';

interface ShareModalProps {
  pageId: string;
  pageTitle: string;
  open: boolean;
  onClose: () => void;
}

export default function ShareModal({ pageId, pageTitle, open, onClose }: ShareModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'viewer' | 'editor'>('viewer');
  const [linkCreated, setLinkCreated] = useState<{ token: string; role: string } | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const { data: permissions = [], isLoading: permsLoading } = usePagePermissions(open ? pageId : undefined);
  const shareMutation = useSharePage();
  const removeMutation = useRemovePermission();
  const createLinkMutation = useCreateShareLink();

  if (!open) return null;

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || shareMutation.isPending) return;
    try {
      await shareMutation.mutateAsync({ pageId, email: trimmed, role });
      setEmail('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemove = async (perm: PermissionResponse) => {
    if (!perm.user_id || removeMutation.isPending) return;
    try {
      await removeMutation.mutateAsync({ pageId, userId: perm.user_id });
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateLink = async () => {
    if (createLinkMutation.isPending) return;
    try {
      const link = await createLinkMutation.mutateAsync({ pageId, role: 'viewer' });
      setLinkCreated({ token: link.token, role: link.role });
    } catch (err) {
      console.error(err);
    }
  };

  const shareUrl = linkCreated
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/shared/${linkCreated.token}`
    : '';

  const copyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md rounded-xl bg-popover shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-lg font-semibold text-popover-foreground">
            Share &quot;{pageTitle || 'Untitled'}&quot;
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-4 space-y-6">
          {/* Invite by email */}
          <section>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
              <Mail size={14} />
              Invite by email
            </h3>
            <form onSubmit={handleInvite} className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'viewer' | 'editor')}
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
              </select>
              <button
                type="submit"
                disabled={!email.trim() || shareMutation.isPending}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {shareMutation.isPending ? 'Sending…' : 'Invite'}
              </button>
            </form>
          </section>

          {/* People with access */}
          <section>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
              <User size={14} />
              People with access
            </h3>
            {permsLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
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
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                        {(perm.user_name || perm.user_email || '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
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
                      <span className="text-xs text-muted-foreground capitalize">
                        {perm.role}
                      </span>
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
          </section>

          {/* Get link */}
          <section>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
              <Link2 size={14} />
              Get link
            </h3>
            {!linkCreated ? (
              <button
                type="button"
                onClick={handleCreateLink}
                disabled={createLinkMutation.isPending}
                className="rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-50"
              >
                {createLinkMutation.isPending ? 'Creating…' : 'Create share link'}
              </button>
            ) : (
              <div className="flex gap-2">
                <input
                  readOnly
                  value={shareUrl}
                  className="flex-1 rounded-lg border border-input bg-muted px-3 py-2 text-sm text-muted-foreground"
                />
                <button
                  type="button"
                  onClick={copyLink}
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                >
                  <Copy size={14} />
                  {copySuccess ? 'Copied!' : 'Copy'}
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
