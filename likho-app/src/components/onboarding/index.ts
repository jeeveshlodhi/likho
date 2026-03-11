/**
 * Onboarding components index
 * Export all onboarding-related components and utilities
 */

// Main components
export { OnboardingTour } from './OnboardingTour';
export { Spotlight } from './Spotlight';
export { WelcomeModal } from './WelcomeModal';
export { TourTooltip } from './TourTooltip';
export { CelebrationAnimation } from './CelebrationAnimation';
export { OnboardingProvider } from './OnboardingProvider';
export { QuickStartChecklist } from './QuickStartChecklist';

// Types and steps
export {
  ONBOARDING_STEPS,
  QUICK_START_CHECKLIST,
  getStepById,
  getStepIndexById,
  getTotalSteps,
  isFirstStep,
  isLastStep,
  getStepProgress,
  type TourStep,
  type ChecklistItem,
} from './OnboardingSteps';

// Re-export hook
export { useOnboarding, type UseOnboardingReturn } from '@/hooks/useOnboarding';
export { useOnboardingContext } from './OnboardingProvider';

// Re-export utilities
export {
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
  TOUR_STEPS,
  type OnboardingState,
  type TourStepId,
} from '@/lib/onboarding';
