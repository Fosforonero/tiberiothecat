import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    if (session.metadata?.type !== 'name_change') {
      return NextResponse.json({ received: true })
    }

    const userId  = session.metadata?.userId
    const newName = session.metadata?.newName

    if (!userId || !newName || session.payment_status !== 'paid') {
      return NextResponse.json({ received: true })
    }

    const admin = createAdminClient()

    // Fetch current name_changes count
    const { data: profile } = await admin
      .from('profiles')
      .select('name_changes')
      .eq('id', userId)
      .single()

    const currentChanges = (profile?.name_changes ?? 0) as number

    // Apply name change
    const { error } = await admin
      .from('profiles')
      .update({
        display_name: newName,
        name_changes: currentChanges + 1,
      })
      .eq('id', userId)

    if (error) {
      console.error('Webhook: failed to update profile:', error)
      return NextResponse.json({ error: 'DB update failed' }, { status: 500 })
    }

    console.log(`✅ Name change: user=${userId.slice(0,8)} → "${newName}" (change #${currentChanges + 1})`)
  }

  return NextResponse.json({ received: true })
}
