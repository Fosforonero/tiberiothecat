import { createClient } from '@/lib/supabase/server'

export default async function AuthButton() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get premium status
  let isPremium = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_premium')
      .eq('id', user.id)
      .single()
    isPremium = profile?.is_premium ?? false
  }

  if (!user) {
    return (
      <a
        href="/login"
        className="text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-white transition-colors"
      >
        Sign In
      </a>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {isPremium && (
        <span className="hidden sm:inline text-xs font-bold uppercase tracking-widest text-yellow-400 border border-yellow-500/30 bg-yellow-500/10 px-2 py-1 rounded-lg">
          ⭐ Pro
        </span>
      )}
      <a
        href="/dashboard"
        className="text-xs font-bold uppercase tracking-widest text-[var(--muted)] hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
      >
        Dashboard
      </a>
      <form action="/api/auth/signout" method="POST">
        <button
          type="submit"
          className="text-xs font-bold uppercase tracking-widest text-[var(--muted)] hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
        >
          Sign Out
        </button>
      </form>
    </div>
  )
}
