import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { birth_year, gender, country_code } = await request.json()

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const update: Record<string, unknown> = { onboarding_done: true }
    if (birth_year && Number(birth_year) >= 1920 && Number(birth_year) <= 2015) {
      update.birth_year = Number(birth_year)
    }
    if (gender && ['male', 'female', 'non_binary', 'prefer_not'].includes(gender)) {
      update.gender = gender
    }
    if (country_code && typeof country_code === 'string' && country_code.length === 2) {
      update.country_code = country_code.toUpperCase()
    }

    await supabase.from('profiles').update(update).eq('id', user.id)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[onboarding]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
