/**
 * SplitVote — Spike Load Test (k6)
 *
 * Purpose: simulate a concentrated social traffic burst (TikTok/Instagram spike)
 * on the routes most likely to be hit after a viral post. All read-only — no
 * POST /api/vote, no write tests.
 *
 * Traffic weights (realistic social share pattern):
 *   45% /play/trolley      — direct play link from bio / story sticker
 *   25% /results/trolley   — results share card link
 *   15% /                  — organic home discovery
 *   10% /trending          — trending page from home nav
 *    5% /category/tech     — category browse
 *
 * Usage — default (10 VU × 60s):
 *   k6 run tests/load/splitvote-spike-load.js
 *   npm run load:spike
 *
 * CLI override — works because this file exports a `default` function:
 *   k6 run --vus 25 --duration 60s tests/load/splitvote-spike-load.js
 *   k6 run --vus 50 --duration 60s tests/load/splitvote-spike-load.js
 *
 * Against a Vercel Preview deployment:
 *   BASE_URL=https://my-preview.vercel.app ALLOW_PROD_LOAD_TEST=true \
 *     k6 run --vus 25 --duration 60s tests/load/splitvote-spike-load.js
 *
 * Against production (controlled window only — see LOAD_TEST_RESULTS.md):
 *   BASE_URL=https://splitvote.io ALLOW_PROD_LOAD_TEST=true \
 *     k6 run --vus 25 --duration 60s tests/load/splitvote-spike-load.js
 *
 * Do NOT use ENABLE_WRITE_TESTS — this script has no write path by design.
 * Do NOT run high VUs on production without a maintenance window.
 * Do NOT include credentials, auth tokens, or real user session cookies.
 */

import http from 'k6/http'
import { check, sleep } from 'k6'

// ── Environment ──────────────────────────────────────────────────────────────
const BASE_URL = (__ENV.BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const ALLOW_PROD = __ENV.ALLOW_PROD_LOAD_TEST === 'true'

// ── Production safety guard ───────────────────────────────────────────────────
// Evaluated at module init — aborts before any VU starts.
if (BASE_URL.includes('splitvote.io') && !ALLOW_PROD) {
  throw new Error(
    '\n[splitvote-spike-test] SAFETY GUARD TRIGGERED\n' +
    'BASE_URL contains splitvote.io but ALLOW_PROD_LOAD_TEST is not "true".\n' +
    'To run against production:\n' +
    '  ALLOW_PROD_LOAD_TEST=true BASE_URL=https://splitvote.io \\\n' +
    '    k6 run --vus 25 --duration 60s tests/load/splitvote-spike-load.js\n' +
    'Only do this in a controlled window with low VUs and short duration.\n' +
    'Never run unsupervised on production.\n'
  )
}

// ── Static scenario ───────────────────────────────────────────────────────────
// 'trolley' is always present in static scenarios — no auth required.
const STATIC_SCENARIO_ID = 'trolley'

// ── Default options ───────────────────────────────────────────────────────────
// Top-level vus/duration are used when no --vus/--duration CLI flags are passed.
// CLI flags override these values — this works because the file exports `default`.
export const options = {
  vus: 10,
  duration: '60s',
  thresholds: {
    // Global error rate — fail if > 5% of requests error
    http_req_failed: [{ threshold: 'rate<0.05', abortOnFail: false }],
    // Overall p95 across all weighted routes
    http_req_duration: [{ threshold: 'p(95)<3000', abortOnFail: false }],
    // Per-route thresholds for force-dynamic pages (server + Redis + Supabase on every hit)
    'http_req_duration{name:GET /play}':    [{ threshold: 'p(95)<3000', abortOnFail: false }],
    'http_req_duration{name:GET /results}': [{ threshold: 'p(95)<3000', abortOnFail: false }],
    // Overall check pass rate
    checks: [{ threshold: 'rate>0.95', abortOnFail: false }],
  },
}

// ── Weighted route table ──────────────────────────────────────────────────────
// Each entry: { weight (fraction), path, tag }.
// Weights must sum to 1.0.
const ROUTES = [
  { weight: 0.45, path: `/play/${STATIC_SCENARIO_ID}`,    tag: 'GET /play'     },
  { weight: 0.25, path: `/results/${STATIC_SCENARIO_ID}`, tag: 'GET /results'  },
  { weight: 0.15, path: '/',                               tag: 'GET /'         },
  { weight: 0.10, path: '/trending',                       tag: 'GET /trending' },
  { weight: 0.05, path: '/category/technology',            tag: 'GET /category' },
]

// Pre-compute cumulative probability thresholds once at module level.
const CUMULATIVE = ROUTES.reduce((acc, route, i) => {
  acc.push((acc[i - 1] ?? 0) + route.weight)
  return acc
}, [])

function pickRoute() {
  const r = Math.random()
  for (let i = 0; i < CUMULATIVE.length; i++) {
    if (r < CUMULATIVE[i]) return ROUTES[i]
  }
  // Fallback handles floating-point edge where r is exactly 1.0
  return ROUTES[ROUTES.length - 1]
}

// ── Default export ────────────────────────────────────────────────────────────
// Required for `k6 run --vus N --duration Xs` CLI override to work.
// k6 calls this function once per VU iteration throughout the test duration.
export default function () {
  const route = pickRoute()

  const res = http.get(`${BASE_URL}${route.path}`, {
    tags: { name: route.tag },
  })

  check(res, {
    [`${route.tag}: status 200`]: (r) => r.status === 200,
  })

  // Short random think-time: 200–500ms.
  // Models the moment between a user clicking a link and the next navigation —
  // keeps VU concurrency realistic without producing an artificial wall of requests.
  sleep(0.2 + Math.random() * 0.3)
}
