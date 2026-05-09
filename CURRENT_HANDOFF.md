# CURRENT_HANDOFF — SplitVote

Last updated: 9 May 2026 (post-push c25184c — 4 content sprints merged: blog parity + AI ethics + loyalty + share button)
PM: Matteo
Implementer: Claude Code (Sonnet 4.6)

---

## 1. Production State

- **Branch:** `main`
- **Local vs remote:** `main` is **in sync** with `origin/main`
  - HEAD: `c25184c` — `Merge branch 'claude/share-before-vote'` (pushed ✅, deploying)
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
| pm-orchestrator agent | ✅ live in `.claude/agents/pm-orchestrator.md` |
| Blog Draft Queue | ✅ deployed and QA'd |
| IT topic landing pages | ✅ live (`2dbb133`) |
| Content Seed Pack Integration v1 | ✅ pushed (`ea2a3b4`) — admin only; dry-run first |
| DilemmaCard share button | ✅ live (`c25184c`) — Web Share API + clipboard fallback, GA4 tracked |
| Blog EN/IT parity fix | ✅ live (`a6e5c3a`) — `moral-dilemmas-examples` (EN) + `statistiche-problema-del-carrello` (IT) |
| G1 AI Ethics article EN+IT | ✅ live (`6ce40be`) — `ai-ethics-what-40-million-people-chose` + `ia-etica-40-milioni-scelte` |
| G2 Loyalty vs Honesty article EN+IT | ✅ live (`372d085`) — `loyalty-vs-honesty-when-they-collide` + `lealta-vs-onesta-quando-si-scontrano` |

---

## 2. Last Completed Work (Session 9 May 2026)

### Content Sprint Batch — 4 Branches Merged ✅

All 4 content branches merged to main via explicit PM GO after 22-test QA across all branches. Pushed to `origin/main` at `c25184c`.

**Blog parity fix** (`a6e5c3a`):
- `lib/blog.ts` — Added `moral-dilemmas-examples` (EN) + `statistiche-problema-del-carrello` (IT); `alternateSlug` cross-locale hreflang linking

**G1 AI Ethics article** (`6ce40be`):
- `lib/blog.ts` — `ai-ethics-what-40-million-people-chose` (EN) + `ia-etica-40-milioni-scelte` (IT); 5 play CTAs; Moral Machine (Awad et al., Nature 2018) source disclaimer

**G2 Loyalty vs Honesty article** (`372d085`):
- `lib/blog.ts` — `loyalty-vs-honesty-when-they-collide` (EN) + `lealta-vs-onesta-quando-si-scontrano` (IT); 5 play CTAs each; MFT context disclaimer; `alternateSlug` cross-linking

**Share Before Vote** (`c25184c`):
- `components/DilemmaCard.tsx` — restructured to `div.card-neon` outer + inner `Link` block + sibling share row (valid HTML, no button-in-anchor)
- `components/DilemmaCardShareButton.tsx` (NEW) — Web Share API + clipboard fallback; GA4 `share_clicked { target, scenario_id, locale }`; EN/IT copy ("Share"/"Condividi", "Copied!"/"Copiato!")

**Verification:** typecheck ✅ — build ✅ — git diff --check ✅ — 22-test PM QA PASS across all 4 branches pre-merge

### Mobile-First Redesign Phase 1 — All Sprints Live ✅ (8 May 2026)

**S7 — Mobile play page polish** (`4b5ea78` → `d59af3c`):
- `app/play/[id]/VoteClientPage.tsx` — question heading `text-2xl md:text-3xl` → `text-3xl md:text-4xl`; vote buttons `min-h-[88px]` + `active:scale-[0.97] active:bg-{color}/15` for tactile feedback
- Smoke 8/8 PASS

**S8 — Discovery audit (Codex parallel session)**: Steps #86–94 verified — locale isolation ✅, sort DESC ✅, admin approve flow EN(171→172) + IT(173→174) ✅

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

**PROSSIMO SPRINT CONFERMATO DA MATTEO: G3 — Trio teorie etiche**

Da fare come prima cosa nella prossima sessione. GO esplicito già dato.

### G3 — Piano dettagliato

3 articoli EN + 3 articoli IT, stesso schema di G1/G2 (`lib/blog.ts`, pattern `alternateSlug`, disclaimer accademico).

**Articoli da scrivere:**

| Slug EN | Slug IT | Topic |
|---|---|---|
| `consequentialism-the-greatest-good` | `consequenzialismo-il-bene-maggiore` | Bentham/Mill, trolley problem come caso reale, 4-5 CTA (trolley, pandemic-dose, organ-harvest, rich-or-fair, universal-basic-income) |
| `deontology-some-things-are-always-wrong` | `deontologia-alcune-cose-sono-sempre-sbagliate` | Kant senza jargon, conflitto con consequentialism, CTA (whistleblower, cover-accident, innocent-juror, mandatory-vaccine) |
| `virtue-ethics-what-would-a-good-person-do` | `etica-della-virtu-cosa-farebbe-una-persona-buona` | Aristotele, come risponde alle domande che le altre due evitano, CTA (truth-friend, forgive-cheater, sibling-secret, love-or-career) |

**Regole applicate in G1/G2 da rispettare:**
- `alternateSlug` bidirezionale per hreflang automatico
- `relatedDilemmaIds` = IDs degli scenari statici linkati nelle CTA
- `date: '2026-05-10'` (domani)
- `readingTime: 5` per tutti
- Disclaimer finale in ogni articolo: variante MFT per consequentialism/deontology/virtue ethics (non è replica di framework accademico)
- Cross-link tra i 3 articoli del trio (ogni articolo menziona gli altri due)
- CTA chiusura: link alla categoria landing page rilevante

**Al termine di G3:** blog a 20 EN + 20 IT articoli → richiedere revisione AdSense (task Matteo).

**Dopo G3 (ordine priorità):**
- Matteo: visita `splitvote.io/profile` → clicca "Upgrade to Premium" → verifica checkout si apre con piano mensile €4,99 (5 min, sblocca Stripe)
- Matteo: richiedi revisione AdSense dal dashboard (3 min)
- OpenRouter optimization: set `OPENROUTER_MODEL_REVIEW` a modello economico (haiku/mistral) — risparmio 50% crediti per ogni seed batch

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
Ripartenza sessione SplitVote — 10 Maggio 2026.

Leggi prima (in questo ordine):
- CLAUDE.md
- CURRENT_HANDOFF.md  ← contiene il piano G3 completo già approvato
- git status --short --branch
- git log --oneline -5

State al 9 maggio sera:
- HEAD main: 909d07a (CURRENT_HANDOFF refresh — pushed a origin/main)
- Blog: 14 EN + 14 IT articoli live (G1 AI Ethics + G2 Loyalty + parity fix + share button)
- DilemmaCard share button live (Web Share API + clipboard, GA4 tracked)
- OPENROUTER_MODEL_REVIEW env: SET in Vercel
- Mobile redesign phase 1 completo (S1/S2/S5a/S5b/S5c/S6a/S7)
- Branch attivi: main + stripe-preview-qa
- reports/ ha audit dilemma-visibility-2026-05-07.md (storico, non toccare)

SPRINT CONFERMATO: G3 — Trio teorie etiche (GO già dato da Matteo)
→ Consequentialism EN+IT + Deontology EN+IT + Virtue Ethics EN+IT
→ 6 articoli in lib/blog.ts, stesso schema G1/G2
→ Piano completo nella sezione 4 di questo file

NON proporre alternative sprint — vai diretto su G3.
Lavora su un worktree dedicato (claude/blog-ethics-trio o simile).
Scrivi gli articoli, typecheck, build, poi chiedi GO per merge e push.

Backlog HUMAN_ONLY (non blocca G3):
- Stripe live QA: splitvote.io/profile → Upgrade to Premium → verifica checkout €4,99/mese
- AdSense review request: dashboard Google AdSense → Sites → splitvote.io → richiedi revisione
- Task #46 Stripe Name Change €0.99
- Task #24 Discord OAuth

Nessuna modifica a PRODUCT_STRATEGY.md / ROADMAP.md / LEGAL.md / CLAUDE.md senza GO esplicito.
```
