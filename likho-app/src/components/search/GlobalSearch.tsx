import React, { useState } from "react";
import { SearchDialog } from "./SearchDialog";
import { useKeyboardShortcut } from "@/hooks/useKeyboardShortcut";
import { Search, Command } from "lucide-react";

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);

  // Register Cmd+K keyboard shortcut
  useKeyboardShortcut(
    () => setIsOpen(true),
    { key: "k", meta: true }
  );

  return (
    <>
      {/* Search Button - Add this to your header/sidebar */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Search notes...</span>
        <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
          <Command className="h-3 w-3" />
          K
        </kbd>
      </button>

      {/* Search Dialog */}
      <SearchDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        currentFolderPath="/"
        onResultClick={(result) => {
          console.log("Selected:", result);
          // Navigate to the note
          // navigate(`/dashboard/notes/${result.noteId}`);
        }}
      />
    </>
  );
}

export default GlobalSearch;