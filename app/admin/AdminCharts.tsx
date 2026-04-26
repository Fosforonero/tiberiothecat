'use client'

interface DayCount { date: string; count: number }
interface VoteDayCount { date: string; count: number; anonymous?: number; loggedIn?: number }

export function VotesChart({ data }: { data: VoteDayCount[] }) {
  const max = Math.max(...data.map(d => d.count), 1)
  const hasBreakdown = data.some(d => (d.anonymous ?? 0) > 0 || (d.loggedIn ?? 0) > 0)

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[#0d0d1a]/60 p-6">
      <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--muted)] mb-1">
        📈 Votes per day — last 14 days
      </h3>
      {hasBreakdown && (
        <div className="flex items-center gap-3 mb-4">
          <span className="flex items-center gap-1 text-[10px] text-orange-400">
            <span className="w-2 h-2 rounded-sm bg-orange-500/70 inline-block" /> Anon
          </span>
          <span className="flex items-center gap-1 text-[10px] text-green-400">
            <span className="w-2 h-2 rounded-sm bg-green-500/70 inline-block" /> Logged-in
          </span>
        </div>
      )}
      <div className="flex items-end gap-1.5 h-32">
        {data.map(d => {
          const pct = Math.round((d.count / max) * 100)
          const label = d.date.slice(5) // MM-DD
          const anonPct = d.count > 0 ? Math.round(((d.anonymous ?? 0) / d.count) * 100) : 0
          const loggedPct = 100 - anonPct

          return (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group">
              <span className="text-xs text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {d.count}
              </span>
              <div
                className="w-full rounded-t-md overflow-hidden flex flex-col-reverse"
                style={{ height: `${Math.max(pct, 2)}%` }}
                title={`${label}: ${d.count} votes (${d.anonymous ?? 0} anon, ${d.loggedIn ?? 0} logged-in)`}
              >
                {hasBreakdown && d.count > 0 ? (
                  <>
                    {/* Green = logged-in, bottom */}
                    <div className="w-full bg-green-500/70 hover:bg-green-400 transition-colors" style={{ height: `${loggedPct}%` }} />
                    {/* Orange = anonymous, top */}
                    <div className="w-full bg-orange-500/70 hover:bg-orange-400 transition-colors" style={{ height: `${anonPct}%` }} />
                  </>
                ) : (
                  <div className="w-full h-full bg-blue-500/70 hover:bg-blue-400 transition-colors" />
                )}
              </div>
              <span className="text-[10px] text-[var(--muted)] rotate-45 origin-left mt-1 hidden sm:block">
                {label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function SignupsChart({ data }: { data: DayCount[] }) {
  const max = Math.max(...data.map(d => d.count), 1)

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[#0d0d1a]/60 p-6">
      <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--muted)] mb-5">
        👤 Signups per day — last 14 days
      </h3>
      <div className="flex items-end gap-1.5 h-32">
        {data.map(d => {
          const pct = Math.round((d.count / max) * 100)
          const label = d.date.slice(5)
          return (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group">
              <span className="text-xs text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                {d.count}
              </span>
              <div
                className="w-full rounded-t-md bg-purple-500/70 hover:bg-purple-400 transition-colors"
                style={{ height: `${Math.max(pct, 2)}%` }}
                title={`${label}: ${d.count} signups`}
              />
              <span className="text-[10px] text-[var(--muted)] rotate-45 origin-left mt-1 hidden sm:block">
                {label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
