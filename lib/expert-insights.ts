import type { Category } from '@/lib/scenarios'

export interface ExpertPerspective {
  a: string
  b: string
}

export interface ExpertInsight {
  title: string
  expertType: string
  body: string
  whyPeopleSplit: string
  whatYourAnswerMaySuggest: ExpertPerspective
  disclaimer: string
}

// Partial insight from AI-generated dynamic scenarios (overrides static fallback).
// body/whyPeopleSplit/perspectives are scenario-specific — title/expertType/disclaimer stay static.
export interface DynamicExpertInsight {
  body?: string
  whyPeopleSplit?: string
  whatYourAnswerMaySuggest?: ExpertPerspective
}

type LocaleInsight = { en: ExpertInsight; it: ExpertInsight }
type InsightMap = Record<Category, LocaleInsight>

const INSIGHTS: InsightMap = {
  morality: {
    en: {
      title: 'Expert Insight',
      expertType: 'Ethics',
      body: 'The trolley problem has been studied for decades — and the world never converges. Not because people are inconsistent, but because two coherent frameworks genuinely conflict. Consequentialism counts lives. Deontology holds that some acts are categorically forbidden regardless of outcome. Both have serious philosophical defenders, and neither wins cleanly.',
      whyPeopleSplit: 'People who think carefully about this end up on both sides. The difference isn\'t how much someone reasons — it\'s which ethical "rule" feels more fundamental to them. That\'s shaped by culture, upbringing, and what they\'ve seen happen when systems are given the power to decide.',
      whatYourAnswerMaySuggest: {
        a: 'Choosing this may suggest you reason from outcomes — when the numbers are this stark, acting to reduce harm feels more defensible than inaction.',
        b: 'Choosing this may suggest some lines feel categorically off-limits to you — that crossing them would be a violation, even if the math points the other way.',
      },
      disclaimer: 'Educational perspective, not professional advice.',
    },
    it: {
      title: 'Parere esperto',
      expertType: 'Etica',
      body: 'Il problema del trolley è studiato da decenni — e il mondo non converge mai. Non perché le persone siano incoerenti, ma perché due framework coerenti sono genuinamente in conflitto. Il consequenzialismo conta vite. La deontologia sostiene che certe azioni sono categoricamente vietate indipendentemente dall\'esito. Entrambi hanno difensori seri, e nessuno vince in modo netto.',
      whyPeopleSplit: 'Chi ragiona attentamente su questo finisce su entrambi i lati. La differenza non sta in quanta attenzione si mette — ma in quale "regola" etica si sente più fondamentale. Questo è plasmato dalla cultura, dall\'educazione e da cosa si è visto fare ai sistemi quando hanno avuto il potere di decidere.',
      whatYourAnswerMaySuggest: {
        a: 'Scegliere questo potrebbe suggerire che ragioni dagli esiti — quando i numeri sono così drastici, agire per ridurre il danno sembra più difendibile dell\'inazione.',
        b: 'Scegliere questo potrebbe suggerire che certi confini ti sembrano categoricamente invalicabili — che attraversarli sarebbe una violazione, anche se la matematica punta nell\'altra direzione.',
      },
      disclaimer: 'Contenuto educativo, non consulenza professionale.',
    },
  },
  justice: {
    en: {
      title: 'Expert Insight',
      expertType: 'Political Philosophy',
      body: 'Rawls proposed a thought experiment: design a justice system without knowing where you\'ll end up in it — rich or poor, majority or minority. Most people\'s answers shift dramatically under that constraint. The gap between "justice for me" and "justice for everyone" is where most real political conflicts actually live.',
      whyPeopleSplit: 'People weight procedure versus outcome differently. If a fair process produces an unfair result — or an unfair process produces a fair result — which matters more? Both positions have centuries of philosophical support, and neither resolves without a prior value commitment.',
      whatYourAnswerMaySuggest: {
        a: 'This choice may suggest you trust well-designed rules over case-by-case judgment — that protecting process integrity is worth it even when an individual outcome looks imperfect.',
        b: 'This choice may suggest you weight outcomes over process — that what people actually end up with matters more than whether the procedure was technically correct.',
      },
      disclaimer: 'Educational perspective, not professional advice.',
    },
    it: {
      title: 'Parere esperto',
      expertType: 'Filosofia Politica',
      body: 'Rawls propose un esperimento mentale: progetta un sistema di giustizia senza sapere dove finirai — ricco o povero, maggioranza o minoranza. Le risposte cambiano drasticamente sotto quel vincolo. Il divario tra "giustizia per me" e "giustizia per tutti" è dove vivono la maggior parte dei conflitti politici reali.',
      whyPeopleSplit: 'Le persone pesano diversamente processo e risultato. Se un processo equo produce un esito ingiusto — o un processo ingiusto produce un esito equo — quale conta di più? Entrambe le posizioni hanno secoli di sostegno filosofico, e nessuna si risolve senza un impegno di valore preliminare.',
      whatYourAnswerMaySuggest: {
        a: 'Questa scelta potrebbe suggerire che ti fidi di regole ben progettate più che del giudizio caso per caso — che proteggere l\'integrità del processo valga la pena anche quando un singolo esito sembra imperfetto.',
        b: 'Questa scelta potrebbe suggerire che dai più peso agli esiti che al processo — che ciò con cui le persone finiscono conta di più di quanto la procedura fosse tecnicamente corretta.',
      },
      disclaimer: 'Contenuto educativo, non consulenza professionale.',
    },
  },
  relationships: {
    en: {
      title: 'Expert Insight',
      expertType: 'Psychology',
      body: 'Research consistently shows that emotional safety and honesty are not naturally aligned in close relationships. The most direct people aren\'t always the most trusted. Timing, tone, and framing often shape the impact of truth-telling more than the content itself — and high-trust relationships require learning that distinction, not ignoring it.',
      whyPeopleSplit: 'Some people believe honoring someone\'s autonomy means telling them the truth, even when it\'s hard. Others believe protecting the relationship is itself a form of respect — and that some truths are absorbed better over time than delivered all at once. Both are genuine expressions of care.',
      whatYourAnswerMaySuggest: {
        a: 'This choice may suggest you see directness as a form of respect — that even difficult truths, delivered with care, honour the other person\'s right to know where they stand.',
        b: 'This choice may suggest you weight relational safety highly — that the long-term health of the bond sometimes takes precedence over the immediate delivery of a hard truth.',
      },
      disclaimer: 'Educational perspective, not professional advice.',
    },
    it: {
      title: 'Parere esperto',
      expertType: 'Psicologia',
      body: 'La ricerca mostra costantemente che sicurezza emotiva e onestà non sono naturalmente allineate nelle relazioni strette. Le persone più dirette non sono sempre le più di fiducia. Il momento, il tono e la formulazione spesso plasmano l\'impatto di ciò che si dice più del contenuto stesso — e le relazioni solide richiedono di imparare questa distinzione, non di ignorarla.',
      whyPeopleSplit: 'Alcune persone credono che rispettare l\'autonomia di qualcuno significhi dirgli la verità, anche quando è difficile. Altre credono che proteggere la relazione sia essa stessa una forma di rispetto — e che alcune verità vengano assorbite meglio nel tempo che consegnate tutte insieme. Entrambe sono espressioni genuine di cura.',
      whatYourAnswerMaySuggest: {
        a: 'Questa scelta potrebbe suggerire che vedi la franchezza come una forma di rispetto — che anche le verità difficili, dette con cura, onorano il diritto dell\'altra persona di sapere dove si trova.',
        b: 'Questa scelta potrebbe suggerire che dai molto peso alla sicurezza relazionale — che la salute a lungo termine del legame a volte ha la precedenza sulla consegna immediata di una verità difficile.',
      },
      disclaimer: 'Contenuto educativo, non consulenza professionale.',
    },
  },
  technology: {
    en: {
      title: 'Expert Insight',
      expertType: 'Tech Ethics',
      body: 'Every major technology — from the printing press to social media — was adopted before societies understood its second-order effects. The speed of deployment systematically outpaces the development of norms, laws, and accountability. That\'s not a bug. It\'s a structural feature of how innovation works — and it means the risks are always partially unknown at the moment of adoption.',
      whyPeopleSplit: 'Innovation optimists trust that problems will be solvable after adoption — and point to technologies that turned out net positive. Precautionary voices note that some failure modes are irreversible, and the damage cannot be undone once it scales. Both camps are citing real history. They just chose different examples.',
      whatYourAnswerMaySuggest: {
        a: 'This choice may suggest you trust adaptive problem-solving — that societies learn by doing, and the benefits of early capability outweigh the costs of waiting for certainty.',
        b: 'This choice may suggest you treat irreversibility as a hard constraint — that some risks aren\'t worth running before we have better answers about what we\'re actually dealing with.',
      },
      disclaimer: 'Educational perspective, not professional advice.',
    },
    it: {
      title: 'Parere esperto',
      expertType: 'Etica Tech',
      body: 'Ogni grande tecnologia — dalla stampa ai social media — è stata adottata prima che le società ne capissero gli effetti di secondo ordine. La velocità di diffusione supera sistematicamente lo sviluppo di norme, leggi e responsabilità. Non è un difetto. È una caratteristica strutturale di come funziona l\'innovazione — e significa che i rischi sono sempre parzialmente sconosciuti al momento dell\'adozione.',
      whyPeopleSplit: 'Gli ottimisti dell\'innovazione si fidano che i problemi saranno risolvibili dopo l\'adozione — e citano tecnologie che si sono rivelate positive. Le voci precauzionali notano che alcune modalità di fallimento sono irreversibili e il danno non può essere riparato una volta che scala. Entrambi i campi citano storia reale. Hanno solo scelto esempi diversi.',
      whatYourAnswerMaySuggest: {
        a: 'Questa scelta potrebbe suggerire che ti fidi della risoluzione adattiva dei problemi — che le società imparano facendo, e i benefici della capacità precoce superano i costi dell\'attesa della certezza.',
        b: 'Questa scelta potrebbe suggerire che tratti l\'irreversibilità come un vincolo rigido — che certi rischi non valga la pena correre prima di avere risposte migliori su cosa stiamo davvero affrontando.',
      },
      disclaimer: 'Contenuto educativo, non consulenza professionale.',
    },
  },
  society: {
    en: {
      title: 'Expert Insight',
      expertType: 'Sociology',
      body: 'Every society draws an implicit line between what individuals owe each other and what they owe themselves. That line shifts with crises, cultural memory, and what people have recently seen collective power do. There\'s no neutral position — the question is never whether the line exists, but where you draw it and who gets to move it.',
      whyPeopleSplit: 'Your answer often reflects what you\'ve seen systems do with power. If collective action produced something good in your experience, you extend more trust to it. If it produced something coercive or failed the people it claimed to protect, you defend individual limits harder. Both are rational responses to different histories.',
      whatYourAnswerMaySuggest: {
        a: 'This choice may suggest you see collective responsibility as a real solution — that shared problems sometimes need shared mechanisms, even at some cost to individual freedom.',
        b: 'This choice may suggest you\'re wary of what happens when collective power is applied broadly — that individuals are the unit that matters, and systems should serve them, not the reverse.',
      },
      disclaimer: 'Educational perspective, not professional advice.',
    },
    it: {
      title: 'Parere esperto',
      expertType: 'Sociologia',
      body: 'Ogni società traccia una linea implicita tra ciò che gli individui si devono a vicenda e ciò che devono a se stessi. Quella linea si sposta con le crisi, la memoria culturale e cosa le persone hanno visto fare al potere collettivo di recente. Non esiste una posizione neutrale — la domanda non è mai se la linea esiste, ma dove la tracci e chi può spostarla.',
      whyPeopleSplit: 'La tua risposta riflette spesso cosa hai visto fare ai sistemi con il potere. Se l\'azione collettiva ha prodotto qualcosa di buono nella tua esperienza, estendi più fiducia. Se ha prodotto qualcosa di coercitivo o ha deluso chi diceva di proteggere, difendi più duramente i limiti individuali. Entrambe sono risposte razionali a storie diverse.',
      whatYourAnswerMaySuggest: {
        a: 'Questa scelta potrebbe suggerire che vedi la responsabilità collettiva come una soluzione reale — che i problemi condivisi a volte richiedono meccanismi condivisi, anche a un certo costo per la libertà individuale.',
        b: 'Questa scelta potrebbe suggerire che sei diffidente verso ciò che accade quando il potere collettivo viene applicato su larga scala — che gli individui sono l\'unità che conta, e i sistemi dovrebbero servirli, non il contrario.',
      },
      disclaimer: 'Contenuto educativo, non consulenza professionale.',
    },
  },
  freedom: {
    en: {
      title: 'Expert Insight',
      expertType: 'Political Philosophy',
      body: '"Freedom" sounds simple until you realize there are at least two incompatible versions of it. Negative freedom: no external constraints. Positive freedom: the actual capacity to act on your choices. A person with formal rights but no resources has one but not the other — and most political conflict is really a hidden dispute over which definition takes priority.',
      whyPeopleSplit: 'Your experience of freedom shapes which version feels most real. If you\'ve been constrained by systems — poverty, discrimination, lack of access — positive freedom (capacity to act) feels urgent. If you\'ve been constrained by interference — surveillance, overreach, coercion — negative freedom (absence of obstacles) feels fundamental. Both are describing real deprivations.',
      whatYourAnswerMaySuggest: {
        a: 'This choice may suggest you prioritize freedom from interference — that the right to make your own choices without external control is what freedom fundamentally means.',
        b: 'This choice may suggest you care about the capacity to act — that formal rights without real opportunity aren\'t worth much, and structures should address that gap.',
      },
      disclaimer: 'Educational perspective, not professional advice.',
    },
    it: {
      title: 'Parere esperto',
      expertType: 'Filosofia Politica',
      body: '"Libertà" sembra semplice finché non ti accorgi che ne esistono almeno due versioni incompatibili. Libertà negativa: assenza di vincoli esterni. Libertà positiva: la capacità concreta di agire sulle proprie scelte. Una persona con diritti formali ma senza risorse ha l\'una ma non l\'altra — e la maggior parte dei conflitti politici è in realtà una disputa nascosta su quale definizione abbia la priorità.',
      whyPeopleSplit: 'La tua esperienza della libertà determina quale versione ti sembra più reale. Se sei stato limitato dai sistemi — povertà, discriminazione, mancanza di accesso — la libertà positiva (capacità di agire) sembra urgente. Se sei stato limitato dall\'interferenza — sorveglianza, coercizione, eccesso di potere — la libertà negativa (assenza di ostacoli) sembra fondamentale. Entrambe descrivono privazioni reali.',
      whatYourAnswerMaySuggest: {
        a: 'Questa scelta potrebbe suggerire che dai priorità alla libertà dall\'interferenza — che il diritto di fare le proprie scelte senza controllo esterno è ciò che la libertà significa fondamentalmente.',
        b: 'Questa scelta potrebbe suggerire che ti interessa la capacità di agire — che i diritti formali senza opportunità reali valgono poco, e le strutture dovrebbero colmare quel divario.',
      },
      disclaimer: 'Contenuto educativo, non consulenza professionale.',
    },
  },
  survival: {
    en: {
      title: 'Expert Insight',
      expertType: 'Decision Science',
      body: 'Under extreme pressure, the brain stops deliberating and executes fast heuristics — emotionally loaded instincts that evolved long before ethical philosophy existed. What surfaces in a survival scenario isn\'t your "real" morality. It\'s your primal priority hierarchy under stress — which may differ significantly from what you\'d choose with time to think.',
      whyPeopleSplit: 'Two deep instincts compete: self-continuity ("I must survive to still be able to help") and kin-protection ("I\'m not whole without the people I love"). Neither is irrational — they\'re different evolutionary bets. Which one activates depends on attachment history, group identity, and the specific framing of the scenario.',
      whatYourAnswerMaySuggest: {
        a: 'This choice may suggest that under maximum pressure, individual survival feels like the most actionable priority — preserving yourself to be present for others later.',
        b: 'This choice may suggest you reason collectively even under stress — that protecting others or maximizing group survival feels more fundamental than personal continuity.',
      },
      disclaimer: 'Educational perspective, not professional advice.',
    },
    it: {
      title: 'Parere esperto',
      expertType: 'Scienze Decisionali',
      body: 'Sotto pressione estrema, il cervello smette di deliberare ed esegue euristiche rapide — istinti emotivamente carichi che si sono evoluti molto prima che esistesse la filosofia etica. Ciò che emerge in uno scenario di sopravvivenza non è la tua "vera" moralità. È la tua gerarchia di priorità primordiali sotto stress — che può differire significativamente da ciò che sceglieresti con tempo per pensare.',
      whyPeopleSplit: 'Due istinti profondi competono: autoconservazione ("devo sopravvivere per poter ancora aiutare") e protezione del gruppo ("non sono intero senza le persone che amo"). Nessuno dei due è irrazionale — sono scommesse evolutive diverse. Quale si attiva dipende dalla storia degli attaccamenti, dall\'identità di gruppo e dall\'inquadramento specifico dello scenario.',
      whatYourAnswerMaySuggest: {
        a: 'Questa scelta potrebbe suggerire che sotto pressione massima, la sopravvivenza individuale sembra la priorità più concretamente azionabile — preservarti per essere presente per gli altri in seguito.',
        b: 'Questa scelta potrebbe suggerire che ragioni collettivamente anche sotto stress — che proteggere gli altri o massimizzare la sopravvivenza del gruppo sembra più fondamentale della continuità personale.',
      },
      disclaimer: 'Contenuto educativo, non consulenza professionale.',
    },
  },
  loyalty: {
    en: {
      title: 'Expert Insight',
      expertType: 'Social Psychology',
      body: 'Loyalty is one of the only moral emotions research consistently shows can override both rules and rational calculation. When a close relationship is at stake, the brain activates the same circuits involved in physical pain when violated. Loyalty isn\'t weakness — it\'s neurologically powerful in a way that abstract principles simply aren\'t.',
      whyPeopleSplit: 'Fairness is reasoned. Loyalty is felt. In controlled settings, most people say fairness should win. Under real pressure — when someone you care about is actually watching — the calculus shifts fast. And many people feel that\'s not a failure of ethics. It\'s exactly how it should work.',
      whatYourAnswerMaySuggest: {
        a: 'This choice may suggest you weight personal bonds as morally significant — that relationships carry obligations that abstract principles don\'t fully capture.',
        b: 'This choice may suggest you apply consistent principles even under pressure — that fairness loses meaning if it only applies when it\'s comfortable.',
      },
      disclaimer: 'Educational perspective, not professional advice.',
    },
    it: {
      title: 'Parere esperto',
      expertType: 'Psicologia Sociale',
      body: 'La lealtà è una delle poche emozioni morali che la ricerca mostra costantemente poter prevalere sia sulle regole che sul calcolo razionale. Quando una relazione stretta è in gioco, il cervello attiva gli stessi circuiti coinvolti nel dolore fisico quando vengono violati. La lealtà non è debolezza — è neurologicamente potente in un modo in cui i principi astratti semplicemente non lo sono.',
      whyPeopleSplit: 'L\'equità si ragiona. La lealtà si sente. In contesti controllati, la maggior parte delle persone dice che dovrebbe vincere l\'equità. Sotto vera pressione — quando qualcuno a cui tieni ti sta davvero guardando — i conti cambiano velocemente. E molte persone sentono che non è un fallimento etico. È esattamente come dovrebbe funzionare.',
      whatYourAnswerMaySuggest: {
        a: 'Questa scelta potrebbe suggerire che dai peso morale ai legami personali — che le relazioni portano obblighi che i principi astratti non catturano pienamente.',
        b: 'Questa scelta potrebbe suggerire che applichi principi coerenti anche sotto pressione — che l\'equità perde significato se si applica solo quando è comodo.',
      },
      disclaimer: 'Contenuto educativo, non consulenza professionale.',
    },
  },
  lifestyle: {
    en: {
      title: 'Preference Insight',
      expertType: 'Psychology',
      body: 'Preference questions reveal personality through the lens of choice architecture. There is no right or wrong answer — each option reflects different values, sensory preferences, and life experiences. What makes these choices interesting is not what\'s objectively better, but what your gut reaction says about how you process the world.',
      whyPeopleSplit: 'People land on different sides because their sensory preferences, childhood associations, and personal histories differ. Neither choice is superior — the split itself is the data.',
      whatYourAnswerMaySuggest: {
        a: 'Choosing this option may reflect your natural preferences, energy patterns, or the environments where you feel most like yourself.',
        b: 'Choosing this option may reflect a different but equally valid set of preferences — there is no correct answer here.',
      },
      disclaimer: 'Fun preference data, not a psychological assessment.',
    },
    it: {
      title: 'Curiosità sulle preferenze',
      expertType: 'Psicologia',
      body: 'Le domande sulle preferenze rivelano la personalità attraverso la lente delle scelte. Non esiste una risposta giusta o sbagliata — ogni opzione riflette valori diversi, preferenze sensoriali ed esperienze di vita. Ciò che rende queste scelte interessanti non è cosa sia oggettivamente migliore, ma cosa la tua reazione istintiva dica su come percepisci il mondo.',
      whyPeopleSplit: 'Le persone finiscono su lati diversi perché le loro preferenze sensoriali, le associazioni d\'infanzia e le storie personali differiscono. Nessuna scelta è superiore — la divisione stessa è il dato.',
      whatYourAnswerMaySuggest: {
        a: 'Scegliere questa opzione può riflettere le tue preferenze naturali, i tuoi ritmi di energia o gli ambienti in cui ti senti più te stesso.',
        b: 'Scegliere questa opzione può riflettere un insieme di preferenze diverso ma ugualmente valido — non esiste una risposta corretta qui.',
      },
      disclaimer: 'Dati di preferenza per divertimento, non una valutazione psicologica.',
    },
  },
}

export function getExpertInsight(category: Category, locale: 'en' | 'it'): ExpertInsight {
  return INSIGHTS[category]?.[locale] ?? INSIGHTS.morality[locale]
}
