import { createClient } from '@/lib/supabase/server'

const ADMIN_EMAILS = ['mat.pizzi@gmail.com']

export default async function AuthButton() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let isPremium = false
  let avatarEmoji = '🌍'
  let isAdmin = false

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_premium, avatar_emoji')
      .eq('id', user.id)
      .single()
    isPremium = profile?.is_premium ?? false
    avatarEmoji = profile?.avatar_emoji ?? '🌍'
    isAdmin = ADMIN_EMAILS.includes(user.email ?? '')
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
    <div className="flex items-center gap-1.5">
      {isAdmin && (
        <a
          href="/admin"
          className="text-xs font-bold uppercase tracking-widest text-red-400 hover:text-red-300 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-red-500/10 border border-transparent hover:border-red-500/20"
          title="Admin Panel"
        >
          ⚙️
        </a>
      )}
      {isPremium && (
        <span className="hidden sm:inline text-xs font-bold uppercase tracking-widest text-yellow-400 border border-yellow-500/30 bg-yellow-500/10 px-2 py-1 rounded-lg">
          ⭐ Pro
        </span>
      )}
      {/* Avatar → Profile */}
      <a
        href="/profile"
        className="text-lg w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors border border-transparent hover:border-white/10"
        title="Profile Settings"
      >
        {avatarEmoji}
      </a>
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
