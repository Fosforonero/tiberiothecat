'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const COUNTRIES = [
  { code: 'IT', name: 'Italy' }, { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' }, { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' }, { code: 'ES', name: 'Spain' },
  { code: 'BR', name: 'Brazil' }, { code: 'IN', name: 'India' },
  { code: 'CA', name: 'Canada' }, { code: 'AU', name: 'Australia' },
  { code: 'MX', name: 'Mexico' }, { code: 'NL', name: 'Netherlands' },
  { code: 'PL', name: 'Poland' }, { code: 'PT', name: 'Portugal' },
  { code: 'RO', name: 'Romania' }, { code: 'TR', name: 'Turkey' },
  { code: 'JP', name: 'Japan' }, { code: 'KR', name: 'South Korea' },
  { code: 'NG', name: 'Nigeria' }, { code: 'ZA', name: 'South Africa' },
]

const CURRENT_YEAR = new Date().getFullYear()
const BIRTH_YEARS = Array.from({ length: CURRENT_YEAR - 1924 }, (_, i) => CURRENT_YEAR - 10 - i)

export default function OnboardingModal() {
  const router = useRouter()
  const [birthYear, setBirthYear] = useState('')
  const [gender, setGender] = useState('')
  const [countryCode, setCountryCode] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(skip = false) {
    setLoading(true)
    try {
      await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          skip ? {} : { birth_year: birthYear, gender, country_code: countryCode }
        ),
      })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-[var(--border)] bg-[#0d0d1a] p-8 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-7">
          <span className="text-4xl block mb-3">👋</span>
          <h2 className="text-2xl font-black text-white mb-2">Welcome to SplitVote!</h2>
          <p className="text-[var(--muted)] text-sm">
            Help us understand who's voting. Your data is anonymous and used only to show demographic splits.
          </p>
        </div>

        <div className="space-y-4">
          {/* Birth year */}
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-[var(--muted)] block mb-1.5">
              Year of birth
            </label>
            <select
              value={birthYear}
              onChange={e => setBirthYear(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-[var(--border)] text-white text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
            >
              <option value="">Prefer not to say</option>
              {BIRTH_YEARS.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Gender */}
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-[var(--muted)] block mb-1.5">
              Gender
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'male', label: '♂ Male' },
                { value: 'female', label: '♀ Female' },
                { value: 'non_binary', label: '⚧ Non-binary' },
                { value: 'prefer_not', label: '— Prefer not' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setGender(g => g === opt.value ? '' : opt.value)}
                  className={`py-2.5 rounded-xl border text-sm font-semibold transition-colors
                    ${gender === opt.value
                      ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                      : 'border-[var(--border)] bg-white/5 text-[var(--muted)] hover:border-blue-500/40 hover:text-white'
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Country */}
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-[var(--muted)] block mb-1.5">
              Country
            </label>
            <select
              value={countryCode}
              onChange={e => setCountryCode(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-[var(--border)] text-white text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
            >
              <option value="">Select country…</option>
              {COUNTRIES.map(c => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
              <option value="OT">Other</option>
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-7">
          <button
            onClick={() => handleSubmit(true)}
            disabled={loading}
            className="flex-1 py-3 rounded-xl border border-[var(--border)] text-[var(--muted)] hover:text-white text-sm font-semibold transition-colors disabled:opacity-50"
          >
            Skip
          </button>
          <button
            onClick={() => handleSubmit(false)}
            disabled={loading}
            className="flex-2 flex-grow py-3 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-sm transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving…' : 'Save & continue →'}
          </button>
        </div>

        <p className="text-center text-xs text-[var(--muted)] mt-4 opacity-60">
          All fields optional. Stored anonymously.
        </p>
      </div>
    </div>
  )
}
