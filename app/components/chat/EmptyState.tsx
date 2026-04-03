"use client";

/**
 * EmptyState - Renders the "Start a conversation" welcome screen.
 * Shown when there are no messages in the current conversation.
 */
export default function EmptyState() {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
      </div>
      <h2>Start a conversation</h2>
      <p>Ask me anything, and I will do my best to help.</p>
    </div>
  );
}
