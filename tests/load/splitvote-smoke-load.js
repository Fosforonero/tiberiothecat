/**
 * SplitVote — Smoke / Light Load Test (k6)
 *
 * Purpose: verify baseline latency and error rate across all page types
 * before paid campaigns or viral spikes. Covers:
 *   - ISR pages (home, trending, category)    → should be Vercel-edge-cached
 *   - force-dynamic pages (play, results)     → hit Next.js server + Redis + Supabase on every request
 *   - Vote API (optional write test)          → exercises rate limiting and Redis increment
 *
 * Usage:
 *
 *   # Smoke test against localhost (dev server must be running):
 *   k6 run tests/load/splitvote-smoke-load.js
 *
 *   # With explicit BASE_URL:
 *   BASE_URL=http://localhost:3000 k6 run tests/load/splitvote-smoke-load.js
 *
 *   # Include optional write test (POST /api/vote):
 *   ENABLE_WRITE_TESTS=true k6 run tests/load/splitvote-smoke-load.js
 *
 *   # Against a Vercel Preview deployment:
 *   BASE_URL=https://my-preview.vercel.app ALLOW_PROD_LOAD_TEST=true k6 run tests/load/splitvote-smoke-load.js
 *
 *   # Against production (controlled window only — read the safety section in LAUNCH_AUDIT.md first):
 *   BASE_URL=https://splitvote.io ALLOW_PROD_LOAD_TEST=true k6 run tests/load/splitvote-smoke-load.js
 *
 * Do NOT run with high --vus or long --duration on production without a maintenance window.
 * Do NOT include credentials, auth tokens, or real user session cookies.
 *
 * npm shortcut (no args): npm run load:smoke
 */

import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate } from 'k6/metrics'

// ── Environment ──────────────────────────────────────────────────────────────
const BASE_URL = (__ENV.BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const ENABLE_WRITE_TESTS = __ENV.ENABLE_WRITE_TESTS === 'true'
const ALLOW_PROD = __ENV.ALLOW_PROD_LOAD_TEST === 'true'

// ── Production safety guard ───────────────────────────────────────────────────
// Evaluated at module init — aborts before any VU starts.
if (BASE_URL.includes('splitvote.io') && !ALLOW_PROD) {
  throw new Error(
    '\n[splitvote-load-test] SAFETY GUARD TRIGGERED\n' +
    'BASE_URL contains splitvote.io but ALLOW_PROD_LOAD_TEST is not "true".\n' +
    'To run against production:\n' +
    '  ALLOW_PROD_LOAD_TEST=true BASE_URL=https://splitvote.io k6 run tests/load/splitvote-smoke-load.js\n' +
    'Only do this in a controlled window with low VUs and short duration.\n' +
    'Never run unsupervised on production.\n'
  )
}

// ── Static scenario IDs ───────────────────────────────────────────────────────
// These are hardcoded static scenarios — always present, never require auth.
// Using 'trolley' (morality) for play/results/vote tests.
const STATIC_SCENARIO_ID = 'trolley'

// ── Custom metrics ────────────────────────────────────────────────────────────
const voteLimitedRate = new Rate('vote_rate_limited')

// ── Test options ──────────────────────────────────────────────────────────────
//
// Default scenario:  5 VUs for 30s read-only smoke test
// Write scenario:    1 req/s for 15s POST /api/vote (optional, starts after reads)
//
// These are intentionally conservative. Before a real load test, increase
// --vus gradually and monitor Vercel function invocations + Upstash latency.
//
export const options = {
  scenarios: {
    reads: {
      executor: 'constant-vus',
      vus: 5,
      duration: '30s',
      exec: 'readTest',
      tags: { test_type: 'read' },
    },
    // Write scenario: opt-in only, extremely low rate, runs after reads complete.
    // Rate: 1 req/sec — well under the IP_LIMIT_SCENARIO threshold (5 per 10 min).
    ...(ENABLE_WRITE_TESTS ? {
      writes: {
        executor: 'constant-arrival-rate',
        rate: 1,
        timeUnit: '1s',
        duration: '15s',
        preAllocatedVUs: 1,
        maxVUs: 2,
        startTime: '35s',
        exec: 'writeTest',
        tags: { test_type: 'write' },
      },
    } : {}),
  },

  thresholds: {
    // Global error rate — fail if >5% of requests error
    http_req_failed: [{ threshold: 'rate<0.05', abortOnFail: false }],

    // ISR pages served from Vercel edge cache — should be very fast after warmup
    'http_req_duration{name:GET /}':            [{ threshold: 'p(95)<1500', abortOnFail: false }],
    'http_req_duration{name:GET /trending}':    [{ threshold: 'p(95)<1500', abortOnFail: false }],
    'http_req_duration{name:GET /category}':    [{ threshold: 'p(95)<1500', abortOnFail: false }],

    // force-dynamic pages — server + Redis + Supabase on every request; higher budget
    'http_req_duration{name:GET /play}':        [{ threshold: 'p(95)<3000', abortOnFail: false }],
    'http_req_duration{name:GET /results}':     [{ threshold: 'p(95)<3000', abortOnFail: false }],

    // Vote API — mostly rate-limit checks, expect some 429s in write test
    'http_req_duration{name:POST /api/vote}':   [{ threshold: 'p(95)<2000', abortOnFail: false }],

    // Overall check pass rate
    checks: [{ threshold: 'rate>0.90', abortOnFail: false }],
  },
}

// ── Read scenario ─────────────────────────────────────────────────────────────
// Tests all public page types. No auth, no cookies injected.
export function readTest() {
  let res

  // Homepage — ISR 3600. After first hit, Vercel serves from edge cache.
  res = http.get(`${BASE_URL}/`, { tags: { name: 'GET /' } })
  check(res, { 'home: status 200': (r) => r.status === 200 })
  sleep(0.3)

  // Trending — ISR 3600.
  res = http.get(`${BASE_URL}/trending`, { tags: { name: 'GET /trending' } })
  check(res, { 'trending: status 200': (r) => r.status === 200 })
  sleep(0.3)

  // Category — ISR 3600 + dynamicParams=false (unknown slugs 404 immediately).
  res = http.get(`${BASE_URL}/category/technology`, { tags: { name: 'GET /category' } })
  check(res, { 'category: status 200': (r) => r.status === 200 })
  sleep(0.3)

  // Play page — force-dynamic. Every request: cookies() + supabase.auth.getUser() + Redis.
  // This is the primary stress target. Watch Vercel function invocation count here.
  res = http.get(`${BASE_URL}/play/${STATIC_SCENARIO_ID}`, { tags: { name: 'GET /play' } })
  check(res, { 'play: status 200': (r) => r.status === 200 })
  sleep(0.3)

  // Results page — force-dynamic. Same cost as play + Redis vote count read + JSON-LD.
  res = http.get(`${BASE_URL}/results/${STATIC_SCENARIO_ID}`, { tags: { name: 'GET /results' } })
  check(res, { 'results: status 200': (r) => r.status === 200 })
  sleep(0.5)
}

// ── Write scenario (optional) ─────────────────────────────────────────────────
// Only runs if ENABLE_WRITE_TESTS=true. Simulates anonymous vote submissions.
// No credentials. No session cookie. Behaves as a first-time anonymous visitor.
//
// Expected responses:
//   200 / 201  — vote accepted
//   409        — already voted (cookie dedup or Supabase dedup)
//   429        — rate limited (IP_LIMIT_SCENARIO: 5 per 10 min per dilemma)
//
// The test counts 429s via the custom 'vote_rate_limited' metric.
// If voteLimitedRate is high (>50%), the test is hammering the rate limiter —
// reduce rate or use different scenario IDs per VU.
export function writeTest() {
  const payload = JSON.stringify({ id: STATIC_SCENARIO_ID, option: 'a' })
  const headers = { 'Content-Type': 'application/json' }

  const res = http.post(`${BASE_URL}/api/vote`, payload, {
    headers,
    tags: { name: 'POST /api/vote' },
  })

  const isRateLimited = res.status === 429

  // A 429 is expected and safe — rate limiting is working. Not a test failure.
  check(res, {
    'vote: accepted, duplicate, or rate-limited': (r) =>
      r.status === 200 || r.status === 201 || r.status === 409 || r.status === 429,
  })

  voteLimitedRate.add(isRateLimited ? 1 : 0)

  // Back off a bit more if rate limited
  sleep(isRateLimited ? 2 : 0.5)
}
