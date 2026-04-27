# SplitVote — Roadmap

> Piattaforma globale di behavioral data gamificata.
> Dilemmi morali in tempo reale → profili morali → loop virali → insight aggregati.

Ultimo aggiornamento: 27 Aprile 2026

---

## Stato Attuale

### Sprint Corrente — QA Post-Deploy + Email/DNS Readiness (27 Apr 2026)

**Deploy QA — commit `1dc9b98` live ✅**

Route live verificate:
- [x] `/` → 200
- [x] `/it` → 200
- [x] `/play/trolley` → 200
- [x] `/it/play/trolley` → 200
- [x] `/results/trolley` → 200
- [x] `/it/results/trolley` → 200
- [x] `/site.webmanifest` → 200, JSON valido
- [x] `/offline` → 200
- [x] `/ads.txt` → 200
- [x] `/sw.js` → 200, network-first, skip /api/
- [x] `/api/cron/generate-dilemmas` (no secret) → 401 ✅
- [x] `/api/me/entitlements` (anon) → `{isAdmin:false, noAds:false, ...}` — nessun leak ADMIN_EMAILS ✅
- [x] Hotfix IT copy live: "Condividi risultato", "Prossimo dilemma" ✅

**⚠️ DNS — www/non-www mismatch da risolvere su Cloudflare:**
- `splitvote.io` → 307 → `www.splitvote.io` (Cloudflare redirect)
- Tutti i canonical/OG/sitemap nel codice usano `https://splitvote.io` (no-www)
- **Rischio SEO**: Google vede www ma canonical dice non-www → duplicate content
- **Fix Cloudflare**: Page Rule o Redirect Rule `www.splitvote.io/* → https://splitvote.io/$1` (301)
- Non richede modifiche al codice

**Email/DNS Readiness:**
- [x] `privacy@splitvote.io` — in `/privacy`, `/it/privacy` ✅
- [x] `hello@splitvote.io` — in `/faq`, `/it/faq`, `/it/terms` ✅
- [x] `legal@splitvote.io` — in `/terms` ✅
- [x] `business@splitvote.io` — in `/faq`, `/business` ✅
- [x] `research@splitvote.io` — in `/faq` ✅
- [x] `support@splitvote.io` — aggiunto in Footer (EN: "Support" / IT: "Supporto") ✅
- [x] Nessuna email personale (`mat.pizzi@gmail.com`) nel codice sorgente ✅

**Checklist Cloudflare Email Routing (da completare manualmente):**
- [ ] Nameserver Cloudflare attivi e propagati per `splitvote.io`
- [ ] Email Routing abilitato in Cloudflare dashboard
- [ ] Alias creati e forward verso Gmail testato:
  - `hello@splitvote.io`
  - `support@splitvote.io`
  - `privacy@splitvote.io`
  - `legal@splitvote.io`
  - `business@splitvote.io`
  - `research@splitvote.io`
- [ ] SPF record aggiunto: `v=spf1 include:_spf.mx.cloudflare.net ~all`
- [ ] DKIM abilitato in Cloudflare Email Routing settings
- [ ] DMARC record: `v=DMARC1; p=quarantine; rua=mailto:hello@splitvote.io`
- [ ] Forward testato end-to-end (send test email a ogni alias)
- [ ] Se serve invio outbound: configurare Resend o Postmark (SMTP nativo Cloudflare non disponibile)
- [ ] ⚠️ Correggere redirect www → non-www (vedi sopra)

**Security/Privacy QA:**
- [x] `ADMIN_EMAILS`: solo server-side in `lib/admin-auth.ts`, mai esposto al client
- [x] `CRON_SECRET`: fail-closed — restituisce 401 se mancante o errato
- [x] `SUPABASE_SERVICE_ROLE_KEY`: solo server-side in `lib/supabase/admin.ts`
- [x] Stripe secrets: solo `process.env.*`, nessun valore hardcoded
- [x] Tracking events (`lib/gtag.ts`): solo `scenario_id`, `category`, `locale`, `choice`, `source`, `target`, `action` — nessuna PII, nessuna email
- [x] AdSlot premium/admin no-ads: verificato via `/api/me/entitlements` ✅

**PWA/Service Worker QA:**
- [x] `site.webmanifest`: JSON valido, `display: standalone`, icon purpose separati (`any` + `maskable`), shortcuts ✅
- [x] Service worker: network-first, skip `/api/`, offline fallback su `/offline` ✅
- [x] Service worker non cachea rotte dinamiche (voti, risultati, auth) ✅
- [x] App installabile da Chrome/Safari ✅

---

### Sprint Precedente — Core Loop Retention (27 Apr 2026)

- [x] `lib/gtag.ts`: helper `track(event, params)` — thin wrapper su `window.gtag`
- [x] `lib/scenarios.ts`: `getNextScenarioId(excludeId, dynamicPool?)` — preferisce dynamic approved (top-half per finalScore), fallback statico
- [x] `results/[id]/page.tsx` + `it/results/[id]/page.tsx`: next dilemma usa pool dinamico (preferenza locale IT)
- [x] `play/[id]/page.tsx` + `it/play/[id]/page.tsx`: nextId calcolato e passato a VoteClientPage
- [x] `VoteClientPage.tsx`: prop `nextId`, "Next dilemma" linka a dilemma reale (non home), spinner loading, `track('vote_submitted')`
- [x] `ResultsClientPage.tsx`:
  - Pulsante primario Web Share API `📤 Share result` — testo punchier: `"{pct}% chose {option}. What would you do?"`
  - Fallback clipboard copy se `navigator.share` non disponibile
  - Share text più forte per WhatsApp/Telegram: usa opzione vincente/scelta
  - `track('result_viewed')` su mount
  - `track('next_dilemma_clicked')` sul CTA finale
  - `track('share_clicked', { target })` per tutti i pulsanti share
  - `track('copy_link_clicked')` su copia link
  - `track('story_card_clicked')` su share/download story
  - `<a>` back link → `<Link>` (prefetch)
- [x] `globals.css`: `animate-vote-tap` keyframe solo sotto `prefers-reduced-motion: no-preference`

Backlog da questo sprint:
- [ ] AdSense frequency: 1 slot ogni 3-4 voti con frequency cap — esperimento futuro, non ora
- [ ] Geo Insight privacy-safe: country da profilo volontario, aggregato anonimo, "Italy vs World" solo con campione minimo, niente IP-to-location

---

### Sprint Precedente — PWA Foundation (27 Apr 2026)

Obiettivo: fondazione tecnica comune per web + Android Play Store (TWA) + iOS App Store (Capacitor).
La PWA non è la destinazione finale — è il layer condiviso da cui TWA e Capacitor partono.

- [x] `public/site.webmanifest`: icon purpose separati (`any` + `maskable`), scope, lang, categories, shortcuts (Trending + Profile)
- [x] `app/layout.tsx`: `Viewport` export con `themeColor: '#070718'`, `viewportFit: 'cover'`
- [x] `app/layout.tsx`: `manifest: '/site.webmanifest'` in metadata, Apple PWA meta tags (`apple-mobile-web-app-capable`, `status-bar-style`, `title`)
- [x] `public/sw.js`: service worker minimal, network-first, offline fallback su `/offline`, skip `/api/`
- [x] `app/offline/page.tsx`: pagina offline branded con reload CTA
- [x] SW registration script in `<head>` via `next/script afterInteractive`

**Strategia store (sprint dedicati, NON ora):**

Android Play Store → **TWA (Trusted Web Activity)**
- Nessun WebView custom: Chrome renderizza il sito esattamente come sul web
- Richiede: `/.well-known/assetlinks.json` con SHA-256 APK signing key
- Tool: `npx @bubblewrap/cli init --manifest https://splitvote.io/site.webmanifest`
- Rischio: basso — Google Play supporta TWA esplicitamente
- Feature native minime da aggiungere prima dello store: splash polished, shortcut icone, deep link `/play/[id]`

iOS App Store → **Capacitor (WKWebView wrapper)**
- Stessa codebase web, Capacitor aggiunge bridge nativo
- Richiede: Universal Links (`apple-app-site-association`) per Supabase OAuth callback
- Feature native minime **obbligatorie** per superare Apple review:
  - Haptic feedback sul tap di voto (`@capacitor/haptics`)
  - Native share sheet (`@capacitor/share`) al posto di `navigator.share`
  - Local notification per daily dilemma reminder (`@capacitor/local-notifications`)
  - Splash screen e icon set polished (nessun "web shell" look)
- Rischio Apple review: medio — Apple rifiuta app web-shell senza valore nativo. Mitigazione: le 4 feature sopra + submission dopo crescita organica misurabile

---

### Sprint Precedente — i18n Personality & App Navigation (27 Apr 2026)

- [x] `lib/personality.ts`: archetype + axis IT translations (`nameIt`, `signIt`, `taglineIt`, `descriptionIt`, `traitsIt`, `shareTextIt`)
- [x] `lib/personality.ts`: `getCommunityLabel(locale)` e `getAxisLabel(locale)` locale-aware
- [x] `app/api/personality/route.ts`: `?locale=en|it` — restituisce archetype/axes/communityLabel/messages localizzati
- [x] `PersonalityClient.tsx`: fetch `/api/personality?locale=it` da `/it/personality`, share URL locale-aware
- [x] `NavLinks.tsx`: `<a>` → `<Link>` (next/link) per prefetch app-like
- [x] `MobileMenu.tsx`: link nav `<a>` → `<Link>`
- [x] `app/layout.tsx`: logo link `<a>` → `<Link>`
- [x] `app/dashboard/page.tsx`: tutti i link interni `<a>` → `<Link>`
- [x] `app/profile/ProfileClient.tsx`: "← Dashboard" `<a>` → `<Link>`
- [ ] Bottom nav mobile: valutata, rimandata a sprint UX dedicato (vedi Growth Backlog)

---

### Sprint Precedente — Expert Insight & AdBlock UX (27 Apr 2026)

- [x] `AdBlockBanner`: copy onesto — "I'll whitelist manually" / "Lo aggiungo manualmente" (non implica bypass automatico)
- [x] `AdBlockBanner`: microcopy istruzione manuale EN/IT aggiunto sotto i bottoni CTA
- [x] `lib/expert-insights.ts`: helper statico `getExpertInsight(category, locale)` — 8 categorie, EN/IT
- [x] `ResultsClientPage`: box "Expert Insight" / "Parere esperto" post-risultati con tipo esperto, testo e disclaimer
- [x] Expert Insight: nessuna AI live — template statici per sicurezza, qualità e costi zero
- [ ] AI-generated insights (backlog — richiede admin review obbligatoria, vedere sezione Growth Backlog)

---

### Sprint Precedente — Onboarding & Auth UX (27 Apr 2026)

- [x] `AuthButton`: "Sign In" → "Join free →" — copy più invitante per utenti non tecnici
- [x] `MobileMenu`: CTA auth per utenti anonimi con Supabase check + locale IT/EN
- [x] `app/login/page.tsx`: headline chiaro, 3 benefit bullets, bottoni 48px+, locale-aware IT via `?locale=it`
- [x] `ResultsClientPage`: soft CTA post-voto per anonimi (EN/IT), rilevamento via Supabase client
- [x] Branding: `app/favicon.ico` (4 icone, 113KB) ha precedenza su `public/favicon.ico` — verificato
- [ ] `/it/login` wrapper locale: non implementato (semplice redirect `?locale=it` già sufficiente)

---

### Sprint Precedente — Entitlements & Rename Flow (27 Apr 2026)

- [x] `lib/entitlements.ts` — logica centralizzata admin/premium/free
- [x] `GET /api/me/entitlements` — bridge server-side per client component
- [x] `AdSlot`: no ads per admin e premium (via entitlements API)
- [x] `api/profile/update`: admin bypass rename + premium unlimited rename
- [x] `api/stripe/checkout`: blocco admin da Stripe rename
- [x] `ProfileClient`: card "Admin Access", label rename coerente, no upgrade CTA per admin
- [x] `DashboardPage`: card "Admin Access" per admin, `canSubmitPoll` via ents
- [x] `submit-poll`: usa `/api/me/entitlements` invece di `is_premium` diretto

---

### Live / Implementato
- [x] Next.js App Router + TypeScript + Tailwind + Vercel
- [x] Supabase Auth + profili pseudonimi (`Splitvoter-XXXXXX`)
- [x] Redis per voti real-time
- [x] Dedup voto: cookie, rate limit IP, Supabase per utenti loggati
- [x] Cambio voto entro finestra 24h senza doppio conteggio
- [x] Dashboard utente con storico voti, badge, XP/streak, companion
- [x] Companion system + daily missions
- [x] Story cards 9:16 per Instagram/TikTok manual share
- [x] Admin dashboard con metriche reali da `vote_daily_stats`
- [x] Google Search Console verificata + sitemap inviata
- [x] Logo/favicon PNG ufficiali integrati (rigenerati con AR corretta + og-default.png aggiunto)
- [x] AdBlock banner soft, non bloccante
- [x] i18n lite EN/IT con route SEO italiane
- [x] Cron EN/IT per generazione dilemmi da trend
- [x] Draft queue admin: cron genera draft, admin approva prima della pubblicazione
- [x] Feedback qualità dilemma: 🔥 / 👎 con Supabase + Redis
- [x] Sitemap locale-aware che esclude i draft

### Migration Supabase Applicate
- [x] `migration_v2_safe.sql`
- [x] `migration_v3_engagement.sql`
- [x] `migration_v4_security_hotfix.sql`
- [x] `migration_v5_vote_daily_stats.sql`
- [x] `migration_v6_feedback.sql`
- [x] `migration_v7_stripe_subscriptions.sql`

---

## Blocchi / Rischi

- [x] **Stripe MVP**: chiave revocata, env vars configurate, migration v7 applicata, webhook events verificati.
- [ ] **Build locale**: la shell di default usa Node 14; usare `nvm use` dentro questo repo.
- [ ] **Upgrade framework**: Next 16 + React 19 + Node 24 è uno sprint dedicato, non va mischiato alla push corrente.
- [ ] **Social trend sources**: X/Instagram/TikTok solo con API ufficiali o provider conformi. Niente scraping fragile.

---

## Sprint Corrente — Viral Loop & SEO EN/IT

- [x] Ripristino visual neon home EN/IT
- [x] Sezioni home: Dilemma of the Day, Trending Now, Most Voted, Newly Generated, Browse All
- [x] `DilemmaCard` condivisa con social proof voti
- [x] Generazione dilemmi con scoring:
  - `viralScore`
  - `seoScore`
  - `noveltyScore`
  - `feedbackScore`
  - `finalScore`
- [x] Draft queue admin con approve/reject
- [x] Cron auth compatibile con Vercel `Authorization: Bearer CRON_SECRET`
- [x] Robots con `/admin/` disallow
- [x] SERP base EN/IT: route, metadata, canonical, sitemap

Da verificare post-deploy:
- [x] `/`
- [x] `/it`
- [x] `/trending`
- [x] `/it/trending`
- [ ] `/admin`
- [x] `/sitemap.xml`
- [x] `/robots.txt`
- [ ] `/api/admin/cron-dryrun?locale=en`
- [ ] `/api/admin/cron-dryrun?locale=it`

---

## Prossimo Sprint — Stripe MVP

Prerequisito:
- [x] Revocare chiave Stripe compromessa
- [x] Aggiungere nuova `STRIPE_SECRET_KEY` in Vercel
- [x] Aggiungere/validare `STRIPE_WEBHOOK_SECRET`
- [x] Aggiungere `STRIPE_PRICE_ID_PREMIUM`
- [x] Applicare `migration_v7_stripe_subscriptions.sql`

Scope:
- [x] Premium monthly subscription
- [x] Customer portal
- [x] Webhook robusto per subscription lifecycle
- [x] UI upgrade/downgrade in dashboard/profile
- [x] Gate premium coerenti

---

## Sprint Upgrade Tecnico

Non fare insieme a feature/product sprint.

- [ ] Usare solo runtime di progetto (`nvm use`), senza cambiare default globale
- [ ] Valutare Node 24 LTS in `.nvmrc`
- [ ] Upgrade Next 14 → Next 16
- [ ] Upgrade React 18 → React 19
- [ ] Upgrade ESLint config a stack compatibile Next 16
- [ ] Applicare eventuali codemod App Router (`params/searchParams`)
- [ ] Build locale con Node moderno
- [ ] Deploy preview prima di produzione

---

## Growth Backlog

- [ ] Admin scoring dashboard con breakdown di viral/SEO/novelty/feedback
- [ ] Weekly digest email
- [ ] Friend challenge leaderboard
- [ ] Media kit pubblico con insight aggregati
- [ ] API read-only per ricercatori
- [ ] Video share cards animate
- [ ] Referral system
- [ ] Companion store / cosmetic unlocks — `equipped_frame`, `equipped_badge` già in DB; serve UI store + unlock logic
- [ ] Moral profile compatibility tra amici
- [ ] Zodiac/ascendant overlay opzionale sul moral profile
- [ ] Idempotenza webhook Stripe: storico `session_id` già processati in DB per evitare doppio increment `name_changes`
- [ ] **Expert Insight AI**: generare insight da AI (OpenRouter, modello economico) solo per draft approvati — cache nel record dilemma, admin review obbligatoria, mai live on user request, guardrail per categorie health/legal
- [ ] **Expert Insight store**: colonna `expert_insight_en` / `expert_insight_it` su tabella dilemmas per insight curati manualmente o approvati da admin
- [ ] **Bottom nav mobile**: Home / Trending / Play / Profilo — solo mobile, locale-aware, safe-area, non copre contenuto
- [ ] **AdSense frequency experiment**: mostrare 1 ad ogni 3-4 voti con frequency cap — non bloccare CTA, non interstitial, A/B test
- [ ] **Geo Insight privacy-safe**: "Italy vs World" — country da profilo volontario, aggregato anonimo, soglia minima campione, niente IP-to-location senza base legale
- [ ] **Android TWA (Play Store)**: `/.well-known/assetlinks.json` + APK firmato + Google Play listing — Bubblewrap CLI, SHA-256 signing key, deep link `/play/[id]`
- [ ] **iOS Capacitor (App Store)**: Capacitor bridge, Universal Links per Supabase OAuth, haptics + native share + local notifications + splash — prerequisito: crescita organica misurabile per ridurre rischio Apple review

---

## Metriche Target

| Metrica | Target 30gg | Target 90gg |
|---|---:|---:|
| Voti totali/giorno | 500 | 5.000 |
| Utenti registrati | 500 | 5.000 |
| Dilemmi approvati/settimana | 20 | 100 |
| Share story/giorno | 50 | 500 |
| Premium subscribers | 20 | 200 |
| Business accounts | 0 | 5 |
| Revenue/mese | €0 | €1.000 |
