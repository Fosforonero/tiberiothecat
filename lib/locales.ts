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
 * Static map of EN ↔ IT slugs for routes whose top-level segment differs
 * across locales. Used by `alternateLocalePath()` so the language switcher
 * lands on the correct page instead of 404.
 *
 * For dynamic-slug pages (blog posts, SEO topic landings) the page should
 * declare `metadata.alternates.languages`; the switcher reads those at
 * runtime as a higher-precedence source than this static map.
 */
const EN_TO_IT_SEGMENT: Record<string, string> = {
  'moral-dilemmas':              'dilemmi-morali',
  'topics':                       'temi',
  'would-you-rather-questions':   'domande-would-you-rather',
}
const IT_TO_EN_SEGMENT: Record<string, string> = Object.fromEntries(
  Object.entries(EN_TO_IT_SEGMENT).map(([en, it]) => [it, en]),
)

/**
 * Map the current pathname to the equivalent path in another locale.
 *
 * Strategy:
 *   1. Strip query/hash and split into segments.
 *   2. If the first segment (EN) or second segment after `/it` (IT) has a
 *      known counterpart in the slug map, swap it.
 *   3. Otherwise fall back to a pure `/it` prefix toggle — works for routes
 *      where the slug is shared across locales (leaderboard, blog index,
 *      category, dashboard, play/[id], results/[id], etc.).
 *
 * For routes whose slug differs per locale AND isn't in the static map
 * (blog posts with `alternateSlug`, SEO topic landings with `alternateSlug`),
 * the page should declare `metadata.alternates.languages` and the
 * LanguageSwitcher reads those from `<link rel="alternate" hreflang>`
 * in document.head at runtime.
 */
export function alternateLocalePath(pathname: string, target: Locale): string {
  // Preserve query + hash across the swap so filters/search/anchors survive.
  const qIdx = pathname.search(/[?#]/)
  const qs = qIdx >= 0 ? pathname.slice(qIdx) : ''
  const path = qIdx >= 0 ? pathname.slice(0, qIdx) : pathname

  if (target === 'it') {
    if (path === '/it' || path.startsWith('/it/')) return path + qs
    if (path === '/') return '/it' + qs

    // Strip leading slash, take first segment, check for IT counterpart.
    const segs = path.slice(1).split('/')
    const itSeg = EN_TO_IT_SEGMENT[segs[0]]
    if (itSeg) {
      segs[0] = itSeg
      return `/it/${segs.join('/')}${qs}`
    }
    return `/it${path}${qs}`
  }

  // target === 'en'
  if (path === '/it') return '/' + qs.replace(/^\?/, '?')
  if (path.startsWith('/it/')) {
    const tail = path.slice(4) // strip "/it/"
    const segs = tail.split('/')
    const enSeg = IT_TO_EN_SEGMENT[segs[0]]
    if (enSeg) {
      segs[0] = enSeg
      return `/${segs.join('/')}${qs}`
    }
    return `/${tail}${qs}`
  }
  return path + qs
}
