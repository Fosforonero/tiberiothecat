-- ================================================================
--  SplitVote — Migration v13
--  user_polls: drop residual client UPDATE policy
--  Esegui in Supabase → SQL Editor → New query
-- ================================================================
--
-- Background:
--   After migration_v12 was applied, the production DB was inspected and
--   found to have the following policies on public.user_polls:
--
--     SELECT  "Anyone can view approved polls"
--     SELECT  "Users can view own polls"
--     UPDATE  "Users can update own pending polls"  ← RESIDUAL, must drop
--
--   The UPDATE policy was created by schema.sql (original base migration).
--   No client-side feature uses it:
--
--     - Poll submission: POST /api/polls/submit — admin client, bypasses RLS
--     - Admin approve: GET /api/admin/polls/[id]/approve — admin client
--     - Admin reject:  GET /api/admin/polls/[id]/reject  — admin client
--
--   Keeping this policy allows any authenticated user to PATCH their own
--   pending poll directly via the Supabase REST API — bypassing the admin
--   review process (user could change content after submission while it sits
--   in the review queue).
--
-- This migration:
--   1. Drops the residual UPDATE policy.
--   2. Drops any other UPDATE/DELETE client policies that may exist.
--   3. Does NOT touch SELECT policies (both are required by /dashboard and
--      by the public dilemma display).
--
-- After applying this migration:
--   - Authenticated users cannot UPDATE or DELETE user_polls rows via
--     the Supabase REST API — they will receive 42501 insufficient_privilege.
--   - Admin approve/reject routes are unaffected — they use service role.
--   - dashboard and public dilemma SELECT queries are unaffected.
--
-- All future modifications to user_polls must go through server-side API
-- routes with explicit auth and entitlement checks.

-- Drop the residual UPDATE policy (the only one found in production)
drop policy if exists "Users can update own pending polls" on public.user_polls;

-- Drop any other possible client UPDATE/DELETE variant names idempotently
drop policy if exists "Users can update own polls"   on public.user_polls;
drop policy if exists "Users can delete own polls"   on public.user_polls;
drop policy if exists "Users can delete own pending polls" on public.user_polls;
