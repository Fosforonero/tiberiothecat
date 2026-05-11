import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import StoreClient from './StoreClient'

export const metadata = { title: 'Cosmetics Store | SplitVote' }
export const dynamic = 'force-dynamic'

export default async function StorePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?redirect=/store')

  // Get user's existing purchases
  let admin: ReturnType<typeof createAdminClient>
  try {
    admin = createAdminClient()
  } catch {
    // Fallback: show store without purchase data
    return <StoreClient ownedIds={[]} />
  }

  const { data: purchases } = await admin
    .from('user_purchases')
    .select('product_id')
    .eq('user_id', user.id)
    .eq('status', 'purchased')

  const ownedIds = (purchases ?? []).map(p => p.product_id)

  return <StoreClient ownedIds={ownedIds} />
}
