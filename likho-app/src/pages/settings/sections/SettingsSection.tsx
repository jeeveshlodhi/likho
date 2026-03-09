import { cn } from '@/lib/utils';

interface SettingsSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  variant?: 'default' | 'destructive';
}

export function SettingsSection({
  title,
  description,
  children,
  variant = 'default',
}: SettingsSectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3
          className={cn(
            'text-lg font-semibold',
            variant === 'destructive' && 'text-destructive'
          )}
        >
          {title}
        </h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}
