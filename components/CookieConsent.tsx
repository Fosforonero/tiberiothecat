'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

const CONSENT_KEY = 'sv_cookie_consent'  // 'granted' | 'denied' | 'custom' (backward compat)
const PREFS_KEY = 'sv_cookie_prefs'      // JSON: { analytics: boolean, ads: boolean }

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

interface CookiePrefs {
  analytics: boolean
  ads: boolean
}

function updateConsentMode(prefs: CookiePrefs) {
  if (typeof window === 'undefined' || !window.gtag) return
  window.gtag('consent', 'update', {
    analytics_storage: prefs.analytics ? 'granted' : 'denied',
    ad_storage: prefs.ads ? 'granted' : 'denied',
    ad_user_data: prefs.ads ? 'granted' : 'denied',
    ad_personalization: prefs.ads ? 'granted' : 'denied',
  })
}

function loadSavedPrefs(): CookiePrefs | null {
  try {
    const stored = localStorage.getItem(CONSENT_KEY)
    if (!stored) return null
    if (stored === 'granted') return { analytics: true, ads: true }
    if (stored === 'denied') return { analytics: false, ads: false }
    // 'custom' — read granular prefs
    const raw = localStorage.getItem(PREFS_KEY)
    if (raw) return JSON.parse(raw) as CookiePrefs
    return { analytics: false, ads: false }
  } catch {
    return null
  }
}

function savePrefs(prefs: CookiePrefs) {
  const all = prefs.analytics && prefs.ads
  const none = !prefs.analytics && !prefs.ads
  localStorage.setItem(CONSENT_KEY, all ? 'granted' : none ? 'denied' : 'custom')
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)
  const [customizing, setCustomizing] = useState(false)
  const [prefs, setPrefs] = useState<CookiePrefs>({ analytics: false, ads: false })
  const pathname = usePathname()
  const isIT = pathname.startsWith('/it')

  useEffect(() => {
    const saved = loadSavedPrefs()
    if (!saved) {
      const t = setTimeout(() => setVisible(true), 800)
      return () => clearTimeout(t)
    }
    updateConsentMode(saved)
    setPrefs(saved)
  }, [])

  useEffect(() => {
    function handleOpen() {
      const saved = loadSavedPrefs()
      if (saved) setPrefs(saved)
      setCustomizing(true)
      setVisible(true)
    }
    window.addEventListener('sv:openCookieSettings', handleOpen)
    return () => window.removeEventListener('sv:openCookieSettings', handleOpen)
  }, [])

  function sendConsentPageView() {
    window.gtag?.('event', 'page_view', {
      page_path: window.location.pathname + window.location.search,
      page_location: window.location.href,
      page_title: document.title,
    })
  }

  function acceptAll() {
    const p: CookiePrefs = { analytics: true, ads: true }
    savePrefs(p)
    updateConsentMode(p)
    sendConsentPageView()
    setVisible(false)
    setCustomizing(false)
  }

  function declineAll() {
    const p: CookiePrefs = { analytics: false, ads: false }
    savePrefs(p)
    updateConsentMode(p)
    setVisible(false)
    setCustomizing(false)
  }

  function saveCustom() {
    savePrefs(prefs)
    updateConsentMode(prefs)
    if (prefs.analytics) sendConsentPageView()
    setVisible(false)
    setCustomizing(false)
  }

  if (!visible) return null

  const privacyHref = isIT ? '/it/privacy' : '/privacy'

  return (
    <div
      role="dialog"
      aria-label={isIT ? 'Consenso cookie' : 'Cookie consent'}
      aria-live="polite"
      className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6"
    >
      <div className="max-w-3xl mx-auto rounded-2xl border border-[var(--border)] bg-[#0d0d1a]/95 backdrop-blur-md shadow-2xl p-5 sm:p-6 flex flex-col gap-4">

        {/* Header row: text + main action buttons */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1 min-w-0">
            {isIT ? (
              <p className="text-sm text-[var(--text)] leading-relaxed">
                Utilizziamo cookie necessari per il funzionamento del sito. Con il tuo consenso utilizziamo anche cookie analitici e pubblicitari.{' '}
                <a
                  href={privacyHref}
                  className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
                >
                  Informativa Privacy
                </a>
              </p>
            ) : (
              <p className="text-sm text-[var(--text)] leading-relaxed">
                We use necessary cookies to run the site. With your consent we also use analytics and advertising cookies.{' '}
                <a
                  href={privacyHref}
                  className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
                >
                  Privacy Policy
                </a>
              </p>
            )}
          </div>

          {!customizing && (
            <div className="flex gap-2 flex-shrink-0 w-full sm:w-auto">
              <button
                onClick={declineAll}
                className="flex-1 sm:flex-none text-xs font-bold uppercase tracking-widest px-4 py-2.5 rounded-xl border border-[var(--border)] text-[var(--muted)] hover:text-white hover:border-white/20 transition-colors"
              >
                {isIT ? 'Rifiuta' : 'Decline'}
              </button>
              <button
                onClick={() => setCustomizing(true)}
                className="flex-1 sm:flex-none text-xs font-bold uppercase tracking-widest px-4 py-2.5 rounded-xl border border-[var(--border)] text-[var(--muted)] hover:text-white hover:border-white/20 transition-colors"
              >
                {isIT ? 'Personalizza' : 'Customize'}
              </button>
              <button
                onClick={acceptAll}
                className="flex-1 sm:flex-none text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white transition-colors"
              >
                {isIT ? 'Accetta tutto' : 'Accept all'}
              </button>
            </div>
          )}
        </div>

        {/* Granular preferences panel */}
        {customizing && (
          <div className="border-t border-[var(--border)] pt-4 space-y-4">

            {/* Necessary — always on */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-white">
                  {isIT ? 'Necessari' : 'Necessary'}
                </p>
                <p className="text-[11px] text-[var(--muted)] mt-0.5">
                  {isIT
                    ? 'Cookie essenziali per il funzionamento del sito (voti anonimi, sessione). Non disattivabili.'
                    : 'Essential cookies for the site to function (anonymous votes, session). Cannot be disabled.'}
                </p>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] flex-shrink-0 mt-0.5">
                {isIT ? 'Sempre attivi' : 'Always on'}
              </span>
            </div>

            {/* Analytics */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-white">
                  {isIT ? 'Analitici' : 'Analytics'}
                </p>
                <p className="text-[11px] text-[var(--muted)] mt-0.5">
                  {isIT
                    ? 'Google Analytics 4 e Vercel Analytics — statistiche di utilizzo anonime.'
                    : 'Google Analytics 4 and Vercel Analytics — anonymous usage statistics.'}
                </p>
              </div>
              <button
                role="switch"
                aria-checked={prefs.analytics}
                onClick={() => setPrefs(p => ({ ...p, analytics: !p.analytics }))}
                className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 mt-0.5 ${
                  prefs.analytics ? 'bg-blue-500' : 'bg-[var(--border)]'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    prefs.analytics ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Advertising */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-white">
                  {isIT ? 'Pubblicità' : 'Advertising'}
                </p>
                <p className="text-[11px] text-[var(--muted)] mt-0.5">
                  {isIT
                    ? 'Google AdSense — annunci personalizzati (solo con consenso esplicito).'
                    : 'Google AdSense — personalized ads (only with explicit consent).'}
                </p>
              </div>
              <button
                role="switch"
                aria-checked={prefs.ads}
                onClick={() => setPrefs(p => ({ ...p, ads: !p.ads }))}
                className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 mt-0.5 ${
                  prefs.ads ? 'bg-blue-500' : 'bg-[var(--border)]'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    prefs.ads ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={saveCustom}
                className="text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white transition-colors"
              >
                {isIT ? 'Salva preferenze' : 'Save preferences'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
