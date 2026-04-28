-- ================================================================
--  SplitVote — Migration v14: Streak Milestone Badges (15 + 30 day)
--  Apply AFTER migration_v3_engagement.sql.
--  Safe to re-run: uses ON CONFLICT DO NOTHING + CREATE OR REPLACE.
--
--  What this does:
--  1. Seeds streak_15 and streak_30 badge definitions.
--     (streak_7 already defined in migration_v2_safe.sql)
--  2. Updates increment_user_vote_count to award streak_15 and streak_30
--     at the right thresholds (streak_7 award already existed in v3).
-- ================================================================

-- ── 1. Seed streak_15 and streak_30 badge definitions ───────────
-- Idempotent: ON CONFLICT (id) DO NOTHING

insert into public.badges (id, name, description, emoji, rarity, category, sort_order) values
  ('streak_15', '15-Day Streak', 'Voted every day for 15 consecutive days', '🗓️', 'epic',      'earned', 91),
  ('streak_30', '30-Day Streak', 'Voted every day for a full month',         '🏅', 'legendary', 'earned', 92)
on conflict (id) do nothing;

-- ── 2. Update increment_user_vote_count ─────────────────────────
-- Replaces the v3 version.
-- Changes vs v3: awards streak_15 (>= 15 days) and streak_30 (>= 30 days)
-- in addition to the existing streak_7 award.
-- All other logic (xp, votes_count, companion_stage, streak calc) unchanged.

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
    -- Already voted today — streak and XP don't change on subsequent votes
    null;
  elsif v_last_date = v_today - interval '1 day' then
    -- Consecutive day — extend streak
    v_streak := coalesce(v_streak, 0) + 1;
  else
    -- Streak broken — reset to 1
    v_streak := 1;
  end if;

  -- Update profile: votes_count +1, xp +10 per vote, streak, companion_stage
  update public.profiles
  set
    votes_count      = coalesce(votes_count, 0) + 1,
    xp               = coalesce(xp, 0) + 10,
    streak_days      = v_streak,
    streak_last_date = v_today,
    companion_stage  = case
      when coalesce(votes_count, 0) + 1 >= 500 then 5
      when coalesce(votes_count, 0) + 1 >= 100 then 4
      when coalesce(votes_count, 0) + 1 >= 50  then 3
      when coalesce(votes_count, 0) + 1 >= 10  then 2
      else 1
    end
  where id = p_user_id;

  -- Award vote-count-based badges (first_vote, votes_10, votes_50, votes_100, votes_500, early_adopter)
  perform public.check_and_award_badges(p_user_id);

  -- Award streak milestone badges — idempotent via ON CONFLICT DO NOTHING
  if v_streak >= 7 then
    insert into public.user_badges (user_id, badge_id)
    values (p_user_id, 'streak_7')
    on conflict do nothing;
  end if;

  if v_streak >= 15 then
    insert into public.user_badges (user_id, badge_id)
    values (p_user_id, 'streak_15')
    on conflict do nothing;
  end if;

  if v_streak >= 30 then
    insert into public.user_badges (user_id, badge_id)
    values (p_user_id, 'streak_30')
    on conflict do nothing;
  end if;

exception when others then
  -- Non-blocking: log and continue; vote already recorded in Redis/Supabase
  raise warning 'increment_user_vote_count error for user %: %', p_user_id, sqlerrm;
end;
$$;

-- ── 3. Backfill: award streak milestone badges to existing users ─
-- Safe to run: ON CONFLICT DO NOTHING prevents duplicates.
-- Only awards if streak_days already meets the threshold.
-- Does NOT retroactively verify historical streak validity — trust stored value.

do $$
begin
  -- streak_7 backfill (may already exist from migration_v3, no harm)
  insert into public.user_badges (user_id, badge_id)
  select id, 'streak_7'
  from public.profiles
  where streak_days >= 7
  on conflict do nothing;

  -- streak_15 backfill
  insert into public.user_badges (user_id, badge_id)
  select id, 'streak_15'
  from public.profiles
  where streak_days >= 15
  on conflict do nothing;

  -- streak_30 backfill
  insert into public.user_badges (user_id, badge_id)
  select id, 'streak_30'
  from public.profiles
  where streak_days >= 30
  on conflict do nothing;
end;
$$;

-- ── VERIFICATION QUERY (uncomment to check after running) ───────
-- select
--   (select count(*) from public.badges where id in ('streak_7','streak_15','streak_30')) as streak_badges_seeded,  -- expected: 3
--   (select count(*) from public.user_badges where badge_id = 'streak_15') as streak_15_awarded,
--   (select count(*) from public.user_badges where badge_id = 'streak_30') as streak_30_awarded;
