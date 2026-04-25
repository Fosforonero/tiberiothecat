# SplitVote — Roadmap

> Piattaforma globale di behavioral data gamificata.
> Dilemmi morali in tempo reale → dati demografici aggregati → insight vendibili.

---

## ✅ COMPLETATO

### Infrastruttura
- [x] Next.js 14 App Router + TypeScript + Tailwind + Vercel
- [x] Redis (Upstash) per voti in tempo reale
- [x] Supabase Auth (Google OAuth + email/password)
- [x] Supabase DB (profiles, user_polls, poll_votes, subscriptions, learning_paths)
- [x] Middleware protezione route premium (/dashboard, /submit-poll)
- [x] Security headers (X-Frame, HSTS, CSP, etc.)
- [x] Rate limiting IP-based sull'API voti
- [x] Cron giornaliero auto-generazione dilemmi (OpenAI) — 06:00 UTC

### Contenuto & SEO
- [x] 40+ dilemmi con categorie (Morality, Tech, Society, Love, etc.)
- [x] Filtro per categoria sulla homepage
- [x] Pagine /category/[slug] con JSON-LD
- [x] Pagina /trending
- [x] Sitemap.xml dinamica + robots.ts
- [x] OG image base per condivisione social

### Monetizzazione base
- [x] Google AdSense (annunci reali)
- [x] Adblock bypass: proxy first-party per GA4 e AdSense (/api/_g/)
- [x] Google Consent Mode v2 (GDPR compliant)
- [x] Google Analytics GA4 con transport_url first-party
- [x] Account premium (is_premium flag su profiles)
- [x] Dashboard utente base
- [x] Submit-poll per premium (con moderazione)

### UX
- [x] Cookie consent banner
- [x] Navbar con categorie + AuthButton
- [x] Login/signup page (Google OAuth + email)
- [x] AdBlock detection banner (polite, dismissibile)

---

## 🔧 IN CORSO / PROBLEMI NOTI

- [ ] **AdSense slot IDs** — inserire gli slot ID reali nei componenti AdSlot
- [ ] **Google Auth in Supabase** — verificare che il callback funzioni end-to-end (test manuale)
- [ ] **OG image** — esiste /api/og ma non è ancora collegata alle pagine dilemma individuali

---

## 🚀 SPRINT CORRENTE — User Engagement & Virality

### 1. Answer History (vote tracking per utenti loggati)
- [ ] DB: tabella `dilemma_votes` (user → dilemma_id → A/B, locked after 24h)
- [ ] API: aggiornare /api/vote per salvare voto se utente loggato
- [ ] UI: storico risposte nella dashboard (card per ogni dilemma votato)
- [ ] Lock: dopo 24h il voto è immutabile; mostrare "you voted A" sulla card dilemma

### 2. OG Share Cards virali
- [ ] /api/og/[id] — immagine OG dinamica per ogni dilemma con risultati in tempo reale
- [ ] Share button sulla results page con link pre-formattato per Twitter/WhatsApp
- [ ] "Your result card" — immagine personalizzata "I voted A — 67% agree worldwide"

### 3. Sistema Badge (gamification)
- [ ] DB: tabelle `badges` e `user_badges`
- [ ] Badge earned: First Vote, 10 Votes, 50 Votes, 100 Votes
- [ ] Badge earned: Contrarian (sempre in minoranza), Early Adopter (registrato entro 2025)
- [ ] Badge earned: Category Master (10 voti per categoria)
- [ ] Badge purchasable: frame profilo Gold, Neon, Cosmic (€0.99-€2.99 Stripe)
- [ ] UI: badge display su profilo + badge showcase su share card

### 4. Onboarding Demographics
- [ ] Modal post-login (una volta sola): anno nascita, genere (opzionale), paese
- [ ] Salva su `profiles` (birth_year, gender, country_code)
- [ ] Privacy: dati solo in forma aggregata, mai individuali

---

## 📅 SPRINT 2 — Internazionalizzazione (i18n)

**Impatto stimato: +200-300% traffico organico**

- [ ] Installare `next-intl` con routing /[locale]/
- [ ] Lingue target: EN (default), ES, PT, FR, IT, DE
- [ ] Tradurre UI strings (navbar, bottoni, meta, footer)
- [ ] Tradurre tutti i 40+ dilemmi esistenti
- [ ] Cron: generare dilemmi anche nelle altre lingue (OpenAI)
- [ ] Sitemap multilingua con hreflang
- [ ] OG/meta locali per ogni lingua
- [ ] Google Search Console: aggiungere tutte le proprietà lingua

---

## 💼 SPRINT 3 — Business Accounts & Data Platform

**Revenue target: €199-999/mese per account**

### Organizzazioni (associations, brands, media)
- [ ] DB: `organizations`, `org_members`, `promoted_polls`
- [ ] Signup business con tipo (brand, NGO, academic, media)
- [ ] Promoted polls: associazioni creano dilemmi targetizzati
- [ ] Embed widget: dilemma embeddabile su siti terzi (iframe + API)
- [ ] Dashboard org: analytics propri poll

### Business Analytics Dashboard
- [ ] Breakdown demografico: età (fasce), genere, paese — per ogni dilemma
- [ ] Filtri temporali, filtri categoria
- [ ] Export CSV (piano Pro)
- [ ] API accesso dati (piano Enterprise)
- [ ] Mappe geografiche: heatmap mondiale per ogni dilemma (D3.js o Leaflet)

### Piani e pricing
- [ ] Free: vota, vedi risultati, profilo base
- [ ] Premium Individual €4.99/mo: storico, badge, share card pro, filtri avanzati
- [ ] Business Starter €49/mo: 3 poll/mese, breakdown per paese
- [ ] Business Pro €199/mo: poll illimitati, dati demografici completi, export
- [ ] Stripe integration completa (webhooks, portal, upgrade/downgrade)

---

## 🌍 SPRINT 4 — Virality & Growth Loops

- [ ] Share card animata (video loop 3s per Twitter/TikTok)
- [ ] Leaderboard globale (chi ha votato di più, chi è più "contrarian")
- [ ] Weekly Digest email: "questa settimana i risultati più sorprendenti"
- [ ] Dilemma of the Day (push notification per utenti premium)
- [ ] Referral system: invita 3 amici → badge Exclusive
- [ ] Media kit: dati aggregati per giornalisti (es. "73% degli italiani sceglierebbe X")
- [ ] API pubblica read-only per ricercatori

---

## 📊 METRICHE DA TRACKARE

| Metrica | Target 30gg | Target 90gg |
|---------|------------|------------|
| Voti totali/giorno | 500 | 5.000 |
| Utenti registrati | 500 | 5.000 |
| Premium subscribers | 20 | 200 |
| Business accounts | 0 | 5 |
| Lingue live | 1 (EN) | 6 |
| Revenue/mese | €0 | €1.000 |

---

*Ultimo aggiornamento: 25 Aprile 2026*
