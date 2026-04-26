import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { VotesChart, SignupsChart } from './AdminCharts'

export const metadata = { title: 'Admin | SplitVote' }
export const dynamic = 'force-dynamic'

// ─── Admin allowlist ────────────────────────────────────────────
const ADMIN_EMAILS = ['mat.pizzi@gmail.com']

interface AdminProps {
  searchParams: { preview?: string }
}

// ─── Helper: last N days with zero-fill ─────────────────────────
function buildDayBuckets(n: number): Record<string, number> {
  const map: Record<string, number> = {}
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date()
    d.setUTCDate(d.getUTCDate() - i)
    map[d.toISOString().slice(0, 10)] = 0
  }
  return map
}

export default async function AdminPage({ searchParams }: AdminProps) {
  // ── Auth check ──────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !ADMIN_EMAILS.includes(user.email ?? '')) {
    redirect('/')
  }

  const preview = searchParams.preview // 'user' | 'business' | undefined

  // ── Admin data (bypasses RLS) ───────────────────────────────
  const admin = createAdminClient()
  const now = new Date()
  const since14 = new Date(now)
  since14.setUTCDate(since14.getUTCDate() - 13)
  since14.setUTCHours(0, 0, 0, 0)

  const [
    profilesRes,
    dilemmaVotesRes,
    pollsRes,
    topVotersRes,
    recentSignupsRes,
    pendingPollsRes,
    votesByDayRes,
    signupsByDayRes,
    badgesRes,
  ] = await Promise.all([
    // Total users
    admin.from('profiles').select('*', { count: 'exact', head: true }),

    // Total dilemma votes
    admin.from('dilemma_votes').select('*', { count: 'exact', head: true }),

    // Poll stats
    admin.from('user_polls').select('status'),

    // Top 10 voters
    admin
      .from('profiles')
      .select('display_name, email, votes_count, is_premium, created_at')
      .order('votes_count', { ascending: false })
      .limit(10),

    // Recent 10 signups
    admin
      .from('profiles')
      .select('display_name, email, votes_count, created_at')
      .order('created_at', { ascending: false })
      .limit(10),

    // Pending polls (moderation queue)
    admin
      .from('user_polls')
      .select('id, question, created_at, user_id')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(20),

    // Votes per day — last 14 days
    admin
      .from('dilemma_votes')
      .select('voted_at')
      .gte('voted_at', since14.toISOString()),

    // Signups per day — last 14 days
    admin
      .from('profiles')
      .select('created_at')
      .gte('created_at', since14.toISOString()),

    // Badges awarded
    admin.from('user_badges').select('*', { count: 'exact', head: true }),
  ])

  // ── Derived stats ────────────────────────────────────────────
  const totalUsers = profilesRes.count ?? 0
  const totalDilemmaVotes = dilemmaVotesRes.count ?? 0
  const totalBadges = badgesRes.count ?? 0

  const polls = (pollsRes.data ?? []) as { status: string }[]
  const pollStats = polls.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Votes per day chart
  const votesBuckets = buildDayBuckets(14)
  for (const row of votesByDayRes.data ?? []) {
    const day = (row as { voted_at: string }).voted_at.slice(0, 10)
    if (day in votesBuckets) votesBuckets[day]++
  }
  const votesChartData = Object.entries(votesBuckets).map(([date, count]) => ({ date, count }))

  // Signups per day chart
  const signupBuckets = buildDayBuckets(14)
  for (const row of signupsByDayRes.data ?? []) {
    const day = (row as { created_at: string }).created_at.slice(0, 10)
    if (day in signupBuckets) signupBuckets[day]++
  }
  const signupsChartData = Object.entries(signupBuckets).map(([date, count]) => ({ date, count }))

  type TopVoter = { display_name: string | null; email: string | null; votes_count: number; is_premium: boolean; created_at: string }
  type RecentSignup = { display_name: string | null; email: string | null; votes_count: number; created_at: string }
  type PendingPoll = { id: string; question: string; created_at: string; user_id: string }

  const topVoters = (topVotersRes.data ?? []) as TopVoter[]
  const recentSignups = (recentSignupsRes.data ?? []) as RecentSignup[]
  const pendingPolls = (pendingPollsRes.data ?? []) as PendingPoll[]

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">

      {/* ── Super-admin header ── */}
      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-black text-white mb-1">⚙️ Admin Dashboard</h1>
            <p className="text-[var(--muted)] text-sm">SplitVote — internal statistics · {user.email}</p>
          </div>
          {/* Quick preview links */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-[var(--muted)] font-bold uppercase tracking-widest mr-1">Preview as:</span>
            <a href="/dashboard" target="_blank"
              className="text-xs font-bold px-3 py-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors">
              👤 User view ↗
            </a>
            <a href="/profile" target="_blank"
              className="text-xs font-bold px-3 py-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors">
              🎭 Profile ↗
            </a>
            <a href={`/u/${user.id}`} target="_blank"
              className="text-xs font-bold px-3 py-1.5 rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 transition-colors">
              🏆 Public profile ↗
            </a>
          </div>
        </div>

        {/* DB migrations needed banner */}
        <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 px-4 py-3 text-xs text-orange-400">
          <span className="font-bold">⚠️ DB migrations needed for new features:</span>{' '}
          Run in Supabase SQL editor:{' '}
          <code className="bg-orange-500/10 px-1.5 py-0.5 rounded font-mono">
            ALTER TABLE profiles ADD COLUMN IF NOT EXISTS name_changes INT DEFAULT 0, ADD COLUMN IF NOT EXISTS avatar_emoji TEXT DEFAULT &apos;🌍&apos;;
          </code>
        </div>
      </div>

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Total Users',          value: totalUsers.toLocaleString(),          icon: '👥', color: 'text-blue-400' },
          { label: 'Dilemma Votes',        value: totalDilemmaVotes.toLocaleString(),   icon: '🗳️', color: 'text-purple-400' },
          { label: 'Badges Awarded',       value: totalBadges.toLocaleString(),         icon: '🏆', color: 'text-yellow-400' },
          { label: 'Polls Submitted',      value: polls.length.toLocaleString(),        icon: '📋', color: 'text-green-400' },
        ].map(stat => (
          <div key={stat.label} className="rounded-2xl border border-[var(--border)] bg-[#0d0d1a]/60 p-5 text-center">
            <p className="text-3xl mb-1">{stat.icon}</p>
            <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
            <p className="text-[var(--muted)] text-xs mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── Poll breakdown ── */}
      <div className="rounded-2xl border border-[var(--border)] bg-[#0d0d1a]/60 p-6 mb-8">
        <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--muted)] mb-4">📋 Poll status breakdown</h3>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Pending',  key: 'pending',  color: 'text-yellow-400' },
            { label: 'Approved', key: 'approved', color: 'text-green-400'  },
            { label: 'Rejected', key: 'rejected', color: 'text-red-400'    },
            { label: 'Flagged',  key: 'flagged',  color: 'text-orange-400' },
          ].map(s => (
            <div key={s.key} className="text-center">
              <p className={`text-2xl font-black ${s.color}`}>{(pollStats[s.key] ?? 0)}</p>
              <p className="text-[var(--muted)] text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <VotesChart data={votesChartData} />
        <SignupsChart data={signupsChartData} />
      </div>

      {/* ── Top voters ── */}
      <div className="rounded-2xl border border-[var(--border)] bg-[#0d0d1a]/60 p-6 mb-8">
        <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--muted)] mb-4">🔥 Top voters</h3>
        <div className="space-y-2">
          {topVoters.map((u, i) => (
            <div key={u.email ?? i} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
              <span className="text-[var(--muted)] text-xs w-6 text-center font-mono">#{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-semibold truncate">{u.display_name ?? '—'}</p>
                <p className="text-xs text-[var(--muted)] truncate">{u.email}</p>
              </div>
              {u.is_premium && <span className="text-xs text-yellow-400 font-bold">⭐ PRO</span>}
              <span className="text-sm font-black text-blue-400 w-14 text-right">{u.votes_count.toLocaleString()} v</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Recent signups ── */}
      <div className="rounded-2xl border border-[var(--border)] bg-[#0d0d1a]/60 p-6 mb-8">
        <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--muted)] mb-4">🆕 Recent signups</h3>
        <div className="space-y-2">
          {recentSignups.map((u, i) => (
            <div key={u.email ?? i} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-semibold truncate">{u.display_name ?? '—'}</p>
                <p className="text-xs text-[var(--muted)] truncate">{u.email}</p>
              </div>
              <span className="text-xs text-[var(--muted)]">
                {new Date(u.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
              </span>
              <span className="text-xs text-blue-400 w-12 text-right">{u.votes_count} v</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Pending polls moderation ── */}
      {pendingPolls.length > 0 && (
        <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-yellow-400 mb-4">
            ⏳ Pending polls ({pendingPolls.length})
          </h3>
          <div className="space-y-3">
            {pendingPolls.map(poll => (
              <div key={poll.id} className="rounded-xl border border-[var(--border)] bg-[#0d0d1a]/60 p-4 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium leading-snug">{poll.question}</p>
                  <p className="text-xs text-[var(--muted)] mt-1">
                    {new Date(poll.created_at).toLocaleString('en-GB')} · user {poll.user_id.slice(0, 8)}…
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <a
                    href={`/api/admin/polls/${poll.id}/approve`}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 transition-colors"
                  >
                    ✅ Approve
                  </a>
                  <a
                    href={`/api/admin/polls/${poll.id}/reject`}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-colors"
                  >
                    ❌ Reject
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
