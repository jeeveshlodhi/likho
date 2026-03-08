/**
 * Detect if the app is running inside the Tauri desktop runtime.
 * Checks __TAURI__ (when withGlobalTauri is true) and __TAURI_INTERNALS__ as fallback.
 */
export function isTauri(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as any;
  return !!(w.__TAURI__ || w.__TAURI_INTERNALS__);
}

/**
 * Detect macOS (for titlebar layout: traffic lights on left).
 */
export function isMac(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform) || navigator.userAgent.includes('Mac');
}

/**
 * Detect Windows (for titlebar layout: window controls on right).
 */
export function isWindows(): boolean {
  if (typeof navigator === 'undefined') return false;
  return navigator.platform === 'Win32' || navigator.userAgent.includes('Windows');
}
