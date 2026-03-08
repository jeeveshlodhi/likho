import { useState, useEffect } from 'react';
import { X, Cloud, HardDrive } from 'lucide-react';
import type { SpaceType } from '@/types/workspace';
import type { PageType } from '@/types/workspace';
import { PAGE_TEMPLATES } from '@/constants/pageTemplates';

export interface NewPageModalContext {
  folderId: string | null;
  spaceType?: SpaceType;
}

interface NewPageModalProps {
  open: boolean;
  onClose: () => void;
  context: NewPageModalContext;
  onSelect: (spaceType: SpaceType, templateId: PageType) => void;
}

const SPACE_OPTIONS: { type: SpaceType; label: string; icon: typeof Cloud }[] = [
  { type: 'online', label: 'Online space', icon: Cloud },
  { type: 'offline', label: 'Offline space', icon: HardDrive },
];

export default function NewPageModal({
  open,
  onClose,
  context,
  onSelect,
}: NewPageModalProps) {
  const { spaceType: contextSpaceType } = context;
  const needsSpaceStep = contextSpaceType === undefined;

  const [step, setStep] = useState<'space' | 'template'>('template');
  const [selectedSpace, setSelectedSpace] = useState<SpaceType | null>(null);

  useEffect(() => {
    if (!open) {
      setStep(needsSpaceStep ? 'space' : 'template');
      setSelectedSpace(contextSpaceType ?? null);
    } else {
      setStep(needsSpaceStep ? 'space' : 'template');
      setSelectedSpace(contextSpaceType ?? null);
    }
  }, [open, needsSpaceStep, contextSpaceType]);


  const handleTemplateSelect = (templateId: PageType) => {
    if (needsSpaceStep && !selectedSpace) return;
    const resolvedSpace = contextSpaceType ?? selectedSpace!;
    onSelect(resolvedSpace, templateId);
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-lg rounded-xl bg-popover shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-lg font-semibold text-popover-foreground">
            {step === 'space' ? 'Choose space' : 'New page'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4">
          {step === 'space' ? (
            <div className="space-y-2">
              <p className="mb-3 text-sm text-muted-foreground">
                Where should this page live?
              </p>
              <div className="grid grid-cols-2 gap-3">
                {SPACE_OPTIONS.map(({ type, label, icon: Icon }) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setSelectedSpace(type);
                      setStep('template');
                    }}
                    className="flex flex-col items-center gap-2 rounded-lg border border-input bg-background px-4 py-5 text-center transition-colors hover:bg-accent"
                  >
                    <Icon size={24} className="text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {needsSpaceStep && selectedSpace && (
                <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                  {selectedSpace === 'online' ? (
                    <Cloud size={16} />
                  ) : (
                    <HardDrive size={16} />
                  )}
                  <span>
                    {selectedSpace === 'online'
                      ? 'Online space'
                      : 'Offline space'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setStep('space')}
                    className="ml-auto text-primary hover:underline"
                  >
                    Change
                  </button>
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                Choose a template for your new page.
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {PAGE_TEMPLATES.map((template) => {
                  const Icon = template.icon;
                  return (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => handleTemplateSelect(template.id)}
                      className="flex items-start gap-3 rounded-lg border border-input bg-background p-4 text-left transition-colors hover:bg-accent"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <Icon size={20} className="text-muted-foreground" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-foreground">
                          {template.label}
                        </div>
                        <div className="mt-0.5 text-sm text-muted-foreground">
                          {template.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
