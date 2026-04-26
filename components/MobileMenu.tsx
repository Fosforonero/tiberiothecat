'use client'

import { useState } from 'react'
import { Menu, X, TrendingUp, Scale, Cpu, Users, Heart, Globe } from 'lucide-react'

const NAV_LINKS = [
  { href: '/trending',              label: 'Trending',     icon: TrendingUp, color: 'text-purple-400' },
  { href: '/category/morality',     label: 'Morality',     icon: Scale,      color: 'text-red-400'    },
  { href: '/category/technology',   label: 'Technology',   icon: Cpu,        color: 'text-blue-400'   },
  { href: '/category/society',      label: 'Society',      icon: Users,      color: 'text-green-400'  },
  { href: '/category/relationships',label: 'Relationships',icon: Heart,      color: 'text-pink-400'   },
  { href: '/category/philosophy',   label: 'Philosophy',   icon: Globe,      color: 'text-yellow-400' },
]

export default function MobileMenu() {
  const [open, setOpen] = useState(false)

  return (
    <div className="md:hidden relative">
      {/* Hamburger button */}
      <button
        onClick={() => setOpen(!open)}
        aria-label={open ? 'Close menu' : 'Open menu'}
        className="flex items-center justify-center w-9 h-9 rounded-xl border border-[var(--border)] hover:border-[var(--border-hi)] hover:bg-white/5 transition-all text-[var(--muted)] hover:text-white"
      >
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="mobile-menu-enter absolute right-0 top-11 w-56 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl overflow-hidden z-50"
          style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(77,159,255,0.1)' }}
        >
          <div className="p-2 space-y-0.5">
            {NAV_LINKS.map(({ href, label, icon: Icon, color }) => (
              <a
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors group"
              >
                <Icon size={15} className={`${color} flex-shrink-0`} />
                <span className="text-sm font-semibold text-[var(--muted)] group-hover:text-white transition-colors">
                  {label}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  )
}
