import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import { Analytics } from '@vercel/analytics/next'
import { TrendingUp, Scale, Cpu, Users, Heart, Building2, Compass } from 'lucide-react'
import CookieConsent from '@/components/CookieConsent'
import AuthButton from '@/components/AuthButton'
import AdBlockBanner from '@/components/AdBlockBanner'
import MobileMenu from '@/components/MobileMenu'
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

const NAV_CATEGORIES = [
  { href: '/trending',               label: 'Trending',     icon: TrendingUp, color: 'text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 hover:border-purple-500/20' },
  { href: '/category/morality',      label: 'Morality',     icon: Scale,      color: 'text-[var(--muted)] hover:text-white hover:bg-white/5' },
  { href: '/category/technology',    label: 'Tech',         icon: Cpu,        color: 'text-[var(--muted)] hover:text-white hover:bg-white/5' },
  { href: '/category/society',       label: 'Society',      icon: Users,      color: 'text-[var(--muted)] hover:text-white hover:bg-white/5' },
  { href: '/category/relationships', label: 'Love',         icon: Heart,      color: 'text-[var(--muted)] hover:text-white hover:bg-white/5' },
  { href: '/personality',            label: 'My Profile',   icon: Compass,    color: 'text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-500/20' },
  { href: '/business',               label: 'Business',     icon: Building2,  color: 'text-[var(--muted)] hover:text-white hover:bg-white/5' },
]

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
          <a href="/" className="flex-shrink-0 flex items-center gap-2.5 group" aria-label="SplitVote home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/splitvote_icon.png"
              alt="SplitVote"
              width={34} height={34}
              className="w-[34px] h-[34px] flex-shrink-0"
              style={{ borderRadius: '8px' }}
            />
            {/* Desktop: wordmark PNG */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/splitvote_wordmark.png"
              alt="SplitVote"
              height={22}
              className="hidden sm:block h-[22px] w-auto flex-shrink-0"
            />
          </a>

          {/* Desktop category links */}
          <div className="hidden md:flex items-center gap-0.5 flex-1 justify-center">
            {NAV_CATEGORIES.map(({ href, label, icon: Icon, color }) => (
              <a
                key={href}
                href={href}
                className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest transition-all px-3 py-1.5 rounded-lg border border-transparent ${color}`}
              >
                <Icon size={12} />
                {label}
              </a>
            ))}
          </div>

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

        <footer className="text-center text-[var(--muted)] text-xs py-10 mt-16">
          <div className="neon-divider mb-8 mx-auto max-w-2xl" />
          <p className="mb-2">© 2026 SplitVote.io — No right answers. Just honest ones.</p>
          <p className="flex items-center justify-center gap-4 flex-wrap">
            <a href="/faq" className="hover:text-white transition-colors">FAQ</a>
            <span>·</span>
            <a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a>
            <span>·</span>
            <a href="/terms" className="hover:text-white transition-colors">Terms of Service</a>
          </p>
        </footer>
      </body>
    </html>
  )
}
