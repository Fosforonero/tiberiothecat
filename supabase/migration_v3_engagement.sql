-- ================================================================
--  SplitVote — Migration v3: Engagement + Companion
--  Apply AFTER migration_v2_safe.sql.
--  Safe to re-run: all statements use IF NOT EXISTS / on conflict.
-- ================================================================

-- ── 1. XP + STREAK on profiles ──────────────────────────────────
alter table public.profiles
  add column if not exists xp               int not null default 0,
  add column if not exists streak_days      int not null default 0,
  add column if not exists streak_last_date date;

-- ── 2. COMPANION fields on profiles ─────────────────────────────
-- Species: spark | blip | momo | shade | orbit
-- Stage: 1-5 (auto-derived from votes_count, stored for display)
alter table public.profiles
  add column if not exists companion_species    text not null default 'spark',
  add column if not exists companion_stage      int  not null default 1,
  add column if not exists companion_skin       text,
  add column if not exists companion_accessory  text,
  add column if not exists companion_aura       text;

-- ── 3. DAILY MISSIONS tracking ──────────────────────────────────
create table if not exists public.mission_completions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  mission_id   text not null,
  completed_at date not null default current_date,
  xp_awarded   int  not null default 0,
  unique (user_id, mission_id, completed_at)
);

alter table public.mission_completions enable row level security;

drop policy if exists "Users can view own missions" on public.mission_completions;
create policy "Users can view own missions"
  on public.mission_completions for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own missions" on public.mission_completions;
create policy "Users can insert own missions"
  on public.mission_completions for insert
  with check (auth.uid() = user_id);

create index if not exists mission_completions_user_date_idx
  on public.mission_completions(user_id, completed_at);

-- ── 4. increment_user_vote_count — updated to handle XP + streak ─
-- Replaces the v2 version. IMPORTANT: still calls check_and_award_badges
-- so existing badge logic (first_vote, votes_10, votes_50 ...) is preserved.
create or replace function public.increment_user_vote_count(p_user_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_last_date  date;
  v_streak     int;
  v_votes      int;
  v_today      date := current_date;
begin
  -- Fetch current streak info and vote count
  select streak_last_date, streak_days, votes_count
  into v_last_date, v_streak, v_votes
  from public.profiles
  where id = p_user_id;

  -- Calculate new streak
  if v_last_date is null then
    v_streak := 1;
  elsif v_last_date = v_today then
    -- Already voted today — don't change streak (no double XP either)
    -- Still let votes_count increment (this RPC is only called on first-vote-per-dilemma)
    null;
  elsif v_last_date = v_today - interval '1 day' then
    -- Consecutive day
    v_streak := coalesce(v_streak, 0) + 1;
  else
    -- Streak broken
    v_streak := 1;
  end if;

  -- Update profile: votes_count +1, xp +10 per vote, streak, companion_stage
  update public.profiles
  set
    votes_count      = coalesce(votes_count, 0) + 1,
    xp               = coalesce(xp, 0) + 10,
    streak_days      = v_streak,
    streak_last_date = v_today,
    -- Auto-compute companion stage from new votes_count
    companion_stage  = case
      when coalesce(votes_count, 0) + 1 >= 500 then 5
      when coalesce(votes_count, 0) + 1 >= 100 then 4
      when coalesce(votes_count, 0) + 1 >= 50  then 3
      when coalesce(votes_count, 0) + 1 >= 10  then 2
      else 1
    end
  where id = p_user_id;

  -- Award vote-count-based badges (first_vote, votes_10, votes_50, votes_100, votes_500, early_adopter)
  -- Reuses the existing v2 function — no badge logic is duplicated.
  perform public.check_and_award_badges(p_user_id);

  -- Award streak badge (streak_7) if applicable — defined in badges table by migration_v2
  if v_streak >= 7 then
    insert into public.user_badges (user_id, badge_id)
    values (p_user_id, 'streak_7')
    on conflict do nothing;
  end if;

exception when others then
  -- Non-blocking: log and continue; vote has already been recorded in Redis/Supabase
  raise warning 'increment_user_vote_count error for user %: %', p_user_id, sqlerrm;
end;
$$;

-- ── 5. award_mission_xp — XP values are hardcoded server-side ───
-- The mission_id parameter is validated here: no arbitrary XP from client.
-- The API route (/api/missions/complete) also validates mission_id
-- and does server-side eligibility checks before calling this function.
create or replace function public.award_mission_xp(p_user_id uuid, p_mission_id text)
returns void
language plpgsql
security definer
as $$
declare
  v_xp int;
begin
  -- XP values mirror MISSIONS[] in lib/missions.ts — update both together
  v_xp := case p_mission_id
    when 'vote_3'             then 30
    when 'vote_2_categories'  then 25
    when 'challenge_friend'   then 20
    when 'share_result'       then 15
    when 'daily_dilemma'      then 50
    else 0
  end;

  -- Unknown mission ID or XP = 0 → no-op (safe to call with any string)
  if v_xp > 0 then
    update public.profiles
    set xp = coalesce(xp, 0) + v_xp
    where id = p_user_id;
  end if;
end;
$$;

-- ── VERIFICATION QUERY (uncomment to check after running) ────────
-- select
--   (select count(*) from information_schema.columns
--    where table_name = 'profiles' and column_name = 'xp') as xp_col_exists,
--   (select count(*) from information_schema.columns
--    where table_name = 'profiles' and column_name = 'companion_species') as companion_col_exists,
--   (select count(*) from information_schema.tables
--    where table_name = 'mission_completions') as missions_table_exists;
