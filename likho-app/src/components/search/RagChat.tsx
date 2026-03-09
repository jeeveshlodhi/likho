import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, Loader2, BookOpen } from "lucide-react";
import { useRag } from "../../hooks/useSearch";
import { SearchResult } from "../../types/search";

interface RagChatProps {
  currentFolderPath?: string;
}

interface Message {
  id: string;
  type: "user" | "assistant" | "system";
  content: string;
  sources?: SearchResult[];
  processingTimeMs?: number;
}

export const RagChat: React.FC<RagChatProps> = ({
  currentFolderPath = "/",
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      type: "system",
      content:
        "Hello! I'm your local AI assistant. Ask me anything about your notes, and I'll search through them to find relevant information.",
    },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { response, isLoading, error, query, clearResponse } = useRag();

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle RAG response
  useEffect(() => {
    if (response) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: "assistant",
          content: response.answer,
          sources: response.sources,
          processingTimeMs: response.processing_time_ms,
        },
      ]);
      clearResponse();
    }
  }, [response, clearResponse]);

  // Handle error
  useEffect(() => {
    if (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: "system",
          content: `Error: ${error}`,
        },
      ]);
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");

    // Add user message
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        type: "user",
        content: userMessage,
      },
    ]);

    // Execute RAG query
    await query(userMessage, currentFolderPath);
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          <h2 className="font-semibold text-gray-900">AI Chat</h2>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="h-2 w-2 rounded-full bg-green-500"></span>
          Local AI
          <span className="text-gray-300">|</span>
          {currentFolderPath}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.type === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {message.type !== "user" && (
              <div className="flex-shrink-0">
                {message.type === "assistant" ? (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                    <Bot className="h-4 w-4 text-purple-600" />
                  </div>
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                    <Sparkles className="h-4 w-4 text-gray-600" />
                  </div>
                )}
              </div>
            )}

            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.type === "user"
                  ? "bg-blue-500 text-white"
                  : message.type === "assistant"
                  ? "bg-gray-100 text-gray-900"
                  : "bg-purple-50 text-gray-700 border border-purple-100"
              }`}
            >
              <div className="whitespace-pre-wrap text-sm">{message.content}</div>

              {/* Sources */}
              {message.sources && message.sources.length > 0 && (
                <div className="mt-3 border-t border-gray-200 pt-2">
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                    <BookOpen className="h-3 w-3" />
                    Sources:
                  </div>
                  <div className="space-y-1">
                    {message.sources.map((source, idx) => (
                      <div
                        key={source.chunk_id}
                        className="text-xs text-gray-600 bg-white rounded px-2 py-1"
                      >
                        <span className="font-medium">
                          [{idx + 1}] {source.note_title}
                        </span>
                        <span className="text-gray-400">
                          {" "}
                          ({source.folder_path})
                        </span>
                      </div>
                    ))}
                  </div>                </div>
              )}

              {/* Processing time */}
              {message.processingTimeMs && (
                <div className="mt-1 text-right text-xs text-gray-400">
                  {formatTime(message.processingTimeMs)}
                </div>
              )}
            </div>

            {message.type === "user" && (
              <div className="flex-shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
              <Bot className="h-4 w-4 text-purple-600" />
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2">
              <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
              <span className="text-sm text-gray-500">Searching your notes...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 px-4 py-3">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your notes..."
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="flex items-center gap-1 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Send</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};