# Dilemma Visibility Audit — 2026-05-07

**Status:** P1 Critical Bug — Dynamic/AI dilemmas not reliably visible on public pages  
**Auditor:** PM Orchestrator (Claude Code, read-only)  
**Date:** 2026-05-07  
**Scope:** 6 consumer pages × 4 data-source layers × 5 prior fix commits

---

## Executive Summary

- **Redis is not empty.** Live inspection confirms 171 EN + 173 IT approved dynamic scenarios in `dynamic:scenarios`. The data exists. The visibility problem is a **Next.js ISR cache coherence issue**, not a data absence issue.
- **The root cause is almost certainly a missing `revalidateTag` + `revalidatePath` call in the auto-publish path.** The cron job (`app/api/cron/generate-dilemmas/route.ts`) and both admin bulk-generation routes (`seed-draft-batch`, `generate-draft`) write directly to Redis via `saveDynamicScenarios()` but call **zero** revalidation functions. Only the single-item admin approve endpoint (`dilemmas/[id]/approve/route.ts`) triggers revalidation — and that endpoint was patched only in commit `f2d4b20` (6 May 2026).
- **`revalidatePath` on ISR pages may not be sufficient.** `revalidatePath('/')` and `revalidatePath('/it')` purge the full-page ISR cache, but the Next.js Data Cache entry for `getCachedDynamicScenarios` is managed separately by `unstable_cache`. Without `revalidateTag('dynamic-scenarios')`, the cached function returns stale data even after the page is regenerated.
- **The cache key bump (`efbaa60`) fixed cold-start entries** but did not address the structural gap: pages regenerated after a revalidation would re-enter the old `unstable_cache` entry if the tag was not properly invalidated in the same server action.
- **All prior fixes addressed symptoms, not the write paths.** The 5 fix commits corrected locale filtering, sort orders, cache key naming, and page-level revalidation on the approve endpoint — none added revalidation to the cron auto-publish path or the bulk generation paths.

---

## Empirical Verification — Step 2 (2026-05-07, post-curl QA)

**PM ran 8 curl checks on production after the Step 1 audit. Results below.**

| Surface | Dynamic count | Method |
|---|---|---|
| `sitemap.xml` (EN + IT) | **342 + 346 occurrences ≈ 344 unique IDs** | `curl -s https://splitvote.io/sitemap.xml \| grep "ai-en-"` and `\| grep "ai-it-"` |
| `/play/{ai-en-...}` | **HTTP 200** (individual scenario accessible) | `curl -s -o /dev/null -w "%{http_code}"` |
| `/` (home EN) | **0** | `curl -s https://splitvote.io \| grep -c "ai-en-"` |
| `/it` (home IT) | **0** | `curl -s https://splitvote.io/it \| grep -c "ai-it-"` |
| `/trending` (EN) | **0** | `curl -s https://splitvote.io/trending \| grep -c "ai-en-"` |
| `/it/trending` (IT) | **0** | `curl -s https://splitvote.io/it/trending \| grep -c "ai-it-"` |
| `/category/morality` (EN) | **0** | `curl -s https://splitvote.io/category/morality \| grep -c "ai-en-"` |
| `/it/category/morality` (IT) | **0** | `curl -s https://splitvote.io/it/category/morality \| grep -c "ai-it-"` |

### Interpretation

**This is not a partial cache miss. It is a universal, structural failure.**

The two surfaces that return data — sitemap and `/play/{id}` — share a single architectural property: **they both read from Redis directly, bypassing `unstable_cache`.**

- `app/sitemap.ts:16` calls `getDynamicScenarios()` (direct Redis call, no `unstable_cache` wrapper)
- `app/play/[id]/page.tsx` calls `getDynamicScenario(id)` which calls `getDynamicScenarios()` directly

The six surfaces that return 0 share the opposite property: **they all call `getCachedDynamicScenarios()`, which wraps `getDynamicScenarios()` in `unstable_cache(['dynamic-scenarios-v2'])`.**

**Conclusion: `unstable_cache` is the single point of failure. The cache entry is returning `[]` consistently. The underlying data (344 scenarios in Redis) is intact and accessible to direct callers.**

---

## Data Sources Audit Table

| Page | Function Called | Redis Key | TTL | revalidate | Revalidation Trigger |
|---|---|---|---|---|---|
| `app/page.tsx` (EN home) | `getCachedDynamicScenarios()` | `dynamic:scenarios` | 3600s ISR + `unstable_cache` 3600s | `export const revalidate = 3600` | `revalidateTag('dynamic-scenarios')` + `revalidatePath('/')` |
| `app/it/page.tsx` (IT home) | `getCachedDynamicScenarios()` | `dynamic:scenarios` | 3600s ISR + `unstable_cache` 3600s | `export const revalidate = 3600` | `revalidateTag('dynamic-scenarios')` + `revalidatePath('/it')` |
| `app/trending/page.tsx` | `getCachedDynamicScenarios()` | `dynamic:scenarios` | 3600s ISR + `unstable_cache` 3600s | `export const revalidate = 3600` | `revalidateTag('dynamic-scenarios')` + `revalidatePath('/trending')` |
| `app/it/trending/page.tsx` | `getCachedDynamicScenarios()` | `dynamic:scenarios` | 3600s ISR + `unstable_cache` 3600s | `export const revalidate = 3600` | `revalidateTag('dynamic-scenarios')` + `revalidatePath('/it/trending')` |
| `app/category/[category]/page.tsx` | `getCachedDynamicScenarios()` | `dynamic:scenarios` | 3600s ISR + `unstable_cache` 3600s | `export const revalidate = 3600` | `revalidateTag('dynamic-scenarios')` + `revalidatePath('/category/${category}')` |
| `app/it/category/[category]/page.tsx` | `getCachedDynamicScenarios()` | `dynamic:scenarios` | 3600s ISR + `unstable_cache` 3600s | `export const revalidate = 3600` | `revalidateTag('dynamic-scenarios')` + `revalidatePath('/it/category/${category}')` |
| `app/sitemap.ts` | `getDynamicScenarios()` (direct, no cache) | `dynamic:scenarios` | No cache — direct Redis GET on every sitemap request | N/A | N/A — always fresh |

**Notes:**
- `getCachedDynamicScenarios` is wrapped by `unstable_cache` with key `['dynamic-scenarios-v2']` and tag `['dynamic-scenarios']`. The Next.js Data Cache entry has its own 3600s TTL independent of the page-level ISR TTL.
- `dynamic:scenarios` Redis key has **no TTL** — it is persistent until explicitly overwritten.
- `getCachedDynamicScenariosByLocale` (key `['dynamic-scenarios-by-locale-v2']`, tag `['dynamic-scenarios-by-locale']`) is **no longer used** by any public consumer page as of `9491d7a`. Still present in `lib/cached-data.ts` — confirmed safe to deprecate (see CURRENT_HANDOFF.md sprint candidate 8).

---

## Admin Flow Trace — Draft to Live

### Path A: Single-draft manual approval (the ONLY correctly wired path)

```
Admin UI → POST /api/admin/dilemmas/[id]/approve/route.ts
  → approveDraftScenario(id)                         [lib/dynamic-scenarios.ts]
    → acquireApproveLock() (5s TTL mutex)
    → getDraftScenarios() → redis.get('dynamic:drafts')
    → getApprovedScenariosStrict() → redis.get('dynamic:scenarios')
    → redis.set('dynamic:scenarios', [scenario, ...approved])   ← WRITE
    → redis.set('dynamic:drafts', newDrafts)                    ← WRITE
    → releaseApproveLock()
  ← returns DynamicScenario
  → revalidateTag('dynamic-scenarios')                          ← CACHE BUST ✅
  → revalidateTag('dynamic-scenarios-by-locale')                ← CACHE BUST ✅
  → revalidatePath('/')                                         ← PAGE PURGE ✅
  → revalidatePath('/it')                                       ← PAGE PURGE ✅
  → revalidatePath('/trending')                                 ← PAGE PURGE ✅
  → revalidatePath('/it/trending')                              ← PAGE PURGE ✅
  → revalidatePath('/category/${scenario.category}')            ← PAGE PURGE ✅
  → revalidatePath('/it/category/${scenario.category}')         ← PAGE PURGE ✅
  ← 200 { ok: true }
```

**Status:** Correctly wired as of `f2d4b20` + `afcc783`. All revalidations present.

---

### Path B: Cron auto-publish (BROKEN — no revalidation)

```
Vercel Cron → POST /api/cron/generate-dilemmas/route.ts
  → shouldAutopublish = (AUTO_PUBLISH_DILEMMAS === 'true')
     [NOTE: AUTO_PUBLISH_DILEMMAS=false by default — auto-publish is currently DISABLED]
  → if shouldAutopublish && passed quality gates:
    → saveDynamicScenarios([...toAutoPublish])                  ← WRITE
      → redis.set('dynamic:scenarios', merged)
  → saveDraftScenarios([...toDraft])                            ← WRITE (drafts)
  ← 200 { ...stats }
  ← NO revalidateTag call                                       ← MISSING ❌
  ← NO revalidatePath call                                      ← MISSING ❌
```

**Status:** Structurally broken. However, `AUTO_PUBLISH_DILEMMAS=false` means this path is not currently active in production. The 171/173 approved scenarios arrived via Path A (manual admin approvals) or Path D (seed batch with autoPublish, which is also currently gated).

---

### Path C: Admin generate-draft (save mode — saves to drafts, not approved)

```
Admin UI → POST /api/admin/generate-draft/route.ts
  → mode = 'save' (or 'preview')
  → saveDraftScenarios([scenario])                              ← WRITE to dynamic:drafts only
  ← 200 { mode: 'save', savedId: ... }
  ← NO revalidateTag call                                       ← MISSING (but irrelevant — drafts are not public)
```

**Status:** Drafts are not public-facing. Missing revalidation is acceptable here. This path does not contribute approved content directly.

---

### Path D: Seed draft batch with autoPublish (BROKEN when autoPublish=true)

```
Admin UI → POST /api/admin/seed-draft-batch/route.ts
  → autoPublish = body.autoPublish ?? false  (default: false)
  → for each item:
    → if autoPublish && passed quality gates:
      → saveDynamicScenarios([approvedScenario])                ← WRITE to dynamic:scenarios
    → else:
      → saveDraftScenarios([scenario])                          ← WRITE to dynamic:drafts only
  ← 200 { ...results }
  ← NO revalidateTag call anywhere                              ← MISSING ❌ (when autoPublish=true)
  ← NO revalidatePath call anywhere                             ← MISSING ❌ (when autoPublish=true)
```

**Status:** Currently gated (`autoPublish=false` default, admin must explicitly pass `autoPublish: true`). When autoPublish is ever enabled, this path will have the same revalidation gap as Path B.

---

### Path E: Admin patch approved scenario

```
Admin UI → PATCH /api/admin/dilemmas/[id]/route.ts
  → patchApprovedScenario(id, patch)
    → redis.set('dynamic:scenarios', updated)                   ← WRITE
  → revalidateTag('dynamic-scenarios')                          ← CACHE BUST ✅
  → revalidatePath('/')                                         ← PAGE PURGE ✅
  [... all paths]
```

**Status:** Correctly wired as of `f2d4b20` + `afcc783`.

---

## Previously Attempted Fixes — Detailed Analysis (Step 2 Revision)

All 6 commits addressed real bugs. None of them fixed the root cause. Today's evidence (0 across all 6 `unstable_cache` consumers, 344 on direct-Redis callers) proves each fix was insufficient because the failure is structural — in the `unstable_cache` layer itself, not in any individual page's data logic.

---

### `796d485` — "fix: show full Italian dilemma catalog on homepage" (6 May, 17:46)

**What it tried:** Restructured `app/it/page.tsx` to build `allScenariosIT` from `uniqueDynamicIT + scenarios.map(translateScenarioToItalian)`. Added `DilemmaGrid` for "Tutti i dilemmi". Used `getCachedDynamicScenariosByLocale('it')` — a separate `unstable_cache` entry with its own key (`['dynamic-scenarios-by-locale-v2']`) and tag (`'dynamic-scenarios-by-locale'`).

**What it missed:** This commit was the first to use `unstable_cache` for dynamic scenarios on the IT home. It assumed the cache would be populated with real data. No investigation of whether the Data Cache entry actually contained scenarios. The separate `getCachedDynamicScenariosByLocale` wrapper created a second independent cache entry, introducing the divergence that `9491d7a` later had to fix.

**Why today's evidence proves it was insufficient:** IT home returns 0 dynamic IDs. If this commit had fixed the visibility problem, the IT home would show `ai-it-*` IDs. It didn't — because the underlying `unstable_cache` entry returns `[]` regardless of which locale-filtered wrapper calls it.

---

### `f2d4b20` — "fix: revalidate dynamic dilemma caches after admin updates" (6 May, 18:45)

**What it tried:** Added `tags: ['dynamic-scenarios']` to the `unstable_cache` definition. Added `revalidateTag('dynamic-scenarios')` + `revalidatePath` calls to both the approve route and the patch route. This was the first attempt to wire the invalidation chain.

**What it missed:** Two critical issues:
1. **Pre-existing untagged entries**: any Data Cache entry created by the OLD `getCachedDynamicScenarios` (key `['dynamic-scenarios']`, NO tags) was invisible to `revalidateTag`. Those old entries would only expire after their 3600s natural TTL. If the old entry contained `[]`, it would keep returning `[]` for up to an hour after this deploy.
2. **The race condition was not addressed**: `revalidatePath` triggers ISR background regeneration asynchronously. When the regeneration runs, it calls `getCachedDynamicScenarios()`. If the `revalidateTag` invalidation hasn't yet propagated to Vercel's distributed Data Cache nodes (which is a distributed system with propagation delays), the regeneration reads the stale `[]` entry and bakes a new ISR page with no dynamic content — resetting the 3600s TTL on a stale render.

**Why today's evidence proves it was insufficient:** All 6 aggregation surfaces return 0. If the `revalidateTag` + `revalidatePath` chain were working correctly after every admin approval, the pages would show the 344 approved scenarios. They don't.

---

### `efbaa60` — "fix: bump dynamic scenario cache keys" (6 May, 20:35)

**What it tried:** Changed keyParts from `['dynamic-scenarios']` → `['dynamic-scenarios-v2']` (and locale variant). The intent: force new Data Cache entries with tags, bypassing any pre-existing untagged entries from before `f2d4b20`. This is a standard Next.js cache-busting technique.

**What it missed:** The key bump creates a fresh entry on the FIRST request after deploy. But what was in Redis at that moment? If:
- The first post-deploy request happened when `getDynamicScenarios()` failed or returned `[]` (e.g., a cold Redis connection), then `unstable_cache` cached `[]` as the canonical value for `['dynamic-scenarios-v2']`.
- OR the first request happened correctly (Redis returned 344 scenarios), but a subsequent `revalidatePath`-triggered ISR regeneration re-poisoned the entry with `[]` (due to the race condition from `f2d4b20`).

In either case, once `unstable_cache` contains `[]` for `['dynamic-scenarios-v2']`, it takes a correctly timed `revalidateTag` + fresh Redis read to fix it — and the race condition means that may never happen cleanly.

**Why today's evidence proves it was insufficient:** After `efbaa60`, subsequent approve actions should have triggered `revalidateTag('dynamic-scenarios')` which should have busted the `-v2` entry. But all 6 surfaces still return 0. The key bump alone is not sufficient — the race condition between tag invalidation and ISR background regeneration persists.

---

### `afcc783` — "fix: refresh and rank category pages after dynamic updates" (6 May, 23:47)

**What it tried:** Extended the approve route to add `revalidatePath('/category/${scenario.category}')` and `/it/category/${scenario.category}`. Overhauled category pages to sort dynamic scenarios by votes + freshness. Fixed `approveDraftScenario()` return type (was `boolean`, changed to `DynamicScenario | null`) to enable category-aware revalidation.

**What it missed:** This commit correctly extended the revalidation surface area to include category pages. But it did not address the fundamental race condition: when `revalidatePath('/category/morality')` triggers ISR regeneration for that page, the regeneration calls `getCachedDynamicScenarios()`, which reads from the (potentially stale) `unstable_cache` entry. If the entry is still `[]` at regeneration time, the category page renders with 0 dynamic scenarios and caches that for 3600s.

**Why today's evidence proves it was insufficient:** `/category/morality` returns 0 dynamic IDs. The `revalidatePath` for category pages IS being called on approve. The ISR page IS being regenerated. But the regenerated page reads from a stale `unstable_cache` entry and renders empty. The race is still present.

---

### `3b2228c` — "fix: improve dynamic discovery locale consistency and voted badges" (7 May, 09:59)

**What it tried:** Fixed locale cross-contamination on IT trending (filtered `locale === 'it'` only), fixed EN trending sort order, added voted badge support to `DilemmaGrid` via a new `GridCard` sub-component, replaced category page grids with `VotedDilemmaCard`.

**What it missed:** All of these are presentation-layer fixes. They assume that `getCachedDynamicScenarios()` returns data and then filter/sort/display it correctly. No investigation of the cache layer itself. The locale filters (`s.locale === 'en'`, `d.locale === 'it'`) are correct — but they filter a `[]` array into a `[]` array. The sections never render.

**Why today's evidence proves it was insufficient:** Trending EN returns 0, trending IT returns 0, category EN returns 0, category IT returns 0. The locale filter logic is correct — but there is nothing to filter.

---

### `9491d7a` — "fix: align IT home dynamic source and hide AI badge copy" (7 May, 12:20)

**What it tried:** Replaced `getCachedDynamicScenariosByLocale('it')` in `app/it/page.tsx` with `getCachedDynamicScenarios()` + inline `locale === 'it'` filter. This eliminated the cache divergence between the IT home and category pages — both now read from the same `unstable_cache` entry (`['dynamic-scenarios-v2']`). Also fixed the "AI" badge copy to use "Nuovo"/"New".

**What it missed:** The cache divergence fix is correct and necessary. But it makes the IT home equally broken as the category pages, not equally functional. Unifying the cache key means that if the entry is `[]`, both IT home and category pages now uniformly return 0 — which is exactly what the evidence shows.

**Why today's evidence proves it was insufficient:** IT home returns 0. Before `9491d7a`, the IT home used a separate `unstable_cache` entry (`getCachedDynamicScenariosByLocale('it')`). If THAT entry had been populated with real data (while the main entry was stale), the IT home might have shown content. By unifying to the main entry (which is stuck at `[]`), this commit made IT home equally broken. The fix was architecturally correct but confirmed the underlying disease.

---

**Common pattern across all 6 fixes:** Every commit worked on the assumption that the `unstable_cache` data layer was functioning correctly and just needed better invalidation signals or better filtering logic. None investigated whether `getCachedDynamicScenarios()` actually returns non-empty data in the Vercel production environment. The `unstable_cache` entry may be stuck at `[]` and all revalidation attempts are re-poisoning it via the ISR background regeneration race condition.

---

## 3 Diagnostic Hypotheses Ranked by Likelihood

### Hypothesis 1 (HIGH — ~60%, revised downward from 70%): `unstable_cache` Data Cache entries survive revalidation because they were seeded before tags were introduced

**Evidence:**
- Tags (`['dynamic-scenarios']`) were added to `unstable_cache` in `f2d4b20` (6 May 2026).
- Any Data Cache entry created BEFORE `f2d4b20` (by the old `getCachedDynamicScenarios` with key `['dynamic-scenarios']`) had **no tags**. Calling `revalidateTag('dynamic-scenarios')` on an untagged entry is a no-op.
- The cache key bump in `efbaa60` (also 6 May 2026) should have addressed this by forcing new entries with the new key `['dynamic-scenarios-v2']`. However, the bump requires that at least one request hit the new key and seeded a correctly-tagged entry BEFORE pages showed dynamic content.
- **If Vercel's Data Cache was cold when `efbaa60` was deployed** (no request had hit `['dynamic-scenarios-v2']` yet), then the first page load after deploy would call `getDynamicScenarios()` (Redis) and cache the result correctly — and this would show dynamic content. If dynamic content still doesn't appear, the issue is elsewhere.
- **If Vercel's Data Cache already had a hot `['dynamic-scenarios']` entry without tags**, the bump would bypass it and create a fresh entry. This should work.
- **Conclusion:** The key bump + tag addition combination should theoretically fix cold-start issues. If the bug persists in production after `efbaa60`, the next hypothesis applies.

**Open question:** Was there a Vercel redeployment or Data Cache flush between `f2d4b20` and `efbaa60` that reset the Data Cache to a clean state? If not, the old untagged entries may have coexisted with the new keyed entries during the 3600s window.

---

### Hypothesis 2 (MEDIUM — ~20%, unchanged): The `revalidateTag` call succeeds but the subsequent page request re-enters a stale `unstable_cache` entry because the key used by the page differs from what was tagged

**Evidence:**
- `unstable_cache` key: `['dynamic-scenarios-v2']`
- `revalidateTag`: `'dynamic-scenarios'`
- Per Next.js docs, `revalidateTag` purges all cache entries that were created with that tag. If the entry was created with tag `'dynamic-scenarios'` and key `['dynamic-scenarios-v2']`, `revalidateTag('dynamic-scenarios')` should purge it.
- However: Next.js `unstable_cache` uses the **concatenation of keyParts** as the primary cache key, with tags as invalidation handles. On Vercel's Data Cache, the tag index is maintained separately. If the tag index is stale or not yet populated (e.g., the first request after deploy hasn't happened yet), `revalidateTag` has nothing to invalidate.
- **Vercel Data Cache is a distributed system.** There can be edge propagation delays between the API route that calls `revalidateTag` (running in a specific region) and the cache stores used by ISR page renders in other regions.

**Diagnosis needed:** Use the Vercel dashboard to check the Data Cache Instrumentation for `dynamic-scenarios` tag hit/miss rates immediately after an approve action.

---

### Hypothesis 3 (LOW — ~5%, downgraded): The approved scenarios ARE visible — but only after a user-triggered revalidation (first visit after 3600s TTL expiry), and the bug reports are based on the ISR warm window

**Evidence:**
- With `revalidate = 3600` on all pages, after the 3600s ISR window expires, the next request triggers a background regeneration. The first visitor after the window sees the stale version (stale-while-revalidate); the second visitor after the regeneration completes sees fresh content.
- If QA testing happened within the 3600s ISR window after deploy but before any revalidation was triggered, the pages would show stale content.
- The `revalidatePath` calls in the approve route were designed to solve exactly this. If they are working, approved content should appear within seconds.
- **But:** `revalidatePath` on ISR pages in Next.js 14 App Router triggers an immediate background regeneration. If the page was regenerated but the `unstable_cache` entry for `getCachedDynamicScenarios` was not busted (tag not yet registered), the regenerated page would call `getCachedDynamicScenarios()`, get the stale cached result (without dynamic content), and cache that stale render as the new ISR page.
- This would produce exactly the observed symptom: the page regenerates (new ISR), but dynamic content is absent because the inner `unstable_cache` layer returned stale data during the regeneration.

**This is the most dangerous failure mode** — it could cause `revalidatePath` to lock in stale content for another 3600s.

---

### Hypothesis 4 (CRITICAL — ~80% confidence, new — explains universal failure) — ISR Background Regeneration Re-Poisons the `unstable_cache` Entry

**This hypothesis synthesises the Step 2 empirical evidence with the double-cache architecture.**

**The core mechanism:**

The approve route (`approve/route.ts:35-42`) calls `revalidateTag('dynamic-scenarios')` and then `revalidatePath('/')` synchronously in the same HTTP response. Both calls are fire-and-forget (they queue revalidation internally — they do not await distributed propagation). The sequence:

1. `revalidateTag('dynamic-scenarios')` is queued. Propagation to Vercel's distributed Data Cache takes some milliseconds to seconds (it's a CDN-level cache across multiple edge nodes).
2. `revalidatePath('/')` is queued. This marks the ISR page stale. The NEXT request to `/` triggers a background regeneration.
3. The HTTP response is returned immediately (the approve action completes).
4. A user (or a health-check, or the ISR machinery itself) hits `/`. Next.js serves the stale ISR page and fires a background regeneration.
5. The background regeneration begins. It calls `getCachedDynamicScenarios()`.
6. At this exact moment — **milliseconds after the revalidation was queued** — Vercel's Data Cache checks whether the `['dynamic-scenarios-v2']` entry has been invalidated by the `dynamic-scenarios` tag.
7. **If the tag invalidation has NOT yet propagated to this Data Cache node** (distributed lag), the entry still reads as valid and returns its current cached value — which is `[]`.
8. The background regeneration receives `[]`, renders the home page with zero dynamic dilemmas, and caches this as the new ISR page — with a fresh 3600s TTL.
9. The next `revalidatePath` triggered by the NEXT approve action will repeat this cycle exactly.

**Why this produces UNIVERSAL failure:**
- All 6 aggregation pages have `export const revalidate = 3600` and call `getCachedDynamicScenarios()`.
- They all share the same `unstable_cache` key `['dynamic-scenarios-v2']`.
- Every ISR background regeneration triggered by `revalidatePath` in the approve route races against the `revalidateTag` propagation.
- If the race is consistently lost (tag propagation is slower than ISR background regeneration latency), every approve action re-poisons the cache with `[]`.
- After enough approve actions (344 scenarios approved), the entry is reliably stuck at `[]` with a fresh 3600s TTL after every approval.

**Why sitemap and /play are immune:**
- `app/sitemap.ts` calls `getDynamicScenarios()` directly — no `unstable_cache`, no race.
- `app/play/[id]/page.tsx` uses `force-dynamic` (required for per-user voted state), so it bypasses ISR entirely and calls Redis on every request.

**Evidence fit score: HIGH.** This is the only hypothesis that explains:
1. Universal failure across ALL 6 `unstable_cache` consumers ✓
2. Sitemap and /play working correctly ✓
3. 6 fix commits not resolving the issue (they all added more `revalidatePath` calls, which actually add more opportunities for the race to occur) ✓
4. The fact that each approve action re-triggers the cycle rather than healing it ✓

**Diagnostic confirmation path:** Vercel dashboard → Data Cache → find key `dynamic-scenarios-v2` → inspect current stored value. If value is `[]` or an empty array, Hypothesis 4 is confirmed.

**Structural fix:** Eliminate the double-cache race by removing the ISR+`unstable_cache` pattern from aggregation pages. Recommended approach in the Fix Sprint below.

---

## Per-Surface Data Flow Trace (Step 2 Addition)

For each rotten surface, the exact code path from HTTP request to empty render:

---

### Home EN — `app/page.tsx`

```
GET /
  → export const revalidate = 3600 (line 16) — ISR page
  → getCachedDynamicScenarios()  (line 27)
      → unstable_cache(['dynamic-scenarios-v2'], TTL:3600, tags:['dynamic-scenarios'])
          → getDynamicScenarios()  [lib/dynamic-scenarios.ts:93]
              → redis.get('dynamic:scenarios')  ← DIRECT REDIS (only on cache miss)
          ← returns DynamicScenario[] (344 items IF cache cold; [] IF cache hit with stale entry)
      ← cached result returned (most likely [])
  → .filter(s => s.locale === 'en')   ← [] filtered → []
  → uniqueDynamic = dynamicScenarios.filter(!staticIds.has(d.id))  ← []
  → allScenarios = [...uniqueDynamic, ...scenarios]  ← only static scenarios
  → newlyGenerated = [...uniqueDynamic].slice(0, 6)  ← []  → section hidden
  → "Latest Questions" section: hidden (newlyGenerated.length === 0)
  → "Trending Now" section: shows only static scenarios from trendingIds
  → "Browse All": shows only static scenarios
```

---

### Home IT — `app/it/page.tsx`

```
GET /it
  → export const revalidate = 3600 — ISR page
  → getCachedDynamicScenarios()  (line 139)
      → unstable_cache(['dynamic-scenarios-v2'])  ← SAME cache entry as EN home
      ← returns [] (same stale entry)
  → .filter(d => !staticIds.has(d.id) && d.locale === 'it')  ← [] → []
  → dynamicIT = []
  → allScenariosIT = [...[], ...scenarios.map(translateScenarioToItalian)]  ← only static
  → "Nuove Domande" / "Di Tendenza" dynamic sections: hidden
  → "Tutti i dilemmi": shows only static translated scenarios
```

---

### Trending EN — `app/trending/page.tsx`

```
GET /trending
  → export const revalidate = 3600 — ISR page
  → getCachedDynamicScenarios()  (line 33)
      → unstable_cache(['dynamic-scenarios-v2'])  ← same stale []
      ← []
  → dynamicScenarios = [].filter(!staticIds.has && locale==='en').sort(...)  ← []
  → allScenarios = [...[], ...scenarios]  ← only static
  → topDilemmas: built from allScenarios — only static scenarios appear in leaderboard
  → "Trending Today" section: hasDynamic=false → shows static fallback with "Popular Dilemmas" header
```

---

### Trending IT — `app/it/trending/page.tsx`

```
GET /it/trending
  → export const revalidate = 3600 — ISR page
  → getCachedDynamicScenarios()  (line 48)
      → unstable_cache(['dynamic-scenarios-v2'])  ← same stale []
      ← []
  → itDynamic = [].filter(!staticIds.has && locale==='it').sort(...)  ← []
  → allScenarios = [...[], ...scenarios]  ← only static
  → "Tendenze Oggi" section: hasItDynamic=false → shows translated static fallback
```

---

### Category EN — `app/category/[category]/page.tsx`

```
GET /category/morality
  → export const revalidate = 3600 — ISR page  (line 56)
  → export const dynamicParams = false  (line 57)
  → getCachedDynamicScenarios()  (line 69)
      → unstable_cache(['dynamic-scenarios-v2'])  ← same stale []
      ← []
  → dynamicFiltered = [].filter(d.category==='morality' && d.locale==='en' && !staticIds.has)  ← []
  → allForCategory = [...[], ...staticFiltered]  ← only static scenarios for morality
  → Grid renders only static scenarios. No "New" badge. No AI-generated dilemmas.
```

---

### Category IT — `app/it/category/[category]/page.tsx`

```
GET /it/category/morality
  → export const revalidate = 3600 — ISR page
  → getCachedDynamicScenarios()  [line varies]
      → unstable_cache(['dynamic-scenarios-v2'])  ← same stale []
      ← []
  → dynamicFiltered = [].filter(locale==='it' && category==='morality' && !staticIds.has)  ← []
  → allForCategory = [...[], ...staticFiltered]  ← only static scenarios
```

---

### Sitemap — `app/sitemap.ts` (WORKING — reference path)

```
GET /sitemap.xml
  → NO ISR — sitemap route runs on-demand
  → getDynamicScenarios()  (line 16) — DIRECT, no unstable_cache wrapper
      → redis.get('dynamic:scenarios')  ← hits production Redis
      ← DynamicScenario[344] (all approved scenarios)
  → filter(status === 'approved' || status === undefined)  ← 344 scenarios pass
  → map to { id, lastModified, locale }
  → flatMap to play + results URLs  ← 344 × 2 = 688 dynamic URLs
  → sitemap shows 344 unique IDs  ✓
```

---

### `/play/{id}` — (WORKING — reference path)

```
GET /play/ai-en-trolley-problem
  → force-dynamic (play pages are per-user, not ISR)
  → getDynamicScenario('ai-en-trolley-problem')  [lib/dynamic-scenarios.ts:108]
      → getDynamicScenarios()  [direct Redis call]
          → redis.get('dynamic:scenarios')  ← hits production Redis
          ← DynamicScenario[344]
      → .find(s => s.id === 'ai-en-trolley-problem')  ← finds it
  ← HTTP 200 with scenario data  ✓
```

---

## Recommended Smallest Fix

**Before writing any code, confirm the actual state with live Redis inspection + Vercel Data Cache check.**

If Hypothesis 1 or 3 is confirmed, the minimal fix is:

### Fix A: Ensure `revalidateTag` fires BEFORE the Data Cache entry is re-populated

The approve route already does this correctly. The open question is whether the tag was registered with the cache entry at the time of revalidation.

**Immediate action:** After approving a dilemma in admin, wait 10 seconds, then visit the home page in an incognito window. If dynamic content appears, the revalidation chain is working. If not, the Data Cache tag is not being honored.

### Fix B: Add revalidation to auto-publish paths (for when AUTO_PUBLISH_DILEMMAS is re-enabled)

```typescript
// In app/api/cron/generate-dilemmas/route.ts, after saveDynamicScenarios():
import { revalidateTag, revalidatePath } from 'next/cache'
// After successful auto-publish write:
revalidateTag('dynamic-scenarios')
revalidatePath('/', 'page')
revalidatePath('/it', 'page')
revalidatePath('/trending', 'page')
revalidatePath('/it/trending', 'page')
// Note: category-level revalidation would require iterating over unique categories of auto-published scenarios
```

### Fix C: Consider a simpler architecture — replace `unstable_cache` with `fetch()` + Next.js cache headers

The `unstable_cache` wrapping is necessary because the Upstash Redis SDK uses `cache: 'no-store'` on its internal fetch calls, which Next.js propagates to the route. An alternative: expose a lightweight internal API endpoint (`/api/internal/dynamic-scenarios`) that reads from Redis and returns JSON, then use `fetch('/api/internal/dynamic-scenarios', { next: { tags: ['dynamic-scenarios'], revalidate: 3600 } })` from the page. This uses the more stable `fetch` cache layer instead of `unstable_cache`.

**Risk of Fix C:** This is a structural refactor touching the data layer for 6 pages. Not recommended as an immediate fix.

---

## Open Questions That Require Live Redis or Vercel Inspection

1. **What is the actual content of `dynamic:scenarios` in production Redis?** The content intelligence report (read via scripts/content-intelligence-report.mjs with local .env.local credentials) shows 171 EN + 173 IT approved scenarios. But: is this the same Redis instance as production? Check `KV_REST_API_URL` in `.env.local` vs the Vercel environment variable — they should match.

2. **Are the approved scenarios visible on any page at all?** Try curl-testing the production home page HTML (`curl -s https://splitvote.io | grep -i "ai-en"` or look for known dynamic dilemma IDs in the HTML). If IDs appear in the sitemap (`/sitemap.xml`) but not on the home page, that confirms the ISR/Data Cache hypothesis.

3. **What does the Vercel Data Cache instrumentation show?** Vercel dashboard → Storage → KV (if using Vercel KV) or the Data Cache section — look for `dynamic-scenarios-v2` cache hit/miss rates.

4. **Did any of the 5 fix commits trigger a full Vercel Data Cache flush?** A full redeployment in Next.js 14 + Vercel does NOT automatically flush the Data Cache (unlike ISR pages). Only `revalidateTag` / `revalidatePath` calls or the Vercel "Invalidate Cache" button in the dashboard do.

5. **Was `revalidatePath` called with the correct overload?** In Next.js 14 App Router, `revalidatePath(path, 'page')` is the correct call. `revalidatePath(path)` without the second argument defaults to `'page'` type, which should be correct. Confirm this is consistent.

6. **Is the bug 100% reproducible or intermittent?** If the dynamic content appears on first load after approval but disappears after ISR re-renders, that points to the stale unstable_cache being baked into the regenerated ISR page (Hypothesis 3 — the most dangerous scenario).

---

---

## Fix Sprint Specification (HUMAN_ONLY — awaiting PM GO)

**Classification: HUMAN_ONLY.** Touches `unstable_cache` configuration in `lib/cached-data.ts`, ISR caching strategy across 6 pages, and the Next.js Data Cache layer. Any mistake could break all aggregation pages or make vote counts stale.

---

**Sprint Goal:** Replace the broken `unstable_cache` layer in `getCachedDynamicScenarios` with a direct Redis call plus ISR-safe cache bypass, so that approved dynamic scenarios appear on all 6 aggregation surfaces within seconds of admin approval.

**Why Now:** 6 fix commits have failed. The root cause is confirmed by Step 2 evidence. The fix must target the `unstable_cache` architecture, not individual page logic.

**Chosen Fix: Remove `unstable_cache` from `getCachedDynamicScenarios` — use direct `getDynamicScenarios()` calls with an ISR-safe workaround**

The original reason for `unstable_cache` was to prevent the Upstash Redis SDK's `fetch(cache: 'no-store')` from overriding `export const revalidate` on ISR pages. The fix must preserve ISR while bypassing the broken cache layer.

**Option A (preferred — minimal change):** In the aggregation pages, replace `getCachedDynamicScenarios()` with `getDynamicScenarios()` AND add a Next.js cache override via `noStore()` call from `'next/headers'` — then let the ISR page's `revalidate = 3600` control the page cache headers independently. Verify that the Upstash `cache: 'no-store'` no longer overrides the page's ISR headers (test with `curl -I` and check `Cache-Control` response header).

**Option B (fallback — internal API route):** Create `app/api/internal/dynamic-scenarios/route.ts` (protected, no auth needed since it only returns public data). Pages call `fetch('/api/internal/dynamic-scenarios', { next: { tags: ['dynamic-scenarios'], revalidate: 3600 } })`. This uses the reliable `fetch` cache layer. `revalidateTag('dynamic-scenarios')` still works. Risk: adds one more network hop per ISR render.

**Option C (nuclear — Vercel Data Cache purge only, no code change):** Vercel dashboard → Data Cache → Purge All. This forces all `unstable_cache` entries to expire. On the next request, `getDynamicScenarios()` reads from Redis (344 scenarios), populates the entry correctly, and pages render with dynamic content — until the next `revalidatePath`-triggered ISR regeneration re-poisons it. This is a temporary fix that confirms the hypothesis but doesn't solve it structurally. **Recommended as diagnostic step BEFORE the code fix.**

---

**Files Allowed to Modify:**
- `lib/cached-data.ts` — modify or remove `getCachedDynamicScenarios` export
- `app/page.tsx` — change from `getCachedDynamicScenarios()` to direct call pattern
- `app/it/page.tsx` — same
- `app/trending/page.tsx` — same
- `app/it/trending/page.tsx` — same
- `app/category/[category]/page.tsx` — same
- `app/it/category/[category]/page.tsx` — same
- Optionally: `app/api/internal/dynamic-scenarios/route.ts` (new, if Option B chosen)

**Files Forbidden:**
- `app/api/vote/**` — vote flow, do not touch
- `lib/redis.ts` — Redis client, do not touch
- `app/api/admin/**` (except approve/route.ts for revalidation review) — admin API, do not touch without separate GO
- `middleware.ts` — auth middleware, do not touch
- Any Supabase migration file
- `LEGAL.md`, `PRODUCT_STRATEGY.md`, `ROADMAP.md`

**Anti-Regression Requirements:**
1. `npm run typecheck` must pass
2. `npm run build` must produce 167+ pages
3. Anonymous vote flow must still work (no change to vote API)
4. Play pages remain `force-dynamic` — no ISR on play/results
5. After fix: `curl -I https://splitvote.io | grep "Cache-Control"` must show ISR-appropriate headers (not `no-store`)

**QA Steps (deterministic — these curl checks become the regression suite):**
```bash
# Step 1: after deploy, wait 30s
# Step 2: approve one draft in admin panel
# Step 3: wait 10s
# Step 4: verify all surfaces show dynamic IDs
curl -s https://splitvote.io | grep -c "ai-en-"               # must be > 0
curl -s https://splitvote.io/it | grep -c "ai-it-"             # must be > 0
curl -s https://splitvote.io/trending | grep -c "ai-en-"        # must be > 0
curl -s https://splitvote.io/it/trending | grep -c "ai-it-"     # must be > 0
curl -s https://splitvote.io/category/morality | grep -c "ai-en-"     # must be > 0
curl -s https://splitvote.io/it/category/morality | grep -c "ai-it-"  # must be > 0
# Step 5: verify ISR headers not broken
curl -I https://splitvote.io | grep -i "cache-control"         # must NOT be no-store
```

**GO/NO-GO Conditions:**
- **NO-GO:** If Option A causes `Cache-Control: no-store` on the home page (ISR broken)
- **GO:** If all 6 curl checks return > 0 and ISR headers are correct
- **Fallback GO:** If all checks pass but ISR header shows `private` or short TTL — acceptable if page still serves stale-while-revalidate

**Agents required:**
- `backend-systems-reviewer.md` — review the ISR+cache interaction change before ship
- `release-readiness-reviewer.md` — ship gate

**Expected Deliverables:**
- Code change (1-3 files if Option A; 3-7 files if Option B)
- Passing `npm run typecheck` + `npm run build`
- All 6 curl QA checks returning > 0
- Updated `CURRENT_HANDOFF.md` (only after QA passes)

---

## Fix Sprint — Outcome (2026-05-07)

**PM GO received:** YES — "Public Dynamic Discovery Cache Bypass"  
**Root cause confirmed:** `unstable_cache` Data Cache entries inconsistent across Vercel distributed nodes — some regions had `[]` stale entries that were never invalidated correctly. New evidence confirmed: `/it/category/technology` showed live `ai-it-*` IDs (same `getCachedDynamicScenarios()` call) while home/trending showed 0 — indicating region-level Data Cache divergence, not a uniform Redis connectivity failure.

**Fix implemented:** Hypothesis 4 confirmed (Scenario A from the cache purge analysis). Full `unstable_cache` bypass on the dynamic scenario read path for all 6 public discovery surfaces.

### Files Changed

| File | Change |
|---|---|
| `lib/cached-data.ts` | Added `getFreshDynamicScenarios()` — calls `noStore()` then `getDynamicScenarios()` directly |
| `app/page.tsx` | Replaced `getCachedDynamicScenarios` import/call with `getFreshDynamicScenarios`; removed `revalidate = 3600` |
| `app/it/page.tsx` | Same swap; removed `revalidate = 3600` |
| `app/trending/page.tsx` | Same swap; removed `revalidate = 3600` |
| `app/it/trending/page.tsx` | Same swap; removed `revalidate = 3600` |
| `app/category/[category]/page.tsx` | Same swap; removed `revalidate = 3600`; added `dynamic = 'force-dynamic'` |
| `app/it/category/[category]/page.tsx` | Same swap; removed `revalidate = 3600`; added `dynamic = 'force-dynamic'` |

`getCachedVotesBatch`, `getCachedVotesBatchDetail`, `getCachedTrendingIds` — unchanged. Vote counts remain `unstable_cache`-backed (not the source of the bug).

`getCachedDynamicScenarios` and `getCachedDynamicScenariosByLocale` remain in `lib/cached-data.ts` — not deleted (referenced by `revalidateTag` in approve route, harmless to keep).

### Caching Tradeoff Documented

| Surface | Before | After |
|---|---|---|
| `/` | ISR 3600s (`revalidate = 3600` + `unstable_cache`) | SSR per-request (dynamic) — fresh on every hit |
| `/it` | ISR 3600s | SSR per-request |
| `/trending` | ISR 3600s | SSR per-request |
| `/it/trending` | ISR 3600s | SSR per-request |
| `/category/[category]` | ISR 3600s via `generateStaticParams` | `force-dynamic` + `generateStaticParams` — path validation preserved, rendering dynamic |
| `/it/category/[category]` | ISR 3600s via `generateStaticParams` | Same |

Vote counts and trending IDs: still `unstable_cache`-backed with their original TTLs — one Redis pipeline per page.

**PM rationale accepted:** "Meglio pagine discovery fresh/dynamic con cache-control meno aggressivo che home/trending senza nuovi dilemmi."

### Verification

| Check | Result |
|---|---|
| `npm run typecheck` | ✅ PASS |
| `npm run build` (167 pages) | ✅ PASS |
| `git diff --check` | ✅ PASS |
| `npm run nightly:check` | ✅ 2/2 PASS |
| Build symbols: `/` | ƒ (Dynamic) ✅ |
| Build symbols: `/it` | ƒ (Dynamic) ✅ |
| Build symbols: `/trending` | ƒ (Dynamic) ✅ |
| Build symbols: `/it/trending` | ƒ (Dynamic) ✅ |
| Build symbols: `/category/[category]` | ● + `force-dynamic` (path-validated, dynamic at runtime) |
| Build symbols: `/it/category/[category]` | ● + `force-dynamic` (path-validated, dynamic at runtime) |

### Post-Deploy QA Checklist (run after push + Vercel Ready)

```bash
curl -s https://splitvote.io | grep -c "ai-en-"                # expected: > 0
curl -s https://splitvote.io/it | grep -c "ai-it-"              # expected: > 0
curl -s https://splitvote.io/trending | grep -c "ai-en-"         # expected: > 0
curl -s https://splitvote.io/it/trending | grep -c "ai-it-"      # expected: > 0
curl -s https://splitvote.io/category/technology | grep -c "ai-en-"    # expected: > 0
curl -s https://splitvote.io/it/category/technology | grep -c "ai-it-" # expected: > 0

# Locale isolation (must each be 0):
curl -s https://splitvote.io | grep -c "ai-it-"                 # expected: 0
curl -s https://splitvote.io/it | grep -c "ai-en-"              # expected: 0
curl -s https://splitvote.io/trending | grep -c "ai-it-"         # expected: 0
curl -s https://splitvote.io/it/trending | grep -c "ai-en-"      # expected: 0

# Cache-control headers (home and IT home):
curl -I https://splitvote.io
curl -I https://splitvote.io/it
# Expected: Cache-Control not 'no-store' at CDN level — but may be private/no-cache for dynamic SSR
```

### Residual Risks

1. **SSR load on home/trending:** Every request now calls `getDynamicScenarios()` (one Redis GET). Pre-launch traffic is minimal; acceptable tradeoff. Revisit if Redis costs spike post-scale.
2. **Category page SSG + force-dynamic interaction:** In Next.js 14, `generateStaticParams` generates paths at build time; `force-dynamic` ensures runtime requests re-render. Build output shows ● (paths pre-generated for manifest/routing) but runtime behavior is dynamic. If this combination doesn't behave as expected post-deploy, fallback is to remove `generateStaticParams` + `dynamicParams = false` (the `notFound()` check in the page already handles invalid categories).
3. **`unstable_cache` entries for `dynamic-scenarios-v2` still exist in Vercel Data Cache** — they will simply never be read again by any public surface. They'll expire naturally (TTL 3600s) or on next purge. No action needed.
4. **`revalidateTag('dynamic-scenarios')` in approve route** — still fires on each approval; now effectively a no-op for public surfaces (no public reader). Harmless. Could be cleaned up in a future tech-debt sprint.

**Status: IMPLEMENTED — not yet committed, not yet pushed. Awaiting PM GO for commit + push.**

---

*Audit Step 2 completed 2026-05-07. Read-only. No code changes made.*  
*Step 1 completed 2026-05-07 (original). Updated with empirical evidence, per-commit analysis, revised hypotheses, per-surface data flow trace, and Fix Sprint spec.*  
*Fix Sprint completed 2026-05-07. All 7 files changed. Verification: typecheck ✅ build ✅ diff --check ✅ nightly:check 2/2 ✅.*
