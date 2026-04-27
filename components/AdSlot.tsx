'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

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
  // null = auth not checked yet, true = premium (hide ads), false = free (show ads)
  const [isPremium, setIsPremium] = useState<boolean | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser()
      .then(async ({ data: { user } }) => {
        if (!user) { setIsPremium(false); return }
        const { data } = await supabase
          .from('profiles')
          .select('is_premium')
          .eq('id', user.id)
          .single()
        setIsPremium(data?.is_premium ?? false)
      })
      .catch(() => setIsPremium(false))
  }, [])

  useEffect(() => {
    if (!slot || slot === 'TODO' || isPremium !== false || pushed.current) return
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({})
      pushed.current = true
    } catch {
      // AdSense not loaded yet — safe to ignore
    }
  }, [slot, isPremium])

  // Don't render anything if slot isn't configured or user is premium (or auth not yet resolved)
  if (!slot || slot === 'TODO' || isPremium === null || isPremium) return null

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
