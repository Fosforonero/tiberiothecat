'use client'

import { useState } from 'react'
import type { ValidatedCandidate, ValidatedBlogArticle } from '@/lib/content-generation-validate'

type GenType      = 'dilemma' | 'blog_article'
type GenLocale    = 'en' | 'it'
type ArticleKind  = 'standard' | 'cornerstone'
type PanelMode    = 'preview' | 'save'

interface PreviewResult {
  ok: true
  mode: 'preview'
  candidate: ValidatedCandidate
  // Blog article bilingual
  translation?: ValidatedBlogArticle | null
  translationFailed?: boolean
  translationError?: string
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

// Human-readable error messages — raw codes shown as subtitle only
const ERROR_MESSAGES: Record<string, string> = {
  'field_too_long:body':            'Article body too long for Standard article. Retry as Cornerstone or ask for a shorter draft.',
  'field_too_short:body':           'Article body too short. Try a more specific topic.',
  'field_missing:question':         'Dilemma question missing in model output. Retry.',
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
  'low_novelty':                    'Content too similar to existing dilemmas.',
  'blog_article_save_not_supported':'Blog articles must be manually reviewed — save not available.',
  'invalid_topic':                  'Topic must be 3–200 characters.',
  'draft_save_failed':              'Failed to save draft to Redis. Retry.',
  'slug_too_short_after_normalize': 'Generated slug too short after normalization. Try a more descriptive topic.',
}

function friendlyError(code: string): string {
  if (code in ERROR_MESSAGES) return ERROR_MESSAGES[code]
  // Pattern prefixes
  if (code.startsWith('field_too_long:'))  return `Field too long: "${code.slice('field_too_long:'.length)}". Retry with a shorter topic or switch to Cornerstone.`
  if (code.startsWith('field_too_short:')) return `Field too short: "${code.slice('field_too_short:'.length)}". Topic may be too vague.`
  if (code.startsWith('field_missing:'))   return `Required field missing from model output: "${code.slice('field_missing:'.length)}". Retry.`
  if (code.startsWith('invalid_category:')) return `Invalid category: "${code.slice('invalid_category:'.length)}". Retry.`
  if (code.startsWith('semantic_review:')) return `Semantic review: ${code.slice('semantic_review:'.length).replace(/_/g, ' ')}.`
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

export default function GenerateDraftPanel({ defaultType = 'dilemma' }: { defaultType?: GenType }) {
  const [type, setType]               = useState<GenType>(defaultType)
  const [locale, setLocale]           = useState<GenLocale>('en')
  const [topic, setTopic]             = useState('')
  const [articleKind, setArticleKind] = useState<ArticleKind>('standard')
  const [angle, setAngle]             = useState('')
  const [notes, setNotes]             = useState('')
  const [loading, setLoading]         = useState<PanelMode | null>(null)
  const [preview, setPreview]         = useState<ValidatedCandidate | null>(null)
  const [translation, setTranslation] = useState<ValidatedBlogArticle | null>(null)
  const [translationFailed, setTranslationFailed] = useState(false)
  const [translationError, setTranslationError]   = useState<string | null>(null)
  const [savedId, setSavedId]         = useState<string | null>(null)
  const [lowNovelty, setLowNovelty]   = useState<{ score: number; threshold: number; candidate: ValidatedCandidate } | null>(null)
  const [error, setError]             = useState<string | null>(null)

  function reset() {
    setPreview(null)
    setSavedId(null)
    setLowNovelty(null)
    setError(null)
    setTranslation(null)
    setTranslationFailed(false)
    setTranslationError(null)
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
        body: JSON.stringify({
          type,
          locale,
          topic,
          mode,
          allowLowNovelty,
          articleKind: type === 'blog_article' ? articleKind : undefined,
          angle:  angle.trim()  || undefined,
          notes:  notes.trim()  || undefined,
        }),
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

      if ('translation' in ok) {
        const pr = ok as PreviewResult
        setTranslation(pr.translation ?? null)
        setTranslationFailed(pr.translationFailed ?? false)
        setTranslationError(pr.translationError ?? null)
      }

      if (ok.mode === 'save') {
        setSavedId((ok as SaveResult).savedId)
      }
    } catch {
      setError('openrouter_fetch_failed')
    } finally {
      setLoading(null)
    }
  }

  const canSave = type === 'dilemma'
  const topicOk = topic.trim().length >= 3

  const targetLocaleLabel = locale === 'en' ? '🇮🇹 IT' : '🇺🇸 EN'

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
        {/* Type */}
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

        {/* Article kind — only for blog_article */}
        {type === 'blog_article' && (
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
        )}

        {/* Locale */}
        <div className="flex flex-col gap-1">
          <label htmlFor="gen-locale" className="text-xs text-white/60">
            {type === 'blog_article' ? 'Source locale' : 'Locale'}
          </label>
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

      {type === 'blog_article' && (
        <p className="text-[11px] text-purple-300/60">
          ✨ Both {locale === 'en' ? '🇺🇸 EN' : '🇮🇹 IT'} source and {targetLocaleLabel} translation will be generated automatically.
        </p>
      )}

      {/* Topic */}
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

      {/* Dilemma-specific: angle + notes */}
      {type === 'dilemma' && (
        <div className="flex flex-wrap gap-3">
          <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
            <label htmlFor="gen-angle" className="text-xs text-white/60">Angle (optional)</label>
            <input
              id="gen-angle"
              type="text"
              value={angle}
              onChange={e => { setAngle(e.target.value); reset() }}
              placeholder="e.g. young workers vs established cities"
              className="bg-white/10 text-white rounded px-3 py-1.5 text-sm border border-white/10 placeholder:text-white/30"
            />
          </div>
          <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
            <label htmlFor="gen-notes" className="text-xs text-white/60">Context / notes (optional)</label>
            <input
              id="gen-notes"
              type="text"
              value={notes}
              onChange={e => { setNotes(e.target.value); reset() }}
              placeholder="e.g. inspired by report on remote work, abstract only"
              className="bg-white/10 text-white rounded px-3 py-1.5 text-sm border border-white/10 placeholder:text-white/30"
            />
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() => callApi('preview')}
          disabled={!topicOk || loading !== null}
          aria-busy={loading === 'preview'}
          className="bg-white/10 hover:bg-white/20 disabled:opacity-40 text-white font-semibold rounded px-5 py-2 text-sm transition-colors border border-white/10"
        >
          {loading === 'preview'
            ? (type === 'blog_article' ? 'Generating + translating…' : 'Generating…')
            : 'Preview'}
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

      {loading === 'preview' && type === 'blog_article' && (
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

      {/* Preview — source article */}
      {preview && (
        <div className="space-y-4 pt-2 border-t border-white/10">
          <CandidatePreview
            candidate={preview}
            label={type === 'blog_article' ? `${locale === 'en' ? '🇺🇸' : '🇮🇹'} Source (${locale.toUpperCase()})` : 'Preview'}
            color="green"
          />

          {/* Translation */}
          {type === 'blog_article' && translation && (
            <CandidatePreview
              candidate={translation}
              label={`${targetLocaleLabel} Translation`}
              color="blue"
            />
          )}

          {type === 'blog_article' && translationFailed && (
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
