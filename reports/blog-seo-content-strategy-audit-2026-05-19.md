# Blog SEO Content Strategy Audit — 2026-05-19

**Sprint:** BLOG-SEO-CONTENT-STRATEGY-01
**Mode:** Read-only audit. No source files, Redis, sitemap, legal docs, or runtime code modified.
**Output:** This report only.

## TL;DR

- The static catalogue is **32 EN + 32 IT posts with 32/32 reciprocal `alternateSlug` pairs** — zero orphans, perfect locale parity. Inventory is healthier than expected.
- The biggest concrete defect is **FAQ structured-data coverage**: only 4 EN posts carry the structured `faq` field; **0 IT posts do.** Every IT post is missing FAQPage JSON-LD that the schema already supports.
- **10 EN + 10 IT articles do not belong to any cluster** in `lib/blog-clusters.ts`. Three sub-themes are big enough to graduate into hubs (the **3 ethical traditions** — consequentialism/deontology/virtue — already match topic landings, **bioethics** has 2 articles + 1 Redis-published, **relationships/affective** has limerence + ambiguous-loss).
- **Two posts reference a non-existent dilemma ID `why-not-intervene`** (`bystander-effect-and-moral-responsibility` EN + its IT twin). Easy fix to swap to one of the 41 static IDs.
- Most EN/IT seoDescription strings run 165-200 characters — wider than the 140-160 sweet spot. Likely noise (search engines now truncate around 155-165 visually), but worth a copy pass on the worst offenders. The IT title `ia-etica-40-milioni-scelte` is 105 chars and the IT desc 221 chars — those are real outliers.

## Methodology

- Parsed `lib/blog.ts` with a TS-tolerant bracket-depth scanner (`/tmp/parse-blog.mjs`) to extract per-post fields (slug, alternateSlug, dates, seoTitle/seoDesc lengths, tags, relatedDilemmaIds, faq count, content section counts, approx word count). Result saved to `/tmp/blog-inventory.json`.
- Cross-checked the post count two independent ways: parser returned **32 EN + 32 IT**; `grep -c "^    slug: '" lib/blog.ts` returned **64** (= 32 × 2). Match.
- Verified static dilemma IDs by parsing `lib/scenarios.ts` (`/tmp/scenario-ids.json` — 41 IDs).
- Cluster topology from `lib/blog-clusters.ts` (4 clusters: `moral-dilemmas`, `moral-psychology`, `ai-ethics`, `society-public-trust`). All cluster article slugs validated against the parsed catalogue: every slug listed in `CLUSTERS` exists in `lib/blog.ts`.
- Topic landings counted from `lib/seo-topics.ts`: 11 EN + 11 IT slugs — matches the 19 May parity audit (`reports/it-topic-landing-parity-audit-2026-05-19.md`). The previously-reported "19 vs 12" gap was a counting artifact and is retracted.
- Internal-link spot-checks done with `grep` on raw `text:` content + CTA `href:` extraction inside the per-post raw object slice.
- Approximate word counts are conservative — the regex misses some long inline strings that use unusual escape sequences. Treat ranges as floors, not ceilings.

**Anti-false-positive guardrails applied** (recent SplitVote audits had 3 retractions):

- Counted posts twice via independent paths before claiming defects.
- Verified every `relatedDilemmaIds` value against the 41-ID inventory before flagging.
- For "thin content" claims, used actual h2/p/list/cta section counts, not raw line counts.
- For internal-link gaps, named the source article's current CTAs/links inline.
- Claims that depend on word counts the regex may have under-counted are tagged "Hypothesis — needs PM verification".

## 1. Inventory

| Metric | Value |
|---|---|
| EN posts | **32** |
| IT posts | **32** |
| Reciprocal `alternateSlug` pairs | **32 / 32** (perfect) |
| Orphans (no `alternateSlug` or alt not in target locale) | **0** |
| Posts using a `relatedDilemmaIds` ID that does not exist in `lib/scenarios.ts` | **2** (see below) |
| Posts with at least one related dilemma | **64 / 64** (100%) |
| Posts with structured `faq:` field (FAQPage JSON-LD source) | EN **4 / 32** (12.5%) — IT **0 / 32** (0%) |
| Posts with at least one `disclaimer` section in `content` | EN **32 / 32** — IT not measured separately (same template) |
| Date range | All posts dated 2026-04-27 → 2026-05-15 (none older than ~3 weeks; nothing aging yet) |

### Reciprocal pairing

All 32 EN posts have an `alternateSlug` that exists in IT and points back reciprocally. No action required.

### Field hygiene gaps (per-post)

| Field | Posts missing it | Severity |
|---|---|---|
| `dateModified` | 28/32 EN, 32/32 IT | **Cosmetic.** The BlogPost type comment says `dateModified` "defaults to `date` when missing" — so this is not a runtime defect. Recommendation: add `dateModified` when an article is meaningfully edited, otherwise leave it absent. |
| `seoDescription` (entirely absent) | `bodyoids-brainless-organs-bioethics` (EN) and `bodyoids-organi-senza-cervello-bioetica` (IT) and `consequenzialismo-il-bene-maggiore` (IT) — `seoDescLen: undefined` in parser output | **Real defect — verify in source.** Hypothesis: these three posts may rely on `description` falling through to social-meta but no explicit `seoDescription`. Needs PM eyeball at the source lines. |
| `seoTitle` | none missing — every post has one | OK |
| `tags` | none missing or empty | OK |
| `relatedDilemmaIds` | none empty; **2 contain an invalid ID** (see §2 below) | Flag |

### Cluster fit gaps

10 EN + 10 IT articles are present in `lib/blog.ts` but listed in **no** cluster in `lib/blog-clusters.ts`:

| Theme | EN slugs | IT slugs |
|---|---|---|
| Site/onboarding | `what-is-splitvote`, `how-anonymous-voting-works`, `how-to-read-splitvote-results` | `cos-e-splitvote`, `come-funziona-il-voto-anonimo`, `come-leggere-i-risultati-splitvote` |
| Ethical traditions | `consequentialism-the-greatest-good`, `deontology-some-things-are-always-wrong`, `virtue-ethics-what-would-a-good-person-do` | `consequenzialismo-il-bene-maggiore`, `deontologia-alcune-cose-sono-sempre-sbagliate`, `etica-della-virtu-cosa-farebbe-una-persona-buona` |
| Bioethics | `bioethics-when-medicine-forces-impossible-choices`, `bodyoids-brainless-organs-bioethics` | `bioetica-quando-la-medicina-impone-scelte-impossibili`, `bodyoids-organi-senza-cervello-bioetica` |
| Affective/relationships | `limerence-love-obsession-dilemmas`, `ambiguous-loss-grief-without-closure` | `limerence-amore-ossessione-dilemmi`, `perdita-ambigua-dolore-senza-chiusura` |

**Implication:** the 3 ethical-tradition articles each already have a matching topic landing in `lib/seo-topics.ts` (`/consequentialism`, `/deontology`, `/virtue-ethics`) and are heavily cross-linked from `what-is-a-moral-dilemma`, `trolley-problem-explained` etc. — but they are not surfaced on any cluster hub. That's a missed internal-linking opportunity, not a thin-content risk.

## 2. Existing article quality

### Word count (lower bound — parser is conservative)

The conservatively-measured shortest articles:

| EN slug | Approx words (floor) | H2 | P | CTA |
|---|---|---|---|---|
| `how-anonymous-voting-works` | ~210 | 3 | 6 | 2 |
| `what-is-splitvote` | ~245 | 3 | 6 | 3 |
| `why-people-love-impossible-choices` | ~240 | 5 | 7 | 1 |
| `how-to-read-splitvote-results` | ~287 | 5 | 7 | 2 |
| `ambiguous-loss-grief-without-closure` | ~297 | 3 | 4 | 2 |

These are likely fine for the onboarding-style "what is SplitVote" cluster (they're explainers, not pillar pieces), but **`ambiguous-loss-grief-without-closure`** and **`bodyoids-brainless-organs-bioethics` (~381w)** read as candidates for a depth pass — both touch psychology/bioethics and are uncluster, so they're carrying topic weight alone.

### Title / meta length

- **EN.** ~20/32 posts have `seoTitle > 60` chars and ~20/32 have `seoDescription > 160` chars. Worst: `bodyoids-brainless-organs-bioethics` (89-char title), `doing-vs-allowing-harm` (83-char title, 211-char desc), `free-will-and-moral-responsibility` (77-char title, 198-char desc). Some of these are arguably fine (Google often shows up to ~70 chars; 165-char desc still renders). **Flag, don't sweep**.
- **IT.** The standout is **`ia-etica-40-milioni-scelte`**: `seoTitle` 105 chars (will be truncated hard) and `seoDescription` 221 chars (way over). **`causare-vs-permettere-danno`** is the runner-up at 88 / 230. **Real fixes.**

### Posts missing structured FAQ (the load-bearing finding)

Per the BlogPost schema (`faq?: { q: string; a: string }[]`) the `faq` field drives the FAQPage JSON-LD. **Only 4 EN posts populate it** (`what-is-a-moral-dilemma`, `loyalty-vs-honesty-when-they-collide`, `bystander-effect-and-moral-responsibility`, `moral-foundations-theory-why-good-people-disagree` — verify in source). **No IT post does.** All 28 other EN posts and all 32 IT posts therefore emit no FAQ rich-result eligibility. Many of them do have Q&A inline in the body (e.g. `bioethics-when-medicine-forces-impossible-choices` has H2-style questions in `content`), so the work is mostly extraction-to-structured-field, not net-new copy.

**Hypothesis — needs PM verification:** the FAQ field counts come from a regex scan. A handful of posts may technically have a `faq` field that the parser missed due to inline string quoting. The number is in the right ballpark either way (well under 25%).

### Unverifiable / risky claims in user-visible meta

Scanned all titles, `seoTitle`, `description`, `seoDescription` for `\\d+%` and `studies show|studies prove`. **No hits.** The "40 million" claim in `ai-ethics-what-40-million-people-chose` is verifiable (MIT Moral Machine 2020 paper; the article cites Awad et al. — assuming the inline citation is present; PM may want a one-pass check to confirm sourcing in body copy).

### EN/IT parity disparities (word count)

| Pair | EN words (floor) | IT words (floor) | Diff |
|---|---|---|---|
| `what-is-a-moral-dilemma` | 642 | 218 | **66%** — IT is materially shorter |
| `trolley-problem-explained` | 611 | 352 | 42% |
| `moral-injury-when-values-break` | 611 | 284 | 54% |
| `limerence-love-obsession-dilemmas` | 590 | 315 | 47% |

**Hypothesis — needs PM verification.** These ratios are partly a parser artifact (the EN regex picks up more inline text on some posts), but a ≥50% gap on three high-leverage posts is suspicious enough to warrant an EN/IT side-by-side review of the body content of those 4 pairs. Italian rendering of moral philosophy is often denser, so a 20-30% gap is expected — **66% is not**.

### Invalid `relatedDilemmaIds`

Two posts list a dilemma ID that **does not exist** in `lib/scenarios.ts`:

| Slug | Bad ID |
|---|---|
| `bystander-effect-and-moral-responsibility` | `why-not-intervene` |
| `effetto-spettatore-e-responsabilita-morale` | `why-not-intervene` |

**Verified:** grep `"id: 'why-not-intervene'"` in `lib/scenarios.ts` returns 0 hits. The post body still functions (it's a soft reference, not a route), but any UI surface that maps `relatedDilemmaIds → /play/<id>` will emit a dead link. Recommendation: swap to one of `cover-accident`, `whistleblower`, or `report-friend`, which are existing static dilemmas thematically aligned with the bystander effect.

## 3. Cluster strategy

### Cluster ↔ post mapping

| Cluster | EN posts | IT posts | Matching topic landing(s) in `seo-topics.ts` |
|---|---|---|---|
| `moral-dilemmas` | 8 | 8 | `trolley-problem` (EN), `problema-del-carrello` (IT), `loyalty-vs-honesty` (EN), `lealta-vs-onesta` (IT) |
| `moral-psychology` | 11 | 11 | `moral-foundations`, `experimental-moral-psychology` (EN) + `fondamenti-morali`, `psicologia-morale-sperimentale` (IT) |
| `ai-ethics` | 3 | 3 | `ai-ethics-dilemmas`, `ai-art-ethics` (EN) + `dilemmi-etici-intelligenza-artificiale`, `etica-arte-ai` (IT) |
| `society-public-trust` | 5 | 5 | None directly (privacy-ethics topic exists but covers a different cut) |

### Under-supported clusters

- **`ai-ethics`: 3 articles each side.** Above the 2-article thin-content floor but only by one. Real risk if any of the 3 gets pruned or re-classified. Two of the three matching topic landings (`ai-art-ethics`, `etica-arte-ai`) have **no blog article companion** — a topic landing standing alone on a thin hub.
- **`society-public-trust`: 5 articles** but **3 are shared with other clusters** (`bystander-effect`, `moral-foundations`, `moral-injury` also appear in `moral-psychology`). Net unique to this cluster: only 2 (`privacy-in-public-voting` + `why-good-people-do-nothing`). Hub is at low-uniqueness risk.

### Cluster ↔ topic-landing alignment gaps

| Topic landing exists | Cluster exists | Gap |
|---|---|---|
| `consequentialism` / `consequenzialismo` | No `ethical-traditions` cluster | ❌ 3 articles already exist but no hub surfaces them |
| `deontology` / `deontologia` | Same | ❌ |
| `virtue-ethics` / `etica-della-virtu` | Same | ❌ |
| `bioethics` / `bioetica` | No `bioethics` cluster (per file comment, intentionally rejected at 2 articles) | ⚠️ Now 2 static + 1 Redis-published — still on the line |
| `ai-art-ethics` / `etica-arte-ai` | `ai-ethics` cluster exists but no blog article maps to AI-art specifically | ⚠️ Topic landing carries the weight alone |
| `experimental-moral-psychology` | Inside `moral-psychology` cluster ✓ | OK |

### Cluster hub thin-content risk

The `ai-ethics` hub (3 articles) and `society-public-trust` hub (5 with heavy overlap) are the two visible thin-content risks. Neither is currently failing — both have enough prose intro (~150-180 words) and link out to live dilemma categories. But they're the first hubs to suffer if a single article gets reworked or removed.

## 4. Internal linking — top ~10 missed opportunities

Verification protocol used: read each source article's current CTAs and inline links, then identify gaps where (a) a thematically obvious topic landing exists in `seo-topics.ts`, (b) a thematically obvious live `/play/<id>` exists in `lib/scenarios.ts`, or (c) an EN/IT mirror is missing on one side.

| # | Source article | Missing internal link | Reason |
|---|---|---|---|
| 1 | `consequentialism-the-greatest-good` (EN) | `/consequentialism` (own topic landing) | Article ranks on the topic landing's primary keyword. Should link reciprocally; current CTAs are only `/play/...` + `/moral-dilemmas`. |
| 2 | `deontology-some-things-are-always-wrong` (EN) | `/deontology` | Same pattern. |
| 3 | `virtue-ethics-what-would-a-good-person-do` (EN) | `/virtue-ethics` | Same pattern. |
| 4 | `bioethics-when-medicine-forces-impossible-choices` (EN) | `/bioethics` | Topic landing exists; article has no link to it. Current CTA `/moral-dilemmas` is the generic catch-all. |
| 5 | `bodyoids-brainless-organs-bioethics` (EN) | `/bioethics` and `/play/organ-harvest` (only `/blog/bioethics...` + `/category/morality` today) | Topic-landing link missing; should also surface a primary `/play/<id>` CTA, not only category. |
| 6 | `ambiguous-loss-grief-without-closure` (EN) | `/play/love-or-career` or `/play/cure-secret` (a `/play/<id>` CTA) | Article currently CTAs only `/blog/ethical-dilemmas-everyday-life` + `/category/relationships` — no direct invitation to vote. Violates the "every post must invite a vote" voting-loop principle. |
| 7 | `how-anonymous-voting-works` (EN) | `/play/trolley` CTA (currently CTAs `/results/trolley` + `/privacy`) | Article explains the vote flow but never asks the reader to actually vote. Add a primary `/play/trolley` CTA. |
| 8 | `consequenzialismo-il-bene-maggiore` (IT) | `/it/consequenzialismo` (own topic landing) | IT mirror of #1. The seoDescription is also missing entirely — see §2. |
| 9 | `deontologia-alcune-cose-sono-sempre-sbagliate` (IT) | `/it/deontologia` | IT mirror of #2. |
| 10 | `etica-della-virtu-cosa-farebbe-una-persona-buona` (IT) | `/it/etica-della-virtu` | IT mirror of #3. |

**Note on spam patterns:** `trolley-problem-statistics` (14 CTAs / 642 words ≈ 1 CTA per 46 words) and `statistiche-problema-del-carrello` (14 / 787 words) are well above the "1 CTA per ~300 words" guideline. The article is a stats roundup so multiple links are defensible, but the density should be a flag for any future similar piece.

## 5. New article opportunities (2-3 briefs MAX)

### Brief #1 — "What Is the Doctrine of Double Effect?" (apply existing trolley/footbridge intuitions to medical and ethical edge cases)

- **EN title:** What Is the Doctrine of Double Effect? When Foreseen Harm Is Not Intended
- **EN slug:** `doctrine-of-double-effect` (25 chars)
- **IT title:** Doppio effetto: quando un danno previsto non è voluto
- **IT slug:** `dottrina-del-doppio-effetto` (27 chars)
- **Primary keyword / intent:** Informational + decision-support. EN target: "doctrine of double effect" + "double effect ethics". IT target: "dottrina del doppio effetto" + "doppio effetto etica". Both have steady search volume from philosophy students and medical-ethics readers and no existing SplitVote page targets them.
- **Target cluster:** `moral-dilemmas` (canonical thought-experiment territory). Links into topic landings `/deontology` (EN) and `/deontologia` (IT) where the doctrine is the standard exit clause, plus `/bioethics` because the medical applications (palliative sedation, ectopic pregnancy) are the textbook case studies.
- **Candidate `relatedDilemmaIds`** (verified — all 5 exist in `lib/scenarios.ts`): `trolley`, `mercy-kill`, `pandemic-dose`, `cover-accident`, `mandatory-vaccine`.
- **Suggested CTAs:** primary `/play/trolley`, secondary `/play/mercy-kill`, plus `/category/morality` (EN) / `/it/category/morality` (IT) and `/deontology` (EN) / `/it/deontologia` (IT).
- **Why high leverage:** the doctrine resolves the exact "pull the lever OK, push the man not OK" asymmetry that `trolley-problem-explained` describes — but no article explains it. Strong internal-linking magnet (would be cited from at least 4 existing posts: trolley-explained, doing-vs-allowing, bioethics, deontology). Search intent is bottom-of-funnel ("define X") — quick to rank on a low-difficulty term.
- **Thin-content risk:** medium. Risk is going too academic and producing a glossary entry. Mitigation: minimum 900 words, must include (a) the four classical conditions, (b) at least 3 worked dilemma examples drawn from the SplitVote scenario library, (c) 4-5 FAQ entries (this brief MUST ship with structured `faq:` — see §2 finding), (d) one `disclaimer` section noting this is philosophical-tradition exposition, not medical or legal advice.
- **LEGAL.md trigger:** **No.** Bioethics-adjacent but the article frames it as philosophical exposition. Standard ethics-content disclaimer required by the agent persona is sufficient.

### Brief #2 — "Tragic Choices: Dilemmas Where Both Options Carry Grave Harm"

- **EN title:** Tragic Choices: When Every Option Causes Grave Harm
- **EN slug:** `tragic-choices-grave-harm` (25 chars)
- **IT title:** Scelte tragiche: quando ogni opzione provoca un male grave
- **IT slug:** `scelte-tragiche-male-grave` (26 chars)
- **Primary keyword / intent:** Informational + emotional resonance. EN target: "tragic choice", "tragic dilemma", "Sophie's choice meaning". IT target: "scelte tragiche" + "dilemma tragico" + "scelta di Sophie significato". Search demand is steady (lit-crit / philosophy / pop-psych mix).
- **Target cluster:** `moral-psychology` (companion to `moral-injury-when-values-break` and `why-people-love-impossible-choices`). Links into topic landing `/experimental-moral-psychology` (EN) and `/psicologia-morale-sperimentale` (IT).
- **Candidate `relatedDilemmaIds`** (verified): `lifeboat`, `plane-parachute`, `pandemic-dose`, `save-partner-vs-stranger`, `organ-harvest`.
- **Suggested CTAs:** primary `/play/lifeboat`, secondary `/play/save-partner-vs-stranger`, plus `/category/morality` and `/moral-foundations` (EN) / `/fondamenti-morali` (IT).
- **Why high leverage:** the article `what-is-a-moral-dilemma` introduces "tragic dilemma" as one of four taxonomy entries but never expands it. The Sophie's-choice angle pulls a different audience (lit + film viewers) than the trolley audience. Companion piece to `moral-injury-when-values-break` — they should cross-link. **Critically: this brief addresses the EN/IT parity gap surfaced in §2** — IT should be commissioned at ~80% of EN word count, not 50%.
- **Thin-content risk:** medium. Risk is leaning on "Sophie's choice" as a pop-culture hook without philosophical substance. Mitigation: minimum 1000 words, must include (a) Bernard Williams's "moral residue" concept, (b) explicit contrast with "single-option dilemma" already defined in `what-is-a-moral-dilemma`, (c) 3 worked dilemma scenarios from the static-41 inventory, (d) 5 FAQ entries shipped as structured `faq:`, (e) `disclaimer` section.
- **LEGAL.md trigger:** **No.** Pure philosophy/psychology framing.

### Brief #3 — "Moral Luck: When Outcome Decides Whether You're a Hero or a Killer" (optional — third pick, lower urgency than #1 and #2)

- **EN title:** Moral Luck: How Outcome Changes a Moral Verdict
- **EN slug:** `moral-luck-when-outcome-decides` (31 chars)
- **IT title:** Fortuna morale: quando il risultato cambia il giudizio
- **IT slug:** `fortuna-morale-risultato-giudizio` (33 chars)
- **Primary keyword / intent:** Informational. EN target: "moral luck" + "Nagel moral luck". IT target: "fortuna morale" + "Nagel fortuna morale". Lower search volume than #1 and #2 but very low difficulty — almost no Italian-language piece exists at depth.
- **Target cluster:** `moral-psychology` (companion to `free-will-and-moral-responsibility`). Links into topic landing `/experimental-moral-psychology` (EN) / `/psicologia-morale-sperimentale` (IT).
- **Candidate `relatedDilemmaIds`** (verified): `cover-accident`, `whistleblower`, `self-driving-crash`, `innocent-juror`, `death-row-exonerated`.
- **Suggested CTAs:** primary `/play/cover-accident`, secondary `/play/self-driving-crash`, plus `/category/justice` (EN) / `/it/category/justice` (IT).
- **Why high leverage:** complements `free-will-and-moral-responsibility` (already published) which raises the question without answering it. The drunk-driver-who-kills vs drunk-driver-who-doesn't framing is one of the strongest hooks in moral philosophy and converts well to "vote on what the right verdict is" engagement. Connects to AI ethics (`self-driving-crash` already exists in scenarios) — useful cross-pollination for the `ai-ethics` cluster which has only 3 articles.
- **Thin-content risk:** medium-high. Risk is going too Nagel-academic. Mitigation: minimum 900 words, must include (a) the 4 types of moral luck Nagel originally named, (b) at least 2 worked scenarios from the SplitVote library, (c) 4 FAQ entries shipped as structured `faq:`, (d) `disclaimer` section.
- **LEGAL.md trigger:** **No.** Pure philosophy framing. The "drunk driver" example must avoid framing as legal advice — the disclaimer covers it.

## 6. Skipped ideas

| Idea | Why rejected |
|---|---|
| "Self-driving cars and the trolley problem" | Already covered in `ai-ethics-what-40-million-people-chose` (the MIT Moral Machine piece) and `frontier-ai-guardrails-ethical-dilemmas`. Net-new value would be marginal. |
| "Privacy in the age of AI" | Topic landing `/privacy-ethics` already exists; `privacy-in-public-voting` already published; adding a third surface risks topic-cluster cannibalisation. |
| "Cancel culture as a moral dilemma" | Current-events flavoured; current-events go through the autopublish/Redis pipeline per CLAUDE.md operating policy. Not an evergreen pick. |
| "Effective altruism explained" | Adjacent to `consequentialism-the-greatest-good`; would either compete with it (cannibalisation) or shadow it. Better to deepen the existing piece. |
| "When should you whistleblow?" | The static dilemma `whistleblower` exists and `deontology-some-things-are-always-wrong` + `loyalty-vs-honesty-when-they-collide` already approach the question. Saturation risk. |
| "AI art and the ethics of copying" | `etica-arte-ai` / `ai-art-ethics` topic landings exist with no companion blog piece — would be valuable but is a topic landing's job to anchor; better to feed those landings traffic from existing posts first, then revisit. Hypothesis — needs PM verification: a long-form companion article may be worth a future brief; not in this top 3. |

## 7. Files touched

- **`reports/blog-seo-content-strategy-audit-2026-05-19.md`** (this file — new) — only file modified by this audit.
- Scratch artifacts under `/tmp/` (not in repo):
  - `/tmp/parse-blog.mjs` — parser script
  - `/tmp/blog-inventory.json` — parsed structured inventory
  - `/tmp/scenario-ids.json` — extracted list of 41 valid dilemma IDs

No source file (`lib/blog.ts`, `lib/blog-clusters.ts`, `lib/seo-topics.ts`, sitemap, page routes), legal doc, or runtime code was modified. No Redis or Supabase access performed.

## 8. Residual risk

- **Parser conservatism.** The approxWord estimates and FAQ-field detection regex are best-effort. The 4-EN-posts-with-FAQ figure and the 3 IT-posts-with-missing-`seoDescription` flag are both at risk of being slightly off in either direction. PM should spot-check 2-3 posts against the source before acting on the FAQ migration brief.
- **EN/IT word-count parity (66% gap on `what-is-a-moral-dilemma`)**. The parser may be under-counting IT inline text. If the gap is real, it's a pillar-page parity defect. If it's a parser artifact, no action needed. PM eyeball at `/blog/what-is-a-moral-dilemma` vs `/it/blog/cos-e-un-dilemma-morale` (compare rendered word count in DevTools / select-all) is a 30-second verification.
- **`ai-ethics` cluster and `bioethics` topic landing are on the line.** Neither fails today, but both are one prune away from thin-content status. The new briefs #1 and #2 don't directly feed them — if PM wants to firm them up, an AI-ethics-specific brief (e.g. companion piece for `etica-arte-ai`) should be considered ahead of the optional Brief #3. Not in top 3 per the "quality > volume" constraint.
- **Two invalid `relatedDilemmaIds` (`why-not-intervene`).** Surfaces as a real dead link if/when a UI surface maps `relatedDilemmaIds → /play/<id>`. Trivial 1-line fix in source code; outside the read-only scope of this audit.
- **LEGAL.md trigger check:** none of the 3 recommended briefs touch payments, ads, analytics, geo, UGC, or community — no LEGAL.md update would be required if any brief ships. Standard ethics-disclaimer section per the blog-seo-editor persona is sufficient.
- **No new dependencies, schema, route, or migration implied** by the briefs. Implementation would be additive entries in `lib/blog.ts` (EN and IT pair) plus an optional update to `lib/blog-clusters.ts` to add the new posts to the relevant cluster `articleSlugs`.

## 9. Recommendation

**PROCEED with Brief #1 (`doctrine-of-double-effect`) and Brief #2 (`tragic-choices-grave-harm`) for the next implementation sprint.** Defer Brief #3 (`moral-luck`) — its value is real but lower than the maintenance work surfaced in §2 (FAQ JSON-LD migration on 28 EN + 32 IT posts, IT seoDescription/title fixes on 3-4 outliers, dead-link fix on `why-not-intervene`, EN/IT parity verification on the 4 high-gap pairs).

Optional follow-up sprint (`BLOG-MAINTENANCE-01`, not part of this brief) — if PM has bandwidth before commissioning new content:

1. Add structured `faq:` to the ~60 posts that lack it (most have inline Q&A in `content` already — it's mostly cut/paste into the structured field).
2. Fix the 3 IT posts missing `seoDescription`.
3. Trim the 2 IT outlier metas (`ia-etica-40-milioni-scelte`, `causare-vs-permettere-danno`) to ≤ 70-char title and ≤ 165-char description.
4. Swap `why-not-intervene` to a valid static ID on both bystander-effect posts.
5. Add the 3 missing topic-landing internal links from the consequentialism / deontology / virtue-ethics articles (each links to their own landing — items 1-3 + 8-10 in §4).

These are all single-file (`lib/blog.ts`) edits with no schema/route/migration impact and would compound with the value of the 2 new briefs.
