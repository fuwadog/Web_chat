"use client";

import { Conversation } from "../types/chat";

interface CollapsibleHistoryProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNewChat: () => void;
  onDeleteAll: () => void;
  expanded: boolean;
  onToggle: () => void;
}

export default function CollapsibleHistory({
  conversations,
  activeConversationId,
  onSelect,
  onDelete,
  onNewChat,
  onDeleteAll,
  expanded,
  onToggle,
}: CollapsibleHistoryProps) {
  return (
    <div
      className={`collapsible-history ${expanded ? "expanded" : "collapsed"}`}
    >
      {!expanded && (
        <button
          className="history-collapse-btn"
          onClick={onToggle}
          title="Expand history"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              d="M9 18l6-6-6-6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}

      {expanded && (
        <>
          <div className="history-header">
            <div className="history-header-left">
              <svg
                className="history-header-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <path
                  d="M12 6v6l4 2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <h3>History</h3>
            </div>
            <button
              className="history-close-btn"
              onClick={onToggle}
              title="Collapse history"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  d="M15 18l-6-6 6-6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          <button className="history-new-chat-btn" onClick={onNewChat}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                d="M12 5v14M5 12h14"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>New Chat</span>
          </button>

          {conversations.length > 0 && (
            <button className="history-delete-all-btn" onClick={onDeleteAll}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Delete All</span>
            </button>
          )}

          <div className="history-list">
            {conversations.length === 0 ? (
              <p className="history-empty">No conversations yet</p>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`history-item ${conv.id === activeConversationId ? "active" : ""}`}
                  onClick={() => onSelect(conv.id)}
                >
                  <svg
                    className="history-item-icon"
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
                  <span className="history-item-title" title={conv.title}>
                    {conv.title}
                  </span>
                  <button
                    className="history-item-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(conv.id);
                    }}
                    title="Delete"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
