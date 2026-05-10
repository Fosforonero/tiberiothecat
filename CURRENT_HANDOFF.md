# CURRENT_HANDOFF — SplitVote

Last updated: 10 May 2026 (post `49cf8c2` — virality sprint, launch-ready state)
PM: Matteo
Implementer: Claude Code (Sonnet 4.6)

---

## 1. Production State

- **Branch:** `main`
- **Local vs remote:** **in sync** — all commits pushed
- **Last pushed:** `49cf8c2`

### Recent commits
| Hash | Description |
|---|---|
| `49cf8c2` | feat(virality): profile share button + public profile card on dashboard |
| `8a9a804` | feat(pixie): share card SVG endpoint + profile OG image + richer share text |
| `2c77bb4` | assets(pixie): regenerate all species PNG |
| `e3e7f05` | feat(pixie): per-species independent XP levels |
| `7f7da45` | feat(pixie): species selector UI + unlock logic + API support |
| `0abd6a9` | feat(pixie): stage-6 system + full asset set (5 species + 2 premium) |

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
| Stripe Name Change QA (#46) | ✅ **DONE** — webhook live, endpoint responds correctly |
| STRIPE_SECRET_KEY duplicates | ✅ cleaned up |
| Discord OAuth (#24) | ✅ CLOSED |
| Search Console sitemap | ✅ submitted — 433 pages indexed |
| Blog G1→G12 EN+IT | ✅ complete — 22 EN + 22 IT articles |
| SEO landings | ✅ 10 EN + 10 IT = 20 landings |
| Static pages | ✅ 206 (build verified) |
| **Pixie stage-6 system** | ✅ committed — Ultra Legendary (1000 votes) |
| **Pixie assets all 5 species** | ✅ committed — stage 1-6 + preview sheets |
| **Pixie premium previews** | ✅ asset-only (heart, robot) — not wired to DB/shop |
| **Pixie species selector** | ✅ committed — unlock logic, API, UI |
| **Pixie per-species XP** | ✅ committed + **migration run in production** |
| **Pixie share card** `/api/pixie-card` | ✅ committed — edge SVG, species accent colours |
| **Profile OG image** `/u/[id]` | ✅ wired to pixie-card, correct per-species stage |
| **Share button** `/u/[id]` | ✅ Web Share API + clipboard fallback |
| **"My public profile" card** dashboard | ✅ View + Share buttons, EN/IT |
| AI generation (save mode) | ⚠️ unblocked technically, re-QA decision pending |

---

## 2. Pixie system — complete state

**5 base species** — Spark, Glitch (blip), Leaf (momo), Moonlight (shade), Hologram (orbit)
- PNG assets stage 1-6 + preview sheet for each
- Each species tracks its own vote count independently in `profiles.pixie_xp` (JSONB)
- Stage thresholds: 0 / 10 / 50 / 100 / 500 / 1000 votes → stages 1-6
- `pixie_xp` column **in production** (migration run and verified by Matteo 10 May 2026)

**Species selector** — dashboard, between CompanionDisplay and DailyMissions

**XP increment** — fire-and-forget POST `/api/pixie/xp` from VoteClientPage after confirmed vote

**Share card** — `/api/pixie-card?species=X&stage=N&name=Name&locale=en`
- Edge SVG 1200×630, species accent colour, rarity badge, glow effect, 1h cache
- Wired as OG image on `/u/[id]` profile pages

**Viral loop:**
```
vote → Pixie grows → level-up modal → share button
dashboard → "My public profile" card → /u/[id]
/u/[id] → Pixie OG card → Share button → friend joins
```

**Unlock conditions:**
| Species | Condition |
|---|---|
| Spark, Glitch | Always available |
| Leaf (momo) | 10 votes (global) |
| Moonlight (shade) | 7-day streak |
| Hologram (orbit) | 100 votes (global) |

**Premium (not wired yet):**
- `heart` and `robot` — PNG assets stage 1-6 committed
- Not in `CompanionSpecies` type, not in COMPANIONS array
- No DB, no Stripe, no selector entry — waiting for shop sprint

---

## 3. Blog content inventory (10 May 2026)

**22 EN + 22 IT = 44 articles** (all SSG). SEO landings: 10 EN + 10 IT = 20 total.
All 11 MoralClusters fully covered. No gaps.

G13 in progress this session (see section 7 for topic).

---

## 4. Pending Manual Steps

| Task | ID | Description | Owner | Priority |
|---|---|---|---|---|
| Pixie premium shop | — | Wire heart/robot species to Stripe, entitlement, selector | Future sprint | Low |
| AI generation re-QA | — | 4 dry-run scenarios; gate ≥60% accepted | Matteo | Optional |
| G13 blog article | — | Cross-cluster: moral inaction / bystander psychology EN+IT | In progress | Low |

**Completed this session:**
- ✅ Pixie system (stage-6, 5 species, selector, per-species XP, share card, profile OG)
- ✅ `migration_v4_pixie_xp.sql` run in production (Matteo)
- ✅ Stripe Name Change QA end-to-end — webhook live and verified (Matteo)
- ✅ Discord OAuth #24 — fully done (Matteo)
- ✅ STRIPE_PRICE_ID_NAME_CHANGE + STRIPE_WEBHOOK_SECRET set in Vercel (Matteo)
- ✅ STRIPE_SECRET_KEY cleanup (Matteo)
- ✅ Search Console sitemap 433 pages (Matteo)
- ✅ Profile share button + public profile card on dashboard
- ✅ All 14 commits pushed — main in sync with origin

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
| Pixie premium shop | Assets ready, no backend — not visible to users |
| AI save mode decision | OPENROUTER env set; re-QA gate pending |
| `<html lang="en">` on IT pages | Pre-existing, root layout not locale-scoped |
| `PRODUCT_STRATEGY.md` + `ROADMAP.md` | Local PM changes uncommitted |

---

## 7. Next Session Prompt

```
Ripartenza sessione SplitVote — post launch (11 Maggio 2026+).

Leggi prima:
- CLAUDE.md
- CURRENT_HANDOFF.md
- git log --oneline -8
- git status --short

State:
- main in sync con origin — tutto pushato
- Launch day: sistema completo, viral loop attivo
- Blog: 22 EN + 22 IT (G1→G12), G13 opzionale in progress
- Pixie: sistema completo (stage 1-6, 5 specie, selector, per-species XP, share card, OG profile)
- Migration pixie_xp: già in produzione
- Stripe Name Change: QA completato, live

Viral loop attivo:
- /api/pixie-card → OG image su /u/[id]
- Share button su /u/[id] e dashboard
- Level-up modal con share text localizzato

Prossimi step autonomi possibili:
- G13 articolo (moral inaction / bystander effect EN+IT) — opzionale
- Ottimizzazioni homepage/landing page
- Analytics review post-launch

HUMAN_ONLY:
- git push
- Stripe / Supabase migrations
- Pixie premium shop (needs GO Stripe)
```
