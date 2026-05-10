# CURRENT_HANDOFF — SplitVote

Last updated: 10 May 2026 (post `f75f79e` — personality teaser + G15 blog)
PM: Matteo
Implementer: Claude Code (Sonnet 4.6)

---

## 1. Production State

- **Branch:** `main`
- **Local vs remote:** **in sync** — all commits pushed
- **Last pushed:** `f75f79e`

### Recent commits
| Hash | Description |
|---|---|
| `f75f79e` | feat(retention): personality teaser on results page for logged-in users |
| `1d4b18e` | feat(blog): G15 moral emotions EN+IT — Haidt, disgust, social intuitionism |
| `cdfc48c` | fix(pixie): fall back to votesCount when pixieXp map is empty {} |
| `a1564cd` | docs: update CURRENT_HANDOFF — G14 complete, mission rotation live, session state |
| `4fcab11` | feat(blog): G14 trolley problem moral personality EN+IT |
| `f060ee8` | feat: daily mission rotation with expanded 8-mission pool |
| `dab7e5a` | feat(viral): personality OG card + dynamic share URL with archetype |
| `7bb8336` | fix(mobile): respect iOS safe-area insets on sticky HUD + FAB |

### Feature state

| Feature | State |
|---|---|
| Anonymous vote flow | ✅ working |
| EN/IT routes | ✅ complete + locale-isolated |
| AdSense slots (HOME/PLAY/RESULTS) | ✅ live |
| AdSense review | ✅ requested (10 May 2026) |
| Stripe Premium config | ✅ live, QA done |
| `STRIPE_PRICE_ID_NAME_CHANGE` | ✅ set in Vercel (`price_1TQO0X6MLlYKqmclCj7yMJxb`) |
| `STRIPE_WEBHOOK_SECRET` | ✅ set in Vercel production + preview |
| Stripe Name Change QA (#46) | ✅ DONE — webhook live, endpoint responds correctly |
| Search Console sitemap | ✅ submitted — 433 pages indexed |
| Blog G1→G15 EN+IT | ✅ complete — 25 EN + 25 IT articles (50 total) |
| SEO landings | ✅ 10 EN + 10 IT = 20 landings |
| Blog hreflang audit | ✅ all 50 articles have bilateral alternateSlug — no gaps |
| **Daily mission rotation** | ✅ 8-mission pool, 3 daily + 1 special (50 XP), 7-day cycle |
| **Personality OG card** | ✅ `/api/personality-card?format=og` — 1200×630 horizontal |
| **Dynamic personality share URL** | ✅ `?archetype=X` → personalised OG on every share |
| **Mobile sticky Pixie HUD** | ✅ `MobileStickyHUD` — glassmorphism, XP bar, streak flame |
| **Mobile floating vote FAB** | ✅ `MobileFloatingVoteCTA` — bottom-right, pulse ring, safe area |
| **Level pill in dashboard hero** | ✅ Lv.N · Title · XP/XP |
| **Referral impact card** | ✅ week + all-time referral counts visible |
| **Pixie stage-6 system** | ✅ committed — Ultra Legendary (1000 votes) |
| **Pixie assets all 5 species** | ✅ committed — stage 1-6 + preview sheets |
| **Pixie premium previews** | ✅ asset-only (heart, robot) — not wired to DB/shop |
| **Pixie species selector** | ✅ committed — unlock logic, API, UI |
| **Pixie per-species XP** | ✅ committed + migration run in production |
| **Pixie share card** `/api/pixie-card` | ✅ edge SVG, species accent colours, OG on `/u/[id]` |
| **Profile share button** | ✅ Web Share API + clipboard fallback |
| **Pixie empty-map bug fix** | ✅ `cdfc48c` — dashboard now falls back to votesCount when pixie_xp={} |
| **Personality teaser** | ✅ `f75f79e` — logged-in users nudged to /personality after voting |
| AI generation (save mode) | ⚠️ unblocked technically, re-QA decision pending |

---

## 2. Mission System — current state (10 May 2026)

**Pool expanded to 8 missions:**
| ID | Title | XP | Verification |
|---|---|---|---|
| `vote_3` | Vote on 3 dilemmas | 30 | countVotesToday ≥ 3 |
| `vote_5` | Vote on 5 dilemmas | 45 | countVotesToday ≥ 5 |
| `vote_2_categories` | Explore 2 categories | 25 | categoriesVoted.size ≥ 2 |
| `vote_3_categories` | Explore 3 categories | 40 | categoriesVoted.size ≥ 3 |
| `challenge_friend` | Challenge a friend | 20 | referral_visit event today |
| `share_result` | Share a result | 15 | share event today |
| `share_and_challenge` | Share & challenge | 35 | share event + referral_visit today |
| `daily_dilemma` ⭐ | Dilemma of the Day | 50 | vote today (special — shown daily) |

**Rotation:** 3 daily missions from the 7-strong pool + 1 permanent special (`daily_dilemma`). Deterministic UTC-day index, 7-day cycle.

**XP for new IDs (`vote_5`, `vote_3_categories`, `share_and_challenge`):** direct admin-client `profiles.xp` increment (DB function `award_mission_xp` handles original 5 only).

---

## 3. Blog content inventory (10 May 2026)

**25 EN + 25 IT = 50 articles** (all SSG). SEO landings: 10 EN + 10 IT = 20 total.
Hreflang audit: ✅ all 50 articles bilateral, no gaps.

**G15 (latest):** "Moral Emotions: When Your Gut Feeling Is Your Moral Compass"
- EN: `/blog/moral-emotions-gut-feeling-moral-compass`
- IT: `/it/blog/emozioni-morali-istinto-bussola-morale`
- Topics: Haidt Social Intuitionist Model, elephant/rider, moral dumbfounding, disgust as co-opted pathogen system, guilt/shame/elevation/anger/contempt, Greene dual-process fMRI, Guardian/Strategist/Empath mapping
- 5 CTAs each: organ-harvest, trolley, /personality, G1 (what-is-a-moral-dilemma), G11 (moral-foundations-theory)

---

## 4. Personality Teaser — implementation detail

**File:** `app/results/[id]/ResultsClientPage.tsx`

- Shows after vote to logged-in users only (`isAnon === false && voted !== null`)
- Condition: localStorage key `sv_personality_teaser_dismissed` absent or older than 7 days
- Purple card, EN+IT copy via existing `isIT` flag
- × button sets dismiss timestamp; CTA links to `/personality` or `/it/personality`
- Sits after the AdSense slot + anon sign-up CTA, before sticky next-dilemma bar

---

## 5. Pending Manual Steps

| Task | Description | Owner | Priority |
|---|---|---|---|
| Pixie premium shop | Wire heart/robot species to Stripe, entitlement, selector | Future sprint | Low |
| Stripe checkout live QA | Manual: open `splitvote.io/profile`, click "Upgrade to Premium" | Matteo | Medium |
| Stripe live end-to-end | Full payment loop (checkout → webhook → is_premium=true) with real card | Matteo | Medium |
| AI generation re-QA | 4 dry-run scenarios; gate ≥60% accepted | Matteo | Optional |

---

## 6. Do Not Touch

- Auth, middleware, Redis vote logic, Supabase migrations
- Stripe pricing/subscription/webhook without PM GO
- `PRODUCT_STRATEGY.md` + `ROADMAP.md` — local PM changes, leave to Matteo
- `reports/` — historical audits, do not modify
- Production deploy/push — only with explicit PM GO

---

## 7. Known Risks

| Risk | Status |
|---|---|
| Pixie premium shop | Assets ready, no backend — not visible to users |
| AI save mode decision | OPENROUTER env set; re-QA gate pending |
| `<html lang="en">` on IT pages | Pre-existing, root layout not locale-scoped |
| `PRODUCT_STRATEGY.md` + `ROADMAP.md` | Local PM changes uncommitted |
| Stripe live end-to-end | Backend/webhook verified on Preview; live checkout UI not yet QA'd |

---

## 8. Next Session Prompt

```
Ripartenza sessione SplitVote — post 10 Maggio 2026 (sera).

Leggi prima:
- CLAUDE.md
- CURRENT_HANDOFF.md
- git log --oneline -8
- git status --short

State:
- main in sync con origin — tutto pushato (last: f75f79e)
- Blog: 25 EN + 25 IT (G1→G15 completo) — hreflang audit: tutto OK
- Mission pool espanso a 8, daily rotation attiva (3 daily + 1 special/50XP)
- Personality OG card con dynamic share URL (?archetype=X)
- Mobile: sticky HUD + FAB (Pixie, XP bar, streak, safe area iOS)
- Dashboard: level pill, referral impact card, profile share button
- Pixie: sistema completo + bug fix empty-map (cdfc48c)
- Personality teaser: card viola su results page per utenti loggati (f75f79e)

Prossimi step autonomi suggeriti:
- G16 blog article — "Free Will and Moral Responsibility: Can You Be Blamed for What You Couldn't Help?" (compatibilismo, Strawson, P.F. Strawson reactive attitudes)
- Homepage: mostrare il teaser personalità anche sull'homepage per utenti loggati (component client-side leggero dopo DailyDilemma)
- Blog cluster: articolo su "The Bystander Effect and Moral Diffusion of Responsibility" (diverso da G13 che era sul bystander più generale)

HUMAN_ONLY:
- Stripe live end-to-end QA (carta reale su splitvote.io/profile)
- Pixie premium shop (needs GO Stripe)
- git push
- Supabase migrations
```
