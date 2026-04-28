'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { UserEntitlements } from '@/lib/entitlements'

const CATEGORIES = [
  { value: 'morality',       label: '⚖️ Morality'       },
  { value: 'technology',     label: '🤖 Technology'     },
  { value: 'society',        label: '🌍 Society'        },
  { value: 'relationships',  label: '❤️ Relationships'  },
  { value: 'survival',       label: '🏕️ Survival'       },
  { value: 'philosophy',     label: '🧠 Philosophy'     },
]

export default function SubmitPollPage() {
  const router = useRouter()
  const supabase = createClient()

  const [canSubmit, setCanSubmit] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [agreed, setAgreed] = useState(false)

  const [form, setForm] = useState({
    question: '',
    option_a: '',
    option_b: '',
    category: 'morality',
    emoji: '🤔',
  })

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login?redirect=/submit-poll'); return }
      try {
        const res = await fetch('/api/me/entitlements')
        const ents: UserEntitlements = await res.json()
        setCanSubmit(ents.canSubmitPoll)
      } catch {
        setCanSubmit(false)
      }
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!agreed) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/polls/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (res.ok) {
        setSubmitted(true)
      } else {
        const data = await res.json().catch(() => ({}))
        if (res.status === 403) {
          setError('Poll submission requires a Premium account.')
        } else if (res.status === 401) {
          router.push('/login')
          return
        } else {
          setError((data as { error?: string }).error ?? 'Submission failed. Please try again.')
        }
      }
    } catch {
      setError('Network error. Please try again.')
    }

    setLoading(false)
  }

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  if (canSubmit === null) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center text-[var(--muted)]">
        Loading…
      </div>
    )
  }

  if (!canSubmit) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <p className="text-5xl mb-4">⭐</p>
        <h1 className="text-2xl font-black text-white mb-3">Premium Feature</h1>
        <p className="text-[var(--muted)] mb-6">
          Poll submission is available with Premium. Upgrade to submit your own dilemmas for the community to vote on.
        </p>
        <div className="flex gap-3 justify-center">
          <a
            href="/profile#membership"
            className="inline-block px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-sm transition-colors"
          >
            Upgrade to Premium →
          </a>
          <a
            href="/"
            className="inline-block px-6 py-3 rounded-xl border border-[var(--border)] hover:bg-white/5 text-white font-bold text-sm transition-colors"
          >
            ← Back to dilemmas
          </a>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <p className="text-5xl mb-4">🎉</p>
        <h1 className="text-2xl font-black text-white mb-3">Poll Submitted!</h1>
        <p className="text-[var(--muted)] mb-6">
          Your dilemma is under review. Once approved by our team, it will go live on SplitVote.
          This usually takes 24–48 hours.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => {
              setSubmitted(false)
              setAgreed(false)
              setForm({ question: '', option_a: '', option_b: '', category: 'morality', emoji: '🤔' })
            }}
            className="px-5 py-2.5 rounded-xl border border-[var(--border)] text-[var(--muted)] hover:text-white text-sm font-bold transition-colors"
          >
            Submit Another
          </button>
          <a href="/dashboard" className="px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-sm font-bold transition-colors">
            View Dashboard
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-16">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white mb-2">Submit a Dilemma</h1>
        <p className="text-[var(--muted)] text-sm">
          Create an impossible moral question for the world to vote on.
          Our team reviews all submissions before they go live.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Question */}
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-[var(--muted)] block mb-2">
            The Dilemma <span className="text-red-400">*</span>
          </label>
          <textarea
            value={form.question}
            onChange={e => set('question', e.target.value)}
            required
            minLength={10}
            maxLength={300}
            rows={3}
            placeholder="Would you rather save 5 strangers or 1 family member?"
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-[var(--border)] text-white placeholder-[var(--muted)] text-sm focus:outline-none focus:border-blue-500/50 transition-colors resize-none"
          />
          <p className="text-xs text-[var(--muted)] mt-1 text-right">{form.question.length}/300</p>
        </div>

        {/* Options */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-[var(--muted)] block mb-2">
              Option A <span className="text-red-400">*</span>
            </label>
            <input
              value={form.option_a}
              onChange={e => set('option_a', e.target.value)}
              required
              minLength={2}
              maxLength={150}
              placeholder="Save the 5 strangers"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-[var(--border)] text-white placeholder-[var(--muted)] text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-[var(--muted)] block mb-2">
              Option B <span className="text-red-400">*</span>
            </label>
            <input
              value={form.option_b}
              onChange={e => set('option_b', e.target.value)}
              required
              minLength={2}
              maxLength={150}
              placeholder="Save the family member"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-[var(--border)] text-white placeholder-[var(--muted)] text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>
        </div>

        {/* Category + Emoji */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className="text-xs font-bold uppercase tracking-widest text-[var(--muted)] block mb-2">
              Category
            </label>
            <select
              value={form.category}
              onChange={e => set('category', e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#0d0d1a] border border-[var(--border)] text-white text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
            >
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-[var(--muted)] block mb-2">
              Emoji
            </label>
            <input
              value={form.emoji}
              onChange={e => set('emoji', e.target.value)}
              maxLength={4}
              placeholder="🤔"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-[var(--border)] text-white text-center text-xl focus:outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>
        </div>

        {/* Guidelines */}
        <div className="rounded-xl bg-white/3 border border-[var(--border)] p-4 text-xs text-[var(--muted)] space-y-1">
          <p className="font-bold text-white/60 mb-2">Submission guidelines</p>
          <p>✓ Ask a genuine moral dilemma with no obvious right answer</p>
          <p>✓ Keep options balanced — no trick questions</p>
          <p>✗ No offensive, political, or discriminatory content</p>
          <p>✗ No real people, brands, or current events</p>
        </div>

        {/* Required acknowledgement */}
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={e => setAgreed(e.target.checked)}
            className="mt-0.5 flex-shrink-0"
          />
          <span className="text-xs text-[var(--muted)]">
            I confirm this submission follows the guidelines and understand it may be rejected by the SplitVote team.
          </span>
        </label>

        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !agreed}
          className="w-full py-3.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-sm transition-colors disabled:opacity-50"
        >
          {loading ? 'Submitting…' : 'Submit for Review'}
        </button>
      </form>
    </div>
  )
}
