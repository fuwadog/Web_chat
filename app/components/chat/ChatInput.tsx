"use client";

import { RefObject, FormEvent } from "react";

interface ChatInputProps {
  /** Called when the user submits a message */
  onSubmit: (text: string) => void;
  /** Whether the input should be disabled */
  disabled: boolean;
  /** Ref for the input element to enable autofocus */
  inputRef: RefObject<HTMLInputElement | null>;
}

/**
 * ChatInput - Renders the message input field and send button.
 */
export default function ChatInput({
  onSubmit,
  disabled,
  inputRef,
}: ChatInputProps) {
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = e.currentTarget.elements.namedItem(
      "chat-input",
    ) as HTMLInputElement;
    const value = input.value.trim();
    if (value && !disabled) {
      onSubmit(value);
      input.value = "";
    }
  };

  return (
    <footer className="input-container">
      <form onSubmit={handleSubmit} className="input-form">
        <input
          ref={inputRef}
          name="chat-input"
          type="text"
          placeholder="Message Gemini..."
          className="chat-input"
          disabled={disabled}
        />
        <button type="submit" disabled={disabled} className="send-button">
          {disabled ? (
            <svg
              className="spinner"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" opacity="0.25" />
              <path d="M12 2a10 10 0 0110 10" strokeLinecap="round" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          )}
        </button>
      </form>
      <p className="input-footer">
        Gemini can make mistakes. Check important info.
      </p>
    </footer>
  );
}
