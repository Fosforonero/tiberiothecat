import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCosmeticItemId, COSMETIC_MAP } from '@/lib/cosmetics-store'
import {
  PRODUCT_BY_ID,
  findProductByStripePriceId,
  type ProductId,
} from '@/lib/purchases'
import {
  claimWebhookEvent,
  markWebhookEventProcessed,
  markWebhookEventFailed,
} from '@/lib/stripe-webhook-events'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function isProductId(value: unknown): value is ProductId {
  return typeof value === 'string' && value in PRODUCT_BY_ID
}

function paymentIntentId(value: Stripe.PaymentIntent | string | null): string | null {
  if (!value) return null
  return typeof value === 'string' ? value : value.id
}

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-02-24.acacia',
  })

  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Stripe webhook signature error:', err)
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

  // Idempotency guard — Stripe retries on 5xx/timeout; XP grants and
  // name_change counters are read-modify-write and would double-apply.
  const claim = await claimWebhookEvent(admin, event.id, event.type)
  if (!claim.claimed) {
    return NextResponse.json({ received: true, skipped: claim.reason })
  }

  let res: NextResponse
  try {
    res = await handleEvent(stripe, admin, event)
  } catch (err) {
    await markWebhookEventFailed(admin, event.id, err)
    console.error('[stripe/webhook] Unhandled handler error:', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Handler error' }, { status: 500 })
  }

  if (res.status >= 400) {
    await markWebhookEventFailed(admin, event.id, `handler returned ${res.status}`)
  } else {
    await markWebhookEventProcessed(admin, event.id)
  }
  return res
}

async function handleEvent(
  stripe: Stripe,
  admin: ReturnType<typeof createAdminClient>,
  event: Stripe.Event,
): Promise<NextResponse> {
  // ── checkout.session.completed ──────────────────────────────────────────────
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    // Subscription checkouts can complete as 'no_payment_required'
    if (session.payment_status !== 'paid' && session.payment_status !== 'no_payment_required') {
      return NextResponse.json({ received: true })
    }

    const type   = session.metadata?.type
    const userId = session.metadata?.userId

    // ── Premium subscription activated ────────────────────────────────────────
    if (type === 'subscription') {
      if (!userId) {
        console.warn('[webhook] subscription: missing userId metadata', session.id)
        return NextResponse.json({ received: true })
      }

      const customerId = typeof session.customer === 'string'
        ? session.customer
        : session.customer?.id ?? null
      const subscriptionId = typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription?.id ?? null

      const { error } = await admin
        .from('profiles')
        .update({
          is_premium: true,
          ...(customerId ? { stripe_customer_id: customerId } : {}),
          ...(subscriptionId ? { stripe_subscription_id: subscriptionId } : {}),
        })
        .eq('id', userId)

      if (error) {
        console.error('[webhook] Failed to activate premium:', error)
        return NextResponse.json({ error: 'DB update failed' }, { status: 500 })
      }

      console.log(`✅ Premium activated: user=${userId.slice(0, 8)} sub=${subscriptionId ?? 'n/a'}`)
    }

    // ── Name change ───────────────────────────────────────────────────────────
    if (type === 'name_change') {
      const newName = session.metadata?.newName
      if (!userId || !newName) return NextResponse.json({ received: true })

      const { data: profile } = await admin
        .from('profiles')
        .select('name_changes')
        .eq('id', userId)
        .single()

      const currentChanges = (profile?.name_changes ?? 0) as number

      const { error } = await admin
        .from('profiles')
        .update({ display_name: newName, name_changes: currentChanges + 1 })
        .eq('id', userId)

      if (error) {
        console.error('Webhook: failed to update profile (name_change):', error)
        return NextResponse.json({ error: 'DB update failed' }, { status: 500 })
      }

      console.log(`✅ Name change: user=${userId.slice(0, 8)} → "${newName}" (change #${currentChanges + 1})`)
    }

    // ── One-time catalog purchase (current Store flow) ───────────────────────
    if (type === 'one_time_purchase') {
      const productId = session.metadata?.productId
      const paymentIntent = paymentIntentId(session.payment_intent)

      if (!userId || !isProductId(productId) || !paymentIntent) {
        console.warn('[webhook] one_time_purchase: missing or invalid metadata', session.metadata)
        return NextResponse.json({ received: true })
      }

      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 })
      const stripePriceId = lineItems.data[0]?.price?.id
      const product = PRODUCT_BY_ID[productId]
      const verifiedProduct = stripePriceId ? findProductByStripePriceId(stripePriceId) : null

      if (!verifiedProduct || verifiedProduct.id !== productId) {
        console.error('[webhook] one_time_purchase: Stripe price mismatch', {
          sessionId: session.id,
          productId,
          stripePriceId,
        })
        return NextResponse.json({ error: 'Price/product mismatch' }, { status: 400 })
      }

      const { error: purchaseError } = await admin
        .from('user_purchases')
        .upsert(
          {
            user_id:                  userId,
            product_id:               productId,
            product_type:             product.type,
            stripe_payment_intent_id: paymentIntent,
            stripe_session_id:        session.id,
            amount_cents:             session.amount_total ?? product.priceCents,
            currency:                 session.currency ?? 'eur',
            status:                   'completed',
            purchased_at:             new Date().toISOString(),
            refunded_at:              null,
          },
          { onConflict: 'user_id,product_id' },
        )

      if (purchaseError) {
        console.error('[webhook] Failed to upsert one_time_purchase:', purchaseError)
        return NextResponse.json({ error: 'DB insert failed' }, { status: 500 })
      }

      console.log(`✅ One-time purchase: user=${userId.slice(0, 8)} → "${productId}"`)
    }

    // ── Cosmetic purchase (pixie_purchase legacy + cosmetic_purchase) ──────────
    if (type === 'pixie_purchase' || type === 'cosmetic_purchase') {
      const productId = session.metadata?.productId
      const category  = session.metadata?.category ?? 'pixie'
      const paymentIntent = paymentIntentId(session.payment_intent)

      if (!userId || !productId || !isCosmeticItemId(productId) || !paymentIntent) {
        console.warn('[webhook] cosmetic_purchase: missing or invalid metadata', session.metadata)
        return NextResponse.json({ received: true })
      }

      const item = COSMETIC_MAP[productId]

      // Record the purchase
      const { error: purchaseError } = await admin
        .from('user_purchases')
        .upsert(
          {
            user_id:                  userId,
            product_id:               productId,
            product_type:             item.category,
            stripe_payment_intent_id: paymentIntent,
            stripe_session_id:        session.id,
            amount_cents:             session.amount_total ?? item.priceCents,
            currency:                 session.currency ?? 'eur',
            status:                   'completed',
            purchased_at:             new Date().toISOString(),
            refunded_at:              null,
          },
          { onConflict: 'user_id,product_id' },
        )

      if (purchaseError) {
        console.error('[webhook] Failed to insert user_purchase:', purchaseError)
        return NextResponse.json({ error: 'DB insert failed' }, { status: 500 })
      }

      // Grant XP + update cosmetic state
      const { data: profile } = await admin
        .from('profiles')
        .select('pixie_xp, xp')
        .eq('id', userId)
        .single()

      const currentXp    = (profile?.xp ?? 0) as number
      const profileUpdate: Record<string, unknown> = { xp: currentXp + item.xpBonus }

      if (category === 'pixie') {
        const currentPixieXp = (profile?.pixie_xp ?? {}) as Record<string, unknown>
        const ownedItems     = Array.isArray(currentPixieXp.owned) ? currentPixieXp.owned as string[] : []
        profileUpdate.pixie_xp = {
          ...currentPixieXp,
          owned: Array.from(new Set([...ownedItems, productId])),
        }
      } else if (category === 'frame') {
        profileUpdate.equipped_frame = productId
      } else if (category === 'glow') {
        profileUpdate.equipped_glow = productId
      } else if (category === 'name_color') {
        profileUpdate.name_color = 'gradient' // default to first color
      }

      const { error: profileError } = await admin
        .from('profiles')
        .update(profileUpdate)
        .eq('id', userId)

      if (profileError) {
        console.error('[webhook] Failed to update profile (cosmetic_purchase):', profileError)
        return NextResponse.json({ error: 'DB update failed' }, { status: 500 })
      }

      console.log(`✅ Cosmetic [${category}]: user=${userId.slice(0, 8)} → "${productId}" (+${item.xpBonus} XP)`)
    }
  }

  // ── customer.subscription.updated / deleted ────────────────────────────────
  // Keeps is_premium in sync with the Stripe subscription lifecycle:
  // cancellations, payment failures, and reactivations. 'past_due' is left
  // untouched (Stripe's own retry/grace window decides the final state).
  if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription
    const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id

    const { data: profile } = await admin
      .from('profiles')
      .select('id, is_premium')
      .or(`stripe_subscription_id.eq.${sub.id},stripe_customer_id.eq.${customerId}`)
      .maybeSingle()

    if (!profile) {
      console.warn(`[webhook] ${event.type}: no profile for customer=${customerId} sub=${sub.id}`)
      return NextResponse.json({ received: true })
    }

    const ended = event.type === 'customer.subscription.deleted'
      || sub.status === 'canceled'
      || sub.status === 'unpaid'
      || sub.status === 'incomplete_expired'
      || sub.status === 'paused'
    const active = sub.status === 'active' || sub.status === 'trialing'

    if (ended && profile.is_premium) {
      const { error } = await admin
        .from('profiles')
        .update({ is_premium: false, stripe_subscription_id: null })
        .eq('id', profile.id)
      if (error) {
        console.error('[webhook] Failed to revoke premium:', error)
        return NextResponse.json({ error: 'DB update failed' }, { status: 500 })
      }
      console.log(`↩️ Premium revoked: user=${profile.id.slice(0, 8)} (sub ${sub.status})`)
    } else if (active && !profile.is_premium) {
      const { error } = await admin
        .from('profiles')
        .update({ is_premium: true, stripe_subscription_id: sub.id, stripe_customer_id: customerId })
        .eq('id', profile.id)
      if (error) {
        console.error('[webhook] Failed to re-activate premium:', error)
        return NextResponse.json({ error: 'DB update failed' }, { status: 500 })
      }
      console.log(`✅ Premium re-activated: user=${profile.id.slice(0, 8)}`)
    }
  }

  // ── charge.refunded ─────────────────────────────────────────────────────────
  if (event.type === 'charge.refunded') {
    const charge    = event.data.object as Stripe.Charge
    const paymentIntent = typeof charge.payment_intent === 'string' ? charge.payment_intent : null

    if (!paymentIntent) return NextResponse.json({ received: true })

    const { data: purchase } = await admin
      .from('user_purchases')
      .select('id, user_id, product_id, status')
      .eq('stripe_payment_intent_id', paymentIntent)
      .maybeSingle()

    if (!purchase || purchase.status === 'refunded') {
      return NextResponse.json({ received: true })
    }

    await admin
      .from('user_purchases')
      .update({ status: 'refunded', refunded_at: new Date().toISOString() })
      .eq('id', purchase.id)

    // Reverse cosmetic state + deduct XP
    if (isCosmeticItemId(purchase.product_id)) {
      const item = COSMETIC_MAP[purchase.product_id]

      const { data: profile } = await admin
        .from('profiles')
        .select('pixie_xp, xp')
        .eq('id', purchase.user_id)
        .single()

      const currentXp = (profile?.xp ?? 0) as number
      const profileUpdate: Record<string, unknown> = {
        xp: Math.max(0, currentXp - item.xpBonus),
      }

      if (item.category === 'pixie') {
        const currentPixieXp = (profile?.pixie_xp ?? {}) as Record<string, unknown>
        const ownedItems     = Array.isArray(currentPixieXp.owned) ? currentPixieXp.owned as string[] : []
        const newOwned       = ownedItems.filter(i => i !== purchase.product_id)
        // Also clear the active pixie if the refunded skin was equipped
        const activePixie    = typeof currentPixieXp.active === 'string' ? currentPixieXp.active : null
        profileUpdate.pixie_xp = {
          ...currentPixieXp,
          owned:  newOwned,
          active: activePixie === purchase.product_id ? null : activePixie,
        }
        // Also clear the use_pixie_avatar flag if no skins remain
        if (newOwned.length === 0) profileUpdate.use_pixie_avatar = false
      } else if (item.category === 'frame') {
        profileUpdate.equipped_frame = null
      } else if (item.category === 'glow') {
        profileUpdate.equipped_glow = null
      } else if (item.category === 'name_color') {
        profileUpdate.name_color = null
      }

      await admin
        .from('profiles')
        .update(profileUpdate)
        .eq('id', purchase.user_id)

      console.log(`↩️ Refund [${item.category}]: user=${purchase.user_id.slice(0, 8)} ← "${purchase.product_id}"`)
    }
  }

  return NextResponse.json({ received: true })
}
