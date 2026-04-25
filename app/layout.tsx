import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'SplitVote — What Would the World Choose?',
  description: 'Real-time global polls on impossible moral dilemmas. Vote and see how the world splits.',
  openGraph: {
    title: 'SplitVote — What Would the World Choose?',
    description: 'Real-time global polls on impossible moral dilemmas.',
    url: 'https://splitvote.io',
    siteName: 'SplitVote',
    images: [{ url: 'https://splitvote.io/og-default.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SplitVote — What Would the World Choose?',
    description: 'Real-time global polls on impossible moral dilemmas.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
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
