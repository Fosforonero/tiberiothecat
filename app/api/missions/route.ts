import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { MISSIONS, type MissionId, type MissionState } from '@/lib/missions'
import { scenarios } from '@/lib/scenarios'
import { getDynamicScenarios } from '@/lib/dynamic-scenarios'

export const dynamic = 'force-dynamic'

const MISSION_REQUIRED: Record<MissionId, number> = {
  vote_3:            3,
  vote_2_categories: 2,
  daily_dilemma:     1,
  challenge_friend:  1,
  share_result:      1,
}

const COMING_SOON = new Set<MissionId>([])

const SHARE_EVENT_TYPES = ['share_result', 'copy_result_link', 'story_card_share', 'story_card_download']

async function getVotedDilemmaIdsToday(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<string[]> {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const { data } = await supabase
    .from('dilemma_votes')
    .select('dilemma_id')
    .eq('user_id', userId)
    .gte('voted_at', todayStart.toISOString())
  return (data ?? []).map((r: { dilemma_id: string }) => r.dilemma_id)
}

async function countReferralVisitsToday(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<number> {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  try {
    const { count } = await supabase
      .from('user_events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('event_type', 'referral_visit')
      .gte('created_at', todayStart.toISOString())
    return count ?? 0
  } catch {
    return 0
  }
}

async function countShareEventsToday(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<number> {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  try {
    const { count } = await supabase
      .from('user_events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .in('event_type', SHARE_EVENT_TYPES)
      .gte('created_at', todayStart.toISOString())
    return count ?? 0
  } catch {
    // Table may not exist if migration_v8 not yet applied — treat as 0
    return 0
  }
}

/** GET /api/missions — returns per-mission progress state for the logged-in user */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      const missions: MissionState[] = MISSIONS.map(m => ({
        ...m,
        progress: 0,
        required: MISSION_REQUIRED[m.id],
        completed: false,
        claimable: false,
        comingSoon: COMING_SOON.has(m.id),
      }))
      return NextResponse.json({ missions })
    }

    const today = new Date().toISOString().split('T')[0]

    const [completedData, votedIds, dynamicScenarios, shareEventsCount, referralVisitsCount] = await Promise.all([
      supabase
        .from('mission_completions')
        .select('mission_id')
        .eq('user_id', user.id)
        .eq('completed_at', today)
        .then(r => r.data ?? []),
      getVotedDilemmaIdsToday(supabase, user.id),
      getDynamicScenarios().catch(() => []),
      countShareEventsToday(supabase, user.id),
      countReferralVisitsToday(supabase, user.id),
    ])

    const completedSet = new Set(
      (completedData as { mission_id: string }[]).map(r => r.mission_id),
    )
    const votesTotal = votedIds.length

    // Build id→category map from static + approved dynamic scenarios
    const catMap = new Map<string, string>()
    for (const s of scenarios) catMap.set(s.id, s.category)
    for (const s of dynamicScenarios) catMap.set(s.id, s.category)

    const categoriesVoted = new Set(
      votedIds
        .map(id => catMap.get(id))
        .filter((c): c is string => Boolean(c)),
    )

    const missions: MissionState[] = MISSIONS.map(m => {
      const completed  = completedSet.has(m.id)
      const comingSoon = COMING_SOON.has(m.id)
      const required   = MISSION_REQUIRED[m.id]

      let progress = completed ? required : 0
      if (!completed) {
        switch (m.id) {
          case 'vote_3':            progress = Math.min(votesTotal, 3); break
          case 'daily_dilemma':     progress = Math.min(votesTotal, 1); break
          case 'vote_2_categories': progress = Math.min(categoriesVoted.size, 2); break
          case 'share_result':      progress = Math.min(shareEventsCount, 1); break
          case 'challenge_friend':  progress = Math.min(referralVisitsCount, 1); break
          default:                  progress = 0
        }
      }

      const claimable = !completed && !comingSoon && progress >= required

      return { ...m, progress, required, completed, claimable, comingSoon }
    })

    return NextResponse.json({ missions })
  } catch {
    return NextResponse.json({ missions: [] })
  }
}
