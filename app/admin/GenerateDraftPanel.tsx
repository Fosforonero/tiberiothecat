'use client'

import { useState } from 'react'
import type { ValidatedCandidate, ValidatedBlogArticle } from '@/lib/content-generation-validate'

interface SaveDraftResult {
  ok: boolean
  id?: string
  error?: string
}

type GenLocale   = 'en' | 'it'
type ArticleKind = 'standard' | 'cornerstone'

interface PreviewResult {
  ok: true
  mode: 'preview'
  candidate: ValidatedCandidate
  translation?: ValidatedBlogArticle | null
  translationFailed?: boolean
  translationError?: string
}

interface ErrorResult {
  error: string
  raw?: string
}

type ApiResult = PreviewResult | ErrorResult

// Human-readable error messages — raw codes shown as subtitle only
const ERROR_MESSAGES: Record<string, string> = {
  'field_too_long:body':            'Article body too long for Standard article. Retry as Cornerstone or ask for a shorter draft.',
  'field_too_short:body':           'Article body too short. Try a more specific topic.',
  'field_missing:question':         'Required field missing from model output. Retry.',
  'parse_failed':                   'Model output was not valid JSON. Retry or try a different topic.',
  'parse_not_object':               'Model output was malformed. Retry.',
  'openrouter_timeout':             'OpenRouter timed out. Try a shorter topic or retry.',
  'openrouter_not_configured':      'OpenRouter is not configured. Check env vars.',
  'openrouter_model_not_configured':'No model configured. Check OPENROUTER_MODEL_DRAFT.',
  'openrouter_http_429':            'OpenRouter rate limit hit. Wait a minute and retry.',
  'openrouter_http_500':            'OpenRouter server error. Retry in a moment.',
  'openrouter_http_503':            'OpenRouter service unavailable. Retry later.',
  'openrouter_api_error':           'OpenRouter returned an API error. Retry.',
  'openrouter_fetch_failed':        'Network error reaching OpenRouter. Check connectivity.',
  'invalid_topic':                  'Topic must be 3–200 characters.',
  'slug_too_short_after_normalize': 'Generated slug too short after normalization. Try a more descriptive topic.',
}

function friendlyError(code: string): string {
  if (code in ERROR_MESSAGES) return ERROR_MESSAGES[code]
  if (code.startsWith('field_too_long:'))  return `Field too long: "${code.slice('field_too_long:'.length)}". Retry with a shorter topic or switch to Cornerstone.`
  if (code.startsWith('field_too_short:')) return `Field too short: "${code.slice('field_too_short:'.length)}". Topic may be too vague.`
  if (code.startsWith('field_missing:'))   return `Required field missing from model output: "${code.slice('field_missing:'.length)}". Retry.`
  if (code.startsWith('invalid_category:')) return `Invalid category: "${code.slice('invalid_category:'.length)}". Retry.`
  if (code.startsWith('openrouter_http_')) return `OpenRouter HTTP ${code.slice('openrouter_http_'.length)} error. Retry.`
  return code
}

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

function CandidatePreview({ candidate, label, color = 'green' }: { candidate: ValidatedCandidate; label: string; color?: 'green' | 'blue' }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-xs font-semibold uppercase tracking-widest ${color === 'blue' ? 'text-blue-300' : 'text-white/60'}`}>
          {label}
        </span>
        <NoveltyBadge score={candidate.noveltyScore} />
        {candidate.warnings.map(w => (
          <span key={w} className="text-xs bg-orange-900/40 text-orange-300 rounded px-2 py-0.5 border border-orange-500/20">
            ⚠ {w}
          </span>
        ))}
      </div>

      {candidate.similarItems.length > 0 && (
        <div className="text-xs text-white/50 space-y-0.5 bg-white/5 rounded p-2">
          <div className="text-white/40 mb-1 font-semibold">Similar existing content:</div>
          {candidate.similarItems.map(s => (
            <div key={s.id}>
              · {s.title}{' '}
              <span className="text-white/30">({s.similarity}% — {s.type}/{s.locale})</span>
            </div>
          ))}
        </div>
      )}

      <pre className={`bg-black/40 rounded p-3 text-xs overflow-x-auto max-h-96 whitespace-pre-wrap border border-white/5 ${color === 'blue' ? 'text-blue-200' : 'text-green-300'}`}>
        {JSON.stringify(candidate, null, 2)}
      </pre>
    </div>
  )
}

export default function GenerateDraftPanel() {
  const [locale, setLocale]           = useState<GenLocale>('en')
  const [topic, setTopic]             = useState('')
  const [articleKind, setArticleKind] = useState<ArticleKind>('standard')
  const [loading, setLoading]         = useState(false)
  const [preview, setPreview]         = useState<ValidatedCandidate | null>(null)
  const [translation, setTranslation] = useState<ValidatedBlogArticle | null>(null)
  const [translationFailed, setTranslationFailed] = useState(false)
  const [translationError, setTranslationError]   = useState<string | null>(null)
  const [error, setError]             = useState<string | null>(null)
  const [saveLoading, setSaveLoading] = useState(false)
  const [saveError, setSaveError]     = useState<string | null>(null)
  const [savedId, setSavedId]         = useState<string | null>(null)

  function reset() {
    setPreview(null)
    setError(null)
    setTranslation(null)
    setTranslationFailed(false)
    setTranslationError(null)
    setSaveError(null)
    setSavedId(null)
  }

  async function saveDraft() {
    if (!preview) return
    setSaveLoading(true)
    setSaveError(null)
    setSavedId(null)
    try {
      const res = await fetch('/api/admin/blog-drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: preview,
          translation,
          topic,
          translationFailed,
        }),
      })
      const data = await res.json() as SaveDraftResult
      if (!res.ok || !data.ok) {
        setSaveError(data.error ?? 'save_failed')
        return
      }
      setSavedId(data.id ?? null)
    } catch {
      setSaveError('network_error')
    } finally {
      setSaveLoading(false)
    }
  }

  async function callApi() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/generate-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'blog_article',
          locale,
          topic,
          mode: 'preview',
          articleKind,
        }),
      })
      const data: ApiResult = await res.json()

      if (!res.ok) {
        setError((data as ErrorResult).error ?? 'unknown_error')
        return
      }

      const ok = data as PreviewResult
      setPreview(ok.candidate)
      setTranslation(ok.translation ?? null)
      setTranslationFailed(ok.translationFailed ?? false)
      setTranslationError(ok.translationError ?? null)
    } catch {
      setError('openrouter_fetch_failed')
    } finally {
      setLoading(false)
    }
  }

  const topicOk = topic.trim().length >= 3
  const targetLocaleLabel = locale === 'en' ? '🇮🇹 IT' : '🇺🇸 EN'

  return (
    <section className="bg-white/5 rounded-xl p-6 space-y-4" aria-label="Generate Article Draft Panel">
      <div className="flex items-center gap-3 flex-wrap">
        <h2 className="text-lg font-bold text-white">Generate Article Draft</h2>
        <span className="text-xs text-yellow-400 border border-yellow-400/40 rounded px-2 py-0.5">
          🔒 admin-only — never auto-published
        </span>
      </div>

      <p className="text-white/50 text-xs">
        Articles are preview-only and generated bilingually. Copy the output to{' '}
        <code className="font-mono">lib/blog.ts</code> after editorial review. For dilemma drafts, use Seed Draft Batch below.
      </p>

      {/* Controls */}
      <div className="flex flex-wrap gap-3">
        {/* Article kind */}
        <div className="flex flex-col gap-1">
          <label htmlFor="gen-article-kind" className="text-xs text-white/60">Article kind</label>
          <select
            id="gen-article-kind"
            value={articleKind}
            onChange={e => { setArticleKind(e.target.value as ArticleKind); reset() }}
            className="bg-white/10 text-white rounded px-3 py-1.5 text-sm border border-white/10"
          >
            <option value="standard">Standard (500–750 words)</option>
            <option value="cornerstone">Cornerstone (1200–1500 words)</option>
          </select>
        </div>

        {/* Source locale */}
        <div className="flex flex-col gap-1">
          <label htmlFor="gen-locale" className="text-xs text-white/60">Source locale</label>
          <select
            id="gen-locale"
            value={locale}
            onChange={e => { setLocale(e.target.value as GenLocale); reset() }}
            className="bg-white/10 text-white rounded px-3 py-1.5 text-sm border border-white/10"
          >
            <option value="en">🇺🇸 English</option>
            <option value="it">🇮🇹 Italiano</option>
          </select>
        </div>
      </div>

      <p className="text-[11px] text-purple-300/60">
        ✨ Both {locale === 'en' ? '🇺🇸 EN' : '🇮🇹 IT'} source and {targetLocaleLabel} translation will be generated automatically.
      </p>

      {/* Topic */}
      <div className="flex flex-col gap-1">
        <label htmlFor="gen-topic" className="text-xs text-white/60">Topic</label>
        <textarea
          id="gen-topic"
          value={topic}
          onChange={e => { setTopic(e.target.value); reset() }}
          placeholder="e.g. Why people disagree on AI ethics, The psychology of moral dilemmas…"
          rows={2}
          className="bg-white/10 text-white rounded px-3 py-2 text-sm border border-white/10 resize-none placeholder:text-white/30"
        />
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 flex-wrap items-center">
        <button
          onClick={callApi}
          disabled={!topicOk || loading}
          aria-busy={loading}
          className="bg-white/10 hover:bg-white/20 disabled:opacity-40 text-white font-semibold rounded px-5 py-2 text-sm transition-colors border border-white/10"
        >
          {loading ? 'Generating + translating…' : 'Preview'}
        </button>

        {preview && !savedId && (
          <button
            onClick={saveDraft}
            disabled={saveLoading}
            aria-busy={saveLoading}
            className="bg-purple-700/40 hover:bg-purple-700/70 disabled:opacity-40 text-purple-200 font-semibold rounded px-5 py-2 text-sm transition-colors border border-purple-500/30"
          >
            {saveLoading ? 'Saving…' : 'Save draft'}
          </button>
        )}

        {savedId && (
          <span className="text-xs text-green-400 border border-green-500/30 bg-green-900/20 rounded px-3 py-1">
            ✓ Saved · <code className="font-mono">{savedId}</code> · See Blog Draft Queue below
          </span>
        )}

        {!preview && (
          <span className="text-xs text-white/40">
            Preview first, then save to the draft queue
          </span>
        )}
      </div>

      {saveError && (
        <div role="alert" className="text-red-400 text-xs bg-red-900/20 rounded p-2 border border-red-500/20">
          Save failed: {saveError}
        </div>
      )}

      {loading && (
        <p role="status" className="text-purple-300/60 text-xs animate-pulse">
          Step 1: generating {locale.toUpperCase()} article… Step 2: translating to {targetLocaleLabel} — please wait, do not close this tab.
        </p>
      )}

      {/* Error */}
      {error && (
        <div role="alert" className="text-red-400 text-sm bg-red-900/20 rounded p-3 border border-red-500/20 space-y-1">
          <p>{friendlyError(error)}</p>
          <code className="block font-mono text-xs text-red-300/50">{error}</code>
        </div>
      )}

      {/* Preview — source article */}
      {preview && (
        <div className="space-y-4 pt-2 border-t border-white/10">
          <CandidatePreview
            candidate={preview}
            label={`${locale === 'en' ? '🇺🇸' : '🇮🇹'} Source (${locale.toUpperCase()})`}
            color="green"
          />

          {/* Translation */}
          {translation && (
            <CandidatePreview
              candidate={translation}
              label={`${targetLocaleLabel} Translation`}
              color="blue"
            />
          )}

          {translationFailed && (
            <div className="text-orange-400 text-xs bg-orange-900/20 rounded p-2 border border-orange-500/20 space-y-1">
              <p>⚠ Translation to {targetLocaleLabel} failed — source preview above is valid.</p>
              {translationError && (
                <p className="text-orange-300/60">{friendlyError(translationError)}</p>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
