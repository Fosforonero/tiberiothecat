'use client'

import { useState } from 'react'

interface DayCount { date: string; count: number }
interface VoteDayCount { date: string; count: number; anonymous?: number; loggedIn?: number }

type Tab = '7d' | '14d'

export function VotesChart({ data, locale = 'en' }: { data: VoteDayCount[]; locale?: string }) {
  const [tab, setTab] = useState<Tab>('14d')
  const visible = tab === '7d' ? data.slice(-7) : data
  const max = Math.max(...visible.map(d => d.count), 1)
  const hasBreakdown = visible.some(d => (d.anonymous ?? 0) > 0 || (d.loggedIn ?? 0) > 0)
  const isEmpty = visible.every(d => d.count === 0)
  const totalVisible = visible.reduce((s, d) => s + d.count, 0)

  const title = locale === 'it' ? '📈 Voti al giorno' : '📈 Votes per day'

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[#0d0d1a]/60 p-6">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--muted)]">
          {title}
        </h3>
        <div className="flex gap-1">
          {(['7d', '14d'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`text-[10px] font-bold px-2 py-0.5 rounded transition-colors ${
                tab === t
                  ? 'bg-blue-500/30 text-blue-300 border border-blue-500/40'
                  : 'text-[var(--muted)] hover:text-white border border-transparent'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {hasBreakdown && !isEmpty && (
        <div className="flex items-center gap-3 mb-4">
          <span className="flex items-center gap-1 text-[10px] text-orange-400">
            <span className="w-2 h-2 rounded-sm bg-orange-500/70 inline-block" /> Anon
          </span>
          <span className="flex items-center gap-1 text-[10px] text-green-400">
            <span className="w-2 h-2 rounded-sm bg-green-500/70 inline-block" />
            {locale === 'it' ? 'Registrati' : 'Logged-in'}
          </span>
        </div>
      )}

      {isEmpty ? (
        <div className="h-32 flex items-center justify-center">
          <p className="text-xs text-[var(--muted)] text-center">
            {locale === 'it' ? 'Nessun dato ancora' : 'Not enough data yet'}
            <br />
            <span className="text-[10px] opacity-60">
              {locale === 'it'
                ? 'I voti appariranno qui una volta che gli utenti sono attivi'
                : 'Vote activity will appear here once users are active'}
            </span>
          </p>
        </div>
      ) : (
        <>
          {/* Chart bars — h-32 container; each column fills full height so % resolves correctly */}
          <div className="flex gap-1.5 h-32 mb-2">
            {visible.map(d => {
              const pct = d.count > 0 ? Math.max(Math.round((d.count / max) * 100), 3) : 0
              const label = d.date.slice(5)
              const anonPct = d.count > 0 ? Math.round(((d.anonymous ?? 0) / d.count) * 100) : 0
              const loggedPct = 100 - anonPct

              return (
                <div key={d.date} className="flex-1 flex flex-col items-center group h-full">
                  {/* Flex-1 chart area: bar grows from bottom; hover count anchored to top */}
                  <div className="flex-1 w-full flex flex-col justify-end relative">
                    <span className="absolute top-0 w-full text-center text-xs text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      {d.count}
                    </span>
                    <div
                      className="w-full rounded-t-md overflow-hidden flex flex-col-reverse"
                      style={{ height: `${pct}%` }}
                      title={`${label}: ${d.count} votes (${d.anonymous ?? 0} anon, ${d.loggedIn ?? 0} logged-in)`}
                    >
                      {hasBreakdown && d.count > 0 ? (
                        <>
                          <div className="w-full bg-green-500/70" style={{ height: `${loggedPct}%` }} />
                          <div className="w-full bg-orange-500/70" style={{ height: `${anonPct}%` }} />
                        </>
                      ) : (
                        <div className="w-full h-full bg-blue-500/70" />
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] text-[var(--muted)] rotate-45 origin-left mt-1 hidden sm:block">
                    {label}
                  </span>
                </div>
              )
            })}
          </div>
          <p className="text-[10px] text-[var(--muted)] text-right">
            {locale === 'it'
              ? `${totalVisible.toLocaleString()} voti nel periodo`
              : `${totalVisible.toLocaleString()} votes in period`}
          </p>
        </>
      )}
    </div>
  )
}

export function SignupsChart({ data, locale = 'en' }: { data: DayCount[]; locale?: string }) {
  const [tab, setTab] = useState<Tab>('14d')
  const visible = tab === '7d' ? data.slice(-7) : data
  const max = Math.max(...visible.map(d => d.count), 1)
  const isEmpty = visible.every(d => d.count === 0)
  const totalVisible = visible.reduce((s, d) => s + d.count, 0)

  const title = locale === 'it' ? '👤 Iscrizioni al giorno' : '👤 Signups per day'

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[#0d0d1a]/60 p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--muted)]">
          {title}
        </h3>
        <div className="flex gap-1">
          {(['7d', '14d'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`text-[10px] font-bold px-2 py-0.5 rounded transition-colors ${
                tab === t
                  ? 'bg-purple-500/30 text-purple-300 border border-purple-500/40'
                  : 'text-[var(--muted)] hover:text-white border border-transparent'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {isEmpty ? (
        <div className="h-32 flex items-center justify-center">
          <p className="text-xs text-[var(--muted)] text-center">
            {locale === 'it' ? 'Nessun dato ancora' : 'Not enough data yet'}
            <br />
            <span className="text-[10px] opacity-60">
              {locale === 'it'
                ? 'Le iscrizioni appariranno qui quando gli utenti si registrano'
                : 'Signup activity will appear here once users register'}
            </span>
          </p>
        </div>
      ) : (
        <>
          {/* Chart bars — same fix as VotesChart: h-full column + flex-1 chart area */}
          <div className="flex gap-1.5 h-32 mb-2">
            {visible.map(d => {
              const pct = d.count > 0 ? Math.max(Math.round((d.count / max) * 100), 3) : 0
              const label = d.date.slice(5)
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center group h-full">
                  <div className="flex-1 w-full flex flex-col justify-end relative">
                    <span className="absolute top-0 w-full text-center text-xs text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      {d.count}
                    </span>
                    <div
                      className="w-full rounded-t-md bg-purple-500/70"
                      style={{ height: `${pct}%` }}
                      title={`${label}: ${d.count} signups`}
                    />
                  </div>
                  <span className="text-[10px] text-[var(--muted)] rotate-45 origin-left mt-1 hidden sm:block">
                    {label}
                  </span>
                </div>
              )
            })}
          </div>
          <p className="text-[10px] text-[var(--muted)] text-right">
            {locale === 'it'
              ? `${totalVisible.toLocaleString()} iscrizioni nel periodo`
              : `${totalVisible.toLocaleString()} signups in period`}
          </p>
        </>
      )}
    </div>
  )
}
