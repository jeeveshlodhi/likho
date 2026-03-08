import React from 'react';

interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onClose?: () => void;
}

const alertStyles = {
  success: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    text: 'text-green-800 dark:text-green-300',
    icon: '✓',
  },
  error: {
    bg: 'bg-destructive/10',
    border: 'border-destructive/30',
    text: 'text-destructive',
    icon: '✕',
  },
  warning: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-200 dark:border-yellow-800',
    text: 'text-yellow-800 dark:text-yellow-300',
    icon: '⚠',
  },
  info: {
    bg: 'bg-primary/10',
    border: 'border-primary/30',
    text: 'text-primary',
    icon: 'ℹ',
  },
};

export const Alert: React.FC<AlertProps> = ({ type, message, onClose }) => {
  const style = alertStyles[type];

  return (
    <div
      className={`${style.bg} ${style.border} ${style.text} px-4 py-3 rounded-lg border flex items-center justify-between gap-3`}
    >
      <div className="flex items-center gap-3">
        <span className="text-lg font-bold">{style.icon}</span>
        <p className="text-sm">{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-lg font-bold opacity-70 hover:opacity-100 transition"
        >
          ✕
        </button>
      )}
    </div>
  );
};
