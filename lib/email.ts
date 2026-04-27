import { Resend } from 'resend'

export interface SendEmailOptions {
  to: string
  subject: string
  html: string
  replyTo?: string
}

export interface SendEmailResult {
  ok: boolean
  id?: string
  error?: string
}

// Instantiated per-call so env vars are always fresh (important for server-side hot reload).
// Returns { ok: false } silently if RESEND_API_KEY is not set — never throws.
export async function sendEmail(opts: SendEmailOptions): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return { ok: false, error: 'email_not_configured' }
  }

  const from = process.env.EMAIL_FROM ?? 'SplitVote <hello@splitvote.io>'

  try {
    const resend = new Resend(apiKey)
    const { data, error } = await resend.emails.send({
      from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      ...(opts.replyTo ? { replyTo: opts.replyTo } : {}),
    })

    if (error) {
      // error.name is a safe enum (e.g. 'rate_limit_exceeded') — never contains secrets or PII
      console.error('[email] send error:', error.name)
      return { ok: false, error: error.name }
    }

    return { ok: true, id: data?.id ?? undefined }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'send_failed'
    console.error('[email] unexpected error:', msg)
    return { ok: false, error: 'send_failed' }
  }
}
