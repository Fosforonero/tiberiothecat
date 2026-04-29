import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { getUserEntitlements } from '@/lib/entitlements'
import type { UserRole } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

const FORBIDDEN_NAMES = ['admin', 'splitvote', 'moderator']

export async function POST(req: NextRequest) {
  if (!Boolean(process.env.STRIPE_SECRET_KEY) || !Boolean(process.env.STRIPE_PRICE_ID_NAME_CHANGE)) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }

  // Lazy init — only called at runtime, never at build time
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-02-24.acacia',
  })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Admin (by email OR DB role) never pays for rename
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_premium, role')
    .eq('id', user.id)
    .single()

  const ents = getUserEntitlements({
    email: user.email,
    is_premium: profile?.is_premium ?? false,
    role: (profile?.role ?? 'user') as UserRole,
  })

  if (ents.unlimitedNameChanges) {
    return NextResponse.json({ error: 'Admin rename does not require payment' }, { status: 400 })
  }

  const { newName } = await req.json()

  if (!newName || typeof newName !== 'string') {
    return NextResponse.json({ error: 'newName required' }, { status: 400 })
  }
  const name = String(newName).trim()
  if (name.length < 2 || name.length > 32) {
    return NextResponse.json({ error: 'Name must be 2–32 characters' }, { status: 400 })
  }
  if (FORBIDDEN_NAMES.some(w => name.toLowerCase().includes(w))) {
    return NextResponse.json({ error: 'That name is reserved' }, { status: 400 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://splitvote.io'

  let session: Stripe.Checkout.Session
  try {
    session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: process.env.STRIPE_PRICE_ID_NAME_CHANGE!, quantity: 1 }],
      mode: 'payment',
      success_url: `${baseUrl}/profile?name_changed=1`,
      cancel_url: `${baseUrl}/profile?payment=cancelled`,
      metadata: { userId: user.id, newName: name, type: 'name_change' },
      customer_email: user.email ?? undefined,
    })
  } catch (err) {
    console.error('[stripe/checkout] sessions.create failed:', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Payment initiation failed' }, { status: 500 })
  }

  return NextResponse.json({ url: session.url })
}
