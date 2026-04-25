import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of Service for SplitVote.io.',
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://splitvote.io/terms' },
}

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-[var(--text)]">
      <h1 className="text-3xl font-black mb-2">Terms of Service</h1>
      <p className="text-sm text-[var(--muted)] mb-10">Last updated: April 25, 2026</p>

      <section className="space-y-6 text-sm leading-relaxed text-[var(--muted)]">

        <div>
          <h2 className="text-base font-bold text-white mb-2">1. Acceptance of terms</h2>
          <p>
            By accessing or using SplitVote.io (&ldquo;the Service&rdquo;), you agree to be bound by
            these Terms of Service. If you do not agree, please do not use the Service.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">2. Description of the service</h2>
          <p>
            SplitVote.io is an anonymous online voting platform that presents moral dilemmas and
            displays real-time aggregated results. The Service is provided for entertainment and
            educational purposes only. No vote constitutes medical, legal, financial, or any
            professional advice.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">3. Eligibility</h2>
          <p>
            You must be at least 13 years of age to use the Service. By using the Service, you
            represent and warrant that you meet this age requirement. If you are under 18, you should
            review these Terms with a parent or guardian.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">4. Acceptable use</h2>
          <p className="mb-2">You agree not to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Attempt to manipulate vote counts through automated means, bots, or scripts</li>
            <li>Reverse engineer, scrape, or crawl the Service in a way that imposes unreasonable load</li>
            <li>Use the Service for any unlawful purpose or in violation of applicable laws</li>
            <li>Attempt to circumvent any security measures</li>
          </ul>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">5. Intellectual property</h2>
          <p>
            All content on the Service, including but not limited to text, graphics, logos, and code,
            is owned by SplitVote.io or its licensors and is protected by applicable intellectual
            property laws. You may share results and screenshots for personal, non-commercial use with
            attribution to SplitVote.io.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">6. Disclaimers</h2>
          <p>
            The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind,
            express or implied. We do not warrant that the Service will be uninterrupted, error-free,
            or free of viruses. Vote results are not scientifically representative samples of any
            population.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">7. Limitation of liability</h2>
          <p>
            To the fullest extent permitted by law, SplitVote.io shall not be liable for any indirect,
            incidental, special, consequential, or punitive damages arising from your use of the
            Service. Our total liability shall not exceed €100.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">8. Third-party advertising</h2>
          <p>
            The Service may display advertisements served by Google AdSense. We are not responsible
            for the content of third-party advertisements. Clicking on advertisements is at your own
            risk.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">9. Privacy</h2>
          <p>
            Your use of the Service is also governed by our{' '}
            <a href="/privacy" className="text-blue-400 hover:underline">Privacy Policy</a>,
            which is incorporated into these Terms by reference.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">10. Governing law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of Italy,
            without regard to conflict of law principles. Any disputes shall be subject to the
            exclusive jurisdiction of the courts of Italy.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">11. Changes to terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. Continued use of the Service
            after changes constitutes acceptance of the new Terms.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">12. Contact</h2>
          <p>
            For any questions regarding these Terms, please contact:{' '}
            <a href="mailto:legal@splitvote.io" className="text-blue-400 hover:underline">
              legal@splitvote.io
            </a>
          </p>
        </div>

      </section>
    </div>
  )
}
