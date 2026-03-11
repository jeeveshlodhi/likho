/**
 * QuickStartChecklist component
 * Shows a checklist of quick start tasks
 * Can be displayed in the UI to help users get started
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  Circle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  QUICK_START_CHECKLIST,
  type ChecklistItem,
} from './OnboardingSteps';
import {
  getOnboardingState,
  saveOnboardingState,
  markOnboardingComplete,
} from '@/lib/onboarding';

export interface QuickStartChecklistProps {
  /** Additional className */
  className?: string;
  /** Callback when all items are completed */
  onAllCompleted?: () => void;
  /** Callback when an item is clicked */
  onItemClick?: (item: ChecklistItem) => void;
  /** Callback to restart the tour */
  onRestartTour?: () => void;
  /** Whether the checklist is collapsible */
  collapsible?: boolean;
  /** Initial collapsed state */
  defaultCollapsed?: boolean;
  /** Callback when the checklist is closed/dismissed */
  onDismiss?: () => void;
}

interface ChecklistState {
  items: ChecklistItem[];
  completedCount: number;
  isComplete: boolean;
}

const STORAGE_KEY = 'likho_checklist_state';

export const QuickStartChecklist: React.FC<QuickStartChecklistProps> = ({
  className,
  onAllCompleted,
  onItemClick,
  onRestartTour,
  collapsible = true,
  defaultCollapsed = false,
  onDismiss,
}) => {
  const [state, setState] = useState<ChecklistState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        items: parsed.items || QUICK_START_CHECKLIST,
        completedCount: parsed.completedCount || 0,
        isComplete: parsed.isComplete || false,
      };
    }
    return {
      items: QUICK_START_CHECKLIST,
      completedCount: 0,
      isComplete: false,
    };
  });

  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [showCelebration, setShowCelebration] = useState(false);

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Check for completion
  useEffect(() => {
    if (state.isComplete && !showCelebration) {
      setShowCelebration(true);
      onAllCompleted?.();
      markOnboardingComplete();
    }
  }, [state.isComplete, showCelebration, onAllCompleted]);

  const toggleItem = (itemId: string) => {
    setState((prev) => {
      const newItems = prev.items.map((item) =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      );
      const completedCount = newItems.filter((item) => item.completed).length;
      const isComplete = completedCount === newItems.length;

      return {
        items: newItems,
        completedCount,
        isComplete,
      };
    });
  };

  const handleItemClick = (item: ChecklistItem) => {
    if (!item.completed) {
      onItemClick?.(item);
    }
  };

  const handleRestart = () => {
    setState({
      items: QUICK_START_CHECKLIST.map((item) => ({ ...item, completed: false })),
      completedCount: 0,
      isComplete: false,
    });
    setShowCelebration(false);
    onRestartTour?.();
  };

  const progress = Math.round((state.completedCount / state.items.length) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={cn(
        'bg-background rounded-xl border border-border shadow-lg overflow-hidden w-[300px]',
        className
      )}
    >
      {/* Header */}
      <div
        className={cn(
          'flex items-center justify-between p-4 border-b border-border',
          collapsible && 'cursor-pointer hover:bg-muted/50 transition-colors'
        )}
        onClick={collapsible ? () => setIsCollapsed(!isCollapsed) : undefined}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Quick Start</h3>
            <p className="text-xs text-muted-foreground">
              {state.completedCount} of {state.items.length} completed
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {collapsible && (
            <button className="p-1 rounded-md hover:bg-muted transition-colors">
              {isCollapsed ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          )}
          {onDismiss && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDismiss();
              }}
              className="p-1 rounded-md hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-muted">
        <motion.div
          className="h-full bg-primary transition-all duration-300"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
        />
      </div>

      {/* Checklist items */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-2">
              {state.items.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    'flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors',
                    item.completed
                      ? 'bg-muted/50'
                      : 'hover:bg-muted cursor-pointer'
                  )}
                  onClick={() => handleItemClick(item)}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleItem(item.id);
                    }}
                    className={cn(
                      'w-5 h-5 rounded-full flex items-center justify-center transition-colors',
                      item.completed
                        ? 'bg-green-500 text-white'
                        : 'border-2 border-muted-foreground/30 hover:border-primary'
                    )}
                  >
                    {item.completed && <Check className="w-3 h-3" />}
                  </button>
                  <span
                    className={cn(
                      'text-sm flex-1',
                      item.completed && 'text-muted-foreground line-through'
                    )}
                  >
                    {item.label}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Footer actions */}
            <div className="p-3 pt-0 border-t border-border">
              {state.isComplete ? (
                <div className="text-center py-2">
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium mb-2">
                    🎉 All done! You&apos;re ready to go!
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRestart}
                    className="text-xs"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Restart Quick Start
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRestartTour}
                  className="w-full text-xs text-muted-foreground hover:text-foreground"
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  Take the Full Tour
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mini celebration */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 bg-background/95 flex flex-col items-center justify-center rounded-xl"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="text-4xl mb-2"
            >
              🎉
            </motion.div>
            <p className="text-sm font-semibold">Great job!</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default QuickStartChecklist;
