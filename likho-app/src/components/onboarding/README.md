# Likho Onboarding System

A comprehensive onboarding tutorial system for the Likho app featuring step-by-step guided tours, spotlight effects, and celebratory animations.

## Features

- 🎯 **Step-by-step guided tour** - Highlight key UI elements with contextual tooltips
- 🔦 **Spotlight overlay** - Darken screen with cutout around target elements
- 🎉 **Celebration animation** - Confetti effects on tour completion
- 💾 **Progress persistence** - Resume tour where left off using localStorage
- 🎨 **Smooth animations** - Framer Motion powered transitions
- 📱 **Responsive** - Works across different screen sizes
- ♿ **Accessible** - Keyboard navigation support

## Components

### OnboardingProvider
Main context provider that manages the onboarding state. Wrap your app with this provider.

```tsx
import { OnboardingProvider } from '@/components/onboarding';

function App() {
  return (
    <OnboardingProvider
      autoShowWelcome={true}
      showCelebration={true}
      onTourComplete={() => console.log('Tour completed!')}
      onTourSkip={() => console.log('Tour skipped')}
    >
      <YourApp />
    </OnboardingProvider>
  );
}
```

### OnboardingTour
The main tour component that orchestrates the experience.

```tsx
import { OnboardingTour, useOnboarding } from '@/components/onboarding';

function MyComponent() {
  const { isOpen, openTour, closeTour } = useOnboarding();

  return (
    <>
      <button onClick={() => openTour()}>Start Tour</button>
      <OnboardingTour />
    </>
  );
}
```

### WelcomeModal
First-time welcome modal shown to new users.

```tsx
import { WelcomeModal } from '@/components/onboarding';

<WelcomeModal
  isOpen={showWelcome}
  onTakeTour={() => setShowWelcome(false)}
  onSkip={() => setShowWelcome(false)}
  onClose={() => setShowWelcome(false)}
/>
```

### QuickStartChecklist
Collapsible checklist of quick start tasks.

```tsx
import { QuickStartChecklist } from '@/components/onboarding';

<QuickStartChecklist
  onAllCompleted={() => console.log('All tasks done!')}
  onItemClick={(item) => console.log('Clicked:', item)}
  onRestartTour={() => openTour()}
  collapsible={true}
/>
```

### Spotlight
Standalone spotlight overlay component.

```tsx
import { Spotlight } from '@/components/onboarding';

<Spotlight
  isOpen={true}
  targetSelector="[data-tour='my-element']"
  padding={8}
  borderRadius={8}
  onClickOutside={() => setIsOpen(false)}
>
  <MyTooltip />
</Spotlight>
```

## Tour Steps

The onboarding tour includes these steps:

1. **Welcome** - Introduction to Likho
2. **Create Note** - How to create your first note
3. **Organize Folders** - Folder and organization features
4. **AI Assistant** - Using the AI assistant
5. **Cloud Sync** - Sync features
6. **Share Team** - Collaboration features
7. **Keyboard Shortcuts** - Quick commands
8. **Complete** - Tour completion celebration

## Adding Tour Targets

Add `data-tour` attributes to elements you want to highlight:

```tsx
<button data-tour="new-note-button">New Note</button>
<aside data-tour="sidebar">...</aside>
<div data-tour="ai-button">...</div>
```

## Customizing Steps

Edit `OnboardingSteps.ts` to customize tour steps:

```typescript
export const ONBOARDING_STEPS: TourStep[] = [
  {
    id: 'my-step',
    title: 'My Custom Step',
    description: 'Description here',
    targetSelector: '[data-tour="my-element"]',
    placement: 'bottom', // 'top' | 'bottom' | 'left' | 'right' | 'center'
    showSkip: true,
    showBack: true,
    nextButtonText: 'Continue',
    spotlightPadding: 8,
    spotlightRadius: 8,
  },
  // ... more steps
];
```

## Hooks

### useOnboarding

Main hook for controlling the tour:

```tsx
const {
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
  complete,
  skip,
  reset,
  
  // Helpers
  isFirst,
  isLast,
  canGoBack,
  canGoNext,
  isStepDone,
} = useOnboarding();
```

### useOnboardingContext

Access the full context from within OnboardingProvider:

```tsx
const {
  showWelcome,
  closeWelcome,
  startTourFromWelcome,
  skipTourFromWelcome,
  checkShouldShowOnboarding,
  // ... all useOnboarding values
} = useOnboardingContext();
```

## Utility Functions

```typescript
import {
  hasCompletedOnboarding,  // Check if user completed tour
  hasSkippedOnboarding,    // Check if user skipped tour
  shouldShowOnboarding,    // Check if tour should be shown
  getCurrentStep,          // Get current step index
  setCurrentStep,          // Set current step
  markStepCompleted,       // Mark a step as done
  resetOnboarding,         // Reset all progress
  resumeOnboarding,        // Resume from last step
  getOnboardingProgress,   // Get progress percentage
  getOnboardingStats,      // Get all stats
} from '@/components/onboarding';
```

## Integration Example

```tsx
// App.tsx
import { OnboardingProvider } from '@/components/onboarding';

function App() {
  return (
    <OnboardingProvider>
      <Layout>
        <AppContent />
      </Layout>
    </OnboardingProvider>
  );
}

// Header.tsx - Add tour triggers
import { useOnboardingContext } from '@/components/onboarding';

function Header() {
  const { openTour } = useOnboardingContext();
  
  return (
    <header>
      <button onClick={() => openTour()}>Help</button>
    </header>
  );
}

// Sidebar.tsx - Add tour targets
function Sidebar() {
  return (
    <aside data-tour="sidebar">
      <button data-tour="new-note-button">New Note</button>
    </aside>
  );
}
```

## LocalStorage Keys

- `likho_onboarding` - Main onboarding state
- `likho_checklist_state` - Quick start checklist state

## Styling

The onboarding system uses Tailwind CSS classes and respects your theme configuration. Customize appearance by:

1. Passing `className` props to components
2. Overriding CSS variables in your theme
3. Modifying component source code

## Browser Support

Works in all modern browsers that support:
- CSS Grid & Flexbox
- CSS Custom Properties
- ES6+
