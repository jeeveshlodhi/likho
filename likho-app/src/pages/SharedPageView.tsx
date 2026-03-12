/**
 * Public view/edit of a shared page (via share link).
 * - Viewer/Commenter roles: read-only, auto-refreshes every 15 s.
 * - Editor/Admin/Owner roles: fully collaborative via Yjs WebSocket
 *   (same room as the owner's NoteEditor — real-time bidirectional sync).
 */
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/shadcn';
import '@blocknote/shadcn/style.css';
import { FileText, RefreshCw, Pencil, Eye, Sun, Moon, Monitor } from 'lucide-react';
import { api } from '@/lib/api';
import { useTheme, type Theme } from '@/providers/ThemeProvider';

interface SharedPage {
  id: string;
  title: string;
  icon: string | null;
  cover_url: string | null;
  content: any;
  role: string;
  allow_comments: boolean;
  allow_export: boolean;
  created_at: string;
  updated_at: string;
}

async function fetchSharedPage(token: string): Promise<SharedPage> {
  const { data } = await api.get(`/shared/${token}`);
  return data;
}

function useResolvedTheme() {
  const { theme } = useTheme();
  return theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    ? 'dark'
    : 'light';
}

// ── Read-only viewer ──────────────────────────────────────────────────────────

function SharedPageReadOnly({ page }: { page: SharedPage }) {
  const resolvedTheme = useResolvedTheme();
  const editor = useCreateBlockNote({
    initialContent: Array.isArray(page.content) && page.content.length > 0 ? page.content : undefined,
  });

  return (
    <BlockNoteView
      editor={editor}
      editable={false}
      theme={resolvedTheme}
      className="[&_.bn-editor]:min-h-[40vh]"
    />
  );
}

// ── Collaborative editor (editor/admin/owner role) ────────────────────────────
// Connects to the same Yjs room as the owner's NoteEditor via share_token auth.
// Changes are broadcast in real-time to all participants without any REST PATCH.

function SharedPageEditor({ token, page }: { token: string; page: SharedPage }) {
  const resolvedTheme = useResolvedTheme();

  // Create Y.Doc + WebsocketProvider synchronously so useCreateBlockNote
  // receives the collaboration config on its very first call.
  const [yjsSession] = useState(() => {
    const doc = new Y.Doc();
    const wsBase = (import.meta.env.VITE_WS_BASE as string | undefined) || 'ws://localhost:8000';
    // Connect to the owner's Yjs room using the share token for auth.
    // The backend validates share_token and places this client in the same
    // room as the authenticated owner — enabling true real-time sync.
    const provider = new WebsocketProvider(
      wsBase,
      `ws/collab/${page.id}?share_token=${encodeURIComponent(token)}`,
      doc,
      { connect: false }
    );
    return { doc, provider };
  });

  // Connect on mount, clean up on unmount
  useEffect(() => {
    yjsSession.provider.connect();
    return () => {
      yjsSession.provider.disconnect();
      yjsSession.provider.destroy();
      yjsSession.doc.destroy();
    };
  }, []); // intentionally empty — yjsSession is stable (lazy init)

  const editor = useCreateBlockNote({
    // Seed from REST content if the Yjs doc is still empty (e.g., first ever editor).
    // Once the Yjs doc has content (synced from server), BlockNote uses that instead.
    initialContent: Array.isArray(page.content) && page.content.length > 0 ? page.content : undefined,
    collaboration: {
      provider: yjsSession.provider,
      fragment: yjsSession.doc.getXmlFragment('document-store'),
      user: {
        name: 'Guest editor',
        color: '#FF6B6B',
      },
      showCursorLabels: 'activity' as const,
    },
  });

  return (
    <BlockNoteView
      editor={editor}
      editable={true}
      theme={resolvedTheme}
      className="[&_.bn-editor]:min-h-[60vh]"
    />
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function SharedPageView() {
  const { token } = useParams<{ token: string }>();

  const { theme, setTheme } = useTheme();

  function cycleTheme() {
    const next: Record<Theme, Theme> = { light: 'dark', dark: 'system', system: 'light' };
    setTheme(next[theme]);
  }

  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;

  const { data: page, isLoading, error, refetch } = useQuery({
    queryKey: ['shared-page', token],
    queryFn: () => fetchSharedPage(token!),
    enabled: !!token,
    // Viewers poll for live updates; editors get real-time sync via Yjs.
    // We still poll for metadata (title, cover) but can reduce frequency for editors.
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-2 border-neutral-300 border-t-blue-600" />
          <p className="text-sm text-muted-foreground">Loading shared page…</p>
        </div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <div className="max-w-sm rounded-xl border border-border bg-popover p-6 text-center shadow-sm">
          <FileText className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
          <h1 className="mb-2 text-lg font-semibold">Page not found</h1>
          <p className="mb-4 text-sm text-muted-foreground">This share link may be invalid or expired.</p>
          <Link
            to="/"
            className="inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Go home
          </Link>
        </div>
      </div>
    );
  }

  const canEdit = ['editor', 'admin', 'owner'].includes(page.role);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            {page.icon && <span className="text-xl shrink-0">{page.icon}</span>}
            <h1 className="truncate text-base font-semibold">{page.title || 'Untitled'}</h1>
            <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium shrink-0 ${
              canEdit
                ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                : 'bg-muted text-muted-foreground'
            }`}>
              {canEdit ? <Pencil size={10} /> : <Eye size={10} />}
              {canEdit ? 'Can edit' : 'View only'}
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {!canEdit && (
              <button
                type="button"
                onClick={() => refetch()}
                className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <RefreshCw size={13} /> Refresh
              </button>
            )}
            <button
              type="button"
              onClick={cycleTheme}
              title={`Theme: ${theme} (click to change)`}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <ThemeIcon size={15} />
            </button>
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">Likho</Link>
          </div>
        </div>
      </header>

      {page.cover_url && (
        <div className="h-48 w-full overflow-hidden bg-muted">
          <img src={page.cover_url} alt="" className="h-full w-full object-cover" />
        </div>
      )}

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-8">
        {canEdit
          // key=page.id: stable — do not remount the editor on background refetches
          ? <SharedPageEditor key={page.id} token={token!} page={page} />
          // key=updated_at: re-mount on each new version → auto-updates viewer
          : <SharedPageReadOnly key={page.updated_at} page={page} />
        }
      </main>

      {!canEdit && (
        <footer className="mx-auto max-w-4xl px-4 pb-8 sm:px-8">
          <p className="text-xs text-muted-foreground">
            Last updated {new Date(page.updated_at).toLocaleString()} · auto-refreshes every 30 s
          </p>
        </footer>
      )}
    </div>
  );
}
