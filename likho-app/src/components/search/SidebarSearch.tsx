import { useState } from "react";
import { SearchDialog } from "./SearchDialog";
import { Search, Command } from "lucide-react";
import { motion } from "framer-motion";

interface SidebarSearchProps {
  collapsed?: boolean;
}

export function SidebarSearch({ collapsed = false }: SidebarSearchProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Note: Cmd+K keyboard shortcut is handled globally by AppShortcuts component
  // We only render the SearchDialog here when opened via click

  if (collapsed) {
    return (
      <>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="rounded-xl p-2.5 text-zinc-500 hover:bg-white 
            hover:text-zinc-900 hover:shadow-sm
            dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100
            transition-all duration-200"
          title="Search notes (Cmd+K)"
        >
          <Search size={18} />
        </motion.button>
        <SearchDialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          currentFolderPath="/"
          onResultClick={(result) => {
            window.location.href = `/dashboard/note/${result.noteId}`;
          }}
        />
      </>
    );
  }

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(true)}
        className="group flex flex-1 items-center gap-2.5 
          rounded-xl border border-zinc-200 dark:border-zinc-700
          bg-white dark:bg-zinc-800/50 
          px-3 py-2 text-sm 
          text-zinc-500 dark:text-zinc-400
          hover:shadow-md
          transition-all duration-200
          hover:border-zinc-300 dark:hover:border-zinc-600
          hover:text-zinc-700 dark:hover:text-zinc-200"
      >
        <span className="flex-1 text-xs font-medium">Search notes...</span>
        <kbd className="hidden sm:inline-flex h-5 select-none items-center 
          gap-0.5 rounded-md border border-zinc-200 dark:border-zinc-600
          bg-zinc-50 dark:bg-zinc-700 
          px-1.5 font-mono text-[10px] font-medium
          text-zinc-500 dark:text-zinc-400">
          <Command size={9} />
          <span>K</span>
        </kbd>
      </motion.button>
      <SearchDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        currentFolderPath="/"
        onResultClick={(result) => {
          window.location.href = `/dashboard/note/${result.noteId}`;
        }}
      />
    </>
  );
}

export default SidebarSearch;
