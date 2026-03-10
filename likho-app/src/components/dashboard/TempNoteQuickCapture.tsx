import { useState, useRef, useEffect } from 'react';
import { Sparkles, Clock, X, Send, Loader2, Cloud, Cpu } from 'lucide-react';
import { useTempNotesStore } from '@/store/tempNotesStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useAuthStore } from '@/store/authStore';
import { classifyNoteContent } from '@/lib/tempNoteClassifier';
import { CloudAiService } from '@/lib/cloudAiService';

const TTL_OPTIONS = [
  { label: '1 day', value: 1 },
  { label: '3 days', value: 3 },
  { label: '7 days', value: 7 },
  { label: '14 days', value: 14 },
  { label: '30 days', value: 30 },
];

export function TempNoteQuickCapture() {
  const { isQuickCaptureOpen, setQuickCaptureOpen, createNote, updateNote, settings } =
    useTempNotesStore();
  const { folders } = useWorkspaceStore();
  const { isAuthenticated, isGuest } = useAuthStore();

  const [content, setContent] = useState('');
  const [ttl, setTtl] = useState(settings.defaultTtlDays);
  const [classifying, setClassifying] = useState(false);

  const isOnline = isAuthenticated && !isGuest;

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isQuickCaptureOpen) {
      setTimeout(() => textareaRef.current?.focus(), 50);
      setContent('');
      setTtl(settings.defaultTtlDays);
    }
  }, [isQuickCaptureOpen, settings.defaultTtlDays]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setQuickCaptureOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [setQuickCaptureOpen]);

  // Cmd+Enter to save
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  const handleSave = async () => {
    if (!content.trim()) return;

    // Create the note immediately
    const note = createNote(content.trim(), ttl);

    // Run AI classification in the background
    setClassifying(true);
    try {
      const folderNames = folders.map((f) => f.name);

      if (isOnline) {
        // Use stronger cloud classifier when authenticated
        const result = await CloudAiService.classifyTempNote({
          content: content.trim(),
          existing_folders: folderNames,
        });
        updateNote(note.id, {
          suggestedFolder: result.folder ?? undefined,
          aiConfidence: result.confidence,
          tags: result.tags,
        });
      } else {
        // Fallback to local keyword classifier
        const result = classifyNoteContent(content.trim(), folderNames);
        updateNote(note.id, {
          suggestedFolder: result.folder ?? undefined,
          aiConfidence: result.confidence,
          tags: result.tags,
        });
      }
    } catch {
      // Classification failed silently — note is saved regardless
    } finally {
      setClassifying(false);
    }

    setContent('');
    setQuickCaptureOpen(false);
  };

  if (!isQuickCaptureOpen) return null;

  return (
    <div
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) setQuickCaptureOpen(false);
      }}
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 bg-black/40 backdrop-blur-sm"
    >
      <div className="w-full max-w-xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-in slide-in-from-top-4 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
              <Clock size={13} className="text-primary" />
            </div>
            Quick Note
            {isOnline ? (
              <span className="flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                <Cloud size={9} /> Cloud AI
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                <Cpu size={9} /> Local
              </span>
            )}
          </div>
          <button
            onClick={() => setQuickCaptureOpen(false)}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Textarea */}
        <div className="p-4">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Capture your thought… (⌘↵ to save)"
            rows={5}
            className="w-full resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm leading-relaxed placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-4 py-3 bg-muted/30">
          {/* TTL selector */}
          <div className="flex items-center gap-2">
            <Clock size={13} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Auto-delete after</span>
            <div className="flex gap-1">
              {TTL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTtl(opt.value)}
                  className={`rounded-full px-2 py-0.5 text-xs font-medium transition-colors ${
                    ttl === opt.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-accent'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={!content.trim() || classifying}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50 hover:bg-primary/90 transition-colors"
          >
            {classifying ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <Sparkles size={13} />
                Classifying…
              </>
            ) : (
              <>
                <Send size={13} />
                Save
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
