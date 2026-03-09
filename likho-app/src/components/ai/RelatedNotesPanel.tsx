import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { SearchService } from '@/lib/search-service';
import type { RelatedNote } from '@/types/search';
import { Network, Loader2, RefreshCw } from 'lucide-react';

interface RelatedNotesPanelProps {
  noteId: string;
}

export function RelatedNotesPanel({ noteId }: RelatedNotesPanelProps) {
  const [related, setRelated] = useState<RelatedNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const load = async () => {
    if (!noteId) return;
    setLoading(true);
    setError(null);
    try {
      const results = await SearchService.aiFindRelatedNotes(noteId, 6);
      setRelated(results);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [noteId]);

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          <Network size={12} />
          Related Notes
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          title="Refresh"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-3">
          <Loader2 size={12} className="animate-spin" />
          Finding related notes…
        </div>
      )}

      {error && (
        <p className="text-xs text-muted-foreground py-2">
          Index this note first to find related notes.
        </p>
      )}

      {!loading && !error && related.length === 0 && (
        <p className="text-xs text-muted-foreground py-2">
          No related notes found. Save more notes to discover connections.
        </p>
      )}

      <ul className="space-y-1">
        {related.map((r) => (
          <li key={r.note_id}>
            <button
              onClick={() => navigate(`/dashboard/note/${r.note_id}`)}
              className="w-full text-left rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors group"
            >
              <span className="block truncate text-foreground group-hover:text-foreground">
                {r.note_title || 'Untitled'}
              </span>
              <span className="text-xs text-muted-foreground">
                {Math.round(r.similarity * 100)}% similar
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
