'use client'

import { useState } from 'react'

const AVATARS = ['🌍', '🔥', '⚡', '🧠', '🎭', '👾', '🦁', '🐺', '🦊', '🐉', '🌙', '☀️', '🎯', '🏆', '💎', '🌊', '🎪', '🚀', '🎲', '🧩']

const COUNTRIES = [
  { code: 'IT', name: 'Italy' }, { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' }, { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' }, { code: 'ES', name: 'Spain' },
  { code: 'PT', name: 'Portugal' }, { code: 'BR', name: 'Brazil' },
  { code: 'CA', name: 'Canada' }, { code: 'AU', name: 'Australia' },
  { code: 'JP', name: 'Japan' }, { code: 'IN', name: 'India' },
  { code: 'MX', name: 'Mexico' }, { code: 'AR', name: 'Argentina' },
  { code: 'NL', name: 'Netherlands' }, { code: 'PL', name: 'Poland' },
  { code: 'SE', name: 'Sweden' }, { code: 'NO', name: 'Norway' },
  { code: 'CH', name: 'Switzerland' }, { code: 'Other', name: 'Other' },
]

interface Props {
  userId: string
  initialName: string | null
  initialBirthYear: number | null
  initialGender: string | null
  initialCountry: string | null
  initialAvatar: string | null
  nameChanges: number
  isPremium: boolean
  badges: { emoji: string; name: string; rarity: string }[]
  votesCount: number
  joinedAt: string
}

const RARITY_STYLES: Record<string, string> = {
  common:    'border-slate-500/40 bg-slate-500/10 text-slate-300',
  rare:      'border-blue-500/40  bg-blue-500/10  text-blue-300',
  epic:      'border-purple-500/40 bg-purple-500/10 text-purple-300',
  legendary: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-300',
}

export default function ProfileClient({
  userId,
  initialName,
  initialBirthYear,
  initialGender,
  initialCountry,
  initialAvatar,
  nameChanges,
  isPremium,
  badges,
  votesCount,
  joinedAt,
}: Props) {
  const [displayName, setDisplayName] = useState(initialName ?? '')
  const [birthYear, setBirthYear] = useState(initialBirthYear?.toString() ?? '')
  const [gender, setGender] = useState(initialGender ?? '')
  const [country, setCountry] = useState(initialCountry ?? '')
  const [avatar, setAvatar] = useState(initialAvatar ?? '🌍')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [shareCopied, setShareCopied] = useState(false)

  // name_changes = 0 → primo cambio gratuito; >= 1 → a pagamento
  const firstFreeAvailable = nameChanges === 0
  const nameChangeCost = firstFreeAvailable ? '✅ Primo cambio gratuito' : '€0.99'
  const profileUrl = `https://splitvote.io/u/${userId}`

  async function save() {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: displayName || undefined,
          birthYear: birthYear || undefined,
          gender: gender || undefined,
          countryCode: country || undefined,
          avatarEmoji: avatar,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage({ type: 'success', text: '✅ Profile updated!' })
      } else if (res.status === 402) {
        setMessage({ type: 'error', text: '🔒 Il cambio nome costa €0.99 — pagamento Stripe in arrivo presto!' })
      } else {
        setMessage({ type: 'error', text: data.error ?? 'Something went wrong' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error — try again' })
    } finally {
      setSaving(false)
    }
  }

  const copyProfile = () => {
    navigator.clipboard.writeText(profileUrl)
    setShareCopied(true)
    setTimeout(() => setShareCopied(false), 2000)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
      <div>
        <a href="/dashboard" className="text-sm text-[var(--muted)] hover:text-white transition-colors">
          ← Dashboard
        </a>
        <h1 className="text-3xl font-black text-white mt-4 mb-1">Profile Settings</h1>
        <p className="text-[var(--muted)] text-sm">Manage your identity, achievements, and preferences.</p>
      </div>

      {/* ── Avatar + Identity ── */}
      <div className="rounded-2xl border border-[var(--border)] bg-[#0d0d1a]/60 p-6">
        <h2 className="text-sm font-black uppercase tracking-widest text-[var(--muted)] mb-5">🧬 Identity</h2>

        {/* Avatar picker */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-[var(--muted)] uppercase tracking-widest mb-3">
            Avatar
          </label>
          <div className="flex flex-wrap gap-2">
            {AVATARS.map(emoji => (
              <button
                key={emoji}
                onClick={() => setAvatar(emoji)}
                className={`text-2xl w-12 h-12 rounded-xl border-2 transition-all flex items-center justify-center
                  ${avatar === emoji
                    ? 'border-blue-500 bg-blue-500/20 scale-110'
                    : 'border-[var(--border)] bg-[var(--surface)] hover:border-blue-500/40 hover:scale-105'
                  }`}
              >
                {emoji}
              </button>
            ))}
          </div>
          <p className="text-xs text-[var(--muted)] mt-2">
            🔒 More avatars unlock as you vote. Premium avatar packs coming soon.
          </p>
        </div>

        {/* Display Name */}
        <div className="mb-5">
          <label className="block text-xs font-bold text-[var(--muted)] uppercase tracking-widest mb-2">
            Display Name
            <span className={`ml-2 normal-case font-normal ${firstFreeAvailable ? 'text-green-400' : 'text-orange-400'}`}>
              — {nameChangeCost}
            </span>
          </label>
          <input
            type="text"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="Your display name"
            maxLength={32}
            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-white placeholder-[var(--muted)] focus:outline-none focus:border-blue-500/60 text-sm"
          />
          {!firstFreeAvailable && (
            <p className="text-xs text-orange-400/80 mt-1.5">
              🔒 Hai già usato il cambio gratuito — il prossimo costerà €0.99 (Stripe in arrivo).
            </p>
          )}
        </div>

        {/* Public Profile */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-[var(--muted)] uppercase tracking-widest font-bold mb-0.5">Your public profile</p>
            <p className="text-sm text-white font-mono truncate">{profileUrl}</p>
          </div>
          <button
            onClick={copyProfile}
            className="flex-shrink-0 text-xs font-bold px-3 py-2 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30 transition-colors"
          >
            {shareCopied ? '✅ Copied!' : '🔗 Share'}
          </button>
        </div>
      </div>

      {/* ── Demographics ── */}
      <div className="rounded-2xl border border-[var(--border)] bg-[#0d0d1a]/60 p-6">
        <h2 className="text-sm font-black uppercase tracking-widest text-[var(--muted)] mb-5">📊 Demographics</h2>
        <p className="text-xs text-[var(--muted)] mb-5">
          Used only in aggregate form for global trend analytics. Never shared individually.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-[var(--muted)] uppercase tracking-widest mb-2">Birth Year</label>
            <input
              type="number"
              value={birthYear}
              onChange={e => setBirthYear(e.target.value)}
              placeholder="e.g. 1990"
              min={1920} max={2015}
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-white placeholder-[var(--muted)] focus:outline-none focus:border-blue-500/60 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--muted)] uppercase tracking-widest mb-2">Gender</label>
            <select
              value={gender}
              onChange={e => setGender(e.target.value)}
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/60 text-sm"
            >
              <option value="">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="nonbinary">Non-binary</option>
              <option value="prefer_not">Prefer not to say</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--muted)] uppercase tracking-widest mb-2">Country</label>
            <select
              value={country}
              onChange={e => setCountry(e.target.value)}
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/60 text-sm"
            >
              <option value="">Select country</option>
              {COUNTRIES.map(c => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Trophy Case ── */}
      {badges.length > 0 && (
        <div className="rounded-2xl border border-[var(--border)] bg-[#0d0d1a]/60 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-black uppercase tracking-widest text-[var(--muted)]">🏆 Trophy Case</h2>
            <button
              onClick={copyProfile}
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/30 transition-colors"
            >
              {shareCopied ? '✅' : '📤 Share my trophies'}
            </button>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {badges.map((b, i) => (
              <div
                key={i}
                title={b.name}
                className={`rounded-xl border p-3 text-center ${RARITY_STYLES[b.rarity] ?? RARITY_STYLES.common}`}
              >
                <p className="text-2xl mb-1">{b.emoji}</p>
                <p className="text-xs font-semibold leading-tight">{b.name}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-[var(--muted)] mt-4 text-center">
            Your public profile shows all your trophies to the world →{' '}
            <a href={`/u/${userId}`} className="text-blue-400 hover:text-blue-300 underline" target="_blank">
              preview
            </a>
          </p>
        </div>
      )}

      {/* ── Stats ── */}
      <div className="rounded-2xl border border-[var(--border)] bg-[#0d0d1a]/60 p-6">
        <h2 className="text-sm font-black uppercase tracking-widest text-[var(--muted)] mb-5">📈 Your Impact</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-black text-blue-400">{votesCount.toLocaleString()}</p>
            <p className="text-xs text-[var(--muted)] mt-1">Dilemmas voted</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-purple-400">{badges.length}</p>
            <p className="text-xs text-[var(--muted)] mt-1">Badges earned</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-black text-[var(--muted)]">
              {new Date(joinedAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
            </p>
            <p className="text-xs text-[var(--muted)] mt-1">Member since</p>
          </div>
        </div>
      </div>

      {/* ── Save button ── */}
      {message && (
        <div className={`rounded-xl px-4 py-3 text-sm font-semibold ${
          message.type === 'success'
            ? 'bg-green-500/10 border border-green-500/30 text-green-400'
            : 'bg-red-500/10 border border-red-500/30 text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      <button
        onClick={save}
        disabled={saving}
        className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black text-sm transition-colors"
      >
        {saving ? 'Saving…' : 'Save Profile'}
      </button>

      {/* ── Coming soon ── */}
      <div className="rounded-2xl border border-dashed border-[var(--border)] p-6 text-center">
        <p className="text-[var(--muted)] text-sm font-semibold mb-3">🚀 Coming soon to your profile</p>
        <div className="flex flex-wrap gap-2 justify-center text-xs text-[var(--muted)]">
          {['Avatar shop', 'Frame shop', 'Streak tracker', 'Country leaderboard', 'Referral system', 'Weekly digest'].map(f => (
            <span key={f} className="px-3 py-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)]">{f}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
