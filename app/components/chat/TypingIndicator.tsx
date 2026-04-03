"use client";

interface TypingIndicatorProps {
  /** Whether the typing indicator should be visible */
  visible: boolean;
}

/**
 * TypingIndicator - Animated typing dots shown while waiting for AI response.
 */
export default function TypingIndicator({ visible }: TypingIndicatorProps) {
  if (!visible) return null;

  return (
    <div className="message message-assistant typing-indicator">
      <div className="message-avatar">
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
      </div>
      <div className="message-content">
        <div className="message-bubble">
          <div className="typing-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>
  );
}
