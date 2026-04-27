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
      body: 'Two major frameworks divide most moral intuitions here. Consequentialism asks which choice produces the best outcome. Deontology says some actions are wrong regardless of outcome — there are lines you shouldn\'t cross. Most people apply both without realizing it.',
      whyPeopleSplit: 'People split because they\'re reasoning from different ethical systems — and both positions are internally consistent.',
      whatYourAnswerMaySuggest: {
        a: 'Choosing this option may suggest you\'re weighing outcomes — what matters most is that the result is as good as possible, even when the action feels uncomfortable.',
        b: 'Choosing this option may suggest you\'re guided by principles — some lines feel like they shouldn\'t be crossed regardless of what comes after.',
      },
      disclaimer: 'Educational perspective, not professional advice.',
    },
    it: {
      title: 'Parere esperto',
      expertType: 'Etica',
      body: 'Due grandi correnti dividono la maggior parte delle intuizioni morali. Il consequenzialismo chiede quale scelta produca il miglior esito. La deontologia dice che alcune azioni sono sbagliate indipendentemente dalle conseguenze. La maggior parte delle persone applica entrambi senza rendersene conto.',
      whyPeopleSplit: 'Le persone si dividono perché ragionano da sistemi etici diversi — ed entrambe le posizioni sono internamente coerenti.',
      whatYourAnswerMaySuggest: {
        a: 'Scegliere questa opzione potrebbe suggerire che stai pesando i risultati — ciò che conta di più è che l\'esito sia il migliore possibile, anche quando l\'azione sembra scomoda.',
        b: 'Scegliere questa opzione potrebbe suggerire che sei guidato da principi — certi confini sembrano non dovessero essere varcati indipendentemente da ciò che viene dopo.',
      },
      disclaimer: 'Contenuto educativo, non consulenza professionale.',
    },
  },
  justice: {
    en: {
      title: 'Expert Insight',
      expertType: 'Political Philosophy',
      body: 'Philosophers distinguish procedural justice (were the rules followed?) from distributive justice (is the outcome equitable?). Rawls\' test: what rule would you choose if you didn\'t know where you\'d end up in the outcome?',
      whyPeopleSplit: 'People split because they weight process integrity against outcome fairness differently — and both are legitimate concerns.',
      whatYourAnswerMaySuggest: {
        a: 'This choice may suggest you prioritize the integrity of rules and process — fairness as a property of how decisions are made, not just what is decided.',
        b: 'This choice may suggest you care more about equitable outcomes — what matters is whether people end up in a fair position, regardless of how the process worked.',
      },
      disclaimer: 'Educational perspective, not professional advice.',
    },
    it: {
      title: 'Parere esperto',
      expertType: 'Filosofia Politica',
      body: 'I filosofi distinguono la giustizia procedurale (le regole sono state rispettate?) da quella distributiva (il risultato è equo?). Il test di Rawls: quale regola sceglieresti se non sapessi dove ti troveresti nell\'esito?',
      whyPeopleSplit: 'Le persone si dividono perché pesano diversamente l\'integrità del processo rispetto all\'equità dell\'esito — ed entrambe sono preoccupazioni legittime.',
      whatYourAnswerMaySuggest: {
        a: 'Questa scelta potrebbe suggerire che privilegi l\'integrità delle regole e del processo — l\'equità come proprietà del modo in cui si decide, non solo di ciò che viene deciso.',
        b: 'Questa scelta potrebbe suggerire che ti importa di più degli esiti equi — ciò che conta è se le persone si trovano in una posizione giusta, indipendentemente dal processo.',
      },
      disclaimer: 'Contenuto educativo, non consulenza professionale.',
    },
  },
  relationships: {
    en: {
      title: 'Expert Insight',
      expertType: 'Psychology',
      body: 'In close relationships, honesty and emotional safety often pull in opposite directions. Research suggests how something is communicated — timing, framing, compassion — frequently shapes the impact as much as what is said. That\'s not evasion; it\'s emotional intelligence.',
      whyPeopleSplit: 'People split because they weight honesty-as-respect against protection-as-care differently — and both can be genuine expressions of love.',
      whatYourAnswerMaySuggest: {
        a: 'This choice may suggest you prioritize directness as a form of respect — truth-telling honors the other person\'s autonomy, even when it\'s hard to hear.',
        b: 'This choice may suggest you prioritize emotional safety — some truths aren\'t worth the harm they cause, especially when the relationship itself is what matters most.',
      },
      disclaimer: 'Educational perspective, not professional advice.',
    },
    it: {
      title: 'Parere esperto',
      expertType: 'Psicologia',
      body: 'Nelle relazioni strette, onestà e sicurezza emotiva spesso tirano in direzioni opposte. La ricerca suggerisce che il come si dice qualcosa — momento, formulazione, compassione — modella l\'impatto tanto quanto il cosa. Non è evasione; è intelligenza emotiva.',
      whyPeopleSplit: 'Le persone si dividono perché pesano diversamente l\'onestà-come-rispetto rispetto alla protezione-come-cura — ed entrambe possono essere espressioni genuine d\'amore.',
      whatYourAnswerMaySuggest: {
        a: 'Questa scelta potrebbe suggerire che privilegi la franchezza come forma di rispetto — dire la verità onora l\'autonomia dell\'altra persona, anche quando è difficile da sentire.',
        b: 'Questa scelta potrebbe suggerire che privilegi la sicurezza emotiva — alcune verità non valgono il danno che causano, soprattutto quando la relazione stessa è ciò che conta di più.',
      },
      disclaimer: 'Contenuto educativo, non consulenza professionale.',
    },
  },
  technology: {
    en: {
      title: 'Expert Insight',
      expertType: 'Tech Ethics',
      body: 'Technology ethics focuses on three questions: who decides, who benefits, and who bears the risk. Powerful capabilities often outpace the social norms designed to govern them. The dilemma is rarely whether technology is good or bad — it\'s about control and accountability.',
      whyPeopleSplit: 'People split because they assign different weight to innovation speed versus precautionary caution — and both have legitimate track records of being right.',
      whatYourAnswerMaySuggest: {
        a: 'This choice may suggest you\'re comfortable accepting new capabilities even with uncertain risks — you trust that problems can be addressed as they emerge.',
        b: 'This choice may suggest you prioritize caution over speed — the cost of a mistake may be too high before we fully understand the implications.',
      },
      disclaimer: 'Educational perspective, not professional advice.',
    },
    it: {
      title: 'Parere esperto',
      expertType: 'Etica Tech',
      body: 'L\'etica tecnologica si concentra su tre domande: chi decide, chi beneficia e chi si assume il rischio. Le capacità potenti spesso superano le norme sociali pensate per governarle. Il dilemma raramente è se la tecnologia è buona o cattiva — riguarda il controllo e la responsabilità.',
      whyPeopleSplit: 'Le persone si dividono perché assegnano peso diverso alla velocità dell\'innovazione rispetto alla cautela — ed entrambe hanno ragioni storiche legittime.',
      whatYourAnswerMaySuggest: {
        a: 'Questa scelta potrebbe suggerire che sei a tuo agio nell\'accettare nuove capacità anche con rischi incerti — ti fidi che i problemi possano essere affrontati man mano che emergono.',
        b: 'Questa scelta potrebbe suggerire che privilegi la cautela sulla velocità — il costo di un errore potrebbe essere troppo alto prima di comprendere appieno le implicazioni.',
      },
      disclaimer: 'Contenuto educativo, non consulenza professionale.',
    },
  },
  society: {
    en: {
      title: 'Expert Insight',
      expertType: 'Sociology',
      body: 'Societies constantly negotiate the line between personal freedom and collective welfare. Where people draw that line isn\'t purely logical — it reflects cultural background, lived experience, and what they\'ve seen systems do when given power.',
      whyPeopleSplit: 'People split because they weight individual rights against collective outcomes differently — and that difference often traces back to direct experience with systems that either protected or failed them.',
      whatYourAnswerMaySuggest: {
        a: 'This choice may suggest you lean toward collective solutions — shared problems may need shared responsibility, even at some cost to individual freedom.',
        b: 'This choice may suggest you weight individual autonomy more heavily — collective solutions can become constraints on freedom when applied broadly.',
      },
      disclaimer: 'Educational perspective, not professional advice.',
    },
    it: {
      title: 'Parere esperto',
      expertType: 'Sociologia',
      body: 'Le società negoziano continuamente il confine tra libertà personale e benessere collettivo. Dove le persone tracciano questo confine non è puramente logico — riflette il contesto culturale, l\'esperienza vissuta e cosa hanno visto fare ai sistemi quando hanno avuto potere.',
      whyPeopleSplit: 'Le persone si dividono perché pesano diversamente i diritti individuali rispetto agli esiti collettivi — e quella differenza spesso risale all\'esperienza diretta con sistemi che le hanno protette o deluse.',
      whatYourAnswerMaySuggest: {
        a: 'Questa scelta potrebbe suggerire che propendi per soluzioni collettive — i problemi condivisi potrebbero richiedere responsabilità condivise, anche a un certo costo per la libertà individuale.',
        b: 'Questa scelta potrebbe suggerire che pesi maggiormente l\'autonomia individuale — le soluzioni collettive possono diventare vincoli alla libertà quando applicate su larga scala.',
      },
      disclaimer: 'Contenuto educativo, non consulenza professionale.',
    },
  },
  freedom: {
    en: {
      title: 'Expert Insight',
      expertType: 'Political Philosophy',
      body: 'Philosophers distinguish negative freedom (no external constraints) from positive freedom (actual capacity to act on your choices). Much of the debate about liberty is a hidden disagreement between these two definitions.',
      whyPeopleSplit: 'People split because they\'re holding different conceptions of what freedom actually means — and both are philosophically defensible.',
      whatYourAnswerMaySuggest: {
        a: 'This choice may suggest you prioritize freedom from interference — systems should step back, and individuals should make their own choices.',
        b: 'This choice may suggest you care about freedom to act — formal rights mean little if real circumstances make them impossible to exercise.',
      },
      disclaimer: 'Educational perspective, not professional advice.',
    },
    it: {
      title: 'Parere esperto',
      expertType: 'Filosofia Politica',
      body: 'I filosofi distinguono la libertà negativa (assenza di vincoli esterni) dalla libertà positiva (la capacità concreta di agire sulle proprie scelte). Gran parte del dibattito sulla libertà è un disaccordo nascosto tra queste due definizioni.',
      whyPeopleSplit: 'Le persone si dividono perché tengono concezioni diverse di cosa significhi effettivamente libertà — ed entrambe sono filosoficamente difendibili.',
      whatYourAnswerMaySuggest: {
        a: 'Questa scelta potrebbe suggerire che privilegi la libertà dall\'interferenza — i sistemi dovrebbero farsi da parte e gli individui dovrebbero fare le proprie scelte.',
        b: 'Questa scelta potrebbe suggerire che tieni alla libertà di agire — i diritti formali significano poco se le circostanze reali li rendono impossibili da esercitare.',
      },
      disclaimer: 'Contenuto educativo, non consulenza professionale.',
    },
  },
  survival: {
    en: {
      title: 'Expert Insight',
      expertType: 'Decision Science',
      body: 'Under extreme stress, reasoning shifts from deliberative (slow, analytical) to heuristic (fast, instinctive). Survival dilemmas surface the values that feel most urgent when rational thought breaks down — which may or may not match what you\'d actually do.',
      whyPeopleSplit: 'People split because different survival instincts activate: some prioritize individual preservation, others feel an immediate pull toward protecting the group. Neither is irrational.',
      whatYourAnswerMaySuggest: {
        a: 'This choice may suggest you reason more individually under pressure — when stakes are highest, proximity and self-preservation feel more salient than abstract numbers.',
        b: 'This choice may suggest you reason collectively even under stress — protecting the group or maximizing survival feels like the priority, even at personal cost.',
      },
      disclaimer: 'Educational perspective, not professional advice.',
    },
    it: {
      title: 'Parere esperto',
      expertType: 'Scienze Decisionali',
      body: 'Sotto stress estremo, il ragionamento passa dal deliberativo (lento, analitico) all\'euristico (veloce, istintivo). I dilemmi di sopravvivenza fanno emergere i valori che sembrano più urgenti quando il pensiero razionale si interrompe — il che potrebbe non corrispondere a ciò che faresti davvero.',
      whyPeopleSplit: 'Le persone si dividono perché si attivano istinti di sopravvivenza diversi: alcuni privilegiano la preservazione individuale, altri sentono un\'attrazione immediata verso la protezione del gruppo. Nessuno dei due è irrazionale.',
      whatYourAnswerMaySuggest: {
        a: 'Questa scelta potrebbe suggerire che ragioni più individualmente sotto pressione — quando le poste sono più alte, la prossimità e l\'autoconservazione sembrano più rilevanti dei numeri astratti.',
        b: 'Questa scelta potrebbe suggerire che ragioni collettivamente anche sotto stress — proteggere il gruppo o massimizzare la sopravvivenza sembra la priorità, anche a costo personale.',
      },
      disclaimer: 'Contenuto educativo, non consulenza professionale.',
    },
  },
  loyalty: {
    en: {
      title: 'Expert Insight',
      expertType: 'Social Psychology',
      body: 'Loyalty is one of the most powerful moral emotions — research shows it can override both rules and consequences when a close relationship feels at stake. People often judge the same action differently depending on who it affects.',
      whyPeopleSplit: 'People split because loyalty and universal principles come into direct conflict here — and both feel like the more morally serious position, depending on your values.',
      whatYourAnswerMaySuggest: {
        a: 'This choice may suggest you weight personal bonds highly — relationships carry moral weight that abstract principles sometimes can\'t override.',
        b: 'This choice may suggest you apply more universal principles — fairness means consistency, even toward people we care about.',
      },
      disclaimer: 'Educational perspective, not professional advice.',
    },
    it: {
      title: 'Parere esperto',
      expertType: 'Psicologia Sociale',
      body: 'La lealtà è una delle emozioni morali più potenti — la ricerca mostra che può prevalere sia sulle regole che sulle conseguenze quando una relazione stretta sembra in gioco. Le persone spesso giudicano la stessa azione in modo diverso a seconda di chi ne è colpito.',
      whyPeopleSplit: 'Le persone si dividono perché lealtà e principi universali entrano in conflitto diretto — ed entrambe sembrano la posizione moralmente più seria, a seconda dei propri valori.',
      whatYourAnswerMaySuggest: {
        a: 'Questa scelta potrebbe suggerire che dai molto peso ai legami personali — le relazioni hanno un peso morale che i principi astratti a volte non possono superare.',
        b: 'Questa scelta potrebbe suggerire che applichi principi più universali — l\'equità significa coerenza, anche verso chi amiamo.',
      },
      disclaimer: 'Contenuto educativo, non consulenza professionale.',
    },
  },
}

export function getExpertInsight(category: Category, locale: 'en' | 'it'): ExpertInsight {
  return INSIGHTS[category]?.[locale] ?? INSIGHTS.morality[locale]
}
