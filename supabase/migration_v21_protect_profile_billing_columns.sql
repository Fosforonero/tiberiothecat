-- migration_v21_protect_profile_billing_columns.sql
--
-- ⚠️  PROD MIGRATION — HUMAN_ONLY. Apply manually in the Supabase SQL editor
--     (project eaphpnaxonlbgiiehvhz). Do NOT auto-apply.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- WHY (P0 security — confirmed live on the DB, 17 Jun 2026)
-- ─────────────────────────────────────────────────────────────────────────────
-- The RLS policy "Users can update own profile" on public.profiles is:
--     FOR UPDATE  USING (auth.uid() = id)  WITH CHECK = NULL
-- With WITH CHECK NULL, Postgres falls back to the USING expression for the
-- NEW row, so a logged-in user can PATCH their own profiles row and set
-- is_premium = true (free Premium + no-ads), plus forge the stripe_* /
-- subscription_status columns.
--
-- Tightening that policy's WITH CHECK is NOT sufficient on its own: a second
-- permissive UPDATE policy exists — "Only super_admin can update role"
-- (USING true, WITH CHECK guards ONLY `role`). Permissive policies combine
-- with OR, so a row that leaves `role` unchanged satisfies that policy's
-- WITH CHECK regardless of is_premium. The reliable boundary is a BEFORE
-- UPDATE trigger — the exact pattern already used to protect `role` via
-- enforce_role_immutability_fn(). service_role (the Stripe webhook's admin
-- client) bypasses, so legitimate billing writes keep working.
--
-- Billing columns guarded: is_premium, stripe_customer_id,
-- stripe_subscription_id, subscription_status.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Trigger function — block non-service_role billing-column changes
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.enforce_billing_immutability_fn()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public, pg_temp
AS $function$
BEGIN
  -- service_role (Stripe webhook admin client) is the only legitimate writer
  -- of billing columns; let it through untouched.
  IF current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NEW.is_premium             IS DISTINCT FROM OLD.is_premium
     OR NEW.stripe_customer_id     IS DISTINCT FROM OLD.stripe_customer_id
     OR NEW.stripe_subscription_id IS DISTINCT FROM OLD.stripe_subscription_id
     OR NEW.subscription_status    IS DISTINCT FROM OLD.subscription_status THEN
    RAISE EXCEPTION 'Billing columns (is_premium, stripe_*) are managed by Stripe and cannot be changed by this client';
  END IF;

  RETURN NEW;
END;
$function$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Attach as BEFORE UPDATE trigger on profiles
-- ─────────────────────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS enforce_billing_immutability ON public.profiles;
CREATE TRIGGER enforce_billing_immutability
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_billing_immutability_fn();

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Revoke RPC exposure (PostgREST auto-exposes public functions)
--    Mirrors migration_v20 section 3. Revoking EXECUTE does NOT affect the
--    trigger firing — triggers run with the function's privileges.
-- ─────────────────────────────────────────────────────────────────────────────
REVOKE EXECUTE ON FUNCTION public.enforce_billing_immutability_fn() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enforce_billing_immutability_fn() FROM anon;
REVOKE EXECUTE ON FUNCTION public.enforce_billing_immutability_fn() FROM authenticated;

COMMENT ON FUNCTION public.enforce_billing_immutability_fn() IS
  'BEFORE UPDATE trigger on profiles. Blocks any non-service_role client from '
  'changing billing columns (is_premium, stripe_customer_id, '
  'stripe_subscription_id, subscription_status). service_role (Stripe webhook '
  'admin client) bypasses. Closes the WITH CHECK=NULL gap on the '
  '"Users can update own profile" RLS policy. See migration_v21.';

-- ═════════════════════════════════════════════════════════════════════════════
-- VERIFY (run after applying)
-- ═════════════════════════════════════════════════════════════════════════════
-- Trigger present:
--   SELECT tgname FROM pg_trigger
--   WHERE tgrelid='public.profiles'::regclass AND tgname='enforce_billing_immutability';
--   -- Expected: 1 row
--
-- No anon/authenticated EXECUTE grant:
--   SELECT r.rolname FROM pg_proc p
--   JOIN aclexplode(p.proacl) ax ON true
--   JOIN pg_roles r ON r.oid = ax.grantee
--   WHERE p.proname='enforce_billing_immutability_fn'
--     AND r.rolname IN ('anon','authenticated');
--   -- Expected: 0 rows
--
-- Behavioural check (as an authenticated, non-service_role user, against your
-- own row) — this must now FAIL with the billing-columns exception:
--   UPDATE public.profiles SET is_premium = true WHERE id = auth.uid();
--
-- A normal profile update (username/cosmetic/can_change_until, no billing
-- column touched) must still SUCCEED.
--
-- ═════════════════════════════════════════════════════════════════════════════
-- ROLLBACK
-- ═════════════════════════════════════════════════════════════════════════════
--   DROP TRIGGER IF EXISTS enforce_billing_immutability ON public.profiles;
--   DROP FUNCTION IF EXISTS public.enforce_billing_immutability_fn();
