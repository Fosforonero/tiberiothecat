# Blog Portfolio Audit — 2026-05-25

**Mode:** `splitvote-growth` → `blog-portfolio-audit`
**Source data:**
- `lib/blog.ts` inventory (64 articles, parità EN/IT 32:32 al 25 May)
- GSC export `~/Downloads/splitvote.io-Performance-on-Search-2026-05-25/` (Pages, Queries, Filters, Countries, Devices)
- Cross-reference: `reports/blog-cluster-gaps-2026-05-10.md`, `reports/blog-seo-content-strategy-audit-2026-05-19.md`, `reports/gsc-indexing-diagnosis-2026-05-18.md`

## ⚠️ Caveat sui dati GSC

Il CSV scaricato ha filtro **"Last 7 days"** (18–25 May 2026), NON l'intero mese. Volumi piccoli: 45 impressioni totali sull'intero sito in 7 giorni, 0 click. Le conclusioni sono direzionali, non statistiche.

Per audit più solido, esporta dopo il 1° giugno con range "Last 28 days" o "Last 3 months".

## TL;DR

- Portfolio molto sano in struttura: **64 articoli, parità EN/IT 32:32 perfetta** (tutti con `alternateSlug`).
- **15% degli articoli ha FAQ** (10/64 — 5 EN + 5 IT). È il gap operativo principale: FAQ è il segnale forte per AI-search citation + featured snippet.
- GSC mostra UN cluster già attivo: **loyalty/honesty/lealtà-onestà** (7 query, 28 impression / 45 totali = **62% del traffico organico**).
- Cornerstone candidate naturali (3) emergono dal volume di body + internal linking esistente, non solo da GSC.
- Tutti gli articoli sono datati 27 Apr – 17 May 2026: portfolio giovane, dateModified vuoto su ~85%.

## Inventory

| Metrica | Valore |
|---|---:|
| Articoli totali | 64 (32 EN + 32 IT) |
| Con FAQ field | 10 (5 EN + 5 IT) |
| Con `alternateSlug` (hreflang) | 64 (100%) |
| Con `dateModified` | 4 (6%) — solo trolley-explained, what-is-a-moral-dilemma, limerence EN, moral-injury EN |
| Cornerstone-shape (>20 p blocks + >10 internal links) | 3 EN + 3 IT |

## GSC signal (Last 7 days, 18–25 May)

### Top pages per impressioni

| Page | Imp | Position | Verdict |
|---|---:|---:|---|
| `/it/blog/lealta-vs-onesta-quando-si-scontrano` | **20** | **6.55** | Pagina 1 già — leva alta con tune fatto 25 May |
| `/blog/loyalty-vs-honesty-when-they-collide` | 8 | **45.5** | Pagina 5 EN — gap grande vs IT, stesso cluster |
| `/trending` | 7 | 6.14 | Brand-adjacent, OK |
| `www.splitvote.io/` (home) | 4+3 | 4.75 + 28 | Brand mixed — split tra apex e www |
| `/privacy` | 3 | 5.67 | Surprising — qualcuno cerca "splitvote privacy" |
| `/it/blog/cosa-significa-la-tua-personalita-morale` | 2 | 8.5 | Pagina 1 borderline |
| `/blog/trolley-problem-statistics` | 1 | 12 | Pagina 2 borderline, footbridge tune appena fatta |
| `/results/evergreen-20260515-gdr-rpg-4-en` | 1 | 2 | Dilemma dinamico approved arrivato in SERP |
| 3 play pages (`/play/self-driving-crash`, `/play/brain-upload`, dynamic) | 1 ciascuno | 5–7 | Long-tail individuale |

### Top queries

| Query | Imp | Position | Cluster |
|---|---:|---:|---|
| loyalty and honesty | 4 | 51.25 | Loyalty-honesty EN |
| lealtà e onestà differenze | 2 | **5** | Loyalty-honesty IT |
| differenza tra onestà e lealtà | 2 | **9.5** | Loyalty-honesty IT |
| honesty and loyalty | 2 | 57 | Loyalty-honesty EN |
| differenza tra lealtà e onestà | 1 | **8** | Loyalty-honesty IT |
| truth vs loyalty | 1 | 33 | Loyalty-honesty EN |
| split vote | 1 | 8 | Brand |

**Insight chiave:** il cluster loyalty-honesty performa **3x meglio in IT che in EN** (IT position media ~7 vs EN position media ~45). Il tune SEO appena fatto (25 May commit `30fe2ac`-vicino: `seoTitle`/`seoDescription`/`tags`/FAQ su entrambi) dovrebbe ridurre il gap, ma EN parte molto più indietro perché la competizione su "loyalty and honesty" è internazionale e affollata.

## Portfolio matrix — top 25 per attenzione richiesta

| # | slug | locale | class | reason | effort | action |
|---|---|---|---|---|---|---|
| 1 | `lealta-vs-onesta-quando-si-scontrano` | it | **promote-to-cornerstone** | GSC pos 6.55 + 20 imp + 3 query top + FAQ appena aggiunta + cluster naturale (5 dilemmas linkati) | M | Espandi body 10p → 18-20p + sezione "Esempi reali del conflitto" + sezione "Cosa rivela la tua scelta" + 4-5 nuove FAQ Q&A (oltre le 3 attuali) + JSON-LD FAQPage + internal linking da altri articoli IT del cluster |
| 2 | `loyalty-vs-honesty-when-they-collide` | en | **promote-to-cornerstone** | Mirror del #1 — stesso cluster, stessa FAQ appena aggiunta, ma pos 45.5 EN (gap enorme) | M | Stessa espansione del #1 in EN. Priorità leggermente più bassa di #1 perché competizione EN più alta e ROI immediato inferiore, ma necessario per parità |
| 3 | `moral-dilemmas-examples` | en | **promote-to-cornerstone** | Cornerstone-shape già: 28 p blocks + 10 internal links + 6 related dilemmas. Manca FAQ. Topic ad alta search-volume potenziale ("moral dilemmas examples" è generico-popolare) | M | Aggiungi 5-6 FAQ ("What are common moral dilemmas?", "What is a real-life ethical dilemma?", "How are moral dilemmas different from hard choices?", "Are moral dilemmas universal?", ecc.) + JSON-LD FAQPage. Body già ottimo. Aggiungi 1 "summary card" answer-first all'inizio |
| 4 | `dilemmi-morali-esempi` | it | **promote-to-cornerstone** | Mirror del #3 (28p, 13 links). Stesso pattern: cornerstone-shape, manca FAQ | M | Mirror del #3 in IT con domande naturali per ricerca italiana ("Cosa è un dilemma morale?", "Esempi di dilemmi morali quotidiani", "Differenza dilemma morale vs scelta difficile", ecc.) |
| 5 | `trolley-problem-statistics` | en | improve | Pos 12 con 1 imp; appena tunato per footbridge; manca FAQ; 23p già | S | Aggiungi 4 FAQ ("What is the footbridge variant approval rate?", "Why do people pull the lever but not push?", "How accurate are trolley poll results?", "What does the split mean?") + JSON-LD FAQPage |
| 6 | `statistiche-problema-del-carrello` | it | improve | Mirror #5 (21p, 14 links), manca FAQ | S | Mirror del #5 in IT. Aggiungi anche tune meta per "carrello footbridge" / "esperimento del tram" |
| 7 | `cosa-significa-la-tua-personalita-morale` | it | improve | Pos 8.5 con 2 imp, manca FAQ, topic ricco | S | Aggiungi 3-4 FAQ + internal link a `/personality` page + dilemmas correlati |
| 8 | `what-your-moral-personality-means` | en | improve | Mirror #7, stessa logica | S | Stesso approccio in EN |
| 9 | `moral-emotions-gut-feeling-moral-compass` | en | improve | Articolo enorme (30 p) ma manca FAQ + dateModified vuoto | S | Aggiungi 3-4 FAQ + dateModified=2026-05 + 1 sezione "When emotions mislead us" se non c'è |
| 10 | `emozioni-morali-istinto-bussola-morale` | it | improve | Mirror #9 | S | Mirror |
| 11 | `free-will-and-moral-responsibility` | en | improve | 25p, FAQ assente, topic profondo | S | Aggiungi 3-4 FAQ + cross-link a trolley + bystander-effect |
| 12 | `libero-arbitrio-e-responsabilita-morale` | it | improve | Mirror #11 | S | Mirror |
| 13 | `bystander-effect-and-moral-responsibility` | en | improve | 20p, FAQ assente, alto-search topic ("bystander effect") | S | Aggiungi 4 FAQ ("What is the bystander effect?", "Famous bystander effect cases", "How to overcome it") |
| 14 | `effetto-spettatore-e-responsabilita-morale` | it | improve | Mirror #13 | S | Mirror |
| 15 | `why-good-people-do-nothing` | en | improve | 16p, FAQ assente | S | Aggiungi 3-4 FAQ + tune meta per long-tail "why people don't help" |
| 16 | `perche-le-persone-buone-non-fanno-nulla` | it | improve | Mirror #15 | S | Mirror |
| 17 | `doing-vs-allowing-harm` | en | improve | 12p, FAQ assente, topic filosofico classico | S | Aggiungi 3 FAQ |
| 18 | `causare-vs-permettere-danno` | it | improve | Mirror #17 | S | Mirror |
| 19 | `why-we-disagree-on-ethics` | en | improve | 14p, FAQ assente | S | Aggiungi 3 FAQ |
| 20 | `perche-non-siamo-daccordo-sull-etica` | it | improve | Mirror #19 | S | Mirror |
| 21 | `moral-foundations-theory-why-good-people-disagree` | en | improve | 11p, FAQ assente, topic ad alta ricerca ("moral foundations theory") | S | Aggiungi 4 FAQ ("What are the 6 moral foundations?", "Who created the theory?", "How does it explain political differences?") |
| 22 | `teoria-fondamenti-morali` | it | improve | Mirror #21 | S | Mirror |
| 23 | `bioethics-when-medicine-forces-impossible-choices` | en | improve | 11p, FAQ assente | S | Aggiungi 3 FAQ |
| 24 | `bioetica-quando-la-medicina-impone-scelte-impossibili` | it | improve | Mirror #23 | S | Mirror |
| 25 | `frontier-ai-guardrails-ethical-dilemmas` | en | improve | 6p (corto), 0 internal links, FAQ assente | S/M | Mini-cornerstone potenziale per cluster AI ethics. Body raddoppiabile a 12p + 3-4 internal links + FAQ |

## Articoli `keep` (no action needed in this cycle)

- `trolley-problem-explained` EN — già con FAQ + dateModified 17 May, vicino a cornerstone-shape. Solo monitor.
- `what-is-a-moral-dilemma` EN — FAQ già + dateModified 17 May. Monitor.
- `limerence-love-obsession-dilemmas` EN / `limerence-amore-ossessione-dilemmi` IT — FAQ già + recente.
- `moral-injury-when-values-break` EN / `ferita-morale-quando-i-valori-si-spezzano` IT — FAQ già + recente.
- `problema-del-carrello-spiegato` IT — FAQ già.
- `cos-e-un-dilemma-morale` IT — FAQ già.
- `how-anonymous-voting-works` EN + IT, `how-to-read-splitvote-results` EN + IT, `what-is-splitvote` EN — utility pages, FAQ non strettamente necessaria.

## Articoli `kill` — nessuno

Nessun articolo qualifica per kill (301 redirect / sitemap removal). Il portfolio è giovane (Apr-May 2026) e nessun duplicate / off-brand emerge dall'inventory. Ricontrolla dopo 3 mesi di GSC data.

## Articoli `write-new` — 2-3 candidati ad alto ROI, NESSUNO ad altissimo signal GSC

Il GSC mostra 7 query totali, tutte già coperte. **Non c'è una query con impression alta + landing page mancante**. Quindi i candidati `write-new` vanno scelti da cluster strategy, non GSC pull.

### Candidato 1: **"Trolley problem: footbridge variant explained"** (EN + IT)

- **Rationale**: il cluster trolley ha 3 articoli (explained, statistics, moral-personality) ma NESSUNO è dedicato esclusivamente alla footbridge variant. La query "trolley problem footbridge variant approval rate" (storica GSC) ora è coperta solo come sezione dentro `trolley-problem-statistics`. Pagina dedicata può rankare meglio + diventa sub-page del cornerstone trolley.
- **Length stimata**: 800-1000 parole + FAQ + JSON-LD
- **Effort**: M (4-6h EN + 3h localizzazione IT)
- **Priorità**: 3 (dopo i 6 promote-to-cornerstone)

### Candidato 2: **"Real-life moral dilemmas: examples from work, family, friends"** (EN + IT)

- **Rationale**: il cluster "examples" (`moral-dilemmas-examples`/`dilemmi-morali-esempi`) è già il cornerstone candidato #3-#4. Una sub-page focused su "real-life everyday" può specializzare e catturare long-tail ("real life moral dilemma examples", "everyday ethical dilemmas").
- **Effort**: M
- **Priorità**: 4. Da valutare dopo che il cornerstone #3/#4 è live e si vede traction.

### Candidato 3: **"What is moral injury, and when does it happen at work?"** (EN + IT)

- **Rationale**: `moral-injury-when-values-break` ha FAQ già + dateModified 17 May. Una sub-page work-context apre un cluster nuovo (corporate ethics / whistleblower / report-friend dilemma). Topic ad alta ricerca in HR/burnout discourse.
- **Effort**: M-L
- **Priorità**: 5. Da decidere DOPO che il portfolio si stabilizza.

**Consiglio**: shippa prima i 6 promote-to-cornerstone + le 15-20 improve (FAQ adds). Riesporta GSC dopo 4-6 settimane. Poi decidi su `write-new` candidates con dati più ricchi.

## EN/IT parity overlay

### Stato disallineamento
- **Zero disallineamenti maggiori** rilevati. Tutti i 64 articoli hanno `alternateSlug` reciproco.
- Le 5 FAQ presenti in EN hanno match in IT (5+5=10 totali).
- Solo gap: `dateModified` presente solo su 4 articoli (3 EN + 1 IT) — è un signal di freshness che andrebbe attivato con un refresh batch dopo il primo ciclo cornerstone.

### Translation gap EN→IT
Nessun gap strutturale.

### Translation gap IT→EN
Nessun gap strutturale.

## Cluster map

### Cluster 1: Loyalty-Honesty (highest GSC signal, 62% traffic)
- **Cornerstone candidate**: `loyalty-vs-honesty-when-they-collide` EN + `lealta-vs-onesta-quando-si-scontrano` IT — **promote ora**
- **Supporting articles**: `what-is-a-moral-dilemma`, `moral-foundations-theory-why-good-people-disagree` (via Moral Foundations cita lealtà come foundation), `why-we-disagree-on-ethics`
- **Linked dilemmas**: cover-accident, report-friend, sibling-secret, truth-friend, whistleblower
- **Gap**: nessuna sub-page specifica su "truth vs loyalty in friendship" o "loyalty in the workplace" — opportunità sub-cluster

### Cluster 2: Trolley Problem (moderate GSC signal, 1 imp / 7 giorni ma alto-volume potenziale)
- **Cornerstone candidate**: `trolley-problem-explained` EN + `problema-del-carrello-spiegato` IT — già FAQ + dateModified recente → **keep** (monitor only)
- **Supporting**: `trolley-problem-statistics` + IT (improve), `trolley-problem-moral-personality` EN + IT
- **Linked dilemmas**: trolley, organ-harvest, lifeboat
- **Gap**: footbridge variant page dedicata (write-new candidato 1)

### Cluster 3: Moral Dilemmas Hub (generic high-volume keyword)
- **Cornerstone candidate**: `moral-dilemmas-examples` EN + `dilemmi-morali-esempi` IT — **promote ora**
- **Supporting**: `ethical-dilemmas-everyday-life` + IT, `why-people-love-impossible-choices` + IT, `hard-would-you-rather-questions` + IT
- **Gap**: sub-page "real-life everyday" (write-new candidato 2)

### Cluster 4: Moral Philosophy Frameworks
- **Cornerstone candidate**: `moral-foundations-theory-why-good-people-disagree` EN + IT (improve to cornerstone with FAQ)
- **Supporting**: consequentialism, deontology, virtue-ethics, doing-vs-allowing-harm + IT mirrors
- **Linked dilemmas**: trolley, pandemic-dose, organ-harvest
- **Gap**: nessuno significativo. Cluster solido.

### Cluster 5: Bystander & Inaction
- **Cornerstone candidate**: `bystander-effect-and-moral-responsibility` EN + IT — improve to cornerstone-shape (è già 20p) con FAQ
- **Supporting**: `why-good-people-do-nothing` + IT, `moral-emotions` + IT
- **Gap**: niente di critico.

### Cluster 6: AI Ethics (emerging, low coverage)
- **Cornerstone candidate**: nessuno definito ancora. `ai-ethics-what-40-million-people-chose` EN + IT è il candidato naturale (13p, 5 links, 5 related).
- **Supporting**: `frontier-ai-guardrails-ethical-dilemmas` + IT (corti, 6p — improve a 12p)
- **Gap**: cluster sottosviluppato. Da espandere se SplitVote vuole rankare su "AI ethics dilemmas" — ma scelta strategica, non urgente.

## Top 5 azioni — ordinate per ROI/effort

1. **Promote `lealta-vs-onesta` IT to cornerstone** — effort M (~3-4h), impact alto (già pos 6.55 con 20 imp, dominanza IT). File: `lib/blog.ts`. Verifica: build + diff-check. Coordinate con `splitvote-growth` mode `geo-readiness` per controllare extractability.
2. **Promote `loyalty-vs-honesty` EN to cornerstone** (mirror del #1) — effort M, impact medio (pos 45 → page 1-2 atteso entro 4-6 settimane). Stesso file.
3. **Promote `moral-dilemmas-examples` + `dilemmi-morali-esempi` to cornerstone** — effort M ciascuno (~3h × 2), impact alto su long-tail. Solo aggiunta FAQ + answer-first card; body già cornerstone-shape.
4. **Batch FAQ-add su 15-18 articoli `improve`** — effort S each (~30-45min), totale ~10h ma può essere splittato in 3-4 sprint da 3-4 articoli. Lift agglomerato su CTR + AI-search citation. File: `lib/blog.ts`.
5. **Set `dateModified` su tutti gli articoli toccati** — effort negligible (~5min total in un batch commit). Signal freshness importante per GEO.

## Anti-pattern evitato in questo audit

- **NON proposti rewrite massivi del body**. Improve è "FAQ + intro tune + meta + light internal linking", non rewrite.
- **NON proposto kill di nessun articolo**. Portfolio troppo giovane (Apr-May 2026) per pulizia drastica.
- **NON proposti più di 2-3 write-new**. Senza GSC robusto, write-new è scommessa cieca.
- **NON proposto bulk add dateModified su tutto** (sarebbe spam-signal). Solo sugli articoli toccati in questo ciclo.
- **NON proposto auto-publishing**. Tutti i cornerstone candidate vanno con human review + PM go esplicito per ogni PR.

## Next step

Quale azione vuoi che parta? Default consigliato: **azione #1** (cornerstone IT di lealtà-onestà) — è la mossa con miglior ROI immediato e fornisce il pattern replicabile per #2 (mirror EN).

Per ogni mossa, lo standard SplitVote è: typecheck + build + diff-check + EN/IT parity. PM GO esplicito prima di toccare `lib/blog.ts`.
