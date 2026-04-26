-- ================================================================
--  SplitVote — Migration v4: Security Hotfix + Pseudonymous Identity
--  Apply in Supabase → SQL Editor AFTER migration_v3.
--  Safe to re-run: uses CREATE OR REPLACE / ON CONFLICT DO NOTHING.
--
--  Fixes:
--    1. handle_new_user — never uses OAuth real names
--    2. RPC permissions — restrict to authenticated + service_role
--    3. Normalize existing profiles with real OAuth names
-- ================================================================

-- ── 1. PSEUDONYMOUS IDENTITY: Fix handle_new_user ───────────────
-- SplitVote is pseudonymous by design.
-- NEVER copy OAuth real names (full_name, name) into display_name.
-- Always generate a Splitvoter-XXXXXX pseudonym on signup.
-- The first manual rename remains free (name_changes = 0).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pseudo text;
BEGIN
  -- Generate pseudonymous display name — NEVER use OAuth metadata name fields.
  -- raw_user_meta_data->>'full_name' and ->>'name' are intentionally ignored.
  -- avatar_url (profile picture) IS preserved — only the real name is blocked.
  -- Format: Splitvoter-XXXXXX (6 alphanumeric chars from UUID, uppercase)
  v_pseudo := 'Splitvoter-' || upper(substring(replace(new.id::text, '-', ''), 1, 6));

  INSERT INTO public.profiles (
    id,
    email,
    display_name,
    avatar_url,
    avatar_emoji,
    name_changes,
    is_premium,
    created_at,
    updated_at
  )
  VALUES (
    new.id,
    new.email,
    v_pseudo,
    new.raw_user_meta_data->>'avatar_url',  -- profile picture OK; real name NOT OK
    '🌍',
    0,       -- first rename always free
    false,
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$;

-- Re-create trigger (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ── 2. SECURITY: Restrict execution of sensitive SECURITY DEFINER RPCs ──
-- These functions run as the function owner (postgres/superuser).
-- Only authenticated users and service_role should call them.
-- Revoking from PUBLIC + anon prevents unauthenticated invocations.
REVOKE EXECUTE ON FUNCTION public.increment_user_vote_count(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.increment_user_vote_count(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.award_mission_xp(uuid, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.award_mission_xp(uuid, text) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.check_and_award_badges(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.check_and_award_badges(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.set_updated_at() TO authenticated, service_role;

-- ── 3. NORMALIZE existing profiles with real OAuth names ─────────
-- Safely overwrite ONLY profiles where ALL of these are true:
--   a) name_changes = 0  → never manually renamed (original auto-assigned value)
--   b) NOT already 'Splitvoter-...' pseudonym
--   c) display_name contains a space OR a dot → typical OAuth "First Last" pattern
--
-- Profiles with name_changes >= 1 (manually chosen names) are NEVER touched.
UPDATE public.profiles
SET
  display_name = 'Splitvoter-' || upper(substring(replace(id::text, '-', ''), 1, 6)),
  updated_at   = now()
WHERE
  name_changes = 0
  AND display_name NOT LIKE 'Splitvoter-%'
  AND (
    display_name LIKE '% %'    -- "First Last" — space = OAuth full_name
    OR display_name LIKE '%.%' -- "first.last" — dot = email prefix pattern
  );

-- ── 4. VERIFY ────────────────────────────────────────────────────
-- Run this after applying to confirm the results:
SELECT
  COUNT(*) FILTER (WHERE display_name LIKE 'Splitvoter-%')                       AS pseudonymous,
  COUNT(*) FILTER (WHERE display_name NOT LIKE 'Splitvoter-%' AND name_changes > 0) AS manually_renamed,
  COUNT(*) FILTER (WHERE display_name NOT LIKE 'Splitvoter-%' AND name_changes = 0) AS review_needed,
  COUNT(*)                                                                         AS total
FROM public.profiles;

-- ── DIAGNOSTIC (run manually to inspect review_needed profiles) ──
-- SELECT id, display_name, name_changes, created_at
-- FROM public.profiles
-- WHERE display_name NOT LIKE 'Splitvoter-%' AND name_changes = 0
-- ORDER BY created_at DESC;
