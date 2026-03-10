import React from "react";
import { FileText, Folder } from "lucide-react";
import { SearchResult } from "../../types/search";

interface SearchResultItemProps {
  result: SearchResult;
  onClick?: (result: {
    noteId: string;
    noteTitle: string;
    folderPath: string;
  }) => void;
  isSelected?: boolean;
}

export const SearchResultItem: React.FC<SearchResultItemProps> = ({
  result,
  onClick,
  isSelected = false,
}) => {
  const handleClick = () => {
    onClick?.({
      noteId: result.note_id,
      noteTitle: result.note_title,
      folderPath: result.folder_path,
    });
  };

  // Truncate text for display
  const displayText = result.text.length > 120
    ? result.text.substring(0, 120) + "..."
    : result.text;

  return (
    <button
      onClick={handleClick}
      className={`w-full px-5 py-3.5 text-left transition-all duration-150 
        border-b border-zinc-100 dark:border-zinc-800/50 last:border-0
        ${isSelected 
          ? "bg-indigo-50/80 dark:bg-indigo-500/10" 
          : "hover:bg-zinc-50 dark:hover:bg-zinc-800/30"
        }`}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 flex-shrink-0 flex h-9 w-9 items-center justify-center 
          rounded-lg transition-colors duration-150
          ${isSelected 
            ? "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400" 
            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
          }`}>
          <FileText className="h-4 w-4" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`font-semibold text-sm truncate 
              ${isSelected 
                ? "text-indigo-900 dark:text-indigo-300" 
                : "text-zinc-900 dark:text-zinc-100"
              }`}>
              {result.note_title}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full 
              bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
              #{result.chunk_index + 1}
            </span>
          </div>
          
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 mb-1.5">
            <Folder className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{result.folder_path}</span>
          </div>
          
          <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
            {displayText}
          </p>
          
          {/* Score indicators */}
          <div className="flex items-center gap-4 mt-2.5 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-400">Vector</span>
              <div className="flex items-center gap-1">
                <div className="w-8 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      result.vector_score > 0.7 
                        ? "bg-green-500" 
                        : result.vector_score > 0.4 
                          ? "bg-yellow-500" 
                          : "bg-zinc-400"
                    }`}
                    style={{ width: `${result.vector_score * 100}%` }}
                  />
                </div>
                <span className={`font-medium ${
                  result.vector_score > 0.7 
                    ? "text-green-600 dark:text-green-400" 
                    : "text-zinc-600 dark:text-zinc-400"
                }`}>
                  {(result.vector_score * 100).toFixed(0)}%
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-400">Hybrid</span>
              <div className="flex items-center gap-1">
                <div className="w-8 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-indigo-500"
                    style={{ width: `${result.hybrid_score * 100}%` }}
                  />
                </div>
                <span className="font-medium text-indigo-600 dark:text-indigo-400">
                  {(result.hybrid_score * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
};
