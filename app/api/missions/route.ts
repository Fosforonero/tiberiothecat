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

const COMING_SOON = new Set<MissionId>(['challenge_friend', 'share_result'])

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

    const [completedData, votedIds, dynamicScenarios] = await Promise.all([
      supabase
        .from('mission_completions')
        .select('mission_id')
        .eq('user_id', user.id)
        .eq('completed_at', today)
        .then(r => r.data ?? []),
      getVotedDilemmaIdsToday(supabase, user.id),
      getDynamicScenarios().catch(() => []),
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
