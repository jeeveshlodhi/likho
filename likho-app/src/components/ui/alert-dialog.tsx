import { useState, createContext, useContext, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AlertDialogContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const AlertDialogContext = createContext<AlertDialogContextType | undefined>(undefined);

function useAlertDialog() {
  const context = useContext(AlertDialogContext);
  if (!context) {
    throw new Error('AlertDialog components must be used within AlertDialog');
  }
  return context;
}

// AlertDialog Root
interface AlertDialogProps {
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AlertDialog({ children, open: controlledOpen, onOpenChange }: AlertDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;
  const setOpen = onOpenChange || setUncontrolledOpen;

  return (
    <AlertDialogContext.Provider value={{ open, setOpen }}>
      {children}
    </AlertDialogContext.Provider>
  );
}

// AlertDialogTrigger
interface AlertDialogTriggerProps {
  children: ReactNode;
  asChild?: boolean;
}

export function AlertDialogTrigger({ children, asChild }: AlertDialogTriggerProps) {
  const { setOpen } = useAlertDialog();

  if (asChild) {
    return (
      <div onClick={() => setOpen(true)} style={{ display: 'contents' }}>
        {children}
      </div>
    );
  }

  return (
    <button onClick={() => setOpen(true)} type="button">
      {children}
    </button>
  );
}

// AlertDialogContent
interface AlertDialogContentProps {
  children: ReactNode;
  className?: string;
}

export function AlertDialogContent({ children, className }: AlertDialogContentProps) {
  const { open, setOpen } = useAlertDialog();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      
      {/* Content */}
      <div
        className={cn(
          'relative z-10 w-full max-w-lg rounded-xl border border-border bg-popover p-6 shadow-lg',
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}

// AlertDialogHeader
interface AlertDialogHeaderProps {
  children: ReactNode;
  className?: string;
}

export function AlertDialogHeader({ children, className }: AlertDialogHeaderProps) {
  return <div className={cn('mb-4', className)}>{children}</div>;
}

// AlertDialogFooter
interface AlertDialogFooterProps {
  children: ReactNode;
  className?: string;
}

export function AlertDialogFooter({ children, className }: AlertDialogFooterProps) {
  return (
    <div className={cn('mt-6 flex justify-end gap-3', className)}>
      {children}
    </div>
  );
}

// AlertDialogTitle
interface AlertDialogTitleProps {
  children: ReactNode;
  className?: string;
}

export function AlertDialogTitle({ children, className }: AlertDialogTitleProps) {
  return (
    <h2 className={cn('text-xl font-semibold text-foreground', className)}>
      {children}
    </h2>
  );
}

// AlertDialogDescription
interface AlertDialogDescriptionProps {
  children: ReactNode;
  className?: string;
}

export function AlertDialogDescription({ children, className }: AlertDialogDescriptionProps) {
  return <p className={cn('text-sm text-muted-foreground', className)}>{children}</p>;
}

// AlertDialogAction
interface AlertDialogActionProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function AlertDialogAction({ children, onClick, className }: AlertDialogActionProps) {
  const { setOpen } = useAlertDialog();

  return (
    <button
      onClick={() => {
        onClick?.();
        setOpen(false);
      }}
      type="button"
      className={cn(
        'inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90',
        className
      )}
    >
      {children}
    </button>
  );
}

// AlertDialogCancel
interface AlertDialogCancelProps {
  children: ReactNode;
  className?: string;
}

export function AlertDialogCancel({ children, className }: AlertDialogCancelProps) {
  const { setOpen } = useAlertDialog();

  return (
    <button
      onClick={() => setOpen(false)}
      type="button"
      className={cn(
        'inline-flex items-center justify-center rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent',
        className
      )}
    >
      {children}
    </button>
  );
}
