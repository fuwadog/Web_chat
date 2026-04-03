"use client";

import { RefObject } from "react";
import { Message } from "../../types/chat";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import EmptyState from "./EmptyState";

interface MessageListProps {
  messages: Message[];
  isTyping: boolean;
  messagesEndRef: RefObject<HTMLDivElement | null>;
}

/**
 * MessageList - Renders the messages container with scroll ref.
 * Shows EmptyState when no messages, otherwise renders message bubbles + typing indicator.
 */
export default function MessageList({
  messages,
  isTyping,
  messagesEndRef,
}: MessageListProps) {
  return (
    <div className="messages-list">
      {messages.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {messages.map((msg, index) => (
            <MessageBubble key={index} message={msg} index={index} />
          ))}
          <TypingIndicator visible={isTyping} />
          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );
}
