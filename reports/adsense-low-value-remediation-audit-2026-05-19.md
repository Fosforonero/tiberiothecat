# AdSense Low-Value Remediation Audit — 2026-05-19

**Sprint:** `ADSENSE-LOW-VALUE-REMEDIATION-AUDIT-01`
**Mode:** Read-only. Report only. No code, no commits, no pushes.
**Trigger:** AdSense rejection — "Contenuti di scarso valore / Minimum content requirements / Thin content with little or no added value / Publisher policies / low-value inventory."

---

## TL;DR (read this first)

1. **The AdSense rejection is most likely caused by the per-dilemma `/play/[id]` and `/results/[id]` pages**, not by blog, topic landings, or the homepage. Ads render on exactly three surfaces today: homepage, play, results. The play and results pages are 82 static URLs (41 EN + 41 IT each) where the visible non-interactive content is templated category-level copy + 1-2 lines of dilemma text + a related grid. To a Google reviewer scanning 3-4 random URLs, this reads as "mass-produced template feel with little original commentary."
2. **The category-level fallback insight** in `lib/dilemma-seo-insights.ts` uses **3 framings + 3 tensions + 4 prompts per category × 9 categories × 2 locales**, picked deterministically by id. With only 41 static dilemmas spread across 9 categories (≈4–5 per category), the variation budget is too small: a reviewer hitting 3 dilemmas in the same category sees essentially the same framing twice.
3. **Per-id static insights** were added today, but only for **5 of 41** static dilemmas (`rich-or-fair`, `robot-judge`, `censor-speech`, `deepfake-expose`, `prison-abolition`). The other 36 fall back to category-level. **0 of 779** dynamic AI scenarios have per-id insights, and they remain reachable via `RelatedDilemmas` and `/trending` even though they're excluded from sitemap.
4. **Results pages with 0 votes** are an acute risk: the 5 rewritten dilemmas just had their Redis aggregate keys cleared (DEL no-op on 19 May), and many dynamic AI scenarios accumulate few or zero votes. A results page with `total === 0` is essentially the same UI as the play page minus the buttons — extremely thin.
5. **The `/store` page is indexable and looks unfinished**: 14 products with "Buy now" buttons that all open the "Checkout coming online soon" modal. This is exactly the "incomplete inventory / not ready for monetization" pattern AdSense flags.
6. **Recommended Phase 1 (fast, defensive — pre-review)**: remove or gate `AdSlot` from low-content pages, hide `/store` from indexing, and noindex empty results. Estimated **~1 small implementation sprint, code-only, no Stripe/Vercel changes**. Phase 2 (content depth) is slower and follows after Phase 1 unblocks review.

---

## Scope of input

- `AGENTS.md`, `LAUNCH_AUDIT.md`, `LEGAL.md`, `PRODUCT_STRATEGY.md`, `CURRENT_HANDOFF.md`, `ROADMAP.md`
- `reports/qa-open-items-audit-2026-05-19.md`, `reports/blog-seo-content-strategy-audit-2026-05-19.md`, `reports/dilemma-depth-audit-2026-05-19.md` (referenced), `reports/it-topic-landing-parity-audit-2026-05-19.md`, `reports/gsc-indexing-diagnosis-2026-05-18.md`, `reports/stale-dynamic-404-proof-2026-05-18.md`
- `app/{page,sitemap,robots}.tsx/.ts`, `app/{it/,}{play,results,blog,[topicSlug],blog/topics,blog/[slug],store,about}/page.tsx`, `components/{AdSlot,DilemmaInsightSection,BlogArticle,RelatedDilemmas,store/ProductCard}.tsx`, `lib/{dilemma-seo-insights,static-insights,expert-insights,purchases,seo-topics,blog,blog-clusters,category-hub-copy,scenarios}.ts`

No prior AdSense-specific report existed on disk. This is the first.

---

## Where ads actually render today

| Surface | URL pattern | Slot env | Indexable | Volume | Per-page original content above the ad |
|---|---|---|---|---|---|
| Homepage EN | `/` | `NEXT_PUBLIC_ADSENSE_SLOT_HOME` | yes | 1 | Rich: DilemmaGrid + DailyDilemma + multiple sections + PersonalityTeaser. **OK.** |
| Homepage IT | `/it` | same | yes | 1 | Same shape. **OK.** |
| Play EN | `/play/[id]` | `NEXT_PUBLIC_ADSENSE_SLOT_PLAY` | yes | 41 static + ~390 dynamic AI reachable internally | 1-2 lines question + 2 options + DilemmaInsightSection (category fallback for 36/41 static + 100% dynamic) + RelatedDilemmas. **THIN for 36 static + all dynamic.** |
| Play IT | `/it/play/[id]` | same | yes | 41 static + ~390 dynamic AI | Same. **THIN.** |
| Results EN | `/results/[id]` | `NEXT_PUBLIC_ADSENSE_SLOT_RESULTS` | yes | 41 static + ~390 dynamic AI | Vote bars (or "0 votes — be the first") + DilemmaInsightSection (results variant, same templates) + share UI. **THIN, ACUTE when `total === 0`.** |
| Results IT | `/it/results/[id]` | same | yes | 41 static + ~390 dynamic AI | Same. **THIN.** |

Total ad-bearing URLs: **3 surface families, ~84 static + hundreds of dynamic reachable**.

**Ads DO NOT render on**:
- Blog posts and blog index (`/blog`, `/it/blog`, `/blog/<slug>`, `/it/blog/<slug>`) — `BlogArticle.tsx` has no AdSlot. This is actually fine right now: blog is the strongest original-content cluster (32 EN + 32 IT) and putting ads on a clean cluster wouldn't fix the rejection.
- Topic landings (`/<slug>`, `/it/<slug>`) — `app/[topicSlug]/page.tsx` has no AdSlot.
- Blog cluster hubs (`/blog/topics/<slug>`, `/it/blog/temi/<slug>`).
- Category hubs (`/category/<cat>`, `/it/category/<cat>`).
- `/about`, `/it/about`, `/faq`, `/privacy`, `/terms`, `/store`, `/trending`, `/personality`.

**Single ad slot per ad-bearing page**. Ratio is conservative — this is NOT an "ads outweigh content" issue. It's a "content next to the ad is thin/templated" issue.

---

## Detailed risky-surface audit

### 1. `/play/[id]` + `/it/play/[id]` for the **36 static dilemmas without per-id insight** — **P0**

**Why low-value to AdSense.** Above-the-ad content is dominated by templated category framings from `lib/dilemma-seo-insights.ts`. Each category has 3 framings + 3 tensions + 4 prompts; picked deterministically by id. With ~4-5 dilemmas per category, an AdSense reviewer who clicks 3 random dilemmas in the same category will see **near-identical insight copy** because the variation budget is exhausted. The DilemmaInsightSection paragraph + the 2 prompt bullets are the only "publisher commentary" on these pages.

**Evidence.**
- `lib/dilemma-seo-insights.ts:556` lines — 9 categories × {3 framings, 3 tensions, 4 prompts} per locale × 2 locales.
- `lib/static-insights.ts` lists only 5 ids (`PILOT_IDS` in [tests/unit/static-insights.test.ts](tests/unit/static-insights.test.ts)).
- `app/play/[id]/page.tsx:223-225` mounts `<DilemmaInsightSection .../>` then `<RelatedDilemmas .../>` then `<AdSlot .../>` — same shape for every static id.
- 41 - 5 = **36 static dilemmas** rely on the templated fallback in EN. Same in IT.

**Severity**: **P0** — primary AdSense risk vector.

**Recommended remediation**:
- **A (fast, pre-review)**: gate `AdSlot` rendering in [app/play/[id]/page.tsx:225](app/play/[id]/page.tsx#L225) so ads only render when `hasStaticInsight(scenario.id) === true`. Effort: ~10 min.
- **B (medium, post-review)**: extend `lib/static-insights.ts` from 5 ids to all 41 static ids. Effort: 1-2 days of focused writing, EN+IT. This is the structural fix.
- **C (medium)**: expand `lib/dilemma-seo-insights.ts` framings/tensions/prompts from 3/3/4 to 8/8/8 per category, with per-id deterministic picking by hash. Reduces template feel without per-id writing. Effort: ~3-4 h.

**Legal/ads policy docs triggered**: no — ad placement is a publisher policy decision, no LEGAL surface change.

**Fix before re-review?** **YES — option A is the minimum gate.**

### 2. `/play/[id]` + `/it/play/[id]` for **dynamic AI scenarios (~390 EN + ~390 IT reachable)** — **P0**

**Why low-value to AdSense.** Dynamic scenarios have AI-generated `seoTitle` + `seoDescription` + sometimes per-id insight (`expertInsightEn` / `expertInsightIt` on `DynamicScenario`), but in practice most dynamic scenarios in Redis don't carry rich insight copy — they were generated for vote-loop volume, not for editorial depth. Reaching them is easy: a reviewer can navigate from `/trending` or click `RelatedDilemmas` from a static dilemma. Each one is force-dynamic + show same `DilemmaInsightSection` shape + ad. To a reviewer browsing 3-4 of them, the "AI-generated content with ads" pattern is unmistakable.

**Evidence.**
- `app/sitemap.ts:26-32` excludes AI scenarios from sitemap, but they remain reachable via internal links.
- `RelatedDilemmas` (per session memory, used inside `app/play/[id]/page.tsx:224`) mixes static + dynamic.
- Dynamic scenarios are 779 approved per `CURRENT_HANDOFF.md` content inventory.

**Severity**: **P0**.

**Recommended remediation**:
- **A (fast)**: same gate as risk #1 — only render `AdSlot` when `hasStaticInsight(scenario.id) === true`. This auto-excludes 100% of dynamic AI ids because `lib/static-insights.ts` only has static-prefix ids.
- **B (medium)**: add a `noindex, follow` meta on dynamic scenario play+results pages until they accumulate ≥ N votes (e.g. ≥ 50). This stops Google from indexing the AI scenarios as standalone documents while keeping internal flow intact. Effort: ~15 min.

**Fix before re-review?** **YES — option A.**

### 3. `/results/[id]` + `/it/results/[id]` when `total === 0` — **P0**

**Why low-value to AdSense.** Above the ad the user sees: 0% / 0% bars (or "be the first to vote" placeholder), same templated `DilemmaInsightSection` (results mode, same category fallback), share UI. There is no aggregate insight to discuss because there are no votes. The page exists only as a future placeholder. With the 5 rewritten dilemmas at fresh-zero today and dynamic AI scenarios that don't always accumulate votes, this state is common.

**Evidence.**
- `app/results/[id]/page.tsx:73-76`: `const total = votes.a + votes.b; const pctA = total > 0 ? Math.round((votes.a / total) * 100) : 0`.
- `ResultsClientPage.tsx:1093` mounts `<AdSlot .../>`.
- Today's deploy: PM confirmed `votes:rich-or-fair, votes:censor-speech, votes:deepfake-expose, votes:prison-abolition` all returned `0` on DEL (i.e. were already absent). All 5 rewritten dilemmas start at `total === 0`. Plus `robot-judge` accidentally absent too.

**Severity**: **P0** — most acute on the 5 highest-profile rewritten dilemmas.

**Recommended remediation**:
- **A (fast)**: in [ResultsClientPage.tsx:1093](app/results/[id]/ResultsClientPage.tsx#L1093), gate `AdSlot` to render only when `total >= MIN_VOTES_FOR_AD` (suggested: 50 or 100). Pass `total` as a prop from `app/results/[id]/page.tsx`. Effort: ~15 min.
- **B (medium)**: also add `robots: { index: false, follow: true }` to results pages when `total === 0` AND the id has no per-id insight. Keeps the URL crawlable for discovery but excludes it from the indexed corpus. Effort: ~15 min.
- **C (slow, structural)**: pre-seed every static dilemma's Redis aggregate with realistic anonymous-vote counts at deploy time. **NOT RECOMMENDED** — `/about` page explicitly states "We do not fabricate numbers or seed dilemmas with synthetic votes." Don't break the editorial promise.

**Fix before re-review?** **YES — option A at minimum.**

### 4. `/store` indexable while in "coming soon" state — **P1**

**Why low-value to AdSense.** `/store` is in the sitemap with priority 0.6 (`app/sitemap.ts:182-186`). The page renders 14 product cards, each with a "Buy now" CTA that opens the "Checkout coming online soon — sit tight" modal (per the just-closed `STRIPE-STORE-COSMETICS-CHECKOUT-CONFIG-AUDIT-01` decision). To an AdSense reviewer this is a textbook "incomplete commerce surface" — looks unfinished, looks like an aggregator/affiliate placeholder. Even though no ads render on `/store` itself, reviewers form holistic judgements of the site, and an unfinished e-commerce page hurts the overall "site readiness" signal.

**Evidence.**
- `app/store/page.tsx` — fully rendered, no `robots: { index: false }`, no auth gate.
- `app/sitemap.ts:182-186` includes `${BASE}/store` with `priority: 0.6`.
- All 14 `STRIPE_PRICE_*` env vars unset (per [reports/qa-open-items-audit-2026-05-19.md](reports/qa-open-items-audit-2026-05-19.md)) → all 14 cards trigger the modal.

**Severity**: **P1**.

**Recommended remediation**:
- **A (fast)**: add `export const metadata = { robots: { index: false, follow: true } }` to `app/store/page.tsx` and `app/it/store/page.tsx`. Remove `/store` from sitemap (`app/sitemap.ts:182-186`). Effort: ~10 min.
- **B (slower, no code change today)**: launch one Pixie product per `STORE-ONE-TIME-LAUNCH-01` runbook, making the store look complete on at least one purchasable item. PM has explicitly declined this option for now.

**Fix before re-review?** **YES — option A. The PM decision to defer Store launch is independent of indexing.** Indexing an "unfinished commerce surface" doesn't help search and hurts AdSense review.

**LEGAL trigger**: no — robots noindex doesn't change data flows.

### 5. About page is adequate but could be richer — **P2**

**Why low-value to AdSense.** `/about` and `/it/about` have Mission + Editorial Standards + Who + Contact, ~250-300 words each. This satisfies AdSense's minimum publisher-identity bar but doesn't go beyond. There's no author byline anywhere on the site, no team page, no transparency log (e.g. "dilemmas we rejected and why"), no methodology page.

**Evidence.**
- `app/about/page.tsx` and `app/it/about/page.tsx` read in this audit.
- `BlogArticle.tsx` author field uses `Organization` not `Person` (per `app/blog/[slug]/page.tsx:118` JSON-LD).

**Severity**: **P2** — meaningful but not the primary blocker.

**Recommended remediation**:
- **A (medium)**: add an `/editorial-policy` and `/methodology` page (EN+IT). Document: how AI content is reviewed, what's rejected, the role of the human editor, the boundary between entertainment and research. Effort: ~3-4 h.
- **B (medium)**: add a real author byline on at least the cornerstone blog posts (e.g. `Matteo Pizzi, editor` or `SplitVote Editorial`). Change `author: { '@type': 'Organization' ... }` to `Person` where applicable. Effort: ~1 h.
- **C (fast, low-effort)**: extend `/about` from ~300 to ~600-800 words. Add: a "Why moral dilemmas?" section, a "Why anonymous voting matters" section, examples of how the editorial process has rejected/changed dilemmas. Effort: ~2 h, content-only.

**Fix before re-review?** **OPTIONAL** — improves the holistic review but isn't the smoking gun. Defer to Phase 2.

### 6. Template feel across topic landings — **P2**

**Why low-value to AdSense.** 11 EN + 11 IT topic landings (`/[topicSlug]`, `/it/[topicSlug]`) all share the same skeleton: hero (headline + intro + tension chip) → primary dilemma card → research note (if present) → related dilemmas grid → related topics → vote-next loop. A reviewer who clicks 4 of them sees the same structural fingerprint. The content IS original (per `lib/seo-topics.ts` data), but the format repetition shows.

**Evidence.**
- `app/[topicSlug]/page.tsx` rendering structure (lines 154-374).
- 11+11 reciprocal parity confirmed in `reports/it-topic-landing-parity-audit-2026-05-19.md`.

**Severity**: **P2** — topic landings don't have ads, so they don't directly trigger the rejection, but they contribute to the "site feels templated" gestalt.

**Recommended remediation**:
- Vary the skeleton: not every topic needs research-note + related-topics; some can lead with a long-form intro instead. Effort: ~2-3 h of design + 1-2 h per topic to vary. Total ~6-10 h. Defer to Phase 2.

**Fix before re-review?** **NO** — not a P0/P1.

### 7. Blog posts — actually a strength, not a risk — **OK**

32 EN + 32 IT posts, every post has `relatedDilemmaIds` linking back to dilemmas, `BlogPosting` JSON-LD, no ads, real images. Strong cluster.

**One small defect** carried over from `blog-seo-content-strategy-audit-2026-05-19.md`: 2 posts reference invalid dilemma id `why-not-intervene` (item 2.5 in the QA open-items audit). Doesn't affect AdSense directly but is a real data defect. Defer to a separate small sprint.

**Recommendation**: do not change blog ad strategy. Blog is the cleanest cluster on the site.

### 8. Category hubs — recently fixed, low risk — **OK**

`CATEGORY-CONTENT-FAQ-PARITY-01` shipped editorial + FAQ to all 9 categories × 2 locales (18 May 2026). Category hubs now have hero copy + FAQ + dilemma grid. No ads. Adequate.

### 9. EN/IT mirror structure could read as duplicate — **P3**

Every dilemma page exists as EN + IT pair. `hreflang` correctly declares them as alternates. A search engine handles this correctly via the hreflang signal. An AdSense reviewer scrolling EN → IT sequentially without checking hreflang may perceive duplication. Risk is low because reviewers are usually informed about i18n; mitigation is unnecessary unless AdSense follow-up specifically flags it.

**Severity**: **P3**.

**Recommendation**: no action unless explicitly flagged.

---

## Audit answers to the brief's 10 questions

1. **Which indexed/public page types may look thin to AdSense?**
   - Play pages for the 36 static dilemmas without per-id insight — **P0**.
   - Play pages for all reachable dynamic AI scenarios — **P0**.
   - Results pages with `total === 0` — **P0**.
   - `/store` (indexable + 14 unfinished products) — **P1**.
   - Repeated topic-landing skeleton — **P2**.

2. **Are ads rendered on pages with too little publisher content or mostly interactive/behavioral UI?** **Yes.** Play pages are dominated by 2 vote buttons + 1-2 lines of question + templated category insight + ad. Results pages with 0 votes are even thinner. Both render an `AdSlot` below.

3. **Are there pages in sitemap that should be noindex until they have enough content/votes/content depth?**
   - `/store` — **YES** (immediate).
   - Static results pages where `total === 0` — yes when paired with no per-id insight (medium priority).
   - Dynamic AI scenarios are already excluded from sitemap. Internal links remain — they could carry `robots: { index: false, follow: true }` conditional on low vote count.

4. **Are there pages with repeated template copy, generic AI-like intros, duplicated EN/IT structure, or low original commentary?** **Yes.** `lib/dilemma-seo-insights.ts` provides only 3 framings + 3 tensions + 4 prompts per category. The 36 static dilemmas without per-id insight + 779 dynamic dilemmas all render from this small pool. Reviewers hitting 3-4 same-category pages will see overlap.

5. **Are results pages with 0 votes, generic insight, or no per-id insight especially risky?** **Yes — P0.** This is the single highest-risk page-state in the audit.

6. **Does the site have enough visible "about / publisher / editorial purpose / contact / trust" context for AdSense review?** **Marginally.** `/about` meets the minimum bar. No author bylines, no editorial-policy page, no transparency log. Could be richer (P2).

7. **Are there public surfaces where the ad/content ratio could look bad?** **The ratio itself is conservative** — 1 ad per page, max. The problem is content density next to the ad, not ad density. No multi-ad layouts.

8. **Are AI/dynamic/generated pages exposed in ways that look mass-produced?** **Yes.** ~779 dynamic scenarios are reachable via `RelatedDilemmas` + `/trending`. They use AI-generated meta + templated insight + same ad shape. Sitemap exclusion is partial mitigation only.

9. **Are blog posts and topic pages enough to demonstrate original added value, or do they need stronger analysis, examples, sources, and internal references?** Blog cluster is **strong already** — 32 EN + 32 IT, original commentary, internal links, image attribution. Topic landings are **good content + templated layout** — the original prose is fine, the repetition of skeleton across 22 URLs is the gestalt risk. Neither bears ads today.

10. **Could "coming soon" paid store items hurt perceived site completeness for AdSense?** **Yes.** Recommend noindex + sitemap removal for `/store` and `/it/store` until launched. Code change: add `robots: { index: false, follow: true }` metadata and remove from `app/sitemap.ts`. PM has decided to defer Store launch — that decision is independent and doesn't need to change.

---

## Recommended remediation plan

### Phase 1 — Defensive (pre-re-review, ~1 small implementation sprint, code-only)

Goal: stop showing ads on thin/templated/empty surfaces, and stop signaling unfinished commerce to reviewers. Estimated effort: **1.5-2 hours total**.

| # | Change | File | Effort |
|---|---|---|---|
| 1.1 | Gate `AdSlot` on `/play/[id]` and `/it/play/[id]` to render only when `hasStaticInsight(scenario.id) === true` | `app/play/[id]/page.tsx`, `app/it/play/[id]/page.tsx` | 15 min |
| 1.2 | Gate `AdSlot` on `/results/[id]` and `/it/results/[id]` to render only when `total >= 50` AND `hasStaticInsight(scenario.id) === true` | `app/results/[id]/page.tsx` (pass `total` to client), `ResultsClientPage.tsx`, IT mirror | 30 min |
| 1.3 | Noindex + sitemap-remove `/store` and `/it/store` | `app/store/page.tsx`, `app/it/store/page.tsx` (add `robots: { index: false, follow: true }`), `app/sitemap.ts` (remove the entry) | 15 min |
| 1.4 | Noindex dynamic AI scenario play+results pages when not in `static-insights` AND `total < 50` | `app/play/[id]/page.tsx` (add `robots` to `generateMetadata`), same for results, IT mirrors | 30 min |
| 1.5 | Verification | `npm run typecheck`, `npm run build`, local smoke of 4 URL classes | 15 min |

**EN/IT parity**: every change above must be applied to both locale routes — non-negotiable per AGENTS.md anti-regression rules.

**Production-safety**: none of the changes touch vote flow, Redis, Supabase, Stripe, auth, or middleware. All are metadata + render-gate changes.

### Phase 2 — Substantive (post-review, content + structure)

| # | Change | Effort |
|---|---|---|
| 2.1 | Extend `lib/static-insights.ts` from 5 to 41 static dilemmas (EN+IT) | 1-2 days |
| 2.2 | Expand `lib/dilemma-seo-insights.ts` from 3/3/4 variants per category to 8/8/8 with hash-based deterministic picking | 3-4 h |
| 2.3 | Extend `/about` from ~300 to ~600-800 words; add `/editorial-policy` + `/methodology` (EN+IT) | 3-4 h |
| 2.4 | Add `Person`-typed author byline on cornerstone blog posts | 1 h |
| 2.5 | Vary topic-landing skeleton across the 11 EN + 11 IT landings | 6-10 h |
| 2.6 | Fix invalid `why-not-intervene` dilemma id in 2 blog posts (open item 2.5 from QA audit) | 15 min |

Phase 2 can run after AdSense review approval, in parallel with other product work.

### Phase 3 — Optional, monitor-then-act

| # | Change | Trigger |
|---|---|---|
| 3.1 | Add ads.txt verification check | If AdSense follow-up flags `ads.txt` (already present at `public/ads.txt`, verify content matches publisher id `ca-pub-5232020244793649`) |
| 3.2 | Adjust ad gates if review still flags after Phase 1 | If AdSense rejects again post-Phase-1 |

---

## Legal / policy doc impact

- **LEGAL.md**: no update needed. Phase 1 changes don't alter data flows, processors, cookies, tracking, or user data. Noindex is a publisher-facing signal, not a privacy surface.
- **Terms of Service**: no update needed.
- **Privacy Policy**: no update needed.
- **AGENTS.md anti-regression rules**: Phase 1 preserves all of them — vote anonymity, EN/IT parity, no service-role on client, no caching of play pages, no sitemap mass-removal (only `/store` removed). Confirm in implementation sprint.

---

## Do not request AdSense review until these are done

Checklist (paste this into the implementation sprint's verification step):

- [ ] `AdSlot` on `/play/[id]` and `/it/play/[id]` renders **only** when `hasStaticInsight(scenario.id) === true`. Verified by checking 3 static dilemmas (1 with per-id insight, 2 without) and 1 dynamic AI dilemma — only the first should show an ad container.
- [ ] `AdSlot` on `/results/[id]` and `/it/results/[id]` renders **only** when `total >= 50` AND the scenario is in `lib/static-insights.ts`. Verified by checking the 5 rewritten dilemmas (currently `total === 0` → no ad) and the 3 highest-vote static dilemmas (should show ad if both gates pass).
- [ ] `/store` and `/it/store` return `<meta name="robots" content="noindex, follow">` in the SSR HTML. Verified with `curl -s https://splitvote.io/store | grep -i robots`.
- [ ] `https://splitvote.io/sitemap.xml` no longer lists `/store` or `/it/store`. Verified with `curl -s https://splitvote.io/sitemap.xml | grep -i store` — empty.
- [ ] Dynamic AI scenario play+results pages with `total < 50` carry `robots: { index: false, follow: true }`. Verified on 2 random AI ids.
- [ ] `npm run typecheck` + `npm run build` pass.
- [ ] Live smoke: 3 static dilemmas without per-id insight + 3 dynamic AI dilemmas show NO ad container. The 5 rewritten dilemmas show NO ad on results (0 votes). The homepage still shows its ad.
- [ ] Vercel production deploy live. Wait 24 h. Then submit AdSense review.

---

## Risks of the recommended Phase 1

1. **Revenue downside (zero today, marginal mid-term).** AdSense is currently rejected — there is no AdSense revenue to lose. Once approved, the gates will reduce the indexed ad surface to a smaller subset (only static dilemmas with per-id insight + high vote count). As Phase 2 lands and `static-insights` grows, gates relax automatically.
2. **Indexing churn for `/store`.** Removing `/store` from sitemap + noindex will cause Google to drop it from index over ~30-60 days. Low impact since `/store` has no organic search traffic intent.
3. **No new bugs anticipated.** Phase 1 is metadata + conditional render. The `<DilemmaInsightSection .../>` and `<RelatedDilemmas .../>` still render — only the `<AdSlot .../>` is gated. SEO-discoverable internal links are preserved.
4. **AdSense reviewer behavior is opaque.** Phase 1 is the minimum defensible posture. If AdSense rejects again after Phase 1, the next move is Phase 2 (substantive content depth) rather than further gating.

---

## Files / docs touched by this audit

- **New**: `reports/adsense-low-value-remediation-audit-2026-05-19.md` (this file).
- **No source files modified.** No PM WIP touched.
- No commits, no pushes, no Redis or Supabase operations.

---

## Verification

- `git status --short` — only this new untracked report file plus the PM WIP from earlier in the session.
- `git diff --check` — n/a (no edits to existing files).
- `npm run typecheck` / `npm run build` — not run (docs-only audit).
