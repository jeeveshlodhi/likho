import React, { useState } from "react";
import { SearchService } from "@/lib/search-service";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { Loader2, Database, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function IndexAllNotesButton() {
  const [isIndexing, setIsIndexing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [completed, setCompleted] = useState(false);
  const notes = useWorkspaceStore((state) => state.notes);

  const handleIndexAll = async () => {
    if (isIndexing || notes.length === 0) return;

    console.log(`[IndexAllNotesButton] Starting to sync and index ${notes.length} notes...`);
    setIsIndexing(true);
    setCompleted(false);
    setTotal(notes.length * 2); // Sync + Index phases
    setProgress(0);

    let syncCount = 0;
    let indexCount = 0;
    let errorCount = 0;

    try {
      // Phase 1: Sync all notes to backend database
      console.log("[IndexAllNotesButton] Phase 1: Syncing notes to database...");
      for (let i = 0; i < notes.length; i++) {
        const note = notes[i];
        console.log(`[IndexAllNotesButton] Syncing note ${i + 1}/${notes.length}: ${note.title || 'Untitled'}`);
        
        try {
          // Convert note format for backend
          const noteForBackend = {
            id: note.id,
            title: note.title || 'Untitled',
            content:
              note.content == null
                ? ''
                : typeof note.content === 'string'
                ? note.content
                : JSON.stringify(note.content),
            folder_id: note.folderId || '',
            created_at: note.createdAt,
            updated_at: note.updatedAt,
          };
          
          await SearchService.syncNote(noteForBackend);
          syncCount++;
          console.log(`[IndexAllNotesButton] ✓ Synced: ${note.title || 'Untitled'}`);
        } catch (error) {
          errorCount++;
          console.error(`[IndexAllNotesButton] ✗ Failed to sync: ${note.title || 'Untitled'}`, error);
        }
        
        setProgress(i + 1);
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      // Phase 2: Index all notes
      console.log("[IndexAllNotesButton] Phase 2: Indexing notes for search...");
      for (let i = 0; i < notes.length; i++) {
        const note = notes[i];
        console.log(`[IndexAllNotesButton] Indexing note ${i + 1}/${notes.length}: ${note.title || 'Untitled'}`);
        
        try {
          await SearchService.indexNote(note.id);
          indexCount++;
          console.log(`[IndexAllNotesButton] ✓ Indexed: ${note.title || 'Untitled'}`);
        } catch (error) {
          errorCount++;
          console.error(`[IndexAllNotesButton] ✗ Failed to index: ${note.title || 'Untitled'}`, error);
        }
        
        setProgress(notes.length + i + 1);
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      
      console.log(`[IndexAllNotesButton] Completed: ${syncCount} synced, ${indexCount} indexed, ${errorCount} errors`);
      setCompleted(true);
    } catch (error) {
      console.error("[IndexAllNotesButton] Fatal error:", error);
    } finally {
      setIsIndexing(false);
    }
  };

  if (completed) {
    return (
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle className="h-4 w-4" />
        <span className="text-sm">Indexed {total} notes</span>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleIndexAll}
      disabled={isIndexing || notes.length === 0}
      className="flex items-center gap-2"
    >
      {isIndexing ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>
            Indexing {progress}/{total}...
          </span>
        </>
      ) : (
        <>
          <Database className="h-4 w-4" />
          <span>Index All Notes ({notes.length})</span>
        </>
      )}
    </Button>
  );
}

export default IndexAllNotesButton;