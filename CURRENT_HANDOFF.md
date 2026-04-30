# SplitVote — Current Handoff

Date: 30 Apr 2026
PM: Codex
Implementer: Claude Code

---

## Current Production State

- Soft launch active — anonymous vote flow working
- EN/IT active — all routes, copy, i18n complete
- Role management MVP shipped — DB-backed `role` column, `super_admin`, central `requireAdmin()` dual-check; `ADMIN_EMAILS` still active as Phase 1 safety net
- Stripe Premium config fixed (29 Apr 2026): `STRIPE_PRICE_ID_PREMIUM` in Vercel Production corrected (was a Secret Key, now set to recurring monthly Price ID). Code was already correct. **Manual live QA pending.**
- Dynamic dilemma approved pool uncapped — `dynamic:scenarios` grows without eviction; monitor Redis key size
- Governed seed batch + controlled autoPublish shipped — novelty guard, preflight similarity guard, quality gates, semantic novelty review
- Semantic novelty review shipped — LLM-based verdict (`novel | related_but_distinct | too_similar | duplicate`); blocks autoPublish on `too_similar`/`duplicate`
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

**Committed 30 Apr 2026:**
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
- ✅ Post-vote delayed reveal — committed `8a5dbad` (30 Apr 2026), pending deploy + QA

---

## Started / Partially Implemented

### Social comparison layer
- Phase 1 (delayed 500ms reveal) — **shipped `8a5dbad`**. Placeholder visible for 500ms, then bars/percentages/card reveal. `prefers-reduced-motion` via `useLayoutEffect` (minimises post-hydration flash). `total < 10` reveals immediately. **Pending deploy + QA.**
- Phase 2 (analytics events: `result_revealed`, `user_in_majority`, `user_in_minority`, `near_even_split`) — **not started**. Requires LEGAL.md check before implementing.
- Phase 3 (reconsideration prompt: "Would you still choose the same?") — **not started**.

### AI dilemma generation pipeline
- Governed batch + controlled autoPublish + semantic review — **done and shipped**.
- Large-scale IT generation run (15+ quality dilemmas) — **not started**. Dry run recommended first to validate semantic review behavior on IT content.
- Seed batch progress bar / polling UX — **not started** (Vercel timeout risk at 30+ items).

### Blog generation
- Static blog articles: 6 articles done.
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
- [ ] Seed batch dry run after any new OpenRouter model configuration
- [ ] Semantic review behavior on 5–10 generated IT dilemmas before bulk generation

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
- Picoclaw-style automation — possible ops sidecar for topic monitoring, QA reminders, and daily reports; not product runtime now.

### Needs QA
- Stripe Premium live checkout + payment (manual, no code needed)
- Name-change live checkout (manual)
- Delayed reveal on mobile after deploy (manual)
- Semantic review IT quality validation (admin panel dry run)

### Started / Partially Implemented
- Social comparison layer — Phase 1 pending commit; Phases 2–3 not started
- AI generation at scale — governed batch done; IT-only quality run not yet validated
- Blog generation pipeline — static articles done; generation quality/UX not audited
- Stripe live QA — config fixed, end-to-end payment not done

### Next Candidate Sprints

1. **Google Analytics audit (read-only)** — verify GA4/env/proxy/consent/events before product changes are judged.
2. **Core loop clarity** — why answer, game framing, login icon clarity, companion clarity, visible reward loop.
3. **Pre-vote question sharing** — standard share icon and neutral question share from home/play/dilemma surfaces.
4. **Aggregate leaderboards MVP** — most-voted topics/dilemmas first; archetype aggregate second; personal voter rankings later only with privacy review.
5. **AI generation progress bar** — seed batch progress bar or chunked polling to avoid timeout UX on 15–20 item batches. No DB migration.
6. **Current-events dilemma workflow** — news-inspired drafts for Italy/Europe/USA/World with source context and admin review.
7. **Social comparison analytics events** — `result_revealed`, `user_in_majority`, `user_in_minority`, `near_even_split`. No DB migration unless necessary. **Requires LEGAL.md check.**

---

## Known Risks

- AI generation can still produce thematic near-duplicates despite semantic review; human editorial review required before auto-publish.
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
5. Conferma stato di Stripe, roles, mobile admin, post-vote copy, homepage CTA, mission reminders, governed seed batch/autopublish, uncapped dynamic pool, semantic review, delayed reveal.
6. Proponi i 3 sprint migliori per oggi.

Output:
- Stato attuale in 10 righe
- Ultimi commit rilevanti
- QA manuale aperto
- Docs stale se presenti
- Sprint consigliati
- Nessuna modifica ai file.
```
