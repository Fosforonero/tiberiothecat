'use client'

import { usePathname } from 'next/navigation'
import { SOCIAL_LINKS } from '@/lib/social-links'

export default function Footer() {
  const pathname = usePathname()
  const isIT = pathname.startsWith('/it')

  return (
    <footer className="text-center text-[var(--muted)] text-xs py-10 mt-16">
      <div className="neon-divider mb-8 mx-auto max-w-2xl" />
      <p className="mb-1">© 2026 SplitVote.io — {isIT ? 'Nessuna risposta giusta. Solo una onesta.' : 'No right answers. Just honest ones.'}</p>
      <p className="text-[10px] opacity-40 mb-3">{isIT ? 'Piattaforma di voto anonimo' : 'Anonymous voting platform'}</p>
      <p className="flex items-center justify-center gap-4 flex-wrap mb-3">
        <a href={isIT ? '/it/blog' : '/blog'} className="hover:text-white transition-colors">
          Blog
        </a>
        <span>·</span>
        <a href={isIT ? '/it/faq' : '/faq'} className="hover:text-white transition-colors">FAQ</a>
        <span>·</span>
        <a href={isIT ? '/it/privacy' : '/privacy'} className="hover:text-white transition-colors">
          {isIT ? 'Privacy' : 'Privacy Policy'}
        </a>
        <span>·</span>
        <a href={isIT ? '/it/terms' : '/terms'} className="hover:text-white transition-colors">
          {isIT ? 'Termini' : 'Terms of Service'}
        </a>
        <span>·</span>
        <a href="mailto:support@splitvote.io" className="hover:text-white transition-colors">
          {isIT ? 'Supporto' : 'Support'}
        </a>
        <span>·</span>
        <button
          onClick={() => window.dispatchEvent(new Event('sv:openCookieSettings'))}
          className="hover:text-white transition-colors"
        >
          {isIT ? 'Cookie' : 'Cookie settings'}
        </button>
      </p>
      <p className="flex items-center justify-center gap-4 flex-wrap">
        <a
          href={SOCIAL_LINKS.instagram}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={isIT ? 'SplitVote su Instagram' : 'SplitVote on Instagram'}
          className="hover:text-white transition-colors"
        >
          Instagram
        </a>
        <span>·</span>
        <a
          href={SOCIAL_LINKS.tiktok}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={isIT ? 'SplitVote su TikTok' : 'SplitVote on TikTok'}
          className="hover:text-white transition-colors"
        >
          TikTok
        </a>
      </p>
    </footer>
  )
}
