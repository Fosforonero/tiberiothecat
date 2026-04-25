'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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

  const [isPremium, setIsPremium] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_premium')
        .eq('id', user.id)
        .single()
      setIsPremium(profile?.is_premium ?? false)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { error: insertError } = await supabase.from('user_polls').insert({
      user_id: user.id,
      question: form.question.trim(),
      option_a: form.option_a.trim(),
      option_b: form.option_b.trim(),
      category: form.category,
      emoji: form.emoji,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
    } else {
      setSubmitted(true)
      setLoading(false)
    }
  }

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  if (isPremium === null) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center text-[var(--muted)]">
        Loading…
      </div>
    )
  }

  if (!isPremium) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <p className="text-5xl mb-4">⭐</p>
        <h1 className="text-2xl font-black text-white mb-3">Premium Feature</h1>
        <p className="text-[var(--muted)] mb-6">
          Publishing polls to the global audience requires a premium subscription.
        </p>
        <a href="/#pricing" className="inline-block px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-sm transition-colors">
          See Plans →
        </a>
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
            onClick={() => { setSubmitted(false); setForm({ question: '', option_a: '', option_b: '', category: 'morality', emoji: '🤔' }) }}
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

        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-sm transition-colors disabled:opacity-50"
        >
          {loading ? 'Submitting…' : 'Submit for Review'}
        </button>
      </form>
    </div>
  )
}
