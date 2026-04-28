# SplitVote Product Strategy Notes

Working PM notes for premium, user-generated polls, learning paths, social growth, gamification, and community features.

This file is intentionally strategic. Implementation prompts must still be scoped as small production-safe sprints.

Last reviewed: 28 Apr 2026 (Social Share + Insight + Content QA Polish sprint)

---

## Current Product Direction

SplitVote should evolve in this order:

1. Frictionless voting loop
2. Retention loop through identity, personality, badges, streaks, and share cards
3. Manual social/content engine
4. Premium utility and cosmetic monetization
5. Curated user-generated polls
6. Learning paths and thematic quests
7. Geo/event quests and public profile boards
8. Community discussion layer, only after moderation capacity exists

Core rule: anonymous users must always be able to vote without creating an account.

i18n expansion rule:

- EN/IT are enough for controlled soft launch.
- Do not add another language until the core loop, personality sharing, guided category paths, and social content workflow are stable.
- Next language: Spanish (`es`) because it has the best global/social expansion fit after English.
- Next after Spanish: Brazilian Portuguese (`pt-BR`) because it is stronger for social/viral growth than French for this product category.
- French (`fr`) should follow PT-BR as the next broad international language.
- Chinese should be treated as a separate localization/distribution project, not a routine translation sprint.

Current priority override:

- Fix the core loop before adding more monetization or personality complexity.
- "Next dilemma" must avoid questions the user already answered whenever possible.
- Vote changes must be obvious and low-friction.
- Add gamified paths only after the basic fresh-question loop is reliable.
- Share should focus on questions and live aggregate results, not exposing a user's own vote by default.
- Post-vote insights are a strong retention feature; keep improving quality, specificity, and localization.
- Content QA/refuso checks are production polish, especially for AI-generated approved dilemmas.

---

## Already Started / Implemented Foundations

- Anonymous voting flow exists.
- Supabase Auth exists.
- Premium subscription MVP exists via Stripe.
- Premium/admin entitlement logic is centralized in `lib/entitlements.ts`.
- Premium/admin users do not see ads through `AdSlot` entitlement checks.
- One-time paid rename flow exists.
- User dashboard/profile UX simplified (28 Apr 2026): stats show XP/streak/votes/badges; premium benefits explicit (no ads, renames, submit polls); personality CTA promoted above trophy case in profile; coming-soon block removed from profile; public profile has "Public Profile" indicator.
- Personality route exists (`/personality`, `/it/personality`).
- Public profile route exists (`/u/[id]`) with basic public stats/badges.
- XP, streaks, badges, daily missions exist at foundation level.
- `badges`, `user_badges`, `equipped_badge`, and `equipped_frame` already exist as DB foundations.
- OpenRouter is already used server-side for draft generation.
- AI content is draft-only with admin approval.
- Social content factory exists as local/manual workflow; no auto-posting.
- Instagram/TikTok official links exist in Footer/JSON-LD.
- Legal baseline exists in `LEGAL.md`, Privacy EN/IT, Terms EN/IT.

---

## Not Started / Not Ready Yet

- Dedicated simplified premium dashboard — ✅ basic UX done (28 Apr 2026); advanced features below still pending.
- VIP-only visual identity features such as colored names, profile frames, special avatars, text styles.
- Public profile board / bacheca with curated badges, trophies, skins, and privacy controls.
- Personality share card image generation and social sharing from profile/personality.
- Paid user-generated poll submission — basic foundation secured (28 Apr 2026): server-side Premium enforcement, input validation, RLS hardening. Full paid workflow (per-question credits, poll analytics, submission quotas) not started.
- Tiered paid poll plans such as per-question pricing or monthly question bundles.
- Micro-learning section with thematic paths.
- Learning-path generation using OpenRouter.
- Social trend ingestion from Instagram, TikTok, YouTube, or X through official APIs/providers.
- Geo quests by country/city/neighborhood.
- Unique event trophies and trophy economy.
- Cosmetic shop / bundles.
- Discussion threads under dilemmas.
- External community integration such as Reddit.
- Full moderation/audit workflow for user-generated content.
- Spanish localization (`es`) and additional non-EN/IT locales.

---

## Internationalization Roadmap

Current state:

- English is the global default.
- Italian is implemented through the `/it` route family.
- EN/IT routes, sitemap, hreflang, blog, legal pages, personality, social captions, and core voting flows exist.

Recommended language order:

1. Spanish (`es`)
2. Brazilian Portuguese (`pt-BR`)
3. French (`fr`)
4. German (`de`) or Japanese (`ja`) only after traffic data supports it
5. Chinese Simplified (`zh-CN`) as a separate market-entry project
6. Chinese Traditional (`zh-TW`) only if there is a specific Taiwan/Hong Kong strategy

Why this order:

- Spanish has the best mix of global reach, social virality, SEO opportunity, and implementation effort.
- Brazilian Portuguese is a strong social/mobile market and a natural next growth language after Spanish.
- French adds Europe, Canada, and parts of Africa, but likely has lower immediate viral fit than Spanish/PT-BR.
- Chinese requires different SEO, social distribution, cultural review, legal review, and possibly platform strategy. Do not treat it as a simple string translation.

Spanish launch gate:

- Core voting loop stable with fresh next dilemmas.
- Guided category path MVP shipped.
- Personality share card stable.
- Social Content Factory works reliably for EN/IT.
- At least basic Search Console / social signal review from EN/IT.
- Legal pages can be translated and reviewed.

Spanish scope:

- `/es` route family:
  - `/es`
  - `/es/trending`
  - `/es/play/[id]`
  - `/es/results/[id]`
  - `/es/category/[category]`
  - `/es/faq`
  - `/es/privacy`
  - `/es/terms`
  - `/es/personality`
  - `/es/blog`
- Spanish static scenario translations.
- Spanish metadata, canonical, hreflang, sitemap entries.
- Spanish personality copy and share card copy.
- Spanish cookie banner and legal pages.
- Spanish social captions in Social Content Factory.
- Spanish blog starter set only after route quality is stable.

PT-BR launch gate:

- Spanish implementation is stable.
- Spanish content/social workflow has low maintenance cost.
- Product copy is centralized enough that adding a fourth locale does not require duplicating fragile client logic.

PT-BR scope:

- Use `pt-BR`, not generic `pt`, unless there is a Portugal-specific strategy.
- Localize tone for Brazil rather than literal Portuguese translation.
- Add Portuguese social captions after core routes work.

French launch gate:

- EN/IT/ES/PT-BR content workflows are maintainable.
- Legal pages and cookie copy can be reviewed in French.

Chinese launch gate:

- Dedicated market strategy.
- Cultural/content moderation review.
- Separate SEO/social distribution plan.
- Legal/privacy review for the target market.
- Decide `zh-CN` vs `zh-TW`; do not launch both by default.

Implementation rule:

- Add one language per dedicated sprint.
- Do not mix language expansion with product feature sprints.
- Keep legal pages and cookie consent in sync for every supported locale.
- Every locale must have reciprocal hreflang and sitemap coverage before deploy is considered complete.
- If copy starts duplicating heavily, create a locale dictionary/i18n helper before adding the fourth language.

---

## Premium / VIP Direction

### Existing Premium Meaning

Premium currently means billing-backed entitlement:

- No ads.
- Premium gates available through `lib/entitlements.ts`.
- Unlimited rename behavior already exists.

### Recommended Product Split

Avoid creating too many paid concepts too early. Use one paid identity first:

- `Premium`: subscription utility + no ads + light identity perks.
- `VIP`: marketing label for Premium cosmetic/status features, not a separate billing system at first.

Do not sell pay-to-win mechanics. Paid users must not affect:

- Vote counts
- Ranking
- Visibility of opinions
- Public result weighting

### Future Premium Features

- Simplified premium dashboard — ✅ base done (28 Apr 2026):
  - ✅ no ads — benefit confirmed in dashboard copy
  - ✅ profile customization — avatar, name, demographics
  - ✅ badges/trophies inventory — trophy case in profile
  - ✅ billing/customer portal — Manage Billing button links to Stripe portal
  - [ ] submitted poll status — polls section exists but only shown when polls > 0
  - [ ] personality share card — personality page exists; card download exists; direct access from profile pending
- VIP visual status:
  - name color
  - profile frame
  - avatar style
  - profile board skin
- Premium bundles:
  - monthly subscription
  - cosmetic bundle
  - poll submission credits

Do not implement multiple pricing tiers until Stripe QA and legal review are complete.

---

## Paid Poll Submission

This is high-value but legally sensitive. Treat as a dedicated sprint after premium QA.

Recommended model:

- Only logged-in paying users can submit polls.
- Every submitted poll enters admin review.
- Nothing user-submitted is auto-published.
- The submitter must accept a clear content responsibility checkbox.
- The platform keeps audit records needed for abuse investigation and lawful requests.
- Email confirmation should go to the submitter.
- Internal notification should go to admin/support.

Initial pricing ideas to validate later:

- One-off poll credit: low-cost single submission.
- Premium monthly: small monthly allowance.
- Higher plans: more submissions per month.

Do not finalize global pricing until legal/tax/consumer-rights review is done.

### Required Content Rules

Disallow user submissions involving:

- Sexual content or minors
- Harassment or hate
- Racism, extremist ideology, or incitement
- Illegal weapons or prohibited substances
- Instructions for illegal activity
- Defamation or identifiable private persons
- Graphic violence
- Political extremism or targeted manipulation
- Health/legal/financial advice framed as professional advice

Terms/Privacy must be reviewed before launch of paid submissions.

---

## Micro-Learning / Thematic Paths

This is strategically strong if it builds on the existing dilemma format.

Recommended MVP:

- Curated paths, not open-ended courses.
- Each path is a sequence of 5-10 dilemmas around a theme.
- Each dilemma has a short neutral explanation after voting.
- Paths can be generated with OpenRouter but must remain draft-only and admin-approved.

Example paths:

- AI ethics
- Privacy vs security
- Climate choices
- Friendship and loyalty
- Justice and punishment
- Work and ambition

Do not position this as formal education or professional advice.

---

## Social Trend Research

Use trends to inspire drafts, not to scrape or copy content.

Allowed direction:

- Official APIs
- Approved providers
- Manual research
- Google Trends, news/RSS, Reddit where policy-compliant
- YouTube/Instagram/TikTok only through official APIs or compliant provider contracts

Not allowed:

- Fragile scraping
- Evading platform protections
- Copying creator content
- Auto-posting without approval

The current social content factory should remain manual until there is consistent traction.

---

## Gamification Structure

Recommended hierarchy:

- Badge: recurring/basic achievement
- Trophy: unique or limited-time achievement
- Frame: profile cosmetic
- Skin: public board cosmetic
- Avatar: identity cosmetic
- Quest: time-bounded objective
- Event: quest bundle with a theme and unique rewards

Reward categories:

- Earned-only: streaks, quest wins, limited events
- Premium-included: light cosmetic status
- Purchasable: skins, frames, avatar packs
- Legacy/anniversary: account age milestones

Earned-only rewards should be more prestigious than purchased cosmetics.

### Geo Quests

Geo quests are high potential but high privacy risk.

Rules:

- Opt-in only.
- Use a hybrid model, but with clear priority:
  - preferred source for city quests: user-declared country/city in profile
  - allowed fallback: approximate IP-derived location only after clear consent / opt-in
  - analytics-only coarse geography can remain aggregate and non-user-facing
- Neighborhood-level quests only if there is a strong privacy design and enough active users.
- Use aggregation thresholds to prevent re-identification.
- No precise location tracking by default.
- Never store raw IP for geo features.
- Store only normalized coarse fields needed for the product, such as `country_code`, `region`, and `city`.
- Let users edit or remove declared location from profile.
- Public geo breakdowns and leaderboards need minimum sample thresholds.
- Neighborhood quests should remain design-only until there is enough traffic and a legal/privacy review.

---

## Personality / Profile UX

Known issue:

- Personality is not discoverable enough from profile.
- Profile/dashboard is currently too busy and needs professional UX restructuring.
- Personality is highly promising, but the current 6-archetype system should be validated before expanding to 20+ archetypes.
- Zodiac alignment can be a strong entertainment layer, but it must be framed as playful and optional, never scientific or diagnostic.

Recommended sprint:

- Simplify profile dashboard IA:
  - Overview
  - Personality
  - Badges/Trophies
  - Activity
  - Premium
  - Settings
- Add clear personality card entry point from profile.
- Add shareable personality card image.
- Add localized EN/IT sharing copy.
- Reuse existing brand/social card style where possible.

Need to verify:

- Number of personality archetypes.
- Whether personality share cards already exist or only text share exists.

Future personality expansion:

- Target: expand from 6 to about 18-24 archetypes only after the current personality share loop shows engagement.
- Use the existing 5 moral axes as the base. Avoid arbitrary personality labels that do not map to vote behavior.
- Add "zodiac alignment" as an optional overlay, not as part of the core moral score.
- Do not collect full birth date unless there is a clear product need. Prefer optional zodiac sign selection to reduce personal data.
- Copy must remain entertainment/reflective: "based on your SplitVote choices", "for fun", "not scientifically validated".

---

## Discussion / Threads

Do not build internal comments yet.

Reason:

- Moderation burden is high.
- Legal risk is high.
- Spam/abuse surface is large.
- It distracts from retention and social sharing.

Recommended sequence:

1. Improve share loop first.
2. Use external discussion surfaces manually, such as Reddit posts or social comments.
3. Add internal discussion only after moderation, reporting, blocking, rate limits, and policy pages are ready.

If internal threads are built later:

- Logged-in only.
- Strong moderation queue.
- Report button.
- Rate limits.
- Abuse audit log.
- Clear content policy.
- No comments from anonymous users.

---

## Recommended Next Product Sequence

Do not build all ideas at once. Recommended order after current social-content cleanup:

1. Social/share + insight polish
2. Profile UX + Personality share card
3. Premium dashboard simplification and VIP/no-ads polish
4. Stripe production QA + webhook idempotency
5. Paid poll submission design + legal review
6. User-submitted poll MVP with admin review
7. Micro-learning paths MVP
8. Public bacheca with badges/trophies
9. Cosmetic/VIP visual system
10. Geo quests
11. Discussion/community layer

---

## Dedicated Sprint Plan

Use these as the next implementation ladder. Each sprint should be given to Claude separately and should finish with typecheck, build, diff check, commit, and push.

### Immediate Sprint — Social Share + Insight + Content QA Polish

Goal: improve the share loop and post-vote educational value without exposing the user's own vote.

Scope:

- Add pre-vote "Share question" action on play pages.
- Keep post-vote sharing, but make it anonymous aggregate sharing:
  - share question + live percentages
  - do not include "I voted" / "You chose" / selected option by default
- Update story cards so result cards do not reveal the user's vote unless a future explicit mode is added.
- Improve Expert Insight quality and presentation after voting.
- Fix IT personality/profile locale issues.
- Run a lightweight content QA/refuso sweep for static and approved dynamic dilemmas, especially Italian text.

Out of scope:

- New social APIs
- Auto-posting
- New DB schema
- New tracking beyond existing safe share events
- New personality archetypes
- Zodiac overlay

Why now:

- Sharing the question before a vote increases top-of-funnel.
- Anonymous aggregate sharing matches the product promise better than "my vote" sharing.
- Better post-vote insights increase session depth.
- Content typos damage trust quickly during soft launch.

Legal/docs:

- No legal update expected if no new personal data is collected.
- Maintain anonymous wording and avoid implying psychological diagnosis.

### ~~Guided Category Path MVP~~ — COMPLETED 28 Apr 2026

Implemented: `getFreshNextScenarioIdByCategory` helper. Query-param path flow (`?path=technology&step=1&target=3`). Category page CTAs. Play/results pages path-aware. VoteClientPage preserves path params in all redirects. ResultsClientPage shows continue/complete/exhausted states. No DB, no auth, no paid feature.

### ~~Immediate Sprint — Fresh Next Dilemma + Vote Grace UX~~ — COMPLETED 28 Apr 2026

Implemented: `getFreshNextScenarioId` excludes all voted IDs server-side (Supabase for auth users, `sv_voted_*` cookies for anon). 3-second grace countdown before POST with Undo/Confirm. `nextId = null` fallback → "Browse all" CTA.

### Sprint 1 — Profile UX + Personality Entry Point

Goal: make the existing profile/dashboard easier to understand and make Personality clearly reachable.

Scope:

- Audit current `/profile`, `/dashboard`, `/personality`, `/it/personality`, `/u/[id]`.
- Reorganize profile/dashboard into clear sections:
  - Overview
  - Personality
  - Badges / progress
  - Activity
  - Premium
  - Settings
- Add prominent Personality card/CTA from profile/dashboard.
- Keep anonymous voting unchanged.
- Keep all existing data/API contracts.

Out of scope:

- New DB schema
- Paid poll submission
- Cosmetic shop
- Internal comments
- Geo quests

Why first:

- Highest retention impact with low legal/technical risk.
- Uses existing personality and profile foundations.

Legal/docs:

- Read `LEGAL.md`; likely no legal page update unless public profile visibility changes.

### Sprint 2 — Personality Share Card

Goal: turn the personality result into a shareable visual asset.

Scope:

- Verify current personality share behavior.
- Create/share a branded personality card for EN/IT.
- Include archetype, sign, emoji, short tagline, and splitvote.io URL.
- Add social share/download actions from Personality page and profile entry point.
- Reuse existing story-card/OG visual patterns where practical.

Out of scope:

- Remotion/video
- New personality archetypes
- Paid cosmetics
- Social auto-posting

Why second:

- Direct viral loop improvement.
- Makes identity feature visible on social platforms.

Legal/docs:

- Ensure copy says "based on your SplitVote choices" and not scientific diagnosis.

### Sprint 3 — Premium Dashboard Simplification

Goal: make Premium feel real before adding more monetization.

Scope:

- Build a simplified premium/user dashboard surface using existing entitlements.
- Show:
  - no-ads status
  - billing/customer portal access
  - rename entitlement/status
  - profile/personality shortcuts
  - future perks as disabled/coming-soon if needed
- Do not create new pricing tiers.
- Do not alter Stripe price IDs or billing model.

Out of scope:

- Poll credits
- VIP cosmetic marketplace
- New Stripe products
- Subscription tier matrix

Why third:

- Premium already exists but needs clearer perceived value.
- Lower risk than changing billing.

Legal/docs:

- Check Terms/Privacy only if user-facing premium promises change.

### Sprint 4 — Stripe Production QA + Webhook Idempotency

Goal: harden monetization before adding paid poll credits or VIP tiers.

Scope:

- Add webhook idempotency for `checkout.session.completed` and subscription lifecycle events.
- Prevent double increment of `name_changes`.
- Document required production Stripe events/env vars.
- Add safe test notes for real-card production QA.

Out of scope:

- New products/prices
- Paid poll submission
- Cosmetic shop

Why fourth:

- Payment correctness is a blocker for any bigger monetization.

Legal/docs:

- Update `LAUNCH_AUDIT.md`, README, and `LEGAL.md` if billing behavior or refund wording changes.

### Sprint 5 — Paid Poll Submission Spec + Legal Design

Goal: design the paid user-generated poll workflow before implementation.

Scope:

- Create or update docs/spec for paid poll submission:
  - who can submit
  - pricing options to evaluate later
  - admin review lifecycle
  - audit trail
  - email notifications
  - prohibited content rules
  - submitter responsibility checkbox
  - moderation and takedown flow
- Identify exact files/schema likely needed for implementation.
- Update `LEGAL.md` with blockers.

Out of scope:

- No code implementation except docs/spec.
- No new Stripe prices.
- No live paid submission UI.

Why fifth:

- High revenue potential, but too legally sensitive to build ad hoc.

Legal/docs:

- Required. Terms/Privacy may need planned changes listed, but do not rewrite live pages unless implementation starts.

### Sprint 6 — User-Submitted Poll MVP

Goal: allow controlled paid/premium poll submissions with admin review.

Prerequisite:

- Sprint 4 complete.
- Sprint 5 reviewed.

Scope:

- Logged-in eligible users can submit a poll.
- Every submission is draft-only.
- Admin approval required before public visibility.
- Content policy checkbox required.
- Basic audit trail and notification hooks.
- Strong server-side validation.

Out of scope:

- Auto-publish
- Public comments
- Multiple paid plans
- Social trend ingestion

Why sixth:

- Opens monetization and content supply while keeping platform control.

Legal/docs:

- Must update Terms EN/IT, Privacy EN/IT if new personal data/audit data is collected, and `LEGAL.md`.

### Sprint 7 — Micro-Learning Paths MVP

Goal: package dilemmas into themed learning/insight paths.

Scope:

- Define path model using existing content where possible.
- Start with static/curated paths.
- Each path includes 5-10 dilemmas and neutral post-vote context.
- AI/OpenRouter can draft paths, but only admin-approved content becomes public.

Out of scope:

- Formal education claims
- Certificates
- Professional advice
- User-generated learning paths

Why seventh:

- Improves depth and session length after core identity/monetization are clearer.

Legal/docs:

- Copy must say educational/reflective content, not professional advice.

### Sprint 8 — Public Bacheca + Badges/Trophies Foundation

Goal: turn public profile into a status surface.

Scope:

- Public profile board with visible badges/trophies.
- Privacy controls for what is public.
- Basic trophy model/spec if not already present.
- Share card for public profile/badge.

Out of scope:

- Paid cosmetic shop
- Geo quests
- Competitive leaderboards

Why eighth:

- Builds the status layer before selling cosmetics.

Legal/docs:

- Public visibility defaults must be conservative; update Privacy/LEGAL if visibility or public profile data changes.

### Sprint 9 — VIP Cosmetic Layer

Goal: add paid/status visual identity without pay-to-win.

Scope:

- Use Premium/VIP as visual label, not a separate billing system at first.
- Add cosmetic concepts:
  - name color
  - profile frame
  - avatar style
  - board skin
- Free/earned rewards should remain more prestigious than purchasable items.

Out of scope:

- Complex marketplace
- Loot boxes / random rewards
- Vote/result influence

Why ninth:

- Monetization after users have a public place to display status.

Legal/docs:

- Update Terms if paid cosmetics become purchasable.

### Sprint 10 — Geo/Event Quest Design

Goal: design privacy-safe geo and event quests before any implementation.

Scope:

- Country/city quest design.
- Hybrid location model:
  - user-declared city/country in profile as the primary source
  - approximate IP-based location only as an explicit opt-in fallback
  - no raw IP storage for geo features
- Aggregation thresholds.
- Anti-abuse and privacy constraints.
- Badge/trophy rewards.

Out of scope:

- Precise location tracking
- Neighborhood quests implementation
- Public local leaderboards without privacy review

Why tenth:

- Potentially powerful but should wait for traffic and privacy review.

Legal/docs:

- Required. Update `LEGAL.md` and likely Privacy before implementation.
- Required before storing any city/country profile field or using IP-derived location for product features.

### Sprint 11 — Discussion/Community Design

Goal: decide whether internal discussion is worth building.

Scope:

- Compare internal threads vs external Reddit/social discussion.
- Define moderation requirements:
  - logged-in only
  - report button
  - rate limits
  - block/delete
  - audit logs
  - content policy
- Produce implementation spec only.

Out of scope:

- No comments implementation in the first sprint.

Why last:

- High moderation/legal burden and lower priority than retention/social/premium.

Legal/docs:

- Required before any user comments go live.

---

## Legal Triggers

Update `LEGAL.md`, Privacy, and Terms before implementing:

- Paid poll submissions
- New subscription tiers or poll-credit pricing
- User-generated content publication
- Internal comments/threads
- Geo quests
- Public profile visibility changes
- New social data providers
- Marketing emails or creator/community campaigns
