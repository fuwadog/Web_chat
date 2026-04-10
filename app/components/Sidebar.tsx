'use client';

import { memo } from "react";
import { Conversation } from "../types/chat";

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

function Sidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  isOpen,
  onToggle,
}: SidebarProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return "Last 7 days";
    if (diffDays < 30) return "Last 30 days";
    return date.toLocaleDateString();
  };

  const groupedConversations = conversations.reduce((groups, conv) => {
    const label = formatDate(conv.updatedAt);
    if (!groups[label]) groups[label] = [];
    groups[label].push(conv);
    return groups;
  }, {} as Record<string, Conversation[]>);

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onToggle} />}
      <aside className={"sidebar" + (isOpen ? " sidebar-open" : "")}>
        <div className="sidebar-header">
          <button onClick={onNewChat} className="new-chat-button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>New Chat</span>
          </button>
          <button onClick={onToggle} className="sidebar-close-button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="sidebar-content">
          {conversations.length === 0 ? (
            <div className="sidebar-empty"><p>No conversations yet</p></div>
          ) : (
            Object.entries(groupedConversations).map(([label, convs]) => (
              <div key={label} className="conversation-group">
                <div className="group-label">{label}</div>
                {convs.map((conv) => (
                  <div key={conv.id} className={"conversation-item" + (conv.id === activeConversationId ? " conversation-active" : "")} onClick={() => onSelectConversation(conv.id)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="conversation-icon"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
                    <span className="conversation-title">{conv.title}</span>
                    <button className="delete-conversation-button" onClick={(e) => { e.stopPropagation(); onDeleteConversation(conv.id); }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  );
}

export default memo(Sidebar);