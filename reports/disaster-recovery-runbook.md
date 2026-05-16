# SplitVote — Disaster Recovery Runbook

> Operational runbook for production incidents. Last updated: 16 May 2026.
> Owner: Matteo. Read this before triaging an outage — every minute saved on
> recovery is a minute of downtime avoided.

This runbook complements `LAUNCH_AUDIT.md` (which tracks readiness gaps) and
`CURRENT_HANDOFF.md` (which tracks active work). It is the procedural side:
**what to do when the site is broken in production**.

---

## 0. First 5 minutes — orientation

Before doing anything destructive, gather facts:

```bash
# 1. Confirm you have a live signal (not a false alarm in your browser cache)
curl -I https://splitvote.io/                  # expect 200
curl -I https://splitvote.io/play/trolley      # expect 200
curl -s https://splitvote.io/api/me/entitlements | head -c 500   # expect JSON

# 2. Inspect recent deploys
gh run list --limit 5                          # if gh CLI authenticated
# or: Vercel dashboard → Deployments → most recent

# 3. Inspect recent commits
git log --oneline -10
```

**Open these tabs in parallel** as you triage:

- Vercel dashboard → Project → Deployments + Logs (filter "Errors")
- Supabase dashboard → Logs + Database health
- Upstash console → Database metrics (latency, throughput, errors)
- Stripe dashboard → Webhooks → recent events
- Google Search Console → Coverage (only if SEO-shaped incident)
- AdSense dashboard → Account status (only if monetization-shaped)

Do **not** revert/redeploy yet. Identify the layer first.

---

## 1. Scenario: Redis outage / data loss (Upstash)

**Symptoms:** `/play/[id]` 500s, vote button errors, `getVotesBatch` timeouts,
homepage cold ISR fails. Upstash dashboard shows error rate spike or 5xx.

**What's at risk:**

- `dynamic:scenarios` — approved AI dilemmas (REBUILDABLE — admin re-approves drafts)
- `dynamic:drafts` — pending AI dilemma drafts (LOSS = re-generate via cron next day)
- `votes:*` hashes — per-dilemma vote counts (CRITICAL — actual user votes)
- `rate_limit:*` keys — short TTL, regenerate automatically
- `sv_voted_*` is **cookie-side**, not Redis — unaffected
- `stripe_webhook_events` is **Supabase**, not Redis — unaffected

**Recovery — order of operations:**

1. **Confirm scope.** Upstash status page + dashboard. If transient (< 5 min),
   wait — retries from `lib/redis.ts` will absorb.
2. **If permanent data loss on `votes:*`:** there is no Postgres mirror of
   Redis vote counts. The aggregate vote percentages will reset to whatever
   the recovered Redis snapshot shows. **Logged-in user vote history in
   `dilemma_votes` (Supabase) is unaffected** — only the displayed totals on
   results pages would regress.
3. **If `dynamic:scenarios` is empty:** admin republishes drafts:
   - `/admin` → Dynamic Dilemmas → re-approve drafts from `dynamic:drafts`
   - Or trigger `/api/cron/generate-dilemmas` manually with `Authorization:
     Bearer <CRON_SECRET>`
4. **Graceful degradation already in place:** `getDynamicScenarios` catches
   Redis errors and returns `[]`, so home/trending/category pages fall back to
   `lib/scenarios.ts` static set. The site stays online with reduced
   freshness.

**Mitigation to set up in advance:**

- Verify Upstash automatic backups are enabled (paid tier required).
- Consider a daily cron snapshot of `dynamic:scenarios` JSON to S3 or Supabase
  storage. Low cost, very high recoverability.

---

## 2. Scenario: Supabase outage / data corruption

**Symptoms:** Login fails, dashboard 500s, `/api/me/entitlements` errors,
admin panel blank, `dilemma_votes` writes fail.

**What's at risk:**

- All user data: profiles, votes, badges, missions, polls, subscriptions
- All admin state: role assignments, audit log
- Stripe webhook idempotency table

**Recovery — order of operations:**

1. **Confirm scope.** Supabase status page + dashboard health.
2. **If transient (Supabase down for everyone):** post a status banner via a
   Vercel env var flag (e.g. `NEXT_PUBLIC_STATUS_BANNER="Login temporarily
   unavailable. Anonymous voting still works."`). Anonymous voting flow uses
   Redis + cookies only — it survives a Supabase outage.
3. **If schema corruption / accidental drop on production:**
   - Point-in-Time Recovery (PITR) — see Mitigations below; restore to the
     latest pre-incident timestamp via Supabase dashboard.
   - If PITR is not enabled, daily logical backup is the fallback (some data
     loss expected).
4. **If RLS policy regression** (like the 16 May badges crash): re-apply the
   relevant migration file from `supabase/migration_v*.sql`. Each migration is
   designed idempotent or labels what's idempotent.
5. **Stripe webhook replay:** if Supabase was unavailable when Stripe sent a
   webhook, Stripe retries automatically (1 min, 5 min, 30 min, 2 h, 5 h,
   10 h, 24 h). After Supabase recovers, you can also resend manually:
   ```bash
   stripe events resend evt_XXXXX
   ```
   Idempotency guard (`stripe_webhook_events`) prevents double-processing.

**Mitigation to set up in advance:**

- **Enable Point-in-Time Recovery** in Supabase → Settings → Backups. Paid
  tier; recovery window typically 7 days. Without PITR you get nightly
  logical backup only.
- Document the SQL recovery snippets that already exist in
  `LAUNCH_AUDIT.md → Stripe QA → Rollback / Manual Recovery`. Keep that
  bookmarked.

---

## 3. Scenario: Vercel deploy failure / bad release on main

**Symptoms:** Build error blocks new deploys, or last deploy 500s site-wide.

**Recovery — order of operations:**

1. **Identify the bad commit:**
   ```bash
   git log --oneline -10
   # In Vercel dashboard, the "Production" tag points at the bad deploy.
   ```
2. **Promote a previous deploy** (no code change required):
   - Vercel dashboard → Deployments → find the last green one → ⋯ menu →
     "Promote to Production".
   - This is non-destructive and reversible; rolls forward by promoting
     a newer green deploy later.
3. **OR revert the bad commit on main** and push:
   ```bash
   git revert <hash> --no-edit
   git push origin main
   ```
   Use this when the issue is in `main` itself (not just one deploy) so
   future deploys don't reintroduce the bug.
4. **Never `git push --force` to main.** The history is referenced by
   external systems (GA/Search Console deploy markers, Sentry releases when
   added). Forward-only.

**Mitigation to set up in advance:**

- Branch protection on `main` (Settings → Branches): require PR review or at
  least require status checks before merge. Even a solo dev catches more
  bugs with a required `npm run typecheck` gate.
- Consider Vercel "Preview" testing of dependency upgrades before merging.

---

## 4. Scenario: Stripe outage or webhook stuck

**Symptoms:** Premium upgrade fails at checkout, or paid users not flipped to
`is_premium=true` after payment.

**Recovery:**

1. **Stripe status.com** — confirm it's not a global Stripe issue.
2. **Webhook delivery log:** Stripe dashboard → Webhooks → endpoint → Events.
   Find the failed event(s). Click "Resend".
3. **Idempotency guard means resending is safe** — see
   `lib/stripe-webhook-events.ts`. Already-processed events return
   `{ duplicate: true }` without state change.
4. **Manual recovery SQL** (admin only, last resort):
   ```sql
   -- Activate premium manually
   UPDATE public.profiles
   SET is_premium = true, subscription_status = 'active'
   WHERE stripe_customer_id = 'cus_...';

   -- Revoke premium
   UPDATE public.profiles
   SET is_premium = false, stripe_subscription_id = null, subscription_status = 'cancelled'
   WHERE stripe_customer_id = 'cus_...';

   -- Failed webhook events log
   SELECT stripe_event_id, event_type, status, error, processed_at
   FROM public.stripe_webhook_events
   WHERE status IN ('failed', 'processing')
   ORDER BY created_at DESC LIMIT 20;
   ```

---

## 5. Scenario: AdSense account disabled

**Symptoms:** AdSense email "account disabled", AdSense dashboard shows
"Disabled" status, Google sends policy violation notice.

**Recovery:**

1. **Read the violation reason carefully** in the AdSense email. Common ones
   on a soft-launch site: invalid traffic (bot/IP spike), policy violations
   (content), or missing CMP at scale in EEA.
2. **Immediately stop ad rendering** if disabled — keep AdSense script tag
   in place but unset `NEXT_PUBLIC_ADSENSE_SLOT_*` env vars in Vercel and
   redeploy. `AdSlot` falls back to `null` cleanly when slot IDs are missing.
3. **File a reconsideration request** via the AdSense help link.
4. **Address the root cause before reapplying:**
   - Invalid traffic → review server logs for bot patterns, harden rate
     limit, hold off on paid acquisition.
   - Content policy → run content review against AdSense policy list.
   - CMP → adopt a Google-certified TCF CMP (see `LEGAL.md`).

---

## 6. Scenario: Domain / DNS / Cloudflare incident

**Symptoms:** Site unreachable, www → non-www redirect broken, email aliases
not delivering, SSL warnings.

**Recovery:**

1. **DNS health:** `dig +short splitvote.io` and `dig +short www.splitvote.io`
   should both resolve to Vercel-owned IPs (or CNAME). Compare with the
   recorded baseline (capture this with `dig` once after the next stable
   state and commit it next to this file as `dns-baseline.txt`).
2. **Cloudflare DNS dashboard** — confirm records unchanged. Cloudflare is
   currently DNS-only (Proxy off); the www → non-www redirect lives in
   `vercel.json`. Do not turn on Cloudflare proxy without coordinating with
   the Stripe webhook IP allowlist.
3. **SSL** is managed by Vercel — re-issue is automatic on domain re-add.
4. **Email aliases** routed via Cloudflare Email Routing. If broken,
   Cloudflare → Email → Email Routing dashboard.

---

## 7. Scenario: Application error with a digest in browser (Next.js)

**Symptoms:** User screenshot: "Application error: a server-side exception has
occurred (digest: 1234567890)".

**Recovery:**

1. **Capture the digest** from the user. It is the only handle to find the
   stack trace in Vercel logs.
2. **Vercel dashboard → Project → Logs** → filter by digest. Vercel may strip
   stacks in production logs unless logging is configured server-side.
3. **Defensive logging pattern** introduced 15 May (`968d5d1`) prefixes
   relevant queries with `[dashboard]` etc. for grep-ability. Continue this
   pattern in new server components.
4. **Graceful error boundary** at `app/<route>/error.tsx` should already
   render a recoverable UI. If a route lacks one, that's a follow-up task.
5. **Recent precedent: digests 2512231454 + 1932806716 (16 May)** — root
   cause was `badges` table RLS with zero policies → join returned null →
   `.map()` crashed. Fix migration: `migration_v19_badges_rls_and_fk_hardening.sql`.

---

## 8. Mitigations to set up in advance (one-time)

Run this checklist as a pre-scaling project. Each item has a Vercel/Supabase/
Upstash dashboard action — no SQL required for most.

- [ ] **Supabase PITR** (Point-in-Time Recovery) — Settings → Backups. Paid tier.
- [ ] **Upstash automatic backups** — verify enabled on the production DB.
- [ ] **Daily Redis snapshot to long-term storage** — cron writes
      `dynamic:scenarios` + `dynamic:drafts` JSON to a Supabase storage
      bucket. Low cost, high recoverability. (Estimated effort: 1 sprint.)
- [ ] **Resend DNS records** (SPF + DKIM + DMARC) — verify in Resend dashboard.
- [ ] **Vercel branch protection on `main`** — require typecheck + build pass.
- [ ] **Capture `dns-baseline.txt`** next to this runbook so future drift is
      detectable at a glance.
- [ ] **Sentry or equivalent error aggregation** — currently Vercel logs only.
      Sentry would correlate Application Error digests to stacks without
      manual log digging. Decide before high-traffic launch.
- [ ] **Status banner mechanism** — `NEXT_PUBLIC_STATUS_BANNER` env var read
      by `app/layout.tsx`; render a top bar when set. Cheap, lets you keep
      anonymous voting up during a Supabase outage.

---

## 9. Communication template

When recovery time will exceed ~10 minutes, post a short message in this
order (no need to be perfect, just present):

1. **On-site:** flip `NEXT_PUBLIC_STATUS_BANNER` to a short note in EN/IT.
2. **Social:** brief tweet/IG story acknowledging the issue.
3. **In-app:** existing banner reads the env var; no code change needed.

Wording template (EN/IT):

> EN: "SplitVote is investigating an issue affecting login. Anonymous voting
> still works. We'll update here when resolved."
>
> IT: "Stiamo indagando su un problema che riguarda il login. Il voto anonimo
> funziona regolarmente. Aggiorniamo qui appena risolto."

Mark the incident closed in the same place when fixed.

---

## 10. Post-incident checklist

After every incident with > 5 minutes of impact:

1. **Write 3 sentences** in `reports/incidents-YYYY-MM-DD.md`: what happened,
   what was the root cause, what's the prevention. Keep it short — the goal
   is one folder of post-mortems, not literature.
2. **Update this runbook** if a new scenario or new recovery step came up.
3. **If a `LAUNCH_AUDIT.md` blocker was the cause**, mark it resolved.
4. **If a new product gap surfaced** (e.g. missing analytics), add to
   `CURRENT_HANDOFF.md` "next session" priorities.

---

## Reference files

- `README.md` — env vars + migration table
- `LEGAL.md` — privacy/cookie/Stripe compliance state
- `LAUNCH_AUDIT.md` — readiness gaps, Stripe + load-test runbooks
- `CURRENT_HANDOFF.md` — most recent operational handoff
- `CLAUDE.md` — agent operating rules (HUMAN_ONLY vs SAFE_AUTONOMOUS)
