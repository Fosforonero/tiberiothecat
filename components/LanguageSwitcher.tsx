'use client'

import { useState, useRef, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  SUPPORTED_LOCALES,
  LOCALE_META,
  alternateLocalePath,
  type Locale,
} from '@/lib/locales'

/**
 * LanguageSwitcher — adaptive UI for switching between supported locales.
 *
 *   ≤ 2 locales  →  pill toggle (current default — EN | IT)
 *   ≥ 3 locales  →  dropdown menu with flag + endonym
 *
 * Adding a third locale to lib/locales.ts switches the rendering mode
 * automatically; no consumer changes required.
 *
 * Click behaviour:
 *   1. Set the `lang-pref` cookie (12h) so middleware stops the
 *      Accept-Language redirect loop from sending the user back.
 *   2. Navigate to the alternate locale's equivalent path via
 *      `alternateLocalePath()` — a pure prefix toggle that works for
 *      every route whose slug is shared across locales (leaderboard,
 *      trending, blog index, category hubs, dashboard, etc.).
 *
 * Pages with per-locale slugs (blog posts, play/results) should still
 * declare `metadata.alternates.languages` for SEO — the switcher is a
 * user convenience, not the canonical hreflang source.
 */

interface Props {
  /** Optional compact mode — smaller padding, used inside dense headers. */
  size?: 'sm' | 'md'
}

const LANG_COOKIE_MAX_AGE = 60 * 60 * 12 // 12h

function setLangCookie(locale: Locale): void {
  document.cookie = `lang-pref=${locale}; path=/; max-age=${LANG_COOKIE_MAX_AGE}`
}

function deriveCurrent(pathname: string): Locale {
  return pathname === '/it' || pathname.startsWith('/it/') ? 'it' : 'en'
}

export default function LanguageSwitcher({ size = 'md' }: Props) {
  const pathname = usePathname() ?? '/'
  const router = useRouter()
  const current = deriveCurrent(pathname)
  const isPill = SUPPORTED_LOCALES.length <= 2

  function switchTo(target: Locale) {
    if (target === current) return
    setLangCookie(target)
    router.push(alternateLocalePath(pathname, target))
  }

  return isPill ? (
    <PillSwitcher current={current} onSwitch={switchTo} size={size} />
  ) : (
    <DropdownSwitcher current={current} onSwitch={switchTo} size={size} />
  )
}

/* ── Pill variant (1-2 locales) ─────────────────────────────────────────── */

function PillSwitcher({
  current,
  onSwitch,
  size,
}: {
  current: Locale
  onSwitch: (locale: Locale) => void
  size: 'sm' | 'md'
}) {
  const pad = size === 'sm' ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'
  return (
    <div
      role="group"
      aria-label="Language"
      className="inline-flex items-center rounded-full border border-[var(--border)] bg-[#0d0d1a]/60 p-0.5"
    >
      {SUPPORTED_LOCALES.map((loc) => {
        const meta = LOCALE_META[loc]
        const active = loc === current
        return (
          <button
            key={loc}
            type="button"
            onClick={() => onSwitch(loc)}
            aria-pressed={active}
            aria-label={`Switch to ${meta.ariaName}`}
            className={`
              ${pad} rounded-full font-black tracking-wider uppercase transition-colors
              ${active
                ? 'bg-white/15 text-white'
                : 'text-[var(--muted)] hover:text-white'
              }
            `}
          >
            {meta.code}
          </button>
        )
      })}
    </div>
  )
}

/* ── Dropdown variant (3+ locales) ─────────────────────────────────────── */

function DropdownSwitcher({
  current,
  onSwitch,
  size,
}: {
  current: Locale
  onSwitch: (locale: Locale) => void
  size: 'sm' | 'md'
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)
  const meta = LOCALE_META[current]
  const pad = size === 'sm' ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'

  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onEsc)
    }
  }, [open])

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Language: ${meta.ariaName}`}
        className={`
          ${pad} inline-flex items-center gap-1.5 rounded-full border border-[var(--border)]
          bg-[#0d0d1a]/60 text-white font-bold hover:border-violet-500/40 transition-colors
        `}
      >
        <span aria-hidden="true">{meta.flag}</span>
        <span>{meta.code}</span>
        <span aria-hidden="true" className="text-[var(--muted)]">▾</span>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Select language"
          className="absolute right-0 mt-1 min-w-[10rem] rounded-xl border border-[var(--border)] bg-[#0d0d1a] shadow-xl py-1 z-50"
        >
          {SUPPORTED_LOCALES.map((loc) => {
            const m = LOCALE_META[loc]
            const active = loc === current
            return (
              <li key={loc}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => { setOpen(false); onSwitch(loc) }}
                  className={`
                    w-full text-left px-3 py-2 text-sm flex items-center gap-2
                    ${active
                      ? 'bg-white/10 text-white font-bold'
                      : 'text-[var(--muted)] hover:bg-white/5 hover:text-white'
                    }
                  `}
                >
                  <span aria-hidden="true">{m.flag}</span>
                  <span>{m.name}</span>
                  {active && <span className="ml-auto text-violet-400" aria-hidden="true">✓</span>}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
