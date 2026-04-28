import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function POST(_req: NextRequest) {
  if (!Boolean(process.env.STRIPE_SECRET_KEY) || !Boolean(process.env.STRIPE_PRICE_ID_PREMIUM)) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let admin: ReturnType<typeof createAdminClient>
  try {
    admin = createAdminClient()
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[stripe/subscription] createAdminClient failed:', msg)
    return NextResponse.json({ error: 'Server config error' }, { status: 500 })
  }

  const { data: profile } = await admin
    .from('profiles')
    .select('stripe_customer_id, is_premium')
    .eq('id', user.id)
    .single()

  if (profile?.is_premium) {
    return NextResponse.json({ error: 'Already premium' }, { status: 409 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://splitvote.io'

  let session: Stripe.Checkout.Session
  try {
    session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: process.env.STRIPE_PRICE_ID_PREMIUM!, quantity: 1 }],
      mode: 'subscription',
      success_url: `${baseUrl}/profile?premium=activated`,
      cancel_url:  `${baseUrl}/profile?premium=cancelled`,
      metadata: { userId: user.id, type: 'subscription' },
      ...(profile?.stripe_customer_id
        ? { customer: profile.stripe_customer_id }
        : { customer_email: user.email ?? undefined }),
    })
  } catch (err) {
    console.error('[stripe/subscription] sessions.create failed:', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Payment initiation failed' }, { status: 500 })
  }

  return NextResponse.json({ url: session.url })
}
