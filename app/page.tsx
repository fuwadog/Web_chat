"use client";

import { useState, useRef, useEffect } from "react";
import "./globals.css";
import Sidebar from "./components/Sidebar";
import SettingsModal from "./components/SettingsModal";
import {
  Message,
  Conversation,
  AppSettings,
  DEFAULT_SETTINGS,
} from "./types/chat";
import {
  getConversations,
  saveConversations,
  createConversation,
  generateConversationTitle,
  getActiveConversationId,
  getSettings,
  saveSettings,
  getSessionApiKey,
  setSessionApiKey,
} from "./lib/storage";

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationIdState] = useState<
    string | null
  >(null);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [apiKey, setApiKey] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load data on mount
  useEffect(() => {
    const savedSettings = getSettings();
    setSettings(savedSettings);
    setApiKey(getSessionApiKey());
    const savedConvs = getConversations();
    setConversations(savedConvs);
    const activeId = getActiveConversationId();
    if (activeId && savedConvs.find((c) => c.id === activeId)) {
      setActiveConversationIdState(activeId);
      const active = savedConvs.find((c) => c.id === activeId);
      if (active) setMessages(active.messages);
    } else if (savedConvs.length > 0) {
      setActiveConversationIdState(savedConvs[0].id);
      setMessages(savedConvs[0].messages);
    }
  }, []);

  // Save conversations when messages change
  useEffect(() => {
    if (!activeConversationId) return;
    if (messages.length === 0) return;
    setConversations((prevConvs) => {
      const updatedConvs = prevConvs.map((c) => {
        if (c.id !== activeConversationId) return c;
        const newTitle =
          c.title === "New Chat" &&
          messages.length > 0 &&
          messages[0].role === "user"
            ? generateConversationTitle(messages[0].content)
            : c.title;
        return {
          ...c,
          title: newTitle,
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
            timestamp: m.timestamp,
          })),
          updatedAt: new Date().toISOString(),
        };
      });
      saveConversations(updatedConvs);
      return updatedConvs;
    });
  }, [messages, activeConversationId]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Apply dark mode based on settings
  useEffect(() => {
    if (settings.darkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }, [settings.darkMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    if (!activeConversationId) {
      const newConv = createConversation();
      setConversations((prev) => [newConv, ...prev]);
      setActiveConversationIdState(newConv.id);
      setMessages([]);
    }

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setIsTyping(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input.trim(),
          apiKey,
          model: settings.model,
          temperature: settings.temperature,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to get response");
      }

      const data = await response.json();

      if (data.model && settings.model === "auto" && data.model !== "auto") {
        const newSettings = { ...settings, model: data.model };
        setSettings(newSettings);
        saveSettings(newSettings);
      }

      setTimeout(() => {
        setIsTyping(false);
        const assistantMessage: Message = {
          role: "assistant",
          content: data.response,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }, 500);
    } catch (error) {
      setIsTyping(false);
      const errorMessage: Message = {
        role: "assistant",
        content: error instanceof Error ? error.message : "An error occurred",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = () => {
    const newSettings = { ...settings, darkMode: !settings.darkMode };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const clearChat = () => {
    if (messages.length > 0 && confirm("Clear all messages?")) {
      setMessages([]);
    }
  };

  const handleNewChat = () => {
    if (messages.length > 0 && activeConversationId) {
      const updatedConvs = conversations.map((c) => {
        if (c.id !== activeConversationId) return c;
        return {
          ...c,
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
            timestamp: m.timestamp,
          })),
          updatedAt: new Date().toISOString(),
        };
      });
      saveConversations(updatedConvs);
    }
    const newConv = createConversation();
    setConversations((prev) => [newConv, ...prev]);
    setSidebarOpen(false);
    setActiveConversationIdState(newConv.id);
    setMessages([]);
  };

  const handleSelectConversation = (id: string) => {
    const conv = conversations.find((c) => c.id === id);
    if (!conv) return;
    if (activeConversationId && messages.length > 0) {
      const updatedConvs = conversations.map((c) => {
        if (c.id !== activeConversationId) return c;
        return {
          ...c,
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
            timestamp: m.timestamp,
          })),
          updatedAt: new Date().toISOString(),
        };
      });
      saveConversations(updatedConvs);
      setConversations(updatedConvs);
    }
    setActiveConversationIdState(id);
    setMessages(conv.messages);
    setSidebarOpen(false);
  };

  const handleDeleteConversation = (id: string) => {
    if (!confirm("Delete this conversation?")) return;
    const newConvs = conversations.filter((c) => c.id !== id);
    setConversations(newConvs);
    saveConversations(newConvs);
    if (activeConversationId === id) {
      if (newConvs.length > 0) {
        setActiveConversationIdState(newConvs[0].id);
        setMessages(newConvs[0].messages);
      } else {
        setActiveConversationIdState(null);
        setMessages([]);
      }
    }
  };

  const handleSettingsSave = (newSettings: AppSettings, newApiKey: string) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    setApiKey(newApiKey);
    setSessionApiKey(newApiKey);
  };

  return (
    <div className="chat-container">
      <header className="chat-header">
        <div className="header-content">
          <div className="header-left">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="icon-button sidebar-toggle"
              title="Open sidebar"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            </button>
            <div className="gemini-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2L2 7L12 12L22 7L12 2Z"
                  fill="currentColor"
                  fillOpacity="0.8"
                />
                <path
                  d="M2 17L12 22L22 17"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M2 12L12 17L22 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div>
              <h1 className="header-title">Gemini Chat</h1>
              <p className="header-subtitle">Powered by Google AI</p>
            </div>
          </div>
          <div className="header-actions">
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                className="icon-button clear-button"
                title="Clear chat"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" />
                </svg>
              </button>
            )}
            <button
              onClick={toggleTheme}
              className="icon-button theme-toggle"
              title={settings.darkMode ? "Light mode" : "Dark mode"}
            >
              {settings.darkMode ? (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                </svg>
              )}
            </button>
            <button
              onClick={() => setSettingsModalOpen(true)}
              className="icon-button"
              title="Settings"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="messages-container">
        {messages.length === 0 ? (
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
        ) : (
          <div className="messages-list">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={"message message-" + msg.role}
                style={{ animationDelay: index * 0.05 + "s" }}
              >
                <div className="message-avatar">
                  {msg.role === "user" ? (
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
                  <div className="message-header">
                    <span className="message-role">
                      {msg.role === "user" ? "You" : "Gemini"}
                    </span>
                    <span className="message-time">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="message-text">{msg.content}</div>
                </div>
              </div>
            ))}
            {isTyping && (
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
                  <div className="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      <footer className="input-container">
        <form onSubmit={handleSubmit} className="input-form">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message Gemini..."
            className="chat-input"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="send-button"
          >
            {loading ? (
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
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <SettingsModal
        key={settingsModalOpen ? "open" : "closed"}
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        settings={settings}
        apiKey={apiKey}
        onSave={handleSettingsSave}
      />
    </div>
  );
}
