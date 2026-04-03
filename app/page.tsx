'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import './globals.css';

const API_KEY_STORAGE_KEY = 'gemini_api_key';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const apiKeyInputRef = useRef<HTMLInputElement>(null);

  // Check and clear leftover API key on mount
  useEffect(() => {
    const leftoverKey = sessionStorage.getItem(API_KEY_STORAGE_KEY);
    if (leftoverKey) {
      sessionStorage.removeItem(API_KEY_STORAGE_KEY);
    }
    setApiKey(null);
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Apply dark mode class to body
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Focus API key input when modal opens
  useEffect(() => {
    if (showApiKeyModal) {
      apiKeyInputRef.current?.focus();
    }
  }, [showApiKeyModal]);

  // Warn on page close/refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (apiKey) {
        e.preventDefault();
        e.returnValue = 'Your API key will be removed when you leave this page. Are you sure?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [apiKey]);

  // Clear API key on unload
  useEffect(() => {
    const handleUnload = () => {
      sessionStorage.removeItem(API_KEY_STORAGE_KEY);
    };
    window.addEventListener('pagehide', handleUnload);
    window.addEventListener('unload', handleUnload);
    return () => {
      window.removeEventListener('pagehide', handleUnload);
      window.removeEventListener('unload', handleUnload);
    };
  }, []);

  const saveApiKey = useCallback((key: string) => {
    sessionStorage.setItem(API_KEY_STORAGE_KEY, key);
    setApiKey(key);
    setShowApiKeyModal(false);
    setApiKeyInput('');
  }, []);

  const removeApiKey = useCallback(() => {
    sessionStorage.removeItem(API_KEY_STORAGE_KEY);
    setApiKey(null);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input.trim(), apiKey: apiKey || undefined }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get response');
      }

      const data = await response.json();
      
      // Simulate typing delay for better UX
      setTimeout(() => {
        setIsTyping(false);
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }, 500);

    } catch (error) {
      setIsTyping(false);
      const errorMessage: Message = {
        role: 'assistant',
        content: error instanceof Error ? error.message : 'An error occurred',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  const clearChat = () => {
    if (messages.length > 0 && confirm('Clear all messages?')) {
      setMessages([]);
    }
  };

  return (
    <div className="chat-container">
      {/* Header */}
      <header className="chat-header">
        <div className="header-content">
          <div className="header-left">
            <div className="gemini-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" fillOpacity="0.8"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <h1 className="header-title">Gemini Chat</h1>
              <p className="header-subtitle">Powered by Google AI</p>
            </div>
          </div>
          
          <div className="header-actions">
            <button
              onClick={() => apiKey ? removeApiKey() : setShowApiKeyModal(true)}
              className={`icon-button api-key-button ${apiKey ? 'api-key-active' : ''}`}
              title={apiKey ? 'API key set (click to remove)' : 'Set API key'}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
              </svg>
              {apiKey && <span className="api-key-dot"></span>}
            </button>
            {messages.length > 0 && (
              <button 
                onClick={clearChat} 
                className="icon-button clear-button"
                title="Clear chat"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"/>
                </svg>
              </button>
            )}
            <button 
              onClick={toggleTheme} 
              className="icon-button theme-toggle"
              title={darkMode ? 'Light mode' : 'Dark mode'}
            >
              {darkMode ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/>
                  <line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/>
                  <line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <main className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              </svg>
            </div>
            <h2>Start a conversation</h2>
            <p>Ask me anything, and I'll do my best to help.</p>
          </div>
        ) : (
          <div className="messages-list">
            {messages.map((msg, index) => (
              <div 
                key={index} 
                className={`message message-${msg.role}`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="message-avatar">
                  {msg.role === 'user' ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" fillOpacity="0.9"/>
                      <path d="M2 17L12 22L22 17M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  )}
                </div>
                <div className="message-content">
                  <div className="message-header">
                    <span className="message-role">
                      {msg.role === 'user' ? 'You' : 'Gemini'}
                    </span>
                    <span className="message-time">
                      {msg.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
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
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" fillOpacity="0.9"/>
                    <path d="M2 17L12 22L22 17M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2"/>
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

      {/* Input Area */}
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
              <svg className="spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" opacity="0.25"/>
                <path d="M12 2a10 10 0 0110 10" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            )}
          </button>
        </form>
        <p className="input-footer">
          Gemini can make mistakes. Check important info.
        </p>
      </footer>

      {/* API Key Modal */}
      {showApiKeyModal && (
        <div className="modal-overlay" onClick={() => setShowApiKeyModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Enter Gemini API Key</h2>
              <button
                onClick={() => setShowApiKeyModal(false)}
                className="modal-close"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-description">
                Your API key is stored only in sessionStorage and will be removed when you close this tab.
              </p>
              <input
                ref={apiKeyInputRef}
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="Paste your Gemini API key here..."
                className="api-key-input"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && apiKeyInput.trim()) {
                    saveApiKey(apiKeyInput.trim());
                  }
                }}
              />
              <p className="modal-hint">
                Get your key at <a href="https://aistudio.google.com/api-keys" target="_blank" rel="noopener noreferrer">Google AI Studio</a>
              </p>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setShowApiKeyModal(false)}
                className="modal-button modal-button-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => apiKeyInput.trim() && saveApiKey(apiKeyInput.trim())}
                disabled={!apiKeyInput.trim()}
                className="modal-button modal-button-primary"
              >
                Save Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
