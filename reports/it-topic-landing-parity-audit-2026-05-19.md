# IT Topic Landing Parity — Audit Report (2026-05-19)

**Sprint:** `IT-TOPIC-LANDING-PARITY-01`
**Mode:** Phase 1 audit only (read-only).
**Result:** **No gap. Sprint closes as no-op.** EN and IT topic landings are
already at 1:1 reciprocal parity in both `lib/seo-topics.ts` and in the live
sitemap (`https://splitvote.io/sitemap.xml`).

---

## TL;DR

- **Source of truth** (`lib/seo-topics.ts`): 11 EN + 11 IT topics, all
  `status='published'`, all `noindexUntilReady=false`, all have
  `relatedScenarioIds.length >= 3`, all carry valid reciprocal `alternateSlug`.
- **Live sitemap** (curled 2026-05-19): 11 EN topic landing URLs +
  11 IT topic landing URLs, total 22. Exact 1:1 match.
- **Hub pages** (`/topics`, `/it/temi`): cluster definitions reference all
  11 slugs per locale; `pickTopics()` resolves cleanly with zero orphans.
- The "19 EN vs 12 IT" gap cited in
  [reports/gsc-indexing-diagnosis-2026-05-18.md:164](reports/gsc-indexing-diagnosis-2026-05-18.md)
  is **not reproducible** from either the source file or the live sitemap.
  Most likely a manual-count error at that report's time of writing (possibly
  counting blog cluster URLs `/blog/topics/<slug>` toward "topic landings").
  Recommend adding an Errata entry to that report.

**Recommendation:** Do not enter Phase 2. There are zero high-priority
missing IT landings. Move directly to the next queued sprint (Option C
`BLOG-SEO-CONTENT-STRATEGY-01`, or Option A `GSC-EXPORT-CROSS-REFERENCE-01`
if PM has the CSV).

---

## Methodology

1. Parsed `lib/seo-topics.ts` programmatically with a small Node script
   (`/tmp/extract-topics.mjs`) to extract per-topic `slug`, `locale`,
   `alternateSlug`, `status`, `noindexUntilReady`, and
   `relatedScenarioIds.length`. No regex assumptions about order — each
   topic is matched as a self-contained block starting at its `slug:` line.
2. Verified `getIndexableTopics()` and `getIndexableITTopics()` filters
   (`status==='published' && !noindexUntilReady && relatedScenarioIds.length >= 3`)
   against the parsed inventory.
3. Curled the live sitemap (`https://splitvote.io/sitemap.xml`) and
   filtered single-segment URLs `/[a-z][a-z0-9-]+` (excluding core, legal,
   blog, category, and IT-language routes) to count actual topic landings.
4. Read `app/topics/page.tsx`, `app/it/temi/page.tsx`, and `app/sitemap.ts`
   to confirm the data flow source → indexable filter → sitemap emission.

Anti-false-positive checks applied:
- Cross-checked the source file count against the live sitemap (two
  independent sources). Both produced the same count.
- Confirmed every EN→IT `alternateSlug` resolves to an actual IT slug, and
  vice versa. Reciprocity verified bidirectionally.
- Used a paired-walk (`grep -B1 "locale: 'en'"`) to avoid attributing the
  wrong `slug:` to the wrong `locale:` line.

---

## Full audit table (11 pairs)

| # | EN slug | EN title | IT counterpart? | IT slug | IT title | Pairing | Priority | Reason |
|---|---|---|---|---|---|---|---|---|
| 1 | `trolley-problem` | The Trolley Problem | ✅ yes | `problema-del-carrello` | Il problema del carrello | reciprocal | n/a | Already shipped |
| 2 | `ai-ethics-dilemmas` | AI Ethics Dilemmas | ✅ yes | `dilemmi-etici-intelligenza-artificiale` | Dilemmi etici dell'intelligenza artificiale | reciprocal | n/a | Already shipped |
| 3 | `loyalty-vs-honesty` | Loyalty vs. Honesty | ✅ yes | `lealta-vs-onesta` | Lealtà vs. onestà | reciprocal | n/a | Already shipped |
| 4 | `ai-art-ethics` | AI Art Ethics | ✅ yes | `etica-arte-ai` | Etica dell'arte AI | reciprocal | n/a | Already shipped |
| 5 | `consequentialism` | Consequentialism | ✅ yes | `consequenzialismo` | Consequenzialismo | reciprocal | n/a | Already shipped |
| 6 | `deontology` | Deontology | ✅ yes | `deontologia` | Deontologia | reciprocal | n/a | Already shipped |
| 7 | `virtue-ethics` | Virtue Ethics | ✅ yes | `etica-della-virtu` | Etica della virtù | reciprocal | n/a | Already shipped |
| 8 | `privacy-ethics` | Privacy Ethics | ✅ yes | `etica-della-privacy` | Etica della privacy | reciprocal | n/a | Already shipped |
| 9 | `moral-foundations` | Moral Foundations | ✅ yes | `fondamenti-morali` | Fondamenti morali | reciprocal | n/a | Already shipped |
| 10 | `bioethics` | Bioethics | ✅ yes | `bioetica` | Bioetica | reciprocal | n/a | Already shipped |
| 11 | `experimental-moral-psychology` | Experimental Moral Psychology | ✅ yes | `psicologia-morale-sperimentale` | Psicologia morale sperimentale | reciprocal | n/a | Already shipped |

**EN with no IT alternate:** none.
**IT with no EN alternate:** none.
**Orphaned `alternateSlug` (points to a slug that doesn't exist):** none.

---

## Indexability cross-check

All 22 topics pass the `getIndexableTopics()` / `getIndexableITTopics()`
filter. Each has `status === 'published'`, `noindexUntilReady === false`,
and `relatedScenarioIds.length >= 3`. Per-topic `rel` count (related
scenarios):

- EN: `trolley-problem` (4), `ai-ethics-dilemmas` (4),
  `loyalty-vs-honesty` (4), `ai-art-ethics` (3), `consequentialism` (4),
  `deontology` (4), `virtue-ethics` (4), `privacy-ethics` (4),
  `moral-foundations` (4), `bioethics` (4),
  `experimental-moral-psychology` (4).
- IT: same counts per pair (each IT pair carries `rel >= 3`).

No topic sits below the indexable threshold. No topic is `noindexUntilReady`.
No topic is in `draft` status.

---

## Sitemap verification (live)

Curl of `https://splitvote.io/sitemap.xml` on 2026-05-19:

- Total `<loc>` entries: 296.
- EN topic landings (single-segment `/<slug>`, excluding core/legal/etc.): **11**.
- IT topic landings (single-segment `/it/<slug>`, excluding core/legal/etc.): **11**.

EN landings emitted:
```
/trolley-problem
/ai-ethics-dilemmas
/loyalty-vs-honesty
/ai-art-ethics
/consequentialism
/deontology
/virtue-ethics
/privacy-ethics
/moral-foundations
/bioethics
/experimental-moral-psychology
```

IT landings emitted:
```
/it/problema-del-carrello
/it/dilemmi-etici-intelligenza-artificiale
/it/lealta-vs-onesta
/it/etica-arte-ai
/it/consequenzialismo
/it/deontologia
/it/etica-della-virtu
/it/etica-della-privacy
/it/fondamenti-morali
/it/bioetica
/it/psicologia-morale-sperimentale
```

Both sets are reciprocal 1:1. Sitemap is correct.

---

## Hub pages (`/topics`, `/it/temi`)

Both hub pages use the same cluster shape (5 clusters: Classic dilemmas /
Dilemmi classici · AI ethics / Etica dell'IA · Ethical theory / Teoria etica
· Moral psychology / Psicologia morale · Privacy & bioethics / Privacy e
bioetica). Each cluster references slugs that exist in `lib/seo-topics.ts`,
so `pickTopics()` resolves all entries with zero filtered `undefined`s.
There are no orphan slugs and no missing slugs in either cluster set.

---

## Why the GSC report counted 19/12

[reports/gsc-indexing-diagnosis-2026-05-18.md:164](reports/gsc-indexing-diagnosis-2026-05-18.md)
states:

```
topic_landing_en + _it        31  (19 + 12)   ← IT 7 fewer than EN
```

This number is **not reproducible** today:

- `git log -- lib/seo-topics.ts` since 2026-05-15 shows a single commit
  (`8ac8021 feat(seo): /topics + /it/temi hub + ai-art-ethics landing`)
  — it added an EN+IT pair, it did not remove any. So the file held
  **11 EN + 11 IT** at the time the GSC report was written, not 19 + 12.
- `app/sitemap.ts` has not changed since 2026-05-16 (`STATIC_LAST_MOD`).
  The topic-landing portion of the sitemap is driven exclusively by
  `getIndexableTopics()` + `getIndexableITTopics()`, which today emit 11 + 11.
- The total sitemap entry count (296) matches the GSC report's headline
  count for total `<loc>`. So the sitemap shape itself isn't different;
  the per-bucket breakdown was likely a manual count error.

**Most likely cause of the 19/12 figure:** the author counted single-segment
sitemap URLs and accidentally included or double-counted some of the
following non-topic surfaces:
- `/blog/topics/<slug>` × 4 (blog cluster hubs, EN)
- `/personality`, `/store`, `/leaderboard`, `/login`, `/faq`,
  `/privacy`, `/terms`, `/trending`, `/topics` (core/legal/other)

11 real EN topic landings + 4 EN blog cluster URLs + 4 EN core/legal URLs
= 19 plausible "single-segment EN" URLs if the filter wasn't tight enough.
The IT side has fewer "noise" URLs at the same depth (Italian core/legal
URLs all live under `/it/...` and were correctly attributed to IT in the
report), which would explain the 12 figure for IT.

This is a counting artifact in the audit, not a content state SplitVote
ever shipped.

**Recommended action on the GSC report:** add an Errata entry retracting
row 164 + the §5 "topic landing content gap" recommendation. The Errata
section in that report already retracts two other false positives
(hreflang case-sensitivity, `why-we-love-impossible-choices` typo); this
fits the same pattern.

---

## Skipped (would-be Phase 2)

No Phase 2 work is justified. The criteria from the sprint spec —

> strong evergreen SEO intent in Italian
> natural Italian search phrasing
> relevant to SplitVote voting/play loop
> can link to existing dilemmas/categories/blog
> not duplicate of existing category or blog cluster

— would in principle allow adding *new* IT topics (e.g.
`scelte-morali-quotidiane`, `etica-del-lavoro`, `etica-medica-fine-vita`),
but creating any of these:

1. Would violate the First-Principles Gate rule "Non creare 'tutto' solo per
   simmetria" because parity already exists; creating new Italian-only
   landings without an EN counterpart would *break* parity, not improve it.
2. Would add scope outside what the sprint commissioned ("colmare il gap"
   implies fixing an existing imbalance, not opening new content seams).
3. Would belong in a different sprint, e.g. `SEO-NEW-TOPIC-EXPANSION-01`,
   with proper EN+IT pair design rather than IT-only landings.

If PM wants to *grow* the topic catalog beyond 11+11 pairs, that's a
separate strategic decision. Recommend deferring to PM input rather than
implementing under this sprint.

---

## Files touched

- **None.** This is an audit-only Phase 1 sprint and the audit found no
  work to do.
- Report written: `reports/it-topic-landing-parity-audit-2026-05-19.md`
  (this file).

## Verification

- `git status --short` — no source files modified beyond the existing PM WIP
  (`PRODUCT_STRATEGY.md`, `ROADMAP.md`, `ResultsClientPage.tsx`,
  `content-generation-*.ts`, `content-quality-gates.ts`, ~80 pixie PNGs).
- `npm run typecheck` / `npm run build` — not run; per CLAUDE.md docs-only
  guidance, build can be skipped when no source files change.
- `git diff --check` — clean (no whitespace errors introduced by this
  audit; only a new untracked report file).

## Residual risk

- The GSC report's incorrect 19/12 number may still mislead future audits.
  Mitigation: PM adds an Errata entry to
  `reports/gsc-indexing-diagnosis-2026-05-18.md` (or this audit report
  is linked from there).
- If at some future point a topic is added to `lib/seo-topics.ts` for one
  locale only, the parity check should be re-run. A lightweight unit test
  could enforce parity going forward (out of scope for today's sprint;
  could be the basis for `SEO-TOPIC-PARITY-GUARD-01` if PM wants belt-and-
  suspenders).

---

## Recommendation

**Close `IT-TOPIC-LANDING-PARITY-01` as no-op.**

Move to the next sprint per
[CURRENT_HANDOFF.md → Session 18 May → Next recommended work](CURRENT_HANDOFF.md):

1. **A. `GSC-EXPORT-CROSS-REFERENCE-01`** — if PM exported the GSC CSV.
2. **C. `BLOG-SEO-CONTENT-STRATEGY-01`** — content audit / cluster gap / new
   article queue, no runtime code. This is the highest-leverage unblocked
   sprint today.

No commit, no push from this sprint unless PM explicitly says GO.
