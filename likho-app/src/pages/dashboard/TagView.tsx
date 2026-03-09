import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Hash, ArrowLeft, FileText, Calendar } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useLinkStore } from '@/store/linkStore';

export default function TagView() {
  const { tagName } = useParams<{ tagName: string }>();
  const navigate = useNavigate();
  
  const notes = useWorkspaceStore((s) => s.notes);
  const tags = useLinkStore((s) => s.tags);
  const tagUsages = useLinkStore((s) => s.tagUsages);
  
  const decodedTagName = decodeURIComponent(tagName || '');
  
  const tag = useMemo(() => 
    tags.find(t => t.name.toLowerCase() === decodedTagName.toLowerCase()),
    [tags, decodedTagName]
  );
  
  const taggedNotes = useMemo(() => {
    if (!tag) return [];
    const noteIds = tagUsages
      .filter(t => t.tagId === tag.id)
      .map(t => t.noteId);
    return notes.filter(n => noteIds.includes(n.id));
  }, [tag, tagUsages, notes]);
  
  if (!tag) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-background">
        <div className="text-center">
          <Hash className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
          <h1 className="text-2xl font-bold mb-2">Tag not found</h1>
          <p className="text-muted-foreground mb-4">The tag "{decodedTagName}" doesn't exist yet.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col bg-background">
      <div 
        className="border-b border-border px-6 py-6"
        style={{ backgroundColor: `${tag.color || '#f59e0b'}10` }}
      >
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        
        <div className="flex items-center gap-4">
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: `${tag.color || '#f59e0b'}20` }}
          >
            <Hash 
              className="h-8 w-8"
              style={{ color: tag.color || '#f59e0b' }}
            />
          </div>
          
          <div>
            <h1 className="text-3xl font-bold">#{tag.name}</h1>
            <p className="text-muted-foreground">
              {taggedNotes.length} {taggedNotes.length === 1 ? 'note' : 'notes'}
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-6">
        {taggedNotes.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <Hash className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>No notes with this tag yet</p>
            <p className="text-sm mt-1">Add #{tag.name} to any note to see it here</p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-3">
            {taggedNotes.map((note) => (
              <button
                key={note.id}
                onClick={() => navigate(`/dashboard/note/${note.id}`)}
                className="w-full flex items-start gap-4 p-4 bg-card border border-border rounded-lg
                         hover:border-primary/50 hover:shadow-sm transition-all text-left"
              >
                <div className="text-3xl">{note.icon || '📄'}</div>
                
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-lg truncate">
                    {note.title || 'Untitled'}
                  </div>
                  
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground"
                  >
                    <span className="flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5" />
                      {note.pageType || 'note'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(note.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
