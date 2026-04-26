# SplitVote — What Would the World Choose?

Real-time global voting on impossible moral dilemmas. No right answers — just honest ones.

Live at **[splitvote.io](https://splitvote.io)**

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14.2.3 (App Router, TypeScript) |
| Runtime | Node 20 via `.nvmrc` (`nvm use` in this project only) |
| Styling | Tailwind CSS + custom CSS variables |
| Auth & DB | Supabase (PostgreSQL + Row Level Security) |
| Real-time votes | Upstash Redis (hash per dilemma) |
| AI dilemmas | Anthropic Claude (daily Vercel cron → admin draft queue) |
| Payments | Stripe (one-time name change, premium sub) |
| Analytics | GA4 via first-party proxy |
| Ads | Google AdSense via first-party proxy |
| Deploy | Vercel (auto-deploy on push to main) |

---

## Local Setup

```bash
git clone https://github.com/your-org/splitvote.git
cd splitvote
nvm use
npm install
cp .env.local.example .env.local   # fill in the vars below
npm run dev
```

Requires **Node >= 20** (see `.nvmrc`). Do not change your global/default Node for other projects; run `nvm use` inside this repo.

> Upgrade note: latest stable Next/React are currently a major jump from this codebase (`next@16` / `react@19`). Treat that as a dedicated upgrade sprint after the current production deploy, not as part of the gamification/i18n/feedback push.

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
CRON_SECRET=random-strong-secret

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
| `migration_v2_safe.sql` | dilemma_votes, badges, user_badges, orgs | ✅ Applied |
| `migration_v3_engagement.sql` | XP, streak, companion fields | ✅ Applied |
| `migration_v4_security_hotfix.sql` | pseudonymous identity + RPC grants | ✅ Applied |
| `migration_v5_vote_daily_stats.sql` | admin vote charts incl. anonymous votes | ✅ Applied |
| `migration_v6_feedback.sql` | dilemma quality feedback (🔥 / 👎) | ✅ Applied |

To apply: Supabase dashboard → SQL Editor → New query → paste file contents → Run.

---

## Vercel Cron

The cron job auto-generates new dilemma drafts daily using Claude. Configured in `vercel.json`:

```json
{
  "crons": [{ "path": "/api/cron/generate-dilemmas", "schedule": "0 8 * * *" }]
}
```

Requires `ANTHROPIC_API_KEY` and `CRON_SECRET` in Vercel env vars. Vercel invokes cron with `Authorization: Bearer <CRON_SECRET>`; the admin dry-run endpoint also sends `x-cron-secret` for compatibility.

Generated dilemmas are saved to Redis as **drafts**. They only become public after approval in `/admin`.

---

## Architecture Notes

### Vote flow
1. Cookie dedup (fast path — blocks same browser)
2. IP rate limit (20 votes/hour via Redis)
3. Supabase check for logged-in users (authoritative dedup across devices, 24h change window)
4. Redis increment / replace (atomic, via `incrementVote` / `replaceVote` in `lib/redis.ts`)

### Dynamic dilemma flow
1. Cron fetches trend signals (Google Trends, Reddit, RSS/news; social APIs are feature-flagged for later)
2. Claude generates EN/IT dilemmas with SEO metadata
3. Validation + semantic dedup + scoring (`viralScore`, `seoScore`, `noveltyScore`, `feedbackScore`)
4. Redis draft queue (`dynamic:drafts`)
5. Admin approves/rejects in `/admin`
6. Approved dilemmas move to `dynamic:scenarios` and enter sitemap/public routes

### i18n / SEO
Italian SEO is implemented with a lightweight `/it` route family:
- `/it`
- `/it/trending`
- `/it/play/[id]`
- `/it/results/[id]`
- `/it/category/[category]`
- `/it/faq`, `/it/privacy`, `/it/terms`, `/it/personality`

Sitemap is locale-aware, includes Italian static dilemma URLs, and excludes draft dilemmas.

### Dilemma feedback
Results pages include a lightweight quality signal (`🔥 Interesting` / `👎 Not for me`). Feedback is deduplicated by user or anonymous cookie, stored in Supabase/Redis, and updates dynamic dilemma scoring.

### First-party proxies
`app/api/_g/` proxies GA4 and AdSense to bypass ad blockers. This is a deliberate product choice — see Google's first-party proxy docs. Do not remove without updating analytics/ads setup.

### Stripe webhook
Webhook endpoint: `POST /api/stripe/webhook`. Must be verified with `STRIPE_WEBHOOK_SECRET`.
Test locally: `stripe listen --forward-to localhost:3000/api/stripe/webhook`

### Known issues / TODOs
- Stripe premium subscription/customer portal is still blocked until the compromised key is revoked and replaced in Vercel.
- Full framework upgrade (`next@16`, `react@19`, Node 24 LTS) is intentionally deferred to a dedicated sprint.
- Social trend sources (X/Instagram/TikTok) are scaffolded as feature flags only. Use official APIs/provider contracts; do not add scraping.
- AdSense slot IDs must be real production slots in Vercel env vars.

---

## Deploy

Push to `main` → Vercel auto-builds and deploys. Use a repo-local `.command` script for commit/push so the deployed repo and workspace stay aligned.

```
push_growth_sprint.command  → older growth script, update before reuse
```
