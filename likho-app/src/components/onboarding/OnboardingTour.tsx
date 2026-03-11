/**
 * OnboardingTour component
 * Main tour component that orchestrates the entire onboarding experience
 * Combines Spotlight, TourTooltip, and manages tour state
 */

import React, { useState, useCallback, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Spotlight } from './Spotlight';
import { TourTooltip } from './TourTooltip';
import { CelebrationAnimation } from './CelebrationAnimation';
import { useOnboarding } from '@/hooks/useOnboarding';
import { cn } from '@/lib/utils';

export interface OnboardingTourProps {
  /** Whether the tour is open */
  isOpen?: boolean;
  /** Callback when the tour is closed */
  onClose?: () => void;
  /** Callback when the tour is completed */
  onComplete?: () => void;
  /** Callback when the tour is skipped */
  onSkip?: () => void;
  /** Initial step index to start from */
  startFromStep?: number;
  /** Whether to show the celebration at the end */
  showCelebration?: boolean;
  /** Additional className for the tooltip */
  tooltipClassName?: string;
  /** Additional className for the spotlight */
  spotlightClassName?: string;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({
  isOpen: controlledIsOpen,
  onClose,
  onComplete,
  onSkip,
  startFromStep,
  showCelebration = true,
  tooltipClassName,
  spotlightClassName,
}) => {
  const onboarding = useOnboarding();
  const [targetPosition, setTargetPosition] = useState<{ top: number; left: number } | null>(null);
  const [showCelebrationAnimation, setShowCelebrationAnimation] = useState(false);

  // Determine if the tour is open (controlled or uncontrolled)
  const isTourOpen = controlledIsOpen !== undefined ? controlledIsOpen : onboarding.isOpen;

  // Handle opening the tour
  useEffect(() => {
    if (isTourOpen && startFromStep !== undefined) {
      onboarding.goToStep(startFromStep);
    }
  }, [isTourOpen, startFromStep]);

  // Handle target position updates from spotlight
  const handlePositionUpdate = useCallback((rect: DOMRect | null) => {
    if (rect) {
      setTargetPosition({
        top: rect.top + rect.height / 2,
        left: rect.left + rect.width / 2,
      });
    } else {
      setTargetPosition(null);
    }
  }, []);

  // Handle next step
  const handleNext = useCallback(() => {
    if (onboarding.isLast) {
      // Complete the tour
      onboarding.complete();
      if (showCelebration) {
        setShowCelebrationAnimation(true);
      }
      onComplete?.();
    } else {
      onboarding.nextStep();
    }
  }, [onboarding, showCelebration, onComplete]);

  // Handle back
  const handleBack = useCallback(() => {
    onboarding.prevStep();
  }, [onboarding]);

  // Handle skip
  const handleSkip = useCallback(() => {
    onboarding.skip();
    onSkip?.();
    onClose?.();
  }, [onboarding, onSkip, onClose]);

  // Handle close
  const handleClose = useCallback(() => {
    onboarding.closeTour();
    onClose?.();
  }, [onboarding, onClose]);

  // Handle restart
  const handleRestart = useCallback(() => {
    onboarding.reset();
  }, [onboarding]);

  // Handle celebration complete
  const handleCelebrationComplete = useCallback(() => {
    setShowCelebrationAnimation(false);
    handleClose();
  }, [handleClose]);

  // Handle click outside (pause the tour)
  const handleClickOutside = useCallback(() => {
    // Just close the tour - user can resume later
    handleClose();
  }, [handleClose]);

  // Get current step configuration
  const currentStep = onboarding.currentStep;
  const isCenterPlacement = currentStep?.placement === 'center' || !currentStep?.targetSelector;

  return (
    <>
      {/* Spotlight overlay */}
      <Spotlight
        isOpen={isTourOpen}
        targetSelector={isCenterPlacement ? undefined : currentStep?.targetSelector}
        padding={currentStep?.spotlightPadding ?? 8}
        borderRadius={currentStep?.spotlightRadius ?? 8}
        overlayOpacity={0.75}
        overlayColor="rgb(0, 0, 0)"
        spotlightColor="rgb(59, 130, 246)"
        pulseAnimation={!isCenterPlacement}
        closeOnClickOutside={true}
        onClickOutside={handleClickOutside}
        onPositionUpdate={handlePositionUpdate}
        zIndex={9998}
        className={spotlightClassName}
      />

      {/* Tour tooltip */}
      <AnimatePresence mode="wait">
        {isTourOpen && currentStep && (
          <TourTooltip
            key={currentStep.id}
            step={currentStep}
            stepIndex={onboarding.currentStepIndex}
            totalSteps={onboarding.totalSteps}
            progress={onboarding.progress}
            canGoBack={onboarding.canGoBack}
            canGoNext={onboarding.canGoNext}
            onNext={handleNext}
            onBack={handleBack}
            onSkip={handleSkip}
            onClose={handleClose}
            onRestart={handleRestart}
            position={targetPosition}
            placement={currentStep.placement || 'center'}
            className={tooltipClassName}
          />
        )}
      </AnimatePresence>

      {/* Celebration animation */}
      {showCelebration && (
        <CelebrationAnimation
          isActive={showCelebrationAnimation}
          onComplete={handleCelebrationComplete}
          duration={3000}
          pieceCount={60}
        />
      )}
    </>
  );
};

export default OnboardingTour;
