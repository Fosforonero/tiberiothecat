/**
 * CronDebug — server component shown in the Admin page.
 * Reads all dynamic scenarios from Redis and displays:
 *  - locale badge (EN / IT)
 *  - generatedAt timestamp
 *  - final URL (locale-aware)
 *  - question, seoTitle, trend, keywords
 */
import { getDynamicScenarios } from '@/lib/dynamic-scenarios'

const BASE_URL = 'https://splitvote.io'

function urlFor(id: string, locale: string): string {
  return locale === 'it'
    ? `${BASE_URL}/it/play/${id}`
    : `${BASE_URL}/play/${id}`
}

export default async function CronDebug() {
  let scenarios: Awaited<ReturnType<typeof getDynamicScenarios>> = []
  try {
    scenarios = await getDynamicScenarios()
  } catch {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-red-400 text-sm">
        ❌ Redis non disponibile — impossibile caricare i dilemmi dinamici.
      </div>
    )
  }

  if (scenarios.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-[var(--surface2)] p-6 text-center text-[var(--muted)] text-sm">
        Nessun dilemma dinamico in Redis. Il cron genera ogni giorno alle 06:00 UTC.
      </div>
    )
  }

  const enCount = scenarios.filter((s) => s.locale === 'en').length
  const itCount = scenarios.filter((s) => s.locale === 'it').length

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex gap-3 text-xs">
        <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full px-3 py-1 font-bold">
          {enCount} EN
        </span>
        <span className="bg-green-500/20 text-green-400 border border-green-500/30 rounded-full px-3 py-1 font-bold">
          {itCount} IT
        </span>
        <span className="text-[var(--muted)]">/ {scenarios.length} totali (max 60)</span>
      </div>

      {/* Table of recent dilemmas */}
      <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
        {scenarios.map((s) => {
          const url = urlFor(s.id, s.locale)
          const isIT = s.locale === 'it'
          return (
            <div
              key={s.id}
              className="rounded-xl border border-white/8 bg-[var(--surface2)] p-4 hover:border-white/15 transition-colors"
            >
              {/* Header row */}
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border ${
                  isIT
                    ? 'bg-green-500/20 text-green-400 border-green-500/30'
                    : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                }`}>
                  {s.locale.toUpperCase()}
                </span>
                <span className="text-[10px] text-[var(--muted)] uppercase tracking-widest">
                  {s.category}
                </span>
                <span className="text-[10px] text-[var(--muted)]">
                  {new Date(s.generatedAt).toLocaleString('it-IT', {
                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                  })}
                </span>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-blue-400 hover:text-blue-300 ml-auto font-mono truncate max-w-[220px]"
                >
                  {url.replace(BASE_URL, '')} ↗
                </a>
              </div>

              {/* Question */}
              <p className="text-sm font-semibold text-white leading-snug">
                {s.question}
              </p>

              {/* SEO title */}
              {s.seoTitle && (
                <p className="text-xs text-purple-400 mt-1.5">
                  <span className="text-[var(--muted)]">SEO: </span>{s.seoTitle}
                </p>
              )}

              {/* Trend source */}
              {s.trend && (
                <p className="text-xs text-[var(--muted)] italic mt-0.5">
                  trend: {s.trend}
                </p>
              )}

              {/* Keywords */}
              {s.keywords && s.keywords.length > 0 && (
                <div className="flex gap-1 flex-wrap mt-2">
                  {s.keywords.slice(0, 6).map((k) => (
                    <span key={k} className="text-[10px] bg-white/5 text-white/40 border border-white/8 px-2 py-0.5 rounded-full">
                      {k}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
