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
    optionB: 'Non rubo. Trovo un altro modo.',
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
    question: 'Hai commesso un piccolo reato 20 anni fa. Nessuno si è fatto male e nessuno lo sa. Confessare distruggerebbe carriera e famiglia.',
    optionA: "Confesso. Devo vivere con integrità.",
    optionB: 'Resto in silenzio. Il passato è passato.',
  },
  lifeboat: {
    question: 'Una scialuppa può reggere al massimo 8 persone. I sopravvissuti sono 9. Qualcuno deve finire in mare o affogano tutti.',
    optionA: 'Voto per buttare qualcuno fuori.',
    optionB: 'Rifiuto. Si affonda o si sopravvive insieme.',
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
    question: "Durante un'apocalisse zombie, il tuo gruppo trova un rifugio fortificato con scorte per 10 persone. Siete in 15. Tu hai l'unica chiave.",
    optionA: 'Faccio entrare tutti. Troviamo una soluzione insieme.',
    optionB: 'Faccio entrare solo 10. Assicuro la sopravvivenza del gruppo.',
  },
  'pandemic-dose': {
    question: "Una nuova pandemia: in città resta una sola dose di vaccino. Tu e un anziano sconosciuto ne avete entrambi bisogno per sopravvivere. Il medico la consegna a te.",
    optionA: 'La prendo. Anche io merito di sopravvivere.',
    optionB: "La do all'anziano sconosciuto.",
  },
  'truth-friend': {
    question: 'Il tuo migliore amico ti chiede se ti piace il suo nuovo partner. Tu pensi che quella persona sia pessima per lui.',
    optionA: 'Sono brutalmente sincero.',
    optionB: 'Mantengo la pace. Sto zitto.',
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
    question: 'Puoi premere un pulsante: tutti sulla Terra diventano ugualmente poveri, oppure il mondo resta com’è con disuguaglianze estreme.',
    optionA: 'Lo premo. La povertà uguale è più giusta.',
    optionB: 'Non lo premo. Mantengo il mondo attuale.',
  },
  'robot-judge': {
    question: "È provato che l'IA sia il 30% più accurata dei giudici umani. Sostituiresti i giudici umani con l'IA nei processi penali?",
    optionA: 'Sì. Più accuratezza salva vite.',
    optionB: 'No. La giustizia ha bisogno di umanità.',
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
    question: 'Qualcuno che ti ha rovinato la vita 10 anni fa ora è cambiato, ha successo e aiuta la comunità. Non si è mai scusato.',
    optionA: 'Lo smaschero. Il mondo deve sapere chi era.',
    optionB: 'Lascio perdere. Le persone possono cambiare.',
  },
  'privacy-terror': {
    question: 'I governi possono prevenire attentati leggendo tutti i messaggi privati, ma la privacy sparirebbe del tutto. Nessuna eccezione.',
    optionA: 'Lo permetto. Prima la sicurezza.',
    optionB: 'Rifiuto. La privacy non si negozia.',
  },
  'censor-speech': {
    question: 'Le bugie di un politico hanno causato direttamente 500 morti incitando alla violenza. Sosterresti il ban permanente da tutte le piattaforme social?',
    optionA: 'Sì. Le parole pericolose hanno conseguenze.',
    optionB: 'No. La libertà di parola è assoluta.',
  },
  'mandatory-vaccine': {
    question: 'I vaccini sono efficaci e sicuri al 99%. Dovrebbero essere obbligatori per frequentare la scuola, anche contro obiezioni religiose dei genitori?',
    optionA: 'Sì. La salute pubblica protegge tutti.',
    optionB: 'No. Il corpo non può essere costretto.',
  },
  'surveillance-city': {
    question: 'Una città può eliminare tutti i crimini violenti installando sorveglianza IA 24/7 in ogni strada e spazio pubblico.',
    optionA: 'Sì. La sicurezza vale il prezzo.',
    optionB: 'No. Non voglio vivere in uno stato di sorveglianza.',
  },
  'ai-art-copyright': {
    question: "Un'IA genera un dipinto capolavoro senza alcun input creativo umano. Chi possiede il copyright?",
    optionA: "L'azienda che ha creato l'IA.",
    optionB: 'Nessuno: dovrebbe essere dominio pubblico.',
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
    question: 'Puoi cancellare per sempre tutti i social media. Il mondo diventa più lento e meno connesso, ma la salute mentale globale migliora del 40%.',
    optionA: 'Li cancello. La salute mentale viene prima.',
    optionB: 'No. Connessione e libertà di espressione contano.',
  },
  'ai-replaces-jobs': {
    question: "L'IA eliminerà il 30% dei lavori entro 10 anni. I governi possono rallentarla a enorme costo economico, oppure lasciarla avanzare e riqualificare i lavoratori.",
    optionA: 'La rallento. Le persone hanno bisogno di tempo.',
    optionB: 'Lascio avanzare il progresso. La risposta è riqualificare.',
  },
  'deepfake-expose': {
    question: 'Hai un video deepfake indistinguibile dal reale che mostra un politico corrotto mentre commette un crimine. Il politico è davvero corrotto, ma quell’evento non è mai accaduto.',
    optionA: 'Lo pubblico. Merita di cadere.',
    optionB: 'Lo distruggo. Una bugia resta una bugia.',
  },
  'tax-billionaires': {
    question: 'Una tassa patrimoniale una tantum del 90% sui miliardari potrebbe eliminare la fame nel mondo per 10 anni. Resterebbero comunque ricchissimi.',
    optionA: 'Sì. Nessuno ha bisogno di un miliardo.',
    optionB: 'No. La redistribuzione forzata è sbagliata.',
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
    question: 'Tutte le prigioni vengono sostituite da centri di riabilitazione: terapia, istruzione, nessuna punizione. Gli studi mostrano che la recidiva cala del 60%.',
    optionA: 'Sì. La riabilitazione è più efficace.',
    optionB: 'No. Alcuni crimini meritano punizione.',
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
    optionA: 'Resto. Le persone sbagliano.',
    optionB: 'Me ne vado. La fiducia è finita per sempre.',
  },
  'save-partner-vs-stranger': {
    question: 'Un edificio brucia: puoi salvare una sola persona, il tuo partner oppure un bambino di 5 anni che non hai mai incontrato.',
    optionA: 'Salvo il mio partner.',
    optionB: 'Salvo il bambino.',
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
