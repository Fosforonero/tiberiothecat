# CURRENT_HANDOFF — SplitVote

Last updated: 10 May 2026 (post `2c77bb4` — Pixie per-species XP + selector + asset refresh)
PM: Matteo
Implementer: Claude Code (Sonnet 4.6)

---

## 1. Production State

- **Branch:** `main`
- **Local vs remote:** `main` is **ahead of** `origin/main` by 11 commits
- **Last pushed:** `b9e80f1`

### Recent commits (unpushed)
| Hash | Description |
|---|---|
| `2c77bb4` | assets(pixie): regenerate all species PNG |
| `e3e7f05` | feat(pixie): per-species independent XP levels |
| `7f7da45` | feat(pixie): species selector UI + unlock logic + API support |
| `0abd6a9` | feat(pixie): stage-6 system + full asset set (5 species + 2 premium) |
| `f0fd75b` | docs: CURRENT_HANDOFF refresh |
| `60fd479` | fix(missions): locale-aware deep links |
| `8bf24b9` | feat(g12): cross-cluster article EN+IT |
| `471a99d` | feat(g11): SEO landing experimental-moral-psychology EN+IT |
| `525dcb5` | docs: CURRENT_HANDOFF refresh |
| `e52dfa6` | feat: btn-neon-blue + internal linking G4-G10 |

### Feature state

| Feature | State |
|---|---|
| Anonymous vote flow | ✅ working |
| EN/IT routes | ✅ complete + locale-isolated |
| AdSense slots (HOME/PLAY/RESULTS) | ✅ live |
| AdSense review | ✅ requested (10 May 2026) |
| Stripe Premium config | ✅ live, QA done (10 May 2026) |
| `STRIPE_PRICE_ID_NAME_CHANGE` | ✅ **set in Vercel** (`price_1TQO0X6MLlYKqmclCj7yMJxb`) — production+preview |
| STRIPE_SECRET_KEY duplicates | ✅ **cleaned up** — 1 prod + 1 preview, branch duplicate removed |
| Discord OAuth (#24) | ✅ **CLOSED** — redirect URI + Supabase config done |
| Search Console sitemap | ✅ submitted — 433 pages indexed |
| G3 QA production | ✅ 6/6 tests passed |
| Dynamic discovery EN/IT | ✅ live, locale-isolated |
| Admin approve flow EN+IT | ✅ verified |
| OPENROUTER_MODEL_REVIEW env | ✅ set in Vercel |
| AI generation (save mode) | ⚠️ unblocked technically, re-QA decision pending |
| Blog G1→G12 EN+IT | ✅ complete — 22 EN + 22 IT articles |
| SEO landings | ✅ 10 EN + 10 IT = 20 landings, all clusters covered |
| Static pages | ✅ 206 (build verified) |
| btn-neon-blue | ✅ committed |
| Internal linking G4-G10 | ✅ committed |
| Mission deep links locale-aware | ✅ committed |
| **Pixie stage-6 system** | ✅ committed (`0abd6a9`) — Ultra Legendary (1000 votes) |
| **Pixie assets all 5 species** | ✅ committed — stage 1-6 + preview sheets |
| **Pixie premium previews** | ✅ asset-only (heart, robot) — not wired to DB/shop |
| **Pixie species selector** | ✅ committed (`7f7da45`) — unlock logic, API, UI |
| **Pixie per-species XP** | ✅ committed (`e3e7f05`) — independent levels per species |
| Pixie per-species XP migration | ⚠️ **pending** — run `migration_v4_pixie_xp.sql` in Supabase |
| Stripe Name Change feature (#46) | ⚠️ env set, code complete — webhook handler needs testing |

---

## 2. Pixie system — current state

### What works (post-push + migration)

**5 base species** — Spark, Glitch (blip), Leaf (momo), Moonlight (shade), Hologram (orbit)
- PNG assets stage 1-6 + preview sheet for each
- Each species tracks its own vote count independently in `profiles.pixie_xp` (JSONB)
- Stage thresholds: 0 / 10 / 50 / 100 / 500 / 1000 votes → stages 1-6
- Stage 6 = "Ultra Legendary" / "Ultra Leggendario"

**Species selector** (dashboard, between CompanionDisplay and DailyMissions):
- Shows all 5 base species with current stage image + stage badge
- Locked species greyed out with unlock hint
- Tap unlocked → saves via `POST /api/profile/update { companionSpecies }` → `router.refresh()`

**XP increment**:
- After each confirmed vote → `POST /api/pixie/xp` (fire-and-forget from VoteClientPage)
- Increments `pixie_xp->>{current_species}` by 1 in profiles table
- Falls back gracefully if column missing (pre-migration)

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

### Migration needed (HUMAN ACTION)
```sql
-- Run in Supabase SQL editor:
alter table profiles
  add column if not exists pixie_xp jsonb not null default '{}';
```
File: `supabase/migration_v4_pixie_xp.sql`

---

## 3. Blog content inventory (10 May 2026)

**22 EN + 22 IT = 44 articles** (all SSG). SEO landings: 10 EN + 10 IT = 20 total.
All 11 MoralClusters fully covered (article + landing). No gaps.

---

## 4. Pending Manual Steps

| Task | ID | Description | Owner | Priority |
|---|---|---|---|---|
| **git push** | — | 11 commits ahead of origin | Matteo | **HIGH** |
| **Pixie migration** | — | Run `migration_v4_pixie_xp.sql` in Supabase | Matteo | **HIGH** |
| Stripe Name Change QA | #46 | End-to-end test of €0.99 name change flow | Matteo | Medium |
| Pixie premium shop | — | Wire heart/robot species to Stripe, entitlement, selector | Future sprint | Low |
| AI generation re-QA | — | 4 dry-run scenarios; gate ≥60% accepted | Matteo | Optional |

**Completed this session by Matteo:**
- ✅ Task #24 Discord OAuth — fully done (redirect URI + Supabase config)
- ✅ `STRIPE_PRICE_ID_NAME_CHANGE` set in Vercel production+preview
- ✅ STRIPE_SECRET_KEY env cleanup (branch duplicate removed)
- ✅ Search Console sitemap submitted (433 pages indexed)
- ✅ G3 blog QA production (6/6 pass)

---

## 5. Do Not Touch

- Auth, middleware, Redis vote logic, Supabase migrations (except the one above)
- Stripe pricing/subscription/webhook without PM GO
- `PRODUCT_STRATEGY.md` + `ROADMAP.md` — local PM changes, leave to Matteo
- `reports/` — historical audits, do not modify
- Production deploy/push — only with explicit PM GO

---

## 6. Known Risks

| Risk | Status |
|---|---|
| 11 commits not pushed | Needs `git push` before Vercel deploy |
| `pixie_xp` column missing | Pre-migration: all species show stage 1 (fallback safe, no crash) |
| Stripe Name Change | Env set, code complete — live QA not yet confirmed |
| `<html lang="en">` on IT pages | Pre-existing, root layout not locale-scoped |
| AI save mode decision | OPENROUTER env set; re-QA gate pending |
| `PRODUCT_STRATEGY.md` + `ROADMAP.md` | Local PM changes uncommitted |

---

## 7. Next Session Prompt

```
Ripartenza sessione SplitVote — 10 Maggio 2026.

Leggi prima:
- CLAUDE.md
- CURRENT_HANDOFF.md
- git log --oneline -12
- git status --short

State:
- 11 commit ahead of origin (non ancora pushati)
- Blog: 22 EN + 22 IT (G1→G12), 20 SEO landings, 206 static pages
- Pixie: sistema completo (stage 1-6, 5 specie, selector, per-species XP)
- Migration PENDENTE: migration_v4_pixie_xp.sql (Matteo deve runnarla)

Completati da Matteo in sessione:
- Task #24 Discord OAuth ✅
- STRIPE_PRICE_ID_NAME_CHANGE in Vercel ✅
- STRIPE_SECRET_KEY cleanup ✅
- Search Console sitemap 433 pagine ✅

Prossimi step autonomi possibili:
- Pixie Phase 3 share card (/api/pixie-card) — dopo migration
- Premium shop Pixie (heart/robot) — richiede GO Stripe
- G13 articolo cross-cluster (opzionale)

HUMAN_ONLY:
- git push
- migration_v4_pixie_xp.sql in Supabase
- Stripe Name Change live QA (#46)
```
