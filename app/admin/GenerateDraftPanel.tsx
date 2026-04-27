'use client'

import { useState } from 'react'
import type { ValidatedCandidate } from '@/lib/content-generation-validate'

type GenType = 'dilemma' | 'blog_article'
type GenLocale = 'en' | 'it'

interface DraftResult {
  ok: true
  dryRun: true
  candidate: ValidatedCandidate
}

interface ErrorResult {
  error: string
  raw?: string
}

function NoveltyBadge({ score }: { score: number }) {
  const color = score >= 70 ? 'bg-green-900 text-green-300' : score >= 40 ? 'bg-yellow-900 text-yellow-300' : 'bg-red-900 text-red-300'
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${color}`}>
      novelty {score}/100
    </span>
  )
}

export default function GenerateDraftPanel() {
  const [type, setType] = useState<GenType>('dilemma')
  const [locale, setLocale] = useState<GenLocale>('en')
  const [topic, setTopic] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<DraftResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    setLoading(true)
    setResult(null)
    setError(null)
    try {
      const res = await fetch('/api/admin/generate-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, locale, topic }),
      })
      const data: DraftResult | ErrorResult = await res.json()
      if (!res.ok || !('ok' in data)) {
        setError((data as ErrorResult).error ?? 'unknown_error')
      } else {
        setResult(data as DraftResult)
      }
    } catch {
      setError('network_error')
    } finally {
      setLoading(false)
    }
  }

  const candidate = result?.candidate

  return (
    <section className="bg-white/5 rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-bold text-white">Generate Draft Preview</h2>
        <span className="text-xs text-yellow-400 border border-yellow-400/40 rounded px-2 py-0.5">
          🔒 dry-run — not saved
        </span>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-white/60">Type</label>
          <select
            value={type}
            onChange={e => setType(e.target.value as GenType)}
            className="bg-white/10 text-white rounded px-3 py-1.5 text-sm border border-white/10"
          >
            <option value="dilemma">Dilemma</option>
            <option value="blog_article">Blog Article</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-white/60">Locale</label>
          <select
            value={locale}
            onChange={e => setLocale(e.target.value as GenLocale)}
            className="bg-white/10 text-white rounded px-3 py-1.5 text-sm border border-white/10"
          >
            <option value="en">English</option>
            <option value="it">Italian</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-white/60">Topic</label>
        <textarea
          value={topic}
          onChange={e => setTopic(e.target.value)}
          placeholder="e.g. AI replacing doctors, climate sacrifice, privacy vs security..."
          rows={2}
          className="bg-white/10 text-white rounded px-3 py-2 text-sm border border-white/10 resize-none placeholder:text-white/30"
        />
      </div>

      <button
        onClick={handleGenerate}
        disabled={loading || topic.trim().length < 3}
        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold rounded px-5 py-2 text-sm transition-colors"
      >
        {loading ? 'Generating…' : 'Generate draft preview'}
      </button>

      {error && (
        <div className="text-red-400 text-sm bg-red-900/20 rounded p-3">
          Error: <code>{error}</code>
        </div>
      )}

      {candidate && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 flex-wrap">
            <NoveltyBadge score={candidate.noveltyScore} />
            {candidate.warnings.map(w => (
              <span key={w} className="text-xs bg-orange-900/40 text-orange-300 rounded px-2 py-0.5">
                ⚠ {w}
              </span>
            ))}
          </div>

          {candidate.similarItems.length > 0 && (
            <div className="text-xs text-white/50 space-y-0.5">
              <div className="text-white/40 mb-1">Similar existing content:</div>
              {candidate.similarItems.map(s => (
                <div key={s.id}>
                  · {s.title} <span className="text-white/30">({s.similarity}% — {s.type}/{s.locale})</span>
                </div>
              ))}
            </div>
          )}

          <pre className="bg-black/40 rounded p-3 text-xs text-green-300 overflow-x-auto max-h-96 whitespace-pre-wrap">
            {JSON.stringify(candidate, null, 2)}
          </pre>
        </div>
      )}
    </section>
  )
}
