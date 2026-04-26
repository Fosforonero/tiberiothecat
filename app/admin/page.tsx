import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  Users, Vote, Trophy, ClipboardList, Flame, UserPlus,
  Clock, CheckCircle, XCircle, Flag, Star, Settings,
  LayoutDashboard, UserCircle, TrendingUp,
} from 'lucide-react'
import { VotesChart, SignupsChart } from './AdminCharts'

export const metadata = { title: 'Admin | SplitVote' }
export const dynamic = 'force-dynamic'

const ADMIN_EMAILS = ['mat.pizzi@gmail.com']

interface AdminProps {
  searchParams: { preview?: string }
}

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
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !ADMIN_EMAILS.includes(user.email ?? '')) {
    redirect('/')
  }

  const preview = searchParams.preview

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
    admin.from('profiles').select('*', { count: 'exact', head: true }),
    admin.from('dilemma_votes').select('*', { count: 'exact', head: true }),
    admin.from('user_polls').select('status'),
    admin.from('profiles').select('display_name, votes_count, is_premium, created_at').order('votes_count', { ascending: false }).limit(10),
    admin.from('profiles').select('display_name, votes_count, created_at').order('created_at', { ascending: false }).limit(10),
    admin.from('user_polls').select('id, question, created_at, user_id').eq('status', 'pending').order('created_at', { ascending: false }).limit(20),
    admin.from('dilemma_votes').select('voted_at').gte('voted_at', since14.toISOString()),
    admin.from('profiles').select('created_at').gte('created_at', since14.toISOString()),
    admin.from('user_badges').select('*', { count: 'exact', head: true }),
  ])

  const totalUsers        = profilesRes.count ?? 0
  const totalDilemmaVotes = dilemmaVotesRes.count ?? 0
  const totalBadges       = badgesRes.count ?? 0

  const polls = (pollsRes.data ?? []) as { status: string }[]
  const pollStats = polls.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  const votesBuckets = buildDayBuckets(14)
  for (const row of votesByDayRes.data ?? []) {
    const day = (row as { voted_at: string }).voted_at.slice(0, 10)
    if (day in votesBuckets) votesBuckets[day]++
  }
  const votesChartData = Object.entries(votesBuckets).map(([date, count]) => ({ date, count }))

  const signupBuckets = buildDayBuckets(14)
  for (const row of signupsByDayRes.data ?? []) {
    const day = (row as { created_at: string }).created_at.slice(0, 10)
    if (day in signupBuckets) signupBuckets[day]++
  }
  const signupsChartData = Object.entries(signupBuckets).map(([date, count]) => ({ date, count }))

  type TopVoter    = { display_name: string | null; votes_count: number; is_premium: boolean; created_at: string }
  type RecentSignup = { display_name: string | null; votes_count: number; created_at: string }
  type PendingPoll  = { id: string; question: string; created_at: string; user_id: string }

  const topVoters    = (topVotersRes.data  ?? []) as TopVoter[]
  const recentSignups = (recentSignupsRes.data ?? []) as RecentSignup[]
  const pendingPolls  = (pendingPollsRes.data ?? []) as PendingPoll[]

  const KPI_CARDS = [
    { label: 'Total Users',     value: totalUsers.toLocaleString(),        Icon: Users,         glow: 'neon-glow-blue',   iconColor: 'text-blue-400',   bg: 'from-blue-500/10 to-blue-500/5',     border: 'border-blue-500/25'   },
    { label: 'Dilemma Votes',   value: totalDilemmaVotes.toLocaleString(), Icon: Vote,          glow: 'neon-glow-purple', iconColor: 'text-purple-400', bg: 'from-purple-500/10 to-purple-500/5', border: 'border-purple-500/25' },
    { label: 'Badges Awarded',  value: totalBadges.toLocaleString(),       Icon: Trophy,        glow: 'neon-glow-yellow', iconColor: 'text-yellow-400', bg: 'from-yellow-500/10 to-yellow-500/5', border: 'border-yellow-500/25' },
    { label: 'Polls Submitted', value: polls.length.toLocaleString(),      Icon: ClipboardList, glow: 'neon-glow-cyan',   iconColor: 'text-cyan-400',   bg: 'from-cyan-500/10 to-cyan-500/5',     border: 'border-cyan-500/25'   },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 sm:py-12">

      {/* ── Header ── */}
      <div className="mb-8">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center neon-glow-red">
              <Settings size={18} className="text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white leading-none">Admin Dashboard</h1>
              <p className="text-[var(--muted)] text-xs mt-0.5">SplitVote · {user.email}</p>
            </div>
          </div>

          {/* Preview links */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-[var(--muted)] font-bold uppercase tracking-widest">Preview:</span>
            <a href="/dashboard" target="_blank"
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all">
              <LayoutDashboard size={11} /> User ↗
            </a>
            <a href="/profile" target="_blank"
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-all">
              <UserCircle size={11} /> Profile ↗
            </a>
            <a href={`/u/${user.id}`} target="_blank"
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 transition-all">
              <Trophy size={11} /> Public ↗
            </a>
          </div>
        </div>

        {/* Neon divider */}
        <div className="neon-divider" />
      </div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-10">
        {KPI_CARDS.map(({ label, value, Icon, glow, iconColor, bg, border }) => (
          <div key={label}
            className={`rounded-2xl border ${border} bg-gradient-to-br ${bg} p-5 text-center ${glow} transition-all hover:scale-[1.02]`}>
            <div className="flex justify-center mb-3">
              <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center`}>
                <Icon size={20} className={iconColor} />
              </div>
            </div>
            <p className={`text-2xl sm:text-3xl font-black ${iconColor} mb-1`}>{value}</p>
            <p className="text-[var(--muted)] text-xs">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Poll breakdown ── */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6 mb-8">
        <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[var(--muted)] mb-4">
          <ClipboardList size={13} /> Poll status
        </h3>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Pending',  key: 'pending',  color: 'text-yellow-400', Icon: Clock        },
            { label: 'Approved', key: 'approved', color: 'text-green-400',  Icon: CheckCircle  },
            { label: 'Rejected', key: 'rejected', color: 'text-red-400',    Icon: XCircle      },
            { label: 'Flagged',  key: 'flagged',  color: 'text-orange-400', Icon: Flag         },
          ].map(({ label, key, color, Icon }) => (
            <div key={key} className="text-center">
              <Icon size={16} className={`${color} mx-auto mb-1.5 opacity-70`} />
              <p className={`text-2xl font-black ${color}`}>{(pollStats[key] ?? 0)}</p>
              <p className="text-[var(--muted)] text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <VotesChart data={votesChartData} />
        <SignupsChart data={signupsChartData} />
      </div>

      {/* ── Top voters ── */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6 mb-8">
        <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[var(--muted)] mb-4">
          <Flame size={13} className="text-orange-400" /> Top voters
        </h3>
        <div className="space-y-1">
          {topVoters.map((u, i) => (
            <div key={i} className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0">
              <span className={`text-xs font-black w-6 text-center tabular-nums ${i < 3 ? 'text-yellow-400' : 'text-[var(--muted)]'}`}>
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-semibold truncate">{u.display_name ?? 'Anonymous'}</p>
              </div>
              {u.is_premium && (
                <span className="flex items-center gap-1 text-xs text-yellow-400 font-bold border border-yellow-500/30 bg-yellow-500/10 px-2 py-0.5 rounded-full">
                  <Star size={9} fill="currentColor" /> PRO
                </span>
              )}
              <span className="text-sm font-black text-blue-400 tabular-nums">{u.votes_count.toLocaleString()} v</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Recent signups ── */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6 mb-8">
        <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[var(--muted)] mb-4">
          <UserPlus size={13} className="text-green-400" /> Recent signups
        </h3>
        <div className="space-y-1">
          {recentSignups.map((u, i) => (
            <div key={i} className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-semibold truncate">{u.display_name ?? 'Anonymous'}</p>
              </div>
              <span className="text-xs text-[var(--muted)] tabular-nums">
                {new Date(u.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
              </span>
              <span className="text-xs text-blue-400 font-bold tabular-nums w-10 text-right">{u.votes_count}v</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Pending polls ── */}
      {pendingPolls.length > 0 && (
        <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-5 sm:p-6 neon-glow-yellow">
          <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-yellow-400 mb-4">
            <Clock size={13} /> Pending polls ({pendingPolls.length})
          </h3>
          <div className="space-y-3">
            {pendingPolls.map(poll => (
              <div key={poll.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium leading-snug">{poll.question}</p>
                  <p className="text-xs text-[var(--muted)] mt-1">
                    {new Date(poll.created_at).toLocaleString('en-GB')} · user {poll.user_id.slice(0, 8)}…
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <a href={`/api/admin/polls/${poll.id}/approve`}
                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 transition-colors">
                    <CheckCircle size={12} /> OK
                  </a>
                  <a href={`/api/admin/polls/${poll.id}/reject`}
                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-colors">
                    <XCircle size={12} /> No
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
