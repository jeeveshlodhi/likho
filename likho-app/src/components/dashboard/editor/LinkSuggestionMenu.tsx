import { useState, useEffect, useRef } from 'react';
import { Search, FileText, Folder, Hash, ArrowRight } from 'lucide-react';
import type { LinkSuggestion } from '@/types/links';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useLinkStore } from '@/store/linkStore';

interface LinkSuggestionMenuProps {
  query: string;
  isOpen: boolean;
  onSelect: (suggestion: LinkSuggestion) => void;
  onClose: () => void;
  position?: { top: number; left: number };
}

export function LinkSuggestionMenu({ 
  query, 
  isOpen, 
  onSelect, 
  onClose,
  position = { top: 0, left: 0 }
}: LinkSuggestionMenuProps) {
  const [suggestions, setSuggestions] = useState<LinkSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const notes = useWorkspaceStore((s) => s.notes);
  const folders = useWorkspaceStore((s) => s.folders);
  const getLinkSuggestions = useLinkStore((s) => s.getLinkSuggestions);
  
  useEffect(() => {
    if (query.length > 0) {
      const results = getLinkSuggestions(query, notes, folders);
      setSuggestions(results.slice(0, 10));
      setSelectedIndex(0);
    } else {
      // Show recent/frequently used when no query
      const recent = [...notes.slice(-5), ...folders.slice(-3)].map(item => ({
        id: 'id' in item ? item.id : item.id,
        title: 'title' in item ? item.title : item.name,
        type: 'title' in item ? 'note' as const : 'folder' as const,
        path: '',
      }));
      setSuggestions(recent);
    }
  }, [query, notes, folders, getLinkSuggestions]);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(i => (i + 1) % suggestions.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(i => (i - 1 + suggestions.length) % suggestions.length);
          break;
        case 'Enter':
          e.preventDefault();
          if (suggestions[selectedIndex]) {
            onSelect(suggestions[selectedIndex]);
          }
          break;
        case 'Escape':
          onClose();
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, suggestions, selectedIndex, onSelect, onClose]);
  
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
      className="absolute z-50 w-80 bg-popover border border-border rounded-lg shadow-lg overflow-hidden"
      style={{ top: position.top, left: position.left }}
    >
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/50">
        <Search className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          {query ? `Search: "${query}"` : 'Recent items'}
        </span>
      </div>
      
      <div className="max-h-64 overflow-y-auto">
        {suggestions.length === 0 ? (
          <div className="px-3 py-4 text-sm text-muted-foreground text-center">
            No matches found
            <br />
            <span className="text-xs">Press Enter to create new note</span>
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
                <FileText className="h-4 w-4 text-blue-500" />
              ) : (
                <Folder className="h-4 w-4 text-purple-500" />
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
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          ))
        )}
      </div>
      
      <div className="flex items-center justify-between px-3 py-1.5 border-t border-border bg-muted/30 text-xs text-muted-foreground">
        <div className="flex gap-2">
          <span>↑↓ to navigate</span>
          <span>•</span>
          <span>↵ to select</span>
        </div>
        <div className="flex gap-2">
          <span>Shift+↵ to create</span>
        </div>
      </div>
    </div>
  );
}
