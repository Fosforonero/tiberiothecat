import type { Metadata } from 'next'

const BASE_URL = 'https://splitvote.io'

export const metadata: Metadata = {
  title: 'Informativa sulla Privacy | SplitVote',
  description: 'Informativa sulla privacy di SplitVote.io — come raccogliamo, utilizziamo e proteggiamo i tuoi dati.',
  robots: { index: true, follow: true },
  alternates: {
    canonical: `${BASE_URL}/it/privacy`,
    languages: {
      'it-IT': `${BASE_URL}/it/privacy`,
      'en': `${BASE_URL}/privacy`,
      'x-default': `${BASE_URL}/privacy`,
    },
  },
}

export default function ItPrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-[var(--text)]">
      <h1 className="text-3xl font-black mb-2">Informativa sulla Privacy</h1>
      <p className="text-sm text-[var(--muted)] mb-10">Ultimo aggiornamento: 4 maggio 2026</p>

      <section className="space-y-6 text-sm leading-relaxed text-[var(--muted)]">

        <div>
          <h2 className="text-base font-bold text-white mb-2">1. Chi siamo</h2>
          <p>
            SplitVote.io (&ldquo;noi&rdquo;, &ldquo;ci&rdquo;, &ldquo;nostro&rdquo;) è una piattaforma online che presenta sondaggi anonimi
            su dilemmi morali e mostra i risultati aggregati in tempo reale. Il sito è gestito da
            Matteo Pizzi, con sede in Italia. Contatto:{' '}
            <a href="mailto:privacy@splitvote.io" className="text-blue-400 hover:underline">
              privacy@splitvote.io
            </a>
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">2. Dati che raccogliamo</h2>
          <p className="mb-2">Raccogliamo il minimo indispensabile per erogare il servizio:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-white">Dati di voto anonimi</strong> — quando voti senza account, salviamo solo un contatore aggregato anonimo (opzione A o B). L&apos;indirizzo IP viene trattato temporaneamente per la prevenzione degli abusi e la limitazione delle richieste, memorizzato esclusivamente come hash SHA-256 in chiavi di rate limit a breve durata, cancellato automaticamente dopo un massimo di 1 ora. L&apos;IP raw non viene mai scritto nel database principale.
            </li>
            <li>
              <strong className="text-white">Dati dell&apos;account</strong> (solo utenti registrati) — se crei un account, conserviamo: indirizzo email; nome visualizzato pseudonimo (auto-generato come &ldquo;Splitvoter-XXXXXX&rdquo;); cronologia dei voti collegata al tuo ID utente; punti XP, streak, badge e progressi nelle missioni giornaliere; azioni di condivisione e visite ai link di referral per verifica missioni. Dati demografici opzionali: anno di nascita, paese, genere.
            </li>
            <li>
              <strong className="text-white">Dati di pagamento</strong> (solo utenti Premium) — i pagamenti per abbonamento Premium o cambio nome a pagamento sono elaborati da Stripe. Riceviamo solo un ID cliente Stripe e lo stato dell&apos;abbonamento; non conserviamo mai numeri di carta o dati di pagamento completi.
            </li>
            <li>
              <strong className="text-white">Dati analitici</strong> — con il tuo consenso, Google Analytics 4 raccoglie visualizzazioni di pagina, durata delle sessioni e metriche di coinvolgimento generali tramite un proxy first-party sul nostro dominio. Vercel Analytics può raccogliere segnali di utilizzo anonimizzati. Vedi la Sezione 4 per come il consenso controlla questi trattamenti.
            </li>
            <li>
              <strong className="text-white">Dati pubblicitari</strong> — con il tuo consenso, Google AdSense può usare cookie per mostrare annunci personalizzati. Senza consenso, possono essere mostrati solo annunci non personalizzati.
            </li>
            <li>
              <strong className="text-white">Contenuti generati dall&apos;AI</strong> — i dilemmi possono essere generati da sistemi AI (Anthropic Claude o modelli OpenRouter) e accodati come bozze. Tutte le bozze sono revisionate e approvate da un amministratore umano prima della pubblicazione. Nessun dato personale degli utenti viene inviato ai fornitori AI.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">3. Come utilizziamo i dati</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Per mostrare le percentuali aggregate in tempo reale su ogni dilemma.</li>
            <li>Per prevenire abusi e voti multipli sullo stesso dilemma.</li>
            <li>Per fornire funzionalità dell&apos;account (dashboard, badge, cronologia, gamification).</li>
            <li>Per elaborare pagamenti Premium tramite Stripe.</li>
            <li>Per inviare email transazionali necessarie al servizio.</li>
            <li>Per pubblicare report statistici anonimi a scopo giornalistico o di ricerca.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">4. Basi giuridiche (GDPR)</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong className="text-white">Legittimo interesse</strong> — conteggio anonimo dei voti; limitazione delle richieste tramite IP hash (chiavi temporanee, max 1 ora).</li>
            <li><strong className="text-white">Esecuzione del contratto</strong> — fornitura dei servizi dell&apos;account (cronologia voti, profilo, gamification, Premium).</li>
            <li><strong className="text-white">Consenso</strong> — cookie analitici e pubblicitari. Puoi revocare il consenso in qualsiasi momento tramite il banner cookie o &ldquo;Impostazioni cookie&rdquo; nel footer.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">5. Google Consent Mode v2</h2>
          <p>
            Implementiamo Google Consent Mode v2. Tutti i segnali di consenso per analytics e pubblicità sono
            impostati su <strong className="text-white">negato per impostazione predefinita</strong> prima che tu faccia
            una scelta. Se rifiuti il consenso, Google Analytics opera in modalità
            &ldquo;senza cookie&rdquo; utilizzando solo dati modellati. Nessun cookie analitico o pubblicitario
            viene impostato senza il tuo consenso esplicito. Puoi modificare le preferenze in qualsiasi momento
            tramite il link &ldquo;Cookie&rdquo; nel footer.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">6. Proxy first-party GA4</h2>
          <p>
            I dati di misurazione GA4 vengono inoltrati tramite un endpoint first-party sul nostro dominio
            (<code className="text-xs bg-white/10 px-1 rounded">/api/_g/g/collect</code>). Questo proxy
            inoltra intenzionalmente l&apos;indirizzo IP reale del visitatore a Google nell&apos;intestazione{' '}
            <code className="text-xs bg-white/10 px-1 rounded">X-Forwarded-For</code> affinché GA4
            possa determinare accuratamente la regione geografica. Questo inoltro avviene solo quando
            il consenso agli analytics è stato concesso.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">7. Servizi di terze parti (responsabili del trattamento)</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong className="text-white">Vercel</strong> — hosting, edge network e Vercel Analytics (USA/globale). <a href="https://vercel.com/legal/privacy-policy" className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">Privacy Policy</a></li>
            <li><strong className="text-white">Supabase</strong> — autenticazione e database utenti (regione UE). <a href="https://supabase.com/privacy" className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">Privacy Policy</a></li>
            <li><strong className="text-white">Upstash Redis</strong> — contatori dei voti in tempo reale e chiavi di rate limit (edge UE/globale). <a href="https://upstash.com/trust/privacy.pdf" className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">Privacy Policy</a></li>
            <li><strong className="text-white">Google Analytics 4</strong> — analytics previo consenso (globale). <a href="https://policies.google.com/privacy" className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">Privacy Policy</a></li>
            <li><strong className="text-white">Google AdSense</strong> — pubblicità previo consenso (globale). <a href="https://policies.google.com/privacy" className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">Privacy Policy</a></li>
            <li><strong className="text-white">Stripe</strong> — elaborazione pagamenti per abbonamenti Premium e cambio nome a pagamento (USA/globale). <a href="https://stripe.com/privacy" className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">Privacy Policy</a></li>
            <li><strong className="text-white">Resend</strong> — invio di email transazionali (USA). <a href="https://resend.com/legal/privacy-policy" className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">Privacy Policy</a></li>
            <li><strong className="text-white">Anthropic</strong> — generazione AI di dilemmi tramite cron server-side (USA). Nessun dato personale degli utenti è incluso nei prompt. <a href="https://www.anthropic.com/privacy" className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">Privacy Policy</a></li>
            <li><strong className="text-white">OpenRouter</strong> — generazione AI di bozze di dilemmi tramite pannello admin (USA). Nessun dato personale degli utenti è incluso nei prompt. <a href="https://openrouter.ai/privacy" className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">Privacy Policy</a></li>
          </ul>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">8. Conservazione dei dati</h2>
          <p>
            Gli hash IP usati per il rate limiting vengono eliminati automaticamente dopo un massimo di 1 ora.
            I conteggi aggregati dei voti sono conservati indefinitamente in quanto dati statistici anonimi.
            I dati di Google Analytics sono conservati per 14 mesi (periodo di conservazione configurato).
            I dati dell&apos;account (email, nome visualizzato, cronologia voti, XP, badge) vengono conservati
            fino alla cancellazione dell&apos;account. Puoi eliminare il tuo account in qualsiasi momento dalla pagina{' '}
            <a href="/profile" className="text-blue-400 hover:underline">Impostazioni Profilo</a>{' '}
            (sezione Zona pericolosa). Puoi anche scrivere a{' '}
            <a href="mailto:privacy@splitvote.io" className="text-blue-400 hover:underline">
              privacy@splitvote.io
            </a>{' '}
            per la cancellazione assistita.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">9. Trasferimenti internazionali</h2>
          <p>
            Diversi responsabili del trattamento elencati nella Sezione 7 possono trattare dati al di fuori
            dello SEE (principalmente negli USA). Tali trasferimenti sono coperti dalle Clausole Contrattuali
            Standard (SCC) incluse nel contratto di trattamento dati di ciascun responsabile: Vercel, Supabase,
            Upstash, Google (Analytics e AdSense), Stripe, Resend, Anthropic e OpenRouter pubblicano ciascuno SCC
            o meccanismi di trasferimento equivalenti. Facciamo affidamento su questi meccanismi per conformarci
            al Capitolo V del GDPR.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">10. I tuoi diritti (GDPR / utenti SEE)</h2>
          <p>Ai sensi del GDPR hai il diritto di:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Accedere ai dati personali che ti riguardano</li>
            <li>Richiedere la rettifica o la cancellazione dei tuoi dati</li>
            <li>Opporti al trattamento o richiederne la limitazione</li>
            <li>Portabilità dei dati</li>
            <li>Revocare il consenso in qualsiasi momento (senza pregiudizio per il trattamento precedente)</li>
            <li>Presentare reclamo all&apos;Autorità Garante per la protezione dei dati personali (Garante Privacy)</li>
          </ul>
          <p className="mt-2">
            Per esercitare questi diritti scrivi a{' '}
            <a href="mailto:privacy@splitvote.io" className="text-blue-400 hover:underline">
              privacy@splitvote.io
            </a>.
            Per i voti anonimi non deteniamo dati personali — i diritti si esercitano tramite le impostazioni
            cookie del browser. Per i dati dell&apos;account risponderemo entro 30 giorni.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">11. Residenti in California (CCPA / CPRA)</h2>
          <p>
            Non vendiamo dati personali. Se la personalizzazione degli annunci AdSense è abilitata con il tuo
            consenso, la condivisione dei dati con Google per la pubblicità mirata potrebbe qualificarsi come
            &ldquo;condivisione&rdquo; ai sensi del CPRA. Puoi rifiutarti in qualsiasi momento disabilitando
            i cookie pubblicitari tramite Impostazioni cookie. I residenti in California hanno il diritto di
            sapere, cancellare e rifiutare. Per esercitare questi diritti scrivi a{' '}
            <a href="mailto:privacy@splitvote.io" className="text-blue-400 hover:underline">
              privacy@splitvote.io
            </a>.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">12. Privacy dei minori (COPPA)</h2>
          <p>
            SplitVote non è destinato a bambini di età inferiore ai 13 anni. Non raccogliamo
            consapevolmente dati personali di minori. Se ritieni che un minore ci abbia fornito dati
            personali, contattaci a{' '}
            <a href="mailto:privacy@splitvote.io" className="text-blue-400 hover:underline">
              privacy@splitvote.io
            </a>{' '}
            e li cancelleremo tempestivamente.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">13. Cookie e local storage</h2>
          <p className="mb-3">
            Utilizziamo un banner di consenso cookie personalizzato con controlli granulari. Il consenso è
            memorizzato nel local storage del browser. Puoi modificare le preferenze in qualsiasi momento
            tramite il link &ldquo;Cookie&rdquo; nel footer.
          </p>
          <div className="overflow-x-auto">
            <table className="text-[11px] border-collapse w-full">
              <thead>
                <tr className="text-white border-b border-[var(--border)]">
                  <th className="text-left py-1 pr-3 font-semibold">Nome</th>
                  <th className="text-left py-1 pr-3 font-semibold">Tipo</th>
                  <th className="text-left py-1 pr-3 font-semibold">Scopo</th>
                  <th className="text-left py-1 pr-3 font-semibold">Categoria</th>
                  <th className="text-left py-1 font-semibold">Durata</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[var(--border)]/40">
                  <td className="py-1.5 pr-3 font-mono">sv_cookie_consent</td>
                  <td className="py-1.5 pr-3">localStorage</td>
                  <td className="py-1.5 pr-3">Memorizza la scelta di consenso complessiva</td>
                  <td className="py-1.5 pr-3">Necessario</td>
                  <td className="py-1.5">Fino alla pulizia</td>
                </tr>
                <tr className="border-b border-[var(--border)]/40">
                  <td className="py-1.5 pr-3 font-mono">sv_cookie_prefs</td>
                  <td className="py-1.5 pr-3">localStorage</td>
                  <td className="py-1.5 pr-3">Memorizza preferenze analitici/pubblicità granulari</td>
                  <td className="py-1.5 pr-3">Necessario</td>
                  <td className="py-1.5">Fino alla pulizia</td>
                </tr>
                <tr className="border-b border-[var(--border)]/40">
                  <td className="py-1.5 pr-3 font-mono">sv_voted_*</td>
                  <td className="py-1.5 pr-3">Cookie</td>
                  <td className="py-1.5 pr-3">Previene voti duplicati anonimi per dilemma</td>
                  <td className="py-1.5 pr-3">Necessario</td>
                  <td className="py-1.5">1 anno</td>
                </tr>
                <tr className="border-b border-[var(--border)]/40">
                  <td className="py-1.5 pr-3 font-mono">sv_fb_*</td>
                  <td className="py-1.5 pr-3">Cookie</td>
                  <td className="py-1.5 pr-3">Previene feedback duplicati per dilemma</td>
                  <td className="py-1.5 pr-3">Necessario</td>
                  <td className="py-1.5">1 anno</td>
                </tr>
                <tr className="border-b border-[var(--border)]/40">
                  <td className="py-1.5 pr-3 font-mono">lang-pref</td>
                  <td className="py-1.5 pr-3">Cookie</td>
                  <td className="py-1.5 pr-3">Preferenza lingua (IT/EN)</td>
                  <td className="py-1.5 pr-3">Preferenza</td>
                  <td className="py-1.5">12 ore</td>
                </tr>
                <tr className="border-b border-[var(--border)]/40">
                  <td className="py-1.5 pr-3 font-mono">Cookie Supabase</td>
                  <td className="py-1.5 pr-3">Cookie/storage</td>
                  <td className="py-1.5 pr-3">Gestione sessione per utenti registrati</td>
                  <td className="py-1.5 pr-3">Necessario</td>
                  <td className="py-1.5">Sessione</td>
                </tr>
                <tr className="border-b border-[var(--border)]/40">
                  <td className="py-1.5 pr-3 font-mono">_ga, _ga_*</td>
                  <td className="py-1.5 pr-3">Cookie</td>
                  <td className="py-1.5 pr-3">Google Analytics — solo dopo consenso analytics</td>
                  <td className="py-1.5 pr-3">Analitici</td>
                  <td className="py-1.5">Fino a 14 mesi</td>
                </tr>
                <tr>
                  <td className="py-1.5 pr-3 font-mono">Cookie Google Ads</td>
                  <td className="py-1.5 pr-3">Cookie/storage</td>
                  <td className="py-1.5 pr-3">Google AdSense — solo dopo consenso pubblicità</td>
                  <td className="py-1.5 pr-3">Pubblicità</td>
                  <td className="py-1.5">Dipende dal fornitore</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">14. Modifiche alla presente informativa</h2>
          <p>
            Aggiorneremo questa pagina in caso di modifiche rilevanti. La data dell&apos;ultimo aggiornamento
            è indicata in cima. L&apos;uso continuato del sito dopo la pubblicazione delle modifiche
            costituisce accettazione delle stesse.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">15. Contatti</h2>
          <p>
            Per domande sulla privacy o per esercitare i tuoi diritti, scrivi a:{' '}
            <a href="mailto:privacy@splitvote.io" className="text-blue-400 hover:underline">
              privacy@splitvote.io
            </a>
          </p>
        </div>

      </section>
    </div>
  )
}
