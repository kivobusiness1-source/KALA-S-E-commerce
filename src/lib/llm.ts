/**
 * LLM Utility — OpenAI-compatible chat completions via native fetch
 * 
 * Zero external dependency. Works with:
 *   - OpenAI (official)
 *   - Groq, Together, Mistral, Fireworks, etc.
 *   - Local LLMs via Ollama / LM Studio
 * 
 * Environment variables:
 *   OPENAI_API_KEY   — API key (required)
 *   OPENAI_BASE_URL  — Base URL (default: https://api.openai.com/v1)
 *   OPENAI_MODEL     — Model name (default: gpt-4o-mini)
 */

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

/**
 * Send a chat completion request to any OpenAI-compatible API.
 */
export async function chatCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResult> {
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
 * Check if the LLM is configured and available
 */
export function isLLMConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY
}
