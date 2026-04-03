export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  model: string;
  temperature: number;
  darkMode: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  model: 'gemini-2.0-flash',
  temperature: 0.7,
  darkMode: true,
};

export const AVAILABLE_MODELS = [
  { id: 'auto', name: 'Auto (pick available)' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
];
