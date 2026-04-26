/**
 * GET /api/personality
 * Returns the authenticated user's moral personality profile
 * calculated from their dilemma_votes history.
 *
 * Requires auth. Returns 401 if not logged in, 204 if insufficient votes.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateProfile, MORAL_AXES, getAxisLabel } from '@/lib/personality'
import type { UserVoteInput } from '@/lib/personality'

export const runtime = 'nodejs'

export async function GET(_req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch the user's vote history
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
        message: 'Vote on at least 3 dilemmas to unlock your personality profile!',
      })
    }

    if (profile.confidence === 'low') {
      return NextResponse.json({
        ready: false,
        votesNeeded: 3 - profile.votesAnalyzed,
        votesAnalyzed: profile.votesAnalyzed,
        message: `Vote on ${3 - profile.votesAnalyzed} more dilemma${3 - profile.votesAnalyzed === 1 ? '' : 's'} to unlock your personality profile!`,
      })
    }

    // Enrich axes with labels
    const axesWithLabels = MORAL_AXES.map(axis => ({
      ...axis,
      score: profile.axes[axis.id] ?? 0,
      label: getAxisLabel(axis, profile.axes[axis.id] ?? 0),
    }))

    return NextResponse.json({
      ready: true,
      votesAnalyzed: profile.votesAnalyzed,
      confidence: profile.confidence,
      archetype: {
        id:          profile.archetype.id,
        name:        profile.archetype.name,
        sign:        profile.archetype.sign,
        signEmoji:   profile.archetype.signEmoji,
        tagline:     profile.archetype.tagline,
        description: profile.archetype.description,
        traits:      profile.topTraits,
        color:       profile.archetype.color,
        shareText:   profile.archetype.shareText,
      },
      axes: axesWithLabels,
      communityLabel: profile.communityLabel,
    })
  } catch (err) {
    console.error('[personality]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
