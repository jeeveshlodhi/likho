import React, { useState, useCallback } from "react";
import { Search, Sparkles, Command } from "lucide-react";
import { SearchDialog } from "./SearchDialog";

interface SearchButtonProps {
  currentFolderPath?: string;
  onResultClick?: (result: {
    noteId: string;
    noteTitle: string;
    folderPath: string;
  }) => void;
  variant?: "icon" | "full";
}

export const SearchButton: React.FC<SearchButtonProps> = ({
  currentFolderPath = "/",
  onResultClick,
  variant = "full",
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  if (variant === "icon") {
    return (
      <>
        <button
          onClick={handleOpen}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
          title="Search notes (Cmd+K)"
        >
          <Search className="h-5 w-5" />
        </button>
        <SearchDialog
          isOpen={isOpen}
          onClose={handleClose}
          currentFolderPath={currentFolderPath}
          onResultClick={onResultClick}
        />
      </>
    );
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-sm text-gray-500 shadow-sm transition-all hover:border-gray-300 hover:shadow"
      >
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4" />
          <span>Search notes...</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Command className="h-3 w-3" />
          <span>K</span>
        </div>
      </button>
      <SearchDialog
        isOpen={isOpen}
        onClose={handleClose}
        currentFolderPath={currentFolderPath}
        onResultClick={onResultClick}
      />
    </>
  );
};

interface RagChatButtonProps {
  onClick?: () => void;
  isActive?: boolean;
}

export const RagChatButton: React.FC<RagChatButtonProps> = ({
  onClick,
  isActive = false,
}) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        isActive
          ? "bg-purple-100 text-purple-700"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
      }`}
      title="Chat with AI about your notes"
    >
      <Sparkles className={`h-4 w-4 ${isActive ? "text-purple-600" : ""}`} />
      <span>AI Chat</span>
    </button>
  );
};