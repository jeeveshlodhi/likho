import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type WorkspaceMode = 'blank' | 'template' | 'ai';
export type DefaultSpace = 'offline' | 'online';

export interface OnboardingWizardData {
  // Profile (populated from registration — not re-asked during onboarding)
  full_name: string;
  username: string;

  // Intent
  intent: string[];

  // Dynamic personalization
  dev_tasks: string[];
  team_size: string;

  // Source attribution
  source: string;

  // Workspace
  workspace_mode: WorkspaceMode;
  workspace_prompt: string;

  // Space preferences (sync is always auto)
  default_space: DefaultSpace;
  sync_mode: 'auto';
}

interface OnboardingWizardState {
  currentStep: number;
  completed: boolean;
  data: OnboardingWizardData;

  // Actions
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateData: (patch: Partial<OnboardingWizardData>) => void;
  markCompleted: () => void;
  reset: () => void;
}

const defaultData: OnboardingWizardData = {
  full_name: '',
  username: '',
  intent: [],
  dev_tasks: [],
  team_size: '',
  source: '',
  workspace_mode: 'blank',
  workspace_prompt: '',
  default_space: 'online',
  sync_mode: 'auto',
};

export const useOnboardingWizardStore = create<OnboardingWizardState>()(
  persist(
    (set, get) => ({
      currentStep: 0,
      completed: false,
      data: { ...defaultData },

      setStep: (step) => set({ currentStep: step }),

      nextStep: () => set({ currentStep: get().currentStep + 1 }),

      prevStep: () => set({ currentStep: Math.max(0, get().currentStep - 1) }),

      updateData: (patch) =>
        set({ data: { ...get().data, ...patch } }),

      markCompleted: () => set({ completed: true }),

      reset: () =>
        set({ currentStep: 0, completed: false, data: { ...defaultData } }),
    }),
    {
      name: 'likho-onboarding-wizard',
    }
  )
);
