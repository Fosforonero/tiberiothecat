import type { Metadata } from 'next'
import Link from 'next/link'
import JsonLd from '@/components/JsonLd'

export const metadata: Metadata = {
  title: 'FAQ — How SplitVote Works',
  description: 'Frequently asked questions about SplitVote — what it is, how voting works, how we count results, your privacy, premium features, and the data we publish.',
  alternates: { canonical: 'https://splitvote.io/faq' },
  openGraph: {
    title: 'SplitVote FAQ — How does it work?',
    description: 'What SplitVote is, how voting and results work, what we do with your data, and what premium unlocks.',
    url: 'https://splitvote.io/faq',
    siteName: 'SplitVote',
  },
}

interface QA {
  q: string
  a: string | React.ReactNode
}

interface Section {
  title: string
  emoji: string
  items: QA[]
}

const SECTIONS: Section[] = [
  {
    title: 'About SplitVote',
    emoji: '🌍',
    items: [
      {
        q: 'What is SplitVote?',
        a: (
          <>
            SplitVote is a real-time global voting platform built around impossible moral
            dilemmas. We give you binary choices — A or B, no middle ground — and show you
            how the rest of the world is split. Every dilemma is meant to be uncomfortable:
            there is no obviously right answer, only an honest one.
          </>
        ),
      },
      {
        q: 'Why does this exist?',
        a: (
          <>
            Most polls online ask you who you&apos;d vote for or what brand you prefer.
            We&apos;re more interested in what your gut tells you when the stakes are
            real — would you steal medicine for your child? Pull the lever on the trolley?
            Confess to a 20-year-old crime nobody knows about? Aggregating millions of these
            quiet decisions reveals something more honest than any opinion poll.
          </>
        ),
      },
      {
        q: 'Who is behind SplitVote?',
        a: (
          <>
            SplitVote is an independent project. We are not affiliated with any media outlet,
            university, or political organization. We use the data we collect to write
            occasional reports and to power the public charts on the site — never to sell
            individual profiles.
          </>
        ),
      },
    ],
  },
  {
    title: 'Voting & Results',
    emoji: '🗳️',
    items: [
      {
        q: 'How does voting work?',
        a: (
          <>
            Pick a dilemma, read the question, choose A or B. That&apos;s it. You don&apos;t
            need an account to vote. Anonymous votes are stored with a browser cookie that
            prevents you from voting twice on the same dilemma. Logged-in users can change
            their mind within 24 hours of voting; after that, the choice is locked in.
          </>
        ),
      },
      {
        q: 'Are the percentages real?',
        a: (
          <>
            Yes. Every percentage you see is computed live from the actual votes cast on
            that dilemma. We don&apos;t fake numbers, seed dilemmas with synthetic votes,
            or weight results to push a narrative. New dilemmas may show 50/50 simply because
            nobody has voted yet — that&apos;s the honest baseline.
          </>
        ),
      },
      {
        q: 'How do you prevent bots and brigading?',
        a: (
          <>
            We rate-limit by IP (max 20 votes per hour, across all dilemmas), deduplicate
            via signed cookies, and run heuristic checks on coordinated traffic. We don&apos;t
            require captchas or accounts to vote because it would crush participation, but
            we do block obvious abuse silently.
          </>
        ),
      },
      {
        q: 'Where do new dilemmas come from?',
        a: (
          <>
            Two sources. First, a hand-curated set of classics (trolley problem, lifeboat,
            organ harvest, etc.). Second, every morning at 06:00 UTC an automated pipeline
            scans Google Trends and Reddit /r/worldnews, distills the day&apos;s themes, and
            generates 3 fresh dilemmas inspired by current events — visible in the
            <Link href="/trending" className="text-blue-400 hover:text-blue-300 underline underline-offset-2"> Trending</Link> section.
            All AI-generated dilemmas are tagged with the ✨ icon.
          </>
        ),
      },
      {
        q: 'Can I submit my own dilemma?',
        a: (
          <>
            Premium users can submit dilemmas via <Link href="/submit-poll" className="text-blue-400 hover:text-blue-300 underline underline-offset-2">/submit-poll</Link>.
            Submissions are reviewed by our team before going live (24–48h turnaround).
            We reject offensive content, real-people targeting, and trick questions
            with one obviously correct answer.
          </>
        ),
      },
    ],
  },
  {
    title: 'Account & Profile',
    emoji: '👤',
    items: [
      {
        q: 'Do I need an account?',
        a: (
          <>
            No. Voting is anonymous and works without signup. An account unlocks the
            dashboard (your vote history, badges, stats), the ability to change your vote
            within 24 hours, and Premium features.
          </>
        ),
      },
      {
        q: 'How do I sign up?',
        a: (
          <>
            <Link href="/login" className="text-blue-400 hover:text-blue-300 underline underline-offset-2">/login</Link>{' '}
            — sign in with Google in one click, or use email + password. We never post
            anything on your behalf and never email you marketing.
          </>
        ),
      },
      {
        q: 'What are badges?',
        a: (
          <>
            Achievements you earn by participating: First Vote, 10/50/100 Votes, 7-Day Streak,
            Contrarian (you vote with the minority), Globe Trotter (you cover multiple
            categories), Early Adopter (joined before 2026). Some cosmetic frames (Gold, Neon,
            Cosmic) are purchasable; everything else is earned by playing.
          </>
        ),
      },
      {
        q: 'Can I delete my account?',
        a: (
          <>
            Yes. Email <a href="mailto:hello@splitvote.io" className="text-blue-400 hover:text-blue-300 underline underline-offset-2">hello@splitvote.io</a> from
            the address you signed up with and we&apos;ll wipe your profile and all linked vote
            history within 7 days. Aggregate counts (the percentages on each dilemma) cannot
            be reversed because they are not tied to your identity.
          </>
        ),
      },
    ],
  },
  {
    title: 'Premium & Business',
    emoji: '⭐',
    items: [
      {
        q: 'What does Premium unlock?',
        a: (
          <>
            Submit your own dilemmas, advanced filters on category breakdowns, custom
            cosmetic frames for your profile, share-card pro design, and early access
            to new features. Pricing and a full feature list will be on a dedicated
            pricing page once we exit beta.
          </>
        ),
      },
      {
        q: 'Is there a Business plan?',
        a: (
          <>
            Yes — for brands, NGOs, academic researchers, and media. You get promoted polls
            (your dilemma surfaced to the global audience), demographic breakdowns by age,
            gender and country, CSV export, and (Enterprise) API access. Reach out at{' '}
            <a href="mailto:business@splitvote.io" className="text-blue-400 hover:text-blue-300 underline underline-offset-2">business@splitvote.io</a>.
          </>
        ),
      },
      {
        q: 'How are payments handled?',
        a: (
          <>
            All payments go through Stripe. We never see or store your card details. You
            can manage or cancel your subscription at any time from your dashboard.
          </>
        ),
      },
    ],
  },
  {
    title: 'Privacy & Data',
    emoji: '🔒',
    items: [
      {
        q: 'What data do you collect?',
        a: (
          <>
            For anonymous voters: a per-dilemma cookie that says &quot;you already voted A&quot;,
            and a hashed IP for rate-limiting (deleted after 1 hour). For logged-in users:
            email, optional display name, and your votes — plus optional demographic info
            (year of birth, country, gender) you can provide for richer stats. Nothing
            personally identifying ever appears in public charts.
          </>
        ),
      },
      {
        q: 'Do you sell my data?',
        a: (
          <>
            No. We may publish aggregate, anonymized statistics (&quot;73% of voters under 30
            chose A&quot;) for journalism or research, but never individual records. Business
            customers see the same aggregate breakdowns — never raw user data.
          </>
        ),
      },
      {
        q: 'How does the cookie banner work?',
        a: (
          <>
            We use Google Consent Mode v2. By default, all analytics and ad cookies are
            denied — you have to actively click &quot;Accept&quot; to enable them. Even when
            denied, we still need a small functional cookie to remember which dilemmas you
            already voted on (otherwise voting wouldn&apos;t work).
          </>
        ),
      },
      {
        q: 'Where is my data stored?',
        a: (
          <>
            Authentication and profile data: Supabase (EU-based Postgres). Vote counters:
            Upstash Redis (low-latency global edge). Hosting: Vercel. Full details and our
            sub-processor list are on the{' '}
            <Link href="/privacy" className="text-blue-400 hover:text-blue-300 underline underline-offset-2">privacy policy</Link>.
          </>
        ),
      },
    ],
  },
  {
    title: 'Technical',
    emoji: '⚙️',
    items: [
      {
        q: 'Why does the site sometimes show ads?',
        a: (
          <>
            Ads keep SplitVote free for everyone. We use Google AdSense, served through a
            first-party proxy that respects the GDPR consent you gave on the cookie banner.
            If you&apos;d rather not see ads, Premium removes them entirely.
          </>
        ),
      },
      {
        q: 'Can I embed a SplitVote dilemma on my site?',
        a: (
          <>
            Embed widgets are part of the Business plan. We&apos;ll provide a snippet you can
            drop into any page that renders a live, interactive dilemma — votes count
            toward the global tally. Coming soon.
          </>
        ),
      },
      {
        q: 'Is there an API?',
        a: (
          <>
            Read-only access to dilemma metadata and aggregate vote counts will ship with
            the Enterprise plan. Researchers can already request a CSV by emailing{' '}
            <a href="mailto:research@splitvote.io" className="text-blue-400 hover:text-blue-300 underline underline-offset-2">research@splitvote.io</a>{' '}
            with the dilemmas you&apos;re interested in.
          </>
        ),
      },
      {
        q: 'I found a bug — where do I report it?',
        a: (
          <>
            Email <a href="mailto:hello@splitvote.io" className="text-blue-400 hover:text-blue-300 underline underline-offset-2">hello@splitvote.io</a>{' '}
            with a screenshot and a short description. We try to reply within a few days.
          </>
        ),
      },
    ],
  },
]

// Build FAQPage JSON-LD for rich results in Google Search
function faqJsonLd() {
  const flatten = (node: string | React.ReactNode): string => {
    if (typeof node === 'string') return node
    if (typeof node === 'number') return String(node)
    if (Array.isArray(node)) return node.map(flatten).join('')
    // React element
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const props: any = (node as any)?.props
    if (props?.children !== undefined) return flatten(props.children)
    return ''
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: SECTIONS.flatMap(s =>
      s.items.map(item => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: flatten(item.a).replace(/\s+/g, ' ').trim(),
        },
      }))
    ),
  }
}

export default function FaqPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      {/* JSON-LD for SEO rich results */}
      <JsonLd data={faqJsonLd()} />

      {/* Hero */}
      <div className="text-center mb-12">
        <div className="inline-block bg-cyan-500/10 text-cyan-400 text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-6 border border-cyan-500/20">
          Frequently Asked Questions
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4 leading-none">
          How does{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-purple-400 to-blue-400">
            SplitVote
          </span>{' '}
          work?
        </h1>
        <p className="text-lg text-[var(--muted)] max-w-md mx-auto">
          The short answer: you vote, the world votes, we count. The longer answer is below.
        </p>
      </div>

      {/* Sections */}
      <div className="space-y-12">
        {SECTIONS.map(section => (
          <section key={section.title} aria-labelledby={`faq-${section.title.replace(/\s+/g, '-').toLowerCase()}`}>
            <h2
              id={`faq-${section.title.replace(/\s+/g, '-').toLowerCase()}`}
              className="text-xl font-black text-white mb-5 flex items-center gap-2"
            >
              <span className="text-2xl">{section.emoji}</span>
              {section.title}
            </h2>
            <div className="space-y-3">
              {section.items.map((item, idx) => (
                <details
                  key={idx}
                  className="group rounded-2xl border border-[var(--border)] bg-[#0d0d1a]/60 hover:border-blue-500/30 transition-colors"
                >
                  <summary className="cursor-pointer list-none flex items-start justify-between gap-4 p-5">
                    <h3 className="text-sm sm:text-base font-bold text-white leading-snug">
                      {item.q}
                    </h3>
                    <span className="flex-shrink-0 text-[var(--muted)] group-hover:text-blue-400 transition-colors text-lg leading-none mt-0.5 group-open:rotate-45 transition-transform duration-150">
                      +
                    </span>
                  </summary>
                  <div className="px-5 pb-5 text-sm text-[var(--muted)] leading-relaxed">
                    {item.a}
                  </div>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-16 rounded-2xl border border-blue-500/30 bg-blue-500/5 p-6 text-center">
        <p className="text-white font-bold text-lg mb-2">Still curious?</p>
        <p className="text-[var(--muted)] text-sm mb-4">
          Easiest way to understand SplitVote is to vote on a dilemma. Try one.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-sm transition-colors"
        >
          Browse dilemmas →
        </Link>
      </div>

      {/* Contact fallback */}
      <p className="text-center text-xs text-[var(--muted)] mt-10 opacity-60">
        Question we didn&apos;t answer? Email{' '}
        <a href="mailto:hello@splitvote.io" className="text-blue-400 hover:text-blue-300 underline underline-offset-2">
          hello@splitvote.io
        </a>
      </p>
    </div>
  )
}
