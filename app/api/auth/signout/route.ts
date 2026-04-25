import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  // Use the incoming request's origin so the redirect stays on the same domain (www or not)
  // Status 303 converts the POST redirect into a GET, preventing the homepage from seeing a POST
  const origin = new URL(request.url).origin
  return NextResponse.redirect(`${origin}/`, { status: 303 })
}
