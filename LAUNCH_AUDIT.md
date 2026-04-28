# SplitVote — Launch Audit

> Audit completo dello stato del progetto al 27 Aprile 2026.
> Aggiornare ad ogni sprint significativo.

---

## A. Completato ✅

### Core Voting
- [x] Vote flow: cookie dedup + 3-tier Redis rate limiting (IP global/scenario/user)
- [x] replaceVote atomic-safe (Lua eval, no partial failure, clamp ≥ 0)
- [x] IP hashing in rate-limit keys (SHA-256, optional RATE_LIMIT_SALT)
- [x] Vote funnel server-side tracking (vote_success, vote_change, vote_duplicate, vote_rate_limited)
- [x] Supabase dedup per utenti loggati (24h change window)
- [x] Results real-time: voti Redis aggregati, share flow completo

### Auth & Gamification
- [x] Supabase Auth + profili pseudonimi (Splitvoter-XXXXXX)
- [x] XP system + streak + companion
- [x] Daily missions server-validated (vote_3, vote_2_categories, daily_dilemma, challenge_friend, share_result)
- [x] Referral/challenge_friend tracking server-side (migration_v9 applicata)
- [x] Share mission server-verified via user_events (migration_v8 applicata)
- [x] Badges (user_badges table, migration_v2 applicata)

### i18n EN/IT
- [x] Route IT complete: /it, /it/trending, /it/play/[id], /it/results/[id], /it/category/[cat]
- [x] Route IT complete: /it/faq, /it/privacy, /it/terms, /it/personality, /it/blog
- [x] i18n copia separata EN/IT in tutti i client component (EN_COPY/IT_COPY pattern)
- [x] Accept-Language redirect per utenti italiani
- [x] LangSwitcher componente su home EN/IT

### SEO Tecnico
- [x] Title deduplication (template layout appende " | SplitVote" automaticamente)
- [x] hreflang EN/IT su play + results + home + blog (reciproci, x-default)
- [x] Canonical corretto per tutte le route
- [x] JSON-LD: Question (play), BreadcrumbList + Dataset (results), FAQPage (home IT), Organization (layout)
- [x] Sitemap locale-aware (dynamic approved + static + blog + categorie + SEO landing)
- [x] robots.txt con /admin/ disallow
- [x] SEO landing pages: /would-you-rather-questions, /moral-dilemmas, /it/domande-would-you-rather, /it/dilemmi-morali
- [x] OpenGraph + Twitter card su tutte le pagine chiave
- [x] Google Search Console verificata + sitemap inviata

### Privacy & Sicurezza
- [x] Privacy policy EN/IT accurata e aggiornata (IP hashing, account data, cookie list)
- [x] Termini di servizio EN/IT
- [x] IP non salvato raw: SHA-256 hash con salt opzionale (RATE_LIMIT_SALT)
- [x] ADMIN_EMAILS server-side only, mai esposto al client
- [x] CRON_SECRET fail-closed (401 se mancante o errato)
- [x] SUPABASE_SERVICE_ROLE_KEY server-side only
- [x] Stripe secrets: solo process.env, nessun valore hardcoded
- [x] OPENROUTER_API_KEY server-side only
- [x] Nessuna PII nei tracking events (solo scenario_id, category, locale, choice)
- [x] Trust strip "Anonymous voting / No account required" su home + vote + footer
- [x] Open Redirect fix: `safeRedirect()` in `auth/callback` e `login/page` — blocca `//`, backslash, URL assoluti
- [x] JSON-LD escaping: `JsonLd.tsx` + VoteClientPage escapa `</script>` injection
- [x] GA proxy hardening: `/api/_g/script` usa solo GA ID configurato, ignora param user-supplied
- [x] API input bounds: metadata 2KB cap, scenarioId pattern, countryCode regex, avatarEmoji max 8, displayName no control chars
- [x] Stripe webhook non logga display name in chiaro; profile/update riduce error log a error code
- [x] Cookie consent banner granulare (28 Apr 2026): Decline / Personalizza / Accetta tutto
- [x] Consent Mode v2: analytics_storage + ad_storage + ad_user_data + ad_personalization — tutti denied by default
- [x] Preferenze granulari: toggle separati Analytics (GA4 + Vercel) e Advertising (AdSense)
- [x] localStorage backward-compat: sv_cookie_consent ('granted'/'denied'/'custom') + sv_cookie_prefs (JSON granulare)
- [x] "Cookie settings" riapribile dal Footer in qualsiasi momento (event: sv:openCookieSettings)
- [x] Privacy policy EN/IT: tutti i processor documentati (Stripe, Resend, Anthropic, OpenRouter, Vercel Analytics)
- [x] Privacy policy EN/IT: GA4 first-party proxy + X-Forwarded-For forwarding dichiarato esplicitamente
- [x] Privacy policy EN: rimossa frase errata "powered by Google's CMP"; banner è custom
- [x] Terms EN/IT allineati: account/gamification, Premium/Stripe, AI content, moderazione
- [x] Terms IT: contatto legale corretto in legal@splitvote.io (era hello@splitvote.io)
- [x] LEGAL.md: gap tracker aggiornato con items chiusi e ancora aperti prima di scaling

### Middleware & Performance
- [x] isAuthRelevantPath(): Supabase auth.getUser() solo su route che lo richiedono
- [x] Route pubbliche (play, results, blog) senza roundtrip Supabase
- [x] Service worker PWA: network-first, skip /api/, offline fallback

### Stripe & Monetizzazione
- [x] Premium subscription MVP (Stripe checkout + customer portal)
- [x] Webhook lifecycle: checkout.session.completed, subscription.updated, subscription.deleted
- [x] Entitlements centralizzati (lib/entitlements.ts): noAds, unlimitedRenames, canSubmitPoll
- [x] AdSense official script (pagead2.googlesyndication.com)
- [x] AdSlot: no ads per admin/premium via /api/me/entitlements

### AI Content System
- [x] OpenRouter draft generation (POST /api/admin/generate-draft — preview + save)
- [x] Cron giornaliero Anthropic Claude (generate-dilemmas — trend signals → draft queue)
- [x] Seed batch 20 drafts (POST /api/admin/seed-draft-batch)
- [x] Draft/approved separation: dynamic:drafts + dynamic:scenarios (Redis)
- [x] Admin approve/reject UI (CronDebug.tsx)
- [x] Novelty dedup guard (threshold 55 per draft save, 75 per autopublish)
- [x] Content inventory + Jaccard dedup (lib/content-inventory.ts + lib/content-dedup.ts)
- [x] Quality gates centralizzati (lib/content-quality-gates.ts) — 12 hard gates
- [x] Autopublish controllato con env var fail-closed (AUTO_PUBLISH_DILEMMAS=false default)
- [x] Content opportunities endpoint (GET /api/admin/content-opportunities)
- [x] Sitemap esclude SEMPRE i draft (doppio filtro)
- [x] Blog: 6 articoli statici in lib/blog.ts (3 EN + 3 IT)

### Social & Viral
- [x] Web Share API + clipboard fallback su results
- [x] Story cards 9:16 PNG (Instagram/TikTok manual share)
- [x] Challenge friend referral (URL con ?ref=<10-hex>)
- [x] Social Content Factory phase 1 (generate:social-content — zero cost, template-based)
- [x] Social links: Instagram @splitvote.io + TikTok @splitvote8 in Footer + Organization JSON-LD

### Admin Dashboard
- [x] KPI: utenti, voti, badge, poll, premium, votes 24h/7d, feedback %
- [x] Charts: votes 14d + signups 14d (dati reali da vote_daily_stats)
- [x] Anonymous vs logged-in breakdown (all-time)
- [x] Draft queue con approve/reject + novelty score + AI badge
- [x] GenerateDraftPanel: preview + save as draft + low-novelty override
- [x] SeedBatchPanel: 20 topics batch generation
- [x] CronDebug: badge ⚡ AUTO per dilemmi auto-pubblicati

### PWA
- [x] site.webmanifest: standalone, shortcuts (Trending + Profile), maskable icons
- [x] Service worker: network-first, cache-first assets, offline fallback /offline
- [x] Installabile da Chrome/Safari

### Email & DNS
- [x] lib/email.ts (Resend wrapper, fail-silent se RESEND_API_KEY mancante)
- [x] Alias @splitvote.io configurati (hello, support, privacy, legal, business, research)

---

## B. Iniziato ma da chiudere ⚠️

### Stripe QA End-to-End
- [ ] Test acquisto premium con carta reale in produzione (non solo webhook simulator)
- [ ] Verificare customer portal funzionante (cancellazione subscription)
- [ ] Idempotenza webhook: session_id già processati in DB per evitare doppio increment
- [ ] Stripe price IDs reali configurati in Vercel (STRIPE_PRICE_ID_PREMIUM + STRIPE_PRICE_ID_NAME_CHANGE)

### Blog Dynamic Storage
- [ ] Progettare BlogDraft schema (vedi ROADMAP — Blog Weekly Generation)
- [ ] POST /api/admin/generate-blog-draft (OpenRouter, save in blog:drafts)
- [ ] Aggiornare route blog/[slug] per leggere da Redis blog:published
- [ ] Admin UI per review blog drafts
- [ ] Cron settimanale generate-blog-draft (schedule: `0 9 * * 1`)

### Social Content Factory Phase 2 (Remotion Video)
- [ ] Template Remotion 1080×1920 per TikTok/Reels (installare solo a sprint dedicato)
- [ ] npm run render-social <dilemmaId>
- [ ] Template EN/IT separati

### Autopublish Quality Gates — Live Test
- [ ] Abilitare AUTO_PUBLISH_DILEMMAS=true in Vercel e monitorare per 7 giorni
- [ ] Verificare che nessun contenuto inappropriato sia stato auto-pubblicato
- [ ] Aggiustare thresholds se necessario (75/75 potrebbe essere troppo conservativo)

### Challenge Friend / Share Result Live Retest
- [ ] Retest challenge_friend mission end-to-end post-reset migration_v9
- [ ] Retest share_result mission con utente reale
- [ ] Verificare referral_visit dedup 1/giorno funziona in produzione

### Category Pages SEO
- [ ] Contenuto editoriale su /category/[cat] e /it/category/[cat] (oggi solo lista dilemmi)
- [ ] h1 + descrizione + FAQ per le categorie principali (morality, technology, society)

---

## C. Da fare 📋

### Performance & Scalabilità
- [x] ISR/dynamic audit completato 28 Apr 2026 — play/results restano force-dynamic (per-user state: cookie anon, Supabase votedIds, nextId personalizzato); home/trending/category già ISR 3600; category pages ora hanno `dynamicParams=false` per 404 immediato su slug invalidi
- [ ] Load test con k6 o Locust: simulare 1000 utenti simultanei su /play/[id] — con force-dynamic ogni request colpisce il server; da fare prima di campagne paid
- [ ] Redis latenza: verificare percentili p99 con Upstash metrics
- [ ] Image optimization: verificare che og-images siano cached e non ri-generate ogni volta
- [ ] Bundle analysis: `npm run build` analizzare JS bundle size — target < 200KB first load

### Analytics & Business Intelligence
- [ ] GA4 funnel: vote → results → share → signup (verificare eventi in GA4 dashboard)
- [ ] Google Search Console: monitorare impressioni/click dopo sitemap submission
- [ ] Business dashboard v1: revenue MRR, premium churn, top converting dilemmi
- [ ] Feedback quality signal: verificare che feedbackScore si aggiorni correttamente nei dynamic scenarios

### AdSense
- [ ] Verifica account AdSense approvato (controlla status in dashboard Google)
- [ ] NEXT_PUBLIC_ADSENSE_SLOT_RESULTS e NEXT_PUBLIC_ADSENSE_SLOT_PLAY con slot ID reali
- [ ] Test ads visibili per utenti anonimi non-premium
- [ ] Monitoring: policy violations alerts

### Legal & Privacy
- [x] Cookie banner granulare con Consent Mode v2 — COMPLETATO 28 Apr 2026
- [x] Privacy policy EN/IT aggiornate con tutti i processor e GA proxy disclosure — COMPLETATO 28 Apr 2026
- [x] Terms EN/IT allineati con AI content, Premium, gamification — COMPLETATO 28 Apr 2026
- [ ] GDPR/CCPA review finale con avvocato prima di scaling (>50k utenti/mese)
- [ ] Google-certified TCF CMP: valutare prima di servire annunci personalizzati in EEA/UK/Svizzera a scala
- [ ] Privacy policy: data processor agreements formali (DPA firmati con Upstash, OpenRouter, Resend)

### Accessibilità
- [ ] WCAG 2.1 AA pass: focus states, color contrast su tutti i componenti
- [ ] Screen reader test: vote buttons e results bars accessibili
- [ ] Keyboard navigation: form + dialogs + modal

### Disaster Recovery & Backup
- [ ] Redis backup strategy: Upstash automatic backups abilitati?
- [ ] Supabase backup: Point-in-Time Recovery configurato?
- [ ] Runbook per: Redis loss (dynamic:scenarios/drafts), Supabase outage, Vercel deploy failure
- [ ] Environment variables backup sicuro (non solo in Vercel dashboard)

### Mobile Store Apps
- [ ] Android TWA: assetlinks.json + APK firmato (Bubblewrap CLI)
- [ ] iOS Capacitor: Universal Links + haptics + native share + local notifications
- [ ] Prerequisito: crescita organica misurabile prima di submission Apple/Google

### DNS & Infrastructure
- [ ] Cloudflare: redirect www → non-www (301) — rischio duplicate content SEO
- [ ] Cloudflare Email Routing: test forward alias tutti gli indirizzi @splitvote.io
- [ ] Resend DNS: SPF + DKIM verificati per outbound email
- [ ] DMARC record: `v=DMARC1; p=quarantine; rua=mailto:hello@splitvote.io`

---

## D. Launch Readiness

### READY_FOR_SOFT_LAUNCH: ✅ YES

**Criteri soddisfatti:**
- Vote flow funzionante e anti-abuse
- i18n EN/IT completo
- SEO tecnico in ordine (sitemap, hreflang, canonical, JSON-LD)
- Privacy policy accurata
- Admin dashboard operativo
- AI content system con quality gates

**Rischi residui accettabili per soft launch:**
- Stripe non testato end-to-end con carta reale (feature non-critica per MVP)
- AdSense non ancora approvato (no revenue impact sul funzionamento)
- DPA formali non firmati con tutti i processor (rischio basso a traffico minimo)

---

### READY_FOR_HIGH_TRAFFIC_LAUNCH: ⚠️ NO

**Blockers prima dell'high-traffic launch:**

1. **Load test**: comportamento sotto 1000+ richieste/secondo non verificato. Redis e Supabase connection pooling non testati sotto stress.

2. **AdSense approval**: account deve essere approvato prima di scalare il traffico. Pubblicità su traffico non approvato può portare alla disabilitazione dell'account.

3. **Google-certified TCF CMP**: per servire annunci personalizzati AdSense in EEA/UK/Svizzera a scala, Google richiede una CMP certificata TCF. Il banner custom attuale è sufficiente per il soft launch; prima di scaling aggressivo valutare CMP certificata (Cookiebot, Axeptio, ecc.).

4. **Stripe QA end-to-end**: con utenti premium reali, i bug nel webhook lifecycle diventano critici (doppio addebito, mancata disabilitazione premium).

5. **Disaster recovery**: senza runbook e backup verificati, un'interruzione Redis o Supabase durante alto traffico è un evento catastrofico senza piano di risposta.

---

### Top 5 Blockers Priorità

| # | Blocker | Impatto | Effort |
|---|---------|---------|--------|
| 1 | Load test + Redis/Supabase stress test | Stabilità a scala | Medio (1 sprint) |
| 2 | Stripe QA end-to-end + webhook idempotency | Revenue + user trust | Medio (1 sprint) |
| 3 | AdSense approval | Monetizzazione | Fuori dal nostro controllo |
| 4 | Google TCF CMP (per personalized ads EEA a scala) | AdSense policy compliance | Basso-medio (libreria esterna) |
| 5 | Disaster recovery runbook | Resilienza operativa | Basso (documentazione) |

---

*Generato automaticamente — aggiornare ad ogni sprint.*
