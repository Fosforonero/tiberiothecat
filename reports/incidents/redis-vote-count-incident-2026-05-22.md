# Incident — Production Redis vote-count loss (22 May 2026)

> Owner: Matteo. Status: **open — recovery prepared, not yet executed**.

## Symptom

PM observed unusually low vote totals on public results pages on 22 May 2026. Read-only audit confirmed: `/results/trolley`, `/results/cure-secret`, `/results/memory-erase` each displayed exactly **1 total vote** — and the IT counterparts showed the same. The trolley dilemma alone should carry tens of votes accumulated since 27 Apr 2026 based on Supabase historical aggregates.

Production was tested with the documented `?voted=` ISR-bypass param and with random query-string cache-busters; counts stayed at `1`. The displayed number is what production Redis actually returns, not a stale render.

## Root cause

**Production Upstash Redis at `superb-sheepdog-80533.upstash.io` lost the `votes:*` hash data at some point on or after 2026-05-16** (the last write recorded in Supabase for `trolley`). The residual `1`-vote hashes are fresh votes that landed after the loss.

- No code regression. The last 30 commits did not touch `app/api/vote/route.ts`, `lib/redis.ts`, `lib/dynamic-scenarios.ts`, or any vote-write path.
- Exhaustive grep across the repo confirms zero code paths delete or flush `votes:*` keys anywhere — application code did not cause this.
- No env-var swap. Vercel `KV_REST_API_URL` points at the canonical production Upstash host, which is correctly different from the local `.env.local` dev host (`unified-ram-80862.upstash.io`).

The data loss is therefore one of:

- **A1 (most likely):** LRU eviction on production Upstash. Free-tier Upstash has a 256 MB hard limit; large `dynamic:scenarios` JSON + per-dilemma `votes:*` + `feedback:*` + ephemeral `ratelimit:*` accumulating until the LRU policy evicted the oldest entries.
- **A2:** Manual `FLUSHDB` / `FLUSHALL` from the Upstash console (accidental admin action).
- **A3:** Upstash-side incident with imperfect snapshot restore.

PM should check the Upstash dashboard for the production database memory-usage history and recent operations to distinguish A1/A2/A3, but the recovery path is the same regardless.

## Blast radius

- Public results pages show low (wrong) vote totals — affects all visited dilemmas with prior vote history.
- SEO `Dataset` JSON-LD on every results page reports low totals → may signal site dormancy to search engines.
- "Trending" rankings via `lib/trending.ts` still work — they read Supabase `vote_daily_stats` (intact), not Redis directly.
- Trending fallback to Redis (`getVotesBatch`) would also report low totals, but the primary Supabase path wins.
- **No user data was lost.** `dilemma_votes` (per-user vote history, auth users) is intact in Supabase. `vote_daily_stats` (per-day aggregate, all users) is intact in Supabase. Profiles, badges, missions, all auth-user state is intact.

## Recovery strategy

**Conservative reconstruction of Redis `votes:*` hashes from Supabase historical record.**

For each `(dilemma_id, choice)` pair:

```
target = MAX(
  SUM(vote_daily_stats.option_<choice>_count) for that dilemma,
  COUNT(dilemma_votes WHERE choice = <choice>) for that dilemma,
  existing Redis votes:<dilemma_id>.<choice> field
)
```

Then `HSET votes:<id> <choice> <target>` **only if `target > existing`** (never downgrades).

Why MAX (not SUM): `vote_daily_stats` and `dilemma_votes` can both contain auth votes that were never propagated to the other side (silent `trackDailyVote()` errors observed in cross-validation — 12 dilemmas have +1 to +3 auth votes recorded in `dilemma_votes` that never appeared in `vote_daily_stats`). Summing the two would double-count the auth votes that DID propagate. MAX guarantees no double-count at the cost of potentially under-recovering some ghost auth votes (≤ ~18 system-wide).

### Why this is acceptable

- The pre-loss Redis count was the lossless ground truth; it's gone. Both Supabase sources are partial mirrors.
- `vote_daily_stats` is the more complete source (covers both anon and auth, but loses ghost auth from silent RPC failures).
- `dilemma_votes` is the only auth source (full auth history, no anon).
- The MAX-of-three formula recovers ≥ each individual source, capped below the (unrecoverable) true value.
- Estimated recovery completeness: **~92% of historical vote count system-wide** (~210 of ~228 votes).
- Voting volume is small (210 lifetime votes across 134 dilemmas, avg 1.57 per dilemma); a ~8% under-recovery is operationally tolerable.

### Tool

`scripts/recover/redis-reconstruct-votes.mjs` — dry-run by default, requires three explicit flags to write (`--confirm`, `--max-keys=<n>`, `--i-understand-this-writes-production-redis`), uses HSET on individual fields only, never DELs or FLUSHes, never downgrades, batches writes via Redis pipeline. See `reports/redis-reconstruction-plan-2026-05-22.md` for the run procedure.

## Prevention

The disaster-recovery runbook (`reports/disaster-recovery-runbook.md §8`) already listed *"Daily Redis snapshot to long-term storage"* as an unchecked TODO. This incident demonstrates exactly why that hardening matters. After recovery completes, queue **`REDIS-VOTE-SNAPSHOT-CRON-01`** to ship a daily Vercel cron that writes `dynamic:scenarios`, `dynamic:drafts`, and a `votes:*` SCAN snapshot to a Supabase Storage bucket. Estimated effort: 1 sprint.

A smaller hardening also worth queuing: replace the silent `process.env.KV_REST_API_URL!` non-null assertion in `lib/redis.ts:4` with a startup validation that refuses to construct the Redis client if the URL is malformed — would catch future env-var-swap incidents at deploy time, before any vote is silently mis-routed.

## Timeline

- **27 Apr 2026:** First vote recorded in Supabase (trolley).
- **16 May 2026:** Last vote recorded in Supabase for trolley (`vote_daily_stats.last_seen`). After this date, production Redis likely already lost trolley data.
- **20 May 2026:** Recent peak day (8 votes; per `vote_daily_stats`).
- **21 May 2026:** Reduced activity (4 votes); still being captured by Supabase.
- **22 May 2026 (today):** PM observes low public vote counts; read-only audit confirms data loss on production Upstash.
- **22 May 2026:** Reconstruction tool prepared and shipped; awaiting PM dry-run execution.

## Files of record

- This incident report — `reports/incidents/redis-vote-count-incident-2026-05-22.md`.
- Reconstruction plan + run instructions — `reports/redis-reconstruction-plan-2026-05-22.md`.
- Reconstruction tool — `scripts/recover/redis-reconstruct-votes.mjs`.
- Reconstruction log (created at run time) — `reports/redis-reconstruction-<date>.log`.

## Open follow-ups (post-recovery)

1. Inspect Upstash dashboard for the production DB to distinguish A1/A2/A3 root cause; document in this file.
2. Schedule `REDIS-VOTE-SNAPSHOT-CRON-01` (daily snapshot to Supabase Storage).
3. Queue defensive guard for `lib/redis.ts` startup env validation.
4. Update `reports/disaster-recovery-runbook.md §1` with concrete reconstruction-tool reference and the confirmed recovery time achieved.
