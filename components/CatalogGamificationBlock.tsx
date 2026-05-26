'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const LS_KEY = 'splitvote_voted_ids'

interface Props {
  locale: 'en' | 'it'
  total:  number
  /** Where to send the user to keep voting (catalog or home). */
  keepGoingHref: string
  /** Where to send the user to compare profiles. */
  compareHref:   string
}

const COPY = {
  en: {
    title:        'Build your moral profile',
    progress:     (n: number, t: number) => `You've voted ${n} of ${t} dilemmas`,
    streak:       'Current streak',
    streakDays:   (n: number) => `${n} days`,
    cta:          'KEEP VOTING →',
    compareTitle: 'Challenge a friend',
    compareLede:  'Compare your moral profile with anyone. Unique link.',
    compareCta:   'GENERATE LINK →',
    empty:        'Vote your first dilemma to start your profile.',
  },
  it: {
    title:        'Costruisci il tuo profilo morale',
    progress:     (n: number, t: number) => `Hai votato ${n} su ${t} dilemmi`,
    streak:       'Serie attiva',
    streakDays:   (n: number) => `${n} giorni`,
    cta:          'CONTINUA A VOTARE →',
    compareTitle: 'Sfida un amico',
    compareLede:  'Confronta il tuo profilo morale con chiunque. Link unico.',
    compareCta:   'GENERA LINK →',
    empty:        'Vota il tuo primo dilemma per iniziare il profilo.',
  },
}

function readVotedCount(): number {
  if (typeof window === 'undefined') return 0
  try {
    const raw = window.localStorage.getItem(LS_KEY)
    if (!raw) return 0
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.length : 0
  } catch {
    return 0
  }
}

export default function CatalogGamificationBlock({ locale, total, keepGoingHref, compareHref }: Props) {
  const c = COPY[locale]
  const [voted, setVoted] = useState(0)

  useEffect(() => {
    setVoted(readVotedCount())
  }, [])

  const pct = total > 0 ? Math.min(100, Math.round((voted / total) * 100)) : 0

  return (
    <section
      aria-label={c.title}
      className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5 my-6"
    >
      <div className="bg-[var(--surface)] border border-[rgba(0,212,255,0.18)] rounded-2xl p-[22px] bg-gradient-to-b from-[rgba(0,212,255,0.03)] to-transparent">
        <div className="flex justify-between items-center flex-wrap gap-2 mb-2">
          <h3 className="text-[17px] font-bold -tracking-[0.005em] m-0 text-[var(--text)]">{c.title}</h3>
        </div>
        <p className="text-[13px] text-[var(--muted)] m-0 mb-3.5">
          {voted > 0 ? c.progress(voted, total) : c.empty}
        </p>
        <div className="h-2.5 rounded-md bg-[var(--surface-3,#1a1a40)] overflow-hidden mb-4">
          <div
            className="h-full min-w-6 bg-gradient-to-r from-[var(--neon-blue)] to-[var(--neon-green)] shadow-[0_0_16px_rgba(0,212,255,0.4)] flex items-center justify-end pr-2 transition-[width] duration-500"
            style={{ width: `${pct}%` }}
          >
            <span className="font-mono text-[9px] font-bold text-[#00121e] tracking-[0.08em] tabular-nums">{pct}%</span>
          </div>
        </div>
        <Link
          href={keepGoingHref}
          className="inline-block px-[18px] py-2.5 border-0 rounded-[10px] bg-[var(--neon-blue)] text-[#001520] text-[11.5px] font-extrabold tracking-[0.12em] uppercase shadow-[0_0_24px_rgba(0,212,255,0.35)] hover:-translate-y-px transition-transform motion-reduce:transition-none"
        >
          {c.cta}
        </Link>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-[22px]">
        <h3 className="text-[17px] font-bold -tracking-[0.005em] m-0 mb-2 text-[var(--text)]">{c.compareTitle}</h3>
        <p className="text-[13px] text-[var(--muted)] m-0 mb-3.5">{c.compareLede}</p>
        <Link
          href={compareHref}
          className="inline-block px-[18px] py-2.5 border border-[var(--border-hi)] rounded-[10px] bg-transparent text-[var(--text)] text-[11.5px] font-extrabold tracking-[0.12em] uppercase hover:bg-[var(--surface2)] transition-colors motion-reduce:transition-none"
        >
          {c.compareCta}
        </Link>
      </div>
    </section>
  )
}
