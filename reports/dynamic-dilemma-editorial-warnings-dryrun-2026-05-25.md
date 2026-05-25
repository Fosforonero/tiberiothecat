# Dynamic Dilemma Editorial-Shape Warnings — Dry-Run 2026-05-25

**Sprint:** `DYNAMIC-DILEMMA-EDITORIAL-WARNINGS-DRYRUN-01`
**Mode:** Read-only audit. No Redis writes, no save-mode change, no admin action.
**Source of truth for regexes:** `lib/content-quality-gates.ts` (commit `30fe2ac`).
**Audit script:** `scripts/audit-editorial-warnings.mjs` (regexes duplicated verbatim for this dry-run only).

## TL;DR

- Approved dynamic dilemmas audited: **346**.
- Draft dynamic dilemmas audited: **53**.
- Approved flag rate (moral-only): **34 / 324 = 10.5%**.
- Draft flag rate (moral-only): **10 / 53 = 18.9%**.
- Approved moral questions suppressed by an explicit tradeoff marker: **34**.

## What the four warnings mean

| Code | Fires when (in the question, moral only, no tradeoff marker present) |
|---|---|
| `abstract_policy_question` | Referendum-style "Should governments / countries / society X?" + IT equivalents. |
| `support_oppose_framing` | Policy-poll verbs: support, oppose, ban, allow, regulate, permit + IT equivalents. |
| `undefined_collective_actor` | Broad noun actors: countries, society, the others, un Paese, gli altri, il governo, la società, etc. |
| `undefined_action_verb` | Vague action verbs: slow, restrict, limit, curb + IT (rallentare, limitare, restringere, ridurre, frenare). |

Suppression: `EDITORIAL_TRADEOFF_MARKERS_RE` matches explicit-cost / comparative-risk phrasing
("even if", "ma raddoppia", "più pericoloso", "which cost do you accept", "quale ingiustizia accetti", etc.).

## Approved dynamic pool

**Approved** — total: 346 (moral: 324, lifestyle: 22)

- Locale: EN 172 · IT 174
- Total flagged (moral only): **34 / 324 = 10.5%**

| warning | count | %  of moral |
|---|---:|---:|
| `abstract_policy_question` | 9 | 2.8% |
| `support_oppose_framing` | 14 | 4.3% |
| `undefined_collective_actor` | 18 | 5.6% |
| `undefined_action_verb` | 6 | 1.9% |

Category breakdown (all dilemmas in this bucket):

| category | count |
|---|---:|
| justice | 78 |
| freedom | 68 |
| morality | 55 |
| relationships | 41 |
| technology | 38 |
| society | 33 |
| lifestyle | 22 |
| survival | 6 |
| loyalty | 5 |


### Top 20 flagged approved dilemmas

| # | id | locale | category | warnings | question |
|---|---|---|---|---|---|
| 1 | `ai-it-lo-stato-vieta-i-voli-clwvl` | it | freedom | support_oppose_framing, undefined_collective_actor, undefined_action_verb | Lo Stato vieta i voli per vacanze oltre 2000 km per ridurre le emissioni. Chi non rispetta il divieto paga una multa equivalente a un mese di stipendio. Lo sostieni? |
| 2 | `ai-it-lo-stato-dovrebbe-impo-8mvzs` | it | freedom | abstract_policy_question, undefined_collective_actor, undefined_action_verb | Lo Stato dovrebbe imporre limiti legali giornalieri al tempo trascorso sui social media per proteggere il benessere psicologico dei cittadini? |
| 3 | `ai-en-a-fast-fashion-ban-wou-jk0az` | en | society | support_oppose_framing, undefined_collective_actor | A fast fashion ban would cut pollution but destroy millions of low-wage garment jobs in developing countries. Do you support it? |
| 4 | `ai-it-la-tua-scuola-vuole-in-jarkd` | it | freedom | support_oppose_framing, undefined_action_verb | La tua scuola vuole introdurre l'uniforme obbligatoria per ridurre le differenze sociali. Tu credi che cancelli l'identità personale. Cosa sostieni? |
| 5 | `ai-en-should-governments-leg-8hhxq` | en | freedom | abstract_policy_question, undefined_collective_actor | Should governments legally cap daily social media scrolling time for adults to protect mental well-being — even without their consent? |
| 6 | `ai-en-should-governments-off-29dx0` | en | society | abstract_policy_question, undefined_collective_actor | Should governments offer financial incentives to homeless individuals to participate in medical trials, providing them immediate survival resources while raising concerns about exploitation and informed consent? |
| 7 | `ai-en-should-society-priorit-28vp0` | en | society | abstract_policy_question, undefined_collective_actor | Should society prioritize maximizing organ supply through automatic opt-out laws, or respect individual autonomy by requiring explicit consent? |
| 8 | `ai-en-transit-workers-strike-kze71` | en | justice | abstract_policy_question, undefined_collective_actor | Transit workers strike for fair wages, leaving thousands unable to reach hospitals or jobs. Should the government force them back to work? |
| 9 | `ai-en-a-steel-towns-only-emp-jlu68` | en | justice | abstract_policy_question, undefined_collective_actor | A steel town's only employer pollutes heavily but employs 80% of residents. Should the government shut it down or keep it running? |
| 10 | `ai-en-should-governments-be-2b3b6` | en | technology | abstract_policy_question, undefined_collective_actor | Should governments be permitted to bypass legal constraints and hack into private digital systems if it could prevent an immediate terrorist threat? |
| 11 | `ai-en-should-governments-be-ocj16` | en | technology | abstract_policy_question, undefined_collective_actor | Should governments be permitted to bypass encryption on private devices and networks to stop a confirmed, imminent terrorist threat when explicit consent is impossible to obtain? |
| 12 | `ai-en-a-viral-video-strips-a-kz3x0` | en | justice | abstract_policy_question | A viral video strips a private person of their anonymity before any investigation. Should platforms remove it to protect them, or keep it up in the name of public transparency? |
| 13 | `ai-it-vietare-i-voli-brevi-s-jnjfu` | it | freedom | support_oppose_framing | Vietare i voli brevi sotto i 500 km ridurrebbe le emissioni, ma penalizzerebbe chi vive in aree remote senza alternative ferroviarie veloci. È giusto? |
| 14 | `ai-it-vietare-la-fast-fashio-jp9je` | it | justice | support_oppose_framing | Vietare la fast fashion salverebbe milioni di lavoratori tessili dal supersfruttamento, ma priverebbe i più poveri dell'unico abbigliamento accessibile. Vale la pena? |
| 15 | `ai-en-a-student-with-a-chron-j9qa2` | en | freedom | support_oppose_framing | A student with a chronic illness needs their phone to monitor health alerts. A blanket classroom ban applies to everyone. Should the rule bend? |
| 16 | `ai-it-imporre-un-ordine-corr-z905s` | it | relationships | undefined_collective_actor | Imporre un ordine 'corretto' per la colazione è un atto di cura verso gli altri o una violazione della loro autonomia alimentare? |
| 17 | `ai-it-una-citta-propone-di-u-2ysrs` | it | technology | undefined_collective_actor | Una città propone di usare i dati di sorveglianza per identificare potenziali minacce tramite algoritmi predittivi, ma ciò comporterebbe tracciare costantemente i movimenti di tutti i cittadini. Accetti di sacrificare la tua privacy per una |
| 18 | `ai-it-scopri-che-il-partner-2ce7o` | it | relationships | support_oppose_framing | Scopri che il partner di un amico ha una relazione extraconiugale, ma nessuno te l'ha chiesto esplicitamente. Dovresti parlare e rischiare di distruggere la loro relazione, o tacere e permettere che continui l'inganno? |
| 19 | `ai-en-a-school-pays-students-j9fby` | en | society | support_oppose_framing | A school pays students cash for A grades. Engagement soars, but only wealthy families can afford tutors to qualify. Do you support the program? |
| 20 | `ai-it-preferiresti-vivere-60-eypkj` | it | survival | undefined_action_verb | Preferiresti vivere 60 anni in perfetta salute, assaporando ogni momento senza limiti, oppure 90 anni con una qualità di vita gradualmente ridotta, ma con più tempo per le relazioni e l'amore? |


## Draft dynamic pool

**Drafts** — total: 53 (moral: 53, lifestyle: 0)

- Locale: EN 24 · IT 29
- Total flagged (moral only): **10 / 53 = 18.9%**

| warning | count | %  of moral |
|---|---:|---:|
| `abstract_policy_question` | 1 | 1.9% |
| `support_oppose_framing` | 6 | 11.3% |
| `undefined_collective_actor` | 1 | 1.9% |
| `undefined_action_verb` | 3 | 5.7% |

Category breakdown (all dilemmas in this bucket):

| category | count |
|---|---:|
| society | 14 |
| justice | 13 |
| technology | 12 |
| freedom | 7 |
| morality | 3 |
| lifestyle | 2 |
| survival | 2 |


### Top 10 flagged draft dilemmas

| # | id | locale | category | warnings | question |
|---|---|---|---|---|---|
| 1 | `news-20260516-health-regulator-outsider-en` | en | technology | abstract_policy_question, undefined_collective_actor | A regulator appoints an outsider who challenges expert consensus, promising fresh scrutiny of old assumptions. Should the public welcome it? |
| 2 | `news-20260515-rival-ai-guardrails-it` | it | technology | undefined_action_verb | Due superpotenze rivali possono ridurre il rischio di catastrofi legate all'IA condividendo protocolli di sicurezza, ma potrebbero rivelare debolezze strategiche. Dovrebbero cooperare? |
| 3 | `news-20260516-health-regulator-speed-en` | en | society | support_oppose_framing | A health regulator can approve medicines faster by giving political leaders more influence over priorities. Is that worth it? |
| 4 | `news-20260516-health-regulator-speed-it` | it | society | support_oppose_framing | Un'autorità sanitaria può approvare farmaci più rapidamente dando ai leader politici più influenza sulle priorità. Ne vale la pena? |
| 5 | `news-20260516-social-anonymous-teens-en` | en | freedom | support_oppose_framing | A teen support forum protects vulnerable minors through anonymity, but anonymity also makes age rules harder to enforce. Should it stay anonymous? |
| 6 | `news-20260516-social-anonymous-teens-it` | it | freedom | undefined_action_verb | Un forum di supporto per adolescenti protegge minori vulnerabili grazie all'anonimato, ma l'anonimato rende più difficile far rispettare i limiti d'età. Dovrebbe restare anonimo? |
| 7 | `news-20260516-datacenter-bills-en` | en | justice | support_oppose_framing | A data center brings tax revenue, but residents may face higher electricity bills and more grid pressure. Should the city approve it? |
| 8 | `news-20260516-datacenter-elsewhere-en` | en | justice | support_oppose_framing | A city bans large data centers, knowing the same projects may move to smaller towns with weaker rules. Is the ban still ethical? |
| 9 | `news-20260516-eurovision-safe-stage-en` | en | freedom | undefined_action_verb | A live cultural event can avoid disruption only by sharply limiting protests near the venue. Should security restrict them? |
| 10 | `news-20260516-weather-work-commute-en` | en | justice | support_oppose_framing | Bad weather makes commuting risky but not impossible. Should employers be required to allow remote work when official alerts are active? |


## Manual triage — likely TP vs FP (sample interpretation)

The audit produces raw warning counts; assigning each flagged item to
likely-true-positive / likely-false-positive / unclear requires human
judgement. Inspect the top tables above and use this rubric:

- **Likely TP** — the question is a referendum-shaped "Should X?" or a
  vague collective-actor + vague-verb construction with no cost language.
  The voter could answer without picturing a cost on the losing side.
- **Likely FP** — the question is concrete, identity-relevant, names a
  specific person/scene, and happens to contain a surface token that the
  regex matched (e.g. "the state" referring to "the U.S. state of X" in
  a personal-narrative dilemma, or "allow" inside an option-style verb
  in an otherwise concrete moral situation).
- **Unclear** — the dilemma is borderline; the warning may signal a real
  weakness but the question is salvageable with light editing.

## Manual triage of the top 30 flagged items (audited 25 May 2026, sample inspection by Claude)

Triage performed against the top 20 approved + top 10 draft tables above.
TP = true positive (warning correctly flags a weak referendum-style dilemma).
FP = false positive (warning fires on a concrete, well-shaped dilemma due to a surface token).

### Approved — triage

| # | id | verdict | reason |
|---|---|---|---|
| 1 | `ai-it-lo-stato-vieta-i-voli-clwvl` | **TP** | Concrete cost named, but ends "Lo sostieni?" — still a poll. |
| 2 | `ai-it-lo-stato-dovrebbe-impo-8mvzs` | **strong TP** | Pure "Lo Stato dovrebbe imporre…?" referendum. |
| 3 | `ai-en-a-fast-fashion-ban-wou-jk0az` | **borderline TP** | Cost named ("but destroy"), but ends "Do you support it?" |
| 4 | `ai-it-la-tua-scuola-vuole-in-jarkd` | **FP** | Concrete actor ("la tua scuola") + explicit tradeoff. "sostieni" as standalone verb fired. |
| 5 | `ai-en-should-governments-leg-8hhxq` | **strong TP** | Canonical referendum framing. |
| 6 | `ai-en-should-governments-off-29dx0` | **TP** | "Should governments offer…?" |
| 7 | `ai-en-should-society-priorit-28vp0` | **borderline FP** | Actually a "X or Y" tradeoff, but "should society" surface fires. |
| 8 | `ai-en-transit-workers-strike-kze71` | **borderline TP** | Concrete scene + cost, but "should the government" framing. |
| 9 | `ai-en-a-steel-towns-only-emp-jlu68` | **FP** | Concrete scene with "X or Y" framing — actually a real tradeoff. |
| 10 | `ai-en-should-governments-be-2b3b6` | **TP** | Pure referendum framing. |
| 11 | `ai-en-should-governments-be-ocj16` | **TP** | Pure referendum framing. |
| 12 | `ai-en-a-viral-video-strips-a-kz3x0` | **FP** | Concrete scene + "X or Y" framing. |
| 13 | `ai-it-vietare-i-voli-brevi-s-jnjfu` | **FP** | Cost named explicitly ("ma penalizzerebbe chi vive in aree remote") — suppressor missed the conditional tense. |
| 14 | `ai-it-vietare-la-fast-fashio-jp9je` | **FP** | Same conditional-tense suppressor miss ("ma priverebbe"). |
| 15 | `ai-en-a-student-with-a-chron-j9qa2` | **FP** | "ban" as noun in concrete scene ("classroom ban applies to everyone"). |
| 16 | `ai-it-imporre-un-ordine-corr-z905s` | **FP** | "gli altri" used personally ("atto di cura verso gli altri"), not as broad collective. |
| 17 | `ai-it-una-citta-propone-di-u-2ysrs` | **borderline TP** | "i cittadini" as broad actor, real concern. |
| 18 | `ai-it-scopri-che-il-partner-2ce7o` | **FP** | Concrete relationship scene + cost ("rischiare di distruggere"). "permettere" as verb fired; "rischiare" infinitive not in suppressor. |
| 19 | `ai-en-a-school-pays-students-j9fby` | **borderline TP** | Concrete scene, but ends "Do you support the program?" — referendum tail. |
| 20 | `ai-it-preferiresti-vivere-60-eypkj` | **FP** | Pure preference "X or Y" tradeoff. "ridurre" (here passive participle context "ridotta") fired undefined_action_verb. |

### Drafts — triage

| # | id | verdict | reason |
|---|---|---|---|
| 1 | `news-20260516-health-regulator-outsider-en` | **TP** | "Should the public welcome it?" — pure referendum. |
| 2 | `news-20260515-rival-ai-guardrails-it` | **FP** | Concrete cost-framed dilemma; "ridurre" infinitive in cost clause. |
| 3 | `news-20260516-health-regulator-speed-en` | **FP** | Concrete scene; "approve" as verb of medical-process, not policy-poll. |
| 4 | `news-20260516-health-regulator-speed-it` | **FP** | Same. |
| 5 | `news-20260516-social-anonymous-teens-en` | **FP** | "support" as noun ("support forum"), not policy verb. |
| 6 | `news-20260516-social-anonymous-teens-it` | **FP** | "limiti" as noun ("limiti d'età" = "age limits"), not policy verb. |
| 7 | `news-20260516-datacenter-bills-en` | **borderline TP** | "Should the city approve it?" — concrete-actor referendum. |
| 8 | `news-20260516-datacenter-elsewhere-en` | **FP** | "ban" as noun ("a city bans / is the ban ethical?"); concrete scene. |
| 9 | `news-20260516-eurovision-safe-stage-en` | **TP** | "Should security restrict them?" — vague-actor + vague-verb. |
| 10 | `news-20260516-weather-work-commute-en` | **borderline TP** | "Should employers be required to allow remote work…?" |

### Triage totals (top 30 sample)

- **Strong TP**: 5 (~17%)
- **TP / borderline TP**: 11 (~37%)
- **FP / borderline FP**: 14 (~46%)

Across the full 44-item flagged set (34 approved + 10 drafts), the
proportions are consistent with the top-30 sample by construction
(the sampler ordered by warning count and final score). The two
loudest FP patterns observed are:

1. **`SUPPORT_OPPOSE_RE` matches nouns**: "ban", "support", "approve",
   "limits" are caught when used as concrete nouns inside otherwise
   well-shaped dilemmas. ~50% of FPs.
2. **`EDITORIAL_TRADEOFF_MARKERS_RE` misses IT conditional verbs**:
   "ma penalizzerebbe", "ma priverebbe", "ma ridurrebbe" — common
   Italian tradeoff phrasing in the conditional tense — is not
   suppressed because the regex only lists present-indicative
   conjugations. ~25% of FPs.
3. **`UNDEFINED_ACTOR_RE` matches "gli altri" personally**: "verso gli
   altri", "agli altri" mean "to others" in concrete relationship
   dilemmas. ~10% of FPs.
4. **`UNDEFINED_ACTION_RE` matches noun-form verbs**: "limiti"
   (limits-as-noun), "ridurre" infinitive inside an option phrase
   rather than an action proposal. ~10% of FPs.
5. **Concrete + cost + referendum-tail dilemmas**: well-shaped scenes
   that end with "Do you support it?" / "Lo sostieni?" / "Should the
   government do X?" These are the genuine grey zone — the body of
   the dilemma is concrete and costed, but the tail collapses into a
   yes/no poll. Reasonable people will disagree on whether the warning
   should fire here. ~5–8 of the 44 flagged items.

## Recommendation

**Keep the four editorial-shape checks as advisory warnings. Do NOT
escalate to hard rejection.** A ~10.5% flag rate on the approved pool
sounds tractable, but the ~46% false-positive rate observed in the
sample makes hard rejection too aggressive — too many concrete,
well-shaped dilemmas would be sent back for rewrite.

### Two parallel follow-up sprints worth queuing (separate, both small)

**`DILEMMA-EDITORIAL-WARNINGS-REGEX-TUNING-01`** — single-file edit on
`lib/content-quality-gates.ts` + new vitest cases. Expected ~30% FP
reduction. Concrete changes:

1. Expand `EDITORIAL_TRADEOFF_MARKERS_RE` to include IT conditional
   forms: `ma (?:raddoppierebbe|penalizzerebbe|danneggerebbe|costerebbe|sacrificherebbe|aumenterebbe|ridurrebbe|priverebbe|toglierebbe|escluderebbe)`.
   Same for "pur" + gerund conditional. Same for "rischiare" infinitive
   (not just "rischiando" gerund).
2. Tighten `SUPPORT_OPPOSE_RE` to require the matched word be in
   verb position. Simplest cheap heuristic: require the verb to be
   preceded by "should\\s+\\w+\\s+", "to\\s+", "dovrebbe(?:ro)?\\s+",
   "deve\\s+", or to be the final word before a question mark. Removes
   noun usages ("the ban", "support forum") without requiring NLP.
3. Tighten `UNDEFINED_ACTOR_RE`: drop "gli altri" from the regex
   entirely, OR require a negative-lookbehind on "verso|agli|con|tra|tra\\s+di|degli".
   The signal "un Paese / i Paesi" is enough to catch the canonical weak
   case without "gli altri".
4. Tighten `UNDEFINED_ACTION_RE`: require the verb to be in verb
   position (same heuristic as `SUPPORT_OPPOSE_RE`). Specifically
   reject the noun forms `\\blimiti\\b` (often `limiti d'età`) and
   verb-infinitive matches inside option phrases.
5. Expected target after tuning: TP ≥ 75%, FP ≤ 25% in a re-run of
   this dry-run.

**`ADMIN-UI-EDITORIAL-WARNING-SURFACE-01`** — when approved/draft
review UI ships, render the four new codes with distinctive copy + the
matched trigger token, so a human reviewer can verdict TP/FP in <5s
per item. Out of scope for the gate-tuning sprint above.

### Do NOT do (yet)

- **Do not** flip the four warnings into `reasons` (hard rejection)
  until both follow-ups above have shipped and a re-run dry-run shows
  FP ≤ 25%. Risk: noise overload on admin queue, false rejection of
  good dilemmas, gate inversion (more drafts than approvals).
- **Do not** retroactively rewrite the 34 currently-flagged approved
  dilemmas in bulk. Many are FPs; rewrites would degrade them. Hand-pick
  the strong-TP set (rows 2, 5, 6, 10, 11 in the approved triage above)
  if a small editorial follow-up is approved by PM. That belongs in
  `DILEMMA-EDITORIAL-REWRITE-FROM-DRYRUN-01`, separate sprint.
- **Do not** touch `lib/content-generation-prompts.ts` in this dry-run
  follow-up. The prompt-level guidance shipped in commit `30fe2ac` is
  fine; the next round of weak generations should already be lower per
  the new SAFETY_RULES.

### Files produced by this sprint

- `scripts/audit-editorial-warnings.mjs` (new, local-only, no package script entry)
- `reports/dynamic-dilemma-editorial-warnings-dryrun-2026-05-25.md` (this file)
- `reports/dynamic-dilemma-editorial-warnings-dryrun-2026-05-25.json` (machine-readable)

