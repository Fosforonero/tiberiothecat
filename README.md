# SplitVote — What Would the World Choose?

Real-time global voting on impossible moral dilemmas. No right answers — just honest ones.

Live at **[splitvote.io](https://splitvote.io)**

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14.2 (App Router, TypeScript) |
| Styling | Tailwind CSS + custom CSS variables |
| Auth & DB | Supabase (PostgreSQL + Row Level Security) |
| Real-time votes | Upstash Redis (hash per dilemma) |
| AI dilemmas | Anthropic Claude (daily cron via Vercel) |
| Payments | Stripe (one-time name change, premium sub) |
| Analytics | GA4 via first-party proxy |
| Ads | Google AdSense via first-party proxy |
| Deploy | Vercel (auto-deploy on push to main) |

---

## Local Setup

```bash
git clone https://github.com/your-org/splitvote.git
cd splitvote
npm install
cp .env.local.example .env.local   # fill in the vars below
npm run dev
```

Requires **Node >= 20** (see `.nvmrc`).

---

## Environment Variables

All vars must be set in Vercel → Settings → Environment Variables (and in `.env.local` for local dev).

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Upstash Redis
KV_REST_API_URL=https://xxxx.upstash.io
KV_REST_API_TOKEN=Axxx...

# Anthropic (daily dilemma cron)
ANTHROPIC_API_KEY=sk-ant-...

# Stripe
STRIPE_SECRET_KEY=sk_live_...        # NEVER commit — set in Vercel only
STRIPE_WEBHOOK_SECRET=whsec_...     # from stripe listen or Stripe dashboard
STRIPE_PRICE_ID_NAME_CHANGE=price_... # €0.99 one-time
STRIPE_PRICE_ID_PREMIUM_MONTHLY=price_... # premium subscription

# Public
NEXT_PUBLIC_BASE_URL=https://splitvote.io
NEXT_PUBLIC_ADSENSE_SLOT_RESULTS=1234567890
NEXT_PUBLIC_ADSENSE_SLOT_PLAY=1234567890
```

---

## Supabase Migrations

Migrations are in `supabase/`. Apply them in order via the **SQL Editor** in the Supabase dashboard.

| File | Description | Status |
|---|---|---|
| `schema.sql` | Base schema (profiles, user_polls, etc.) | ✅ Applied |
| `migration_v2_safe.sql` | dilemma_votes, badges, user_badges, orgs | Apply manually |
| `migration_v3_engagement.sql` | XP, streak, companion fields | Apply manually |

To apply: Supabase dashboard → SQL Editor → New query → paste file contents → Run.

---

## Vercel Cron

The cron job auto-generates new dilemmas daily using Claude. Configured in `vercel.json`:

```json
{
  "crons": [{ "path": "/api/cron/generate-dilemmas", "schedule": "0 8 * * *" }]
}
```

Requires `ANTHROPIC_API_KEY` in Vercel env vars. Verify in Vercel → Cron Jobs tab.

---

## Architecture Notes

### Vote flow
1. Cookie dedup (fast path — blocks same browser)
2. IP rate limit (20 votes/hour via Redis)
3. Supabase check for logged-in users (authoritative dedup across devices, 24h change window)
4. Redis increment / replace (atomic, via `incrementVote` / `replaceVote` in `lib/redis.ts`)

### First-party proxies
`app/api/_g/` proxies GA4 and AdSense to bypass ad blockers. This is a deliberate product choice — see Google's first-party proxy docs. Do not remove without updating analytics/ads setup.

### Stripe webhook
Webhook endpoint: `POST /api/stripe/webhook`. Must be verified with `STRIPE_WEBHOOK_SECRET`.
Test locally: `stripe listen --forward-to localhost:3000/api/stripe/webhook`

### Known issues / TODOs
- ESLint 9 flat config vs eslint@8: `ignoreDuringBuilds: true` is set in `next.config.ts`. Lint locally with `npx eslint .` using the project config.
- Discord OAuth (#24): provider configured in Supabase, verify callback URL is set to `https://splitvote.io/auth/callback`.
- i18n (Sprint #48): `next-intl` not yet integrated. IT content lives at `/it` (static page).

---

## Deploy

Push to `main` → Vercel auto-builds and deploys. Use the `.command` scripts in the repo root to copy workspace files, commit, and push from the git repo on the external drive.

```
push_audit_v2.command    → Sync + reliability fixes
push_engagement.command  → XP, missions, companion
push_story_card.command  → IG/TikTok vertical share
```
