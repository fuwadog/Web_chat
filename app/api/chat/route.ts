import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit, getRateLimitStatus } from "../../lib/rateLimit"

interface ApiError {
  error: string
  code: string
}

const ERROR_MESSAGES = {
  DAILY_LIMIT_EXCEEDED: "Daily limit (25) reached. Come back tomorrow!",
  API_KEY_NOT_SET: "Please set your Google API key in Settings first.",
  API_KEY_INVALID: "API key invalid or expired. Get a new one at https://aistudio.google.com/api-keys",
  API_QUOTA_EXCEEDED: "API quota exceeded. Please wait or use a fresh API key.",
  NETWORK_ERROR: "Server error. Please try again later.",
  EMPTY_MESSAGE: "Please enter a message.",
  MODEL_UNAVAILABLE: "Selected model is currently unavailable. Auto-switching...",
}

function createErrorResponse(message: string, code: string, status: number) {
  return NextResponse.json(
    { error: message, code },
    { status }
  )
}

function parseErrorType(errorMessage: string): { type: string; message: string } {
  const lower = errorMessage.toLowerCase()
  
  if (lower.includes("429") || lower.includes("quota")) {
    return { type: "API_QUOTA_EXCEEDED", message: ERROR_MESSAGES.API_QUOTA_EXCEEDED }
  }
  if (lower.includes("400") || lower.includes("api key") || lower.includes("expired") || lower.includes("invalid")) {
    return { type: "API_KEY_INVALID", message: ERROR_MESSAGES.API_KEY_INVALID }
  }
  if (lower.includes("network") || lower.includes("fetch") || lower.includes("ECONNREFUSED") || lower.includes("ENOTFOUND")) {
    return { type: "NETWORK_ERROR", message: ERROR_MESSAGES.NETWORK_ERROR }
  }
  
  return { type: "NETWORK_ERROR", message: ERROR_MESSAGES.NETWORK_ERROR }
}

export async function POST(request: NextRequest) {
  try {
    const rateLimit = checkRateLimit()
    if (!rateLimit.allowed) {
      return createErrorResponse(ERROR_MESSAGES.DAILY_LIMIT_EXCEEDED, "DAILY_LIMIT_EXCEEDED", 429)
    }

    const { message, apiKey, model, temperature } = await request.json()

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return createErrorResponse(ERROR_MESSAGES.EMPTY_MESSAGE, "EMPTY_MESSAGE", 400)
    }

    const key = apiKey || process.env.GEMINI_API_KEY
    if (!key) {
      return createErrorResponse(ERROR_MESSAGES.API_KEY_NOT_SET, "API_KEY_NOT_SET", 401)
    }

    const genAI = new GoogleGenerativeAI(key)
    const FALLBACK_MODELS = [
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
      "gemini-3-flash",
      "gemini-3.1-flash-lite",
      "gemini-2.0-flash",
    ]
    const modelsToTry = model === "auto" ? FALLBACK_MODELS : [model || "gemini-2.0-flash"]
    const temp = temperature ?? 0.7

    let lastError: string | null = null
    let lastErrorType = "MODEL_UNAVAILABLE"
    let allModelsFailed = false

    for (const modelName of modelsToTry) {
      try {
        const generativeModel = genAI.getGenerativeModel({ model: modelName })
        const result = await generativeModel.generateContent({
          contents: [{ role: "user", parts: [{ text: message }] }],
          generationConfig: { temperature: temp },
        })
        const response = await result.response
        const text = response.text()
        return NextResponse.json({ 
          response: text, 
          model: modelName,
          rateLimit: getRateLimitStatus()
        })
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        lastError = errorMessage

        if (errorMessage.includes("429") || errorMessage.toLowerCase().includes("quota")) {
          lastErrorType = "API_QUOTA_EXCEEDED"
        } else if (errorMessage.includes("400") || errorMessage.toLowerCase().includes("api key") || errorMessage.toLowerCase().includes("expired") || errorMessage.toLowerCase().includes("invalid")) {
          lastErrorType = "API_KEY_INVALID"
        } else if (!errorMessage.includes("429") && !errorMessage.toLowerCase().includes("quota")) {
          allModelsFailed = true
        }
      }
    }

    if (allModelsFailed) {
      return createErrorResponse(ERROR_MESSAGES.MODEL_UNAVAILABLE, lastErrorType, 503)
    }

    if (lastErrorType === "API_QUOTA_EXCEEDED") {
      return createErrorResponse(ERROR_MESSAGES.API_QUOTA_EXCEEDED, "API_QUOTA_EXCEEDED", 429)
    }

    if (lastErrorType === "API_KEY_INVALID") {
      return createErrorResponse(ERROR_MESSAGES.API_KEY_INVALID, "API_KEY_INVALID", 401)
    }

    return createErrorResponse(ERROR_MESSAGES.MODEL_UNAVAILABLE, "MODEL_UNAVAILABLE", 503)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error("Gemini API error:", errorMessage)

    const parsed = parseErrorType(errorMessage)
    return createErrorResponse(parsed.message, parsed.type, parsed.type === "NETWORK_ERROR" ? 500 : 429)
  }
}
