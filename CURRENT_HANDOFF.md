# CURRENT_HANDOFF — SplitVote

Last updated: 6 May 2026 (post-deploy QA 2dbb133)
PM: Matteo
Implementer: Claude Code

---

## 1. Production State

- **Branch:** `main`
- **Local vs remote:** `main` is **in sync** with `origin/main`
  - HEAD: `2dbb133` — `feat: add Italian SEO topic landing pages` (pushed ✅, Vercel deploy verified ✅)
- **Vercel deploy:** `2dbb133` live — post-deploy QA PASS ✅
- **Governance commit status:** `e5121cb` — pushed ✅

### Feature state

| Feature | State |
|---|---|
| Anonymous vote flow | ✅ working |
| EN/IT routes | ✅ complete |
| AdSense slots (HOME/PLAY/RESULTS) | ✅ live (RSC/JS bundle verified) |
| AdSense review | ❌ **not yet requested** — manual step in AdSense dashboard |
| Stripe Premium config | ✅ corrected 29 Apr (Price ID set); live checkout QA pending |
| AI generation (save mode) | ❌ blocked — re-QA required before enabling |
| Blog Draft Queue | ✅ deployed and QA'd |
| Blog published export | ✅ deployed (`cff52b4`) |
| Blog inline bold rendering | ✅ deployed (`f9918e7`, verified) |
| Blog translation prompt quality | ✅ pushed (`19f7252`), Vercel deploy expected/in progress |
| Blog translation admin warning | ✅ deployed (`19f7252`) |
| Research Source Registry | ✅ internal foundation only (`lib/research-sources.ts`) |
| IT topic landing pages | ✅ live (`2dbb133`) — `/it/problema-del-carrello`, `/it/dilemmi-etici-intelligenza-artificiale`, `/it/lealta-vs-onesta` |

---

## 2. Last Completed Work

### Sprint: Italian SEO topic landing pages (`2dbb133` — pushed ✅, QA PASS ✅)
- **Files modified:**
  - `lib/seo-topics.ts` — added `alternateSlug?` to `SeoTopic` interface; added `RESERVED_IT_SLUGS`; added `alternateSlug` to all 3 EN entries; added 3 IT topic entries (`problema-del-carrello`, `dilemmi-etici-intelligenza-artificiale`, `lealta-vs-onesta`) with natural Italian content; added helpers `getTopicBySlugAndLocale`, `getPublishedITTopics`, `getIndexableITTopics`; removed unused `getTopicBySlug`
  - `app/it/[topicSlug]/page.tsx` — new file: IT mirror of EN topic page; locale-aware routing; Italian UI copy; hreflang `it-IT`/`en`/`x-default` cross-linking via `alternateSlug`; all links prefixed `/it/`
  - `app/[topicSlug]/page.tsx` — switched to `getTopicBySlugAndLocale(…,'en')` in all call sites; added `alternates.languages` hreflang to IT counterpart
  - `app/sitemap.ts` — added `getIndexableITTopics` import and `topicRoutesIT` block (`/it/${slug}`, priority 0.75, monthly)
- **QA verified:** HTTP 200, canonical correct, hreflang EN↔IT present, sitemap includes 3 IT URLs, no 404s
- **Residual risk:** Related dilemma card text on IT topic pages shows EN questions — static scenarios (`lib/scenarios.ts`) are not localized. Pre-existing behavior, not introduced by this sprint.

### Sprint: Professional Blog Translation QA (`19f7252` — deployed ✅)
- **Files modified:**
  - `lib/content-generation-prompts.ts` — `buildTranslationPrompt()` fully rewritten: system prompt now says "NOT to translate — produce a ${lang} article that reads as if a native ${lang}-speaking editor wrote it from scratch"; added `sourceLang`, anti-calchi rules, per-field SEO/slug/body/CTA/FAQ guidance
  - `app/admin/BlogDraftQueue.tsx` — yellow warning banner in expanded translation section: "Translation quality review required before publishing. Check: no calchi, natural phrasing, localized SEO keywords, native CTA copy."
- **Verified:** typecheck ✅ — build ✅ — git diff --check ✅

### Sprint: Blog markdown bold fix (`f9918e7` — deployed, verified)
- `lib/blog-published.ts` — added `stripInlineBold()`, applied to h2/h3 in `bodyToSections()`
- `components/BlogArticle.tsx` — added `renderInline()`, used in `p` and `list` section renders

### Sprint: Blog published export (`cff52b4` — deployed)
- `app/api/admin/blog-published/export/route.ts` — new admin-only GET endpoint, returns downloadable JSON of `blog:published`
- `app/admin/BlogDraftQueue.tsx` — export button added

### Sprint: Blog draft publish flow (`a808aae` — deployed)
- Manual publish flow: Draft → Approve → Publish in admin panel

### Sprint: Governance / context engineering (`e5121cb` — pushed ✅)
- `.gitignore` — added `push_*.command` and `*.local.command` to ignore new untracked local helpers
- `CLAUDE.md` — added `## Autonomous / Ralph-style Safe Tasks` section (GSD method, SAFE/SEMI/HUMAN classification, Ralph loop rules)
- `scripts/nightly-check.mjs` — new aggregator script (read-only: validate-personality + check-it-copy)
- `package.json` — added `"nightly:check"` script
- `CURRENT_HANDOFF.md` — restructured with stable schema (this file)

---

## 3. Pending Manual Steps

| Step | Owner | Priority |
|---|---|---|
| Request AdSense review from AdSense dashboard → Sites → splitvote.io | Matteo | High |
| Stripe live checkout QA (real card or test card, end-to-end) | Matteo | High |
| Set `OPENROUTER_MODEL_REVIEW=openai/gpt-4o-mini` in Vercel Production, redeploy | Matteo | Before AI save mode re-QA |

### AI Generation re-QA gate (save mode blocked until this passes)
Pre-conditions:
1. Vercel Production → env var `OPENROUTER_MODEL_REVIEW=openai/gpt-4o-mini`
2. Manual redeploy after setting env
3. Re-run 4 dry-run scenarios in admin panel (dryRun ON)
4. Decision matrix: ≥60% accepted + `review_err` < 20% + no template repeats → **save mode OK**

---

## 4. Active Sprint / Next Recommended Step

**Active sprint complete.** `2dbb133` live, QA PASS.

**Next sprint candidates (ordered by impact):**

1. **IT static scenario localization foundation** — related dilemma cards on IT topic pages show EN questions; `lib/scenarios.ts` has no `it` translations; define scope before implementing (could be a field on `Scenario` or a separate IT scenarios map)
2. **AI generation re-QA** — set `OPENROUTER_MODEL_REVIEW` env, redeploy, run 4 dry-run scenarios → unlock save mode
3. **Stripe live QA** — end-to-end checkout with real/test card
4. **AdSense review request** — manual step, should be done before active promotion
5. **Blog cluster expansion** — bioethics, AI accountability, virtue ethics (foundation in `lib/research-sources.ts`)
6. **Content Intelligence admin MVP** — surface `lib/research-sources.ts` in admin panel

---

## 5. Do Not Touch

Without a dedicated sprint and explicit GO:

- **Auth** — Supabase SSR, login callback, auth redirects
- **Stripe** — no changes to pricing, subscription, webhook, entitlements
- **Supabase migrations** — no schema changes
- **Redis voting logic** — `app/api/vote`, `lib/redis.ts`, `dilemma_votes`
- **Middleware** — `middleware.ts`
- **Env vars** — no changes to `.env*` files or Vercel env without PM decision
- **Legal docs** — `LEGAL.md`, privacy policy, terms — only if actual data flows change
- **Auto-publish / save mode** — blocked until re-QA passes
- **`push_*.command` files** — historical/local helper artifacts; do not edit, remove, or git rm without a dedicated cleanup sprint
- **Production deploy/push** — only with explicit PM GO

---

## 6. Known Risks

| Risk | Status |
|---|---|
| Context rot in docs | Mitigated: this file restructured; CLAUDE.md updated |
| `push_*.command` git noise | `.gitignore` now hides new untracked local helpers. 7 historical files already tracked (`push_growth_sprint.command` etc.) are not removed or touched — tracked files are unaffected by `.gitignore`. |
| AI generation: `review_err` for IT semantic review | Probably resolved with `OPENROUTER_MODEL_REVIEW` env — not confirmed until re-QA |
| Stripe live payment: config correct but never tested end-to-end | Open |
| AdSense review not yet requested | Open |
| Translation quality depends on model configured at runtime | Admin warning added; human review gate enforced |
| Published articles already live will not be auto-retranslated | By design — translation prompt improvement applies to new drafts only |
| `moralfoundations.org` intermittent | Note in `lib/research-sources.ts`; verify before using on new public pages |
| `joshua-greene.net` personal page — may move | Prefer DOI paper links in public content |
| `<html lang="en">` on IT pages | Pre-existing issue; root layout not locale-scoped; not addressed |
| EN dilemma card text on IT topic pages | Related dilemma cards (`/it/[topicSlug]`) display EN question text — `lib/scenarios.ts` has no IT translations. Pre-existing, not introduced by `2dbb133`. Next sprint candidate: IT static scenario localization foundation. |
| Agent drift (agents relying on stale project history) | Mitigated: agents must read live docs per CLAUDE.md |
| Unsafe autonomy (Ralph loops touching HUMAN_ONLY areas) | Mitigated: SAFE/SEMI/HUMAN classification added to CLAUDE.md |

---

## 7. Safe Autonomous Tasks

Tasks Claude can run without waiting for PM GO (per `## Autonomous / Ralph-style Safe Tasks` in CLAUDE.md):

- `npm run typecheck`
- `npm run build`
- `npm run nightly:check` — runs validate-personality + check-it-copy (read-only)
- `npm run validate:personality`
- `npm run check:it-copy`
- `git diff --check`
- `git status --short`
- `git log --oneline`
- SEO/copy QA analysis (read-only, local report)
- Content opportunity reports (dry-run only, no DB writes)

**Never autonomously:**
- `git push`
- `git commit` (unless explicitly asked)
- deploy to Vercel
- enable save mode or auto-publish
- write to production DB (Redis/Supabase)
- run `npm run generate:social-content` (writes to `content-output/`, can read Redis)

---

## 8. Next Session Prompt

```
Ripartenza sessione SplitVote — 7 Maggio 2026 o successivo.

Leggi prima (in questo ordine):
- CLAUDE.md
- CURRENT_HANDOFF.md
- ROADMAP.md
- LEGAL.md
- LAUNCH_AUDIT.md

Poi esegui:
- git status --short --branch
- git log --oneline -10

Task di ripartenza:
1. Conferma stato branch (main deve essere in sync con origin/main, HEAD 2dbb133).
2. Verifica se AdSense review è già stata richiesta manualmente (non verificabile dal repo — chiedi al PM).
3. Verifica se Stripe live QA è stato eseguito.
4. Verifica se AI generation re-QA pre-conditions sono soddisfatte (OPENROUTER_MODEL_REVIEW env + redeploy).
5. Proponi prossimo sprint tra: IT static scenario localization, AI re-QA, Stripe QA, blog cluster expansion.

Output atteso:
- Stato repo in 8 righe
- Ultimi commit rilevanti
- Step manuali aperti
- Sprint candidati ordinati per impatto
- Nessuna modifica ai file finché non arriva GO.
```

---

## Historical Context (stale / needs confirmation)

> The following items were in the prior CURRENT_HANDOFF.md (4 May 2026). Marked stale where likely superseded.

- `app/it/[topicSlug]` — ✅ completato in `2dbb133`. IT topic pages live: `/it/problema-del-carrello`, `/it/dilemmi-etici-intelligenza-artificiale`, `/it/lealta-vs-onesta`. Residual risk: dilemma card text nelle pagine IT mostra domande EN — `lib/scenarios.ts` non ha traduzioni IT. Sprint candidato: IT static scenario localization foundation.
- Blog cluster espansione — 8 articoli live (4 EN + 4 IT) al 4 maggio. Prossimi cluster: bioethics, AI accountability, virtue ethics. **Still open; may have more articles now — verify.**
- Content Intelligence admin MVP — `lib/research-sources.ts` è il foundation layer. Admin MVP sprint non pianificato. **Still open.**
- AdSense readiness table (4 May): all checks ✅ except "Review richiesta" ❌. **Review still not requested as of 6 May.**
- Lifestyle dilemmas + dataset import pipeline (`4 May`): shipped and in ROADMAP. **Confirmed shipped.**
- Blog pagination + IT translation fixes (`4 May`): shipped. **Confirmed shipped.**
