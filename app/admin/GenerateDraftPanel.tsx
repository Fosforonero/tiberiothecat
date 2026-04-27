'use client'

import { useState } from 'react'
import type { ValidatedCandidate } from '@/lib/content-generation-validate'

type GenType = 'dilemma' | 'blog_article'
type GenLocale = 'en' | 'it'
type PanelMode = 'preview' | 'save'

interface PreviewResult {
  ok: true
  mode: 'preview'
  candidate: ValidatedCandidate
}

interface SaveResult {
  ok: true
  mode: 'save'
  savedId: string
  noveltyScore: number
  candidate: ValidatedCandidate
}

interface LowNoveltyResult {
  ok: false
  error: 'low_novelty'
  noveltyScore: number
  threshold: number
  candidate: ValidatedCandidate
}

interface ErrorResult {
  error: string
  raw?: string
}

type ApiResult = PreviewResult | SaveResult | LowNoveltyResult | ErrorResult

function NoveltyBadge({ score }: { score: number }) {
  const cls = score >= 70
    ? 'bg-green-900/60 text-green-300 border-green-700'
    : score >= 55
      ? 'bg-yellow-900/60 text-yellow-300 border-yellow-700'
      : 'bg-red-900/60 text-red-300 border-red-700'
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold border ${cls}`}>
      novelty {score}/100
    </span>
  )
}

export default function GenerateDraftPanel({ defaultType = 'dilemma' }: { defaultType?: GenType }) {
  const [type, setType]     = useState<GenType>(defaultType)
  const [locale, setLocale] = useState<GenLocale>('en')
  const [topic, setTopic]   = useState('')
  const [loading, setLoading]   = useState<PanelMode | null>(null)
  const [preview, setPreview]   = useState<ValidatedCandidate | null>(null)
  const [savedId, setSavedId]   = useState<string | null>(null)
  const [lowNovelty, setLowNovelty] = useState<{ score: number; threshold: number; candidate: ValidatedCandidate } | null>(null)
  const [error, setError]   = useState<string | null>(null)

  function reset() {
    setPreview(null)
    setSavedId(null)
    setLowNovelty(null)
    setError(null)
  }

  async function callApi(mode: PanelMode, allowLowNovelty = false) {
    setLoading(mode)
    if (mode === 'save') { setLowNovelty(null) }
    setError(null)
    setSavedId(null)

    try {
      const res = await fetch('/api/admin/generate-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, locale, topic, mode, allowLowNovelty }),
      })
      const data: ApiResult = await res.json()

      if (!res.ok) {
        if ((data as LowNoveltyResult).error === 'low_novelty') {
          const lr = data as LowNoveltyResult
          setLowNovelty({ score: lr.noveltyScore, threshold: lr.threshold, candidate: lr.candidate })
          setPreview(lr.candidate)
        } else {
          setError((data as ErrorResult).error ?? 'unknown_error')
        }
        return
      }

      const ok = data as PreviewResult | SaveResult
      setPreview(ok.candidate)
      if (ok.mode === 'save') {
        setSavedId((ok as SaveResult).savedId)
      }
    } catch {
      setError('network_error')
    } finally {
      setLoading(null)
    }
  }

  const canSave = type === 'dilemma'
  const topicOk = topic.trim().length >= 3

  return (
    <section className="bg-white/5 rounded-xl p-6 space-y-4" aria-label="Generate Draft Panel">
      <div className="flex items-center gap-3 flex-wrap">
        <h2 className="text-lg font-bold text-white">Generate Draft</h2>
        <span className="text-xs text-yellow-400 border border-yellow-400/40 rounded px-2 py-0.5">
          🔒 admin-only — never auto-published
        </span>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="gen-type" className="text-xs text-white/60">Type</label>
          <select
            id="gen-type"
            value={type}
            onChange={e => { setType(e.target.value as GenType); reset() }}
            className="bg-white/10 text-white rounded px-3 py-1.5 text-sm border border-white/10"
          >
            <option value="dilemma">Dilemma</option>
            <option value="blog_article">Blog Article (preview only)</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="gen-locale" className="text-xs text-white/60">Locale</label>
          <select
            id="gen-locale"
            value={locale}
            onChange={e => { setLocale(e.target.value as GenLocale); reset() }}
            className="bg-white/10 text-white rounded px-3 py-1.5 text-sm border border-white/10"
          >
            <option value="en">English</option>
            <option value="it">Italiano</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="gen-topic" className="text-xs text-white/60">Topic</label>
        <textarea
          id="gen-topic"
          value={topic}
          onChange={e => { setTopic(e.target.value); reset() }}
          placeholder="e.g. AI replacing doctors, climate sacrifice, privacy vs security…"
          rows={2}
          className="bg-white/10 text-white rounded px-3 py-2 text-sm border border-white/10 resize-none placeholder:text-white/30"
        />
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() => callApi('preview')}
          disabled={!topicOk || loading !== null}
          aria-busy={loading === 'preview'}
          className="bg-white/10 hover:bg-white/20 disabled:opacity-40 text-white font-semibold rounded px-5 py-2 text-sm transition-colors border border-white/10"
        >
          {loading === 'preview' ? 'Generating…' : 'Preview'}
        </button>

        {canSave && (
          <button
            onClick={() => callApi('save')}
            disabled={!topicOk || loading !== null}
            aria-busy={loading === 'save'}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold rounded px-5 py-2 text-sm transition-colors"
          >
            {loading === 'save' ? 'Saving…' : 'Save as draft'}
          </button>
        )}

        {!canSave && (
          <span className="text-xs text-white/40 self-center">
            Blog articles require manual review — save not available
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div role="alert" className="text-red-400 text-sm bg-red-900/20 rounded p-3 border border-red-500/20">
          Error: <code className="font-mono">{error}</code>
        </div>
      )}

      {/* Save success */}
      {savedId && (
        <div role="status" className="text-green-400 text-sm bg-green-900/20 rounded p-3 border border-green-500/20 flex items-center gap-2">
          ✓ Saved to draft queue — ID: <code className="font-mono text-xs">{savedId}</code>
          <span className="text-green-300/60 text-xs ml-1">visible in Dynamic Dilemmas ↓</span>
        </div>
      )}

      {/* Low novelty blocker */}
      {lowNovelty && !savedId && (
        <div role="alert" className="bg-orange-900/20 rounded p-3 border border-orange-500/20 space-y-2">
          <p className="text-orange-300 text-sm font-semibold">
            ⚠ Novelty too low ({lowNovelty.score}/100 — threshold: {lowNovelty.threshold})
          </p>
          <p className="text-orange-200/70 text-xs">
            This content is too similar to existing dilemmas. Preview is shown below.
          </p>
          <button
            onClick={() => callApi('save', true)}
            disabled={loading !== null}
            className="text-xs font-bold px-3 py-1.5 rounded bg-orange-500/20 border border-orange-500/30 text-orange-300 hover:bg-orange-500/30 disabled:opacity-40 transition-colors"
          >
            {loading === 'save' ? 'Saving…' : 'Save anyway (override dedup guard)'}
          </button>
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 flex-wrap">
            <NoveltyBadge score={preview.noveltyScore} />
            {preview.warnings.map(w => (
              <span key={w} className="text-xs bg-orange-900/40 text-orange-300 rounded px-2 py-0.5 border border-orange-500/20">
                ⚠ {w}
              </span>
            ))}
          </div>

          {preview.similarItems.length > 0 && (
            <div className="text-xs text-white/50 space-y-0.5 bg-white/5 rounded p-2">
              <div className="text-white/40 mb-1 font-semibold">Similar existing content:</div>
              {preview.similarItems.map(s => (
                <div key={s.id}>
                  · {s.title}{' '}
                  <span className="text-white/30">({s.similarity}% — {s.type}/{s.locale})</span>
                </div>
              ))}
            </div>
          )}

          <pre className="bg-black/40 rounded p-3 text-xs text-green-300 overflow-x-auto max-h-96 whitespace-pre-wrap border border-white/5">
            {JSON.stringify(preview, null, 2)}
          </pre>
        </div>
      )}
    </section>
  )
}
