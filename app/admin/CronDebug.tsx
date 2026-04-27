'use client'

import { useEffect, useState, useCallback } from 'react'
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react'

const BASE_URL = 'https://splitvote.io'

interface DilemmaRow {
  id: string
  locale: string
  status: 'draft' | 'approved' | 'rejected'
  generatedAt: string
  trend: string | null
  trendSource: string | null
  question: string
  optionA: string
  optionB: string
  emoji: string
  category: string
  seoTitle: string | null
  keywords: string[]
  noveltyScore?: number
  autoPublished?: boolean
  qualityGateScore?: number
  generatedBy?: string
}

interface ApiResponse {
  approved: number
  drafts: number
  results: DilemmaRow[]
}

function urlFor(id: string, locale: string): string {
  return locale === 'it' ? `${BASE_URL}/it/play/${id}` : `${BASE_URL}/play/${id}`
}

function DilemmaCard({
  s,
  onApprove,
  onReject,
}: {
  s: DilemmaRow
  onApprove?: (id: string) => Promise<void>
  onReject?: (id: string) => Promise<void>
}) {
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  const url = urlFor(s.id, s.locale)
  const isIT = s.locale === 'it'
  const isDraft = s.status === 'draft'

  async function handle(action: 'approve' | 'reject') {
    setLoading(action)
    try {
      if (action === 'approve') await onApprove?.(s.id)
      else await onReject?.(s.id)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className={`rounded-xl border p-4 transition-colors ${
      isDraft
        ? 'border-yellow-500/30 bg-yellow-500/5 hover:border-yellow-500/50'
        : 'border-white/8 bg-[var(--surface2)] hover:border-white/15'
    }`}>
      {/* Header row */}
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border ${
          isIT
            ? 'bg-green-500/20 text-green-400 border-green-500/30'
            : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
        }`}>
          {s.locale.toUpperCase()}
        </span>

        {isDraft ? (
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            DRAFT
          </span>
        ) : s.autoPublished ? (
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border bg-cyan-500/20 text-cyan-400 border-cyan-500/30" title="Auto-published by cron quality gates">
            ⚡ AUTO
          </span>
        ) : (
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border bg-green-500/20 text-green-400 border-green-500/30">
            LIVE
          </span>
        )}

        <span className="text-[10px] text-[var(--muted)] uppercase tracking-widest">{s.category}</span>

        {s.noveltyScore !== undefined && (
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
            s.noveltyScore >= 70 ? 'text-green-300 border-green-500/30 bg-green-500/10'
            : s.noveltyScore >= 55 ? 'text-yellow-300 border-yellow-500/30 bg-yellow-500/10'
            : 'text-red-300 border-red-500/30 bg-red-500/10'
          }`} title={`Novelty score: ${s.noveltyScore}/100`}>
            N:{s.noveltyScore}
          </span>
        )}

        {s.qualityGateScore !== undefined && (
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
            s.qualityGateScore >= 75 ? 'text-cyan-300 border-cyan-500/30 bg-cyan-500/10'
            : 'text-orange-300 border-orange-500/30 bg-orange-500/10'
          }`} title={`Quality gate score: ${s.qualityGateScore}/100`}>
            QG:{s.qualityGateScore}
          </span>
        )}

        {s.trendSource && (
          <span className={`text-[10px] border rounded-full px-1.5 py-0.5 ${
            s.trendSource === 'openrouter'
              ? 'text-purple-300 border-purple-500/40 bg-purple-500/10'
              : 'text-[var(--muted)] border-white/10'
          }`}>
            {s.trendSource === 'google_trends' ? '🔍 Google'
              : s.trendSource === 'reddit' ? '🟠 Reddit'
              : s.trendSource === 'openrouter' ? '🤖 AI'
              : '🌐 Mixed'}
          </span>
        )}

        <span className="text-[10px] text-[var(--muted)]">
          {new Date(s.generatedAt).toLocaleString('it-IT', {
            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
          })}
        </span>

        {isDraft ? (
          <span className="text-[10px] text-yellow-400/70 ml-auto font-mono truncate max-w-[220px]">
            draft preview disabled
          </span>
        ) : (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-blue-400 hover:text-blue-300 ml-auto font-mono truncate max-w-[220px]"
          >
            {url.replace(BASE_URL, '')} ↗
          </a>
        )}
      </div>

      {/* Question */}
      <p className="text-sm font-semibold text-white leading-snug mb-1">{s.question}</p>

      {/* Options */}
      <div className="flex gap-2 mb-2">
        <span className="text-xs text-green-400 bg-green-400/10 rounded-full px-2 py-0.5 truncate max-w-[45%]">A: {s.optionA}</span>
        <span className="text-xs text-red-400 bg-red-400/10 rounded-full px-2 py-0.5 truncate max-w-[45%]">B: {s.optionB}</span>
      </div>

      {/* SEO */}
      {s.seoTitle && (
        <p className="text-xs text-purple-400 mt-1">
          <span className="text-[var(--muted)]">SEO: </span>{s.seoTitle}
        </p>
      )}
      {s.trend && (
        <p className="text-xs text-[var(--muted)] italic mt-0.5">trend: {s.trend}</p>
      )}
      {s.keywords.length > 0 && (
        <div className="flex gap-1 flex-wrap mt-2">
          {s.keywords.slice(0, 6).map(k => (
            <span key={k} className="text-[10px] bg-white/5 text-white/40 border border-white/8 px-2 py-0.5 rounded-full">{k}</span>
          ))}
        </div>
      )}

      {/* Approve / Reject buttons — only for drafts */}
      {isDraft && (
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => handle('approve')}
            disabled={loading !== null}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 disabled:opacity-50 transition-colors"
          >
            <CheckCircle size={12} />
            {loading === 'approve' ? 'Approving…' : 'Approve'}
          </button>
          <button
            onClick={() => handle('reject')}
            disabled={loading !== null}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 disabled:opacity-50 transition-colors"
          >
            <XCircle size={12} />
            {loading === 'reject' ? 'Rejecting…' : 'Reject'}
          </button>
        </div>
      )}
    </div>
  )
}

export default function CronDebug() {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/dilemmas?limit=60')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setData(json)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function approve(id: string) {
    await fetch(`/api/admin/dilemmas/${id}/approve`, { method: 'POST' })
    await fetchData()
  }
  async function reject(id: string) {
    await fetch(`/api/admin/dilemmas/${id}/reject`, { method: 'POST' })
    await fetchData()
  }

  if (loading) {
    return <p className="text-sm text-[var(--muted)] py-4 text-center">Loading dilemmas from Redis…</p>
  }
  if (error) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-red-400 text-sm">
        ❌ {error}
      </div>
    )
  }
  if (!data || data.results.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-[var(--surface2)] p-6 text-center text-[var(--muted)] text-sm">
        Nessun dilemma in Redis. Il cron genera ogni giorno alle 06:00 UTC.
      </div>
    )
  }

  const drafts        = data.results.filter(s => s.status === 'draft')
  const approved      = data.results.filter(s => s.status !== 'draft')
  const enCount       = approved.filter(s => s.locale === 'en').length
  const itCount       = approved.filter(s => s.locale === 'it').length
  const autoPublished = approved.filter(s => s.autoPublished).length

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex items-center gap-3 flex-wrap text-xs">
        {drafts.length > 0 && (
          <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-full px-3 py-1 font-bold">
            {drafts.length} DRAFT{drafts.length !== 1 ? 'S' : ''} in coda
          </span>
        )}
        <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full px-3 py-1 font-bold">
          {enCount} EN live
        </span>
        <span className="bg-green-500/20 text-green-400 border border-green-500/30 rounded-full px-3 py-1 font-bold">
          {itCount} IT live
        </span>
        {autoPublished > 0 && (
          <span className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-full px-3 py-1 font-bold" title="Auto-published by quality gates">
            ⚡ {autoPublished} auto
          </span>
        )}
        <span className="text-[var(--muted)]">/ {approved.length} totali approvati (max 60)</span>
        <button
          onClick={fetchData}
          className="ml-auto flex items-center gap-1 text-xs text-[var(--muted)] hover:text-white transition-colors"
        >
          <RefreshCw size={11} /> Aggiorna
        </button>
      </div>

      {/* Draft queue */}
      {drafts.length > 0 && (
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-yellow-400 mb-3">
            ⏳ Draft queue — approva prima di pubblicare
          </p>
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {drafts.map(s => (
              <DilemmaCard key={s.id} s={s} onApprove={approve} onReject={reject} />
            ))}
          </div>
        </div>
      )}

      {/* Approved scenarios */}
      {approved.length > 0 && (
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-green-400 mb-3">
            ✅ Dilemmi pubblici ({approved.length})
          </p>
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {approved.map(s => (
              <DilemmaCard key={s.id} s={s} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
