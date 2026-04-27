'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { createPortal } from 'react-dom'
import { Menu, X, TrendingUp, Scale, Cpu, Users, Heart, Zap, Building2, HelpCircle, Compass } from 'lucide-react'

const EN_LINKS = [
  { href: '/trending',               label: 'Trending',      icon: TrendingUp, color: 'text-purple-400' },
  { href: '/category/morality',      label: 'Morality',      icon: Scale,      color: 'text-red-400'    },
  { href: '/category/technology',    label: 'Technology',    icon: Cpu,        color: 'text-blue-400'   },
  { href: '/category/society',       label: 'Society',       icon: Users,      color: 'text-green-400'  },
  { href: '/category/relationships', label: 'Relationships', icon: Heart,      color: 'text-pink-400'   },
  { href: '/personality',            label: 'My Profile',    icon: Compass,    color: 'text-cyan-400'   },
  { href: '/category/survival',      label: 'Survival',      icon: Zap,        color: 'text-orange-400' },
  { href: '/business',               label: 'Business',      icon: Building2,  color: 'text-blue-400'   },
  { href: '/faq',                    label: 'FAQ',           icon: HelpCircle, color: 'text-[var(--muted)]' },
]

const IT_LINKS = [
  { href: '/it/trending',               label: 'Tendenze',      icon: TrendingUp, color: 'text-purple-400' },
  { href: '/it/category/morality',      label: 'Moralità',      icon: Scale,      color: 'text-red-400'    },
  { href: '/it/category/technology',    label: 'Tecnologia',    icon: Cpu,        color: 'text-blue-400'   },
  { href: '/it/category/society',       label: 'Società',       icon: Users,      color: 'text-green-400'  },
  { href: '/it/category/relationships', label: 'Relazioni',     icon: Heart,      color: 'text-pink-400'   },
  { href: '/it/personality',            label: 'Profilo',       icon: Compass,    color: 'text-cyan-400'   },
  { href: '/it/category/survival',      label: 'Sopravvivenza', icon: Zap,        color: 'text-orange-400' },
  { href: '/it/faq',                    label: 'FAQ',           icon: HelpCircle, color: 'text-[var(--muted)]' },
]

export default function MobileMenu() {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const isIT = pathname.startsWith('/it')
  const NAV_LINKS = isIT ? IT_LINKS : EN_LINKS

  useEffect(() => { setMounted(true) }, [])

  // Lock body scroll when menu is open
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  // The backdrop + dropdown are rendered via a portal directly into <body>.
  // This ensures they escape the navbar's stacking context, which is created
  // by backdrop-filter: blur() — a CSS property that forms a new containing
  // block for position:fixed children.
  const overlay = open && mounted && createPortal(
    <>
      {/* Backdrop */}
      <button
        type="button"
        aria-label={isIT ? 'Chiudi menu' : 'Close menu'}
        onClick={() => setOpen(false)}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          border: 'none',
          cursor: 'default',
        }}
      />

      {/* Dropdown */}
      <div
        id="mobile-menu-dropdown"
        role="menu"
        style={{
          position: 'fixed',
          top: '56px',
          right: '12px',
          width: '240px',
          zIndex: 1001,
          backgroundColor: '#0f0f2a',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 12px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(77,159,255,0.15)',
        }}
      >
        <div style={{ padding: '8px' }}>
          {NAV_LINKS.map(({ href, label, icon: Icon, color }) => (
            <a
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              role="menuitem"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                borderRadius: '12px',
                textDecoration: 'none',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <Icon size={15} className={`${color} flex-shrink-0`} />
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>
                {label}
              </span>
            </a>
          ))}
        </div>
      </div>
    </>,
    document.body,
  )

  return (
    <>
      {/* Hamburger button — stays inside the nav */}
      <div className="md:hidden">
        <button
          onClick={() => setOpen(o => !o)}
          aria-label={open ? (isIT ? 'Chiudi menu' : 'Close menu') : (isIT ? 'Apri menu' : 'Open menu')}
          aria-expanded={open}
          aria-controls="mobile-menu-dropdown"
          className="flex items-center justify-center w-9 h-9 rounded-xl border border-[var(--border)] hover:border-[var(--border-hi)] hover:bg-white/5 transition-all text-[var(--muted)] hover:text-white"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Portal-rendered overlay */}
      {overlay}
    </>
  )
}
