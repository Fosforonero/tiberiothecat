'use client'

import { useState, useEffect, useCallback } from 'react'
import type { BlogDraft, BlogDraftStatus } from '@/lib/blog-drafts'

function StatusBadge({ status }: { status: BlogDraftStatus }) {
  const cls =
    status === 'published' ? 'bg-blue-900/60 text-blue-300 border-blue-700' :
    status === 'approved'  ? 'bg-green-900/60 text-green-300 border-green-700' :
    status === 'rejected'  ? 'bg-red-900/60 text-red-300 border-red-700' :
    'bg-yellow-900/60 text-yellow-300 border-yellow-700'
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold border ${cls}`}>
      {status}
    </span>
  )
}

function NoveltyBadge({ score }: { score: number }) {
  const cls = score >= 70
    ? 'bg-green-900/60 text-green-300 border-green-700'
    : score >= 55
      ? 'bg-yellow-900/60 text-yellow-300 border-yellow-700'
      : 'bg-red-900/60 text-red-300 border-red-700'
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold border ${cls}`}>
      N:{score}
    </span>
  )
}

function LocaleBadge({ locale }: { locale: string }) {
  return (
    <span className="inline-block px-2 py-0.5 rounded text-xs font-mono border border-white/10 text-white/50">
      {locale === 'en' ? '🇺🇸 EN' : '🇮🇹 IT'}
    </span>
  )
}

function KindBadge({ kind }: { kind: string }) {
  return (
    <span className="inline-block px-2 py-0.5 rounded text-xs border border-purple-500/30 text-purple-300/70">
      {kind}
    </span>
  )
}

interface ArticleBodyProps {
  article: BlogDraft['source']
  colorClass: string
}

function ArticleBody({ article, colorClass }: ArticleBodyProps) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 items-center">
        <LocaleBadge locale={article.locale} />
        <NoveltyBadge score={article.noveltyScore} />
        <span className="text-xs text-white/40 font-mono">/blog/{article.slug}</span>
      </div>
      <div className="text-xs text-white/50">
        <span className="text-white/30">Keywords: </span>
        {article.keywords.slice(0, 5).join(', ')}
      </div>
      {article.outline.length > 0 && (
        <div className="text-xs text-white/40">
          <span className="text-white/30">Outline: </span>
          {article.outline.join(' · ')}
        </div>
      )}
      <pre className={`bg-black/40 rounded p-3 text-xs overflow-x-auto max-h-64 whitespace-pre-wrap border border-white/5 ${colorClass}`}>
        {article.body}
      </pre>
      {article.faq && article.faq.length > 0 && (
        <details className="text-xs">
          <summary className="cursor-pointer text-white/40 hover:text-white/60">FAQ ({article.faq.length})</summary>
          <div className="mt-2 space-y-2 pl-2 border-l border-white/10">
            {article.faq.map((f, i) => (
              <div key={i}>
                <div className="text-white/60 font-semibold">Q: {f.q}</div>
                <div className="text-white/40">A: {f.a}</div>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}

export default function BlogDraftQueue() {
  const [drafts, setDrafts]       = useState<BlogDraft[]>([])
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [expanded, setExpanded]   = useState<Set<string>>(new Set())
  const [acting, setActing]       = useState<Record<string, boolean>>({})
  const [exporting, setExporting] = useState(false)

  const fetchDrafts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/blog-drafts')
      if (!res.ok) { setError('Failed to load drafts'); return }
      const data = await res.json() as { drafts: BlogDraft[] }
      setDrafts(data.drafts ?? [])
    } catch {
      setError('Network error loading drafts')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchDrafts() }, [fetchDrafts])

  async function exportPublished() {
    setExporting(true)
    try {
      const res = await fetch('/api/admin/blog-published/export')
      if (!res.ok) { alert('Export failed'); return }
      const blob = await res.blob()
      const filename = res.headers.get('Content-Disposition')?.match(/filename="([^"]+)"/)?.[1]
        ?? 'blog-published-export.json'
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Network error during export')
    } finally {
      setExporting(false)
    }
  }

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function act(id: string, action: 'approve' | 'reject' | 'publish') {
    setActing(prev => ({ ...prev, [id]: true }))
    try {
      const res = await fetch(`/api/admin/blog-drafts/${id}/${action}`, { method: 'POST' })
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

  const draftCount     = drafts.filter(d => d.status === 'draft').length
  const approvedCount  = drafts.filter(d => d.status === 'approved').length
  const rejectedCount  = drafts.filter(d => d.status === 'rejected').length
  const publishedCount = drafts.filter(d => d.status === 'published').length

  return (
    <section className="bg-white/5 rounded-xl p-6 space-y-4" aria-label="Blog Draft Queue">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-lg font-bold text-white">Blog Draft Queue</h2>
          <span className="text-xs text-yellow-400 border border-yellow-400/40 rounded px-2 py-0.5">
            Draft → Approve → Publish (manual, admin-only)
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportPublished}
            disabled={exporting}
            className="text-xs text-white/50 hover:text-white border border-white/10 rounded px-3 py-1 disabled:opacity-40"
          >
            {exporting ? 'Exporting…' : '↓ Export published JSON'}
          </button>
          <button
            onClick={fetchDrafts}
            disabled={loading}
            className="text-xs text-white/50 hover:text-white border border-white/10 rounded px-3 py-1 disabled:opacity-40"
          >
            {loading ? 'Loading…' : '↻ Refresh'}
          </button>
        </div>
      </div>

      <p className="text-xs text-white/40 leading-relaxed">
        <strong className="text-white/60">Approve</strong> marks a draft as editorially ready — does not publish.{' '}
        <strong className="text-blue-300/70">Publish</strong> (approved only) makes it live on the public blog immediately.
        Published articles appear in <code className="font-mono text-purple-300">/blog</code> and sitemap within 1h (ISR).
      </p>

      {error && (
        <div role="alert" className="text-red-400 text-xs bg-red-900/20 rounded p-2 border border-red-500/20">
          {error}
        </div>
      )}

      {!loading && drafts.length === 0 && !error && (
        <p className="text-white/30 text-sm text-center py-6">No blog drafts yet.</p>
      )}

      {drafts.length > 0 && (
        <div className="flex gap-4 text-xs text-white/40">
          <span>Draft: <strong className="text-yellow-300">{draftCount}</strong></span>
          <span>Approved: <strong className="text-green-300">{approvedCount}</strong></span>
          <span>Rejected: <strong className="text-red-300">{rejectedCount}</strong></span>
          <span>Published: <strong className="text-blue-300">{publishedCount}</strong></span>
        </div>
      )}

      <div className="space-y-3">
        {drafts.map(draft => {
          const isExpanded = expanded.has(draft.id)
          const isActing   = acting[draft.id] ?? false
          const ts         = new Date(draft.generatedAt).toLocaleString()

          return (
            <div
              key={draft.id}
              className="bg-black/30 border border-white/5 rounded-lg p-4 space-y-3"
            >
              {/* Header row */}
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap gap-2 items-center">
                    <StatusBadge status={draft.status} />
                    <LocaleBadge locale={draft.source.locale} />
                    <KindBadge kind={draft.source.articleKind} />
                    <NoveltyBadge score={draft.source.noveltyScore} />
                  </div>
                  <p className="text-sm font-semibold text-white truncate">{draft.source.title}</p>
                  <p className="text-xs text-white/40 font-mono">/blog/{draft.source.slug}</p>
                  <p className="text-xs text-white/30">
                    Topic: {draft.topic} · {ts}
                  </p>
                  <p className="text-xs text-white/40">
                    Keywords: {draft.source.keywords.slice(0, 4).join(', ')}
                    {draft.translation && (
                      <span className="ml-2 text-white/25">
                        · Translation: {draft.translation.locale.toUpperCase()} ✓
                      </span>
                    )}
                    {draft.translationFailed && (
                      <span className="ml-2 text-orange-400/60">· Translation failed</span>
                    )}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 items-end shrink-0">
                  {draft.status === 'draft' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => act(draft.id, 'approve')}
                        disabled={isActing}
                        className="text-xs bg-green-900/40 hover:bg-green-900/70 text-green-300 border border-green-700/40 rounded px-3 py-1 disabled:opacity-40 transition-colors"
                      >
                        {isActing ? '…' : 'Approve'}
                      </button>
                      <button
                        onClick={() => act(draft.id, 'reject')}
                        disabled={isActing}
                        className="text-xs bg-red-900/30 hover:bg-red-900/60 text-red-300 border border-red-700/30 rounded px-3 py-1 disabled:opacity-40 transition-colors"
                      >
                        {isActing ? '…' : 'Reject'}
                      </button>
                    </div>
                  )}
                  {draft.status === 'approved' && (
                    <div className="flex flex-col gap-1.5 items-end">
                      <p className="text-xs text-green-300/60">
                        Approved {draft.approvedAt ? new Date(draft.approvedAt).toLocaleDateString() : ''}
                      </p>
                      <button
                        onClick={() => act(draft.id, 'publish')}
                        disabled={isActing}
                        className="text-xs bg-blue-900/40 hover:bg-blue-900/70 text-blue-300 border border-blue-700/40 rounded px-3 py-1 disabled:opacity-40 transition-colors"
                      >
                        {isActing ? '…' : '🌐 Publish'}
                      </button>
                    </div>
                  )}
                  {draft.status === 'published' && (
                    <div className="flex flex-col gap-1 items-end">
                      <p className="text-xs text-blue-300/60">
                        Published {draft.publishedAt ? new Date(draft.publishedAt).toLocaleDateString() : ''}
                      </p>
                      <a
                        href={draft.source.locale === 'it' ? `/it/blog/${draft.source.slug}` : `/blog/${draft.source.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2"
                      >
                        {draft.source.locale === 'it' ? '🇮🇹' : '🇺🇸'} /blog/{draft.source.slug} ↗
                      </a>
                      {draft.translation && (
                        <a
                          href={draft.translation.locale === 'it' ? `/it/blog/${draft.translation.slug}` : `/blog/${draft.translation.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2"
                        >
                          {draft.translation.locale === 'it' ? '🇮🇹' : '🇺🇸'} /blog/{draft.translation.slug} ↗
                        </a>
                      )}
                    </div>
                  )}
                  {draft.status === 'rejected' && (
                    <p className="text-xs text-red-300/60">Rejected</p>
                  )}
                  <button
                    onClick={() => toggleExpand(draft.id)}
                    className="text-xs text-white/30 hover:text-white/60 border border-white/5 rounded px-2 py-0.5"
                  >
                    {isExpanded ? 'Collapse ▲' : 'Expand ▼'}
                  </button>
                </div>
              </div>

              {/* Expanded body */}
              {isExpanded && (
                <div className="space-y-4 pt-2 border-t border-white/5">
                  <ArticleBody article={draft.source} colorClass="text-green-300" />
                  {draft.translation && (
                    <ArticleBody article={draft.translation} colorClass="text-blue-200" />
                  )}
                  {draft.translationFailed && (
                    <p className="text-xs text-orange-400/60">
                      ⚠ Translation generation failed — source article only.
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
