/**
 * useOnboarding hook
 * React hook for managing onboarding state and interactions
 */

import { useCallback, useEffect, useState } from 'react';
import {
  getOnboardingState,
  saveOnboardingState,
  hasCompletedOnboarding,
  hasSkippedOnboarding,
  markOnboardingComplete,
  skipOnboarding,
  getCurrentStep,
  setCurrentStep,
  markStepCompleted,
  isStepCompleted,
  resetOnboarding,
  shouldShowOnboarding,
  getOnboardingProgress,
  resumeOnboarding,
  getOnboardingStats,
  type OnboardingState,
} from '@/lib/onboarding';
import {
  ONBOARDING_STEPS,
  getStepById,
  getStepIndexById,
  getTotalSteps,
  isFirstStep,
  isLastStep,
  getStepProgress,
  type TourStep,
} from '@/components/onboarding/OnboardingSteps';

export interface UseOnboardingReturn {
  // State
  isOpen: boolean;
  currentStepIndex: number;
  currentStep: TourStep;
  totalSteps: number;
  progress: number;
  hasCompleted: boolean;
  hasSkipped: boolean;
  shouldShow: boolean;

  // Actions
  openTour: (startFromStep?: number) => void;
  closeTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (stepIndex: number) => void;
  goToStepById: (stepId: string) => void;
  complete: () => void;
  skip: () => void;
  reset: () => void;
  markCurrentStepCompleted: () => void;

  // Helpers
  isFirst: boolean;
  isLast: boolean;
  canGoBack: boolean;
  canGoNext: boolean;
  isStepDone: (stepIndex: number) => boolean;
  getStepById: (id: string) => TourStep | undefined;

  // Stats
  stats: ReturnType<typeof getOnboardingStats>;
}

export function useOnboarding(): UseOnboardingReturn {
  // Local state for tour visibility
  const [isOpen, setIsOpen] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Initialize from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const state = getOnboardingState();
    setCurrentStepIndex(state.currentStep);
  }, []);

  // Sync with localStorage when step changes externally
  useEffect(() => {
    if (mounted) {
      const state = getOnboardingState();
      if (state.currentStep !== currentStepIndex) {
        setCurrentStep(state.currentStep);
      }
    }
  }, [mounted, currentStepIndex]);

  const currentStep = ONBOARDING_STEPS[currentStepIndex] || ONBOARDING_STEPS[0];
  const totalSteps = getTotalSteps();
  const progress = getStepProgress(currentStepIndex);
  const hasCompleted = hasCompletedOnboarding();
  const hasSkipped = hasSkippedOnboarding();
  const shouldShow = shouldShowOnboarding();
  const isFirst = isFirstStep(currentStepIndex);
  const isLast = isLastStep(currentStepIndex);
  const canGoBack = !isFirst && currentStep.showBack !== false;
  const canGoNext = true;

  // Actions
  const openTour = useCallback((startFromStep?: number) => {
    if (startFromStep !== undefined && startFromStep >= 0 && startFromStep < totalSteps) {
      setCurrentStepIndex(startFromStep);
      setCurrentStep(startFromStep);
    } else {
      const resumeStep = resumeOnboarding();
      setCurrentStepIndex(resumeStep);
    }
    setIsOpen(true);
  }, [totalSteps]);

  const closeTour = useCallback(() => {
    setIsOpen(false);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStepIndex < totalSteps - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      setCurrentStep(nextIndex);
      markStepCompleted(currentStepIndex);
    } else {
      // Last step - complete the tour
      markStepCompleted(currentStepIndex);
      markOnboardingComplete();
      setIsOpen(false);
    }
  }, [currentStepIndex, totalSteps]);

  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);
      setCurrentStep(prevIndex);
    }
  }, [currentStepIndex]);

  const goToStep = useCallback((stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < totalSteps) {
      setCurrentStepIndex(stepIndex);
      setCurrentStep(stepIndex);
    }
  }, [totalSteps]);

  const goToStepById = useCallback((stepId: string) => {
    const index = getStepIndexById(stepId);
    if (index >= 0) {
      setCurrentStepIndex(index);
      setCurrentStep(index);
    }
  }, []);

  const complete = useCallback(() => {
    markStepCompleted(currentStepIndex);
    markOnboardingComplete();
    setIsOpen(false);
  }, [currentStepIndex]);

  const skip = useCallback(() => {
    skipOnboarding();
    setIsOpen(false);
  }, []);

  const reset = useCallback(() => {
    resetOnboarding();
    setCurrentStepIndex(0);
    setIsOpen(true);
  }, []);

  const markCurrentStepCompleted = useCallback(() => {
    markStepCompleted(currentStepIndex);
  }, [currentStepIndex]);

  const isStepDone = useCallback((stepIndex: number): boolean => {
    return isStepCompleted(stepIndex);
  }, []);

  const handleGetStepById = useCallback((id: string) => {
    return getStepById(id);
  }, []);

  // Stats
  const stats = getOnboardingStats();

  return {
    // State
    isOpen,
    currentStepIndex,
    currentStep,
    totalSteps,
    progress,
    hasCompleted,
    hasSkipped,
    shouldShow,

    // Actions
    openTour,
    closeTour,
    nextStep,
    prevStep,
    goToStep,
    goToStepById,
    complete,
    skip,
    reset,
    markCurrentStepCompleted,

    // Helpers
    isFirst,
    isLast,
    canGoBack,
    canGoNext,
    isStepDone,
    getStepById: handleGetStepById,

    // Stats
    stats,
  };
}

export default useOnboarding;
