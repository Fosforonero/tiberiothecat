# CURRENT_HANDOFF — SplitVote

Last updated: 8 May 2026 (post-push d59af3c — S7 Mobile play polish + full discovery QA 9/9 PASS)
PM: Matteo
Implementer: Claude Code (Sonnet 4.6)

---

## 1. Production State

- **Branch:** `main`
- **Local vs remote:** `main` is **in sync** with `origin/main`
  - HEAD: `d59af3c` — `merge: S7 — Mobile play page polish (heading + tactile feedback)` (pushed ✅, deployed ✅)
- **Verified deploy:** `d59af3c` (S7 merged 8 May 2026, smoke 8/8 PASS)
- **Full discovery QA verified:** 9/9 PASS (steps #86–94, 8 May 2026) — Home/Category/Trending/Admin EN+IT, sort, regressions

### Feature state

| Feature | State |
|---|---|
| Anonymous vote flow | ✅ working |
| EN/IT routes | ✅ complete + locale-isolated (verified #86–94) |
| AdSense slots (HOME/PLAY/RESULTS) | ✅ live |
| AdSense review | ❌ **not yet requested** — manual step in AdSense dashboard |
| Stripe Premium config | ✅ Price ID set; live checkout QA pending (Task #55) |
| Dynamic discovery EN/IT | ✅ live, locale-isolated, sort verified DESC |
| Admin approve flow EN+IT | ✅ verified (171→172 EN, 173→174 IT) |
| OPENROUTER_MODEL_REVIEW env | ✅ set in Vercel + redeploy completed (Task #3) |
| AI generation (save mode) | ⚠️ **un-blocked technically** but pending re-QA decision matrix |
| S1 — Login icon-only button | ✅ live (`71d4c01`) |
| S2 — NavLinks 3 canonical items | ✅ live (`71d4c01`) |
| S5a — Share section collapsible | ✅ live (`78e2bac`) |
| S5b — Expert Insight collapsible | ✅ live (`9ef426a`) |
| S5c — Sticky "Next dilemma" CTA mobile | ✅ live (`7299607`) |
| S6a — Pixie HUD (streak + level header) | ✅ live (`0549f74`) |
| S7 — Mobile play page polish | ✅ live (`d59af3c`) |
| S8 — Discovery audit (Codex parallel session) | ✅ deployed + 9/9 QA PASS |
| pm-orchestrator agent | ✅ live in `.claude/agents/pm-orchestrator.md` |
| Blog Draft Queue | ✅ deployed and QA'd |
| IT topic landing pages | ✅ live (`2dbb133`) |
| Content Seed Pack Integration v1 | ✅ pushed (`ea2a3b4`) — admin only; dry-run first |

---

## 2. Last Completed Work (Session 8 May 2026)

### Mobile-First Redesign Phase 1 — All Sprints Live ✅

Six mobile-first UI sprints + 1 governance agent + branch cleanup, all merged to main and verified.

**S5c — Sticky "Next dilemma" CTA mobile** (`6c7cc08` → `7299607`):
- `app/results/[id]/ResultsClientPage.tsx` — `showStickyNext = !pathCategory && !!nextId`; `fixed bottom-0 left-0 right-0 z-40 sm:hidden` bar with iOS safe-area-inset; tracks `next_dilemma_clicked` source `results_sticky`
- Smoke 8/8 PASS

**S7 — Mobile play page polish** (`4b5ea78` → `d59af3c`):
- `app/play/[id]/VoteClientPage.tsx` — question heading `text-2xl md:text-3xl` → `text-3xl md:text-4xl`; vote buttons `min-h-[88px]` + `active:scale-[0.97] active:bg-{color}/15` for tactile feedback (4 button instances total)
- Smoke 8/8 PASS

**S8 — Discovery audit (Codex parallel session)**:
- Full end-to-end QA on dynamic discovery EN+IT across home/category/trending/admin/regressions
- Steps #86–94 verified: locale isolation ✅, sort DESC ✅, admin approve flow EN(171→172) + IT(173→174) ✅, voto+results 404 graceful ✅
- Note: specific commit SHAs for S8 are in Codex session log, not tracked here

**HANDOFF refresh** (`816ce58`):
- Document brought from stale `9491d7a` declaration to current state

**Branch cleanup**:
- Removed 4 stale worktrees: `charming-villani-b7ba2b`, `affectionate-banzai-be21a3`, `fervent-elion-b33aa3`, `s5c-sticky-next-cta`, `s7-play-mobile`
- Deleted 9 stale local branches: all `claude/s*` merged sprints + 2 `charming-villani` variants + `affectionate-banzai` + `fervent-elion` + `s7-play-mobile`
- Deleted 6 stale remote branches: all merged sprint branches on `origin`
- **Preserved:** `stripe-preview-qa` (local + remote) — contains Stripe-specific commits not in main

**Verified for all sprints in this session:** typecheck ✅ — build ✅ — git diff --check ✅ — smoke checklist ✅ — visual QA ✅

---

## 3. Pending Manual Steps

| Task | ID | Description | Owner | Priority |
|---|---|---|---|---|
| Stripe MVP premium subscription | #55 | Stripe live checkout QA + webhook + entitlements end-to-end | Matteo | High |
| Stripe Name Change €0.99 | #46 | One-shot purchase price ID + webhook handler | Matteo | Medium |
| Discord OAuth | #24 | OAuth callback URL config in Discord dev portal + Supabase | Matteo | Medium |
| Request AdSense review | — | AdSense dashboard → Sites → splitvote.io | Matteo | High |
| AI generation re-QA decision | — | OPENROUTER_MODEL_REVIEW env DONE; run 4 dry-run scenarios; gate ≥60% accepted + `review_err` < 20% → enable save mode | Matteo | Optional |

All HUMAN_ONLY — require credentials, env vars in Vercel, or external dashboard configuration that Claude cannot perform.

---

## 4. Active Sprint / Next Recommended Step

**Active sprint complete.** `d59af3c` pushed and deployed. Mobile redesign phase 1 done. Discovery QA fully verified.

**Sprint candidates for next session (ordered by autonomy):**

### SAFE_AUTONOMOUS / SEMI_AUTONOMOUS (Claude can execute)

1. **S8b — Mobile UI polish phase 2** — profile page, missions HUD, dashboard refinements (~35–45 min, same pattern as S7)
2. **Blog cluster gap audit** — read-only SEO analysis: existing articles vs research-sources thematic gaps; output `reports/blog-cluster-gaps-DATE.md` (~20–30 min)
3. **Dry-run content factory** — admin API call with `seedPack` mode + `dryRun=true`; output preview JSON (~10–15 min)
4. **IT static scenario localization scaffolding** — add `optionA_it`/`optionB_it`/`question_it` optional fields to `lib/scenarios.ts` types + 1 sample translation as proof of concept

### HUMAN_ONLY (require PM action first)

5. **Stripe MVP** (Task #55) — needs your live keys + webhook config
6. **Stripe Name Change** (Task #46) — needs price ID + webhook
7. **Discord OAuth** (Task #24) — needs OAuth callback URLs
8. **AdSense review request** — needs your dashboard click

---

## 5. Do Not Touch

Without a dedicated sprint and explicit GO:

- **Auth** — Supabase SSR, login callback, auth redirects
- **Stripe** — no changes to pricing/subscription/webhook/entitlements without PM confirmation per task
- **Supabase migrations** — no schema changes
- **Redis voting logic** — `app/api/vote`, `lib/redis.ts`, `dilemma_votes`
- **Middleware** — `middleware.ts`
- **Env vars** — no changes to `.env*` files or Vercel env without PM decision
- **Legal docs** — `LEGAL.md`, privacy policy, terms — only if actual data flows change
- **`stripe-preview-qa` branch** — contains Stripe-specific WIP; do not delete or touch
- **`PRODUCT_STRATEGY.md`** + **`ROADMAP.md`** — currently have unstaged local changes (not by Claude); leave to PM
- **`reports/` directory** — contains historical audits; do not modify retroactively
- **Production deploy/push** — only with explicit PM GO

---

## 6. Known Risks

| Risk | Status |
|---|---|
| Stripe live payment never tested end-to-end | Open — Task #55 |
| AdSense review not yet requested | Open |
| `<html lang="en">` on IT pages | Pre-existing; root layout not locale-scoped |
| EN dilemma card text on IT topic pages | `lib/scenarios.ts` has no IT translations — pre-existing |
| Save mode unblocked technically but no decision made | OPENROUTER_MODEL_REVIEW env now set; re-QA gate decision pending |
| Codex + Claude Code parallel sessions | Risk: doc divergence if both edit governance simultaneously. Mitigation: each session reads HANDOFF first; coordinate via PM |
| PRODUCT_STRATEGY.md + ROADMAP.md unstaged | 79 lines uncommitted as of session close; PM to review and commit |

---

## 7. Safe Autonomous Tasks

Tasks Claude can run without waiting for PM GO (per `## Autonomous / Ralph-style Safe Tasks` in CLAUDE.md):

- `npm run typecheck`
- `npm run build`
- `npm run nightly:check`
- `npm run validate:personality`
- `npm run check:it-copy`
- `git diff --check`
- `git status --short`
- `git log --oneline`
- SEO/copy QA analysis (read-only, local report to `reports/`)
- Content opportunity reports (dry-run only, no DB writes)

**Never autonomously:**
- `git push`
- `git commit` (unless explicitly asked)
- deploy to Vercel
- enable save mode or auto-publish
- write to production DB (Redis/Supabase)
- modify `PRODUCT_STRATEGY.md`, `ROADMAP.md`, `LEGAL.md`, `CLAUDE.md` without explicit GO

---

## 8. Next Session Prompt

```
Ripartenza sessione SplitVote — 9 Maggio 2026 o successivo.

Leggi prima (in questo ordine):
- CLAUDE.md
- CURRENT_HANDOFF.md
- git status --short --branch
- git log --oneline -10

State al 8 maggio sera:
- HEAD main: d59af3c (S7 mobile play polish — pushed e deployed)
- Discovery QA full: 9/9 PASS verificato (#86–94)
- OPENROUTER_MODEL_REVIEW env: SET in Vercel + redeploy DONE
- Mobile redesign phase 1: S1/S2/S5a/S5b/S5c/S6a/S7 tutti live ✅
- Branch cleanup completato (1 worktree solo, branch attivi: main + stripe-preview-qa)
- 79 righe unstaged in PRODUCT_STRATEGY.md + ROADMAP.md (non Claude — PM da committare)
- reports/ ha 1 audit dilemma-visibility-2026-05-07.md (storico, non toccare)

Backlog HUMAN_ONLY aperto:
- Task #55 Stripe MVP premium subscription (credenziali live + webhook)
- Task #46 Stripe Name Change €0.99 (price ID + webhook)
- Task #24 Discord OAuth (callback URLs)
- AdSense review request (dashboard manual click)

Sprint candidates SAFE_AUTONOMOUS/SEMI_AUTONOMOUS (proponi UNO):
1. S8b — Mobile UI polish phase 2 (profile/missions HUD)
2. Blog cluster gap audit (read-only SEO report)
3. Dry-run content factory (Seed Pack batch preview)
4. IT static scenario localization scaffolding

Output atteso:
- Conferma stato repo in 6 righe
- Sprint scelto con motivazione (1 paragrafo)
- Plan sintetico (file toccati, LoC stimato, smoke checklist breve)
- Aspetta GO esplicito prima di implementare
- Nessuna modifica a PRODUCT_STRATEGY.md / ROADMAP.md / LEGAL.md / CLAUDE.md senza GO esplicito
```
