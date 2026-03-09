import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Cloud,
  HardDrive,
  ArrowRight,
  Sparkles,
  Search,
  ChevronRight,
  type LucideIcon
} from 'lucide-react';
import type { SpaceType } from '@/types/workspace';
import type { PageType } from '@/types/workspace';
import { useAuthStore } from '@/store/authStore';
import {
  PAGE_TEMPLATES,
  TEMPLATE_CATEGORIES,
  getTemplatesByCategory,
  getTemplatesForSpace,
  type PageTemplate,
  type TemplateCategory,
} from '@/lib/templateRegistry';
import { cn } from '@/lib/utils';

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

// Animation variants
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 300,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: { duration: 0.15 },
  },
};

const contentVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: 'spring',
      damping: 30,
      stiffness: 300,
    },
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: { duration: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.03,
      type: 'spring',
      damping: 25,
      stiffness: 300,
    },
  }),
};

// Space Option Card Component
const SpaceOptionCard = ({
  type,
  label,
  icon: Icon,
  isSelected,
  onClick,
}: {
  type: SpaceType;
  label: string;
  icon: LucideIcon;
  isSelected: boolean;
  onClick: () => void;
}) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={cn(
      'group relative flex flex-col items-center gap-3 rounded-2xl border-2 p-6 text-center transition-all duration-300',
      isSelected
        ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
        : 'border-border bg-card hover:border-primary/30 hover:bg-accent/50'
    )}
  >
    <div
      className={cn(
        'flex h-14 w-14 items-center justify-center rounded-xl transition-all duration-300',
        isSelected
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
      )}
    >
      <Icon size={28} strokeWidth={1.5} />
    </div>
    <div className="space-y-1">
      <p className="font-semibold text-foreground">{label}</p>
      <p className="text-xs text-muted-foreground">
        {type === 'online' ? 'Sync across devices' : 'Local only'}
      </p>
    </div>
    {isSelected && (
      <motion.div
        layoutId="selection-indicator"
        className="absolute right-3 top-3 h-2 w-2 rounded-full bg-primary"
      />
    )}
  </motion.button>
);

// Category Tab Component
const CategoryTab = ({
  category,
  isActive,
  onClick,
  count,
}: {
  category: (typeof TEMPLATE_CATEGORIES)[0];
  isActive: boolean;
  onClick: () => void;
  count: number;
}) => {
  const Icon = category.icon;
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        'group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all duration-200',
        isActive
          ? 'bg-primary/10 text-primary shadow-sm'
          : 'hover:bg-accent/50 text-muted-foreground hover:text-foreground'
      )}
    >
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors',
          isActive ? 'bg-primary/20' : 'bg-muted group-hover:bg-primary/10'
        )}
        style={{ color: isActive ? category.color : undefined }}
      >
        <Icon size={20} strokeWidth={1.5} />
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn("font-medium", isActive && "text-foreground")}>
          {category.label}
        </p>
        <p className="truncate text-xs opacity-70">{category.description}</p>
      </div>
      <span
        className={cn(
          'rounded-full px-2 py-0.5 text-xs font-medium',
          isActive ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
        )}
      >
        {count}
      </span>
    </motion.button>
  );
};

// Template Card Component
const TemplateCard = ({
  template,
  onClick,
  index,
}: {
  template: PageTemplate;
  onClick: () => void;
  index: number;
}) => {
  const Icon = template.icon;
  return (
    <motion.button
      custom={index}
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group relative flex flex-col gap-3 rounded-xl border border-border bg-card p-4 text-left transition-all duration-200 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
    >
      {/* Background gradient */}
      <div
        className={cn(
          'absolute inset-0 rounded-xl bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100',
          template.gradient
        )}
      />

      {/* Content */}
      <div className="relative z-10 flex items-start justify-between">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl shadow-sm transition-transform duration-300 group-hover:scale-110"
          style={{
            background: `linear-gradient(135deg, ${template.color}20, ${template.color}10)`,
            color: template.color,
          }}
        >
          <Icon size={24} strokeWidth={1.5} />
        </div>

        <div className="flex gap-1">
          {template.isNew && (
            <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-green-600">
              New
            </span>
          )}
          {template.isBeta && (
            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-600">
              Beta
            </span>
          )}
        </div>
      </div>

      <div className="relative z-10 space-y-1">
        <h3 className="font-semibold text-foreground">{template.label}</h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {template.description}
        </p>
      </div>

      {/* Features */}
      {template.features && template.features.length > 0 && (
        <div className="relative z-10 flex flex-wrap gap-1">
          {template.features.slice(0, 3).map((feature) => (
            <span
              key={feature}
              className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
            >
              {feature}
            </span>
          ))}
        </div>
      )}

      {/* Hover arrow */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        whileHover={{ opacity: 1, x: 0 }}
        className="absolute bottom-4 right-4 text-primary opacity-0 transition-opacity group-hover:opacity-100"
      >
        <ArrowRight size={18} />
      </motion.div>
    </motion.button>
  );
};

// Empty State Component
const EmptyTemplatesState = () => (
  <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-muted/30">
    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
      <Search size={24} className="text-muted-foreground" />
    </div>
    <div className="text-center">
      <p className="font-medium text-foreground">No templates found</p>
      <p className="text-sm text-muted-foreground">Try adjusting your search or category</p>
    </div>
  </div>
);

export default function NewPageModal({
  open,
  onClose,
  context,
  onSelect,
}: NewPageModalProps) {
  const { spaceType: contextSpaceType } = context;
  const { isAuthenticated, isGuest } = useAuthStore();
  const showOnlineSpace = isAuthenticated && !isGuest;

  const [step, setStep] = useState<'space' | 'template'>('template');
  const [selectedSpace, setSelectedSpace] = useState<SpaceType | null>(null);
  const [activeCategory, setActiveCategory] = useState<TemplateCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter space options
  const spaceOptions = useMemo(
    () =>
      showOnlineSpace
        ? [
            { type: 'online' as const, label: 'Online Space', icon: Cloud },
            { type: 'offline' as const, label: 'Offline Space', icon: HardDrive },
          ]
        : [{ type: 'offline' as const, label: 'Offline Space', icon: HardDrive }],
    [showOnlineSpace]
  );

  const needsSpaceStep = contextSpaceType === undefined && spaceOptions.length > 1;

  // Filter templates based on space and search
  const filteredTemplates = useMemo(() => {
    const spaceType = contextSpaceType ?? selectedSpace ?? 'offline';
    let templates = getTemplatesForSpace(spaceType);

    if (activeCategory !== 'all') {
      templates = templates.filter((t) => t.category === activeCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      templates = templates.filter(
        (t) =>
          t.label.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.features?.some((f) => f.toLowerCase().includes(query))
      );
    }

    return templates;
  }, [contextSpaceType, selectedSpace, activeCategory, searchQuery]);

  // Get template counts per category
  const categoryCounts = useMemo(() => {
    const spaceType = contextSpaceType ?? selectedSpace ?? 'offline';
    const templates = getTemplatesForSpace(spaceType);
    return TEMPLATE_CATEGORIES.map((cat) => ({
      ...cat,
      count: templates.filter((t) => t.category === cat.id).length,
    }));
  }, [contextSpaceType, selectedSpace]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setStep(needsSpaceStep ? 'space' : 'template');
      setSelectedSpace(
        contextSpaceType ?? (spaceOptions.length === 1 ? spaceOptions[0].type : null)
      );
      setActiveCategory('all');
      setSearchQuery('');
    }
  }, [open, needsSpaceStep, contextSpaceType, spaceOptions]);

  const handleSpaceSelect = (space: SpaceType) => {
    setSelectedSpace(space);
    setStep('template');
  };

  const handleTemplateSelect = (templateId: PageType) => {
    if (needsSpaceStep && !selectedSpace) return;
    const resolvedSpace = contextSpaceType ?? selectedSpace!;
    onSelect(resolvedSpace, templateId);
    onClose();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative z-10 flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-popover shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Sparkles size={20} className="text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-popover-foreground">
                    {step === 'space' ? 'Choose Space' : 'Create New Page'}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {step === 'space'
                      ? 'Where would you like to create this page?'
                      : 'Select a template to get started'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {step === 'template' && needsSpaceStep && (
                  <button
                    onClick={() => setStep('space')}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    {selectedSpace === 'online' ? (
                      <>
                        <Cloud size={14} />
                        <span>Online</span>
                      </>
                    ) : (
                      <>
                        <HardDrive size={14} /
                        >
                        <span>Offline</span>
                      </>
                    )}
                    <ChevronRight size={14} className="-ml-0.5" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              <AnimatePresence mode="wait">
                {step === 'space' ? (
                  <motion.div
                    key="space-step"
                    variants={contentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="flex h-full flex-col items-center justify-center gap-6 p-8"
                  >
                    <p className="text-center text-muted-foreground">
                      Choose where you want to create your new page
                    </p>
                    <div className="grid w-full max-w-lg gap-4 sm:grid-cols-2">
                      {spaceOptions.map((option) => (
                        <SpaceOptionCard
                          key={option.type}
                          {...option}
                          isSelected={selectedSpace === option.type}
                          onClick={() => handleSpaceSelect(option.type)}
                        />
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="template-step"
                    variants={contentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="flex h-full"
                  >
                    {/* Sidebar - Categories */}
                    <div className="w-64 border-r border-border bg-muted/30 p-4">
                      <div className="mb-4 space-y-1">
                        <p className="px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Categories
                        </p>
                        <button
                          onClick={() => setActiveCategory('all')}
                          className={cn(
                            'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all',
                            activeCategory === 'all'
                              ? 'bg-primary/10 text-primary'
                              : 'hover:bg-accent/50 text-muted-foreground'
                          )}
                        >
                          <div
                            className={cn(
                              'flex h-10 w-10 items-center justify-center rounded-lg',
                              activeCategory === 'all' ? 'bg-primary/20' : 'bg-muted'
                            )}
                          >
                            <Sparkles size={20} />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">All Templates</p>
                          </div>
                          <span
                            className={cn(
                              'rounded-full px-2 py-0.5 text-xs',
                              activeCategory === 'all'
                                ? 'bg-primary/20 text-primary'
                                : 'bg-muted text-muted-foreground'
                            )}
                          >
                            {filteredTemplates.length}
                          </span>
                        </button>
                      </div>

                      <div className="space-y-1">
                        {categoryCounts.map((category) => (
                          <CategoryTab
                            key={category.id}
                            category={category}
                            isActive={activeCategory === category.id}
                            onClick={() => setActiveCategory(category.id)}
                            count={category.count}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Main Content - Templates Grid */}
                    <div className="flex-1 overflow-y-auto p-6">
                      {/* Search Bar */}
                      <div className="mb-6">
                        <div className="relative"
                        >
                          <Search
                            size={18}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                          />
                          <input
                            type="text"
                            placeholder="Search templates..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                        </div>
                      </div>

                      {/* Templates Grid */}
                      {filteredTemplates.length > 0 ? (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          {filteredTemplates.map((template, index) => (
                            <TemplateCard
                              key={template.id}
                              template={template}
                              onClick={() => handleTemplateSelect(template.id)}
                              index={index}
                            />
                          ))}
                        </div>
                      ) : (
                        <EmptyTemplatesState />
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="border-t border-border px-6 py-3">
              <p className="text-center text-xs text-muted-foreground">
                Press <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono">Esc</kbd> to close,{' '}
                <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono">↑↓</kbd> to navigate
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
