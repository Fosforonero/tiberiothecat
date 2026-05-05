'use client'

import { useState } from 'react'

const EXAMPLE_PAYLOAD = JSON.stringify(
  {
    source: 'manual',
    locale: 'en',
    items: [
      {
        type:    'news',
        title:   'New protocols for law enforcement use-of-force in public spaces',
        summary: 'Authorities debate proportional response guidelines after urban incidents raise questions about deterrence versus civil liberties.',
        tags:    ['law-enforcement', 'public-safety', 'civil-rights', 'deterrence'],
      },
      {
        type:    'trend',
        title:   'Oil market volatility reshapes national energy policy decisions',
        summary: 'Governments face pressure to stabilise markets while transitioning to renewables, creating tension between short-term stability and long-term climate commitments.',
        tags:    ['energy', 'oil', 'climate', 'economy', 'sustainability'],
      },
    ],
  },
  null,
  2,
)

interface IntakeSummary {
  received: number
  accepted: number
  rejected: number
  flagged:  number
}

interface AcceptedItem {
  index:                   number
  type:                    string
  title:                   string
  riskFlags:               string[]
  suggestedTransformation: string
}

interface RejectedItem {
  index:  number
  reason: string
}

interface FlaggedItem {
  index:     number
  title:     string
  riskFlags: string[]
}

interface IntakeResult {
  dryRunEnforced: boolean
  source:  string
  locale:  string
  summary: IntakeSummary
  accepted: AcceptedItem[]
  rejected: RejectedItem[]
  flagged:  FlaggedItem[]
}

export default function ContentSignalsPanel() {
  const [raw, setRaw]           = useState('')
  const [loading, setLoading]   = useState(false)
  const [result, setResult]     = useState<IntakeResult | null>(null)
  const [rawJson, setRawJson]   = useState<unknown>(null)
  const [error, setError]       = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  function loadExample() {
    setRaw(EXAMPLE_PAYLOAD)
    setResult(null)
    setRawJson(null)
    setError(null)
  }

  async function submit() {
    setLoading(true)
    setResult(null)
    setRawJson(null)
    setError(null)
    try {
      let parsed: unknown
      try {
        parsed = JSON.parse(raw)
      } catch {
        setError('Invalid JSON — parse error before sending')
        return
      }
      const res = await fetch('/api/admin/content-intake', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(parsed),
      })
      const data: unknown = await res.json()
      setRawJson(data)
      if (!res.ok) {
        const e = data as { error?: string }
        setError(e.error ?? 'request_failed')
        return
      }
      setResult(data as IntakeResult)
    } catch {
      setError('network_error')
    } finally {
      setLoading(false)
    }
  }

  const canSubmit = raw.trim().length > 0 && !loading

  return (
    <section className="bg-white/5 rounded-xl p-6 space-y-4" aria-label="Content Signals Intake Panel">
      <div className="flex items-center gap-3 flex-wrap">
        <h2 className="text-lg font-bold text-white">Content Signals Intake</h2>
        <span className="text-xs text-blue-400 border border-blue-400/40 rounded px-2 py-0.5">
          validation only — no writes
        </span>
      </div>

      <p className="text-white/50 text-xs">
        POST structured signals to{' '}
        <code className="font-mono text-white/70">/api/admin/content-intake</code>.
        Phase 0: validates, risk-flags, and suggests transformations. No AI, no DB writes.
      </p>

      {/* Payload input */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <label htmlFor="cs-json" className="text-xs text-white/60">Payload JSON</label>
          <button
            onClick={loadExample}
            className="text-xs text-blue-400 hover:text-blue-300 underline"
          >
            Load example (A + B)
          </button>
        </div>
        <textarea
          id="cs-json"
          value={raw}
          onChange={e => { setRaw(e.target.value); setResult(null); setError(null) }}
          placeholder={'{\n  "source": "manual",\n  "locale": "en",\n  "items": [...]\n}'}
          rows={12}
          spellCheck={false}
          className="bg-black/40 text-green-300 rounded px-3 py-2 text-xs border border-white/10 resize-y placeholder:text-white/20 font-mono"
        />
      </div>

      <div className="flex gap-3 items-center">
        <button
          onClick={submit}
          disabled={!canSubmit}
          aria-busy={loading}
          className="bg-blue-700/40 hover:bg-blue-700/70 disabled:opacity-40 text-blue-200 font-semibold rounded px-5 py-2 text-sm transition-colors border border-blue-500/30"
        >
          {loading ? 'Validating…' : 'Validate'}
        </button>
        {loading && (
          <span className="text-xs text-white/40 animate-pulse">Sending to content-intake…</span>
        )}
      </div>

      {error && (
        <div role="alert" className="text-red-400 text-xs bg-red-900/20 rounded p-3 border border-red-500/20 font-mono">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-4 pt-2 border-t border-white/10">
          {/* Summary grid */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Received', value: result.summary.received, color: 'text-white/70'  },
              { label: 'Accepted', value: result.summary.accepted, color: 'text-green-400'  },
              { label: 'Rejected', value: result.summary.rejected, color: 'text-red-400'    },
              { label: 'Flagged',  value: result.summary.flagged,  color: 'text-orange-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center rounded-xl border border-white/10 bg-white/5 p-3">
                <p className={`text-2xl font-black ${color}`}>{value}</p>
                <p className="text-xs text-[var(--muted)] mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Accepted */}
          {result.accepted.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-black uppercase tracking-widest text-green-400">Accepted</p>
              {result.accepted.map(item => (
                <div key={item.index} className="rounded-xl border border-green-500/20 bg-green-500/5 p-3 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono text-white/40">#{item.index}</span>
                    <span className="text-xs font-bold text-white/60 uppercase tracking-wide">{item.type}</span>
                    <span className="text-xs text-white/80 truncate flex-1">{item.title}</span>
                  </div>
                  {item.riskFlags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {item.riskFlags.map(f => (
                        <span key={f} className="text-[10px] bg-orange-900/40 text-orange-300 rounded px-1.5 py-0.5 border border-orange-500/20">
                          {f}
                        </span>
                      ))}
                    </div>
                  )}
                  {item.suggestedTransformation && (
                    <p className="text-[10px] text-purple-300/70">
                      suggestion: <span className="font-mono">{item.suggestedTransformation}</span>
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Rejected */}
          {result.rejected.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-black uppercase tracking-widest text-red-400">Rejected</p>
              {result.rejected.map(item => (
                <div key={item.index} className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 flex items-start gap-2">
                  <span className="text-xs font-mono text-white/40">#{item.index}</span>
                  <span className="text-xs text-red-300">{item.reason}</span>
                </div>
              ))}
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
