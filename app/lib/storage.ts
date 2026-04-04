import { Conversation, AppSettings, DEFAULT_SETTINGS } from '../types/chat';

const CONVERSATIONS_KEY = 'gemini_chat_conversations';
const SETTINGS_KEY = 'gemini_chat_settings';
const ACTIVE_CONVERSATION_KEY = 'gemini_chat_active_conversation';
const USER_API_KEY = 'User_API';

// Session-based API key storage (auto-clears on tab close)
export function getSessionApiKey(): string {
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem(USER_API_KEY) || '';
}

export function setSessionApiKey(apiKey: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(USER_API_KEY, apiKey);
}

export function clearSessionApiKey(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(USER_API_KEY);
}

// Session timeout & security helpers
const SESSION_LAST_ACTIVE_KEY = 'gemini_chat_last_active';
const SESSION_EXPIRY_MS = 3_600_000; // 1 hour

export function updateLastActive(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(SESSION_LAST_ACTIVE_KEY, Date.now().toString());
}

export function checkSessionExpiry(): boolean {
  if (typeof window === 'undefined') return false;
  const now = Date.now();
  const lastActive = sessionStorage.getItem(SESSION_LAST_ACTIVE_KEY);
  if (!lastActive) return false;
  try {
    return now - parseInt(lastActive, 10) > SESSION_EXPIRY_MS;
  } catch {
    return false;
  }
}

export function clearSessionData(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(USER_API_KEY);
  sessionStorage.removeItem(SESSION_LAST_ACTIVE_KEY);
}

export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length <= 4) return '****';
  return '*'.repeat(apiKey.length - 4) + apiKey.slice(-4);
}

export function isApiKeySet(): boolean {
  if (typeof window === 'undefined') return false;
  const key = sessionStorage.getItem(USER_API_KEY);
  return !!key;
}

// Conversations
export function getConversations(): Conversation[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(CONVERSATIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveConversations(conversations: Conversation[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
}

export function getConversation(id: string): Conversation | undefined {
  const conversations = getConversations();
  return conversations.find(c => c.id === id);
}

export function saveConversation(conversation: Conversation): void {
  const conversations = getConversations();
  const index = conversations.findIndex(c => c.id === conversation.id);
  if (index >= 0) {
    conversations[index] = conversation;
  } else {
    conversations.unshift(conversation);
  }
  saveConversations(conversations);
}

export function deleteConversation(id: string): void {
  const conversations = getConversations().filter(c => c.id !== id);
  saveConversations(conversations);
}

export function createConversation(): Conversation {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: 'New Chat',
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function generateConversationTitle(firstMessage: string): string {
  const maxLength = 30;
  const cleaned = firstMessage.trim().replace(/\n/g, ' ');
  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.substring(0, maxLength) + '...';
}

export function getActiveConversationId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACTIVE_CONVERSATION_KEY);
}

export function setActiveConversationId(id: string | null): void {
  if (typeof window === 'undefined') return;
  if (id) {
    localStorage.setItem(ACTIVE_CONVERSATION_KEY, id);
  } else {
    localStorage.removeItem(ACTIVE_CONVERSATION_KEY);
  }
}

// Settings
// Deprecated models that should be migrated to new models
const DEPRECATED_MODELS: Record<string, string> = {
  'gemini-1.5-pro': 'gemini-2.0-flash',
  'gemini-1.5-flash': 'gemini-2.0-flash',
  'gemini-pro': 'gemini-2.0-flash',
};

export function getSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    if (!data) return DEFAULT_SETTINGS;
    const savedSettings = JSON.parse(data);
    
    // Migrate deprecated model names
    if (savedSettings.model && DEPRECATED_MODELS[savedSettings.model]) {
      savedSettings.model = DEPRECATED_MODELS[savedSettings.model];
      // Save the migrated settings back to localStorage
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(savedSettings));
    }
    
    return { ...DEFAULT_SETTINGS, ...savedSettings };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
