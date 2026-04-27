'use client'

import { usePathname } from 'next/navigation'

export default function Footer() {
  const pathname = usePathname()
  const isIT = pathname.startsWith('/it')

  return (
    <footer className="text-center text-[var(--muted)] text-xs py-10 mt-16">
      <div className="neon-divider mb-8 mx-auto max-w-2xl" />
      <p className="mb-2">© 2026 SplitVote.io — {isIT ? 'Nessuna risposta giusta. Solo una onesta.' : 'No right answers. Just honest ones.'}</p>
      <p className="flex items-center justify-center gap-4 flex-wrap">
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
      </p>
    </footer>
  )
}
