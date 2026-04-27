/**
 * Server-only OpenRouter helper.
 * Never import this in client components — API key is server-side only.
 */

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1'

export function isOpenRouterConfigured(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY) && Boolean(process.env.OPENROUTER_MODEL_DRAFT)
}

export interface GenerateInput {
  system: string
  prompt: string
  model?: string
}

export type GenerateResult =
  | { ok: true; text: string }
  | { ok: false; error: string }

export async function generateWithOpenRouter(
  input: GenerateInput,
  timeoutMs = 30_000,
): Promise<GenerateResult> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) return { ok: false, error: 'openrouter_not_configured' }

  const model = input.model ?? process.env.OPENROUTER_MODEL_DRAFT
  if (!model) return { ok: false, error: 'openrouter_model_not_configured' }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://splitvote.io',
        'X-Title': 'SplitVote',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: input.system },
          { role: 'user',   content: input.prompt  },
        ],
        temperature: 0.85,
        max_tokens: 1400,
      }),
    })

    if (!res.ok) {
      // Status only — no body logged (may contain account details)
      return { ok: false, error: `openrouter_http_${res.status}` }
    }

    const json = await res.json() as {
      choices?: Array<{ message?: { content?: string } }>
      error?: { message?: string }
    }

    if (json.error) {
      // Error type only — no user-visible message from model provider
      return { ok: false, error: 'openrouter_api_error' }
    }

    const text = json.choices?.[0]?.message?.content ?? ''
    if (!text) return { ok: false, error: 'openrouter_empty_response' }

    return { ok: true, text }
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return { ok: false, error: 'openrouter_timeout' }
    }
    return { ok: false, error: 'openrouter_fetch_failed' }
  } finally {
    clearTimeout(timer)
  }
}
