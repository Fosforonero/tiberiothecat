import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

const FORBIDDEN_NAMES = ['admin', 'splitvote', 'moderator']

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { newName } = await req.json()

  // Validate name
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

  // Create Stripe checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price: process.env.STRIPE_PRICE_ID_NAME_CHANGE!,
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${baseUrl}/profile?name_changed=1`,
    cancel_url: `${baseUrl}/profile?payment=cancelled`,
    metadata: {
      userId: user.id,
      newName: name,
      type: 'name_change',
    },
    // Pre-fill email if available
    customer_email: user.email ?? undefined,
    // Auto tax (optional — comment out if not configured in Stripe)
    // automatic_tax: { enabled: true },
  })

  return NextResponse.json({ url: session.url })
}
