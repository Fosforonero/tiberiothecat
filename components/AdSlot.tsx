'use client'

import { useEffect, useRef } from 'react'

interface AdSlotProps {
  /**
   * The AdSense ad-unit slot ID.
   * Create one at: AdSense → Ads → Ad units → "Display ad" → copy data-ad-slot value.
   * Then set NEXT_PUBLIC_ADSENSE_SLOT_HOME / _RESULTS etc. in Vercel env vars.
   * Pass 'TODO' (or omit) to show nothing while the slot isn't configured yet.
   */
  slot: string
  className?: string
  format?: 'auto' | 'fluid' | 'rectangle'
}

const PUBLISHER_ID = 'ca-pub-5232020244793649'

export default function AdSlot({ slot, className = '', format = 'auto' }: AdSlotProps) {
  const pushed = useRef(false)

  useEffect(() => {
    if (!slot || slot === 'TODO' || pushed.current) return
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({})
      pushed.current = true
    } catch {
      // AdSense not loaded yet — safe to ignore
    }
  }, [slot])

  // Don't render anything if slot isn't configured
  if (!slot || slot === 'TODO') return null

  return (
    <div className={`overflow-hidden ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={PUBLISHER_ID}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  )
}
