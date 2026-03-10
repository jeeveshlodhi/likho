import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Sparkles, Clock, X, Send, Loader2, Cloud, Cpu, Zap, Keyboard, CornerDownLeft
} from 'lucide-react';
import { useTempNotesStore } from '@/store/tempNotesStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useAuthStore } from '@/store/authStore';
import { classifyNoteContent } from '@/lib/tempNoteClassifier';
import { CloudAiService } from '@/lib/cloudAiService';
import { motion, AnimatePresence } from 'framer-motion';

// Condensed to the three most-used intervals to keep the footer uncluttered
const TTL_OPTIONS = [
  { label: '1 day',  short: '1d',  value: 1  },
  { label: '3 days', short: '3d',  value: 3  },
  { label: '7 days', short: '7d',  value: 7  },
  { label: '2 wks',  short: '2w',  value: 14 },
  { label: '30 days',short: '30d', value: 30 },
];

// Counts visible words (trims, splits on whitespace, filters empty strings)
function wordCount(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export function TempNoteQuickCapture() {
  const { isQuickCaptureOpen, setQuickCaptureOpen, createNote, updateNote, settings } =
    useTempNotesStore();
  const { folders } = useWorkspaceStore();
  const { isAuthenticated, isGuest } = useAuthStore();

  const [content, setContent]       = useState('');
  const [ttl, setTtl]               = useState(settings.defaultTtlDays);
  const [classifying, setClassifying] = useState(false);

  const isOnline = isAuthenticated && !isGuest;

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef  = useRef<HTMLDivElement>(null);

  // Auto-grow the textarea as the user types
  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 320)}px`;
  }, []);

  useEffect(() => {
    if (isQuickCaptureOpen) {
      setContent('');
      setTtl(settings.defaultTtlDays);
      // Defer so the animation has finished before focusing
      setTimeout(() => {
        textareaRef.current?.focus();
        resizeTextarea();
      }, 60);
    }
  }, [isQuickCaptureOpen, settings.defaultTtlDays, resizeTextarea]);

  // Close on Escape - using capture phase for reliability
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isQuickCaptureOpen) {
        e.preventDefault();
        e.stopPropagation();
        setQuickCaptureOpen(false);
      }
    };
    document.addEventListener('keydown', handler, true);
    return () => document.removeEventListener('keydown', handler, true);
  }, [isQuickCaptureOpen, setQuickCaptureOpen]);

  // ⌘↵ / Ctrl+↵ to save, Escape to close
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setQuickCaptureOpen(false);
      return;
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  const handleSave = async () => {
    if (!content.trim()) return;

    // Create immediately so the user sees the note right away
    const note = createNote(content.trim(), ttl);
    setContent('');
    setQuickCaptureOpen(false);

    // Run AI classification in the background (after UI closes)
    setClassifying(true);
    try {
      const folderNames = folders.map((f) => f.name);
      if (isOnline) {
        const result = await CloudAiService.classifyTempNote({
          content: note.content,
          existing_folders: folderNames,
        });
        updateNote(note.id, {
          suggestedFolder: result.folder ?? undefined,
          aiConfidence:    result.confidence,
          tags:            result.tags,
        });
      } else {
        const result = classifyNoteContent(note.content, folderNames);
        updateNote(note.id, {
          suggestedFolder: result.folder ?? undefined,
          aiConfidence:    result.confidence,
          tags:            result.tags,
        });
      }
    } catch {
      // Silent — note is already saved
    } finally {
      setClassifying(false);
    }
  };

  const words = wordCount(content);
  const chars = content.length;
  const canSave = content.trim().length > 0;

  return (
    <AnimatePresence>
      {isQuickCaptureOpen && (
        <motion.div
          ref={overlayRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => {
            if (e.target === overlayRef.current) setQuickCaptureOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4 
            bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.96 }}
            transition={{ 
              type: "spring", 
              damping: 25, 
              stiffness: 300,
              duration: 0.25 
            }}
            className="w-full max-w-xl overflow-hidden rounded-2xl 
              bg-white dark:bg-zinc-900 
              shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5),0_0_0_1px_rgba(0,0,0,0.1)]
              dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.1)]"
          >
            {/* ── Animated gradient accent bar ── */}
            <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 
              animate-gradient-x" />

            {/* ── Header ── */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3 
              border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                {/* Icon */}
                <div className="flex h-8 w-8 items-center justify-center rounded-xl 
                  bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
                  <Zap size={15} className="text-white" fill="currentColor" />
                </div>

                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Quick Note
                  </span>
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Capture your thoughts instantly
                  </span>
                </div>

                {/* AI engine badge */}
                {isOnline ? (
                  <span className="flex items-center gap-1.5 rounded-full 
                    bg-indigo-50 dark:bg-indigo-500/15
                    px-2.5 py-1 text-[10px] font-medium 
                    text-indigo-600 dark:text-indigo-400
                    border border-indigo-100 dark:border-indigo-500/20">
                    <Cloud size={10} />
                    Cloud AI
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 rounded-full 
                    bg-zinc-100 dark:bg-zinc-800
                    px-2.5 py-1 text-[10px] font-medium 
                    text-zinc-600 dark:text-zinc-400
                    border border-zinc-200 dark:border-zinc-700">
                    <Cpu size={10} />
                    Local AI
                  </span>
                )}
              </div>

              <button
                onClick={() => setQuickCaptureOpen(false)}
                className="rounded-lg p-2 text-zinc-400 hover:text-zinc-600 
                  hover:bg-zinc-100 dark:text-zinc-500 dark:hover:text-zinc-300 
                  dark:hover:bg-zinc-800 transition-all duration-200"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* ── Textarea ── */}
            <div className="px-5 pt-4 pb-3">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  resizeTextarea();
                }}
                onKeyDown={handleKeyDown}
                placeholder="What's on your mind?"
                style={{ minHeight: '120px', height: '120px' }}
                className="w-full resize-none rounded-xl 
                  bg-zinc-50 dark:bg-zinc-800/50
                  border border-zinc-200 dark:border-zinc-700
                  px-4 py-3.5 text-sm leading-relaxed text-zinc-900 dark:text-zinc-100
                  placeholder:text-zinc-400 dark:placeholder:text-zinc-500
                  focus:outline-none focus:ring-2 focus:ring-indigo-500/30 
                  focus:border-indigo-500/50 focus:bg-white dark:focus:bg-zinc-800
                  transition-all duration-200"
              />

              {/* Word / char counter — shown only once the user starts typing */}
              {content.length > 0 && (
                <motion.p 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 flex items-center gap-3 text-[11px] 
                    text-zinc-400 dark:text-zinc-500 tabular-nums"
                >
                  <span>{words} {words === 1 ? 'word' : 'words'}</span>
                  <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                  <span>{chars} characters</span>
                </motion.p>
              )}
            </div>

            {/* ── Footer ── */}
            <div className="flex items-center justify-between gap-4 
              border-t border-zinc-200 dark:border-zinc-800
              bg-zinc-50/50 dark:bg-zinc-900/50 px-5 py-3.5">

              {/* TTL selector */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
                  <Clock size={13} />
                  <span className="text-[11px] font-medium">Auto-delete in</span>
                </div>
                <div className="flex gap-0.5 rounded-lg bg-zinc-200/50 dark:bg-zinc-800/50 p-0.5">
                  {TTL_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setTtl(opt.value)}
                      title={opt.label}
                      className={`rounded-md px-2.5 py-1 text-[11px] font-medium 
                        transition-all duration-200 ${
                        ttl === opt.value
                          ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                          : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                      }`}
                    >
                      {opt.short}
                    </button>
                  ))}
                </div>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSave}
                disabled={!canSave || classifying}
                className={`flex shrink-0 items-center gap-2 rounded-lg 
                  px-4 py-2 text-xs font-semibold text-white
                  transition-all duration-200 ${
                  canSave && !classifying
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5'
                    : 'bg-zinc-300 dark:bg-zinc-700 cursor-not-allowed'
                }`}
              >
                {classifying ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Send size={12} />
                    Save Note
                    <kbd className="hidden sm:inline-flex items-center gap-0.5 ml-1 
                      px-1.5 py-0.5 rounded text-[9px] font-mono 
                      bg-white/20 text-white/90">
                      <CornerDownLeft size={8} />
                    </kbd>
                  </>
                )}
              </button>
            </div>

            {/* ── Keyboard hint bar ── */}
            <div className="flex items-center justify-between px-5 py-2.5 
              bg-zinc-100 dark:bg-zinc-800/50
              border-t border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-1.5 text-zinc-400 dark:text-zinc-500">
                <Keyboard size={11} />
                <span className="text-[10px]">Keyboard shortcuts</span>
              </div>
              <div className="flex items-center gap-3">
                <kbd className="flex items-center gap-1 text-[10px] text-zinc-500 dark:text-zinc-400">
                  <span className="font-mono px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 
                    text-zinc-600 dark:text-zinc-300">⌘</span>
                  <span className="font-mono px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 
                    text-zinc-600 dark:text-zinc-300">↵</span>
                  <span className="ml-0.5">to save</span>
                </kbd>
                <kbd className="flex items-center gap-1 text-[10px] text-zinc-500 dark:text-zinc-400">
                  <span className="font-mono px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 
                    text-zinc-600 dark:text-zinc-300">Esc</span>
                  <span className="ml-0.5">to close</span>
                </kbd>
                {isOnline && (
                  <>
                    <span className="text-zinc-300 dark:text-zinc-600">|</span>
                    <span className="flex items-center gap-1 text-[10px] 
                      text-indigo-500 dark:text-indigo-400">
                      <Sparkles size={9} />
                      Auto-classifies
                    </span>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
