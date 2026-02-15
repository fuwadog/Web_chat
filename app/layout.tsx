import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Gemini Chatbot',
  description: 'Simple chatbot powered by Google Gemini',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}