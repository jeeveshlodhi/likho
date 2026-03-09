import React, { useState, useCallback, useEffect, useRef } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { useSearch } from "../../hooks/useSearch";
import { SearchResultItem } from "./SearchResultItem";
import { useKeyboardShortcut } from "@/hooks/useKeyboardShortcut";

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

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  // Focus input when dialog opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (query.trim()) {
        search(query, currentFolderPath);
      }
    },
    [query, currentFolderPath, search]
  );

  const handleClose = useCallback(() => {
    setQuery("");
    setSelectedIndex(0);
    clearResults();
    onClose();
  }, [onClose, clearResults]);

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

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC to close
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
        return;
      }

      // Only handle navigation if we have results
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

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, results, selectedIndex, handleClose, handleResultClick]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-[20vh]">
      <div className="w-full max-w-2xl rounded-lg bg-white shadow-2xl">
        {/* Search Input */}
        <form onSubmit={handleSearch} className="border-b border-gray-200">
          <div className="flex items-center px-4 py-3">
            <Search className="h-5 w-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your notes..."
              className="ml-3 flex-1 bg-transparent text-lg outline-none placeholder:text-gray-400"
              autoFocus
            />
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            ) : (
              query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    clearResults();
                  }}
                  className="rounded-full p-1 hover:bg-gray-100"
                >
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              )
            )}
            <button
              type="button"
              onClick={handleClose}
              className="ml-2 rounded px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
            >
              ESC
            </button>
          </div>
        </form>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {error && (
            <div className="p-4 text-center text-red-500">{error}</div>
          )}

          {results.length > 0 && (
            <div className="py-2">
              <div className="px-4 py-2 text-xs font-medium text-gray-500">
                {results.length} result{results.length !== 1 ? "s" : ""} found
              </div>
              {results.map((result, index) => (
                <div
                  key={result.chunk_id}
                  className={index === selectedIndex ? "bg-blue-50" : ""}
                >
                  <SearchResultItem
                    result={result}
                    onClick={handleResultClick}
                  />
                </div>
              ))}
            </div>
          )}

          {query && !isLoading && results.length === 0 && !error && (
            <div className="p-8 text-center text-gray-500">
              <div className="mb-2">No results found for "{query}"</div>
              <div className="text-xs text-gray-400">
                Tips:
                <ul className="mt-1 list-disc list-inside text-left inline-block">
                  <li>Make sure your notes are saved</li>
                  <li>Try searching for words in the note title</li>
                  <li>Notes are indexed automatically when saved</li>
                </ul>
              </div>
            </div>
          )}

          {!query && (
            <div className="p-8 text-center text-gray-400">
              Type to search across all your notes
              <div className="mt-2 text-xs text-gray-300">
                Searches in: {currentFolderPath}/*
              </div>
            </div>
          )}
        </div>

        {/* Footer with shortcuts */}
        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-2 text-xs text-gray-400">
          <div className="flex items-center gap-4">
            <span><kbd className="rounded bg-gray-100 px-1">↑↓</kbd> to navigate</span>
            <span><kbd className="rounded bg-gray-100 px-1">↵</kbd> to select</span>
            <span><kbd className="rounded bg-gray-100 px-1">esc</kbd> to close</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500"></span>
            Local AI Search
          </div>
        </div>
      </div>
    </div>
  );
};