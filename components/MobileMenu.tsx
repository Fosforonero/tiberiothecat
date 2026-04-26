'use client'

import { useEffect, useState } from 'react'
import { Menu, X, TrendingUp, Scale, Cpu, Users, Heart, Globe, Building2, HelpCircle } from 'lucide-react'

const NAV_LINKS = [
  { href: '/trending',              label: 'Trending',     icon: TrendingUp, color: 'text-purple-400' },
  { href: '/category/morality',     label: 'Morality',     icon: Scale,      color: 'text-red-400'    },
  { href: '/category/technology',   label: 'Technology',   icon: Cpu,        color: 'text-blue-400'   },
  { href: '/category/society',      label: 'Society',      icon: Users,      color: 'text-green-400'  },
  { href: '/category/relationships',label: 'Relationships',icon: Heart,      color: 'text-pink-400'   },
  { href: '/category/philosophy',   label: 'Philosophy',   icon: Globe,      color: 'text-yellow-400' },
  { href: '/business',              label: 'Business',     icon: Building2,  color: 'text-blue-400'   },
  { href: '/faq',                   label: 'FAQ',          icon: HelpCircle, color: 'text-cyan-400'   },
]

export default function MobileMenu() {
  const [open, setOpen] = useState(false)

  // Lock body scroll when menu is open (prevents background scrolling on mobile)
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = prev }
    }
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      {/* Hamburger button (lives inside the nav) */}
      <div className="md:hidden">
        <button
          onClick={() => setOpen(o => !o)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="mobile-menu-dropdown"
          className="flex items-center justify-center w-9 h-9 rounded-xl border border-[var(--border)] hover:border-[var(--border-hi)] hover:bg-white/5 transition-all text-[var(--muted)] hover:text-white"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Backdrop + dropdown — rendered with position: fixed and very high z-index
          to escape the navbar's stacking context (created by backdrop-filter). */}
      {open && (
        <>
          {/* Solid backdrop — closes menu on click and prevents page-content bleed-through */}
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm"
            style={{ zIndex: 1000 }}
          />

          {/* Dropdown */}
          <div
            id="mobile-menu-dropdown"
            role="menu"
            className="mobile-menu-enter md:hidden fixed right-3 top-14 w-60 rounded-2xl border border-[var(--border)] overflow-hidden"
            style={{
              zIndex: 1001,
              // FULLY opaque: no var() that could resolve to a translucent value at runtime,
              // and an explicit fallback hex so utility purges can't strip it.
              backgroundColor: '#0f0f2a',
              boxShadow: '0 12px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(77,159,255,0.15)',
            }}
          >
            <div className="p-2 space-y-0.5">
              {NAV_LINKS.map(({ href, label, icon: Icon, color }) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  role="menuitem"
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
        </>
      )}
    </>
  )
}
