-- ================================================================
--  SplitVote — Migration v8: User Events
--  Apply AFTER migration_v7_stripe_subscriptions.sql.
--  Safe to re-run: uses IF NOT EXISTS / drop if exists for policies.
--
--  Tracks share events for mission verification (share_result mission).
--  Only authenticated users can insert/select their own events.
--  No anonymous access — XP missions require auth.
-- ================================================================

create table if not exists public.user_events (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users(id) on delete cascade,
  event_type   text        not null,
  scenario_id  text,
  metadata     jsonb       not null default '{}',
  created_at   timestamptz not null default now()
);

alter table public.user_events enable row level security;

drop policy if exists "Users can insert own events" on public.user_events;
create policy "Users can insert own events"
  on public.user_events for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can select own events" on public.user_events;
create policy "Users can select own events"
  on public.user_events for select
  using (auth.uid() = user_id);

-- Composite index for mission queries: (user_id, event_type, created_at)
create index if not exists user_events_type_user_date_idx
  on public.user_events(user_id, event_type, created_at);

-- ── VERIFICATION QUERY (uncomment to check after running) ────────
-- select
--   (select count(*) from information_schema.tables
--    where table_name = 'user_events') as user_events_table_exists,
--   (select count(*) from information_schema.columns
--    where table_name = 'user_events' and column_name = 'event_type') as event_type_col_exists;
