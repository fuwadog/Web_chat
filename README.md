# 🪐 Gemini Chat App

A **simple AI chat application** built with **Next.js** and **Google Gemini AI**. Chat with a generative AI in real time, toggle dark/light mode, and enjoy a clean, responsive interface. Users can optionally provide their own Gemini API key for direct access.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)  
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)  
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel)](https://vercel.com/)

---

## 🌐 Demo

Try it live: **https://web-chat-phi-amber.vercel.app/**

---

## ✨ Features

- Public chat interface — no login or account needed
- **Temporary user API key** — paste your own Gemini API key for direct, quota-controlled access
- Dark / Light mode toggle
- Typing indicator for AI responses
- AI powered by **Google Gemini AI** (`gemini-3-flash-preview`)
- Clear chat history with one click
- Responsive, mobile-friendly design
- Fully client-server architecture

---

## 🔑 User API Key System

Users can provide their own Gemini API key instead of relying on a server-side key. Here's how it works:

### How It Works

1. **Setting a key** — Click the key icon in the header to open the API key modal. Paste your Gemini API key and click **Save Key**.
2. **Storage** — The key is stored in `sessionStorage` (not `localStorage` or cookies). It persists only for the current browser tab session.
3. **Auto-deletion** — The key is automatically removed when you:
   - Close the tab
   - Refresh the page
   - Navigate away from the app
4. **Warning on exit** — If an API key is set, a browser warning popup appears before closing or refreshing the tab, reminding you that the key will be removed.
5. **Manual removal** — Click the key icon again (it shows a green dot when a key is active) to remove the key immediately.

### Why sessionStorage?

`sessionStorage` ensures the API key never persists beyond the current session, protecting users from accidentally leaving their keys on shared or public machines.

### Getting an API Key

Get a free Gemini API key at [Google AI Studio](https://aistudio.google.com/api-keys).

---

## 💻 Tech Stack

- **Frontend:** Next.js 16 (React 19 + TypeScript 5)
- **Backend:** Next.js API Routes (`app/api/chat/route.ts`)
- **AI Integration:** Google Gemini AI (`@google/generative-ai`)
- **Styling:** CSS Modules (`globals.css`)

---

## 📂 Project Structure

```
Web_chat/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts        # API endpoint — forwards messages to Gemini
│   ├── layout.tsx              # Root layout with metadata
│   ├── page.tsx                # Main chat UI (client component)
│   └── globals.css             # Global styles + dark mode
├── package.json                # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
└── README.md                   # This file
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ installed
- A Gemini API key (optional — get one at [Google AI Studio](https://aistudio.google.com/api-keys))

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/Web_chat.git
   cd Web_chat
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the project root:

   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

   This key acts as the **default/fallback**. If a user provides their own key via the UI, it takes priority.

4. **Run the development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌍 Deployment on Vercel

The easiest way to deploy is with [Vercel](https://vercel.com/):

1. Push your code to a GitHub repository
2. Go to [vercel.com/new](https://vercel.com/new) and import your repository
3. In the project settings, add the environment variable:
   - **Key:** `GEMINI_API_KEY`
   - **Value:** Your Gemini API key
4. Click **Deploy**

Your app will be live at a Vercel URL (e.g., `https://your-app.vercel.app`).

> **Note:** Even when deployed with a server-side API key, users can still provide their own key via the UI, which will take priority over the server-side key.

---

## 📝 API Endpoint

### `POST /api/chat`

Sends a message to the Gemini API and returns the AI response.

**Request body:**

```json
{
  "message": "Hello, how are you?",
  "apiKey": "optional_user_api_key"
}
```

**Response:**

```json
{
  "response": "I'm doing well, thank you for asking!"
}
```

**Error responses:**

| Status | Description |
|--------|-------------|
| 400    | Message is required or invalid |
| 500    | API key not configured, quota exceeded, or Gemini API error |

