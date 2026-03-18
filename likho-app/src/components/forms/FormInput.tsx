import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

// Inject placeholder color once
if (typeof document !== 'undefined' && !document.getElementById('form-input-styles')) {
  const s = document.createElement('style');
  s.id = 'form-input-styles';
  s.textContent = '.likho-input::placeholder { color: #a1a1aa; }';
  document.head.appendChild(s);
}

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
  icon?: React.ReactNode;
}

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, helpText, icon, className = '', type, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#3f3f46' }}>
            {label}
            {props.required && <span style={{ color: '#ef4444' }}>*</span>}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            type={inputType}
            className={`
              likho-input w-full px-4 py-2.5 rounded-xl
              transition duration-200
              focus:outline-none
              disabled:cursor-not-allowed disabled:opacity-50
              ${icon ? 'pl-10' : ''}
              ${isPassword ? 'pr-10' : ''}
              ${className}
            `}
            style={{
              backgroundColor: '#ffffff',
              color: '#09090b',
              border: error ? '1px solid #ef4444' : '1px solid #e4e4e7',
              boxShadow: error ? '0 0 0 3px rgba(239,68,68,0.08)' : 'none',
            }}
            onFocus={(e) => {
              e.currentTarget.style.border = error ? '1px solid #ef4444' : '1px solid #6366f1';
              e.currentTarget.style.boxShadow = error
                ? '0 0 0 3px rgba(239,68,68,0.08)'
                : '0 0 0 3px rgba(99,102,241,0.1)';
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              e.currentTarget.style.border = error ? '1px solid #ef4444' : '1px solid #e4e4e7';
              e.currentTarget.style.boxShadow = error ? '0 0 0 3px rgba(239,68,68,0.08)' : 'none';
              props.onBlur?.(e);
            }}
            placeholder={props.placeholder}
            {...props}
          />
          {icon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: '#a1a1aa' }}>
              {icon}
            </div>
          )}
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 focus:outline-none"
              style={{ color: '#a1a1aa' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#3f3f46')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#a1a1aa')}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
        </div>
        {error && <p className="mt-1.5 text-xs font-medium" style={{ color: '#ef4444' }}>{error}</p>}
        {helpText && !error && (
          <p className="mt-1.5 text-xs" style={{ color: '#a1a1aa' }}>{helpText}</p>
        )}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';
