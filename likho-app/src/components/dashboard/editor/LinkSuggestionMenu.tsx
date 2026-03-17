import { useState, useEffect, useRef } from 'react';
import { Search, FileText, Folder, ArrowRight } from 'lucide-react';
import type { LinkSuggestion } from '@/types/links';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useLinkStore } from '@/store/linkStore';

interface LinkSuggestionMenuProps {
  isOpen: boolean;
  onSelect: (suggestion: LinkSuggestion) => void;
  onClose: () => void;
  position?: { top: number; left: number };
  /** Optional initial query (e.g. text already typed after [[ ) */
  initialQuery?: string;
}

export function LinkSuggestionMenu({
  isOpen,
  onSelect,
  onClose,
  position = { top: 0, left: 0 },
  initialQuery = '',
}: LinkSuggestionMenuProps) {
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<LinkSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const notes = useWorkspaceStore((s) => s.notes);
  const folders = useWorkspaceStore((s) => s.folders);
  const getLinkSuggestions = useLinkStore((s) => s.getLinkSuggestions);

  // Reset query when menu opens/closes
  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery);
      setSelectedIndex(0);
      // Auto-focus the search input
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [isOpen, initialQuery]);

  // Update suggestions whenever query changes
  useEffect(() => {
    if (query.length > 0) {
      const results = getLinkSuggestions(query, notes, folders);
      setSuggestions(results.slice(0, 10));
      setSelectedIndex(0);
    } else {
      // Show recent items when no query
      const recent: LinkSuggestion[] = [
        ...notes.slice(-6).reverse().map((n) => ({
          id: n.id,
          title: n.title || 'Untitled',
          type: 'note' as const,
          path: '',
          icon: n.icon,
        })),
        ...folders.slice(-3).reverse().map((f) => ({
          id: f.id,
          title: f.name,
          type: 'folder' as const,
          path: '',
        })),
      ];
      setSuggestions(recent.slice(0, 10));
    }
  }, [query, notes, folders, getLinkSuggestions]);

  // Keyboard navigation — Escape / Enter / Arrow keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((i) => (i + 1) % Math.max(suggestions.length, 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((i) =>
            (i - 1 + Math.max(suggestions.length, 1)) % Math.max(suggestions.length, 1)
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (suggestions[selectedIndex]) {
            onSelect(suggestions[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, suggestions, selectedIndex, onSelect, onClose]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 w-80 bg-popover border border-border rounded-lg shadow-lg overflow-hidden"
      style={{ top: position.top, left: position.left }}
    >
      {/* Search input */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/50">
        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search notes and folders…"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          // Prevent BlockNote from stealing keystrokes
          onKeyDown={(e) => e.stopPropagation()}
          onKeyUp={(e) => e.stopPropagation()}
          onKeyPress={(e) => e.stopPropagation()}
        />
      </div>

      <div className="max-h-64 overflow-y-auto">
        {suggestions.length === 0 ? (
          <div className="px-3 py-4 text-sm text-muted-foreground text-center">
            No matches for "{query}"
          </div>
        ) : (
          suggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors
                ${index === selectedIndex ? 'bg-accent' : 'hover:bg-accent/50'}`}
              onClick={() => onSelect(suggestion)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              {suggestion.type === 'note' ? (
                suggestion.icon ? (
                  <span className="text-base leading-none">{suggestion.icon}</span>
                ) : (
                  <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                )
              ) : (
                <Folder className="h-4 w-4 text-purple-500 shrink-0" />
              )}

              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {suggestion.title || 'Untitled'}
                </div>
                {suggestion.path && (
                  <div className="text-xs text-muted-foreground truncate">
                    {suggestion.path}
                  </div>
                )}
              </div>

              {index === selectedIndex && (
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
            </button>
          ))
        )}
      </div>

      <div className="flex items-center gap-2 px-3 py-1.5 border-t border-border bg-muted/30 text-xs text-muted-foreground">
        <span>↑↓ navigate</span>
        <span>•</span>
        <span>↵ select</span>
        <span>•</span>
        <span>Esc cancel</span>
      </div>
    </div>
  );
}
