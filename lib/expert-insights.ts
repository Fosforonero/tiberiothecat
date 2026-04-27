import type { Category } from '@/lib/scenarios'

export interface ExpertInsight {
  title: string
  expertType: string
  body: string
  disclaimer: string
}

type LocaleInsight = { en: ExpertInsight; it: ExpertInsight }
type InsightMap = Record<Category, LocaleInsight>

const INSIGHTS: InsightMap = {
  morality: {
    en: {
      title: 'Expert Insight',
      expertType: 'Ethics',
      body: 'A moral philosopher might approach this through two lenses: consequentialism asks which choice produces the best overall outcome, while deontology focuses on duties and rights regardless of consequences. When people disagree on dilemmas like this, they often aren\'t using the same moral framework — they\'re reasoning from different first principles.',
      disclaimer: 'Educational perspective, not professional advice.',
    },
    it: {
      title: 'Parere esperto',
      expertType: 'Etica',
      body: 'Un filosofo morale affronterebbe questo dilemma da due angolazioni: il consequenzialismo chiede quale scelta produca il miglior risultato complessivo, mentre la deontologia si concentra su doveri e diritti indipendentemente dalle conseguenze. Quando le persone non sono d\'accordo, spesso ragionano da principi fondamentali diversi.',
      disclaimer: 'Contenuto educativo, non consulenza professionale.',
    },
  },
  justice: {
    en: {
      title: 'Expert Insight',
      expertType: 'Ethics',
      body: 'From a justice perspective, this raises the tension between procedural fairness (were the rules followed?) and distributive fairness (is the outcome equitable?). Philosophers like Rawls would ask: what rule would you choose if you didn\'t know which side you\'d end up on?',
      disclaimer: 'Educational perspective, not professional advice.',
    },
    it: {
      title: 'Parere esperto',
      expertType: 'Etica',
      body: 'Dalla prospettiva della giustizia, emerge la tensione tra equità procedurale (le regole sono state rispettate?) ed equità distributiva (il risultato è equo?). Rawls chiederebbe: quale regola sceglieresti se non sapessi da che parte ti troveresti?',
      disclaimer: 'Contenuto educativo, non consulenza professionale.',
    },
  },
  relationships: {
    en: {
      title: 'Expert Insight',
      expertType: 'Psychology',
      body: 'A psychologist might frame this around attachment theory and the tension between emotional safety and honesty. Research suggests that in close relationships, how something is communicated often matters as much as what is said — especially when trust is at stake.',
      disclaimer: 'Educational perspective, not professional advice.',
    },
    it: {
      title: 'Parere esperto',
      expertType: 'Psicologia',
      body: 'Uno psicologo inquadrerebbe questo dilemma attraverso la teoria dell\'attaccamento e la tensione tra sicurezza emotiva e onestà. La ricerca suggerisce che nelle relazioni strette, il come si comunica qualcosa conta quanto il cosa — specialmente quando la fiducia è in gioco.',
      disclaimer: 'Contenuto educativo, non consulenza professionale.',
    },
  },
  technology: {
    en: {
      title: 'Expert Insight',
      expertType: 'Tech Ethics',
      body: 'A tech ethicist would likely raise questions of agency and unintended consequences. Many technology dilemmas involve powerful capabilities deployed faster than society can adapt. The real question is often: who decides, who benefits, and who bears the risk?',
      disclaimer: 'Educational perspective, not professional advice.',
    },
    it: {
      title: 'Parere esperto',
      expertType: 'Etica Tech',
      body: 'Un eticista tecnologico solleverebbe probabilmente questioni di autonomia e conseguenze impreviste. Molti dilemmi tecnologici coinvolgono capacità potenti distribuite più rapidamente di quanto la società possa adattarsi. La domanda vera è spesso: chi decide, chi beneficia e chi si assume il rischio?',
      disclaimer: 'Contenuto educativo, non consulenza professionale.',
    },
  },
  society: {
    en: {
      title: 'Expert Insight',
      expertType: 'Sociology',
      body: 'A sociologist might look at this through the lens of collective vs. individual interests. Societies constantly negotiate the line between personal freedom and the social contract. Where people draw that line often reflects their cultural background and lived experience more than pure logic.',
      disclaimer: 'Educational perspective, not professional advice.',
    },
    it: {
      title: 'Parere esperto',
      expertType: 'Sociologia',
      body: 'Un sociologo osserverebbe questo dilemma attraverso la lente degli interessi collettivi vs. individuali. Le società negoziano continuamente il confine tra libertà personale e contratto sociale. Dove le persone tracciano questo confine riflette spesso il contesto culturale e l\'esperienza vissuta più che la logica pura.',
      disclaimer: 'Contenuto educativo, non consulenza professionale.',
    },
  },
  freedom: {
    en: {
      title: 'Expert Insight',
      expertType: 'Political Philosophy',
      body: 'Political philosophers distinguish between negative freedom (the absence of external constraints) and positive freedom (the actual capacity to act on your choices). This dilemma sits at that fault line — and different liberal traditions answer it very differently.',
      disclaimer: 'Educational perspective, not professional advice.',
    },
    it: {
      title: 'Parere esperto',
      expertType: 'Filosofia Politica',
      body: 'I filosofi politici distinguono tra libertà negativa (assenza di vincoli esterni) e libertà positiva (la capacità concreta di agire sulle proprie scelte). Questo dilemma si colloca esattamente su quella linea di faglia — e le diverse tradizioni liberali rispondono in modo molto diverso.',
      disclaimer: 'Contenuto educativo, non consulenza professionale.',
    },
  },
  survival: {
    en: {
      title: 'Expert Insight',
      expertType: 'Decision Science',
      body: 'A decision scientist would note that under extreme stress, human reasoning shifts from deliberative (slow, analytical) to heuristic (fast, instinctive). Survival dilemmas surface our deepest values — not because we\'re thinking clearly, but precisely because we\'re not.',
      disclaimer: 'Educational perspective, not professional advice.',
    },
    it: {
      title: 'Parere esperto',
      expertType: 'Scienze Decisionali',
      body: 'Uno scienziato delle decisioni noterebbe che sotto stress estremo il ragionamento umano passa dal deliberativo (lento, analitico) all\'euristico (veloce, istintivo). I dilemmi di sopravvivenza fanno emergere i nostri valori più profondi — non perché ragioniamo chiaramente, ma proprio perché non lo facciamo.',
      disclaimer: 'Contenuto educativo, non consulenza professionale.',
    },
  },
  loyalty: {
    en: {
      title: 'Expert Insight',
      expertType: 'Social Psychology',
      body: 'Social psychologists study how in-group loyalty shapes moral reasoning. Research shows people often judge the same action differently depending on whether it helps or harms their group. This tension between loyalty and universal principles is one of the oldest debates in moral philosophy.',
      disclaimer: 'Educational perspective, not professional advice.',
    },
    it: {
      title: 'Parere esperto',
      expertType: 'Psicologia Sociale',
      body: 'Gli psicologi sociali studiano come la lealtà verso il gruppo influenza il ragionamento morale. La ricerca mostra che le persone giudicano spesso la stessa azione in modo diverso a seconda che aiuti o danneggi il loro gruppo. Questa tensione tra lealtà e principi universali è uno dei dibattiti più antichi della filosofia morale.',
      disclaimer: 'Contenuto educativo, non consulenza professionale.',
    },
  },
}

export function getExpertInsight(category: Category, locale: 'en' | 'it'): ExpertInsight {
  return INSIGHTS[category]?.[locale] ?? INSIGHTS.morality[locale]
}
