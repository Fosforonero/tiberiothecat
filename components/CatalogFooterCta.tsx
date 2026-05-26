import Link from 'next/link'

interface Props {
  locale:      'en' | 'it'
  suggestHref: string
  profileHref: string
}

const COPY = {
  en: {
    suggestTitle: 'Got a dilemma to propose?',
    suggestLede:  'The best questions come from the community. Send us yours.',
    suggestBtn:   'Suggest a dilemma →',
    profileTitle: 'Ready to find out how you think?',
    profileLede:  '10 dilemmas and we’ll tell you where you land on the moral spectrum.',
    profileBtn:   'Your moral profile →',
  },
  it: {
    suggestTitle: 'Hai un dilemma da proporre?',
    suggestLede:  'Le domande migliori arrivano dalla community. Mandacela.',
    suggestBtn:   'Suggerisci un dilemma →',
    profileTitle: 'Pronto a scoprire come pensi?',
    profileLede:  '10 dilemmi e ti diciamo dove ti collochi nello spettro morale.',
    profileBtn:   'Il tuo profilo morale →',
  },
}

export default function CatalogFooterCta({ locale, suggestHref, profileHref }: Props) {
  const c = COPY[locale]
  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-5 my-6 mb-4">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
        <h3 className="text-[18px] font-bold m-0 mb-2 -tracking-[0.005em] text-[var(--text)]">{c.suggestTitle}</h3>
        <p className="text-[13px] text-[var(--muted)] m-0 mb-4 leading-[1.5]">{c.suggestLede}</p>
        <Link
          href={suggestHref}
          className="inline-block px-[18px] py-2.5 border border-[var(--border-hi)] bg-[var(--surface2)] text-[var(--text)] rounded-[10px] text-[12px] font-bold tracking-[0.04em] hover:bg-[var(--surface)] transition-colors motion-reduce:transition-none"
        >
          {c.suggestBtn}
        </Link>
      </div>
      <div className="bg-[var(--surface)] border border-[rgba(180,77,255,0.2)] rounded-2xl p-6 bg-gradient-to-b from-[rgba(180,77,255,0.06)] to-transparent">
        <h3 className="text-[18px] font-bold m-0 mb-2 -tracking-[0.005em] text-[var(--text)]">{c.profileTitle}</h3>
        <p className="text-[13px] text-[var(--muted)] m-0 mb-4 leading-[1.5]">{c.profileLede}</p>
        <Link
          href={profileHref}
          className="inline-block px-[18px] py-2.5 bg-[var(--neon-purple)] text-white border border-[var(--neon-purple)] rounded-[10px] text-[12px] font-bold tracking-[0.04em] shadow-[0_0_24px_rgba(180,77,255,0.3)] hover:-translate-y-px transition-transform motion-reduce:transition-none"
        >
          {c.profileBtn}
        </Link>
      </div>
    </section>
  )
}
