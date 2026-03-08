/**
 * Public view of a shared page (via share link). Read-only.
 */
import { useParams, Link } from 'react-router';
import { useSharedPage } from '@/hooks/useSharing';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/shadcn';
import '@blocknote/shadcn/style.css';
import { FileText } from 'lucide-react';
import type { SharedPageResponse } from '@/lib/sharingApi';

function SharedPageContent({ page }: { page: SharedPageResponse }) {
  const editor = useCreateBlockNote({
    initialContent: page.content ?? undefined,
    editable: false,
  });

  return (
    <>
      {page.cover_url && (
        <div className="h-48 w-full overflow-hidden bg-muted">
          <img src={page.cover_url} alt="" className="h-full w-full object-cover" />
        </div>
      )}
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-8">
        {editor && (
          <BlockNoteView
            editor={editor}
            editable={false}
            theme="light"
            data-read-only
            className="[&_.bn-editor]:min-h-[40vh]"
          />
        )}
      </main>
    </>
  );
}

export default function SharedPageView() {
  const { token } = useParams<{ token: string }>();
  const { data: page, isLoading, error } = useSharedPage(token);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-2 border-neutral-300 border-t-blue-600 dark:border-neutral-600 dark:border-t-blue-400" />
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Loading shared page…</p>
        </div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <div className="max-w-sm rounded-xl border border-border bg-popover p-6 text-center shadow-sm">
          <FileText className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
          <h1 className="mb-2 text-lg font-semibold text-popover-foreground">
            Page not found
          </h1>
          <p className="mb-4 text-sm text-muted-foreground">
            This share link may be invalid or expired.
          </p>
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

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-2">
            {page.icon && <span className="text-2xl">{page.icon}</span>}
            <h1 className="text-lg font-semibold text-foreground">
              {page.title || 'Untitled'}
            </h1>
            <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              Shared with you
            </span>
          </div>
          <Link
            to="/"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Likho
          </Link>
        </div>
      </header>

      <SharedPageContent page={page} />
    </div>
  );
}
