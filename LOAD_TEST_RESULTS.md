# SplitVote — Load Test Results

Tracciamento strutturato dei risultati del k6 smoke test su Vercel Preview e produzione.

Harness: `tests/load/splitvote-smoke-load.js` — `npm run load:smoke`

Configurazione k6, installazione, e istruzioni dettagliate: `LAUNCH_AUDIT.md` → Load Test k6.

---

## Comando baseline Preview

### Regola — primo run: read-only

**Non usare `ENABLE_WRITE_TESTS=true` per il primo baseline.** I write test consumano rate-limit Redis reali (5 voti/dilemma/IP per 10 min) e distorcono i risultati ISR/dynamic.

### Comando esatto

```bash
BASE_URL=https://<preview-hash>.vercel.app ALLOW_PROD_LOAD_TEST=true k6 run tests/load/splitvote-smoke-load.js
```

Sostituire `<preview-hash>.vercel.app` con l'URL del deploy Vercel Preview più recente
(Vercel dashboard → Deployments → copia URL, o `npx vercel ls`).

### Parametri del test (hardcoded nello script)

| Parametro | Valore |
|---|---|
| VUs (read) | 5 |
| Duration (read) | 30s |
| Write test | Disabilitato di default (`ENABLE_WRITE_TESTS` non impostato) |
| Scenario statico | `trolley` (dilemma sempre presente, non richiede auth) |
| BASE_URL default | `http://localhost:3000` |

---

## Soglie pass/fail — Soft Launch

| Metrica k6 | k6 threshold (abortOnFail: false) | Pass target audit |
|---|---|---|
| `GET /` p95 | < 1500ms | **< 500ms** (ISR edge cache) |
| `GET /trending` p95 | < 1500ms | **< 500ms** |
| `GET /category` p95 | < 1500ms | **< 1500ms** |
| `GET /play` p95 | < 3000ms | **< 3000ms** |
| `GET /results` p95 | < 3000ms | **< 3000ms** |
| `http_req_failed` | < 5% | **< 1%** |
| `checks` pass rate | > 90% | **> 98%** |

> **Nota su home/trending**: il target < 500ms si applica solo dopo warmup (Vercel edge cache attiva). La prima request post-deploy può arrivare da server cold — tollerabile.

---

## Cosa fare se play/results p95 > 3000ms

1. **Redis cold start** — Upstash free tier ha latenza 100–300ms alla prima connessione. Su Vercel Preview la regione può differire da Upstash. Rieseguire il test dopo warmup: se il secondo run è < 3000ms, è cold start accettabile.
2. **Vercel function region** — verificare in `vercel.json` o Vercel dashboard che la regione della function sia vicina alla zona Upstash (EU per splitvote.io).
3. **N+1 Supabase** — controllare `app/play/[id]/page.tsx` e `app/results/[id]/page.tsx` per query sequenziali non batched.
4. **Threshold break sistematico** — se p95 > 3000ms anche al secondo run e a basso VU (5): bloccare campagne paid, aprire issue con dati del run.

---

## Cosa fare se http_req_failed > 5%

1. Controllare Vercel dashboard → Functions → Errors per il timestamp del test.
2. **503 Upstash** — piano free ha connection pool limitata; verificare Upstash dashboard → Usage / Data Transfer.
3. **500 Supabase** — verificare Supabase dashboard → API → Errors → stesso timestamp.
4. **429 nel write test** — normale: rate limiting funziona. Non agire; è un falso positivo per `http_req_failed` se incluso.
5. **Failure sistematico > 5%** — bloccare campagne paid, investigare root cause prima di procedere.

---

## Come leggere l'output k6

Alla fine del test k6 stampa un summary. Leggere i valori `p(95)` per tag:

```
✓ checks.........................: 100.00% ✓ 250 ✗ 0
  http_req_failed................: 0.00%   ✓ 0   ✗ 250

  http_req_duration{name:GET /}..........: avg=... p(95)=XYZms
  http_req_duration{name:GET /trending}..: avg=... p(95)=XYZms
  http_req_duration{name:GET /category}.: avg=... p(95)=XYZms
  http_req_duration{name:GET /play}.....: avg=... p(95)=XYZms
  http_req_duration{name:GET /results}..: avg=... p(95)=XYZms
```

Un threshold con `✓` = passato. Con `✗` = fallito (non interrompe il test — `abortOnFail: false`).

Copiare i valori `p(95)` nella tabella dei risultati qui sotto.

---

## Tabella risultati

Aggiungere una riga per ogni run significativo. Annotare commit, environment, e anomalie in Notes.

| Date | Commit | Environment | BASE_URL | p95 `/` | p95 `/trending` | p95 `/category` | p95 `/play` | p95 `/results` | `http_req_failed` | `checks` | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| YYYY-MM-DD | `abc1234` | Preview / Prod / Local | `https://...` | ms | ms | ms | ms | ms | % | % | |

---

### Run #1 — Baseline Vercel Preview

_Da completare dopo il primo run._

| Campo | Valore |
|---|---|
| Date | — |
| Commit | — |
| Environment | Vercel Preview |
| BASE_URL | — |
| p95 `GET /` | — |
| p95 `GET /trending` | — |
| p95 `GET /category` | — |
| p95 `GET /play` | — |
| p95 `GET /results` | — |
| `http_req_failed` | — |
| `checks` | — |
| Status | ⏳ Da eseguire |
| Notes | Primo baseline read-only, 5 VU, 30s, no ENABLE_WRITE_TESTS |

---

## Procedura dopo il baseline Preview

Se il baseline Preview passa (tutti i target sopra soddisfatti):

1. Eseguire test più lungo: `20 VU, 2m` — ancora su Preview (non produzione).
2. Solo dopo, e in una finestra controllata (basso traffico, orario notturno):

```bash
BASE_URL=https://splitvote.io ALLOW_PROD_LOAD_TEST=true k6 run tests/load/splitvote-smoke-load.js
```

3. Registrare risultati come Run #2 in questo file.
4. Solo se entrambi i run passano: sbloccare campagne paid.

---

## Riferimenti

- Harness: [`tests/load/splitvote-smoke-load.js`](tests/load/splitvote-smoke-load.js)
- Setup k6 (installazione, comandi, metriche): [`LAUNCH_AUDIT.md`](LAUNCH_AUDIT.md) → Load Test k6
- Stripe QA runbook: [`LAUNCH_AUDIT.md`](LAUNCH_AUDIT.md) → Stripe QA End-to-End
