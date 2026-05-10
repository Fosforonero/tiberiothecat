# CURRENT_HANDOFF — SplitVote

Last updated: 10 May 2026 (post-push `67ff0b9` — G6 moral foundations EN+IT)
PM: Matteo
Implementer: Claude Code (Sonnet 4.6)

---

## 1. Production State

- **Branch:** `main`
- **Local vs remote:** `main` is **in sync** with `origin/main`
  - HEAD: `67ff0b9` — `Merge G6: moral foundations theory EN+IT blog articles`
- **Previous verified deploy:** `d59af3c` (S7 merged 8 May 2026, smoke 8/8 PASS)
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
| S8c — Mobile touch active states | ✅ live (`fb2b76a`) |
| pm-orchestrator agent | ✅ live in `.claude/agents/pm-orchestrator.md` |
| Blog Draft Queue | ✅ deployed and QA'd |
| IT topic landing pages | ✅ live (`2dbb133`) |
| Content Seed Pack Integration v1 | ✅ pushed (`ea2a3b4`) — admin only; dry-run first |
| DilemmaCard share button | ✅ live (`c25184c`) |
| Blog EN/IT parity fix | ✅ live (`a6e5c3a`) |
| G1 AI Ethics article EN+IT | ✅ live (`6ce40be`) |
| G2 Loyalty vs Honesty article EN+IT | ✅ live (`372d085`) |
| G3 Ethics Trio EN+IT | ✅ live (`98b53c2`) — consequentialism + deontology + virtue ethics |
| G4 Harm Prevention article EN+IT | ✅ live (`088a37d`) — doing vs allowing harm |
| G5 Privacy article EN+IT | ✅ live (`025ee0f`) — privacy in public voting |
| G6 Moral Foundations article EN+IT | ✅ live (`67ff0b9`) — MFT split into standalone cluster |
| G7 Ethics theory SEO landings | ✅ live (`bff5073`) — consequentialism/deontology/virtue-ethics EN+IT |
| G9 Internal linking refresh | ✅ live (`b8718c7`) — cross-links from old articles to G3 |

---

## 2. Blog content inventory (10 May 2026)

**19 EN + 19 IT = 38 articles total** (all SSG-generated)

### EN articles
1. `what-is-a-moral-dilemma`
2. `trolley-problem-explained`
3. `why-people-love-impossible-choices`
4. `hard-would-you-rather-questions`
5. `trolley-problem-statistics`
6. `ethical-dilemmas-everyday-life`
7. `what-is-splitvote`
8. `how-anonymous-voting-works`
9. `how-to-read-splitvote-results`
10. `what-your-moral-personality-means`
11. `moral-dilemmas-examples`
12. `ai-ethics-what-40-million-people-chose` (G1)
13. `loyalty-vs-honesty-when-they-collide` (G2)
14. `consequentialism-the-greatest-good` (G3)
15. `deontology-some-things-are-always-wrong` (G3)
16. `virtue-ethics-what-would-a-good-person-do` (G3)
17. `doing-vs-allowing-harm` (G4)
18. `privacy-in-public-voting` (G5)
19. `moral-foundations-theory-why-good-people-disagree` (G6)

**IT (19):** full parity — every EN article has an IT pair via `alternateSlug`.

### SEO landing pages (lib/seo-topics.ts) — 9 total
EN: `/trolley-problem`, `/ai-ethics-dilemmas`, `/loyalty-vs-honesty`, `/consequentialism`, `/deontology`, `/virtue-ethics`
IT: `/it/problema-del-carrello`, `/it/dilemmi-etici-intelligenza-artificiale`, `/it/lealta-vs-onesta`, `/it/consequenzialismo`, `/it/deontologia`, `/it/etica-della-virtu`

---

## 3. Last Completed Work (Session 10 May 2026)

### S8c — Mobile Touch Feedback (`fb2b76a`)
- `app/globals.css` — `.card-neon:active` blue neon burst + scale(0.99) on `@media (hover: none)`; new `.card-neon-yellow` with 0.15s transition + stronger golden glow on active; both in reduced-motion block
- `components/DailyDilemma.tsx` — added `card-neon-yellow` class to wrapper div; `active:scale-[0.97] active:bg-yellow-300` to CTA button
- `app/page.tsx` + `app/it/page.tsx` — game loop numbers 1/2/3 now have `neon-text-blue/purple/yellow` glow (EN + IT parity)

### G5 Privacy article (`025ee0f`)
- `lib/blog.ts` — `privacy-in-public-voting` (EN) + `privacy-nel-voto-pubblico` (IT); 5 play CTAs; bridges anonymous voting + AI surveillance + GDPR

### G6 Moral Foundations article (`67ff0b9`)
- `lib/blog.ts` — `moral-foundations-theory-why-good-people-disagree` (EN) + `teoria-fondamenti-morali` (IT); 5 play CTAs covering all 6 foundations; splits MFT content from `what-your-moral-personality-means` into dedicated cluster; MFT disclaimer included

---

## 4. Pending Manual Steps

| Task | ID | Description | Owner | Priority |
|---|---|---|---|---|
| Stripe MVP premium subscription | #55 | Stripe live checkout QA + webhook + entitlements end-to-end | Matteo | High |
| Stripe Name Change €0.99 | #46 | One-shot purchase price ID + webhook handler | Matteo | Medium |
| Discord OAuth | #24 | OAuth callback URL config in Discord dev portal + Supabase | Matteo | Medium |
| Request AdSense review | — | AdSense dashboard → Sites → splitvote.io | Matteo | High |
| AI generation re-QA decision | — | Run 4 dry-run scenarios; gate ≥60% accepted + `review_err` < 20% → enable save mode | Matteo | Optional |

All HUMAN_ONLY — require credentials, env vars in Vercel, or external dashboard configuration.

---

## 5. Blog cluster gap status (post-G1→G6 + G7 + G9)

| Cluster | Article | Landing | Status |
|---|---|---|---|
| trolley-problem | ✅ 2 articles | ✅ `/trolley-problem` | STRONG |
| harm-prevention | ✅ G4 doing-vs-allowing | (folded in trolley landing) | RESOLVED |
| ai-ethics | ✅ G1 | ✅ `/ai-ethics-dilemmas` | STRONG |
| privacy | ✅ G5 | — | RESOLVED (no landing yet) |
| loyalty-honesty | ✅ G2 | ✅ `/loyalty-vs-honesty` | STRONG |
| moral-foundations | ✅ G6 standalone | — | RESOLVED (no landing yet) |
| consequentialism | ✅ G3 | ✅ `/consequentialism` | STRONG |
| deontology | ✅ G3 | ✅ `/deontology` | STRONG |
| virtue-ethics | ✅ G3 | ✅ `/virtue-ethics` | STRONG |
| experimental-moral-psychology | 1 tangential | — | ⚠️ Gap |
| bioethics | 0 | — | 🔴 PM decision: build or prune `'bioethics'` from MoralCluster type |

**Next content opportunity (if Matteo GOes):**
- G8: Bioethics — PM decision needed (prune MoralCluster type, or build ≥2 sources + article + landing)
- G10: SEO landings for privacy + moral-foundations clusters (same pattern as G7 ethics trio landings)
- G11: Experimental moral psychology standalone article

---

## 6. Active Sprint / Next Recommended Step

**All autonomous content sprints done for this session.** Blog is at 19 EN + 19 IT.

**HUMAN_ONLY — require Matteo action (5 min total):**
- Visit `splitvote.io/profile` → click "Upgrade to Premium" → verify checkout opens with monthly plan €4.99
- Request AdSense review from Google dashboard: Sites → splitvote.io → Request review

**PM decision needed:**
- G8 Bioethics: prune `'bioethics'` from `MoralCluster` type (clean), or build the cluster (2+ sources + article + landing)?
- G10 Privacy/MFT landings: create SEO landing pages for privacy and moral-foundations clusters?

---

## 7. Do Not Touch

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

## 8. Known Risks

| Risk | Status |
|---|---|
| Stripe live payment never tested end-to-end | Open — Task #55 |
| AdSense review not yet requested | Open |
| `<html lang="en">` on IT pages | Pre-existing; root layout not locale-scoped |
| EN dilemma card text on IT topic pages | `lib/scenarios.ts` has no IT translations — pre-existing |
| Save mode unblocked technically but no decision made | OPENROUTER_MODEL_REVIEW env set; re-QA gate decision pending |
| Bioethics cluster declared in MoralCluster type but empty | 0 sources, 0 articles, 0 landing — technical debt; needs PM prune/build decision |
| PRODUCT_STRATEGY.md + ROADMAP.md unstaged | Local PM changes uncommitted; leave to PM |

---

## 9. Safe Autonomous Tasks

Per `## Autonomous / Ralph-style Safe Tasks` in CLAUDE.md:

- `npm run typecheck` / `npm run build` / `git diff --check`
- SEO/copy QA analysis (read-only, local report to `reports/`)
- Content opportunity reports (dry-run only, no DB writes)
- Blog articles in `lib/blog.ts` (same G-sprint pattern)
- SEO landing topics in `lib/seo-topics.ts` (same G7 pattern)

**Never autonomously:**
- `git push` / deploy to Vercel
- write to production DB (Redis/Supabase)
- enable save mode or auto-publish
- modify Stripe, auth, middleware, or legal docs

---

## 10. Next Session Prompt

```
Ripartenza sessione SplitVote — 10 Maggio 2026.

Leggi prima (in questo ordine):
- CLAUDE.md
- CURRENT_HANDOFF.md ← stato aggiornato post-sessione
- git status --short --branch
- git log --oneline -5

State al 10 maggio sera:
- HEAD main: 67ff0b9 (G6 moral foundations EN+IT — pushed a origin/main)
- Blog: 19 EN + 19 IT articoli live (G1→G6 + parity fix + share button)
- SEO landings: 9 totali (3 EN + 3 IT ethics trio G7 + 3 esistenti)
- S8c mobile touch feedback: live (fb2b76a)
- Branch locale attivi: claude/blog-moral-foundations (mergiato, puoi eliminarlo)
- PRODUCT_STRATEGY.md + ROADMAP.md hanno modifiche locali non committed (lasciale al PM)

PROSSIMI SPRINT CANDIDATI (richiedono GO):
- G8 Bioethics: decisione PM — pruning MoralCluster o build?
- G10 SEO landings per privacy + moral-foundations clusters
- G11 Experimental moral psychology standalone article

HUMAN_ONLY (non blocca content sprints):
- Stripe live QA: splitvote.io/profile → Upgrade to Premium → verifica checkout €4,99/mese
- AdSense review request: dashboard Google AdSense → Sites → splitvote.io → richiedi revisione

Nessuna modifica a PRODUCT_STRATEGY.md / ROADMAP.md / LEGAL.md / CLAUDE.md senza GO esplicito.
```
