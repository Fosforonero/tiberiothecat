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
| 2026-04-28 | `0add453` | Production | `https://splitvote.io` | 3200ms ⚠️ | 548.77ms ✅ | 498.18ms ✅ | 675.11ms ✅ | 685.61ms ✅ | 0% ✅ | 100% ✅ | Run #1 — cold cache; homepage threshold failed (3.2s > 1500ms k6); repeat run required |
| 2026-04-28 | `0add453` | Production | `https://splitvote.io` | 1280ms ✅ | 490.06ms ✅ | 415.02ms ✅ | 545.36ms ✅ | 553.22ms ✅ | 0% ✅ | 100% ✅ | Run #2 — **BASELINE PASS** — all k6 thresholds passed; homepage ISR warmup resolved |

---

> **Nota**: il baseline Vercel Preview non è stato eseguito. Il primo run reale è stato eseguito direttamente in produzione (read-only, `ALLOW_PROD_LOAD_TEST=true`).

### Run #1 — Production, cold cache (2026-04-28)

| Campo | Valore |
|---|---|
| Date | 2026-04-28 |
| Commit | `0add453` |
| Environment | **Production** |
| BASE_URL | `https://splitvote.io` |
| Comando | `BASE_URL=https://splitvote.io ALLOW_PROD_LOAD_TEST=true k6 run tests/load/splitvote-smoke-load.js` |
| p95 `GET /` | **3200ms** ⚠️ — k6 threshold FAIL (> 1500ms); probabile cold cache Vercel edge |
| p95 `GET /trending` | 548.77ms ✅ |
| p95 `GET /category` | 498.18ms ✅ |
| p95 `GET /play` | 675.11ms ✅ |
| p95 `GET /results` | 685.61ms ✅ |
| `http_req_failed` | **0%** ✅ |
| `checks` | **100%** ✅ |
| Status | ⚠️ Partial — homepage cold cache; repeat run required |
| Notes | Homepage 3.20s supera k6 threshold 1500ms — warmup Vercel edge cache. Tutti gli altri threshold passati. Nessun errore. |

---

### Run #2 — Production, warm (2026-04-28) ✅ BASELINE PASS

| Campo | Valore |
|---|---|
| Date | 2026-04-28 |
| Commit | `0add453` |
| Environment | **Production** |
| BASE_URL | `https://splitvote.io` |
| Comando | `BASE_URL=https://splitvote.io ALLOW_PROD_LOAD_TEST=true k6 run tests/load/splitvote-smoke-load.js` |
| p95 `GET /` | **1280ms** ✅ k6 threshold pass (< 1500ms); audit target < 500ms richiede traffico continuato per warm edge cache |
| p95 `GET /trending` | 490.06ms ✅ |
| p95 `GET /category` | 415.02ms ✅ |
| p95 `GET /play` | 545.36ms ✅ |
| p95 `GET /results` | 553.22ms ✅ |
| `http_req_failed` | **0%** ✅ |
| `checks` | **100%** ✅ |
| Status | ✅ **SOFT LAUNCH PASS** — tutti i k6 threshold passati |
| Notes | Tutti i threshold k6 passati. Play/results p95 < 600ms — ottimi per force-dynamic. Homepage ISR 1.28s con warmup (k6 ✅; audit < 500ms raggiungibile con traffico continuato). |

---

## Stato baseline e prossimi step

**Production read-only baseline: ✅ PASSED (28 Apr 2026, Run #2)**

Il baseline production 5 VU read-only ha passato tutti i k6 threshold al secondo run.

### Prossimi test consigliati prima di campagne paid aggressive

1. **Vercel Preview baseline** (opzionale): stesso test su un deploy Preview per isolare comportamento senza traffico reale concorrente.

```bash
BASE_URL=https://<preview-hash>.vercel.app ALLOW_PROD_LOAD_TEST=true k6 run tests/load/splitvote-smoke-load.js
```

2. **Test più lungo su Preview**: 20 VU, 2 minuti — misura comportamento sostenuto.
3. **Test produzione in finestra controllata** (basso traffico, orario notturno) con VU più alti.

Per ogni run aggiuntivo: aggiungere una riga alla tabella e un blocco Run #N in questo file.

---

## Riferimenti

- Harness: [`tests/load/splitvote-smoke-load.js`](tests/load/splitvote-smoke-load.js)
- Setup k6 (installazione, comandi, metriche): [`LAUNCH_AUDIT.md`](LAUNCH_AUDIT.md) → Load Test k6
- Stripe QA runbook: [`LAUNCH_AUDIT.md`](LAUNCH_AUDIT.md) → Stripe QA End-to-End
