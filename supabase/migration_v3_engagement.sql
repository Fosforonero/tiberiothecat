-- ================================================================
--  SplitVote — Migration v3: Engagement + Companion
--  Apply in Supabase → SQL Editor → New query → Run
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
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  mission_id  text not null,
  completed_at date not null default current_date,
  xp_awarded  int not null default 0,
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

-- ── 4. Update increment_user_vote_count to also award XP + update streak ──
create or replace function public.increment_user_vote_count(p_user_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_last_date  date;
  v_streak     int;
  v_today      date := current_date;
begin
  -- Fetch current streak info
  select streak_last_date, streak_days
  into v_last_date, v_streak
  from public.profiles
  where id = p_user_id;

  -- Calculate new streak
  if v_last_date is null then
    v_streak := 1;
  elsif v_last_date = v_today then
    -- Already voted today — don't change streak
    null;
  elsif v_last_date = v_today - 1 then
    -- Consecutive day
    v_streak := coalesce(v_streak, 0) + 1;
  else
    -- Streak broken
    v_streak := 1;
  end if;

  -- Update profile: votes_count, xp (+10 per vote), streak
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

  -- Auto-award XP-based badges (non-blocking — ignore errors)
  begin
    perform public.award_badge_if_missing(p_user_id, 'first_vote');
    if (select votes_count from public.profiles where id = p_user_id) >= 10 then
      perform public.award_badge_if_missing(p_user_id, 'ten_votes');
    end if;
    if (select votes_count from public.profiles where id = p_user_id) >= 100 then
      perform public.award_badge_if_missing(p_user_id, 'hundred_votes');
    end if;
    if v_streak >= 7 then
      perform public.award_badge_if_missing(p_user_id, 'week_streak');
    end if;
  exception when others then
    null; -- badge functions may not exist yet — non-blocking
  end;
end;
$$;

-- ── 5. Function: award_mission_xp ───────────────────────────────
create or replace function public.award_mission_xp(p_user_id uuid, p_xp int)
returns void
language plpgsql
security definer
as $$
begin
  update public.profiles
  set xp = coalesce(xp, 0) + p_xp
  where id = p_user_id;
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
