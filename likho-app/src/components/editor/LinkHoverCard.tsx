import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ExternalLink, Copy, Check, Globe } from 'lucide-react';

interface TooltipState {
  href: string;
  x: number;
  y: number;
  width: number;
}

interface LinkHoverCardProps {
  containerRef: React.RefObject<HTMLElement | null>;
}

export function LinkHoverCard({ containerRef }: LinkHoverCardProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [copied, setCopied] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isOverTooltipRef = useRef(false);
  const currentAnchorRef = useRef<HTMLAnchorElement | null>(null);

  const cancelHide = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
  }, []);

  const scheduleHide = useCallback(() => {
    cancelHide();
    hideTimerRef.current = setTimeout(() => {
      if (!isOverTooltipRef.current) setTooltip(null);
    }, 180);
  }, [cancelHide]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseOver = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a[href]') as HTMLAnchorElement | null;
      if (!anchor) return;

      // Skip mailto / javascript links
      if (anchor.href.startsWith('mailto:') || anchor.href.startsWith('javascript:')) return;

      if (anchor === currentAnchorRef.current) {
        cancelHide();
        return;
      }

      currentAnchorRef.current = anchor;
      cancelHide();
      const rect = anchor.getBoundingClientRect();

      // Position below the link, clamped so it doesn't go off-screen right
      const tooltipWidth = 340;
      let x = rect.left;
      if (x + tooltipWidth > window.innerWidth - 12) {
        x = window.innerWidth - tooltipWidth - 12;
      }

      setTooltip({
        href: anchor.href,
        x,
        y: rect.bottom + 6,
        width: rect.width,
      });
    };

    const handleMouseOut = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a[href]') as HTMLAnchorElement | null;
      if (!anchor) return;
      scheduleHide();
    };

    // Intercept all clicks on anchor tags — open only via our button
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a[href]') as HTMLAnchorElement | null;
      if (!anchor) return;
      e.preventDefault();
      e.stopPropagation();
    };

    container.addEventListener('mouseover', handleMouseOver);
    container.addEventListener('mouseout', handleMouseOut);
    container.addEventListener('click', handleClick, true);

    return () => {
      container.removeEventListener('mouseover', handleMouseOver);
      container.removeEventListener('mouseout', handleMouseOut);
      container.removeEventListener('click', handleClick, true);
    };
  }, [containerRef, cancelHide, scheduleHide]);

  // Hide when clicking outside the tooltip
  useEffect(() => {
    if (!tooltip) return;
    const handler = (e: MouseEvent) => {
      const tooltipEl = document.querySelector('[data-link-tooltip]');
      if (tooltipEl && !tooltipEl.contains(e.target as Node)) {
        setTooltip(null);
        currentAnchorRef.current = null;
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [tooltip]);

  if (!tooltip) return null;

  // Friendly display URL
  const displayUrl = (() => {
    try {
      const u = new URL(tooltip.href);
      const path = u.pathname !== '/' ? u.pathname : '';
      const combined = u.hostname + path;
      return combined.length > 45 ? combined.slice(0, 43) + '…' : combined;
    } catch {
      return tooltip.href.length > 45 ? tooltip.href.slice(0, 43) + '…' : tooltip.href;
    }
  })();

  const handleOpen = () => {
    window.open(tooltip.href, '_blank', 'noopener,noreferrer');
    setTooltip(null);
    currentAnchorRef.current = null;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(tooltip.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard not available
    }
  };

  // Clamp bottom position so card doesn't overflow viewport
  const yPos =
    tooltip.y + 56 > window.innerHeight ? tooltip.y - 56 - 12 : tooltip.y;

  return createPortal(
    <div
      data-link-tooltip
      style={{ top: yPos, left: tooltip.x, maxWidth: 340 }}
      className="
        fixed z-[9999] flex items-center gap-1.5
        rounded-lg border border-border bg-popover
        px-2.5 py-1.5 shadow-lg
        text-sm animate-in fade-in-0 zoom-in-95 duration-100
      "
      onMouseEnter={() => {
        isOverTooltipRef.current = true;
        cancelHide();
      }}
      onMouseLeave={() => {
        isOverTooltipRef.current = false;
        scheduleHide();
      }}
    >
      {/* Favicon / globe icon */}
      <Globe size={13} className="shrink-0 text-muted-foreground" />

      {/* URL display */}
      <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
        {displayUrl}
      </span>

      {/* Divider */}
      <div className="mx-0.5 h-3.5 w-px shrink-0 bg-border" />

      {/* Open link */}
      <button
        type="button"
        onClick={handleOpen}
        className="
          flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5
          text-xs font-medium text-primary
          hover:bg-accent hover:text-primary/80
          transition-colors
        "
        title="Open in new tab"
      >
        <ExternalLink size={11} />
        Open link
      </button>

      {/* Copy */}
      <button
        type="button"
        onClick={handleCopy}
        className="
          flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5
          text-xs text-muted-foreground
          hover:bg-accent hover:text-foreground
          transition-colors
        "
        title="Copy URL"
      >
        {copied ? (
          <Check size={11} className="text-green-500" />
        ) : (
          <Copy size={11} />
        )}
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>,
    document.body,
  );
}
