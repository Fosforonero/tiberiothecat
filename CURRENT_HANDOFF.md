# SplitVote — Current Handoff

Date: 4 May 2026
PM: Matteo
Implementer: Claude Code

---

## Current Production State

**Release status: ✅ GO — soft launch active. AdSense review ready to request.**

- Anonymous vote flow: working ✅
- EN/IT routes: complete ✅
- AdSense: slots configured and live on all three surfaces (HOME, PLAY, RESULTS) ✅
- AdSense review: **not yet requested** — must be done manually from AdSense dashboard
- Stripe Premium: config fixed (29 Apr); manual live checkout QA still pending before promoting to real users
- AI generation: semantic review fix deployed (`c85e55c`); save mode still blocked — re-QA required (pre-conditions below)
- Blog Draft Queue: deployed and QA'd (1 May)
- Research Source Registry: `lib/research-sources.ts` — internal foundation, not consumer-facing

---

## Today's Commits (4 May 2026)

```
[pending] feat: blog pagination, date sort, IT translation fixes
ce2dcfa chore: add research source registry
28c3bd1 chore: trigger vercel rebuild for adsense slots
76a8e27 feat: add product explainer blog cluster
f13526c feat: add research-backed trust layer
9d7c339 fix: strengthen seo content for adsense readiness
b535283 fix: address adsense readiness blockers
```

---

## Done Today

- ✅ Blog pagination + IT translation fixes — `components/BlogGrid.tsx` (new client component, 9/page desktop, 4/page mobile, prev/next); `getPostsByLocale` sorts newest-first; "Would You Rather" → "Preferiresti" in 2 IT articles; `app/blog/page.tsx` + `app/it/blog/page.tsx` simplified to use BlogGrid
- ✅ AdSense readiness blockers — robots.txt, ads.txt, about pages, FAQ self-service deletion copy, Privacy last-updated, sitemap cleanup (`b535283`)
- ✅ SEO content strengthening — personality SSR block, internal links, SEO landing pages (`9d7c339`)
- ✅ Research trust layer — `researchNote` + `researchSources` on 3 published topic pages; Expert Lens blocks on EN/IT personality pages; 7 authoritative links (`f13526c`)
- ✅ Product explainer blog cluster — 4 EN + 4 IT evergreen articles in `lib/blog.ts`; approved anonimato/personalità framing; metadata all ≤60/160 chars (`76a8e27`)
- ✅ AdSense env debug + forced rebuild — verified HOME/PLAY/RESULTS slots live via RSC payload + JS bundle inspection; corrected analysis methodology (server vs client component distinction) (`28c3bd1`)
- ✅ Research Source Registry — `lib/research-sources.ts` server-only, 10 typed sources, 3 helpers, `safeClaim`/`claimsToAvoid`/`requiresDisclaimer` guards (`ce2dcfa`)

---

## AdSense Readiness — Stato al 4 Maggio 2026

| Check | Stato |
|---|---|
| ads.txt presente con publisher ID corretto | ✅ |
| robots.txt non blocca contenuto indicizzabile | ✅ |
| Sitemap valida, senza rotte admin/private | ✅ |
| About page con identità publisher | ✅ |
| Privacy policy / FAQ aggiornate | ✅ |
| Contenuto sufficiente (trust layer + blog cluster) | ✅ |
| `NEXT_PUBLIC_ADSENSE_SLOT_HOME=2103418765` live | ✅ (RSC payload verificato) |
| `NEXT_PUBLIC_ADSENSE_SLOT_PLAY=9782598239` live | ✅ (RSC payload verificato) |
| `NEXT_PUBLIC_ADSENSE_SLOT_RESULTS=8965264022` live | ✅ (JS bundle verificato) |
| Review AdSense richiesta | ❌ **DA FARE MANUALMENTE** |

**Step manuali domani:**
1. Vai su AdSense dashboard → Sites → `splitvote.io` → richiedi review
2. Monitora Policy Center per eventuali violazioni policy segnalate
3. Non fare grandi modifiche a pagine pubbliche indicizzabili durante il periodo di review

---

## Pending Tecnici

### AI Generation re-QA (gates save mode)
Pre-conditions obbligatorie prima di ri-eseguire i 4 dry-run scenarios:
1. Vercel Production → env var `OPENROUTER_MODEL_REVIEW=openai/gpt-4o-mini` (codice legge già questa var)
2. Vercel → manual redeploy dopo aver impostato l'env
3. Re-run 4 dry-run scenarios nel pannello admin (dryRun ON)
4. Decision matrix: ≥60% accepted + `review_err` < 20% + no template repeats → **save mode OK**

### Stripe live QA
- Aprire `splitvote.io/profile` → confermare che checkout mostri piano ricorrente mensile
- End-to-end live payment con carta reale o controllata (non ancora eseguito)
- **Non promuovere Premium a utenti reali prima di questo step**

### Content Intelligence admin MVP
- `lib/research-sources.ts` è il foundation layer — non consumer-facing
- L'integrazione nelle superfici pubbliche e l'admin MVP restano sprint futuri da pianificare esplicitamente

### `app/it/[topicSlug]`
- Route IT per topic landing pages non implementata
- 3 topic pubblicati (`trolley-problem`, `ai-ethics-dilemmas`, `loyalty-vs-honesty`) sono EN-only
- IT topics in `lib/seo-topics.ts` hanno `locale: 'it'` ma richiedono la route `app/it/[topicSlug]/page.tsx`

### Blog cluster espansione
- 8 articoli live (4 EN + 4 IT)
- Prossimi cluster candidati: bioethics, AI accountability, virtue ethics (vedi `lib/research-sources.ts`)
- Blog Draft Queue operativa per contenuti AI-assisted

---

## Non Toccare (senza sprint dedicato e QA)

- **Stripe** — nessuna modifica pricing, subscription, webhook, entitlements senza QA dedicata
- **DB migrations** — nessuna migration senza sprint esplicito
- **autoPublish / Picoclaw** — save mode bloccato; non sbloccare senza re-QA superata
- **Legal/privacy docs** — solo se cambia il trattamento dati reale
- **Pagine pubbliche indicizzabili** — evitare grossi refactor durante finestra review AdSense

---

## Known Risks

- AI generation: cross-category dedup migliorato (`c85e55c`); IT semantic `review_err` probabilmente risolto con `OPENROUTER_MODEL_REVIEW` env — non confermato fino a re-QA
- Stripe live payment: config corretta ma mai testata end-to-end su prod con carta reale
- `moralfoundations.org` intermittente — verificare prima di usarlo su pagine pubbliche nuove
- `joshua-greene.net` pagina personale — potrebbe spostarsi; preferire DOI paper specifici in contenuti pubblici

---

## Tomorrow Start Prompt

```
Ripartenza sessione SplitVote — 5 Maggio 2026 o successivo.

Leggi prima (in questo ordine):
- CLAUDE.md
- CURRENT_HANDOFF.md
- ROADMAP.md
- LEGAL.md
- LAUNCH_AUDIT.md

Poi esegui:
- git status --short
- git log --oneline -10

Task di ripartenza:
1. Conferma che working tree sia pulito.
2. Verifica se AdSense review è già stata richiesta manualmente (non verificabile dal repo — chiedi al PM).
3. Se review non ancora richiesta: riportare come step #1 da fare.
4. Verifica stato AI generation re-QA: pre-conditions soddisfatte? (OPENROUTER_MODEL_REVIEW env + redeploy) — se sì, proponi re-QA come primo sprint tecnico.
5. Proponi sprint candidati tra: app/it/[topicSlug], blog cluster expansion, Content Intelligence admin MVP, Stripe live QA, nuovi articoli blog (bioethics, AI accountability, virtue ethics).

Output atteso:
- Stato repo in 8 righe
- Ultimi commit rilevanti
- Step manuali aperti (AdSense, Stripe)
- Sprint tecnici candidati ordinati per impatto
- Nessuna modifica ai file finché non arriva GO.
```
