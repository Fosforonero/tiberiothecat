import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for SplitVote.io — how we collect, use and protect your data.',
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://splitvote.io/privacy' },
}

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-[var(--text)]">
      <h1 className="text-3xl font-black mb-2">Privacy Policy</h1>
      <p className="text-sm text-[var(--muted)] mb-10">Last updated: April 25, 2026</p>

      <section className="space-y-6 text-sm leading-relaxed text-[var(--muted)]">

        <div>
          <h2 className="text-base font-bold text-white mb-2">1. Who we are</h2>
          <p>
            SplitVote.io (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is an online platform that presents anonymous
            moral-dilemma polls and displays real-time aggregated results. The site is operated by
            Matteo Pizzi, based in Italy. Contact:{' '}
            <a href="mailto:privacy@splitvote.io" className="text-blue-400 hover:underline">
              privacy@splitvote.io
            </a>
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">2. Data we collect</h2>
          <p className="mb-2">We collect the minimum data necessary to operate the service:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong className="text-white">Vote data</strong> — when you vote, we store an anonymous
              aggregated counter (option A or B) in our database. We do not store your IP address or
              any identifier linked to your vote.
            </li>
            <li>
              <strong className="text-white">Country of origin</strong> — we detect the approximate
              country of your request to show country-level vote breakdowns. This information is not
              stored or logged beyond the aggregated result.
            </li>
            <li>
              <strong className="text-white">Analytics data</strong> — with your consent, Google Analytics
              4 collects page views, session duration, and general engagement metrics. This data is
              pseudonymised and processed by Google LLC under a Data Processing Agreement.
            </li>
            <li>
              <strong className="text-white">Advertising data</strong> — with your consent, Google AdSense
              may use cookies to serve personalised advertisements. Without consent, only non-personalised
              ads are shown.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">3. Legal basis for processing (GDPR)</h2>
          <p>For users in the European Economic Area (EEA) and UK:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong className="text-white">Legitimate interest</strong> — anonymous aggregated vote counting, which does not identify individuals.</li>
            <li><strong className="text-white">Consent</strong> — analytics and advertising cookies. You can withdraw consent at any time via the cookie banner.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">4. Google Consent Mode v2</h2>
          <p>
            We implement Google Consent Mode v2. If you deny consent, Google Analytics operates in
            &ldquo;cookieless&rdquo; mode using modelled data. No identifying cookies are set without
            your explicit consent.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">5. Third-party services</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong className="text-white">Vercel</strong> — hosting and edge network (USA). <a href="https://vercel.com/legal/privacy-policy" className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">Privacy Policy</a></li>
            <li><strong className="text-white">Upstash Redis</strong> — vote storage database (EU region). <a href="https://upstash.com/trust/privacy.pdf" className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">Privacy Policy</a></li>
            <li><strong className="text-white">Google Analytics 4</strong> — analytics (with consent). <a href="https://policies.google.com/privacy" className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">Privacy Policy</a></li>
            <li><strong className="text-white">Google AdSense</strong> — advertising (with consent). <a href="https://policies.google.com/privacy" className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">Privacy Policy</a></li>
          </ul>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">6. Data retention</h2>
          <p>
            Aggregated vote counts are retained indefinitely as they are anonymous statistical data.
            Google Analytics data is retained for 14 months (our configured retention period).
            No personal data is stored on our servers.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">7. International transfers</h2>
          <p>
            Our hosting provider Vercel may process data in the United States. Such transfers are
            covered by Standard Contractual Clauses (SCCs) as provided in Vercel&apos;s Data
            Processing Agreement. Google processes analytics data globally under Google&apos;s SCCs.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">8. Your rights (GDPR / EEA users)</h2>
          <p>You have the right to:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Access any personal data we hold about you</li>
            <li>Request correction or deletion of your data</li>
            <li>Object to or restrict processing</li>
            <li>Data portability</li>
            <li>Withdraw consent at any time (without affecting prior processing)</li>
            <li>Lodge a complaint with your national Data Protection Authority (e.g. Garante Privacy in Italy)</li>
          </ul>
          <p className="mt-2">
            Since we collect no personal data beyond what anonymous cookies handle, most rights are
            exercised through your browser cookie settings or our consent banner.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">9. California residents (CCPA)</h2>
          <p>
            We do not sell personal information. We do not share personal information for cross-context
            behavioural advertising without consent. California residents have the right to know, delete,
            and opt out. To exercise these rights, contact us at{' '}
            <a href="mailto:privacy@splitvote.io" className="text-blue-400 hover:underline">
              privacy@splitvote.io
            </a>.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">10. Children&apos;s privacy (COPPA)</h2>
          <p>
            SplitVote is not directed to children under 13 years of age. We do not knowingly collect
            personal information from children. If you believe a child has provided us with personal
            information, please contact us and we will delete it.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">11. Cookies</h2>
          <p className="mb-2">
            We use a consent banner (powered by Google&apos;s CMP) to manage cookies. Cookie categories:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong className="text-white">Strictly necessary</strong> — vote session cookie (localStorage only, not transmitted to servers).</li>
            <li><strong className="text-white">Analytics</strong> (consent required) — Google Analytics cookies (set only after your explicit consent).</li>
            <li><strong className="text-white">Advertising</strong> (consent required) — Google AdSense cookies.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">12. Changes to this policy</h2>
          <p>
            We may update this Privacy Policy periodically. Significant changes will be indicated by
            updating the &ldquo;Last updated&rdquo; date above. Continued use of the service after changes
            constitutes acceptance.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">13. Contact</h2>
          <p>
            For privacy-related questions, please contact:{' '}
            <a href="mailto:privacy@splitvote.io" className="text-blue-400 hover:underline">
              privacy@splitvote.io
            </a>
          </p>
        </div>

      </section>
    </div>
  )
}
