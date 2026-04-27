-- ================================================================
--  SplitVote — Migration v10: Content Events (PLAN — NOT YET APPLIED)
--
--  Status: DRAFT — review before applying.
--  Safe to apply AFTER migration_v9_referral_codes.sql.
--  Does NOT affect any existing tables.
--
--  Purpose:
--    Extend user_events to track content engagement signals needed
--    for the Content analytics tab in the Admin Dashboard.
--
--  Current state (migration_v8):
--    user_events tracks: vote_success, vote_change, vote_duplicate,
--    vote_rate_limited, share_result.
--    The table has scenario_id + metadata JSONB.
--    RLS: authenticated users can only insert/select their own rows.
--    No admin read policy — service_role bypasses RLS.
--
--  What's missing for content analytics:
--    1. Page view events (dilemma views, not just votes)
--    2. Blog article read events (dwell time proxy)
--    3. Expert insight "expanded" events (measures quality engagement)
--    4. Dilemma share events (beyond result-share missions)
--
--  Design decision:
--    Extend user_events (existing table) rather than creating a new one.
--    Anonymous events require anon_token (cookie) for dedup — same
--    pattern as dilemma_feedback. But for phase 1, we only track
--    authenticated users to keep the surface small.
-- ================================================================

-- ── 1. Add content_events view for admin analytics ───────────────
-- This view aggregates user_events by event_type + scenario_id
-- for the admin Content tab without exposing user_id.

CREATE OR REPLACE VIEW public.content_events_summary AS
SELECT
  event_type,
  scenario_id,
  COUNT(*)                                   AS event_count,
  COUNT(DISTINCT user_id)                    AS unique_users,
  MIN(created_at)                            AS first_seen,
  MAX(created_at)                            AS last_seen,
  DATE_TRUNC('day', MAX(created_at))         AS last_seen_day
FROM public.user_events
WHERE event_type IN (
  'vote_success', 'vote_change',
  'insight_expanded', 'result_shared',
  'blog_read', 'dilemma_view'
)
GROUP BY event_type, scenario_id
ORDER BY event_count DESC;

-- Service role can read the view
GRANT SELECT ON public.content_events_summary TO service_role;

-- ── 2. Index for scenario_id lookups ─────────────────────────────
CREATE INDEX IF NOT EXISTS user_events_scenario_event_idx
  ON public.user_events (scenario_id, event_type)
  WHERE scenario_id IS NOT NULL;

-- ── 3. Planned new event types (documentation only) ──────────────
-- The following event_type values are planned but not yet instrumented
-- in the application code. Add them when implementing the feature.
--
--   'dilemma_view'     — user loaded a play/[id] page (server-side impression)
--   'insight_expanded' — user clicked "expand" on Expert Insight panel
--   'result_shared'    — user clicked share on results page
--   'blog_read'        — user spent > 30s on a blog article (client-side)
--
-- To instrument: call POST /api/events/track with { event_type, scenario_id }
-- from the relevant client component. The route already exists at
-- app/api/events/track/route.ts — add new event_type values as needed.

-- ── 4. VERIFY ────────────────────────────────────────────────────
-- SELECT event_type, COUNT(*) FROM public.user_events GROUP BY event_type ORDER BY 2 DESC;
-- SELECT * FROM public.content_events_summary LIMIT 10;
