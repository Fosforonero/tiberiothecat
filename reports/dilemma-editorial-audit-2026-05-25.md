# Dilemma Editorial Audit — 2026-05-25

**Trigger:** PM feedback after seeing the IT dilemma: "Se un Paese rifiuta regole sull'AI, gli altri dovrebbero rallentare comunque?"
**Mode:** Editorial/product audit + sprint brief. No runtime behavior changed.
**Governance:** SAFE_AUTONOMOUS docs/report work. No Redis writes, no Supabase, no AI save mode, no autopublish, no deploy.

## TL;DR

The product problem is not "one bad Italian sentence." It is that some generated dilemmas still use a referendum shape:

> Should X be allowed?

That format produces boring yes/no voting. SplitVote needs conflict-shaped dilemmas:

> If doing X protects one value but damages another value, which risk do you accept?

The bad AI-regulation example fails because:

- "un Paese" and "gli altri" are vague actors.
- "rifiuta regole sull'AI" is abstract policy language.
- "rallentare" is undefined: research, products, companies, military use, regulation?
- The user can answer without imagining a cost.
- The options are likely to collapse into simple "yes, safety" vs "no, competition."

A stronger version is:

> È più pericoloso sviluppare l'AI senza regole o lasciare che lo facciano solo i Paesi che ignorano le regole?

Option A:

> Meglio rallentare tutti: se una tecnologia è rischiosa, la prudenza viene prima della competizione.

Option B:

> Meglio restare in corsa: se solo i Paesi irresponsabili avanzano, il rischio diventa ancora più grande.

This is the target shape: two defensible fears, not a yes/no position.

## What I Read

- `CLAUDE.md`, `README.md`, `ROADMAP.md`, `PRODUCT_STRATEGY.md`, `LEGAL.md`, `LAUNCH_AUDIT.md`, `CURRENT_HANDOFF.md`, `DESIGN.md`
- `reports/dilemma-depth-audit-2026-05-19.md`
- `docs/dilemma-quality-rubric.md`
- `lib/scenarios.ts`
- `lib/scenarios-it.ts`
- `lib/content-generation-prompts.ts`
- `lib/content-quality-gates.ts`
- `lib/content-generation-validate.ts`
- `lib/content-intake-validate.ts`
- `lib/content-seed-packs.ts`
- `tests/unit/content-quality-gates.test.ts`
- `.claude/agents/pm-orchestrator.md`

## Current State

### Static content is better than before, but not done

The 24 May sprint already rewrote several weak static dilemmas. `lib/scenarios.ts` now has 41 static dilemmas and many of the previous worst offenders are improved:

- `rich-or-fair`
- `robot-judge`
- `revenge-vs-forgiveness`
- `delete-social-media`
- `ai-replaces-jobs`
- `deepfake-expose`
- `tax-billionaires`
- `prison-abolition`

That was useful, but it was a recovery sprint, not a full editorial system.

### The likely failure source is dynamic/AI content

The specific "Paese rifiuta regole sull'AI" item is not in the current static EN/IT pool. It likely comes from dynamic AI drafts/approved scenarios or a generated/admin-reviewed item.

That matters because fixing one string in `lib/scenarios-it.ts` will not prevent the next weak generated dilemma from appearing.

### The prompt has good advice but not a hard enough shape

`lib/content-generation-prompts.ts` now includes useful rules:

- both options must be morally nuanced
- no bare yes/no labels
- symmetric option phrasing
- no magic empirical stipulations
- avoid overused AI automation framings
- avoid trolley/organ/lifeboat reskins

But the prompt still asks for "one moral dilemma about: topic". That lets the model turn topics into policy questions. It does not force the model to transform an abstract topic into a scene, cost, fear, or collision.

### The quality gate warns, but does not catch boringness

`lib/content-quality-gates.ts` now warns on:

- `moral_option_bare_yes_no`
- `magic_stipulation_in_question`

That is necessary, but insufficient. A dilemma can avoid both warnings and still be dull:

> Should governments regulate AI more strictly?

It has no magic percentage and no bare yes/no options, but it is still a poll prompt.

### The seed packs are topic-heavy

`lib/content-seed-packs.ts` contains many broad seeds such as:

- `AI replacing junior employees`
- `AI judges in minor cases`
- `AI therapist replacing human therapists`
- `foreign-owned app ban`
- `AI companies using public data`
- `universal basic income`
- `wealth tax on billionaires`

These can become good dilemmas, but only if the generation layer forces a transformation from topic to conflict. Otherwise they naturally become "do you support X?" questions.

## Editorial Diagnosis

### Failure pattern 1: topic-as-question

Bad:

> Should countries slow AI development if another country ignores AI rules?

Better:

> È più pericoloso sviluppare l'AI senza regole o lasciare che lo facciano solo i Paesi che ignorano le regole?

The first asks for an opinion. The second asks the voter which danger they fear more.

### Failure pattern 2: undefined actors

Bad actors:

- "un Paese"
- "gli altri"
- "la società"
- "il governo"
- "le aziende"

These are not always wrong, but when the question is already abstract they make it worse. SplitVote works better when the actor is concrete:

- "il tuo Paese"
- "la tua azienda"
- "la scuola di tuo figlio"
- "il tuo medico"
- "la piattaforma che usi ogni giorno"

### Failure pattern 3: undefined action verb

Weak verbs:

- rallentare
- regolare
- vietare
- supportare
- permettere
- limitare

These need an object and a cost.

Better:

- "bloccare il rilascio pubblico per 12 mesi"
- "obbligare le aziende a test indipendenti prima del lancio"
- "vietare l'uso nelle scuole anche agli studenti che lo usano per accessibilità"
- "continuare a svilupparla per non lasciare il vantaggio a chi non rispetta regole"

### Failure pattern 4: yes/no masquerading as dilemma

If the natural answer can be summarized as:

- "Sì, perché è giusto"
- "No, perché è sbagliato"

then it is not strong enough.

Target answer shape:

- "Scelgo A anche se mi costa X"
- "Scelgo B anche se accetto il rischio Y"

### Failure pattern 5: policy without personal or moral cost

Not every dilemma must be first-person, but every dilemma needs a felt cost. Policy questions can work only when the two costs are explicit.

Weak:

> Should UBI be supported?

Strong:

> Se un reddito universale salva chi resta fuori dal lavoro ma raddoppia le tasse a chi ha già costruito stabilità, quale ingiustizia accetti?

## Target Editorial Formula

Every moral dilemma should be forced into this structure:

1. **Collision:** value A vs value B.
2. **Cost A:** what becomes worse if A wins.
3. **Cost B:** what becomes worse if B wins.
4. **No escape hatch:** no obvious "find another way."
5. **Option symmetry:** both options should sound like a serious person wrote them.

Prompt-level formula:

```text
Do not ask whether the topic is good or bad.
Transform the topic into a collision between two defensible fears or values.
The question must make the voter choose which cost they accept.
If either option can be summarized as simply "do the right thing", rewrite.
```

## Example Rewrites

### AI regulation race

Weak:

> Se un Paese rifiuta regole sull'AI, gli altri dovrebbero rallentare comunque?

Strong:

> È più pericoloso sviluppare l'AI senza regole o lasciare che lo facciano solo i Paesi che ignorano le regole?

Option A:

> Rallentare. Se l'AI è rischiosa, la prudenza viene prima della gara.

Option B:

> Restare in corsa. Se avanzano solo gli irresponsabili, il rischio aumenta.

### AI in schools

Weak:

> Gli studenti dovrebbero poter usare l'AI per i compiti?

Strong:

> Se vietare l'AI protegge l'apprendimento ma penalizza chi la usa per colmare lacune reali, che regola scegli?

Option A:

> Vietarla. Senza fatica propria, il voto non significa più nulla.

Option B:

> Permetterla. Una scuola giusta non punisce chi usa strumenti per restare al passo.

### AI public data training

Weak:

> Le aziende AI dovrebbero poter usare dati pubblici?

Strong:

> Se i tuoi post pubblici aiutano a creare un'AI utile a tutti, ma nessuno ti ha chiesto consenso né ti paga, è progresso o furto?

Option A:

> Progresso. Ciò che è pubblico alimenta conoscenza comune.

Option B:

> Furto. Pubblico non significa libero da prendere e monetizzare.

### Foreign-owned app ban

Weak:

> Il governo dovrebbe vietare app straniere per sicurezza nazionale?

Strong:

> Se un'app straniera può essere un rischio reale, ma vietarla dà allo Stato il potere di chiudere piattaforme scomode, quale pericolo accetti?

Option A:

> Vietarla. La sicurezza collettiva viene prima della comodità digitale.

Option B:

> Tenerla aperta. Un potere di censura resta anche dopo l'emergenza.

## Recommended Sprint

### Sprint Name

`DILEMMA-EDITORIAL-SHAPE-GATE-01`

### Goal

Stop generated moral dilemmas from becoming boring yes/no policy prompts by adding an explicit "conflict-shaped dilemma" standard to prompts, validation warnings, tests, and admin review guidance.

### Classification

**SEMI_AUTONOMOUS.** It touches AI content generation prompts and quality gates, but not save mode, autopublish config, Redis voting logic, Supabase, legal pages, billing, auth, middleware, or production DB.

PM GO required before implementation because it changes AI draft-generation behavior.

### Why Now

- PM found a real weak generated dilemma in the product experience.
- The static-41 recovery already shipped; the next bottleneck is generated-content shape.
- Current warnings catch yes/no labels and magic stipulations, but not abstract "do you support X?" questions.
- The product promise is "hard choices", not lightweight polls.

### Files To Inspect

- `CLAUDE.md`
- `CURRENT_HANDOFF.md`
- `ROADMAP.md`
- `PRODUCT_STRATEGY.md`
- `reports/dilemma-depth-audit-2026-05-19.md`
- `docs/dilemma-quality-rubric.md`
- `lib/content-generation-prompts.ts`
- `lib/content-quality-gates.ts`
- `lib/content-generation-validate.ts`
- `lib/content-seed-packs.ts`
- `tests/unit/content-quality-gates.test.ts`

### Files Allowed To Modify

- `lib/content-generation-prompts.ts`
- `lib/content-quality-gates.ts`
- `tests/unit/content-quality-gates.test.ts`
- `docs/dilemma-quality-rubric.md` only if the implementation changes reviewer guidance
- `ROADMAP.md` / `CURRENT_HANDOFF.md` only for closeout notes

### Files Forbidden

- `app/api/vote/**`
- `lib/redis.ts`
- `supabase/**`
- `middleware.ts`
- Stripe routes, webhooks, pricing, entitlements
- `app/privacy/**`, `app/terms/**`, legal copy
- env vars, Vercel config, deploy scripts
- any production DB or Redis write path
- `AUTO_PUBLISH_DILEMMAS` behavior

### Implementation Requirements

1. Add a prompt rule named internally "conflict-shaped dilemma":
   - Do not ask whether the topic is good/bad or should be supported/opposed.
   - Transform abstract topics into two defensible values/fears.
   - The question must expose the cost of both choices.
   - If a user can answer without accepting a cost, rewrite.

2. Strengthen the JSON `rationale` requirement:
   - It must name the collision, e.g. `"safety vs competitiveness"`, `"privacy vs protection"`, `"loyalty vs justice"`.
   - It must say why both options are defensible.

3. Add soft warnings in `runQualityGates` for moral dilemmas:
   - `abstract_policy_question`
   - `support_oppose_framing`
   - `undefined_collective_actor`
   - `undefined_action_verb`

   Suggested heuristics:
   - Question begins with or contains "should governments", "should countries", "should society", "dovrebbero i governi", "i Paesi dovrebbero", "la società dovrebbe".
   - Question uses "support", "oppose", "allow", "ban", "regulate", "sostenere", "opporsi", "permettere", "vietare", "regolare" without a nearby explicit cost marker such as "but", "even if", "sapendo che", "anche se", "rischiando".
   - Question has broad actors plus no second-side cost marker.

4. Keep the new checks as warnings first, not hard rejections.

5. Add tests showing:
   - The AI-regulation weak phrasing gets warned.
   - The stronger AI-regulation rewrite does not get warned.
   - A legitimate policy dilemma with explicit tradeoff does not get over-flagged.
   - Lifestyle remains exempt.
   - Existing magic-stipulation and bare-yes/no tests still pass.

6. Do not rewrite static scenarios in this sprint unless a test fixture requires it.

### QA Steps

Run:

```bash
nvm use
npm run test -- tests/unit/content-quality-gates.test.ts
npm run typecheck
npm run build
git diff --check
```

If build is too slow for the local machine, at minimum run the unit test, typecheck, and `git diff --check`, then report the skipped build explicitly.

### Acceptance Criteria

- The weak AI-regulation sample produces at least one editorial-shape warning.
- The strong AI-regulation sample passes without the new warnings.
- No warnings fire for `dilemmaStyle: "lifestyle"`.
- Existing warning behavior remains intact.
- No legal, analytics, auth, Stripe, Redis vote, Supabase migration, or autopublish behavior changes.
- Final report includes before/after examples for EN and IT.

## Claude Prompt To Send

```text
SPRINT: DILEMMA-EDITORIAL-SHAPE-GATE-01

Read first, in order:
- CLAUDE.md
- CURRENT_HANDOFF.md
- ROADMAP.md
- PRODUCT_STRATEGY.md
- reports/dilemma-depth-audit-2026-05-19.md
- docs/dilemma-quality-rubric.md
- reports/dilemma-editorial-audit-2026-05-25.md

Problem:
Matteo found a weak generated IT dilemma:
"Se un Paese rifiuta regole sull'AI, gli altri dovrebbero rallentare comunque?"

This is not acceptable product quality. It is vague, abstract, and collapses into yes/no policy polling. SplitVote dilemmas must force a real collision between two defensible values/fears. The target is not "Should X happen?" but "Which cost/risk do you accept?"

Implement a narrowly-scoped editorial-shape gate:

Allowed files:
- lib/content-generation-prompts.ts
- lib/content-quality-gates.ts
- tests/unit/content-quality-gates.test.ts
- docs/dilemma-quality-rubric.md only if guidance changes
- ROADMAP.md / CURRENT_HANDOFF.md only for closeout

Forbidden:
- app/api/vote/**
- lib/redis.ts
- supabase/**
- middleware.ts
- Stripe/payment/entitlement/webhook files
- legal pages / LEGAL.md unless actual behavior changes, which this sprint should avoid
- env vars
- production DB/Redis writes
- AUTO_PUBLISH_DILEMMAS behavior
- git push/deploy

Implementation:
1. In lib/content-generation-prompts.ts, add an explicit "conflict-shaped dilemma" instruction:
   - Do not ask whether the topic is good/bad or should be supported/opposed.
   - Transform abstract topics into two defensible values/fears.
   - The question must expose the cost of both choices.
   - If a user can answer without accepting a cost, rewrite.
   - Options must read as two serious positions, not yes/no labels.

2. Strengthen the rationale requirement so generated dilemmas must name the collision and why both sides are defensible.

3. In lib/content-quality-gates.ts, add moral-only soft warnings, not hard failures:
   - abstract_policy_question
   - support_oppose_framing
   - undefined_collective_actor
   - undefined_action_verb

   Heuristic goal: flag vague policy/referendum phrasing like:
   "Should countries slow AI development if another country ignores AI rules?"
   "Se un Paese rifiuta regole sull'AI, gli altri dovrebbero rallentare comunque?"

   But do not flag a properly-shaped tradeoff like:
   "È più pericoloso sviluppare l'AI senza regole o lasciare che lo facciano solo i Paesi che ignorano le regole?"

4. Add focused unit tests in tests/unit/content-quality-gates.test.ts:
   - weak AI-regulation sample warns
   - strong AI-regulation sample does not warn
   - explicit-tradeoff policy dilemma does not over-warn
   - lifestyle remains exempt
   - existing yes/no and magic-stipulation behavior remains green

5. Do not rewrite static scenarios in this sprint.
6. Do not change save mode, autopublish, Redis, Supabase, auth, Stripe, legal pages, or production config.

Verify:
- nvm use
- npm run test -- tests/unit/content-quality-gates.test.ts
- npm run typecheck
- npm run build
- git diff --check

Final report:
- files changed
- warnings added
- tests run
- before/after examples in EN and IT
- residual risk / false-positive notes
```

## Residual Risks

- Regex warnings will have false positives. Keep them advisory until real dynamic-pool dry-runs prove the signal is clean.
- The deeper fix is not only gates; seed topics should eventually carry `angle` and `notes` more often, especially broad AI/policy seeds.
- Admin review UI may need to surface warnings more aggressively later. This sprint should not touch admin UI unless explicitly approved.
- Dynamic approved content already in Redis may still contain weak dilemmas. Auditing or rewriting live dynamic content would require a separate PM-approved sprint because it may touch Redis/admin content workflows.

