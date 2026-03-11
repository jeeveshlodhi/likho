/**
 * OnboardingProvider
 * Context provider for onboarding state and controls
 * Allows components throughout the app to access and control the tour
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { OnboardingTour } from './OnboardingTour';
import { WelcomeModal } from './WelcomeModal';
import { useOnboarding, UseOnboardingReturn } from '@/hooks/useOnboarding';
import {
  shouldShowOnboarding,
  hasCompletedOnboarding,
  hasSkippedOnboarding,
} from '@/lib/onboarding';

interface OnboardingContextValue extends UseOnboardingReturn {
  /** Show the welcome modal */
  showWelcome: boolean;
  /** Close the welcome modal */
  closeWelcome: () => void;
  /** Start the tour from the welcome modal */
  startTourFromWelcome: () => void;
  /** Skip the tour from the welcome modal */
  skipTourFromWelcome: () => void;
  /** Check if onboarding should be shown on app start */
  checkShouldShowOnboarding: () => boolean;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export interface OnboardingProviderProps {
  children: React.ReactNode;
  /** Whether to automatically show welcome on mount if needed */
  autoShowWelcome?: boolean;
  /** Whether to show the celebration at the end of tour */
  showCelebration?: boolean;
  /** Callback when tour is completed */
  onTourComplete?: () => void;
  /** Callback when tour is skipped */
  onTourSkip?: () => void;
}

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({
  children,
  autoShowWelcome = true,
  showCelebration = true,
  onTourComplete,
  onTourSkip,
}) => {
  const onboarding = useOnboarding();
  const [showWelcome, setShowWelcome] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Initialize - check if we should show welcome
  React.useEffect(() => {
    if (!initialized && autoShowWelcome) {
      const shouldShow = shouldShowOnboarding();
      const hasCompleted = hasCompletedOnboarding();
      const hasSkipped = hasSkippedOnboarding();

      // Show welcome if never completed or skipped
      if (shouldShow && !hasCompleted && !hasSkipped) {
        // Small delay to let the app render first
        const timer = setTimeout(() => {
          setShowWelcome(true);
        }, 500);
        return () => clearTimeout(timer);
      }
      setInitialized(true);
    }
  }, [autoShowWelcome, initialized]);

  const closeWelcome = useCallback(() => {
    setShowWelcome(false);
    setInitialized(true);
  }, []);

  const startTourFromWelcome = useCallback(() => {
    setShowWelcome(false);
    setInitialized(true);
    onboarding.openTour();
  }, [onboarding]);

  const skipTourFromWelcome = useCallback(() => {
    setShowWelcome(false);
    setInitialized(true);
    onboarding.skip();
    onTourSkip?.();
  }, [onboarding, onTourSkip]);

  const checkShouldShowOnboarding = useCallback(() => {
    return shouldShowOnboarding();
  }, []);

  const handleTourComplete = useCallback(() => {
    onTourComplete?.();
  }, [onTourComplete]);

  const handleTourSkip = useCallback(() => {
    onTourSkip?.();
  }, [onTourSkip]);

  const contextValue: OnboardingContextValue = {
    ...onboarding,
    showWelcome,
    closeWelcome,
    startTourFromWelcome,
    skipTourFromWelcome,
    checkShouldShowOnboarding,
  };

  return (
    <OnboardingContext.Provider value={contextValue}>
      {children}

      {/* Welcome Modal */}
      <WelcomeModal
        isOpen={showWelcome}
        onTakeTour={startTourFromWelcome}
        onSkip={skipTourFromWelcome}
        onClose={closeWelcome}
      />

      {/* Onboarding Tour */}
      <OnboardingTour
        isOpen={onboarding.isOpen}
        onClose={onboarding.closeTour}
        onComplete={handleTourComplete}
        onSkip={handleTourSkip}
        showCelebration={showCelebration}
      />
    </OnboardingContext.Provider>
  );
};

/**
 * Hook to access the onboarding context
 * Must be used within an OnboardingProvider
 */
export function useOnboardingContext(): OnboardingContextValue {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error(
      'useOnboardingContext must be used within an OnboardingProvider'
    );
  }
  return context;
}

export default OnboardingProvider;
