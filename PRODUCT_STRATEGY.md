# SplitVote Product Strategy Notes

Working PM notes for premium, user-generated polls, learning paths, social growth, gamification, and community features.

This file is intentionally strategic. Implementation prompts must still be scoped as small production-safe sprints.

Last reviewed: 28 Apr 2026

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

---

## Already Started / Implemented Foundations

- Anonymous voting flow exists.
- Supabase Auth exists.
- Premium subscription MVP exists via Stripe.
- Premium/admin entitlement logic is centralized in `lib/entitlements.ts`.
- Premium/admin users do not see ads through `AdSlot` entitlement checks.
- One-time paid rename flow exists.
- User dashboard/profile exists, but UX still needs simplification.
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

- Dedicated simplified premium dashboard.
- VIP-only visual identity features such as colored names, profile frames, special avatars, text styles.
- Public profile board / bacheca with curated badges, trophies, skins, and privacy controls.
- Personality share card image generation and social sharing from profile/personality.
- Paid user-generated poll submission with review/legal workflow.
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

- Simplified premium dashboard:
  - no ads
  - submitted poll status
  - profile customization
  - badges/trophies inventory
  - personality share card
  - billing/customer portal
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
- Prefer user-declared country/city over IP geolocation.
- Neighborhood-level quests only if there is a strong privacy design and enough active users.
- Use aggregation thresholds to prevent re-identification.
- No precise location tracking by default.

---

## Personality / Profile UX

Known issue:

- Personality is not discoverable enough from profile.
- Profile/dashboard is currently too busy and needs professional UX restructuring.

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

1. Profile UX + Personality share card
2. Premium dashboard simplification and VIP/no-ads polish
3. Stripe production QA + webhook idempotency
4. Paid poll submission design + legal review
5. User-submitted poll MVP with admin review
6. Micro-learning paths MVP
7. Public bacheca with badges/trophies
8. Cosmetic/VIP visual system
9. Geo quests
10. Discussion/community layer

---

## Dedicated Sprint Plan

Use these as the next implementation ladder. Each sprint should be given to Claude separately and should finish with typecheck, build, diff check, commit, and push.

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
- Opt-in location model.
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
