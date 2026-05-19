# GSC Indexing Diagnosis — 2026-05-18

Read-only technical audit of splitvote.io indexing posture. No code changes,
no commits. The goal is to feed the next 1–3 SEO sprints with real data
rather than generic best-practice advice.

Source data: live curls against splitvote.io and live `/sitemap.xml`
(<https://splitvote.io/sitemap.xml>, 296 URLs), local source spot-checks
in `app/layout.tsx`, `app/sitemap.ts`, `lib/blog-clusters.ts`,
`lib/category-hub-copy.ts`. No GSC API access — recommendations rely on
the technical artifact, not GSC-pulled URLs.

---

## ⚠️ Correction / Errata (added 2026-05-18 evening)

Two findings in the original audit turned out to be artefacts of bugs in
the audit methodology, not real defects in the codebase. Both have been
verified against the live site and corrected here.

### Retraction 1 — "Hreflang missing on ~112 of 296 URLs" was a FALSE POSITIVE

**Original claim (now retracted):** §Executive summary #3, §Top 5 #2, and
the URL class inventory marked blog, topic landings, indexes, `/trending`,
`/faq`, `/privacy`, `/terms`, `/login` as lacking hreflang.

**Reality:** all 296 sitemap URLs emit reciprocal hreflang correctly.
Re-verified live with a corrected probe: 296 / 296 = 100 % coverage.

**Methodology bug:** the audit's `grep -oE` pattern matched
`hreflang="…"` lowercase, but Next.js (React JSX) serialises the
attribute as `hrefLang="…"` (camelCase). The case-sensitive regex
matched zero hits on perfectly correct markup. A case-insensitive
re-run (`grep -ioE`) shows every page emits the expected
`<link rel="alternate" hrefLang="…">` triplet.

Source-level confirmation: route handlers already use
`alternates.languages` with conditional `alternateSlug` fallback for
orphans — paired posts emit reciprocal alternates, orphans emit only
`en + x-default`. See `app/blog/[slug]/page.tsx:43-47`,
`app/it/blog/[slug]/page.tsx:43-47`, `app/[topicSlug]/page.tsx:57-71`,
and the `alternateSlug?` fields on `BlogPost` in `lib/blog.ts:43-56`
and `SeoTopic` in `lib/seo-topics.ts:11-17`.

**Sprint cancelled:** `SEO-HREFLANG-BLOG-TOPICS-01` was opened to fix a
gap that did not exist. Closed as no-op without commits.

### Retraction 2 — "Dead link `/blog/why-we-love-impossible-choices`" was a FALSE POSITIVE

**Original claim (raised during the hreflang sprint, propagated into
follow-up sprint briefs):** the `/blog` index linked to a 404 slug.

**Reality:** no dead links exist on `/blog` or `/it/blog`. A
follow-up sweep checked 70 blog index links + 54 cluster page links =
**124 / 124 internal blog links return HTTP 200**. The actual EN slug is
`why-people-love-impossible-choices` (the original audit substituted
"we" for "people"), and both `/blog/why-people-love-impossible-choices`
and `/it/blog/perche-ci-piacciono-le-scelte-impossibili` return 200 with
correct reciprocal hreflang. The 404 was a tester typo, not a
production defect.

**Sprint cancelled:** `BLOG-INDEX-DEAD-LINK-AUDIT-01` was opened to fix
a dead link that did not exist. Closed as no-op without commits.

### Retraction 3 — "19 EN vs 12 IT topic landing gap" was a FALSE POSITIVE

**Original claim (now retracted):** §Sitemap counts (live, 2026-05-18)
reported `topic_landing_en + _it = 31 (19 + 12) ← IT 7 fewer than EN`.
§Notable parity gaps and §5 in Top 5 (`Topic landing content gap
(IT 12 vs EN 19)`) recommended a Phase 2 sprint to fill the gap. That
sprint was opened as `IT-TOPIC-LANDING-PARITY-01` on 2026-05-19.

**Reality:** EN and IT topic landings are already at perfect 1:1
reciprocal parity. Audit on 2026-05-19 verified from two independent
sources:

1. `lib/seo-topics.ts`: 11 EN + 11 IT topics, all `status='published'`,
   all `noindexUntilReady=false`, all `relatedScenarioIds.length >= 3`,
   all with reciprocal `alternateSlug` (verified bidirectionally).
2. Live sitemap (`curl https://splitvote.io/sitemap.xml` on 2026-05-19):
   11 EN topic landing URLs (`/<slug>`) + 11 IT topic landing URLs
   (`/it/<slug>`), 1:1 paired. Full list in the follow-up audit report.

**Methodology bug:** the original count of "19 EN" most likely included
non-topic single-segment sitemap URLs (e.g. `/blog/topics/<slug>` × 4 blog
cluster hubs + a handful of core/legal/other surfaces) when filtering
the sitemap for `topic_landing_en`. The bucket attribution was loose;
the 19 figure is not reproducible from either `lib/seo-topics.ts` or
the live sitemap. `git log -- lib/seo-topics.ts` since 2026-05-15 shows
only additions (`8ac8021 feat(seo): /topics + /it/temi hub +
ai-art-ethics landing`), so the file held 11+11 at the time of the
original audit too — it never held 19+12.

**Sprint cancelled:** `IT-TOPIC-LANDING-PARITY-01` was opened on
2026-05-19 to close a gap that did not exist. Phase 1 audit closed it
as no-op without any code, content, or sitemap change. Full audit:
[reports/it-topic-landing-parity-audit-2026-05-19.md](it-topic-landing-parity-audit-2026-05-19.md).

### Methodology rule added

For future audits:

1. Always grep HTML attributes case-insensitively (`-i` flag). React
   serialises JSX attribute names verbatim — `hrefLang`, `crossOrigin`,
   `referrerPolicy`, etc. all keep their camelCase.
2. Always cross-check any URL flagged as dead against the source data
   file (`lib/blog.ts`, `lib/scenarios.ts`, etc.) before reporting —
   don't construct URLs from memory.
3. Always cross-check sitemap bucket counts against the source data
   that drives them (`getIndexableTopics()` / `getIndexableITTopics()`
   for topic landings, etc.) before claiming a parity gap. A manual
   single-segment URL count is not a topic landing count.

### What still stands

- §Executive summary #1 (sitemap health) — ✅ verified, no change.
- §Executive summary #2 (title double-suffix on 22 URLs) — ✅ was real,
  fixed in commit `fb7bd7c` via sprint `SEO-TITLE-TEMPLATE-FIX-01`.
- §Executive summary #4 (404-churn handling correct, exposure persists
  on old Redis-pruned dynamic IDs) — ✅ partly resolved: zero *internal*
  404s today per `SEO-STALE-DYNAMIC-404-PROOF-01`; external GSC-historical
  exposure remains addressable only via `GSC-EXPORT-CROSS-REFERENCE-01`.
- §4 in Top 5 (canonical-to-homepage on `/login` + `/store`) — ✅ still
  valid as a minor cleanup candidate.
- ~~§5 in Top 5 (IT topic landing content gap)~~ — **RETRACTED — see
  Retraction 3 above.** EN and IT topic landings are already at 1:1
  reciprocal parity.

---

## Executive summary

1. **Sitemap structure is healthy.** 296 URLs, no 404s in the sitemap, no
   duplicate `<loc>`s, lifestyle now in both locales (post
   SITEMAP-I18N-CATEGORY-AUDIT-01). Blog cluster URLs (`/blog/topics/<slug>`
   and `/it/blog/temi/<slug>`) all return 200 — an earlier hypothesis that
   these 404 was wrong (it used invented long slugs; real slugs are
   `moral-dilemmas`, `dilemmi-morali`, `ai-ethics`, etc.).
2. **The biggest blocker is title-template doubling.** Root layout sets
   `title.template = '%s | SplitVote'` (`app/layout.tsx:25`). Several
   page classes — category hubs (18 URLs), `/trending` (2),
   `/personality`, `/store` — already include `| SplitVote` in their
   own title, so the template appends a second one. Rendered output:
   `"🧭 Morality Dilemmas — Real-time Votes | SplitVote | SplitVote"`.
   Visible in SERP and social cards on ~22 indexable URLs.
3. ~~**Hreflang coverage is uneven.**~~ **RETRACTED — see Errata above.**
   All 296 sitemap URLs emit reciprocal hreflang correctly. The original
   claim was a false positive caused by a case-sensitive grep on a
   camelCase attribute.
4. **404-churn handling is correct, but exposure persists.** The 404 page
   on a deleted dynamic-scenario id returns `HTTP 404` + `<meta robots
   noindex>` — proper behaviour. The sitemap already excludes AI
   scenarios (intentional, per existing comment), so no new churn is
   sourced from the sitemap. But old indexed dynamic IDs reachable via
   `RelatedDilemmas`/`/trending` continue to be discovered and then
   404 if they roll out of Redis. GSC will keep reporting them until
   they de-index.

---

## URL class inventory

| Class | Sitemap | Indexable | Canonical | Hreflang | ISR/Cache | Thin risk | 404 risk |
|---|---:|---|---|---|---|---|---|
| Homepage EN (`/`) | 1 | yes | self | ✅ en/it-IT/x-default | dynamic | low | none |
| Homepage IT (`/it`) | 1 | yes | self | ✅ | dynamic | low | none |
| Play static EN (`/play/[id]`) | 41 | yes | self | ✅ | force-dynamic | low | none |
| Play static IT (`/it/play/[id]`) | 41 | yes | self | ✅ | force-dynamic | low | none |
| Play dynamic EN (`/play/ai-…`) | 0 | yes | self | ✅ | force-dynamic | medium | medium (Redis retention) |
| Play dynamic IT (`/it/play/ai-…`) | 0 | yes | self | ✅ | force-dynamic | medium | medium |
| Results static EN (`/results/[id]`) | 41 | yes | self | ✅ | revalidate=60 | low | none |
| Results static IT (`/it/results/[id]`) | 41 | yes | self | ✅ | revalidate=60 | low | none |
| Results dynamic EN | 0 | yes | self | ✅ | revalidate=60 | medium | medium |
| Results dynamic IT | 0 | yes | self | ✅ | revalidate=60 | medium | medium |
| Category EN (`/category/<x>`) | 9 | yes | self | ✅ | revalidate=3600 | low | none |
| Category IT (`/it/category/<x>`) | 9 | yes | self | ✅ | revalidate=3600 | low | none |
| Topic landing EN (`/<slug>`) | 19+1 | yes | self | ✅ (paired via `alternateSlug`; orphans emit en+x-default only) | static | medium | none |
| Topic landing IT (`/it/<slug>`) | 12 | yes | self | ✅ (reciprocal) | static | medium | none |
| Topics index (`/topics`, `/it/temi`) | 2 | yes | self | ✅ | static | low | none |
| Blog index (`/blog`, `/it/blog`) | 2 | yes | self | ✅ | static + Redis | low | none |
| Blog post EN (`/blog/<slug>`) | 35 | yes | self | ✅ (via `BlogPost.alternateSlug`) | static + Redis | medium | low (Redis published) |
| Blog post IT (`/it/blog/<slug>`) | 35 | yes | self | ✅ (reciprocal) | static + Redis | medium | low |
| Blog cluster EN (`/blog/topics/<slug>`) | 4 | yes | self | ✅ (via `CLUSTERS.slug.en/it`) | static | low | none |
| Blog cluster IT (`/it/blog/temi/<slug>`) | 4 | yes | self | ✅ (reciprocal) | static | low | none |
| `/trending`, `/it/trending` | 2 | yes | self | ✅ | dynamic | low | none |
| `/personality`, `/store`, `/leaderboard` | 3 | yes | mixed | ✅ on personality+store, n/a on leaderboard (no IT counterpart) | mixed | low | none |
| `/faq`, `/privacy`, `/terms`, `/login` | 4 | yes | mixed | ✅ | static | low | none |
| `/u/<id>` (public profile) | 0 | no (robots disallow + `noindex`) | homepage | n/a | dynamic | n/a | n/a |
| `/admin`, `/dashboard`, `/profile`, `/submit-poll`, `/reset-password`, `/api/*` | 0 | no (robots disallow) | n/a | n/a | n/a | n/a | n/a |

`mixed` canonical = some pages declare `canonical=https://splitvote.io`
even though the page itself is reachable at a non-root URL (see Sample
findings § Login/Store).

---

## Sitemap counts (live, 2026-05-18)

```
total <loc>                  296
homepage EN + IT               2
play_en + play_it             82  (41 × 2)
results_en + results_it       82  (41 × 2)
category_en + category_it     18  (9 × 2)
topic_landing_en + _it        31  (19 + 12)   ← IT 7 fewer than EN
topics_index_en + _it          2
blog_index_en + _it            2
blog_post_en + _it            70  (35 + 35)
blog_cluster_en + _it          8  (4 × 2)
core/legal/other              ~ rest
```

Dynamic AI scenarios are intentionally NOT in sitemap (existing comment
in `app/sitemap.ts` lines 18–24 — driven by Redis-retention 404 churn
observed in GSC). Discovery still flows through internal links
(`RelatedDilemmas` on play/results, `/trending`).

Notable parity gaps:

- **Topic landings: 19 EN vs 12 IT** — 7-URL content gap in Italian
  topic landings. Not an indexing bug; a content-strategy signal.

---

## Sample findings (live curls)

### 1. Title double-suffix `"| SplitVote | SplitVote"` (confirmed scope)

Cause: `app/layout.tsx:25` sets `title.template: '%s | SplitVote'`.
Pages whose own metadata title already ends in `| SplitVote` get a second
suffix appended by Next.js.

Confirmed DOUBLE on:

| URL | Rendered title |
|---|---|
| `/category/morality` | `🧭 Morality Dilemmas — Real-time Votes \| SplitVote \| SplitVote` |
| `/it/category/morality` | `🧭 Dilemmi di Moralità — Vota in Tempo Reale \| SplitVote \| SplitVote` |
| `/trending` | `Top Dilemmas & Trending \| SplitVote \| SplitVote` |
| `/it/trending` | `Classifiche & Tendenze \| SplitVote \| SplitVote` |
| `/personality` | `Your Moral Profile \| SplitVote \| SplitVote` |
| `/store` | `Cosmetics Store \| SplitVote \| SplitVote` |

Confirmed SINGLE (correct) on `/`, `/it`, `/blog`, `/topics`, `/faq`,
`/privacy`, `/leaderboard`, play, results.

**Affected indexable URL count: 22** (9 EN category + 9 IT category +
2 trending + `/personality` + `/store`). Visible in SERP titles and OG
share previews. Low technical penalty but high cosmetic/CTR cost.

### 2. ~~Hreflang gap~~ — RETRACTED (see Errata)

> ⚠️ **The "ABSENT" list below is wrong.** The probe used a
> case-sensitive grep on `hreflang=` while Next.js renders the
> attribute as `hrefLang=`. A case-insensitive re-run on every sitemap
> URL shows hreflang is **present on all 296 URLs**, including the ones
> the original audit listed as missing. Leaving the original text below
> only as a record of the false positive — do not act on it. See the
> top **Correction / Errata** section.

Original (incorrect) text, kept for traceability:

Confirmed PRESENT (en + it-IT + x-default) on: `/`, `/it`,
`/play/trolley`, `/it/play/trolley`, `/results/trolley`,
`/it/results/trolley`, `/play/ai-en-…`, `/it/play/ai-it-…`,
`/category/lifestyle`, `/it/category/lifestyle`.

~~Confirmed ABSENT (zero `<link rel="alternate" hreflang>`) on:~~
~~`/blog`, `/it/blog`, `/blog/<slug>` (sampled~~
~~`frontier-ai-guardrails-ethical-dilemmas`), `/it/blog/<slug>` (sampled~~
~~`guardrail-ai-frontiera-dilemmi-etici`), `/topics`, `/it/temi`,~~
~~`/it/problema-del-carrello` (topic landing), `/trending`, `/it/trending`,~~
~~`/faq`.~~ — all of these in fact emit reciprocal hreflang correctly.

~~Affected URLs: ~112 (38 % of sitemap).~~ Real count: **0** of 296.

### 3. Canonical on `/login` and `/store`

```
/login   canonical=https://splitvote.io
/store   canonical=https://splitvote.io
```

Both pages are reachable at their own URLs but declare the homepage as
canonical. Likely intentional (consolidate signal toward homepage) but
unusual — and `/login` + `/store` are then in the sitemap with a
self-disagreeing canonical. GSC will report these as
"Alternate page with proper canonical tag" → not crawl-budget eaters,
but they pull listed sitemap URLs out of the indexed set.

### 4. Query parameter handling

`https://splitvote.io/results/cure-secret?voted=a` correctly emits
`canonical=https://splitvote.io/results/cure-secret` (no query). ✅
Good — `?voted=` is the most common share-loop query and Google will
fold it into the canonical.

### 5. 404 + noindex behavior on missing dynamic IDs

```
GET /play/ai-en-deleted-12345         → 404 + <meta robots noindex>
GET /u/nonexistent                    → 404 + <meta robots noindex>
```

✅ Both correct. Google will eventually de-index stale URLs without
manual intervention. The cycle from "first 404" → "removed from index"
typically takes weeks to months in GSC.

### 6. `/u/<id>` (public profile)

`robots.txt` disallows `/u/`, and the rendered page emits
`<meta robots noindex>`. ✅ Fully suppressed from indexing.
Not a GSC noise source.

### 7. `robots.txt`

```
User-Agent: *
Allow: /
Disallow: /api/
Disallow: /api/cron/
Disallow: /admin/
Disallow: /dashboard
Disallow: /profile
Disallow: /submit-poll
Disallow: /reset-password
Disallow: /offline
Disallow: /u/

Host: https://splitvote.io
Sitemap: https://splitvote.io/sitemap.xml
```

Clean. Sitemap is declared. No risky `Disallow: /` patterns.

---

## Top 5 likely GSC issue causes (ranked by likely impact × prevalence)

### 1. Title double-suffix → reduced CTR on category/trending hubs

22 indexable URLs render `"… | SplitVote | SplitVote"`. SERP/social
displays show the duplication. This does not block indexing but
suppresses CTR and damages branded-snippet perception. Likely shows up
in GSC as flat clicks/impressions on category hubs despite recent
SITEMAP-I18N + CATEGORY-HUBS-INTERNAL-LINKING work.

### 2. ~~Hreflang missing on blog + topic landings~~ — RETRACTED (false positive)

The original claim that ~112 URLs lacked hreflang was an audit-method
bug, not a real defect. See the **Correction / Errata** section at the
top of this report for details. All 296 sitemap URLs already emit
correct reciprocal `<link rel="alternate" hrefLang="…">`. Sprint
`SEO-HREFLANG-BLOG-TOPICS-01` was closed as no-op.

If GSC eventually reports real "Duplicate without user-selected
canonical" issues on specific URL pairs, treat them as individual
data-quality cases (slug mapping mismatches) rather than a systemic
hreflang gap.

### 3. Old Redis-pruned dynamic scenario IDs continue to surface 404s in GSC

Existing sitemap comment (`app/sitemap.ts:18–24`) flags 8 GSC 404s as
of 16 May 2026 caused by Redis-pruned AI scenarios. The current sitemap
already excludes new AI URLs from crawl volunteering, but old indexed
URLs persist until Google de-indexes them. They are reachable via
internal links (`RelatedDilemmas`, `/trending`) so Googlebot can
re-discover them on every crawl until they're gone from the database
AND from the internal-link graph.

Likely GSC reports: "Submitted URL not found (404)" or
"Discovered – not indexed" on AI scenario IDs.

### 4. Canonical-to-homepage on `/login` + `/store` → sitemap URLs filtered

Two sitemap-listed URLs declare the homepage as canonical. GSC will
report:

- "Alternate page with proper canonical tag"
- "Duplicate without user-selected canonical" if Googlebot disagrees

Not a bug if intentional, but it inflates the "URLs in sitemap not
indexed" counter without serving any indexing goal — those URLs were
voluntarily withdrawn by their own canonical. Cleaner posture: remove
from sitemap OR fix canonical to self.

### 5. Topic landing content gap (IT 12 vs EN 19)

Not a GSC bug; a content surface gap. 7 EN topic landings have no IT
counterpart in `lib/seo-topics.ts`. Visible in Italian organic traffic
ceiling. Worth flagging in product strategy, not in an SEO sprint.

---

## Recommended next sprints (updated after corrections)

### Sprint A — `SEO-TITLE-TEMPLATE-FIX-01` — ✅ SHIPPED

Commit `fb7bd7c` (2026-05-18). Stripped `| SplitVote` from 17 per-page
titles so the root layout template (`%s | SplitVote`) owns the suffix
exclusively. 22 / 22 previously-doubled URLs now render single suffix,
verified live. 9 previously-single URLs unchanged (no regression).

### Sprint B — ~~`SEO-HREFLANG-BLOG-TOPICS-01`~~ — RETRACTED

Closed as no-op without commits. The gap was a false positive caused
by a case-sensitive grep on `hrefLang`. See **Correction / Errata** at
the top of this report. Implementation is already correct in source
and on production.

### Sprint C → now first candidate — `SEO-STALE-DYNAMIC-404-MITIGATION-01`

**Impact:** medium — cleans 8+ existing GSC 404 noise items; prevents
re-indexing of pruned IDs.
**Risk:** medium-high — touches dynamic scenario routing and
internal-link surfaces, which intersects vote flow.
**Effort:** 4–6 hours.

Approach (sprint brief sketch):

- For dynamic scenario IDs that no longer exist in Redis but might still
  be reachable, decide between:
  - 301 redirect to the relevant category page (`/category/<cat>`) — best
    for residual link equity, but requires knowing the category of the
    deleted scenario, which may be lost if it was pruned outright.
  - Continue serving 404 (current behavior, already
    `noindex`) and rely on Google's de-index cycle — slower but zero
    risk.
- Audit internal links that surface dynamic scenarios on `/trending` and
  `RelatedDilemmas`: ensure they validate the linked ID against current
  Redis state before rendering. If validation is expensive, accept
  short-lived dead links and rely on the 404+noindex chain.
- Strongly recommended to wait for GSC export data before choosing the
  redirect strategy — without it the redirect target cannot be picked
  meaningfully on a per-ID basis.

### Next candidate — `CATEGORY-CONTENT-FAQ-PARITY-01`

**Impact:** medium — fills the only structural content gap left in
the post-CATEGORY-HUBS surface. `lib/categoryContent.ts` ships
editorial+FAQ blocks for 8 of 9 categories (morality, survival,
loyalty, justice, freedom, technology, society, relationships) in
both EN and IT, but is missing both for `lifestyle`. The `/category/lifestyle`
and `/it/category/lifestyle` pages render with the new hub helper
(intro + tensions + related) but skip the editorial+FAQ section,
which makes lifestyle look thinner than its peers in SERP previews
and reduces dwell-time signal.
**Risk:** very low — pure content addition, no logic, no routing.
**Effort:** ~1 hour (write copy, no schema change).

Approach (sprint brief sketch):

- Extend `CategoryKey` in `lib/categoryContent.ts` to include
  `'lifestyle'`.
- Add `CONTENT.en.lifestyle` and `CONTENT.it.lifestyle` with the same
  shape as the other 8 categories: `editorial` paragraph (2–3 sentences)
  + `faqHeading` + 3 `faq` Q&A pairs.
- Lifestyle framing must stay light (no "moral" / "right vs right" /
  "umanità" — same constraint as the hub helper).
- No route changes; the existing `getCategoryContent(cat, locale)`
  guard in the page renders the new block automatically.
- Verification: curl `/category/lifestyle` and `/it/category/lifestyle`,
  confirm the editorial+FAQ block now renders.

### Future candidate — `GSC-EXPORT-CROSS-REFERENCE-01` (blocked on data)

If the PM can export the GSC "Page indexing" report (CSV from Search
Console → Indexing → Pages → Export), this would let us cross-reference
the actual URLs flagged as:

- "Discovered – currently not indexed"
- "Crawled – currently not indexed"
- "Duplicate without user-selected canonical"
- "Duplicate, Google chose different canonical than user"
- "Submitted URL not found (404)"
- "Page with redirect"

with the URL classes in this audit, ranked by impressions/clicks if
GSC Performance data is also exported. That would replace technical
hypothesis with measured demand and let us prioritise sprints by
real ROI. Blocked until the CSV exists — keep this candidate parked.

---

## What NOT to do yet

- **Do not** turn off the dynamic scenario internal-link graph. It is
  the primary discovery surface for AI content and drives session depth
  in `/trending`. Killing it to placate GSC 404 churn would hurt
  acquisition more than the GSC clean-up is worth.
- **Do not** add hreflang to admin/`/u/`/legal pages. They are already
  `noindex` or disallowed in `robots.txt`. Adding alternates would
  conflict with the suppression intent.
- **Do not** change `dynamicParams = false` on the category route — it
  is correct, intentional, and gives us static-prerender benefits with
  controlled crawl exposure.
- **Do not** change the `revalidate = 60` cache on `/results/[id]` to
  fix any indexing concern. The 60-s ISR is intentional and proven safe
  (`?voted=` bypasses ISR; no per-user content in the cached path).
- **Do not** add 301s for old dynamic IDs without first auditing how
  many such IDs exist in GSC. Without GSC data, the redirect target
  cannot be chosen meaningfully (you'd be redirecting blind).
- **Do not** widen the IT topic landing set in an SEO sprint. The 12 vs
  19 gap is a content/product decision, not a technical SEO fix.
- **Do not** revisit the `"What would the world choose?"` brand tagline.
  It is the explicitly-preserved brand surface per the user's standing
  guidance and the SEO-WORLD-WORDING-01 sprint brief.

---

## Verification

- No source files modified (Edit/Write touched only this report).
- `git status` shows this report under `reports/` (still untracked) plus
  the pre-existing PM working-tree drift (PRODUCT_STRATEGY.md, ROADMAP.md,
  RCP IntersectionObserver WIP, content-generation libs, 80+ pixie PNGs,
  untracked PM scripts) — none touched by this audit or by the
  corrections pass.
- No production writes. No commit, no push.
- Original findings sourced from live curl + sitemap.xml + local source
  grep. No GSC API access used.
- Corrections pass (2026-05-18 evening) re-verified hreflang coverage
  against the live site with a case-insensitive probe across all 296
  sitemap URLs, and verified the 124 internal blog links resolve to
  HTTP 200. Both retracted findings are no-ops without code changes.
