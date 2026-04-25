'use client'

interface AdSlotProps {
  slot?: string
  className?: string
}

// Placeholder — swap inner content for real AdSense code after approval
export default function AdSlot({ className = '' }: AdSlotProps) {
  return (
    <div className={`rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] flex items-center justify-center min-h-[90px] ${className}`}>
      <span className="text-[var(--muted)] text-xs opacity-30">Advertisement</span>
    </div>
  )
}
