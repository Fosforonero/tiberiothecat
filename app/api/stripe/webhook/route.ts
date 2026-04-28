import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  claimWebhookEvent,
  markWebhookEventProcessed,
  markWebhookEventFailed,
} from '@/lib/stripe-webhook-events'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  if (!Boolean(process.env.STRIPE_SECRET_KEY) || !Boolean(process.env.STRIPE_WEBHOOK_SECRET)) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' })

  const body = await req.text()
  const sig  = req.headers.get('stripe-signature')

  if (!sig) return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('[stripe/webhook] Signature error:', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  let admin: ReturnType<typeof createAdminClient>
  try {
    admin = createAdminClient()
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[stripe/webhook] createAdminClient failed:', msg)
    return NextResponse.json({ error: 'Server config error' }, { status: 500 })
  }

  // ── Idempotency claim ─────────────────────────────────────────────────────
  // Prevents double-processing when Stripe retries after a 5xx or timeout.
  // Backward-compatible: if migration_v11 is not yet applied, claim returns
  // { claimed: true, fallback: true } and processing continues as before.
  const claim = await claimWebhookEvent(admin, event.id, event.type)
  if (!claim.claimed) {
    // Already processed or currently in flight — acknowledge safely
    return NextResponse.json({ received: true, duplicate: true })
  }

  // ── Process event ─────────────────────────────────────────────────────────
  try {
    await processStripeEvent(event, admin)
  } catch (err) {
    // Mark failed so Stripe can retry; returning 500 triggers Stripe's retry schedule
    await markWebhookEventFailed(admin, event.id, err)
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }

  await markWebhookEventProcessed(admin, event.id)
  return NextResponse.json({ received: true })
}

// ── Event handler ─────────────────────────────────────────────────────────────
// Throws on errors that should cause Stripe to retry (payment-critical paths).
// Logs-and-continues on errors that are non-critical (subscription sync).
// Does NOT log email addresses, display names, full metadata, or Stripe payloads.

async function processStripeEvent(
  event: Stripe.Event,
  admin: ReturnType<typeof createAdminClient>,
): Promise<void> {

  // ── checkout.session.completed ──────────────────────────────────────────
  if (event.type === 'checkout.session.completed') {
    const session  = event.data.object as Stripe.Checkout.Session
    const userId   = session.metadata?.userId
    const type     = session.metadata?.type
    const customer = typeof session.customer === 'string' ? session.customer : session.customer?.id

    // Always persist stripe_customer_id when we have a userId
    if (userId && customer) {
      await admin.from('profiles').update({ stripe_customer_id: customer }).eq('id', userId)
    }

    // ── one-time name change ──
    if (type === 'name_change') {
      const newName = session.metadata?.newName
      if (!userId || !newName || session.payment_status !== 'paid') return

      const { data: profile } = await admin
        .from('profiles').select('name_changes').eq('id', userId).single()

      const currentChanges = (profile?.name_changes ?? 0) as number

      const { error } = await admin
        .from('profiles')
        .update({ display_name: newName, name_changes: currentChanges + 1 })
        .eq('id', userId)

      if (error) {
        console.error('[stripe/webhook] name_change update failed:', error.code)
        throw new Error('name_change DB update failed')
      }
      console.log(`✅ Name change: user=${userId.slice(0, 8)} (#${currentChanges + 1})`)
    }

    // ── subscription checkout completed ──
    if (type === 'subscription' && session.mode === 'subscription') {
      if (!userId) return

      const subId = typeof session.subscription === 'string'
        ? session.subscription
        : (session.subscription as Stripe.Subscription | null)?.id ?? null

      const { error } = await admin
        .from('profiles')
        .update({
          is_premium:             true,
          stripe_subscription_id: subId,
          subscription_status:    'active',
        })
        .eq('id', userId)

      if (error) {
        console.error('[stripe/webhook] premium activation failed:', error.code)
        throw new Error('premium activation DB update failed')
      }
      console.log(`✅ Premium activated: user=${userId.slice(0, 8)}`)
    }
  }

  // ── customer.subscription.updated ──────────────────────────────────────
  if (event.type === 'customer.subscription.updated') {
    const sub        = event.data.object as Stripe.Subscription
    const customerId = typeof sub.customer === 'string' ? sub.customer : (sub.customer as Stripe.Customer).id
    const status     = sub.status
    const isPremium  = status === 'active' || status === 'trialing'

    const { error } = await admin
      .from('profiles')
      .update({
        is_premium:             isPremium,
        stripe_subscription_id: sub.id,
        subscription_status:    status,
      })
      .eq('stripe_customer_id', customerId)

    if (error) console.error('[stripe/webhook] subscription.updated sync failed:', error.code)
    console.log(`✅ Subscription updated: customer=${customerId.slice(0, 12)} status=${status}`)
  }

  // ── customer.subscription.deleted ──────────────────────────────────────
  if (event.type === 'customer.subscription.deleted') {
    const sub        = event.data.object as Stripe.Subscription
    const customerId = typeof sub.customer === 'string' ? sub.customer : (sub.customer as Stripe.Customer).id

    const { error } = await admin
      .from('profiles')
      .update({
        is_premium:             false,
        stripe_subscription_id: null,
        subscription_status:    'cancelled',
      })
      .eq('stripe_customer_id', customerId)

    if (error) console.error('[stripe/webhook] subscription.deleted sync failed:', error.code)
    console.log(`✅ Subscription cancelled: customer=${customerId.slice(0, 12)}`)
  }
}
