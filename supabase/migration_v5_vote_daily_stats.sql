-- ================================================================
--  SplitVote — Migration v5: Vote Daily Stats Aggregation
--  Apply in Supabase → SQL Editor AFTER migration_v4.
--  Safe to re-run: CREATE TABLE IF NOT EXISTS, idempotent upserts.
--
--  Purpose:
--    Track daily vote aggregates including anonymous votes (which
--    are stored only in Redis, not dilemma_votes). This gives the
--    admin dashboard a complete picture of all votes, not just
--    logged-in users.
-- ================================================================

-- ── 1. Create vote_daily_stats table ────────────────────────────
CREATE TABLE IF NOT EXISTS public.vote_daily_stats (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  date            date        NOT NULL,
  dilemma_id      text        NOT NULL,
  option_a_count  integer     NOT NULL DEFAULT 0,
  option_b_count  integer     NOT NULL DEFAULT 0,
  total_count     integer     NOT NULL DEFAULT 0,
  anonymous_count integer     NOT NULL DEFAULT 0,
  logged_in_count integer     NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  -- One row per (date, dilemma_id) pair
  CONSTRAINT vote_daily_stats_date_dilemma_key UNIQUE (date, dilemma_id)
);

-- ── 2. Indexes for fast admin queries ───────────────────────────
CREATE INDEX IF NOT EXISTS vote_daily_stats_date_idx
  ON public.vote_daily_stats (date DESC);

CREATE INDEX IF NOT EXISTS vote_daily_stats_dilemma_idx
  ON public.vote_daily_stats (dilemma_id);

-- ── 3. RLS — read-only for authenticated, full for service_role ──
ALTER TABLE public.vote_daily_stats ENABLE ROW LEVEL SECURITY;

-- Admins (via service_role) can do everything
-- Authenticated users can read aggregates (useful for future public stats)
DROP POLICY IF EXISTS "vote_daily_stats_read" ON public.vote_daily_stats;
CREATE POLICY "vote_daily_stats_read"
  ON public.vote_daily_stats
  FOR SELECT
  TO authenticated
  USING (true);

-- ── 4. updated_at trigger ────────────────────────────────────────
-- Reuse the existing set_updated_at() function from migration_v2
DROP TRIGGER IF EXISTS vote_daily_stats_updated_at ON public.vote_daily_stats;
CREATE TRIGGER vote_daily_stats_updated_at
  BEFORE UPDATE ON public.vote_daily_stats
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 5. RPC: upsert_vote_daily_stat ──────────────────────────────
-- Called by /api/vote for every vote (anon + logged-in).
-- Uses atomic upsert — safe under concurrent load.
CREATE OR REPLACE FUNCTION public.upsert_vote_daily_stat(
  p_date          date,
  p_dilemma_id    text,
  p_option        char(1),    -- 'A' or 'B'
  p_is_anonymous  boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.vote_daily_stats (
    date, dilemma_id,
    option_a_count, option_b_count, total_count,
    anonymous_count, logged_in_count
  )
  VALUES (
    p_date,
    p_dilemma_id,
    CASE WHEN p_option = 'A' THEN 1 ELSE 0 END,
    CASE WHEN p_option = 'B' THEN 1 ELSE 0 END,
    1,
    CASE WHEN p_is_anonymous THEN 1 ELSE 0 END,
    CASE WHEN NOT p_is_anonymous THEN 1 ELSE 0 END
  )
  ON CONFLICT (date, dilemma_id) DO UPDATE SET
    option_a_count  = vote_daily_stats.option_a_count  + CASE WHEN p_option = 'A' THEN 1 ELSE 0 END,
    option_b_count  = vote_daily_stats.option_b_count  + CASE WHEN p_option = 'B' THEN 1 ELSE 0 END,
    total_count     = vote_daily_stats.total_count     + 1,
    anonymous_count = vote_daily_stats.anonymous_count + CASE WHEN p_is_anonymous THEN 1 ELSE 0 END,
    logged_in_count = vote_daily_stats.logged_in_count + CASE WHEN NOT p_is_anonymous THEN 1 ELSE 0 END,
    updated_at      = now();
END;
$$;

-- Restrict to authenticated and service_role (API uses service_role via anon key + RLS bypass)
REVOKE EXECUTE ON FUNCTION public.upsert_vote_daily_stat(date, text, char, boolean) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.upsert_vote_daily_stat(date, text, char, boolean) TO authenticated, service_role;

-- ── 6. VERIFY ────────────────────────────────────────────────────
SELECT
  'vote_daily_stats' AS table_name,
  COUNT(*)           AS rows
FROM public.vote_daily_stats;
