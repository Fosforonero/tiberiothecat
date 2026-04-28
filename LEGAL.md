# SplitVote Legal & Compliance Tracker

Operational tracker for privacy, cookies, terms, ads, payments, analytics, and security/legal alignment.

This file is not legal advice. It is the project source of truth for engineering and PM follow-up. Before high-traffic launch, AdSense scaling, paid acquisition, or broad international rollout, get a qualified legal review.

Last reviewed: 28 Apr 2026 (Legal & Consent Reconciliation Sprint)

---

## Current Status

Phase: soft launch -> pre-scaling.

Compliance posture:

- OK for controlled soft launch with low traffic and manual monitoring.
- Not ready to claim "globally compliant".
- Before scaling, reconcile policy text with the actual production implementation.
- Treat legal/compliance as a release gate whenever ads, analytics, payments, account data, AI content, or public profile features change.

Recent sprints:

- `feat: stripe webhook idempotency` — 28 Apr 2026. Added `stripe_webhook_events` table and idempotency helpers to prevent double-processing of Stripe retries. No new personal data collected; existing payment/subscription data handling is unchanged. The new table stores only `stripe_event_id`, `event_type`, `status`, and a sanitised error string — no PII, no payment card data, no email. LEGAL.md sprint trigger: payments / Stripe webhook behavior ✓ assessed — no privacy policy or terms update required; data processor (Stripe) and data flows are unchanged.
- `feat: polish anonymous sharing insights and content qa` — 28 Apr 2026. Share flows hardened: story card, webShareText, and instagramCaption no longer expose the user's own vote choice — all share content is now aggregate-only. PersonalityClient IT loginHref fixed. No new data collection; net privacy improvement. LEGAL.md sprint trigger: share flows that include or expose a user's selected vote ✓ resolved.
- `774c131 fix: harden redirects json-ld and api inputs` — 28 Apr 2026. Redirect safety, JSON-LD escaping, GA script proxy hardening, input bounds, reduced PII logging.
- `chore: reconcile legal consent and policy docs` — 28 Apr 2026. Granular cookie consent banner, Privacy Policy EN/IT full reconciliation, Terms EN/IT alignment, Footer cookie settings link.

Primary public legal pages:

- `app/privacy/page.tsx`
- `app/it/privacy/page.tsx`
- `app/terms/page.tsx`
- `app/it/terms/page.tsx`

Primary consent / tracking files:

- `components/CookieConsent.tsx`
- `components/Footer.tsx`
- `app/layout.tsx`
- `app/api/_g/script/route.ts`
- `app/api/_g/g/collect/route.ts`
- `components/AdSlot.tsx`
- `components/AdBlockBanner.tsx`

Related docs:

- `README.md`
- `ROADMAP.md`
- `LAUNCH_AUDIT.md`
- `PRODUCT_STRATEGY.md`

---

## Known Gaps

### Cookie Consent — RESOLVED 28 Apr 2026

- [x] Banner granular: Decline / Customize / Accept All — with per-category toggles (Analytics, Advertising).
- [x] "Cookie settings" link in Footer — dispatches `sv:openCookieSettings` event, reopens banner.
- [x] Copy explicitly mentions analytics and advertising cookies.
- [x] Consent Mode v2: all four signals denied by default. GA4 operates cookieless until consent granted.
- [x] Removed false "powered by Google's CMP" claim from Privacy Policy EN.
- [x] `sv_cookie_consent` + `sv_cookie_prefs` both documented in cookie table in Privacy Policy EN/IT.

**Still open before scaled AdSense in EEA/UK/CH:**
- [ ] Google-certified TCF CMP (e.g. Cookiebot, Axeptio) — required by Google for personalized ads at scale. Custom banner is sufficient for soft launch with limited traffic. Trigger this before any paid acquisition or broad EEA advertising campaign.

### Privacy Policy — RESOLVED 28 Apr 2026

- [x] EN and IT policies fully aligned in structure and content.
- [x] All active processors documented: Vercel (hosting + Analytics), Supabase, Upstash Redis, Google Analytics 4, Google AdSense, Stripe, Resend, Anthropic, OpenRouter.
- [x] GA4 first-party proxy behavior documented: intentional `X-Forwarded-For` forwarding to Google for geo accuracy, conditioned on consent.
- [x] Account data clarified: email, display name, vote history, XP/streak/badge/mission data, referral/share events, optional demographic fields.
- [x] AI content pipeline documented: AI-generated drafts are admin-reviewed before publication.
- [x] International transfers: SCC mechanism cited for each processor.
- [x] CPRA "sharing" caveat for AdSense personalization added.
- [x] Account deletion process: `privacy@splitvote.io`.
- [x] Cookie table in both EN and IT with all storage items: `sv_cookie_consent`, `sv_cookie_prefs`, `sv_voted_*`, `sv_fb_*`, `lang-pref`, Supabase auth, `_ga/_ga_*`, Google ad cookies.

**Still open before scaling:**
- [ ] Formal DPA (Data Processing Agreement) signed or accepted with Upstash, OpenRouter, and Resend. Vercel, Supabase, Google, and Stripe have self-service DPAs.
- [ ] Privacy policy review by qualified EU counsel before >50k monthly active users.

### Terms of Service — RESOLVED 28 Apr 2026

- [x] EN and IT terms fully aligned in structure.
- [x] Account/gamification section added (XP, streak, badges, missions).
- [x] Premium subscription section: Stripe, customer portal, cancellation, 14-day refund window, consumer law carve-out.
- [x] AI-generated content section: admin-reviewed before publication.
- [x] User-submitted content section: Premium only, editorial review, worldwide licence grant.
- [x] Moderation/termination section.
- [x] Scientific representativeness disclaimer in both description and disclaimers.
- [x] No medical/legal/financial advice clause.
- [x] EU/IT consumer law carve-outs in liability and governing law sections.
- [x] Legal contact standardized: `legal@splitvote.io` in both EN and IT.
- [x] Terms IT had `hello@splitvote.io` as legal contact — corrected to `legal@splitvote.io`.

### Global Readiness

Minimum practical target before scaling:

- EU / Italy GDPR + ePrivacy cookie compliance
- UK / Switzerland Google consent requirements for AdSense
- California CCPA/CPRA baseline wording
- COPPA / minors baseline

Do not claim worldwide legal compliance from product docs alone. For Brazil LGPD, Canada PIPEDA, Australia Privacy Act, and other jurisdictions, trigger legal review when traffic or monetization justifies it.

---

## Sprint Triggers

Update this file and the public legal pages when any sprint changes:

- Cookies, localStorage, tracking scripts, analytics, AdSense, or Consent Mode
- Auth, account data, profile visibility, public profiles, badges, streaks, missions, referrals
- Payments, premium, subscriptions, refunds, Stripe webhook behavior
- Paid poll submissions, poll credits, creator/VIP tiers, or user-generated content monetization
- Email collection, transactional email, marketing email, Resend
- AI generation, content moderation, autopublish/draft approval
- Personality expansion, zodiac overlays, birth date/month collection, or personality-style profiling changes
- Geo features, country/city profile fields, approximate IP-derived location, country breakdowns, demographic fields, leaderboards
- New public locales or translated legal/cookie pages
- Share flows that include or expose a user's selected vote
- Internal comments, discussion threads, reporting, moderation, or community features
- Security controls that change data processing, IP handling, logging, rate limiting, or admin access

---

## End-Of-Day Legal Reconciliation Checklist

Run this after the last code push of the day if any relevant sprint landed:

- [ ] Read latest `git log --oneline -10` and `git status --short`.
- [ ] Review changed files touching analytics, ads, auth, payments, AI, email, cookies, or user data.
- [ ] Check `app/privacy/page.tsx` and `app/it/privacy/page.tsx` against actual processors and data flows.
- [ ] Check `app/terms/page.tsx` and `app/it/terms/page.tsx` against current monetization and user-content features.
- [ ] Check `components/CookieConsent.tsx`, `app/layout.tsx`, and `components/Footer.tsx` for consent UX and revocation.
- [ ] Update `LAUNCH_AUDIT.md` if a legal blocker changes status.
- [ ] Update `README.md` / `ROADMAP.md` only if product scope, blockers, or launch readiness changed.
- [ ] Run `npm run typecheck` and production build if legal pages/components changed.

---

## Reference Links

- Garante Privacy cookie FAQ: https://www.garanteprivacy.it/faq/cookie
- Garante Privacy cookie guidelines: https://www.garanteprivacy.it/web/guest/home/docweb/-/docweb-display/docweb/9677876
- Google EU User Consent Policy: https://www.google.com/about/company/user-consent-policy/
- Google AdSense CMP requirements: https://support.google.com/adsense/answer/13554116
- California CCPA overview: https://oag.ca.gov/privacy/ccpa
