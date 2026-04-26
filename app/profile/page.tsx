import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfileClient from './ProfileClient'

export const metadata = { title: 'Profile Settings | SplitVote' }
export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?redirect=/profile')

  const [profileRes, badgesRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('display_name, birth_year, gender, country_code, avatar_emoji, name_changes, is_premium, votes_count, created_at')
      .eq('id', user.id)
      .single(),
    supabase
      .from('user_badges')
      .select('badge_id, badges(name, emoji, rarity)')
      .eq('user_id', user.id)
      .order('earned_at', { ascending: false }),
  ])

  const profile = profileRes.data
  const badges = ((badgesRes.data ?? []) as { badges: { name: string; emoji: string; rarity: string } }[])
    .map(b => b.badges)

  return (
    <ProfileClient
      userId={user.id}
      initialName={profile?.display_name ?? null}
      initialBirthYear={profile?.birth_year ?? null}
      initialGender={profile?.gender ?? null}
      initialCountry={profile?.country_code ?? null}
      initialAvatar={profile?.avatar_emoji ?? null}
      nameChanges={profile?.name_changes ?? 0}
      isPremium={profile?.is_premium ?? false}
      badges={badges}
      votesCount={profile?.votes_count ?? 0}
      joinedAt={profile?.created_at ?? new Date().toISOString()}
    />
  )
}
