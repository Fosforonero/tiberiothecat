import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BusinessDashboardClient from './BusinessDashboardClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Business Dashboard | SplitVote' }
export const dynamic = 'force-dynamic'

export default async function BusinessPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/business')

  // Check if user owns or belongs to an org
  const { data: org } = await supabase
    .from('organizations')
    .select(`
      id, name, slug, type, plan, logo_url, website, is_active, created_at,
      org_members(id, user_id, role, joined_at)
    `)
    .eq('owner_id', user.id)
    .maybeSingle()

  // Also check if member of any org (not owner)
  const { data: memberOrg } = await supabase
    .from('org_members')
    .select(`
      role,
      organizations(id, name, slug, type, plan, logo_url, website, is_active, created_at)
    `)
    .eq('user_id', user.id)
    .neq('role', 'owner')
    .maybeSingle()

  // Supabase types nested joins as arrays — flatten to single object via unknown cast
  const memberOrgData = memberOrg?.organizations
  const activeOrg = org ?? (Array.isArray(memberOrgData) ? (memberOrgData[0] as unknown as Record<string, unknown>) : (memberOrgData as unknown as Record<string, unknown> | null))
  const userRole = org ? 'owner' : (memberOrg?.role ?? null)

  // Fetch promoted polls for this org
  let polls: Record<string, unknown>[] = []
  if (activeOrg) {
    const orgId = (activeOrg as { id: string }).id
    const { data } = await supabase
      .from('promoted_polls')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
    polls = data ?? []
  }

  return (
    <BusinessDashboardClient
      user={{ id: user.id, email: user.email ?? '' }}
      org={activeOrg as Record<string, unknown> | null}
      userRole={userRole}
      polls={polls}
    />
  )
}
