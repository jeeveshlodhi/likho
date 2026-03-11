/**
 * CelebrationAnimation component
 * Confetti animation to celebrate onboarding completion
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  size: number;
  duration: number;
  delay: number;
}

export interface CelebrationAnimationProps {
  /** Whether to show the celebration */
  isActive: boolean;
  /** Callback when animation completes */
  onComplete?: () => void;
  /** Duration of the celebration in ms */
  duration?: number;
  /** Number of confetti pieces */
  pieceCount?: number;
  /** Additional className */
  className?: string;
}

const colors = [
  '#3b82f6', // blue-500
  '#ef4444', // red-500
  '#22c55e', // green-500
  '#eab308', // yellow-500
  '#a855f7', // purple-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#f97316', // orange-500
];

export const CelebrationAnimation: React.FC<CelebrationAnimationProps> = ({
  isActive,
  onComplete,
  duration = 3000,
  pieceCount = 50,
  className,
}) => {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    if (isActive) {
      // Generate confetti pieces
      const newPieces: ConfettiPiece[] = Array.from({ length: pieceCount }, (_, i) => ({
        id: i,
        x: Math.random() * window.innerWidth,
        y: -20 - Math.random() * 100,
        rotation: Math.random() * 360,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 8 + Math.random() * 12,
        duration: 2000 + Math.random() * 1000,
        delay: Math.random() * 500,
      }));
      setPieces(newPieces);

      // Show text after a short delay
      const textTimer = setTimeout(() => setShowText(true), 300);

      // Complete animation
      const completeTimer = setTimeout(() => {
        setShowText(false);
        onComplete?.();
      }, duration);

      return () => {
        clearTimeout(textTimer);
        clearTimeout(completeTimer);
      };
    } else {
      setPieces([]);
      setShowText(false);
    }
  }, [isActive, duration, pieceCount, onComplete]);

  return (
    <AnimatePresence>
      {isActive && (
        <div
          className={cn(
            'fixed inset-0 pointer-events-none z-[10000]',
            className
          )}
        >
          {/* Confetti pieces */}
          {pieces.map((piece) => (
            <motion.div
              key={piece.id}
              initial={{
                x: piece.x,
                y: piece.y,
                rotate: piece.rotation,
                opacity: 1,
                scale: 0,
              }}
              animate={{
                x: piece.x + (Math.random() - 0.5) * 200,
                y: window.innerHeight + 50,
                rotate: piece.rotation + 720,
                opacity: 0,
                scale: 1,
              }}
              transition={{
                duration: piece.duration / 1000,
                delay: piece.delay / 1000,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              style={{
                position: 'absolute',
                width: piece.size,
                height: piece.size,
                backgroundColor: piece.color,
                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
              }}
            />
          ))}

          {/* Celebration text */}
          <AnimatePresence>
            {showText && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      delay: 0.2,
                      type: 'spring',
                      stiffness: 200,
                      damping: 15,
                    }}
                    className="text-6xl mb-4"
                  >
                    🎉
                  </motion.div>
                  <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-4xl font-bold text-white drop-shadow-lg"
                  >
                    Congratulations!
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-xl text-white/90 mt-2 drop-shadow-md"
                  >
                    You&apos;re ready to start your journey
                  </motion.p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CelebrationAnimation;
