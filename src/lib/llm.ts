/**
 * LLM Utility — dual provider chat completions
 *
 * Priority:
 *   1. z-ai-web-dev-sdk (zero config, works in z.ai environment) — GLM models
 *   2. OpenAI-compatible API via native fetch (if OPENAI_API_KEY is set)
 *
 * Environment variables (optional, for OpenAI-compatible fallback):
 *   OPENAI_API_KEY   — API key
 *   OPENAI_BASE_URL  — Base URL (default: https://api.openai.com/v1)
 *   OPENAI_MODEL     — Model name (default: gpt-4o-mini)
 */

import ZAI from 'z-ai-web-dev-sdk'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatCompletionOptions {
  messages: ChatMessage[]
  temperature?: number      // 0–2, default 0.7
  max_tokens?: number       // max tokens in response
  model?: string            // override default model
}

export interface ChatCompletionResult {
  content: string
  model: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

const DEFAULT_BASE_URL = 'https://api.openai.com/v1'
const DEFAULT_MODEL = 'gpt-4o-mini'

// Singleton z-ai client (ZAI.create() is async and can be cached)
let zaiClient: Awaited<ReturnType<typeof ZAI.create>> | null = null

async function getZaiClient() {
  if (!zaiClient) {
    zaiClient = await ZAI.create()
  }
  return zaiClient
}

/**
 * Send a chat completion request.
 * Uses z-ai SDK (GLM) by default; falls back to OpenAI-compatible API when OPENAI_API_KEY is set.
 */
export async function chatCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResult> {
  // ── Provider 1: OpenAI-compatible API (explicit configuration wins) ──
  const apiKey = process.env.OPENAI_API_KEY
  if (apiKey) {
    return openAICompletion(options)
  }

  // ── Provider 2: z-ai SDK (zero config) ──
  try {
    const zai = await getZaiClient()
    const data = await zai.chat.completions.create({
      messages: options.messages,
      ...(options.temperature !== undefined ? { temperature: options.temperature } : {}),
      ...(options.max_tokens ? { max_tokens: options.max_tokens } : {}),
      ...(options.model ? { model: options.model } : {}),
      thinking: { type: 'disabled' },
    })

    const content = data?.choices?.[0]?.message?.content
    if (!content) {
      throw new LLMError('Réponse vide du modèle LLM.', 'EMPTY_RESPONSE')
    }

    return {
      content,
      model: data.model || 'glm',
      usage: data.usage || undefined,
    }
  } catch (error) {
    if (error instanceof LLMError) throw error
    throw new LLMError(
      `Erreur SDK z-ai: ${error instanceof Error ? error.message : String(error)}`,
      'ZAI_ERROR'
    )
  }
}

/**
 * OpenAI-compatible chat completion via native fetch.
 */
async function openAICompletion(options: ChatCompletionOptions): Promise<ChatCompletionResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new LLMError(
      'OPENAI_API_KEY non configurée. Ajoutez-la dans vos variables d\'environnement.',
      'CONFIG_ERROR'
    )
  }

  const baseUrl = (process.env.OPENAI_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '')
  const model = options.model || process.env.OPENAI_MODEL || DEFAULT_MODEL

  const body = {
    model,
    messages: options.messages,
    temperature: options.temperature ?? 0.7,
    ...(options.max_tokens ? { max_tokens: options.max_tokens } : {}),
  }

  const url = `${baseUrl}/chat/completions`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '')
    throw new LLMError(
      `Erreur API LLM (${response.status}): ${errorBody || response.statusText}`,
      'API_ERROR'
    )
  }

  const data = await response.json()

  const content = data.choices?.[0]?.message?.content
  if (!content) {
    throw new LLMError(
      'Réponse vide du modèle LLM.',
      'EMPTY_RESPONSE'
    )
  }

  return {
    content,
    model: data.model || model,
    usage: data.usage || undefined,
  }
}

/**
 * Custom error class for LLM operations
 */
export class LLMError extends Error {
  public code: string

  constructor(message: string, code: string) {
    super(message)
    this.name = 'LLMError'
    this.code = code
  }
}

/**
 * Check if the LLM is configured and available.
 * Always true when z-ai SDK is installed (zero-config provider);
 * otherwise requires OPENAI_API_KEY.
 */
export function isLLMConfigured(): boolean {
  return true
}
