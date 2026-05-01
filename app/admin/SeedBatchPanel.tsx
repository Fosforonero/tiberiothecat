'use client'

import { useState, useRef } from 'react'

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
  similarItems?:       { title: string; similarity: number; source?: string; locale?: string }[]
  topKeyword?:         string
  errorCode?:          string
  rejectionReason?:    string
  publishNote?:        string
  qualityGateReasons?: string[]
  semanticVerdict?:           string
  semanticReason?:            string
  semanticClosestMatchTitle?: string
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
type SeedMode    = 'default' | 'manual'

export default function SeedBatchPanel() {
  const [seedMode, setSeedMode] = useState<SeedMode>('default')
  const [locale, setLocale]     = useState<LocaleParam>('all')
  const [count, setCount]       = useState(10)
  const [dryRun, setDryRun]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [result, setResult]     = useState<SeedResponse | null>(null)
  const [error, setError]       = useState<string | null>(null)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const abortRef                = useRef(false)

  // Manual seed fields
  const [manualTopic, setManualTopic] = useState('')
  const [manualTitle, setManualTitle] = useState('')
  const [manualAngle, setManualAngle] = useState('')
  const [manualNotes, setManualNotes] = useState('')

  const estimatedCalls = locale === 'all' ? count * 2 : count
  const canRun = !loading && (seedMode === 'default' || manualTopic.trim().length >= 3)

  function resetResults() {
    setResult(null)
    setError(null)
  }

  async function runBatch() {
    setLoading(true)
    setResult(null)
    setError(null)
    abortRef.current = false

    const locales: Array<'en' | 'it'> = locale === 'all' ? ['en', 'it'] : [locale as 'en' | 'it']
    const totalChunks = estimatedCalls
    setProgress({ done: 0, total: totalChunks })

    const allResults: SeedResult[] = []
    const accSummary: SeedSummary = {
      total: 0, savedDrafts: 0, autoPublished: 0,
      dryRunPassed: 0, skipped_novelty: 0, skipped_preflight: 0,
      openRouterCalls: 0, errors: 0,
    }
    const accCategoryBreakdown: Record<string, number> = {}
    let done = 0
    let noveltyThreshold = 55

    outer: for (const loc of locales) {
      for (let i = 0; i < count; i++) {
        if (abortRef.current) break outer

        const chunkNum = done + 1

        try {
          const body: Record<string, unknown> = {
            locale: loc,
            count: 1,
            dryRun,
            autoPublish: false,
          }
          if (seedMode === 'manual') {
            body.manualSeed = {
              topic: manualTopic.trim(),
              ...(manualTitle.trim() ? { title: manualTitle.trim() } : {}),
              ...(manualAngle.trim() ? { angle: manualAngle.trim() } : {}),
              ...(manualNotes.trim() ? { notes: manualNotes.trim() } : {}),
            }
          }

          const res = await fetch('/api/admin/seed-draft-batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
          const rawData: unknown = await res.json()

          if (!res.ok) {
            const errData = rawData as { message?: string; error?: string }
            const msg = errData.message ?? errData.error ?? `HTTP ${res.status}`
            setError(
              `Error at item ${chunkNum}/${totalChunks}: ${msg}` +
              (done > 0 ? ` — ${done} item${done !== 1 ? 's' : ''} already completed.` : '.')
            )
            break outer
          }

          const data = rawData as SeedResponse
          const r = data.results[0]
          if (r) {
            r.index = allResults.length + 1
            allResults.push(r)
          }

          accSummary.total             += data.summary.total
          accSummary.savedDrafts       += data.summary.savedDrafts
          accSummary.autoPublished     += data.summary.autoPublished
          accSummary.dryRunPassed       = (accSummary.dryRunPassed ?? 0) + (data.summary.dryRunPassed ?? 0)
          accSummary.skipped_novelty   += data.summary.skipped_novelty
          accSummary.skipped_preflight += data.summary.skipped_preflight
          accSummary.openRouterCalls   += data.summary.openRouterCalls
          accSummary.errors            += data.summary.errors
          noveltyThreshold              = data.noveltyThreshold

          for (const [cat, n] of Object.entries(data.categoryBreakdown ?? {})) {
            accCategoryBreakdown[cat] = (accCategoryBreakdown[cat] ?? 0) + (n as number)
          }

          done++
          setProgress({ done, total: totalChunks })
          setResult({
            summary:           { ...accSummary },
            results:           [...allResults],
            dryRun,
            autoPublish:       false,
            noveltyThreshold,
            categoryBreakdown: { ...accCategoryBreakdown },
          })

        } catch {
          setError(
            `Network error at item ${chunkNum}/${totalChunks}` +
            (done > 0 ? ` — ${done} item${done !== 1 ? 's' : ''} already completed.` : '.')
          )
          break outer
        }
      }
    }

    setProgress(null)
    setLoading(false)
  }

  function verdictBadge(r: SeedResult): React.ReactNode {
    if (!r.semanticVerdict || r.semanticVerdict === 'novel') return null
    const cfg: Record<string, { label: string; cls: string }> = {
      related_but_distinct: { label: '≈ related',    cls: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
      too_similar:          { label: '⚠ too similar', cls: 'bg-red-500/20 text-red-300 border-red-500/30' },
      duplicate:            { label: '✗ duplicate',   cls: 'bg-red-500/20 text-red-400 border-red-500/30' },
      review_failed:        { label: 'review err',    cls: 'bg-white/10 text-white/40 border-white/10' },
    }
    const c = cfg[r.semanticVerdict]
    if (!c) return null
    const tooltipText = [r.semanticReason, r.semanticClosestMatchTitle ? `closest: ${r.semanticClosestMatchTitle}` : '']
      .filter(Boolean).join(' — ')
    return (
      <span
        className={`inline-block text-[9px] font-bold border rounded px-1 py-0.5 ml-1 cursor-help ${c.cls}`}
        title={tooltipText}
      >
        {c.label}
      </span>
    )
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
        Runs as <span className="text-purple-300 font-semibold">1 item per call</span> to prevent timeouts.
      </p>

      {/* Seed mode toggle */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-white/40 font-semibold uppercase tracking-wide">Seed mode</span>
        <div className="flex gap-1">
          {(['default', 'manual'] as SeedMode[]).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => { setSeedMode(m); resetResults() }}
              disabled={loading}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-colors disabled:opacity-40 ${
                seedMode === m
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
              }`}
            >
              {m === 'default' ? 'Default seed topics' : 'Manual seed'}
            </button>
          ))}
        </div>
      </div>

      {/* Manual seed fields */}
      {seedMode === 'manual' && (
        <div className="space-y-3 p-4 rounded-xl bg-white/5 border border-purple-500/20">
          <p className="text-[11px] text-purple-300/70">
            Use manual seed to generate multiple dilemma drafts from one controlled topic.
            For articles, use Generate Article Draft above.
          </p>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-white/60">
              Topic <span className="text-red-400">*</span>
            </label>
            <textarea
              value={manualTopic}
              onChange={e => setManualTopic(e.target.value)}
              placeholder="e.g. new global business hubs"
              rows={2}
              disabled={loading}
              className="bg-white/10 text-white rounded px-3 py-2 text-sm border border-white/10 resize-none placeholder:text-white/30 disabled:opacity-40"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
              <label className="text-xs text-white/60">Title (optional)</label>
              <input
                type="text"
                value={manualTitle}
                onChange={e => setManualTitle(e.target.value)}
                placeholder="e.g. Shifting Economic Power"
                disabled={loading}
                className="bg-white/10 text-white rounded px-3 py-1.5 text-sm border border-white/10 placeholder:text-white/30 disabled:opacity-40"
              />
            </div>

            <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
              <label className="text-xs text-white/60">Angle (optional)</label>
              <input
                type="text"
                value={manualAngle}
                onChange={e => setManualAngle(e.target.value)}
                placeholder="e.g. young workers vs established cities"
                disabled={loading}
                className="bg-white/10 text-white rounded px-3 py-1.5 text-sm border border-white/10 placeholder:text-white/30 disabled:opacity-40"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-white/60">Context / notes (optional)</label>
            <input
              type="text"
              value={manualNotes}
              onChange={e => setManualNotes(e.target.value)}
              placeholder="e.g. Abstract from current trends; no real city names"
              disabled={loading}
              className="bg-white/10 text-white rounded px-3 py-1.5 text-sm border border-white/10 placeholder:text-white/30 disabled:opacity-40"
            />
          </div>
        </div>
      )}

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
                onChange={e => setDryRun(e.target.checked)}
                disabled={loading}
                className="accent-blue-500"
              />
              <span className="text-xs text-white/70">Dry run — preview only, do not save</span>
            </label>
            {/* Auto-publish disabled in chunked mode */}
            <label className="flex items-center gap-2 select-none opacity-35 cursor-not-allowed">
              <input
                type="checkbox"
                checked={false}
                disabled
                className="accent-emerald-500"
              />
              <span className="text-xs text-white/70">
                Auto-publish strongest passing drafts (max 10)
              </span>
            </label>
            <p className="text-[10px] text-white/25 ml-5">
              Disabled — use chunked save mode and approve manually from Dynamic Dilemmas.
            </p>
          </div>
        </div>
      </div>

      {/* Pre-flight cost estimate */}
      <p className="text-[11px] text-white/40">
        {estimatedCalls} chunked call{estimatedCalls !== 1 ? 's' : ''}{' '}
        ({locale === 'all' ? `${count} EN + ${count} IT` : `${count} ${locale.toUpperCase()}`}
        {' '}· 1 item per call)
        {seedMode === 'manual' && (
          <span className="text-purple-400/70 font-semibold ml-1">— manual seed topic</span>
        )}
        {dryRun && <span className="text-blue-400 font-semibold ml-1">— preview only, no Redis writes</span>}
      </p>

      {/* Run button + Cancel */}
      <div className="flex items-center gap-3">
        <button
          onClick={runBatch}
          disabled={!canRun}
          aria-busy={loading}
          className={`font-semibold rounded px-5 py-2 text-sm transition-colors text-white disabled:opacity-40 ${
            dryRun
              ? 'bg-blue-700 hover:bg-blue-600'
              : 'bg-purple-700 hover:bg-purple-600'
          }`}
        >
          {loading
            ? `Generating ${progress?.done ?? 0} / ${progress?.total ?? estimatedCalls}…`
            : dryRun
              ? `Dry Run — ${estimatedCalls} chunk${estimatedCalls !== 1 ? 's' : ''} · 1 item each`
              : `Generate Drafts — ${estimatedCalls} chunk${estimatedCalls !== 1 ? 's' : ''} · 1 item each`}
        </button>

        {loading && (
          <button
            type="button"
            onClick={() => { abortRef.current = true }}
            className="px-3 py-2 rounded text-xs font-semibold text-white/60 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white transition-colors"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Progress bar */}
      {progress && (
        <div className="space-y-1.5">
          <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-purple-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${(progress.done / progress.total) * 100}%` }}
            />
          </div>
          <p role="status" className="text-[11px] text-purple-300/60">
            {progress.done} / {progress.total} completed — do not close this tab
          </p>
        </div>
      )}

      {error && (
        <div role="alert" className="text-red-400 text-sm bg-red-900/20 rounded p-3 border border-red-500/20">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-4">
          {/* Mode banner */}
          {result.dryRun && (
            <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2">
              <span className="text-blue-400 text-xs font-bold">
                ~ Dry run — results previewed, nothing was saved to Redis.
              </span>
            </div>
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
                  <th className="text-left px-3 py-2 text-white/40 font-semibold">Review</th>
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
                    <td className="px-3 py-2">{verdictBadge(r)}</td>
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
                    <td className="px-3 py-2 text-white/40 tabular-nums">
                      <span>{r.similarItemsCount ?? '—'}</span>
                      {r.similarItems?.[0] && (
                        <span
                          className="block text-[9px] text-[var(--muted)] truncate max-w-[110px] mt-0.5 cursor-help"
                          title={r.similarItems.map(s => `${s.similarity}% [${(s.locale ?? '?').toUpperCase()} ${s.source ?? ''}] — ${s.title}`).join('\n')}
                        >
                          ≈ {r.similarItems[0].title.slice(0, 40)}{r.similarItems[0].title.length > 40 ? '…' : ''}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-white/60 max-w-[80px] truncate">{r.topKeyword ?? '—'}</td>
                    <td className="px-3 py-2 text-white/80 max-w-[220px]">
                      <span title={r.question} className="truncate block">
                        {r.question ? r.question.slice(0, 80) + (r.question.length > 80 ? '…' : '') : '—'}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-[10px] max-w-[150px]">
                      {r.rejectionReason
                        ? <span className="text-amber-400/70 truncate block" title={r.rejectionReason}>{r.rejectionReason.slice(0, 55)}{r.rejectionReason.length > 55 ? '…' : ''}</span>
                        : r.publishNote
                          ? <span className="text-orange-400/70">{r.publishNote}</span>
                          : <span className="text-white/30 truncate block">{r.id ?? '—'}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer note */}
          {!result.dryRun && (
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
