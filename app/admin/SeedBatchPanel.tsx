'use client'

import { useState } from 'react'

interface SeedResult {
  index:               number
  locale:              'en' | 'it'
  topic:               string
  status:              'saved' | 'dry_run' | 'auto_published' | 'skipped_novelty' | 'skipped_preflight' | 'error'
  id?:                 string
  category?:           string
  question?:           string
  noveltyScore?:       number
  similarItemsCount?:  number
  topKeyword?:         string
  errorCode?:          string
  publishNote?:        string
  qualityGateReasons?: string[]
}

interface SeedSummary {
  total:             number
  savedDrafts:       number
  autoPublished:     number
  dryRunPassed?:     number
  skipped_novelty:   number
  skipped_preflight: number
  openRouterCalls:   number
  errors:            number
}

interface SeedResponse {
  summary:          SeedSummary
  noveltyThreshold: number
  dryRun:           boolean
  autoPublish:      boolean
  estimatedCost?:   { calls: number; modelName: string; note: string }
  categoryBreakdown?: Record<string, number>
  results:          SeedResult[]
}

type LocaleParam = 'all' | 'en' | 'it'

export default function SeedBatchPanel() {
  const [locale, setLocale]       = useState<LocaleParam>('all')
  const [count, setCount]         = useState(10)
  const [dryRun, setDryRun]       = useState(false)
  const [autoPublish, setAutoPublish] = useState(false)
  const [loading, setLoading]     = useState(false)
  const [result, setResult]       = useState<SeedResponse | null>(null)
  const [error, setError]         = useState<string | null>(null)

  const estimatedCalls = locale === 'all' ? count * 2 : count

  async function runBatch() {
    setLoading(true)
    setResult(null)
    setError(null)
    try {
      const res = await fetch('/api/admin/seed-draft-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale, count, dryRun, autoPublish }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.message ?? data.error ?? `HTTP ${res.status}`)
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
    s === 'saved'               ? 'text-green-400'
    : s === 'dry_run'           ? 'text-blue-400'
    : s === 'auto_published'    ? 'text-emerald-300'
    : s === 'skipped_preflight' ? 'text-amber-400'
    : s === 'skipped_novelty'   ? 'text-yellow-400'
    : 'text-red-400'

  const statusLabel = (r: SeedResult) =>
    r.status === 'saved'               ? '✓ draft'
    : r.status === 'dry_run'           ? '~ dry run'
    : r.status === 'auto_published'    ? '★ published'
    : r.status === 'skipped_preflight' ? '⚠ similar'
    : r.status === 'skipped_novelty'   ? '⚠ novelty'
    : `✗ ${r.errorCode ?? 'error'}`

  // Summary cards adapt based on mode; "Similar" card appended when preflight skips occurred
  const hasPreflight = result !== null && result.summary.skipped_preflight > 0
  const similarCard  = { label: 'Similar', value: result?.summary.skipped_preflight ?? 0, color: 'text-amber-400' }

  const summaryCards = result
    ? (result.dryRun
        ? [
            { label: 'Total',          value: result.summary.total,             color: 'text-white' },
            { label: 'Dry Run Passed', value: result.summary.dryRunPassed ?? 0, color: 'text-blue-400' },
            ...(hasPreflight ? [similarCard] : []),
            { label: 'Skipped',        value: result.summary.skipped_novelty,   color: 'text-yellow-400' },
            { label: 'Errors',         value: result.summary.errors,            color: 'text-red-400' },
          ]
        : result.autoPublish
          ? [
              { label: 'Total',       value: result.summary.total,             color: 'text-white' },
              { label: '★ Published', value: result.summary.autoPublished,     color: 'text-emerald-300' },
              { label: 'Draft Saved', value: result.summary.savedDrafts,       color: 'text-green-400' },
              ...(hasPreflight ? [similarCard] : []),
              { label: 'Skipped',     value: result.summary.skipped_novelty,   color: 'text-yellow-400' },
              { label: 'Errors',      value: result.summary.errors,            color: 'text-red-400' },
            ]
          : [
              { label: 'Total',   value: result.summary.total,           color: 'text-white' },
              { label: 'Saved',   value: result.summary.savedDrafts,     color: 'text-green-400' },
              ...(hasPreflight ? [similarCard] : []),
              { label: 'Skipped', value: result.summary.skipped_novelty, color: 'text-yellow-400' },
              { label: 'Errors',  value: result.summary.errors,          color: 'text-red-400' },
            ])
    : []

  const colCount = summaryCards.length
  const gridCols = colCount <= 4 ? 'grid-cols-4' : colCount === 5 ? 'grid-cols-5' : 'grid-cols-6'

  return (
    <section className="bg-white/5 rounded-xl p-6 space-y-4" aria-label="Seed Draft Batch Panel">
      <div className="flex items-center gap-3 flex-wrap">
        <h2 className="text-lg font-bold text-white">Seed Draft Batch</h2>
        <span className="text-xs text-purple-300 border border-purple-400/40 rounded px-2 py-0.5">
          🤖 OpenRouter — never auto-published without quality gates
        </span>
      </div>

      <p className="text-white/50 text-xs">
        Generates curated dilemma drafts using OpenRouter.
        Novelty guard: skips drafts scoring below 55. All results land in{' '}
        <code className="font-mono">dynamic:drafts</code> — approve manually from Dynamic Dilemmas below.
      </p>

      {/* Controls row */}
      <div className="flex flex-wrap gap-4 items-end">
        {/* Locale selector */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] text-white/40 font-semibold uppercase tracking-wide">Locale</span>
          <div className="flex gap-1">
            {(['all', 'en', 'it'] as LocaleParam[]).map(l => (
              <button
                key={l}
                type="button"
                onClick={() => setLocale(l)}
                disabled={loading}
                className={`px-3 py-1.5 rounded text-xs font-bold transition-colors disabled:opacity-40 ${
                  locale === l
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
                }`}
              >
                {l === 'all' ? 'All' : l === 'en' ? '🇺🇸 EN' : '🇮🇹 IT'}
              </button>
            ))}
          </div>
        </div>

        {/* Count input */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] text-white/40 font-semibold uppercase tracking-wide">
            Count{locale === 'all' ? ' per locale' : ''}
          </span>
          <input
            type="number"
            min={1}
            max={10}
            value={count}
            onChange={e => setCount(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
            disabled={loading}
            className="w-20 bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs text-white text-center disabled:opacity-40"
          />
        </div>

        {/* Mode controls */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] text-white/40 font-semibold uppercase tracking-wide">Mode</span>
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={dryRun}
                onChange={e => {
                  setDryRun(e.target.checked)
                  if (e.target.checked) setAutoPublish(false)
                }}
                disabled={loading}
                className="accent-blue-500"
              />
              <span className="text-xs text-white/70">Dry run — preview only, do not save</span>
            </label>
            <label className={`flex items-center gap-2 select-none ${dryRun ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
              <input
                type="checkbox"
                checked={autoPublish}
                onChange={e => setAutoPublish(e.target.checked)}
                disabled={loading || dryRun}
                className="accent-emerald-500"
              />
              <span className="text-xs text-white/70">
                Auto-publish strongest passing drafts (max 10)
              </span>
            </label>
            {autoPublish && !dryRun && (
              <p className="text-[10px] text-emerald-400/70 ml-5">
                Only items passing quality gates. Others remain drafts.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Pre-flight cost estimate */}
      <p className="text-[11px] text-white/40">
        ~{estimatedCalls} OpenRouter call{estimatedCalls !== 1 ? 's' : ''}{' '}
        ({locale === 'all' ? `${count} EN + ${count} IT` : `${count} ${locale.toUpperCase()}`})
        {dryRun && <span className="text-blue-400 font-semibold ml-1">— preview only, no Redis writes</span>}
        {autoPublish && !dryRun && (
          <span className="text-emerald-400/80 font-semibold ml-1">
            — gate-passing items publish immediately (max 10)
          </span>
        )}
      </p>

      <button
        onClick={runBatch}
        disabled={loading}
        aria-busy={loading}
        className={`font-semibold rounded px-5 py-2 text-sm transition-colors text-white disabled:opacity-40 ${
          dryRun
            ? 'bg-blue-700 hover:bg-blue-600'
            : autoPublish
              ? 'bg-emerald-700 hover:bg-emerald-600'
              : 'bg-purple-700 hover:bg-purple-600'
        }`}
      >
        {loading
          ? 'Running… (may take 2-4 min)'
          : dryRun
            ? `Dry Run Preview (${estimatedCalls} call${estimatedCalls !== 1 ? 's' : ''})`
            : autoPublish
              ? `Generate & Auto-Publish (${estimatedCalls} call${estimatedCalls !== 1 ? 's' : ''})`
              : `Generate & Save ${estimatedCalls} Draft${estimatedCalls !== 1 ? 's' : ''}`}
      </button>

      {loading && (
        <p role="status" className="text-purple-300/70 text-xs animate-pulse">
          Calling OpenRouter sequentially — please wait, do not close this tab.
        </p>
      )}

      {error && (
        <div role="alert" className="text-red-400 text-sm bg-red-900/20 rounded p-3 border border-red-500/20">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-4">
          {/* Mode banners */}
          {result.dryRun && (
            <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2">
              <span className="text-blue-400 text-xs font-bold">
                ~ Dry run — results previewed, nothing was saved to Redis.
              </span>
            </div>
          )}
          {result.autoPublish && !result.dryRun && result.summary.autoPublished > 0 && (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
              <span className="text-emerald-400 text-xs font-bold">
                ★ {result.summary.autoPublished} item{result.summary.autoPublished !== 1 ? 's' : ''} published directly — passed all quality gates.
              </span>
            </div>
          )}

          {/* Server cost note */}
          {result.estimatedCost && (
            <p className="text-[11px] text-white/30">{result.estimatedCost.note}</p>
          )}

          {/* Summary cards */}
          <div className={`grid ${gridCols} gap-3`}>
            {summaryCards.map(({ label, value, color }) => (
              <div key={label} className="text-center rounded-xl bg-white/5 border border-white/10 py-3">
                <p className={`text-2xl font-black ${color}`}>{value}</p>
                <p className="text-[10px] text-white/40 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Category breakdown */}
          {result.categoryBreakdown && Object.keys(result.categoryBreakdown).length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-[10px] text-white/40 font-semibold uppercase tracking-wide">
                Categories:
              </span>
              {Object.entries(result.categoryBreakdown).map(([cat, n]) => (
                <span
                  key={cat}
                  className="text-[11px] bg-white/5 border border-white/10 rounded px-2 py-0.5 text-white/60"
                >
                  {cat} <span className="text-white/30">×{n}</span>
                </span>
              ))}
            </div>
          )}

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
                  <th className="text-left px-3 py-2 text-white/40 font-semibold">ID / Note</th>
                </tr>
              </thead>
              <tbody>
                {result.results.map(r => (
                  <tr key={r.index} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                    <td className="px-3 py-2 text-white/40 tabular-nums">{r.index}</td>
                    <td className="px-3 py-2 font-bold">
                      <span className={r.locale === 'en' ? 'text-blue-400' : 'text-green-400'}>
                        {r.locale === 'en' ? '🇺🇸' : '🇮🇹'} {r.locale.toUpperCase()}
                      </span>
                    </td>
                    <td className={`px-3 py-2 font-bold ${statusColor(r.status)}`}>
                      {statusLabel(r)}
                    </td>
                    <td className="px-3 py-2 text-white/70">{r.category ?? '—'}</td>
                    <td className="px-3 py-2 tabular-nums">
                      {r.noveltyScore !== undefined ? (
                        <span className={
                          r.noveltyScore >= 75 ? 'text-emerald-300 font-bold'
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
                    <td className="px-3 py-2 font-mono text-[10px] max-w-[120px] truncate">
                      {r.publishNote
                        ? <span className="text-orange-400/70">{r.publishNote}</span>
                        : <span className="text-white/30">{r.id ?? '—'}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer warnings */}
          {result.autoPublish && !result.dryRun && (
            <div className="flex items-start gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
              <span className="text-emerald-400 text-xs font-bold shrink-0">★ Auto-published items are live.</span>
              <span className="text-emerald-300/60 text-xs">
                All passed content quality gates (novelty, finalScore, SEO, no dangerous content). Others were saved to drafts.
              </span>
            </div>
          )}
          {!result.dryRun && !result.autoPublish && (
            <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
              <span className="text-yellow-400 text-xs font-bold">
                ⚠ Generated drafts are not public until approved.
              </span>
              <span className="text-yellow-300/60 text-xs">
                Review and approve each draft manually in Dynamic Dilemmas ↓
              </span>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
