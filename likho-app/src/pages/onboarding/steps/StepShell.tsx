import { ReactNode } from 'react';

interface StepShellProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  onSkip?: () => void;
  children: ReactNode;
}

const StepShell = ({ icon, title, subtitle, onSkip, children }: StepShellProps) => (
  <div
    className="rounded-2xl p-5 sm:p-7 lg:p-8"
    style={{
      backgroundColor: '#ffffff',
      border: '1px solid #e4e4e7',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.06)',
    }}
  >
    {/* Icon badge */}
    {icon && (
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
        style={{ backgroundColor: '#eef2ff', border: '1px solid #c7d2fe' }}
      >
        {icon}
      </div>
    )}

    {/* Heading */}
    <h2 className="text-xl font-bold mb-1" style={{ color: '#09090b', letterSpacing: '-0.02em' }}>
      {title}
    </h2>
    {subtitle && (
      <p className="text-sm mb-6" style={{ color: '#71717a' }}>{subtitle}</p>
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
          className="text-sm transition-colors"
          style={{ color: '#a1a1aa' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#3f3f46')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#a1a1aa')}
        >
          Skip this step →
        </button>
      </div>
    )}
  </div>
);

export default StepShell;
