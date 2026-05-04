import type { Metadata } from 'next'
import Link from 'next/link'

const BASE_URL = 'https://splitvote.io'

export const metadata: Metadata = {
  title: 'About SplitVote — Real-time Global Moral Dilemmas',
  description: 'SplitVote is an independent platform for real-time global votes on impossible moral dilemmas. Learn who we are, our editorial mission, and how to contact us.',
  alternates: {
    canonical: `${BASE_URL}/about`,
    languages: {
      'en': `${BASE_URL}/about`,
      'it-IT': `${BASE_URL}/it/about`,
      'x-default': `${BASE_URL}/about`,
    },
  },
  openGraph: {
    title: 'About SplitVote',
    description: 'An independent platform for real-time global votes on impossible moral dilemmas. No right answers — just honest ones.',
    url: `${BASE_URL}/about`,
    siteName: 'SplitVote',
  },
}

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-[var(--text)]">
      <h1 className="text-3xl font-black mb-2">About SplitVote</h1>
      <p className="text-sm text-[var(--muted)] mb-10">
        Real-time global votes on impossible moral dilemmas.
      </p>

      <section className="space-y-8 text-sm leading-relaxed text-[var(--muted)]">

        <div>
          <h2 className="text-base font-bold text-white mb-2">What is SplitVote?</h2>
          <p>
            SplitVote is a real-time global voting platform built around impossible moral dilemmas.
            We give you binary choices — A or B, no middle ground — and show you how the rest of
            the world splits. Every dilemma is designed to be uncomfortable: there is no obviously
            right answer, only an honest one.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">Our mission</h2>
          <p>
            Most polls ask who you&apos;d vote for or which product you prefer. We&apos;re more
            interested in what your gut tells you when the stakes are real — would you pull the
            trolley lever? Confess to a crime nobody knows about? Aggregating millions of these
            quiet decisions reveals something more honest than any opinion poll.
          </p>
          <p className="mt-3">
            We publish aggregate results only. No individual votes are ever surfaced publicly.
            We do not fabricate numbers or seed dilemmas with synthetic votes.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">Content and editorial standards</h2>
          <p>
            Dilemmas come from two sources: a hand-curated set of classic ethical scenarios, and a
            daily pipeline that generates new dilemmas inspired by current events. All AI-generated
            content is reviewed and approved by a human editor before going live — nothing publishes
            automatically. We reject offensive content, real-people targeting, and questions with
            one obviously correct answer.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">Who we are</h2>
          <p>
            SplitVote is an independent project based in Italy. We are not affiliated with any
            media outlet, university, or political organization.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">Contact</h2>
          <ul className="space-y-1.5">
            <li>
              General:{' '}
              <a href="mailto:hello@splitvote.io" className="text-blue-400 hover:underline">
                hello@splitvote.io
              </a>
            </li>
            <li>
              Privacy &amp; data rights:{' '}
              <a href="mailto:privacy@splitvote.io" className="text-blue-400 hover:underline">
                privacy@splitvote.io
              </a>
            </li>
            <li>
              Business &amp; partnerships:{' '}
              <a href="mailto:business@splitvote.io" className="text-blue-400 hover:underline">
                business@splitvote.io
              </a>
            </li>
          </ul>
        </div>

        <div className="pt-4 border-t border-[var(--border)] flex flex-wrap gap-4 text-xs">
          <Link href="/privacy" className="text-blue-400 hover:underline">Privacy Policy</Link>
          <Link href="/terms" className="text-blue-400 hover:underline">Terms of Service</Link>
          <Link href="/faq" className="text-blue-400 hover:underline">FAQ</Link>
          <Link href="/" className="text-blue-400 hover:underline">Browse dilemmas</Link>
        </div>

      </section>
    </div>
  )
}
