# Dilemma Quality Rubric

> **Internal draft — not a public commitment.**
>
> This is an editorial scoring framework for admin review of SplitVote dilemmas.
> It is not a public claim about the site, not a marketing surface, not a
> scientific instrument, and not an auto-publish gate. It exists to make the
> human approve/reject decision more consistent and to inform the planned
> SplitVote Content Intelligence Agent v1 reporting layer (see
> `PRODUCT_STRATEGY.md → Picoclaw + SplitVote Content Intelligence Direction →
> §2.1 SplitVote Content Intelligence Agent v1 (Internal First)`).

**Drafted:** 21 May 2026
**Source audit:** `reports/dilemma-depth-audit-2026-05-19.md`
**Status:** Draft for internal review. Nothing in this document modifies code,
schemas, or runtime behavior.

## Product context

The SplitVote retention hook is **post-vote**: the reveal moment shows whether the user is in the majority, the minority, on a near-even split, or against a landslide (`CURRENT_HANDOFF.md §0` afternoon override, 21 May 2026). The vote is the trigger; the reveal is the payoff.

A high-quality dilemma therefore has to do two jobs, not one:

1. **Pre-vote.** Produce real moral friction — `moral_tension` and `emotional_weight`, grounded in `identity_relevance` and `ambiguity`.
2. **Post-vote.** Produce a meaningful self-positioning moment — `divisiveness` and `curiosity_potential`.

A dilemma scoring high on the four pre-vote axes but producing no informative reveal (e.g. 99/1 splits with no surprise either way) is editorially incomplete, even if morally serious. Conversely, a dilemma producing a striking split but failing the moral-tension test is bait, not a dilemma.

## Scope and non-scope

**This rubric IS:**
- A 6-axis editorial scoring framework for human admin review of dilemma drafts.
- A diagnostic tool for the existing 41 static dilemmas and for incoming AI-generated drafts.
- A vocabulary the SplitVote Content Intelligence Agent v1 can use in its read-only reports.

**This rubric IS NOT:**
- An auto-publish trigger. `AUTO_PUBLISH_DILEMMAS=false` remains the default and must remain so. No score on any axis, and no composite score, may ever cause a draft to publish without a human admin's explicit approval click in the admin UI.
- A public-facing quality claim. Scores do not appear on play/results pages, in share cards, in JSON-LD, or in any user-visible surface.
- A replacement for the existing mechanical gates in `lib/content-quality-gates.ts`. Those gates (length, blocklist, language match, novelty, similarity, dual-locale clarity) remain authoritative for the "is this even safe to draft" question. The rubric layers on top, answering "is this draft *good*."

## Relationship to existing systems

`lib/content-quality-gates.ts` enforces 14 mechanical checks (length bounds, options ratio, SEO title/description shape, category allowlist, dangerous content blocklist, `clarity_truth_vs_omission` IT pattern, language match, novelty score, final score, similar items count). All are pre-publish hard gates that fail closed.

This rubric proposes a parallel **soft scoring layer** that is:
- Computed by humans (admin review) or by a future read-only Content Intelligence Agent.
- Recorded for diagnostic/reporting purposes only.
- Never used as a publish gate.

The rubric and the gates address different questions: the gates ask "is the draft mechanically and safely formed?" The rubric asks "does the draft do real moral work?"

## The 6 Axes

Each axis is scored 0–100. The intent is editorial calibration, not statistical precision — treat the scale as ordinal (low / medium / high bands) with the numeric value as a convenience.

---

### 1. `divisiveness`

**Definition.** How close the expected vote split is to 50/50. A genuine moral dilemma is one where reasonable people disagree, not one where the answer is obvious. Pre-publish, this axis is an *editorial intention*, not a measured property — actual divisiveness is only knowable from live aggregate vote data.

**Scoring guidance.**
- **80–100**: expected split inside 40/60–60/40. The dilemma will produce real disagreement.
- **50–80**: expected split 30/70–40/60. Defensible minority but a clear majority.
- **20–50**: expected split 15/85–30/70. Lopsided; minority position is hard to articulate without flinching.
- **0–20**: ≥85/15 consensus. Essentially a moral question with one answer everyone polite gives.

**Examples (from `lib/scenarios.ts`).**
- *High* — `trolley` lever variant: most people pull, but the footbridge variant (~30/70) flips intuitions; the cluster as a whole produces strong split.
- *Medium* — `cure-secret`: identity-relevant tension typically yields ~60/40–70/30.
- *Low* — `kill-baby-hitler`-style consensus dilemmas: near-unanimous answer with a fringe minority.

**Anti-patterns.**
- Morally loaded language inside an option that tilts the vote before the user thinks (e.g., "ignore the helpless child" vs "do the right thing").
- Setup that pre-resolves the dilemma (e.g., stipulating that the target is "genuinely corrupt").
- Options framed so asymmetrically that one is clearly the social-desirability answer.

**Mapping to existing gates.** `options_unbalanced:ratio=` measures *length* asymmetry, not value asymmetry — it does not catch this axis. No existing pre-publish gate measures divisiveness. Post-publish, the live vote ratio in Redis aggregate counts is the ground truth signal; pre-publish, this axis is judgement-only.

---

### 2. `identity_relevance`

**Definition.** How directly the dilemma maps onto a situation the reader has lived, could imagine living, or feels their identity tested by. The opposite is abstraction — philosophy-classroom hypotheticals that ask the reader to perform an analysis instead of feel a stake.

**Scoring guidance.**
- **80–100**: the dilemma is something most adults have actually experienced or could plausibly experience within a year.
- **50–80**: the situation is conceivable for the reader's social network or life stage.
- **20–50**: the reader can model it intellectually but it has no traction in their actual life.
- **0–20**: pure abstraction — fantasy stipulation, sci-fi framing, time travel, last-survivor scenarios.

**Examples.**
- *High* — `cover-accident`, `sibling-secret`, `report-friend`: real-life price-of-loyalty traps the reader can imagine being asked tomorrow.
- *Medium* — `pandemic-dose`, `mercy-kill`: most readers haven't lived these but can imagine being thrust into them.
- *Low* — `time-machine`, `organ-harvest`, `kill-baby-hitler`: abstract, removed from any plausible adult life.

**Anti-patterns.**
- Time machines, alien overlords, "you wake up and discover", magic medical premises.
- Hypotheticals so contrived the reader spends their cognition on the setup, not the choice.
- "Last survivor of humanity" framing — once the population is reduced to one, normal morality doesn't apply.

**Mapping to existing gates.** None. Could be approximated by a keyword exclusion list for fantasy markers ("time machine", "wake up", "alien", "magic", "last survivor"), but this is a heuristic, not a measure. Future implementation: out of scope for this draft.

---

### 3. `moral_tension`

**Definition.** Both options carry a real moral cost. The user cannot pick one without leaving a "moral remainder" — guilt, regret, or unfinished obligation to the option they abandoned. This is the philosophical definition of a genuine dilemma.

**Scoring guidance.**
- **80–100**: both options are coherently defensible from a recognizable moral framework; both leave a remainder.
- **50–80**: both options are defensible but one carries more residue than the other.
- **20–50**: one option clearly correct; the other has a small or contrived cost.
- **0–20**: one option is the answer, the other exists only to give the user a "wrong" choice.

**Examples.**
- *High* — `mercy-kill`, `pandemic-dose`, `loyalty-vs-honesty` family: both options are real losses; both have real defenders.
- *Medium* — `death-row-exonerated`, `innocent-juror`: rule-following vs context-sensitive are two coherent value systems even if one is more popular.
- *Low* — `deepfake-expose`, `censor-speech`: the setup ("genuinely corrupt politician", "his lies caused 500 deaths") pre-resolves the moral work. The user just decides whether a lie is OK to use against a stipulated bad actor.

**Anti-patterns.**
- Premise loads the answer ("the obviously evil X did Y — should you...").
- One option is framed in clinical/neutral terms while the other is framed in emotionally loaded terms.
- Both options are reformulations of the same value (no real choice).
- "Should you save 5 by sacrificing 1?" with no friction between sacrifice and saving (true trolley variants do have this friction; mechanical reskins don't).

**Mapping to existing gates.** `clarity_truth_vs_omission` (added 21 May 2026, `feat(content): add clarity guard for generated drafts` — commit `09a454c`) catches one specific IT contradiction pattern. The prompt at `lib/content-generation-prompts.ts` instructs the model to keep both options morally nuanced, but no gate validates the output. This axis is the largest gate-prompt gap identified in the 19 May depth audit and is the primary candidate for a future structured gate.

---

### 4. `ambiguity`

**Definition.** The outcome of each option is uncertain or contested. The user has to weigh under genuine epistemic uncertainty, not against stipulated facts. A dilemma whose consequences are spelled out in the setup is solving a math problem, not a moral one.

**Scoring guidance.**
- **80–100**: outcomes are uncertain; the user must reason about plausibility, not just preference.
- **50–80**: outcomes are tendencies, not certainties; reasonable people can disagree about what will follow.
- **20–50**: outcomes are largely stipulated but with some interpretive room.
- **0–20**: outcomes are fully stipulated, often with numeric guarantees ("+40% happiness", "saves N lives").

**Examples.**
- *High* — `report-friend`, `sibling-secret`: the user genuinely doesn't know how the relationships, the law, or the consequences will play out.
- *Medium* — most identity/relationship dilemmas.
- *Low* — `rich-or-fair` ("equally poor or status quo" — fictional causal claim stipulated), `delete-social-media` ("+40% mental health" — magic numeric promise), `kill-baby-hitler` (outcome literally known by construction).

**Anti-patterns.**
- Stipulated numeric outcomes (`+X%`, `saves N`, `costs $M`).
- Causally fictional certainties ("this WILL cause Y").
- "If you do X, then Y will happen with 100% probability."
- Magic premises that pre-resolve the empirical question and leave only a preference vote.

**Mapping to existing gates.** None. Could be approximated by detecting numeric outcome markers (`+/-N%`, `N lives`, `guaranteed`, `will result in`), but heuristic only. Out of scope for this draft to implement.

---

### 5. `curiosity_potential`

**Definition.** The dilemma invites the user to wonder how others answered. This is the social-loop axis: it measures whether seeing other people's votes adds information or surprise. High curiosity_potential dilemmas drive sharing, return visits, and conversation. Low curiosity_potential dilemmas may still be morally serious but generate no social desire to compare.

**Scoring guidance.**
- **80–100**: "I'm genuinely curious how my friends / strangers would answer this."
- **50–80**: the reader expects to be interested in the aggregate result.
- **20–50**: the result is mostly predictable; the reader has no strong reason to compare.
- **0–20**: the answer is so consensual that asking others is pointless or feels voyeuristic.

**Examples.**
- *High* — `cure-secret`, `cover-accident`: the reader has a strong intuition and wants to know if it's shared.
- *Medium* — trolley variants: the philosophy classroom has explored these for 60 years, but the numbers still surprise.
- *Low* — strong-consensus dilemmas where the share-card would just confirm what the reader already knew.

**Anti-patterns.**
- Pure shock value, taboo-bait, dilemmas whose only appeal is "would you really say yes to this?"
- Dilemmas where the social pressure to give a specific answer drowns the actual private vote (social-desirability bias).
- Voyeurism — dilemmas that exist to make the reader judge others, not to make the reader reflect.

**Mapping to existing gates.** None. Post-publish, the `share_clicked` GA4 event volume per dilemma is the ground truth signal (now enriched with `reveal_state` per the 20 May `feat(analytics): add reveal state to results events` commit `1384296`). Pre-publish, this axis is judgement-only.

---

### 6. `emotional_weight`

**Definition.** The dilemma asks the user to feel something, not just compute. The choice should leave a residue — a moment of "did I just say that?" or "would I really do that?" Lifestyle dilemmas are intentionally low on this axis by design; moral dilemmas are intentionally high.

**Scoring guidance.**
- **80–100**: the choice would stay with the reader for an hour after voting; they'd want to talk about it.
- **50–80**: the reader feels the friction; the answer doesn't come instantly.
- **20–50**: the reader can answer but it's a preference, not a stake.
- **0–20**: pure preference, no friction. (For lifestyle: this is correct and intentional.)

**Examples.**
- *High* — `mercy-kill`, `sibling-secret`, `cover-accident`: the choice has visceral cost.
- *Medium* — most real-life identity dilemmas.
- *Low (intentional)* — lifestyle dilemmas (coffee vs tea, mountain vs sea). The lifestyle category is exempt from this axis: it's designed to be low-stakes.
- *Low (unintentional)* — `time-machine`, `organ-harvest`: too abstract to feel; the reader performs an analysis instead of having a reaction.

**Anti-patterns.**
- Comedic framing of weighty topics.
- Framing that distances the user from the consequence ("imagine someone, somewhere…").
- Stipulating that the user is detached or unaffected by the outcome.

**Mapping to existing gates.** `lifestyle` category gets relaxed thresholds in `lib/content-quality-gates.ts` (`LIFESTYLE_AUTOPUBLISH_NOVELTY_THRESHOLD=10`, `LIFESTYLE_AUTOPUBLISH_FINALSCORE_THRESHOLD=30`) — implicit recognition that lifestyle dilemmas have low emotional weight by design. Post-publish, the `vote_change` event rate and hesitation telemetry can correlate with this axis. Pre-publish, judgement-only.

---

## Composite use

These axes are not independent; **do not average them mechanically.**

### For moral dilemmas (categories: `morality`, `survival`, `loyalty`, `justice`, `freedom`, `technology`, `society`, `relationships`)
- `identity_relevance`, `moral_tension`, `ambiguity`, and `emotional_weight` are the primary "is this a real dilemma" axes.
- `divisiveness` and `curiosity_potential` are downstream signals — they are evidence of quality, not causes of it. A dilemma that scores high on the primary four will usually produce high divisiveness and curiosity organically.
- A moral dilemma scoring below 60 on `moral_tension` is the most common failure mode (per the 19 May depth audit) and should be rewritten before publish.

### For lifestyle dilemmas (category: `lifestyle`)
- `divisiveness` and `curiosity_potential` are primary — lifestyle dilemmas exist to produce playful split + social comparison.
- `emotional_weight` is intentionally low (target band: 0–30).
- `moral_tension` does not apply (target: not measured for lifestyle; if it ends up >30, the dilemma was probably miscategorized).
- `ambiguity` applies in a softer form: preferences are inherently uncertain but the dilemma should not stipulate outcomes.
- `identity_relevance` applies but in everyday-mundane form (food, weather, routines) rather than identity-testing form.

### Aggregate score (future, not part of this draft)
A future `quality_score` could be a weighted aggregate by category:
- Moral: weighted toward the primary four axes.
- Lifestyle: weighted toward divisiveness + curiosity_potential.

This aggregate would be **diagnostic only**. It must never trigger publish.

---

## Guardrails (non-negotiable)

1. **Not for auto-publish.** No axis score, no composite score, no rubric-derived signal may cause a draft to be published. `AUTO_PUBLISH_DILEMMAS=false` remains the default. Publish requires explicit human admin click in the admin UI.
2. **Not a public claim.** Scores do not appear on play pages, results pages, share cards, JSON-LD, or any user-visible surface. They live in admin tooling, internal reports, and the Content Intelligence Agent v1 output (when built).
3. **Not a replacement for mechanical gates.** `lib/content-quality-gates.ts` remains authoritative for "safe to draft." A draft that fails any hard gate is rejected regardless of its rubric scores.
4. **Human judgement is final.** The rubric formalizes vocabulary; it does not displace the admin's authority to approve, reject, or rewrite a draft.
5. **Lifestyle exemption is intentional.** The relaxed thresholds for lifestyle in `lib/content-quality-gates.ts` reflect that lifestyle dilemmas score low on `emotional_weight` and `moral_tension` by design. This is correct and must not be "fixed."
6. **No scraping or batching of public dilemmas through the rubric without admin awareness.** If the Content Intelligence Agent v1 ever scores existing static or approved dynamic dilemmas in bulk, the report must be human-reviewed before any retrospective rewrite proposals are acted on.

---

## Open questions (to resolve before implementation)

1. **Confidence rating per axis.** Should each score carry a 0–1 confidence value, especially when scored by a future automated system?
2. **Lifestyle / moral split.** The rubric currently encodes a category-specific weighting. Should it also acknowledge a third class (e.g., "current events" or "psychological" dilemmas) with its own weighting?
3. **Pre-publish vs post-publish split.** Of the 6 axes, only `divisiveness` and `curiosity_potential` have clean post-publish telemetry signals. Should pre-publish-only axes be marked as such?
4. **Retroactive audit of the 41 static dilemmas.** Should the rubric be applied to the existing static-41 set as a one-time read-only audit, producing a per-dilemma scorecard? (This is a separate sprint; not part of this draft.)
5. **Wiring into `runQualityGates`.** If a future implementation adds rubric scoring, it should be a SOFT layer (warnings only, never reasons) per Guardrail #1. The data model (score storage, schema, where it lives) is out of scope here.
6. **Interaction with `expert_insight` / per-id static insights.** Should a low `emotional_weight` dilemma trigger a different insight tone? Currently per-id insights (shipped 19 May, commit `19a020b`) are uniform in voice. Out of scope here.

---

## Next steps (post-AdSense-review)

This draft is intentionally read-only. After AdSense review concludes and the post-review SEO backlog is cleared (see `CURRENT_HANDOFF.md → Session 21 May 2026 → Post-AdSense-review SEO backlog`):

1. PM review of this draft. Adjust axis definitions or examples where needed.
2. Optional: apply the rubric retroactively to the 41 static dilemmas as a one-time read-only audit, produce a per-dilemma scorecard, identify the bottom-10 candidates for the next `DILEMMA-STATIC-41-REWRITE-PILOT-02` sprint.
3. Optional: wire the rubric into the admin draft-review UI as a 6-slider scoring panel, recording scores in Redis (admin-only key, not public).
4. Optional: include rubric-derived warnings in the SplitVote Content Intelligence Agent v1 dry-run reports per `PRODUCT_STRATEGY.md §2.1`.

None of these next steps modify public surfaces. None require legal review at this time. None alter the existing fail-closed gate behavior.
