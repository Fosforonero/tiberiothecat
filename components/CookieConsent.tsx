'use client'

import { useState, useEffect } from 'react'

const CONSENT_KEY = 'sv_cookie_consent' // 'granted' | 'denied'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

function updateConsentMode(granted: boolean) {
  if (typeof window === 'undefined' || !window.gtag) return
  window.gtag('consent', 'update', {
    analytics_storage: granted ? 'granted' : 'denied',
    ad_storage: granted ? 'granted' : 'denied',
    ad_user_data: granted ? 'granted' : 'denied',
    ad_personalization: granted ? 'granted' : 'denied',
  })
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY)
    if (!stored) {
      // First visit — show banner with short delay for better UX
      const t = setTimeout(() => setVisible(true), 800)
      return () => clearTimeout(t)
    }
    // Restore previous choice so GA/AdSense work correctly on return visits
    updateConsentMode(stored === 'granted')
  }, [])

  function accept() {
    localStorage.setItem(CONSENT_KEY, 'granted')
    updateConsentMode(true)
    setVisible(false)
  }

  function decline() {
    localStorage.setItem(CONSENT_KEY, 'denied')
    updateConsentMode(false)
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      aria-live="polite"
      className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6"
    >
      <div className="max-w-3xl mx-auto rounded-2xl border border-[var(--border)] bg-[#0d0d1a]/95 backdrop-blur-md shadow-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-[var(--text)] leading-relaxed">
            We use cookies to count votes and improve your experience.{' '}
            <a
              href="/privacy"
              className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
            >
              Privacy Policy
            </a>
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 flex-shrink-0 w-full sm:w-auto">
          <button
            onClick={decline}
            className="flex-1 sm:flex-none text-xs font-bold uppercase tracking-widest px-4 py-2.5 rounded-xl border border-[var(--border)] text-[var(--muted)] hover:text-white hover:border-white/20 transition-colors"
          >
            Decline
          </button>
          <button
            onClick={accept}
            className="flex-1 sm:flex-none text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white transition-colors"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}
