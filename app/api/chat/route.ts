import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {

    const { message, apiKey: userApiKey } = await request.json()


    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    const effectiveApiKey = userApiKey || process.env.GEMINI_API_KEY

    if (!effectiveApiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      )
    }

    const genAI = new GoogleGenerativeAI(effectiveApiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' })


    const result = await model.generateContent(message)
    const response = await result.response
    const text = response.text()

    return NextResponse.json({ response: text })

  } catch (error: any) {
    let errorMessage = error instanceof Error ? error.message : String(error)

   
    if (errorMessage.includes('429')) {
      errorMessage = 'Quota exceeded. Please wait or use a fresh API key.'
    } else if (errorMessage.includes('400') || errorMessage.includes('API key expired')) {
      errorMessage = 'API key invalid or expired. Generate a new key at https://aistudio.google.com/api-keys'
    }

    console.error('Gemini API error:', errorMessage)
    
    return NextResponse.json(
      { error: 'Failed to generate response', details: errorMessage },
      { status: 500 }
    )
  }
}
