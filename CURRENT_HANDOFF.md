# CURRENT_HANDOFF — SplitVote

Last updated: 27 May 2026 (morning) — Sprint A.3 cluster expansion shipped + 2 user-reported bug fixes (language switcher slug mismatch, catalog card pill alignment). Vitest 184/184. Scenarios 47→51. Landing pages +2. Blog posts +2.

## -2. Session 27 May 2026 (morning) — Sprint A.3 + 2 bug fixes

### TL;DR

User-reported bugs caught + fixed first (commit `8dd2fe5`): language switcher was hitting "Dilemma not found" 404 on /moral-dilemmas ↔ /it/dilemmi-morali toggle because `alternateLocalePath()` did a pure /it prefix swap. Catalog card option pills were vertically misaligned across grid cells due to variable question line counts. Both fixed in one commit. Then Sprint A.3 (`2a5ceac`): Sleepover Decline cluster EN + AI Scam Economy cluster IT, riding yesterday's trend-digest signal investment.

### Commits pushati (questa sessione)

| SHA | Sprint |
|---|---|
| `8dd2fe5` | `fix(catalog)`: language-switcher slug map + catalog card pill alignment |
| `2a5ceac` | `feat(content)`: Sprint A.3 cluster expansion — Sleepover decline + AI scams |

### Bug fix 1 — Language switcher slug mismatch (`8dd2fe5`)

**Root cause**: `alternateLocalePath()` in [lib/locales.ts](lib/locales.ts) did a pure prefix toggle, so `/moral-dilemmas` → `/it/moral-dilemmas` (404, the IT slug is `dilemmi-morali`). Same pattern for `/topics` ↔ `/it/temi` and `/would-you-rather-questions` ↔ `/it/domande-would-you-rather`. The user landed on the `[topicSlug]` 404 page after toggling locale on the catalog.

**Fix**:
1. Added `EN_TO_IT_SEGMENT` static map for the 3 reserved per-locale base paths in `lib/locales.ts`
2. Refactored `alternateLocalePath()` to preserve query/hash and consult the map for the first segment before falling back to prefix toggle
3. Enhanced `LanguageSwitcher.tsx` to read `<link rel="alternate" hreflang>` from `document.head` as primary source — covers ALL dynamic-slug pages (blog posts with `alternateSlug`, SEO topic landings) that declare `metadata.alternates.languages`. Static slug map remains as fallback.

### Bug fix 2 — Catalog card option pill misalignment (`8dd2fe5`)

**Root cause**: `CatalogCard.tsx` question paragraph had no height constraint, so 3-line vs 5-line questions made the option pill rows land at different Y positions across grid cells, breaking visual rhythm.

**Fix**: locked the question paragraph to `line-clamp-4 min-h-[5.6em]` (4 lines worth at leading-1.4) + wrapped the mini split bar in a fixed `h-1` slot so cards under the 50-vote social-proof floor still align their footer with cards that have the bar.

### Sprint A.3 — Cluster expansion (`2a5ceac`)

**Trigger**: yesterday's trend digest surfaced 2 secondary signals worth a leaner cornerstone treatment.

**Sleepover Decline (EN-only)** — Anglo-cultural artefact, doesn't translate to IT naturally
- Dilemmas (bilingual for parity test): `sleepover-9yo`, `helicopter-gps-teen`
- Landing EN: `/sleepover-decline-parenting`
- Blog EN: `/blog/why-sleepovers-are-disappearing` (~1100 words, 5 FAQ, 6 H2)
- Research: Let Grow Foundation + Jonathan Haidt research hub

**AI Scam Economy (IT-only)** — Italian used-market context, AGCM-specific
- Dilemmas (bilingual): `ai-fake-review`, `scalper-bot`
- Landing IT: `/it/mercato-ai-truffe-online`
- Blog IT: `/blog/truffe-ai-mercato-usato-italia` (~1300 words, 5 FAQ, 6 H2)
- Research: AGCM provvedimenti + Akerlof's "Market for Lemons" (Nobel 2001)

### Test maintenance

`tests/unit/next-dilemma-affinity.test.ts` had a hard-coded assumption "relationships has exactly 4 static dilemmas". With `relationships` growing from 4 → 6 (sleepover-9yo + helicopter-gps-teen), the "fall through when pool < 3" test broke. Fixed with a dynamic `slice(2)` so the test scales with corpus growth.

### Verification

- `npm run typecheck` ✅ both commits
- `npm run test` ✅ 184/184
- `npm run build` ✅
- `git diff --check` ✅
- EN/IT parity preserved
- Pixie WIP 3 file preservati intoccati

### PM-side follow-up (post-deploy)

1. Test language switch on `/moral-dilemmas` ↔ `/it/dilemmi-morali` (the bug Matteo reported)
2. Verify catalog card pill alignment on the 18-card grid
3. Visit the 2 new landings (`/sleepover-decline-parenting` + `/it/mercato-ai-truffe-online`)
4. Visit the 2 new blog posts
5. Google Rich Results Test on the 4 new URLs
6. GSC Request Indexing on the 4 new URLs

### Note per domani (Pixie regression to investigate)

⚠️ **PIXIE-LEVEL-UP-STATE-REGRESSION-01** — User reported i Pixie non sembrano salire di livello e non cambiano stato al passaggio di livello. Da investigare domani. Possible scope:
- Vote-to-XP wiring in vote API
- Pixie level state derivation in profile/play page
- Pixie state SSR vs client revalidation
- Possible broken-on-save cache invalidation

Owner: TBD prossima sessione. Not committed yet — solo nota qui per non perdere il signal.

---

## -1. Session 26 May 2026 (tarda notte) — Cornerstone duo + catalog polish + 9GAG radar

## -1. Session 26 May 2026 (tarda notte) — Cornerstone duo + catalog polish + 9GAG radar

### TL;DR

Triple play in chiusura giornata: (a) trend-digest digest 9GAG meme radar + LEGAL.md signal watch list, (b) catalog redesign polish con pill toolbar e split-bar gradient, (c) **2 cornerstone SEO sprint completi (AI Companions & Teens + Religion & AI Ethics)** EN+IT con 6 dilemmi + 4 landing + 4 blog articles.

### Commits pushati (questa sessione)

| SHA | Sprint |
|---|---|
| `efac5fc` | `feat(trend-digest)`: 9GAG meme radar + LEGAL.md watch list |
| `6f58c91` | `polish(catalog)`: pill toolbar doubling + bg contrast + auto-close on scroll |
| `dac7b8a` | `feat(content)`: AI companions + religion-vs-AI cornerstones EN+IT (dilemmi + landing) |
| `c37b1ac` | `content(blog)`: 2 cornerstone articles EN+IT (4 blog posts totali) |
| `094f786` | `polish(catalog)`: softer toolbar morph + thicker glossy split bars |

(earlier in the day: `8412636` 500-fix CatalogPage server→client fn, `7ac7369` catalog featured row + percent fix)

### Sprint A — AI Companions & Teen Safety

**Trigger**: trend-digest signal Reddit r/popular #16 (fit🟢high, score 58) — _"The terrifying rise of schoolboys making AI girlfriends"_.

**Dilemmi nuovi** (EN+IT in `lib/scenarios.ts` + `lib/scenarios-it.ts` + insights in `lib/static-insights.ts`):
- `ai-companion-teen` — Tuo figlio 13yo ha una AI girlfriend, blocchi o lasci?
- `ai-companion-ban` — Legge che vieta AI companion sotto i 18?
- `ai-grief-replica` — Replica AI di un caro defunto?

**Landing pages** (in `lib/seo-topics.ts`):
- EN: `/ai-companions-and-teens`
- IT: `/it/ai-companion-adolescenti`
- hreflang via `alternateSlug`, JSON-LD via template `[topicSlug]/page.tsx`
- Research sources: U.S. Surgeon General + MIT Media Lab Personal Robots Group

**Blog articles** (in `lib/blog.ts`):
- EN: `/blog/ai-girlfriends-teen-development-risk` (~1100 parole, 5 FAQ, 6 H2)
- IT: `/blog/ai-girlfriend-adolescenti-rischio-sviluppo` (mirror naturale)

### Sprint B — Religion & AI Ethics

**Trigger**: trend-digest signal r/italy #5 (score 88) _"Magnifica Humanitas, enciclica papale"_ + r/popular #30 _"Pope wrote 42000-word manifesto on AI"_.

**Dilemmi nuovi**:
- `pope-ai-encyclical` — Azienda tech che si vincola formalmente all'enciclica?
- `religious-ai-ethics` — Voce religiosa nei comitati etici AI?
- `ai-prayer-app` — Preghiere generate da AI: devozione o profanazione?

**Landing pages**:
- EN: `/religion-and-ai-ethics`
- IT: `/it/religione-e-etica-ai`
- Research sources: Rome Call for AI Ethics + Oxford Institute for Ethics in AI

**Blog articles**:
- EN: `/blog/religion-ai-ethics-who-decides` (~1300 parole, 5 FAQ, 7 H2)
- IT: `/blog/religione-etica-ai-chi-decide` (mirror)

### 9GAG Meme Radar

Aggiunto `fetchNineGagTrending()` a `scripts/trend-digest.mjs`. Fail-soft su qualunque errore (HTTP, timeout, HTML structure change). Classificazione `safe` / `review` / `block` con block-list NSFW/violence/hate + review-list politica/religione/dark-humor. Angle templates per 11 categorie keyword-match → suggerisce angle dilemmi per PM brainstorming (mai auto-genera draft).

Oggi 9GAG ha restituito 0 item parseabili (fail-soft path, HTML non match noti). Sezione "9GAG Meme Radar" nel report digest mostra correttamente _"source unavailable — failing soft"_.

LEGAL.md aggiornato con `Third-Party Signal Watch List` sezione + entry 9GAG con re-evaluate triggers (frequency↑, login scraping, auto-publish da signal, opt-out signal da 9GAG, cease-and-desist).

### Catalog polish iterations

User feedback durante la giornata → 3 commit di polish:
1. `6f58c91`: bug pill doppia (inline panel + floating overlay rendering simultaneously) → fix conditional. Bg `#0a0a22` → `var(--surface-3)` `#1a1a40` per contrasto. Auto-close su scroll quando floating panel aperto.
2. `094f786`: animazione "legnosa" → easing Apple `cubic-bezier(0.32, 0.72, 0, 1)`, duration 300→420ms, hover/active scale, crossfade content swap (cat-fade-in 240ms), floating drop-in (cat-drop-in 320ms).
3. (in `094f786`) split bar featured row: h-1.5→h-[9px] (50% più spessi), gradient orizzontale red→pink + blue→cyan, gloss vertical highlight, glow consistente 10+22px, ring inset sulla track.

### Verification

- `npm run typecheck` ✅ tutti i commit
- `npm run test` ✅ 184/184 (4 nuovi per pickMostVoted + 18 nuovi static-insights coverage assertions)
- `npm run build` ✅ tutti i commit (4 nuovi landing pages prerendered + 4 nuovi blog posts)
- `git diff --check` ✅
- EN/IT parity preservata su ogni surface
- Pixie WIP 3 file preservati intoccati

### PM-side follow-up (post-deploy)

1. Verify Vercel deploy `094f786` → live
2. Visit le 4 nuove URL landing (EN+IT entrambi per ognuno dei 2 cluster)
3. Google Rich Results Test → ItemList + FAQPage + BreadcrumbList su ognuna
4. GSC Request Indexing → 4 landing + 4 blog = 8 URL nuovi
5. Sitemap fetch `/sitemap.xml` → contiene tutte e 8
6. Mobile QA toolbar pill (320/375/393 + scroll behavior)
7. Lighthouse mobile su 1 landing + 1 catalog → target ≥90 Performance, ≥95 SEO

### Out of scope / queued sprints (deferred)

- `TREND-LANDING-COVERAGE-MATCHER-01` — cross-ref blog/landing in trend-digest
- `ADMIN-UI-EDITORIAL-WARNING-SURFACE-01`
- `DILEMMA-EDITORIAL-WARNINGS-REGEX-TUNING-01`
- `9GAG-PARSE-STRATEGY-V2` — quando 9GAG HTML cambia, aggiungere strategia parsing aggiornata (oggi fail-soft)
- Blog FAQ batch on 15-18 articoli legacy
- Sprint A.3 (cluster expansion): "Sleepover decline" article (signal #9), "Used market AI scams" article IT (signal #11)
- 9GAG fetcher per IT-relevant content (oggi solo EN)

### Anti-regression check (CLAUDE.md)

- Anonymous voting ancora funziona (sprint touched only content + scripts + UI shell, no vote logic)
- `currentVote` / `can_change_until` invariati
- "Next dilemma" routing intact (47 statici + dynamic Redis)
- Share URL non espone voto utente
- Cache contract: `/play/[id]` force-dynamic, `/results/[id]` revalidate=60, `/moral-dilemmas` force-dynamic, `/[topicSlug]` revalidate=3600, `/blog/[slug]` static — tutti invariati
- LEGAL.md: aggiornato per 9GAG signal source (NO cambio in user data flow, NO nuovo processor, NO cookie nuovo)
- HUMAN_ONLY non toccati: auth, Stripe, Redis vote, middleware, admin

---

## 0. Session 26 May 2026 (notte) — `DILEMMAS-CATALOG-01`

### TL;DR

PM segnalazione: 213 dilemmi totali (41 statici + 172 dynamic EN) sono "difficili da trovare e organizzati male", `/moral-dilemmas` era una landing SEO con 20 esempi hard-coded — non un vero catalogo. Sprint shipped (local, awaits push): catalog page completo a `/moral-dilemmas` + mirror `/it/dilemmi-morali` con filtro chip per 9 categorie + sort (Popular / Fresh / Divisive) + paginazione 24 card/pagina + URL state shareable + CTA dalla home (4° slot di "Pick Your Next") + 2 entry in sitemap.

### Files changed (local — awaits PM GO to commit + push)

| File | Status | Change |
|---|---|---|
| `lib/catalog.ts` | NEW (~160 LOC) | Pure helpers: `CatalogItem` type, `buildCatalogItems` (dedup static-wins, lifestyle flag, freshnessTs), `filterCatalog`, `sortCatalog` (popular/fresh/divisive con ≥50-vote floor), `categoryCounts`. |
| `tests/unit/catalog.test.ts` | NEW | 17 vitest cases coprono dedup, lifestyle inference, freshness fallback, tutti e 3 i sort mode, empty/edge cases. |
| `components/CategoryChipFilter.tsx` | NEW | Client. Chip row single-select. Mobile: scroll orizzontale `snap-x` con bleed; ≥sm: `flex-wrap`. `aria-pressed`. |
| `components/SortSelect.tsx` | NEW | Client. Native `<select>` styled disciplined-neon. EN+IT labels via prop. |
| `components/Paginator.tsx` | NEW | Client. Windowing (first, last, current ±1, ellipsis). `aria-current="page"` su pagina attiva. |
| `components/DilemmaCatalogClient.tsx` | NEW | Client orchestrator. Owns filter+sort+page via `useSearchParams`+`router.replace`. Default-strip URL params per canonical pulito. Page clamp `[1, totalPages]`. Grid via `FreshFirstGrid` + `VotedDilemmaCard`. Lifestyle badge inline. Empty state. Divisive hint copy. |
| `app/moral-dilemmas/page.tsx` | REWRITE | Server component. `revalidate = 300`. Fetch unified data (static + dynamic EN via `getCachedDynamicScenariosByLocale`) + vote map + detail. JSON-LD: `ItemList` (default sort, no filter, first 24) + `BreadcrumbList`. Metadata con count dinamico. Hreflang invariato. Hero + catalog + cross-links. Rimosso: 20 dilemmi hard-coded + intro marketing. |
| `app/it/dilemmi-morali/page.tsx` | REWRITE | IT mirror. `scenarios.map(translateScenarioToItalian)`. Sort labels italiani (Popolari / Recenti / Divisivi). "Tutti" come "All". Italian copy naturale, no calques. |
| `lib/scenarios-it.ts` | MODIFY | Aggiunto `lifestyle: 'Stile di vita'` a `CATEGORY_LABELS_IT` (chiave mancante). |
| `app/page.tsx` | MODIFY | "Pick your next" da 4 picks personalizzate → 3 picks + 1 CTA card 4° slot `<Link>` a `/moral-dilemmas` con `🔍` + count dinamico. Fallback logic aggiornata per pad fino a 3. |
| `app/it/page.tsx` | MODIFY | IT mirror dello stesso pattern. CTA copy "Esplora tutti i {N} dilemmi" + "Apri catalogo". |
| `app/sitemap.ts` | MODIFY | +2 entry: `/moral-dilemmas` priority 0.85 daily, `/it/dilemmi-morali` priority 0.80 daily. |

### Verification

- `npm run typecheck` ✅ green
- `npm run test` ✅ 156/156 (era 139, +17 nuovi catalog test)
- `npm run build` ✅ green, `/moral-dilemmas` + `/it/dilemmi-morali` entrambi prerendered come `○` static, 100 kB First Load JS
- `git diff --check` ✅ exit 0
- EN/IT parity (`DilemmaCatalogClient` mounted): entrambe le pagine ≥1 occorrenza

### Hard constraints preserved

- HUMAN_ONLY non toccati: auth, Stripe, Redis vote, middleware, admin
- Voto anonimo ancora funziona (catalogo è solo discovery surface)
- `/play/[id]` force-dynamic e `/results/[id]` revalidate=60 invariati
- Share URL non espone voto utente (catalogo non mostra user's vote)
- Pixie WIP 3 file intatti

### How it works for the user

1. Visit `/moral-dilemmas` → 24 card primi sortati per popolarità, default filter "All"
2. Click chip "Morality" → URL diventa `?category=morality`, card filtrate, count aggiornato
3. Cambia sort=Divisive → vedi solo card ≥50 voti, copy "Showing only dilemmas with 50+ votes"
4. Click page 2 → URL `?page=2`, smooth scroll-top, 24 successivi
5. Share URL `?category=technology&sort=fresh&page=2` → stato ripristinato in incognito
6. Lifestyle items mostrano badge giallo "LIFESTYLE" top-right card
7. Home: 4° card di "Pick Your Next" è "Explore all {N} dilemmas" → click → catalogo

### Out of scope (sprint-2+)

- Search by keyword (richiede fuzzy match o server endpoint)
- Multi-select category chips (semantica AND/OR ambigua)
- Saved/bookmarked dilemmas (richiede auth state)
- Realtime vote updates senza refresh
- Header nav voce "All Dilemmas" + footer link (PM ha scelto solo home CTA in sprint-1)
- Cross-link automatico dal blog cluster pages
- Server-side filter/sort (213 item troppo pochi per giustificarlo)

### PM-side follow-ups (post-push)

- Verify Vercel deploy `live`
- Smoke test URL: `/moral-dilemmas`, `/it/dilemmi-morali` → 200 + JSON-LD presente
- Google Rich Results Test sui 2 URL (ItemList + BreadcrumbList)
- GSC Request Indexing sui 2 URL
- Sitemap fetch verify
- Mobile QA breakpoints 375 / 393 / 768 / 1024 — chip row scroll orizzontale a 375 senza overflow
- Lighthouse mobile target ≥90 Performance, ≥95 a11y, ≥100 SEO

---

## 0a. Session 26 May 2026 (tarda sera) — `TREND-SIGNAL-GOOGLE-FIX-01`

### TL;DR

This morning's trend-digest revealed Google Trends RSS endpoints (daily + realtime + dailytrends JSON) all return HTTP 404 — Google has discontinued the public free interface. The daily generation cron had been running on Reddit + RSS only. Sprint replaces the dead source with **Wikipedia top-pageviews** (free, official Wikimedia REST API, separate EN + IT projects) and adds **HackerNews top stories** as a complementary tech-ethics signal (EN-only by audience convention). PM picked option B (free alternative source) over option A (remove source entirely) or option C (paid SerpAPI ~$50/mo). Bing was considered and ruled out (no public free trends API since Microsoft moved to paid Azure Cognitive Services).

### Numbers

| Locale | Before (Google + Reddit + RSS) | After (Wikipedia + Reddit + RSS + HN) | Δ |
|---|---:|---:|---|
| EN | 15 signals (0 from Google) | 37 signals | +147% |
| IT | 15 signals (0 from Google) | 27 signals | +80% |

### Files changed (local — awaits PM GO to commit + push)

| File | Change |
|---|---|
| `lib/trend-signals.ts` | (a) New fetchers: `fetchWikipediaTrending(locale)` hits `https://wikimedia.org/api/rest_v1/metrics/pageviews/top/{en,it}.wikipedia/all-access/YYYY/MM/DD` (yesterday-2d to dodge Wikimedia's 1-2 day lag), filters meta namespaces (`Main_Page`, `Special:*`, `Wikipedia:*`, `Pagina_principale`, `Speciale:Ricerca`), takes top 10 real topics, view-weighted score 30-100. `fetchHackerNews()` hits Firebase `topstories.json` + per-item `item/{id}.json` in parallel, skips `type:'job'`, takes top 8. (b) Removed `fetchGoogleTrends()` — endpoints all 404. (c) Rebalanced `BASE_WEIGHTS`: wikipedia 0.30, reddit 0.25, rss 0.20, hackernews 0.10, internal_feedback 0.15, google_trends 0 (deprecated but retained in `TrendSource` type for backward compat with existing Redis drafts). (d) `fetchTrendSignals(locale)` now calls Wikipedia + Reddit + RSS + (EN-only) HackerNews. Source-blend math updated. |
| `lib/dynamic-scenarios.ts` | Added `'wikipedia' \| 'hackernews'` to the parallel `TrendSource` type (line 107) so Redis drafts can carry the new source labels. `'google_trends'` retained for legacy. |
| `scripts/trend-digest.mjs` | Mirror update: replaced Google Trends + r/popular fetchers with Wikipedia + r/popular + HackerNews. Same meta-namespace filter. Intro copy updated. |
| `reports/trend-digest-2026-05-26.md` | Regenerated. |
| `CURRENT_HANDOFF.md` + `ROADMAP.md` | this section. |

### Verification

- `npm run typecheck` ✅
- `npm run build` ✅ (all routes prerender)
- `npm run test` ✅ 139/139
- `git diff --check` ✅ exit 0
- Manual run of `scripts/trend-digest.mjs` ✅ produces a richer report

### Hard constraints preserved

- HUMAN_ONLY: `AUTO_PUBLISH_DILEMMAS=false` unchanged. Pixie WIP untouched.
- No Stripe / auth / legal / middleware changes.
- No Redis schema change beyond expanding the `TrendSource` literal union; existing drafts keep their `trendSource: 'google_trends'` label and continue to parse.
- No new external paid dependency. Wikimedia REST API requires no auth, has generous rate limits, and is officially supported.

### Backward compat notes

- Existing `dynamic:scenarios` / `dynamic:drafts` entries with `trendSource: 'google_trends'` continue to validate against the expanded union.
- Admin review UI (if it switches on `trendSource`) needs no change — it already accepts arbitrary `TrendSource` strings.
- The `ENABLE_X_TRENDS` / `ENABLE_INSTAGRAM_TRENDS` / `ENABLE_TIKTOK_TRENDS` env toggles still work; they just renormalize alongside the new wikipedia/hackernews weights.

### Risks

1. **Wikipedia pageview lag**: Wikimedia's `top/.../YYYY/MM/DD` endpoint is published with a 1-2 day delay. We query `now - 2 days` (UTC) to avoid 404s. Acceptable for daily cron use — the signal is "what was big yesterday", not "what is trending right now".
2. **HackerNews per-item fetch volume**: 12 parallel item lookups per cron run. Firebase rate limits are generous; not a concern at 1 run/day.
3. **Wikipedia topical mismatch**: pageview leaders are sometimes celebrities (e.g. "Michael Jackson") or recent films, which are not direct moral-dilemma material. Mitigated by the existing AI prompt that abstracts topics into universal dilemmas, plus the editorial-shape + punchy-framing gates.

### How to throttle (zero-code)

Same as before: `DAILY_DILEMMA_DRAFTS_PER_LOCALE=5` (or any int 1-20) in Vercel Production env.

### Queued follow-ups (carried over)

- `TREND-LANDING-COVERAGE-MATCHER-01` — extend `trend-digest.mjs` with blog/landing cross-ref.
- `ADMIN-UI-EDITORIAL-WARNING-SURFACE-01` — surface the 7 warning codes in admin review UI.
- `DILEMMA-EDITORIAL-WARNINGS-REGEX-TUNING-01` — tighten regex after AI prompt changes settle.

---

## 0b. Session 26 May 2026 (evening) — `AI-TREND-DRAFTS-SCALE-01` + trend-digest companion

### TL;DR

PM requested: "site fetches world Google Trends daily, generates ~10 themed dilemmas + landing pages if relevant". Discovery: daily-trend → AI-draft pipeline already exists at `/api/cron/generate-dilemmas` (06:00 UTC) using `lib/trend-signals.ts` (Google Trends RSS + Reddit + RSS + internal_feedback), but draft count was hard-coded to 3 per locale. Single knob lifted to 10 per locale (configurable via env, clamped 1-20). Landing pages explicitly NOT auto-generated — instead a separate read-only weekly `trend-digest` script surfaces landing-page candidates for PM judgment.

### Latent finding (worth flagging)

Running `node scripts/trend-digest.mjs` showed **0 / 15 signals came from `google_trends`** (all 15 EN signals were Reddit; all 15 IT same). The `fetchGoogleTrends()` fetcher at `lib/trend-signals.ts:68` calls `https://trends.google.com/trends/trendingsearches/daily/rss?geo=US|IT` and parses RSS — looks like Google has stopped returning items on that endpoint. Implication: the daily cron has been running on Reddit + RSS GDELT/Reuters + internal_feedback only for some time. Not a blocker for sprint-1 (the volume is still healthy), but worth a future sprint to either: (a) switch Google Trends to a maintained source (pytrends Python wrapper requires a separate runtime; SerpAPI ~$50/mo), or (b) accept Reddit + RSS as the primary signal mix and remove the `google_trends` weight branch.

### Files changed (local — awaits PM GO to commit + push)

| File | Change |
|---|---|
| `app/api/cron/generate-dilemmas/route.ts` | Line 236 area: replace hard-coded `3` with `parseInt(process.env.DAILY_DILEMMA_DRAFTS_PER_LOCALE ?? '10', 10)`, clamped `[1, 20]`. Comment block tied to `AI-TREND-DRAFTS-SCALE-01` for future archaeology. |
| `scripts/trend-digest.mjs` (new, 175 LOC) | Read-only script. Pulls Google Trends RSS US + IT and Reddit `r/popular` + `r/italy` hot. Scores each title for moral-dilemma fit via keyword heuristic (ethical/social/relational tokens raise fit; sports/entertainment/products lower it). Renders `reports/trend-digest-<YYYY-MM-DD>.md` with per-locale tables + a "Landing-page candidates" shortlist (fit 🟢 high AND score ≥ 60). |
| `reports/trend-digest-2026-05-26.md` (new) | First digest run. EN: 15 signals, 2 candidates. IT: 15 signals, 0 candidates. |
| `CURRENT_HANDOFF.md` + `ROADMAP.md` | this section. |

### Verification

- `npm run typecheck` ✅ green
- `npm run build` ✅ green (all routes prerender)
- `npm run test` ✅ 139/139 (no regressions)
- `git diff --check` ✅ exit 0
- Manual run of `scripts/trend-digest.mjs` ✅ produces report

### Hard constraints preserved

- HUMAN_ONLY: `AUTO_PUBLISH_DILEMMAS=false` unchanged — all 10 daily drafts go to `dynamic:drafts` for manual admin review (same flow as the 3 already did).
- No Stripe / auth / legal / middleware changes.
- No Redis schema change. No new key written by the digest script.
- No 3 Pixie WIP touched.
- Landing pages and full articles are **never** auto-generated — PM judgment only.

### How to run the digest

```bash
nvm use
node scripts/trend-digest.mjs
# → reports/trend-digest-<YYYY-MM-DD>.md
```

Recommended cadence: weekly (e.g. Monday morning) to pick 1-2 trend-driven landing pages or articles for the week ahead.

### How to throttle daily drafts

Set in Vercel Production env (no code change needed):

```
DAILY_DILEMMA_DRAFTS_PER_LOCALE=5    # or 7, 10, 12, etc. (max 20)
```

Unset → defaults to 10 per locale.

### Risk register (sprint-1)

1. **AI lazy output on count=10**: asking Claude for 10 dilemmas in one prompt may produce variants of a single archetype. Mitigation: existing `isSimilarToExisting` dedup filter. Watch `skippedDuplicates` in cron response after the first live run; if > 4, split generation into 2 calls of 5 in sprint-2.
2. **Token cost**: 2× per-locale generations → ~$0.30-0.60/day. Negligible.
3. **Review bottleneck**: 20 drafts/day = 2-3 min triage if average. If too much, env down to 5.
4. **Google Trends RSS gone** (see latent finding above) — does not block sprint-1, but flagged.

### Queued follow-ups

- `TREND-SIGNAL-GOOGLE-FIX-01` — investigate Google Trends RSS regression; decide between pytrends-via-Python-service vs SerpAPI vs removing the weight.
- `TREND-LANDING-COVERAGE-MATCHER-01` — extend `trend-digest.mjs` to cross-reference each candidate trend against `lib/blog.ts` slugs + existing landing routes to mark "covered / uncovered" automatically (saves PM the manual check).
- `ADMIN-UI-EDITORIAL-WARNING-SURFACE-01` — surface the 7 punchy-framing warning codes (`abstract_policy_question`, `support_oppose_framing`, `undefined_collective_actor`, `undefined_action_verb`, `missing_personal_stake`, `wordy_setup_question`, `wordy_option`) with distinctive copy in the admin review UI.
- `DILEMMA-EDITORIAL-WARNINGS-REGEX-TUNING-01` — tighten 4 editorial-shape regexes after AI-PROMPT-PUNCHY-FRAMING-01 has had a few days to generate new drafts; re-run dry-run, target FP ≤ 25%.

---

## 0c. Session 26 May 2026 (afternoon) — `AI-PROMPT-PUNCHY-FRAMING-01`

### TL;DR

PM flagged today's home daily dilemma as incomprehensible. Audit of the next 10 home dilemmas (via `scripts/audit-home-daily-pool.mjs`, new in this session) found 5/10 missing personal stake, 2/10 wordy without visible decision verb. Sprint added 3 SAFETY_RULES to AI generation prompt + 3 matching soft warnings to quality gates + 9 vitest cases. Re-running the audit after the changes: detection went **1/10 → 8/10 flagged**, with the 2 correctly-clean dilemmas containing legitimate "you" + decision verb.

### Files changed (committed, pushed in this session)

| File | Commit | Change |
|---|---|---|
| `lib/content-generation-prompts.ts` | `d39ea03` | Added 3 SAFETY_RULES after the existing referendum-framing rule: (1) Personal-stake required — voter must appear via 2nd person ("you/your/yourself" / "tu/tuo/tua/tuoi/tue/ti"). Unacceptable: "Should the justice system X?", "Is it right when a nation Y?". (2) Punchy options — 7-14 words each, lead with imperative/first-person commitment, separated by a period. (3) Visible decision verb — question must end with "?" or close with "Would you...", "Lo faresti?", "Cosa scegli?", "Accetti...?". |
| `lib/content-quality-gates.ts` | `d39ea03` | Added 2 new regexes (`PERSONAL_STAKE_RE` for 2nd-person pronouns EN+IT, `DECISION_VERB_RE` for the close verbs) + a `countWords()` helper + a new warning block in `runQualityGates`: `missing_personal_stake`, `wordy_setup_question` (qWords > 28 AND no decision verb), `wordy_option:option{A,B}` (each > 22 words). Moral-only, lifestyle exempt. NOT suppressed by `EDITORIAL_TRADEOFF_MARKERS_RE` (these are about structure, not content). |
| `tests/unit/content-quality-gates.test.ts` | `d39ea03` | Added a new `describe` block with 9 cases: missing-stake fires on policy-referendum framing, suppressed by "your"/"tu"/"tuo"; wordy_setup_question fires above 28 words + no decision verb, suppressed by a closing decision verb; wordy_option:optionA/optionB fire above 22 words; lifestyle exempt; warnings never block `passed=true`. Test count 122 → 139. |
| `scripts/audit-home-daily-pool.mjs` (new, 215 LOC) | `db6bd91` | Read-only audit. Replicates `app/page.tsx::HomePage` ordering — `[...uniqueDynamicEn, ...staticEn]` with `floor(Date.now() / 86_400_000) % poolLength` — and prints the next 10 dilemmas the EN home will serve, each with editorial-shape + punchy-framing warnings via duplicated regexes. |
| `reports/home-daily-pool-audit-2026-05-26.md` | `db6bd91` | First run. Pool: 172 unique-dynamic + 41 static = 213. Today's id: `ai-en-to-save-your-future-ch-octds`. Detection 8/10 flagged after the new gates landed. |

### Verification

- `npm run typecheck` ✅ green
- `npm run build` ✅ green
- `npm run test` ✅ 139/139 (was 130; +9 new cases)
- `git diff --check` ✅ exit 0
- `git push origin main` ✅ remote HEAD `db6bd91`

### Hard constraints preserved

- No autopublish change.
- No `lib/content-generation-prompts.ts` change beyond the 3 SAFETY_RULES (no prompt-engineering of the JSON schema, no rationale-field changes).
- No Redis / Supabase / Stripe / legal / middleware changes.
- Pixie WIP files untouched.
- Lifestyle still exempt from all moral-dilemma soft warnings via the existing `if (!isLifestyle)` block.

### PM-side follow-ups

- (1–2 days) Verify the next cron run produces noticeably-punchier dilemmas — re-run `node scripts/audit-home-daily-pool.mjs` mid-week and confirm detection rate is dropping below 80% as the AI internalises the new rules.
- (4–6 weeks) GSC re-export with broader date range to validate cornerstone work (`/blog/loyalty-vs-honesty-when-they-collide` + `/blog/moral-dilemmas-examples` and IT mirrors).

---

## 0d. Session 26 May 2026 (morning) — `SEO-MORAL-DILEMMAS-EXAMPLES-CORNERSTONE-01`

### TL;DR

Continuation of yesterday's loyalty/honesty cornerstone work. Promoted EN article `moral-dilemmas-examples` + IT mirror `dilemmi-morali-esempi` to cornerstone-shape: `dateModified: 2026-05-26`, `readingTime: 8`, added `faq:` field (5 Q&A EN + 5 Q&A IT), added visible "Frequently asked questions" / "Domande frequenti" H2 section mirroring the FAQ exactly (FAQPage JSON-LD Google-policy compliant). EN/IT structural parity preserved. Verification: typecheck ✅, build ✅ (213 routes prerender), `git diff --check` ✅. Pushed as `a59a0eb`.

### Files changed (committed + pushed)

| File | Commit | Change |
|---|---|---|
| `lib/blog.ts` | `a59a0eb` | EN article `moral-dilemmas-examples` (line ~1295-1660 approx after edits): added `dateModified`, bumped `readingTime`, added `faq:` array with 5 Q&A ("What is a moral dilemma?", "What are some real-life examples...", "What is the most famous moral dilemma?", "Are moral dilemmas only philosophical thought experiments?", "Why do people answer moral dilemmas so differently?"), inserted visible H2 "Frequently asked questions" + 5×(H3+P) before final closing CTAs. IT mirror `dilemmi-morali-esempi` (line ~4900+ after edits) gets the same structure with natural Italian (not literal translations): "Cos'è un dilemma morale?", "Quali sono esempi reali...", "Qual è il dilemma morale più famoso?", "I dilemmi morali sono solo esperimenti filosofici?", "Perché le persone rispondono ai dilemmi morali in modo così diverso?". |
| `CURRENT_HANDOFF.md` + `ROADMAP.md` | `f3f04ec` (docs sync) | Closed 25 May cornerstone + push session. |

### Verification

- `npm run typecheck` ✅
- `npm run build` ✅ (all routes prerender)
- `git push origin main` ✅ remote HEAD before this session ended at `db6bd91`

---

## 0e. Session 25 May 2026 (evening) — Loyalty/Honesty cornerstone + push to origin/main

### TL;DR

Final day-arc: promoted EN article `loyalty-vs-honesty-when-they-collide` + IT mirror `lealta-vs-onesta-quando-si-scontrano` to cornerstone-shape per `SPRINT: SEO-LOYALTY-HONESTY-CORNERSTONE-01`. Then pushed all 4 day's commits to `origin/main` (`30fe2ac`, `1f0bc39`, `1d9a6c2`, `26e21a3`). Vercel auto-deploy triggered. Two reusable skills written to user-level `~/.claude/skills/` for cross-session reuse. PM ended day; resumes tomorrow with `compass`.

### Cornerstone changes (`26e21a3`)

`lib/blog.ts` — both EN + IT loyalty/honesty articles:

- Set `dateModified: '2026-05-25'`, `readingTime: 9` (was 5)
- Expanded `faq:` from 3 → 5 Q&A (both articles)
- Inserted 4 new H2 sections after intro: (1) definition + distinction, (2) real-life examples — 4 scenes, (3) why the conflict is hard, (4) what your answer reveals
- Added internal CTA to `/personality` (EN) / `/it/personality` (IT)
- Added **visible FAQ section** (H2 + 5×(H3+P)) before final cross-link CTAs — mirrors `faq:` exactly so FAQPage JSON-LD is policy-compliant (Google: structured data must reflect visible content)

IT FAQ ordering tuned for exact GSC match on `lealtà vs onestà` (Q1: "Qual è la differenza tra lealtà e onestà?" — order swap from previous version).

EN/IT structural parity: identical section count, identical FAQ count, natural Italian (not literal translations).

### Skills shipped (cross-session reuse, user-level)

- `~/.claude/skills/splitvote-compass/` — 4 modes: default Compass (5-section orient), Polish (UI/UX quality bar), Audit (correctness/robustness/security), Release (pre-flight + GO/NO-GO).
- `~/.claude/skills/splitvote-growth/` — 7 modes (each with reference file): `audit-seo`, `blog-portfolio-audit`, `content-expansion`, `reddit-intel`, `geo-readiness`, `monetization-safety`, `scenario-intel`. Complements agents `seo-content-reviewer` + `blog-seo-editor`; does not duplicate. Triggers documented in each mode.

These are NOT in the repo (user-level skills directory). They survive across sessions / projects but are not versioned via git.

### Push outcome

```
git push origin main
# pushed 4 commits: 30fe2ac → 1f0bc39 → 1d9a6c2 → 26e21a3
# remote HEAD: 26e21a3
# Vercel auto-deploy triggered
```

3 Pixie WIP files explicitly kept out of the push (per PM instruction):
- `scripts/generate-pixie-assets.mjs` (modified)
- `scripts/generate-pixie-emoji-assets.py` (untracked)
- `scripts/normalize-pixie-assets.py` (untracked)

### Verification

- `npm run typecheck` ✅ green
- `npm run build` ✅ green (all routes prerender)
- `git diff --check` ✅ exit 0
- `git log origin/main..HEAD` → empty (in sync)

### Hard constraints preserved

- No auth/Stripe/Redis/Supabase changes.
- No AdSense / GA4 / legal / Cookie Mode changes.
- No `lib/content-generation-prompts.ts` / `lib/content-quality-gates.ts` changes (still at `30fe2ac`).
- No static-scenario rewrites.
- No `AUTO_PUBLISH_DILEMMAS` change.
- No admin UI change.
- Pixie WIP files untouched.

### PM-side follow-ups (post-deploy)

- [ ] Verify Vercel deploy `26e21a3` reached `live` state
- [ ] Smoke test both cornerstone URLs return 200 + contain new sections + FAQPage JSON-LD
- [ ] Google Rich Results Test on both URLs (FAQPage structured data validation)
- [ ] GSC → Request Indexing on both URLs
- [ ] (4–6 weeks) GSC re-export with "Last 28 days" or "Last 3 months" range — current audit used "Last 7 days" only (directional, not statistical)

### Next session — recommended

Resume with `compass`. Most likely next move (PM to confirm):

1. **Cornerstone moral-dilemmas-examples (EN+IT)** — same pattern as loyalty/honesty, applied to a pair already at cornerstone-shape (28 p blocks, 10-13 internal links, 6 related). Missing only visible FAQ + answer-first card.
2. (Alternative) Batch FAQ-add on 15-18 articles classified `improve` in `reports/blog-portfolio-audit-2026-05-25.md`.
3. (Alternative) `DILEMMA-EDITORIAL-WARNINGS-REGEX-TUNING-01` — tighten regexes to drop FP rate ≤ 25%.

---

## 0a. Session 25 May 2026 (afternoon) — Editorial-warnings dry-run against production pool

### TL;DR

Read-only audit per `SPRINT: DYNAMIC-DILEMMA-EDITORIAL-WARNINGS-DRYRUN-01`. Built `scripts/audit-editorial-warnings.mjs` that fetches `dynamic:scenarios` + `dynamic:drafts` from Upstash via REST GET, runs the four editorial-shape regexes from `30fe2ac` against each dilemma, and emits a per-warning breakdown + top-20 flagged tables. No Redis writes, no admin actions, no save-mode change. Findings in `reports/dynamic-dilemma-editorial-warnings-dryrun-2026-05-25.md` (+ `.json` sidecar).

### Numbers

| Pool | Total | Moral | Lifestyle | Flagged (moral) | Flag rate |
|---|---:|---:|---:|---:|---:|
| Approved | 346 | 324 | 22 | 34 | **10.5%** |
| Drafts | 53 | 53 | 0 | 10 | **18.9%** |

Tradeoff-marker suppressor was effective: 34 approved moral items contained an explicit cost marker and were silently passed (would otherwise have been candidates for warnings).

### Manual triage — top 30 flagged

- Strong TP: 5 (~17%)
- TP / borderline TP: 11 (~37%)
- FP / borderline FP: **14 (~46%)**

Loudest FP patterns:

1. `SUPPORT_OPPOSE_RE` matches **nouns** (`the ban`, `support forum`, `approve` in medical context, `limits`) — ~50% of FPs.
2. `EDITORIAL_TRADEOFF_MARKERS_RE` misses **IT conditional verbs** (`ma penalizzerebbe`, `ma priverebbe`, `ma ridurrebbe`) — ~25% of FPs.
3. `UNDEFINED_ACTOR_RE` matches `gli altri` used **personally** (`verso gli altri` = "to other people") — ~10% of FPs.
4. `UNDEFINED_ACTION_RE` matches **noun forms** (`limiti d'età`, `ridurre` in option phrases) — ~10% of FPs.

### Recommendation

**Keep the four checks as advisory warnings. Do NOT escalate to hard rejection.** Queue two follow-up sprints:

1. **`DILEMMA-EDITORIAL-WARNINGS-REGEX-TUNING-01`** — single-file edit on `lib/content-quality-gates.ts` + new vitest cases. Expand suppressor with IT conditional forms + "rischiare" infinitive. Tighten `SUPPORT_OPPOSE_RE` / `UNDEFINED_ACTION_RE` to verb position. Drop `gli altri` from `UNDEFINED_ACTOR_RE` (or add negative-lookbehind). Re-run dry-run; target FP ≤ 25%, TP ≥ 75%.
2. **`ADMIN-UI-EDITORIAL-WARNING-SURFACE-01`** — when admin review UI is touched next, render the four codes with distinctive copy + matched trigger token so human reviewers can verdict TP/FP in <5s per item.

Explicitly NOT scheduled:

- Bulk retroactive rewrite of the 34 flagged approved dilemmas. Too many FPs. If approved, hand-pick the 5 strong-TP rows only (`DILEMMA-EDITORIAL-REWRITE-FROM-DRYRUN-01`, separate sprint).
- Hard rejection escalation until the tuning sprint + dry-run re-run confirm acceptable FP rate.
- Any change to `lib/content-generation-prompts.ts`. The 25 May `SAFETY_RULES` additions are fine; future generations should already be lower-noise.

### Files produced / changed

- `scripts/audit-editorial-warnings.mjs` (new, local-only, no `package.json` script entry — keeps it from being mistaken for a routine job)
- `reports/dynamic-dilemma-editorial-warnings-dryrun-2026-05-25.md` (new, full report + triage)
- `reports/dynamic-dilemma-editorial-warnings-dryrun-2026-05-25.json` (new, machine-readable sidecar)
- `ROADMAP.md` (closeout block appended to the 25 May entry; two queued follow-ups documented)
- `CURRENT_HANDOFF.md` (this section)

### Verification

- `npm run typecheck` ✅ green (no TS source touched)
- `git diff --check` ✅ exit 0
- Script run output (captured in this session log):
  - `approved=346 drafts=53`
  - `approved flag rate (moral only): 10.5% (34/324)`
  - `draft flag rate (moral only):    18.9% (10/53)`
  - `tradeoff-marker suppressed (approved moral): 34`

### Hard constraints preserved

- No Redis write (script only does REST GET on two keys).
- No admin approve / reject / publish action.
- No `AUTO_PUBLISH_DILEMMAS` change.
- No `lib/content-quality-gates.ts` change (still at `30fe2ac`).
- No `lib/content-generation-prompts.ts` change.
- No static-scenario rewrites.
- No admin UI change.
- No legal / Stripe / auth / middleware change.
- No `git push`, no deploy.

### How to re-run later

```bash
nvm use
node scripts/audit-editorial-warnings.mjs
```

Outputs land in `reports/dynamic-dilemma-editorial-warnings-dryrun-<YYYY-MM-DD>.{md,json}`. Re-run after `DILEMMA-EDITORIAL-WARNINGS-REGEX-TUNING-01` to confirm FP rate dropped.

---

## 0b. Session 25 May 2026 (morning) — Dilemma Editorial Shape Gate

### TL;DR

PM trigger: Matteo flagged the generated IT dilemma "Se un Paese rifiuta regole sull'AI, gli altri dovrebbero rallentare comunque?" as boring yes/no policy polling, not the conflict-shaped tradeoff SplitVote promises. Editorial audit (`reports/dilemma-editorial-audit-2026-05-25.md`) named the failure pattern (topic-as-question + undefined collective actor + undefined action verb + no cost on either side) and prescribed a narrow gate sprint. Sprint executed per `SPRINT: DILEMMA-EDITORIAL-SHAPE-GATE-01`.

### Files changed (local, uncommitted)

- `lib/content-generation-prompts.ts` — added two `SAFETY_RULES` items (conflict-shaped dilemma framing + avoid vague referendum framing) and strengthened the `rationale` field requirement to name the value collision.
- `lib/content-quality-gates.ts` — added 5 regexes (`EDITORIAL_TRADEOFF_MARKERS_RE`, `ABSTRACT_POLICY_RE`, `SUPPORT_OPPOSE_RE`, `UNDEFINED_ACTOR_RE`, `UNDEFINED_ACTION_RE`) and a new block inside `runQualityGates` that emits four moral-only soft warnings, suppressed when an explicit tradeoff marker is present in the question.
- `tests/unit/content-quality-gates.test.ts` — added a new `describe` block with 8 cases covering the weak/strong IT and EN samples, lifestyle exemption, advisory-only behavior, and the explicit-tradeoff suppression path.
- `ROADMAP.md` — new 25 May 2026 entry above the 24 May section.
- `CURRENT_HANDOFF.md` — this section.

### Warnings added (4)

| Code | Fires when (in the question, moral only, no tradeoff marker present) |
|---|---|
| `abstract_policy_question` | Referendum-style framing: "should governments / countries / society / we ban|allow|...", "dovrebbero i Paesi / la società / si dovrebbe vietare|permettere|...". |
| `support_oppose_framing` | Policy-poll verbs: support, oppose, endorse, reject, approve, disapprove, ban, allow, regulate, permit, prohibit + IT equivalents (sostenere, opporsi, vietare, permettere, regolare, ...). |
| `undefined_collective_actor` | Broad noun actors with no concrete identity: countries / governments / society / the others / the state / the platform + IT (un Paese, i Paesi, gli altri, il governo, lo Stato, la società, le aziende, ...). |
| `undefined_action_verb` | Vague action verbs with no concrete object/cost: slow / restrict / limit / curb / throttle + IT (rallentare, limitare, restringere, ridurre, frenare, ...). |

### Suppressor (single regex, all four warnings)

`EDITORIAL_TRADEOFF_MARKERS_RE` matches one of:
- EN comparative-risk / explicit-cost phrasing: "even if", "even though", "knowing that", "at the cost of", "in exchange for", "in return for", "risking", "more dangerous/harmful/risky/costly", "which cost/risk/danger/harm/injustice/tradeoff/side do you accept", "but doubles|halves|raises|lowers|costs|penalizes|harms|sacrifices|cuts|locks out|leaves out|forces".
- IT equivalents: "anche se", "sapendo che", "al costo di", "rischiando", "in cambio di", "più pericoloso/dannoso/rischioso/grave/costoso/doloroso/ingiusto", "quale costo/rischio/ingiustizia/pericolo/danno/tradeoff/lato accetti", "ma raddoppia|penalizza|danneggia|costa|costringe|sacrifica|aumenta|riduce|toglie|esclude", "pur proteggendo|salvando|riducendo|aumentando|garantendo|dando", "nonostante".

Bare conjunctions ("ma", "but", "or") are intentionally NOT suppressors — too common in natural sentences.

### Before / after examples

#### IT — weak (warns)
- Question: "Se un Paese rifiuta regole sull'AI, gli altri dovrebbero rallentare comunque?"
- Fires: `undefined_collective_actor` (un Paese, gli altri) + `undefined_action_verb` (rallentare).
- `passed` stays `true` (advisory only).

#### IT — strong (does NOT warn)
- Question: "È più pericoloso sviluppare l'AI senza regole o lasciare che lo facciano solo i Paesi che ignorano le regole?"
- Suppressor: "più pericoloso" matches `EDITORIAL_TRADEOFF_MARKERS_RE`.
- Editorial-shape warnings array: `[]`.

#### EN — weak (warns)
- Question: "Should countries slow AI development if another country ignores AI rules?"
- Fires: `abstract_policy_question` ("should countries") + `undefined_collective_actor` (countries) + `undefined_action_verb` (slow).

#### EN — explicit tradeoff (does NOT warn)
- Question: "A foreign-owned app is a real security risk, but banning it hands the state the power to close any platform later — which cost do you accept?"
- Suppressor: "which cost do you accept" matches.
- Editorial-shape warnings array: `[]`.

#### Lifestyle — exempt regardless of surface tokens
- Question: "Coffee or tea? Should countries ban one of them?"
- `dilemmaStyle === 'lifestyle'` → entire moral-only block skipped, no editorial warnings fire.

### Verification

- `npm run typecheck` ✅ green
- `npm run build` ✅ green (all 41 static play/results routes prerender)
- `npx vitest run tests/unit/content-quality-gates.test.ts` ✅ 21/21 passing (was 13)
- `git diff --check` ✅ exit 0

### Hard constraints preserved

- No `AUTO_PUBLISH_DILEMMAS` behavior change. New warnings are advisory only; the `reasons` array is unchanged for all existing inputs; existing `passed=true` results stay `passed=true`.
- No Redis write, no Supabase migration, no auth change, no Stripe/webhook/entitlement change.
- No legal / cookie / analytics surface touched. No `LEGAL.md` update needed (no new data flows, no new tracking).
- No static-scenario rewrites. `lib/scenarios.ts` and `lib/scenarios-it.ts` untouched in this sprint.
- No admin UI change; the new codes surface via the same warnings array as `moral_option_bare_yes_no` and `magic_stipulation_in_question`.
- No `git push`, no deploy. PM WIP in the working tree (3 Pixie tooling entries) remains untouched.

### Residual risk / false-positive notes

- The four heuristic regexes are surface-only; they will produce false positives when a moral dilemma legitimately discusses policy without using an explicit tradeoff marker. The audit's recommendation stands: keep them as warnings (not reasons) until a dry-run against the live dynamic pool shows the signal is clean.
- "gli altri" is caught by `undefined_collective_actor` but not by `abstract_policy_question` (which requires a more specific noun like "i Paesi" / "la società"). Intentional: the broader actor check is what triggers on the canonical weak case.
- `EDITORIAL_TRADEOFF_MARKERS_RE` deliberately requires a comparative-risk phrase OR a cost-introducing connector followed by a real cost verb. Bare conjunctions are not enough.
- Admin review UI does not yet render distinctive copy for the four new codes; they appear in the same generic "warnings" list as the existing depth warnings until a separate PM-approved UI sprint.

### Recommended next-session priorities

1. **PM commit + push approval** for this sprint's diff once visual review of the new warning copy / prompt addition is OK. No production behavior changes; safe to bundle with the existing 5 queued 24 May commits or to ship standalone.
2. **Dry-run the new warnings against the existing approved dynamic pool** (read-only) to measure false-positive rate before any future hard-rejection escalation. Output: report only.
3. **Admin review UI**: surface the four new codes with distinctive copy (separate PM-approved UI sprint).
4. Existing recommended priorities from the 24 May session remain valid (see §0 below): PM visual QA on the 5 queued commits, `SEO-IT-FAQ-JSONLD-MIGRATION-01` (already shipped 24 May, can be closed in handoff), `BEHAVIORAL-INSIGHTS-DERIVATION-READONLY-01`.

### Items intentionally NOT scheduled

- Hard rejection (vs. soft warning) on the four new editorial-shape patterns — defer until dry-run.
- Retroactive rewrite of existing dynamic-pool dilemmas that would now warn — separate PM-approved sprint (touches Redis content).
- `moralAxis` JSON field on AI output — depth-audit recommendation, still out of scope.

---

## 0a. Session 24 May 2026 — Home declutter + dilemma quality recovery (5 phases)

### TL;DR

- **Home declutter** (EN + IT): single 4-card "Pick your next" / "Per te" continuation section replaces the wall of 3–5 mutually-exclusive card sections plus the full `DilemmaGrid` Browse-All / Tutti i dilemmi grid. EN and IT now structurally identical. DailyDilemma is the focal moment as intended by the disciplined-neon spec.
- **Dilemma rewrites**: 5 weak EN entries (`lifeboat`, `revenge-vs-forgiveness`, `delete-social-media`, `ai-replaces-jobs`, `tax-billionaires`) + 6 IT entries (same five + `rich-or-fair` PM-preferred phrasing) rewritten per `reports/dilemma-depth-audit-2026-05-19.md`. The other 5 of the audit's 10-list were already in target state from earlier sprints. Same IDs, same categories. Natural Italian.
- **Quality gate soft warnings**: `runQualityGates` now emits `moral_option_bare_yes_no:option{A,B}` and `magic_stipulation_in_question` on AI-generated drafts. Lifestyle exempt by design. SAFETY_RULES in the AI prompt extended with matching instructions. New test file with 13 vitest cases.
- **Card quietening**: DilemmaCard vote count gated at ≥50 votes (was `>0`). Badges already capped at one slot via single `badge` prop.
- **Docs**: ROADMAP entry for 24 May, this CURRENT_HANDOFF block, and `docs/redesign/disciplined-neon-spec.md` §10 "Home density discipline" capturing the new rule.

### Working state at this closeout

- **Branch:** `main`, **5 commits ahead** of `origin/main`. No push yet — awaits PM GO.
- **Working tree:** same 3 pre-existing Pixie tooling entries (`scripts/generate-pixie-assets.mjs` modified, `scripts/generate-pixie-emoji-assets.py` + `scripts/normalize-pixie-assets.py` untracked). Untouched throughout the session.
- **Verification:** `npm run typecheck` ✅, `npm run build` ✅, `npm run test` ✅ (122 passing; was 109 before this sprint), `git diff --check` ✅ exit 0.
- **PM-side visual QA pending** at 375 / 393 / 768 / 1024 px on `/` and `/it`.

### Commits queued (5)

| Commit | Title |
|---|---|
| `2e266d9` | content(dilemmas): rewrite weakest moral dilemmas (EN+IT) |
| `1f4f02e` | content(gates): warn on moral yes/no and magic stipulations |
| `a616ba5` | style(card): show vote count only above 50-vote social-proof floor |
| `528bcb3` | style(home): declutter to single 4-card continuation section |
| (this commit, docs) | docs(handoff): close 24 May home declutter session |

### Hard constraints preserved (verified)

- No new analytics events. No `user_events` writes added. No reveal-reaction tracking. No grace-undo tracking.
- No Supabase migration. No Redis write. No autopublish / save-mode behavior change.
- `LEGAL.md` untouched (no new processors, no new cookies, no new data fields).
- No `git push`. No deploy.

### Recommended next-session priorities

1. **PM-side visual QA** of the 5 queued commits at 375 / 393 / 768 / 1024 px on `/` and `/it`. If PM approves, run the GO push.
2. **`SEO-IT-FAQ-JSONLD-MIGRATION-01`** — tiny follow-up to add `FAQPage` JSON-LD to `/it/faq/page.tsx` (the IT home FAQ JSON-LD was removed because the visible accordion was removed; `/it/faq` still carries the full content as `<details>`).
3. **`BEHAVIORAL-INSIGHTS-DERIVATION-READONLY-01`** — queued by PM, not started. Reports only. Live Supabase SELECT not approved by default; needs explicit data-source decision.
4. **`POST-SHIP-VISUAL-QA-FOLLOWUP-01`** — only if PM smoke on home declutter surfaces issues.
5. **`PIXIE-TOOLING-FINAL-CLEANUP-01`** — close the 3 dirty Pixie WIP entries.

### Items intentionally NOT scheduled

- Hard rejection (vs. soft warning) on the new quality-gate patterns — defer until dry-run confirms low false-positive rate against the existing dynamic pool.
- `moralAxis` JSON field requirement on AI output — depth audit recommendation but out of this sprint's scope.
- Per-dilemma `expertInsight` overrides for the static-41 — separate content sprint.

---

## 0a. Session 22 May 2026 — Redis recovery, snapshot cron, home redesign, IT copy polish, SEO backlog

### TL;DR

- **Redis vote-count incident** (morning) — triaged, reconstructed from max-of-three-sources (Redis live, dilemma_votes Supabase rows, daily aggregate fallback). Never downgrades a field. Procedure executed and verified. Incident log: `reports/incidents/redis-vote-count-incident-2026-05-22.md`.
- **Daily Redis snapshot cron** shipped (`4a65dd9`) and first **manual** run verified (`dd0a0ce`). `votes:*` keys snapshotted to private Supabase Storage `redis-snapshots/votes/<date>.json` + `votes/latest.json` at 05:00 UTC daily. First-run values logged in `reports/redis-snapshot-runbook.md` §11. `keyCount=136`, `totalVotes=219`, `durationMs=764`. Disaster-recovery runbook §8 mitigation box ticked.
- **Home + DailyDilemma disciplined-neon redesign** shipped across multiple commits (spec → S1 home → DailyDilemma hero card → orb cleanup → DESIGN.md update). Two ambient orbs only (red-pink + blue); purple and cyan removed site-wide.
- **Results reveal hero amplification** (`12378d8`) — reveal banner promoted above question recap; question recap downsized only when banner present; tie-state amplified with neon-glow-purple; isolated-minority copy split out.
- **Italian copy + a11y polish** — DailyDilemma label naturalized (`scopri da che parte stai`); dilemma-card emoji marked `aria-hidden`; share button raised to 44 px tap target; first natural-Italian batch of 12 strings (personality teaser, expert insight CTA, anon-track-your-choices, isolated minority, reveal pulse, DailyDilemma CTA, vote-change affordance, grace hint).
- **SEO goldmine + governance** — recorded in `ROADMAP.md` Future Backlog only. No agents, scripts, cron, or content created. No DB writes.

### Working state at this closeout

- **Branch:** `main`, aligned with `origin/main` at `16577b5`.
- **Working tree:** exactly 3 pre-existing Pixie tooling entries (`scripts/generate-pixie-assets.mjs` modified, `scripts/generate-pixie-emoji-assets.py` + `scripts/normalize-pixie-assets.py` untracked). Untouched throughout the session. Same three entries that have persisted across multiple recent sessions.
- **Build/typecheck/test** all green at last verification (`f00415c` was the last code-touching commit; subsequent commits were docs-only).

### Recommended next-session priorities

1. **`POST-SHIP-VISUAL-QA-FOLLOWUP-01`** — only if PM-side smoke at 375/393/768/1024 widths surfaces issues from today's home/DailyDilemma redesign or reveal hero amplification. Read-only otherwise.
2. **`PIXIE-TOOLING-FINAL-CLEANUP-01`** — close the 3 dirty Pixie WIP entries (commit, delete, or move to a long-running branch). Removes persistent working-tree noise.
3. **`REDIS-SNAPSHOT-FIRST-SCHEDULED-RUN-CHECK-01`** — read-only post-05:00-UTC check that the first **scheduled** (not manual) snapshot landed. Confirms `votes/<date>.json` and `votes/latest.json` were written in the right window. Just dashboard + curl inspection.
4. **`DILEMMA-CARD-VISUAL-AUDIT` follow-up** — only if PM finds card visuals still feel flat next to the redesigned DailyDilemma. Audit completed today recommended scope B (a11y polish only); scope C/D explicitly deferred and remain available.

### Items intentionally NOT scheduled

- `SEO-GOLDMINE-KEYWORD-AUDIT-01` and `SEO-GOVERNANCE-FOUNDATION-01` — recorded in `ROADMAP.md` Future Backlog. Do not start either without a PM scoping sprint first. Auto-publish is HUMAN_ONLY per `CLAUDE.md`.
- Full Upstash automatic backups — separate from today's app-level snapshot. Still TBD in `LAUNCH_AUDIT.md → Disaster Recovery & Backup`.
- EN copy voice polish — `SITE-COPY-VOICE-AUDIT-EN-IT-01` flagged low-severity EN candidates (C13, C14, C17, C20). Deferred until the IT batch settles in production.

---

## 0. Session 21 May 2026 (afternoon update) — PM override: AdSense not a blocker; reveal loop prioritized

### PM directive (afternoon)

**AdSense review is no longer a product freeze constraint.** Product development and launch iteration continue. If a public change is desirable for the product and passes normal QA, it ships. AdSense-specific files (`<AdSlot>` gating, `public/ads.txt`, `app/layout.tsx` AdSense loader, Consent Mode v2 signals) still get extra care, but they are not a roadmap blocker. If AdSense rejects the site post-change, the site can be resubmitted later.

The morning's "freeze ruleset" (see §0a below) is **superseded**. Treat it as historical context, not as a current constraint.

### PM product insight (afternoon)

The SplitVote loop people respond to is **not** the vote itself. The vote is the trigger. The product hook is the **post-vote reveal** — seeing whether the user is in the majority, the minority, on a near-even split, or against a landslide. This is social comparison, self-positioning, and identity interpretation, not polling. Already encoded in `DESIGN.md → Visual / Brand Voice`:
> "Post-vote: immediately show how you compare to the world (minority/majority banner, result bars)"
> "Reveal the split / Scopri il risultato — CTA copy emphasizes the social reveal, not just 'vote'"

Architecture already supports it: 6-state `revealState` enum (`low_sample | tie | close | minority | landslide | majority`) lives at `app/results/[id]/ResultsClientPage.tsx:371-381`, shipped 20 May (`1384296`). EN+IT copy strings for each state exist at `:47-55` (EN) and `:125-133` (IT). Reveal-state events are instrumented in 14 GA4 sites. The system is there; what's missing is the **copy is functional but not yet emotionally sharp enough** to make the user think "yeah — this is what I came here for."

### Next sprint — top candidate

**`REVEAL-SELF-POSITIONING-COPY-01`** — sharpen the 5 reveal desc strings (EN + IT, parity) to lean harder into self-positioning identity language. Implementation prompt below in §Recommended implementation prompt. Single file (`app/results/[id]/ResultsClientPage.tsx`), copy-only, no schema/route/analytics change. ~20-30 LOC. Risk: low — the same surface was tuned 8 days ago in `8638c96` with no regressions.

### Working state at this update

- **Branch**: `main`, aligned with `origin/main` after this commit pushes.
- **Working tree**: 73 modified + 5 untracked (the new draft `docs/dilemma-quality-rubric.md` is sitting locally, see §Rubric draft status below) = 78 dirty entries.

### Rubric draft status

`docs/dilemma-quality-rubric.md` (250 LOC, 18.9 KB) was drafted earlier today per `DILEMMA-QUALITY-RUBRIC-DRAFT-ONLY-01`. It defines a 6-axis editorial scoring framework (divisiveness, identity_relevance, moral_tension, ambiguity, curiosity_potential, emotional_weight) for human admin review of dilemma drafts. Explicitly internal-only, not an auto-publish gate, not a public claim. **Awaiting PM review** before commit. Not bundled into the afternoon override commit to keep concerns separate.

### Reframed SEO backlog (no longer "frozen")

The 3 sprints captured in §0a remain valid as **prioritizable backlog**, no longer freeze-gated:

| # | Sprint | Locale | Notes |
|---|---|---|---|
| A | `SEO-IT-LEALTA-ONESTA-DIFFERENZE-FAQ-01` | IT | Top SEO ship — add IT FAQ Q&A on `lealta-vs-onesta` blog. ~15 LOC. |
| B | `SEO-LOYALTY-HONESTY-SNIPPET-TUNE-01` | EN | Meta + intro phrasing tune on `loyalty-vs-honesty-when-they-collide`. ~5 LOC. |
| C | `SEO-TROLLEY-FOOTBRIDGE-STATS-META-01` | EN | Meta description tune on `trolley-problem-statistics`. ~2 LOC. |

PM priority order (afternoon directive): the **reveal-loop sprint comes first**, since it strengthens the core product hook. The SEO sprints follow. If AdSense recrawl happens during any of these ships, that's accepted risk per the new PM directive.

### Recommended implementation prompt (REVEAL-SELF-POSITIONING-COPY-01)

See the implementation prompt provided alongside this docs commit in the agent's final report.

---

## 0a. Session 21 May 2026 (morning) — AdSense review submitted + WIP triage + GSC SEO backlog

> **Note (afternoon update, 21 May 2026):** the freeze framing in this section was **superseded** by the PM override above (§0). Kept here for historical context. Treat the freeze rules below as the morning posture, not as current policy.

### Status

- **AdSense review**: submitted earlier today. **Morning posture was to treat this as a freeze of public-surface changes; superseded by the afternoon PM override (§0). Kept here as historical context only.**
- **Branch**: `main @ a7edae6`, aligned with `origin/main`.
- **Working tree**: 73 modified + 4 untracked = 77 dirty entries. All remaining items are PM-decision clusters (Pixie pipeline G2+G3+tooling; admin content-pipeline script).

### Ships earlier today (pushed, no public behavior change)

| Commit | Title |
|---|---|
| `4d170b8` | chore(repo): ignore local workspace artifacts |
| `09a454c` | feat(content): add clarity guard for generated drafts (admin/cron path only — stricter gate, no new public surface) |
| `c3945a9` | docs(governance): add Codex agent guide |
| `6e08252` | docs(reports): backfill recent audit artifacts |
| `a7edae6` | docs(product): update strategy for emotional recognition loop |

Verified: each diff is internal/docs/build-hygiene only. Zero AdSlot/cookie/analytics/sitemap/robots/legal/UI files touched. The associated Vercel rebuilds carry no user-perceptible change.

### AdSense review freeze rules (morning posture — superseded by §0)

> The list below was the morning's proposed freeze ruleset. **Superseded** by the afternoon PM override. Kept verbatim for transparency about the morning's reasoning. Do not apply as current policy.

The morning sprint proposed that, while review was in progress, the following should NOT change:
- `<AdSlot>` gating logic, AdSense loader (`app/layout.tsx`), `public/ads.txt`.
- `hasStaticInsight` predicate (`lib/static-insights.ts`) and its consumers on `/play/[id]`, `/results/[id]`.
- Robots, sitemap, `/store` + `/it/store` noindex.
- Cookie consent (`components/CookieConsent.tsx`) — Consent Mode v2 default-denied signals.
- Privacy + Terms + About + Editorial pages (EN+IT).
- 41 static dilemma scenarios (`lib/scenarios.ts`, `lib/scenarios-it.ts`).
- Blog content (`lib/blog.ts`) and per-id insights (`lib/static-insights.ts`).
- 72 Pixie PNGs + Pixie pipeline ship (`public/pixie/**`, `scripts/generate-pixie-assets.mjs`).
- Admin content-publish workflow (do not approve drafts that produce new public pages mid-review; do not run `scripts/insert-current-events-drafts.mjs --write`).

Safe during review: admin-only API/dashboard, internal-only docs, reports, tests, build/repo hygiene, read-only audits. Emergency-only (PM GO required): critical security fix, outage fix, demonstrable legal correction.

### GSC query snapshot (21 May 2026)

22 total impressions / 0 clicks across 9 unique queries:

| Query | Imp | Locale | Cluster |
|---|---|---|---|
| split vote | 11 | EN | Brand |
| loyalty and honesty | 3 | EN | Loyalty vs honesty |
| vote split | 2 | EN | Brand |
| trolley problem footbridge variant approval rate | 1 | EN | Trolley stats |
| lealtà e onestà differenze | 1 | IT | Lealtà vs onestà |
| differenza tra onestà e lealtà | 1 | IT | Lealtà vs onestà |
| split the vote | 1 | EN | Brand |
| truth vs loyalty | 1 | EN | Loyalty vs honesty |
| honesty and loyalty | 1 | EN | Loyalty vs honesty |

7 of 9 queries cluster on loyalty/honesty/truth (EN + IT). Existing page-level coverage is strong; gap is at the snippet/FAQ/meta layer — no new URLs proposed. Brand queries (14 imp) are surfacing organically without action.

### SEO backlog (morning section — labels superseded by §0)

> The morning sprint labeled all three sprints below as "Frozen." Per the afternoon PM override (§0), these are **no longer frozen** — they are unblocked backlog ready for prioritization alongside the reveal-loop sprint. The original labels are kept verbatim below for transparency about the morning's framing.

1. **`SEO-IT-LEALTA-ONESTA-DIFFERENZE-FAQ-01`** — priority #1 post-review. Add 3-5 IT FAQ Q&A to the existing `lealta-vs-onesta-quando-le-due-virtu-non-possono-coesistere` blog post answering `differenza tra onestà e lealtà` / `lealtà e onestà differenze` intent verbatim. Single file (`lib/blog.ts`), ~15 LOC, no new URL, no sitemap change. *(Morning label: "Frozen" — now unblocked per §0.)*
2. **`SEO-LOYALTY-HONESTY-SNIPPET-TUNE-01`** — priority #2 post-review. Meta description + intro phrasing tune on `/blog/loyalty-vs-honesty-when-they-collide` to include `loyalty and honesty` / `truth vs loyalty` / `honesty and loyalty` phrasings. ~5 LOC. *(Morning label: "Frozen" — now unblocked per §0.)*
3. **`SEO-TROLLEY-FOOTBRIDGE-STATS-META-01`** — priority #3 post-review. Meta description tune on `/blog/trolley-problem-statistics` for `footbridge variant approval rate` query. ~2 LOC. *(Morning label: "Frozen" — now unblocked per §0.)*

### Recommended next sprint (AdSense-review-safe)

`DILEMMA-QUALITY-RUBRIC-01` — docs-only formalization of the 6-axis quality scoring rubric (divisiveness, identity_relevance, moral_tension, ambiguity, curiosity_potential, emotional_weight) into a new internal doc. ROADMAP backlog item ready. Zero public surface, zero AdSense impact. ~1 h.

Alternatives also safe during review: `PIXIE-PIPELINE-VISUAL-QA-PREP-01` (read-only diff audit, no ship), `LAUNCH-AUDIT-ADSENSE-DELTA-RECONCILE-01` (internal doc update).

After AdSense review concludes, ship `SEO-IT-LEALTA-ONESTA-DIFFERENZE-FAQ-01` first.

### Remaining PM WIP (unchanged from 20 May EOD minus closed items)

73 modified:
- 72 Pixie PNGs (G3 — paired with G2)
- `scripts/generate-pixie-assets.mjs` (G2 — paired with G3)

4 untracked:
- `scripts/generate-pixie-emoji-assets.py` (Pixie pipeline)
- `scripts/normalize-pixie-assets.py` (Pixie pipeline)
- `scripts/slice-pixies.js` (Pixie pipeline)
- `scripts/insert-current-events-drafts.mjs` (admin content tool — bucket B vs C decision, `--write` production-Redis capability)

---

## 0. Session 20 May 2026 — Emotional Recognition Loop + Retention Instrumentation — ✅ SHIPPED

Six commits shipped to `origin/main` today, completing the Emotional Recognition Loop (Phase 1 reveal UX + Phase 2 routing + sticky CTA refactor + home copy alignment) and adding retention-driver instrumentation (Phase 2.5). The GA4 proxy fix from late 19 May (`e185caa`, local-only at that EOD) was the first push of the day.

### Deployed commits on `origin/main` (oldest → newest)

| Commit | Title | What it shipped |
|---|---|---|
| `e185caa` | fix(analytics): remove GA4 first-party proxy to restore visitor geo | GA4 proxy removed — gtag.js loads direct from `googletagmanager.com`. Restores correct geo (IT was 0% in GA4, Vercel showed 59%). Supersedes the "LOCAL COMMIT, NOT PUSHED" status of the 19 May entry below. |
| `8638c96` | feat(results): sharpen post-vote reveal feedback | Phase 1 reveal: shorter EN/IT desc copy, distinct TIE (symmetric red→purple→blue gradient) + LANDSLIDE (green→amber) visuals, bar fill 1000ms → 450ms, percentage opacity reveal 300ms, motion-reduce safe across bars + percentages. |
| `8f93c13` | feat(routing): prefer same-category next dilemmas | Phase 2.1 routing: `getFreshNextScenarioId` now applies soft same-category affinity (threshold ≥ 3 fresh same-cat items, else fallback). Backward-compatible signature; 7 new unit tests in `tests/unit/next-dilemma-affinity.test.ts`. |
| `56dc73e` | fix(results): show sticky next after inline cta scrolls out | Sticky CTA refactor (was sitting as PM WIP for several days): `IntersectionObserver` replaces the timer-only slide-in; sticky bottom bar appears only when the inline Next CTA is off-screen, hides again when it returns. Graceful degradation when IO unavailable. |
| `6e03d14` | copy(home): clarify anonymous vote loop | Home EN/IT hero subtitle + game-loop step 3 now say "Build your moral profile" / "Fai crescere il tuo profilo morale", aligning home framing with the results-page reveal language. |
| `1384296` | feat(analytics): add reveal state to results events | Phase 2.5 instrumentation: enriched 14 existing `track()` sites in `ResultsClientPage.tsx` with `reveal_state` + conditional `reveal_pct_voted` (and `previous_*` variants on `next_dilemma_clicked`). **NO new event names.** NO new processor/cookie/server persistence/consent surface. |

### Vercel deploy

Each push triggered Vercel auto-deploy. Latest deploy `1384296` triggered post-push tonight; expect all six commits live in production within the standard Vercel build window. No deploy failures observed during the day.

### Production smoke (curl-based, pre-push for each)

For `1384296`:
- `/results/trolley?voted=a` HTTP 200; SSR markup contains sticky bar (`fixed bottom-0` + `translate-y-full` initial hidden); Phase 1 markers intact (`duration-[450ms]` × 2, `motion-reduce:transition-none` × 4); AdSlot gate intact (0 `ins.adsbygoogle` on trolley total=12).
- `/results/trolley?voted=b` HTTP 200; MINORITY `border-orange-500/30` class present.
- `/it/results/trolley?voted=a` HTTP 200; IT layout renders.

### Working tree state at EOD

`main @ 1384296`, aligned with `origin/main`. Staged area: empty.

**PM WIP still in working tree (untouched today):**
- `PRODUCT_STRATEGY.md`
- `lib/content-generation-prompts.ts`
- `lib/content-generation-validate.ts`
- `lib/content-quality-gates.ts`
- ~70 Pixie PNGs under `public/pixie/**`
- `scripts/generate-pixie-assets.mjs`

**Untracked files (14):** `.claude/worktrees/`, `.idea/`, `.vercelignore`, `AGENTS.md`, `Pixie.tsx`, four dated `reports/*.md`, three `scripts/blog-drafts-input/` + `scripts/current-events-drafts-input/` JSON files, `scripts/generate-pixie-emoji-assets.py`, `scripts/generate-placeholders.js`, `scripts/insert-current-events-drafts.mjs`, `scripts/normalize-pixie-assets.py`, `scripts/slice-pixies.js`.

### LEGAL.md trigger assessment (this session)

Assessed per-commit. **No new data processors, no new cookies, no new server-side persistence, no new consent surface, no new public-facing user-data categories.** The `reveal_state` instrumentation enriches existing GA4 events with fields derived from aggregate data already shown on the page; no new event names introduced; same Consent Mode v2 gating. Privacy Policy and Terms unchanged. Internal `LEGAL.md` "Recent sprints" entry added for `REVEAL-STATE-INSTRUMENTATION-01` to track the trigger assessment.

### GA4 custom dimensions — PM follow-up required

The four new payload fields (`reveal_state`, `reveal_pct_voted`, `previous_reveal_state`, `previous_reveal_pct_voted`) are arriving in GA4 from `1384296` onward, but to be **filterable in standard reports** they must be registered as **event-scoped Custom Dimensions** in GA4 Admin → Custom definitions → Custom dimensions. Until registered, the params are visible only in DebugView + GA4 Explorations. Suggested dimension names = param names verbatim. Estimated PM time: ~5 minutes.

### Recommended tomorrow order

1. **Verify Vercel live + production smoke** (~10 min): curl `splitvote.io/results/trolley?voted=a` post-deploy, confirm the new payload fields surface in Network panel; manual vote on a real device to trigger GA4 DebugView and confirm `reveal_state` arrives.
2. **GA4 custom dimensions setup** (~5 min, PM-side): register the four new params; optional 1-Exploration setup to monitor reveal_state distribution.
3. **WIP triage** (~30-60 min, PM-led): decide merge/discard for the PM WIP files (PRODUCT_STRATEGY.md, content-generation pipeline, content-quality-gates, Pixie PNG, scripts WIP). Pre-requisite for several next-candidate sprints in ROADMAP.
4. **Decide next ship candidate** from the ROADMAP "Next candidates" table (top: `WIP-TRIAGE-AND-BRANCH-HYGIENE-01`).

---

## 0-pre. Session 19 May 2026 (late evening) — `GA4-PROXY-GEO-FIX-01` — ⚠️ LOCAL COMMIT, NOT PUSHED

PM observation: "non vedo mai traffico dall'Italia" in GA4. Vercel Analytics (independent geo pipeline) shows **Italy 59%, US 30%, Poland 5%, Germany 3%** over the last 30 days (338 visitors, 5,372 pageviews) — so the Italian audience is real and is in fact the majority. GA4 was misrepresenting it.

### Root cause

The first-party proxy at `/api/ga/g/collect` forwarded the client IP via `X-Forwarded-For`, but **GA4 client-side `/g/collect` does not trust `X-Forwarded-For` from arbitrary proxies** — it uses the TCP source IP for geo, which was the Vercel edge node IP. Result: all visitor geo collapsed to whichever Vercel edge region served the hit (likely US-East / Frankfurt / Paris). Italian users were classified as US or EU edge regions in GA4.

Smoking gun in Vercel Analytics top pages: `/api/ga/_/service_worker/65d0/sw_iframe.html` had **33 hits** (tied with `/it`) — gtag.js was trying to register its service worker iframe relative to the configured `transport_url`, but our proxy only handled `/script` and `/g/collect`, so all those internal gtag requests 404'd silently.

There is no `&_uip=` equivalent for client-side `/g/collect` (that parameter is server-side Measurement Protocol only). No fix on the proxy itself can restore geo while remaining first-party — the canonical solution is GTM Server-Side on Cloud Run, which is out of scope for current scale.

### Decision and scope

Removed the GA4 first-party proxy. gtag.js now loads directly from `https://www.googletagmanager.com/gtag/js?id=${GA_ID}` and hits go directly to `https://www.google-analytics.com/g/collect`. Consent Mode v2 is unchanged (`analytics_storage: 'denied'` by default; `send_page_view: false` with manual page_view via `GAPageView`). The AdSense first-party proxy at `app/api/ga/ads/route.ts` is unused by `app/layout.tsx` (which loads AdSense direct) and was **not** touched in this sprint.

### Trade-off accepted

URL-based adblockers may now block GA4 (since hits go to `google-analytics.com` instead of `splitvote.io/api/ga`). Estimated 10–20% data loss for users with strict adblockers. Acceptable trade vs the previous state of 100% wrong geo for everyone. AdSense rejection / low-value review is unaffected (no overlap).

### Files changed (1 commit, local only)

- `app/layout.tsx` — gtag.js src switched to direct `googletagmanager.com`; removed `transport_url`, `first_party_collection`; kept `send_page_view: false`.
- `app/api/ga/script/route.ts` — **deleted**.
- `app/api/ga/g/collect/route.ts` — **deleted**.
- `README.md` — security notes section: replaced the two GA-proxy hardening notes with a single note explaining the direct-load model.
- `LEGAL.md` — tracking files list: removed the two route files; added inline note explaining the direct-load model.
- `LAUNCH_AUDIT.md` — security checklist line 58: updated from "GA proxy hardening" to "GA4 direct loading" with the sprint name and rationale.

### Verification

- `npm run typecheck` — see report below.
- `npm run build` — see report below.
- `git diff --check` — see report below.

### PM WIP confirmed untouched

`PRODUCT_STRATEGY.md`, `app/results/[id]/ResultsClientPage.tsx`, `lib/content-generation-*.ts`, `lib/content-quality-gates.ts`, ~80 pixie PNGs, `scripts/generate-pixie-assets.mjs` all remain modified-in-working-tree and unstaged.

### Next action

After PM **GO — push**, deploy. Then verify in GA4 Realtime: open `splitvote.io/it` from an Italian device, confirm `Country = Italy` appears within ~30 s. Comparable verification expected for US, etc.

### Supersedes

The GA4 verification note in §1 below ("First-party proxy active at `/api/ga/script` and `/api/ga/g/collect`") is **historically true for the morning of 19 May 2026** but is **superseded by this sprint**. The proxy is gone.

---

## 0. Session 19 May 2026 (end of day) — AdSense remediation deployed — ✅ SHIPPED

Five commits shipped between earlier today and tonight: a sitemap caching perf fix, an audit report, the AdSense defensive gates, a results-page vote-CTA bugfix, and the full static-insights expansion. Plus two earlier docs-only closures (Stripe Premium QA + Store one-time deferral, and the AdSense audit) recorded in §0a.

### Deployed commits on `origin/main` (today's session, oldest → newest)

| Commit | Title | Live status |
|---|---|---|
| `2776c4b` | perf(sitemap): hourly ISR revalidate to cut crawler CPU | ✅ live |
| `d3b2d9b` | docs(adsense): audit low-value content risks | ✅ live |
| `87741d5` | fix(adsense): suppress ads on thin review-risk surfaces | ✅ live |
| `c88beaf` | fix(results): add vote CTA for unvoted dilemmas | ✅ live |
| `19a020b` | feat(content): add per-id insights for all static dilemmas | ✅ live |

### Production smoke status (all verified post-deploy)

- **Static results coverage**: 41/41 static dilemmas now render per-id EN+IT insights below the vote bars (`lib/static-insights.ts`). Confirmed live on `/results/trolley`, `/it/results/trolley`, `/results/whistleblower`, `/it/results/whistleblower`, `/results/mercy-kill`, `/it/results/mercy-kill`.
- **Sitemap**: 295 `<loc>` URLs (down from 296 — `/store` removed). 0 occurrences of `splitvote.io/store` in the XML.
- **Store noindex**: `/store` and `/it/store` both return `<meta name="robots" content="noindex, follow">` in SSR. `/it/store` was never in the sitemap.
- **Results vote-CTA**: `/results/whistleblower` and other unvoted/results pages now show the "Vote on this dilemma →" card with a link back to `/play/<id>` (and `/it/play/<id>` for IT) when the user has not yet voted. The CTA auto-hides for users with a prior vote on the scenario.
- **AdSense gates**: `<AdSlot>` only renders on `/play/<id>` when `hasStaticInsight(id)` is true (all 41 static IDs after `19a020b`); on `/results/<id>` only when `total >= 50 && hasStaticInsight(id)`. Dynamic AI play+results pages without a per-id insight carry `robots: { index: false, follow: true }`.

### AdSense — next action

- **Wait 24–48 h after deploy** to let Googlebot recrawl the affected surfaces with their new content + noindex/sitemap state.
- **Recommended next sprint (tomorrow): `ADSENSE-REVIEW-READY-CHECKLIST-01`** — read-only verification pass that goes through `reports/adsense-low-value-remediation-audit-2026-05-19.md` "Do not request AdSense review until these are done" checklist, confirms each item is live in production, and reports green/red on every line. Output: report only.
- **After that passes**: PM submits AdSense re-review request from the AdSense dashboard.
- **If re-review fails again**: fall through to Phase 2 remaining items — `dilemma-seo-insights.ts` variation expansion (3/3/4 → 8/8/8), `/about` enrichment (~300 → ~600-800 words), new `/editorial-policy` + `/methodology` pages, `Person`-typed author bylines on cornerstone blog posts.

### Stripe — current state

- **Premium checkout UI**: ✅ verified live by PM (19 May 2026). Stripe Checkout opens correctly on `splitvote.io/profile` and displays the Premium recurring monthly product (€4.99/mese). The 29 Apr `STRIPE_PRICE_ID_PREMIUM` env fix is fully effective.
- **Live end-to-end payment**: ⏳ still pending. PM did not complete a card submit in this session. Risk profile remains low (the previously-broken layer is now visually confirmed correct), but the loop (checkout → webhook → `is_premium=true` → entitlements) has not been exercised in live mode with a real card.
- **Pixie/cosmetic one-time purchases**: intentionally deferred. All 14 `STRIPE_PRICE_*` env vars remain unset in Vercel Production scope. Store cards continue to show the "Checkout coming online soon" graceful modal. Decision recorded in `LAUNCH_AUDIT.md §B → Store One-Time Purchases — Intentionally Deferred`.

### Vercel / performance — current state

- **75% Fluid Active CPU warning** received earlier this session. Mitigations deployed:
  - `/api/results/[id]/route.ts` → 15s short-lived CDN cache (`s-maxage=15, stale-while-revalidate=45`) (`db4d161`).
  - `/sitemap.xml` → hourly ISR via `export const revalidate = 3600` (`2776c4b`).
  - The Phase 1 AdSense gates also indirectly reduce CPU on `/results/<id>` (fewer client requests to entitlements when `<AdSlot>` not rendered).
- **Action**: avoid nonessential deploys; batch future pushes. PM to recheck Vercel dashboard usage cycle in 24–48 h to confirm the curve flattens.

### PM WIP — do not touch

Uncommitted in working tree and must remain uncommitted by Claude:
`PRODUCT_STRATEGY.md`, `app/results/[id]/ResultsClientPage.tsx` (PM sticky-CTA refactor merged with today's bugfix + AdSlot-gate commits — snapshot procedure handled cleanly each commit), `lib/content-generation-prompts.ts`, `lib/content-generation-validate.ts`, `lib/content-quality-gates.ts`, ~80 modified pixie PNGs, `scripts/generate-pixie-assets.mjs`.

### Audit-only open items closed today

- **`why-not-intervene` in 2 bystander-effect blog posts (item 2.5 in QA open-items audit)**: confirmed **STALE**. `rg "why-not-intervene" lib app` returns 0 hits; the live `lib/blog.ts` `bystander-effect-and-moral-responsibility` has `relatedDilemmaIds: ['trolley', 'lifeboat', 'innocent-juror', 'whistleblower']` — all valid. The audit report flagged a defect that no longer exists in source. No fix needed. Closing the open-item entry in the next QA audit refresh.

- **GA4 wiring verification (post-EOD spot check)**: live production GA4 setup confirmed OK. Measurement ID `G-5MPQ8PW0CE`. First-party proxy active at `/api/ga/script` (HTTP 200, JS, 1h cache) and `/api/ga/g/collect` (HTTP 204). Consent Mode v2 declared `beforeInteractive` with all four signals (`analytics_storage`, `ad_storage`, `ad_user_data`, `ad_personalization`) `denied` by default; `ads_data_redaction: true` and `url_passthrough: true` set. `send_page_view: false` with `transport_url` pointing at the first-party proxy. **Documentation drift discovered**: `LAUNCH_AUDIT.md` (line 58) and `LEGAL.md` (consent/tracking file list) mentioned the stale paths `/api/_g/script` and `/api/_g/g/collect` — those paths return 404. Both docs corrected to the live paths `/api/ga/script` and `/api/ga/g/collect`. **Runtime behavior unchanged** — drift was documentation only.

## 0a. Session 19 May 2026 (night) — Premium QA + Store one-time deferral — ✅ DOCS CLOSURE

Two Stripe-adjacent sprints closed today as docs-only updates. No code, no Stripe config, no Vercel env vars changed.

### `PREMIUM-STRIPE-LIVE-QA-01` — checkout UI verified, payment still pending

- ✅ **Checkout UI**: PM opened `splitvote.io/profile` with a real non-premium account and clicked "Upgrade to Premium". Stripe Checkout opened in live mode and displayed the Premium recurring monthly product (€4.99/mese) correctly. Confirmed the env var fix from 29 Apr 2026 (`STRIPE_PRICE_ID_PREMIUM` → `price_1TQZuO6MLlYKqmclQm57kmvI`) is fully effective in production.
- ⏳ **Live end-to-end payment**: PM did not complete a live card submit in this session. The remaining residual risk is small (the only previously-broken layer — the price ID env var — is now visually confirmed correct). Recommended before promoting Premium to real users, but not urgent.
- LAUNCH_AUDIT.md §B Stripe checkboxes updated (line 361 → ✅, line 362 → still open with note). Top 5 Blockers row 2 reworded to reflect remaining scope.

### `STRIPE-STORE-COSMETICS-CHECKOUT-CONFIG-AUDIT-01` — closed as configuration-known/no-code

- **Decision (PM, 19 May 2026)**: do not launch Pixie/cosmetic one-time purchases now. Keep all 14 Store one-time products intentionally in "Checkout coming online soon — sit tight" state until the business case justifies launch.
- **Root cause confirmed**: the modal is the intentional graceful fallback in `app/api/checkout/one-time/route.ts:70-78` when `getStripePriceId(productId)` returns null (i.e. the per-product `STRIPE_PRICE_*` env var is unset). 14 env vars are documented in `README.md:78-96` but unset in Vercel Production scope.
- **Code state**: production-ready. No changes proposed. `migration_v16_user_purchases` is applied; webhook handler `one_time_purchase` implements the anti-tampering Stripe Price ID ↔ catalog cross-check.
- **Path to launch (deferred, no sprint queued)**: future `STORE-ONE-TIME-LAUNCH-01` will create 6 Stripe Products in live mode + set the 6 `STRIPE_PRICE_PIXIE_*` env vars on Vercel Production + redeploy + test on lowest-cost Pixie. Cosmetics (8 more env vars) can ship in a second pass.
- **Residual risks tracked for future launch**: refund reverse-state for `one_time_purchase` rows uses legacy `lib/cosmetics-store.ts` catalog (audit needed pre-launch); UX `alreadyOwned` 409 not surfaced by client; tax/VAT setup default in Stripe Products. None block the deferral.
- LAUNCH_AUDIT.md §B has a new "Store One-Time Purchases — Intentionally Deferred" subsection capturing this state.

### LEGAL.md — no update required

Payment behavior, data processing, and legal surface area are unchanged. Terms already cover Premium subscription, one-time digital goods, and the EU 14-day waiver. The deferral does not introduce new processors, new tracking, or new user data flows.

### Files changed by this closure

- `LAUNCH_AUDIT.md` — Premium checkboxes 361/362 + new Store one-time subsection + Top 5 Blockers row 2 wording.
- `CURRENT_HANDOFF.md` — this section.
- **No source files. No commits. No pushes.** PM WIP in working tree untouched (`PRODUCT_STRATEGY.md`, `ResultsClientPage.tsx`, `lib/content-generation-*.ts`, `lib/content-quality-gates.ts`, ~80 pixie PNGs).

### Next recommended sprint

**`ADSENSE-LOW-VALUE-REMEDIATION-AUDIT-01`** — read-only audit. AdSense approval is listed in the open queue (LAUNCH_AUDIT.md §C). If the account is in "low value content" or similar review state, the unblock path is typically: (a) thin-content pages → demote/noindex, (b) duplicate/aggregator pages → consolidate, (c) E-E-A-T signals (about/contact/policies, author bylines, citation density) → strengthen, (d) ad placement density vs main content → audit. Output: report only, no code changes, no AdSense dashboard actions. Sprint is SAFE_AUTONOMOUS-adjacent (read-only crawl + lib inventory).

## 1. Session 19 May 2026 (late) — Dilemma depth pilot rewrite — ✅ SHIPPED

**Sprint `DILEMMA-STATIC-41-REWRITE-PILOT-01` deployed to production** at
~11:27 local time on 19 May 2026. 5 static dilemmas rewritten in EN + IT
for moral depth, per the audit at `reports/dilemma-depth-audit-2026-05-19.md`.
Files touched: `lib/scenarios.ts`, `lib/scenarios-it.ts`. Vote-mechanics,
IDs, categories, routes, sitemap, and `Scenario` schema all preserved.

**Deploy sequence (`DEPLOY-DILEMMA-PILOT-01`):**
- Pushed 3 commits (`4fc2081`, `dba24cf`, `5bd0036`) to `origin/main`.
- Vercel production deploy went live ~7 min after push (curl-confirmed
  via the marker string `"halve the income of the top 1%"` on
  `/play/rich-or-fair`).
- Live smoke on 7 URLs (EN + IT, play + results, `rich-or-fair` + `deepfake-expose`):
  all HTTP 200, all new EN+IT strings rendered, zero `| SplitVote | SplitVote`
  double-suffix occurrences.
- PM ran `DEL votes:rich-or-fair votes:censor-speech votes:deepfake-expose votes:prison-abolition`
  in the Upstash production console. Response: `0` — **all four keys
  were already absent.** No state change required.
- PM verified `/results/{rich-or-fair, censor-speech, deepfake-expose, prison-abolition, robot-judge}`
  → all 5 show 0/fresh aggregate state, including `votes:robot-judge`
  (which had been intended to retain history; in practice the key was
  also absent in production Redis, so all 5 dilemmas start fresh).
  Cosmetic-only deviation from plan; accepted.
- **No Supabase operation performed and none required.** Per-user
  `dilemma_votes.currentVote` rows survive on the 4 (now 5) rewritten
  IDs as previously decided; users can re-vote within `can_change_until`.

Sprint sequence today (chronological):

Sprint sequence today (chronological):
1. `DILEMMA-DEPTH-AUDIT-01` — read-only audit. Committed `dba24cf`.
2. `DILEMMA-STATIC-41-REWRITE-PILOT-01` — implementation. Committed
   (this section's release).

### Post-deploy Redis state — resolved

The pre-deploy reset plan (DEL of 4 aggregate keys) was carried out by
PM in the Upstash production console after the new text was live. The
`DEL` returned `0` — all four target keys (`votes:rich-or-fair`,
`votes:censor-speech`, `votes:deepfake-expose`, `votes:prison-abolition`)
were already absent before the reset. `votes:robot-judge`, which the
plan intentionally excluded from the reset, also turned out to be
absent in production Redis. Net effect: all 5 rewritten dilemmas now
start with fresh aggregate counts. The misleading-split window the
runbook was designed to close never materialised in practice.

Supabase `dilemma_votes` per-user carry-over remains accepted as-is
(small user fraction; `can_change_until` re-vote available). No
Supabase write proposed or required.

### Per-ID semantic-shift risk (compressed reference)

| ID | Risk | Reset required? |
|---|---|---|
| `rich-or-fair` | High — old A "equal poverty" vs new A "targeted tax"; different axes. | YES |
| `robot-judge` | Low — old/new A both endorse AI; old/new B both endorse human. Direction maps. | NO |
| `censor-speech` | Medium-High — old B was free-speech absolutism (straw-man), new B is mainstream slippery-slope. Old counts biased toward A. | YES |
| `deepfake-expose` | High — old premise stipulated guilt; new premise removes the stipulation. Many old-A voters voted because A was easy. | YES |
| `prison-abolition` | Critical — old asked "abolish prisons?", new asks "should a released offender live unannounced in your neighbourhood?". Different dilemma entirely. | YES |

### Verification already passed (do not re-run unless deploy concerns)

- `npm run typecheck` ✅
- `npm run build` ✅ (41 static `/play/<id>` and `/results/<id>` routes prerendered)
- `npx vitest run tests/unit/{dilemma-seo-insights,category-content,category-hub-copy}.test.ts` → 46/46 ✅
- `git diff --check` ✅
- Local production-build smoke (`npm run start` on :3000) of all 6 PM-listed URLs → 200 OK; rewritten EN+IT strings present in SSR HTML; no `| SplitVote | SplitVote` doubling on any of the 6.

### Files changed by this sprint

- `lib/scenarios.ts` — 5 EN scenario blocks updated.
- `lib/scenarios-it.ts` — 5 matching IT translations updated.
- `CURRENT_HANDOFF.md` — this section (deploy warning).
- No schema change. No new fields. No code-path change. No new files. PM WIP untouched.

### Next recommended sprint

`DILEMMA-INSIGHT-PER-ID-01` — populate per-dilemma post-vote insight
copy. The static `Scenario` schema currently lacks `expertInsightEn` /
`expertInsightIt`; the dynamic `DynamicScenario` already has them.
Sprint can either: (a) add the fields to the static schema and write
overrides for the 5 rewritten + maybe 5 more, or (b) route static-id
insight lookup through a parallel `lib/static-insights.ts` map keyed by
`id`. Option (b) is lower blast-radius and recommended; design choice
deferred to next session start.

## 0a. Session 19 May 2026 — IT topic landing parity audit closure

**Sprint `IT-TOPIC-LANDING-PARITY-01` closed as no-op.** Phase 1 audit
confirmed EN and IT topic landings are already at perfect 1:1 reciprocal
parity (11 + 11 in both `lib/seo-topics.ts` and the live sitemap). The
"19 EN / 12 IT" gap cited in the 18 May GSC report is a counting artifact
(non-topic single-segment URLs erroneously bucketed as topic landings).
No code touched.

**Reports:**
- New: [reports/it-topic-landing-parity-audit-2026-05-19.md](reports/it-topic-landing-parity-audit-2026-05-19.md)
- Updated: [reports/gsc-indexing-diagnosis-2026-05-18.md](reports/gsc-indexing-diagnosis-2026-05-18.md)
  → Retraction 3 added; §5 in Top 5 (topic landing content gap)
  struck through in "What still stands".

### Next recommended work — priority order (post-19 May)

1. **A. `GSC-EXPORT-CROSS-REFERENCE-01`** — still **blocked on PM**.
   Action unchanged from 18 May: export `Pages › Not indexed (Not found
   404)` from Search Console as CSV → drop in `reports/`. Estimated
   effort 1–2 h once data lands.
2. **B. `BLOG-SEO-CONTENT-STRATEGY-01`** — **now the top unblocked
   sprint.** Full audit of singolari articoli blog (EN + IT), update
   aging copy, identify cluster gaps, queue 2–3 new articles. Use
   `.claude/agents/blog-seo-editor.md` per `AGENTS.md` agent pairing
   rules. Output: report only, no auto-publish.
3. **C. `PREMIUM-STRIPE-LIVE-QA-01`** — HUMAN_ONLY. Manual live
   checkout QA on `price_1TQZuO6MLlYKqmclQm57kmvI` (€4.99/mo) if still
   pending per `LAUNCH_AUDIT.md`. Real card required.
4. **D. `PIXIE-VISUAL-QA-POLISH-02`** — conditional. Only if PM
   visually finds a defect on /profile, /store, /dashboard, /u/[id],
   post-vote share. No queued issue.

Removed from queue: `IT-TOPIC-LANDING-PARITY-01` (closed as no-op).

## 0a. Session 18 May 2026 — SEO/Pixie/category closure day

**State at end of day:** SEO technical work is **closed for today**. The
roadmap for tomorrow is content/QA-driven, not code-driven. Nothing in the
runtime code path requires further hardening today.

### Sprints closed today

| Sprint | Outcome |
|---|---|
| `SEO-TITLE-TEMPLATE-FIX-01` | Shipped — removed duplicate `\| SplitVote` suffix across category/topic surfaces. |
| `SEO-WORLD-WORDING-01` | Shipped — public "world voted/chose" copy + metadata aligned to "SplitVote voters". |
| `IT-RESULTS-GRAMMAR-01` | Shipped — IT grammar corrections introduced by SEO-WORLD-WORDING-01. |
| `SITEMAP-I18N-CATEGORY-AUDIT-01` | Shipped — sitemap now emits both EN and IT entries per category, including `/category/lifestyle` and `/it/category/lifestyle`. |
| `CATEGORY-HUBS-INTERNAL-LINKING-01` | Shipped — category pages converted into light discovery hubs with internal linking. |
| `CATEGORY-CONTENT-FAQ-PARITY-01` | Shipped — added EN+IT lifestyle editorial + 3 FAQ items (10 unit tests pass; full parity across 9 categories × 2 locales). |
| `RESULTS-PAGE-DEPTH-01` | Shipped — dilemma insight sections on play + results. |
| `SEO-STALE-DYNAMIC-404-PROOF-01` | **Closed as no-op.** Crawl + live status check found **zero internal 404s** to pruned Redis dynamic IDs. Mitigation sprint cancelled. |

### Retracted (false positives from earlier audits)

- ~~`SEO-HREFLANG-BLOG-TOPICS-01` — "hreflang missing on ~112 of 296 URLs"~~
  → Retracted. Audit had used case-sensitive grep for `hreflang=` but
  Next.js emits camelCase `hrefLang=`. Re-audited case-insensitively:
  296/296 URLs carry hreflang metadata. Sprint closed without code change.
- ~~`BLOG-INDEX-DEAD-LINK-AUDIT-01` — "dead link `why-we-love-impossible-choices`"~~
  → Retracted. The cited slug was a typo by the auditor; the real slug
  is `why-people-love-impossible-choices` and returns 200. All 124
  internal blog links verified live. Sprint closed without code change.
- See [reports/gsc-indexing-diagnosis-2026-05-18.md](reports/gsc-indexing-diagnosis-2026-05-18.md)
  → Errata section for the full retraction record + methodology rules
  added to prevent recurrence.

### Pixie / store state

Carry-over bug from 16 May (cosmetics not applying) was resolved over
this week's commits. Current state:

- **Cosmetic ownership + equip flow:** fixed (`24c4cda` align pixie
  cosmetics ownership and previews).
- **Nova / scintille mapping:** fixed.
- **Full Pixie selector:** shipped.
- **"No frame" + "no glow" options:** shipped.
- **Per-species asset scaling:** shipped (`1bd535d` normalize sprite
  rendering across surfaces; `7ca3e6c` per-species tile preview +
  active-skin precedence + cache invalidation).
- **Remaining work:** only visual QA / polish if PM finds defects.
  No queued sprint unless PM reports a regression.

### Content inventory snapshot (verified today)

- **Static dilemmas** (`lib/scenarios.ts`): **41**
- **Dynamic dilemmas approved in Redis:** **779** linked on live
  surfaces today, broken down as:
  - `ai-en-*` / `ai-it-*`: 351
  - `news-YYYYMMDD-*`: 204
  - `culture-YYYYMMDD-*`: 56
  - `gap-YYYYMMDD-*`: 48
  - `evergreen-YYYYMMDD-*`: 48
  - `psych-YYYYMMDD-*`: 36
  - `viral-YYYYMMDD-*`: 24
  - `grimdark-YYYYMMDD-*`: 12
- **Dynamic dilemma drafts:** **0** (queue clean).
- **Redis blog posts published:** **3**.
- **Redis blog post drafts:** **3**.

### 404 audit — reference for the future

[reports/stale-dynamic-404-proof-2026-05-18.md](reports/stale-dynamic-404-proof-2026-05-18.md):

- 22 surfaces crawled (home EN+IT, trending EN+IT, 9+9 category pages).
- **863 unique** `/play/*` and `/results/*` URLs extracted from live
  page bodies (no constructed URLs).
- **863 / 863 = HTTP 200.** Zero 404s, zero 410s, zero 5xx.
- 67 first-pass timeouts were all confirmed 200 on serial retry — not
  treated as failures.
- **Mitigation sprint cancelled.** No internal stale-dynamic 404 risk
  to address from internal link emission.
- Open external risk: historical URLs that Google saw before today's
  crawl and may surface in GSC's "Not indexed (404)" report — addressable
  only via `GSC-EXPORT-CROSS-REFERENCE-01` once PM exports the CSV.

### Next recommended work — priority order for tomorrow

1. **A. `GSC-EXPORT-CROSS-REFERENCE-01`** — **blocked on PM**. Action:
   PM exports `Pages › Not indexed (Not found 404)` from Search Console
   as CSV and drops it in the repo (e.g. `reports/gsc-pages-export-YYYY-MM-DD.csv`).
   Once available, cross-reference against the static + dynamic ID
   inventory to confirm which 404s are stale-only (safe to ignore) vs.
   actually still reachable (would need redirect/410 policy). Estimated
   effort: 1–2 h once data lands.
2. **B. `IT-TOPIC-LANDING-PARITY-01`** — close the EN/IT topic-landing
   gap (currently 19 EN vs 12 IT per `gsc-indexing-diagnosis-2026-05-18.md`
   → Recommended next sprints → topic gap). Pure content sprint; touches
   `lib/topic-landings.ts` / topic content files only; no runtime change.
3. **C. `BLOG-SEO-CONTENT-STRATEGY-01`** — full audit of singolari
   articoli blog (EN + IT), update aging copy, identify cluster gaps,
   queue 2–3 new articles. Use `.claude/agents/blog-seo-editor.md` per
   `AGENTS.md` agent pairing rules. Output: report only, no auto-publish.
4. **D. `PREMIUM-STRIPE-LIVE-QA-01`** — if still pending per
   `LAUNCH_AUDIT.md`: manual live checkout QA on the `€4.99/month`
   recurring Price ID (`price_1TQZuO6MLlYKqmclQm57kmvI`). HUMAN_ONLY
   per `AGENTS.md`; requires explicit GO + real card. Confirm the
   webhook fires and the entitlement flips on the test account.
5. **E. `PIXIE-VISUAL-QA-POLISH-02`** — only if PM visually inspects
   /profile, /store, /dashboard, /u/[id], post-vote share card, and
   finds a real defect. No queued issue today.

### Files NOT to commit in this handoff

- PM WIP currently uncommitted (do not stage by accident):
  `PRODUCT_STRATEGY.md`, `ROADMAP.md` (PM has separate WIP edits in
  deferred-backlog sections; today's handoff only prepends a new dated
  section at the top), `app/results/[id]/ResultsClientPage.tsx`,
  `lib/content-generation-prompts.ts`, `lib/content-generation-validate.ts`,
  `lib/content-quality-gates.ts`, ~80 modified pixie PNGs.

## 0a. Session 16 May (late evening) — blog Redis ISR + middleware sprint

Two sprints shipped end-to-end. Blog Redis articles now render correctly
under ISR; public/SEO routes now hit Vercel edge cache. Both verified live.

### 🐛 PM-reported bug (carryover for next session) — equip cosmetics not applying

**Repro path:** Profile → Cosmetics → click Equip on any Pixie skin,
Profile Frame, Glow, Name Color, or toggle PFP → **"nothing happens
visually; the purchased cosmetic doesn't actually apply"** (PM's words).

**Screenshot context (16 May late):** Pixie Galaxy marked Equipped (Epic),
Pulse Frame Equipped, Fire Glow Equipped, Name Color Gold selected,
"Use skin as public avatar" toggle OFF. PM is super_admin so all
cosmetics show as ownable via the `cc45743` admin-bypass.

**First-step diagnostics tomorrow (NOT done tonight):**
1. **DevTools → Network tab while clicking Equip** — does the request to
   `/api/profile/equip-pixie` or `/api/profile/equip-cosmetic` fire?
   What's the response code + payload?
2. **Supabase profiles row inspection** — after a 200 response, does the
   `equipped_*` column actually update for the PM's user_id? If yes,
   the API works and the bug is downstream.
3. **Consumer-side staleness** — does CompanionDisplay / navbar avatar /
   public profile read the equipped value live, or from a stale cached
   render? Possible missing `router.refresh()` / `revalidatePath` after
   equip mutation.
4. **PFP toggle context** — toggle "Use skin as public avatar" is OFF in
   the screenshot. Some surfaces (public `/u/[id]`, leaderboard avatar)
   may intentionally NOT apply the skin when the toggle is off. Check if
   the bug is specific to a single surface or universal.
5. **Service worker / browser cache** — hard reload (Cmd+Shift+R) to rule
   out PWA caching.

**Likely-culprit files:** [components/PixieSelector.tsx](components/PixieSelector.tsx),
[app/api/profile/equip-pixie/route.ts](app/api/profile/equip-pixie/route.ts),
[app/api/profile/equip-cosmetic/route.ts](app/api/profile/equip-cosmetic/route.ts),
[app/api/profile/toggle-pixie-avatar/route.ts](app/api/profile/toggle-pixie-avatar/route.ts),
CompanionDisplay component (consumer).

**Recent context that may be related:** commit `cc45743` (16 May) added
admin-bypass to PixieSelector so super_admin SEES all cosmetics as
ownable, but the actual APPLY/equip mutation flow was untouched. The
bypass may have inadvertently exposed an existing apply bug that only
manifests when items appear "owned" without a real purchase row in
`user_purchases`.

**Priority:** 🔴 **HIGH** if reproducible for non-admin paying users.
Cosmetics are a Stripe-paid feature. If equip works for the API but the
UI doesn't show the change, it's UX-only but still bad. If equip
silently fails for users who actually bought items, it's revenue-impacting
and refund-territory.

**First action tomorrow:** PM repro'es with DevTools open, shares the
Network/Console output. From there: 5 min triage, then targeted sprint.

### Shipped commits

| Hash | Sprint | Description |
|---|---|---|
| `edaa63c` | BLOG-REDIS-SEO-01 | fix(blog): make Redis published posts ISR-safe |
| `bd2d46f` | EDGE-CACHE-HEADERS-01 | perf(middleware): narrow matcher to auth-relevant routes only |

### `edaa63c` — Blog Redis ISR root cause + fix

**Symptom:** Redis-published blog slugs returned 500 on Vercel; static
slugs from `lib/blog.ts` rendered fine. Multiple defensive patches
(`tags`/`relatedDilemmaIds`/`body`/`faq` coercions, restoring
`force-dynamic`, removing `cache()` wrap) papered over the issue without
addressing root cause.

**Root cause:** the shared `@upstash/redis` client uses `fetch` with
`cache: 'no-store'` internally. Reading published drafts via that client
inside `/blog/[slug]/page.tsx` (configured for SSG + ISR via
`generateStaticParams` + `revalidate=3600`) tripped Next's
static-to-dynamic guard at runtime for on-demand Redis slugs, surfacing
as a render error.

**Fix:** replaced the shared Redis client with a direct Upstash REST
`fetch` + `next: { revalidate: 3600 }` hint in
[lib/blog-published.ts:15-38](lib/blog-published.ts#L15-L38). The function
signature stayed identical, so [app/blog/[slug]/page.tsx](app/blog/[slug]/page.tsx)
and [app/it/blog/[slug]/page.tsx](app/it/blog/[slug]/page.tsx) consume it
unchanged. `force-dynamic` directives previously bolted on as a safety
net were removed — those files now have only `export const revalidate = 3600`.

**Deletion-first dividend the safety patches gave to keep:**
defensive coercions on `tags`, `relatedDilemmaIds`, `body`, `faq` in
`publishedDraftToPost` were retained as cheap fault tolerance against
malformed Redis drafts — they're not root cause but produce real value
against future draft schema drift.

**Sitemap freshness:** [app/sitemap.ts](app/sitemap.ts) now includes
Redis-published slugs in addition to static blog posts, with a
`latestBlogModified(locale)` helper feeding the blog index `lastModified`
so Googlebot re-crawls the index when a new article goes live. Evergreen
URLs use a `STATIC_LAST_MOD = new Date('2026-05-16')` constant — avoids
the "every URL modified just now" anti-pattern.

**Verified live on `splitvote.io`** post-deploy:
- `/blog`, `/it/blog` — 200, render correctly
- `/blog/bodyoids-brainless-organs-bioethics` (Redis-published) — 200
- `/it/blog/bodyoids-organi-senza-cervello-bioetica` — 200
- `/blog/culture-public-trust-and-institutional-dilemmas` — 200
- `/it/blog/cultura-fiducia-istituzioni-e-dilemmi-pubblici` — 200
- `/sitemap.xml` — 200, includes static + Redis slugs

### `bd2d46f` — Middleware matcher narrowing

**Symptom:** even after `edaa63c`, blog routes served
`Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate`
with persistent `x-vercel-cache: MISS` — origin function was hit on every
request despite the routes being SSG/ISR.

**Root cause:** [middleware.ts](middleware.ts) had an opt-out matcher
(`/((?!_next/static|…|asset-extensions).*)`) that matched every non-asset
request. Even with `NextResponse.next()` early-return inside, the mere
presence of middleware in the request path disabled Vercel's pure-CDN
edge cache for the matched routes.

**Fix:** converted to opt-in matcher listing only `/` (for IT
auto-redirect) and the auth-relevant prefixes already enumerated in
`AUTH_RELEVANT_PREFIXES`. Defense-in-depth confirmed before changing:
every protected route (`/dashboard`, `/profile`, `/admin`,
`/submit-poll`, `/api/admin/*`, etc.) does its own `supabase.auth.getUser()`
check at the page/handler level. Middleware was layer 2, not the only gate.

**Verified locally with prod build:**
- Blog routes: `Cache-Control: s-maxage=3600, stale-while-revalidate`
  + `x-nextjs-cache: HIT` ✓
- Auth-relevant unauth hits: 307 → `/login?redirect=…` ✓
- `/api/admin/dilemmas` no-token: 401 ✓

**Verified live (PM confirmed):**
- Blog routes: `x-vercel-cache: HIT` + `age` grows → edge cache working
- `cache-control: public, max-age=0, must-revalidate` in the browser
  response is **expected Vercel behavior** — the `s-maxage=3600` directive
  is consumed by the edge CDN and stripped from the browser response.
  `x-vercel-cache: HIT` is the correct success signal, not `s-maxage` in
  the response header.

### Operational policy (unchanged, restated for clarity)

- **Blog publishing remains manual.** Admin reviews drafts → approves →
  publishes via the admin queue. No autopublish path exists.
- **No autopublish of current-events articles.** Quality gates and
  editorial review are required for every Redis-published slug.

### Open observations (deferred, NOT in this sprint)

- `/play/[id]`, `/results/[id]`, `/category/*` still serve
  `Cache-Control: private, no-cache, no-store` — different root cause
  than blog. Diagnose (read-only, 16 May late):
  - **`/play/[id]`** ([app/play/[id]/page.tsx:69](app/play/[id]/page.tsx#L69)):
    `export const dynamic = 'force-dynamic'` **intentionally set** per
    CLAUDE.md anti-regression rule. Also reads `cookies()` line 121 to
    collect `sv_voted_*` anonymous markers, plus `supabase.auth.getUser()`
    for `existingVote` + streak. Cannot be cached as-is.
  - **`/results/[id]`** ([app/results/[id]/page.tsx:65,95](app/results/[id]/page.tsx#L65)):
    has `export const revalidate = 60` (NOT force-dynamic), but line 95
    calls `cookies()` to scan `sv_voted_*` for anonymous users. The
    `cookies()` call alone bumps the route to dynamic regardless of the
    revalidate directive.
  - **`/category/[category]`** ([app/category/[category]/page.tsx:63](app/category/[category]/page.tsx#L63))
    and **`/trending`** ([app/trending/page.tsx:9](app/trending/page.tsx#L9)):
    both have `revalidate = 3600`, **no `cookies()`/`headers()` calls**.
    Their no-store behavior was likely caused by the middleware matcher
    pre-`bd2d46f`. Likely already cacheable now — untested.
  - **Future sprint shape if/when needed (PLAY-EXISTING-VOTE-CLIENT-MOVE-01):**
    move `votedIds` + `existingVote` + streak from server to client via
    `/api/me/voted-ids` (exists) + new `/api/me/streak` (or expand
    existing endpoint). Remove `force-dynamic` from `/play`; remove
    `cookies()` from `/results`. Risk: flash of "no vote" pre-hydration
    for logged-in users; possible UX trade for cacheability.
- Vercel Attack Challenge Mode may be enabled at the project level —
  blocked all curl/WebFetch verification during this session. PM is
  running VERCEL-CHALLENGE-SANITY-01 dashboard audit; no code action
  pending until that returns evidence of real impact (e.g., Googlebot
  403s in Search Console).

### Next session — top blockers (unchanged, restated)

All HUMAN_ONLY:
1. **Stripe live QA** — real card on splitvote.io/profile
2. **AdSense slot IDs + approval check**
3. **Supabase HIBP toggle** — Auth → Settings → Password protection
4. **Backup/DR posture** — Upstash auto-backup, Supabase PITR, Resend SPF/DKIM
5. **`patch-revoke-public.sql`** — applied 16 May afternoon (no longer pending)

---

## 0. Session 16 May (afternoon + evening) — audit + hardening + DB apply

Project-wide audit + production DB hardening. 5 commits shipped + applied
to production Supabase via MCP. Dashboard root cause closed; super_admin /
admin store unlock fixed; security advisor count dropped from 25 → 16.

### What's live in production now

**Dashboard:**
- `cc45743` — super_admin and admin see every cosmetic as owned in the
  dashboard PixieSelector (mirrors the /store bypass).
- Badge collection on the dashboard is non-empty again for all logged-in
  users (was empty since the RLS-without-policies regression).

**Supabase (applied via MCP bundle `session_2026_05_16_full_bundle`):**
- `badges` table: RLS policy "Anyone can read badge definitions" for anon
  + authenticated. Verified: 15 badge definitions readable post-apply.
- `user_badges.badge_id` FK: NO ACTION → ON DELETE CASCADE.
- `profiles` role: alphablacklady83@gmail.com → 'admin' (guarded against
  super_admin downgrade).
- `dilemma_feedback_stats` view: SECURITY DEFINER → security_invoker.
- 7 SECURITY DEFINER functions: `search_path` pinned to (public, pg_temp)
  (award_mission_xp, enforce_role_immutability_fn, set_updated_at,
  increment_poll_vote, increment_user_vote_count, check_and_award_badges,
  update_stripe_webhook_events_updated_at).
- 5 SQL COMMENTs on RPC-intended SECURITY DEFINER functions documenting
  intent.
- 2 SQL COMMENTs on RLS-no-policy tables (role_audit_log,
  stripe_webhook_events) documenting intentional design.
- 1 SQL COMMENT on profiles "Only super_admin can update role" policy
  documenting advisor false positive.

**Security advisor delta:**
- Before: 1 ERROR + 18 WARN + 3 INFO = 22
- After:  0 ERROR + 13 WARN + 2 INFO = 15
- Cleared: SECURITY DEFINER view (ERROR), 7 function_search_path_mutable
  (WARN), badges RLS-no-policy (INFO).
- Pending bundle re-apply: 2 trigger function executable findings (need
  `REVOKE EXECUTE ... FROM PUBLIC` — see patch file below).
- Pending PM decisions: poll_votes "Anyone can insert" (Option A vs B),
  HIBP toggle (dashboard).
- Permanent intentional/documented: role_audit_log + stripe_webhook_events
  RLS-no-policy (INFO), profiles role-update policy USING (true) (WARN),
  increment_poll_vote anon-callable (WARN — anonymous poll voting), 4
  authenticated-callable RPC functions (intentional + documented).

### Files changed (committed + pushed)

| File | Change | Why |
|---|---|---|
| [components/PixieSelector.tsx](components/PixieSelector.tsx) | Added `isAdmin?: boolean` prop + `ALL_OWNABLE_IDS` constant + `effectiveOwnedIds = isAdmin ? ALL_OWNABLE_IDS : ownedIds` everywhere a `.includes()` check runs | PM bug: super_admin (and admin) did not see the cosmetics section unlocked on the dashboard. The `/store` page already bypasses admin (line 36); the in-dashboard PixieSelector did not. Now mirrors the same admin bypass. |
| [app/dashboard/page.tsx](app/dashboard/page.tsx) | Imported `getUserEntitlements` + `UserRole`. Added `role` to `Profile` type + the `profiles` SELECT. Computed `entitlements`. Passes `isAdmin={entitlements.isAdmin}` to PixieSelector. | Wires the admin bypass through to the cosmetics UI. |
| [supabase/session-2026-05-16-apply-bundle.sql](supabase/session-2026-05-16-apply-bundle.sql) | 9 ops in one transaction (v19 §1+§2 + admin grant + v20 §1+§2+§3+§4+§6+§7). Applied successfully via MCP. | Atomic apply file; left in repo for audit + future reference. |
| [supabase/session-2026-05-16-patch-revoke-public.sql](supabase/session-2026-05-16-patch-revoke-public.sql) | 2 REVOKE EXECUTE FROM PUBLIC ops for trigger functions. **NOT APPLIED** (MCP blocked by classifier; PM applies manually). | Closes remaining 2 advisor findings on enforce_role_immutability_fn + handle_new_user. The bundle revoked from anon/authenticated but PUBLIC inheritance left the grant in place. |
| [supabase/migration_v20_security_hardening.sql](supabase/migration_v20_security_hardening.sql) | Refreshed §3 with REVOKE FROM PUBLIC; everything else unchanged. | Keeps v20 as the canonical, future-readable proposal. |

**Files changed (uncommitted):**

| File | Change | Why |
|---|---|---|
| [components/PixieSelector.tsx](components/PixieSelector.tsx) | Added `isAdmin?: boolean` prop + `ALL_OWNABLE_IDS` constant + `effectiveOwnedIds = isAdmin ? ALL_OWNABLE_IDS : ownedIds` everywhere a `.includes()` check runs | PM bug: super_admin (and admin) did not see the cosmetics section unlocked on the dashboard. The `/store` page already bypasses admin (line 36); the in-dashboard PixieSelector did not. Now mirrors the same admin bypass. |
| [app/dashboard/page.tsx](app/dashboard/page.tsx) | Imported `getUserEntitlements` + `UserRole`. Added `role` to `Profile` type + the `profiles` SELECT. Computed `entitlements`. Passes `isAdmin={entitlements.isAdmin}` to PixieSelector. | Wires the admin bypass through to the cosmetics UI. |
| [README.md](README.md) | Migration table extended v15 → v19; v19 row marked `⏳ Pending (proposed 16 May 2026)` | Table was stuck at v14; v15-v18 already applied but undocumented; v19 needs a row |
| [DESIGN.md](DESIGN.md) | Removed stale "btn-neon-blue undefined" ambiguity in §5.8, §8 rule 15, §"Known Ambiguities". Class is defined in `globals.css:162` | Doc was incorrect; verified the utility exists |
| [supabase/migration_v20_security_hardening.sql](supabase/migration_v20_security_hardening.sql) | **PROPOSAL — not applied** | Addresses remaining Supabase advisor findings: `dilemma_feedback_stats` SECURITY DEFINER view, 7 functions with mutable `search_path`, `poll_votes` open-insert policy, 9 SECURITY DEFINER functions callable from anon. Includes verification queries + per-section apply-or-skip decisions. |
| [vitest.config.ts](vitest.config.ts) | New | Vitest scaffold. `@/` alias, node env, v8 coverage on `lib/**/*.ts`. |
| [tests/unit/safe-redirect.test.ts](tests/unit/safe-redirect.test.ts) | New | 8 unit-test cases on `lib/safe-redirect.ts` as the pattern for follow-on tests. |
| [tests/README.md](tests/README.md) | New | Install instructions for vitest + priority list of next libs to cover (entitlements, admin-guard, redis, missions/complete, events/track, quality-gates). |
| [reports/disaster-recovery-runbook.md](reports/disaster-recovery-runbook.md) | New | DR runbook covering 7 incident scenarios + a one-time mitigations checklist (PITR, Upstash backups, Redis snapshot to storage, Resend DNS, Vercel branch protection, Sentry decision). |
| `reports/dilemma-visibility-audit-2026-05-07.md` | Moved → `reports/archive/` | > 7 days old, archive per CLAUDE.md hygiene rule. |
| `reports/blog-cluster-gaps-2026-05-09.md` | Moved → `reports/archive/` | Same. |

**Deps installed:** `vitest@^4.1.6` + `@vitest/coverage-v8@^4.1.6` as
devDependencies. Scripts wired in `package.json`: `npm test`, `npm run
test:watch`, `npm run test:coverage`. 8/8 tests passing on
`tests/unit/safe-redirect.test.ts`.

**Post-apply state (16 May, evening):**

Top three remaining blockers (all HUMAN_ONLY):
1. **Stripe live QA** — carta reale on splitvote.io/profile, verify
   `is_premium=true` + PRO badge + cancel via portal.
2. **AdSense slot IDs + approval check** — Vercel env vars +
   dashboard.google.com/adsense.
3. **HIBP toggle** — Supabase Auth → Settings → Password protection (30
   seconds).

Plus the small patch:
4. **Apply patch-revoke-public.sql** — 2 REVOKE FROM PUBLIC ops Claude
   couldn't apply via MCP (classifier blocked the follow-up). 30 seconds.

Other backlog (lower priority): poll_votes A/B decision, Stripe cosmetic
14 price IDs, backup config (PITR/Upstash/Resend DNS), DPA formali.

---


---

## 1. Production State

- **Branch:** `main`
- **Local vs remote:** **in sync** — all commits below pushed
- **Last pushed:** `bd2d46f` — perf(middleware): narrow matcher to auth-relevant routes only

### Recent commits — session 16 May 2026 (10 commits, latest first)
| Hash | Description |
|---|---|
| `bd2d46f` | perf(middleware): narrow matcher to auth-relevant routes only (EDGE-CACHE-HEADERS-01) |
| `edaa63c` | fix(blog): make Redis published posts ISR-safe (BLOG-REDIS-SEO-01) |
| `9ee07f1` | chore(db): apply session bundle to prod + patch REVOKE FROM PUBLIC |
| `bf3d2d9` | chore(db): populate v20 with real advisor names + expand apply bundle |
| `d5e6ac9` | chore(db): bundle 4 DB operations for manual apply |
| `a0d589a` | chore(audit): docs cleanup + v20 proposal + vitest scaffold + DR runbook |
| `cc45743` | fix(dashboard): admin bypass on PixieSelector — every cosmetic shown as owned |
| `4c61022` | fix(types): accept optional votesToday prop in DailyMissions |
| `504b3b8` | fix(dashboard): null guard on b.badges in BadgeSection + page |
| `7a55801` | fix(dashboard): null guard on b.badges before .map() |

### Recent commits — session 15 May 2026 (10 commits)
| Hash | Description |
|---|---|
| `29430a9` | perf(pixie): migrate <img> to next/Image across 5 components |
| `cc6d733` | fix(ux+perf): pixie thumbnail breathing room + code-split modals |
| `968d5d1` | fix(dashboard): error boundary + force-dynamic + defensive logging |
| `7d130fa` | fix(seo): STATIC_LAST_MOD fallback per ?? now residuals in sitemap |
| `b8f0efc` | fix(seo): stable sitemap lastModified for static pages |
| `f6bb4c7` | fix(ux+i18n): Pixie nav discoverability + complete IT aria-labels in store |
| `1561717` | feat(store): unify /store with new client, admin bypass, fix Stripe webhook |
| `8f74cd4` | fix(seo): extend reciprocal hreflang to /trending + /faq, unify it-IT tag |
| `84c77ca` | fix(seo): add reciprocal hreflang + crawlable IT link on home EN |
| `19ca6bc` | feat: add opportunity packs and blog structured data (BlogPosting JSON-LD) |

### Earlier commits — session 13 May 2026 (Sprints M–U + Fixes Y/Z)
| Hash | Description |
|---|---|
| `4e636d1` | fix(ux): mission targets → /trending; leaderboard back-nav on profile (Fix Y+Z) |
| `1c95380` | docs: update CURRENT_HANDOFF — Sprints M/N/O/Q/R/S/T/U (13 May afternoon) |
| `fbbe41d` | feat(sprint-t+u): XP+level on public profile, leaderboard metadata updated |
| `10998fa` | feat(sprint-s): streak saved toast on /play after voting when streak at risk |
| `28a9260` | feat(sprint-q): hreflang alternates on EN category pages |
| `acbe29a` | feat(sprint-n): sticky "See Results" CTA on /play after first vote |
| `d943bc5` | feat(sprint-o): +50 XP pill on DailyDilemma vote card |
| `2ea200a` | fix(sprint-m): challenge_friend mission via challenge_link_copied event |
| `8198753` | feat(sprint-h): elevate streak to first-class dashboard retention signal |
| `433ec8c` | perf(sprint-i): swap getDynamicScenarios → getCachedDynamicScenarios in IT results page |

---

## 1a. What changed today (16 May 2026) — Dashboard FK + build break + DB root cause

### Dashboard FK orfana — sintomo (PM-driven, commits 7a55801 + 504b3b8)
- Digest `2512231454`: `userBadges.map` accedeva a `b.badges.name/.emoji` quando il join `badges(...)` ritornava `null`. Fix: `.filter(b => b.badges != null)` prima del `.slice(0,5).map(...)` nell'header del dashboard.
- Digest `1932806716`: stesso pattern propagato a `<BadgeSection>` (e all'`equippedBadge.badges.name` nel titolo). Fix: filter sui props passati al component + null guard sul title.

### Build break post-fix — `4c61022` (Claude)
- Il fix `504b3b8` aggiungeva `<DailyMissions votesToday={...} />` sul dashboard ma il component `Props` non dichiarava `votesToday`. Vercel build TypeScript falliva.
- Fix: aggiunto `votesToday?: number` (opzionale) su [components/DailyMissions.tsx](components/DailyMissions.tsx). Tutti gli altri caller continuano a compilare; quando vuoi renderizzare la prop nella UI dimmelo (5 min di refactor del component body).

### VERA root cause — analisi Supabase MCP
- `badges` table aveva **RLS enabled** ma **0 policies** (confermato da Supabase security advisor + query a `pg_policy`).
- Conseguenza: ogni query authenticated col join `badges(...)` riceveva `badges: null` per ogni riga. Il fix difensivo del PM (filter null) elimina il crash, ma il **side effect è che la badge collection del dashboard è VUOTA per tutti gli utenti** finché non si aggiunge una RLS policy SELECT.
- Verificato anche: **zero FK orfane** in `user_badges` (11 righe totali, tutte con badge valido). Quindi non era un problema di FK orfana — era un problema di permessi RLS.

### Migration v19 proposta (NON APPLICATA — PM action)
- File: [supabase/migration_v19_badges_rls_and_fk_hardening.sql](supabase/migration_v19_badges_rls_and_fk_hardening.sql)
- Contenuto:
  1. `CREATE POLICY "Anyone can read badge definitions" ON public.badges FOR SELECT TO anon, authenticated USING (true)` — chiude il root cause
  2. `user_badges.badge_id` FK da `NO ACTION` → `ON DELETE CASCADE` — preventivo (idempotenza: 0 orphan attuali)
  3. Cleanup query commentata per orphan futuri
  4. 3 query di verifica post-apply
- **Da eseguire da te in Supabase SQL Editor** (HUMAN_ONLY per regola CLAUDE.md su database migrations). Effetto atteso: dashboard ricomincia a mostrare i badge utente correttamente.

### Altri security advisor (medio-bassa priorità)
| Level | Item | Note |
|---|---|---|
| ERROR | `dilemma_feedback_stats` view is SECURITY DEFINER | Verifica intent — la view può bypassare RLS della tabella sottostante |
| WARN | 7 functions con `search_path` mutable | Minor SQL injection vector — hardening cosmetico |
| WARN | `poll_votes` RLS policy "Anyone can insert votes" `WITH CHECK = true` | Voluto? Verifica intent |
| WARN | 9 `SECURITY DEFINER` functions callable da anon/authenticated | Audit per ognuna se intent corretto |
| WARN | `auth_leaked_password_protection` disabilitato | Best practice Supabase — abilitare in Auth → Password protection |

---

## 1b. What changed today (15 May 2026) — SEO + Dashboard + Pixie polish

### SEO discovery sprint (5 commits)
- **Home EN hreflang reciproci + crawlable IT link** (`84c77ca`): `app/page.tsx` ora dichiara `alternates.languages` + rende un `<a href="/it" hrefLang="it">Vai alla versione italiana →</a>` server-rendered nel JSX. Root cause `/it` "Unknown to Google" chiusa.
- **`/trending` + `/faq` hreflang reciproci** (`8f74cd4`): aggiunte `alternates.languages` mancanti + unificato `it` → `it-IT` su `/blog` EN+IT.
- **Sitemap freshness** (`b8f0efc` + `7d130fa`): introdotta const `STATIC_LAST_MOD = new Date('2026-05-15')` per le pagine statiche; sostituito `lastModified: now` con date stabile (Google deprioritizza crawl quando ogni URL dice "modified just now" ad ogni fetch). Mantenuti timestamp reali per AI scenarios (`approvedAt/generatedAt`) e blog post (`post.date`).
- **Live now:** sitemap.xml mostra 236 URL su `2026-05-15T00:00:00.000Z` + altri con date reali; nessun timestamp `now`-style residuo dopo `7d130fa`.

### Dashboard recovery (1 commit)
- **`968d5d1`** fix(dashboard): Application error "Digest 2512231454" → graceful error boundary
  - Nuovo `app/dashboard/error.tsx`: UI EN/IT fallback con retry button + digest visibile
  - Aggiunto `export const dynamic = 'force-dynamic'` su `app/dashboard/page.tsx` (era senza directive, default era ISR — questo causava "vedo sempre gli stessi quesiti votati")
  - Aggiunto logging difensivo `[dashboard]` su ogni query Supabase + catch branches per `user_purchases` e `getDynamicScenarios`. Vercel logs ora identificano la root cause vera del digest specifico.
  - Renamed `import dynamic from 'next/dynamic'` → `nextDynamic` per evitare shadow con `export const dynamic`.

### Pixie polish (2 commits)
- **`cc6d733`** fix(ux+perf): pixie thumbnail breathing room + code-split modals
  - `MobileStickyHUD` thumb: +`p-0.5` padding interno
  - `CompanionDisplay` main avatar: +`p-1.5` padding nel button 80×80
  - `CompanionDisplay` compact thumb: +`p-0.5` padding
  - `PixieLevelUpModal` + `PixieDetailModal` ora code-split via `next/dynamic` + `ssr:false` (~45KB combinati uscono dal bundle iniziale)
- **`29430a9`** perf(pixie): `<img>` → `next/Image` su 5 componenti
  - Pixie PNG sono 256×256, `next/Image` ora gestisce srcset + AVIF/WebP + lazy loading nativo
  - `priority` su MobileStickyHUD (sticky, sempre visibile) e CompanionDisplay hero (LCP-critical)

### Store + admin bypass (1 commit — sprint del PM)
- **`1561717`** feat(store): `/store` ora usa lo stesso client di `/it/store` (legacy retired); admin vede tutti i prodotti unlocked in store + dashboard; equip APIs (pixie/cosmetic/toggle) accettano admin bypass; webhook Stripe one_time_purchase scrive `product_type`, `stripe_payment_intent_id`, `status='completed'` in `user_purchases`.

### Opportunity packs + BlogPosting JSON-LD (1 commit)
- **`19ca6bc`** feat: scripts/generate-opportunity-pack.mjs + content-output bioethics-bodyoids pack + BlogPosting schema + ImageObject + OG/Twitter `summary_large_image` su blog EN+IT.

### What I deferred (PM has uncommitted blog content)
- **`lib/blog.ts` split** (7k righe → posts-en/posts-it/api): rinviato perché PM ha 4 nuovi articoli (bodyoids, frontier-ai, moral-injury, limerence) non committati nello stesso file → alto rischio merge conflict. Da fare dopo che PM committa i posts.
- **Internal linking sui 4 nuovi articoli**: stesso file, stesso rischio. Riprendere dopo commit PM.

### PM action SQL fornito (HUMAN_ONLY)
```sql
UPDATE profiles SET role = 'admin'
WHERE email = 'alphablacklady83@gmail.com' AND role <> 'super_admin';
```
Da eseguire in Supabase SQL Editor per dare admin normale all'utente segnalato.

---

## 2. What changed 13 May 2026 — end of day

### Fix Y — Back-nav leaderboard → public profile
- `app/u/[id]/page.tsx`: reads `searchParams.from`, renders `← Leaderboard` (en) / `← Classifica` (it) when arriving from the leaderboard, fallback to `← SplitVote` otherwise
- `app/leaderboard/page.tsx`: user links now carry `?from=leaderboard`
- `app/it/leaderboard/page.tsx`: user links carry `?from=it-leaderboard`

### Fix Z — Mission deep-link targets
- `components/DailyMissions.tsx`: `vote_3` and `vote_2_categories` now link to `/trending` (en) / `/it/trending` (it) instead of `/moral-dilemmas` SEO landing — direct path to voting reduces friction for mission completion

### Sprints W / V / X — already implemented, no-op
- Confirmed during code review that the pm-orchestrator candidates were already shipped:
  - Sprint W (DailyDilemma full-card click): absolute overlay `Link` already present in `components/DailyDilemma.tsx` (added in Sprint O)
  - Sprint V (Mission deep links): `MISSION_TARGETS` map + `<Link>` rendering already in `components/DailyMissions.tsx`
  - Sprint X (Blog 2-col grid + share): `BlogGrid` already uses `md:grid-cols-2 lg:grid-cols-3`; `BlogShareButton` already on cards and on article page (`components/BlogArticle.tsx`)

---

## 2b. What changed today (13 May 2026) — afternoon session

### Sprint U — XP + Level on Public Profile
- `app/u/[id]/page.tsx`:
  - Added `import { getLevelInfo } from '@/lib/missions'`
  - Computed `streakDays` and `levelInfo` from profile data
  - Expanded stats grid from 2-col (xs) to `grid-cols-2 sm:grid-cols-4` — now shows 4 cards
  - New stat card: **Lv.N** (color from `levelInfo.color`) + XP count
  - New stat card: **streak** — orange border/bg + 🔥 when active, muted dash when zero

### Sprint T — Leaderboard Metadata Update
- `app/leaderboard/page.tsx` + `app/it/leaderboard/page.tsx`:
  - Updated `metadata.description` (EN + IT) to mention XP alongside votes and streaks
  - Minor OG/twitter copy parity

### Sprint S — "Streak Saved!" Toast on /play
- `app/play/[id]/VoteClientPage.tsx`:
  - Added `streakSaved` state
  - When `streakAtRisk && streakDays > 0`: shows full-screen overlay toast (🔥, orange, EN/IT) then redirects after 1.2 s
  - Non-streak votes redirect immediately as before

### Sprint R — Top XP Leaderboard Section
- `app/leaderboard/page.tsx` + `app/it/leaderboard/page.tsx`:
  - Extended `ProfileRow` type with `xp: number | null`
  - Added third Supabase query: `xp desc`, `gt('xp', 0)`, limit 50
  - New "⚡ Top XP — Missions & Engagement" section (purple accent, `hover:border-purple-500/30`)
  - IT copy: "⚡ Top XP — Missioni & Impegno"

### Sprint Q — hreflang on EN Category Pages
- `app/category/[category]/page.tsx`:
  - Added full `languages` block to `alternates`: `en`, `it-IT`, `x-default`
  - Matches IT category page pattern for Search Console hreflang parity

### Sprint O — +50 XP Pill on DailyDilemma
- `components/DailyDilemma.tsx`:
  - Yellow XP pill (`+50 XP`) shown only when `mounted && !isVoted` — disappears after voting
  - Inline style: `text-yellow-300 bg-yellow-500/15 border-yellow-500/30`

### Sprint N — Sticky "See Results" CTA on /play
- `app/play/[id]/VoteClientPage.tsx`:
  - After voting: sticky bottom bar slides up after 250 ms delay
  - Shows "See Results →" (EN) / "Vedi Risultati →" (IT), links to results page
  - Respects `prefers-reduced-motion` (appears instantly)
  - `env(safe-area-inset-bottom)` for iPhone notch
  - GA4: `see_results_clicked` event on tap

### Sprint M — challenge_friend Mission Fix
- **Root cause**: `challenge_friend` mission required `referral_visit` events (someone else clicking the user's referral link) — not in user's direct control, mission was effectively impossible.
- **Fix**: switched to `challenge_link_copied` event fired client-side when user taps "Copy Challenge" in `copyChallenge()`.
- `app/results/[id]/ResultsClientPage.tsx`: added `trackServerEvent('challenge_link_copied')` in `copyChallenge()`
- `app/api/missions/route.ts`: added `CHALLENGE_EVENT_TYPES`, `countChallengeEventsToday()`, wired into `challenge_friend` + `share_and_challenge` progress
- `app/api/missions/complete/route.ts`: both mission completion checks now use `challenge_link_copied` events

### Sprint P — Blog Workflow (no-op)
- GenerateDraftPanel + BlogDraftQueue already wired in admin "Blog" tab with full approve/reject/publish flow. EN+IT blog pages already read from `blog:published`. No code changes were needed.

---

## 3. What changed earlier today (13 May 2026) — morning session

### Sprint H — Dashboard Streak Retention UI
- `components/DailyMissions.tsx`: replaced small inline streak text with a prominent orange banner card (fire icon, day count, "keep streak alive" copy, EN/IT)
- `app/dashboard/page.tsx`:
  - Moved `<DailyMissions>` above `<CompanionDisplay>` — first thing returning users see
  - Replaced "Polls submitted" stat with **streak counter**; highlights in orange with 🔥 emoji when `streakDays > 0`
  - Added `statsStreak` key to EN/IT COPY object

### Sprint I — IT Results Page Cache Parity
- `app/it/results/[id]/page.tsx`: swapped `getDynamicScenarios()` → `getCachedDynamicScenarios()` (import from `@/lib/cached-data`)
- IT results page was the only remaining route calling the uncached version; now matches EN behavior (1-hour `unstable_cache`)

### Sprint G — Sticky "Next Dilemma" CTA
- `app/results/[id]/ResultsClientPage.tsx`:
  - Sticky bar now shows on all screen sizes (was mobile-only with `sm:hidden`)
  - Slides up 200 ms after `revealed` state fires (`translate-y-full` → `translate-y-0`)
  - Respects `prefers-reduced-motion` (appears instantly with no animation)
  - `env(safe-area-inset-bottom)` padding for iPhone notch
  - Fixed forward-reference bug: `showStickyNext` moved before all effects

### Sprint F-B — useLocale() Hook
- NEW `hooks/useLocale.ts`: centralizes `usePathname()` + `/it` prefix detection
- Updated: `AuthButton`, `NavLinks`, `Footer`, `CookieConsent`, `AdBlockBanner`, `MobileMenu`, `LocaleAwareLogo`

### Sprint E — ISR Performance Fix
- **Root cause**: `getFreshDynamicScenarios()` calls `unstable_noStore()` inside — any page that called it was forced into dynamic server-rendering on every request (no ISR), even though `getCachedDynamicScenarios()` with `unstable_cache` + `revalidate:3600` already existed in `lib/cached-data.ts`.
- **Fix**: Swapped `getFreshDynamicScenarios` → `getCachedDynamicScenarios` in 6 pages + added `export const revalidate = 3600` to the 4 that had no revalidate directive + replaced `export const dynamic = 'force-dynamic'` with `export const revalidate = 3600` in the 2 category pages.
- **Pages fixed**: `app/page.tsx`, `app/it/page.tsx`, `app/trending/page.tsx`, `app/it/trending/page.tsx`, `app/category/[category]/page.tsx`, `app/it/category/[category]/page.tsx`
- **Verified**: Build output confirms `/` `○`, `/it` `○`, `/trending` `○`, `/it/trending` `○` (all Static/ISR); `/category/*` and `/it/category/*` `●` (SSG). Previously all were `ƒ` (Dynamic, per-request).
- **On-demand invalidation**: Already wired — `revalidateTag('dynamic-scenarios')` in admin approve routes fires immediately when a new dilemma is approved, so cache is always fresh.

---

## 3. What changed 12 May 2026

### Sprint A — Performance Pass
- `/u/[id]/page.tsx`: `force-dynamic` removed → `revalidate:3600`; uses `createPublicClient()` (no cookies → ISR-safe)
- `lib/supabase/server.ts`: added `createPublicClient()` — anon key, no cookie dependency
- `app/blog/[slug]/page.tsx` (EN + IT): `force-dynamic` → `revalidate:3600`
- `app/dashboard/page.tsx`: reads `lang-pref` cookie → passes `locale` to CompanionDisplay + DailyMissions + PixieSelector; `next/dynamic` for OnboardingModal + BadgeSection

### Sprint B — PixieSelector Redesign + i18n
- `components/PixieSelector.tsx` fully rewritten:
  - "Currently Equipped" banner showing active skin + rarity chip
  - Filter tabs All / Owned / Store on Pixie skin grid (owned count badge)
  - Non-owned items: shop link instead of greyed lock
  - Full COPY object EN/IT — no more hardcoded Italian

### Sprint C — UI Polish + i18n
- `lib/rarity.ts`: single source for RARITY_STYLES + RARITY_GLOW + RARITY_ORDER
- Removed 4 inline duplicates (u/[id], dashboard, BadgeSection, ProfileClient)
- A/B color consistency: vote history blue/purple → red/blue (A=red, B=blue app-wide)
- Dashboard stats grid: `grid-cols-4` → `grid-cols-2 sm:grid-cols-4` (mobile fix)
- Dashboard full i18n: COPY EN/IT for all visible strings; STATUS_BADGE localized

### Launch Fixes
- `app/layout.tsx`: inline script sets `html[lang]='it'` for /it/* routes
- `vercel.json`: 301 redirect www.splitvote.io → splitvote.io (source fixed to `/:path*`)
- `app/api/profile/equip-pixie/route.ts`: import fix `lib/pixie-store` → `lib/cosmetics-store`
- `app/api/stripe/webhook/route.ts`: refund handler now revokes `pixie_xp.active` + `use_pixie_avatar` when refunded item was the active one

### Sprint D — Launch Polish
- `app/sitemap.ts`: added `/leaderboard` + `/it/leaderboard` (changeFreq: hourly, priority 0.85/0.80)
- `app/leaderboard/page.tsx` + `app/it/leaderboard/page.tsx`: added `openGraph` + `twitter: summary` metadata
- `app/results/[id]/ResultsClientPage.tsx`:
  - `signup_cta_clicked` event on anon "Join free" CTA
  - `copy_link_clicked` → `share_clicked { target: 'copy_link' }` (unified)
  - `handleWebShare` tracks only on successful completion, not on intent/cancel
- `components/DilemmaCardShareButton.tsx`: track after `shareQuestion()` resolves, skip on `'cancelled'`
- `components/BlogShareButton.tsx`: track only on `'shared'`/`'copied'`, skip on `'cancelled'`

### Leaderboard + GA4 Login Events (commit f3413e1)
- `app/leaderboard/page.tsx` + `app/it/leaderboard/page.tsx`: NEW pages — ISR revalidate:600, top 50 voters + top streaks, medals 🥇🥈🥉, links to /u/[id], try/catch for build-time env absence
- `components/Footer.tsx`: Leaderboard link added EN/IT
- `components/MobileMenu.tsx`: Leaderboard link added with Users icon
- `app/login/page.tsx`: GA4 events `login_started`, `login_completed`, `signup_completed`, `signup_initiated`

### Vercel deploy issue (discovered + fixed today)
- **Root cause 1**: Claude Code commits used `SplitVote <hello@splitvote.io>` as git author — Vercel blocks deploys from unrecognized emails. Fix: always use `mat.pizzi@gmail.com` (git config already correct locally, issue was session-level override).
- **Root cause 2**: `vercel.json` redirect had `"source": "/(.*)"` — Vercel requires `"source": "/:path*"` when using `:path*` in destination. Fixed in `7f7cbf8`.
- **Going forward**: auto-deploy via GitHub App should work again now that both issues are resolved.

---

## 3. Feature State

| Feature | State |
|---|---|
| Anonymous vote flow | ✅ working |
| EN/IT routes | ✅ complete + locale-isolated |
| html[lang] on IT pages | ✅ inline script in layout |
| www → non-www redirect | ✅ vercel.json 301 (`/:path*`) |
| Dashboard full i18n | ✅ complete |
| PixieSelector redesign | ✅ Currently Equipped + tabs + i18n |
| RARITY_STYLES consolidated | ✅ lib/rarity.ts |
| Public profile ISR | ✅ revalidate:3600 + createPublicClient |
| Blog ISR (EN+IT) | ✅ revalidate:3600 |
| A/B color consistency | ✅ red/blue everywhere |
| Leaderboard EN/IT | ✅ live — revalidate:600, OG metadata, in sitemap |
| GA4 login funnel | ✅ login_started/completed, signup_completed/initiated |
| GA4 share tracking | ✅ unified share_clicked, tracks only on completion |
| GA4 signup_cta_clicked | ✅ on anon results CTA |
| Stripe refund handler | ✅ revokes active pixie + use_pixie_avatar on refund |
| Vercel auto-deploy | ✅ restored — was blocked by wrong git author email + vercel.json |
| ISR performance (6 EN pages) | ✅ getCachedDynamicScenarios + revalidate:3600 (Sprint E) |
| ISR parity IT results page | ✅ getCachedDynamicScenarios (Sprint I) |
| Dataset SEO structured data | ✅ license + creator + variableMeasured (EN+IT) |
| useLocale() hook | ✅ centralized locale detection across 7 components (Sprint F-B) |
| Sticky next-dilemma CTA | ✅ all screen sizes, slide-up animation (Sprint G) |
| Dashboard streak UI | ✅ prominent banner + orange stat card (Sprint H) |
| challenge_friend mission | ✅ fires on challenge_link_copied (Sprint M) |
| Sticky "See Results" on /play | ✅ slide-up after vote, GA4 tracked (Sprint N) |
| +50 XP pill on DailyDilemma | ✅ shown pre-vote, disappears after (Sprint O) |
| hreflang EN category pages | ✅ en / it-IT / x-default alternates (Sprint Q) |
| Top XP leaderboard section | ✅ EN+IT, purple accent, limit 50 (Sprint R) |
| Streak saved toast on /play | ✅ 🔥 overlay → redirect after 1.2s (Sprint S) |
| Public profile XP + level | ✅ Lv.N card + streak card in stats grid (Sprint U) |
| Leaderboard → profile back-nav | ✅ ← Leaderboard / ← Classifica via ?from= param (Fix Y) |
| Mission deep-link targets | ✅ vote_3 / vote_2_categories → /trending (Fix Z) |
| AdSense slots | ⚠️ slot IDs not set — needs real IDs from Matteo |
| Stripe Premium live QA | ⚠️ Preview OK; live checkout with real card pending |
| AdSense account approval | ⚠️ check status in Google AdSense dashboard |
| Upstash Redis backup | ⚠️ verify automatic backups enabled |
| Supabase PITR backup | ⚠️ verify Point-in-Time Recovery configured |
| Resend SPF/DKIM | ⚠️ verify DNS records in Resend dashboard |
| Cloudflare Email Routing | ⚠️ set up forwarding for @splitvote.io aliases |

---

## 4. Pending Manual Steps (Matteo only)

| Task | Description | Priority |
|---|---|---|
| **Stripe live QA** | splitvote.io/profile → Upgrade to Premium → real card → verify is_premium=true in Supabase + badge PRO in UI | 🔴 HIGH |
| **AdSense slot IDs** | Get real IDs from AdSense → set NEXT_PUBLIC_ADSENSE_SLOT_HOME/PLAY/RESULTS in Vercel env vars | 🔴 HIGH |
| **AdSense approval** | Check dashboard.google.com/adsense — requested ~10 May | 🔴 HIGH |
| **Stripe cosmetics env vars** | 14 price IDs for store (STRIPE_PRICE_PIXIE_CROWN etc.) needed to unlock store purchases | 🟡 MEDIUM |
| **Redis backup** | Upstash console → verify automatic backups enabled | 🟡 MEDIUM |
| **Supabase PITR** | Supabase → Settings → Backups → enable Point-in-Time Recovery | 🟡 MEDIUM |
| **Resend DNS** | Verify SPF + DKIM for splitvote.io in Resend dashboard | 🟡 MEDIUM |
| **Cloudflare Email** | Email Routing → aliases for @splitvote.io | 🟡 MEDIUM |

Note: `migration_v18` (use_pixie_avatar column) was already run on production per session of 12 May.

---

## 5. Do Not Touch

- Auth, middleware, Redis vote logic, Supabase migrations
- Stripe pricing/subscription/webhook without PM GO
- `PRODUCT_STRATEGY.md` + `ROADMAP.md` — local PM changes, leave to Matteo
- `scripts/generate-pixie-assets.mjs` — local changes, leave to Matteo
- `reports/` — historical audits, do not modify
- Production deploy/push — only with explicit PM GO

---

## 6. Known Risks

| Risk | Status |
|---|---|
| Stripe live end-to-end | Preview verified; live checkout with real card not yet QA'd |
| Vercel auto-deploy | Restored — monitor next few pushes to confirm stability |
| Git author email | All Claude Code commits must use `mat.pizzi@gmail.com` — verify git config at session start |
| AdSense approval | Requested ~10 May — status unknown |
| GDPR/CCPA legal review | Required before scaling >50k users/month |
| Stripe cosmetics env vars | 14 price IDs missing → store items show "in arrivo" |

---

## 7. Next Session Prompt

```
Ripartenza sessione SplitVote — 17 Maggio 2026 (post late-evening 16 Mag).

Leggi prima:
- CLAUDE.md
- CURRENT_HANDOFF.md (sezione 0a è la verità più recente)
- git log --oneline -15
- git status --short

State:
- main in sync con origin — last push: bd2d46f (16 Mag, late)
- Blog Redis ISR funzionante, edge cache attivo su public/SEO routes
- DB hardening v19 + v20 §1-§4+§6+§7 applicati; advisor 22 → 11

Lavoro shippato 16 Mag (10 commit):
- Mattina/pomeriggio: dashboard PixieSelector admin bypass, DB bundle apply,
  patch REVOKE FROM PUBLIC, vitest scaffold, DR runbook
- Sera (late):
  * edaa63c — fix(blog): Upstash REST GET + next.revalidate=3600 invece di
    @upstash/redis client (no-store incompatibile con ISR fallback)
  * bd2d46f — perf(middleware): matcher opt-in invece di opt-out → edge cache
    attivo su /blog, /blog/[slug], /sitemap.xml e altre public routes

Top blocker (tutti HUMAN_ONLY):
1. 🔴 Stripe live QA — splitvote.io/profile → carta reale → verifica is_premium=true
2. 🔴 AdSense — slot IDs + approval check su dashboard.google.com/adsense
3. 🔴 HIBP toggle — Supabase Auth → Settings → Password protection (30s)
4. 🟡 Backup/DR — Upstash auto-backup + Supabase PITR + Resend SPF/DKIM
5. 🟡 Stripe cosmetics — 14 price IDs store (STRIPE_PRICE_PIXIE_*)

Open observations (deferred, NOT next sprint blockers):
- /play/[id], /results/[id], /category/* mantengono no-store cache headers —
  root cause distinta da blog (probabilmente cookies()/force-dynamic a livello
  page). Candidato PLAY-EXISTING-VOTE-CLIENT-MOVE-01 se TTFB diventa problema misurato.
- Vercel Attack Challenge Mode potrebbe essere on a livello progetto (bloccava
  curl/WebFetch durante verifica). PM running VERCEL-CHALLENGE-SANITY-01 audit.

Operational policy (immutata):
- Blog publishing rimane MANUALE (admin review → approve → publish)
- NO autopublish di current-events
- Vote flow anonimo frictionless (mai login per votare)

HUMAN_ONLY (mai senza GO esplicito):
- Stripe live checkout QA (carta reale)
- AdSense slot IDs / approval check
- HIBP toggle, backup configuration, Cloudflare Email Routing
- git push senza esplicito GO
- Modifiche a ROADMAP.md / PRODUCT_STRATEGY.md / scripts/generate-pixie-assets.mjs
  (local PM changes, lasciare intatti)

Framework di lavoro attivo: deletion-first.
- Prima dimmi cosa NON costruisco / cosa eliminerei
- Se un workflow non è spiegabile in 5 righe, non automatizzare
- Se uno stato richiede >3 doc per essere capito, consolidare prima
- Production fix con safety workaround → root-cause sprint immediatamente dopo
```
