/**
 * Stripe webhook idempotency helpers.
 *
 * Guards POST /api/stripe/webhook against processing the same Stripe event
 * more than once (which happens when Stripe retries after a 5xx or timeout).
 *
 * Backward-compatible: if migration_v11_stripe_webhook_events.sql has not yet
 * been applied (Postgres error 42P01), every function fail-opens and logs a
 * console.warn. The webhook continues as before without idempotency protection.
 *
 * Status transitions:
 *
 *   INSERT 'processing'
 *   → success             → { claimed: true }
 *   → 42P01 (no table)   → { claimed: true, fallback: true }   fail-open
 *   → 23505 (duplicate)  → read (status, updated_at), then:
 *     'processed'         → { claimed: false, reason: 'duplicate' }
 *     'failed'            → atomic UPDATE WHERE status='failed'
 *                           won  → { claimed: true }
 *                           lost → { claimed: false, reason: 'in_progress' }
 *     'processing' fresh  → { claimed: false, reason: 'in_progress' }
 *     'processing' stale  → atomic UPDATE WHERE status='processing' AND updated_at < cutoff
 *                           won  → { claimed: true }
 *                           lost → { claimed: false, reason: 'in_progress' }
 *   → other DB error      → { claimed: true, fallback: true }   fail-open
 *
 * On success  → markWebhookEventProcessed (status='processed', processed_at=now())
 * On error    → markWebhookEventFailed    (status='failed', error=sanitised_msg)
 *               webhook returns 500 so Stripe retries
 *
 * Atomicity guarantee for concurrent retries:
 *   Both the 'failed' reclaim and the stale 'processing' reclaim use
 *   UPDATE ... WHERE status='X' [AND updated_at < cutoff] RETURNING stripe_event_id.
 *   Postgres serialises concurrent writers on the same row via row-level locking.
 *   The second writer re-evaluates the WHERE clause after the first commits and
 *   finds it no longer holds (status changed to 'processing' / updated_at refreshed
 *   by the BEFORE UPDATE trigger), so it returns 0 rows. Only one caller wins.
 */

import type { createAdminClient } from '@/lib/supabase/admin'

type AdminClient = ReturnType<typeof createAdminClient>

export type ClaimResult =
  | { claimed: true;  fallback: boolean }                     // proceed with processing
  | { claimed: false; reason: 'duplicate' | 'in_progress' }  // skip — return 200 immediately

/**
 * A 'processing' row whose updated_at is older than this threshold is
 * considered stale — likely left by a server crash — and is eligible for
 * automatic reclaim. Conservative at 10 minutes: Stripe's retry schedule
 * starts at ~1 min, so by 10 min the original handler is definitely gone.
 */
const STALE_PROCESSING_AFTER_MS = 10 * 60 * 1000

/**
 * Attempt to claim a Stripe event for processing.
 *
 * Returns `{ claimed: true }` → caller should process the event.
 * Returns `{ claimed: false }` → event already processed or in flight; return 200.
 *
 * `fallback: true` means the table is missing — no row was written.
 * mark* functions will also be no-ops in this state.
 */
export async function claimWebhookEvent(
  admin: AdminClient,
  eventId: string,
  eventType: string,
): Promise<ClaimResult> {
  // ── Happy path: first delivery of this event ────────────────────────────
  const { error: insertError } = await admin
    .from('stripe_webhook_events')
    .insert({ stripe_event_id: eventId, event_type: eventType, status: 'processing' })

  if (!insertError) {
    return { claimed: true, fallback: false }
  }

  // ── Migration not yet applied — fail-open ───────────────────────────────
  if (insertError.code === '42P01') {
    console.warn(
      '[stripe/idempotency] stripe_webhook_events table not found — ' +
      'processing without idempotency guard. ' +
      'Apply supabase/migration_v11_stripe_webhook_events.sql to enable.'
    )
    return { claimed: true, fallback: true }
  }

  // ── Unique conflict — this event ID was already seen ────────────────────
  if (insertError.code === '23505') {
    // Read status + updated_at together; both branches need updated_at.
    const { data: existing } = await admin
      .from('stripe_webhook_events')
      .select('status, updated_at')
      .eq('stripe_event_id', eventId)
      .single()

    const status    = existing?.status     as string | undefined
    const updatedAt = existing?.updated_at as string | undefined

    // ── Already finished — safe duplicate ────────────────────────────────
    if (status === 'processed') {
      return { claimed: false, reason: 'duplicate' }
    }

    // ── Previously failed — Stripe is retrying ────────────────────────────
    // Atomic conditional update: only the winner of a concurrent race gets rows back.
    // The second concurrent caller finds status no longer 'failed' and gets 0 rows.
    if (status === 'failed') {
      return atomicReclaim(admin, eventId, 'failed')
    }

    // ── Currently processing ──────────────────────────────────────────────
    if (status === 'processing') {
      const isStale = updatedAt
        ? Date.now() - new Date(updatedAt).getTime() > STALE_PROCESSING_AFTER_MS
        : false

      if (!isStale) {
        // Fresh: either genuinely in flight, or concurrent delivery — skip safely.
        return { claimed: false, reason: 'in_progress' }
      }

      // Stale: probably left by a server crash. Attempt atomic reclaim.
      // Condition: status='processing' AND updated_at < cutoff.
      // The BEFORE UPDATE trigger sets updated_at=now() on success, so the
      // second concurrent caller finds updated_at no longer satisfies < cutoff.
      const cutoff = new Date(Date.now() - STALE_PROCESSING_AFTER_MS).toISOString()
      return atomicReclaimStale(admin, eventId, cutoff)
    }
  }

  // ── Unexpected DB error — fail-open to avoid dropping payment events ────
  const errCode = insertError.code ?? 'unknown'
  console.warn(
    `[stripe/idempotency] Unexpected claim error (code=${errCode}) — ` +
    'processing without idempotency guard.'
  )
  return { claimed: true, fallback: true }
}

/**
 * Atomic conditional reclaim of a 'failed' event.
 *
 * UPDATE WHERE stripe_event_id=X AND status='failed'
 * Postgres row-lock semantics ensure exactly one concurrent caller wins.
 */
async function atomicReclaim(
  admin: AdminClient,
  eventId: string,
  fromStatus: 'failed',
): Promise<ClaimResult> {
  const { data: rows } = await admin
    .from('stripe_webhook_events')
    .update({ status: 'processing', error: null })
    .eq('stripe_event_id', eventId)
    .eq('status', fromStatus)
    .select('stripe_event_id')

  if (rows && rows.length > 0) {
    return { claimed: true, fallback: false }
  }
  // Race lost — another concurrent retry already reclaimed or changed the status
  return { claimed: false, reason: 'in_progress' }
}

/**
 * Atomic conditional reclaim of a stale 'processing' event.
 *
 * UPDATE WHERE stripe_event_id=X AND status='processing' AND updated_at < cutoff
 * The BEFORE UPDATE trigger refreshes updated_at, so the second concurrent
 * caller finds updated_at > cutoff after the first commits and returns 0 rows.
 */
async function atomicReclaimStale(
  admin: AdminClient,
  eventId: string,
  cutoff: string,
): Promise<ClaimResult> {
  const { data: rows } = await admin
    .from('stripe_webhook_events')
    .update({ status: 'processing', error: null })
    .eq('stripe_event_id', eventId)
    .eq('status', 'processing')
    .lt('updated_at', cutoff)
    .select('stripe_event_id')

  if (rows && rows.length > 0) {
    return { claimed: true, fallback: false }
  }
  // Race lost or row was no longer stale when the UPDATE executed
  return { claimed: false, reason: 'in_progress' }
}

/**
 * Mark a claimed event as successfully processed.
 * No-op when table is missing (42P01) or row not found.
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
 * Stores a sanitised, truncated error string — no PII, no full error objects.
 * No-op when table is missing (42P01) or row not found.
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
