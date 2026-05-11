-- v17: Cosmetic equipment columns on profiles (Sprint 4 — Pixie Market cosmetics)
--
-- Apply via: Supabase dashboard → SQL Editor → New query → paste → Run
--
-- Purpose: stores which cosmetic items (frame, glow, name color) the user
-- currently has equipped. Ownership lives in `user_purchases` (v16); these
-- columns track WHICH owned item is active. NULL = nothing equipped.
--
-- Values stored:
--   equipped_frame:  product_id from PRODUCT_CATALOG (e.g. 'frame_gold')
--                    NOTE: this column already exists from migration_v2
--                    where it was reserved for badge frames but never wired.
--                    We are repurposing it for cosmetic frames (forward-compat).
--   equipped_glow:   product_id from PRODUCT_CATALOG (e.g. 'glow_fire')
--   name_color:      a color slug. Only available if the user owns the
--                    'name_color_bundle' product. Slugs are validated in the
--                    API route (one of 8 pre-defined colors). Examples:
--                    'aurora', 'fire', 'frost', 'gold', 'rose', 'mint',
--                    'violet', 'sky'.
--
-- Server-side validation: the equip API route refuses to set any of these
-- columns unless the user owns the corresponding product in user_purchases
-- (status = 'completed'). The DB does not enforce ownership directly — that
-- check lives in app code so we can change ownership rules without migrations.
--
-- RLS: profiles already has RLS policies that allow users to UPDATE their
-- own row (id = auth.uid()). No new policies needed.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS equipped_glow TEXT,
  ADD COLUMN IF NOT EXISTS name_color    TEXT;

-- Comment hints for ops/support visibility in SQL Editor
COMMENT ON COLUMN public.profiles.equipped_frame IS
  'Cosmetic frame product_id (e.g. frame_gold). NULL = no frame.';
COMMENT ON COLUMN public.profiles.equipped_glow IS
  'Cosmetic glow product_id (e.g. glow_fire). NULL = no glow.';
COMMENT ON COLUMN public.profiles.name_color IS
  'Name color slug (only available if user owns name_color_bundle). NULL = default.';

-- Sanity check:
--   SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'profiles'
--     AND column_name IN ('equipped_frame', 'equipped_glow', 'name_color');
-- Expected: 3 rows.
