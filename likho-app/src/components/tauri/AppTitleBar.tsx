/**
 * Custom titlebar for Tauri (macOS and Windows).
 * - Mac: traffic-light controls on the left, then back/forward, then drag region.
 * - Windows: drag region with back/forward, then min/max/close on the right.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { ChevronLeft, ChevronRight, Minus, Square, X } from 'lucide-react';
import { isMac } from '@/utils/platform';

const TITLEBAR_HEIGHT = 36;

/** Threshold (px) of accumulated horizontal wheel delta to trigger back/forward */
const SWIPE_THRESHOLD = 80;
/** Reset accumulated delta after this ms of no wheel events */
const SWIPE_RESET_MS = 200;

export function getTitleBarHeight(): number {
  return TITLEBAR_HEIGHT;
}

export default function AppTitleBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [appWindow, setAppWindow] = useState<ReturnType<typeof import('@tauri-apps/api/window').getCurrentWindow> | null>(null);

  useEffect(() => {
    let mounted = true;
    import('@tauri-apps/api/window')
      .then(({ getCurrentWindow }) => {
        if (mounted) setAppWindow(getCurrentWindow());
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  // Back: enable when there is history. Forward: always enabled (navigate(1) no-ops if no forward entry)
  useEffect(() => {
    setCanGoBack(window.history.length > 1);
    setCanGoForward(true);
  }, [location.pathname]);

  // Trackpad two-finger horizontal swipe for back/forward (browser-style)
  const swipeAccum = useRef(0);
  const swipeResetId = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return; // only horizontal swipes
      swipeAccum.current += e.deltaX;
      if (swipeResetId.current) clearTimeout(swipeResetId.current);
      swipeResetId.current = setTimeout(() => {
        swipeAccum.current = 0;
        swipeResetId.current = null;
      }, SWIPE_RESET_MS);
      if (swipeAccum.current >= SWIPE_THRESHOLD) {
        swipeAccum.current = 0;
        if (swipeResetId.current) clearTimeout(swipeResetId.current);
        navigate(-1); // back (swipe right → positive deltaX)
        e.preventDefault();
      } else if (swipeAccum.current <= -SWIPE_THRESHOLD) {
        swipeAccum.current = 0;
        if (swipeResetId.current) clearTimeout(swipeResetId.current);
        navigate(1); // forward (swipe left → negative deltaX)
        e.preventDefault();
      }
    };
    document.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      document.removeEventListener('wheel', onWheel);
      if (swipeResetId.current) clearTimeout(swipeResetId.current);
    };
  }, [navigate]);

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleForward = useCallback(() => {
    navigate(1);
  }, [navigate]);

  const handleMinimize = useCallback(() => {
    appWindow?.minimize();
  }, [appWindow]);

  const handleMaximize = useCallback(() => {
    appWindow?.toggleMaximize();
  }, [appWindow]);

  const handleClose = useCallback(() => {
    appWindow?.close();
  }, [appWindow]);

  const handleDrag = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      if (e.detail === 2) {
        appWindow?.toggleMaximize();
      } else {
        appWindow?.startDragging();
      }
    },
    [appWindow]
  );

  const mac = isMac();

  return (
    <header
      className="flex h-9 shrink-0 items-center border-b border-border bg-surface"
      style={{ height: TITLEBAR_HEIGHT }}
      data-tauri-drag-region
    >
      {/* Mac: window controls on the left */}
      {mac && (
        <div className="flex items-center gap-1.5 pl-3 pr-2" onMouseDown={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-3 w-3 items-center justify-center rounded-full bg-[#ff5f57] transition-colors hover:bg-[#ff5f57]/90"
            aria-label="Close"
          />
          <button
            type="button"
            onClick={handleMinimize}
            className="flex h-3 w-3 items-center justify-center rounded-full bg-[#febc2e] transition-colors hover:bg-[#febc2e]/90"
            aria-label="Minimize"
          />
          <button
            type="button"
            onClick={handleMaximize}
            className="flex h-3 w-3 items-center justify-center rounded-full bg-[#28c840] transition-colors hover:bg-[#28c840]/90"
            aria-label="Maximize"
          />
        </div>
      )}

      {/* Back / Forward — stopPropagation so clicks don't trigger window drag */}
      <div className="flex items-center border-r border-border" onMouseDown={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={handleBack}
          disabled={!canGoBack}
          className="flex h-full items-center justify-center px-2.5 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-40 disabled:hover:bg-transparent"
          aria-label="Back"
        >
          <ChevronLeft size={18} strokeWidth={2.5} />
        </button>
        <button
          type="button"
          onClick={handleForward}
          disabled={!canGoForward}
          className="flex h-full items-center justify-center px-2.5 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-40 disabled:hover:bg-transparent"
          aria-label="Forward"
        >
          <ChevronRight size={18} strokeWidth={2.5} />
        </button>
      </div>

      {/* Drag region / title (center on Mac, fill on Windows) */}
      <div
        className="flex-1 flex items-center justify-center px-3 select-none"
        data-tauri-drag-region
        onMouseDown={handleDrag}
      >
        <span className="text-xs font-medium text-muted-foreground truncate max-w-[200px]">
          Likho
        </span>
      </div>

      {/* Windows: window controls on the right */}
      {!mac && (
        <div className="flex items-center">
          <button
            type="button"
            onClick={handleMinimize}
            className="flex h-full w-12 items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Minimize"
          >
            <Minus size={16} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={handleMaximize}
            className="flex h-full w-12 items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Maximize"
          >
            <Square size={14} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-full w-12 items-center justify-center text-muted-foreground hover:bg-destructive hover:text-destructive-foreground"
            aria-label="Close"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>
      )}
    </header>
  );
}
