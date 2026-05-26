'use client'

import { useCallback, useEffect, useState } from 'react'
import type { LandingDraft, LandingDraftRisk, LandingDraftStatus } from '@/lib/landing-drafts'

function StatusBadge({ status }: { status: LandingDraftStatus }) {
  const cls =
    status === 'approved' ? 'bg-green-900/60 text-green-300 border-green-700' :
    status === 'rejected' ? 'bg-red-900/60 text-red-300 border-red-700' :
    'bg-yellow-900/60 text-yellow-300 border-yellow-700'
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold border ${cls}`}>
      {status}
    </span>
  )
}

function RiskBadge({ risk }: { risk: LandingDraftRisk }) {
  const cls =
    risk === 'low' ? 'bg-green-900/50 text-green-300 border-green-700/60' :
    risk === 'medium' ? 'bg-yellow-900/50 text-yellow-300 border-yellow-700/60' :
    'bg-red-900/50 text-red-300 border-red-700/60'
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold border ${cls}`}>
      {risk} risk
    </span>
  )
}

function LocalePanel({
  locale,
  draft,
}: {
  locale: 'en' | 'it'
  draft: LandingDraft
}) {
  const path = locale === 'it' ? `/it/${draft.slug.it}` : `/${draft.slug.en}`

  return (
    <div className="rounded-lg border border-white/5 bg-black/25 p-3 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-block px-2 py-0.5 rounded text-xs font-mono border border-white/10 text-white/50">
          {locale === 'en' ? 'EN' : 'IT'}
        </span>
        <span className="text-xs text-white/40 font-mono">{path}</span>
      </div>
      <div>
        <p className="text-sm font-semibold text-white">{draft.title[locale]}</p>
        <p className="text-xs text-white/40 mt-1">{draft.intro[locale]}</p>
      </div>
      <div className="text-xs text-white/45 space-y-1">
        <p><span className="text-white/25">SEO title:</span> {draft.seoTitle[locale]}</p>
        <p><span className="text-white/25">Meta:</span> {draft.seoDescription[locale]}</p>
        <p><span className="text-white/25">Keywords:</span> {draft.keywords[locale].join(', ')}</p>
      </div>
      <details className="text-xs">
        <summary className="cursor-pointer text-white/40 hover:text-white/60">
          FAQ ({draft.faq[locale].length})
        </summary>
        <div className="mt-2 space-y-2 border-l border-white/10 pl-3">
          {draft.faq[locale].map((item, index) => (
            <div key={`${locale}-${index}`}>
              <p className="font-semibold text-white/65">Q: {item.q}</p>
              <p className="text-white/40">A: {item.a}</p>
            </div>
          ))}
        </div>
      </details>
    </div>
  )
}

export default function LandingDraftQueue() {
  const [drafts, setDrafts] = useState<LandingDraft[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [acting, setActing] = useState<Record<string, boolean>>({})

  const fetchDrafts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/landing-drafts')
      if (!res.ok) {
        setError('Failed to load landing drafts')
        return
      }
      const data = await res.json() as { drafts: LandingDraft[] }
      setDrafts(data.drafts ?? [])
    } catch {
      setError('Network error loading landing drafts')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchDrafts() }, [fetchDrafts])

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function act(id: string, action: 'approve' | 'reject') {
    setActing(prev => ({ ...prev, [id]: true }))
    try {
      const res = await fetch(`/api/admin/landing-drafts/${id}/${action}`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        alert(data.error ?? `${action} failed`)
        return
      }
      await fetchDrafts()
    } catch {
      alert('Network error')
    } finally {
      setActing(prev => ({ ...prev, [id]: false }))
    }
  }

  const draftCount = drafts.filter(d => d.status === 'draft').length
  const approvedCount = drafts.filter(d => d.status === 'approved').length
  const rejectedCount = drafts.filter(d => d.status === 'rejected').length

  return (
    <section className="bg-white/5 rounded-xl p-6 space-y-4" aria-label="Landing Draft Queue">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-lg font-bold text-white">Landing Draft Queue</h2>
          <span className="text-xs text-yellow-400 border border-yellow-400/40 rounded px-2 py-0.5">
            Draft - Approve - code implementation
          </span>
        </div>
        <button
          onClick={fetchDrafts}
          disabled={loading}
          className="text-xs text-white/50 hover:text-white border border-white/10 rounded px-3 py-1 disabled:opacity-40"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      <p className="text-xs text-white/40 leading-relaxed">
        Approving a landing marks it as editorially ready. It does not publish a public page.
        Public landing pages still require a code implementation, sitemap entry, hreflang, and build.
      </p>

      {error && (
        <div role="alert" className="text-red-400 text-xs bg-red-900/20 rounded p-2 border border-red-500/20">
          {error}
        </div>
      )}

      {!loading && drafts.length === 0 && !error && (
        <p className="text-white/30 text-sm text-center py-6">No landing drafts yet.</p>
      )}

      {drafts.length > 0 && (
        <div className="flex gap-4 text-xs text-white/40">
          <span>Draft: <strong className="text-yellow-300">{draftCount}</strong></span>
          <span>Approved: <strong className="text-green-300">{approvedCount}</strong></span>
          <span>Rejected: <strong className="text-red-300">{rejectedCount}</strong></span>
        </div>
      )}

      <div className="space-y-3">
        {drafts.map(draft => {
          const isExpanded = expanded.has(draft.id)
          const isActing = acting[draft.id] ?? false
          const ts = new Date(draft.generatedAt).toLocaleString()

          return (
            <div key={draft.id} className="bg-black/30 border border-white/5 rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap gap-2 items-center">
                    <StatusBadge status={draft.status} />
                    <RiskBadge risk={draft.risk} />
                  </div>
                  <p className="text-sm font-semibold text-white truncate">{draft.title.en}</p>
                  <p className="text-xs text-white/40 font-mono">/{draft.slug.en} - /it/{draft.slug.it}</p>
                  <p className="text-xs text-white/30">Generated: {ts}</p>
                </div>

                <div className="flex flex-col gap-2 items-end shrink-0">
                  {draft.status === 'draft' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => act(draft.id, 'approve')}
                        disabled={isActing}
                        className="text-xs bg-green-900/40 hover:bg-green-900/70 text-green-300 border border-green-700/40 rounded px-3 py-1 disabled:opacity-40 transition-colors"
                      >
                        {isActing ? '...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => act(draft.id, 'reject')}
                        disabled={isActing}
                        className="text-xs bg-red-900/30 hover:bg-red-900/60 text-red-300 border border-red-700/30 rounded px-3 py-1 disabled:opacity-40 transition-colors"
                      >
                        {isActing ? '...' : 'Reject'}
                      </button>
                    </div>
                  )}
                  <button
                    onClick={() => toggleExpand(draft.id)}
                    className="text-xs text-white/30 hover:text-white/60 border border-white/5 rounded px-2 py-0.5"
                  >
                    {isExpanded ? 'Collapse' : 'Expand'}
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="space-y-4 pt-2 border-t border-white/5">
                  <div className="grid gap-3 md:grid-cols-2">
                    <LocalePanel locale="en" draft={draft} />
                    <LocalePanel locale="it" draft={draft} />
                  </div>
                  <div className="grid gap-3 md:grid-cols-2 text-xs">
                    <div className="rounded-lg border border-white/5 bg-black/25 p-3">
                      <p className="font-semibold text-white/60 mb-2">Related dilemmas</p>
                      <div className="flex flex-wrap gap-1.5">
                        {draft.relatedDilemmaIds.map(id => (
                          <span key={id} className="rounded border border-white/10 px-2 py-0.5 text-white/40 font-mono">
                            {id}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-lg border border-white/5 bg-black/25 p-3">
                      <p className="font-semibold text-white/60 mb-2">Notes</p>
                      <ul className="space-y-1 text-white/40 list-disc list-inside">
                        {draft.notes.map(note => <li key={note}>{note}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
