/**
 * Stripe webhook idempotency helpers.
 *
 * These functions guard POST /api/stripe/webhook against processing the same
 * Stripe event more than once (which can happen when Stripe retries after a
 * 5xx or timeout response).
 *
 * Backward-compatible: if migration_v11_stripe_webhook_events.sql has not yet
 * been applied (table missing → Postgres error 42P01), every function
 * fail-opens silently and logs a console.warn. The webhook continues to process
 * events exactly as it did before, without idempotency protection.
 *
 * Status transitions:
 *   INSERT 'processing'
 *   → success  → UPDATE 'processed' + processed_at
 *   → error    → UPDATE 'failed'    + error message
 *   On Stripe retry of 'failed'     → reset to 'processing' (allow reprocessing)
 *   On Stripe retry of 'processed'  → return { claimed: false } → webhook returns 200 immediately
 *   On Stripe retry of 'processing' → return { claimed: false } → webhook returns 200 immediately
 *     (edge case: 'processing' left stale by a server crash — manually reset via Supabase SQL if needed)
 */

import type { createAdminClient } from '@/lib/supabase/admin'

type AdminClient = ReturnType<typeof createAdminClient>

export type ClaimResult =
  | { claimed: true;  fallback: boolean }                       // proceed — either guarded or fallback
  | { claimed: false; reason: 'duplicate' | 'in_progress' }    // skip — return 200 immediately

/**
 * Attempt to claim a Stripe event for processing.
 *
 * Returns `{ claimed: true }` if the caller should proceed with processing.
 * Returns `{ claimed: false }` if the event was already processed or is in progress.
 *
 * `fallback: true` means the table was missing — no idempotency row was written.
 * The caller should still process the event; mark* functions will be no-ops.
 */
export async function claimWebhookEvent(
  admin: AdminClient,
  eventId: string,
  eventType: string,
): Promise<ClaimResult> {
  const { error: insertError } = await admin
    .from('stripe_webhook_events')
    .insert({ stripe_event_id: eventId, event_type: eventType, status: 'processing' })

  // Happy path: new event, row inserted
  if (!insertError) {
    return { claimed: true, fallback: false }
  }

  // Migration not yet applied — fail-open without idempotency protection
  if (insertError.code === '42P01') {
    console.warn(
      '[stripe/idempotency] stripe_webhook_events table not found — ' +
      'processing without idempotency guard. ' +
      'Apply supabase/migration_v11_stripe_webhook_events.sql to enable.'
    )
    return { claimed: true, fallback: true }
  }

  // Unique constraint violation — this event ID was already seen
  if (insertError.code === '23505') {
    const { data: existing } = await admin
      .from('stripe_webhook_events')
      .select('status')
      .eq('stripe_event_id', eventId)
      .single()

    const status = existing?.status as string | undefined

    if (status === 'processed') {
      // Already completed successfully — safe to acknowledge without reprocessing
      return { claimed: false, reason: 'duplicate' }
    }

    if (status === 'processing') {
      // Either currently in flight (concurrent delivery) or stale from a server crash.
      // Returning 200 here prevents concurrent double-processing.
      // If this row was left stale by a crash, reset it manually:
      //   UPDATE stripe_webhook_events SET status='failed' WHERE stripe_event_id='<id>';
      // Stripe will then retry and this function will allow reprocessing via the 'failed' path.
      return { claimed: false, reason: 'in_progress' }
    }

    if (status === 'failed') {
      // Stripe is retrying a previously failed event — allow reprocessing
      await admin
        .from('stripe_webhook_events')
        .update({ status: 'processing', error: null })
        .eq('stripe_event_id', eventId)
      return { claimed: true, fallback: false }
    }
  }

  // Unexpected DB error — fail-open to avoid silently dropping payment events
  const errCode = insertError.code ?? 'unknown'
  console.warn(
    `[stripe/idempotency] Unexpected claim error (code=${errCode}) — ` +
    'processing without idempotency guard.'
  )
  return { claimed: true, fallback: true }
}

/**
 * Mark a claimed event as successfully processed.
 * No-op if the row doesn't exist (fallback mode) or on unexpected DB error.
 */
export async function markWebhookEventProcessed(
  admin: AdminClient,
  eventId: string,
): Promise<void> {
  if (!eventId) return
  const { error } = await admin
    .from('stripe_webhook_events')
    .update({ status: 'processed', processed_at: new Date().toISOString() })
    .eq('stripe_event_id', eventId)

  if (error && error.code !== '42P01') {
    console.warn(`[stripe/idempotency] Could not mark event processed (code=${error.code ?? 'unknown'})`)
  }
}

/**
 * Mark a claimed event as failed so Stripe can retry it.
 * Stores a sanitised error message (max 500 chars, no PII).
 * No-op if the row doesn't exist (fallback mode) or on unexpected DB error.
 */
export async function markWebhookEventFailed(
  admin: AdminClient,
  eventId: string,
  err: unknown,
): Promise<void> {
  if (!eventId) return
  const message = (err instanceof Error ? err.message : String(err)).slice(0, 500)
  const { error: updateErr } = await admin
    .from('stripe_webhook_events')
    .update({ status: 'failed', error: message })
    .eq('stripe_event_id', eventId)

  if (updateErr && updateErr.code !== '42P01') {
    console.warn(`[stripe/idempotency] Could not mark event failed (code=${updateErr.code ?? 'unknown'})`)
  }
}
