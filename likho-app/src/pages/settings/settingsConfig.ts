/**
 * Settings navigation items configuration
 */
import type { SettingsSection } from '@/types/settings';
import {
  User,
  Palette,
  Bell,
  FileEdit,
  Shield,
  Briefcase,
  Plug,
  Keyboard,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export interface SettingsNavItem {
  id: SettingsSection;
  label: string;
  description: string;
  icon: LucideIcon;
}

export const SETTINGS_NAV_ITEMS: SettingsNavItem[] = [
  {
    id: 'account',
    label: 'Account',
    description: 'Manage your profile and personal information',
    icon: User,
  },
  {
    id: 'appearance',
    label: 'Appearance',
    description: 'Customize the look and feel of the app',
    icon: Palette,
  },
  {
    id: 'notifications',
    label: 'Notifications',
    description: 'Control how you receive updates',
    icon: Bell,
  },
  {
    id: 'editor',
    label: 'Editor',
    description: 'Configure your writing preferences',
    icon: FileEdit,
  },
  {
    id: 'privacy',
    label: 'Privacy',
    description: 'Manage your privacy and data settings',
    icon: Shield,
  },
  {
    id: 'workspace',
    label: 'Workspace',
    description: 'Workspace settings and preferences',
    icon: Briefcase,
  },
  {
    id: 'integrations',
    label: 'Integrations',
    description: 'Connect with other apps and services',
    icon: Plug,
  },
  {
    id: 'shortcuts',
    label: 'Shortcuts',
    description: 'Customize keyboard shortcuts',
    icon: Keyboard,
  },
  {
    id: 'advanced',
    label: 'Advanced',
    description: 'Developer and power user settings',
    icon: Settings,
  },
];
