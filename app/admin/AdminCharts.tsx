'use client'

interface DayCount { date: string; count: number }

export function VotesChart({ data }: { data: DayCount[] }) {
  const max = Math.max(...data.map(d => d.count), 1)

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[#0d0d1a]/60 p-6">
      <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--muted)] mb-5">
        📈 Votes per day — last 14 days
      </h3>
      <div className="flex items-end gap-1.5 h-32">
        {data.map(d => {
          const pct = Math.round((d.count / max) * 100)
          const label = d.date.slice(5) // MM-DD
          return (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group">
              <span className="text-xs text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                {d.count}
              </span>
              <div
                className="w-full rounded-t-md bg-blue-500/70 hover:bg-blue-400 transition-colors"
                style={{ height: `${Math.max(pct, 2)}%` }}
                title={`${label}: ${d.count} votes`}
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
