import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Dashboard' }

type PollStatus = 'pending' | 'approved' | 'rejected' | 'flagged'

interface UserPoll {
  id: string
  question: string
  status: PollStatus
  votes_a: number
  votes_b: number
  created_at: string
}

interface Profile {
  display_name: string | null
  email: string | null
  is_premium: boolean
}

const STATUS_BADGE: Record<PollStatus, { label: string; classes: string }> = {
  pending:  { label: '⏳ Pending review',  classes: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' },
  approved: { label: '✅ Live',             classes: 'text-green-400  bg-green-500/10  border-green-500/30'  },
  rejected: { label: '❌ Rejected',         classes: 'text-red-400    bg-red-500/10    border-red-500/30'    },
  flagged:  { label: '🚩 Flagged',          classes: 'text-orange-400 bg-orange-500/10 border-orange-500/30' },
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?redirect=/dashboard')

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, email, is_premium')
    .eq('id', user.id)
    .single<Profile>()

  // Fetch user's submitted polls
  const { data: polls } = await supabase
    .from('user_polls')
    .select('id, question, status, votes_a, votes_b, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  const typedPolls = (polls ?? []) as UserPoll[]

  const totalVotes = typedPolls.reduce((acc, p) => acc + p.votes_a + p.votes_b, 0)
  const approvedCount = typedPolls.filter(p => p.status === 'approved').length

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-black text-white mb-1">
          Hey, {profile?.display_name?.split(' ')[0] ?? 'there'} 👋
        </h1>
        <p className="text-[var(--muted)] text-sm">{profile?.email ?? user.email}</p>
      </div>

      {/* Premium status */}
      {profile?.is_premium ? (
        <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/5 p-5 mb-8 flex items-center gap-4">
          <div className="text-2xl">⭐</div>
          <div>
            <p className="font-bold text-yellow-400 text-sm">Premium Active</p>
            <p className="text-[var(--muted)] text-xs mt-0.5">You have access to all premium features. No ads, unlimited polls.</p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-5 mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="font-bold text-blue-400 text-sm">Free Plan</p>
            <p className="text-[var(--muted)] text-xs mt-0.5">Upgrade to submit polls, remove ads, and unlock micro-learning.</p>
          </div>
          <a
            href="/#pricing"
            className="flex-shrink-0 text-xs font-bold uppercase tracking-widest px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white transition-colors"
          >
            Upgrade →
          </a>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {[
          { label: 'Polls submitted', value: typedPolls.length },
          { label: 'Polls live',      value: approvedCount },
          { label: 'Total votes',     value: totalVotes.toLocaleString() },
        ].map(stat => (
          <div
            key={stat.label}
            className="rounded-2xl border border-[var(--border)] bg-[#0d0d1a]/60 p-5 text-center"
          >
            <p className="text-2xl font-black text-white">{stat.value}</p>
            <p className="text-[var(--muted)] text-xs mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Polls section */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-black text-white">Your Polls</h2>
        {profile?.is_premium && (
          <a
            href="/submit-poll"
            className="text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-white transition-colors"
          >
            + Submit new
          </a>
        )}
      </div>

      {typedPolls.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[#0d0d1a]/60 p-10 text-center">
          <p className="text-4xl mb-3">🗳️</p>
          <p className="text-[var(--muted)] text-sm">No polls submitted yet.</p>
          {profile?.is_premium ? (
            <a href="/submit-poll" className="inline-block mt-4 text-blue-400 hover:text-blue-300 text-sm font-semibold transition-colors">
              Submit your first poll →
            </a>
          ) : (
            <a href="/#pricing" className="inline-block mt-4 text-blue-400 hover:text-blue-300 text-sm font-semibold transition-colors">
              Upgrade to submit polls →
            </a>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {typedPolls.map(poll => {
            const badge = STATUS_BADGE[poll.status]
            const total = poll.votes_a + poll.votes_b
            const pctA = total ? Math.round((poll.votes_a / total) * 100) : 50
            return (
              <div
                key={poll.id}
                className="rounded-2xl border border-[var(--border)] bg-[#0d0d1a]/60 p-5"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <p className="text-sm text-white font-semibold leading-snug flex-1">{poll.question}</p>
                  <span className={`flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-lg border ${badge.classes}`}>
                    {badge.label}
                  </span>
                </div>
                {total > 0 && (
                  <div>
                    <div className="flex justify-between text-xs text-[var(--muted)] mb-1">
                      <span>A: {pctA}%</span>
                      <span>{total.toLocaleString()} votes</span>
                      <span>B: {100 - pctA}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                        style={{ width: `${pctA}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
