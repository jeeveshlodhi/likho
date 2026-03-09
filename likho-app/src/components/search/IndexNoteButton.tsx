import React, { useState } from "react";
import { SearchService } from "@/lib/search-service";
import { Database, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface IndexNoteButtonProps {
  noteId: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "icon";
}

export function IndexNoteButton({ 
  noteId, 
  variant = "outline", 
  size = "sm" 
}: IndexNoteButtonProps) {
  const [isIndexing, setIsIndexing] = useState(false);
  const [isIndexed, setIsIndexed] = useState(false);

  const handleIndex = async () => {
    if (isIndexing) return;

    setIsIndexing(true);
    setIsIndexed(false);

    try {
      await SearchService.indexNote(noteId);
      setIsIndexed(true);
      
      // Reset success state after 2 seconds
      setTimeout(() => {
        setIsIndexed(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to index note:", error);
    } finally {
      setIsIndexing(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleIndex}
      disabled={isIndexing}
      className="flex items-center gap-1.5"
    >
      {isIndexing ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="hidden sm:inline">Indexing...</span>
        </>
      ) : isIndexed ? (
        <>
          <Check className="h-4 w-4 text-green-600" />
          <span className="hidden sm:inline text-green-600">Indexed</span>
        </>
      ) : (
        <>
          <Database className="h-4 w-4" />
          <span className="hidden sm:inline">Index for Search</span>
        </>
      )}
    </Button>
  );
}

export default IndexNoteButton;