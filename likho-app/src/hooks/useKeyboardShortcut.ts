import { useEffect, useCallback } from 'react';

interface UseKeyboardShortcutOptions {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  preventDefault?: boolean;
}

export function useKeyboardShortcut(
  callback: () => void,
  options: UseKeyboardShortcutOptions
) {
  const { key, ctrl = false, meta = false, shift = false, alt = false, preventDefault = true } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const keyMatch = event.key.toLowerCase() === key.toLowerCase();
      const ctrlMatch = ctrl === event.ctrlKey;
      const metaMatch = meta === event.metaKey;
      const shiftMatch = shift === event.shiftKey;
      const altMatch = alt === event.altKey;

      if (keyMatch && ctrlMatch && metaMatch && shiftMatch && altMatch) {
        if (preventDefault) {
          event.preventDefault();
        }
        callback();
      }
    },
    [callback, key, ctrl, meta, shift, alt, preventDefault]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

export default useKeyboardShortcut;