"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import MessageList from "./chat/MessageList";
import ChatInput from "./chat/ChatInput";
import { Message } from "../types/chat";

interface DualChatViewProps {
  apiKey: string;
  model: string;
  temperature: number;
}

interface ChatSession {
  messages: Message[];
  isTyping: boolean;
  loading: boolean;
}

export default function DualChatView({
  apiKey,
  model,
  temperature,
}: DualChatViewProps) {
  const [chat1, setChat1] = useState<ChatSession>({
    messages: [],
    isTyping: false,
    loading: false,
  });
  const [chat2, setChat2] = useState<ChatSession>({
    messages: [],
    isTyping: false,
    loading: false,
  });
  const chat1EndRef = useRef<HTMLDivElement>(null);
  const chat2EndRef = useRef<HTMLDivElement>(null);
  const chat1InputRef = useRef<HTMLInputElement>(null);
  const chat2InputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chat1EndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat1.messages, chat1.isTyping]);

  useEffect(() => {
    chat2EndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat2.messages, chat2.isTyping]);

  const sendMessage = useCallback(
    async (text: string, chatNum: 1 | 2) => {
      const setChat = chatNum === 1 ? setChat1 : setChat2;
      const userMessage: Message = {
        role: "user",
        content: text.trim(),
        timestamp: new Date().toISOString(),
      };

      setChat((prev) => ({
        ...prev,
        messages: [...prev.messages, userMessage],
        loading: true,
        isTyping: true,
      }));

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text.trim(),
            apiKey,
            model,
            temperature,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to get response");
        }

        if (!response.body) {
          throw new Error("Empty response body");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let parsedData: { response?: string; model?: string; rateLimit?: boolean } | null = null;

        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith("data: ")) {
                const jsonStr = trimmed.slice(6).trim();
                if (jsonStr === "[DONE]") continue;
                try {
                  parsedData = JSON.parse(jsonStr);
                } catch {
                  console.error("Failed to parse SSE JSON:", jsonStr);
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }

        if (!parsedData?.response) {
          throw new Error("No valid response data received");
        }

        setTimeout(() => {
          setChat((prev) => ({
            ...prev,
            isTyping: false,
            loading: false,
            messages: [
              ...prev.messages,
              {
                role: "assistant",
                content: parsedData!.response!,
                timestamp: new Date().toISOString(),
              },
            ],
          }));
        }, 500);
      } catch (error) {
        setChat((prev) => ({
          ...prev,
          isTyping: false,
          loading: false,
          messages: [
            ...prev.messages,
            {
              role: "assistant",
              content:
                error instanceof Error ? error.message : "An error occurred",
              timestamp: new Date().toISOString(),
            },
          ],
        }));
      }
    },
    [apiKey, model, temperature],
  );

  const handleChat1Submit = useCallback(
    (text: string) => sendMessage(text, 1),
    [sendMessage],
  );

  const handleChat2Submit = useCallback(
    (text: string) => sendMessage(text, 2),
    [sendMessage],
  );

  return (
    <div className="dual-chat-view">
      <div className="dual-chat-header">
        <svg
          className="dual-chat-header-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8 11h.01M12 11h.01M16 11h.01"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <h3>Parallel Agents</h3>
      </div>

      <div className="dual-chat-panels">
        <div className="dual-chat-panel">
          <div className="dual-chat-panel-header">
            <div className="dual-chat-panel-title">Agent A</div>
            <div className="dual-chat-panel-badge primary">Primary</div>
          </div>
          <div className="dual-chat-messages">
            {chat1.messages.length === 0 ? (
              <div className="dual-chat-empty">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Start chatting...</span>
              </div>
            ) : (
              <MessageList
                messages={chat1.messages}
                isTyping={chat1.isTyping}
                messagesEndRef={chat1EndRef}
              />
            )}
          </div>
          <div className="dual-chat-input-wrapper">
            <ChatInput
              onSubmit={handleChat1Submit}
              disabled={chat1.loading}
              inputRef={chat1InputRef}
            />
          </div>
        </div>

        <div className="dual-chat-divider">
          <div className="dual-chat-divider-line" />
          <span className="dual-chat-divider-text">VS</span>
          <div className="dual-chat-divider-line" />
        </div>

        <div className="dual-chat-panel">
          <div className="dual-chat-panel-header">
            <div className="dual-chat-panel-title">Agent B</div>
            <div className="dual-chat-panel-badge secondary">Secondary</div>
          </div>
          <div className="dual-chat-messages">
            {chat2.messages.length === 0 ? (
              <div className="dual-chat-empty">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Start chatting...</span>
              </div>
            ) : (
              <MessageList
                messages={chat2.messages}
                isTyping={chat2.isTyping}
                messagesEndRef={chat2EndRef}
              />
            )}
          </div>
          <div className="dual-chat-input-wrapper">
            <ChatInput
              onSubmit={handleChat2Submit}
              disabled={chat2.loading}
              inputRef={chat2InputRef}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
