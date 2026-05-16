# Tests

Two layers:

- `tests/load/` — k6 smoke + spike against running server. See `LAUNCH_AUDIT.md → Load Test k6` and `LOAD_TEST_RESULTS.md`.
- `tests/unit/` — vitest unit tests on pure-function libs in `lib/`.

## Unit tests (vitest)

### Setup

Already wired (16 May 2026): `vitest` + `@vitest/coverage-v8` are in
`package.json` devDependencies; `test`, `test:watch`, `test:coverage` scripts
are defined. No additional setup required — `npm install` brings everything.

### Run

```bash
npm test                # one-shot, exits non-zero on failure
npm run test:watch      # interactive watch mode
npm run test:coverage   # coverage report under coverage/
```

Config: `vitest.config.ts` (root). Uses node environment, alias `@/` → repo root,
v8 coverage on `lib/**/*.ts`.

### What's covered today

- `tests/unit/safe-redirect.test.ts` — `lib/safe-redirect.ts` (8 cases: null/empty
  fallback, custom fallback, allowed paths, protocol-relative, absolute URLs,
  backslash traversal, /api/* block, false-positive on "api" substring).

### Priority additions (per audit 16 May 2026)

1. `lib/entitlements.ts` — admin/premium/free entitlement matrix
2. `lib/admin-guard.ts` — `requireAdmin` dual-check (ADMIN_EMAILS + DB role)
3. `lib/redis.ts` — `incrementVote` / `replaceVote` Lua atomicity (mock @upstash/redis)
4. `app/api/vote/route.ts` — cookie dedup + rate limit (integration; needs MSW or supertest)
5. `app/api/missions/complete/route.ts` — server-side XP award gate
6. `app/api/stripe/webhook/route.ts` — idempotency + lifecycle (already covered by Stripe CLI runbook — low priority here)
7. `app/api/events/track/route.ts` — allowlist + 2 KB cap
8. `lib/content-quality-gates.ts` — at least one positive + one negative gate case

Add tests as `tests/unit/<lib-name>.test.ts`. Keep them pure-function — for
anything that requires Redis/Supabase, mock the client at the import boundary.
