/**
 * Single source of truth for supported locales.
 *
 * Adding a new locale: append to SUPPORTED_LOCALES, add an entry to
 * LOCALE_META, and the LanguageSwitcher automatically flips from pill
 * toggle (≤2 langs) to dropdown (3+). The middleware locale-redirect
 * + sitemap hreflang map should be updated separately.
 */

export const SUPPORTED_LOCALES = ['en', 'it'] as const
export type Locale = (typeof SUPPORTED_LOCALES)[number]

export interface LocaleMeta {
  /** Short ISO display used in pill toggles ("EN", "IT"). */
  code: string
  /** Flag emoji shown next to the label. */
  flag: string
  /** Endonym — the language's name in itself ("English", "Italiano"). */
  name: string
  /** English name for ARIA labels. */
  ariaName: string
  /** Path of the locale's home page. */
  homePath: string
}

export const LOCALE_META: Record<Locale, LocaleMeta> = {
  en: { code: 'EN', flag: '🇬🇧', name: 'English',   ariaName: 'English',  homePath: '/'    },
  it: { code: 'IT', flag: '🇮🇹', name: 'Italiano',  ariaName: 'Italian',  homePath: '/it'  },
}

/**
 * Map the current pathname to the equivalent path in another locale.
 *
 * The mapping is a pure prefix toggle — works correctly for routes
 * where the slug is the same on both locales (e.g. `/leaderboard` ↔
 * `/it/leaderboard`, `/blog` ↔ `/it/blog`, `/category/<cat>` ↔
 * `/it/category/<cat>`). For routes whose slug differs per locale
 * (most blog post slugs, scenario play/results pages where Italian
 * uses translated dilemma ids), the toggle may land on a 404; pages
 * that need precise cross-links should declare them via
 * `metadata.alternates.languages` and Google reads those — the
 * switcher is a user-facing convenience, not the SEO source of truth.
 */
export function alternateLocalePath(pathname: string, target: Locale): string {
  if (target === 'it') {
    if (pathname === '/it' || pathname.startsWith('/it/')) return pathname
    if (pathname === '/') return '/it'
    return `/it${pathname}`
  }
  // target === 'en'
  if (pathname === '/it') return '/'
  if (pathname.startsWith('/it/')) return pathname.slice(3) || '/'
  return pathname
}
