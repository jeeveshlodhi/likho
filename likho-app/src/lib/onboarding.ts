/**
 * Onboarding state management utilities
 * Handles persistence and state for the onboarding tour
 */

import { TourStep } from '@/components/onboarding/OnboardingSteps';

// Storage keys
const STORAGE_KEY = 'likho_onboarding';
const COMPLETED_KEY = 'likho_onboarding_completed';
const CURRENT_STEP_KEY = 'likho_onboarding_current_step';
const SKIPPED_KEY = 'likho_onboarding_skipped';

export interface OnboardingState {
  completed: boolean;
  currentStep: number;
  skipped: boolean;
  lastVisitedAt: string | null;
  completedSteps: number[];
}

export const TOUR_STEPS = [
  'welcome',
  'create-note',
  'organize-folders',
  'ai-assistant',
  'cloud-sync',
  'share-team',
  'keyboard-shortcuts',
  'complete',
] as const;

export type TourStepId = (typeof TOUR_STEPS)[number];

const defaultState: OnboardingState = {
  completed: false,
  currentStep: 0,
  skipped: false,
  lastVisitedAt: null,
  completedSteps: [],
};

/**
 * Get the full onboarding state from localStorage
 */
export function getOnboardingState(): OnboardingState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...defaultState, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Failed to parse onboarding state:', error);
  }
  return { ...defaultState };
}

/**
 * Save the onboarding state to localStorage
 */
export function saveOnboardingState(state: Partial<OnboardingState>): void {
  try {
    const current = getOnboardingState();
    const updated = {
      ...current,
      ...state,
      lastVisitedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save onboarding state:', error);
  }
}

/**
 * Check if the user has completed the onboarding tour
 */
export function hasCompletedOnboarding(): boolean {
  const state = getOnboardingState();
  return state.completed;
}

/**
 * Check if the user has skipped the onboarding tour
 */
export function hasSkippedOnboarding(): boolean {
  const state = getOnboardingState();
  return state.skipped;
}

/**
 * Mark the onboarding as completed
 */
export function markOnboardingComplete(): void {
  saveOnboardingState({
    completed: true,
    currentStep: TOUR_STEPS.length - 1,
    completedSteps: [...Array(TOUR_STEPS.length).keys()],
  });
}

/**
 * Mark the onboarding as skipped
 */
export function skipOnboarding(): void {
  saveOnboardingState({
    skipped: true,
    completed: false,
  });
}

/**
 * Get the current step index
 */
export function getCurrentStep(): number {
  const state = getOnboardingState();
  return state.currentStep;
}

/**
 * Set the current step index
 */
export function setCurrentStep(step: number): void {
  const state = getOnboardingState();
  const completedSteps = new Set(state.completedSteps);
  
  // Mark all previous steps as completed
  for (let i = 0; i < step; i++) {
    completedSteps.add(i);
  }
  
  saveOnboardingState({
    currentStep: step,
    completedSteps: Array.from(completedSteps),
  });
}

/**
 * Mark a specific step as completed
 */
export function markStepCompleted(stepIndex: number): void {
  const state = getOnboardingState();
  const completedSteps = new Set(state.completedSteps);
  completedSteps.add(stepIndex);
  
  saveOnboardingState({
    completedSteps: Array.from(completedSteps),
  });
}

/**
 * Check if a specific step is completed
 */
export function isStepCompleted(stepIndex: number): boolean {
  const state = getOnboardingState();
  return state.completedSteps.includes(stepIndex);
}

/**
 * Reset the onboarding state to start fresh
 */
export function resetOnboarding(): void {
  saveOnboardingState({
    completed: false,
    currentStep: 0,
    skipped: false,
    completedSteps: [],
  });
}

/**
 * Completely clear all onboarding data
 */
export function clearOnboardingData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(COMPLETED_KEY);
    localStorage.removeItem(CURRENT_STEP_KEY);
    localStorage.removeItem(SKIPPED_KEY);
  } catch (error) {
    console.error('Failed to clear onboarding data:', error);
  }
}

/**
 * Check if we should show the onboarding tour
 */
export function shouldShowOnboarding(): boolean {
  const state = getOnboardingState();
  return !state.completed && !state.skipped;
}

/**
 * Get the progress percentage (0-100)
 */
export function getOnboardingProgress(): number {
  const state = getOnboardingState();
  const totalSteps = TOUR_STEPS.length;
  const completedCount = state.completedSteps.length;
  return Math.round((completedCount / totalSteps) * 100);
}

/**
 * Resume onboarding from where the user left off
 * Returns the step index to start from
 */
export function resumeOnboarding(): number {
  const state = getOnboardingState();
  
  // If already completed or skipped, start from beginning
  if (state.completed || state.skipped) {
    resetOnboarding();
    return 0;
  }
  
  // Resume from current step
  return state.currentStep;
}

/**
 * Get onboarding stats for analytics/debugging
 */
export function getOnboardingStats(): {
  completed: boolean;
  skipped: boolean;
  progress: number;
  currentStep: number;
  totalSteps: number;
  lastVisitedAt: string | null;
} {
  const state = getOnboardingState();
  return {
    completed: state.completed,
    skipped: state.skipped,
    progress: getOnboardingProgress(),
    currentStep: state.currentStep,
    totalSteps: TOUR_STEPS.length,
    lastVisitedAt: state.lastVisitedAt,
  };
}
