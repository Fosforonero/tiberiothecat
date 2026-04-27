# SplitVote — Roadmap

> Piattaforma globale di behavioral data gamificata.
> Dilemmi morali in tempo reale → profili morali → loop virali → insight aggregati.

Ultimo aggiornamento: 27 Aprile 2026 (sprint Expert Insight v2)

---

## Stato Attuale

### Sprint Completato — Expert Insight v2 (27 Apr 2026)

**Expert Insight post-voto: struttura, personalizzazione, AI-ready ✅**

- [x] `lib/expert-insights.ts`: interfaccia estesa con `whyPeopleSplit`, `whatYourAnswerMaySuggest {a, b}`, `ExpertPerspective`, `DynamicExpertInsight`
  - 8 categorie completamente riscritte (EN + IT): body più breve e mobile-first, nuovo campo `whyPeopleSplit`, prospettive per scelta A/B
  - Linguaggio cauto obbligatorio: "may suggest", "could indicate" — mai affermazioni definitive sulla psicologia dell'utente
  - Nessun consiglio medico, legale o psicologico professionale — sempre disclaimer esplicito
- [x] `lib/dynamic-scenarios.ts`: campi opzionali `expertInsightEn`, `expertInsightIt` in `DynamicScenario`
  - Draft-only: i campi sono generati dal cron ma visibili solo dopo approvazione admin
  - Override parziale del fallback statico (solo i campi non-null sovrascrivono)
- [x] `app/results/[id]/ResultsClientPage.tsx`: UI Expert Insight ristrutturata
  - Tre sezioni: insight principale → "Why people split" → "What your choice may suggest"
  - "What your choice may suggest" visibile SOLO se l'utente ha votato, con testo specifico per scelta A o B
  - EN_COPY e IT_COPY: nuove chiavi `insightWhySplit`, `insightYourChoice`
  - Merge dinamico: se `expertInsightEn/It` presente nel scenario, override del fallback statico
- [x] `app/api/cron/generate-dilemmas/route.ts`: prompt aggiornato
  - Claude genera `insightBody`, `insightWhySplit`, `insightPerspectiveA/B` come campi opzionali
  - Mapping nei candidate → `expertInsightEn` o `expertInsightIt` a seconda del locale
  - Admin review obbligatoria — mai pubblicati senza approvazione

**Guardrail professionali:**
- Mai: "sei X tipo di persona", diagnosi, prognosi, consiglio clinico
- Sempre: "may suggest", "could indicate", "might reflect" + disclaimer
- AI insights: draft-only → review obbligatoria → approvazione admin → pubblico

---

### Sprint Completato — AI Content Hardening + Audit (27 Apr 2026)

**Quality gates autopublish + content opportunities + launch audit ✅**

- [x] `lib/content-quality-gates.ts`: funzione centralizzata `runQualityGates(input)` — 12 hard gates + 3 warnings
  - Locale valido en/it
  - Question length 20-300 chars
  - OptionA/B length 5-200 chars, max 4:1 ratio
  - SEO title (10-120) e description (20-320) presenti
  - Category valida (8 categorie)
  - Blocklist contenuti pericolosi (espanso da cron BLOCKED_PATTERNS)
  - Language match: IT richiede ≥2 segnali italiani nel testo
  - noveltyScore ≥ 75 per autopublish (stricter di 55 draft threshold)
  - finalScore ≥ 75 per autopublish
  - similarItems count ≤ 2
  - Output: `{ passed, score, reasons[], warnings[] }`
- [x] `lib/dynamic-scenarios.ts`: campi opzionali `autoPublished`, `qualityGateScore`, `qualityGateReasons`, `generatedBy` in `DynamicScenario`
- [x] `app/api/cron/generate-dilemmas/route.ts`: autopublish condizionale
  - `AUTO_PUBLISH_DILEMMAS=true` richiesto esplicitamente — fail closed per default
  - `AUTO_PUBLISH_DILEMMAS_MAX_PER_RUN` (default 1) — max dilemmi auto-approvati per run
  - Quality gates passati → `saveDynamicScenarios()` direttamente (approvato)
  - Quality gates falliti → `saveDraftScenarios()` come prima
  - Metadata salvati: `autoPublished: true`, `qualityGateScore`, `generatedBy: 'cron'`
  - Risultati: `autoPublished` + `savedToDraft` nel response JSON
- [x] `app/api/admin/content-opportunities/route.ts`: GET admin-only read-only
  - Ranked dilemmi più votati (Redis vote counts)
  - Blog topic suggestions per ciascun dilemma (template-based, zero cost AI)
  - Category gaps: categorie senza articolo blog in EN/IT
  - Autopublish status live
- [x] `app/admin/CronDebug.tsx`: badge ⚡ AUTO (cyan) per dilemmi auto-pubblicati; badge QG:{score} per qualityGateScore
- [x] `README.md`: env vars `AUTO_PUBLISH_DILEMMAS`, `AUTO_PUBLISH_DILEMMAS_MAX_PER_RUN`, `BLOG_WEEKLY_DRAFTS`
- [x] `LAUNCH_AUDIT.md`: audit completo stato progetto

**Regole autopublish (da rispettare in tutti gli sprint futuri):**
- `AUTO_PUBLISH_DILEMMAS=false` per default — MAI abilitare senza review quality gates
- Quality gate threshold autopublish: noveltyScore ≥ 75, finalScore ≥ 75 (vs draft threshold 55)
- Blog: NON autopubblicato — richiede storage migration (vedi sotto)
- Admin vede sempre badge ⚡ AUTO sui dilemmi auto-pubblicati

---

### Blog Weekly Generation — Piano Tecnico (da implementare in sprint dedicato)

**Problema**: il blog è attualmente hardcodato in `lib/blog.ts`. Un cron non può modificare file TypeScript in produzione senza commit/deploy.

**Soluzione consigliata**: Redis `blog:drafts` + `blog:published` (pattern identico ai dilemmi)

**Piano dettagliato**:

1. **Storage**: due Redis keys
   - `blog:drafts` (max 10) — bozze generate dal cron
   - `blog:published` (max 30) — articoli approvati per pubblicazione
   - Struttura: array di `BlogDraft` objects con tutti i campi di `BlogPost` + `status: 'draft' | 'published'`

2. **Endpoint generazione**: `POST /api/admin/generate-blog-draft`
   - Admin-only, OpenRouter (modello capace come claude-3.5-haiku)
   - Input: locale, topic (da content-opportunities endpoint)
   - Output: `BlogDraft` salvata in `blog:drafts`
   - NON usa `lib/blog.ts` — salva in Redis
   - Blocco: `BLOG_WEEKLY_DRAFTS=false` (default) → 503

3. **Cron settimanale**: `POST /api/cron/generate-blog-draft` (schedule: `0 9 * * 1`)
   - Chiama `GET /api/admin/content-opportunities` internamente
   - Prende il top topic per locale (EN + IT) non ancora coperto
   - Genera e salva in `blog:drafts`
   - MAI autopubblica (differente da dilemmi — richiede revisione editoriale manuale)

4. **Route pubbliche**: aggiornare `app/blog/[slug]/page.tsx` e `app/it/blog/[slug]/page.tsx` per leggere anche da `blog:published` Redis (in aggiunta a `lib/blog.ts` come fallback statico)

5. **Admin UI**: aggiungere tab "Blog Drafts" in `/admin` con approve/edit/reject

6. **Sitemap**: aggiornare `app/sitemap.ts` per includere articoli da `blog:published`

7. **Env var richiesto**: `BLOG_WEEKLY_DRAFTS=true` — fail closed per default

**Prerequisiti**:
- [ ] Progettare schema `BlogDraft` TypeScript (estende `BlogPost` da `lib/blog.ts`)
- [ ] Aggiornare `lib/blog.ts` per esporre funzioni di lettura/scrittura da Redis
- [ ] Prompt per blog article generation più lungo e strutturato (section-by-section)
- [ ] Admin review obbligatoria — no autopublish per blog, mai
- [ ] Quality check manuale: ogni articolo deve avere disclaimer, no AI hallucinations, link ai dilemmi reali

**NON implementare prima di**:
- Avere ≥ 20 dilemmi approvati (content base per linking)
- Aver testato content-opportunities endpoint in produzione
- Aver abilitato e testato `AUTO_PUBLISH_DILEMMAS` per almeno 7 giorni

---

### Sprint Precedente — Vote Integrity Hardening (27 Apr 2026)

**Integrità voto + rate limiting granulare + funnel tracking ✅**

- [x] **replaceVote atomic-safe**: Lua eval su Upstash Redis — operazione atomica in singolo round-trip, clamp automatico a ≥ 0 prima del decremento. Nessuna possibilità di decremento parziale in caso di errore.
- [x] **Rate limit voto granulare** — 3 livelli via Redis keys con TTL:
  - Tier 1 global IP: 60/ora (era 20 — alzato per compatibilità NAT); key `ratelimit:{ip}`
  - Tier 2 scenario+IP: 5 per dilemma per IP per 10 min; key `ratelimit:scenario:{id}:{ip}`
  - Tier 3 user: 120/ora per utente loggato; key `ratelimit:user:{userId}`
- [x] **Vote funnel server-side tracking** per utenti loggati: `vote_success`, `vote_change`, `vote_duplicate` (con reason: same_option/locked/race_condition), `vote_rate_limited`. Inseriti via admin client in `user_events`. Non-blocking, non bloccano il voto. Anonimi: nessun insert personale.
- [x] **ALLOWED_EVENT_TYPES** in `/api/events/track` aggiornato con i 4 nuovi event type per coerenza di schema.
- [x] Nessuna migration Supabase necessaria — `event_type` è text senza enum constraint.

---

### Sprint Precedente — Hardening Tecnico Pre-Lancio (27 Apr 2026)

**Performance + policy + bug fix ✅**

- [x] **Middleware public route optimization**: `isAuthRelevantPath()` helper — Supabase `auth.getUser()` chiamato solo su `/dashboard`, `/profile`, `/admin`, `/submit-poll`, `/api/admin/*`, `/api/missions/*`, `/api/events/*`, `/api/email/*`, `/api/stripe/portal|subscription`, `/api/me/*`. Tutte le route pubbliche (`/play/*`, `/results/*`, `/blog/*`, etc.) restituiscono `NextResponse.next()` senza roundtrip Supabase.
- [x] **AdSense official script**: rimosso proxy `/api/_g/ads` dal layout — AdSense ora carica da `pagead2.googlesyndication.com` (script ufficiale). `/api/_g/ads` resta ma non usato. Policy-safe per AdSense review.
- [x] **Fix IT "Opzione A/B"**: `optionA`/`optionB` aggiunti a EN_COPY/IT_COPY in `VoteClientPage.tsx` — IT mostra "Opzione A" / "Opzione B" invece di "Option A" / "Option B".
- [x] **Fix OG download extension**: "Save for Instagram" punta a `storyCardUrl` (PNG 9:16) invece che a `ogImageUrl` (SVG) — download attribute aggiornato a `.png`.
- [x] **migration_v9 aggiornata**: README aggiornato → ✅ Applied.

---

### Sprint Precedente — Social Content Factory Phase 1 (27 Apr 2026)

**Pipeline locale caption social da dilemmi approvati ✅**

- [x] `lib/social-content.ts`: tipi TypeScript `SocialContentItem`, `SocialContentBatch`, `SocialPlatform`, `SocialLocale`
- [x] `scripts/generate-social-content.mjs`: script ESM puro Node (senza tsx/ts-node)
  - `loadEnvFile()`: parser manuale `.env.local`, graceful fallback se mancante
  - `STATIC_SCENARIOS` + `IT_TRANSLATIONS`: tutti i 41 dilemmi statici EN/IT inline nel script
  - `HOOKS`: 3 hook per categoria per locale (EN/IT) — selezionati deterministicamente via `hashSeed`
  - `HASHTAGS`: array TikTok e funzione Instagram per locale e categoria
  - `buildTikTokCaption()` / `buildInstagramCaption()`: template puri, zero costo AI
  - `getDynamicApproved()`: import dinamico `@upstash/redis`, filtra `status === 'approved'`
  - `pickN()`: dedup per batch, re-use se pool < N
  - Output: `content-output/YYYY-MM-DD/social-content.{json,md}`
- [x] `package.json`: aggiunto `"generate:social-content": "node scripts/generate-social-content.mjs"`
- [x] `.gitignore`: aggiunto `/content-output/`
- [x] Verificato in locale: 20 item (5 TikTok EN + 5 Instagram EN + 5 TikTok IT + 5 Instagram IT), dynamic approved prioritizzato ✅

**Utilizzo:**
```bash
nvm use && npm run generate:social-content
# Output in content-output/YYYY-MM-DD/social-content.{json,md}
```

**⚠️ content-output/ è gitignored — mai committare output generato.**

---

### Sprint Precedente — Social Links + Referral QA (27 Apr 2026)

**Social presence + caption consistency + referral QA ✅**

- [x] `lib/social-links.ts`: costanti centralizzate per Instagram (`@splitvote.io`) e TikTok (`@splitvote8`)
- [x] `components/Footer.tsx`: link Instagram + TikTok — `target="_blank"`, `aria-label` EN/IT, `rel="noopener noreferrer"`
- [x] `app/layout.tsx`: Organization JSON-LD `sameAs` aggiornato con Instagram e TikTok
- [x] `app/results/[id]/ResultsClientPage.tsx`: caption TikTok e Instagram includono handle ufficiali
  - TikTok EN/IT: aggiunto `@splitvote8` prima degli hashtag
  - Instagram EN/IT: aggiunto `@splitvote.io` + ristrutturato "Link in bio" line
- [x] `README.md`: migration v8 → ✅ Applied; v9 aggiunta come ⏳ Pending; tabella missioni aggiornata
- [x] Referral QA: codice challenge_friend verificato (vedi sotto)

**Referral QA — challenge_friend:**
- ✅ `profiles.referral_code` backfillato per tutti gli utenti esistenti (migration v9)
- ✅ Nuovi profili ricevono `referral_code` via DEFAULT PostgreSQL
- ✅ `/api/referral/visit`: self-referral bloccato (`user?.id === referrerId`)
- ✅ Dedup server-side: 1 `referral_visit` per (referrer_user_id, scenario_id) per giorno
- ✅ Dedup client-side: `sessionStorage` barrier su VoteClientPage
- ✅ `challenge_friend` legge `referral_visit` da `user_events` (non più Coming Soon)
- ✅ Nessun `user_id` raw negli URL: solo `?ref=<10-hex-chars>`
- ⚠️ Visitor anonimi possono triggerare referral_visit (trade-off accettato — sessione dedup mitiga abuse casuale)
- ⚠️ RLS `profiles`: fetch `referral_code` in ResultsClientPage richiede policy `auth.uid() = user_id` (standard Supabase — già presente nelle migration esistenti)

**⚠️ Migration da applicare:**
```sql
-- Supabase dashboard → SQL Editor → supabase/migration_v9_referral_codes.sql → Run
```

---

### Sprint Precedente — challenge_friend Referral Tracking (27 Apr 2026)

**challenge_friend mission — server-verified via referral_code ✅**

- [x] `supabase/migration_v9_referral_codes.sql`: `profiles.referral_code text unique`
  - `left(replace(gen_random_uuid()::text, '-', ''), 10)` — 10 hex chars, URL-safe, non-indovinabile
  - Backfill per utenti esistenti, DEFAULT per nuovi, unique index
- [x] `POST /api/referral/visit`: endpoint senza auth visitatore
  - Admin client risolve `ref` → `referrer user_id` lato server (RLS bypass, sicuro)
  - Self-referral bloccato (visitatore autenticato con stesso `user_id`)
  - Dedup 1/giorno per (referrer, scenario_id)
  - Nessun IP o identità visitatore salvati
- [x] `VoteClientPage.tsx`: prop `referralCode`, `useEffect` chiama `/api/referral/visit` (sessionStorage dedup)
- [x] `ResultsClientPage.tsx`: fetch `referral_code` da profiles, challenge URL include `?ref=<code>`
- [x] `GET /api/missions`: `challenge_friend` rimosso da `COMING_SOON`, progress = `referralVisitsCount`
- [x] `POST /api/missions/complete`: verifica server-side `referral_visit` ≥ 1 per `challenge_friend`
- [x] `app/play/[id]/page.tsx` + `app/it/play/[id]/page.tsx`: `?ref=` passato a VoteClientPage

---

### Sprint Precedente — Share Mission + User Events Tracking (27 Apr 2026)

**share_result mission server-verified + user_events tracking ✅**

- [x] `supabase/migration_v8_user_events.sql`: nuova tabella `user_events`
  - RLS: solo utenti autenticati possono inserire/leggere i propri eventi
  - Nessun accesso anonimo — XP missions richiedono auth
  - Index su `(user_id, event_type, created_at)` per query missioni
  - ⚠️ **NON ancora applicata** — applicare manualmente in Supabase dashboard
- [x] `POST /api/events/track`: nuovo endpoint server-side
  - Allowlist: `share_result`, `copy_result_link`, `story_card_share`, `story_card_download`
  - Auth richiesta — 401 per anonimi (silenzioso nel client)
  - Dedup 60s: skip se stesso (user, type, scenario) inserito nell'ultimo minuto
- [x] `ResultsClientPage.tsx`: tracking server-side collegato a tutti gli share actions
  - Web Share API success → `share_result`
  - Clipboard fallback → `copy_result_link`
  - Story card share (file/URL) → `story_card_share`
  - Story card download (tutti i path) → `story_card_download`
  - Tracking solo su successo (mai su cancel/abort)
  - Anonimi: server restituisce 401 silenzioso, UX invariata
- [x] `GET /api/missions`: `share_result` rimosso da COMING_SOON
  - progress = count eventi share oggi (qualsiasi tipo tra i 4)
  - claimable = true se progress ≥ 1
- [x] `POST /api/missions/complete`: verifica `share_result` via `user_events`
  - Blocca se nessun evento share oggi → 403 con reason
  - Graceful failure se migration non ancora applicata (403 con istruzione)
- [x] `challenge_friend`: resta Coming Soon — nessun referral tracking
- [x] `SeedBatchPanel.tsx`: aggiunto banner "Generated drafts are not public until approved."

**⚠️ Migration da applicare:**
```sql
-- Supabase dashboard → SQL Editor → New query → incolla migration_v8_user_events.sql → Run
```

---

### Sprint Precedente — Mission Validation + Admin Seed Batch UI (27 Apr 2026)

**Mission server-validation + admin seed batch UI ✅**

- [x] `lib/missions.ts`: aggiunto `MissionState` interface (progress, required, completed, claimable, comingSoon)
- [x] `GET /api/missions`: riscritta per restituire stato completo per-missione
  - `vote_3`: conta da `dilemma_votes` oggi — server-verified
  - `vote_2_categories`: conta categorie distinte dai voti di oggi (static + dynamic lookup) — server-verified
  - `daily_dilemma`: almeno 1 voto oggi — server-verified
  - `challenge_friend`: `comingSoon: true, claimable: false` — non tracciabile lato server (ora risolto in sprint successivo)
  - `share_result`: `comingSoon: true, claimable: false` — non tracciabile lato server
- [x] `POST /api/missions/complete`: verifica server-side per `vote_2_categories`
  - Blocca `challenge_friend` e `share_result` (403 — tracking non disponibile)
  - Client non può falsificare nessuna missione verificabile
- [x] `components/DailyMissions.tsx`: UI riscritta
  - Bottone "Claim +XP" solo quando `claimable: true` dal server
  - Progress visibile: `1/3`, `0/2`, ecc.
  - Missioni coming-soon: icona 🔒, non cliccabili, badge "Coming soon"
  - Missioni completate: verde, non cliccabili
  - Errori con `aria-live`, niente crash
- [x] `app/admin/SeedBatchPanel.tsx`: nuovo componente client admin
  - Bottone "Generate 10 EN + 10 IT draft batch" che chiama `POST /api/admin/seed-draft-batch`
  - Usa sessione browser — no curl/cookie manuali
  - Loading state con warning "2-4 min"
  - Summary: total/saved/skipped_novelty/errors
  - Tabella risultati: locale, category, noveltyScore, similar, keyword, question, ID
- [x] `/admin` aggiornato con `SeedBatchPanel`
- [x] `app/dashboard/page.tsx`: rimosso prop `votesToday` (ora calcolato server-side in API)

**Regole missioni (da rispettare in ogni sprint futuro):**
- MAI fidarsi del client per completamento missioni
- `claimable: true` solo se il server verifica i requisiti
- Missioni non tracciabili → `comingSoon: true` — non mostrare come completabili
- XP awarding via DB function `award_mission_xp` con XP hardcoded — no injection

---

### Sprint Precedente — Admin Charts QA + OpenRouter Draft Queue (27 Apr 2026)

**Admin charts QA + OpenRouter save-to-draft-queue ✅**

- [x] `app/admin/AdminCharts.tsx`: empty state + 7d/14d tab toggle
  - `isEmpty` guard — mostra "Not enough data yet" invece di barre vuote
  - Tab 7d/14d con filtro client-side sull'array passato come prop
  - Nessun dato fake generato
- [x] `lib/dynamic-scenarios.ts`: aggiunto `'openrouter'` a `TrendSource`
- [x] `POST /api/admin/generate-draft`: aggiunto `mode: 'preview' | 'save'`
  - `preview` (default): comportamento precedente, non salva
  - `save`: valida, controlla noveltyScore ≥ 55 (threshold), salva in `dynamic:drafts`
  - Dedup guard: blocca save se `noveltyScore < 55` → risponde `409 low_novelty`
  - Override esplicito: `allowLowNovelty: true` nel body bypassa il blocco
  - Blog article save bloccato (→ 400 `blog_article_save_not_supported`) — richiede editing manuale
  - Metadata AI nel DynamicScenario: `trendSource: 'openrouter'`, `trendUrl: model_name`, `scores.noveltyScore`
- [x] `app/admin/GenerateDraftPanel.tsx`: Preview + Save as draft buttons
  - Bottone Preview (sempre disponibile) + Save as draft (solo dilemmi)
  - Dopo save: banner "Saved to draft queue — ID: ai-..."
  - Low novelty: banner warning con bottone "Save anyway (override dedup guard)"
  - `aria-live`, `role="alert/status"`, `aria-busy` per accessibilità
- [x] `app/admin/CronDebug.tsx`: badge AI + noveltyScore per draft OpenRouter
  - `trendSource === 'openrouter'` → badge 🤖 AI (viola)
  - `noveltyScore` mostrato se presente (verde/giallo/rosso)
- [x] `app/api/admin/dilemmas/route.ts`: espone `noveltyScore` nel response

**Regole fondamentali (da rispettare in ogni sprint futuro):**
- Tutti i contenuti generati → `status: draft`, mai autopublicati
- Admin approval obbligatoria prima che un draft entri in route pubbliche o sitemap
- `OPENROUTER_API_KEY` + `OPENROUTER_MODEL_DRAFT` entrambi richiesti — fail-closed
- Nessun secret o prompt nei log
- Novelty threshold: 55/100 — dedup guard blocca save sotto soglia salvo override esplicito
- Blog articles: preview-only in questa fase — editing manuale richiesto in `lib/blog.ts`
- Quest pubblicate solo con ≥3 dilemmi approvati

**Prossimo sprint: Blog article draft queue + scheduled generation**
- Blog article draft queue separata (non Redis dilemmas) — es. Supabase table o Redis key dedicata
- Cron settimanale OpenRouter per mantenere inventory fresca
- Mini quest: aggrega ≥3 dilemmi per tema → pubblica come quest
- Approved dilemmas → sitemap immediata senza redeploy

---

### Sprint Precedente — Email Test + Mobile Menu Polish (27 Apr 2026)

**Email test endpoint + mobile menu groups ✅**

- [x] `POST /api/email/test`: admin test endpoint protetto da `x-email-test-key`
  - Fail-closed se `EMAIL_TEST_KEY` mancante → 503
  - Unauthorized se header errato → 401
  - Destinatari limitati a `hello@splitvote.io` e `support@splitvote.io` — no open relay
  - Usa `sendEmail()` da `lib/email.ts`, nessun secret nei log
- [x] `MobileMenu.tsx`: menu mobile ristrutturato in 4 gruppi logici
  - Gruppo 1 — Main: Home, Trending, Blog (EN/IT)
  - Gruppo 2 — Categories: Morality/Moralità, Technology/Tecnologia, Society/Società, Relationships/Relazioni, Survival/Sopravvivenza
  - Gruppo 3 — Account: My Profile + Dashboard + Sign out (se loggato) / Join free (se anonimo)
  - Gruppo 4 — Help: FAQ, Support (mailto:support@splitvote.io)
  - "Il mio profilo" / "My Profile" rimosso dalle categorie → spostato in Account
  - Sign out button con Supabase client signOut
  - Touch targets min 44px, max-height scroll, locale-aware IT/EN, `next/link` per link interni
  - Account group appare solo dopo risoluzione auth state (no flicker)
- [x] typecheck ✅ · build (0 errori) ✅ · `git diff --check` ✅

**Istruzioni test email:**
```
curl -X POST https://splitvote.io/api/email/test \
  -H "x-email-test-key: $EMAIL_TEST_KEY" \
  -H "Content-Type: application/json" \
  -d '{"to":"hello@splitvote.io"}'
```

---

### Sprint Precedente — Email Setup (Resend) (27 Apr 2026)

**`lib/email.ts` — safe Resend wrapper ✅**

- [x] `resend` ^6.12.2 installato
- [x] `lib/email.ts`: `sendEmail()` — `RESEND_API_KEY` da `process.env`, mai hardcoded
- [x] `EMAIL_FROM` da `process.env`, fallback pubblico `SplitVote <hello@splitvote.io>`
- [x] Fail silenzioso se `RESEND_API_KEY` mancante — `{ ok: false, error: 'email_not_configured' }`
- [x] Nessun secret nei log — solo `error.name` (enum safe), mai chiave API, mai email destinatario
- [x] `.env*.local` già gitignored
- [x] typecheck ✅ · build (138 pagine, 0 errori) ✅ · `git diff --check` ✅

**Env vars richieste in Vercel:**
```
RESEND_API_KEY=re_...           # da resend.com dashboard — NEVER commit
EMAIL_FROM=SplitVote <hello@splitvote.io>   # opzionale, è il default
```

**DNS Resend da configurare su Cloudflare (per inviare da hello@splitvote.io):**
1. Vai su resend.com → Domains → Add domain → `splitvote.io`
2. Resend mostrerà 3 record DNS da aggiungere in Cloudflare:
   - `MX` record (per Resend routing in uscita)
   - `TXT` SPF record: `v=spf1 include:amazonses.com ~all` (o simile, Resend usa SES)
   - `TXT` DKIM record: `resend._domainkey.splitvote.io` → valore CNAME fornito da Resend
3. Aggiungi i record in Cloudflare → DNS → Add Record
4. Attendi propagazione (tipicamente < 5 min con Cloudflare)
5. Clicca "Verify" in Resend dashboard
6. Testa con `resend.emails.send()` da dashboard Resend

⚠️ Nota: Cloudflare Email Routing (inbound) e Resend (outbound) coesistono — non si sovrascrivono. SPF va aggiornato per includere entrambi:
`v=spf1 include:_spf.mx.cloudflare.net include:amazonses.com ~all`

**Stato feature email:**
- `sendEmail()` pronta ma non ancora usata in nessuna route utente
- Non attivare email transazionali utente finché `RESEND_API_KEY` non è verificato in Vercel

---

### Sprint Precedente — SEO Technical Fix (27 Apr 2026)

**Fix tecnici SEO ad alto impatto ✅**

- [x] **Title deduplication**: rimosso suffisso `| SplitVote` da `app/it/page.tsx`, `app/play/[id]/page.tsx`, `app/it/play/[id]/page.tsx`, `app/results/[id]/page.tsx`, `app/it/results/[id]/page.tsx` — il template nel layout lo aggiunge automaticamente
- [x] **hreflang EN/IT su play + results**: aggiunto blocco `alternates.languages` con `en`, `it-IT`, `x-default` a tutte le route play e results (EN e IT)
- [x] **hreflang homepage normalizzato**: `app/layout.tsx` da `'it'` → `'it-IT'`; `app/it/page.tsx` aggiunto `'en': BASE_URL` per reciprocità
- [x] **SEO Landing Pages EN/IT**: `/would-you-rather-questions`, `/moral-dilemmas`, `/it/domande-would-you-rather`, `/it/dilemmi-morali` — 20 items ciascuna, schema.org `ItemList`, hreflang reciproci, sitemap aggiornata
- [x] **JSON-LD su results pages EN/IT**: `BreadcrumbList` + `Dataset` con voti reali (votes.a, votes.b, pctA, pctB) su `/results/[id]` e `/it/results/[id]`

---

### Sprint Precedente — Blog SEO Statico EN/IT (27 Apr 2026)

**Blog implementato e live ✅**

Route create:
- [x] `/blog` — index articoli EN
- [x] `/blog/what-is-a-moral-dilemma`
- [x] `/blog/trolley-problem-explained`
- [x] `/blog/why-people-love-impossible-choices`
- [x] `/it/blog` — index articoli IT
- [x] `/it/blog/cos-e-un-dilemma-morale`
- [x] `/it/blog/problema-del-carrello-spiegato`
- [x] `/it/blog/perche-ci-piacciono-le-scelte-impossibili`

Architettura:
- [x] `lib/blog.ts`: sorgente dati tipizzata con `BlogPost`, `SectionType`, helper `getPost`, `getPostsByLocale`, `getAlternateUrl`, `postUrl`
- [x] `components/BlogArticle.tsx`: renderer condiviso per articoli EN/IT — header, sezioni, dilemmi correlati, CTA, disclaimer
- [x] Tutti i blog route generati come SSG (●) — nessun JS aggiuntivo nel bundle
- [x] `app/sitemap.ts`: aggiunti blog index EN/IT + 6 articoli con `changeFrequency: monthly`
- [x] `components/Footer.tsx`: link Blog EN/IT (prima di FAQ)

SEO:
- [x] Metadata `title`, `description` separati per ogni pagina
- [x] Canonical corretto per ogni route
- [x] `alternates/hreflang` EN↔IT per ogni coppia di articoli
- [x] OpenGraph con `type: article` e `publishedTime` per i post
- [x] Disclaimer leggero su ogni articolo: "Educational content, not professional advice." / "Contenuto educativo, non consulenza professionale."

Contenuto seed:
- [x] 3 articoli EN: moral dilemma, trolley problem, why people love impossible choices
- [x] 3 articoli IT: scritti naturale (non tradotti), stessa struttura
- [x] Ogni articolo collega a dilemmi giocabili reali (trolley, cure-secret, memory-erase, organ-harvest)
- [x] Nessun consiglio medico/legale/psicologico personalizzato

**Backlog blog (non in questo sprint):**
- [ ] Editorial calendar: 1-2 articoli/mese, temi da Search Console performance
- [ ] AI-assisted draft + revisione manuale obbligatoria
- [ ] Ricerca per titolo/tag nel blog index
- [ ] Breadcrumb schema.org JSON-LD per articoli
- [ ] Automatic internal linking via tag condivisi con dilemmi dinamici

---

### Sprint Precedente — QA Post-Deploy + Email/DNS Readiness (27 Apr 2026)

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
- [x] Nessuna email personale hardcoded nel codice sorgente ✅

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

## Prossimo Sprint — Social Content Factory Phase 2 (Remotion Video)

Obiettivo: generare vertical video 1080×1920 MP4 dai dilemmi approvati per TikTok/Reels. **Non installare Remotion prima di iniziare questo sprint.**

**Fase 2 — Remotion vertical video**
- [ ] Installare Remotion solo quando questo sprint inizia
- [ ] Template Remotion 1080×1920 per TikTok/Reels
  - Dati: question, optionA, optionB, emoji, pctA/pctB, categoria
  - Animazioni: reveal risultati, brand colors, neon aesthetic
  - Output: MP4 in `content-output/YYYY-MM-DD/`
  - No auto-post — upload manuale sempre
- [ ] `npm run render-social <dilemmaId>` (script locale, non parte del build Vercel)
- [ ] Template EN/IT separati
- [ ] Integrazione con `generate:social-content` per batch pipeline

**Fase 3 — AI captions (sprint futuro)**
- [ ] OpenRouter caption generation (modello economico, zero costo AI)
- [ ] Output sempre `status: draft` — admin review obbligatoria
- [ ] Nessuna auto-pubblicazione mai

**Vincoli fissi (da rispettare in tutti gli sprint futuri):**
- Nessuna API Instagram/TikTok diretta
- Approvazione manuale obbligatoria prima di qualsiasi post
- Output locale o Supabase — niente publish automatico

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
