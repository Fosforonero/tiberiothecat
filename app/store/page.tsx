import { createClient } from '@/lib/supabase/server'
import { getUserEntitlements } from '@/lib/entitlements'
import type { UserRole } from '@/lib/admin-auth'
import StoreClient from '@/components/store/StoreClient'
import { ALL_PRODUCT_IDS, type ProductId, type PurchaseRow } from '@/lib/purchases'
import type { CompanionSpecies } from '@/lib/companion'

export const metadata = { title: 'Cosmetics Store | SplitVote' }
export const dynamic = 'force-dynamic'

interface SearchParams { tab?: string }

export default async function StorePage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let isPremium = false
  let ownedProductIds: ProductId[] = []
  let currentSpecies: CompanionSpecies = 'spark'

  if (user) {
    const [profileRes, purchasesRes] = await Promise.all([
      supabase.from('profiles').select('is_premium, role, companion_species').eq('id', user.id).single(),
      supabase.from('user_purchases').select('product_id, product_type, status, purchased_at')
        .eq('user_id', user.id).eq('status', 'completed'),
    ])

    const ents = getUserEntitlements({
      email: user.email,
      is_premium: profileRes.data?.is_premium ?? false,
      role: (profileRes.data?.role ?? 'user') as UserRole,
    })

    isPremium = ents.effectivePremium
    currentSpecies = (profileRes.data?.companion_species ?? 'spark') as CompanionSpecies
    ownedProductIds = ents.isAdmin
      ? ALL_PRODUCT_IDS
      : (!purchasesRes.error && purchasesRes.data
          ? (purchasesRes.data as unknown as PurchaseRow[]).map(r => r.product_id)
          : [])
  }

  const validTabs = new Set(['premium', 'pixies', 'cosmetics'])
  const initialTab = validTabs.has(searchParams.tab ?? '')
    ? (searchParams.tab as 'premium' | 'pixies' | 'cosmetics')
    : 'pixies'

  return (
    <StoreClient
      isLoggedIn={!!user}
      isPremium={isPremium}
      ownedProductIds={ownedProductIds}
      currentSpecies={currentSpecies}
      locale="en"
      initialTab={initialTab}
    />
  )
}
