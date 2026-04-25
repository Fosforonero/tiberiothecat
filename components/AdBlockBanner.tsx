'use client'

import { useEffect, useState } from 'react'

/**
 * Polite adblock detection banner.
 * Detects by checking if a decoy "adsbygoogle" element gets hidden/zeroed.
 * Shows only once per session — dismissed via sessionStorage.
 */
export default function AdBlockBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Don't re-show if already dismissed this session
    if (sessionStorage.getItem('adblock-dismissed') === '1') return

    const detect = () => {
      try {
        const bait = document.createElement('div')
        bait.setAttribute('class', 'adsbygoogle')
        bait.setAttribute(
          'style',
          'position:fixed;top:-9999px;left:-9999px;width:300px;height:250px;opacity:0;pointer-events:none;'
        )
        document.body.appendChild(bait)

        // Give blockers a moment to act
        setTimeout(() => {
          const rect = bait.getBoundingClientRect()
          const style = window.getComputedStyle(bait)
          const isBlocked =
            rect.height === 0 ||
            style.display === 'none' ||
            style.visibility === 'hidden' ||
            style.opacity === '0' && bait.offsetParent === null

          document.body.removeChild(bait)
          if (isBlocked) setVisible(true)
        }, 300)
      } catch {
        // Silently ignore
      }
    }

    // Delay detection until after page is fully loaded
    const timer = setTimeout(detect, 2000)
    return () => clearTimeout(timer)
  }, [])

  const dismiss = () => {
    sessionStorage.setItem('adblock-dismissed', '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      className="fixed bottom-4 left-0 right-0 z-50 flex justify-center px-4"
      role="alert"
    >
      <div
        className="
          flex items-center gap-3 max-w-xl w-full
          bg-[#0f1729] border border-blue-500/25
          rounded-2xl px-5 py-3.5 shadow-2xl
          text-sm backdrop-blur-md
        "
      >
        <span className="text-xl flex-shrink-0" aria-hidden>💙</span>
        <p className="text-[#94a3b8] flex-1 leading-snug">
          SplitVote is free thanks to ads.{' '}
          <span className="text-white font-semibold">
            Please consider whitelisting this site
          </span>{' '}
          to keep the dilemmas coming.
        </p>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="text-[#475569] hover:text-white transition-colors flex-shrink-0 text-base leading-none"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
