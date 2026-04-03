import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { message, apiKey, model, temperature } = await request.json()

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Message is required and must be a non-empty string" },
        { status: 400 }
      )
    }

    const key = apiKey || process.env.GEMINI_API_KEY
    if (!key) {
      return NextResponse.json(
        { error: "API key not configured. Please add your API key in Settings." },
        { status: 500 }
      )
    }

    const genAI = new GoogleGenerativeAI(key)
    const FALLBACK_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"]
    const modelsToTry = model === "auto" ? FALLBACK_MODELS : [model || "gemini-2.0-flash"]
    const temp = temperature ?? 0.7

    let lastError: string | null = null
    for (const modelName of modelsToTry) {
      try {
        const generativeModel = genAI.getGenerativeModel({ model: modelName })
        const result = await generativeModel.generateContent({
          contents: [{ role: "user", parts: [{ text: message }] }],
          generationConfig: { temperature: temp },
        })
        const response = await result.response
        const text = response.text()
        return NextResponse.json({ response: text, model: modelName })
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err)
        if (!lastError.includes("429") && !lastError.includes("quota")) break
      }
    }

    throw new Error(lastError || "All models unavailable")
  } catch (error: unknown) {
    let errorMessage = error instanceof Error ? error.message : String(error)

    if (errorMessage.includes("429")) {
      errorMessage = "Quota exceeded. Please wait or use a fresh API key."
    } else if (errorMessage.includes("400") || errorMessage.includes("API key expired")) {
      errorMessage = "API key invalid or expired. Generate a new key at https://aistudio.google.com/api-keys"
    }

    console.error("Gemini API error:", errorMessage)
    return NextResponse.json(
      { error: "Failed to generate response", details: errorMessage },
      { status: 500 }
    )
  }
}