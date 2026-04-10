import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit, getRateLimitStatus } from "../../lib/rateLimit"

const ERROR_MESSAGES = {
  DAILY_LIMIT_EXCEEDED: "Daily limit (25) reached. Come back tomorrow!",
  API_KEY_NOT_SET: "Please set your Google API key in Settings first.",
  API_KEY_INVALID: "API key invalid or expired. Get a new one at https://aistudio.google.com/api-keys",
  API_QUOTA_EXCEEDED: "API quota exceeded. Please wait or use a fresh API key.",
  NETWORK_ERROR: "Server error. Please try again later.",
  EMPTY_MESSAGE: "Please enter a message.",
  MODEL_UNAVAILABLE: "Selected model is currently unavailable. Auto-switching...",
}

interface CacheEntry {
  data: object
  expiresAt: number
}

const CACHE_TTL_MS = 5 * 60 * 1000
const responseCache = new Map<string, CacheEntry>()

const _cacheTimer = setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of responseCache) {
    if (entry.expiresAt <= now) responseCache.delete(key)
  }
}, 60 * 1000)
void _cacheTimer

const DEDUPE_WINDOW_MS = 100
const requestDedupe = new Map<string, Promise<NextResponse>>()

function getCacheKey(message: string, apiKey: string, model: string, temperature: number): string {
  return `${apiKey}:${model}:${temperature}:${message.slice(0, 100)}`
}

function createErrorResponse(message: string, code: string, status: number) {
  return NextResponse.json({ error: message, code }, { status })
}

async function streamGenerate(
  genAI: GoogleGenerativeAI,
  modelName: string,
  message: string,
  temp: number
): Promise<string> {
  const generativeModel = genAI.getGenerativeModel({ model: modelName })
  const result = await generativeModel.generateContentStream({
    contents: [{ role: "user", parts: [{ text: message }] }],
    generationConfig: { temperature: temp },
  })

  let fullText = ""
  for await (const chunk of result.stream) {
    fullText += chunk.text()
  }
  return fullText
}

export async function POST(request: NextRequest) {
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

  const temp = temperature ?? 0.7
  const FALLBACK_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-3-flash",
    "gemini-2.0-flash",
  ]
  const modelsToTry = model === "auto" ? FALLBACK_MODELS : [model || "gemini-2.0-flash"]
  const cacheKey = getCacheKey(message, key, modelsToTry[0], temp)

  const cached = responseCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached.data)
  }

  const dedupeKey = cacheKey
  const existingDeduped = requestDedupe.get(dedupeKey)
  if (existingDeduped) {
    return existingDeduped
  }

  const dedupePromise = (async () => {
    try {
      const genAI = new GoogleGenerativeAI(key)

      const enc = new TextEncoder()
      const stream = new ReadableStream({
        async start(controller) {
          let lastError: string | null = null
          let fullText = ""
          let success = false

          for (const modelName of modelsToTry) {
            try {
              fullText = await streamGenerate(genAI, modelName, message, temp)
              success = true
              break
            } catch (err) {
              lastError = err instanceof Error ? err.message : String(err)
            }
          }

          if (success) {
            const responseData = {
              response: fullText,
              model: modelsToTry[0],
              rateLimit: getRateLimitStatus(),
            }

            responseCache.set(cacheKey, {
              data: responseData,
              expiresAt: Date.now() + CACHE_TTL_MS,
            })

            controller.enqueue(enc.encode(`data: ${JSON.stringify({ done: true, ...responseData })}\n\n`))
          } else {
            const errorData = parseErrorType(lastError || "Unknown error")
            controller.enqueue(enc.encode(`data: ${JSON.stringify({ error: errorData.message, code: errorData.type })}\n\n`))
          }
          controller.close()
        },
      })

      return new NextResponse(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      })
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error("Gemini API error:", errorMessage)

      const parsed = parseErrorType(errorMessage)
      return createErrorResponse(parsed.message, parsed.type, parsed.type === "NETWORK_ERROR" ? 500 : 429)
    } finally {
      setTimeout(() => requestDedupe.delete(dedupeKey), DEDUPE_WINDOW_MS * 10)
    }
  })()

  requestDedupe.set(dedupeKey, dedupePromise)
  return dedupePromise
}

function parseErrorType(errorMessage: string): { type: string; message: string } {
  const lower = errorMessage.toLowerCase()

  if (lower.includes("429") || lower.includes("quota")) {
    return { type: "API_QUOTA_EXCEEDED", message: ERROR_MESSAGES.API_QUOTA_EXCEEDED }
  }
  if (lower.includes("400") || lower.includes("api key") || lower.includes("expired") || lower.includes("invalid")) {
    return { type: "API_KEY_INVALID", message: ERROR_MESSAGES.API_KEY_INVALID }
  }
  if (lower.includes("network") || lower.includes("fetch") || lower.includes("econnrefused") || lower.includes("enotfound")) {
    return { type: "NETWORK_ERROR", message: ERROR_MESSAGES.NETWORK_ERROR }
  }

  return { type: "NETWORK_ERROR", message: ERROR_MESSAGES.NETWORK_ERROR }
}