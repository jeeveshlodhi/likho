import React, { useState } from "react";
import { SearchDialog } from "./SearchDialog";
import { useKeyboardShortcut } from "@/hooks/useKeyboardShortcut";
import { Search } from "lucide-react";

interface SidebarSearchProps {
  collapsed?: boolean;
}

export function SidebarSearch({ collapsed = false }: SidebarSearchProps) {
  const [isOpen, setIsOpen] = useState(false);

  console.log("SidebarSearch rendered, isOpen:", isOpen);

  // Register Cmd+K keyboard shortcut
  useKeyboardShortcut(
    () => {
      console.log("Cmd+K pressed, opening search");
      setIsOpen(true);
    },
    { key: "k", meta: true }
  );

  if (collapsed) {
    return (
      <>
        <button
          onClick={() => {
            console.log("Search button clicked (collapsed)");
            setIsOpen(true);
          }}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          title="Search notes (Cmd+K)"
        >
          <Search size={16} />
        </button>
        <SearchDialog
          isOpen={isOpen}
          onClose={() => {
            console.log("Search dialog closed");
            setIsOpen(false);
          }}
          currentFolderPath="/"
          onResultClick={(result) => {
            console.log("Search result clicked:", result);
            // Navigate to the note
            window.location.href = `/dashboard/note/${result.noteId}`;
          }}
        />
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => {
          console.log("Search button clicked");
          setIsOpen(true);
        }}
        className="flex flex-1 items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <Search size={16} />
        <span className="flex-1 text-left">Search notes...</span>
        <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
          ⌘K
        </kbd>
      </button>
      <SearchDialog
        isOpen={isOpen}
        onClose={() => {
          console.log("Search dialog closed");
          setIsOpen(false);
        }}
        currentFolderPath="/"
        onResultClick={(result) => {
          console.log("Search result clicked:", result);
          // Navigate to the note
          window.location.href = `/dashboard/note/${result.noteId}`;
        }}
      />
    </>
  );
}

export default SidebarSearch;