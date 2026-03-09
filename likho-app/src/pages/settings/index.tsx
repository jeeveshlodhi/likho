import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  LogOut,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { useSettingsStore } from '@/store/settingsStore';
import type { SettingsSection } from '@/types/settings';
import { cn } from '@/lib/utils';
import { SETTINGS_NAV_ITEMS } from './settingsConfig';
import { AccountSettings } from './sections/AccountSettings';
import { AppearanceSettings } from './sections/AppearanceSettings';
import { NotificationSettings } from './sections/NotificationSettings';
import { EditorSettings } from './sections/EditorSettings';
import { PrivacySettings } from './sections/PrivacySettings';
import { WorkspaceSettings } from './sections/WorkspaceSettings';
import { IntegrationsSettings } from './sections/IntegrationsSettings';
import { ShortcutsSettings } from './sections/ShortcutsSettings';
import { AdvancedSettings } from './sections/AdvancedSettings';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const sectionComponents: Record<SettingsSection, React.ComponentType> = {
  account: AccountSettings,
  appearance: AppearanceSettings,
  notifications: NotificationSettings,
  editor: EditorSettings,
  privacy: PrivacySettings,
  workspace: WorkspaceSettings,
  integrations: IntegrationsSettings,
  shortcuts: ShortcutsSettings,
  advanced: AdvancedSettings,
};

export default function SettingsPage() {
  const navigate = useNavigate();
  const { section } = useParams<{ section?: string }>();
  const [activeSection, setActiveSection] = useState<SettingsSection>(
    (section as SettingsSection) || 'account'
  );
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const resetSettings = useSettingsStore((state) => state.resetSettings);

  // Update active section when URL changes
  useEffect(() => {
    if (section && SETTINGS_NAV_ITEMS.some((item) => item.id === section)) {
      setActiveSection(section as SettingsSection);
    }
  }, [section]);

  // Show save success toast
  const showSaveToast = () => {
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 2000);
  };

  const ActiveSectionComponent = sectionComponents[activeSection];

  return (
    <div className="flex h-full overflow-hidden bg-background">
      {/* Sidebar */}
      <div className="flex w-72 flex-col border-r border-border bg-card">
        {/* Header */}
        <div className="border-b border-border p-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
          <h1 className="mt-4 text-xl font-semibold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your preferences</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3">
          <div className="space-y-1">
            {SETTINGS_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    navigate(`/dashboard/settings/${item.id}`);
                  }}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-lg',
                      isActive ? 'bg-primary/20' : 'bg-muted'
                    )}
                  >
                    <Icon size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{item.label}</p>
                  </div>
                  <ChevronRight
                    size={16}
                    className={cn(
                      'transition-transform',
                      isActive && 'rotate-90'
                    )}
                  />
                </button>
              );
            })}
          </div>
        </nav>

        {/* Footer Actions */}
        <div className="border-t border-border p-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10">
                <Trash2 size={16} />
                Reset All Settings
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="text-destructive" size={20} />
                  Reset All Settings?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This will reset all settings to their default values. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    resetSettings();
                    showSaveToast();
                  }}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Reset Settings
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <button className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
            <LogOut size={16} />
            Log Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="p-8"
          >
            {/* Section Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3">
                {(() => {
                  const item = SETTINGS_NAV_ITEMS.find((i) => i.id === activeSection);
                  if (!item) return null;
                  const Icon = item.icon;
                  return (
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <Icon className="text-primary" size={24} />
                    </div>
                  );
                })()}
                <div>
                  <h2 className="text-2xl font-semibold text-foreground">
                    {SETTINGS_NAV_ITEMS.find((i) => i.id === activeSection)?.label}
                  </h2>
                  <p className="text-muted-foreground">
                    {SETTINGS_NAV_ITEMS.find((i) => i.id === activeSection)?.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Settings Section */}
            <div className="max-w-3xl">
              <ActiveSectionComponent />
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Save Success Toast */}
        <AnimatePresence>
          {showSaveSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-6 right-6 flex items-center gap-2 rounded-lg bg-green-500 px-4 py-3 text-white shadow-lg"
            >
              <Check size={18} />
              <span>Settings saved successfully</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
