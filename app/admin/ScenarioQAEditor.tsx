'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Edit2, Save, X, CheckCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react'

interface Scenario {
  id: string
  locale: string
  question: string
  optionA: string
  optionB: string
  emoji: string
  seoTitle?: string | null
  seoDescription?: string | null
  generatedAt: string
}

type EditState = Record<string, string>
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'
type LocaleFilter = 'all' | 'en' | 'it'

const FIELD_LIMITS: Record<string, number> = {
  question:       500,
  optionA:        220,
  optionB:        220,
  seoTitle:        80,
  seoDescription: 180,
}

export default function ScenarioQAEditor() {
  const [scenarios, setScenarios]     = useState<Scenario[]>([])
  const [loading, setLoading]         = useState(true)
  const [fetchError, setFetchError]   = useState<string | null>(null)
  const [search, setSearch]           = useState('')
  const [locale, setLocale]           = useState<LocaleFilter>('all')
  const [editingId, setEditingId]     = useState<string | null>(null)
  const [editState, setEditState]     = useState<EditState>({})
  const [saveStatus, setSaveStatus]   = useState<SaveStatus>('idle')
  const [saveError, setSaveError]     = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setFetchError(null)
    try {
      const params = new URLSearchParams({ status: 'approved', limit: '60' })
      if (locale !== 'all') params.set('locale', locale)
      const res = await fetch(`/api/admin/dilemmas?${params}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setScenarios(data.results ?? [])
    } catch {
      setFetchError('Failed to load scenarios. Check admin auth and Redis connection.')
    } finally {
      setLoading(false)
    }
  }, [locale])

  useEffect(() => { void load() }, [load])

  const filtered = scenarios.filter(s => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      s.question.toLowerCase().includes(q) ||
      s.optionA.toLowerCase().includes(q) ||
      s.optionB.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q)
    )
  })

  function startEdit(s: Scenario) {
    setEditingId(s.id)
    setEditState({
      question:       s.question,
      optionA:        s.optionA,
      optionB:        s.optionB,
      seoTitle:       s.seoTitle ?? '',
      seoDescription: s.seoDescription ?? '',
    })
    setSaveStatus('idle')
    setSaveError(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditState({})
    setSaveStatus('idle')
    setSaveError(null)
  }

  async function save(id: string) {
    setSaveStatus('saving')
    setSaveError(null)

    // Client-side length validation (mirrors server limits)
    for (const [field, max] of Object.entries(FIELD_LIMITS)) {
      const val = (editState[field] ?? '').trim()
      if (val.length > max) {
        setSaveStatus('error')
        setSaveError(`"${field}" exceeds ${max} chars (${val.length}/${max})`)
        return
      }
    }

    // Build payload — only non-empty patchable fields
    const payload: Record<string, string> = {}
    for (const field of ['question', 'optionA', 'optionB', 'seoTitle', 'seoDescription'] as const) {
      const v = (editState[field] ?? '').trim()
      if (v.length > 0) payload[field] = v
    }
    if (!payload.question && !payload.optionA && !payload.optionB) {
      setSaveStatus('error')
      setSaveError('question, optionA, or optionB must be non-empty')
      return
    }

    try {
      const res = await fetch(`/api/admin/dilemmas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        setSaveStatus('error')
        setSaveError(data.error ?? `Server error ${res.status}`)
        return
      }
      // Optimistic local update
      setScenarios(prev => prev.map(s =>
        s.id === id
          ? {
              ...s,
              question:       payload.question       ?? s.question,
              optionA:        payload.optionA        ?? s.optionA,
              optionB:        payload.optionB        ?? s.optionB,
              seoTitle:       payload.seoTitle       ?? s.seoTitle,
              seoDescription: payload.seoDescription ?? s.seoDescription,
            }
          : s
      ))
      setSaveStatus('saved')
      setTimeout(() => {
        setEditingId(null)
        setEditState({})
        setSaveStatus('idle')
      }, 1400)
    } catch {
      setSaveStatus('error')
      setSaveError('Network error — try again')
    }
  }

  function charCounter(field: string, max: number) {
    const len = (editState[field] ?? '').length
    const over = len > max
    return (
      <span className={`text-[10px] tabular-nums ${over ? 'text-red-400 font-bold' : 'text-[var(--muted)]'}`}>
        {len}/{max}
      </span>
    )
  }

  function inputClass(field: string) {
    const len = (editState[field] ?? '').length
    const max = FIELD_LIMITS[field] ?? 500
    return `w-full bg-[#07071a] border rounded-lg px-3 py-2 text-xs text-white font-mono resize-none focus:outline-none transition-colors ${
      len > max
        ? 'border-red-500/60 focus:border-red-400'
        : 'border-white/10 focus:border-blue-500/50'
    }`
  }

  return (
    <div>
      {/* ── Filters row ── */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none" />
          <input
            type="text"
            placeholder="Search question, options, id…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[var(--surface)] border border-white/10 rounded-xl pl-8 pr-3 py-2 text-sm text-white placeholder:text-[var(--muted)] focus:outline-none focus:border-blue-500/40 transition-colors"
          />
        </div>
        <div className="flex gap-1.5 items-center">
          {(['all', 'en', 'it'] as const).map(l => (
            <button
              key={l}
              onClick={() => setLocale(l)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                locale === l
                  ? 'bg-blue-500/20 border border-blue-500/40 text-blue-300'
                  : 'bg-[var(--surface)] border border-white/10 text-[var(--muted)] hover:text-white'
              }`}
            >
              {l === 'all' ? 'All' : l === 'en' ? '🇺🇸 EN' : '🇮🇹 IT'}
            </button>
          ))}
          <button
            onClick={() => void load()}
            disabled={loading}
            title="Reload"
            className="px-2.5 py-2 rounded-xl text-xs bg-[var(--surface)] border border-white/10 text-[var(--muted)] hover:text-white transition-colors"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── State banners ── */}
      {loading && (
        <div className="flex items-center justify-center gap-2 text-sm text-[var(--muted)] py-10">
          <Loader2 size={14} className="animate-spin" /> Loading approved scenarios…
        </div>
      )}
      {fetchError && !loading && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400 flex items-center gap-2 mb-4">
          <AlertCircle size={14} /> {fetchError}
        </div>
      )}
      {!loading && !fetchError && filtered.length === 0 && (
        <p className="text-center py-10 text-sm text-[var(--muted)]">
          {search.trim() ? `No scenarios match "${search}"` : 'No approved scenarios found'}
        </p>
      )}

      {/* ── Scenario list ── */}
      {!loading && !fetchError && filtered.length > 0 && (
        <>
          <div className="space-y-2">
            {filtered.map(s => {
              const isEditing = editingId === s.id
              return (
                <div
                  key={s.id}
                  className={`rounded-xl border transition-all ${
                    isEditing
                      ? 'border-blue-500/40 bg-blue-500/[0.04]'
                      : 'border-white/10 bg-[var(--surface)] hover:border-white/20'
                  }`}
                >
                  {/* Row header */}
                  <div className="flex items-start gap-3 px-3 py-3">
                    <span className="text-lg flex-shrink-0 leading-none mt-0.5">{s.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                          s.locale === 'it'
                            ? 'text-green-300 border-green-500/30 bg-green-500/10'
                            : 'text-blue-300 border-blue-500/30 bg-blue-500/10'
                        }`}>
                          {s.locale.toUpperCase()}
                        </span>
                        <span className="font-mono text-[10px] text-[var(--muted)] truncate max-w-[160px]">{s.id}</span>
                      </div>
                      {!isEditing && (
                        <p className="text-xs text-white/80 leading-snug line-clamp-2">{s.question}</p>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      {!isEditing ? (
                        <button
                          onClick={() => startEdit(s)}
                          className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[var(--muted)] hover:text-white hover:border-white/25 transition-colors"
                        >
                          <Edit2 size={11} /> Edit
                        </button>
                      ) : (
                        <button
                          onClick={cancelEdit}
                          className="p-1 text-[var(--muted)] hover:text-white transition-colors"
                          title="Cancel"
                        >
                          <X size={15} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Inline edit form */}
                  {isEditing && (
                    <div className="px-3 pb-3 space-y-2.5 border-t border-white/5 pt-3">
                      {/* Question */}
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Question</label>
                          {charCounter('question', 500)}
                        </div>
                        <textarea
                          rows={3}
                          value={editState.question ?? ''}
                          onChange={e => setEditState(p => ({ ...p, question: e.target.value }))}
                          className={inputClass('question')}
                        />
                      </div>

                      {/* Option A */}
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-red-400">Option A</label>
                          {charCounter('optionA', 220)}
                        </div>
                        <textarea
                          rows={2}
                          value={editState.optionA ?? ''}
                          onChange={e => setEditState(p => ({ ...p, optionA: e.target.value }))}
                          className={inputClass('optionA')}
                        />
                      </div>

                      {/* Option B */}
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Option B</label>
                          {charCounter('optionB', 220)}
                        </div>
                        <textarea
                          rows={2}
                          value={editState.optionB ?? ''}
                          onChange={e => setEditState(p => ({ ...p, optionB: e.target.value }))}
                          className={inputClass('optionB')}
                        />
                      </div>

                      {/* SEO fields (compact 2-col) */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">SEO Title</label>
                            {charCounter('seoTitle', 80)}
                          </div>
                          <input
                            type="text"
                            value={editState.seoTitle ?? ''}
                            onChange={e => setEditState(p => ({ ...p, seoTitle: e.target.value }))}
                            className={inputClass('seoTitle')}
                          />
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">SEO Desc</label>
                            {charCounter('seoDescription', 180)}
                          </div>
                          <input
                            type="text"
                            value={editState.seoDescription ?? ''}
                            onChange={e => setEditState(p => ({ ...p, seoDescription: e.target.value }))}
                            className={inputClass('seoDescription')}
                          />
                        </div>
                      </div>

                      {/* Error banner */}
                      {saveError && (
                        <div className="flex items-center gap-2 text-xs text-red-400 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2">
                          <AlertCircle size={12} className="flex-shrink-0" /> {saveError}
                        </div>
                      )}

                      {/* Save row */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => void save(s.id)}
                          disabled={saveStatus === 'saving' || saveStatus === 'saved'}
                          className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl transition-all ${
                            saveStatus === 'saved'
                              ? 'bg-green-500/20 border border-green-500/40 text-green-300 cursor-default'
                              : saveStatus === 'saving'
                              ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400/70 cursor-wait'
                              : 'bg-blue-500/20 border border-blue-500/40 text-blue-300 hover:bg-blue-500/30'
                          }`}
                        >
                          {saveStatus === 'saving' && <Loader2 size={11} className="animate-spin" />}
                          {saveStatus === 'saved'  && <CheckCircle size={11} />}
                          {(saveStatus === 'idle' || saveStatus === 'error') && <Save size={11} />}
                          {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved!' : 'Save changes'}
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="text-xs text-[var(--muted)] hover:text-white transition-colors px-2 py-2"
                        >
                          Cancel
                        </button>
                        <span className="ml-auto font-mono text-[10px] text-[var(--muted)] hidden sm:block">{s.id}</span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <p className="text-[10px] text-[var(--muted)] text-center mt-4 opacity-60">
            {filtered.length} of {scenarios.length} approved scenarios
            {search.trim() ? ` matching "${search}"` : ''}
          </p>
        </>
      )}
    </div>
  )
}
