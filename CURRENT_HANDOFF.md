# SplitVote — Current Handoff

Date: 1 May 2026
PM: Codex
Implementer: Claude Code

---

## Current Production State

**Release status: ✅ GO — all post-deploy QA verified 1 May 2026. No P0/P1 blockers open.**

- Soft launch active — anonymous vote flow working
- EN/IT active — all routes, copy, i18n complete
- Role management MVP shipped — DB-backed `role` column, `super_admin`, central `requireAdmin()` dual-check; `ADMIN_EMAILS` still active as Phase 1 safety net
- Stripe Premium config fixed (29 Apr 2026): `STRIPE_PRICE_ID_PREMIUM` in Vercel Production corrected (was a Secret Key, now set to recurring monthly Price ID). Code was already correct. **Manual live QA pending.**
- Dynamic dilemma approved pool uncapped — `dynamic:scenarios` grows without eviction; monitor Redis key size
- Governed seed batch + controlled autoPublish shipped — novelty guard, preflight similarity guard, quality gates, semantic novelty review
- Semantic novelty review shipped — LLM-based verdict (`novel | related_but_distinct | too_similar | duplicate`); blocks autoPublish on `too_similar`/`duplicate`
- Feedback counters fixed (30 Apr): Redis now source of truth for admin KPI (real anonymous + logged-in totals); Supabase `dilemma_feedback_stats` is logged-in-only fallback — commits f1a0e95 · 3d258f5
- AI generation hardening shipped (30 Apr, session 2): cross-locale semantic dedup (EN↔IT parity in reviewer via [EN]/[IT] prefixed items), intra-batch draft visibility in semantic review, human-readable `rejectionReason` with source/locale/similarity in admin table, SEED_TOPICS cleanup (21 IT mirror topics + 1 EN trolley variant replaced — 64 topics now cover distinct moral angles per locale-category pair), anti-template prompt guardrails (3 new SAFETY_RULES) — commits ebab0b1 · b3ef8df
- Production AI dry-run QA: **✅ Verified 1 May 2026 (dryRun ON)** — semantic novelty dedup, chunked 3-item progress, cancel mid-run, autoPublish disabled all confirmed. Save mode still gated pending full decision matrix (≥60% accepted, no template repeats).
- **Blog Draft Queue: ✅ deployed + QA verified 1 May 2026** — save, approve (status=approved, NOT published to /blog), reject all confirmed; `blog:drafts` Redis key; `lib/blog-drafts.ts` + 3 API routes + `BlogDraftQueue.tsx` + `GenerateDraftPanel.tsx` Save button
- Mission claim reminders shipped — nudge UX for non-claimable daily missions
- Homepage CTA improved, post-vote viral share copy sharpened
- Expert Insight V2 shipped — sharper copy, insight shown before share CTA
- Blog: 6 static articles (3 EN + 3 IT) in `lib/blog.ts`
- **Post-vote delayed reveal: committed `8a5dbad` (30 Apr 2026), pending deploy + QA** — 500ms placeholder, `prefers-reduced-motion` via `useLayoutEffect`, `total < 10` reveals immediately

---

## Today's Commits

`git log --oneline --since="2026-04-29"` returned empty (git --since uses UTC; commits authored at +0200 still appear as 2026-04-29 UTC but the filter behaved unexpectedly). Actual author-dated commits confirmed via `git log --format="%h %ai %s"`:

```
2ab180a 2026-04-29 18:16 +0200  feat: add semantic novelty review
f3f0683 2026-04-29 17:45 +0200  feat: add novelty-first dilemma generation
3cfb4f4 2026-04-29 17:04 +0200  feat: improve seed topic diversity and preselection
321a705 2026-04-29 16:06 +0200  fix: show full dynamic dilemma admin totals
aa52ed9 2026-04-29 15:41 +0200  fix: remove destructive dynamic dilemma cap
681c418 2026-04-29 15:10 +0200  feat: add seed batch preflight similarity guard
a70ca36 2026-04-29 15:01 +0200  docs: document governed seed batch workflow
33f4aee 2026-04-29 14:52 +0200  feat: add governed dilemma batch generation
de6e163 2026-04-29 14:02 +0200  feat: add mission claim reminders
ca00c8e 2026-04-29 13:53 +0200  feat: harden dilemma feedback scoring
ecb0c46 2026-04-29 12:55 +0200  feat: improve homepage hero CTA
8e6d932 2026-04-29 12:35 +0200  feat: sharpen post-vote viral share copy
fac7463 2026-04-29 12:16 +0200  fix: use mobile nav through landscape tablet widths
15b61bc 2026-04-29 12:01 +0200  fix: improve admin roles mobile layout
08ef443 2026-04-29 11:36 +0200  feat: add role management MVP
c4661ab 2026-04-29 09:56 +0200  feat: add category editorial SEO content
4c5498d 2026-04-29 09:56 +0200  docs: reconcile Stripe production env fix
```

**Committed 30 Apr 2026 (session 2 — AI hardening + docs):**
`b3ef8df` chore: clean up seed topics and validate novelty QA
`ebab0b1` fix: harden dilemma novelty and draft dedup
`3d258f5` fix: show real dilemma feedback counters in admin
`f1a0e95` fix: clarify dilemma feedback counters

**Committed 30 Apr 2026 (session 1):**
`8a5dbad` feat: add post-vote delayed results reveal

---

## Done Today

- ✅ Role management MVP — DB roles, super_admin, audit log, requireAdmin() central guard, all 11 admin endpoints updated
- ✅ Category editorial SEO content — 8 categories × 2 locales, lib/categoryContent.ts, FAQ sections
- ✅ Stripe production env fix documented — STRIPE_PRICE_ID_PREMIUM corrected in Vercel
- ✅ Mission claim reminders — nudge UX for missions not yet claimable
- ✅ Dilemma feedback scoring hardened
- ✅ Homepage hero CTA improved
- ✅ Post-vote viral share copy sharpened
- ✅ Mobile nav landscape fix (through landscape tablet widths)
- ✅ Admin roles mobile layout fix
- ✅ Governed seed batch — sequentially generated, save drafts, admin-only, Redis draft queue
- ✅ Seed batch docs — governed workflow documented in README.md
- ✅ Preflight similarity guard — skips near-duplicate topics before OpenRouter call
- ✅ Dynamic dilemma pool uncapped — removes Redis cap on approved pool
- ✅ Admin totals fix — full Redis totals shown in admin panel
- ✅ Seed topic diversity + preselection improvements
- ✅ Novelty-first dilemma generation improvements
- ✅ Semantic novelty review — LLM-based post-threshold verdict, integrated into both generate-draft and seed-draft-batch
- ✅ Feedback counter audit + Redis fix — admin KPI now reads Redis for real totals (anonymous + logged-in); Supabase `dilemma_feedback_stats` is logged-in only; commits f1a0e95 + 3d258f5
- ✅ AI generation novelty hardening — cross-locale semantic dedup (EN↔IT parity via [EN]/[IT] prefixed items), intra-batch draft visibility in semantic review, human-readable `rejectionReason` with source/locale/similarity, anti-template prompt guardrails (3 new SAFETY_RULES); commit ebab0b1
- ✅ SEED_TOPICS cleanup — 21 IT mirror topics + 1 EN trolley variant replaced; 64 topics now cover distinct moral angles per locale-category pair; commit b3ef8df
- ✅ Post-vote delayed reveal — committed `8a5dbad` (30 Apr 2026), pending deploy + QA

**1 May 2026 (session 2 — locally implemented, committed + deployed):**
- ✅ AI semantic block save bug fixed — `seed-draft-batch/route.ts`: semantic-blocked items now correctly push `skipped_novelty` result and `continue` before inventory update (previously fell through)
- ✅ Blog Draft Queue MVP — `lib/blog-drafts.ts`, 3 API routes, `BlogDraftQueue.tsx`, `GenerateDraftPanel.tsx` Save button; approve ≠ publish live
- ✅ Content inventory now indexes `blog:drafts` — novelty guard sees draft blog articles when generating new ones (prevents intra-queue duplication)
- ✅ `content-generation-prompts.ts` — question max 180 chars, option max 110 chars (more concise, directly votable)
- ✅ Reset password flow — "Forgot password?" link in login (login mode only), reset email form, `supabase.auth.resetPasswordForEmail`, `handleReset` with EN/IT copy; new `/reset-password` page (set new password, confirm, `supabase.auth.updateUser`, error handling: too short/no match/expired link, redirect to /dashboard on success); callback unchanged
- ✅ i18n fix — `AuthButton.tsx` now detects `/it` pathname via `usePathname()` and links to `/login?locale=it`; shows "Unisciti →" copy on IT pages
- ✅ Account deletion — `DELETE /api/profile/delete-account` (server-only; `auth.getUser()` validation; CSRF guard via Content-Type header; active subscription check → 409; explicit delete of `organizations` + `user_polls` before `deleteUser`; cascade handles rest; `dilemma_feedback` anonymized); "Danger zone" section in ProfileClient (`DELETE`/`ELIMINA` typed confirmation, `min-h-[48px]` touch target, mobile-safe input attrs); Privacy EN/IT updated to mention in-app deletion; LEGAL.md updated

**1 May 2026 (session 3 — QA closure + hotfix, committed + deployed):**
- ✅ Admin seed batch chunked mode — `SeedBatchPanel.tsx` rewritten: N sequential POSTs of count=1 each; progress bar; cancel button; per-item error with count; autoPublish disabled in chunked mode (commit `9872404`)
- ✅ Reset IT hotfix — `handleReset` now uses `/it/reset-password` (clean path, no nested URL-encoding); `next.config.js` redirects `/it/reset-password` → `/reset-password?locale=it` and `/it/login` → `/login?locale=it` (commit `5560c84`)
- ✅ Post-deploy QA closed: reset password EN/IT, Blog Draft Queue, account deletion, AI duplicate fix (dry-run), AI chunked progress, GA/AdSense smoke — all PASS

---

## Started / Partially Implemented

### Social comparison layer
- Phase 1 (delayed 500ms reveal) — **shipped `8a5dbad`**. Placeholder visible for 500ms, then bars/percentages/card reveal. `prefers-reduced-motion` via `useLayoutEffect` (minimises post-hydration flash). `total < 10` reveals immediately. **Pending deploy + QA.**
- Phase 2 (analytics events: `result_revealed`, `user_in_majority`, `user_in_minority`, `near_even_split`) — **not started**. Requires LEGAL.md check before implementing.
- Phase 3 (reconsideration prompt: "Would you still choose the same?") — **not started**.

### AI dilemma generation pipeline
- Governed batch + controlled autoPublish + semantic review — **done and shipped**.
- Novelty hardening (30 Apr 2026, session 2): cross-locale dedup, intra-batch visibility, rejectionReason display, SEED_TOPICS cleanup, prompt guardrails — **done and shipped**.
- **Production dry-run QA — NOT DONE.** Required before save mode. Four test scenarios documented in Open Manual QA below.
- Save mode controlled usage — **blocked by dry-run QA result**.
- Large-scale IT generation run (15+ quality dilemmas) — **not started**. Blocked by dry-run QA.
- Seed batch progress bar / polling UX — **not started** (Vercel timeout risk at 30+ items).

### Blog generation
- Static blog articles: 6 articles done.
- **Blog Draft Queue — implemented locally, pending deploy + QA.** New `lib/blog-drafts.ts` Redis CRUD (`blog:drafts` key, max 50 items). Three admin API routes: `GET/POST /api/admin/blog-drafts`, `POST /api/admin/blog-drafts/[id]/approve`, `POST /api/admin/blog-drafts/[id]/reject`. New `BlogDraftQueue.tsx` admin panel (list, expand, approve, reject). `GenerateDraftPanel.tsx` — added "Save draft" button, `savedId`/`saveError`/`saveLoading` states. `lib/content-inventory.ts` — now indexes `blog:drafts` so novelty guard sees draft articles when generating new ones (prevents intra-queue duplication). Approve = `status:approved`, does NOT write to `lib/blog.ts` and does NOT publish live. Editorial workflow: generate → save draft → approve → manually integrate into `lib/blog.ts`.
- Blog generation quality audit (prompt, model, SEO output quality) — **not started**.
- Blog generation progress UX — **not started**.

### Stripe live QA
- Config fixed, Preview QA done, webhook/entitlements verified in test mode.
- End-to-end live checkout + payment with real card — **not done**. Required before promoting Premium to real users.

---

## Open Manual QA

- [ ] Stripe Premium checkout live UI — open `splitvote.io/profile`, confirm recurring monthly plan shown in checkout
- [ ] Stripe Premium live payment end-to-end — real or controlled card, confirm entitlements activated
- [ ] Name-change live checkout
- [ ] Delayed reveal mobile portrait/landscape — `/results/[id]?voted=a` and `/it/results/[id]?voted=b` after commit + deploy
- [ ] Delayed reveal `prefers-reduced-motion` — DevTools → Emulate CSS media → confirm immediate reveal
- [x] **Reset password QA — ✅ PASS (EN + IT verified 1 May 2026, post-deploy 5560c84)**:
  1. `/login` → login mode → "Forgot password?" link visible below password field ✓
  2. Click → reset mode shown ✓
  3. Enter email → Send → success message in IT if `?locale=it` ✓
  4. Check email inbox → click reset link → redirected to `/reset-password` (EN) ✓
  5. Form shown → enter new password + confirm → submit → success → redirected to `/dashboard` ✓
  6. IT path: `/login?locale=it` → "Password dimenticata?" → email → link contains `/it/reset-password` → final redirect `/reset-password?locale=it` → IT copy ✓
  7. `/it/login` → redirect to `/login?locale=it` ✓ (next.config.js redirect)
- [x] **Blog Draft Queue QA — ✅ PASS (verified 1 May 2026)**:
  1. Save draft ✓
  2. Approve → status=approved, NOT published to /blog ✓
  3. Reject ✓
  4. No public auto-publish confirmed ✓
- [x] **Account deletion QA — ✅ PASS (throwaway account only, verified 1 May 2026)**:
  ⚠️ Use a throwaway test account only. Do NOT test deletion on admin/super_admin accounts — that would remove the DB role; ADMIN_EMAILS env var is the fallback but avoid it.
  1. Danger zone visible in /profile ✓
  2. DELETE confirmation gate ✓
  3. Delete → logout → redirect home ✓
  4. Premium block (active subscription → 409) ✓
  5. Admin account: SKIP — never test on real admin accounts
- [x] **AI generation production dry-run — ✅ PARTIAL PASS (dryRun ON verified 1 May 2026; save mode still gated)**:
  Verified: semantic novelty dedup, chunked 3-item progress bar, cancel mid-run, autoPublish disabled.
  Save mode gate: decision matrix (≥60% accepted, no template repeats) not yet formally evaluated.
- [ ] **AI generation production dry-run (4 scenarios, ~12 min, browser admin required — gates save mode)**:
  1. Locale: EN · Count: 5 · Default topics · Dry run ✓ → record: accepted, skipped_preflight, skipped_novelty, noveltyScore distribution
  2. Locale: IT · Count: 5 · Default topics · Dry run ✓ → same; verify EN≠IT moral angles in accepted items
  3. Locale: ALL · Count: 3/locale · Default topics · Dry run ✓ → check cross-locale semantic blocking in Review column
  4. Locale: ALL · Count: 3 · Manual seed · Dry run ✓:
     - topic: `mandatory vaccination during a public health crisis`
     - angle: `individual freedom vs collective protection`
     - notes: `avoid real people, countries, cities, and factual claims`
     - Expected: IT result shows `⚠ too similar` / `✗ duplicate` semantic verdict vs EN intra-batch item
  **Decision matrix**: ≥60% accepted + no template repeats → **save mode OK** · recurring trolley/organ-harvest/AI-job-loss → prompt tweak sprint · IT mirror passes (Test 4 IT not blocked) → translation preflight sprint · `review_failed` frequent → deterministic dedup sprint
- [ ] Seed batch dry run after any OpenRouter model config change

---

## Parking Lot / Candidate Sprints

### Field Feedback Captured — 30 Apr 2026

Real viewer feedback surfaced a product clarity gap: users do not immediately understand why to answer, whether this is a game, what the companion means, or why sharing matters. This is now captured in `PRODUCT_STRATEGY.md → Field Feedback Intake — 30 Apr 2026` and `ROADMAP.md → PM Priority Queue — Field Feedback 30 Apr 2026`.

Do not lose these follow-ups:
- Core loop clarity before heavier features — clearer "why answer" copy, game/reward framing, login icon as user/profile icon, companion explained visually and textually.
- Share question before vote — standard share icon on home/play/dilemma cards, neutral pre-vote copy, selected vote private by default.
- Leaderboards in safe order — most-voted topics/dilemmas first, archetype aggregate second, personal voter leaderboard later only with privacy review.
- Macro-area paths — parents, couples, work, technology, society, young adults.
- Current-events dilemmas — Italy/Europe/USA/World news-inspired drafts with source context and admin review.
- AI-assisted localization — draft translations are fine, but public copy stays reviewed and committed.
- Picoclaw Content Intelligence — integration direction documented (30 Apr 2026) in `PRODUCT_STRATEGY.md → Picoclaw Content Intelligence Direction` and `ROADMAP.md`. No runtime code. Phase 1 manual import is already possible via Seed Batch manual seed. Phase 2+ require API/auth/LEGAL.md review before starting.

### Needs QA
- Stripe Premium live checkout + payment (manual, no code needed)
- Name-change live checkout (manual)
- Delayed reveal on mobile after deploy (manual)
- **AI generation production dry-run** (4 scenarios — gates save mode; see Open Manual QA for full protocol)

### Started / Partially Implemented
- Social comparison layer — Phase 1 pending commit; Phases 2–3 not started
- AI generation at scale — hardening shipped (30 Apr session 2); production dry-run QA pending; save mode gated by dry-run result
- Blog generation pipeline — static articles done; generation quality/UX not audited
- Stripe live QA — config fixed, end-to-end payment not done

### PM Field Observations — UX, Growth, Admin, AI Quality (30 Apr 2026)

Issues surfaced via direct product observation. Full spec in `PRODUCT_STRATEGY.md → PM Field Observations` and prioritized in `ROADMAP.md → PM Field Observations`.

**P0 bugs:**
- ~~Feedback counter bug~~ — **Fixed (30 Apr 2026)**: Redis now source of truth for admin counters (anonymous feedback was Redis-only; Supabase `dilemma_feedback_stats` view is logged-in only). Commits f1a0e95 + 3d258f5.
- AI seed draft network_error — UI shows error after batch seed even when drafts saved; risk of admin double-generation. **Still open.** Likely Vercel function timeout. Sprint: _Admin AI generation reliability_.

**P1 UX/Growth:**
- Mission deep links — tap incomplete mission → navigate to required action.
- Daily Dilemma full-card click (home) — whole card clickable; share CTA must not propagate.
- Blog 2-column + share — desktop layout + Web Share API on card + article.

**P2:**
- Dashboard navigation IA — restructure profile/missions/rewards/settings navigation.
- Vote reconsideration via long press — within `can_change_until` window; high risk, touches vote flow.

**P3:**
- VIP display name colors — 10-shade cosmetic palette; Premium entitlements + Terms gate required.
- AI novelty + current-events engine — compare drafts against published pool, raise novelty threshold, news-inspired abstractions with editorial review.

### Next Candidate Sprints

1. **Google Analytics audit (read-only)** — verify GA4/env/proxy/consent/events before product changes are judged.
2. **Core loop clarity** — why answer, game framing, login icon clarity, companion clarity, visible reward loop.
3. **Pre-vote question sharing** — standard share icon and neutral question share from home/play/dilemma surfaces.
4. **Aggregate leaderboards MVP** — most-voted topics/dilemmas first; archetype aggregate second; personal voter rankings later only with privacy review.
5. **AI generation progress bar** — seed batch progress bar or chunked polling to avoid timeout UX on 15–20 item batches. No DB migration.
6. **Current-events dilemma workflow** — news-inspired drafts for Italy/Europe/USA/World with source context and admin review.
7. **Social comparison analytics events** — `result_revealed`, `user_in_majority`, `user_in_minority`, `near_even_split`. No DB migration unless necessary. **Requires LEGAL.md check.**
8. **Pixie Phase 1 — Rename/copy** — rename "Companion" → "Pixie" across UI and lib; update EN/IT copy; zero DB, zero assets. Can ship inside Core Loop Clarity sprint. Full strategy in `PRODUCT_STRATEGY.md → Pixie Digital Avatar Direction`.
9. **Pixie Phase 2 — Base assets** — Pixie Spark PNG stage 1–5; `CompanionDisplay` image with emoji fallback. Prerequisite: assets generated and PM-approved.
10. **Pixie Phase 3 — Share card MVP** — shareable Pixie profile card; `/api/pixie-card/[userId]` server-only endpoint; share CTA on dashboard. No DB migration. Prerequisite: Phase 2 assets. Confirm public fields in `LEGAL.md` before shipping.
11. **Pixie Phase 4 — Variant selector / earned variants** — server-side unlock + `pixie_variant_equipped` column. DB migration required.
12. **Pixie Phase 5–6 — VIP + Purchased Pixies** — Phase 5 via entitlements; Phase 6 requires Stripe + LEGAL + Terms review. Do not start Phase 6 without explicit gate clearance.
13. **Segmented result comparison** *(DEFERRED)* — "Chi vota in italiano" card on IT results page, post-vote only, Redis-backed, 50-vote threshold. Do not build until ≥ 500 IT votes on a popular dilemma and Core Loop (#2) + Pre-vote sharing (#3) are shipped. Country/demographic segments require LEGAL.md review. Full spec: `PRODUCT_STRATEGY.md → Segmented Result Comparison Direction`.

---

## ⚠️ Security / QA Warning

- **Do not use admin or real personal accounts for QA auth or destructive flows** (reset password, account deletion, role changes). Use throwaway accounts only.
- **mat.pizzi@gmail.com password was temporarily changed during QA (1 May 2026)** and must be rotated privately outside this codebase.

## Known Risks

- AI generation near-duplicate risk reduced (cross-locale dedup, intra-batch visibility, anti-template guardrails shipped 30 Apr session 2); production dry-run QA still pending — do not use save mode until dry-run decision matrix passes.
- OpenRouter model aliases may change behavior; verify after any model config change.
- Long seed batches (>20 items) approach Vercel function timeout; generate in batches ≤ 15–20.
- Analytics/reconsideration sprint requires LEGAL.md check before implementing.
- Admin mobile/landscape must be checked after any admin UI changes.
- `ADMIN_EMAILS` fallback must remain active until Phase 2 role migration is explicitly verified in production.

---

## Tomorrow Start Prompt

```
Ripartenza sessione SplitVote.

Modalità: READ-ONLY. Non modificare file.

Leggi prima:
- CLAUDE.md
- CURRENT_HANDOFF.md
- ROADMAP.md
- README.md
- LEGAL.md
- PRODUCT_STRATEGY.md
- LAUNCH_AUDIT.md
- .claude/agents/release-readiness-reviewer.md
- .claude/agents/product-growth-reviewer.md

Task:
1. Esegui git status --short.
2. Esegui git log --oneline -12.
3. Ricostruisci lo stato reale del progetto.
4. Distingui shipped/pushato, implementato non committato, QA manuale aperto, docs stale.
5. Conferma stato di Stripe, roles, mobile admin, post-vote copy, homepage CTA, mission reminders, governed seed batch/autopublish, uncapped dynamic pool, cross-locale semantic dedup, SEED_TOPICS cleanup, feedback counters (Redis), delayed reveal.
6. Verifica stato AI generation dry-run: se non ancora eseguito, proponilo come primo sprint della sessione (~12 min, browser admin, 4 scenari dry run). Il dry-run sblocca save mode e bulk generation.
7. Proponi i 3 sprint migliori per oggi.

Output:
- Stato attuale in 10 righe
- Ultimi commit rilevanti
- QA manuale aperto
- Docs stale se presenti
- Sprint consigliati
- Nessuna modifica ai file.
```
