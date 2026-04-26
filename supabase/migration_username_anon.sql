-- ================================================================
--  SplitVote — Migration: Username anonimato + auto-generazione
--  Esegui in Supabase → SQL Editor → New query
-- ================================================================

-- ── 1. Assicurati che name_changes e avatar_emoji esistano ──────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS name_changes INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS avatar_emoji TEXT DEFAULT '🌍';

-- ── 2. Aggiorna il trigger handle_new_user ─────────────────────
--  Logica:
--    - Se OAuth (Google/Discord) ha un full_name → usalo come display_name
--    - Altrimenti → genera "Splitvoter-XXXX" dai primi 4 chars dell'UUID
--    - name_changes = 0 → il primo cambio manuale è SEMPRE gratuito
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  oauth_name  text;
  gen_name    text;
  final_name  text;
BEGIN
  -- Leggi il nome dal provider OAuth se disponibile
  oauth_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    nullif(trim(new.raw_user_meta_data->>'name'), '')
  );

  -- Genera fallback Splitvoter-XXXX (4 chars uppercase dall'UUID)
  gen_name := 'Splitvoter-' || upper(substring(replace(new.id::text, '-', '') from 1 for 4));

  -- Usa il nome OAuth se presente, altrimenti il generato
  final_name := coalesce(oauth_name, gen_name);

  INSERT INTO public.profiles (id, email, display_name, avatar_url, name_changes)
  VALUES (
    new.id,
    new.email,
    final_name,
    new.raw_user_meta_data->>'avatar_url',
    0  -- 0 = primo cambio nome ancora disponibile gratuitamente
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$;

-- ── 3. Fix profili esistenti con display_name NULL ─────────────
--  Assegna Splitvoter-XXXX agli utenti che non hanno ancora un nome
UPDATE public.profiles
SET
  display_name  = 'Splitvoter-' || upper(substring(replace(id::text, '-', '') from 1 for 4)),
  name_changes  = 0
WHERE display_name IS NULL OR display_name = '';

-- ── 4. Normalizza name_changes NULL → 0 ───────────────────────
UPDATE public.profiles
SET name_changes = 0
WHERE name_changes IS NULL;

-- ── 5. Verifica ────────────────────────────────────────────────
SELECT
  COUNT(*) FILTER (WHERE display_name IS NULL OR display_name = '') AS profiles_without_name,
  COUNT(*) FILTER (WHERE name_changes = 0)   AS first_change_available,
  COUNT(*) FILTER (WHERE name_changes >= 1)  AS already_changed_once,
  COUNT(*) AS total_profiles
FROM public.profiles;
