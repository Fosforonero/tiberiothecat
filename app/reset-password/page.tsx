'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Lock } from 'lucide-react'

const EN_COPY = {
  headline:       'Set a new password',
  sub:            'Choose a strong password for your account.',
  newPwPh:        'New password (min. 6 characters)',
  confirmPwPh:    'Confirm new password',
  submit:         'Update password',
  updating:       'Updating…',
  success:        'Password updated. Redirecting to your dashboard…',
  errTooShort:    'Password must be at least 6 characters.',
  errNoMatch:     'Passwords do not match.',
  errExpired:     'This reset link has expired or is invalid. Request a new one.',
  errGeneric:     'Something went wrong. Please try again.',
  backToLogin:    'Back to sign in',
}

const IT_COPY = {
  headline:       'Imposta una nuova password',
  sub:            'Scegli una password sicura per il tuo account.',
  newPwPh:        'Nuova password (min. 6 caratteri)',
  confirmPwPh:    'Conferma nuova password',
  submit:         'Aggiorna password',
  updating:       'Aggiornamento…',
  success:        'Password aggiornata. Reindirizzamento alla dashboard…',
  errTooShort:    'La password deve contenere almeno 6 caratteri.',
  errNoMatch:     'Le password non coincidono.',
  errExpired:     'Questo link è scaduto o non è valido. Richiedine uno nuovo.',
  errGeneric:     'Si è verificato un errore. Riprova.',
  backToLogin:    'Torna al login',
}

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const locale = searchParams.get('locale')
  const copy = locale === 'it' ? IT_COPY : EN_COPY
  const loginHref = locale === 'it' ? '/login?locale=it' : '/login'

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
  const [hasSession, setHasSession] = useState<boolean | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: copy.errTooShort })
      return
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: copy.errNoMatch })
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      const isExpired = error.message.toLowerCase().includes('session') || error.message.toLowerCase().includes('expired')
      setMessage({ type: 'error', text: isExpired ? copy.errExpired : copy.errGeneric })
      setLoading(false)
      return
    }

    setMessage({ type: 'success', text: copy.success })
    setTimeout(() => router.push('/dashboard'), 2000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-7">
          <a href={locale === 'it' ? '/it' : '/'} className="inline-block mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/splitvote_wordmark.png"
              alt="SplitVote"
              height={32}
              className="h-8 w-auto mx-auto"
            />
          </a>
          <h1 className="text-xl sm:text-2xl font-black text-white leading-snug">
            {copy.headline}
          </h1>
          <p className="text-[var(--muted)] text-sm mt-1.5">{copy.sub}</p>
        </div>

        <div
          className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] backdrop-blur-sm p-6 sm:p-8 shadow-2xl"
          style={{ boxShadow: '0 0 40px rgba(77,159,255,0.06), 0 20px 60px rgba(0,0,0,0.4)' }}
        >
          {hasSession === false ? (
            /* No active session — link expired or already used */
            <div className="space-y-4 text-center">
              <div role="alert" className="rounded-xl px-4 py-3 text-sm bg-red-500/10 border border-red-500/30 text-red-400">
                {copy.errExpired}
              </div>
              <a
                href={loginHref}
                className="inline-block text-blue-400 hover:text-blue-300 font-bold transition-colors underline underline-offset-2 text-sm"
              >
                {copy.backToLogin}
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" aria-hidden />
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder={copy.newPwPh}
                  autoComplete="new-password"
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-[var(--surface2)] border border-[var(--border)] text-white placeholder-[var(--muted)] text-base focus:outline-none focus:border-blue-500/50 transition-colors min-h-[48px]"
                />
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" aria-hidden />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder={copy.confirmPwPh}
                  autoComplete="new-password"
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-[var(--surface2)] border border-[var(--border)] text-white placeholder-[var(--muted)] text-base focus:outline-none focus:border-blue-500/50 transition-colors min-h-[48px]"
                />
              </div>

              {message && (
                <div role="alert" className={`rounded-xl px-4 py-3 text-sm ${
                  message.type === 'error'
                    ? 'bg-red-500/10 border border-red-500/30 text-red-400'
                    : 'bg-green-500/10 border border-green-500/30 text-green-400'
                }`}>{message.text}</div>
              )}

              <button
                type="submit"
                disabled={loading || message?.type === 'success'}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-base transition-all disabled:opacity-50 neon-glow-blue hover:scale-[1.01] min-h-[52px]"
              >
                {loading ? <><Loader2 size={16} className="animate-spin" />{copy.updating}</> : copy.submit}
              </button>

              <p className="text-center text-sm text-[var(--muted)]">
                <a
                  href={loginHref}
                  className="text-blue-400 hover:text-blue-300 font-bold transition-colors underline underline-offset-2"
                >
                  {copy.backToLogin}
                </a>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
