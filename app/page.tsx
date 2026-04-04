"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import "./globals.css";
import SplashLogo from "./components/SplashLogo";
import SettingsModal from "./components/SettingsModal";
import MessageList from "./components/chat/MessageList";
import ChatInput from "./components/chat/ChatInput";
import CollapsibleHistory from "./components/CollapsibleHistory";
import StatsPanel from "./components/StatsPanel";
import ModelBar from "./components/ModelBar";
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
  clearSessionApiKey,
  updateLastActive,
  checkSessionExpiry,
  clearSessionData,
} from "./lib/storage";

const API_KEY_STORAGE_KEY = "gemini_api_key";

export default function ChatPage() {
  const [showSplash, setShowSplash] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationIdState] = useState<
    string | null
  >(null);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [apiKey, setApiKey] = useState("");
  const [historyExpanded, setHistoryExpanded] = useState(true);
  const [sessionStart] = useState<string>(() => new Date().toISOString());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSplashComplete = useCallback(() => {
    sessionStorage.setItem("splash_shown", "true");
    setShowSplash(false);
  }, []);

  // Check sessionStorage on mount to determine if splash should show
  useEffect(() => {
    if (!sessionStorage.getItem("splash_shown")) {
      setShowSplash(true);
    }
  }, []);

  // Session expiry check: clear API key if inactive for too long
  useEffect(() => {
    if (checkSessionExpiry()) {
      clearSessionData();
      setApiKey("");
    }
    // Always update activity on mount
    updateLastActive();
  }, []);

  // Clear API key on tab/window close
  useEffect(() => {
    const handleBeforeUnload = () => {
      clearSessionApiKey();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      clearSessionApiKey();
    };
  }, []);

  // Check and clear leftover API key on mount
  useEffect(() => {
    const leftoverKey = sessionStorage.getItem(API_KEY_STORAGE_KEY);
    if (leftoverKey) {
      sessionStorage.removeItem(API_KEY_STORAGE_KEY);
      clearSessionApiKey();
    }
    setApiKey("");
  }, []);

  // Load data on mount
  useEffect(() => {
    const savedSettings = getSettings();
    setSettings(savedSettings);
    const sessionKey = getSessionApiKey();
    if (sessionKey) setApiKey(sessionKey);
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
    if (!activeConversationId || messages.length === 0) return;
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
    document.body.classList.toggle("dark-mode", settings.darkMode);
  }, [settings.darkMode]);

  // Clear API key on tab close
  useEffect(() => {
    const close = () => {
      sessionStorage.removeItem(API_KEY_STORAGE_KEY);
      clearSessionApiKey();
    };
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") close();
    });
    window.addEventListener("pagehide", close);
    return () => {
      document.removeEventListener("visibilitychange", close);
      window.removeEventListener("pagehide", close);
    };
  }, []);

  const saveApiKey = useCallback((key: string) => {
    sessionStorage.setItem(API_KEY_STORAGE_KEY, key);
    setSessionApiKey(key);
    setApiKey(key);
  }, []);

  const removeApiKey = useCallback(() => {
    sessionStorage.removeItem(API_KEY_STORAGE_KEY);
    clearSessionApiKey();
    setApiKey("");
  }, []);

  // Update last active timestamp on user interaction
  const handleUserActivity = useCallback(() => {
    updateLastActive();
  }, []);

  const handleSubmit = useCallback(
    async (text: string) => {
      handleUserActivity();
      if (loading) return;

      if (!activeConversationId) {
        const newConv = createConversation();
        setConversations((prev) => [newConv, ...prev]);
        setActiveConversationIdState(newConv.id);
        setMessages([]);
      }

      const userMessage: Message = {
        role: "user",
        content: text.trim(),
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setLoading(true);
      setIsTyping(true);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text.trim(),
            apiKey,
            model: settings.model,
            temperature: settings.temperature,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          const errorCode = data.code || "UNKNOWN_ERROR";
          const errorMessage = data.error || "An error occurred";

          setIsTyping(false);
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: errorMessage,
              timestamp: new Date().toISOString(),
              isError: true,
              errorCode,
            },
          ]);

          if (errorCode === "API_KEY_NOT_SET") {
            setSettingsModalOpen(true);
          } else if (errorCode === "API_KEY_INVALID") {
            removeApiKey();
          } else if (errorCode === "DAILY_LIMIT_EXCEEDED") {
            setSettingsModalOpen(true);
          }
          return;
        }

        if (data.model && settings.model === "auto" && data.model !== "auto") {
          const newSettings = { ...settings, model: data.model };
          setSettings(newSettings);
          saveSettings(newSettings);
        }

        setTimeout(() => {
          setIsTyping(false);
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: data.response,
              timestamp: new Date().toISOString(),
            },
          ]);
        }, 500);
      } catch (error) {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              error instanceof Error ? error.message : "An error occurred",
            timestamp: new Date().toISOString(),
            isError: true,
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [loading, activeConversationId, apiKey, settings, handleUserActivity],
  );

  const toggleTheme = useCallback(() => {
    handleUserActivity();
    const newSettings = { ...settings, darkMode: !settings.darkMode };
    setSettings(newSettings);
    saveSettings(newSettings);
  }, [settings, handleUserActivity]);

  const handleNewChat = useCallback(() => {
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
    setActiveConversationIdState(newConv.id);
    setMessages([]);
  }, [messages, activeConversationId, conversations]);

  const handleSelectConversation = useCallback(
    (id: string) => {
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
    },
    [conversations, activeConversationId, messages],
  );

  const handleDeleteConversation = useCallback(
    (id: string) => {
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
    },
    [conversations, activeConversationId],
  );

  const handleSettingsSave = useCallback(
    (newSettings: AppSettings, newApiKey: string) => {
      setSettings(newSettings);
      saveSettings(newSettings);
      if (newApiKey) saveApiKey(newApiKey);
      else removeApiKey();
    },
    [saveApiKey, removeApiKey],
  );

  // Calculate response time (average)
  const avgResponseTime = 350; // Placeholder, would be calculated from actual timings

  return (
    <>
      <div
        className="bento-container"
        style={{
          opacity: showSplash ? 0 : 1,
          transition: "opacity 0.4s ease",
        }}
      >
        {/* div1: Settings and Logo - Top-left, 2 cols */}
        <div className="bento-panel div1">
          <div className="div1-header">
            <div className="div1-logo">
              <svg
                className="div1-logo-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  d="M12 2a7 7 0 017 7c0 3-3 7-7 7s-7-4-7-7a7 7 0 017-7z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="12" cy="14" r="3" />
                <path
                  d="M6 20v-2M12 22v-2M18 20v-2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="div1-logo-text">AI Chat</span>
            </div>
            <div className="div1-brand-dots">
              <span className="div1-brand-dot"></span>
              <span className="div1-brand-dot"></span>
              <span className="div1-brand-dot"></span>
            </div>
          </div>
        </div>

        {/* div2: Buttons and Extra - Top-center, 2 cols */}
        <div className="bento-panel div2">
          <div className="div2-header">
            <div className="div2-status">
              <span className="div2-status-dot"></span>
              <span>Online</span>
            </div>
            <div className="div2-buttons">
              <button
                onClick={toggleTheme}
                className="header-btn"
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
                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
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
                className="header-btn"
                title="Settings"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
                </svg>
              </button>
              <div className="div2-user-avatar">U</div>
            </div>
          </div>
        </div>

        {/* div3: History Tab - Far right, 1 col, spans 5 rows */}
        <div className="bento-panel div3">
          <CollapsibleHistory
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelect={handleSelectConversation}
            onDelete={handleDeleteConversation}
            onNewChat={handleNewChat}
            expanded={historyExpanded}
            onToggle={() => setHistoryExpanded(!historyExpanded)}
          />
        </div>

        {/* div7: Stats Panel - Far left, 1 col, spans 3 rows */}
        <div className="bento-panel div7">
          <StatsPanel
            totalMessages={messages.filter((m) => m.role === "user").length}
            totalApiCalls={
              messages.filter((m) => m.role === "assistant").length
            }
            tokenUsage={messages.reduce(
              (sum, m) => sum + Math.ceil(m.content.length / 4),
              0,
            )}
            avgResponseTime={avgResponseTime}
            sessionMessageCount={messages.length}
            startTime={sessionStart}
          />
        </div>

        {/* div5: Chat - Center, 3 cols wide, 3 rows tall */}
        <div className="bento-panel div5-main">
          <div className="main-chat-view">
            <div className="main-chat-header">
              <svg
                className="main-chat-header-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  d="M12 2a7 7 0 017 7c0 3-3 7-7 7s-7-4-7-7a7 7 0 017-7z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="12" cy="14" r="3" />
                <path
                  d="M6 20v-2M12 22v-2M18 20v-2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <h3>Conversation</h3>
              <span className="main-chat-header-badge">
                {messages.filter((m) => m.role === "assistant").length} replies
              </span>
            </div>

            <div className="main-chat-messages">
              <MessageList
                messages={messages}
                isTyping={isTyping}
                messagesEndRef={messagesEndRef}
              />
            </div>

            <div className="main-chat-input-wrapper">
              <ChatInput
                onSubmit={handleSubmit}
                disabled={loading}
                inputRef={inputRef}
              />
            </div>
          </div>
        </div>

        {/* div4: Model/Stats Bar - Bottom, 4 cols wide */}
        <div className="bento-panel div4">
          <ModelBar
            modelName={settings.model}
            temperature={settings.temperature}
            mode={settings.model === "auto" ? "auto" : "manual"}
            messageCount={messages.length}
          />
        </div>

        <SettingsModal
          key={settingsModalOpen ? "open" : "closed"}
          isOpen={settingsModalOpen}
          onClose={() => setSettingsModalOpen(false)}
          settings={settings}
          apiKey={apiKey}
          onSave={handleSettingsSave}
        />
      </div>
      {showSplash && <SplashLogo onComplete={handleSplashComplete} />}
    </>
  );
}
