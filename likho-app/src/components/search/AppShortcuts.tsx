import { useState } from "react";
import { useNavigate } from "react-router";
import { X } from "lucide-react";
import { useKeyboardShortcut } from "@/hooks/useKeyboardShortcut";
import { SearchDialog } from "@/components/search/SearchDialog";
import { RagChat } from "@/components/search/RagChat";
import { LlmSettingsDialog } from "@/components/search/LlmSettingsDialog";
import { ShortcutsHelp } from "@/components/search/ShortcutsHelp";
import { useTempNotesStore } from "@/store/tempNotesStore";
import { useAiChatStore } from "@/store/aiChatStore";
import { AiChat } from "@/pages/dashboard/AiChat";

export function AppShortcuts() {
  const navigate = useNavigate();
  const [showSearch, setShowSearch] = useState(false);
  const [showRagChat, setShowRagChat] = useState(false);
  const [showLlmSettings, setShowLlmSettings] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const { setQuickCaptureOpen } = useTempNotesStore();
  const { panelOpen, togglePanel, setPanelOpen } = useAiChatStore();

  // ── Shortcuts ────────────────────────────────────────────────────────────────

  // Cmd+K - Search
  useKeyboardShortcut(
    () => setShowSearch(true),
    { key: "k", meta: true }
  );

  // Cmd+J - Toggle AI panel (primary AI shortcut)
  useKeyboardShortcut(
    () => togglePanel(),
    { key: "j", meta: true }
  );

  // Cmd+Shift+A - AI Chat (legacy, opens panel)
  useKeyboardShortcut(
    () => { setShowRagChat(true); },
    { key: "a", meta: true, shift: true }
  );

  // Cmd+Shift+L - LLM Settings
  useKeyboardShortcut(
    () => setShowLlmSettings(true),
    { key: "l", meta: true, shift: true }
  );

  // Shift+? - Shortcuts Help
  useKeyboardShortcut(
    () => setShowShortcutsHelp(true),
    { key: "?", shift: true }
  );

  // Cmd+Shift+G - Graph View
  useKeyboardShortcut(
    () => navigate("/dashboard/graph"),
    { key: "g", meta: true, shift: true }
  );

  // Cmd+Shift+T - Tags
  useKeyboardShortcut(
    () => navigate("/dashboard/tags"),
    { key: "t", meta: true, shift: true }
  );

  // Cmd+Shift+S - Settings
  useKeyboardShortcut(
    () => navigate("/dashboard/settings"),
    { key: "s", meta: true, shift: true }
  );

  // Cmd+Shift+N - Quick capture temp note
  useKeyboardShortcut(
    () => setQuickCaptureOpen(true),
    { key: "n", meta: true, shift: true }
  );

  // Escape - close AI panel
  useKeyboardShortcut(
    () => { if (panelOpen) setPanelOpen(false); },
    { key: "Escape", preventDefault: false }
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

      {/* Legacy RAG Chat Panel (Cmd+Shift+A) */}
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

      {/* ── AI Panel (Cmd+J) ── */}
      {panelOpen && (
        <>
          {/* Backdrop (click to close) */}
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
            onClick={() => setPanelOpen(false)}
          />

          {/* Panel */}
          <div className="fixed inset-y-0 right-0 z-50 flex w-[420px] flex-col border-l border-border bg-background shadow-2xl">
            {/* Panel header */}
            <div className="flex items-center justify-between shrink-0 border-b border-border px-3 py-2">
              <span className="text-xs font-medium text-muted-foreground">AI Assistant</span>
              <button
                onClick={() => setPanelOpen(false)}
                className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                title="Close (Esc)"
              >
                <X size={15} />
              </button>
            </div>

            {/* Chat fills the rest */}
            <div className="flex-1 min-h-0">
              <AiChat compact />
            </div>
          </div>
        </>
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
