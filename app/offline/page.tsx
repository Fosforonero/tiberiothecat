'use client'

export default function OfflinePage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 text-6xl" aria-hidden>📡</div>
      <h1 className="text-2xl font-bold text-[var(--text)] mb-3">You&apos;re offline</h1>
      <p className="text-[var(--muted)] max-w-xs mb-8 leading-relaxed">
        Check your connection and try again. Your votes and profile are safe.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-3 rounded-xl bg-[var(--accent)] text-white font-semibold text-sm hover:opacity-90 transition-opacity"
      >
        Retry
      </button>
    </div>
  )
}
