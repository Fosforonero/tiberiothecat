'use client'

/**
 * AdBlockBanner — Ethical adblock support message.
 *
 * Design principles:
 * - NEVER blocks navigation or voting.
 * - NEVER shows hard errors or guilt-trip copy.
 * - NEVER forces adblock disabling.
 * - Shows a soft, dismissible support request only.
 * - Users with adblock can use SplitVote fully and normally.
 * - Banner is purely a polite support ask, nothing more.
 *
 * Detection: injects a decoy adsbygoogle div and checks if it gets zeroed.
 * Timing: waits 3s after page load (non-intrusive).
 * Persistence: dismissed state stored in localStorage (survives sessions).
 *   Reshows after 30 days to give users a gentle reminder.
 *
 * Tracking (non-invasive, gtag only if already loaded):
 *   adblock_detected | adblock_banner_dismissed | adblock_whitelist_clicked
 */

import { useEffect, useState, useCallback } from 'react'

const STORAGE_KEY = 'sv_adblock_dismissed_at'
const RESHOW_AFTER_DAYS = 30

function trackEvent(name: string) {
  try {
    // Only fire if GA4 is already present — no new libraries
    if (typeof window !== 'undefined' && typeof (window as Window & { gtag?: (...args: unknown[]) => void }).gtag === 'function') {
      ;(window as Window & { gtag: (...args: unknown[]) => void }).gtag('event', name, {
        event_category: 'adblock',
        non_interaction: true,
      })
    }
    // TODO: add additional tracking here if a lightweight event system is introduced later
  } catch {
    // Never throw — tracking is best-effort only
  }
}

function shouldShowBanner(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return true
    const dismissedAt = parseInt(stored, 10)
    if (isNaN(dismissedAt)) return true
    const daysSince = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24)
    return daysSince >= RESHOW_AFTER_DAYS
  } catch {
    return true // localStorage blocked — show banner but don't persist
  }
}

function detectAdBlock(): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const bait = document.createElement('div')
      // Use class + attributes that ad blockers commonly target
      bait.className = 'adsbygoogle adsbox ad-banner'
      bait.setAttribute('data-ad-slot', 'test')
      Object.assign(bait.style, {
        position: 'fixed',
        top: '-9999px',
        left: '-9999px',
        width: '300px',
        height: '250px',
        opacity: '0',
        pointerEvents: 'none',
        zIndex: '-1',
      })
      document.body.appendChild(bait)

      // Allow time for extension to act
      setTimeout(() => {
        try {
          const rect = bait.getBoundingClientRect()
          const style = window.getComputedStyle(bait)
          const blocked =
            rect.height === 0 ||
            rect.width === 0 ||
            style.display === 'none' ||
            style.visibility === 'hidden' ||
            (style.opacity === '0' && bait.offsetParent === null)
          document.body.removeChild(bait)
          resolve(blocked)
        } catch {
          resolve(false)
        }
      }, 400)
    } catch {
      resolve(false)
    }
  })
}

export default function AdBlockBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!shouldShowBanner()) return

    // Wait 3s — page should be fully interactive, user has started reading
    const timer = setTimeout(async () => {
      const detected = await detectAdBlock()
      if (detected) {
        setVisible(true)
        trackEvent('adblock_detected')
      }
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now()))
    } catch { /* localStorage blocked — just hide for this session */ }
    setVisible(false)
    trackEvent('adblock_banner_dismissed')
  }, [])

  const handleWhitelist = useCallback(() => {
    trackEvent('adblock_whitelist_clicked')
    dismiss()
    // No redirect — just acknowledge. User knows how to whitelist.
  }, [dismiss])

  if (!visible) return null

  return (
    <div
      role="complementary"
      aria-label="Support SplitVote"
      className="fixed bottom-4 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none"
    >
      <div
        className="
          pointer-events-auto
          flex items-start sm:items-center gap-3 max-w-lg w-full
          bg-[#0a0a1f]/95 border border-white/10
          rounded-2xl px-5 py-4 shadow-2xl
          backdrop-blur-md
          animate-in slide-in-from-bottom-2 duration-300
        "
        style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(77,159,255,0.08)' }}
      >
        {/* Icon */}
        <span className="text-xl flex-shrink-0 mt-0.5 sm:mt-0" aria-hidden>💙</span>

        {/* Copy */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white mb-0.5">
            Ads keep SplitVote free
          </p>
          <p className="text-xs text-white/50 leading-relaxed">
            We keep them light — no popups, no autoplay. If you enjoy SplitVote,
            consider whitelisting us or supporting the project.
          </p>

          {/* CTAs */}
          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={handleWhitelist}
              className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
            >
              I'll whitelist ↗
            </button>
            <button
              onClick={dismiss}
              className="text-xs text-white/30 hover:text-white/60 transition-colors"
            >
              Continue
            </button>
            {/* Future: Go ad-free — disabled until Stripe premium is live
            <button
              disabled
              className="text-xs text-white/20 cursor-not-allowed"
              title="Coming soon"
            >
              Go ad-free
            </button>
            */}
          </div>
        </div>

        {/* Close */}
        <button
          onClick={dismiss}
          aria-label="Dismiss adblock banner"
          className="flex-shrink-0 text-white/20 hover:text-white/60 transition-colors text-lg leading-none self-start sm:self-center ml-1"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
