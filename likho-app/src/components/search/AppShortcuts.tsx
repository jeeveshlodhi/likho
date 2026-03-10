import { useState } from "react";
import { useNavigate } from "react-router";
import { useKeyboardShortcut } from "@/hooks/useKeyboardShortcut";
import { SearchDialog } from "@/components/search/SearchDialog";
import { RagChat } from "@/components/search/RagChat";
import { LlmSettingsDialog } from "@/components/search/LlmSettingsDialog";
import { ShortcutsHelp } from "@/components/search/ShortcutsHelp";
import { useTempNotesStore } from "@/store/tempNotesStore";

export function AppShortcuts() {
  const navigate = useNavigate();
  const [showSearch, setShowSearch] = useState(false);
  const [showRagChat, setShowRagChat] = useState(false);
  const [showLlmSettings, setShowLlmSettings] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const { setQuickCaptureOpen } = useTempNotesStore();

  // Cmd+K - Search
  useKeyboardShortcut(
    () => {
      console.log("Cmd+K: Opening search");
      setShowSearch(true);
    },
    { key: "k", meta: true }
  );

  // Cmd+Shift+A - AI Chat
  useKeyboardShortcut(
    () => {
      console.log("Cmd+Shift+A: Opening AI chat");
      setShowRagChat(true);
    },
    { key: "a", meta: true, shift: true }
  );

  // Cmd+Shift+L - LLM Settings
  useKeyboardShortcut(
    () => {
      console.log("Cmd+Shift+L: Opening LLM settings");
      setShowLlmSettings(true);
    },
    { key: "l", meta: true, shift: true }
  );

  // Shift+? - Shortcuts Help
  useKeyboardShortcut(
    () => {
      console.log("Shift+?: Opening shortcuts help");
      setShowShortcutsHelp(true);
    },
    { key: "?", shift: true }
  );

  // Cmd+Shift+G - Graph View
  useKeyboardShortcut(
    () => {
      console.log("Cmd+Shift+G: Navigating to graph view");
      navigate("/dashboard/graph");
    },
    { key: "g", meta: true, shift: true }
  );

  // Cmd+Shift+T - Tags
  useKeyboardShortcut(
    () => {
      console.log("Cmd+Shift+T: Navigating to tags");
      navigate("/dashboard/tags");
    },
    { key: "t", meta: true, shift: true }
  );

  // Cmd+Shift+S - Settings
  useKeyboardShortcut(
    () => {
      console.log("Cmd+Shift+S: Navigating to settings");
      navigate("/dashboard/settings");
    },
    { key: "s", meta: true, shift: true }
  );

  // Cmd+Shift+N - Quick capture temp note
  useKeyboardShortcut(
    () => {
      console.log("Cmd+Shift+N: Opening quick capture");
      setQuickCaptureOpen(true);
    },
    { key: "n", meta: true, shift: true }
  );

  return (
    <>
      {/* Search Dialog */}
      <SearchDialog
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        currentFolderPath="/"
        onResultClick={(result) => {
          navigate(`/dashboard/note/${result.noteId}`);
          setShowSearch(false);
        }}
      />

      {/* RAG Chat Panel */}
      {showRagChat && (
        <div className="fixed inset-y-0 right-0 z-40 w-[400px] border-l bg-white shadow-xl">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="font-semibold">AI Chat</h2>
              <button
                onClick={() => setShowRagChat(false)}
                className="rounded-md p-1.5 hover:bg-gray-100"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <RagChat currentFolderPath="/" />
            </div>
          </div>
        </div>
      )}

      {/* LLM Settings Dialog */}
      <LlmSettingsDialog
        isOpen={showLlmSettings}
        onClose={() => setShowLlmSettings(false)}
      />

      {/* Shortcuts Help */}
      {showShortcutsHelp && (
        <ShortcutsHelp />
      )}
    </>
  );
}

export default AppShortcuts;