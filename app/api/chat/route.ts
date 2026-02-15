import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function POST(request: NextRequest) {
  try {

    const { message } = await request.json()


    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required and must be a non-empty string' },
        { status: 400 }
      )
    }


    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      )
    }


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
