import { useState, useRef, useEffect } from "react";
import { createReactBlockSpec } from "@blocknote/react";
import { defaultProps, createBlockConfig } from "@blocknote/core";
import { Sparkles, Send, Loader2, Check, X, RotateCcw } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";

// Stop ProseMirror/BlockNote from capturing events inside this block
const stop = (e: React.SyntheticEvent) => e.stopPropagation();

// Block config — matches WikilinkBlock / TagBlock pattern
export const CreateAskAIBlockConfig = createBlockConfig(() => ({
  type: "askAi" as const,
  propSchema: {
    textAlignment: defaultProps.textAlignment,
    textColor: defaultProps.textColor,
    query: { default: "" as const },
    response: { default: "" as const },
    status: { default: "idle" as const },
  },
  content: "none" as const,
}));

// Named React component so hooks have a stable identity across re-renders
function AskAIBlockRender({ block, editor }: { block: any; editor: any }) {
  const [inputValue, setInputValue] = useState(block.props.query || "");
  const [loading, setLoading] = useState(false);
  const [localResponse, setLocalResponse] = useState(block.props.response || "");
  const [localStatus, setLocalStatus] = useState<"idle" | "answered" | "error">(
    (block.props.status as "idle" | "answered" | "error") || "idle"
  );
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (localStatus === "idle") {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [localStatus]);

  const ask = async () => {
    if (!inputValue.trim() || loading) return;
    setLoading(true);
    setLocalStatus("idle");
    setLocalResponse("");
    try {
      const result = await invoke<{ answer: string; sources: any[] }>("rag_query", {
        query: inputValue.trim(),
        folderPath: "/",
        topK: 5,
      });
      const answer = result.answer || "No answer generated.";
      setLocalResponse(answer);
      setLocalStatus("answered");
      // Defer ProseMirror transaction out of the current React event cycle
      setTimeout(() => {
        editor.updateBlock(block, {
          props: { query: inputValue.trim(), response: answer, status: "answered" },
        });
      }, 0);
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      setLocalResponse(msg);
      setLocalStatus("error");
      setTimeout(() => {
        editor.updateBlock(block, {
          props: { query: inputValue.trim(), response: msg, status: "error" },
        });
      }, 0);
    } finally {
      setLoading(false);
    }
  };

  const insertAndClose = () => {
    if (!localResponse) return;
    const lines = localResponse.split("\n").filter((l: string) => l.trim());
    const newBlocks = lines.map((line: string) => ({
      type: "paragraph" as const,
      content: [{ type: "text" as const, text: line, styles: {} }],
    }));
    // Defer to avoid ProseMirror t2.node race condition
    setTimeout(() => {
      editor.insertBlocks(newBlocks, block, "after");
      editor.removeBlocks([block]);
    }, 0);
  };

  const dismiss = () => {
    setTimeout(() => editor.removeBlocks([block]), 0);
  };

  const reset = () => {
    setLocalStatus("idle");
    setLocalResponse("");
    setInputValue("");
    setTimeout(() => {
      editor.updateBlock(block, { props: { query: "", response: "", status: "idle" } });
    }, 0);
  };

  return (
    <div
      className="my-2 rounded-lg border border-primary/30 bg-primary/5 overflow-hidden select-text"
      onMouseDown={stop}
      onClick={stop}
      onKeyDown={stop}
      onKeyUp={stop}
      onKeyPress={stop}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-primary/20 bg-primary/10">
        <Sparkles size={14} className="text-primary shrink-0" />
        <span className="text-xs font-medium text-primary">Ask AI</span>
        <button
          onMouseDown={stop}
          onClick={(e) => { stop(e); dismiss(); }}
          className="ml-auto text-muted-foreground hover:text-foreground transition-colors"
          title="Dismiss"
        >
          <X size={13} />
        </button>
      </div>

      {/* Input area (only shown when idle and not loading) */}
      {localStatus === "idle" && !loading && (
        <div className="flex items-end gap-2 p-2">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                ask();
              }
            }}
            onMouseDown={stop}
            onClick={stop}
            placeholder="Ask anything about your notes… (Enter to send)"
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none leading-relaxed"
            style={{ minHeight: "1.5rem", maxHeight: "6rem", overflowY: "auto" }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = Math.min(el.scrollHeight, 96) + "px";
            }}
          />
          <button
            onMouseDown={stop}
            onClick={(e) => { stop(e); ask(); }}
            disabled={!inputValue.trim() || loading}
            className="shrink-0 rounded-md p-1.5 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors"
            title="Send (Enter)"
          >
            <Send size={14} />
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
          <Loader2 size={12} className="animate-spin" />
          Thinking…
        </div>
      )}

      {/* Response area */}
      {!loading && localStatus !== "idle" && (
        <div className="px-3 py-2 space-y-2">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">Q:</span> {inputValue || block.props.query}
          </p>
          <div
            className={`text-sm leading-relaxed whitespace-pre-wrap ${
              localStatus === "error" ? "text-destructive" : "text-foreground"
            }`}
          >
            {localResponse}
          </div>
          <div className="flex items-center gap-1.5 pt-1 border-t border-primary/10">
            {localStatus === "answered" && (
              <button
                onMouseDown={stop}
                onClick={(e) => { stop(e); insertAndClose(); }}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Check size={11} /> Insert
              </button>
            )}
            <button
              onMouseDown={stop}
              onClick={(e) => { stop(e); reset(); }}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <RotateCcw size={11} /> Ask again
            </button>
            <button
              onMouseDown={stop}
              onClick={(e) => { stop(e); dismiss(); }}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors ml-auto"
            >
              <X size={11} /> Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Export as block spec — same pattern as WikilinkBlock / TagBlock
export const AskAIBlock = createReactBlockSpec(CreateAskAIBlockConfig, {
  render: (props) => <AskAIBlockRender {...props} />,
});
