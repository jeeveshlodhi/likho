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
}

export const SearchResultItem: React.FC<SearchResultItemProps> = ({
  result,
  onClick,
}) => {
  const handleClick = () => {
    onClick?.({
      noteId: result.note_id,
      noteTitle: result.note_title,
      folderPath: result.folder_path,
    });
  };

  // Truncate text for display
  const displayText = result.text.length > 150
    ? result.text.substring(0, 150) + "..."
    : result.text;

  return (
    <button
      onClick={handleClick}
      className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
    >
      <div className="flex items-start gap-3">
        <div className="mt-1 flex-shrink-0">
          <FileText className="h-4 w-4 text-blue-500" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-900 truncate">
              {result.note_title}
            </span>
            <span className="text-xs text-gray-400">
              Chunk {result.chunk_index + 1}
            </span>
          </div>
          
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
            <Folder className="h-3 w-3" />
            <span className="truncate">{result.folder_path}</span>
          </div>
          
          <p className="text-sm text-gray-600 line-clamp-2">
            {displayText}
          </p>
          
          {/* Score indicators */}
          <div className="flex items-center gap-3 mt-2 text-xs">
            <div className="flex items-center gap-1">
              <span className="text-gray-400">Vector:</span>
              <span className={`font-medium ${
                result.vector_score > 0.7 ? "text-green-600" : "text-gray-600"
              }`}>
                {(result.vector_score * 100).toFixed(0)}%
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              <span className="text-gray-400">Keyword:</span>
              <span className={`font-medium ${
                result.keyword_score > 0.7 ? "text-green-600" : "text-gray-600"
              }`}>
                {(result.keyword_score * 100).toFixed(0)}%
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              <span className="text-gray-400">Hybrid:</span>
              <span className="font-medium text-blue-600">
                {(result.hybrid_score * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
};