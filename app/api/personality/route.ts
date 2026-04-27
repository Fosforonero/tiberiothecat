/**
 * GET /api/personality?locale=en|it
 * Returns the authenticated user's moral personality profile
 * calculated from their dilemma_votes history.
 *
 * Requires auth. Returns 401 if not logged in.
 * Returns ready:false with locale-aware message if < 3 votes.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateProfile, MORAL_AXES, getAxisLabel, getCommunityLabel } from '@/lib/personality'
import type { UserVoteInput } from '@/lib/personality'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const locale = req.nextUrl.searchParams.get('locale') === 'it' ? 'it' as const : 'en' as const

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: votes, error } = await supabase
      .from('dilemma_votes')
      .select('dilemma_id, choice')
      .eq('user_id', user.id)
      .order('voted_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('[personality] fetch votes error:', error)
      return NextResponse.json({ error: 'Failed to load votes' }, { status: 500 })
    }

    type VoteRow = { dilemma_id: string; choice: string }
    const voteInputs: UserVoteInput[] = ((votes ?? []) as VoteRow[]).map((v) => ({
      dilemma_id: v.dilemma_id,
      choice: v.choice,
    }))

    const profile = calculateProfile(voteInputs)

    if (!profile) {
      return NextResponse.json({
        ready: false,
        votesNeeded: 3,
        votesAnalyzed: 0,
        message: locale === 'it'
          ? 'Vota almeno 3 dilemmi per sbloccare il tuo profilo di personalità!'
          : 'Vote on at least 3 dilemmas to unlock your personality profile!',
      })
    }

    if (profile.confidence === 'low') {
      const n = 3 - profile.votesAnalyzed
      return NextResponse.json({
        ready: false,
        votesNeeded: n,
        votesAnalyzed: profile.votesAnalyzed,
        message: locale === 'it'
          ? `Vota ancora ${n} dilemm${n === 1 ? 'a' : 'i'} per sbloccare il tuo profilo!`
          : `Vote on ${n} more dilemma${n === 1 ? '' : 's'} to unlock your personality profile!`,
      })
    }

    const arch = profile.archetype

    const axesWithLabels = MORAL_AXES.map(axis => ({
      id:        axis.id,
      name:      locale === 'it' ? axis.nameIt : axis.name,
      emoji:     axis.emoji,
      leftPole:  locale === 'it' ? axis.leftPoleIt : axis.leftPole,
      rightPole: locale === 'it' ? axis.rightPoleIt : axis.rightPole,
      score:     profile.axes[axis.id] ?? 0,
      label:     getAxisLabel(axis, profile.axes[axis.id] ?? 0, locale),
    }))

    return NextResponse.json({
      ready: true,
      votesAnalyzed: profile.votesAnalyzed,
      confidence: profile.confidence,
      archetype: {
        id:          arch.id,
        name:        locale === 'it' ? arch.nameIt : arch.name,
        sign:        locale === 'it' ? arch.signIt : arch.sign,
        signEmoji:   arch.signEmoji,
        tagline:     locale === 'it' ? arch.taglineIt : arch.tagline,
        description: locale === 'it' ? arch.descriptionIt : arch.description,
        traits:      locale === 'it' ? arch.traitsIt.slice(0, 3) : profile.topTraits,
        color:       arch.color,
        shareText:   locale === 'it' ? arch.shareTextIt : arch.shareText,
      },
      axes: axesWithLabels,
      communityLabel: getCommunityLabel(profile.axes, locale),
    })
  } catch (err) {
    console.error('[personality]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
