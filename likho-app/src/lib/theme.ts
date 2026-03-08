/**
 * Theme manager: semantic color tokens and theme hooks.
 *
 * All UI should use these Tailwind classes so light/dark switch automatically:
 *
 * Backgrounds:  bg-background | bg-surface | bg-muted | bg-sidebar | bg-popover
 * Text:         text-foreground | text-muted-foreground | text-surface-foreground
 * Borders:      border-border | border-border-muted | border-sidebar-border
 * Buttons:      bg-primary text-primary-foreground | bg-secondary text-secondary-foreground
 * Accents:      bg-accent text-accent-foreground
 * Destructive:  bg-destructive text-destructive-foreground
 * Inputs:       border-input, ring-ring
 *
 * Tokens are defined in App.css (:root for light, .dark for dark).
 */

import { useTheme } from '@/providers/ThemeProvider';
import { useSyncExternalStore } from 'react';

export type { Theme } from '@/providers/ThemeProvider';

export { useTheme };

/** Resolved theme actually applied (light or dark). Resolves "system" using prefers-color-scheme. */
export type ResolvedTheme = 'light' | 'dark';

function subscribeToColorScheme(cb: () => void) {
  const m = window.matchMedia('(prefers-color-scheme: dark)');
  m.addEventListener('change', cb);
  return () => m.removeEventListener('change', cb);
}

function getResolvedTheme(): ResolvedTheme {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

/**
 * Returns the currently applied theme (light or dark).
 * When theme is "system", this reflects the OS preference and updates when it changes.
 */
export function useResolvedTheme(): ResolvedTheme {
  return useSyncExternalStore(subscribeToColorScheme, getResolvedTheme, getResolvedTheme);
}

/** Semantic token names for reference / tooling. */
export const THEME_TOKENS = [
  'background',
  'foreground',
  'surface',
  'surface-foreground',
  'muted',
  'muted-foreground',
  'border',
  'border-muted',
  'input',
  'ring',
  'primary',
  'primary-foreground',
  'secondary',
  'secondary-foreground',
  'accent',
  'accent-foreground',
  'destructive',
  'destructive-foreground',
  'popover',
  'popover-foreground',
  'sidebar',
  'sidebar-foreground',
  'sidebar-border',
] as const;
