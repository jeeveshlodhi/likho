import React, { useState } from "react";
import { SearchService } from "@/lib/search-service";
import { Button } from "@/components/ui/button";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { invoke } from "@tauri-apps/api/core";

export function SearchDiagnostics() {
  const [logs, setLogs] = useState<string[]>([]);
  const notes = useWorkspaceStore((state) => state.notes);

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  const testSearch = async () => {
    addLog("Testing search for 'Grocery'...");
    try {
      const results = await SearchService.searchNotes({
        query: "Grocery",
        folder_path: "/",
        limit: 10,
      });
      addLog(`Search returned ${results.length} results`);
      results.forEach((r, i) => {
        addLog(`  ${i + 1}. ${r.note_title}: ${r.text.substring(0, 50)}...`);
      });
    } catch (error) {
      addLog(`Search failed: ${error}`);
    }
  };

  const checkEmbeddingStatus = async () => {
    addLog("Checking embedding status...");
    try {
      const status = await SearchService.getEmbeddingStatus();
      addLog(`Model loaded: ${status.model_loaded}`);
      addLog(`Model name: ${status.model_name}`);
    } catch (error) {
      addLog(`Failed to get status: ${error}`);
    }
  };

  const syncOneNote = async () => {
    if (notes.length === 0) {
      addLog("No notes to sync");
      return;
    }
    const note = notes[0];
    addLog(`Syncing note: ${note.title || 'Untitled'} (${note.id})`);
    
    try {
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
      addLog("✓ Note synced successfully");
    } catch (error) {
      addLog(`✗ Sync failed: ${error}`);
    }
  };

  const indexOneNote = async () => {
    if (notes.length === 0) {
      addLog("No notes to index");
      return;
    }
    const note = notes[0];
    addLog(`Indexing note: ${note.title || 'Untitled'} (${note.id})`);
    
    try {
      await SearchService.indexNote(note.id);
      addLog("✓ Note indexed successfully");
    } catch (error) {
      addLog(`✗ Index failed: ${error}`);
    }
  };

  const checkDatabase = async () => {
    addLog("Checking database...");
    try {
      // Check notes in database
      const dbNotes = await SearchService.getAllNotes();
      addLog(`Found ${dbNotes.length} notes in database`);
      dbNotes.slice(0, 3).forEach((n) => {
        addLog(`  - ${n.title} (${n.id.substring(0, 8)}...)`);
      });

      // Check chunks
      const chunks = await invoke("get_note_chunks", { noteId: notes[0]?.id });
      addLog(`Note chunks: ${JSON.stringify(chunks).substring(0, 200)}`);
    } catch (error) {
      addLog(`Database check failed: ${error}`);
    }
  };

  const runFullTest = async () => {
    addLog("=== FULL DIAGNOSTIC TEST ===");
    
    // Step 1: Check embedding model
    addLog("Step 1: Checking embedding model...");
    await checkEmbeddingStatus();
    
    // Step 2: Sync a note
    addLog("Step 2: Syncing first note...");
    await syncOneNote();
    
    // Step 3: Check database
    addLog("Step 3: Checking database...");
    await checkDatabase();
    
    // Step 4: Index the note
    addLog("Step 4: Indexing note...");
    await indexOneNote();
    
    // Step 5: Search
    addLog("Step 5: Testing search...");
    await testSearch();
    
    addLog("=== TEST COMPLETE ===");
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="font-semibold mb-2">Search Diagnostics</h3>
      <div className="flex flex-wrap gap-2 mb-4">
        <Button size="sm" onClick={runFullTest} variant="default">Run Full Test</Button>
        <Button size="sm" onClick={testSearch} variant="outline">Test Search</Button>
        <Button size="sm" onClick={syncOneNote} variant="outline">Sync Note</Button>
        <Button size="sm" onClick={indexOneNote} variant="outline">Index Note</Button>
        <Button size="sm" onClick={checkDatabase} variant="outline">Check DB</Button>
        <Button size="sm" onClick={checkEmbeddingStatus} variant="outline">Check Model</Button>
      </div>
      <div className="text-xs font-mono bg-black text-green-400 p-2 rounded h-64 overflow-auto">
        {logs.length === 0 ? (
          <span className="text-gray-500">Click "Run Full Test" to diagnose...</span>
        ) : (
          logs.map((log, i) => (
            <div key={i} className={log.includes('✓') ? 'text-green-400' : log.includes('✗') ? 'text-red-400' : ''}>
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default SearchDiagnostics;