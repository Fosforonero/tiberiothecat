# Blog Cluster Gap Audit — SplitVote

**Generated:** 2026-05-09
**Scope:** Static blog (`lib/blog.ts`) × Research sources (`lib/research-sources.ts`) × SEO topic landing pages (`lib/seo-topics.ts`)
**Out of scope:** Redis-published blog drafts (require admin export to inventory)
**Mode:** SAFE_AUTONOMOUS read-only — no production changes

---

## 1. Inventory snapshot

### Static blog articles (`lib/blog.ts`) — 20 total

**EN (10):**
| Slug | Cluster signal (tags) |
|---|---|
| `what-is-a-moral-dilemma` | ethics, philosophy, moral psychology |
| `trolley-problem-explained` | trolley problem, ethics, classic dilemmas |
| `why-people-love-impossible-choices` | psychology, moral psychology, social sharing |
| `hard-would-you-rather-questions` | would you rather, hard questions |
| `trolley-problem-statistics` | trolley problem, poll results |
| `ethical-dilemmas-everyday-life` | ethics, ethical dilemmas |
| `what-is-splitvote` | platform/explainer |
| `how-anonymous-voting-works` | privacy, anonymous voting |
| `how-to-read-splitvote-results` | results, data |
| `what-your-moral-personality-means` | personality, archetypes |

**IT (10):** mirror with two mismatches (see §4).

### SEO landing pages (`lib/seo-topics.ts`) — 6 total
- EN: `/trolley-problem`, `/ai-ethics-dilemmas`, `/loyalty-vs-honesty`
- IT: `/it/problema-del-carrello`, `/it/dilemmi-etici-intelligenza-artificiale`, `/it/lealta-vs-onesta`

### Research source clusters (`lib/research-sources.ts`) — 11 declared
`trolley-problem`, `harm-prevention`, `ai-ethics`, `privacy`, `loyalty-honesty`, `moral-foundations`, `consequentialism`, `deontology`, `virtue-ethics`, `experimental-moral-psychology`, `bioethics`

---

## 2. Cross-check: clusters → existing coverage

| Cluster | Sources count | Dedicated blog articles | Landing pages | Status |
|---|---|---|---|---|
| trolley-problem | 5 | 2 (`trolley-problem-explained`, `trolley-problem-statistics`) | 1 (`/trolley-problem`) | ✅ STRONG |
| harm-prevention | 3 | 0 | (folded into `/trolley-problem`) | ⚠️ Source-rich, no article |
| ai-ethics | 2 | 0 | 1 (`/ai-ethics-dilemmas`) | 🔴 LANDING WITHOUT BLOG |
| privacy | 1 | 1 tangential (`how-anonymous-voting-works`) | 0 | ⚠️ Thin coverage |
| loyalty-honesty | 2 | 0 | 1 (`/loyalty-vs-honesty`) | 🔴 LANDING WITHOUT BLOG |
| moral-foundations | 1 | 1 tangential (`what-your-moral-personality-means`) | 0 | ⚠️ Buried inside personality article |
| consequentialism | 1 | 0 dedicated (touched in trolley) | 0 | 🔴 GAP |
| deontology | 1 | 0 dedicated (touched in trolley) | 0 | 🔴 GAP |
| virtue-ethics | 1 | 0 | 0 | 🔴 GAP |
| experimental-moral-psychology | 2 | 1 tangential | 0 | ⚠️ |
| **bioethics** | **0** | **0** | **0** | 🔴 **CRITICAL — declared cluster, zero everything** |

---

## 3. Gap priorities (ordered by impact × effort)

### Tier 1 — Highest ROI (landing pages exist, audience is already arriving)

**G1. AI Ethics blog cluster** — 1 landing page (`/ai-ethics-dilemmas`) but **zero supporting blog content**.
- **Source backing:** Moral Machine (Awad et al., Nature 2018, 40M decisions, 233 countries) + SEP Privacy entry — both already in registry, both production-quality citations.
- **Suggested article:** *"AI Ethics Dilemmas: What 40 Million People Said About Self-Driving Cars"* — leverages Moral Machine data, links to `/ai-ethics-dilemmas` landing page, dilemma `scenario:self-driving-crash`.
- **Estimated effort:** 1 article EN + 1 article IT (~2,000 words each).
- **Internal linking value:** very high — landing page currently has no related blog content to surface.

**G2. Loyalty vs Honesty blog cluster** — same pattern: landing exists (`/loyalty-vs-honesty` + `/it/lealta-vs-onesta`), zero blog backing.
- **Source backing:** Moral Foundations Theory + SEP Moral Dilemmas.
- **Caveat:** MFT requires disclaimer ("SplitVote axes are inspired by, not a replica of, MFT" per source notes).
- **Suggested article:** *"When Loyalty and Honesty Collide: Moral Foundations Theory in Practice"*.
- **Estimated effort:** 1 EN + 1 IT.

### Tier 2 — Theoretical anchors (high authority, evergreen)

**G3. Three foundational ethics theories trio** — Consequentialism, Deontology, Virtue Ethics each have 1 SEP source but zero dedicated articles. Currently all three are touched superficially inside `trolley-problem-explained`.
- **Suggested approach:** mini-cluster of 3 short explainer articles, each cross-linking to the others + back to `/trolley-problem` landing.
- **Suggested titles:** *"Consequentialism Explained Through Voting Patterns"*, *"Deontology vs Outcomes: When Rules Beat Math"*, *"Virtue Ethics: What Kind of Voter Are You?"*
- **Estimated effort:** 3 EN + 3 IT (shorter, ~1,200 words each).

### Tier 3 — Critical gap, requires research investment

**G4. Bioethics cluster** — declared in `MoralCluster` type but **zero sources, zero content, zero landing**.
- **Decision required:** either populate the cluster (find ≥2 SEP/journal sources, design ≥1 dilemma, build landing page + article) OR remove `bioethics` from the type union if not strategic.
- **Risk if left untouched:** type literal exists with no implementation — code smell.

### Tier 4 — Coverage refinement (don't create new, expand existing)

**G5. Privacy** — only 1 tangential article (`how-anonymous-voting-works`). One source available (SEP Privacy). Could become a dedicated essay *"What Privacy Means in a World of Public Voting"* tying to GDPR/anonymous design.

**G6. Moral Foundations** — buried inside `what-your-moral-personality-means`. Could be split into a standalone article more discoverable for "moral foundations theory" SEO query (with mandatory disclaimer).

---

## 4. EN/IT parity gaps (urgent, quick fixes)

| Article | EN | IT |
|---|---|---|
| `trolley-problem-statistics` | ✅ | ❌ **MISSING** |
| `dilemmi-morali-esempi` | ❌ **MISSING** | ✅ |

**Recommendation:**
- Translate `trolley-problem-statistics` → `statistiche-problema-del-carrello` (high SEO value, matches existing trolley cluster).
- Backport `dilemmi-morali-esempi` → `moral-dilemmas-examples` (the IT version has 15 concrete examples — valuable for EN long-tail SEO).

---

## 5. Internal linking opportunities (no new content needed)

Existing surfaces that could cross-link better today:

1. **`trolley-problem-explained`** → currently doesn't explicitly link to `trolley-problem-statistics`. Adding a "See the data" CTA mid-article would boost time-on-cluster.
2. **`/trolley-problem` landing page** → could surface 2 blog articles + dilemma scenarios in a "Further reading" rail.
3. **`/ai-ethics-dilemmas` landing** → currently has no blog content to link (resolves with G1).
4. **`/personality` page** → could link to `what-your-moral-personality-means` more prominently (verify in next UI sprint).
5. **`what-your-moral-personality-means`** → could deep-link to consequentialism/deontology/virtue-ethics standalones (resolves with G3).

---

## 6. Recommended sprint sequence

If a content-generation sprint is greenlit, suggested order:

| Order | Sprint | Effort | Unblocks |
|---|---|---|---|
| 1 | **EN/IT parity fix** (G4 — translate `trolley-problem-statistics` IT, backport `dilemmi-morali-esempi` EN) | Small | SEO parity, low-hanging fruit |
| 2 | **G1 AI Ethics article** (EN+IT) | Medium | Activates `/ai-ethics-dilemmas` landing, leverages Moral Machine source |
| 3 | **G2 Loyalty vs Honesty article** (EN+IT) | Medium | Activates `/loyalty-vs-honesty` landing |
| 4 | **G3 Three theories trio** (3 articles × EN+IT = 6) | Large | Builds theoretical authority, internal linking density |
| 5 | **G5 Privacy standalone** (EN+IT) | Medium | Boosts /trust signals + GDPR SEO |
| 6 | **G4 Bioethics decision** | PM call | Either build foundation or prune type |

**Suggested model for content generation sprints:** Opus 4.7 (1M context) — long-form editorial tone with academic citations benefits from higher synthesis quality. Sonnet 4.6 sufficient for translation parity fixes.

**Pre-flight for any content sprint:** verify research source URLs still resolve (especially `moralfoundations.org` and `joshua-greene.net` — both flagged as "intermittent" / "may move" in source notes), and confirm the SplitVote disclaimer is rendered for any source flagged `requiresDisclaimer: true`.

---

## 7. Out of scope (for future audits)

- Redis-published blog drafts inventory — requires `getPublishedBlogDrafts()` admin export (not safe to run autonomously without write-Redis surface verification)
- Search Console performance data per article — would refine impact ranking
- Backlink profile per article — out of scope for code-level audit
- Picoclaw external trend signals — separate audit dimension

---

## Appendix — File references

- Static blog source: `lib/blog.ts` (2,214 lines, EN 26-1086, IT 1087-2191)
- Published Redis loader: `lib/blog-published.ts`
- Research source registry: `lib/research-sources.ts` (11 clusters, 10 sources, 1 cluster empty)
- SEO landing pages: `lib/seo-topics.ts` (3 EN + 3 IT)
- Blog routes: `app/blog/[slug]/page.tsx`, `app/it/blog/[slug]/page.tsx`
