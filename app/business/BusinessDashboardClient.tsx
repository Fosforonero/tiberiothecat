'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Building2, BarChart3, PlusCircle, Eye, Pause, Play,
  TrendingUp, Users, Vote, Target, ExternalLink,
  CheckCircle, Clock, XCircle, AlertCircle, Globe, Zap
} from 'lucide-react'

interface User { id: string; email: string }
interface Org { id: string; name: string; slug: string; type: string; plan: string; logo_url?: string; website?: string }
interface Poll {
  id: string; question: string; option_a: string; option_b: string
  status: 'pending' | 'active' | 'paused' | 'ended' | 'rejected'
  votes_a: number; votes_b: number; target_votes: number
  cta_text?: string; cta_url?: string; category: string; emoji: string
  created_at: string; starts_at?: string; ends_at?: string
}

interface Props {
  user: User
  org: Record<string, unknown> | null
  userRole: string | null
  polls: Record<string, unknown>[]
}

const STATUS_CONFIG = {
  pending:  { label: 'In revisione', icon: Clock,         color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
  active:   { label: 'Attivo',       icon: CheckCircle,   color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20' },
  paused:   { label: 'In pausa',     icon: Pause,         color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20' },
  ended:    { label: 'Terminato',    icon: XCircle,       color: 'text-gray-400',   bg: 'bg-gray-500/10 border-gray-500/20' },
  rejected: { label: 'Rifiutato',    icon: AlertCircle,   color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20' },
}

const PLAN_CONFIG = {
  starter:    { label: 'Starter',    color: 'text-gray-400',   maxPolls: 1,  badge: '' },
  pro:        { label: 'Pro',        color: 'text-blue-400',   maxPolls: 10, badge: '⚡' },
  enterprise: { label: 'Enterprise', color: 'text-purple-400', maxPolls: -1, badge: '👑' },
}

export default function BusinessDashboardClient({ user, org, userRole, polls: rawPolls }: Props) {
  const supabase = createClient()
  const polls = rawPolls as unknown as Poll[]
  const typedOrg = org as unknown as Org | null

  const [tab, setTab] = useState<'overview' | 'polls' | 'new-poll' | 'create-org'>(!org ? 'create-org' : 'overview')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  // New org form
  const [orgName, setOrgName] = useState('')
  const [orgType, setOrgType] = useState('business')
  const [orgWebsite, setOrgWebsite] = useState('')

  // New poll form
  const [pollQ, setPollQ] = useState('')
  const [pollA, setPollA] = useState('')
  const [pollB, setPollB] = useState('')
  const [pollEmoji, setPollEmoji] = useState('🏢')
  const [pollCategory, setPollCategory] = useState('society')
  const [pollCta, setPollCta] = useState('')
  const [pollCtaUrl, setPollCtaUrl] = useState('')
  const [pollTarget, setPollTarget] = useState(1000)

  async function createOrg() {
    if (!orgName.trim()) return setMsg({ type: 'err', text: 'Nome obbligatorio' })
    setLoading(true)
    const slug = orgName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const { error } = await supabase.from('organizations').insert({
      name: orgName.trim(), slug, type: orgType,
      website: orgWebsite.trim() || null, owner_id: user.id,
    })
    setLoading(false)
    if (error) return setMsg({ type: 'err', text: error.message })
    setMsg({ type: 'ok', text: 'Organizzazione creata! Ricarica la pagina.' })
    setTimeout(() => window.location.reload(), 1200)
  }

  async function submitPoll() {
    if (!typedOrg) return
    if (!pollQ.trim() || !pollA.trim() || !pollB.trim()) {
      return setMsg({ type: 'err', text: 'Domanda e opzioni obbligatorie' })
    }
    const plan = PLAN_CONFIG[typedOrg.plan as keyof typeof PLAN_CONFIG]
    if (plan.maxPolls !== -1 && polls.filter(p => p.status !== 'ended').length >= plan.maxPolls) {
      return setMsg({ type: 'err', text: `Piano ${plan.label}: max ${plan.maxPolls} poll attivi` })
    }
    setLoading(true)
    const { error } = await supabase.from('promoted_polls').insert({
      org_id: typedOrg.id, question: pollQ.trim(),
      option_a: pollA.trim(), option_b: pollB.trim(),
      emoji: pollEmoji, category: pollCategory,
      cta_text: pollCta.trim() || null, cta_url: pollCtaUrl.trim() || null,
      target_votes: pollTarget,
    })
    setLoading(false)
    if (error) return setMsg({ type: 'err', text: error.message })
    setMsg({ type: 'ok', text: 'Poll inviato per revisione!' })
    setPollQ(''); setPollA(''); setPollB(''); setPollCta(''); setPollCtaUrl('')
    setTimeout(() => { setTab('polls'); window.location.reload() }, 1200)
  }

  // Stats
  const totalVotes = polls.reduce((s, p) => s + p.votes_a + p.votes_b, 0)
  const activePolls = polls.filter(p => p.status === 'active').length
  const plan = typedOrg ? PLAN_CONFIG[typedOrg.plan as keyof typeof PLAN_CONFIG] : null

  // ── CREATE ORG ──────────────────────────────────────────────────────────────
  if (!typedOrg) return (
    <div className="max-w-xl mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4 neon-glow-blue">
          <Building2 size={28} className="text-blue-400" />
        </div>
        <h1 className="text-3xl font-black mb-2">Business Dashboard</h1>
        <p className="text-[var(--muted)]">Crea la tua organizzazione per pubblicare poll sponsorizzati su SplitVote.</p>
      </div>

      {msg && (
        <div className={`mb-4 rounded-xl px-4 py-3 text-sm border ${msg.type === 'ok' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
          {msg.text}
        </div>
      )}

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-[var(--muted)] mb-1.5">Nome organizzazione</label>
          <input value={orgName} onChange={e => setOrgName(e.target.value)}
            placeholder="Es. Acme Corp" className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface2)] px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50" />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-[var(--muted)] mb-1.5">Tipo</label>
          <select value={orgType} onChange={e => setOrgType(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface2)] px-4 py-2.5 text-sm focus:outline-none">
            <option value="business">Business / Azienda</option>
            <option value="association">Associazione</option>
            <option value="academic">Università / Ricerca</option>
            <option value="media">Media / Editoria</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-[var(--muted)] mb-1.5">Sito web (opzionale)</label>
          <input value={orgWebsite} onChange={e => setOrgWebsite(e.target.value)}
            placeholder="https://example.com" className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface2)] px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50" />
        </div>
        <button onClick={createOrg} disabled={loading}
          className="w-full btn-neon-blue py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2">
          {loading ? '...' : <><Building2 size={15} /> Crea organizzazione</>}
        </button>
      </div>
    </div>
  )

  // ── MAIN DASHBOARD ──────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">

      {/* Header */}
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Building2 size={18} className="text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-black leading-none">{typedOrg.name}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-xs font-bold ${plan?.color}`}>{plan?.badge} {plan?.label}</span>
              <span className="text-[var(--muted)] text-xs">· {userRole}</span>
              {typedOrg.website && (
                <a href={typedOrg.website} target="_blank" rel="noopener noreferrer"
                  className="text-[var(--muted)] hover:text-white transition-colors">
                  <Globe size={11} />
                </a>
              )}
            </div>
          </div>
        </div>
        <button onClick={() => setTab('new-poll')}
          className="btn-neon-blue px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
          <PlusCircle size={14} /> Nuovo poll
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 border-b border-[var(--border)] pb-0">
        {([['overview', 'Overview', BarChart3], ['polls', 'I tuoi poll', Vote]] as const).map(([id, label, Icon]) => (
          <button key={id} onClick={() => setTab(id as 'overview' | 'polls')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold border-b-2 transition-all -mb-px ${
              tab === id ? 'border-blue-400 text-white' : 'border-transparent text-[var(--muted)] hover:text-white'
            }`}>
            <Icon size={13} />{label}
          </button>
        ))}
      </div>

      {msg && (
        <div className={`mb-6 rounded-xl px-4 py-3 text-sm border ${msg.type === 'ok' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
          {msg.text}
        </div>
      )}

      {/* ── OVERVIEW TAB ── */}
      {tab === 'overview' && (
        <div className="space-y-8">
          {/* KPI */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Poll totali', value: polls.length, Icon: Vote, glow: 'neon-glow-blue', color: 'text-blue-400', bg: 'from-blue-500/10 to-blue-500/5', border: 'border-blue-500/25' },
              { label: 'Poll attivi', value: activePolls, Icon: Play, glow: 'neon-glow-green', color: 'text-green-400', bg: 'from-green-500/10 to-green-500/5', border: 'border-green-500/25' },
              { label: 'Voti totali', value: totalVotes.toLocaleString(), Icon: TrendingUp, glow: 'neon-glow-purple', color: 'text-purple-400', bg: 'from-purple-500/10 to-purple-500/5', border: 'border-purple-500/25' },
              { label: 'Piano', value: plan?.label ?? '—', Icon: Zap, glow: 'neon-glow-yellow', color: 'text-yellow-400', bg: 'from-yellow-500/10 to-yellow-500/5', border: 'border-yellow-500/25' },
            ].map(({ label, value, Icon, glow, color, bg, border }) => (
              <div key={label} className={`rounded-2xl border ${border} bg-gradient-to-br ${bg} p-5 text-center ${glow}`}>
                <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mx-auto mb-3 ${color}`}>
                  <Icon size={18} />
                </div>
                <div className="text-2xl font-black mb-1">{value}</div>
                <div className="text-xs text-[var(--muted)] font-medium uppercase tracking-wide">{label}</div>
              </div>
            ))}
          </div>

          {/* Plan limits */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <h2 className="font-bold text-sm uppercase tracking-widest text-[var(--muted)] mb-4 flex items-center gap-2">
              <Target size={13} /> Limiti piano
            </h2>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-[var(--muted)]">Poll attivi</span>
              <span className="font-bold">{activePolls} / {plan?.maxPolls === -1 ? '∞' : plan?.maxPolls}</span>
            </div>
            {plan?.maxPolls !== -1 && (
              <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full rounded-full bg-blue-500 transition-all"
                  style={{ width: `${Math.min(100, (activePolls / (plan?.maxPolls ?? 1)) * 100)}%` }} />
              </div>
            )}
            {typedOrg.plan === 'starter' && (
              <p className="text-xs text-[var(--muted)] mt-3">
                Passa a <span className="text-blue-400 font-bold">Pro</span> per poll illimitati, analytics avanzate e CTA personalizzate. Contatta{' '}
                <a href="mailto:business@splitvote.io" className="underline hover:text-white">business@splitvote.io</a>
              </p>
            )}
          </div>

          {/* Recent polls preview */}
          {polls.length > 0 && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
              <h2 className="font-bold text-sm uppercase tracking-widest text-[var(--muted)] mb-4 flex items-center gap-2">
                <BarChart3 size={13} /> Ultimi poll
              </h2>
              <div className="space-y-3">
                {polls.slice(0, 3).map(poll => {
                  const cfg = STATUS_CONFIG[poll.status]
                  const total = poll.votes_a + poll.votes_b
                  const pct = total > 0 ? Math.round((poll.votes_a / total) * 100) : 50
                  return (
                    <div key={poll.id} className="flex items-center gap-4 py-3 border-b border-[var(--border)] last:border-0">
                      <span className="text-2xl">{poll.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold line-clamp-1">{poll.question}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-red-500 to-blue-500"
                              style={{ background: `linear-gradient(to right, #ef4444 ${pct}%, #3b82f6 ${pct}%)` }} />
                          </div>
                          <span className="text-xs text-[var(--muted)]">{total.toLocaleString()} voti</span>
                        </div>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── POLLS TAB ── */}
      {tab === 'polls' && (
        <div className="space-y-4">
          {polls.length === 0 ? (
            <div className="text-center py-16 text-[var(--muted)]">
              <Vote size={40} className="mx-auto mb-4 opacity-30" />
              <p className="font-semibold">Nessun poll ancora</p>
              <p className="text-sm mt-1">Crea il tuo primo poll sponsorizzato</p>
              <button onClick={() => setTab('new-poll')} className="btn-neon-blue px-6 py-2.5 rounded-xl text-sm font-bold mt-6">
                Crea poll
              </button>
            </div>
          ) : polls.map(poll => {
            const cfg = STATUS_CONFIG[poll.status]
            const StatusIcon = cfg.icon
            const total = poll.votes_a + poll.votes_b
            const pctA = total > 0 ? Math.round((poll.votes_a / total) * 100) : 50
            const pctB = 100 - pctA
            return (
              <div key={poll.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className="text-2xl mt-0.5">{poll.emoji}</span>
                    <p className="font-semibold text-sm leading-snug">{poll.question}</p>
                  </div>
                  <span className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.color}`}>
                    <StatusIcon size={11} />{cfg.label}
                  </span>
                </div>

                {/* Vote bars */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    { label: poll.option_a, pct: pctA, votes: poll.votes_a, color: 'from-red-500/20 to-red-500/10 border-red-500/20 text-red-400' },
                    { label: poll.option_b, pct: pctB, votes: poll.votes_b, color: 'from-blue-500/20 to-blue-500/10 border-blue-500/20 text-blue-400' },
                  ].map(({ label, pct, votes, color }) => (
                    <div key={label} className={`rounded-xl border bg-gradient-to-br ${color} p-3`}>
                      <p className="text-xs font-semibold line-clamp-2 mb-2">{label}</p>
                      <div className="flex items-end justify-between">
                        <span className="text-lg font-black">{pct}%</span>
                        <span className="text-xs text-[var(--muted)]">{votes.toLocaleString()} voti</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Progress to target */}
                <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
                  <Target size={11} />
                  <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full rounded-full bg-blue-500 transition-all"
                      style={{ width: `${Math.min(100, (total / poll.target_votes) * 100)}%` }} />
                  </div>
                  <span>{total.toLocaleString()} / {poll.target_votes.toLocaleString()} target</span>
                </div>

                {poll.cta_text && poll.cta_url && (
                  <a href={poll.cta_url} target="_blank" rel="noopener noreferrer"
                    className="mt-3 flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                    <ExternalLink size={11} />{poll.cta_text}
                  </a>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── NEW POLL TAB ── */}
      {tab === 'new-poll' && (
        <div className="max-w-2xl">
          <h2 className="font-black text-xl mb-6 flex items-center gap-2"><PlusCircle size={18} className="text-blue-400" /> Nuovo poll sponsorizzato</h2>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-[var(--muted)] mb-1.5">Domanda <span className="text-red-400">*</span></label>
              <textarea value={pollQ} onChange={e => setPollQ(e.target.value)} rows={2}
                placeholder="Es. Preferiresti un mondo con energia illimitata ma senza privacy digitale?"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface2)] px-4 py-2.5 text-sm resize-none focus:outline-none focus:border-blue-500/50" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-[var(--muted)] mb-1.5">Opzione A <span className="text-red-400">*</span></label>
                <input value={pollA} onChange={e => setPollA(e.target.value)} placeholder="Sì, vale la pena"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface2)] px-4 py-2.5 text-sm focus:outline-none focus:border-red-500/50" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-[var(--muted)] mb-1.5">Opzione B <span className="text-red-400">*</span></label>
                <input value={pollB} onChange={e => setPollB(e.target.value)} placeholder="No, troppo rischioso"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface2)] px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-[var(--muted)] mb-1.5">Emoji</label>
                <input value={pollEmoji} onChange={e => setPollEmoji(e.target.value)} maxLength={2}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface2)] px-4 py-2.5 text-sm focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-[var(--muted)] mb-1.5">Categoria</label>
                <select value={pollCategory} onChange={e => setPollCategory(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface2)] px-4 py-2.5 text-sm focus:outline-none">
                  {['morality','survival','loyalty','justice','freedom','technology','society','relationships'].map(c => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-[var(--muted)] mb-1.5">CTA testo</label>
                <input value={pollCta} onChange={e => setPollCta(e.target.value)} placeholder="Scopri di più"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface2)] px-4 py-2.5 text-sm focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-[var(--muted)] mb-1.5">CTA URL</label>
                <input value={pollCtaUrl} onChange={e => setPollCtaUrl(e.target.value)} placeholder="https://..."
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface2)] px-4 py-2.5 text-sm focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-[var(--muted)] mb-1.5">Target voti</label>
              <input type="number" value={pollTarget} onChange={e => setPollTarget(Number(e.target.value))} min={100} max={100000}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface2)] px-4 py-2.5 text-sm focus:outline-none" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setTab('polls')} className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-sm font-bold text-[var(--muted)] hover:text-white transition-colors">
                Annulla
              </button>
              <button onClick={submitPoll} disabled={loading}
                className="flex-2 btn-neon-blue px-8 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2">
                {loading ? '...' : <><PlusCircle size={14} /> Invia per approvazione</>}
              </button>
            </div>
            <p className="text-xs text-[var(--muted)]">I poll vengono revisionati entro 24h prima di essere pubblicati.</p>
          </div>
        </div>
      )}
    </div>
  )
}
