-- migration_v18_pixie_avatar.sql
-- Adds use_pixie_avatar flag to profiles.
-- When true the user's equipped Pixie illustration is shown as their profile
-- picture instead of avatar_emoji in the dashboard preview and public profile.
-- Non-destructive: default false, safe to apply on live data.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS use_pixie_avatar BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN profiles.use_pixie_avatar IS
  'When true the Pixie companion illustration is shown as the profile avatar '
  'in place of avatar_emoji. Toggled from the Cosmetics widget in dashboard.';
