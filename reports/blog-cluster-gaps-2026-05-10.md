# Blog Cluster Gap Audit — SplitVote (Post-G3)

**Generated:** 2026-05-10
**Previous audit:** [`blog-cluster-gaps-2026-05-09.md`](./blog-cluster-gaps-2026-05-09.md) (drove G1+G2+G3 sprints)
**Scope:** Static blog (`lib/blog.ts`) × Research sources (`lib/research-sources.ts`) × SEO topic landing pages (`lib/seo-topics.ts`)
**Mode:** SAFE_AUTONOMOUS read-only — no production changes
**HEAD:** `98b53c2` (G3 ethics trio merged + pushed)

---

## TL;DR — what changed since 9 May

5 of 11 clusters moved from gap → resolved by G1+G2+G3 sprints:
- ✅ `ai-ethics` (G1)
- ✅ `loyalty-honesty` (G2)
- ✅ `consequentialism` (G3)
- ✅ `deontology` (G3)
- ✅ `virtue-ethics` (G3)

**Remaining gaps (5):** `harm-prevention`, `privacy`, `moral-foundations` (buried), `experimental-moral-psychology`, `bioethics` (still critical).

**New gap that emerged:** the 3 G3 articles have no SEO landing pages aggregating them — pure article-level SEO without topic-level surfaces means each ranks alone instead of as a cluster. This is **the highest-leverage next move**.

---

## 1. Inventory snapshot

### Static blog articles — 32 total (16 EN + 16 IT)

**EN (16):**
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
11. `moral-dilemmas-examples` (parity fix, 9 May)
12. `ai-ethics-what-40-million-people-chose` (G1, 9 May)
13. `loyalty-vs-honesty-when-they-collide` (G2, 9 May)
14. `consequentialism-the-greatest-good` (G3, 10 May)
15. `deontology-some-things-are-always-wrong` (G3, 10 May)
16. `virtue-ethics-what-would-a-good-person-do` (G3, 10 May)

**IT (16):** full parity — every EN article has IT pair via `alternateSlug`.

### SEO landing pages — 6 total (3 EN + 3 IT)

EN: `/trolley-problem`, `/ai-ethics-dilemmas`, `/loyalty-vs-honesty`
IT: `/it/problema-del-carrello`, `/it/dilemmi-etici-intelligenza-artificiale`, `/it/lealta-vs-onesta`

**Landing/article ratio:** 6 landings vs 32 articles → highly asymmetric. Most clusters have articles but no topic-level SEO surface.

### Research source clusters — 11 declared, 10 sources

`trolley-problem` (5 sources), `harm-prevention` (3), `ai-ethics` (2), `loyalty-honesty` (2), `experimental-moral-psychology` (2), `consequentialism` (1), `deontology` (1), `virtue-ethics` (1), `privacy` (1), `moral-foundations` (1), `bioethics` (**0 sources** — declared but empty).

---

## 2. Cluster coverage matrix (post-G3)

| Cluster | Sources | Article(s) | Landing | Status | Δ vs 9 May |
|---|---|---|---|---|---|
| trolley-problem | 5 | 2 + indirect via consequentialism | ✅ `/trolley-problem` | ✅ STRONG | unchanged |
| harm-prevention | 3 | 0 | (folded in trolley) | ⚠️ Source-rich, no dedicated article | unchanged |
| ai-ethics | 2 | ✅ G1 article | ✅ `/ai-ethics-dilemmas` | ✅ RESOLVED | **G1 ✅** |
| privacy | 1 | 1 tangential | 0 | ⚠️ Thin | unchanged |
| loyalty-honesty | 2 | ✅ G2 article | ✅ `/loyalty-vs-honesty` | ✅ RESOLVED | **G2 ✅** |
| moral-foundations | 1 | buried in personality | 0 | ⚠️ Buried | unchanged |
| consequentialism | 1 | ✅ G3 article | **❌ no landing** | ⚠️ Article without topic surface | **G3 article ✅, landing 🔴** |
| deontology | 1 | ✅ G3 article | **❌ no landing** | ⚠️ Article without topic surface | **G3 article ✅, landing 🔴** |
| virtue-ethics | 1 | ✅ G3 article | **❌ no landing** | ⚠️ Article without topic surface | **G3 article ✅, landing 🔴** |
| experimental-moral-psychology | 2 | 1 tangential | 0 | ⚠️ | unchanged |
| **bioethics** | **0** | **0** | **0** | 🔴 **STILL CRITICAL** | unchanged |

---

## 3. New gaps that emerged from G1/G2/G3

### Gap A — Ethics theory articles have no aggregating landing pages

The 3 G3 articles (consequentialism / deontology / virtue ethics) live as standalone blog posts. There is no `/consequentialism`, `/deontology`, or `/virtue-ethics` SEO landing page that:
- Aggregates the article + related dilemmas + cross-references to other theories
- Ranks for category-level queries ("what is consequentialism", "deontology examples")
- Lifts each article from "buried in /blog" to "topic hub"

**Why this matters more than a new article sprint:** the content is already written. Adding 3 landing pages multiplies its SEO value at ~20% the effort of writing new articles. SplitVote already has a working landing-page pattern (`/trolley-problem`, `/ai-ethics-dilemmas`, `/loyalty-vs-honesty`) — replicating it for the ethics theories trio is mechanical.

### Gap B — Internal linking from old articles → new G3 content

`trolley-problem-explained` and `ethical-dilemmas-everyday-life` were written before G3. They mention consequentialism and deontology but cannot link to dedicated articles (because there were none). Now there are. A 30-minute linking refresh would route existing article traffic into G3 content.

### Gap C — `relatedDilemmaIds` are populated but the surfaces don't render them

A spot-check of `app/blog/[slug]/page.tsx` would confirm whether the `relatedDilemmaIds` field is actually rendered as a "Related dilemmas" rail at article-bottom. If not, the field is dead metadata. (Out of scope for this read-only audit — flagged for verification next time the blog template is touched.)

---

## 4. Persisting gaps from 9 May audit (still open)

### Tier 1 — Easy wins with existing source backing

**G4. Harm Prevention article** — 3 sources (`sep-doing-allowing`, `sep-moral-dilemmas`, partial Greene) but zero dedicated article. Strong philosophical anchor.
- **Suggested title:** *"Doing vs Allowing Harm — When Inaction Is Also a Choice"*
- **CTAs:** trolley, plane-parachute, pandemic-dose, mercy-kill, steal-medicine
- **Why it ranks:** "doing vs allowing harm" + "act/omission distinction" are evergreen philosophy queries with little SplitVote-style competition

**G5. Privacy standalone** — 1 source (SEP Privacy). Bridges anonymous voting + AI surveillance + GDPR.
- **Suggested title:** *"What Privacy Means in a World of Public Voting"*
- **CTAs:** surveillance-city, privacy-terror, deepfake-expose, censor-speech, delete-social-media

**G6. Moral Foundations standalone** — currently buried in `what-your-moral-personality-means`. Split into dedicated article for "moral foundations theory" SEO query (with mandatory disclaimer).

### Tier 2 — Decision required

**G8. Bioethics cluster** — declared in `MoralCluster` type with **zero sources, zero content, zero landing**. Two paths:
- **Build:** find ≥2 SEP/journal sources (e.g. SEP "Bioethics", Hastings Center reports), design ≥1 dilemma (mercy-kill exists, organ-harvest exists — could anchor), build landing + article
- **Prune:** remove `'bioethics'` from `MoralCluster` union to eliminate code smell

PM decision required — recommend pruning unless bioethics is part of strategic content roadmap. Adding sources for a cluster you don't intend to publish creates technical debt.

---

## 5. Updated sprint sequence (post-G3)

Re-ordered by impact ÷ effort given current state:

| Order | Sprint | Effort | Type | Why now |
|---|---|---|---|---|
| 1 | **G9 — Internal linking refresh** | Small (~30 min) | SAFE_AUTONOMOUS | Activates G3 traffic from existing articles, zero new content |
| 2 | **G7 — Ethics theory SEO landings** (3 EN + 3 IT) | Medium (~90 min) | SAFE_AUTONOMOUS | Multiplies G3 article SEO value, mechanical replication of existing landing pattern |
| 3 | **G4 — Harm Prevention article** (EN+IT) | Medium | SAFE_AUTONOMOUS | Activates 3 underused authoritative sources |
| 4 | **G5 — Privacy standalone** (EN+IT) | Medium | SAFE_AUTONOMOUS | GDPR + AI ethics SEO bridge, reinforces trust signals |
| 5 | **G6 — Moral Foundations split** (EN+IT) | Small | SAFE_AUTONOMOUS | Frees buried content for "moral foundations" search query |
| 6 | **G8 — Bioethics decision** | PM call | HUMAN_ONLY | Build foundation or prune from type — cannot proceed autonomously |

---

## 6. Recommended next sprint: G9 + G7 (combined)

Best ROI for one 90-minute sprint = **G9 (internal linking refresh) + G7 (ethics theory landings)** combined. Together they:

1. Route existing article traffic into the new G3 content (linking refresh)
2. Add 6 new SEO landing pages that aggregate G3 articles + related dilemmas (theory landings)
3. Bring landing-to-article ratio from 6/32 → 12/32 (much healthier topic surface coverage)

**Total scope:** edit 2-3 existing articles for cross-links, add 3 SEO topic objects to `lib/seo-topics.ts` with EN+IT pairs, ensure `app/[topicSlug]/page.tsx` renders correctly for the new slugs.

**Estimated impact:** comparable to writing 1 new article each in G4/G5/G6, at half the effort.

---

## 7. Out of scope (for future audits)

- Redis-published blog drafts inventory (admin export needed)
- Search Console performance per article (post-launch data)
- Backlink profile (separate analysis dimension)
- Personality archetype × article matrix (could surface which articles map to which archetype results pages)

---

## Appendix — Files referenced

- Static blog source: `lib/blog.ts` (3,184 lines, EN 26-1595, IT 1597-3160)
- Published Redis loader: `lib/blog-published.ts`
- Research source registry: `lib/research-sources.ts` (11 clusters declared, 10 sources, 1 cluster empty)
- SEO landing pages: `lib/seo-topics.ts` (3 EN + 3 IT)
- Blog routes: `app/blog/[slug]/page.tsx`, `app/it/blog/[slug]/page.tsx`
- Topic landing route: `app/[topicSlug]/page.tsx`
