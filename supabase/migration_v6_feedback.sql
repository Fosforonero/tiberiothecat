-- ================================================================
--  SplitVote — Migration v6: Dilemma Feedback (🔥 / 👎)
--  Apply in Supabase → SQL Editor AFTER migration_v5.
--  Safe to re-run: CREATE TABLE IF NOT EXISTS + policy drops.
--
--  Purpose:
--    Track per-dilemma quality feedback from users after they vote.
--    Used to update the feedbackScore in the draft scoring algorithm
--    and to surface high-quality dilemmas for promotion.
-- ================================================================

-- ── 1. Create dilemma_feedback table ────────────────────────────
CREATE TABLE IF NOT EXISTS public.dilemma_feedback (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  dilemma_id  text        NOT NULL,
  user_id     uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  -- NULL user_id means anonymous feedback (identified by anon_token cookie)
  anon_token  text,
  -- 'fire' = positive (🔥 interesting), 'down' = negative (👎 boring/bad)
  feedback    text        NOT NULL CHECK (feedback IN ('fire', 'down')),
  created_at  timestamptz NOT NULL DEFAULT now(),

  -- One feedback per user per dilemma (authenticated users)
  CONSTRAINT dilemma_feedback_user_dilemma_key
    UNIQUE NULLS NOT DISTINCT (user_id, dilemma_id)
      DEFERRABLE INITIALLY DEFERRED
);

-- ── 2. Indexes ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS dilemma_feedback_dilemma_id_idx
  ON public.dilemma_feedback (dilemma_id);

CREATE INDEX IF NOT EXISTS dilemma_feedback_user_id_idx
  ON public.dilemma_feedback (user_id)
  WHERE user_id IS NOT NULL;

-- ── 3. RLS ───────────────────────────────────────────────────────
ALTER TABLE public.dilemma_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own feedback" ON public.dilemma_feedback;
DROP POLICY IF EXISTS "Users can insert their own feedback" ON public.dilemma_feedback;
DROP POLICY IF EXISTS "Anon can insert feedback" ON public.dilemma_feedback;
DROP POLICY IF EXISTS "Service role full access" ON public.dilemma_feedback;

-- Authenticated users can read their own previous feedback.
-- The API relies on this to avoid duplicate Redis increments.
CREATE POLICY "Users can read their own feedback"
  ON public.dilemma_feedback
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Authenticated users can insert their own feedback
CREATE POLICY "Users can insert their own feedback"
  ON public.dilemma_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Anon users can insert (user_id = NULL)
CREATE POLICY "Anon can insert feedback"
  ON public.dilemma_feedback
  FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

-- Service role can read all (admin API)
CREATE POLICY "Service role full access"
  ON public.dilemma_feedback
  TO service_role
  USING (true)
  WITH CHECK (true);

GRANT SELECT, INSERT ON public.dilemma_feedback TO authenticated;
GRANT INSERT ON public.dilemma_feedback TO anon;

-- ── 4. Aggregate view for admin ──────────────────────────────────
CREATE OR REPLACE VIEW public.dilemma_feedback_stats AS
SELECT
  dilemma_id,
  COUNT(*) FILTER (WHERE feedback = 'fire') AS fire_count,
  COUNT(*) FILTER (WHERE feedback = 'down') AS down_count,
  COUNT(*) AS total_count,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE feedback = 'fire') / NULLIF(COUNT(*), 0)
  ) AS fire_pct
FROM public.dilemma_feedback
GROUP BY dilemma_id
ORDER BY fire_count DESC;

-- Service role can read the view
GRANT SELECT ON public.dilemma_feedback_stats TO service_role;
