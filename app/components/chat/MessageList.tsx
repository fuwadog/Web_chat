"use client";

import { memo, RefObject } from "react";
import { Message } from "../../types/chat";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import EmptyState from "./EmptyState";

interface MessageListProps {
  messages: Message[];
  isTyping: boolean;
  messagesEndRef: RefObject<HTMLDivElement | null>;
}

function MessageList({
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
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          <TypingIndicator visible={isTyping} />
          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );
}

export default memo(MessageList);
