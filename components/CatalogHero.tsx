/**
 * CatalogHero — eyebrow with dynamic stats + h1 with accent gradient.
 * Mirrors `redesign/02-catalogo-dilemmi.html .cat-hero`.
 */

interface Props {
  locale:       'en' | 'it'
  total:        number
  totalVotes:   number
  countries?:   number
}

export default function CatalogHero({ locale, total, totalVotes, countries = 94 }: Props) {
  const isIT = locale === 'it'
  const fmt = (n: number) => n.toLocaleString(isIT ? 'it-IT' : 'en-US')

  return (
    <header className="pt-14 pb-8 max-w-[880px]">
      <div className="font-mono text-[11px] text-[var(--muted)] font-medium tracking-[0.18em] uppercase flex items-center gap-2.5 flex-wrap mb-5">
        <span
          aria-hidden="true"
          className="w-1.5 h-1.5 rounded-full bg-[var(--neon-yellow)] shadow-[0_0_12px_var(--neon-yellow)] animate-pulse motion-reduce:animate-none"
        />
        <span>{isIT ? 'catalogo' : 'catalog'}</span>
        <span aria-hidden="true" className="w-3 h-px bg-[var(--border-hi)]" />
        <span>{fmt(total)} {isIT ? 'pubblicati' : 'published'}</span>
        <span aria-hidden="true" className="w-3 h-px bg-[var(--border-hi)]" />
        <span>{fmt(totalVotes)} {isIT ? 'voti totali' : 'total votes'}</span>
        <span aria-hidden="true" className="w-3 h-px bg-[var(--border-hi)]" />
        <span>{countries} {isIT ? 'paesi' : 'countries'}</span>
        <span aria-hidden="true" className="w-3 h-px bg-[var(--border-hi)]" />
        <span>{isIT ? 'voti globali in tempo reale' : 'real-time global votes'}</span>
      </div>
      <h1 className="text-[clamp(40px,6vw,64px)] font-black leading-none -tracking-[0.03em] mb-4 [text-wrap:balance] text-[var(--text)]">
        {isIT ? 'Tutti i dilemmi ' : 'All moral '}
        <span className="text-transparent bg-clip-text bg-gradient-to-br from-[#ffd700] to-[#ffaa00]">
          {isIT ? 'morali' : 'dilemmas'}
        </span>
      </h1>
      <p className="text-[16px] leading-[1.55] text-[var(--muted)] max-w-[640px] m-0">
        {isIT
          ? `Sfoglia ${fmt(total)} dilemmi morali. Filtra per categoria. Ordina per divisività — quanto il mondo si spacca a metà.`
          : `Browse ${fmt(total)} moral dilemmas. Filter by category. Sort by divisivity — how close the world is to a 50/50 split.`}
      </p>
    </header>
  )
}
