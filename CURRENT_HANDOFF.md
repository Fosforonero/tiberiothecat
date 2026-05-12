# CURRENT_HANDOFF — SplitVote

Last updated: 12 May 2026 (post Sprint A/B/C + launch prep)
PM: Matteo
Implementer: Claude Code (Sonnet 4.6 / Opus 4.7)

---

## 1. Production State

- **Branch:** `main`
- **Local vs remote:** **in sync** — all commits pushed
- **Last pushed:** `2de5d1a`

### Recent commits (today)
| Hash | Description |
|---|---|
| `2de5d1a` | fix(launch): html[lang] on IT routes, www redirect, focus rings verified |
| `0ad65f0` | ui(Sprint C): consolidate rarity tokens, A/B color consistency, dashboard i18n |
| `1927b8a` | feat(Sprint B): redesign PixieSelector — Currently Equipped, filter tabs, full i18n |
| `6ef5316` | perf(Sprint A): ISR for public profiles + blog, locale in dashboard, lazy-load modals |
| `17852b0` | fix(dashboard): remove invalid votesToday prop on DailyMissions |
| `f75f79e` | feat(retention): personality teaser on results page for logged-in users |

---

## 2. What changed today (12 May 2026)

### Sprint A — Performance Pass
- `/u/[id]/page.tsx`: `force-dynamic` removed → `revalidate:3600`; `createPublicClient()` (no cookies → ISR-cacheable at Vercel edge)
- `lib/supabase/server.ts`: added `createPublicClient()` — anon key, no cookie dependency
- `app/blog/[slug]/page.tsx` (EN + IT): `force-dynamic` → `revalidate:3600`
- `app/dashboard/page.tsx`: reads `lang-pref` cookie → passes `locale` to CompanionDisplay + DailyMissions + PixieSelector; `next/dynamic` for OnboardingModal + BadgeSection

### Sprint B — PixieSelector Redesign + i18n
- `components/PixieSelector.tsx` fully rewritten:
  - "Currently Equipped" banner showing active skin + rarity chip
  - Filter tabs All / Owned / Store on Pixie skin grid (owned count badge)
  - Non-owned items: shop link instead of greyed lock
  - Full COPY object EN/IT — no more hardcoded Italian

### Sprint C — UI Polish + i18n
- `lib/rarity.ts`: single source for RARITY_STYLES + RARITY_GLOW + RARITY_ORDER
- Removed 4 inline duplicates (u/[id], dashboard, BadgeSection, ProfileClient)
- A/B color consistency: dashboard vote history blue/purple → red/blue (A=red, B=blue app-wide)
- Dashboard stats grid: `grid-cols-4` → `grid-cols-2 sm:grid-cols-4` (mobile fix)
- Dashboard full i18n: COPY EN/IT for all visible strings; STATUS_BADGE localized

### Launch Fixes
- `app/layout.tsx`: inline script sets `html[lang]='it'` for /it/* routes (avoids headers() which would break ISR)
- `vercel.json`: 301 redirect www.splitvote.io → splitvote.io
- `LAUNCH_AUDIT.md`: www redirect marked complete

---

## 3. Feature State

| Feature | State |
|---|---|
| Anonymous vote flow | ✅ working |
| EN/IT routes | ✅ complete + locale-isolated |
| html[lang] on IT pages | ✅ fixed via inline script (12 May 2026) |
| www → non-www redirect | ✅ vercel.json 301 (12 May 2026) |
| Dashboard full i18n | ✅ complete (12 May 2026) |
| PixieSelector redesign | ✅ Currently Equipped + tabs + i18n (12 May 2026) |
| RARITY_STYLES consolidated | ✅ lib/rarity.ts (12 May 2026) |
| Public profile ISR | ✅ revalidate:3600 + createPublicClient (12 May 2026) |
| Blog ISR (EN+IT) | ✅ revalidate:3600 (12 May 2026) |
| A/B color consistency | ✅ red/blue everywhere (12 May 2026) |
| Mobile stats grid | ✅ grid-cols-2 sm:grid-cols-4 (12 May 2026) |
| AdSense slots | ⚠️ slot IDs not set — needs real IDs from Matteo |
| Stripe Premium live QA | ⚠️ Preview OK; live checkout with real card pending |
| AdSense account approval | ⚠️ check status in Google AdSense dashboard |
| Upstash Redis backup | ⚠️ verify automatic backups enabled |
| Supabase PITR backup | ⚠️ verify Point-in-Time Recovery configured |
| Resend SPF/DKIM | ⚠️ verify DNS records in Resend dashboard |
| Cloudflare Email Routing | ⚠️ set up forwarding for @splitvote.io aliases |

---

## 4. Pending Manual Steps (Matteo only)

| Task | Description | Priority |
|---|---|---|
| **Stripe live QA** | splitvote.io/profile → Upgrade to Premium → real card → verify is_premium=true in Supabase | 🔴 HIGH |
| **AdSense slot IDs** | Get real IDs from AdSense → set NEXT_PUBLIC_ADSENSE_SLOT_HOME/PLAY/RESULTS in Vercel | 🔴 HIGH |
| **AdSense approval** | Check dashboard.google.com/adsense — requested 10 May | 🔴 HIGH |
| **migration_v18** | Run `supabase/migration_v18_pixie_avatar.sql` on production | 🟡 MEDIUM |
| **Stripe cosmetics env vars** | 14 price IDs for store (STRIPE_PRICE_PIXIE_CROWN etc.) | 🟡 MEDIUM |
| **Redis backup** | Upstash console → verify automatic backups enabled | 🟡 MEDIUM |
| **Supabase PITR** | Supabase → Settings → Backups → enable PITR | 🟡 MEDIUM |
| **Resend DNS** | Verify SPF + DKIM for splitvote.io in Resend dashboard | 🟡 MEDIUM |
| **Cloudflare Email** | Email Routing → aliases for @splitvote.io | 🟡 MEDIUM |

---

## 5. Do Not Touch

- Auth, middleware, Redis vote logic, Supabase migrations
- Stripe pricing/subscription/webhook without PM GO
- `PRODUCT_STRATEGY.md` + `ROADMAP.md` — local PM changes, leave to Matteo
- `reports/` — historical audits, do not modify
- Production deploy/push — only with explicit PM GO

---

## 6. Known Risks

| Risk | Status |
|---|---|
| Stripe live end-to-end | Preview verified; live checkout with real card not yet QA'd |
| Pixie premium shop (heart/robot) | Assets ready, no Stripe backend — not visible to users |
| AdSense approval | Requested 10 May — status unknown |
| GDPR/CCPA legal review | Required before scaling >50k users/month |
| Stripe cosmetics env vars | 14 price IDs missing → store items show "in arrivo" |
| migration_v18 | use_pixie_avatar column must be run on production |

---

## 7. Next Session Prompt

```
Ripartenza sessione SplitVote — post 12 Maggio 2026.

Leggi prima:
- CLAUDE.md
- CURRENT_HANDOFF.md
- git log --oneline -8
- git status --short

State:
- main in sync con origin — tutto pushato (last: 2de5d1a)
- Sprint A/B/C completati oggi:
  - ISR per profile pubblici + blog (Sprint A)
  - PixieSelector redesignato con Currently Equipped + tabs + i18n (Sprint B)
  - RARITY_STYLES consolidato in lib/rarity.ts, A/B colors consistenti, dashboard i18n (Sprint C)
- html[lang] IT fix live (inline script in layout)
- www redirect live (vercel.json 301)

Pending (Matteo):
- Stripe live QA con carta reale
- AdSense slot IDs + approvazione account
- migration_v18 su Supabase production
- 14 env vars Stripe cosmetics store

Prossimi passi codice suggeriti:
1. G16 blog article — "Free Will and Moral Responsibility" (compatibilismo, Strawson)
2. Homepage personality teaser per utenti loggati (leggero, client-side)
3. Dopo migration_v18: smoke test pixie avatar toggle

HUMAN_ONLY:
- Stripe live checkout QA
- AdSense slot IDs e verifica approvazione
- Supabase migrations
- Backup configuration (Upstash + Supabase)
- git push autonomo
```
