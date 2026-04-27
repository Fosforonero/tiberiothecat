const BASE = 'https://splitvote.io'

export type SectionType =
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'p'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'cta'; label: string; href: string }
  | { type: 'disclaimer'; text: string }

export interface BlogPost {
  slug: string
  locale: 'en' | 'it'
  title: string
  seoTitle: string
  description: string
  seoDescription: string
  date: string
  readingTime: number
  tags: string[]
  relatedDilemmaIds: string[]
  alternateSlug?: string
  content: SectionType[]
}

const EN_POSTS: BlogPost[] = [
  {
    slug: 'what-is-a-moral-dilemma',
    locale: 'en',
    title: 'What Is a Moral Dilemma?',
    seoTitle: 'What Is a Moral Dilemma? Definition, Examples & Why They Matter',
    description:
      'A moral dilemma is a situation where every choice has a cost. No option is clean. Understanding them reveals what you actually value.',
    seoDescription:
      'Learn what a moral dilemma is, why they have no right answer, and why facing them reveals your true values. With real examples and interactive dilemmas to try.',
    date: '2026-04-27',
    readingTime: 3,
    tags: ['ethics', 'philosophy', 'moral psychology'],
    relatedDilemmaIds: ['trolley', 'cure-secret', 'memory-erase'],
    alternateSlug: 'cos-e-un-dilemma-morale',
    content: [
      {
        type: 'p',
        text: 'A moral dilemma is a situation where you must choose between two options — and both carry real costs. There is no clean answer, no option that leaves you without some form of loss or compromise.',
      },
      {
        type: 'p',
        text: "That's what makes them so uncomfortable. And so revealing.",
      },
      {
        type: 'h2',
        text: 'What makes it a dilemma, not just a hard choice?',
      },
      {
        type: 'p',
        text: 'A hard choice might have a clearly better option that is simply difficult to take. A true moral dilemma has competing values in direct conflict: loyalty vs. honesty, saving lives vs. respecting autonomy, the individual vs. the collective.',
      },
      {
        type: 'p',
        text: 'Classic examples include the trolley problem (save five by sacrificing one?), whistleblowing scenarios (loyalty to employer vs. public interest), or end-of-life care decisions where multiple ethical principles pull in opposite directions.',
      },
      {
        type: 'h2',
        text: 'Why moral dilemmas matter',
      },
      {
        type: 'list',
        items: [
          'They expose your actual values — not the ones you think you have',
          'They show where two reasonable people can disagree without either being wrong',
          'They are the foundation of serious ethical reasoning in law, medicine, and politics',
        ],
      },
      {
        type: 'h2',
        text: 'Try one now',
      },
      {
        type: 'p',
        text: 'The best way to understand a moral dilemma is to face one. See how your gut reacts before your reasoning catches up — then compare your answer with people from around the world.',
      },
      {
        type: 'cta',
        label: 'Browse moral dilemmas →',
        href: '/category/morality',
      },
      {
        type: 'disclaimer',
        text: 'Educational content, not professional advice.',
      },
    ],
  },
  {
    slug: 'trolley-problem-explained',
    locale: 'en',
    title: 'The Trolley Problem, Explained',
    seoTitle: 'The Trolley Problem Explained — History, Variants & What People Choose',
    description:
      'The trolley problem is the most famous thought experiment in moral philosophy. Here is where it came from, what the variants reveal, and what people actually choose.',
    seoDescription:
      'Understand the trolley problem: its origin with Philippa Foot, the footbridge variant, and what global surveys reveal about how people reason about life and death.',
    date: '2026-04-27',
    readingTime: 4,
    tags: ['trolley problem', 'ethics', 'philosophy', 'classic dilemmas'],
    relatedDilemmaIds: ['trolley', 'organ-harvest'],
    alternateSlug: 'problema-del-carrello-spiegato',
    content: [
      {
        type: 'p',
        text: 'A runaway trolley is heading toward five people tied to the tracks. You can pull a lever to divert it — but there is one person on the side track. Do you pull the lever?',
      },
      {
        type: 'p',
        text: "This thought experiment was introduced by philosopher Philippa Foot in 1967. It became one of the most studied cases in moral philosophy — and one of the most argued about at dinner tables.",
      },
      {
        type: 'h2',
        text: 'The original question',
      },
      {
        type: 'p',
        text: "Foot's version asked whether it is ever permissible to do harm in order to prevent greater harm. Pulling the lever kills one person to save five — is that acceptable? Most people say yes. Saving five at the cost of one feels like straightforward arithmetic.",
      },
      {
        type: 'h2',
        text: 'The footbridge variant',
      },
      {
        type: 'p',
        text: 'Philosopher Judith Jarvis Thomson later introduced a twist: instead of a lever, imagine you are on a bridge above the tracks. You could push a large man off the bridge — his body would stop the trolley, saving the five. The math is identical: one dies, five survive. But almost everyone refuses.',
      },
      {
        type: 'p',
        text: 'This asymmetry is the interesting part. Same outcome, dramatically different moral intuitions. Why?',
      },
      {
        type: 'h2',
        text: 'What the research shows',
      },
      {
        type: 'list',
        items: [
          'In large surveys, roughly 85% of people pull the lever — but only ~30% push the man',
          'The difference maps onto deontological thinking (do not use a person as a means) vs. consequentialist thinking (minimize harm)',
          'Culture, age, and framing all shift the numbers',
        ],
      },
      {
        type: 'h2',
        text: 'What would you choose?',
      },
      {
        type: 'p',
        text: 'SplitVote collects real votes on the trolley problem from people around the world. See where you land — and where the global split sits today.',
      },
      {
        type: 'cta',
        label: 'Vote on the trolley problem →',
        href: '/play/trolley',
      },
      {
        type: 'disclaimer',
        text: 'Educational content, not professional advice.',
      },
    ],
  },
  {
    slug: 'why-people-love-impossible-choices',
    locale: 'en',
    title: 'Why People Love Impossible Choices',
    seoTitle: 'Why People Love Impossible Choices — The Psychology of Moral Dilemmas',
    description:
      'Moral dilemmas are uncomfortable — yet people cannot stop sharing them. Here is what psychology says about why impossible choices are so compelling.',
    seoDescription:
      'Why do moral dilemmas go viral? Explore the psychology behind cognitive conflict, social comparison, and identity expression that makes impossible choices irresistible to share.',
    date: '2026-04-27',
    readingTime: 3,
    tags: ['psychology', 'moral psychology', 'social sharing'],
    relatedDilemmaIds: ['trolley', 'memory-erase', 'cure-secret'],
    alternateSlug: 'perche-ci-piacciono-le-scelte-impossibili',
    content: [
      {
        type: 'p',
        text: 'You have seen them everywhere: "Would you rather…" posts, trolley problem debates, lifeboat scenarios. People do not just read them — they argue about them for hours.',
      },
      {
        type: 'p',
        text: 'What makes a question with no right answer so captivating?',
      },
      {
        type: 'h2',
        text: 'They create cognitive conflict',
      },
      {
        type: 'p',
        text: 'When a question has no clear answer, your brain works harder. That cognitive effort creates engagement — you feel the stakes, you feel pulled in multiple directions at once. The discomfort is difficult to walk away from.',
      },
      {
        type: 'h2',
        text: 'They work as social mirrors',
      },
      {
        type: 'p',
        text: 'Seeing that 62% of people chose differently from you is surprising, sometimes unsettling. It forces a question: why do we reason differently about the same situation? That kind of social comparison is hard to resist.',
      },
      {
        type: 'h2',
        text: 'They reveal what you actually value',
      },
      {
        type: 'p',
        text: 'In everyday life, stated values and actual behavior frequently diverge. Moral dilemmas cut through: they force you to prioritize one value over another in a concrete way that abstract principles cannot. Your choice tells you something real about yourself.',
      },
      {
        type: 'h2',
        text: 'They are inherently shareable',
      },
      {
        type: 'p',
        text: 'Ambiguity drives conversation. There is no way to "win" by sharing your answer to a moral dilemma — which means everyone can engage without feeling judged. Low barrier, high conversation value.',
      },
      {
        type: 'h2',
        text: 'See what the world chooses',
      },
      {
        type: 'p',
        text: 'SplitVote collects real-time votes on hundreds of moral dilemmas. No commentary, no opinions — just data on what people actually choose when forced to pick a side.',
      },
      {
        type: 'cta',
        label: 'See what is trending →',
        href: '/trending',
      },
      {
        type: 'disclaimer',
        text: 'Educational content, not professional advice.',
      },
    ],
  },
]

const IT_POSTS: BlogPost[] = [
  {
    slug: 'cos-e-un-dilemma-morale',
    locale: 'it',
    title: "Cos'è un dilemma morale?",
    seoTitle: "Cos'è un dilemma morale? Definizione, esempi e perché contano",
    description:
      'Un dilemma morale è una situazione in cui qualsiasi scelta ha un costo. Non esistono risposte pulite. Capirli aiuta a scoprire cosa valoriamo davvero.',
    seoDescription:
      "Scopri cos'è un dilemma morale, perché non hanno una risposta giusta, e perché affrontarli rivela i tuoi valori autentici. Con esempi reali e dilemmi da provare.",
    date: '2026-04-27',
    readingTime: 3,
    tags: ['etica', 'filosofia', 'psicologia morale'],
    relatedDilemmaIds: ['trolley', 'cure-secret', 'memory-erase'],
    alternateSlug: 'what-is-a-moral-dilemma',
    content: [
      {
        type: 'p',
        text: 'Un dilemma morale è una situazione in cui devi scegliere tra due opzioni — e entrambe hanno un costo reale. Non esiste una risposta pulita, nessuna scelta che ti lasci le mani del tutto libere.',
      },
      {
        type: 'p',
        text: 'È esattamente questo che li rende scomodi. E così rivelatori.',
      },
      {
        type: 'h2',
        text: 'Cosa lo rende un dilemma, e non solo una scelta difficile?',
      },
      {
        type: 'p',
        text: "Una scelta difficile può avere un'opzione chiaramente migliore che è semplicemente faticosa da prendere. Un vero dilemma morale mette in conflitto diretto due valori: lealtà contro onestà, salvare vite contro rispettare l'autonomia, l'individuo contro il gruppo.",
      },
      {
        type: 'p',
        text: "Gli esempi classici includono il problema del carrello (salvare cinque sacrificandone uno?), i dilemmi sul whistleblowing (lealtà all'azienda contro interesse pubblico), o le decisioni di fine vita in cui più principi etici tirano in direzioni opposte.",
      },
      {
        type: 'h2',
        text: 'Perché i dilemmi morali contano',
      },
      {
        type: 'list',
        items: [
          'Rivelano i tuoi valori reali — non quelli che credi di avere',
          'Mostrano come due persone ragionevoli possano dissentire senza che nessuna delle due abbia torto',
          'Sono alla base del ragionamento etico serio in diritto, medicina e politica',
        ],
      },
      {
        type: 'h2',
        text: 'Provane uno adesso',
      },
      {
        type: 'p',
        text: 'Il modo migliore per capire un dilemma morale è affrontarne uno. Osserva come reagisce il tuo istinto prima che la ragione intervenga — poi confronta la tua risposta con persone da tutto il mondo.',
      },
      {
        type: 'cta',
        label: 'Sfoglia i dilemmi morali →',
        href: '/it/category/morality',
      },
      {
        type: 'disclaimer',
        text: 'Contenuto educativo, non consulenza professionale.',
      },
    ],
  },
  {
    slug: 'problema-del-carrello-spiegato',
    locale: 'it',
    title: 'Il problema del carrello spiegato semplice',
    seoTitle: 'Il problema del carrello spiegato — storia, varianti e cosa scelgono le persone',
    description:
      'Il problema del carrello è il dilemma morale più famoso della filosofia. Da dove viene, cosa rivelano le varianti, e cosa scelgono davvero le persone.',
    seoDescription:
      "Capire il problema del carrello: la sua origine con Philippa Foot, la variante del ponte, e cosa mostrano i sondaggi globali sul ragionamento etico di fronte alla vita e alla morte.",
    date: '2026-04-27',
    readingTime: 4,
    tags: ['problema del carrello', 'etica', 'filosofia', 'dilemmi classici'],
    relatedDilemmaIds: ['trolley', 'organ-harvest'],
    alternateSlug: 'trolley-problem-explained',
    content: [
      {
        type: 'p',
        text: "Un carrello fuori controllo si dirige verso cinque persone legate ai binari. Puoi tirare una leva per deviarlo — ma c'è una persona sul binario laterale. Tiri la leva?",
      },
      {
        type: 'p',
        text: "Questo esperimento mentale fu introdotto dalla filosofa Philippa Foot nel 1967. Da allora è diventato uno dei casi più studiati della filosofia morale — e uno dei più discussi a tavola.",
      },
      {
        type: 'h2',
        text: 'La domanda originale',
      },
      {
        type: 'p',
        text: "La versione di Foot chiedeva se sia mai lecito fare del male per prevenire un danno maggiore. Tirare la leva uccide una persona per salvarne cinque — è accettabile? La maggior parte delle persone dice di sì. Salvare cinque al costo di uno sembra aritmetica semplice.",
      },
      {
        type: 'h2',
        text: 'La variante del ponte',
      },
      {
        type: 'p',
        text: 'La filosofa Judith Jarvis Thomson ha poi introdotto una variazione: invece di una leva, immagina di essere su un ponte sopra i binari. Potresti spingere un uomo corpulento giù dal ponte — il suo corpo fermerebbe il carrello, salvando i cinque. La matematica è identica: uno muore, cinque si salvano. Eppure quasi tutti rifiutano.',
      },
      {
        type: 'p',
        text: "Questa asimmetria è il punto interessante. Stesso risultato, intuizioni morali radicalmente diverse. Perché?",
      },
      {
        type: 'h2',
        text: 'Cosa dice la ricerca',
      },
      {
        type: 'list',
        items: [
          "Nei grandi sondaggi, circa l'85% delle persone tira la leva — ma solo il ~30% spingerebbe l'uomo",
          "La differenza rispecchia il contrasto tra pensiero deontologico (non usare una persona come mezzo) e consequenzialista (minimizzare il danno)",
          'Cultura, età e come viene formulata la domanda spostano i numeri',
        ],
      },
      {
        type: 'h2',
        text: 'Cosa sceglieresti tu?',
      },
      {
        type: 'p',
        text: 'SplitVote raccoglie voti reali sul problema del carrello da persone in tutto il mondo. Scopri dove ti posizioni — e dove si trova il confine globale oggi.',
      },
      {
        type: 'cta',
        label: 'Vota sul problema del carrello →',
        href: '/it/play/trolley',
      },
      {
        type: 'disclaimer',
        text: 'Contenuto educativo, non consulenza professionale.',
      },
    ],
  },
  {
    slug: 'perche-ci-piacciono-le-scelte-impossibili',
    locale: 'it',
    title: 'Perché ci piacciono le scelte impossibili',
    seoTitle: 'Perché ci piacciono le scelte impossibili — la psicologia dei dilemmi morali',
    description:
      'I dilemmi morali sono scomodi — eppure non riusciamo a smettere di condividerli. La psicologia spiega perché le scelte impossibili ci affascinano tanto.',
    seoDescription:
      'Perché i dilemmi morali diventano virali? Conflitto cognitivo, confronto sociale e identità valoriale: la psicologia dietro la nostra ossessione per le scelte impossibili.',
    date: '2026-04-27',
    readingTime: 3,
    tags: ['psicologia', 'psicologia morale', 'condivisione sociale'],
    relatedDilemmaIds: ['trolley', 'memory-erase', 'cure-secret'],
    alternateSlug: 'why-people-love-impossible-choices',
    content: [
      {
        type: 'p',
        text: 'Li hai visti ovunque: post "cosa preferiresti…", dibattiti sul problema del carrello, scenari di salvataggio. Le persone non si limitano a leggerli — ci litigano per ore.',
      },
      {
        type: 'p',
        text: 'Cosa rende così affascinante una domanda a cui non esiste una risposta giusta?',
      },
      {
        type: 'h2',
        text: 'Creano conflitto cognitivo',
      },
      {
        type: 'p',
        text: "Quando una domanda non ha una risposta chiara, il cervello lavora di più. Questo sforzo cognitivo genera coinvolgimento — senti le conseguenze, ti senti tirato in direzioni opposte. Il disagio è difficile da ignorare.",
      },
      {
        type: 'h2',
        text: 'Funzionano come specchi sociali',
      },
      {
        type: 'p',
        text: "Scoprire che il 62% delle persone ha scelto diversamente da te è sorprendente, a volte destabilizzante. Ti spinge a chiederti: perché ragioniamo in modo così diverso di fronte alla stessa situazione? Quel confronto è difficile da ignorare.",
      },
      {
        type: 'h2',
        text: 'Rivelano cosa valorizzi davvero',
      },
      {
        type: 'p',
        text: "Nella vita quotidiana, i valori dichiarati e il comportamento reale spesso divergono. I dilemmi morali tagliano corto: ti costringono a dare priorità a un valore rispetto a un altro in modo concreto, che i principi astratti non riescono a fare. La tua scelta rivela qualcosa di vero su di te.",
      },
      {
        type: 'h2',
        text: 'Sono intrinsecamente condivisibili',
      },
      {
        type: 'p',
        text: "L'ambiguità alimenta la conversazione. Non esiste un modo per \"vincere\" condividendo la tua risposta a un dilemma morale — il che significa che tutti possono partecipare senza sentirsi giudicati. Barriera bassa, valore di conversazione altissimo.",
      },
      {
        type: 'h2',
        text: 'Scopri cosa sceglie il mondo',
      },
      {
        type: 'p',
        text: "SplitVote raccoglie voti in tempo reale su centinaia di dilemmi morali. Nessun commento, nessuna opinione — solo dati su cosa le persone scelgono davvero quando sono costrette a schierarsi.",
      },
      {
        type: 'cta',
        label: 'Vedi cosa è di tendenza →',
        href: '/it/trending',
      },
      {
        type: 'disclaimer',
        text: 'Contenuto educativo, non consulenza professionale.',
      },
    ],
  },
]

export const allPosts: BlogPost[] = [...EN_POSTS, ...IT_POSTS]

export function getPostsByLocale(locale: 'en' | 'it'): BlogPost[] {
  return allPosts.filter((p) => p.locale === locale)
}

export function getPost(slug: string, locale: 'en' | 'it'): BlogPost | undefined {
  return allPosts.find((p) => p.slug === slug && p.locale === locale)
}

export function getAlternateUrl(post: BlogPost): string | null {
  if (!post.alternateSlug) return null
  const altLocale = post.locale === 'en' ? 'it' : 'en'
  const prefix = altLocale === 'it' ? '/it' : ''
  return `${BASE}${prefix}/blog/${post.alternateSlug}`
}

export function postUrl(post: BlogPost): string {
  const prefix = post.locale === 'it' ? '/it' : ''
  return `${BASE}${prefix}/blog/${post.slug}`
}
