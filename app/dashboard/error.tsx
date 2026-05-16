'use client'

/**
 * Error boundary for /dashboard — catches any server- or client-side render
 * crash and shows a graceful retry UI instead of the raw "Application error"
 * page. The digest is rendered so PM/user can correlate with Vercel logs.
 *
 * Triggered for example when:
 * - A required Supabase column is missing (migration not applied)
 * - Redis becomes unavailable mid-render after the try/catch path
 * - An unexpected null shape in user profile data
 */

import { useEffect } from 'react'
import Link from 'next/link'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function DashboardError({ error, reset }: Props) {
  useEffect(() => {
    // Stream the real error message to the browser console for users who
    // open DevTools, while also showing up in Vercel function logs via the
    // server-side render before the boundary kicks in.
    // Avoid leaking stack traces in production UI; only log to console.
    console.error('[dashboard/error]', error.message, 'digest:', error.digest)
  }, [error])

  const isIT = typeof document !== 'undefined' && document.documentElement.lang === 'it'

  return (
    <main className="max-w-xl mx-auto px-4 py-20 text-center">
      <div className="text-5xl mb-4" aria-hidden="true">😵</div>
      <h1 className="text-2xl font-black text-white mb-2">
        {isIT ? 'Qualcosa è andato storto' : 'Something went wrong'}
      </h1>
      <p className="text-[var(--muted)] text-sm mb-6">
        {isIT
          ? 'Stiamo cercando di caricare la tua dashboard ma è arrivato un errore. Riprova fra qualche secondo o torna alla home.'
          : 'We tried to load your dashboard but ran into an error. Try again in a moment, or head back home.'}
      </p>

      {error.digest && (
        <p className="text-[10px] text-white/30 font-mono mb-6">
          digest: {error.digest}
        </p>
      )}

      <div className="flex gap-3 justify-center flex-wrap">
        <button
          onClick={reset}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-colors"
        >
          {isIT ? 'Riprova' : 'Try again'}
        </button>
        <Link
          href={isIT ? '/it' : '/'}
          className="px-5 py-2.5 rounded-xl border border-[var(--border)] text-white hover:bg-white/5 text-sm font-bold transition-colors"
        >
          {isIT ? '← Torna alla home' : '← Back home'}
        </Link>
      </div>
    </main>
  )
}
