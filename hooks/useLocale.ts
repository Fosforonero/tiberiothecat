'use client'

/**
 * useLocale — single source of truth for route-based locale detection.
 *
 * Returns:
 *   isIT     — true when the current path is under /it/*
 *   locale   — 'it' | 'en'  (for toLocaleString, track(), etc.)
 *   prefix   — '/it' | ''   (for building locale-aware hrefs)
 *   pathname — raw Next.js pathname (pass-through so callers don't need a
 *              second usePathname() call for active-state detection etc.)
 *
 * Usage:
 *   const { isIT, prefix } = useLocale()
 *   <Link href={`${prefix}/trending`}>…</Link>
 */

import { usePathname } from 'next/navigation'

export type Locale = 'it' | 'en'
export type LocalePrefix = '/it' | ''

export interface LocaleInfo {
  isIT: boolean
  locale: Locale
  prefix: LocalePrefix
  pathname: string
}

export function useLocale(): LocaleInfo {
  const pathname = usePathname() ?? ''
  const isIT = pathname.startsWith('/it')
  return {
    isIT,
    locale:  isIT ? 'it' : 'en',
    prefix:  isIT ? '/it' : '',
    pathname,
  }
}
