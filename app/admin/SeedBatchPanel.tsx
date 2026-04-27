'use client'

import { useState } from 'react'

interface SeedResult {
  index: number
  locale: 'en' | 'it'
  topic: string
  status: 'saved' | 'skipped_novelty' | 'error'
  id?: string
  category?: string
  question?: string
  noveltyScore?: number
  similarItemsCount?: number
  topKeyword?: string
  errorCode?: string
}

interface SeedSummary {
  total: number
  saved: number
  skipped_novelty: number
  errors: number
}

interface SeedResponse {
  summary: SeedSummary
  noveltyThreshold: number
  results: SeedResult[]
}

export default function SeedBatchPanel() {
  const [loading, setLoading]   = useState(false)
  const [result, setResult]     = useState<SeedResponse | null>(null)
  const [error, setError]       = useState<string | null>(null)

  async function runBatch() {
    setLoading(true)
    setResult(null)
    setError(null)
    try {
      const res = await fetch('/api/admin/seed-draft-batch', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? `HTTP ${res.status}`)
      } else {
        setResult(data as SeedResponse)
      }
    } catch {
      setError('network_error')
    } finally {
      setLoading(false)
    }
  }

  const statusColor = (s: SeedResult['status']) =>
    s === 'saved'          ? 'text-green-400'
    : s === 'skipped_novelty' ? 'text-yellow-400'
    : 'text-red-400'

  return (
    <section className="bg-white/5 rounded-xl p-6 space-y-4" aria-label="Seed Draft Batch Panel">
      <div className="flex items-center gap-3 flex-wrap">
        <h2 className="text-lg font-bold text-white">Seed Draft Batch</h2>
        <span className="text-xs text-purple-300 border border-purple-400/40 rounded px-2 py-0.5">
          🤖 OpenRouter — 10 EN + 10 IT — never auto-published
        </span>
      </div>

      <p className="text-white/50 text-xs">
        Generates 20 curated dilemma drafts (10 EN + 10 IT) using OpenRouter.
        Novelty guard: skips drafts scoring below 55. All results land in{' '}
        <code className="font-mono">dynamic:drafts</code> — approve manually from Dynamic Dilemmas below.
      </p>

      <button
        onClick={runBatch}
        disabled={loading}
        aria-busy={loading}
        className="bg-purple-700 hover:bg-purple-600 disabled:opacity-40 text-white font-semibold rounded px-5 py-2 text-sm transition-colors"
      >
        {loading ? 'Generating… (2-4 min)' : 'Generate 10 EN + 10 IT draft batch'}
      </button>

      {loading && (
        <p role="status" className="text-purple-300/70 text-xs animate-pulse">
          Calling OpenRouter sequentially — please wait, do not close this tab.
        </p>
      )}

      {error && (
        <div role="alert" className="text-red-400 text-sm bg-red-900/20 rounded p-3 border border-red-500/20">
          Error: <code className="font-mono">{error}</code>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Total',           value: result.summary.total,           color: 'text-white' },
              { label: 'Saved',           value: result.summary.saved,           color: 'text-green-400' },
              { label: 'Skipped (novelty)', value: result.summary.skipped_novelty, color: 'text-yellow-400' },
              { label: 'Errors',          value: result.summary.errors,          color: 'text-red-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center rounded-xl bg-white/5 border border-white/10 py-3">
                <p className={`text-2xl font-black ${color}`}>{value}</p>
                <p className="text-[10px] text-white/40 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Results table */}
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="text-left px-3 py-2 text-white/40 font-semibold">#</th>
                  <th className="text-left px-3 py-2 text-white/40 font-semibold">Locale</th>
                  <th className="text-left px-3 py-2 text-white/40 font-semibold">Status</th>
                  <th className="text-left px-3 py-2 text-white/40 font-semibold">Category</th>
                  <th className="text-left px-3 py-2 text-white/40 font-semibold">Novelty</th>
                  <th className="text-left px-3 py-2 text-white/40 font-semibold">Similar</th>
                  <th className="text-left px-3 py-2 text-white/40 font-semibold">Keyword</th>
                  <th className="text-left px-3 py-2 text-white/40 font-semibold">Question</th>
                  <th className="text-left px-3 py-2 text-white/40 font-semibold">ID</th>
                </tr>
              </thead>
              <tbody>
                {result.results.map(r => (
                  <tr key={r.index} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                    <td className="px-3 py-2 text-white/40 tabular-nums">{r.index}</td>
                    <td className="px-3 py-2 font-bold">
                      <span className={r.locale === 'en' ? 'text-blue-400' : 'text-green-400'}>
                        {r.locale === 'en' ? '🇺🇸' : '🇮🇹'} {r.locale.toUpperCase()}
                      </span>
                    </td>
                    <td className={`px-3 py-2 font-bold ${statusColor(r.status)}`}>
                      {r.status === 'saved' ? '✓ saved'
                        : r.status === 'skipped_novelty' ? '⚠ novelty'
                        : `✗ ${r.errorCode ?? 'error'}`}
                    </td>
                    <td className="px-3 py-2 text-white/70">{r.category ?? '—'}</td>
                    <td className="px-3 py-2 tabular-nums">
                      {r.noveltyScore !== undefined ? (
                        <span className={
                          r.noveltyScore >= 70 ? 'text-green-400 font-bold'
                          : r.noveltyScore >= 55 ? 'text-yellow-400 font-bold'
                          : 'text-red-400 font-bold'
                        }>
                          {r.noveltyScore}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-3 py-2 text-white/40 tabular-nums">{r.similarItemsCount ?? '—'}</td>
                    <td className="px-3 py-2 text-white/60 max-w-[80px] truncate">{r.topKeyword ?? '—'}</td>
                    <td className="px-3 py-2 text-white/80 max-w-[220px]">
                      <span title={r.question} className="truncate block">
                        {r.question ? r.question.slice(0, 80) + (r.question.length > 80 ? '…' : '') : '—'}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-white/30 text-[10px] max-w-[100px] truncate">
                      {r.id ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-white/30 text-xs">
            Approve drafts in Dynamic Dilemmas ↓ — nothing is published automatically.
          </p>
        </div>
      )}
    </section>
  )
}
