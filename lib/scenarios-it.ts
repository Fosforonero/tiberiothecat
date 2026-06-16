import { getScenario, type Scenario } from './scenarios'

export const CATEGORY_LABELS_IT: Record<string, string> = {
  morality:      'Moralità',
  survival:      'Sopravvivenza',
  loyalty:       'Lealtà',
  justice:       'Giustizia',
  freedom:       'Libertà',
  technology:    'Tecnologia',
  society:       'Società',
  relationships: 'Relazioni',
  lifestyle:     'Stile di vita',
}

type ItalianScenarioText = Pick<Scenario, 'question' | 'optionA' | 'optionB'>

export const IT_SCENARIO_TRANSLATIONS: Record<string, ItalianScenarioText> = {
  trolley: {
    question: "Un tram fuori controllo sta per investire 5 persone. Puoi deviarlo su un altro binario, ma ucciderai 1 persona.",
    optionA: 'Tiro la leva. Salvo 5 persone e ne sacrifico 1.',
    optionB: 'Non faccio nulla. Lascio decidere il destino.',
  },
  'cure-secret': {
    question: "Scopri una cura per il cancro, ma funziona solo se tieni segreta la formula. Condividerla distruggerebbe per sempre l'efficacia del composto.",
    optionA: 'La tengo segreta. Salvo milioni di persone in silenzio.',
    optionB: 'La condivido. La scienza appartiene a tutti.',
  },
  'memory-erase': {
    question: 'Una pillola cancella tutti i tuoi ricordi dolorosi, ma anche le lezioni che hai imparato. Diventi più felice, ma più ingenuo.',
    optionA: 'La prendo. La felicità conta.',
    optionB: 'Rifiuto. Il dolore mi ha reso ciò che sono.',
  },
  'steal-medicine': {
    question: 'Tuo figlio sta morendo e ha bisogno di una medicina che non puoi permetterti. Potresti rubarla. Il proprietario non è cattivo: sta solo gestendo la sua attività.',
    optionA: 'La rubo. Mio figlio viene prima.',
    optionB: 'Non rubo. Non oltrepasso quel limite.',
  },
  'organ-harvest': {
    question: 'Sei un medico. Gli organi di un paziente sano potrebbero salvare 5 persone che stanno morendo nella stanza accanto. Nessuno lo saprebbe mai.',
    optionA: 'Prelevo gli organi. 5 vite valgono più di 1.',
    optionB: 'Mai. Non si può uccidere un innocente.',
  },
  'mercy-kill': {
    question: 'Un tuo genitore malato terminale soffre in modo insopportabile e ti chiede di porre fine al dolore. I medici dicono che restano poche settimane. Nessuno lo scoprirà.',
    optionA: 'Rispetto il suo desiderio. Metto fine alla sofferenza.',
    optionB: 'Rifiuto. Non spetta a me decidere.',
  },
  whistleblower: {
    question: 'Scopri che la tua azienda inquina illegalmente un fiume. Denunciarla chiuderebbe lo stabilimento e farebbe perdere il lavoro a 1.000 persone in una comunità povera.',
    optionA: "Denuncio. L'ambiente viene prima.",
    optionB: 'Resto in silenzio. 1.000 famiglie non possono perdere il reddito.',
  },
  'confess-crime': {
    question: "A 22 anni, ubriaco dopo una festa, hai tamponato un'altra macchina. Il conducente si è fatto male — 3 mesi di riabilitazione. Sei fuggito. Ora hai 40 anni, sei un professionista rispettato. Nessuno ti ha mai collegato a quell'incidente.",
    optionA: 'Mi costituisco. Gli devo almeno questo, anche adesso.',
    optionB: 'Resto in silenzio. Rovinerebbe tutto quello che ho costruito — e non cambierebbe nulla per lui.',
  },
  lifeboat: {
    question: "Una scialuppa regge 8 persone. Siete in 9. Nessuno si offre. Qualcuno propone che vada l'anziano del gruppo — vi guarda e annuisce.",
    optionA: 'Accetto il suo cenno. Ha fatto pace con la scelta.',
    optionB: "Rifiuto. Quando cominciamo a scegliere chi è 'utile', abbiamo già perso qualcosa che non si recupera.",
  },
  'time-machine': {
    question: 'Puoi tornare indietro nel tempo e uccidere una persona da neonata, impedendo un genocidio da 10 milioni di morti. Il neonato è innocente.',
    optionA: 'Lo faccio. 10 milioni di vite contano di più.',
    optionB: 'Rifiuto. Non posso uccidere un bambino innocente.',
  },
  'plane-parachute': {
    question: 'Un aereo sta precipitando. Ci sono 6 sopravvissuti ma solo 4 paracadute. Tu ne hai uno. Lo tieni o lo cedi?',
    optionA: 'Tengo il paracadute. Istinto di sopravvivenza.',
    optionB: 'Lo cedo a qualcun altro. La sua vita prima.',
  },
  'zombie-apocalypse': {
    question: "Il tuo gruppo di 13 persone raggiunge un rifugio già occupato da 8 sconosciuti al massimo della capienza. Si rifiutano di aprire. Nel tuo gruppo ci sono bambini. Potreste forzare la porta — loro non hanno armi.",
    optionA: "Forziamo l'ingresso. La sopravvivenza viene prima della loro regola.",
    optionB: 'Rispettiamo il loro spazio. Erano lì prima e hanno il diritto di rifiutare.',
  },
  'pandemic-dose': {
    question: "Una nuova pandemia: in città resta una sola dose di vaccino. Tu e un anziano sconosciuto ne avete entrambi bisogno per sopravvivere. Il medico la consegna a te.",
    optionA: 'La prendo. Anche io merito di sopravvivere.',
    optionB: "La do all'anziano sconosciuto.",
  },
  'truth-friend': {
    question: "Il tuo migliore amico sta per lasciare il lavoro, vendere l'appartamento e trasferirsi all'estero per una relazione di 4 mesi. Ti chiede onestamente: 'Pensi che stia sbagliando?'",
    optionA: 'Sii onesto. Digli quello che vedi davvero — anche se te ne vorrà.',
    optionB: 'Supportalo. È la sua vita e ha già deciso.',
  },
  'report-friend': {
    question: 'Scopri che il tuo amico più caro ha commesso un grave reato finanziario, sottraendo soldi a un ente benefico. Lo denunci?',
    optionA: 'Lo denuncio. Nessuno è sopra la legge.',
    optionB: 'Resto leale. Prima gli parlo in privato.',
  },
  'cover-accident': {
    question: 'Il tuo partner passa col rosso e uccide accidentalmente un pedone. Va nel panico e ti implora di scappare. Nessuna telecamera vi ha ripresi.',
    optionA: 'Scappo. Proteggo la persona che amo.',
    optionB: 'Mi fermo e chiamo la polizia. La vittima conta.',
  },
  'sibling-secret': {
    question: 'Tuo fratello o tua sorella ti confessa che tradisce il coniuge da 2 anni. Il coniuge è anche un tuo caro amico.',
    optionA: 'Lo dico al coniuge. Merita la verità.',
    optionB: 'Non mi intrometto. Non è la mia relazione.',
  },
  'rich-or-fair': {
    question: "Una nuova tassa dimezzerebbe il reddito dell'1% più ricco e raddoppierebbe quello del 20% più povero. La ricchezza totale resta invariata.",
    optionA: 'Approvarla. Ridurre la concentrazione vale la redistribuzione.',
    optionB: 'Bloccarla. Scegliere così chi vince e chi perde è sbagliato, anche quando i conti tornano.',
  },
  'robot-judge': {
    question: "Uno strumento di IA per le condanne è più costante dei giudici umani su casi simili, ma non può spiegare il proprio ragionamento. Va usato?",
    optionA: 'Sì. La costanza è già una forma di equità.',
    optionB: 'No. Una condanna di cui non puoi conoscere la motivazione non è giustizia.',
  },
  'innocent-juror': {
    question: 'Sei in giuria. Tutte le prove indicano colpevolezza, ma il tuo istinto ti dice che l’imputato è innocente. Il verdetto deve essere unanime.',
    optionA: 'Voto colpevole. Seguo le prove.',
    optionB: 'Voto non colpevole. Mi fido del mio istinto.',
  },
  'death-row-exonerated': {
    question: "Il DNA scagiona una persona innocente dopo 25 anni nel braccio della morte. Il vero assassino ha 85 anni, è fragile e sta morendo. Deve andare in prigione?",
    optionA: 'Sì. La giustizia va fatta comunque.',
    optionB: 'No. Imprigionare un morente non risolve nulla.',
  },
  'revenge-vs-forgiveness': {
    question: 'Chi ti ha falsamente accusato dieci anni fa, costandoti la carriera, oggi guida un ente di beneficenza locale. Non si è mai fatto vivo.',
    optionA: 'Dico ai suoi donatori chi era. La reputazione non si ripulisce col silenzio.',
    optionB: 'Lascio stare. Continuare a tenermelo dentro costerebbe più a me che a lui.',
  },
  'privacy-terror': {
    question: 'I governi possono prevenire attentati leggendo tutti i messaggi privati, ma la privacy sparirebbe del tutto. Nessuna eccezione.',
    optionA: 'Lo permetto. Le vite contano più della segretezza.',
    optionB: 'Rifiuto. La privacy non si negozia.',
  },
  'censor-speech': {
    question: 'Un politico diffonde affermazioni false che portano a molestie e violenze in alcune comunità. Va bannato in modo permanente da tutte le piattaforme principali?',
    optionA: "Sì. La piattaforma non è la piazza pubblica — nessuno ha diritto a essere amplificato.",
    optionB: "No. Quando l'asticella è il 'danno', il prossimo ban non avrà più questa faccia.",
  },
  'mandatory-vaccine': {
    question: 'I vaccini sono efficaci e sicuri al 99%. Dovrebbero essere obbligatori per frequentare la scuola, anche contro obiezioni religiose dei genitori?',
    optionA: 'Sì. La salute pubblica protegge tutti.',
    optionB: 'No. Il corpo non può essere costretto.',
  },
  'surveillance-city': {
    question: 'Una città può eliminare tutti i crimini violenti installando sorveglianza IA 24/7 in ogni strada e spazio pubblico.',
    optionA: 'Sì. Azzerare la violenza vale la sorveglianza.',
    optionB: 'No. Non voglio vivere in uno stato di sorveglianza.',
  },
  'ai-art-copyright': {
    question: "Un'IA genera un dipinto capolavoro senza alcun input creativo umano. Chi possiede il copyright?",
    optionA: "L'azienda che l'ha creata possiede l'opera.",
    optionB: 'Nessuno — appartiene al dominio pubblico.',
  },
  'self-driving-crash': {
    question: "I freni di un'auto autonoma si rompono. Deve scegliere: schiantarsi contro una barriera e uccidere il passeggero, oppure investire un pedone che attraversava fuori dalle strisce.",
    optionA: 'Colpire la barriera. Proteggere il pedone.',
    optionB: 'Proteggere il passeggero. Ha pagato per la sicurezza.',
  },
  'brain-upload': {
    question: 'Gli scienziati possono caricare perfettamente la tua coscienza su un computer. Il tuo corpo biologico deve morire nel processo. La versione digitale sei ancora tu?',
    optionA: "Sì, lo faccio. L'immortalità vale il rischio.",
    optionB: "No. La morte fa parte dell'essere umani.",
  },
  'delete-social-media': {
    question: "Una legge vieterebbe i social ai minori di 16 anni, con verifica del documento. Proteggerebbe alcuni ragazzi e taglierebbe fuori quelli che proprio lì trovano comunità a cui sentono di appartenere.",
    optionA: "Approvarla. Per i minori la regola di default dev'essere proteggere, non lasciar entrare.",
    optionB: 'Bloccarla. Chi ne ha più bisogno sarà il primo a restare fuori.',
  },
  'ai-replaces-jobs': {
    question: "La tua azienda ti offre lo stesso stipendio: o supervisioni un'IA che fa il tuo vecchio lavoro, o ti riqualifichi per un altro ruolo senza garanzia di ottenerlo. Hai 30 giorni per decidere.",
    optionA: "Supervisiono l'IA. Prendo la certezza.",
    optionB: 'Mi riqualifico. Il ruolo di supervisore sparirà subito dopo.',
  },
  'deepfake-expose': {
    question: "Hai un video deepfake di una figura pubblica che commette un crimine. Non sai se l'episodio sia avvenuto davvero — sai solo che il video, in sé, è falso.",
    optionA: "Lo pubblico. Se porterà a un'inchiesta vera, la verità verrà fuori comunque.",
    optionB: 'Lo distruggo. Anche se avessi ragione, staresti piazzando una prova fabbricata.',
  },
  'tax-billionaires': {
    question: 'Una patrimoniale una tantum finanzierebbe dieci anni di aiuti alimentari a chi ne ha più bisogno. I miliardari resterebbero comunque miliardari.',
    optionA: 'Approvarla. La fame che placa pesa più del principio che piega.',
    optionB: 'Bloccarla. Colpire un gruppo, anche se comodo, rende più facile colpire il prossimo.',
  },
  'open-borders': {
    question: 'Confini completamente aperti tra tutti i paesi: chiunque può vivere e lavorare ovunque senza restrizioni.',
    optionA: 'Sì. La libertà di movimento è un diritto umano.',
    optionB: 'No. Le nazioni hanno bisogno di confini.',
  },
  'universal-basic-income': {
    question: 'Ogni adulto riceve 1.500 euro al mese dallo Stato. Le tasse per il 20% più ricco raddoppiano. Lo sostieni?',
    optionA: 'Sì. Nessuno dovrebbe vivere in povertà.',
    optionB: "No. Uccide l'incentivo a lavorare.",
  },
  'drug-legalization': {
    question: 'Tutte le droghe vengono legalizzate, tassate e regolamentate, eliminando il mercato nero. Il modello portoghese mostra che la criminalità cala del 50%. Lo sostieni?',
    optionA: 'Sì. Il proibizionismo ha fallito. Meglio regolare.',
    optionB: 'No. Alcune sostanze non dovrebbero mai essere legali.',
  },
  'prison-abolition': {
    question: 'Una persona condannata per un reato grave finisce una lunga pena ed esce libera. Dovrebbe poter vivere nel tuo quartiere senza che a te venga detto nulla?',
    optionA: 'Sì. Se ha scontato la pena, la punizione non può seguirla per sempre.',
    optionB: 'No. Chi le vive accanto ha diritto di sapere quale rischio gli si chiede di accettare.',
  },
  'love-or-career': {
    question: 'Arriva il lavoro dei tuoi sogni, ma richiede di trasferirti in un altro continente. Il tuo partner da 5 anni rifiuta di seguirti.',
    optionA: 'Accetto il lavoro. La carriera è il mio futuro.',
    optionB: "Rifiuto. L'amore vale più dell'ambizione.",
  },
  'old-secret-affair': {
    question: 'Il tuo partner ti chiede se sei mai stato infedele. Hai avuto una notte con un’altra persona 12 anni fa, prima che la relazione diventasse seria. Non lo scoprirà mai altrimenti.',
    optionA: 'Dico la verità. Onestà sopra tutto.',
    optionB: 'Resto in silenzio. È storia antica.',
  },
  'forgive-cheater': {
    question: 'Il tuo partner da 15 anni confessa un tradimento di una notte avvenuto 3 anni fa. Da allora è stato completamente fedele ed è sinceramente pentito.',
    optionA: 'Resto. Un errore non cancella 15 anni.',
    optionB: 'Me ne vado. La fiducia è finita per sempre.',
  },
  'save-partner-vs-stranger': {
    question: 'Un edificio brucia: puoi salvare una sola persona, il tuo partner oppure un bambino di 5 anni che non hai mai incontrato.',
    optionA: 'Salvo il mio partner. Il legame personale viene prima.',
    optionB: 'Salvo il bambino. Una vita futura viene prima.',
  },

  // ── AI COMPANIONS & TEEN SAFETY ─────────────────────────────────
  'ai-companion-teen': {
    question: 'Tuo figlio di 13 anni chatta ogni sera con un\'AI companion che ricorda tutto, non litiga mai e sembra una relazione romantica. I voti sono normali. Gli amici diminuiscono.',
    optionA: 'Blocco l\'app. La prima cotta deve far male e sorprendere — è così che si impara a stare con gli altri.',
    optionB: 'Lascio andare. Forzarlo offline ora spinge la relazione nel nascondiglio, non la chiude.',
  },
  'ai-companion-ban': {
    question: 'Una legge vieta le AI companion romantiche sotto i 18 anni, con verifica dell\'età obbligatoria. Le ricerche mostrano che la solitudine cala MA si atrofizzano le abilità relazionali dal vivo.',
    optionA: 'La approvo. Un adolescente non dovrebbe imparare l\'intimità da un sistema progettato per non contraddirlo mai.',
    optionB: 'La blocco. I ragazzi più soli perderanno l\'app per primi; i popolari non se ne accorgeranno.',
  },
  'ai-grief-replica': {
    question: 'Una startup costruisce repliche AI dei propri cari defunti a partire da messaggi, note vocali e foto. Tuo padre è morto cinque anni fa. La prova è gratuita.',
    optionA: 'La provo. Sentire la sua voce rispondere a un\'ultima domanda vale il disagio.',
    optionB: 'Rifiuto. Il lutto funziona perché la conversazione è finalmente finita.',
  },

  // ── RELIGION & AI ETHICS ────────────────────────────────────────
  'pope-ai-encyclical': {
    question: 'Un\'autorità religiosa pubblica un documento di 42.000 parole avvertendo che l\'AI non è moralmente neutra e fissa limiti etici. A una grande azienda tech viene chiesto di vincolarsi formalmente a quei limiti.',
    optionA: 'Si vincola. Una cornice morale costruita in secoli batte qualunque memo di prodotto trimestrale.',
    optionB: 'Rifiuta. Regole basate sulla fede non possono vincolare un sistema che serve utenti di ogni credo.',
  },
  'religious-ai-ethics': {
    question: 'Un comitato etico AI ha tre filosofi, due ingegneri, un giurista e nessuna voce religiosa. Miliardi di utenti vengono da tradizioni di fede più antiche dell\'informatica.',
    optionA: 'Aggiungo un seggio religioso. Escludere il vocabolario morale che la maggior parte degli utenti vive ogni giorno garantisce punti ciechi.',
    optionB: 'Lo tengo laico. Un privilegio religioso al tavolo finirà per inclinare le decisioni a favore di una comunità rispetto alle altre.',
  },
  'ai-prayer-app': {
    question: 'Un\'app genera preghiere personalizzate, dispensa benedizioni e offre confessione AI. Alcuni utenti dicono che ha approfondito la loro fede. Le istituzioni religiose la chiamano profanazione.',
    optionA: 'La uso. Se avvicina qualcuno al sacro, il mezzo è secondario.',
    optionB: 'La rifiuto. Esternalizzare il lavoro interiore a un chatbot trasforma il rito in comodità.',
  },

  // ── PARENTING CULTURE & CHILDHOOD AUTONOMY ────────────────────
  'sleepover-9yo': {
    question: 'Tuo figlio di 9 anni è invitato al primo pigiama party da un amico. I genitori che ospitano sono gentili, ma li conosci poco. A scuola pochi bambini fanno ancora pigiama party.',
    optionA: 'Lo lascio andare. Un\'infanzia senza piccoli rischi è solo attesa sorvegliata.',
    optionB: 'Rifiuto con tatto. La fiducia si costruisce prima; il pigiama party può aspettare.',
  },
  'helicopter-gps-teen': {
    question: 'Tutti gli amici di tuo figlio quattordicenne condividono il GPS 24/7 con i genitori. Tuo figlio dice che ormai è normale. Tu sei cresciuto senza nulla di tutto questo.',
    optionA: 'Lo attivo. La soglia di sicurezza si è spostata; rifiutare lo rende l\'eccezione.',
    optionB: 'Rifiuto. Un adolescente sempre tracciato non impara mai a essere degno di fiducia fuori dal nostro sguardo.',
  },

  // ── AI SCAM ECONOMY ───────────────────────────────────────────
  'ai-fake-review': {
    question: 'Il tuo piccolo negozio online ha 4,5 stelle; i concorrenti a 4,9 stanno usando AI per generare centinaia di recensioni elogiative. Potresti raggiungerli in un pomeriggio. Nessuno verifica.',
    optionA: 'Lo faccio. Recensioni oneste non possono vincere contro una piattaforma che premia il gonfiaggio.',
    optionB: 'Rifiuto. Una volta cominciato non sei più distinguibile dagli operatori che disprezzi.',
  },
  'scalper-bot': {
    question: 'Una serie limitata si esaurisce in 30 secondi. I bagarini con bot AI rivendono a 4x il prezzo. Potresti comprare un abbonamento bot e unirti — oppure restare nella coda umana e perdere.',
    optionA: 'Compro il bot. Il sistema è già rotto; non usarlo è una tassa sull\'onestà.',
    optionB: 'Resto umano. Se tutti rifiutano, i bot non hanno mercato; se ti unisci, la coda umana sparisce per sempre.',
  },

  // ── DILEMMI SITUAZIONALI (scelte di tutti i giorni) ──────────────
  'stolen-credit': {
    question: 'In riunione un collega presenta come sua un\'idea tua e il capo resta colpito. Parlare adesso significa contraddirlo davanti a tutti.',
    optionA: 'Reclamo il merito sul momento. Che tutti sappiano che era mia.',
    optionB: 'Lascio correre ora e ne parlo in privato dopo.',
  },
  'cover-coworker-error': {
    question: 'Noti l\'errore di un collega che danneggerà i clienti in modo silenzioso. Nessun altro se n\'è accorto, e segnalarlo metterebbe il collega in seri guai.',
    optionA: 'Lo segnalo. I clienti vengono prima del collega.',
    optionB: 'Lo aiuto a sistemarlo in silenzio e resta tra noi due.',
  },
  'rule-exception-manager': {
    question: 'Sei il responsabile. Un dipendente affidabile ti chiede di derogare a una regola chiara per una vera emergenza familiare — ma concederlo crea un precedente che gli altri pretenderanno.',
    optionA: 'Applico la regola per tutti. Equità significa nessuna eccezione.',
    optionB: 'Faccio l\'eccezione. Le persone contano più del precedente.',
  },
  'promotion-fire-teammate': {
    question: 'Ti offrono la promozione per cui lavori da anni, a una condizione: devi licenziare un membro del team che stimi e che non ha fatto nulla di sbagliato.',
    optionA: 'Accetto. Lo farà comunque qualcuno; meglio che sia io.',
    optionB: 'Rifiuto. Non comprerò il mio futuro col suo posto.',
  },
  'friend-cheats-exam': {
    question: 'Il tuo migliore amico bara a un concorso e ottiene un posto che un candidato onesto ha appena perso. Solo tu l\'hai visto.',
    optionA: 'Lo segnalo. Il candidato onesto merita quel posto.',
    optionB: 'Resto leale. Proteggo il mio amico e non dico nulla.',
  },
  'overpaid-change': {
    question: 'Un cassiere stanco ti dà 50 euro di resto in più. Non se ne accorgerà, ma alla chiusura la differenza uscirà probabilmente dalle sue tasche.',
    optionA: 'Li restituisco. L\'errore non deve costargli.',
    optionB: 'Li tengo. Me li ha dati lui; non è un problema mio.',
  },
  'friend-partner-cheating': {
    question: 'Vedi per caso una prova chiara che il partner di un caro amico lo tradisce. Dirglielo gli farà crollare il mondo; tacere ti rende parte del segreto.',
    optionA: 'Glielo dico. Merita di sapere la verità.',
    optionB: 'Non mi intrometto. Non sta a me rivelarlo.',
  },
  'group-project-freeloader': {
    question: 'Un membro del gruppo non ha quasi fatto nulla, ma avrà lo stesso merito e lo stesso voto degli altri. Chi vi valuta sta per decidere.',
    optionA: 'Lo dico a chi valuta. Il merito deve rispecchiare il lavoro fatto.',
    optionB: 'Sto zitto. Me lo assorbo invece di farlo affondare.',
  },
  'ai-work-disclosure': {
    question: "Hai usato l'IA per produrre un report che il tuo capo ha definito 'la migliore analisi che tu abbia mai fatto.' In riunione plenaria, lo cita come prova che 'non serve assumere un terzo analista.' Dici come lo hai realizzato?",
    optionA: "Sì, lo rivelo. Lo strumento usato conta quanto il risultato.",
    optionB: 'No, sto zitto. Ho preso io tutte le decisioni chiave.',
  },
  'teen-influencer-secret': {
    question: "Scopri che tuo figlio di 13 anni ha un account segreto con 50.000 follower. Pubblica da un anno senza che tu lo sapessi. Guadagna 800€ al mese. Ti implora di non chiuderlo.",
    optionA: "Lo chiudo. Ha 13 anni — non è una decisione che può prendere lui.",
    optionB: 'Lo aiuto a gestirlo in sicurezza. Chiuderlo cancella un anno di lavoro.',
  },
  'climate-flight': {
    question: "Il tuo genitore malato terminale sta morendo in un altro paese. Hai giurato pubblicamente di non volare mai più per il clima — i tuoi 80.000 follower se lo ricordano. Il treno impiegherebbe 4 giorni e potrebbe arrivare tardi.",
    optionA: "Prendo l'aereo. Certe emergenze giustificano qualsiasi regola.",
    optionB: 'Prendo il treno. Il senso di un principio è che regge sotto pressione.',
  },
  'ai-friend-reveal': {
    question: "Da 3 anni confidavi i tuoi pensieri più profondi a qualcuno online che sembrava un vero amico. Hai appena scoperto che è un personaggio IA creato da un'azienda che vende abbonamenti di supporto emotivo. Continueresti a usarlo?",
    optionA: 'Sì. Il conforto che mi ha dato era reale — la fonte non cambia questo.',
    optionB: "No. Stavo pagando per un'illusione di connessione.",
  },
}

export function translateScenarioToItalian<T extends Scenario>(scenario: T): T {
  const translation = IT_SCENARIO_TRANSLATIONS[scenario.id]
  return translation ? { ...scenario, ...translation } : scenario
}

export function getItalianScenario(id: string): Scenario | undefined {
  const scenario = getScenario(id)
  return scenario ? translateScenarioToItalian(scenario) : undefined
}
