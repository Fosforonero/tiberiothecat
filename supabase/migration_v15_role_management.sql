-- migration_v15_role_management.sql
-- Adds DB-backed role column to profiles, audit log, anti-escalation trigger,
-- and bootstraps Matteo as super_admin and genghi77 as admin.
--
-- Run this with service_role access (e.g. Supabase SQL Editor with admin privileges).

-- ── 1. Role column on profiles ────────────────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
  CHECK (role IN ('user', 'creator', 'moderator', 'admin', 'super_admin'));

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- ── 2. Audit log table ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS role_audit_log (
  id         BIGSERIAL    PRIMARY KEY,
  actor_id   UUID         REFERENCES profiles(id) ON DELETE SET NULL,
  target_id  UUID         NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  old_role   TEXT         NOT NULL,
  new_role   TEXT         NOT NULL,
  reason     TEXT,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

ALTER TABLE role_audit_log ENABLE ROW LEVEL SECURITY;
-- No client SELECT/INSERT/UPDATE policies — only service_role accesses this table.

-- ── 3. Anti-escalation trigger ───────────────────────────────────────────────
-- Blocks any client-side attempt to change the role column.
-- NULL jwt context = migration or postgres superuser = allowed.
-- jwt role = 'service_role' = admin API call = allowed.
-- jwt role = 'authenticated' = regular user request = blocked.

CREATE OR REPLACE FUNCTION prevent_client_role_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  raw_claims TEXT;
  jwt_role   TEXT;
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    raw_claims := nullif(current_setting('request.jwt.claims', true), '');
    IF raw_claims IS NOT NULL THEN
      jwt_role := (raw_claims::jsonb) ->> 'role';
      IF jwt_role IS DISTINCT FROM 'service_role' THEN
        RAISE EXCEPTION 'Role changes require service_role access';
      END IF;
    END IF;
    -- raw_claims IS NULL means migration / superuser context — allow.
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_role_immutability ON profiles;
CREATE TRIGGER enforce_role_immutability
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION prevent_client_role_change();

-- ── 4. Bootstrap ──────────────────────────────────────────────────────────────
-- Executed with service_role → trigger allows it.
-- Known gap: bootstrap rows are NOT recorded in role_audit_log
-- (no actor_id to reference at migration time).

UPDATE profiles SET role = 'super_admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'mat.pizzi@gmail.com' LIMIT 1);

UPDATE profiles SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'genghi77@gmail.com' LIMIT 1);
