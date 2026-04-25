import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  metadataBase: new URL('https://splitvote.io'),
  title: {
    default: 'SplitVote — What Would the World Choose?',
    template: '%s | SplitVote',
  },
  description: 'Real-time global votes on impossible moral dilemmas. Trolley problem, lifeboat, privacy vs security — no right answers, just honest ones.',
  keywords: ['moral dilemma', 'trolley problem', 'ethics poll', 'global vote', 'would you rather', 'philosophy', 'moral philosophy', 'real-time vote'],
  authors: [{ name: 'SplitVote' }],
  creator: 'SplitVote',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    title: 'SplitVote — What Would the World Choose?',
    description: 'Real-time global votes on impossible moral dilemmas. No right answers — just honest ones.',
    url: 'https://splitvote.io',
    siteName: 'SplitVote',
    images: [{ url: '/og-default.png', width: 1200, height: 630, alt: 'SplitVote — Real-time global moral dilemmas' }],
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SplitVote — What Would the World Choose?',
    description: 'Real-time global votes on impossible moral dilemmas.',
    site: '@splitvote',
    creator: '@splitvote',
  },
  alternates: {
    canonical: 'https://splitvote.io',
  },
  other: {
    'google-adsense-account': 'ca-pub-5232020244793649',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* Google Analytics 4 */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-LT0NRHENKT"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-LT0NRHENKT');
          `}
        </Script>
        {/* Google AdSense */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5232020244793649"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className="min-h-screen" style={{ background: 'var(--bg)' }}>
        <nav className="border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
          <a href="/" className="text-xl font-black tracking-tight text-white">
            Split<span className="text-blue-400">Vote</span>
          </a>
          <span className="text-xs text-[var(--muted)]">Real-time global dilemmas</span>
        </nav>
        <main>{children}</main>
        <footer className="text-center text-[var(--muted)] text-xs py-10 border-t border-[var(--border)] mt-16">
          © 2026 SplitVote.io — No right answers. Just honest ones.
        </footer>
      </body>
    </html>
  )
}
