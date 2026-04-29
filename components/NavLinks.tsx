'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { TrendingUp, Scale, Cpu, Users, Heart, Building2, Compass } from 'lucide-react'

const EN_LINKS = [
  { href: '/trending',               label: 'Trending',    icon: TrendingUp, color: 'text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 hover:border-purple-500/20' },
  { href: '/category/morality',      label: 'Morality',    icon: Scale,      color: 'text-[var(--muted)] hover:text-white hover:bg-white/5' },
  { href: '/category/technology',    label: 'Tech',        icon: Cpu,        color: 'text-[var(--muted)] hover:text-white hover:bg-white/5' },
  { href: '/category/society',       label: 'Society',     icon: Users,      color: 'text-[var(--muted)] hover:text-white hover:bg-white/5' },
  { href: '/category/relationships', label: 'Love',        icon: Heart,      color: 'text-[var(--muted)] hover:text-white hover:bg-white/5' },
  { href: '/personality',            label: 'My Profile',  icon: Compass,    color: 'text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-500/20' },
  { href: '/business',               label: 'Business',    icon: Building2,  color: 'text-[var(--muted)] hover:text-white hover:bg-white/5' },
]

const IT_LINKS = [
  { href: '/it/trending',               label: 'Tendenze',    icon: TrendingUp, color: 'text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 hover:border-purple-500/20' },
  { href: '/it/category/morality',      label: 'Moralità',    icon: Scale,      color: 'text-[var(--muted)] hover:text-white hover:bg-white/5' },
  { href: '/it/category/technology',    label: 'Tech',        icon: Cpu,        color: 'text-[var(--muted)] hover:text-white hover:bg-white/5' },
  { href: '/it/category/society',       label: 'Società',     icon: Users,      color: 'text-[var(--muted)] hover:text-white hover:bg-white/5' },
  { href: '/it/category/relationships', label: 'Amore',       icon: Heart,      color: 'text-[var(--muted)] hover:text-white hover:bg-white/5' },
  { href: '/it/personality',            label: 'Il Mio Profilo', icon: Compass, color: 'text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-500/20' },
  { href: '/it/faq',                    label: 'FAQ',         icon: Building2,  color: 'text-[var(--muted)] hover:text-white hover:bg-white/5' },
]

export default function NavLinks() {
  const pathname = usePathname()
  const isIT = pathname.startsWith('/it')
  const links = isIT ? IT_LINKS : EN_LINKS

  return (
    <div className="hidden lg:flex items-center gap-0.5 flex-1 justify-center">
      {links.map(({ href, label, icon: Icon, color }) => (
        <Link
          key={href}
          href={href}
          className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest transition-all px-3 py-1.5 rounded-lg border border-transparent ${color}`}
        >
          <Icon size={12} />
          {label}
        </Link>
      ))}
    </div>
  )
}
