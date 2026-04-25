export default function NotFound() {
  return (
    <div className="max-w-lg mx-auto px-4 py-32 text-center">
      <p className="text-6xl mb-6">🤔</p>
      <h1 className="text-3xl font-black text-[var(--text)] mb-4">Dilemma not found</h1>
      <p className="text-[var(--muted)] mb-8">That question doesn&apos;t exist — yet.</p>
      <a
        href="/"
        className="inline-block bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 font-bold px-6 py-3 rounded-xl transition-colors"
      >
        ← Back to all dilemmas
      </a>
    </div>
  )
}
