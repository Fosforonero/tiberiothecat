'use client'

import { useState } from 'react'

type Source   = 'manual' | 'picoclaw' | 'workflow-kernel'
type Locale   = 'en' | 'it'
type ItemType = 'news' | 'trend' | 'fact'

interface DilemmaPreview {
  category:       string
  question:       string
  optionA:        string
  optionB:        string
  seoKeywords:    string[]
  editorialNote:  string
  removedDetails: string[]
  sourceNote:     string
  confidence:     number
}

interface PreviewResult {
  input:      { source: string; locale: string; type: string; title: string }
  validation: { riskFlags: string[]; suggestedTransformation: string }
  preview:    DilemmaPreview | null
  parseError?: string
  aiError?:   string
  meta:       Record<string, unknown>
}

const EXAMPLE_A = {
  source:  'manual' as Source,
  locale:  'en'    as Locale,
  type:    'news'  as ItemType,
  title:   'New protocols for law enforcement use-of-force in public spaces',
  summary: 'Authorities debate proportional response guidelines after urban incidents raise questions about deterrence versus civil liberties and human rights.',
  url:     '',
  tags:    'law-enforcement, public-safety, civil-rights, deterrence, protocols',
  facts:   'Multiple incidents in urban areas prompted oversight review\nNew proportionality guidelines under public debate',
}

const EXAMPLE_B = {
  source:  'manual' as Source,
  locale:  'en'    as Locale,
  type:    'trend' as ItemType,
  title:   'Oil market volatility reshapes national energy policy decisions',
  summary: 'Governments face pressure to stabilise energy markets in the short term while long-term climate commitments push towards renewables, creating a structural tension between economic stability and sustainability.',
  url:     '',
  tags:    'energy, oil, climate, economy, sustainability, geopolitics',
  facts:   'Several nations delayed renewable targets citing energy security\nOil-dependent economies face currency pressure',
}

function confidenceColor(c: number) {
  return c >= 0.75 ? 'text-green-400' : c >= 0.5 ? 'text-yellow-400' : 'text-orange-400'
}

export default function NewsToDilemmaPreviewPanel() {
  const [source,  setSource]  = useState<Source>('manual')
  const [locale,  setLocale]  = useState<Locale>('en')
  const [type,    setType]    = useState<ItemType>('news')
  const [title,   setTitle]   = useState('')
  const [summary, setSummary] = useState('')
  const [url,     setUrl]     = useState('')
  const [tags,    setTags]    = useState('')
  const [facts,   setFacts]   = useState('')

  const [loading,  setLoading]  = useState(false)
  const [result,   setResult]   = useState<PreviewResult | null>(null)
  const [error,    setError]    = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [rawJson,  setRawJson]  = useState<unknown>(null)

  function applyExample(ex: typeof EXAMPLE_A) {
    setSource(ex.source)
    setLocale(ex.locale)
    setType(ex.type)
    setTitle(ex.title)
    setSummary(ex.summary)
    setUrl(ex.url)
    setTags(ex.tags)
    setFacts(ex.facts)
    setResult(null)
    setError(null)
    setRawJson(null)
    setExpanded(false)
  }

  function clearOutput() {
    setResult(null)
    setError(null)
    setRawJson(null)
    setExpanded(false)
  }

  async function generate() {
    setLoading(true)
    clearOutput()
    try {
      const tagsArr  = tags.split(',').map(t => t.trim()).filter(Boolean)
      const factsArr = facts.split('\n').map(f => f.trim()).filter(Boolean)
      const body: Record<string, unknown> = {
        source,
        locale,
        item: {
          type,
          title:   title.trim(),
          summary: summary.trim(),
          ...(tagsArr.length  > 0 ? { tags:  tagsArr  } : {}),
          ...(factsArr.length > 0 ? { facts: factsArr } : {}),
          ...(url.trim()          ? { url:   url.trim() } : {}),
        },
      }
      const res = await fetch('/api/admin/news-to-dilemma-preview', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })
      const data: unknown = await res.json()
      setRawJson(data)
      if (!res.ok) {
        const e = data as { error?: string }
        setError(e.error ?? 'request_failed')
        return
      }
      setResult(data as PreviewResult)
    } catch {
      setError('network_error')
    } finally {
      setLoading(false)
    }
  }

  const canGenerate = title.trim().length >= 5 && summary.trim().length >= 10 && !loading

  return (
    <section className="bg-white/5 rounded-xl p-6 space-y-4" aria-label="News to Dilemma Preview Panel">
      <div className="flex items-center gap-3 flex-wrap">
        <h2 className="text-lg font-bold text-white">News → Dilemma Preview</h2>
        <span className="text-xs text-purple-400 border border-purple-400/40 rounded px-2 py-0.5">
          AI preview — no writes
        </span>
      </div>

      <p className="text-white/50 text-xs">
        Submit a normalised news/trend/fact item. AI abstracts it into a universal moral dilemma preview.
        No URL fetching, no Redis/DB writes, no publish.
      </p>

      {/* Example buttons */}
      <div className="flex gap-3 items-center flex-wrap">
        <span className="text-xs text-white/40">Examples:</span>
        <button
          onClick={() => applyExample(EXAMPLE_A)}
          className="text-xs text-blue-400 hover:text-blue-300 underline"
        >
          A — public safety / deterrence
        </button>
        <button
          onClick={() => applyExample(EXAMPLE_B)}
          className="text-xs text-purple-400 hover:text-purple-300 underline"
        >
          B — energy / oil / markets
        </button>
      </div>

      {/* Controls row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="ntd-source" className="text-xs text-white/60">Source</label>
          <select
            id="ntd-source"
            value={source}
            onChange={e => { setSource(e.target.value as Source); clearOutput() }}
            className="bg-white/10 text-white rounded px-3 py-1.5 text-sm border border-white/10"
          >
            <option value="manual">manual</option>
            <option value="picoclaw">picoclaw</option>
            <option value="workflow-kernel">workflow-kernel</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="ntd-locale" className="text-xs text-white/60">Locale</label>
          <select
            id="ntd-locale"
            value={locale}
            onChange={e => { setLocale(e.target.value as Locale); clearOutput() }}
            className="bg-white/10 text-white rounded px-3 py-1.5 text-sm border border-white/10"
          >
            <option value="en">🇺🇸 EN</option>
            <option value="it">🇮🇹 IT</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="ntd-type" className="text-xs text-white/60">Type</label>
          <select
            id="ntd-type"
            value={type}
            onChange={e => { setType(e.target.value as ItemType); clearOutput() }}
            className="bg-white/10 text-white rounded px-3 py-1.5 text-sm border border-white/10"
          >
            <option value="news">news</option>
            <option value="trend">trend</option>
            <option value="fact">fact</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="ntd-title" className="text-xs text-white/60">Title</label>
        <textarea
          id="ntd-title"
          value={title}
          onChange={e => { setTitle(e.target.value); clearOutput() }}
          placeholder="News headline or topic title"
          rows={2}
          className="bg-white/10 text-white rounded px-3 py-2 text-sm border border-white/10 resize-none placeholder:text-white/30"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="ntd-summary" className="text-xs text-white/60">Summary</label>
        <textarea
          id="ntd-summary"
          value={summary}
          onChange={e => { setSummary(e.target.value); clearOutput() }}
          placeholder="Neutral, factual summary — no names, no brands"
          rows={3}
          className="bg-white/10 text-white rounded px-3 py-2 text-sm border border-white/10 resize-none placeholder:text-white/30"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="ntd-tags" className="text-xs text-white/60">
            Tags <span className="text-white/30">(comma-separated)</span>
          </label>
          <input
            id="ntd-tags"
            type="text"
            value={tags}
            onChange={e => { setTags(e.target.value); clearOutput() }}
            placeholder="ethics, public-policy, transparency"
            className="bg-white/10 text-white rounded px-3 py-1.5 text-sm border border-white/10 placeholder:text-white/30"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="ntd-url" className="text-xs text-white/60">
            URL <span className="text-white/30">(metadata only — never fetched)</span>
          </label>
          <input
            id="ntd-url"
            type="url"
            value={url}
            onChange={e => { setUrl(e.target.value); clearOutput() }}
            placeholder="https://example.com/article"
            className="bg-white/10 text-white rounded px-3 py-1.5 text-sm border border-white/10 placeholder:text-white/30"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="ntd-facts" className="text-xs text-white/60">
          Facts <span className="text-white/30">(one per line)</span>
        </label>
        <textarea
          id="ntd-facts"
          value={facts}
          onChange={e => { setFacts(e.target.value); clearOutput() }}
          placeholder={'Key fact 1\nKey fact 2'}
          rows={3}
          className="bg-white/10 text-white rounded px-3 py-2 text-sm border border-white/10 resize-none placeholder:text-white/30"
        />
      </div>

      <div className="flex gap-3 items-center">
        <button
          onClick={generate}
          disabled={!canGenerate}
          aria-busy={loading}
          className="bg-purple-700/40 hover:bg-purple-700/70 disabled:opacity-40 text-purple-200 font-semibold rounded px-5 py-2 text-sm transition-colors border border-purple-500/30"
        >
          {loading ? 'Generating…' : 'Generate preview'}
        </button>
        {loading && (
          <span className="text-xs text-white/40 animate-pulse">Calling OpenRouter — may take up to 30 s…</span>
        )}
      </div>

      {error && (
        <div role="alert" className="text-red-400 text-xs bg-red-900/20 rounded p-3 border border-red-500/20 font-mono">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-4 pt-2 border-t border-white/10">

          {/* Validation flags */}
          {(result.validation.riskFlags.length > 0 || result.validation.suggestedTransformation) && (
            <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-3 space-y-2">
              <p className="text-xs font-black uppercase tracking-widest text-orange-400">Validation</p>
              {result.validation.riskFlags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {result.validation.riskFlags.map(f => (
                    <span key={f} className="text-[10px] bg-orange-900/40 text-orange-300 rounded px-1.5 py-0.5 border border-orange-500/20">
                      {f}
                    </span>
                  ))}
                </div>
              )}
              {result.validation.suggestedTransformation && (
                <p className="text-[10px] text-purple-300/70">
                  suggestion: <span className="font-mono">{result.validation.suggestedTransformation}</span>
                </p>
              )}
            </div>
          )}

          {/* AI error */}
          {(result.aiError || result.parseError) && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3">
              <p className="text-xs font-black uppercase tracking-widest text-red-400 mb-1">AI Error</p>
              <p className="text-xs font-mono text-red-300">{result.aiError ?? result.parseError}</p>
            </div>
          )}

          {/* Dilemma preview */}
          {result.preview && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <p className="text-xs font-black uppercase tracking-widest text-purple-400">Dilemma Preview</p>
                <span className="text-xs font-mono border border-purple-500/30 bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded">
                  {result.preview.category}
                </span>
                <span className={`text-xs font-black ${confidenceColor(result.preview.confidence)}`}>
                  confidence {Math.round(result.preview.confidence * 100)}%
                </span>
              </div>

              <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4 space-y-3">
                <p className="text-sm font-semibold text-white leading-snug">{result.preview.question}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
                    <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest mb-1">Option A</p>
                    <p className="text-xs text-white/80">{result.preview.optionA}</p>
                  </div>
                  <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-3">
                    <p className="text-[10px] text-green-400 font-black uppercase tracking-widest mb-1">Option B</p>
                    <p className="text-xs text-white/80">{result.preview.optionB}</p>
                  </div>
                </div>
              </div>

              {result.preview.editorialNote && (
                <div className="text-xs text-white/60 bg-white/5 rounded p-3 border border-white/10">
                  <span className="text-white/40 font-semibold uppercase tracking-wider text-[10px]">Editorial · </span>
                  {result.preview.editorialNote}
                </div>
              )}

              {result.preview.sourceNote && (
                <p className="text-[10px] text-white/40 font-mono">{result.preview.sourceNote}</p>
              )}

              {result.preview.seoKeywords.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {result.preview.seoKeywords.map(k => (
                    <span key={k} className="text-[10px] bg-white/5 text-white/50 rounded px-2 py-0.5 border border-white/10">
                      {k}
                    </span>
                  ))}
                </div>
              )}

              {result.preview.removedDetails.length > 0 && (
                <div className="text-[10px] text-white/40 space-y-0.5">
                  <p className="font-semibold uppercase tracking-wider">Abstracted away:</p>
                  {result.preview.removedDetails.map(d => (
                    <p key={d} className="ml-2">· {d}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Raw JSON collapsible */}
          <div>
            <button
              onClick={() => setExpanded(e => !e)}
              className="text-xs text-white/40 hover:text-white/70 underline"
            >
              {expanded ? 'Hide' : 'Show'} raw response
            </button>
            {expanded && (
              <pre className="mt-2 bg-black/40 rounded p-3 text-xs text-white/60 overflow-x-auto max-h-80 font-mono border border-white/5">
                {JSON.stringify(rawJson, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
