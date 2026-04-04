"use client";

import { Message } from "../../types/chat";

interface MessageBubbleProps {
  message: Message;
  index: number;
}

/**
 * MessageBubble - Renders a single message bubble with avatar, role, timestamp, and text.
 */
export default function MessageBubble({ message, index }: MessageBubbleProps) {
  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={`message message-${message.role}`}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="message-avatar">
        {message.role === "user" ? (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2L2 7L12 12L22 7L12 2Z"
              fill="currentColor"
              fillOpacity="0.9"
            />
            <path
              d="M2 17L12 22L22 17M2 12L12 17L22 12"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        )}
      </div>
      <div className="message-content">
        <div className={`message-bubble ${message.isError ? "message-error" : ""}`}>
          <div className="message-header">
            <span className="message-role">
              {message.role === "user" ? "You" : "Gemini"}
            </span>
            {message.isError && <span className="message-error-badge">Error</span>}
            <span className="message-time">{formattedTime}</span>
          </div>
          <div className="message-text">{message.content}</div>
        </div>
      </div>
    </div>
  );
}
