-- migration_v9_referral_codes.sql
-- Adds referral_code to profiles for challenge_friend mission.
-- Non-guessable 10-hex-char code that goes in share URLs instead of raw user_id.
-- Privacy: referral_code → user_id resolution is server-only (admin client).

-- 1. Add column (nullable first so backfill can run)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code text;

-- 2. Backfill existing users (idempotent — only touches NULL rows)
UPDATE profiles
SET referral_code = left(replace(gen_random_uuid()::text, '-', ''), 10)
WHERE referral_code IS NULL;

-- 3. Tighten: NOT NULL + default for future inserts
ALTER TABLE profiles ALTER COLUMN referral_code SET NOT NULL;
ALTER TABLE profiles ALTER COLUMN referral_code
  SET DEFAULT left(replace(gen_random_uuid()::text, '-', ''), 10);

-- 4. Unique index (fast lookup by code + prevents duplicates)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);
