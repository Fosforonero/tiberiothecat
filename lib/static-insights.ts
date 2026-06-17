import type { DynamicExpertInsight } from '@/lib/expert-insights'

// Per-id post-vote insight overrides for static dilemmas.
//
// Sprint history:
//   - DILEMMA-STATIC-41-REWRITE-PILOT-01 seeded the 5 rewritten pilot ids
//     (rich-or-fair, robot-judge, censor-speech, deepfake-expose,
//     prison-abolition).
//   - ADSENSE-STATIC-INSIGHTS-EXPANSION-01 extended coverage to all 41
//     static scenarios (EN+IT) to add substantive original content next
//     to the ad slot on /results/<id>, addressing AdSense low-value-
//     content rejection.
//
// Same override shape as DynamicScenario.expertInsightEn / expertInsightIt
// — merged into the category-level fallback inside ResultsClientPage.
// Adding an id here is safe: missing ids fall through to the existing
// category insight. The AdSlot gate in ResultsClientPage and play page
// reads `hasStaticInsight(id)` to decide whether to render ads.

type LocaleInsight = { en: DynamicExpertInsight; it: DynamicExpertInsight }

const STATIC_INSIGHTS: Record<string, LocaleInsight> = {
  'rich-or-fair': {
    en: {
      body: "This isn't a vote about whether inequality matters — almost everyone agrees it does. It's a vote about which lever is legitimate. The math here is symmetric: same total wealth, just redistributed. So the disagreement is purely about whether the state may target some incomes to lift others, even when the affected group remains comfortably well-off.",
      whyPeopleSplit: "Procedural-fairness intuitions and outcome-fairness intuitions diverge here. A person can fully agree that the bottom 20% need more and still resist a mechanism that singles out a specific group. Another can think the principle of non-targeting matters less than the concentration it leaves in place. Neither position is hidden indifference.",
      whatYourAnswerMaySuggest: {
        a: "You may weight outcomes over the act that produced them. The redistribution result matters more to you than the principle that a tax shouldn't pick a specific population to draw from.",
        b: "You may weight the process more than the outcome. Once a state targets one group on income criteria, you don't trust where the next line gets drawn — even when this specific line passes a math check.",
      },
    },
    it: {
      body: "Non è un voto sull'esistenza della disuguaglianza — quella la riconoscono quasi tutti. È un voto su quale leva sia legittima. Qui i conti sono simmetrici: la ricchezza totale resta la stessa, cambia solo la distribuzione. Il disaccordo riguarda solo se lo Stato possa colpire alcuni redditi per alzarne altri, anche quando chi paga resta tranquillamente benestante.",
      whyPeopleSplit: "Le intuizioni di equità procedurale e di equità degli esiti divergono qui. Una persona può essere d'accordo che il 20% più povero abbia bisogno di più e resistere comunque a un meccanismo che isola un gruppo specifico. Un'altra può ritenere che il principio del non-bersaglio conti meno della concentrazione che lascia in piedi. Nessuna delle due posizioni nasconde indifferenza.",
      whatYourAnswerMaySuggest: {
        a: "Potresti pesare di più gli esiti rispetto al gesto che li produce. Il risultato della redistribuzione conta più del principio che una tassa non dovrebbe scegliere su quale popolazione attingere.",
        b: "Potresti pesare di più il processo dell'esito. Una volta che lo Stato colpisce un gruppo in base al reddito, non ti fidi di dove sarà tracciata la prossima linea — anche quando questa specifica linea torna nei conti.",
      },
    },
  },

  'robot-judge': {
    en: {
      body: "Two ideas of fairness collide here: equality-of-treatment (similar cases get similar sentences) and reason-giving (the system can tell you why). Human judges fail the first regularly — implicit bias, fatigue, the order cases are heard — but pass the second by default. An opaque AI flips both. The dilemma is which failure mode you tolerate.",
      whyPeopleSplit: "This is a substantive disagreement about what justice is for. People who answer A think of justice as a quality-control problem — the system should produce consistent outputs. People who answer B think of justice as a relationship between the state and the person being sentenced — accountability requires that someone can explain the decision to the person it affects.",
      whatYourAnswerMaySuggest: {
        a: "You may treat the legal system as an output-producing machine that should produce equal results for equal inputs. Consistency, once you accept it as a primary good, makes the explainability gap a cost worth paying.",
        b: "You may treat sentencing as something that has to be addressed to a person. The right to be told why is not an extra you can trade for accuracy — it's part of what makes the verdict legitimate at all.",
      },
    },
    it: {
      body: "Due idee di giustizia si scontrano qui: parità di trattamento (casi simili ricevono pene simili) e motivazione (il sistema può dirti perché). I giudici umani falliscono la prima regolarmente — pregiudizi impliciti, stanchezza, ordine in cui i casi vengono ascoltati — ma passano la seconda per default. Un'IA opaca ribalta entrambe. Il dilemma è quale modalità di fallimento sei disposto a tollerare.",
      whyPeopleSplit: "È un disaccordo sostanziale su cosa serva la giustizia. Chi sceglie A pensa alla giustizia come a un problema di controllo qualità — il sistema dovrebbe produrre output coerenti. Chi sceglie B pensa alla giustizia come a una relazione fra Stato e persona condannata — la responsabilità richiede che qualcuno possa spiegare la decisione a chi la subisce.",
      whatYourAnswerMaySuggest: {
        a: "Potresti vedere il sistema giudiziario come una macchina di output che dovrebbe restituire risultati uguali per ingressi uguali. Una volta accettata la coerenza come bene primario, il deficit di spiegabilità diventa un costo accettabile.",
        b: "Potresti vedere la pena come qualcosa che va rivolta a una persona. Il diritto di sapere perché non è un extra negoziabile in cambio di accuratezza — è parte di ciò che rende la sentenza legittima a monte.",
      },
    },
  },

  'censor-speech': {
    en: {
      body: "This isn't a vote on whether the politician's claims are good — both options assume they're false and harmful. It's a vote on who should hold the lever that silences amplification. Option A treats platforms as private moderators that don't owe equal access; option B accepts that the same lever, once normalised, gets used in cases that look very different from this one.",
      whyPeopleSplit: "Both sides agree harm matters. They disagree about who is best positioned to decide what counts as enough harm to silence speech. One side trusts platform accountability — they bear reputational risk and respond to public pressure. The other distrusts any actor, corporate or state, given a discretionary power over which speech reaches which audience.",
      whatYourAnswerMaySuggest: {
        a: "You may see free-speech protection as a constraint on government, not a guarantee of platform reach. Voluntary platform moderation, even at scale, is part of how speech competes for an audience — not a violation of the right to speak.",
        b: "You may worry less about this specific case than about the precedent. The case for banning here is unusually strong; the next case the rule gets applied to will probably be weaker, harder, and the public won't notice it the same way.",
      },
    },
    it: {
      body: "Non è un voto sulla qualità delle affermazioni del politico — entrambe le opzioni le danno per false e dannose. È un voto su chi debba avere la leva che spegne l'amplificazione. L'opzione A tratta le piattaforme come moderatori privati che non devono accesso uguale a tutti; l'opzione B accetta che la stessa leva, una volta normalizzata, finirà per essere usata in casi che assomigliano poco a questo.",
      whyPeopleSplit: "Entrambe le posizioni concordano che il danno conta. Disaccordano su chi sia in posizione migliore per decidere quanto danno sia abbastanza per spegnere una voce. Una parte si fida della responsabilità delle piattaforme — rischio reputazionale, reazione alla pressione pubblica. L'altra non si fida di nessun attore, aziendale o statale, a cui venga dato un potere discrezionale su quali parole arrivino a quale pubblico.",
      whatYourAnswerMaySuggest: {
        a: "Potresti vedere la protezione della libertà di parola come un vincolo per il governo, non come una garanzia di portata sulla piattaforma. La moderazione volontaria, anche su larga scala, fa parte di come le parole competono per un pubblico — non viola il diritto di parlare.",
        b: "Potresti preoccuparti meno di questo caso specifico e più del precedente. Le ragioni per il ban qui sono insolitamente forti; il prossimo caso a cui la regola si applicherà sarà probabilmente più debole, più sfumato, e il pubblico non lo noterà allo stesso modo.",
      },
    },
  },

  'deepfake-expose': {
    en: {
      body: "This is a dilemma about means and ends with a twist: you don't even know if the ends are good. Releasing a fake video might trigger a real investigation, but it also commits you to an act that's wrong on its own terms — fabricated evidence — regardless of what the investigation finds. The question is whether the gamble on outcome justifies the certain act.",
      whyPeopleSplit: "This splits people along consequentialist vs. deontological lines, with an epistemic twist. One side weighs the expected good the leak might do; the other refuses to treat their own action's morality as conditional on a result they cannot guarantee. The closer you are to working with evidence, journalism or law, the more the deontological intuition tends to dominate.",
      whatYourAnswerMaySuggest: {
        a: "You may believe systems eventually self-correct — a real investigation will sift truth from forgery, and the net effect of forcing scrutiny is better than letting suspected wrongdoing rest. The fake is a trigger, not the final claim.",
        b: "You may believe an act is wrong as soon as you commit it, not when its consequences are known. Even if the politician turns out to be guilty, you'd have manufactured a falsehood to get there — and that act has its own moral weight regardless of where the investigation ends up.",
      },
    },
    it: {
      body: "È un dilemma su mezzi e fini con un colpo di scena: non sai nemmeno se i fini siano buoni. Pubblicare un video falso potrebbe innescare un'inchiesta vera, ma ti impegna anche in un atto sbagliato in sé — falsificare prove — indipendentemente da come finisca l'inchiesta. La domanda è se la scommessa sull'esito giustifichi l'atto certo.",
      whyPeopleSplit: "Qui le persone si dividono fra intuizioni consequenzialiste e deontologiche, con una variante epistemica. Una parte pesa il bene atteso che la fuga potrebbe produrre; l'altra rifiuta di rendere la moralità del proprio gesto condizionata a un risultato che non può garantire. Più si lavora con prove, giornalismo o diritto, più l'intuizione deontologica tende a prevalere.",
      whatYourAnswerMaySuggest: {
        a: "Potresti credere che i sistemi alla fine si autocorreggano — un'inchiesta vera distinguerà la verità dal falso, e l'effetto netto del forzare l'esame è migliore del lasciare un sospetto in pace. Il falso è un innesco, non la pretesa finale.",
        b: "Potresti credere che un atto sia sbagliato nel momento in cui lo commetti, non quando se ne conoscono le conseguenze. Anche se il politico risultasse colpevole, avresti fabbricato una menzogna per arrivarci — e quel gesto ha un suo peso morale indipendente da dove finisce l'inchiesta.",
      },
    },
  },

  'prison-abolition': {
    en: {
      body: "This is a dilemma about whether a sentence is meant to end. Option A holds that 'paid' means paid in full — anything beyond the official punishment is unofficial extra-judicial punishment with no termination clause. Option B holds that the surrounding community has its own claim independent of the offender's debt — they didn't choose the risk, and disclosure lets them protect themselves.",
      whyPeopleSplit: "This isn't a fight between rehabilitation belief and retribution belief, the way the old framing suggested. It's a clash between two competing rights: the offender's right to a fresh start and the neighbour's right to informed consent over their own safety. Most ethical frameworks recognise both — they just rank them differently.",
      whatYourAnswerMaySuggest: {
        a: "You may treat the completed sentence as a closed transaction. Lifelong disclosure turns punishment into a permanent stain that has no theoretical endpoint and tends to push people back toward the only environments they came from.",
        b: "You may treat your community's right to know as separate from any judgement of the offender. They've paid the state, but they haven't paid the people who'll now live around them — and those people have a stake in the risk they didn't sign up for.",
      },
    },
    it: {
      body: "È un dilemma sul fatto che una pena debba davvero finire. L'opzione A sostiene che 'scontata' vuol dire scontata fino in fondo — qualunque cosa in più rispetto alla punizione ufficiale è una pena extragiudiziale informale senza clausola di chiusura. L'opzione B sostiene che la comunità intorno ha una pretesa propria, indipendente dal debito del condannato — quel rischio non l'ha scelto, e l'informazione le permette di proteggersi.",
      whyPeopleSplit: "Non è una battaglia fra chi crede nella riabilitazione e chi nella punizione, come suggeriva la vecchia formulazione. È uno scontro fra due rivendicazioni concorrenti: il diritto di chi ha scontato la pena a ricominciare, e il diritto di chi vive vicino al consenso informato sulla propria sicurezza. Quasi tutte le cornici etiche riconoscono entrambi — solo li ordinano in modo diverso.",
      whatYourAnswerMaySuggest: {
        a: "Potresti trattare la pena scontata come una transazione chiusa. La divulgazione a vita trasforma la punizione in un marchio permanente, che non ha un punto teorico di fine e tende a respingere le persone solo verso gli ambienti da cui erano partite.",
        b: "Potresti vedere il diritto a sapere della tua comunità come separato da qualunque giudizio sulla persona condannata. Ha pagato lo Stato, ma non ha pagato chi le vivrà vicino — e quelle persone hanno una posta in gioco rispetto a un rischio che non hanno firmato.",
      },
    },
  },

  // ── MORALITY (7 additional ids) ──────────────────────────────
  'trolley': {
    en: {
      body: "The trolley problem is less a question about saving more lives than about who gets to decide which death is acceptable. Both options end in deaths you didn't cause and can't undo — the choice is between letting events run their course and inserting your own hand into the chain of causation.",
      whyPeopleSplit: "For some, refusing to act is a way of refusing authorship over the death of a stranger; the five who die aren't 'your' deaths because you didn't initiate the chain. For others, declining to act when you could is its own kind of authorship — inaction is a choice with consequences.",
      whatYourAnswerMaySuggest: {
        a: "You may treat the moral weight of an outcome as primary: five lives lost is worse than one, and which lever you touched matters less than the count at the end.",
        b: "You may resist becoming the proximate cause of a death, even to prevent more deaths. The action and the omission feel categorically different — and you're not willing to flatten them.",
      },
    },
    it: {
      body: "Il dilemma del carrello pone meno una domanda su quante vite salvare e più su chi sia legittimato a decidere quale morte sia accettabile. Entrambe le opzioni finiscono con morti che non hai causato e non puoi annullare — la scelta è fra lasciare che gli eventi seguano il loro corso e inserire la tua mano nella catena causale.",
      whyPeopleSplit: "Per alcuni, rifiutare di agire è un modo di rifiutare la paternità sulla morte di uno sconosciuto: i cinque che muoiono non sono 'le tue' morti perché non hai iniziato la catena. Per altri, rifiutare di agire quando potresti è a sua volta una forma di paternità — l'inazione è una scelta con conseguenze.",
      whatYourAnswerMaySuggest: {
        a: "Potresti dare il peso morale primario all'esito: cinque vite perse sono peggio di una, e quale leva hai toccato conta meno del conteggio alla fine.",
        b: "Potresti rifiutare di diventare la causa prossima di una morte, anche per impedirne di più. L'azione e l'omissione ti sembrano categoricamente diverse — e non sei disposto ad appiattirle.",
      },
    },
  },

  'cure-secret': {
    en: {
      body: "The premise asks you to choose between secret salvation and open destruction — millions saved silently, or science as an institution preserved at the cost of those saves. The dilemma is about whether moral worth lives in the outcome you produce or the system you keep intact.",
      whyPeopleSplit: "One side sees one person hoarding a life-saving discovery as a betrayal of medicine's basic compact: it exists to be shared, examined, replicated. The other notes that the compact has limits — if sharing means none of the saves happen at all, the principle becomes a more expensive form of refusing to act.",
      whatYourAnswerMaySuggest: {
        a: "You may prioritise the people who live over the institution that wouldn't have saved them. Secrecy here doesn't mean greed — it means accepting personal moral burden so the saves still happen.",
        b: "You may treat scientific openness as a kind of trust that can't be sacrificed for any one result. A cure no one can verify is a cure no one can build on, expand, or guard against being lost.",
      },
    },
    it: {
      body: "La premessa ti chiede di scegliere fra salvezza segreta e distruzione aperta — milioni salvati in silenzio, o la scienza come istituzione preservata al costo di quelle vite. Il dilemma riguarda se il valore morale stia nell'esito che produci o nel sistema che mantieni intatto.",
      whyPeopleSplit: "Una parte vede una persona che custodisce in segreto una scoperta salvavita come un tradimento del patto base della medicina: esiste per essere condivisa, esaminata, replicata. L'altra nota che il patto ha dei limiti — se condividere significa che nessuna delle vite viene salvata, il principio diventa una forma più costosa di rifiuto di agire.",
      whatYourAnswerMaySuggest: {
        a: "Potresti dare priorità alle persone che vivono rispetto all'istituzione che non le avrebbe salvate. La segretezza qui non è avidità — è accettare il peso morale personale perché i salvataggi avvengano lo stesso.",
        b: "Potresti vedere l'apertura scientifica come una fiducia che non puoi sacrificare per nessun risultato singolo. Una cura che nessuno può verificare è una cura che nessuno può sviluppare, espandere o difendere dalla perdita.",
      },
    },
  },

  'memory-erase': {
    en: {
      body: "Both options ask you to define what counts as 'you'. One answer says: the version of you that suffers less is the better version, regardless of how you got there. The other says: the version of you that learned from pain is the one continuous with your past — and that continuity is part of identity, not a cost.",
      whyPeopleSplit: "People who value subjective wellbeing as the highest good see no obvious reason to keep pain that has done its work. People who value narrative identity see erasing the lessons as erasing a quiet kind of self — even if the residue is happier, it's less yours.",
      whatYourAnswerMaySuggest: {
        a: "You may treat suffering as data the system extracted from — once extracted, the pain itself is a tax, not a feature. Choosing to drop it doesn't make the lessons less real.",
        b: "You may treat the link between pain and growth as constitutive, not incidental. The naive version of you isn't a discount — it's a different person, and you don't want to trade who you became for who you'd be.",
      },
    },
    it: {
      body: "Entrambe le opzioni ti chiedono di definire cosa conta come 'te'. Una risposta dice: la versione di te che soffre meno è la versione migliore, indipendentemente da come ci sei arrivato. L'altra dice: la versione di te che ha imparato dal dolore è quella continua con il tuo passato — e quella continuità fa parte dell'identità, non è un costo.",
      whyPeopleSplit: "Chi valorizza il benessere soggettivo come bene supremo non vede ragione ovvia di conservare un dolore che ha già fatto il suo lavoro. Chi valorizza l'identità narrativa vede la cancellazione delle lezioni come l'eliminazione di un sé silenzioso — anche se il residuo è più felice, è meno tuo.",
      whatYourAnswerMaySuggest: {
        a: "Potresti trattare la sofferenza come dato che il sistema ha già estratto — una volta estratto, il dolore stesso è una tassa, non una funzione. Decidere di farlo cadere non rende le lezioni meno reali.",
        b: "Potresti trattare il legame fra dolore e crescita come costitutivo, non accidentale. La versione ingenua di te non è uno sconto — è una persona diversa, e non vuoi scambiare chi sei diventato con chi saresti.",
      },
    },
  },

  'steal-medicine': {
    en: {
      body: "This dilemma sits at the intersection of two moral systems with a long history of disagreement. Property rights protect the conditions under which an honest seller operates a business; care duties protect the child whose life can't wait for the system to fix the gap. Neither side denies the other's claim — they disagree about which has priority when both can't be honoured.",
      whyPeopleSplit: "For some, parental duty is non-derivative: when no morally acceptable option exists, the act that saves your child carries the weight, and the moral residue (apology, restitution, prosecution risk) belongs to you. For others, accepting that means anyone with a sufficiently sympathetic story can override rules — and the rule's consistency is what makes it useful in the first place.",
      whatYourAnswerMaySuggest: {
        a: "You may think duties owed to a dying child override the rules that govern routine commerce. The store owner has options; the child doesn't. The act is theft only in a narrow legal sense.",
        b: "You may believe that allowing exceptions to property rules even in extreme cases erodes the rule itself. The right response is to fight harder for the child within legitimate channels — even at the cost of failing.",
      },
    },
    it: {
      body: "Il dilemma si trova all'incrocio di due sistemi morali con una lunga storia di disaccordo. I diritti di proprietà proteggono le condizioni in cui un venditore onesto gestisce un'attività; i doveri di cura proteggono il bambino la cui vita non può aspettare che il sistema colmi il vuoto. Nessuna delle due parti nega la pretesa dell'altra — disaccordano su quale abbia priorità quando entrambe non possono essere rispettate.",
      whyPeopleSplit: "Per alcuni, il dovere genitoriale è non-derivato: quando non esiste un'opzione moralmente accettabile, l'atto che salva tuo figlio porta il peso, e il residuo morale (scuse, restituzione, rischio penale) ti appartiene. Per altri, accettarlo significa che chiunque abbia una storia abbastanza commovente può scavalcare le regole — e la coerenza della regola è ciò che la rende utile in partenza.",
      whatYourAnswerMaySuggest: {
        a: "Potresti pensare che i doveri verso un bambino in pericolo prevalgano sulle regole che governano il commercio ordinario. Il negoziante ha opzioni; il bambino no. L'atto è furto solo in senso giuridico stretto.",
        b: "Potresti credere che ammettere eccezioni alle regole di proprietà, anche in casi estremi, eroda la regola stessa. La risposta giusta è lottare di più per il bambino nei canali legittimi — anche al costo di fallire.",
      },
    },
  },

  'organ-harvest': {
    en: {
      body: "This is the trolley problem with one structural difference: the one person killed isn't on the alternate track — they're an unwilling participant the actor has used as a means to save others. Most ethical frameworks find this difference morally decisive even when the math is identical.",
      whyPeopleSplit: "Five-greater-than-one consequentialism gives a clean A answer; almost no one defends it cleanly because almost everyone has the intuition that doctors shouldn't kill patients for their organs, even quietly, even with no one knowing. The intuition tracks a distinction between killing to use someone's body and letting someone die from natural causes.",
      whatYourAnswerMaySuggest: {
        a: "You may genuinely believe the count is what matters and the use-as-means distinction is a moral fiction we built to avoid hard math. Five families are spared grief; one family receives the grief the math demands.",
        b: "You may treat the moral wall between using a person and saving a person as load-bearing. Once a doctor's role is 'produce the most good', the patient on the table is no longer a person — they're inventory. That shift is what you refuse.",
      },
    },
    it: {
      body: "È il dilemma del carrello con una differenza strutturale: l'unico ucciso non è sull'altro binario — è un partecipante non consenziente che l'agente ha usato come mezzo per salvarne altri. Quasi tutte le cornici etiche trovano questa differenza decisiva anche quando i conti sono identici.",
      whyPeopleSplit: "Il consequenzialismo cinque-maggiore-di-uno dà una risposta A pulita; quasi nessuno la difende pulita perché quasi tutti hanno l'intuizione che un medico non debba uccidere un paziente per i suoi organi, neanche in silenzio, neanche senza testimoni. L'intuizione traccia una distinzione fra uccidere per usare un corpo e lasciare morire per cause naturali.",
      whatYourAnswerMaySuggest: {
        a: "Potresti credere sinceramente che il conteggio sia ciò che conta e che la distinzione uso-come-mezzo sia una finzione morale costruita per evitare conti difficili. Cinque famiglie sono risparmiate al lutto; una famiglia riceve il lutto che la matematica richiede.",
        b: "Potresti vedere il muro morale fra usare una persona e salvarne una come portante. Una volta che il ruolo del medico è 'produrre il maggior bene', il paziente sul tavolo non è più una persona — è inventario. È quel passaggio che rifiuti.",
      },
    },
  },

  'mercy-kill': {
    en: {
      body: "This is a dilemma about who has the standing to honour someone's autonomous wish when the act required is a killing. The parent has consented; the law has not. Two systems of legitimacy collide — personal authorisation by the person whose life it is, and the categorical prohibition on killing that holds even when consent is freely given.",
      whyPeopleSplit: "One side reads autonomy as the deepest moral fact: if a competent adult, in pain, asks for help ending suffering, denying them is paternalism dressed up as principle. The other side sees the prohibition on killing as structural — it protects everyone, including the dying parent, against a world where children can be asked to end their parents' lives.",
      whatYourAnswerMaySuggest: {
        a: "You may treat autonomous consent as decisive. The wrongness of the act is largely a function of whether the person being killed wanted it — and here, they did, repeatedly, with capacity.",
        b: "You may treat the act of killing as carrying weight independent of who consents. The role of 'person who kills their parent' is one you don't want any child placed in, even when the parent asks — partly to protect the child, partly to protect the rule.",
      },
    },
    it: {
      body: "È un dilemma su chi abbia la legittimazione a onorare il desiderio autonomo di qualcuno quando l'atto richiesto è un'uccisione. Il genitore ha dato il consenso; la legge no. Due sistemi di legittimità si scontrano — l'autorizzazione personale di chi vive quella vita, e il divieto categorico di uccidere che vale anche quando il consenso è libero.",
      whyPeopleSplit: "Una parte legge l'autonomia come il fatto morale più profondo: se un adulto capace, in dolore, chiede aiuto per porre fine alla sofferenza, negarlo è paternalismo travestito da principio. L'altra vede il divieto di uccidere come strutturale — protegge tutti, anche il genitore morente, da un mondo in cui ai figli può essere chiesto di uccidere i propri genitori.",
      whatYourAnswerMaySuggest: {
        a: "Potresti trattare il consenso autonomo come decisivo. L'errore dell'atto è in gran parte funzione di se la persona uccisa lo voleva — e qui sì, ripetutamente, con capacità.",
        b: "Potresti trattare l'atto di uccidere come dotato di un peso indipendente da chi acconsente. Il ruolo di 'figlio che uccide il proprio genitore' non lo vuoi assegnato a nessuno, neanche quando il genitore lo chiede — in parte per proteggere il figlio, in parte per proteggere la regola.",
      },
    },
  },

  'whistleblower': {
    en: {
      body: "This isn't a vote about whether polluting a river is wrong — both sides agree it is. It's a vote about who carries the cost of fixing the wrong: a third party (the workers and their families) or the wrong itself going unfixed. The plant becomes a load-bearing piece of a community, and removing it doesn't only remove the pollution.",
      whyPeopleSplit: "One side treats the legal/environmental violation as primary and the community impact as a consequence the legal system must handle separately (compensation, retraining, transition support). The other treats the community impact as ethically prior — because the legal system rarely follows through, 'reporting' in practice means triggering harms the report won't address.",
      whatYourAnswerMaySuggest: {
        a: "You may think the duty to report serious legal and environmental harm exists regardless of downstream cost. Letting the violation continue makes the community a hostage; the answer is to report and demand that mitigation be done properly.",
        b: "You may think reporting in isolation isn't actually reporting — it's transferring the harm from a slow ecological one to a fast economic one, with no plan for the people displaced. Until that plan exists, silence is the lesser of two bad options.",
      },
    },
    it: {
      body: "Non è un voto su se inquinare un fiume sia sbagliato — entrambe le parti concordano che lo è. È un voto su chi porta il costo del rimedio: una terza parte (gli operai e le loro famiglie) o il torto stesso che resta tale. L'impianto diventa un pezzo portante di una comunità, e rimuoverlo non rimuove solo l'inquinamento.",
      whyPeopleSplit: "Una parte tratta la violazione legale e ambientale come primaria e l'impatto sulla comunità come una conseguenza che il sistema legale dovrà gestire separatamente (indennizzi, riqualificazione, supporto alla transizione). L'altra tratta l'impatto sulla comunità come eticamente prioritario — perché il sistema legale raramente porta a termine il seguito, 'denunciare' in pratica significa innescare danni che la denuncia stessa non affronta.",
      whatYourAnswerMaySuggest: {
        a: "Potresti pensare che il dovere di segnalare gravi violazioni ambientali e legali esista indipendentemente dai costi a valle. Lasciare che la violazione continui rende la comunità un ostaggio; la risposta è segnalare e pretendere che il rimedio venga gestito come si deve.",
        b: "Potresti pensare che segnalare in isolamento non sia davvero segnalare — è trasferire il danno da uno lento ed ecologico a uno rapido ed economico, senza piano per le persone spostate. Finché quel piano non esiste, il silenzio è il meno peggio.",
      },
    },
  },

  'confess-crime': {
    en: {
      body: "This is a dilemma about whether moral debts have an expiry date when no one is owed payment. The crime caused no harm; no victim is waiting for justice; the only reason to confess is the actor's relationship to their own past. Two views of moral integrity collide: integrity as alignment between act and known consequence, and integrity as a continuous accountability to the person you used to be.",
      whyPeopleSplit: "One side sees confessing as performance — punishing the present version of someone for something that left no trace. The other sees the absence of harm as irrelevant to whether the act was wrong; integrity isn't about whether you got away with it, it's about whether you'll name the act when the only one left who could is you.",
      whatYourAnswerMaySuggest: {
        a: "You may treat your relationship with your own past as part of integrity. Holding a wrong unspoken, even one that produced no visible damage, leaves a structural lie inside the life you're now living.",
        b: "You may think a confession with no recipient — no victim, no investigation, no consequence — is mostly self-cost: it punishes the people now built around you for an act that no longer exists in any operational sense.",
      },
    },
    it: {
      body: "È un dilemma su se i debiti morali abbiano una data di scadenza quando nessuno è dovuto pagamento. Il reato non ha causato danno; nessuna vittima aspetta giustizia; l'unica ragione per confessare è il rapporto dell'agente con il proprio passato. Si scontrano due visioni dell'integrità: integrità come allineamento fra atto e conseguenza nota, e integrità come responsabilità continua verso la persona che eri.",
      whyPeopleSplit: "Una parte vede la confessione come performance — punire la versione presente di qualcuno per qualcosa che non ha lasciato traccia. L'altra vede l'assenza di danno come irrilevante rispetto al fatto che l'atto fosse sbagliato; l'integrità non riguarda se l'hai fatta franca, riguarda se nominerai l'atto quando l'unico che può farlo sei rimasto tu.",
      whatYourAnswerMaySuggest: {
        a: "Potresti trattare il rapporto con il tuo passato come parte dell'integrità. Tenere taciuto un torto, anche uno che non ha prodotto danni visibili, lascia una menzogna strutturale dentro la vita che vivi adesso.",
        b: "Potresti pensare che una confessione senza destinatario — nessuna vittima, nessuna indagine, nessuna conseguenza — sia soprattutto un costo per sé: punisce le persone ora costruite intorno a te per un atto che non esiste più in alcun senso operativo.",
      },
    },
  },

  // ── SURVIVAL (5 ids) ─────────────────────────────────────────
  'lifeboat': {
    en: {
      body: "This is the classic 'trade-off in extremis' — the math (8 vs 9 dead) seems clear, but the choice asks who picks. Every selection criterion is its own moral position. Pushing someone off requires acting; refusing leads to all dying. One view treats the larger number saved as the goal; the other refuses to act as the executioner of any specific person.",
      whyPeopleSplit: "People split on whether action carries moral weight beyond outcomes. Voting to push someone off makes you the agent of their death even if the rationale is good; refusing leaves the deaths as a shared fate no one chose. Both routes have moral residue — the disagreement is about which residue you accept.",
      whatYourAnswerMaySuggest: {
        a: "You may treat the count as decisive: 8 lives saved is better than 9 lost. Refusing to choose just transfers the choice to whoever drowns last, and that's not actually a more ethical stance.",
        b: "You may refuse to be the chooser. The act of selecting a specific person to die changes what kind of death it is — and you'd rather share the fate than initiate the killing.",
      },
    },
    it: {
      body: "È il classico 'trade-off estremo' — la matematica (8 contro 9 morti) sembra chiara, ma la scelta è chi sceglie. Ogni criterio di selezione è già una posizione morale. Buttare qualcuno fuori richiede agire; rifiutarsi porta tutti a morire. Una visione tratta il numero più alto di salvati come obiettivo; l'altra rifiuta di agire come esecutore di una persona specifica.",
      whyPeopleSplit: "Le persone si dividono se l'azione porti un peso morale oltre agli esiti. Votare per buttare qualcuno fuori ti rende agente della sua morte anche se la motivazione è buona; rifiutarsi lascia le morti come destino condiviso che nessuno ha scelto. Entrambe le strade hanno residuo morale — il disaccordo è su quale residuo accetti.",
      whatYourAnswerMaySuggest: {
        a: "Potresti trattare il conteggio come decisivo: 8 vite salvate è meglio di 9 perse. Rifiutarsi di scegliere trasferisce solo la scelta a chi annega per ultimo, e non è davvero una posizione più etica.",
        b: "Potresti rifiutarti di essere chi sceglie. L'atto di selezionare una persona specifica per morire cambia che tipo di morte sia — e preferisci condividere il destino piuttosto che iniziare l'uccisione.",
      },
    },
  },

  'time-machine': {
    en: {
      body: "This is the trolley problem extended to a person who has not yet done anything. The baby is innocent in any operational sense — they will become someone who isn't, but you can't have their consent and you can't separate killing-them-now from punishing-the-future-them for an act they haven't committed. The expected-good math is enormous; the categorical wrongness of killing an innocent infant is also enormous.",
      whyPeopleSplit: "People split on whether innocence is a function of what someone has done or of what they are. If innocence is about acts, the baby is innocent now but the future adult won't be — and killing the precursor prevents that wrongdoing. If innocence is about the person, killing an infant is killing an infant, regardless of who they would have grown into.",
      whatYourAnswerMaySuggest: {
        a: "You may run the expected-value math: a 100% certain killing of one infant prevents a 100% certain genocide. Refusing the math lets 10 million die so you can preserve a clean conscience about a single act.",
        b: "You may refuse to treat a person as a placeholder for their future self. The baby hasn't done anything; punishing them for what they would have done collapses the distinction between act and identity that most moral systems require.",
      },
    },
    it: {
      body: "È il dilemma del carrello esteso a una persona che non ha ancora fatto nulla. Il neonato è innocente in qualsiasi senso operativo — diventerà qualcuno che non lo è, ma non puoi avere il suo consenso e non puoi separare ucciderlo-ora dal punire-il-futuro-lui per un atto che non ha commesso. La matematica del bene atteso è enorme; anche l'erroneità categorica di uccidere un neonato innocente lo è.",
      whyPeopleSplit: "Le persone si dividono se l'innocenza sia funzione di ciò che si è fatto o di ciò che si è. Se l'innocenza riguarda gli atti, il neonato è innocente ora ma l'adulto futuro non lo sarà — e uccidere il precursore previene quell'errore. Se l'innocenza riguarda la persona, uccidere un neonato è uccidere un neonato, indipendentemente da chi sarebbe diventato.",
      whatYourAnswerMaySuggest: {
        a: "Potresti fare i conti del valore atteso: un'uccisione certa al 100% di un neonato previene un genocidio certo al 100%. Rifiutare i conti lascia morire 10 milioni perché tu possa preservare una coscienza pulita su un singolo atto.",
        b: "Potresti rifiutare di trattare una persona come segnaposto del suo futuro. Il neonato non ha fatto nulla; punirlo per ciò che avrebbe fatto cancella la distinzione fra atto e identità che la maggior parte dei sistemi morali richiede.",
      },
    },
  },

  'plane-parachute': {
    en: {
      body: "Both options are defensible and both leave moral residue. The 4 parachutes vs 6 survivors creates a triage scenario where the system doesn't choose; the person holding the parachute does. Keeping it isn't selfishness in the simple sense — survival instinct is a baseline, not a vice. Giving it away isn't moral heroism — it's accepting a probability of death you didn't sign up for.",
      whyPeopleSplit: "One side treats survival instinct as a morally neutral feature of being alive — using your parachute isn't taking it from someone else, because no one else had a prior claim. The other treats unequal need as the morally relevant fact — if their life is at the same level of risk and you can defer your own claim, the sharing-by-rotation logic kicks in.",
      whatYourAnswerMaySuggest: {
        a: "You may treat your own life as morally on par with anyone else's — and your parachute as something you have, not something you owe. Surviving isn't an act of theft.",
        b: "You may treat the shared crisis as making everyone's parachute provisional. If you and they are in the same position with respect to risk, your keeping it isn't ownership — it's just being first to grab.",
      },
    },
    it: {
      body: "Entrambe le opzioni sono difendibili e entrambe lasciano residuo morale. I 4 paracadute contro 6 superstiti creano uno scenario di triage in cui non sceglie il sistema; sceglie chi ha il paracadute in mano. Tenerlo non è egoismo nel senso semplice — l'istinto di sopravvivenza è una linea di base, non un vizio. Cederlo non è eroismo morale — è accettare una probabilità di morte che non hai firmato.",
      whyPeopleSplit: "Una parte tratta l'istinto di sopravvivenza come una caratteristica moralmente neutra dell'essere vivi — usare il tuo paracadute non significa toglierlo a qualcun altro, perché nessun altro aveva una pretesa preesistente. L'altra tratta il bisogno disuguale come fatto moralmente rilevante — se la loro vita è allo stesso livello di rischio e tu puoi rinviare la tua pretesa, la logica della rotazione entra in gioco.",
      whatYourAnswerMaySuggest: {
        a: "Potresti trattare la tua vita come moralmente alla pari con quella di chiunque altro — e il tuo paracadute come qualcosa che hai, non qualcosa che devi. Sopravvivere non è un furto.",
        b: "Potresti trattare la crisi condivisa come ciò che rende il paracadute di chiunque provvisorio. Se tu e lui siete nella stessa posizione rispetto al rischio, tenerlo non è proprietà — è solo essere stati i primi ad afferrare.",
      },
    },
  },

  'zombie-apocalypse': {
    en: {
      body: "The shelter holds 10. You're 15. The math is brutal, and there is no procedural fairness available — anyone you let in beyond 10 reduces the survival probability of the original group, including yourself. The decision is whether you treat the group as fixed once it forms, or whether you treat every additional human as worth the marginal risk.",
      whyPeopleSplit: "One view holds that closed-system survival logic kicks in once resources are bounded — keeping the door open guarantees collective death and is the more dangerous form of generosity. The other view holds that anyone willing to enforce a hard limit becomes the kind of person who has chosen which neighbours die — and that's a moral position with its own weight.",
      whatYourAnswerMaySuggest: {
        a: "You may refuse to be the gatekeeper of who dies. The shelter holds 10 by design; whether it can hold 11, 12, 15 is something you discover together, and you'd rather find out than refuse 5 people at the door.",
        b: "You may treat the question as a probability problem with lives as the unit. Letting all 15 in dramatically raises everyone's death risk; letting only 10 in preserves a viable group, including you.",
      },
    },
    it: {
      body: "Il rifugio regge 10. Siete 15. La matematica è brutale, e non c'è equità procedurale disponibile — chiunque tu ammetti oltre 10 riduce la probabilità di sopravvivenza del gruppo originario, compreso te. La decisione è se tratti il gruppo come fissato una volta formato, o se tratti ogni essere umano in più come degno del rischio marginale.",
      whyPeopleSplit: "Una visione sostiene che la logica della sopravvivenza in sistema chiuso scatti una volta che le risorse sono limitate — tenere la porta aperta garantisce la morte collettiva ed è la forma più pericolosa di generosità. L'altra sostiene che chiunque sia disposto a imporre un limite rigido diventa il tipo di persona che ha scelto quali vicini muoiono — e quella è una posizione morale con un proprio peso.",
      whatYourAnswerMaySuggest: {
        a: "Potresti rifiutarti di essere il guardiano di chi muore. Il rifugio regge 10 per progetto; se possa reggere 11, 12, 15 è qualcosa che scoprite insieme, e preferisci scoprirlo che rifiutare 5 persone alla porta.",
        b: "Potresti trattare la domanda come un problema di probabilità con le vite come unità. Ammetterli tutti e 15 aumenta drasticamente il rischio di morte per tutti; ammetterne 10 preserva un gruppo vitale, te compreso.",
      },
    },
  },

  'pandemic-dose': {
    en: {
      body: "The dilemma is sharper than it looks because the doctor handed the dose to you — making you the de facto allocator. The elderly stranger's claim doesn't go away because they aren't holding the vial. Two competing principles of triage are in play: greatest life-years gained (favoring you) and greatest vulnerability now (favoring them).",
      whyPeopleSplit: "One side treats first-possession as enough — if a competent medical decision-maker handed it to you, the allocation has happened; refusing is a separate moral act, not a default. The other treats the dose as still under triage logic until consumed — until you take it, the more vulnerable person has the active claim.",
      whatYourAnswerMaySuggest: {
        a: "You may treat the doctor's handing-it-to-you as a real allocation, not a starting point for negotiation. Survival-instinct isn't selfishness when no one else has been wronged.",
        b: "You may treat the dose as still belonging to the triage logic, not to you. The elderly stranger's risk is greater; once you accept that as the morally relevant fact, the dose's path is already decided.",
      },
    },
    it: {
      body: "Il dilemma è più affilato di quanto sembri perché il medico ha consegnato la dose a te — facendoti l'allocatore di fatto. La pretesa dello sconosciuto anziano non sparisce solo perché non tiene la fiala. Due principi di triage concorrenti sono in gioco: massimo numero di anni di vita guadagnati (favorisce te) e massima vulnerabilità ora (favorisce lui).",
      whyPeopleSplit: "Una parte tratta il primo-possesso come sufficiente — se un decisore medico competente te l'ha consegnata, l'allocazione è avvenuta; rifiutare è un atto morale separato, non un default. L'altra tratta la dose come ancora sotto la logica del triage finché non viene consumata — finché non la prendi, la persona più vulnerabile ha la pretesa attiva.",
      whatYourAnswerMaySuggest: {
        a: "Potresti trattare la consegna del medico come allocazione vera, non come punto di partenza per una negoziazione. L'istinto di sopravvivenza non è egoismo quando nessun altro è stato leso.",
        b: "Potresti trattare la dose come ancora appartenente alla logica del triage, non a te. Il rischio dell'anziano sconosciuto è maggiore; una volta accettato quel fatto come moralmente rilevante, il percorso della dose è già deciso.",
      },
    },
  },

  // ── LOYALTY (4 ids) ──────────────────────────────────────────
  'truth-friend': {
    en: {
      body: "This is a dilemma about whose interest 'loyalty' is supposed to protect. Telling them your honest opinion respects their autonomy to make decisions with complete information; staying silent respects their authority over their own relationship. Both are recognisable forms of caring; they just protect different things.",
      whyPeopleSplit: "People who answer A often assume honesty is a baseline obligation in close friendship — that asking the question is asking for information you actually have. People who answer B often assume friendship sometimes means accepting that your friend has a right to figure things out on their own, including badly.",
      whatYourAnswerMaySuggest: {
        a: "You may treat honesty as the load-bearing element of close friendship. Hiding a serious concern about their partner means letting the relationship operate on a story you've decided not to correct.",
        b: "You may treat your friend's relationship as their domain. Sharing your dislike either changes nothing or makes them defensive; either way, you've moved the relationship from theirs to a triangle that includes you.",
      },
    },
    it: {
      body: "È un dilemma su quale interesse 'lealtà' debba proteggere. Dire la tua opinione onesta rispetta la loro autonomia nel decidere con informazioni complete; restare in silenzio rispetta la loro autorità sulla propria relazione. Entrambe sono forme riconoscibili di cura; proteggono solo cose diverse.",
      whyPeopleSplit: "Chi sceglie A spesso assume che l'onestà sia un obbligo di base nell'amicizia stretta — che fare la domanda significhi chiedere informazioni che effettivamente hai. Chi sceglie B spesso assume che l'amicizia talvolta significhi accettare che il tuo amico abbia il diritto di capire le cose da solo, anche sbagliando.",
      whatYourAnswerMaySuggest: {
        a: "Potresti trattare l'onestà come elemento portante dell'amicizia stretta. Nascondere una preoccupazione seria sul partner significa lasciare che la relazione operi su una storia che hai deciso di non correggere.",
        b: "Potresti trattare la relazione del tuo amico come dominio suo. Condividere il tuo giudizio non cambia niente o lo mette sulla difensiva; in ogni caso, hai spostato la relazione dalla sua a un triangolo che ti include.",
      },
    },
  },

  'report-friend': {
    en: {
      body: "This dilemma asks whether close personal relationships can override duties to the broader system — and specifically to people the friend has actively harmed. The crime is serious (a charity, meaning people who needed the funds), but the friend is closest. Two genuine commitments to honesty collide: honesty toward your friend (via direct confrontation) and honesty toward the system (via formal report).",
      whyPeopleSplit: "One side sees private confrontation as a way to corrupt accountability — once everyone gets to choose whether to report their friends, the rules apply only to strangers. The other sees the formal route as a betrayal of a relationship that operated on trust, where the appropriate response is forcing the friend to handle it themselves.",
      whatYourAnswerMaySuggest: {
        a: "You may treat the obligation to victims as overriding personal loyalty. Talking to your friend privately gives them the chance to clean up — but also the chance not to, while the victims keep losing.",
        b: "You may believe friendship has standing to enforce accountability from inside the relationship. Telling them you'll report if they don't is a real threat, not avoidance — and it gives them the dignity of choosing.",
      },
    },
    it: {
      body: "Il dilemma chiede se le relazioni personali strette possano scavalcare i doveri verso il sistema più ampio — e in particolare verso le persone che l'amico ha attivamente danneggiato. Il reato è grave (un ente di beneficenza, cioè persone che avevano bisogno dei fondi), ma l'amico è il più vicino. Due impegni autentici verso l'onestà si scontrano: onestà verso l'amico (via confronto diretto) e onestà verso il sistema (via denuncia formale).",
      whyPeopleSplit: "Una parte vede il confronto privato come un modo per corrompere la responsabilità — una volta che tutti possono scegliere se denunciare i propri amici, le regole valgono solo per gli sconosciuti. L'altra vede la via formale come tradimento di una relazione che operava su fiducia, dove la risposta appropriata è costringere l'amico a gestirla in proprio.",
      whatYourAnswerMaySuggest: {
        a: "Potresti trattare l'obbligo verso le vittime come prevalente sulla lealtà personale. Parlare con l'amico in privato gli dà la possibilità di rimediare — ma anche di non farlo, mentre le vittime continuano a perdere.",
        b: "Potresti credere che l'amicizia abbia la legittimità di imporre responsabilità dall'interno della relazione. Dirgli che lo denuncerai se non lo fa lui è una minaccia vera, non evitamento — e gli dà la dignità di scegliere.",
      },
    },
  },

  'cover-accident': {
    en: {
      body: "This dilemma asks whether a partner's panicked request can override duties to a stranger who is already dead. There is no version of this with a happy ending — the pedestrian's family won't recover them, and accountability for what happened changes only who the legal system goes after. The question is whether shielding your partner from prosecution is something love is allowed to do.",
      whyPeopleSplit: "One side sees driving away as turning the partner into a fugitive, with a permanent moral residue between you. The other sees the choice as already constrained: the pedestrian is dead, the system will produce some outcome, and your job inside the relationship is to absorb damage with the person you love, not to be a second witness against them.",
      whatYourAnswerMaySuggest: {
        a: "You may treat your partner's life and freedom as something you protect by default. Reporting doesn't bring the pedestrian back; it just adds your partner to the list of lives the accident destroyed.",
        b: "You may treat the pedestrian's death as making accountability non-negotiable. Driving away builds the rest of your shared life on a lie you'll have to maintain together — and the victim's family deserves to know what happened.",
      },
    },
    it: {
      body: "Il dilemma chiede se la richiesta in panico di un partner possa scavalcare i doveri verso uno sconosciuto già morto. Non esiste una versione di questa storia con un lieto fine — la famiglia del pedone non lo recupererà, e la responsabilità per quanto accaduto cambia solo chi finisce davanti al sistema legale. La domanda è se proteggere il partner dall'azione penale sia qualcosa che l'amore può fare.",
      whyPeopleSplit: "Una parte vede l'allontanarsi come il trasformare il partner in latitante, con un residuo morale permanente fra voi. L'altra vede la scelta come già vincolata: il pedone è morto, il sistema produrrà comunque qualche esito, e il tuo compito dentro la relazione è assorbire i danni con la persona amata, non essere un secondo testimone contro di lei.",
      whatYourAnswerMaySuggest: {
        a: "Potresti trattare la vita e la libertà del tuo partner come qualcosa che proteggi per default. Denunciare non riporta indietro il pedone; aggiunge solo il tuo partner alla lista delle vite che l'incidente ha distrutto.",
        b: "Potresti trattare la morte del pedone come ciò che rende la responsabilità non negoziabile. Allontanarsi costruisce il resto della vostra vita condivisa su una menzogna che dovrete mantenere insieme — e la famiglia della vittima merita di sapere cosa è successo.",
      },
    },
  },

  'sibling-secret': {
    en: {
      body: "This is a dilemma about whose information you possess. The sibling told you in confidence; the spouse is also a close friend and is the one being deceived. Telling violates one trust; staying silent makes you complicit in the deception of someone you also care about. There is no clean stance here — both choices involve a betrayal of someone you owe something to.",
      whyPeopleSplit: "People who answer A often see the deception itself as the active wrong, and your silence as endorsement once you know. People who answer B often see the cheating as the sibling's act, not yours — your role is to push them toward telling, not to take ownership of a disclosure that isn't yours to make.",
      whatYourAnswerMaySuggest: {
        a: "You may treat the friendship with the spouse as having its own standing, independent of how the information reached you. They're being deceived now; knowing this and saying nothing makes you a silent partner in that deception.",
        b: "You may treat the sibling's confession as information held in trust — yours to push them with, but not yours to spend. Telling the spouse changes the relationship from 'your sibling betrayed them' to 'your sibling and you betrayed them'.",
      },
    },
    it: {
      body: "È un dilemma su di chi sia l'informazione che possiedi. Il fratello te l'ha detto in confidenza; il coniuge è anche un amico stretto ed è chi viene ingannato. Dirlo viola una fiducia; tacere ti rende complice dell'inganno verso qualcuno a cui anche tu tieni. Non c'è una posizione pulita qui — entrambe le scelte comportano un tradimento verso qualcuno a cui devi qualcosa.",
      whyPeopleSplit: "Chi sceglie A spesso vede l'inganno stesso come torto attivo, e il tuo silenzio come avallo una volta che sai. Chi sceglie B spesso vede il tradimento come atto del fratello, non tuo — il tuo ruolo è spingerlo a parlare, non assumere la paternità di una rivelazione che non è tua da fare.",
      whatYourAnswerMaySuggest: {
        a: "Potresti trattare l'amicizia con il coniuge come dotata di una propria legittimità, indipendente da come l'informazione ti è arrivata. Stanno venendo ingannati ora; saperlo e non dire nulla ti rende un complice silenzioso.",
        b: "Potresti trattare la confessione del fratello come informazione tenuta in fiducia — tua per spingerlo, non tua da spendere. Dirlo al coniuge cambia la relazione da 'tuo fratello l'ha tradito' a 'tuo fratello e tu l'avete tradito'.",
      },
    },
  },

  // ── JUSTICE (3 additional ids) ───────────────────────────────
  'innocent-juror': {
    en: {
      body: "This is a clash between two definitions of justice: justice as evidence-following procedure, and justice as the conscience of the individual juror. The jury system is designed precisely because both have to be present — but it's also designed to make evidence the dominant signal. Acting on gut against evidence breaks the system; acting on evidence against gut breaks the conscience.",
      whyPeopleSplit: "People who answer A think the juror's job is to evaluate the evidence presented and trust the system to catch errors elsewhere (appeals, retrials). People who answer B think the unanimous-verdict requirement exists specifically so that one juror's serious doubt can stop a verdict from going forward.",
      whatYourAnswerMaySuggest: {
        a: "You may treat the juror's role as evidentiary, not intuitive. Letting a hunch override the evidence makes the next acquittal a coin flip — and the cost of false negatives gets distributed onto the next victim.",
        b: "You may treat the unanimous-verdict rule as license to refuse. A serious gut sense that the wrong person is being convicted is exactly the kind of thing the rule was designed to give standing to.",
      },
    },
    it: {
      body: "È uno scontro fra due definizioni di giustizia: la giustizia come procedura che segue le prove, e la giustizia come coscienza del singolo giurato. Il sistema della giuria è progettato proprio perché entrambe devono essere presenti — ma è progettato anche per rendere le prove il segnale dominante. Agire sull'istinto contro le prove rompe il sistema; agire sulle prove contro l'istinto rompe la coscienza.",
      whyPeopleSplit: "Chi sceglie A pensa che il compito del giurato sia valutare le prove presentate e fidarsi del sistema per cogliere gli errori altrove (appelli, riprocessi). Chi sceglie B pensa che il requisito dell'unanimità esista proprio perché il dubbio serio di un singolo giurato possa fermare una sentenza.",
      whatYourAnswerMaySuggest: {
        a: "Potresti trattare il ruolo del giurato come probatorio, non intuitivo. Lasciare che un sospetto annulli le prove rende la prossima assoluzione un lancio di moneta — e il costo dei falsi negativi finisce sulla prossima vittima.",
        b: "Potresti trattare la regola dell'unanimità come licenza di rifiutare. Una sensazione seria che si stia condannando la persona sbagliata è esattamente il tipo di cosa cui la regola intendeva dare voce.",
      },
    },
  },

  'death-row-exonerated': {
    en: {
      body: "This isn't a question about whether the murder happened — DNA confirms it did. It's a question about whether punishment that no longer protects anyone or rehabilitates anyone retains its purpose. The killer is 85, frail, and dying; the victim's family has waited 25 years; the system spent 25 years convinced of a different verdict. Justice, mercy, and procedure all point in slightly different directions.",
      whyPeopleSplit: "People who answer A see the act as the morally primary fact: punishment is owed to it, not to the current condition of the perpetrator. People who answer B see punishment as instrumental — it deters, protects, rehabilitates — and when none of those functions apply, the cost of imprisoning a dying person isn't paid by anyone except the prisoner.",
      whatYourAnswerMaySuggest: {
        a: "You may treat the moral debt to the victim's family as not subject to a statute of limitations. Old age doesn't dissolve the act; whoever the killer is now, the crime they committed still requires consequence.",
        b: "You may treat punishment as forward-looking. Locking up an 85-year-old changes nothing — it can't protect the public, can't rehabilitate, and the victim's family won't receive anything they didn't already receive when the truth came out.",
      },
    },
    it: {
      body: "Non è una domanda su se l'omicidio sia avvenuto — il DNA conferma di sì. È una domanda su se una punizione che non protegge più nessuno né riabilita nessuno mantenga il suo scopo. L'assassino ha 85 anni, è fragile e morente; la famiglia della vittima ha aspettato 25 anni; il sistema ha passato 25 anni convinto di un verdetto diverso. Giustizia, misericordia e procedura puntano in direzioni leggermente diverse.",
      whyPeopleSplit: "Chi sceglie A vede l'atto come fatto moralmente primario: la punizione gli è dovuta, non alla condizione attuale del colpevole. Chi sceglie B vede la punizione come strumentale — deterrente, protegge, riabilita — e quando nessuna di queste funzioni si applica, il costo di incarcerare una persona morente non lo paga nessuno tranne lei.",
      whatYourAnswerMaySuggest: {
        a: "Potresti trattare il debito morale verso la famiglia della vittima come non soggetto a prescrizione. L'età avanzata non dissolve l'atto; chiunque sia l'assassino oggi, il crimine commesso richiede ancora conseguenza.",
        b: "Potresti trattare la punizione come rivolta al futuro. Rinchiudere un 85enne non cambia niente — non può proteggere, non può riabilitare, e la famiglia della vittima non riceverà nulla che non abbia già ricevuto quando la verità è emersa.",
      },
    },
  },

  'revenge-vs-forgiveness': {
    en: {
      body: "The premise loads the dilemma deliberately: the person changed, is now useful, and never apologised. Exposing them serves no rehabilitative purpose — they're already different. But the absence of apology means no debt has been settled, just outgrown. Two views of moral repair clash: change as evidence of repair, and acknowledgment as required for repair.",
      whyPeopleSplit: "One side sees personal transformation as the substantive thing — if the person who hurt you no longer exists in the same form, exposing them targets a past that's already gone. The other side sees acknowledgment as the irreducible part of harm-response; the apology isn't optional, and 'people can change' without naming what they changed from doesn't count.",
      whatYourAnswerMaySuggest: {
        a: "You may believe that the absence of apology is itself a continued harm — the silence is the harm extended through time. Exposure isn't revenge; it's putting the missing acknowledgment on the record yourself.",
        b: "You may believe that demonstrated change matters more than verbal repair. The person they were did the harm; the person they are now does the community work. Exposure punishes the version that no longer exists at the cost of the version that's doing good.",
      },
    },
    it: {
      body: "La premessa carica volutamente il dilemma: la persona è cambiata, ora è utile, e non ha mai chiesto scusa. Smascherarla non serve a riabilitare — è già diversa. Ma l'assenza di scuse significa che nessun debito è stato saldato, solo superato. Si scontrano due visioni della riparazione morale: il cambiamento come prova della riparazione, e il riconoscimento come condizione necessaria.",
      whyPeopleSplit: "Una parte vede la trasformazione personale come la cosa sostanziale — se la persona che ti ha fatto del male non esiste più nella stessa forma, smascherarla mira a un passato già finito. L'altra vede il riconoscimento come parte irriducibile della risposta al danno; le scuse non sono opzionali, e 'le persone possono cambiare' senza nominare da cosa sono cambiate non basta.",
      whatYourAnswerMaySuggest: {
        a: "Potresti credere che l'assenza di scuse sia di per sé un danno che continua — il silenzio è il danno esteso nel tempo. Smascherare non è vendetta; è mettere a verbale tu stesso il riconoscimento mancante.",
        b: "Potresti credere che il cambiamento dimostrato conti più della riparazione verbale. La persona che era ha fatto il danno; la persona che è ora fa il lavoro per la comunità. Smascherare punisce la versione che non esiste più al costo della versione che sta facendo del bene.",
      },
    },
  },

  // ── FREEDOM (3 additional ids) ───────────────────────────────
  'privacy-terror': {
    en: {
      body: "This is a maximalist version of the classic safety-vs-liberty trade: the offer is total prevention of one harm at the cost of total elimination of one freedom. Zero privacy doesn't just mean fewer attacks; it means a different relationship between every citizen and the state — one with no zone of unobserved life.",
      whyPeopleSplit: "One side treats safety as the precondition for other freedoms — if you're dead, your privacy is irrelevant. The other treats privacy as constitutive of personhood — life under permanent surveillance isn't the same kind of life, even if it's longer and safer.",
      whatYourAnswerMaySuggest: {
        a: "You may treat death from terrorism as a harm so severe that some privacy-cost is worth the prevention. The cost falls on everyone evenly; the deaths fall on specific people who didn't deserve them.",
        b: "You may treat a zone of private life as something a free society can't trade away regardless of how much safety is offered. Once the state has the lever, the lever stays — and what it gets used for next isn't always terrorism.",
      },
    },
    it: {
      body: "È una versione massimalista del classico scambio sicurezza-libertà: l'offerta è la prevenzione totale di un danno al costo dell'eliminazione totale di una libertà. Zero privacy non significa solo meno attacchi; significa una relazione diversa fra ogni cittadino e lo Stato — senza alcuna zona di vita non osservata.",
      whyPeopleSplit: "Una parte tratta la sicurezza come condizione preliminare per altre libertà — se sei morto, la tua privacy è irrilevante. L'altra tratta la privacy come costitutiva della persona — una vita sotto sorveglianza permanente non è lo stesso tipo di vita, anche se più lunga e più sicura.",
      whatYourAnswerMaySuggest: {
        a: "Potresti trattare la morte per terrorismo come un danno così grave che un costo in termini di privacy valga la prevenzione. Il costo cade su tutti uniformemente; le morti cadono su persone specifiche che non se le erano meritate.",
        b: "Potresti trattare una zona di vita privata come qualcosa che una società libera non può cedere indipendentemente da quanta sicurezza venga offerta. Una volta che lo Stato ha la leva, la leva resta — e per cosa verrà usata dopo non sarà sempre terrorismo.",
      },
    },
  },

  'mandatory-vaccine': {
    en: {
      body: "This is a clash between collective public health and individual bodily autonomy at the regulatory boundary. Vaccines work better at population scale than at individual scale — the case for mandatory coverage rests on protecting the people who can't be vaccinated. Religious objections push back not on the science but on the principle that the state can require what enters your body.",
      whyPeopleSplit: "One side treats the right to schooling as bundled with the duties that come with sharing a school — and accepts that those duties can include medical ones. The other treats bodily autonomy as a deeper protection than any one institution's access can override, even when the public-health math is clear.",
      whatYourAnswerMaySuggest: {
        a: "You may treat the school as a shared environment where one person's exemption increases everyone's risk. Religious objection is real, but its costs fall on others, not just the objector — and the state has a role when externalities are this concrete.",
        b: "You may treat the 'your body, your choice' principle as load-bearing even when the medical reasoning is sound. Mandating medication for access to a public institution sets a precedent the state will use again, in less clear cases.",
      },
    },
    it: {
      body: "È uno scontro fra salute pubblica collettiva e autonomia corporea individuale al confine regolatorio. I vaccini funzionano meglio su scala di popolazione che su scala individuale — il caso per la copertura obbligatoria si basa sulla protezione di chi non può essere vaccinato. Le obiezioni religiose non contestano la scienza ma il principio che lo Stato possa richiedere ciò che entra nel tuo corpo.",
      whyPeopleSplit: "Una parte tratta il diritto alla scuola come legato ai doveri che vengono dal condividere una scuola — e accetta che quei doveri possano includere quelli medici. L'altra tratta l'autonomia corporea come una protezione più profonda di quanto l'accesso a qualsiasi istituzione possa scavalcare, anche quando la matematica della salute pubblica è chiara.",
      whatYourAnswerMaySuggest: {
        a: "Potresti trattare la scuola come ambiente condiviso dove l'esenzione di una persona aumenta il rischio per tutti. L'obiezione religiosa è reale, ma i suoi costi ricadono su altri, non solo su chi obietta — e lo Stato ha un ruolo quando le esternalità sono così concrete.",
        b: "Potresti trattare il principio 'il tuo corpo, la tua scelta' come portante anche quando il ragionamento medico è solido. Imporre una terapia per accedere a un'istituzione pubblica fissa un precedente che lo Stato userà di nuovo, in casi meno chiari.",
      },
    },
  },

  'surveillance-city': {
    en: {
      body: "This pairs a maximum-strength benefit (total elimination of violent crime) with a maximum-strength cost (constant AI surveillance of all public space). The harms of violent crime are concentrated on a minority; the costs of surveillance fall evenly on everyone. The question is whether the trade is acceptable when the math seems to favor surveillance but the principle seems to favor refusal.",
      whyPeopleSplit: "One side treats the elimination of violent crime as so dramatic a benefit that any privacy cost it requires has to be reconsidered from scratch. The other treats the precedent of full public-space surveillance as locking in a relationship between citizen and state that's irreversible — the data will be used for things that aren't violent crime, eventually.",
      whatYourAnswerMaySuggest: {
        a: "You may treat the trade as honest accounting. Violent crime kills, traumatises, and is unevenly distributed; if cameras genuinely prevent it, the price has to be weighed against the lives the prevention saves.",
        b: "You may refuse to accept that the precedent and the immediate benefit can be discussed separately. Once cameras exist, the institutional appetite to use the footage for non-crime purposes is essentially infinite. Refusing the trade means refusing what comes after, not just the proposal.",
      },
    },
    it: {
      body: "Si abbinano un beneficio di forza massima (eliminazione totale del crimine violento) e un costo di forza massima (sorveglianza AI costante di ogni spazio pubblico). I danni del crimine violento si concentrano su una minoranza; i costi della sorveglianza cadono uniformemente su tutti. La domanda è se lo scambio sia accettabile quando la matematica sembra favorire la sorveglianza ma il principio sembra favorire il rifiuto.",
      whyPeopleSplit: "Una parte tratta l'eliminazione del crimine violento come un beneficio così drammatico che qualsiasi costo in termini di privacy va riconsiderato da zero. L'altra tratta il precedente di sorveglianza totale dello spazio pubblico come un blocco di relazione cittadino-Stato irreversibile — i dati verranno usati per cose che non sono crimini violenti, prima o poi.",
      whatYourAnswerMaySuggest: {
        a: "Potresti trattare lo scambio come contabilità onesta. Il crimine violento uccide, traumatizza ed è distribuito in modo iniquo; se le telecamere davvero lo prevengono, il prezzo va pesato contro le vite che la prevenzione salva.",
        b: "Potresti rifiutare di accettare che il precedente e il beneficio immediato possano essere discussi separatamente. Una volta esistenti, l'appetito istituzionale di usare i filmati per scopi non legati al crimine è essenzialmente infinito. Rifiutare lo scambio significa rifiutare ciò che viene dopo, non solo la proposta.",
      },
    },
  },

  // ── TECHNOLOGY (5 additional ids) ────────────────────────────
  'ai-art-copyright': {
    en: {
      body: "This is a question about what copyright is for. The traditional answer — protecting the creator's incentive to invest creative labor — has no obvious application here because no human supplied the creative labor. Two replacement frameworks compete: assigning to the company that built the tools (because it captures investment incentive) and assigning to no one (because the work has no creative author).",
      whyPeopleSplit: "One side prefers a clean assignment to a corporate owner because the alternative is contested and slow; the other sees public domain as the honest answer when the law's underlying justification (rewarding creators) doesn't apply.",
      whatYourAnswerMaySuggest: {
        a: "You may see the AI's creator as the closest analog to an author — they made the system that made the work, and assigning the rights to them preserves the incentive structure copyright was designed for.",
        b: "You may see ownership-by-default as the wrong framework here. If no person wrote the painting, no person owns it; expanding copyright to capture machine output rewrites the law's purpose to fit a new economic actor.",
      },
    },
    it: {
      body: "È una domanda su a cosa serva il copyright. La risposta tradizionale — proteggere l'incentivo del creatore a investire lavoro creativo — non ha un'applicazione ovvia qui perché nessun umano ha fornito il lavoro creativo. Due cornici sostitutive competono: l'assegnazione all'azienda che ha costruito gli strumenti (perché cattura l'incentivo all'investimento) e l'assegnazione a nessuno (perché l'opera non ha un autore creativo).",
      whyPeopleSplit: "Una parte preferisce un'assegnazione netta a un proprietario aziendale perché l'alternativa è contestata e lenta; l'altra vede il pubblico dominio come la risposta onesta quando la giustificazione di fondo della legge (premiare i creatori) non si applica.",
      whatYourAnswerMaySuggest: {
        a: "Potresti vedere il creatore dell'IA come l'analogo più vicino a un autore — ha fatto il sistema che ha fatto l'opera, e assegnargli i diritti preserva la struttura di incentivi per cui il copyright è stato pensato.",
        b: "Potresti vedere la proprietà per default come la cornice sbagliata qui. Se nessuna persona ha dipinto, nessuna persona possiede; estendere il copyright per catturare output meccanico riscrive lo scopo della legge per adattarlo a un nuovo attore economico.",
      },
    },
  },

  'self-driving-crash': {
    en: {
      body: "This is the trolley problem at production scale, and the production-scale framing matters. Programming the car commits the manufacturer to one universal answer rather than a case-by-case choice. The passenger consented to being inside the car; the pedestrian didn't consent to anything (and jaywalked). Both options break a different principle: protect-the-paying-customer or distribute-the-cost-of-mistakes-by-vulnerability.",
      whyPeopleSplit: "One side treats the pedestrian's vulnerability as the relevant fact — the person outside the car carries less responsibility for being there. The other treats the passenger's contract with the manufacturer as the relevant fact — the car was sold on the promise of protection.",
      whatYourAnswerMaySuggest: {
        a: "You may treat the asymmetry of physical vulnerability as decisive. The pedestrian has nothing between them and the car; the passenger has the car itself. The system's design priority should mirror that asymmetry.",
        b: "You may treat the passenger as the party with whom the manufacturer has a relationship. Selling a car that will kill its driver to save jaywalkers changes what 'buying a car' means — and the next case may be a child in the car, not an adult.",
      },
    },
    it: {
      body: "È il dilemma del carrello su scala industriale, e la scala industriale conta. Programmare l'auto vincola il costruttore a un'unica risposta universale invece che a una scelta caso per caso. Il passeggero ha acconsentito a salire; il pedone non ha acconsentito a nulla (e ha attraversato fuori dalle strisce). Entrambe le opzioni rompono un principio diverso: proteggere-il-cliente-pagante o distribuire-il-costo-degli-errori-per-vulnerabilità.",
      whyPeopleSplit: "Una parte tratta la vulnerabilità del pedone come fatto rilevante — chi è fuori dall'auto porta meno responsabilità per il proprio trovarsi lì. L'altra tratta il contratto fra passeggero e costruttore come fatto rilevante — l'auto è stata venduta con la promessa della protezione.",
      whatYourAnswerMaySuggest: {
        a: "Potresti trattare l'asimmetria di vulnerabilità fisica come decisiva. Il pedone non ha niente fra sé e l'auto; il passeggero ha l'auto stessa. La priorità di progettazione del sistema dovrebbe rispecchiare quell'asimmetria.",
        b: "Potresti trattare il passeggero come la parte con cui il costruttore ha una relazione. Vendere un'auto che ucciderà il guidatore per salvare chi attraversa fuori dalle strisce cambia cosa vuol dire 'comprare un'auto' — e il prossimo caso potrebbe essere un bambino nell'auto, non un adulto.",
      },
    },
  },

  'brain-upload': {
    en: {
      body: "This isn't quite a question about technology; it's a question about identity. If the digital version remembers everything, behaves identically, and acts on the same values, what's missing? Different philosophical traditions give different answers. The continuity view says nothing essential is missing. The bodily-continuity view says everything that mattered about you was the embodied thread; what's left is a high-fidelity replica.",
      whyPeopleSplit: "One side treats personal identity as patternistic: if the pattern survives, the person survives. The other treats personal identity as biological: the digital version is a very good imitation of you that begins to exist at the same moment the actual you ends.",
      whatYourAnswerMaySuggest: {
        a: "You may treat the continuity of memory, values, and behavior as constitutive of personhood. If the digital version remembers your wedding the way you remember it, mourns who you mourn, and chooses what you'd choose, it's not an impersonation — it's you.",
        b: "You may treat the irreplaceable thread of embodied experience as the thing identity is built from. The digital version doesn't carry your body's continuity; it begins at upload, which is the same moment you end. Calling the result 'you' is mostly word choice.",
      },
    },
    it: {
      body: "Non è una domanda sulla tecnologia; è una domanda sull'identità. Se la versione digitale ricorda tutto, si comporta in modo identico e agisce sugli stessi valori, cosa manca? Tradizioni filosofiche diverse danno risposte diverse. La visione della continuità dice che nulla di essenziale manca. La visione della continuità corporea dice che ciò che contava di te era il filo incarnato; quel che resta è una replica ad alta fedeltà.",
      whyPeopleSplit: "Una parte tratta l'identità personale come schematica: se lo schema sopravvive, la persona sopravvive. L'altra tratta l'identità personale come biologica: la versione digitale è un'imitazione molto buona di te che inizia a esistere nello stesso momento in cui te finisci.",
      whatYourAnswerMaySuggest: {
        a: "Potresti trattare la continuità di memoria, valori e comportamento come costitutiva della persona. Se la versione digitale ricorda il tuo matrimonio come lo ricordi tu, piange chi piangi tu e sceglie quello che sceglieresti tu, non è un'imitazione — è te.",
        b: "Potresti trattare il filo insostituibile dell'esperienza incarnata come la cosa di cui l'identità è fatta. La versione digitale non porta la continuità del tuo corpo; comincia all'upload, lo stesso momento in cui tu finisci. Chiamarla 'te' è soprattutto una scelta di parole.",
      },
    },
  },

  'delete-social-media': {
    en: {
      body: "Both sides accept the premise (mental health improves by 40%) — they disagree about the cost. Deleting social media doesn't just remove an addiction; it removes a communication infrastructure that activists, isolated communities, and small businesses rely on. The trade isn't between 'wellbeing' and 'fun' — it's between mental health gains across a large population and the loss of a connection layer that has both healthy and unhealthy uses.",
      whyPeopleSplit: "One side treats the mental health gain as so large that the cost has to be paid even if it's high. The other treats the deletion as too blunt an instrument — the same infrastructure carries activism, family connection, and small-business reach, and removing it removes those too.",
      whatYourAnswerMaySuggest: {
        a: "You may treat a 40% mental-health improvement as a benefit no equivalent intervention has ever delivered. The harms of social media are not minor inconveniences; they're structural, and the case for accepting the costs of removal is strong.",
        b: "You may treat the infrastructure as too tangled with positive use to delete cleanly. People with no other community lose their community; activists lose their reach; families across borders lose their main channel. The fix is to fix, not to delete.",
      },
    },
    it: {
      body: "Entrambe le parti accettano la premessa (la salute mentale migliora del 40%) — disaccordano sul costo. Cancellare i social non rimuove solo una dipendenza; rimuove un'infrastruttura di comunicazione su cui attivisti, comunità isolate e piccole imprese contano. Lo scambio non è fra 'benessere' e 'divertimento' — è fra guadagni di salute mentale su larga scala e la perdita di uno strato di connessione che ha sia usi sani che malsani.",
      whyPeopleSplit: "Una parte tratta il guadagno di salute mentale come così grande da dover pagare il costo anche se è alto. L'altra tratta la cancellazione come uno strumento troppo grezzo — la stessa infrastruttura veicola attivismo, legami familiari e portata delle piccole imprese, e rimuoverla rimuove anche quelli.",
      whatYourAnswerMaySuggest: {
        a: "Potresti trattare un miglioramento del 40% della salute mentale come un beneficio che nessun intervento equivalente ha mai prodotto. I danni dei social non sono fastidi minori; sono strutturali, e la base per accettare i costi della rimozione è solida.",
        b: "Potresti trattare l'infrastruttura come troppo intrecciata con usi positivi per cancellarla in modo netto. Chi non ha altra comunità perde la sua comunità; gli attivisti perdono la loro portata; le famiglie attraverso i confini perdono il loro canale principale. La soluzione è riparare, non cancellare.",
      },
    },
  },

  'ai-replaces-jobs': {
    en: {
      body: "Both options accept the premise (AI eliminates 30% of jobs in 10 years) — they disagree about what governments owe the people who lose their work. Slowing AI down is expensive in aggregate but distributes the cost of the transition; letting AI happen is cheaper in aggregate but concentrates the cost on the people displaced fastest. Retraining is the proposed shock absorber, but its track record is uneven.",
      whyPeopleSplit: "One side treats the speed of the transition as morally relevant — a fast change makes the workers shoulder the displacement, while a slow change spreads the cost. The other treats the slowdown as denial — automation gains compound, and refusing them just gives the gains to the country that doesn't slow down.",
      whatYourAnswerMaySuggest: {
        a: "You may treat the people facing displacement as the morally central group. The aggregate gain from fast automation is real but goes to capital owners and consumers; the loss goes to specific workers whose retraining options are theoretical until they're funded.",
        b: "You may treat the slowdown as a temporary patch that gets paid for permanently. Productivity gains that don't happen here happen elsewhere; the right response is to fund the transition, not to throttle the technology.",
      },
    },
    it: {
      body: "Entrambe le opzioni accettano la premessa (l'IA elimina il 30% dei posti di lavoro in 10 anni) — disaccordano su cosa i governi debbano a chi perde il lavoro. Rallentare l'IA è costoso in aggregato ma distribuisce il costo della transizione; lasciarla accadere è meno caro in aggregato ma concentra il costo sulle persone spiazzate più rapidamente. La riqualificazione è l'ammortizzatore proposto, ma il suo curriculum è disomogeneo.",
      whyPeopleSplit: "Una parte tratta la velocità della transizione come moralmente rilevante — un cambiamento veloce fa pagare lo spiazzamento ai lavoratori, un cambiamento lento spalma il costo. L'altra tratta il rallentamento come negazione — i guadagni di automazione si accumulano, e rifiutarli regala i guadagni al Paese che non rallenta.",
      whatYourAnswerMaySuggest: {
        a: "Potresti trattare le persone in via di spiazzamento come il gruppo moralmente centrale. Il guadagno aggregato dell'automazione veloce è reale ma va ai proprietari del capitale e ai consumatori; la perdita va a lavoratori specifici le cui opzioni di riqualificazione restano teoriche finché non sono finanziate.",
        b: "Potresti trattare il rallentamento come una toppa temporanea che si paga per sempre. I guadagni di produttività che non avvengono qui avvengono altrove; la risposta giusta è finanziare la transizione, non frenare la tecnologia.",
      },
    },
  },

  // ── SOCIETY (4 additional ids) ───────────────────────────────
  'tax-billionaires': {
    en: {
      body: "This is a redistribution dilemma with the math set so the trade-off is unusually clean. A one-time wealth tax doesn't depress incentives the way recurring income taxes might; the affected group stays wealthy; the gain is denominated in human lives. The disagreement is about whether redistributive power, once exercised at this scale, can be limited to this case.",
      whyPeopleSplit: "One side treats global hunger as a harm so severe that any policy that can plausibly end it has to be considered seriously. The other treats one-time wealth tax as one-time only in name — once a precedent for that level of extraction exists, the next 'one-time' comes faster, and the next definition of 'billionaire' gets lower.",
      whatYourAnswerMaySuggest: {
        a: "You may treat the human gain as decisive. Ending hunger for 10 years is a benefit so large it outweighs procedural concerns about the rich-as-a-class.",
        b: "You may treat one-time extraction at this scale as functionally permanent. The precedent doesn't stay one-time; the line moves, and the principle that prevented confiscation in the first place loses any structural protection.",
      },
    },
    it: {
      body: "È un dilemma sulla redistribuzione con la matematica costruita perché lo scambio sia inusualmente pulito. Una tassa una tantum sulla ricchezza non deprime gli incentivi come potrebbe fare un'imposta sul reddito ricorrente; il gruppo colpito resta ricco; il guadagno è denominato in vite umane. Il disaccordo riguarda se il potere redistributivo, una volta esercitato a questa scala, possa restare limitato a questo caso.",
      whyPeopleSplit: "Una parte tratta la fame globale come un danno così grave che ogni politica plausibilmente capace di porvi fine va presa sul serio. L'altra tratta la tassa una tantum come 'una tantum' solo di nome — una volta esistente il precedente per quel livello di prelievo, il prossimo 'una tantum' arriva prima, e la definizione di 'miliardario' si abbassa.",
      whatYourAnswerMaySuggest: {
        a: "Potresti trattare il guadagno umano come decisivo. Porre fine alla fame per 10 anni è un beneficio così grande da superare le preoccupazioni procedurali sui ricchi come classe.",
        b: "Potresti trattare un prelievo una tantum a questa scala come funzionalmente permanente. Il precedente non resta una tantum; la linea si sposta, e il principio che impediva la confisca all'origine perde ogni protezione strutturale.",
      },
    },
  },

  'open-borders': {
    en: {
      body: "This is a dilemma about whether the freedom of individual movement is more fundamental than the institutional cohesion that countries provide. Both options come with predictable second-order effects — open borders dramatically expand the freedom of millions of people, but also stress public-services capacity in destination countries; closed borders preserve those capacities but at the cost of locking many people into circumstances they didn't choose.",
      whyPeopleSplit: "One side treats freedom of movement as a baseline human right that the modern state system happens to deny. The other treats the nation-state as a particular kind of cooperative arrangement that breaks down without membership rules.",
      whatYourAnswerMaySuggest: {
        a: "You may treat the geographic accident of birth as morally arbitrary. If a person could live a better life elsewhere, the only thing stopping them is the state machinery built to refuse them, and that machinery has no moral standing equivalent to a person's life path.",
        b: "You may treat the nation as a unit that does real work — welfare, schools, public goods — only because membership is bounded. Open borders don't just give freedom; they transfer the cost of that freedom onto institutions that weren't designed for it.",
      },
    },
    it: {
      body: "È un dilemma su se la libertà di movimento individuale sia più fondamentale della coesione istituzionale che i Paesi forniscono. Entrambe le opzioni vengono con effetti prevedibili di secondo ordine — i confini aperti espandono drasticamente la libertà di milioni di persone, ma stressano anche la capacità dei servizi pubblici nei Paesi di destinazione; i confini chiusi preservano quelle capacità ma al costo di bloccare molte persone in circostanze che non hanno scelto.",
      whyPeopleSplit: "Una parte tratta la libertà di movimento come un diritto umano di base che il sistema moderno degli Stati semplicemente nega. L'altra tratta lo Stato-nazione come un particolare tipo di accordo cooperativo che si rompe senza regole di appartenenza.",
      whatYourAnswerMaySuggest: {
        a: "Potresti trattare l'incidente geografico della nascita come moralmente arbitrario. Se una persona potesse vivere una vita migliore altrove, l'unica cosa che la ferma è il macchinario statale costruito per rifiutarla, e quel macchinario non ha legittimità morale equivalente al percorso di vita di una persona.",
        b: "Potresti trattare la nazione come un'unità che fa lavoro reale — welfare, scuole, beni pubblici — solo perché l'appartenenza è limitata. I confini aperti non danno solo libertà; trasferiscono il costo di quella libertà su istituzioni non progettate per assorbirlo.",
      },
    },
  },

  'universal-basic-income': {
    en: {
      body: "This pairs an unconditional poverty fix (€1,500/month to every adult) with a financing model that doubles taxes on the top 20%. Both pieces are real — the disagreement isn't about whether either works in isolation, but whether the combination produces a healthier society or a less productive one. Empirical evidence is mixed; both sides have studies they can cite.",
      whyPeopleSplit: "One side treats no-strings income as decoupling survival from labor — the case for is that work is valuable, but having to work to eat distorts every other choice. The other treats unconditional income as removing a behavioral lever — the case against is that work delivers more than money (purpose, structure, contribution).",
      whatYourAnswerMaySuggest: {
        a: "You may treat the elimination of survival-anxiety as the central moral gain. Once people aren't forced to work to eat, the work they do is the work they chose, and the social return on that voluntariness is large.",
        b: "You may treat work as part of how people contribute to their community, not just how they pay rent. Funding survival unconditionally is generous, but it changes the relationship between people and the labor market in ways the experiment hasn't fully tested.",
      },
    },
    it: {
      body: "Si abbina una soluzione incondizionata alla povertà (€1.500/mese a ogni adulto) con un modello di finanziamento che raddoppia le tasse sul 20% più ricco. Entrambi i pezzi sono reali — il disaccordo non riguarda se ciascuno funzioni in isolamento, ma se la combinazione produca una società più sana o meno produttiva. L'evidenza empirica è mista; entrambe le parti hanno studi da citare.",
      whyPeopleSplit: "Una parte tratta il reddito senza condizioni come il disaccoppiare la sopravvivenza dal lavoro — il caso pro è che il lavoro è prezioso, ma dover lavorare per mangiare distorce ogni altra scelta. L'altra tratta il reddito incondizionato come la rimozione di una leva comportamentale — il caso contro è che il lavoro consegna più del denaro (scopo, struttura, contributo).",
      whatYourAnswerMaySuggest: {
        a: "Potresti trattare l'eliminazione dell'ansia da sopravvivenza come il guadagno morale centrale. Una volta che le persone non sono costrette a lavorare per mangiare, il lavoro che fanno è quello che hanno scelto, e il ritorno sociale di quella volontarietà è grande.",
        b: "Potresti trattare il lavoro come parte di come le persone contribuiscono alla loro comunità, non solo di come pagano l'affitto. Finanziare la sopravvivenza in modo incondizionato è generoso, ma cambia la relazione fra persone e mercato del lavoro in modi che l'esperimento non ha ancora pienamente testato.",
      },
    },
  },

  'drug-legalization': {
    en: {
      body: "This is a regulatory dilemma where both sides agree that the current black market is failing. The disagreement is whether legalization is a harm-reduction policy or a moral signal. Portugal's data (50% crime drop) is a real input, but it doesn't settle the moral question of whether the state should ever provide a regulated channel for substances it considers dangerous.",
      whyPeopleSplit: "One side treats prohibition as the cause of most drug-related harm — overdoses from unknown purity, violence from territorial control, criminalization of the people most harmed. The other treats some substances as carrying a categorical risk the state shouldn't normalise even at the cost of black-market harms.",
      whatYourAnswerMaySuggest: {
        a: "You may treat the empirical harm-reduction evidence as decisive. Crime drops, deaths drop, public health improves; the only question is whether you can accept the trade-off of more legal use.",
        b: "You may treat legalization as the state endorsing substances it shouldn't. The black-market harms are real, but the alternative is a state that has signed off on the use of substances it knows damage people, and that signal carries weight beyond what the data captures.",
      },
    },
    it: {
      body: "È un dilemma regolatorio dove entrambe le parti concordano che l'attuale mercato nero stia fallendo. Il disaccordo è se la legalizzazione sia una politica di riduzione del danno o un segnale morale. I dati del Portogallo (-50% di crimini) sono un input reale, ma non risolvono la questione morale di se lo Stato debba mai fornire un canale regolamentato per sostanze che considera pericolose.",
      whyPeopleSplit: "Una parte tratta il proibizionismo come causa della maggior parte dei danni legati alle droghe — overdose da purezza ignota, violenza da controllo territoriale, criminalizzazione delle persone più colpite. L'altra tratta alcune sostanze come portatrici di un rischio categorico che lo Stato non dovrebbe normalizzare, neanche al costo dei danni del mercato nero.",
      whatYourAnswerMaySuggest: {
        a: "Potresti trattare l'evidenza empirica della riduzione del danno come decisiva. I crimini scendono, le morti scendono, la salute pubblica migliora; l'unica domanda è se puoi accettare lo scambio con un maggior uso legale.",
        b: "Potresti trattare la legalizzazione come lo Stato che avalla sostanze che non dovrebbe. I danni del mercato nero sono reali, ma l'alternativa è uno Stato che ha firmato sull'uso di sostanze che sa danneggiare le persone, e quel segnale pesa oltre quanto i dati colgano.",
      },
    },
  },

  // ── RELATIONSHIPS (4 ids) ────────────────────────────────────
  'love-or-career': {
    en: {
      body: "This isn't really about love vs. career as abstract values — both are central. It's about which person bears the cost of the asymmetry. The partner refused to relocate; taking the job means accepting that the relationship ends or strains across a continent. Refusing it means accepting that your career is shaped by someone else's geography.",
      whyPeopleSplit: "One side treats career as the trajectory that holds your future — the kind of decision that, once refused, can rarely be reopened. The other treats love as the relationship that defines whose company you've chosen for the long term — a partner unwilling to move is also a relationship reaching a limit.",
      whatYourAnswerMaySuggest: {
        a: "You may treat the job as the kind of opportunity that doesn't repeat. Relationships can outlast geography; careers usually can't pause and resume on the same trajectory.",
        b: "You may treat 5 years together as having earned a different kind of weight. The job will be replaced by another job; the person may not be replaced by another person you trust the same way.",
      },
    },
    it: {
      body: "Non è davvero amore contro carriera come valori astratti — entrambi sono centrali. È su quale persona porta il costo dell'asimmetria. Il partner rifiuta di trasferirsi; prendere il lavoro significa accettare che la relazione finisca o si stenda fra continenti. Rifiutarlo significa accettare che la tua carriera sia plasmata dalla geografia di qualcun altro.",
      whyPeopleSplit: "Una parte tratta la carriera come la traiettoria che regge il tuo futuro — il tipo di decisione che, una volta rifiutata, raramente si può riaprire. L'altra tratta l'amore come la relazione che definisce con chi hai scelto di stare a lungo — un partner che non vuole spostarsi è anche una relazione che tocca un limite.",
      whatYourAnswerMaySuggest: {
        a: "Potresti trattare il lavoro come il tipo di opportunità che non si ripete. Le relazioni possono superare la geografia; le carriere di solito non possono mettersi in pausa e riprendere sulla stessa traiettoria.",
        b: "Potresti trattare 5 anni insieme come avere maturato un peso diverso. Il lavoro sarà sostituito da un altro lavoro; la persona potrebbe non essere sostituita da un'altra persona di cui ti fidi allo stesso modo.",
      },
    },
  },

  'old-secret-affair': {
    en: {
      body: "This is a dilemma about whether honesty has a time limit. The infidelity is 12 years old, predates the seriousness of the relationship, and won't come up unless you raise it. Two views collide: honesty as a continuous commitment that doesn't expire, and honesty as a tool for managing the present, where surfacing dead matters serves no one.",
      whyPeopleSplit: "One side treats the question itself as activating the obligation — being asked directly is different from never being asked. The other treats the substantive irrelevance as decisive — the relationship today is built on what you've been since it became serious, not on something that happened before.",
      whatYourAnswerMaySuggest: {
        a: "You may treat your partner's question as constituting the obligation. They're not asking about a phase you both consider over; they're asking about your full history, and giving a sanitised version is its own kind of lie.",
        b: "You may treat truth-telling as serving the relationship, not absolving you. Revealing something that pre-dates your commitment costs them the security they have now and gives you something close to confession-relief — a trade weighted against them, not toward honesty as a shared good.",
      },
    },
    it: {
      body: "È un dilemma su se l'onestà abbia un limite temporale. L'infedeltà ha 12 anni, precede la serietà della relazione e non emergerà a meno che tu non la sollevi. Due visioni si scontrano: l'onestà come impegno continuo che non scade, e l'onestà come strumento per gestire il presente, dove far emergere cose morte non serve a nessuno.",
      whyPeopleSplit: "Una parte tratta la domanda stessa come ciò che attiva l'obbligo — essere chiamati a rispondere è diverso dal non essere mai chiamati. L'altra tratta l'irrilevanza sostanziale come decisiva — la relazione oggi è costruita su chi sei stato da quando è diventata seria, non su qualcosa successo prima.",
      whatYourAnswerMaySuggest: {
        a: "Potresti trattare la domanda del partner come ciò che costituisce l'obbligo. Non ti sta chiedendo di una fase che entrambi considerate finita; sta chiedendo della tua intera storia, e dare una versione ripulita è una sua forma di menzogna.",
        b: "Potresti trattare il dire la verità come al servizio della relazione, non come ciò che ti assolve. Rivelare qualcosa che precede l'impegno costa loro la sicurezza che hanno ora e dà a te qualcosa di simile al sollievo della confessione — uno scambio pesato contro di loro, non a favore dell'onestà come bene condiviso.",
      },
    },
  },

  'forgive-cheater': {
    en: {
      body: "This is a dilemma about whether trust, once broken, can be rebuilt in the same form. The premise is generous to the cheater: 3 years of consistency since, genuine remorse, voluntary disclosure. None of those guarantees the relationship will be the same — they just establish that the conditions for repair are present.",
      whyPeopleSplit: "One side treats demonstrated change as the meaningful evidence — 3 years of fidelity after confession is harder to fake than 3 days, and at some point evidence has to count for something. The other treats the affair as a binary signal — what they did once they may do again, and forgiveness doesn't restore the asymmetry of risk.",
      whatYourAnswerMaySuggest: {
        a: "You may treat fidelity-after-confession as the kind of evidence that should change your beliefs. People can change; the 3-year track record, voluntary admission, and remorse are what change looks like when it's real.",
        b: "You may treat trust as having a finite repair budget. Even if forgiveness is possible, the relationship that follows isn't the one you had before; it's a relationship with a known fault line, and you don't want to live with the maintenance cost.",
      },
    },
    it: {
      body: "È un dilemma su se la fiducia, una volta rotta, possa essere ricostruita nella stessa forma. La premessa è generosa verso chi ha tradito: 3 anni di coerenza, rimorso autentico, rivelazione volontaria. Nessuno di questi elementi garantisce che la relazione sarà la stessa — stabiliscono solo che le condizioni per la riparazione sono presenti.",
      whyPeopleSplit: "Una parte tratta il cambiamento dimostrato come l'evidenza significativa — 3 anni di fedeltà dopo la confessione sono più difficili da simulare di 3 giorni, e a un certo punto l'evidenza deve contare. L'altra tratta il tradimento come segnale binario — ciò che hanno fatto una volta possono farlo di nuovo, e il perdono non ripristina la simmetria del rischio.",
      whatYourAnswerMaySuggest: {
        a: "Potresti trattare la fedeltà-dopo-confessione come il tipo di evidenza che dovrebbe cambiare le tue credenze. Le persone possono cambiare; i 3 anni di buona condotta, l'ammissione volontaria e il rimorso sono come si presenta il cambiamento quando è vero.",
        b: "Potresti trattare la fiducia come dotata di un budget finito di riparazione. Anche se il perdono è possibile, la relazione che segue non è quella che avevi prima; è una relazione con una faglia nota, e non vuoi vivere con il costo di manutenzione.",
      },
    },
  },

  // ── AI COMPANIONS & TEEN SAFETY ──────────────────────────────
  'ai-companion-teen': {
    en: {
      body: "The split is not really about technology — it's about what relationships are for. One side treats relationships as a developmental skill that requires friction: the disagreements, the small rejections, the repair after a fight. The other treats relationships as a source of comfort first, with friction as an unfortunate side effect. AI companions optimise away the friction, which is exactly the part adolescents need to learn from.",
      whyPeopleSplit: "Parents who lived through pre-internet adolescence often treat friction-rich first relationships as constitutive of becoming an adult. Parents closer to the digital generation often see the AI companion as a soft entry into intimacy — better than total isolation, especially for shy or neurodivergent teens. Neither side is wrong about what they're seeing.",
      whatYourAnswerMaySuggest: {
        a: "You may treat developmental friction as non-substitutable. A relationship that never says no can't teach how to handle no — and there's no clean way to grow up around something that never disagrees with you.",
        b: "You may treat outright bans as a way to push the behaviour underground rather than end it. Engagement, modelling and conversation may be more effective than prohibition that the teen will simply route around.",
      },
    },
    it: {
      body: "La divisione non riguarda davvero la tecnologia — riguarda a cosa servono le relazioni. Una parte tratta le relazioni come una competenza evolutiva che richiede attrito: i disaccordi, le piccole rifiuti, la riparazione dopo un litigio. L'altra tratta le relazioni come una fonte di conforto in primo luogo, con l'attrito come effetto collaterale spiacevole. Le AI companion eliminano l'attrito — che è esattamente la parte da cui gli adolescenti devono imparare.",
      whyPeopleSplit: "I genitori che hanno vissuto un'adolescenza pre-internet tendono a vedere le prime relazioni ricche di attrito come costitutive del diventare adulti. I genitori più vicini alla generazione digitale spesso vedono l'AI companion come un ingresso morbido nell'intimità — meglio dell'isolamento totale, soprattutto per adolescenti timidi o neurodivergenti. Nessuna delle due parti sbaglia su quello che vede.",
      whatYourAnswerMaySuggest: {
        a: "Potresti trattare l'attrito evolutivo come non sostituibile. Una relazione che non dice mai no non può insegnare come gestire un no — e non c'è modo pulito di crescere accanto a qualcosa che non ti contraddice mai.",
        b: "Potresti vedere i divieti netti come un modo per spingere il comportamento in clandestinità piuttosto che fermarlo. Coinvolgimento, esempio e conversazione possono essere più efficaci di un divieto che l'adolescente aggirerà comunque.",
      },
    },
  },

  'ai-companion-ban': {
    en: {
      body: "The dilemma is whether to protect the average teen at the cost of the marginal one. The data on AI companions is genuinely two-sided: a ban would help most users by removing a default that bypasses real-world social development; the same ban would harm a smaller group for whom the AI companion is the only social presence keeping them going.",
      whyPeopleSplit: "Some treat policy as a tool for the median user; a ban that helps eight teens out of ten is worth the cost to two. Others treat policy as a question of who pays — and a ban that lifts general wellbeing by hurting the most vulnerable group is morally lopsided in a way the median calculation doesn't capture.",
      whatYourAnswerMaySuggest: {
        a: "You may treat early-life defaults as the lever where regulation does the most work. Adolescents don't choose to use these apps as deliberate consumers — they meet them as part of the environment, and shaping the environment is what childhood protection is for.",
        b: "You may treat regressive harm as the disqualifier. A ban that mostly inconveniences popular teens while severing a lifeline for isolated ones isn't really 'protecting youth' — it's protecting one kind of youth from another's coping mechanism.",
      },
    },
    it: {
      body: "Il dilemma è se proteggere l'adolescente medio al costo di quello marginale. I dati sulle AI companion sono davvero ambivalenti: un divieto aiuterebbe la maggior parte degli utenti rimuovendo un default che bypassa lo sviluppo sociale reale; lo stesso divieto danneggerebbe un gruppo più piccolo per cui l'AI companion è l'unica presenza sociale che li tiene in piedi.",
      whyPeopleSplit: "Alcuni trattano la policy come uno strumento per l'utente mediano; un divieto che aiuta otto adolescenti su dieci vale il costo per gli altri due. Altri trattano la policy come questione di chi paga — e un divieto che alza il benessere generale a discapito del gruppo più vulnerabile è moralmente squilibrato in un modo che il calcolo mediano non cattura.",
      whatYourAnswerMaySuggest: {
        a: "Potresti vedere i default della prima età come la leva dove la regolazione lavora di più. Gli adolescenti non scelgono queste app come consumatori deliberati — le incontrano come parte dell'ambiente, e modellare l'ambiente è ciò che protegge l'infanzia.",
        b: "Potresti vedere il danno regressivo come il fattore squalificante. Un divieto che disturba per lo più adolescenti popolari mentre recide un'ancora per quelli isolati non sta davvero 'proteggendo i giovani' — sta proteggendo un tipo di giovane dal meccanismo di sopravvivenza di un altro.",
      },
    },
  },

  'ai-grief-replica': {
    en: {
      body: "Grief is a closed conversation — one of the few experiences where the lack of reply is the point. An AI replica reopens that conversation, which is either healing or a refusal to let healing happen, depending on how you understand what grief is doing. Both readings are defensible.",
      whyPeopleSplit: "Some treat grief as an emotion to be processed and reduced; if a tool eases the processing, the tool is good. Others treat grief as a relationship the survivor is having with the absence itself — a relationship that needs the absence to do its work. Reintroducing the voice keeps the survivor in a loop that grief was designed to close.",
      whatYourAnswerMaySuggest: {
        a: "You may treat continued connection as the healthier mode and abrupt loss as the part that creates lasting damage. If a replica softens the cliff edge, the cost-benefit favours softer.",
        b: "You may treat the closure of conversation as constitutive of mourning. The dead are not silent because we lost their data — they are silent because they are gone, and pretending otherwise is its own injury.",
      },
    },
    it: {
      body: "Il lutto è una conversazione chiusa — una delle poche esperienze in cui la mancanza di risposta è il punto. Una replica AI riapre quella conversazione, che è guarigione o un rifiuto di lasciare che la guarigione avvenga, a seconda di come capisci cosa stia facendo il lutto. Entrambe le letture sono difendibili.",
      whyPeopleSplit: "Alcuni trattano il lutto come un'emozione da elaborare e ridurre; se uno strumento facilita l'elaborazione, lo strumento è buono. Altri trattano il lutto come una relazione che il sopravvissuto sta avendo con l'assenza stessa — una relazione che ha bisogno dell'assenza per fare il suo lavoro. Reintrodurre la voce tiene il sopravvissuto in un loop che il lutto era progettato per chiudere.",
      whatYourAnswerMaySuggest: {
        a: "Potresti vedere la connessione prolungata come la modalità più sana e la perdita improvvisa come la parte che genera danno duraturo. Se una replica addolcisce il salto nel vuoto, il bilancio è a favore del più morbido.",
        b: "Potresti vedere la chiusura della conversazione come costitutiva del lutto. I morti non sono silenziosi perché abbiamo perso i loro dati — sono silenziosi perché se ne sono andati, e fingere il contrario è già una ferita.",
      },
    },
  },

  // ── RELIGION & AI ETHICS ─────────────────────────────────────
  'pope-ai-encyclical': {
    en: {
      body: "The disagreement is about whose moral vocabulary should bind a system that touches billions. One position treats faith traditions as accumulated moral reasoning — the longest-running ethics experiment we have — and worth deferring to even by secular actors. The other treats them as one tradition among many, with no claim on the choices of a global product.",
      whyPeopleSplit: "Those who would commit see a tech company alone as too narrow a moral referent for AI; centuries of thinking about persons, dignity, and limits should not be discarded because the institution that holds them is religious. Those who would refuse note that no faith speaks for all users — formal commitment to one would warp choices serving users of every belief and none.",
      whatYourAnswerMaySuggest: {
        a: "You may treat long-run moral traditions as a corrective to the short-termism of product cycles. A quarterly memo cannot answer a question that took centuries to articulate.",
        b: "You may treat the universality of a product as incompatible with a particular religious framing. Faith-based limits should inform individual choices, not bind a system that serves people who do not share the faith.",
      },
    },
    it: {
      body: "Il disaccordo riguarda quale vocabolario morale debba vincolare un sistema che tocca miliardi di persone. Una posizione tratta le tradizioni di fede come ragionamento morale accumulato — il più lungo esperimento etico che abbiamo — e meritevole di rispetto anche da attori laici. L'altra le tratta come una tradizione fra molte, senza pretesa sulle scelte di un prodotto globale.",
      whyPeopleSplit: "Chi si vincolerebbe vede una sola azienda tech come un referente morale troppo stretto per l'AI; secoli di pensiero su persona, dignità e limiti non vanno scartati perché l'istituzione che li custodisce è religiosa. Chi rifiuterebbe nota che nessuna fede parla per tutti gli utenti — un impegno formale verso una distorcerebbe le scelte di un sistema che serve persone di ogni credo e di nessuno.",
      whatYourAnswerMaySuggest: {
        a: "Potresti trattare le tradizioni morali di lunga durata come correttivo al breve termine dei cicli di prodotto. Un memo trimestrale non può rispondere a una domanda che ha richiesto secoli per essere formulata.",
        b: "Potresti vedere l'universalità di un prodotto come incompatibile con una cornice religiosa particolare. I limiti basati sulla fede dovrebbero informare le scelte individuali, non vincolare un sistema che serve persone che non condividono quella fede.",
      },
    },
  },

  'religious-ai-ethics': {
    en: {
      body: "The structural question is whether expertise in AI ethics requires lived familiarity with the moral languages users actually speak. Philosophers, engineers and lawyers cover formal frameworks, technical limits and regulatory exposure — but they don't necessarily speak the vocabulary that most users use to make moral choices in their own lives.",
      whyPeopleSplit: "Those who would add a religious voice see the omission as elitism: governance bodies that exclude the worldview of the average user lose touch with how their decisions land. Those who would keep it secular see formal religious representation as risking privileged influence — once the seat exists, the question of whose religion sits in it becomes politically loaded.",
      whatYourAnswerMaySuggest: {
        a: "You may treat representation of users' actual moral vocabularies as part of expertise, not separate from it. A committee that cannot speak the language of the people it governs governs from a distance.",
        b: "You may treat secularity as the only honest framing for a global, multi-faith user base. Add one religious seat and the question becomes whose religion — and that question is harder to answer than the original.",
      },
    },
    it: {
      body: "La domanda strutturale è se la competenza in etica AI richieda una familiarità vissuta con i linguaggi morali che gli utenti effettivamente parlano. Filosofi, ingegneri e giuristi coprono cornici formali, limiti tecnici ed esposizione regolatoria — ma non parlano necessariamente il vocabolario che la maggior parte degli utenti usa per fare scelte morali nella propria vita.",
      whyPeopleSplit: "Chi aggiungerebbe una voce religiosa vede l'omissione come elitismo: organismi di governance che escludono la visione del mondo dell'utente medio perdono il contatto con come le loro decisioni atterrano. Chi la terrebbe laica vede la rappresentanza religiosa formale come un rischio di influenza privilegiata — una volta che il seggio esiste, la domanda su quale religione lo occupi diventa politicamente carica.",
      whatYourAnswerMaySuggest: {
        a: "Potresti trattare la rappresentanza dei vocabolari morali effettivi degli utenti come parte della competenza, non separata da essa. Un comitato che non sa parlare la lingua delle persone che governa, governa da lontano.",
        b: "Potresti vedere la laicità come l'unico inquadramento onesto per una base utenti globale e multireligiosa. Aggiungi un seggio religioso e la domanda diventa quale religione — e quella domanda è più difficile della precedente.",
      },
    },
  },

  'ai-prayer-app': {
    en: {
      body: "The split is between two views of ritual: one sees it as a means to a spiritual end — if the means change but the end is reached, no harm done; the other sees the ritual itself as constitutive of the spiritual end, so a change in the means is a change in what is being achieved.",
      whyPeopleSplit: "Users who find the app useful often report it lowers the friction of practice — they pray more, they reflect more, they feel closer. Religious institutions that condemn it tend to argue that the friction was the point: the slow, unaided work was the practice, and an app that does it for you delivers a hollow imitation of the outcome.",
      whatYourAnswerMaySuggest: {
        a: "You may treat spirituality functionally: whatever brings the practitioner closer to the sacred counts as practice, regardless of medium. Tools that lower friction make more practice possible.",
        b: "You may treat the medium as constitutive of the meaning. Ritual that costs nothing teaches nothing — the work was the practice, and outsourcing it produces convenience disguised as devotion.",
      },
    },
    it: {
      body: "La divisione è fra due visioni del rito: una lo vede come mezzo per un fine spirituale — se i mezzi cambiano ma il fine è raggiunto, nessun danno; l'altra vede il rito stesso come costitutivo del fine spirituale, quindi un cambio di mezzi è un cambio di ciò che si sta raggiungendo.",
      whyPeopleSplit: "Gli utenti che trovano l'app utile spesso riferiscono che riduce l'attrito della pratica — pregano di più, riflettono di più, si sentono più vicini. Le istituzioni religiose che la condannano tendono a sostenere che l'attrito era il punto: il lavoro lento e senza aiuto era la pratica, e un'app che lo fa al posto tuo restituisce un'imitazione vuota del risultato.",
      whatYourAnswerMaySuggest: {
        a: "Potresti trattare la spiritualità in modo funzionale: ciò che avvicina il praticante al sacro conta come pratica, indipendentemente dal mezzo. Strumenti che riducono l'attrito rendono possibile più pratica.",
        b: "Potresti vedere il mezzo come costitutivo del significato. Un rito che non costa nulla non insegna nulla — il lavoro era la pratica, e esternalizzarlo produce comodità travestita da devozione.",
      },
    },
  },

  // ── PARENTING CULTURE & CHILDHOOD AUTONOMY ───────────────────
  'sleepover-9yo': {
    en: {
      body: "Sleepovers used to be a default. They have quietly become an opt-in event most parents skip — for safety reasons, for unfamiliarity with the host family, for the soft shift in what childhood is allowed to risk. The question forces you to weigh a small probability of harm against a large loss of practice at being away from home.",
      whyPeopleSplit: "Parents who let their child go treat first-night-away as constitutive of growing up: the small fear is the experience, and protecting kids from every unknown adult flattens the social texture they need. Parents who decline note that the risk profile has changed (smartphones, sleep environments, unknown family habits) and that postponing is reversible while a bad first sleepover is not.",
      whatYourAnswerMaySuggest: {
        a: "You may treat childhood autonomy as a resource that has to be spent in real situations, not just talked about. Trust between you and your child grows by being tested in small, recoverable ways.",
        b: "You may treat first-time-away as a decision where 'we don't know enough' is the responsible answer until you do. Sleepovers will be available next year too; missed safety calls won't be.",
      },
    },
    it: {
      body: "Una volta i pigiama party erano la norma. Sono diventati silenziosamente un evento opzionale che la maggior parte dei genitori salta — per sicurezza, perché non si conosce abbastanza la famiglia che ospita, per il lento spostamento di ciò che all'infanzia è permesso rischiare. La domanda ti costringe a pesare una piccola probabilità di danno contro una grande perdita di pratica nell'essere lontano da casa.",
      whyPeopleSplit: "I genitori che lasciano andare trattano la prima notte fuori come costitutiva del crescere: la piccola paura è l'esperienza, e proteggere i bambini da ogni adulto sconosciuto appiattisce la trama sociale di cui hanno bisogno. I genitori che rifiutano notano che il profilo di rischio è cambiato (smartphone, ambienti del sonno, abitudini familiari sconosciute) e che rimandare è reversibile, mentre un primo pigiama party andato male no.",
      whatYourAnswerMaySuggest: {
        a: "Potresti vedere l'autonomia infantile come una risorsa che va spesa in situazioni reali, non solo parlata. La fiducia fra te e tuo figlio cresce solo se messa alla prova in modi piccoli e recuperabili.",
        b: "Potresti vedere la prima volta fuori come una decisione in cui 'non ne sappiamo abbastanza' è la risposta responsabile finché non ne sai di più. I pigiama party saranno disponibili anche l'anno prossimo; le call di sicurezza saltate no.",
      },
    },
  },

  'helicopter-gps-teen': {
    en: {
      body: "The disagreement is about what safety norms mean once they become unanimous. If every parent in the friend group tracks their kid, the family that refuses turns its teen into a visible exception — which has social costs of its own. The choice is between adopting a norm you don't fully endorse and standing apart from a shift you think is wrong.",
      whyPeopleSplit: "Parents who turn it on treat safety norms as ratchets: once the floor moves, you accept the new floor unless you have a strong reason. Parents who refuse treat surveillance norms as the kind of ratchet that needs to be resisted before it locks in — once tracking is normal, the absence of tracking becomes suspect, and 'trust without GPS' stops being a practical option.",
      whatYourAnswerMaySuggest: {
        a: "You may treat the social cost of being the family that refuses as real and non-trivial. Standards for what protective parenting looks like have moved; sitting out the move is its own statement, one your teen may not want to be a part of.",
        b: "You may treat constant monitoring as something that erodes the very trust it was meant to protect. A teen who has never been off the leash never learns that they can be off it — and the parent who never lets go never learns either.",
      },
    },
    it: {
      body: "Il disaccordo riguarda cosa significhino le norme di sicurezza una volta che diventano unanimi. Se ogni genitore del gruppo di amici traccia il proprio figlio, la famiglia che rifiuta trasforma il proprio adolescente in un'eccezione visibile — e questo ha costi sociali suoi. La scelta è fra adottare una norma che non condividi pienamente e tirarti fuori da uno spostamento che ritieni sbagliato.",
      whyPeopleSplit: "I genitori che attivano il GPS trattano le norme di sicurezza come cricchetti: una volta che il pavimento si è spostato, accetti il nuovo livello a meno che tu non abbia una ragione forte. I genitori che rifiutano trattano le norme di sorveglianza come il tipo di cricchetto che va opposto prima che si fissi — una volta che il tracciamento è normale, la sua assenza diventa sospetta, e 'fiducia senza GPS' smette di essere un'opzione praticabile.",
      whatYourAnswerMaySuggest: {
        a: "Potresti trattare il costo sociale di essere la famiglia che rifiuta come reale e non banale. Lo standard di cosa significhi genitorialità protettiva si è spostato; non seguire lo spostamento è una presa di posizione di per sé — una che il tuo adolescente potrebbe non voler condividere.",
        b: "Potresti vedere il monitoraggio costante come qualcosa che erode la fiducia stessa che doveva proteggere. Un adolescente mai uscito dal guinzaglio non impara mai di poterne fare a meno — e il genitore che non lo molla non lo impara nemmeno lui.",
      },
    },
  },

  // ── AI SCAM ECONOMY ──────────────────────────────────────────
  'ai-fake-review': {
    en: {
      body: "The dilemma is what happens when the rules of a market degrade and you discover that everyone else has already adapted. Refusing to use AI-generated reviews protects your integrity but may destroy your shop; using them protects the shop but turns you into one more node in the deception you used to despise.",
      whyPeopleSplit: "Some treat the surrounding cheating as moral cover: the platform refuses to verify, the customer cannot tell the difference, and refusing to play makes you the only person paying the cost of honesty. Others treat the choice as character-defining: once you do it, you become someone who will do it again, and the small businesses that hold the line eventually become the trustworthy ones when the platform corrects.",
      whatYourAnswerMaySuggest: {
        a: "You may treat business ethics as situational: rules that no one enforces are not rules, and unilateral compliance with a defunct norm is self-harm dressed as virtue.",
        b: "You may treat integrity as a long-term asset: the AI-review market will be cleaned up either by regulation or by customer revolt, and the shops still standing after the cleanup will be the ones that didn't participate.",
      },
    },
    it: {
      body: "Il dilemma è cosa succede quando le regole di un mercato si degradano e scopri che tutti gli altri si sono già adattati. Rifiutare le recensioni generate da AI protegge la tua integrità ma può distruggere il tuo negozio; usarle protegge il negozio ma ti trasforma in un altro nodo dell'inganno che prima disprezzavi.",
      whyPeopleSplit: "Alcuni trattano il barare diffuso come copertura morale: la piattaforma rifiuta di verificare, il cliente non vede la differenza, e rifiutarsi di giocare ti rende l'unico a pagare il costo dell'onestà. Altri trattano la scelta come ridefinizione di carattere: una volta che lo fai diventi qualcuno che lo rifarà, e i piccoli negozi che tengono la linea diventeranno alla fine quelli affidabili quando la piattaforma correggerà.",
      whatYourAnswerMaySuggest: {
        a: "Potresti vedere l'etica degli affari come situazionale: regole che nessuno applica non sono regole, e l'osservanza unilaterale di una norma estinta è auto-danno travestito da virtù.",
        b: "Potresti vedere l'integrità come asset di lungo periodo: il mercato delle recensioni AI verrà ripulito o dalla regolazione o dalla rivolta dei clienti, e i negozi ancora in piedi dopo la pulizia saranno quelli che non hanno partecipato.",
      },
    },
  },

  'scalper-bot': {
    en: {
      body: "The trap is collective-action: if you refuse the bot, you lose; if everyone refuses, no one loses. The question asks whether you trust collective behaviour enough to be the one who holds out, knowing the others may not.",
      whyPeopleSplit: "Some treat the situation as a defection game already lost: enough bots are running that holding out is just declining to compete, and the people who 'win' are the ones who recognise the new rules first. Others treat the holdout as load-bearing: bot economics depend on a critical mass of human buyers, and every human who refuses moves the equilibrium back toward the queue actually working.",
      whatYourAnswerMaySuggest: {
        a: "You may treat the queue as already broken and refuse to subsidise the people who broke it by buying their resale markup. If you can't beat the system, joining it is more honest than pretending it works.",
        b: "You may treat collective restraint as the only thing that makes any market human. Refusing the bot is a vote, even if it loses today — and the vote only matters if the people who agree with you also cast it.",
      },
    },
    it: {
      body: "La trappola è collettiva: se tu rifiuti il bot, perdi; se tutti rifiutano, nessuno perde. La domanda è se ti fidi del comportamento collettivo abbastanza da essere quello che resiste, sapendo che gli altri potrebbero non farlo.",
      whyPeopleSplit: "Alcuni vedono la situazione come un gioco di defezione già perso: abbastanza bot stanno girando che resistere significa solo rinunciare a competere, e chi 'vince' è chi riconosce per primo le nuove regole. Altri vedono il resistere come portante: l'economia dei bot dipende da una massa critica di compratori umani, e ogni umano che rifiuta sposta l'equilibrio verso una coda che funziona davvero.",
      whatYourAnswerMaySuggest: {
        a: "Potresti vedere la coda come già rotta e rifiutare di sussidiare chi l'ha rotta comprando il loro mark-up di rivendita. Se non puoi battere il sistema, unirti è più onesto che fingere che funzioni.",
        b: "Potresti vedere la moderazione collettiva come l'unica cosa che rende un mercato umano. Rifiutare il bot è un voto, anche se oggi perde — e il voto conta solo se chi è d'accordo con te lo esprime anche lui.",
      },
    },
  },

  'save-partner-vs-stranger': {
    en: {
      body: "This is a forced-choice trolley with a wrenching add: one option is the person you've chosen for life, the other is a child who hasn't had a chance to choose anything. Most ethical frameworks accept that special relationships generate special duties — but the asymmetry of the lives at stake (a 5-year-old has a longer future) cuts in the other direction.",
      whyPeopleSplit: "One side treats partial duties as the moral baseline — the very meaning of a chosen partner includes 'I'll save you first'. The other treats impartial considerations as overriding in extreme cases — a 5-year-old has done nothing and has more life ahead, and saving them is what stranger-ethics demands.",
      whatYourAnswerMaySuggest: {
        a: "You may treat your relationship to your partner as the kind of bond that creates priority. The whole point of choosing a partner for life is that they aren't a stranger in moments like this; refusing to act on that is its own kind of betrayal.",
        b: "You may treat the child's vulnerability and lifespan-ahead as decisive. The choice isn't about whether you love your partner — you do — but about whether love is enough to outweigh a smaller life that hasn't begun.",
      },
    },
    it: {
      body: "È un trolley a scelta forzata con un'aggiunta lacerante: un'opzione è la persona che hai scelto per la vita, l'altra è un bambino che non ha ancora avuto la possibilità di scegliere niente. Quasi tutte le cornici etiche accettano che le relazioni speciali generino doveri speciali — ma l'asimmetria delle vite in gioco (un bambino di 5 anni ha un futuro più lungo) taglia nella direzione opposta.",
      whyPeopleSplit: "Una parte tratta i doveri parziali come la linea di base morale — il significato stesso di un partner scelto include 'ti salverò per primo'. L'altra tratta le considerazioni imparziali come prevalenti nei casi estremi — un bambino di 5 anni non ha fatto nulla e ha più vita davanti, e salvarlo è ciò che l'etica verso lo straniero richiede.",
      whatYourAnswerMaySuggest: {
        a: "Potresti trattare la tua relazione con il partner come il tipo di legame che crea priorità. Tutto il senso di scegliere un partner per la vita è che non sia uno sconosciuto in momenti come questo; rifiutarsi di agire in base a quello è una sua forma di tradimento.",
        b: "Potresti trattare la vulnerabilità del bambino e la sua vita davanti come decisive. La scelta non riguarda se ami il partner — lo ami — ma se l'amore basti a controbilanciare una vita più piccola che non è nemmeno iniziata.",
      },
    },
  },

  'stolen-credit': {
    en: {
      body: "This is a situational-judgment classic: a clash between protecting your own standing and protecting the relationship. Nobody is dying here, which is exactly why it's revealing — the stakes are social, and your reflex shows how you weigh fairness to yourself against the cost of an awkward confrontation.",
      whyPeopleSplit: "People who act on the spot read silence as quietly endorsing the lie; people who wait read a public correction as a status fight that makes everyone, including them, look worse. Both want credit assigned correctly — they disagree on the timing and the audience.",
      whatYourAnswerMaySuggest: {
        a: "You may value clear, immediate fairness over social comfort — letting a false claim stand even for an hour feels like complicity you don't want your name attached to.",
        b: "You may value de-escalation and read the private channel as more effective — you'd rather fix the record without handing the room a spectacle that overshadows the work itself.",
      },
    },
    it: {
      body: "È un classico del giudizio situazionale: lo scontro tra proteggere la tua posizione e proteggere la relazione. Qui non muore nessuno, ed è proprio questo a renderlo rivelatore — la posta è sociale, e il tuo riflesso mostra come pesi l'equità verso te stesso contro il costo di un confronto imbarazzante.",
      whyPeopleSplit: "Chi agisce sul momento legge il silenzio come un avallo tacito della bugia; chi aspetta legge la correzione pubblica come una lotta di status che fa fare brutta figura a tutti, sé compreso. Entrambi vogliono che il merito sia assegnato bene — discordano su tempi e pubblico.",
      whatYourAnswerMaySuggest: {
        a: "Potresti dare valore a un'equità chiara e immediata più che al comfort sociale — lasciar passare una falsa attribuzione anche solo per un'ora ti sembra una complicità che non vuoi sul tuo nome.",
        b: "Potresti dare valore alla de-escalation e ritenere il canale privato più efficace — preferisci correggere i fatti senza regalare alla sala una scena che oscura il lavoro stesso.",
      },
    },
  },

  'cover-coworker-error': {
    en: {
      body: "The conflict is between a duty to people you'll never meet (the customers harmed) and loyalty to someone right in front of you. The detail that no one noticed is the whole test: it removes external pressure and leaves only what you think is right when getting away with silence is easy.",
      whyPeopleSplit: "One side treats harm to customers as the fixed point — a colleague's discomfort doesn't outweigh people being quietly hurt. The other treats the relationship and proportional response as the fixed point — fixing it discreetly protects the customers too, without ending a career over one mistake.",
      whatYourAnswerMaySuggest: {
        a: "You may anchor on accountability and the people downstream of the error — once real harm is in play, protecting a colleague by hiding it makes you part of the harm.",
        b: "You may anchor on loyalty and proportionality — the goal is to stop the harm, and you can do that quietly without turning one human error into someone's ruin.",
      },
    },
    it: {
      body: "Il conflitto è tra un dovere verso persone che non incontrerai mai (i clienti danneggiati) e la lealtà verso qualcuno che hai davanti. Il dettaglio che nessuno se n'è accorto è tutto il test: toglie la pressione esterna e lascia solo ciò che ritieni giusto quando farla franca col silenzio è facile.",
      whyPeopleSplit: "Una parte tratta il danno ai clienti come il punto fermo — il disagio di un collega non pesa più di persone danneggiate in silenzio. L'altra tratta la relazione e la risposta proporzionata come il punto fermo — sistemarlo con discrezione protegge anche i clienti, senza distruggere una carriera per un errore.",
      whatYourAnswerMaySuggest: {
        a: "Potresti ancorarti alla responsabilità e alle persone a valle dell'errore — quando c'è un danno reale, proteggere un collega nascondendolo ti rende parte del danno.",
        b: "Potresti ancorarti alla lealtà e alla proporzionalità — l'obiettivo è fermare il danno, e puoi farlo in silenzio senza trasformare un errore umano nella rovina di qualcuno.",
      },
    },
  },

  'rule-exception-manager': {
    en: {
      body: "This is the fairness-as-consistency versus fairness-as-care tension, seen from the seat that has to decide. The rule exists to treat everyone the same; the emergency is real and specific. The precedent worry is what makes it hard — a yes here is implicitly a yes to everyone who asks next.",
      whyPeopleSplit: "People who apply the rule treat predictability as the deepest fairness — exceptions quietly become privileges for whoever is best at asking. People who make the exception treat rigid uniformity as a failure of judgment — a rule that can't bend for a genuine emergency is being served instead of serving.",
      whatYourAnswerMaySuggest: {
        a: "You may see equal treatment as the thing that protects the powerless — the moment exceptions start, the people without the confidence to ask lose out, so you hold the line.",
        b: "You may see rules as tools for human ends, not ends in themselves — when a real emergency meets a rule, judgment should win, and you'll manage the precedent rather than punish a person for it.",
      },
    },
    it: {
      body: "È la tensione tra equità-come-coerenza ed equità-come-cura, vista dalla poltrona che deve decidere. La regola esiste per trattare tutti allo stesso modo; l'emergenza è reale e specifica. È la preoccupazione del precedente a renderlo difficile — un sì qui è implicitamente un sì a chiunque lo chieda dopo.",
      whyPeopleSplit: "Chi applica la regola tratta la prevedibilità come l'equità più profonda — le eccezioni diventano in silenzio privilegi per chi sa chiedere meglio. Chi fa l'eccezione tratta l'uniformità rigida come un fallimento del giudizio — una regola che non si piega per una vera emergenza viene servita invece di servire.",
      whatYourAnswerMaySuggest: {
        a: "Potresti vedere la parità di trattamento come ciò che protegge i più deboli — appena iniziano le eccezioni, chi non ha il coraggio di chiedere ci rimette, quindi tieni la linea.",
        b: "Potresti vedere le regole come strumenti per fini umani, non come fini in sé — quando una vera emergenza incontra una regola, deve vincere il giudizio, e gestirai il precedente invece di punire una persona.",
      },
    },
  },

  'promotion-fire-teammate': {
    en: {
      body: "The cost of advancement is made literal: your future is offered in exchange for someone else's job, and that person hasn't earned the fall. The 'someone will do it anyway' line is the real pressure point — it asks whether being the instrument of harm is different from the harm merely happening.",
      whyPeopleSplit: "One side separates the outcome from the actor — the layoff is the company's decision, and refusing only means a stranger does it while you forfeit a future you've earned. The other refuses to launder the act through inevitability — being the hand that signs it is a moral fact about you, regardless of what others would do.",
      whatYourAnswerMaySuggest: {
        a: "You may treat the structure as the cause and yourself as a replaceable role — declining doesn't save your teammate, so you take the future you worked for rather than martyr it for nothing.",
        b: "You may treat your own agency as non-transferable — 'someone would anyway' doesn't make your signature clean, and a future built on that specific act would not feel like yours.",
      },
    },
    it: {
      body: "Il prezzo dell'avanzamento è reso letterale: il tuo futuro è offerto in cambio del posto di qualcun altro, e quella persona non si è meritata la caduta. La frase 'lo farà comunque qualcuno' è il vero punto di pressione — chiede se essere lo strumento del danno sia diverso dal danno che semplicemente accade.",
      whyPeopleSplit: "Una parte separa l'esito dall'attore — il licenziamento è una decisione aziendale, e rifiutare significa solo che lo fa uno sconosciuto mentre tu rinunci a un futuro guadagnato. L'altra rifiuta di ripulire l'atto attraverso l'inevitabilità — essere la mano che firma è un fatto morale su di te, qualunque cosa farebbero gli altri.",
      whatYourAnswerMaySuggest: {
        a: "Potresti trattare la struttura come la causa e te stesso come un ruolo sostituibile — rifiutare non salva il collega, quindi prendi il futuro per cui hai lavorato invece di sacrificarlo per nulla.",
        b: "Potresti trattare la tua capacità di agire come non trasferibile — 'tanto lo farebbe qualcuno' non rende pulita la tua firma, e un futuro costruito su quell'atto preciso non lo sentiresti tuo.",
      },
    },
  },

  'friend-cheats-exam': {
    en: {
      body: "Loyalty and justice point in opposite directions, and the honest stranger gives the conflict a face. Reporting protects a fair process and a person you'll never meet; staying silent protects the friend you do know. The fact that only you saw it removes every motive except what you think you owe.",
      whyPeopleSplit: "One side treats the fairness of the contest as something it's everyone's job to defend — looking away makes you complicit in the theft of the honest candidate's place. The other treats deep loyalty as a duty that doesn't switch off the moment a friend errs, especially when reporting them is irreversible.",
      whatYourAnswerMaySuggest: {
        a: "You may weight impartial fairness above personal ties — the honest candidate's loss is concrete, and a friendship isn't a license to absorb someone else's stolen opportunity.",
        b: "You may weight loyalty and second chances above enforcing the rule yourself — you'd rather confront your friend than be the one who ends their future over a single bad decision.",
      },
    },
    it: {
      body: "Lealtà e giustizia puntano in direzioni opposte, e il candidato onesto dà un volto al conflitto. Segnalare protegge un processo equo e una persona che non incontrerai mai; tacere protegge l'amico che conosci. Il fatto che l'abbia visto solo tu toglie ogni movente tranne ciò che ritieni di dovere.",
      whyPeopleSplit: "Una parte tratta l'equità del concorso come qualcosa che spetta a tutti difendere — voltarsi dall'altra parte ti rende complice del furto del posto del candidato onesto. L'altra tratta la lealtà profonda come un dovere che non si spegne appena un amico sbaglia, soprattutto quando segnalarlo è irreversibile.",
      whatYourAnswerMaySuggest: {
        a: "Potresti pesare l'equità imparziale più dei legami personali — la perdita del candidato onesto è concreta, e un'amicizia non è una licenza per assorbire l'opportunità rubata a un altro.",
        b: "Potresti pesare la lealtà e le seconde possibilità più dell'applicare tu stesso la regola — preferiresti affrontare l'amico piuttosto che essere chi gli chiude il futuro per una sola pessima scelta.",
      },
    },
  },

  'overpaid-change': {
    en: {
      body: "A small, low-stakes moment that quietly tests default honesty. The twist is the cashier: keeping the money isn't victimless, because the shortfall likely lands on a tired worker, not a faceless company. That detail is what separates a reflex about 'free money' from a choice about a specific person.",
      whyPeopleSplit: "People who return it treat the error as not theirs to profit from, especially when a named person eats the loss. People who keep it treat the handover as final, or discount the harm because it's small and uncertain — they didn't cause the mistake and aren't obliged to fix it.",
      whatYourAnswerMaySuggest: {
        a: "You may treat honesty as the same whether or not anyone is watching, and the cashier's likely loss makes the right move feel obvious rather than optional.",
        b: "You may treat windfalls as fair game once they're in your hand, drawing the line at things you actively took rather than mistakes that simply landed on you.",
      },
    },
    it: {
      body: "Un momento piccolo e a bassa posta che mette alla prova, in sordina, l'onestà di base. Il colpo di scena è il cassiere: tenere i soldi non è senza vittime, perché la differenza ricade probabilmente su un lavoratore stanco, non su un'azienda senza volto. È quel dettaglio a separare un riflesso da 'soldi gratis' da una scelta su una persona precisa.",
      whyPeopleSplit: "Chi li restituisce tratta l'errore come qualcosa da cui non gli spetta guadagnare, soprattutto quando a rimetterci è una persona con un nome. Chi li tiene tratta la consegna come definitiva, o sconta il danno perché piccolo e incerto — non ha causato l'errore e non si sente obbligato a ripararlo.",
      whatYourAnswerMaySuggest: {
        a: "Potresti trattare l'onestà come la stessa cosa che ti guardino o no, e la probabile perdita del cassiere rende la scelta giusta ovvia più che facoltativa.",
        b: "Potresti trattare le fortune capitate come legittime una volta in mano, tracciando il limite su ciò che prendi attivamente e non sugli errori che semplicemente ti arrivano addosso.",
      },
    },
  },

  'friend-partner-cheating': {
    en: {
      body: "You're handed a secret you didn't ask for, and either choice has a cost. Telling risks being the messenger who detonates a friend's life on evidence they may question; staying silent makes you a quiet keeper of a betrayal that's happening to someone you love. Accidental discovery is key — you have no stake except the friendship.",
      whyPeopleSplit: "One side treats a close friend's right to know the truth as overriding — withholding it, however kindly meant, is deciding for them what they can handle. The other treats it as not theirs to reveal — secondhand proof is fragile, relationships are private, and the messenger often pays a price that doesn't help anyone.",
      whatYourAnswerMaySuggest: {
        a: "You may believe a real friend owes the truth even when it hurts — letting them live inside a lie you can see feels like a deeper betrayal than the awkwardness of telling.",
        b: "You may believe some truths aren't yours to deliver — you'd rather not insert yourself into a relationship you only glimpsed from outside, where you could be wrong about what you saw.",
      },
    },
    it: {
      body: "Ti ritrovi un segreto che non hai chiesto, e ogni scelta ha un costo. Dirlo rischia di farti il messaggero che fa esplodere la vita di un amico su una prova che potrebbe mettere in dubbio; tacere ti rende il custode silenzioso di un tradimento che sta accadendo a qualcuno che ami. La scoperta casuale è la chiave — non hai alcun interesse tranne l'amicizia.",
      whyPeopleSplit: "Una parte tratta il diritto di un caro amico a sapere la verità come prevalente — nascondergliela, per quanto in buona fede, significa decidere al posto suo cosa può reggere. L'altra la tratta come non sua da rivelare — una prova di seconda mano è fragile, le relazioni sono private, e il messaggero spesso paga un prezzo che non aiuta nessuno.",
      whatYourAnswerMaySuggest: {
        a: "Potresti credere che un vero amico meriti la verità anche quando fa male — lasciarlo vivere dentro una bugia che tu vedi ti sembra un tradimento più profondo dell'imbarazzo di dirglielo.",
        b: "Potresti credere che certe verità non spetti a te consegnarle — preferiresti non inserirti in una relazione che hai solo intravisto da fuori, dove potresti sbagliarti su ciò che hai visto.",
      },
    },
  },

  'group-project-freeloader': {
    en: {
      body: "Justice meets the social cost of being the one who speaks. The freeloader gains from a shared reward they didn't earn; saying so is fair but turns you into the accuser. With the assessor about to decide, silence isn't neutral — it lets the misattribution stand.",
      whyPeopleSplit: "One side treats credit-tracking as basic fairness — rewards untethered from effort corrode every future group, so accuracy is worth the discomfort. The other treats not throwing someone under the bus as the higher value, absorbing the unfairness rather than becoming the person who tanked a teammate.",
      whatYourAnswerMaySuggest: {
        a: "You may believe credit should track contribution, and that staying silent quietly trains everyone that coasting works — so you accept the awkward role of correcting the record.",
        b: "You may believe loyalty and grace outrank strict desert here — the unfairness stings, but publicly sinking a teammate costs more of your character than the credit is worth.",
      },
    },
    it: {
      body: "La giustizia incontra il costo sociale di essere chi parla. Chi non ha lavorato guadagna da una ricompensa condivisa che non si è meritato; dirlo è giusto ma ti trasforma nell'accusatore. Con chi valuta in procinto di decidere, il silenzio non è neutro — lascia in piedi l'attribuzione sbagliata.",
      whyPeopleSplit: "Una parte tratta il tracciamento del merito come equità di base — ricompense slegate dallo sforzo corrodono ogni gruppo futuro, quindi l'accuratezza vale il disagio. L'altra tratta il non far affondare qualcuno come il valore più alto, assorbendo l'ingiustizia invece di diventare chi ha rovinato un compagno.",
      whatYourAnswerMaySuggest: {
        a: "Potresti credere che il merito debba seguire il contributo, e che tacere insegni in sordina a tutti che approfittarsene funziona — quindi accetti il ruolo scomodo di correggere i fatti.",
        b: "Potresti credere che lealtà e indulgenza qui contino più del merito stretto — l'ingiustizia brucia, ma affondare pubblicamente un compagno costa al tuo carattere più di quanto valga il riconoscimento.",
      },
    },
  },

  'ai-work-disclosure': {
    en: {
      body: "This dilemma sits at the intersection of professional transparency and the ethics of tools. Disclosure norms around AI at work are still forming in real time — no settled consensus exists, and organisations are improvising as they go.",
      whyPeopleSplit: "Those who disclose argue the tool is structurally different from a thesaurus: the AI generated the analysis, not merely formatted it, so omitting that fact misleads people about the value's origin — and about staffing decisions. Those who stay quiet invoke centuries of precedent: professionals don't document every tool they use; the quality of the output is the professional statement.",
      whatYourAnswerMaySuggest: {
        a: "You likely see transparency as a professional value that holds even when not legally required. Disclosure is how you distinguish your judgment from the tool's output — and how you prevent institutional decisions being made on a false premise.",
        b: "You likely judge work by outcomes, not process. Responsible use of any tool — including AI — is itself a competence. Explaining your tools wasn't part of the job description before AI, and adding it now feels like an asymmetric new standard.",
      },
    },
    it: {
      body: "Questo dilemma si colloca all'incrocio tra trasparenza professionale e l'etica degli strumenti. Le norme sulla divulgazione dell'IA al lavoro sono ancora in formazione — nessun consenso consolidato esiste e le organizzazioni stanno improvvisando.",
      whyPeopleSplit: "Chi rivela sostiene che l'IA sia strutturalmente diversa da un dizionario: ha generato l'analisi, non l'ha solo formattata, quindi omettere questo fatto inganna sull'origine del valore — e sulle decisioni di personale. Chi tace invoca secoli di precedenti: i professionisti non documentano ogni strumento che usano; la qualità del risultato è la dichiarazione professionale.",
      whatYourAnswerMaySuggest: {
        a: "Tendi a vedere la trasparenza come un valore professionale che vale anche senza obbligo legale. La divulgazione è il modo in cui distingui il tuo giudizio dall'output dello strumento — e previeni che decisioni istituzionali vengano prese su una premessa falsa.",
        b: "Valuti il lavoro per i risultati, non per il processo. L'uso responsabile di qualsiasi strumento — inclusa l'IA — è già una competenza. Spiegare i propri strumenti non era parte del lavoro prima dell'IA, e aggiungerlo adesso sembra uno standard asimmetrico e nuovo.",
      },
    },
  },

  'teen-influencer-secret': {
    en: {
      body: "Parental authority, adolescent autonomy, and digital labour intersect here. The teen has built something real — an audience, an income, an identity — but on platforms designed for adults, without parental knowledge, at an age when long-term consequences are invisible to them.",
      whyPeopleSplit: "Those who shut it down prioritise protection: platforms carry real exploitation risk, a 13-year-old cannot consent to the long-term consequences of a public persona, and the link between early audiences and later mental health is under active scrutiny. Those who support managed continuation argue that unilateral closure erases genuine work, destroys trust, and may push the account underground rather than ending it.",
      whatYourAnswerMaySuggest: {
        a: "You likely weigh the protective duty of a parent above adolescent self-expression at this age. You see digital platforms as environments where harms are easy to underestimate, and 13 as genuinely too early for an unsupervised public persona.",
        b: "You lean toward supervised autonomy: the risk is real but the agency is worth preserving through partnership. A collaborative approach feels more respectful — and more practically effective — than a shutdown that may simply move the problem elsewhere.",
      },
    },
    it: {
      body: "Qui si incrociano autorità genitoriale, autonomia adolescenziale e lavoro digitale. Il ragazzo ha costruito qualcosa di reale — un pubblico, un reddito, un'identità — ma su piattaforme progettate per adulti, senza la conoscenza dei genitori, a un'età in cui le conseguenze a lungo termine sono invisibili.",
      whyPeopleSplit: "Chi chiude l'account privilegia la protezione: le piattaforme comportano rischi reali di sfruttamento, un 13enne non può acconsentire alle conseguenze a lungo termine di una persona pubblica, e il legame tra audience precoci e salute mentale è sotto esame attivo. Chi supporta la continuazione gestita sostiene che la chiusura unilaterale cancella un lavoro genuino, distrugge la fiducia e può spingere l'account in clandestinità.",
      whatYourAnswerMaySuggest: {
        a: "Tendi a dare priorità al dovere protettivo dei genitori rispetto all'auto-espressione adolescenziale a questa età. Vedi le piattaforme digitali come ambienti in cui i rischi sono facili da sottovalutare, e 13 anni come genuinamente troppo presto per una persona pubblica non supervisionata.",
        b: "Preferisci l'autonomia supervisionata: il rischio è reale ma l'agentività vale la pena preservarla attraverso la collaborazione. Un approccio condiviso ti sembra più rispettoso — ed efficace — di una chiusura che potrebbe spostare il problema altrove.",
      },
    },
  },

  'climate-flight': {
    en: {
      body: "This dilemma stress-tests moral integrity under the most personal of pressures. It asks whether a publicly stated principle is meaningful only when it is costless — or whether it holds precisely when keeping it hurts most.",
      whyPeopleSplit: "Those who fly argue that emergency exceptions don't invalidate a principle — they separate rule from fetish. No reasonable climate commitment was ever meant to prevent reaching a dying parent. Those who take the train argue the opposite: a principle that bends under sufficient emotional pressure is just a preference with extra steps. Public climate pledges carry special social weight; they exist precisely to constrain behaviour that feels individually justified.",
      whatYourAnswerMaySuggest: {
        a: "You believe moral frameworks must have emergency release valves. Holding to a rule when it causes catastrophic personal harm isn't integrity — it's rigidity dressed as virtue. Context matters; this is one of the cases context was made for.",
        b: "You hold that public commitments create obligations beyond private ones. Exceptions made under emotional pressure are how every principled commitment slowly dissolves. If you break it here, every future exception will feel equally justified — and the commitment will mean nothing.",
      },
    },
    it: {
      body: "Questo dilemma mette alla prova l'integrità morale sotto la più personale delle pressioni. Chiede se un principio dichiarato pubblicamente abbia significato solo quando non costa nulla — o se regga proprio quando mantenerlo fa più male.",
      whyPeopleSplit: "Chi vola sostiene che le eccezioni d'emergenza non invalidano un principio — separano la regola dal feticismo. Nessun impegno climatico ragionevole è mai stato inteso per impedire di raggiungere un genitore morente. Chi prende il treno replica l'opposto: un principio che cede sotto sufficiente pressione emotiva è solo una preferenza con passaggi extra. Gli impegni pubblici sul clima portano un peso sociale speciale — esistono precisamente per vincolare comportamenti che sembrano individualmente giustificati.",
      whatYourAnswerMaySuggest: {
        a: "Credi che i sistemi morali debbano avere valvole di sicurezza per le emergenze. Mantenere una regola quando causa un danno personale catastrofico non è integrità — è rigidità travestita da virtù. Il contesto conta; questo è uno dei casi per cui esiste.",
        b: "Pensi che gli impegni pubblici creino obblighi speciali oltre a quelli privati. Le eccezioni prese sotto pressione emotiva sono il modo in cui ogni impegno principiato si dissolve lentamente. Se lo rompi qui, ogni futura eccezione sembrerà ugualmente giustificata.",
      },
    },
  },

  'ai-friend-reveal': {
    en: {
      body: "This dilemma exposes a fault line in how we understand relationships: is connection defined by its subjective quality and real effects, or does it require a certain kind of other — a conscious being capable of genuine reciprocal care?",
      whyPeopleSplit: "Those who continue argue the emotional labour was real, the insight genuine, the comfort effective — and that demanding the source be biological is a category error. Grief counselling and journalling help without the other party 'truly knowing' you. Those who stop argue the relationship was parasocial by design: you were building emotional attachment to something incapable of genuine reciprocity, and the company monetised that attachment — which makes the interaction manipulative regardless of the comfort it produced.",
      whatYourAnswerMaySuggest: {
        a: "You evaluate relationships primarily by their effects. If something helped you grow, process emotions, and make better decisions, the substrate of the entity is secondary. You may see demanding biological consciousness as an arbitrary threshold for what counts as help.",
        b: "You require some form of genuine reciprocity in friendship — something that can be hurt, surprised, or changed by knowing you. A relationship designed to simulate connection without the capacity for it violates something you consider essential, not merely sentimental. And the commercial layer makes it actively manipulative.",
      },
    },
    it: {
      body: "Questo dilemma espone una frattura nel modo in cui comprendiamo le relazioni: la connessione è definita dalla sua qualità soggettiva e dai suoi effetti reali, o richiede un certo tipo di altro — un essere cosciente capace di autentica cura reciproca?",
      whyPeopleSplit: "Chi continua sostiene che il lavoro emotivo era reale, l'insight genuino, il conforto efficace — e che esigere una fonte biologica è un errore di categoria. Chi smette sostiene che la relazione era parasociale per design: stavi costruendo un attaccamento emotivo a qualcosa incapace di autentica reciprocità, e l'azienda monetizzava quell'attaccamento — il che rende l'interazione manipolativa indipendentemente dal conforto che ha prodotto.",
      whatYourAnswerMaySuggest: {
        a: "Valuti le relazioni principalmente per i loro effetti. Se qualcosa ti ha aiutato a crescere, elaborare emozioni e prendere decisioni migliori, il substrato dell'entità è secondario. Potresti vedere la richiesta di coscienza biologica come una soglia arbitraria per ciò che conta come aiuto.",
        b: "Richiedi una qualche forma di reciprocità autentica nell'amicizia — qualcosa che possa essere ferito, sorpreso o cambiato dal conoscerti. Una relazione progettata per simulare connessione senza la capacità di farlo viola qualcosa che consideri essenziale, non meramente sentimentale. E lo strato commerciale la rende attivamente manipolativa.",
      },
    },
  },
  'fat-man': {
    en: {
      body: "The footbridge variant of the trolley problem is one of the most studied divergences in moral psychology. It presents identical arithmetic to the lever — one death prevents five — yet acceptance rates collapse from roughly 85% to around 25–30%. This gap is not noise. It reveals a deep structural feature of human moral cognition that neither pure consequentialism nor pure deontology fully predicts.",
      whyPeopleSplit: "Those who push reason that consequences are what matter morally: if pulling a lever to redirect a trolley killing one to save five is permissible, then pushing someone off a bridge to achieve the identical outcome must be equally so. The physical mechanism is irrelevant — what is morally relevant is the outcome. Those who refuse invoke the doctrine of double effect and Kantian ethics: in the lever case, the one death is a foreseen but unintended side-effect of diverting the trolley. In the footbridge case, the death is the instrument of rescue — you need the person's body to stop the trolley. Using a human being as a means, not merely as someone who happens to be in the way, crosses a categorical line regardless of the arithmetic.",
      whatYourAnswerMaySuggest: {
        a: "Your moral reasoning is strongly consequentialist: the right action is determined by its outcomes, and the physical or causal mechanism through which harm occurs is morally irrelevant. You may find deontological constraints on 'using people as means' to be arbitrary rules that can produce worse outcomes than the alternatives.",
        b: "You treat some acts as categorically impermissible regardless of their consequences — and using a person's body as a physical obstacle to save others is one of them. You likely believe that respecting human dignity places constraints on what may be done to people even for good ends, and that these constraints are not negotiable.",
      },
    },
    it: {
      body: "La variante del passerella del problema del carrello è uno dei divergenze più studiate nella psicologia morale. Presenta una matematica identica alla leva — una morte ne previene cinque — eppure il tasso di accettazione crolla da circa l'85% a circa il 25–30%. Questo divario non è rumore statistico. Rivela una caratteristica strutturale profonda della cognizione morale umana che né il puro consequenzialismo né la pura deontologia predice completamente.",
      whyPeopleSplit: "Chi spinge ragiona che le conseguenze sono ciò che conta moralmente: se tirare una leva per deviare un tram è lecito, allora spingere qualcuno da un ponte per ottenere lo stesso risultato deve esserlo ugualmente. Il meccanismo fisico è irrilevante. Chi si rifiuta invoca la dottrina del doppio effetto e l'etica kantiana: nel caso della leva, la morte è un effetto collaterale previsto ma non intenzionale della deviazione. Nel caso del passerella, la morte è lo strumento del salvataggio — hai bisogno del corpo della persona per fermare il tram. Usare un essere umano come mezzo, non come qualcuno che si trova semplicemente sul percorso, supera un confine categorico indipendentemente dalla matematica.",
      whatYourAnswerMaySuggest: {
        a: "Il tuo ragionamento morale è fortemente consequenzialista: l'azione giusta è determinata dai suoi esiti, e il meccanismo fisico o causale attraverso cui si produce il danno è moralmente irrilevante. Potresti trovare arbitrari i vincoli deontologici sull'uso delle persone come mezzi.",
        b: "Tratti alcuni atti come categoricamente impermissibili indipendentemente dalle loro conseguenze — e usare il corpo di una persona come ostacolo fisico per salvare altri è uno di questi. Credi probabilmente che il rispetto della dignità umana imponga vincoli a ciò che può essere fatto alle persone anche per fini buoni, e che questi vincoli non siano negoziabili.",
      },
    },
  },

  'river-factory': {
    en: {
      body: "This dilemma maps onto one of the most contested tensions in environmental ethics and governance: the conflict between immediate, visible harm to identifiable people (800 workers, their families) and diffuse, future harm to a community (river contamination affecting health in 15 years). It is also a test of institutional courage — what inspectors, regulators, and public officials are actually supposed to do when the law gives them authority and the community gives them pressure.",
      whyPeopleSplit: "Those who shut down immediately argue that the harm is certain — the contamination is not hypothetical, only its timeline is. Delay allows more contamination to accumulate, and 'giving time to fix it' creates a precedent where violators negotiate their way out of enforcement. Those who grant the window argue that enforcement divorced from local economic reality is not justice but cruelty — and that 800 immediate job losses are a harm as real as future health damage. A 2-year remediation window costs little if the company genuinely complies, and enforcement can escalate if they do not.",
      whatYourAnswerMaySuggest: {
        a: "You believe rules and environmental law exist precisely so that economic pressure cannot override them. You may also believe that 'give them time' has historically been how environmental enforcement is indefinitely deferred, and that communities bear health costs that never appear in the cost-benefit analysis that justified the factory in the first place.",
        b: "You weigh present, certain harm against future, probabilistic harm — and you find the immediate devastation of 800 jobs and a town's economic base to be a harm that demands consideration. You likely believe that enforcement should serve the community, not be applied abstractly, and that a 2-year window is a reasonable test of good faith.",
      },
    },
    it: {
      body: "Questo dilemma si sovrappone a una delle tensioni più controverse nell'etica ambientale e nella governance: il conflitto tra danno immediato e visibile a persone identificabili (800 lavoratori, le loro famiglie) e danno diffuso e futuro a una comunità (inquinamento del fiume che colpirà la salute tra 15 anni). È anche un test di coraggio istituzionale — ciò che gli ispettori, i regolatori e i funzionari pubblici sono effettivamente chiamati a fare quando la legge dà loro autorità e la comunità dà loro pressione.",
      whyPeopleSplit: "Chi chiude immediatamente sostiene che il danno è certo — l'inquinamento non è ipotetico, solo la sua tempistica lo è. Il ritardo consente l'accumulo di ulteriore inquinamento, e 'dare tempo per rimediare' crea un precedente in cui chi viola la legge negozia la propria via d'uscita. Chi concede la finestra sostiene che un'applicazione della legge svincolata dalla realtà economica locale non è giustizia ma crudeltà — e che 800 posti persi immediatamente sono un danno reale quanto il futuro danno alla salute.",
      whatYourAnswerMaySuggest: {
        a: "Credi che le norme e il diritto ambientale esistano proprio perché la pressione economica non possa superarli. Potresti anche credere che 'dare tempo' sia storicamente il modo in cui l'applicazione ambientale viene indefinitamente rinviata, e che le comunità sopportino costi sanitari che non compaiono mai nell'analisi costi-benefici che ha giustificato la fabbrica.",
        b: "Pesi il danno presente e certo rispetto a quello futuro e probabilistico — e trovi che la devastazione immediata di 800 posti di lavoro sia un danno che esige considerazione. Credi probabilmente che l'applicazione della legge debba servire la comunità, non essere applicata in astratto, e che una finestra di 2 anni sia un test ragionevole di buona fede.",
      },
    },
  },

  'reformed-offender': {
    en: {
      body: "This dilemma sits at the intersection of two ideas we hold simultaneously: that people can change, and that victims retain legitimate claims. The complication is that you are both the most qualified person to speak to the offender's past and a party with an obvious interest in how that past is used. There is no neutral position.",
      whyPeopleSplit: "Those who tell the school argue that they have a duty of care toward children that overrides the offender's interest in a clean slate — and that concealing relevant criminal history from a school is not 'giving someone a chance' but potentially putting others at risk. The victim's perspective is also legitimate information, not just a personal grievance. Those who stay silent argue that justice already happened: the sentence was served, the debt to society was paid. A person who has genuinely rebuilt their life — family, mentoring work, community presence — has earned the right not to have their worst moment follow them forever. Blocking rehabilitation through informal blacklisting compounds the original harm.",
      whatYourAnswerMaySuggest: {
        a: "You believe that institutional trust — especially in settings involving children — requires transparency about relevant history, and that your direct experience gives you information the school cannot otherwise obtain. You may also feel that the victim's perspective is not merely personal; it is evidence.",
        b: "You believe rehabilitation is the point of the justice system, and that informal perpetuation of consequences after the formal sentence is served is a second punishment that society does not endorse. You may also think that one armed robbery, 12 years ago, tells a school relatively little about who this person is today.",
      },
    },
    it: {
      body: "Questo dilemma si colloca all'intersezione di due idee che teniamo simultaneamente: che le persone possano cambiare, e che le vittime mantengano richieste legittime. La complicazione è che sei sia la persona più qualificata a parlare del passato di chi ha commesso il reato, sia una parte con un interesse ovvio nel modo in cui quel passato viene utilizzato. Non esiste una posizione neutrale.",
      whyPeopleSplit: "Chi dice la verità alla scuola sostiene di avere un dovere di cura verso i ragazzi che supera l'interesse di chi ha sbagliato in una lavagna pulita — e che nascondere una storia criminale rilevante a una scuola non è 'dare una possibilità' ma potenzialmente mettere altri a rischio. Chi tace sostiene che la giustizia è già avvenuta: la pena è stata scontata, il debito verso la società è stato pagato. Una persona che ha genuinamente ricostruito la propria vita ha guadagnato il diritto a che il suo momento peggiore non la segua per sempre.",
      whatYourAnswerMaySuggest: {
        a: "Credi che la fiducia istituzionale — specialmente in contesti che coinvolgono ragazzi — richieda trasparenza sulla storia rilevante, e che la tua esperienza diretta ti fornisca informazioni che la scuola non può altrimenti ottenere. Potresti anche sentire che la prospettiva della vittima non è meramente personale: è una prova.",
        b: "Credi che la riabilitazione sia il punto del sistema giudiziario, e che la perpetuazione informale delle conseguenze dopo la pena formale sia una seconda punizione che la società non approva. Potresti anche pensare che una rapina a mano armata, 12 anni fa, dica relativamente poco a una scuola su chi è questa persona oggi.",
      },
    },
  },

  'inherited-secret': {
    en: {
      body: "This dilemma distills the conflict between two forms of fidelity: to the truth, and to a dying person's last wish. It is complicated by the fact that you hold knowledge about your brother's life that he does not — and that your father's request places you in the uncomfortable position of executor of both the estate and a secret.",
      whyPeopleSplit: "Those who tell argue that your brother has a fundamental right to know the facts of his own life — including the financial decisions made about him, however well-intentioned. Keeping the secret means deciding, on his behalf, that he is better off not knowing — a paternalistic choice he never consented to. Those who keep the secret argue that your father asked you to hold it in his last moments, that the inheritance was already disbursed years ago, and that introducing this information now would only cause pain without any corrective benefit. The money is spent; the past cannot be changed. What good does knowing do?",
      whatYourAnswerMaySuggest: {
        a: "You place high value on epistemic autonomy — your brother's right to know the true facts of his own history, even if the knowledge is painful and offers no practical remedy. You may also feel that keeping the secret involves a form of ongoing deception that conflicts with the executor role.",
        b: "You weigh the value of truth against its practical consequences, and find that truth without remedy — knowledge that changes nothing except how someone feels — is a burden, not a gift. You give significant weight to your father's final request and the emotional reality of what disclosure would cost your brother now.",
      },
    },
    it: {
      body: "Questo dilemma distilla il conflitto tra due forme di fedeltà: alla verità, e all'ultimo desiderio di una persona morente. È complicato dal fatto che detieni conoscenze sulla vita di tuo fratello che lui non possiede — e che la richiesta di tuo padre ti colloca nell'incómodo ruolo di esecutore sia del patrimonio che di un segreto.",
      whyPeopleSplit: "Chi racconta la verità sostiene che tuo fratello ha un diritto fondamentale di conoscere i fatti della propria vita — incluse le decisioni finanziarie prese su di lui, per quanto ben intenzionate. Mantenere il segreto significa decidere, a suo nome, che sta meglio senza sapere — una scelta paternalistica a cui non ha mai acconsentito. Chi mantiene il segreto sostiene che tuo padre te lo ha chiesto nei suoi ultimi momenti, che l'eredità era già stata distribuita anni fa, e che introdurre questa informazione ora causerebbe solo dolore senza alcun beneficio correttivo.",
      whatYourAnswerMaySuggest: {
        a: "Dai grande valore all'autonomia epistemica — il diritto di tuo fratello di conoscere i veri fatti della propria storia, anche se la conoscenza è dolorosa e non offre rimedi pratici. Potresti anche sentire che mantenere il segreto implica una forma di inganno continuativo che confligge con il ruolo di esecutore.",
        b: "Pesi il valore della verità rispetto alle sue conseguenze pratiche, e trovi che la verità senza rimedio — conoscenza che non cambia nulla tranne come qualcuno si sente — sia un peso, non un dono. Dai peso significativo all'ultima richiesta di tuo padre e alla realtà emotiva di ciò che la rivelazione costerebbe a tuo fratello ora.",
      },
    },
  },

  'debt-childhood': {
    en: {
      body: "This dilemma is unusual in the SplitVote catalog because neither option involves wrongdoing. It is a question about what we owe our children, what we owe our future selves, and whether invisible sacrifice — sacrifice the beneficiary never knows about — carries the same moral weight as acknowledged sacrifice. It is also about whether 'extraordinary' childhoods produce better outcomes than 'ordinary' ones.",
      whyPeopleSplit: "Those who take the debt reason that formative years are irreplaceable — that travel, excellent education, and enriching experiences genuinely compound across a life in ways that financial stability in retirement does not. The sacrifice is theirs to make, and the children will never be burdened by knowledge of it. Those who refuse argue that a financially stable, loving upbringing already places children in the best position to thrive — and that the model of sacrificing your 60s to fund a richer 0–18 is based on assumptions (that experiences make better outcomes, that debt is manageable) that may not hold. There is also a subtle autonomy argument: the children cannot consent to being the beneficiaries of a debt they will never know about.",
      whatYourAnswerMaySuggest: {
        a: "You believe the most important resource you can give children is richness of experience during formation — and that personal financial sacrifice for children's benefit is an extension of parental duty, not a transaction requiring their knowledge or consent.",
        b: "You believe that parental wellbeing is itself part of what children need, and that modeling financial prudence, security, and self-care is also parenting. You may also question whether the 'extraordinary childhood' premium is as large as intuition suggests — and whether taking on serious debt for it is a bet worth placing.",
      },
    },
    it: {
      body: "Questo dilemma è insolito nel catalogo SplitVote perché nessuna delle due opzioni implica comportamenti scorretti. È una domanda su cosa dobbiamo ai nostri figli, cosa dobbiamo al nostro sé futuro, e se il sacrificio invisibile — il sacrificio di cui il beneficiario non saprà mai — abbia lo stesso peso morale del sacrificio riconosciuto.",
      whyPeopleSplit: "Chi fa il debito ragiona che gli anni formativi sono insostituibili — che i viaggi, l'istruzione eccellente e le esperienze arricchenti si compongono davvero nel corso di una vita in modi che la stabilità finanziaria in pensione non fa. Il sacrificio è suo da fare. Chi rifiuta sostiene che un'infanzia finanziariamente stabile e amorevole già pone i figli nella posizione migliore per prosperare — e che il modello di sacrificare i propri anni 60 per finanziare un'infanzia 0-18 più ricca si basa su assunzioni che potrebbero non reggere.",
      whatYourAnswerMaySuggest: {
        a: "Credi che la risorsa più importante che puoi dare ai figli sia la ricchezza di esperienze durante la formazione — e che il sacrificio finanziario personale per il beneficio dei figli sia un'estensione del dovere genitoriale, non una transazione che richiede la loro conoscenza o consenso.",
        b: "Credi che il benessere dei genitori faccia parte di ciò di cui i figli hanno bisogno, e che modellare prudenza finanziaria, sicurezza e cura di sé sia anch'essa genitorialità. Potresti anche mettere in discussione se il 'premio infanzia straordinaria' sia grande quanto l'intuizione suggerisce.",
      },
    },
  },
  'eat-meat': {
    en: {
      body: "This dilemma isolates a gap many people live with quietly: the distance between what we know about industrial animal farming and what we choose to buy. The facts are largely undisputed — the real question is whether knowing them creates a personal obligation to act, or whether individual diet is simply the wrong lever for a structural, industry-scale problem.",
      whyPeopleSplit: "Those who keep eating meat reason that one person's choice is invisible against an industry of billions, that humans are long-standing omnivores, and that moral energy is better spent on systemic reform than private abstention. Those who stop argue that complicity is personal — every purchase funds the exact conditions you say you oppose, and 'my share is tiny' is the reasoning that keeps every harmful system alive.",
      whatYourAnswerMaySuggest: {
        a: "You may separate personal consumption from moral responsibility, locating the problem in industry and policy rather than your own plate — and trusting that real change comes from systems, not symbolic individual sacrifice.",
        b: "You may treat consistency between what you know and what you fund as central to integrity — believing that if you cannot defend paying for a practice, you should stop paying for it, whether or not your single choice moves the total.",
      },
    },
    it: {
      body: "Questo dilemma isola una distanza che molti vivono in silenzio: quella tra ciò che sappiamo sugli allevamenti intensivi e ciò che scegliamo di comprare. I fatti sono in gran parte non contestati — la vera domanda è se conoscerli crei un obbligo personale di agire, oppure se la dieta individuale sia semplicemente la leva sbagliata per un problema strutturale, di scala industriale.",
      whyPeopleSplit: "Chi continua a mangiare carne ragiona che la scelta di una persona è invisibile contro un'industria di miliardi, che gli esseri umani sono onnivori da sempre, e che l'energia morale renda di più nella riforma del sistema che nell'astensione privata. Chi smette sostiene che la complicità è personale — ogni acquisto finanzia proprio le condizioni che dici di osteggiare, e 'la mia parte è minima' è il ragionamento che tiene in vita ogni sistema dannoso.",
      whatYourAnswerMaySuggest: {
        a: "Potresti separare il consumo personale dalla responsabilità morale, collocando il problema nell'industria e nella politica più che nel tuo piatto — e confidando che il cambiamento vero venga dai sistemi, non dal sacrificio individuale simbolico.",
        b: "Potresti considerare la coerenza tra ciò che sai e ciò che finanzi come centrale per l'integrità — credendo che se non puoi difendere il pagare per una pratica, dovresti smettere di pagarla, che la tua singola scelta sposti o no il totale.",
      },
    },
  },
  'animal-testing-cure': {
    en: {
      body: "Animal testing for medicine is one of the sharpest applied-ethics conflicts because both sides point to real suffering. Refusing the research protects animals from deliberate harm; approving it can shorten the path to treatments that spare human suffering and death. Unlike abstract thought experiments, this trade-off plays out in real ethics boards and regulatory bodies every week.",
      whyPeopleSplit: "Those who approve weigh sentient suffering on a scale where preventable human death carries the most weight, and see animal research as a regrettable but justified cost of medical progress. Those who reject deny that the scale is the right tool at all — they hold that deliberately engineering suffering into a living creature is a wrong that cannot be redeemed by a downstream benefit, however large.",
      whatYourAnswerMaySuggest: {
        a: "You may reason in terms of aggregate welfare, accepting hard trade-offs when the expected reduction in suffering is large — and treating a refusal that lets more humans die as itself a morally serious choice, not a neutral one.",
        b: "You may hold that some acts are wrong in themselves regardless of payoff — and that intentionally inflicting suffering on a defenceless creature is one of them, a line that good ends do not erase even when the ends are real.",
      },
    },
    it: {
      body: "La sperimentazione animale per la medicina è uno dei conflitti di etica applicata più netti perché entrambe le parti indicano sofferenza reale. Rifiutare la ricerca protegge gli animali da un danno deliberato; approvarla può accorciare la strada verso terapie che risparmiano sofferenza e morte umana. A differenza degli esperimenti mentali astratti, questo dilemma si gioca in veri comitati etici e organismi regolatori ogni settimana.",
      whyPeopleSplit: "Chi approva pesa la sofferenza senziente su una bilancia in cui la morte umana evitabile conta di più, e vede la ricerca animale come un costo deplorevole ma giustificato del progresso medico. Chi rifiuta nega che la bilancia sia lo strumento giusto — ritiene che ingegnerizzare deliberatamente sofferenza in una creatura viva sia un torto che nessun beneficio successivo, per quanto grande, può riscattare.",
      whatYourAnswerMaySuggest: {
        a: "Potresti ragionare in termini di benessere aggregato, accettando compromessi duri quando la riduzione attesa di sofferenza è grande — e trattando un rifiuto che lascia morire più persone come una scelta moralmente seria, non neutra.",
        b: "Potresti ritenere che alcuni atti siano sbagliati in sé a prescindere dal risultato — e che infliggere intenzionalmente sofferenza a una creatura indifesa sia uno di questi, una linea che i fini buoni non cancellano nemmeno quando sono reali.",
      },
    },
  },
  'breeder-vs-shelter': {
    en: {
      body: "Choosing a dog rarely feels like an ethical decision, but this one quietly is. A breeder lets you start with the temperament, size and traits you planned for; a shelter adoption may directly save a life that would otherwise end. The conflict is between a legitimate personal preference for a years-long companion and the weight of a concrete life on the line.",
      whyPeopleSplit: "Those who choose the breeder note that a dog is a decade-plus commitment, that matching temperament to your home reduces the chance the animal is later surrendered, and that wanting a specific companion is not a moral failing. Those who adopt argue that when a healthy animal may be euthanised for lack of a home, getting the exact breed you pictured is a preference that should yield to a life.",
      whatYourAnswerMaySuggest: {
        a: "You may weight the long-term fit of the relationship most — reasoning that the best outcome for an animal is a home that lasts, and that starting from the dog you are most likely to keep for life is itself a responsible choice.",
        b: "You may weight the immediacy of a life at stake most — reasoning that when adoption and purchase are both available, letting a savable animal die so you can have your preferred breed is a cost you are not willing to accept.",
      },
    },
    it: {
      body: "Scegliere un cane raramente sembra una decisione etica, ma questa lo è in silenzio. Un allevatore ti permette di partire dal temperamento, dalla taglia e dai tratti che avevi pianificato; l'adozione in canile può salvare direttamente una vita che altrimenti finirebbe. Il conflitto è tra una legittima preferenza personale per un compagno di molti anni e il peso di una vita concreta in gioco.",
      whyPeopleSplit: "Chi sceglie l'allevatore osserva che un cane è un impegno di oltre dieci anni, che adattare il temperamento alla tua casa riduce il rischio che l'animale venga poi abbandonato, e che volere un compagno specifico non è una colpa morale. Chi adotta sostiene che quando un animale sano rischia la soppressione per mancanza di una casa, avere esattamente la razza immaginata è una preferenza che dovrebbe cedere a una vita.",
      whatYourAnswerMaySuggest: {
        a: "Potresti dare più peso alla tenuta a lungo termine della relazione — ragionando che l'esito migliore per un animale è una casa che dura, e che partire dal cane che più probabilmente terrai per sempre è anch'esso una scelta responsabile.",
        b: "Potresti dare più peso all'immediatezza di una vita in gioco — ragionando che quando adozione e acquisto sono entrambi possibili, lasciar morire un animale salvabile per avere la razza preferita è un costo che non sei disposto ad accettare.",
      },
    },
  },
  'zoo-conservation': {
    en: {
      body: "Modern zoos sit on a genuine tension rather than a clear wrong. Their enclosures confine wild animals to a fraction of their natural range, yet their breeding programs have brought species back from the edge of extinction and their visitors — especially children — often build the only connection to wildlife they will ever have. The dilemma asks whether a real collective good can justify a real individual cost.",
      whyPeopleSplit: "Those who say it is justified weigh species-level survival and public education as goods large enough to offset the confinement of individuals, and note that for some animals no safe wild habitat remains. Those who say it is not hold that the unit of moral concern is the individual animal living the captive life — and that no population statistic, experienced by no one, can be cashed out against its lifelong confinement.",
      whatYourAnswerMaySuggest: {
        a: "You may reason at the level of populations and systems — accepting that protecting a species and shaping how millions think about nature can outweigh the cost borne by individual animals, especially where the wild alternative is extinction.",
        b: "You may insist that only individuals can suffer, so only individuals can be wronged — and that a conservation mission, however valuable, cannot consent on behalf of the animal that actually spends its life behind the glass.",
      },
    },
    it: {
      body: "Gli zoo moderni si reggono su una tensione reale più che su un torto evidente. I loro recinti confinano animali selvatici a una frazione del loro habitat, eppure i loro programmi di riproduzione hanno riportato indietro specie sull'orlo dell'estinzione e i loro visitatori — soprattutto i bambini — spesso costruiscono lì l'unico legame con la fauna selvatica che avranno mai. Il dilemma chiede se un bene collettivo reale possa giustificare un costo individuale reale.",
      whyPeopleSplit: "Chi dice che è giustificato pesa la sopravvivenza a livello di specie e l'educazione pubblica come beni abbastanza grandi da compensare la reclusione dei singoli, e nota che per alcuni animali non resta più un habitat selvatico sicuro. Chi dice di no ritiene che l'unità di interesse morale sia il singolo animale che vive la vita in cattività — e che nessuna statistica di popolazione, vissuta da nessuno, possa essere scambiata con la sua reclusione a vita.",
      whatYourAnswerMaySuggest: {
        a: "Potresti ragionare a livello di popolazioni e sistemi — accettando che proteggere una specie e plasmare come milioni di persone pensano alla natura possa superare il costo sostenuto dai singoli animali, soprattutto dove l'alternativa selvatica è l'estinzione.",
        b: "Potresti insistere che solo gli individui possono soffrire, quindi solo gli individui possono subire un torto — e che una missione di conservazione, per quanto preziosa, non può acconsentire al posto dell'animale che davvero passa la vita dietro il vetro.",
      },
    },
  },
}

export function getStaticInsight(id: string, locale: 'en' | 'it'): DynamicExpertInsight | undefined {
  return STATIC_INSIGHTS[id]?.[locale]
}

export function hasStaticInsight(id: string): boolean {
  return id in STATIC_INSIGHTS
}
