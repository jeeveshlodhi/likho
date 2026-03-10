import React, { useState } from "react";
import { Command, X, Keyboard, Search, MessageSquare, Settings } from "lucide-react";
import { useKeyboardShortcut } from "@/hooks/useKeyboardShortcut";

interface Shortcut {
  keys: string[];
  description: string;
  category: "Navigation" | "Search" | "Editor" | "AI";
}

const SHORTCUTS: Shortcut[] = [
  // Navigation
  { keys: ["Cmd", "K"], description: "Open search dialog", category: "Search" },
  { keys: ["Esc"], description: "Close dialog / Cancel", category: "Navigation" },
  { keys: ["Enter"], description: "Select result / Submit", category: "Navigation" },
  { keys: ["↑"], description: "Navigate up in results", category: "Navigation" },
  { keys: ["↓"], description: "Navigate down in results", category: "Navigation" },
  
  // Editor
  { keys: ["/"], description: "Open slash menu", category: "Editor" },
  { keys: ["[["], description: "Insert wikilink", category: "Editor" },
  { keys: ["#"], description: "Insert tag", category: "Editor" },
  
  // AI
  { keys: ["Cmd", "Shift", "A"], description: "Open AI Chat", category: "AI" },
  { keys: ["Cmd", "Shift", "L"], description: "AI Model Settings", category: "AI" },
  { keys: ["Cmd", "Shift", "N"], description: "Quick capture temp note", category: "AI" },
];

export function ShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);

  // Register ? key to open shortcuts help
  useKeyboardShortcut(
    () => setIsOpen(true),
    { key: "?", shift: true }
  );

  if (!isOpen) return null;

  const categories = ["Navigation", "Search", "Editor", "AI"] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-lg bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-gray-600" />
            <h2 className="font-semibold text-gray-900">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4">
          {categories.map((category) => (
            <div key={category} className="mb-6">
              <h3 className="mb-3 text-sm font-medium text-gray-500 uppercase tracking-wider">
                {category}
              </h3>
              <div className="space-y-2">
                {SHORTCUTS.filter((s) => s.category === category).map((shortcut, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
                  >
                    <span className="text-sm text-gray-700">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIdx) => (
                        <React.Fragment key={keyIdx}>
                          <kbd className="rounded border bg-white px-2 py-0.5 text-xs font-mono font-medium text-gray-700 shadow-sm"
                          >
                            {key}
                          </kbd>
                          {keyIdx < shortcut.keys.length - 1 && (
                            <span className="text-gray-400">+</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-200 px-4 py-3 text-center text-xs text-gray-400">
          Press <kbd className="rounded bg-gray-100 px-1">Shift + ?</kbd> to show this help
        </div>
      </div>
    </div>
  );
}

export function ShortcutsButton() {
  const [isOpen, setIsOpen] = useState(false);

  useKeyboardShortcut(
    () => setIsOpen(true),
    { key: "?", shift: true }
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-100"
        title="Keyboard shortcuts (Shift + ?)"
      >
        <Keyboard className="h-4 w-4" />
        <span>Shortcuts</span>
        <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-gray-100 px-1.5 font-mono text-[10px] font-medium">
          ?
        </kbd>
      </button>

      {isOpen && <ShortcutsHelp />}
    </>
  );
}

export default ShortcutsHelp;