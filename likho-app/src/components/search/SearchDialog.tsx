import React, { useState, useCallback, useEffect, useRef } from "react";
import { Search, X, Loader2, Command, FileText, ArrowUp, ArrowDown, CornerDownLeft } from "lucide-react";
import { useSearch } from "../../hooks/useSearch";
import { SearchResultItem } from "./SearchResultItem";
import { motion, AnimatePresence } from "framer-motion";

interface SearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentFolderPath?: string;
  onResultClick?: (result: {
    noteId: string;
    noteTitle: string;
    folderPath: string;
  }) => void;
}

export const SearchDialog: React.FC<SearchDialogProps> = ({
  isOpen,
  onClose,
  currentFolderPath = "/",
  onResultClick,
}) => {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { results, isLoading, error, search, clearResults } = useSearch();
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const isOpenRef = useRef(isOpen);
  
  // Keep ref in sync with state
  isOpenRef.current = isOpen;

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  // Focus input when dialog opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Handle close with cleanup
  const handleClose = useCallback(() => {
    setQuery("");
    setSelectedIndex(0);
    clearResults();
    onClose();
  }, [onClose, clearResults]);

  // Handle click outside to close
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      handleClose();
    }
  };

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (query.trim()) {
        search(query, currentFolderPath);
      }
    },
    [query, currentFolderPath, search]
  );

  const handleResultClick = useCallback(
    (result: {
      noteId: string;
      noteTitle: string;
      folderPath: string;
    }) => {
      onResultClick?.(result);
      handleClose();
    },
    [onResultClick, handleClose]
  );

  // Handle keyboard navigation - using capture phase to ensure we catch events first
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only process if dialog is open
      if (!isOpenRef.current) return;

      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        handleClose();
        return;
      }

      // Navigation only works when there are results
      if (results.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => 
            prev < results.length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;
        case "Enter":
          e.preventDefault();
          if (results[selectedIndex]) {
            handleResultClick({
              noteId: results[selectedIndex].note_id,
              noteTitle: results[selectedIndex].note_title,
              folderPath: results[selectedIndex].folder_path,
            });
          }
          break;
      }
    };

    // Use capture phase to ensure we get the event first
    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [results, selectedIndex, handleClose, handleResultClick]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={overlayRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={handleOverlayClick}
          className="fixed inset-0 z-50 flex items-start justify-center 
            bg-black/60 backdrop-blur-sm pt-[15vh] px-4"
        >
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.96 }}
            transition={{ 
              type: "spring", 
              damping: 25, 
              stiffness: 350,
              duration: 0.2 
            }}
            className="w-full max-w-2xl overflow-hidden rounded-2xl
              bg-white dark:bg-zinc-900 
              shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5),0_0_0_1px_rgba(0,0,0,0.1)]
              dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.1)]"
            onKeyDown={(e) => {
              // Additional handler directly on the modal for redundancy
              if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                handleClose();
              }
            }}
          >
            {/* Gradient accent bar */}
            <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 
              animate-gradient-x" />

            {/* Search Input */}
            <form onSubmit={handleSearch} className="border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-3 px-5 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl
                  bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
                  <Search className="h-5 w-5 text-white" />
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search your notes..."
                  className="flex-1 bg-transparent text-lg text-zinc-900 dark:text-zinc-100 
                    outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                  autoFocus
                  onKeyDown={(e) => {
                    // Capture Escape directly on input
                    if (e.key === "Escape") {
                      e.preventDefault();
                      e.stopPropagation();
                      handleClose();
                    }
                  }}
                />
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
                ) : (
                  query && (
                    <button
                      type="button"
                      onClick={() => {
                        setQuery("");
                        clearResults();
                      }}
                      className="rounded-full p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 
                        text-zinc-400 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )
                )}
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-lg px-2.5 py-1 text-xs font-medium
                    text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800
                    transition-colors"
                >
                  ESC
                </button>
              </div>
            </form>

            {/* Results */}
            <div className="max-h-[50vh] overflow-y-auto">
              {error && (
                <div className="p-6 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full 
                    bg-red-100 dark:bg-red-900/30 mb-3">
                    <X className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
                </div>
              )}

              {results.length > 0 && (
                <div className="py-2">
                  <div className="px-5 py-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    {results.length} result{results.length !== 1 ? "s" : ""} found
                  </div>
                  {results.map((result, index) => (
                    <div
                      key={result.chunk_id}
                      className={`transition-colors duration-150 ${
                        index === selectedIndex 
                          ? "bg-indigo-50 dark:bg-indigo-500/10" 
                          : ""
                      }`}
                    >
                      <SearchResultItem
                        result={result}
                        onClick={handleResultClick}
                        isSelected={index === selectedIndex}
                      />
                    </div>
                  ))}
                </div>
              )}

              {query && !isLoading && results.length === 0 && !error && (
                <div className="p-8 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full 
                    bg-zinc-100 dark:bg-zinc-800 mb-4">
                    <FileText className="h-8 w-8 text-zinc-400 dark:text-zinc-500" />
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-300 font-medium mb-1">
                    No results found for "{query}"
                  </p>
                  <p className="text-sm text-zinc-400 dark:text-zinc-500 mb-4">
                    Try different keywords or check your spelling
                  </p>
                  <div className="text-xs text-zinc-400 dark:text-zinc-500 bg-zinc-50 dark:bg-zinc-800/50 
                    rounded-lg p-3 inline-block">
                    <span className="font-medium text-zinc-500 dark:text-zinc-400">Tips:</span>
                    <ul className="mt-1.5 list-disc list-inside text-left space-y-0.5">
                      <li>Make sure your notes are saved</li>
                      <li>Try searching for words in the note title</li>
                      <li>Notes are indexed automatically when saved</li>
                    </ul>
                  </div>
                </div>
              )}

              {!query && (
                <div className="p-8 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full 
                    bg-gradient-to-br from-indigo-100 to-purple-100 
                    dark:from-indigo-900/30 dark:to-purple-900/30 mb-4">
                    <Command className="h-8 w-8 text-indigo-500 dark:text-indigo-400" />
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-300 font-medium mb-1">
                    Type to search across all your notes
                  </p>
                  <p className="text-sm text-zinc-400 dark:text-zinc-500">
                    Searches in: {currentFolderPath}/*
                  </p>
                </div>
              )}
            </div>

            {/* Footer with shortcuts */}
            <div className="flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800 
              px-5 py-3 bg-zinc-50 dark:bg-zinc-800/50">
              <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <span className="flex items-center gap-0.5">
                    <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-zinc-700 
                      border border-zinc-200 dark:border-zinc-600 font-mono text-[10px]">
                      <ArrowUp className="h-3 w-3 inline" />
                    </kbd>
                    <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-zinc-700 
                      border border-zinc-200 dark:border-zinc-600 font-mono text-[10px]">
                      <ArrowDown className="h-3 w-3 inline" />
                    </kbd>
                  </span>
                  navigate
                </span>
                <span className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-zinc-700 
                    border border-zinc-200 dark:border-zinc-600 font-mono text-[10px]">
                    <CornerDownLeft className="h-3 w-3 inline" />
                  </kbd>
                  select
                </span>
                <span className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-zinc-700 
                    border border-zinc-200 dark:border-zinc-600 font-mono text-[10px]">
                    esc
                  </kbd>
                  close
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                Local AI Search
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
