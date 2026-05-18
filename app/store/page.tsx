import { createClient } from '@/lib/supabase/server'
import { getUserEntitlements } from '@/lib/entitlements'
import type { UserRole } from '@/lib/admin-auth'
import StoreClient from '@/components/store/StoreClient'
import { ALL_PRODUCT_IDS, PRODUCT_BY_ID, type ProductId, type PurchaseRow } from '@/lib/purchases'

export const metadata = { title: 'Cosmetics Store | SplitVote' }
export const dynamic = 'force-dynamic'

interface SearchParams { tab?: string }

export default async function StorePage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let isPremium = false
  let ownedProductIds: ProductId[] = []
  // Active Pixie product id (e.g. "pixie_devil"), not the species name —
  // the store needs to match `equipped` state against the same id that
  // /api/profile/equip-pixie writes to `pixie_xp.active`.
  let activePixieProductId: ProductId | null = null

  if (user) {
    const [profileRes, purchasesRes] = await Promise.all([
      supabase.from('profiles').select('is_premium, role, pixie_xp').eq('id', user.id).single(),
      supabase.from('user_purchases').select('product_id, product_type, status, purchased_at')
        .eq('user_id', user.id).eq('status', 'completed'),
    ])

    const ents = getUserEntitlements({
      email: user.email,
      is_premium: profileRes.data?.is_premium ?? false,
      role: (profileRes.data?.role ?? 'user') as UserRole,
    })

    isPremium = ents.effectivePremium
    const pixieXp = (profileRes.data?.pixie_xp ?? {}) as Record<string, unknown>
    const active = typeof pixieXp.active === 'string' ? pixieXp.active : null
    activePixieProductId = active && PRODUCT_BY_ID[active as ProductId] ? (active as ProductId) : null
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
      activePixieProductId={activePixieProductId}
      locale="en"
      initialTab={initialTab}
    />
  )
}
