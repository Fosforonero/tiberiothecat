'use client'

/**
 * AdSenseLoader — loads the Google AdSense library ONLY after the user has
 * granted advertising consent.
 *
 * Why: ePrivacy / Garante cookie rules require non-essential third-party tags
 * not to load before consent. Previously adsbygoogle.js was loaded
 * unconditionally in the root layout, which fired a Google connection before
 * the cookie banner was answered and contradicted the privacy policy's
 * "no advertising cookies without explicit consent" promise.
 *
 * Behaviour:
 * - On mount, if advertising consent was already granted in a prior session
 *   (sv_cookie_consent === 'granted', or 'custom' with prefs.ads === true),
 *   inject the script immediately.
 * - Otherwise wait for the `sv:adsConsentGranted` event dispatched by
 *   CookieConsent when the user grants ad consent during this session.
 * - The script is injected at most once.
 *
 * AdSlot.tsx pushes to the adsbygoogle queue independently; pushes made before
 * the script loads are processed once it loads, so ordering is safe.
 */

import { useEffect } from 'react'

const CONSENT_KEY = 'sv_cookie_consent'
const PREFS_KEY = 'sv_cookie_prefs'
const ADSENSE_SRC =
  'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5232020244793649'

function adsConsented(): boolean {
  try {
    const stored = localStorage.getItem(CONSENT_KEY)
    if (stored === 'granted') return true
    if (stored === 'denied' || !stored) return false
    // 'custom' — read granular prefs
    const raw = localStorage.getItem(PREFS_KEY)
    if (!raw) return false
    return !!(JSON.parse(raw) as { ads?: boolean }).ads
  } catch {
    return false
  }
}

function injectAdSense() {
  if (typeof document === 'undefined') return
  if (document.getElementById('adsbygoogle-js')) return
  const s = document.createElement('script')
  s.id = 'adsbygoogle-js'
  s.src = ADSENSE_SRC
  s.async = true
  s.crossOrigin = 'anonymous'
  document.head.appendChild(s)
}

export default function AdSenseLoader() {
  useEffect(() => {
    if (adsConsented()) injectAdSense()
    const onGrant = () => injectAdSense()
    window.addEventListener('sv:adsConsentGranted', onGrant)
    return () => window.removeEventListener('sv:adsConsentGranted', onGrant)
  }, [])
  return null
}
