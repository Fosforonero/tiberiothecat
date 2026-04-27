import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import Link from 'next/link'
import { Analytics } from '@vercel/analytics/next'
import CookieConsent from '@/components/CookieConsent'
import AuthButton from '@/components/AuthButton'
import AdBlockBanner from '@/components/AdBlockBanner'
import MobileMenu from '@/components/MobileMenu'
import NavLinks from '@/components/NavLinks'
import Footer from '@/components/Footer'
import './globals.css'
import JsonLd from '@/components/JsonLd'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  metadataBase: new URL('https://splitvote.io'),
  title: {
    default: 'SplitVote — What Would the World Choose?',
    template: '%s | SplitVote',
  },
  description: 'Real-time global votes on impossible moral dilemmas. Trolley problem, lifeboat, privacy vs security — no right answers, just honest ones.',
  keywords: [
    'moral dilemma', 'trolley problem', 'ethics poll', 'global vote',
    'would you rather', 'philosophy', 'moral philosophy', 'real-time vote',
    'ethical question', 'dilemma vote', 'online poll', 'impossible choice',
    'what would you do', 'moral question', 'ethics quiz', 'social dilemma',
    'dilemma etico', 'sondaggio morale', 'vota online', 'cosa faresti',
  ],
  authors: [{ name: 'SplitVote' }],
  creator: 'SplitVote',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
  openGraph: {
    title: 'SplitVote — What Would the World Choose?',
    description: 'Real-time global votes on impossible moral dilemmas. No right answers — just honest ones.',
    url: 'https://splitvote.io',
    siteName: 'SplitVote',
    images: [{ url: '/og-default.png', width: 1200, height: 630, alt: 'SplitVote — Real-time global moral dilemmas' }],
    type: 'website',
    locale: 'en_US',
    alternateLocale: ['it_IT'],
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
    languages: {
      'en': 'https://splitvote.io',
      'it': 'https://splitvote.io/it',
      'x-default': 'https://splitvote.io',
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
      { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
      { url: '/android-chrome-192x192.png', type: 'image/png', sizes: '192x192' },
    ],
    apple: [{ url: '/apple-touch-icon.png' }],
    shortcut: '/favicon.ico',
  },
  other: {
    'google-adsense-account': 'ca-pub-5232020244793649',
    'google-site-verification': '',
  },
}


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <Script id="consent-mode" strategy="beforeInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('consent', 'default', {
              'analytics_storage': 'denied',
              'ad_storage': 'denied',
              'ad_user_data': 'denied',
              'ad_personalization': 'denied',
              'wait_for_update': 500
            });
            gtag('set', 'ads_data_redaction', true);
            gtag('set', 'url_passthrough', true);
          `}
        </Script>
        <Script src="/api/_g/script?id=G-5MPQ8PW0CE" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-5MPQ8PW0CE', {
              transport_url: 'https://splitvote.io/api/_g',
              first_party_collection: true
            });
          `}
        </Script>
        <Script
          async
          src="/api/_g/ads?client=ca-pub-5232020244793649"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      {/* Organization + site-level JSON-LD */}
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'SplitVote',
        url: 'https://splitvote.io',
        logo: 'https://splitvote.io/og-default.png',
        sameAs: ['https://twitter.com/splitvote'],
        description: 'Real-time global votes on impossible moral dilemmas.',
      }} />
      </head>
      <body className="min-h-screen" style={{ background: 'var(--bg)' }}>
        {/* Animated background */}
        <div className="bg-orbs" aria-hidden="true" />
        <div className="bg-orb-mid" aria-hidden="true" />
        <div className="bg-orb-cyan" aria-hidden="true" />

        {/* ── Navbar ── */}
        <nav className="border-b border-[var(--border)] px-4 sm:px-6 py-3 flex items-center justify-between gap-3"
          style={{ backdropFilter: 'blur(12px)', background: 'rgba(7,7,24,0.75)' }}>

          {/* Logo — icon on mobile, wordmark on desktop */}
          <Link href="/" className="flex-shrink-0 flex items-center group" aria-label="SplitVote home">
            {/* Wordmark PNG — visible on all screen sizes */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/splitvote_wordmark.png"
              alt="SplitVote"
              height={28}
              className="h-[28px] w-auto flex-shrink-0"
            />
          </Link>

          {/* Desktop category links — locale-aware */}
          <NavLinks />

          {/* Right side: auth + mobile menu */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="border-l border-[var(--border)] pl-3 hidden sm:block">
              <AuthButton />
            </div>
            <div className="sm:hidden">
              <AuthButton />
            </div>
            <MobileMenu />
          </div>
        </nav>

        <main>{children}</main>
        <Analytics />
        <CookieConsent />
        <AdBlockBanner />
        <Footer />
      </body>
    </html>
  )
}
