-- ═════════════════════════════════════════════════════════════════════════════
-- PATCH 16 MAY 2026 — REVOKE EXECUTE FROM PUBLIC on 2 trigger functions
-- ═════════════════════════════════════════════════════════════════════════════
--
-- Why this exists separately from the main bundle:
--
-- The session bundle (applied successfully via Supabase MCP) included
-- REVOKE EXECUTE ... FROM anon and FROM authenticated for two trigger-only
-- functions. After applying, Supabase advisor still flagged both as
-- "anon/authenticated can execute SECURITY DEFINER function". Cause:
-- PostgreSQL grants EXECUTE to PUBLIC by default on every new function, and
-- anon + authenticated INHERIT from PUBLIC. Revoking the explicit roles
-- without also revoking PUBLIC leaves the inherited privilege intact.
--
-- Claude tried to apply this patch via MCP follow-up but the auto-mode
-- classifier blocked it (any DB op not in a pre-reviewed bundle requires
-- fresh approval). So this is a separate file you paste & run.
--
-- Effect: the 2 trigger functions (enforce_role_immutability_fn,
-- handle_new_user) become non-callable as RPC. Trigger firing is
-- unaffected — triggers run with the function's privileges, not the
-- caller's.
--
-- Run: Supabase dashboard → SQL Editor → New query → paste → Run.

BEGIN;

REVOKE EXECUTE ON FUNCTION public.enforce_role_immutability_fn() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;

COMMIT;

-- Verify — should return 0 rows:
SELECT p.proname, r.rolname AS still_executable_by
FROM pg_proc p
LEFT JOIN aclexplode(p.proacl) ax ON true
LEFT JOIN pg_roles r ON r.oid = ax.grantee
WHERE p.proname IN ('enforce_role_immutability_fn','handle_new_user')
  AND (r.rolname IN ('anon','authenticated','PUBLIC') OR ax.grantee = 0);

-- Re-check advisor: anon_security_definer_function_executable findings for
-- enforce_role_immutability_fn + handle_new_user should disappear.
-- (increment_poll_vote stays — it's intentionally anon-callable for the
-- anonymous poll voting flow.)
