-- ================================================================
--  SplitVote — Migration v2 SAFE / IDEMPOTENT
--  Riesegui questo script in Supabase → SQL Editor → New query
--  È sicuro rieseguirlo: usa IF NOT EXISTS / on conflict ovunque.
--
--  Esegue: tabelle dilemma_votes, badges, user_badges, organizations,
--  org_members, promoted_polls + colonne demografia su profiles +
--  funzioni increment/award badge.
-- ================================================================

-- ── 0. PREREQUISITE: set_updated_at trigger function ─────────────
-- Create it if it doesn't exist (safe on fresh or partial DBs).
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── 1. DILEMMA VOTES ────────────────────────────────────────────
create table if not exists public.dilemma_votes (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  dilemma_id      text not null,
  choice          char(1) not null check (choice in ('A', 'B')),
  can_change_until timestamptz not null default (now() + interval '24 hours'),
  voted_at        timestamptz not null default now(),
  unique (user_id, dilemma_id)
);

alter table public.dilemma_votes enable row level security;

drop policy if exists "Users can view own dilemma votes" on public.dilemma_votes;
create policy "Users can view own dilemma votes"
  on public.dilemma_votes for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own dilemma votes" on public.dilemma_votes;
create policy "Users can insert own dilemma votes"
  on public.dilemma_votes for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own vote within window" on public.dilemma_votes;
create policy "Users can update own vote within window"
  on public.dilemma_votes for update
  using (auth.uid() = user_id and can_change_until > now());

create index if not exists dilemma_votes_user_id_idx  on public.dilemma_votes(user_id);
create index if not exists dilemma_votes_dilemma_id_idx on public.dilemma_votes(dilemma_id);
create index if not exists dilemma_votes_voted_at_idx  on public.dilemma_votes(voted_at);

-- ── 2. BADGE CATALOG ────────────────────────────────────────────
create table if not exists public.badges (
  id              text primary key,
  name            text not null,
  description     text not null,
  emoji           text not null default '🏆',
  rarity          text not null default 'common'
                  check (rarity in ('common', 'rare', 'epic', 'legendary')),
  category        text not null default 'earned'
                  check (category in ('earned', 'purchasable', 'exclusive')),
  price_cents     integer not null default 0,
  stripe_price_id text,
  sort_order      integer default 0,
  created_at      timestamptz not null default now()
);

insert into public.badges (id, name, description, emoji, rarity, category, sort_order) values
  ('first_vote',    'First Vote',       'Cast your very first vote on SplitVote',              '🗳️', 'common',    'earned', 10),
  ('votes_10',      'Getting Warm',     'Voted on 10 dilemmas',                                '🔥', 'common',    'earned', 20),
  ('votes_50',      'Serious Thinker',  'Voted on 50 dilemmas',                                '🧠', 'rare',      'earned', 30),
  ('votes_100',     'Centurion',        'Voted on 100 dilemmas',                               '💯', 'epic',      'earned', 40),
  ('votes_500',     'Oracle',           'Voted on 500 dilemmas. You have seen things.',        '🔮', 'legendary', 'earned', 50),
  ('contrarian',    'Contrarian',       'Voted with the minority 10 times in a row',           '🦅', 'rare',      'earned', 60),
  ('early_adopter', 'Early Adopter',    'Joined SplitVote before it was cool',                 '⚡', 'epic',      'earned', 70),
  ('globe_trotter', 'Globe Trotter',    'Voted in 5 different categories',                     '🌍', 'common',    'earned', 80),
  ('streak_7',      '7-Day Streak',     'Voted every day for a week',                          '📅', 'rare',      'earned', 90),
  ('frame_gold',    'Gold Frame',       'Golden profile frame — stand out from the crowd',     '✨', 'rare',      'purchasable', 200),
  ('frame_neon',    'Neon Frame',       'Cyberpunk neon glow profile frame',                   '💜', 'epic',      'purchasable', 210),
  ('frame_cosmic',  'Cosmic Frame',     'The universe bends to your aesthetic',                '🌌', 'legendary', 'purchasable', 220),
  ('badge_verified','Verified Thinker', 'Blue checkmark — because you asked for it',           '✅', 'rare',      'purchasable', 230)
on conflict (id) do nothing;

update public.badges set price_cents = 99  where id = 'frame_gold';
update public.badges set price_cents = 199 where id = 'frame_neon';
update public.badges set price_cents = 299 where id = 'frame_cosmic';
update public.badges set price_cents = 149 where id = 'badge_verified';

-- ── 3. USER BADGES ───────────────────────────────────────────────
create table if not exists public.user_badges (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  badge_id    text not null references public.badges(id),
  earned_at   timestamptz not null default now(),
  is_equipped boolean not null default false,
  unique (user_id, badge_id)
);

alter table public.user_badges enable row level security;

drop policy if exists "Anyone can view user badges" on public.user_badges;
create policy "Anyone can view user badges"
  on public.user_badges for select
  using (true);

drop policy if exists "Users can update own badges (equip/unequip)" on public.user_badges;
create policy "Users can update own badges (equip/unequip)"
  on public.user_badges for update
  using (auth.uid() = user_id);

create index if not exists user_badges_user_id_idx on public.user_badges(user_id);

-- ── 4. DEMOGRAPHICS su profiles ──────────────────────────────────
alter table public.profiles
  add column if not exists birth_year     smallint check (birth_year between 1920 and 2015),
  add column if not exists gender         text check (gender in ('male','female','non_binary','prefer_not')),
  add column if not exists country_code   text,
  add column if not exists onboarding_done boolean not null default false,
  add column if not exists votes_count    integer not null default 0,
  add column if not exists equipped_frame text,
  add column if not exists equipped_badge text;

-- ── 5. ORGANIZATIONS ─────────────────────────────────────────────
create table if not exists public.organizations (
  id                     uuid primary key default gen_random_uuid(),
  name                   text not null,
  slug                   text unique not null,
  type                   text not null check (type in ('business','association','academic','media')),
  plan                   text not null default 'starter'
                         check (plan in ('starter','pro','enterprise')),
  owner_id               uuid not null references auth.users(id),
  logo_url               text,
  website                text,
  stripe_subscription_id text,
  stripe_customer_id     text,
  is_active              boolean not null default true,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

alter table public.organizations enable row level security;

-- ── 6. ORG MEMBERS ───────────────────────────────────────────────
create table if not exists public.org_members (
  id        uuid primary key default gen_random_uuid(),
  org_id    uuid not null references public.organizations(id) on delete cascade,
  user_id   uuid not null references auth.users(id) on delete cascade,
  role      text not null default 'member' check (role in ('owner','admin','member')),
  joined_at timestamptz not null default now(),
  unique (org_id, user_id)
);

alter table public.org_members enable row level security;

drop policy if exists "Org members can view their org" on public.organizations;
create policy "Org members can view their org"
  on public.organizations for select
  using (
    auth.uid() = owner_id or
    exists (select 1 from public.org_members where org_id = id and user_id = auth.uid())
  );

drop policy if exists "Org members can view own membership" on public.org_members;
create policy "Org members can view own membership"
  on public.org_members for select
  using (auth.uid() = user_id);

-- ── 7. PROMOTED POLLS ────────────────────────────────────────────
create table if not exists public.promoted_polls (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations(id) on delete cascade,
  question      text not null check (char_length(question) between 10 and 300),
  option_a      text not null,
  option_b      text not null,
  category      text not null default 'society',
  emoji         text default '🏢',
  status        text not null default 'pending'
                check (status in ('pending','active','paused','ended','rejected')),
  votes_a       integer not null default 0,
  votes_b       integer not null default 0,
  target_votes  integer default 1000,
  starts_at     timestamptz,
  ends_at       timestamptz,
  cta_text      text,
  cta_url       text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.promoted_polls enable row level security;

drop policy if exists "Org members can view own promoted polls" on public.promoted_polls;
create policy "Org members can view own promoted polls"
  on public.promoted_polls for select
  using (
    exists (
      select 1 from public.org_members
      where org_id = promoted_polls.org_id and user_id = auth.uid()
    )
  );

drop policy if exists "Anyone can view active promoted polls" on public.promoted_polls;
create policy "Anyone can view active promoted polls"
  on public.promoted_polls for select
  using (status = 'active');

-- ── 8. FUNCTIONS ─────────────────────────────────────────────────
create or replace function public.check_and_award_badges(p_user_id uuid)
returns void language plpgsql security definer as $$
declare
  v_votes_count integer;
  v_is_early    boolean;
begin
  select votes_count into v_votes_count from public.profiles where id = p_user_id;

  if v_votes_count >= 1   then insert into public.user_badges (user_id, badge_id) values (p_user_id, 'first_vote') on conflict do nothing; end if;
  if v_votes_count >= 10  then insert into public.user_badges (user_id, badge_id) values (p_user_id, 'votes_10')   on conflict do nothing; end if;
  if v_votes_count >= 50  then insert into public.user_badges (user_id, badge_id) values (p_user_id, 'votes_50')   on conflict do nothing; end if;
  if v_votes_count >= 100 then insert into public.user_badges (user_id, badge_id) values (p_user_id, 'votes_100')  on conflict do nothing; end if;
  if v_votes_count >= 500 then insert into public.user_badges (user_id, badge_id) values (p_user_id, 'votes_500')  on conflict do nothing; end if;

  select (created_at < '2026-01-01') into v_is_early from public.profiles where id = p_user_id;
  if v_is_early then
    insert into public.user_badges (user_id, badge_id) values (p_user_id, 'early_adopter') on conflict do nothing;
  end if;
end;
$$;

create or replace function public.increment_user_vote_count(p_user_id uuid)
returns void language plpgsql security definer as $$
begin
  update public.profiles set votes_count = votes_count + 1 where id = p_user_id;
  perform public.check_and_award_badges(p_user_id);
end;
$$;

-- ── 9. UPDATED_AT triggers (idempotent: drop + create) ──────────
drop trigger if exists set_organizations_updated_at on public.organizations;
create trigger set_organizations_updated_at
  before update on public.organizations
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_promoted_polls_updated_at on public.promoted_polls;
create trigger set_promoted_polls_updated_at
  before update on public.promoted_polls
  for each row execute procedure public.set_updated_at();

-- ── 10. BACKFILL: votes_count per utenti già loggati ────────────
update public.profiles p
set votes_count = coalesce(sub.cnt, 0)
from (
  select user_id, count(*)::int as cnt
  from public.dilemma_votes
  group by user_id
) sub
where p.id = sub.user_id and p.votes_count = 0;

-- ── 11. DIAGNOSTICA ─────────────────────────────────────────────
-- Esegui questa query DOPO la migration per verificare:
-- select
--   (select count(*) from public.badges) as badges_count,           -- atteso: 13
--   (select count(*) from information_schema.columns
--      where table_name='profiles' and column_name='votes_count') as votes_count_col,
--   (select to_regclass('public.dilemma_votes')) as dilemma_votes_exists,
--   (select to_regclass('public.user_badges')) as user_badges_exists;
