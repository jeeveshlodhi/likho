/**
 * WelcomeModal component
 * First-time welcome modal for new users
 * Provides options to take the tour or skip
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, BookOpen, Zap, Users, Cloud } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface WelcomeModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when the user chooses to take the tour */
  onTakeTour: () => void;
  /** Callback when the user chooses to skip */
  onSkip: () => void;
  /** Callback when the modal is closed */
  onClose: () => void;
  /** Beta disclaimer text */
  betaDisclaimer?: string;
  /** Additional className for styling */
  className?: string;
}

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: <BookOpen className="w-5 h-5" />,
    title: 'Rich Notes',
    description: 'Block-based editor with markdown support',
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: 'AI Powered',
    description: 'Smart assistant for your writing',
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: 'Collaborate',
    description: 'Real-time team collaboration',
  },
  {
    icon: <Cloud className="w-5 h-5" />,
    title: 'Cloud Sync',
    description: 'Access anywhere, anytime',
  },
];

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
  isOpen,
  onTakeTour,
  onSkip,
  onClose,
  betaDisclaimer = 'Likho is currently in beta. Some features may change, and we\'d love your feedback!',
  className,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
              'w-full max-w-lg z-[9999]',
              className
            )}
          >
            <div className="bg-background rounded-2xl shadow-2xl border border-border overflow-hidden">
              {/* Header with gradient */}
              <div className="relative bg-gradient-to-br from-primary/90 to-primary p-8 text-primary-foreground">
                {/* Close button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Logo and welcome text */}
                <div className="flex flex-col items-center text-center">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                    className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-lg"
                  >
                    <span className="text-4xl font-bold text-primary">L</span>
                  </motion.div>

                  <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-3xl font-bold mb-2"
                  >
                    Welcome to Likho
                  </motion.h1>

                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-primary-foreground/80 text-lg"
                  >
                    Your personal knowledge workspace
                  </motion.p>
                </div>
              </div>

              {/* Features grid */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="p-6 grid grid-cols-2 gap-4"
              >
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="p-2 rounded-md bg-primary/10 text-primary">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{feature.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              {/* Beta disclaimer */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="px-6 pb-4"
              >
                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    {betaDisclaimer}
                  </p>
                </div>
              </motion.div>

              {/* Actions */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="p-6 pt-2 flex flex-col sm:flex-row gap-3"
              >
                <Button
                  onClick={onTakeTour}
                  className="flex-1 h-12 text-base font-semibold"
                  size="lg"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Take a Tour
                </Button>
                <Button
                  onClick={onSkip}
                  variant="outline"
                  className="flex-1 h-12 text-base"
                  size="lg"
                >
                  Skip for Now
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default WelcomeModal;
