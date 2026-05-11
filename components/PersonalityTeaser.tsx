'use client'

/**
 * PersonalityTeaser — lightweight client banner shown on homepage to logged-in users
 * who haven't visited /personality or dismissed this card in the last 7 days.
 *
 * Uses the same localStorage key (`sv_personality_teaser_dismissed`) as the
 * results-page teaser so a dismiss on either surface suppresses the other.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Props {
  locale?: 'en' | 'it'
}

const STORAGE_KEY = 'sv_personality_teaser_dismissed'
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000

export default function PersonalityTeaser({ locale = 'en' }: Props) {
  const [show, setShow] = useState(false)
  const isIT = locale === 'it'

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser()
      .then(({ data: { user } }) => {
        if (!user) return
        try {
          const dismissed = localStorage.getItem(STORAGE_KEY)
          if (!dismissed || Date.now() - parseInt(dismissed, 10) > SEVEN_DAYS) {
            setShow(true)
          }
        } catch { /* localStorage unavailable */ }
      })
      .catch(() => { /* non-blocking */ })
  }, [])

  if (!show) return null

  const dismiss = () => {
    try { localStorage.setItem(STORAGE_KEY, String(Date.now())) } catch { /* noop */ }
    setShow(false)
  }

  return (
    <div className="rounded-2xl border border-purple-500/25 bg-purple-500/5 p-5 mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div className="flex-1 min-w-0">
        <p className="font-bold text-white text-sm mb-1">
          {isIT
            ? '🧠 I tuoi voti stanno rivelando un pattern'
            : '🧠 Your votes are revealing a pattern'}
        </p>
        <p className="text-xs text-[var(--muted)] leading-relaxed">
          {isIT
            ? 'Scopri il tuo Tipo di Personalità Morale — sei un Guardian, Strategist o Empath?'
            : 'Discover your Moral Personality Type — are you a Guardian, Strategist, or Empath?'}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
        <Link
          href={isIT ? '/it/personality' : '/personality'}
          className="flex-1 sm:flex-none text-center text-sm font-bold px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-colors min-h-[48px] flex items-center justify-center"
        >
          {isIT ? 'Scopri il tuo tipo morale →' : 'See your moral type →'}
        </Link>
        <button
          type="button"
          aria-label={isIT ? 'Chiudi' : 'Dismiss'}
          onClick={dismiss}
          className="flex-shrink-0 w-10 h-10 rounded-xl border border-white/10 text-[var(--muted)] hover:text-white hover:border-white/25 transition-colors flex items-center justify-center text-lg leading-none"
        >
          ×
        </button>
      </div>
    </div>
  )
}
