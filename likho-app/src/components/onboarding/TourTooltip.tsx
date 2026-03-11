/**
 * TourTooltip component
 * Tooltip that appears during the onboarding tour
 * Shows step content with navigation controls
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  X,
  RotateCcw,
  Check,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { type TourStep } from './OnboardingSteps';

export interface TourTooltipProps {
  /** Current step data */
  step: TourStep;
  /** Current step index */
  stepIndex: number;
  /** Total number of steps */
  totalSteps: number;
  /** Progress percentage */
  progress: number;
  /** Whether we can go back */
  canGoBack: boolean;
  /** Whether we can go next */
  canGoNext: boolean;
  /** Callback to go to next step */
  onNext: () => void;
  /** Callback to go to previous step */
  onBack: () => void;
  /** Callback to skip the tour */
  onSkip: () => void;
  /** Callback to close the tour */
  onClose: () => void;
  /** Callback to restart the tour */
  onRestart: () => void;
  /** Position of the tooltip relative to target */
  position?: { top: number; left: number } | null;
  /** Placement direction */
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  /** Additional className */
  className?: string;
}

export const TourTooltip: React.FC<TourTooltipProps> = ({
  step,
  stepIndex,
  totalSteps,
  progress,
  canGoBack,
  canGoNext,
  onNext,
  onBack,
  onSkip,
  onClose,
  onRestart,
  position,
  placement = 'bottom',
  className,
}) => {
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === totalSteps - 1;

  // Calculate tooltip position based on placement
  const getTooltipStyles = () => {
    if (placement === 'center' || !position) {
      return {
        position: 'fixed' as const,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const offset = 16;
    switch (placement) {
      case 'top':
        return {
          position: 'fixed' as const,
          bottom: `calc(100vh - ${position.top}px + ${offset}px)`,
          left: position.left,
          transform: 'translateX(-50%)',
        };
      case 'bottom':
        return {
          position: 'fixed' as const,
          top: position.top + offset,
          left: position.left,
          transform: 'translateX(-50%)',
        };
      case 'left':
        return {
          position: 'fixed' as const,
          top: position.top,
          right: `calc(100vw - ${position.left}px + ${offset}px)`,
          transform: 'translateY(-50%)',
        };
      case 'right':
        return {
          position: 'fixed' as const,
          top: position.top,
          left: position.left + offset,
          transform: 'translateY(-50%)',
        };
      default:
        return {
          position: 'fixed' as const,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        };
    }
  };

  const tooltipStyles = getTooltipStyles();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'w-[360px] max-w-[calc(100vw-32px)] z-[10001]',
        className
      )}
      style={tooltipStyles}
    >
      <div className="bg-background rounded-xl shadow-2xl border border-border overflow-hidden">
        {/* Progress bar */}
        <div className="relative h-1 bg-muted">
          <motion.div
            className="absolute left-0 top-0 h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between p-4 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Step {stepIndex + 1} of {totalSteps}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {!isFirst && (
              <button
                onClick={onRestart}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Restart tour"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
            {step.showSkip !== false && (
              <button
                onClick={onSkip}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Skip tour"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 pt-2">
          {/* Image or GIF */}
          {(step.image || step.gif) && (
            <div className="mb-4 rounded-lg overflow-hidden bg-muted aspect-video flex items-center justify-center">
              {step.gif ? (
                <img
                  src={step.gif}
                  alt={step.title}
                  className="w-full h-full object-cover"
                />
              ) : step.image ? (
                <img
                  src={step.image}
                  alt={step.title}
                  className="w-full h-full object-cover"
                />
              ) : null}
            </div>
          )}

          {/* Icon for first/last step */}
          {isFirst && (
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
            </div>
          )}

          {isLast && (
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          )}

          {/* Title */}
          <h3 className="text-lg font-semibold mb-2">{step.title}</h3>

          {/* Description */}
          <p className="text-sm text-muted-foreground leading-relaxed">
            {step.description}
          </p>

          {/* Action required notice */}
          {step.actionRequired && (
            <div className="mt-3 p-2 rounded-md bg-amber-500/10 border border-amber-500/20">
              <p className="text-xs text-amber-700 dark:text-amber-400">
                <span className="font-semibold">Action required:</span>{' '}
                {step.actionText || 'Please complete this action to continue'}
              </p>
            </div>
          )}
        </div>

        {/* Footer with navigation */}
        <div className="p-4 pt-2 flex items-center justify-between border-t border-border">
          {/* Back button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            disabled={!canGoBack}
            className={cn(
              'text-muted-foreground hover:text-foreground',
              !canGoBack && 'invisible'
            )}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            {step.backButtonText || 'Back'}
          </Button>

          {/* Next/Complete button */}
          <Button
            size="sm"
            onClick={onNext}
            className="min-w-[100px]"
          >
            {isLast ? (
              <>
                <Check className="w-4 h-4 mr-1.5" />
                {step.nextButtonText || 'Complete'}
              </>
            ) : (
              <>
                {step.nextButtonText || 'Next'}
                <ChevronRight className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Arrow indicator */}
      {placement !== 'center' && position && (
        <div
          className={cn(
            'absolute w-3 h-3 bg-background border rotate-45',
            placement === 'top' && 'bottom-[-6px] left-1/2 -translate-x-1/2 border-t-0 border-l-0',
            placement === 'bottom' && 'top-[-6px] left-1/2 -translate-x-1/2 border-b-0 border-r-0',
            placement === 'left' && 'right-[-6px] top-1/2 -translate-y-1/2 border-l-0 border-b-0',
            placement === 'right' && 'left-[-6px] top-1/2 -translate-y-1/2 border-r-0 border-t-0'
          )}
        />
      )}
    </motion.div>
  );
};

export default TourTooltip;
