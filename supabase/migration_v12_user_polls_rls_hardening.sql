-- ================================================================
--  SplitVote — Migration v12
--  user_polls RLS hardening: block direct client inserts
--  Esegui in Supabase → SQL Editor → New query
-- ================================================================

-- Enable RLS (safe if already enabled — idempotent)
alter table public.user_polls enable row level security;

-- Drop any client-side INSERT policies that may have been created in schema.sql.
-- We don't know the exact policy names — drop all possible variants idempotently.
drop policy if exists "Users can insert own polls"           on public.user_polls;
drop policy if exists "Authenticated users can insert polls" on public.user_polls;
drop policy if exists "Premium users can insert polls"       on public.user_polls;
drop policy if exists "Users can submit polls"               on public.user_polls;

-- SELECT: users can view their own polls (used by /dashboard and /submit-poll).
-- Recreate idempotently.
drop policy if exists "Users can view own polls" on public.user_polls;
create policy "Users can view own polls"
  on public.user_polls for select
  using (auth.uid() = user_id);

-- No INSERT/UPDATE/DELETE policies for regular clients.
--
-- All inserts go through POST /api/polls/submit, which:
--   1. Verifies auth via supabase.auth.getUser()
--   2. Checks canSubmitPoll server-side via getUserEntitlements()
--   3. Uses createAdminClient() (service role) to insert — bypasses RLS
--   4. Hardcodes status='pending'; never accepts status/user_id from the request body
--
-- Admin approve/reject routes (/api/admin/polls/[id]/approve|reject) also use
-- createAdminClient() + isAdminEmail() check — they bypass RLS by design.
--
-- This means a non-premium authenticated user who POSTs directly to the
-- Supabase REST API will receive a 42501 (insufficient_privilege) error
-- because no INSERT policy exists.
