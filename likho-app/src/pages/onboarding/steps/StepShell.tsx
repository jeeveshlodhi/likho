import { ReactNode } from 'react';

interface StepShellProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  onSkip?: () => void;
  children: ReactNode;
}

/**
 * Shared layout shell for every onboarding step.
 * Renders an icon badge, heading, optional subtitle,
 * the step content, and an optional skip link.
 */
const StepShell = ({ icon, title, subtitle, onSkip, children }: StepShellProps) => (
  <div className="bg-surface/60 border border-border/40 rounded-2xl p-6 sm:p-8 backdrop-blur-sm shadow-xl shadow-black/5">
    {/* Icon */}
    {icon && (
      <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-5">
        {icon}
      </div>
    )}

    {/* Heading */}
    <h2 className="text-xl font-semibold text-foreground mb-1">{title}</h2>
    {subtitle && (
      <p className="text-sm text-muted-foreground mb-6">{subtitle}</p>
    )}
    {!subtitle && <div className="mb-6" />}

    {/* Step content */}
    {children}

    {/* Skip */}
    {onSkip && (
      <div className="mt-5 text-center">
        <button
          type="button"
          onClick={onSkip}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip this step →
        </button>
      </div>
    )}
  </div>
);

export default StepShell;
