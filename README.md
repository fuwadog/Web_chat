# 🪐 Gemini Chat App

A **feature-rich AI chat application** built with **Next.js** and **Google Gemini AI**. Enjoy multi-conversation support, a bento-grid UI, dark/light mode, session-based API keys, markdown rendering with code highlighting, and real-time stats tracking.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)  
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue?logo=typescript)](https://www.typescriptlang.org/)  
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev/)  
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel)](https://vercel.com/)

---

## 🌐 Demo

Try it live: **https://web-chat-ruddy.vercel.app/**

---

## ✨ Features

- **Multi-conversation support** — Create, switch, and delete chat histories
- **Session-based user API keys** — Paste your own Gemini API key for direct, quota-controlled access
- **Bento-grid UI layout** — Modern, panel-based design with collapsible sidebar
- **Dark / Light mode toggle** — Persistent theme preference
- **Typing indicator** — Visual feedback while AI generates responses
- **Markdown rendering** — Rich text output with syntax-highlighted code blocks
- **Model selection** — Choose between Gemini 2.0 Flash, 2.5 Flash, or Auto mode
- **Temperature control** — Adjust response creativity (0.0–1.0)
- **Stats panel** — Track messages, API calls, token usage, and session info
- **Model bar** — Real-time model and temperature display
- **Responsive, mobile-friendly design**
- **Auto title generation** — Conversations auto-name based on first message
- **Clear chat history** — One-click message reset

---

## 🔑 User API Key System

Users can provide their own Gemini API key instead of relying on a server-side key. Here's how it works:

### How It Works

1. **Setting a key** — Open the Settings modal (gear icon) and paste your Gemini API key.
2. **Storage** — The key is stored in `sessionStorage` (not `localStorage` or cookies). It persists only for the current browser tab session.
3. **Auto-deletion** — The key is automatically removed when you:
   - Close the tab or refresh the page
   - Navigate away from the app
   - The page visibility changes (tab hidden)
4. **Cleanup on mount** — Any leftover API key from a previous session is cleared when the app loads.
5. **Manual removal** — Clear the key field in Settings to remove it immediately.

### Why sessionStorage?

`sessionStorage` ensures the API key never persists beyond the current session, protecting users from accidentally leaving their keys on shared or public machines.

### Getting an API Key

Get a free Gemini API key at [Google AI Studio](https://aistudio.google.com/api-keys).

---

## 💻 Tech Stack

| Category       | Technology                                     |
| -------------- | ---------------------------------------------- |
| **Framework**  | Next.js 16 (App Router)                        |
| **Language**   | TypeScript 6.0                                 |
| **UI Library** | React 19                                       |
| **AI SDK**     | `@google/generative-ai` v0.24, `@google/genai` |
| **Markdown**   | `react-markdown` + `react-syntax-highlighter`  |
| **Styling**    | CSS Modules (`globals.css`)                    |
| **Deployment** | Vercel                                         |

---

## 📂 Project Structure

```
Web_chat/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts            # API endpoint — Gemini integration with fallback models
│   ├── components/
│   │   ├── chat/
│   │   │   ├── ChatInput.tsx       # Message input with submit controls
│   │   │   └── MessageList.tsx     # Messages + typing indicator + markdown
│   │   ├── CollapsibleHistory.tsx  # Sidebar for conversation history
│   │   ├── DualChatView.tsx        # (Optional) Dual-pane chat layout
│   │   ├── ModelBar.tsx            # Bottom bar showing model + temperature
│   │   ├── SettingsModal.tsx       # Settings: API key, model, temperature, theme
│   │   ├── Sidebar.tsx             # Navigation sidebar component
│   │   └── StatsPanel.tsx          # Stats: messages, tokens, session info
│   ├── lib/
│   │   └── storage.ts              # LocalStorage utilities for conversations & settings
│   ├── types/
│   │   └── chat.ts                 # TypeScript interfaces (Message, Conversation, AppSettings)
│   ├── globals.css                 # Global styles, dark mode, bento-grid layout
│   ├── layout.tsx                  # Root layout with metadata
│   └── page.tsx                    # Main chat UI (client component)
├── package.json                    # Dependencies and scripts
├── tsconfig.json                   # TypeScript configuration
├── next.config.js                  # Next.js configuration
├── eslint.config.js                # ESLint configuration
└── README.md                       # This file
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ installed
- A Gemini API key (optional — get one at [Google AI Studio](https://aistudio.google.com/api-keys))

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/fuwadog/Web_chat.git
   cd Web_chat
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the project root (optional — acts as fallback):

   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Run the development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

| Command         | Description              |
| --------------- | ------------------------ |
| `npm run dev`   | Start development server |
| `npm run build` | Create production build  |
| `npm run start` | Start production server  |
| `npm run lint`  | Run ESLint checks        |

---

## 🤖 Available Models

| Model              | Description                         |
| ------------------ | ----------------------------------- |
| `Auto`             | Automatically picks available model |
| `Gemini 2.0 Flash` | Fast, efficient responses           |
| `Gemini 2.5 Flash` | Latest version, improved reasoning  |

### Fallback Logic

When model is set to **Auto**, the API tries `gemini-2.5-flash` first, then falls back to `gemini-2.0-flash` on quota errors.

---

## 📊 API Endpoint

### `POST /api/chat`

Sends a message to the Gemini API and returns the AI response.

**Request body:**

```json
{
  "message": "Hello, how are you?",
  "apiKey": "optional_user_api_key",
  "model": "gemini-2.0-flash",
  "temperature": 0.7
}
```

**Response:**

```json
{
  "response": "I'm doing well, thank you for asking!",
  "model": "gemini-2.0-flash"
}
```

**Error responses:**

| Status | Description                                                 |
| ------ | ----------------------------------------------------------- |
| 400    | Message is required or invalid                              |
| 500    | API key not configured, quota exceeded, or Gemini API error |

---

## 🌍 Deployment on Vercel

The easiest way to deploy is with [Vercel](https://vercel.com/):

1. Push your code to a GitHub repository
2. Go to [vercel.com/new](https://vercel.com/new) and import your repository
3. In the project settings, add the environment variable (optional):
   - **Key:** `GEMINI_API_KEY`
   - **Value:** Your Gemini API key
4. Click **Deploy**

Your app will be live at a Vercel URL (e.g., `https://your-app.vercel.app`).

> **Note:** Even when deployed with a server-side API key, users can still provide their own key via the UI, which will take priority over the server-side key.

---

## 🛡️ Privacy & Security

- API keys stored in **sessionStorage only** — never persisted to disk
- Keys auto-removed on tab close, refresh, or navigation
- No server-side logging or storage of user API keys
- All API calls go directly through Next.js server-side route handler

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- [Google Gemini AI](https://ai.google.dev/) for the AI model
- [Next.js](https://nextjs.org/) for the framework
- [Vercel](https://vercel.com/) for hosting
