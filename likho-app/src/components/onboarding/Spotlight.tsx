/**
 * Spotlight component
 * Creates a highlight overlay that darkens the rest of the screen
 * with a cutout around the target element
 */

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface SpotlightProps {
  /** Whether the spotlight is visible */
  isOpen: boolean;
  /** CSS selector for the target element to highlight */
  targetSelector?: string;
  /** Padding around the target element in pixels */
  padding?: number;
  /** Border radius of the spotlight cutout in pixels */
  borderRadius?: number;
  /** Opacity of the dark overlay (0-1) */
  overlayOpacity?: number;
  /** Color of the dark overlay */
  overlayColor?: string;
  /** Color of the spotlight border/glow */
  spotlightColor?: string;
  /** Whether to show a pulsing animation on the spotlight */
  pulseAnimation?: boolean;
  /** Whether clicking outside the spotlight closes/pauses the tour */
  closeOnClickOutside?: boolean;
  /** Callback when clicking outside the spotlight */
  onClickOutside?: () => void;
  /** Callback when the spotlight position updates */
  onPositionUpdate?: (rect: DOMRect | null) => void;
  /** Z-index of the spotlight overlay */
  zIndex?: number;
  /** Children to render inside the spotlight (tooltips, etc.) */
  children?: React.ReactNode;
  /** Additional CSS class names */
  className?: string;
}

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export const Spotlight: React.FC<SpotlightProps> = ({
  isOpen,
  targetSelector,
  padding = 8,
  borderRadius = 8,
  overlayOpacity = 0.75,
  overlayColor = 'rgb(0, 0, 0)',
  spotlightColor = 'rgb(59, 130, 246)', // blue-500
  pulseAnimation = true,
  closeOnClickOutside = true,
  onClickOutside,
  onPositionUpdate,
  zIndex = 9999,
  children,
}) => {
  const [targetRect, setTargetRect] = useState<SpotlightRect | null>(null);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // Calculate target element position
  const updateTargetPosition = useCallback(() => {
    if (!targetSelector) {
      setTargetRect(null);
      onPositionUpdate?.(null);
      return;
    }

    const targetElement = document.querySelector(targetSelector);
    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      const spotlightRect: SpotlightRect = {
        top: rect.top - padding,
        left: rect.left - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      };
      setTargetRect(spotlightRect);
      onPositionUpdate?.(rect);

      // Scroll target into view if needed
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
      });
    } else {
      setTargetRect(null);
      onPositionUpdate?.(null);
    }
  }, [targetSelector, padding, onPositionUpdate]);

  // Update position on mount and when dependencies change
  useEffect(() => {
    if (isOpen) {
      // Small delay to allow DOM to settle
      const timer = setTimeout(updateTargetPosition, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, updateTargetPosition]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
      if (isOpen) {
        updateTargetPosition();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen, updateTargetPosition]);

  // Handle scroll
  useEffect(() => {
    const handleScroll = () => {
      if (isOpen) {
        updateTargetPosition();
      }
    };

    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [isOpen, updateTargetPosition]);

  // Handle click outside
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (closeOnClickOutside && onClickOutside) {
        onClickOutside();
      }
    },
    [closeOnClickOutside, onClickOutside]
  );

  // Create SVG path for the cutout
  const createClipPath = () => {
    if (!targetRect) {
      return '';
    }

    const { top, left, width, height } = targetRect;
    const w = windowSize.width;
    const h = windowSize.height;

    // Create a path that covers the entire screen with a hole for the target
    return `
      M 0 0
      H ${w}
      V ${h}
      H 0
      Z
      M ${left} ${top}
      h ${width}
      a ${borderRadius} ${borderRadius} 0 0 1 ${borderRadius} ${borderRadius}
      v ${height - borderRadius * 2}
      a ${borderRadius} ${borderRadius} 0 0 1 -${borderRadius} ${borderRadius}
      h -${width}
      a ${borderRadius} ${borderRadius} 0 0 1 -${borderRadius} -${borderRadius}
      v -${height - borderRadius * 2}
      a ${borderRadius} ${borderRadius} 0 0 1 ${borderRadius} -${borderRadius}
      Z
    `;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="fixed inset-0"
          style={{ zIndex }}
        >
          {/* Dark overlay with cutout */}
          <svg
            className="absolute inset-0 w-full h-full"
            style={{ pointerEvents: 'none' }}
          >
            <defs>
              <mask id="spotlight-mask">
                <rect width="100%" height="100%" fill="white" />
                {targetRect && (
                  <motion.rect
                    initial={false}
                    animate={{
                      x: targetRect.left,
                      y: targetRect.top,
                      width: targetRect.width,
                      height: targetRect.height,
                    }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    rx={borderRadius}
                    ry={borderRadius}
                    fill="black"
                  />
                )}
              </mask>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill={overlayColor}
              opacity={overlayOpacity}
              mask="url(#spotlight-mask)"
              style={{ pointerEvents: 'auto' }}
              onClick={handleOverlayClick}
            />
          </svg>

          {/* Spotlight border/glow */}
          {targetRect && (
            <motion.div
              initial={false}
              animate={{
                x: targetRect.left,
                y: targetRect.top,
                width: targetRect.width,
                height: targetRect.height,
              }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className={cn(
                'absolute border-2 pointer-events-none',
                pulseAnimation && 'animate-pulse'
              )}
              style={{
                borderRadius,
                borderColor: spotlightColor,
                boxShadow: `0 0 0 4px ${spotlightColor}20, 0 0 20px ${spotlightColor}40`,
              }}
            />
          )}

          {/* Children (tooltips, etc.) */}
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Spotlight;
