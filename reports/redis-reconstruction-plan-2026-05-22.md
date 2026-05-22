# Redis vote-count reconstruction — plan & run instructions (22 May 2026)

> Companion to `reports/incidents/redis-vote-count-incident-2026-05-22.md`.
> Tool: `scripts/recover/redis-reconstruct-votes.mjs` (dry-run by default).
> **HUMAN_ONLY operation.** Only PM runs the write step. Claude prepares the tool, drafts the run procedure, and verifies the dry-run output; PM authorizes the actual production write.

---

## Data sources

| Source | What it stores | Completeness | Used as |
|---|---|---|---|
| `public.vote_daily_stats` (Supabase) | per-day, per-dilemma counts: `option_a_count`, `option_b_count`, `total_count`, `anonymous_count`, `logged_in_count` | All anon votes (full) + all auth votes that successfully called `upsert_vote_daily_stat` RPC | Primary reconstruction source for both A and B per choice |
| `public.dilemma_votes` (Supabase) | per-user, per-dilemma current vote: `user_id`, `dilemma_id`, `choice` | All auth votes that successfully inserted; auth-only | Cross-check; recovers ~18 ghost auth votes missing from `vote_daily_stats` |
| `votes:<id>` (production Upstash, `superb-sheepdog-80533.upstash.io`) | Live count hash: `{a, b}` per dilemma | Currently mostly empty; whatever is there is fresh post-loss writes | Floor: any existing field counts toward the MAX, never downgraded |

## Reconstruction formula

For each `dilemma_id` appearing in either `vote_daily_stats` or `dilemma_votes`, for each choice C ∈ {A, B}:

```
daily_C   = SUM(vote_daily_stats.option_<C>_count) over all dates for that dilemma
dvotes_C  = COUNT(dilemma_votes WHERE choice = C) for that dilemma
existing_C = existing Redis votes:<id>.<C> field (or 0 if missing)

target_C  = MAX(daily_C, dvotes_C, existing_C)

write_decision_C =
  if target_C >  existing_C  →  HSET votes:<id> <C> target_C
  if target_C <= existing_C  →  SKIP (never downgrade)
```

## Why MAX (not SUM)

`vote_daily_stats` aggregates BOTH anonymous and authenticated counts in `option_a_count` / `option_b_count`. `dilemma_votes` holds only authenticated voters' current choice. Both can independently contain auth votes the other doesn't:

- Cross-validation found 12 dilemmas where `dilemma_votes` (per-user) has +1 to +3 auth voters that never appear in `vote_daily_stats.logged_in_count`. Root cause: the `trackDailyVote()` RPC is `void`-called with a try/catch swallow in [app/api/vote/route.ts](app/api/vote/route.ts) — if Supabase blipped on a vote, the per-user row inserted but the daily aggregate skipped silently.
- Summing the two sources would double-count every auth vote that DID propagate through both paths (the vast majority).
- MAX guarantees no double-count and recovers ≥ the larger of the two; it may under-recover ghost auth votes where neither source individually exceeds the other.

## Limitations (PM should accept these explicitly before authorizing the write)

1. **Not perfectly lossless.** Reconstruction recovers ≥ 92 % of pre-loss totals system-wide. Up to ~18 ghost auth votes (counted in `dilemma_votes` but not in `vote_daily_stats`) may be under-recovered for specific dilemmas.
2. **No per-vote timing or causality recovered.** Only aggregate counts are restored. Vote-change history (if a user changed A→B within the 24h window) is collapsed to a single net current choice.
3. **No rollback of the write itself.** Once `HSET` runs, the prior Redis value is overwritten. Because we never downgrade, the only "lost" state is a stale lower number — which is exactly what we're correcting.
4. **The fresh post-loss votes are preserved.** Any vote that landed in the broken Redis since the loss event (e.g., the residual `votes:trolley {a:1, b:0}`) is included in the `existing` term of the MAX, so it's never overwritten downward.
5. **Vote-change semantics for the next 24 h are slightly affected.** Authenticated users have a 24h window to change their vote, which uses `replaceVote()` to decrement old choice and increment new. If a recent voter's prior choice was counted via `vote_daily_stats` historical aggregate and they change their vote tomorrow, the Redis swap would still work correctly (decrement-on-existing-value Lua script).

## Run procedure (PM only — Claude does NOT execute)

### Pre-flight (PM)

1. Create `.env.prod-recover` in repo root with EXACTLY these four lines (no token-paste in chat, no logs):

   ```
   KV_REST_API_URL=https://superb-sheepdog-80533.upstash.io
   KV_REST_API_TOKEN=<production rw token from Upstash console>
   NEXT_PUBLIC_SUPABASE_URL=<production Supabase URL from Vercel env>
   SUPABASE_SERVICE_ROLE_KEY=<production service role key from Vercel env>
   ```

2. Confirm `.env.prod-recover` is in `.gitignore`. The repo already ignores `.env*.local`. If `.env.prod-recover` is NOT ignored, add it before sourcing — DO NOT commit credentials.

### Step 1 — DRY RUN (no Redis writes)

```bash
node scripts/recover/redis-reconstruct-votes.mjs --env-file=.env.prod-recover
```

Expected output (approximate):

```
=== Redis vote-count reconstruction tool ===
mode               : DRY RUN
env file           : .env.prod-recover
KV (Redis) host    : superb-sheepdog-80533.upstash.io
Supabase host      : <prod>.supabase.co
tokens             : (NOT PRINTED)

=== reading Supabase ===
vote_daily_stats : ~210 rows, ~134 distinct dilemmas
dilemma_votes    : ~25 rows, ~20 distinct dilemmas
union of dilemma_ids = ~134

=== reading Redis (existing votes:* hashes, read-only) ===

=== reconstruction plan summary ===
total dilemmas considered    : ~134
hashes that would be touched : ~134 (or fewer if some Redis fields ≥ target)
fields that would be HSET    : ~200 (or so)
hashes skipped (Redis ≥)     : (few)
total votes BEFORE           : (very low — current Redis state)
total votes AFTER            : ~228 (≈ Supabase + missing ghost auth)
largest per-dilemma delta    : 6

Top 20 reconstructed dilemmas by total_after:
  organ-harvest                       0 →     6   (  2   4)
  trolley                             1 →     6   (  4   2)
  delete-social-media                 0 →     5   (  3   2)
  ...

Sample of first 10 HSET operations (planned):
   HSET votes:organ-harvest a 2 (was 0, daily=2, dvotes=0)
   HSET votes:organ-harvest b 4 (was 0, daily=4, dvotes=0)
   HSET votes:trolley a 4 (was 1, daily=4, dvotes=2)
   HSET votes:trolley b 2 (was 0, daily=2, dvotes=0)
   ...

⚠  This reconstruction is CONSERVATIVE, not perfectly lossless.

Log: reports/redis-reconstruction-2026-05-22.log

DRY RUN complete. No Redis writes performed.
```

### Step 2 — PM review

Inspect the dry-run output:

- Does the BEFORE total roughly match what you see on `/results/trolley` × ~134? (probably very low; that's the symptom.)
- Does the AFTER total approximate ~210–228 votes system-wide? (matches the Supabase-derived expectation.)
- Are the top-20 dilemmas plausible (trolley, organ-harvest, delete-social-media, etc.)?
- Are there any per-dilemma targets that look surprising (e.g., a target of 100 when you'd expect 5)? If yes, **investigate before writing.**
- Open `reports/redis-reconstruction-2026-05-22.log` and spot-check 5–10 random plan lines (JSON one-per-line with daily, dvotes, existing, target, delta).

### Step 3 — WRITE (only if dry-run looks correct)

**Three flags required.** Recommended first run: cap at 20 keys to validate behavior on a small slice.

```bash
node scripts/recover/redis-reconstruct-votes.mjs \
  --env-file=.env.prod-recover \
  --confirm \
  --max-keys=20 \
  --i-understand-this-writes-production-redis
```

The script will:
- Re-fetch Supabase and Redis (so any votes since the dry-run are also factored in).
- Re-compute targets with the same MAX formula.
- Write at most 20 hashes via a single Redis pipeline.
- Defer the remainder (script will print "X additional hashes deferred to a later run").

### Step 4 — Verification

```bash
# Curl a sample of just-restored dilemmas — should now match Supabase
curl -s https://splitvote.io/results/trolley         | grep -oE '"[0-9]+ votes? \([0-9]+%\)"' | head -3
curl -s https://splitvote.io/results/organ-harvest   | grep -oE '"[0-9]+ votes? \([0-9]+%\)"' | head -3
curl -s https://splitvote.io/results/cure-secret     | grep -oE '"[0-9]+ votes? \([0-9]+%\)"' | head -3
curl -s https://splitvote.io/it/results/trolley      | grep -oE '"[0-9]+ voti? \([0-9]+%\)"' | head -3

# Wait ~60s for ISR cache to refresh, OR force-bypass via ?voted= param:
curl -s 'https://splitvote.io/results/trolley?voted=a' | grep -oE '"[0-9]+ votes? \([0-9]+%\)"' | head -3
```

Expected: trolley shows `4 votes` and `2 votes` (4A, 2B = 6 total), matching the reconstruction target.

### Step 5 — Repeat in batches

```bash
# Bigger batch once you trust the first run
node scripts/recover/redis-reconstruct-votes.mjs \
  --env-file=.env.prod-recover \
  --confirm \
  --max-keys=200 \
  --i-understand-this-writes-production-redis
```

The script always re-fetches, re-computes, and skips already-correct hashes — running it repeatedly is idempotent (modulo new votes that arrive between runs, which are factored in via the `existing` term).

### Step 6 — Cleanup

```bash
# Remove the temporary credentials file
rm .env.prod-recover

# Confirm working tree is clean
git status --short
```

## Rollback limitations

There is **no programmatic rollback** for the writes:

- The script does not snapshot pre-write Redis state before HSET (would add latency and complexity for marginal value — pre-write state was already partly garbage).
- The script's log file records the BEFORE and AFTER values for every key, so a manual "set back to BEFORE" is mechanically possible by editing the log into a remediation script — but the BEFORE values were the symptomatically-low post-loss state, so reverting would just reproduce the original bug.
- If a write produces unexpectedly high counts (e.g., a programmer bug doubled a value), the fix is to determine the correct target and `HSET` again — never to subtract by `HINCRBY -N`, which could create negative-bounded incorrect values.

The **only safe rollback** is a manual `HSET` to the BEFORE value recorded in the log file, applied per-key. The triple-flag write gate is intentionally aggressive *because* rollback is manual.

## Status

- **22 May 2026:** Script + reports prepared. Dry-run **not yet executed** in this sprint.
- **PM next action:** create `.env.prod-recover`, run dry-run, review output, decide on write batch sizes.
- **Claude next action:** none until PM reports back with dry-run output for review, then helps interpret the plan summary before the WRITE step.
