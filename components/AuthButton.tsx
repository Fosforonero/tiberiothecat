import { createClient } from '@/lib/supabase/server'
import { Settings, Star, LayoutDashboard, LogOut } from 'lucide-react'

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
        className="text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-xl transition-all btn-neon-blue"
      >
        Sign In
      </a>
    )
  }

  return (
    <div className="flex items-center gap-1">
      {isAdmin && (
        <a
          href="/admin"
          className="flex items-center justify-center w-8 h-8 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"
          title="Admin Panel"
        >
          <Settings size={14} />
        </a>
      )}
      {isPremium && (
        <span className="hidden sm:flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-yellow-400 border border-yellow-500/30 bg-yellow-500/10 px-2 py-1 rounded-lg">
          <Star size={11} fill="currentColor" />
          <span>Pro</span>
        </span>
      )}
      {/* Avatar → Profile */}
      <a
        href="/profile"
        className="text-base w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-all border border-transparent hover:border-[var(--border-hi)]"
        title="Profile Settings"
      >
        {avatarEmoji}
      </a>
      <a
        href="/dashboard"
        className="hidden sm:flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[var(--muted)] hover:text-white transition-colors px-2.5 py-1.5 rounded-lg hover:bg-white/5"
        title="Dashboard"
      >
        <LayoutDashboard size={12} />
        <span>Dash</span>
      </a>
      <form action="/api/auth/signout" method="POST">
        <button
          type="submit"
          className="flex items-center justify-center w-8 h-8 rounded-lg text-[var(--muted)] hover:text-white hover:bg-white/5 transition-all"
          title="Sign Out"
          aria-label="Sign out"
        >
          <LogOut size={13} aria-hidden="true" />
        </button>
      </form>
    </div>
  )
}
