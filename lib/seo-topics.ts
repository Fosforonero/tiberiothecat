export type SeoTopicStatus = 'published' | 'draft'

export interface SeoTopic {
  /** URL slug — must not appear in RESERVED_SLUGS / RESERVED_IT_SLUGS, no proper nouns */
  slug: string
  /**
   * Route affinity: 'en' → served by app/[topicSlug] (root route).
   * 'it' → served by app/it/[topicSlug].
   * getPublishedTopics() and getIndexableTopics() guard the root route to EN-only.
   */
  locale: 'en' | 'it'
  /**
   * Slug of the counterpart page in the other locale.
   * EN topic: points to the IT slug. IT topic: points to the EN slug.
   * Used to build hreflang cross-links between EN and IT versions.
   */
  alternateSlug?: string
  /** Short label used in nav pills and cross-links */
  topic: string
  /** Comma-separated long-tail search queries this page targets */
  searchIntent: string
  /** Core moral tension — must be unique across published topics */
  tension: string
  /** SEO H1 headline — no brand names */
  headline: string
  /** Unique intro paragraph, max ~120 words, no proper nouns or brand names */
  intro: string
  /** Primary scenario ID (must exist in lib/scenarios.ts) — shown above the fold */
  primaryScenarioId: string
  /** 3–5 related scenario IDs (all must exist in lib/scenarios.ts) */
  relatedScenarioIds: string[]
  /** Slugs of related landing pages for cross-linking (missing slugs are silently skipped) */
  relatedTopicSlugs: string[]
  /** Short contextual note about research that studies this tension (1-2 sentences, no validation claims) */
  researchNote?: string
  /** Max 3 authoritative external sources related to this topic */
  researchSources?: { title: string; institution: string; url: string }[]
  /** 'published' → SSG page built; 'draft' → skipped at build time */
  status: SeoTopicStatus
  /**
   * true → page is built but carries <meta name="robots" noindex> and is excluded from sitemap.
   * Use for topics awaiting editorial review or enough vote data.
   */
  noindexUntilReady: boolean
}

// ─── Collision guard — EN root route ────────────────────────────────────────
// All slugs reserved by existing Next.js routes at app/ root level.
// generateStaticParams() in app/[topicSlug]/page.tsx throws if any EN topic slug matches.
export const RESERVED_SLUGS = new Set([
  'it', 'play', 'results', 'category', 'blog', 'admin', 'api', 'login',
  'privacy', 'terms', 'faq', 'trending', 'profile', 'dashboard',
  'personality', 'moral-dilemmas', 'would-you-rather-questions',
  'submit-poll', 'reset-password', 'auth', 'business', 'offline', 'u',
  'sitemap', 'robots', 'favicon', 'icon', 'not-found',
  'topics', 'leaderboard', 'store',
])

// ─── Collision guard — IT sub-route ─────────────────────────────────────────
// All slugs reserved by existing Next.js routes at app/it/ level.
// generateStaticParams() in app/it/[topicSlug]/page.tsx throws if any IT topic slug matches.
export const RESERVED_IT_SLUGS = new Set([
  'about', 'blog', 'category', 'dilemmi-morali', 'domande-would-you-rather',
  'faq', 'personality', 'play', 'privacy', 'results', 'terms', 'trending',
  'temi', 'leaderboard',
])

// ─── Landing page QA checklist (verify before setting status='published') ───
// [ ] Unique intro — not copy-pasted from another topic
// [ ] primaryScenarioId is a valid id in lib/scenarios.ts
// [ ] relatedScenarioIds has ≥ 3 entries, all valid ids in lib/scenarios.ts
// [ ] slug is not in RESERVED_SLUGS / RESERVED_IT_SLUGS (enforced at build — throws if violated)
// [ ] No proper nouns or brand names in headline, intro, topic, or tension
// [ ] canonical URL matches the slug exactly
// [ ] status='published' && noindexUntilReady=false → appears in sitemap
// [ ] noindexUntilReady=true OR relatedScenarioIds.length < 3 → noindex meta
// [ ] alternateSlug (if set) points to a valid slug of the counterpart locale

export const SEO_TOPICS: SeoTopic[] = [
  // ── English topics ──────────────────────────────────────────────────────
  {
    slug: 'trolley-problem',
    locale: 'en',
    alternateSlug: 'problema-del-carrello',
    topic: 'Trolley Problem',
    searchIntent: 'trolley problem moral dilemma, trolley problem ethics, would you pull the lever',
    tension: 'utilitarian calculus vs the prohibition on causing direct harm',
    headline: 'The Trolley Problem — Would You Pull the Lever?',
    intro:
      'A runaway trolley is heading toward five people tied to the tracks. You stand beside a lever that diverts it — but the alternate track holds one person. Pull the lever and you actively cause one death to prevent five. Do nothing and five die without your hand on the switch. This thought experiment has shaped moral philosophy for decades: it forces a choice between maximising the number of lives saved and the absolute constraint against causing harm directly.',
    primaryScenarioId: 'trolley',
    relatedScenarioIds: ['organ-harvest', 'time-machine', 'lifeboat', 'plane-parachute'],
    relatedTopicSlugs: ['ai-ethics-dilemmas', 'loyalty-vs-honesty', 'consequentialism', 'deontology'],
    researchNote:
      'Philosophers have used the trolley problem for decades to explore whether it is morally different to cause harm directly rather than allow harm to happen. SplitVote turns that classic tension into a live voting question.',
    researchSources: [
      {
        title: 'Moral Dilemmas',
        institution: 'Stanford Encyclopedia of Philosophy',
        url: 'https://plato.stanford.edu/entries/moral-dilemmas/',
      },
      {
        title: 'Doing vs. Allowing Harm',
        institution: 'Stanford Encyclopedia of Philosophy',
        url: 'https://plato.stanford.edu/entries/doing-allowing/',
      },
    ],
    status: 'published',
    noindexUntilReady: false,
  },
  {
    slug: 'ai-ethics-dilemmas',
    locale: 'en',
    alternateSlug: 'dilemmi-etici-intelligenza-artificiale',
    topic: 'AI Ethics',
    searchIntent: 'AI ethics dilemma, self-driving car moral dilemma, artificial intelligence ethical questions',
    tension: 'algorithmic optimisation vs human moral judgment and accountability',
    headline: 'AI Ethics Dilemmas — When Machines Must Choose',
    intro:
      'Autonomous systems now make decisions that were once reserved for human judgment. A vehicle\'s brakes fail and the algorithm must decide who bears the risk. A sentencing tool assigns a score that shapes years of someone\'s life. An AI produces work no human authored — and ownership law has no clear answer. These are not speculative futures: they are decisions being encoded today. When a machine chooses wrong, who is accountable?',
    primaryScenarioId: 'self-driving-crash',
    relatedScenarioIds: ['robot-judge', 'ai-replaces-jobs', 'brain-upload', 'ai-art-copyright'],
    relatedTopicSlugs: ['trolley-problem', 'loyalty-vs-honesty', 'consequentialism'],
    researchNote:
      'In 2018, researchers at MIT ran a large-scale study called the Moral Machine, collecting over 40 million moral decisions from people in 233 countries — asking how an autonomous vehicle should choose in unavoidable crash scenarios. SplitVote lets you explore similar questions one vote at a time.',
    researchSources: [
      {
        title: 'The Moral Machine experiment (Awad et al., Nature 2018)',
        institution: 'MIT Media Lab / Nature',
        url: 'https://www.nature.com/articles/s41586-018-0637-6',
      },
      {
        title: 'Privacy',
        institution: 'Stanford Encyclopedia of Philosophy',
        url: 'https://plato.stanford.edu/entries/privacy/',
      },
    ],
    status: 'published',
    noindexUntilReady: false,
  },
  {
    slug: 'loyalty-vs-honesty',
    locale: 'en',
    alternateSlug: 'lealta-vs-onesta',
    topic: 'Loyalty vs Honesty',
    searchIntent: 'loyalty vs honesty dilemma, ethical dilemma betraying a friend, should I tell the truth when it hurts',
    tension: 'personal loyalty and protecting loved ones vs moral duty to honesty and justice',
    headline: 'Loyalty vs Honesty — When Telling the Truth Has a Price',
    intro:
      'The people closest to us make mistakes — sometimes serious ones. When a partner, friend, or family member does something wrong, the pull between protecting them and telling the truth is one of the sharpest tensions in everyday ethics. Staying loyal can mean shielding wrongdoing from the people it harmed. Speaking honestly can destroy a relationship built over years. These dilemmas test whether loyalty is a moral virtue or a cover for harm that should come to light.',
    primaryScenarioId: 'cover-accident',
    relatedScenarioIds: ['sibling-secret', 'report-friend', 'truth-friend', 'whistleblower'],
    relatedTopicSlugs: ['trolley-problem', 'ai-ethics-dilemmas', 'virtue-ethics', 'deontology'],
    researchNote:
      'Moral Foundations Theory treats loyalty and fairness as distinct moral concerns that can pull in different directions. These dilemmas ask where you draw the line when protecting someone close conflicts with telling the truth.',
    researchSources: [
      {
        title: 'Moral Foundations Theory',
        institution: 'moralfoundations.org',
        url: 'https://moralfoundations.org/',
      },
      {
        title: 'Moral Dilemmas',
        institution: 'Stanford Encyclopedia of Philosophy',
        url: 'https://plato.stanford.edu/entries/moral-dilemmas/',
      },
    ],
    status: 'published',
    noindexUntilReady: false,
  },
  {
    slug: 'ai-art-ethics',
    locale: 'en',
    alternateSlug: 'etica-arte-ai',
    topic: 'AI Art Ethics',
    searchIntent: 'ai art ethics, generative ai authorship, ai art copyright dilemma, ethical questions ai generated art',
    tension: 'training data sourced without consent vs the artistic legitimacy of work no human authored',
    headline: 'AI Art Ethics — Who Owns Work the Machine Made?',
    intro:
      'Generative models can produce paintings, music and prose at near-zero cost. The training data, in many cases, was scraped from artists who never consented and were never paid. The legal answer is unsettled across jurisdictions, but the ethical question is sharper: if the model learned a living artist\'s style and a stranger now sells outputs in that style, what does authorship even mean? And when the output is technically new but recognisably derivative, who bears the moral cost — the user, the model maker, or the platform that hosts it?',
    primaryScenarioId: 'ai-art-copyright',
    relatedScenarioIds: ['deepfake-expose', 'ai-replaces-jobs', 'self-driving-crash'],
    relatedTopicSlugs: ['ai-ethics-dilemmas', 'privacy-ethics', 'consequentialism'],
    researchNote:
      'Ongoing court cases in the US and EU are testing whether training a model on copyrighted work counts as fair use or as infringement. The Stanford CRFM and the EU AI Act both treat training-data provenance as a first-class concern; the moral question of stylistic imitation runs ahead of the legal one.',
    researchSources: [
      {
        title: 'Generative AI and the Future of Copyright',
        institution: 'Stanford Center for Research on Foundation Models',
        url: 'https://crfm.stanford.edu/',
      },
      {
        title: 'Privacy',
        institution: 'Stanford Encyclopedia of Philosophy',
        url: 'https://plato.stanford.edu/entries/privacy/',
      },
    ],
    status: 'published',
    noindexUntilReady: false,
  },

  // ── Italian topics ───────────────────────────────────────────────────────
  {
    slug: 'problema-del-carrello',
    locale: 'it',
    alternateSlug: 'trolley-problem',
    topic: 'Problema del carrello',
    searchIntent: 'problema del carrello dilemma morale, dilemma etico della leva, etica utilitaristica sacrificio una persona',
    tension: 'calcolo utilitaristico contro il divieto di causare danno diretto',
    headline: 'Il problema del carrello — Abbasseresti la leva?',
    intro:
      'Un carrello fuori controllo sta per investire cinque persone legate ai binari. Sei accanto a una leva che lo devierebbe su un binario alternativo — dove però si trova una sola persona. Abbassare la leva significa salvare cinque causando direttamente una morte. Non farlo significa lasciar morire cinque senza che la tua mano intervenga. Questo esperimento mentale divide da decenni i filosofi morali: conta solo il numero di vite salvate, o esiste un vincolo assoluto contro il causare danno diretto, anche per un fine buono?',
    primaryScenarioId: 'trolley',
    relatedScenarioIds: ['organ-harvest', 'time-machine', 'lifeboat', 'plane-parachute'],
    relatedTopicSlugs: ['dilemmi-etici-intelligenza-artificiale', 'lealta-vs-onesta', 'consequenzialismo', 'deontologia'],
    researchNote:
      'I filosofi usano il problema del carrello da decenni per esplorare se sia moralmente diverso causare danno direttamente rispetto al permettere che accada. SplitVote trasforma questa tensione classica in una domanda aperta al voto globale.',
    researchSources: [
      {
        title: 'Moral Dilemmas',
        institution: 'Stanford Encyclopedia of Philosophy',
        url: 'https://plato.stanford.edu/entries/moral-dilemmas/',
      },
      {
        title: 'Doing vs. Allowing Harm',
        institution: 'Stanford Encyclopedia of Philosophy',
        url: 'https://plato.stanford.edu/entries/doing-allowing/',
      },
    ],
    status: 'published',
    noindexUntilReady: false,
  },
  {
    slug: 'dilemmi-etici-intelligenza-artificiale',
    locale: 'it',
    alternateSlug: 'ai-ethics-dilemmas',
    topic: "Etica dell'IA",
    searchIntent: 'dilemmi etici intelligenza artificiale, auto a guida autonoma dilemma morale, responsabilità algoritmo chi decide',
    tension: "ottimizzazione algoritmica contro il giudizio morale umano e la responsabilità",
    headline: "Dilemmi etici dell'intelligenza artificiale — Quando le macchine devono scegliere",
    intro:
      "I sistemi autonomi prendono oggi decisioni che un tempo spettavano solo agli esseri umani. I freni di un'auto cedono e l'algoritmo deve scegliere chi rischia la vita. Un software di valutazione assegna un punteggio che condiziona anni di esistenza. Una macchina produce opere creative senza autore umano — e il diritto d'autore non ha ancora una risposta. Non sono scenari futuri: sono scelte già codificate nel software di oggi. Quando una macchina decide e sbaglia, chi ne risponde?",
    primaryScenarioId: 'self-driving-crash',
    relatedScenarioIds: ['robot-judge', 'ai-replaces-jobs', 'brain-upload', 'ai-art-copyright'],
    relatedTopicSlugs: ['problema-del-carrello', 'lealta-vs-onesta', 'consequenzialismo'],
    researchNote:
      'Nel 2018, ricercatori del MIT hanno condotto il progetto Moral Machine, raccogliendo oltre 40 milioni di decisioni morali da persone in 233 paesi — chiedendo come un veicolo autonomo dovrebbe scegliere in scenari di collisione inevitabile. SplitVote ti permette di esplorare tensioni simili, un voto alla volta.',
    researchSources: [
      {
        title: 'The Moral Machine experiment (Awad et al., Nature 2018)',
        institution: 'MIT Media Lab / Nature',
        url: 'https://www.nature.com/articles/s41586-018-0637-6',
      },
      {
        title: 'Privacy',
        institution: 'Stanford Encyclopedia of Philosophy',
        url: 'https://plato.stanford.edu/entries/privacy/',
      },
    ],
    status: 'published',
    noindexUntilReady: false,
  },
  {
    slug: 'lealta-vs-onesta',
    locale: 'it',
    alternateSlug: 'loyalty-vs-honesty',
    topic: 'Lealtà vs onestà',
    searchIntent: 'dilemma lealtà onestà, dilemma etico tradire un amico, dire la verità quando fa male',
    tension: 'lealtà personale e protezione dei propri cari contro il dovere morale di onestà e giustizia',
    headline: 'Lealtà vs onestà — Quando dire la verità ha un prezzo',
    intro:
      'Le persone più vicine a noi commettono errori — a volte gravi. Quando un partner, un amico o un familiare fa qualcosa di sbagliato, la tensione tra proteggerlo e dire la verità è uno dei conflitti morali più concreti della vita quotidiana. Restare leali può significare coprire un torto a danno di chi ne ha subito le conseguenze. Essere onesti può distruggere un legame costruito in anni. Questi dilemmi mettono alla prova una domanda fondamentale: la lealtà è una virtù morale o diventa complicità?',
    primaryScenarioId: 'cover-accident',
    relatedScenarioIds: ['sibling-secret', 'report-friend', 'truth-friend', 'whistleblower'],
    relatedTopicSlugs: ['problema-del-carrello', 'dilemmi-etici-intelligenza-artificiale', 'etica-della-virtu', 'deontologia'],
    researchNote:
      "La Moral Foundations Theory tratta la lealtà e l'equità come preoccupazioni morali distinte che possono entrare in conflitto. Questi dilemmi chiedono dove tracci il confine quando proteggere qualcuno di caro si scontra con il dovere di dire la verità.",
    researchSources: [
      {
        title: 'Moral Foundations Theory',
        institution: 'moralfoundations.org',
        url: 'https://moralfoundations.org/',
      },
      {
        title: 'Moral Dilemmas',
        institution: 'Stanford Encyclopedia of Philosophy',
        url: 'https://plato.stanford.edu/entries/moral-dilemmas/',
      },
    ],
    status: 'published',
    noindexUntilReady: false,
  },

  // ── Ethics theory landings (G7 — added 10 May 2026) ─────────────────────
  {
    slug: 'consequentialism',
    locale: 'en',
    alternateSlug: 'consequenzialismo',
    topic: 'Consequentialism',
    searchIntent: 'consequentialism examples, utilitarianism dilemmas, ethics of outcomes, greatest good for the greatest number',
    tension: 'maximising aggregate welfare vs respecting individual rights and dignity',
    headline: 'Consequentialism — Does the End Justify the Means?',
    intro:
      'Five lives saved at the cost of one — most people accept that calculation. But change the case slightly and the math becomes unbearable: would you sacrifice one healthy patient to save five who need transplants? The arithmetic is identical. The verdict almost always isn\'t. Consequentialism judges actions by their outcomes — produce the most good, minimise the most harm — and it captures something real about how people reason in emergencies. It also runs into a sharp limit when the best aggregate outcome requires using a person as a means.',
    primaryScenarioId: 'organ-harvest',
    relatedScenarioIds: ['trolley', 'pandemic-dose', 'rich-or-fair', 'universal-basic-income'],
    relatedTopicSlugs: ['deontology', 'virtue-ethics', 'trolley-problem', 'moral-foundations', 'experimental-moral-psychology'],
    researchNote:
      'Bentham and Mill formulated the modern utilitarian version of consequentialism in the 18th and 19th centuries. Contemporary philosophers continue to debate where the boundary lies between aggregate welfare and individual rights.',
    researchSources: [
      {
        title: 'Consequentialism',
        institution: 'Stanford Encyclopedia of Philosophy',
        url: 'https://plato.stanford.edu/entries/consequentialism/',
      },
      {
        title: 'Moral Dilemmas',
        institution: 'Stanford Encyclopedia of Philosophy',
        url: 'https://plato.stanford.edu/entries/moral-dilemmas/',
      },
    ],
    status: 'published',
    noindexUntilReady: false,
  },
  {
    slug: 'deontology',
    locale: 'en',
    alternateSlug: 'deontologia',
    topic: 'Deontology',
    searchIntent: 'deontology examples, deontological ethics, ethics of duty, when rules matter more than results, categorical imperative',
    tension: 'absolute moral duties and rights vs the pursuit of better overall outcomes',
    headline: 'Deontology — When Some Things Are Always Wrong',
    intro:
      'Some actions are wrong regardless of the good they might produce. You cannot torture an innocent person even if it would save a hundred lives. You cannot frame someone for a crime they did not commit even if it would prevent a riot. Deontological ethics holds that morality is fundamentally about rules and duties, not outcomes. The strict version refuses any exception. The contemporary version allows context but preserves the core: certain constraints are near-absolute, even when breaking them would produce a better aggregate result.',
    primaryScenarioId: 'innocent-juror',
    relatedScenarioIds: ['whistleblower', 'cover-accident', 'mandatory-vaccine', 'organ-harvest'],
    relatedTopicSlugs: ['consequentialism', 'virtue-ethics', 'loyalty-vs-honesty'],
    researchNote:
      'Immanuel Kant developed the most influential deontological framework in the 18th century, with his categorical imperative as its central test. Modern deontology divides between strict rule-followers and contextualists who weight duties without abandoning them.',
    researchSources: [
      {
        title: 'Deontological Ethics',
        institution: 'Stanford Encyclopedia of Philosophy',
        url: 'https://plato.stanford.edu/entries/ethics-deontological/',
      },
      {
        title: 'Moral Dilemmas',
        institution: 'Stanford Encyclopedia of Philosophy',
        url: 'https://plato.stanford.edu/entries/moral-dilemmas/',
      },
    ],
    status: 'published',
    noindexUntilReady: false,
  },
  {
    slug: 'virtue-ethics',
    locale: 'en',
    alternateSlug: 'etica-della-virtu',
    topic: 'Virtue Ethics',
    searchIntent: 'virtue ethics examples, character ethics, what would a good person do, eudaimonia, moral character',
    tension: 'cultivating good character vs following rules or calculating outcomes',
    headline: 'Virtue Ethics — What Kind of Person Do You Want to Be?',
    intro:
      'Instead of asking "what rule applies?" or "what outcome is best?", virtue ethics asks a different question: what would a person of good character do here? It is the oldest of the major Western ethical frameworks and it shifts the focus from the action to the actor. A virtuous person brings practical wisdom — the ability to perceive what matters, weigh competing considerations, and act appropriately — without consulting a rulebook. This makes virtue ethics flexible where the others are rigid, but also less precise. The question becomes about who you are, not just what you do.',
    primaryScenarioId: 'truth-friend',
    relatedScenarioIds: ['forgive-cheater', 'sibling-secret', 'love-or-career', 'cover-accident'],
    relatedTopicSlugs: ['consequentialism', 'deontology', 'loyalty-vs-honesty'],
    researchNote:
      'Aristotle developed the foundational account of virtue ethics in ancient Greece, centred on eudaimonia (human flourishing) and the cultivation of stable character traits. The framework was largely set aside in modern philosophy and has seen a major revival since the late 20th century.',
    researchSources: [
      {
        title: 'Virtue Ethics',
        institution: 'Stanford Encyclopedia of Philosophy',
        url: 'https://plato.stanford.edu/entries/ethics-virtue/',
      },
      {
        title: 'Moral Dilemmas',
        institution: 'Stanford Encyclopedia of Philosophy',
        url: 'https://plato.stanford.edu/entries/moral-dilemmas/',
      },
    ],
    status: 'published',
    noindexUntilReady: false,
  },
  {
    slug: 'consequenzialismo',
    locale: 'it',
    alternateSlug: 'consequentialism',
    topic: 'Consequenzialismo',
    searchIntent: 'consequenzialismo esempi, utilitarismo dilemmi, etica dei risultati, il bene maggiore per il maggior numero',
    tension: "massimizzare il benessere aggregato contro il rispetto dei diritti e della dignità individuali",
    headline: 'Consequenzialismo — Il fine giustifica i mezzi?',
    intro:
      "Cinque vite salvate al costo di una — la maggior parte delle persone accetta questo calcolo. Ma cambia leggermente il caso e la matematica diventa insostenibile: sacrificheresti un paziente sano per salvarne cinque che hanno bisogno di trapianti? L'aritmetica è identica. Il verdetto quasi mai. Il consequenzialismo giudica le azioni dai risultati — produrre il maggior bene, minimizzare il maggior danno — e cattura qualcosa di reale su come ragioniamo nelle emergenze. Si scontra anche con un limite netto quando il miglior risultato aggregato richiede di usare una persona come strumento.",
    primaryScenarioId: 'organ-harvest',
    relatedScenarioIds: ['trolley', 'pandemic-dose', 'rich-or-fair', 'universal-basic-income'],
    relatedTopicSlugs: ['deontologia', 'etica-della-virtu', 'problema-del-carrello', 'fondamenti-morali', 'psicologia-morale-sperimentale'],
    researchNote:
      "Bentham e Mill hanno formulato la versione utilitarista moderna del consequenzialismo nei secoli XVIII e XIX. I filosofi contemporanei continuano a dibattere dove si trovi il confine tra benessere aggregato e diritti individuali.",
    researchSources: [
      {
        title: 'Consequentialism',
        institution: 'Stanford Encyclopedia of Philosophy',
        url: 'https://plato.stanford.edu/entries/consequentialism/',
      },
      {
        title: 'Moral Dilemmas',
        institution: 'Stanford Encyclopedia of Philosophy',
        url: 'https://plato.stanford.edu/entries/moral-dilemmas/',
      },
    ],
    status: 'published',
    noindexUntilReady: false,
  },
  {
    slug: 'deontologia',
    locale: 'it',
    alternateSlug: 'deontology',
    topic: 'Deontologia',
    searchIntent: "deontologia esempi, etica del dovere, quando le regole contano più dei risultati, imperativo categorico",
    tension: "doveri e diritti morali assoluti contro la ricerca di risultati complessivi migliori",
    headline: 'Deontologia — Quando alcune cose sono sempre sbagliate',
    intro:
      "Alcune azioni sono sbagliate indipendentemente dal bene che potrebbero produrre. Non puoi torturare un innocente anche se salverebbe cento vite. Non puoi incastrare qualcuno per un crimine che non ha commesso anche se impedirebbe una rivolta. L'etica deontologica sostiene che la moralità riguarda fondamentalmente regole e doveri, non risultati. La versione stretta non ammette eccezioni. La versione contemporanea ammette il contesto ma preserva il nucleo: alcuni vincoli sono quasi assoluti, anche quando romperli produrrebbe un risultato aggregato migliore.",
    primaryScenarioId: 'innocent-juror',
    relatedScenarioIds: ['whistleblower', 'cover-accident', 'mandatory-vaccine', 'organ-harvest'],
    relatedTopicSlugs: ['consequenzialismo', 'etica-della-virtu', 'lealta-vs-onesta'],
    researchNote:
      "Immanuel Kant ha sviluppato il framework deontologico più influente nel XVIII secolo, con l'imperativo categorico come test centrale. La deontologia moderna si divide tra rigoristi e contestualisti che soppesano i doveri senza abbandonarli.",
    researchSources: [
      {
        title: 'Deontological Ethics',
        institution: 'Stanford Encyclopedia of Philosophy',
        url: 'https://plato.stanford.edu/entries/ethics-deontological/',
      },
      {
        title: 'Moral Dilemmas',
        institution: 'Stanford Encyclopedia of Philosophy',
        url: 'https://plato.stanford.edu/entries/moral-dilemmas/',
      },
    ],
    status: 'published',
    noindexUntilReady: false,
  },
  {
    slug: 'etica-della-virtu',
    locale: 'it',
    alternateSlug: 'virtue-ethics',
    topic: 'Etica della virtù',
    searchIntent: "etica della virtù esempi, etica del carattere, cosa farebbe una persona buona, eudaimonia, carattere morale",
    tension: "coltivare il buon carattere contro il seguire regole o calcolare risultati",
    headline: 'Etica della virtù — Che tipo di persona vuoi essere?',
    intro:
      "Invece di chiedere \"quale regola si applica?\" o \"quale risultato è migliore?\", l'etica della virtù pone una domanda diversa: cosa farebbe una persona di buon carattere qui? È il più antico dei grandi framework etici occidentali e sposta il focus dall'azione all'attore. Una persona virtuosa porta saggezza pratica — la capacità di percepire ciò che conta, soppesare considerazioni in competizione e agire in modo appropriato — senza consultare un manuale. Questo rende l'etica della virtù flessibile dove gli altri framework sono rigidi, ma anche meno precisa. La domanda diventa su chi sei, non solo su cosa fai.",
    primaryScenarioId: 'truth-friend',
    relatedScenarioIds: ['forgive-cheater', 'sibling-secret', 'love-or-career', 'cover-accident'],
    relatedTopicSlugs: ['consequenzialismo', 'deontologia', 'lealta-vs-onesta'],
    researchNote:
      "Aristotele ha sviluppato la versione fondazionale dell'etica della virtù nell'antica Grecia, centrata sull'eudaimonia (il fiorire umano) e sulla coltivazione di tratti stabili del carattere. Il framework è stato largamente messo da parte nella filosofia moderna e ha visto un grande risveglio dalla fine del XX secolo.",
    researchSources: [
      {
        title: 'Virtue Ethics',
        institution: 'Stanford Encyclopedia of Philosophy',
        url: 'https://plato.stanford.edu/entries/ethics-virtue/',
      },
      {
        title: 'Moral Dilemmas',
        institution: 'Stanford Encyclopedia of Philosophy',
        url: 'https://plato.stanford.edu/entries/moral-dilemmas/',
      },
    ],
    status: 'published',
    noindexUntilReady: false,
  },
  {
    slug: 'privacy-ethics',
    locale: 'en',
    alternateSlug: 'etica-della-privacy',
    topic: 'Privacy Ethics',
    searchIntent: 'privacy ethics dilemmas, right to privacy philosophy, anonymity vs surveillance, digital privacy morality',
    tension: 'the right to be left alone vs collective security and accountability',
    headline: 'Privacy Ethics — When the Right to Be Left Alone Runs Out',
    intro:
      'Anonymous voting protects who you are. Surveillance cameras protect where you go. Data brokers record what you buy. AI infers what you believe. At every layer, a trade-off: give up some privacy to gain some safety, or hold the line and accept the risk. Privacy ethics asks where that line should fall — and who gets to draw it. The dilemmas below have no clean answers. They test what you actually value when the stakes are real.',
    primaryScenarioId: 'surveillance-city',
    relatedScenarioIds: ['privacy-terror', 'deepfake-expose', 'censor-speech', 'delete-social-media'],
    relatedTopicSlugs: ['ai-ethics-dilemmas', 'moral-foundations', 'consequentialism'],
    researchNote:
      'Philosophers distinguish identity privacy (who you are) from information privacy (what you think or do). AI-driven inference increasingly collapses this distinction: anonymous datasets can be re-identified; behavioural patterns can reveal beliefs never explicitly disclosed.',
    researchSources: [
      {
        title: 'Privacy',
        institution: 'Stanford Encyclopedia of Philosophy',
        url: 'https://plato.stanford.edu/entries/privacy/',
      },
      {
        title: 'Privacy and Information Technology',
        institution: 'Stanford Encyclopedia of Philosophy',
        url: 'https://plato.stanford.edu/entries/it-privacy/',
      },
    ],
    status: 'published',
    noindexUntilReady: false,
  },
  {
    slug: 'moral-foundations',
    locale: 'en',
    alternateSlug: 'fondamenti-morali',
    topic: 'Moral Foundations',
    searchIntent: 'moral foundations theory, why people disagree on ethics, Jonathan Haidt morality, moral psychology, care fairness loyalty authority sanctity liberty',
    tension: 'different moral foundations producing irreconcilable but internally coherent worldviews',
    headline: 'Moral Foundations — Why Good People Reach Opposite Conclusions',
    intro:
      "Two people read the same dilemma and reach completely opposite conclusions — each convinced the other is missing something obvious. Moral Foundations Theory proposes that this happens because they're reasoning from different psychological systems: Care, Fairness, Loyalty, Authority, Sanctity, Liberty. The dilemmas below activate these foundations in ways that reveal which ones are running your deepest moral reasoning. Neither response is wrong. They're different moral languages.",
    primaryScenarioId: 'trolley',
    relatedScenarioIds: ['innocent-juror', 'truth-friend', 'mandatory-vaccine', 'surveillance-city'],
    relatedTopicSlugs: ['consequentialism', 'deontology', 'virtue-ethics'],
    researchNote:
      "Jonathan Haidt and colleagues developed Moral Foundations Theory to explain cross-cultural variation in moral intuitions. The framework identifies six foundational systems — Care, Fairness, Loyalty, Authority, Sanctity, Liberty — each with evolutionary origins and contemporary moral weight. Liberal and conservative moral systems differ primarily in how heavily the non-Care/Fairness foundations are weighted.",
    researchSources: [
      {
        title: 'Moral Psychology Research Lab',
        institution: 'University of Virginia / NYU',
        url: 'https://moralfoundations.org',
      },
      {
        title: 'The Righteous Mind',
        institution: 'Jonathan Haidt (Pantheon Books, 2012)',
        url: 'https://righteousmind.com',
      },
    ],
    status: 'published',
    noindexUntilReady: false,
  },
  {
    slug: 'etica-della-privacy',
    locale: 'it',
    alternateSlug: 'privacy-ethics',
    topic: 'Etica della privacy',
    searchIntent: 'etica della privacy, diritto alla privacy filosofia, anonimato vs sorveglianza, moralità privacy digitale',
    tension: 'il diritto a essere lasciati in pace contro la sicurezza collettiva e la responsabilità',
    headline: 'Etica della Privacy — Quando il Diritto a Essere Lasciati in Pace Finisce',
    intro:
      "Il voto anonimo protegge chi sei. Le telecamere di sorveglianza proteggono dove vai. I data broker registrano cosa compri. L'IA inferisce cosa credi. A ogni livello, un compromesso: cedere un po' di privacy per guadagnare un po' di sicurezza, o tenere la linea e accettare il rischio. L'etica della privacy chiede dove dovrebbe cadere quella linea — e chi ha il diritto di tracciarla. I dilemmi qui sotto non hanno risposte pulite. Testano cosa valorizzi davvero quando le posta è alta.",
    primaryScenarioId: 'surveillance-city',
    relatedScenarioIds: ['privacy-terror', 'deepfake-expose', 'censor-speech', 'delete-social-media'],
    relatedTopicSlugs: ['dilemmi-etici-intelligenza-artificiale', 'fondamenti-morali', 'consequenzialismo'],
    researchNote:
      "I filosofi distinguono la privacy dell'identità (chi sei) dalla privacy dell'informazione (cosa pensi o fai). L'inferenza guidata dall'IA sta sempre più collassando questa distinzione: i dataset anonimi possono essere re-identificati; i pattern comportamentali possono rivelare convinzioni mai esplicitamente dichiarate.",
    researchSources: [
      {
        title: 'Privacy',
        institution: 'Stanford Encyclopedia of Philosophy',
        url: 'https://plato.stanford.edu/entries/privacy/',
      },
      {
        title: 'Privacy and Information Technology',
        institution: 'Stanford Encyclopedia of Philosophy',
        url: 'https://plato.stanford.edu/entries/it-privacy/',
      },
    ],
    status: 'published',
    noindexUntilReady: false,
  },
  {
    slug: 'fondamenti-morali',
    locale: 'it',
    alternateSlug: 'moral-foundations',
    topic: 'Fondamenti morali',
    searchIntent: 'teoria dei fondamenti morali, perché le persone non sono d\'accordo sull\'etica, Jonathan Haidt moralità, psicologia morale, cura equità lealtà autorità sacralità libertà',
    tension: 'fondamenti morali diversi che producono visioni del mondo irriconciliabili ma internamente coerenti',
    headline: 'Fondamenti Morali — Perché le Persone Oneste Arrivano a Conclusioni Opposte',
    intro:
      "Due persone leggono lo stesso dilemma e arrivano a conclusioni completamente opposte — ognuna convinta che l'altra stia mancando qualcosa di ovvio. La Teoria dei Fondamenti Morali propone che questo accada perché ragionano da sistemi psicologici diversi: Cura, Equità, Lealtà, Autorità, Sacralità, Libertà. I dilemmi qui sotto attivano questi fondamenti in modi che rivelano quali stanno guidando il tuo ragionamento morale più profondo. Nessuna risposta è sbagliata. Sono linguaggi morali diversi.",
    primaryScenarioId: 'trolley',
    relatedScenarioIds: ['innocent-juror', 'truth-friend', 'mandatory-vaccine', 'surveillance-city'],
    relatedTopicSlugs: ['consequenzialismo', 'deontologia', 'etica-della-virtu'],
    researchNote:
      "Jonathan Haidt e colleghi hanno sviluppato la Teoria dei Fondamenti Morali per spiegare la variazione cross-culturale nelle intuizioni morali. Il framework identifica sei sistemi fondazionali — Cura, Equità, Lealtà, Autorità, Sacralità, Libertà — ognuno con origini evolutive e peso morale contemporaneo. I sistemi morali liberal e conservatori differiscono principalmente nel peso dato ai fondamenti non-Cura/Equità.",
    researchSources: [
      {
        title: 'Moral Psychology Research Lab',
        institution: 'University of Virginia / NYU',
        url: 'https://moralfoundations.org',
      },
      {
        title: 'The Righteous Mind',
        institution: 'Jonathan Haidt (Pantheon Books, 2012)',
        url: 'https://righteousmind.com',
      },
    ],
    status: 'published',
    noindexUntilReady: false,
  },
  {
    slug: 'bioethics',
    locale: 'en',
    alternateSlug: 'bioetica',
    topic: 'Bioethics',
    searchIntent: 'bioethics dilemmas, medical ethics examples, organ donation ethics, euthanasia debate, bodily autonomy philosophy',
    tension: 'extending life and relieving suffering vs respecting autonomy and fair allocation of scarce resources',
    headline: 'Bioethics — The Moral Questions Medicine Cannot Fully Answer',
    intro:
      'Medicine saves lives — and forces choices that no protocol fully resolves. Who gets the last transplant organ when five patients need it? Is it ethical to end a life to stop irremediable suffering? Should vaccines be mandatory when public health conflicts with individual freedom? Bioethics is where the abstract principles of moral philosophy collide with flesh-and-blood decisions made under pressure, with incomplete information, against a countdown. These dilemmas have no comfortable answers — only trade-offs between values that all matter.',
    primaryScenarioId: 'mercy-kill',
    relatedScenarioIds: ['organ-harvest', 'mandatory-vaccine', 'pandemic-dose', 'brain-upload'],
    relatedTopicSlugs: ['consequentialism', 'deontology', 'privacy-ethics'],
    researchNote:
      'The dominant framework in practical bioethics — Beauchamp and Childress\'s four principles (autonomy, non-maleficence, beneficence, justice) — provides structure for reasoning without resolving all conflicts. Philosophers and clinicians continue to debate where autonomy ends and collective obligation begins.',
    researchSources: [
      {
        title: 'Bioethics',
        institution: 'Stanford Encyclopedia of Philosophy',
        url: 'https://plato.stanford.edu/entries/bioethics/',
      },
      {
        title: 'Voluntary Euthanasia',
        institution: 'Stanford Encyclopedia of Philosophy',
        url: 'https://plato.stanford.edu/entries/euthanasia-voluntary/',
      },
    ],
    status: 'published',
    noindexUntilReady: false,
  },
  {
    slug: 'bioetica',
    locale: 'it',
    alternateSlug: 'bioethics',
    topic: 'Bioetica',
    searchIntent: 'bioetica dilemmi, etica medica esempi, donazione organi etica, dibattito eutanasia, autonomia corporea filosofia',
    tension: 'prolungare la vita e alleviare la sofferenza contro rispettare l\'autonomia e distribuire equamente risorse scarse',
    headline: 'Bioetica — Le Domande Morali a Cui la Medicina Non Può Rispondere del Tutto',
    intro:
      "La medicina salva vite — e impone scelte che nessun protocollo risolve completamente. Chi ottiene l'ultimo organo disponibile per il trapianto quando cinque pazienti ne hanno bisogno? È etico porre fine a una vita per fermare una sofferenza irrimediabile? I vaccini dovrebbero essere obbligatori quando la salute pubblica entra in conflitto con la libertà individuale? La bioetica è il luogo in cui i principi astratti della filosofia morale si scontrano con decisioni concrete prese sotto pressione, con informazioni incomplete, contro un conto alla rovescia. Questi dilemmi non hanno risposte comode — solo compromessi tra valori che contano tutti.",
    primaryScenarioId: 'mercy-kill',
    relatedScenarioIds: ['organ-harvest', 'mandatory-vaccine', 'pandemic-dose', 'brain-upload'],
    relatedTopicSlugs: ['consequenzialismo', 'deontologia', 'etica-della-privacy'],
    researchNote:
      "Il framework dominante nella bioetica pratica — i quattro principi di Beauchamp e Childress (autonomia, non maleficenza, beneficenza, giustizia) — fornisce struttura per il ragionamento senza risolvere tutti i conflitti. Filosofi e clinici continuano a dibattere dove finisce l'autonomia e dove inizia l'obbligo collettivo.",
    researchSources: [
      {
        title: 'Bioethics',
        institution: 'Stanford Encyclopedia of Philosophy',
        url: 'https://plato.stanford.edu/entries/bioethics/',
      },
      {
        title: 'Voluntary Euthanasia',
        institution: 'Stanford Encyclopedia of Philosophy',
        url: 'https://plato.stanford.edu/entries/euthanasia-voluntary/',
      },
    ],
    status: 'published',
    noindexUntilReady: false,
  },
  // ── Experimental moral psychology (G11 — added 10 May 2026) ────────────────
  {
    slug: 'experimental-moral-psychology',
    locale: 'en',
    alternateSlug: 'psicologia-morale-sperimentale',
    topic: 'Moral Psychology',
    searchIntent: 'experimental moral psychology, moral intuition research, trolley problem study, why people disagree on ethics, dual process moral cognition',
    tension: 'fast emotional moral intuitions vs slow deliberative reasoning — and which one should we trust',
    headline: 'Moral Psychology — What Science Reveals About How We Make Ethical Decisions',
    intro:
      'Why do most people pull the lever but refuse to push someone off a bridge, even when the arithmetic is identical? Why does framing a choice as an action versus an omission change the verdict? And why do our snap moral judgments so often override our careful reasoning — or vice versa? Experimental moral psychology uses the methods of cognitive science to study how people actually make ethical decisions, not how they say they do. The dilemmas below are the same ones researchers use in labs to probe the hidden machinery of moral thought.',
    primaryScenarioId: 'trolley',
    relatedScenarioIds: ['self-driving-crash', 'robot-judge', 'organ-harvest', 'innocent-juror'],
    relatedTopicSlugs: ['trolley-problem', 'consequentialism', 'deontology', 'moral-foundations'],
    researchNote:
      'Researchers have found that people\'s responses to moral dilemmas are shaped by both fast emotional reactions and slower deliberative reasoning — and that these can conflict. The trolley problem family of cases has been central to this empirical research since the 1980s.',
    researchSources: [
      {
        title: 'Experimental Moral Philosophy',
        institution: 'Stanford Encyclopedia of Philosophy',
        url: 'https://plato.stanford.edu/entries/experimental-moral/',
      },
      {
        title: 'Moral Cognition Research',
        institution: 'Harvard University (Joshua Greene)',
        url: 'https://www.joshua-greene.net/research/moral-cognition',
      },
    ],
    status: 'published',
    noindexUntilReady: false,
  },
  {
    slug: 'psicologia-morale-sperimentale',
    locale: 'it',
    alternateSlug: 'experimental-moral-psychology',
    topic: 'Psicologia morale',
    searchIntent: 'psicologia morale sperimentale, ricerca intuizione morale, studio problema del carrello, perché le persone non sono d\'accordo sull\'etica, cognizione morale duale',
    tension: 'intuizioni morali emotive veloci contro ragionamento deliberativo lento — e quale dei due dobbiamo seguire',
    headline: 'Psicologia Morale — Cosa Rivela la Scienza su Come Prendiamo Decisioni Etiche',
    intro:
      "Perché la maggior parte delle persone abbassa la leva ma si rifiuta di spingere qualcuno giù da un ponte, anche quando la matematica è identica? Perché inquadrare una scelta come azione o come omissione cambia il verdetto? E perché i nostri giudizi morali immediati spesso sopraffanno il ragionamento attento — o viceversa? La psicologia morale sperimentale usa i metodi delle scienze cognitive per studiare come le persone prendono davvero le decisioni etiche, non come dicono di farlo. I dilemmi qui sotto sono gli stessi usati dai ricercatori nei laboratori per sondare la macchina nascosta del pensiero morale.",
    primaryScenarioId: 'trolley',
    relatedScenarioIds: ['self-driving-crash', 'robot-judge', 'organ-harvest', 'innocent-juror'],
    relatedTopicSlugs: ['problema-del-carrello', 'consequenzialismo', 'deontologia', 'fondamenti-morali'],
    researchNote:
      "I ricercatori hanno scoperto che le risposte delle persone ai dilemmi morali sono modellate sia da reazioni emotive rapide che da un ragionamento deliberativo più lento — e che questi possono entrare in conflitto. La famiglia di casi del problema del carrello è stata centrale in questa ricerca empirica dagli anni '80.",
    researchSources: [
      {
        title: 'Experimental Moral Philosophy',
        institution: 'Stanford Encyclopedia of Philosophy',
        url: 'https://plato.stanford.edu/entries/experimental-moral/',
      },
      {
        title: 'Moral Cognition Research',
        institution: 'Harvard University (Joshua Greene)',
        url: 'https://www.joshua-greene.net/research/moral-cognition',
      },
    ],
    status: 'published',
    noindexUntilReady: false,
  },
  {
    slug: 'etica-arte-ai',
    locale: 'it',
    alternateSlug: 'ai-art-ethics',
    topic: 'Etica dell\'Arte AI',
    searchIntent: 'etica arte ai, ai generativa autore, copyright arte ai, dilemmi morali arte generata da ai',
    tension: 'dati di addestramento raccolti senza consenso vs la legittimità artistica di un\'opera che nessuno ha scritto',
    headline: 'Etica dell\'Arte AI — A chi appartiene l\'opera fatta dalla macchina?',
    intro:
      'I modelli generativi producono dipinti, musica e prosa a costo quasi zero. I dati di addestramento, in molti casi, sono stati raccolti da artisti che non hanno mai dato il consenso e non sono mai stati pagati. La risposta legale è incerta tra giurisdizioni, ma la domanda etica è più tagliente: se il modello ha imparato lo stile di un artista vivente e ora qualcuno vende output in quello stile, cosa significa "autore"? E quando il risultato è tecnicamente nuovo ma riconoscibilmente derivativo, chi paga il costo morale — l\'utente, chi ha costruito il modello, o la piattaforma che lo ospita?',
    primaryScenarioId: 'ai-art-copyright',
    relatedScenarioIds: ['deepfake-expose', 'ai-replaces-jobs', 'self-driving-crash'],
    relatedTopicSlugs: ['dilemmi-etici-intelligenza-artificiale', 'etica-della-privacy', 'consequenzialismo'],
    researchNote:
      'Cause legali in corso negli Stati Uniti e nell\'UE stanno verificando se addestrare un modello su opere protette da copyright sia "fair use" o violazione. Stanford CRFM e l\'EU AI Act trattano entrambi la provenienza dei dati di addestramento come questione di primo piano; la domanda morale sull\'imitazione stilistica corre avanti a quella legale.',
    researchSources: [
      {
        title: 'Generative AI and the Future of Copyright',
        institution: 'Stanford Center for Research on Foundation Models',
        url: 'https://crfm.stanford.edu/',
      },
      {
        title: 'Privacy',
        institution: 'Stanford Encyclopedia of Philosophy',
        url: 'https://plato.stanford.edu/entries/privacy/',
      },
    ],
    status: 'published',
    noindexUntilReady: false,
  },

  // ── AI Companions & Teens (EN) ────────────────────────────────────────
  {
    slug: 'ai-companions-and-teens',
    locale: 'en',
    alternateSlug: 'ai-companion-adolescenti',
    topic: 'AI Companions & Teens',
    searchIntent: 'ai girlfriend, ai boyfriend, ai companion app, teen ai relationship, ai chatbot teens, character ai safety, ai companion under 18',
    tension: 'the comfort of artificial intimacy vs the developmental cost of relationships that never push back',
    headline: 'AI Companions and Teens — When Chatbots Replace First Crushes',
    intro:
      'AI companion apps have crossed from novelty to default for many adolescents. A 13-year-old can now have a romantic chat partner that remembers everything, never rejects them, and is always free. Mental-health researchers warn that this rewires how a young person learns relational repair, conflict, and reciprocity — the friction that turns infatuation into character. Lawmakers in several countries are debating age limits. Parents face a hard fork: forbid and risk hidden use, allow and risk dependency. The question is not whether AI companions exist — they do, at scale — but what it means to grow up alongside one.',
    primaryScenarioId: 'ai-companion-teen',
    relatedScenarioIds: ['ai-companion-ban', 'ai-grief-replica', 'delete-social-media', 'ai-replaces-jobs'],
    relatedTopicSlugs: ['ai-ethics-dilemmas', 'religion-and-ai-ethics', 'privacy-ethics'],
    researchNote:
      'Pediatric and adolescent-development research increasingly distinguishes between AI use that supports learning and AI relationships that bypass the social friction adolescents need. The Surgeon General report on youth and technology (2023) and ongoing work at MIT Media Lab on social robotics treat AI companionship as a category that demands its own framework, separate from social media.',
    researchSources: [
      {
        title: 'Social Media and Youth Mental Health — Surgeon General Advisory',
        institution: 'U.S. Department of Health and Human Services',
        url: 'https://www.hhs.gov/surgeongeneral/priorities/youth-mental-health/social-media/index.html',
      },
      {
        title: 'Personal Robots Group — Research',
        institution: 'MIT Media Lab',
        url: 'https://robotic.media.mit.edu/',
      },
    ],
    status: 'published',
    noindexUntilReady: false,
  },

  // ── AI Companions & Teens (IT) ────────────────────────────────────────
  {
    slug: 'ai-companion-adolescenti',
    locale: 'it',
    alternateSlug: 'ai-companions-and-teens',
    topic: 'AI Companion e Adolescenti',
    searchIntent: 'ai girlfriend italiano, ai companion app, app fidanzata virtuale, chatbot romantico minori, character ai sicurezza adolescenti, ai compagnia minori',
    tension: 'la comodità di un\'intimità artificiale vs il costo evolutivo di una relazione che non contraddice mai',
    headline: 'AI Companion e Adolescenti — Quando il Chatbot Sostituisce la Prima Cotta',
    intro:
      'Le app di compagnia AI sono passate dalla novità all\'abitudine per molti adolescenti. Un tredicenne può avere oggi un partner romantico digitale che ricorda tutto, non lo respinge mai ed è sempre gratis. Gli psicologi dello sviluppo avvertono che questo riscrive come un ragazzo impara a riparare un litigio, a gestire un conflitto e a reciprocare — quegli attriti che trasformano una cotta in carattere. Diversi paesi stanno discutendo limiti d\'età. I genitori vivono un dilemma duro: vietare e rischiare l\'uso nascosto, o permettere e rischiare la dipendenza. La domanda non è più se le AI companion esistano — esistono e sono diffuse — ma cosa significhi crescere accanto a una di loro.',
    primaryScenarioId: 'ai-companion-teen',
    relatedScenarioIds: ['ai-companion-ban', 'ai-grief-replica', 'delete-social-media', 'ai-replaces-jobs'],
    relatedTopicSlugs: ['dilemmi-etici-intelligenza-artificiale', 'religione-e-etica-ai', 'etica-della-privacy'],
    researchNote:
      'La ricerca sullo sviluppo adolescenziale distingue sempre più tra un uso dell\'AI che supporta l\'apprendimento e relazioni AI che aggirano l\'attrito sociale di cui gli adolescenti hanno bisogno. Il rapporto Surgeon General su giovani e tecnologia (2023) e il lavoro del MIT Media Lab sulla robotica sociale trattano la compagnia AI come una categoria che richiede una cornice etica separata dai social media.',
    researchSources: [
      {
        title: 'Social Media and Youth Mental Health — Surgeon General Advisory',
        institution: 'U.S. Department of Health and Human Services',
        url: 'https://www.hhs.gov/surgeongeneral/priorities/youth-mental-health/social-media/index.html',
      },
      {
        title: 'Personal Robots Group — Research',
        institution: 'MIT Media Lab',
        url: 'https://robotic.media.mit.edu/',
      },
    ],
    status: 'published',
    noindexUntilReady: false,
  },

  // ── Religion & AI Ethics (EN) ─────────────────────────────────────────
  {
    slug: 'religion-and-ai-ethics',
    locale: 'en',
    alternateSlug: 'religione-e-etica-ai',
    topic: 'Religion & AI Ethics',
    searchIntent: 'religion artificial intelligence ethics, vatican ai policy, papal encyclical ai, faith ai morality, religious view artificial intelligence, ai ethics religious leaders',
    tension: 'centuries-old moral frameworks vs systems no scripture anticipated',
    headline: 'Religion and AI Ethics — Who Decides What Machines Are Allowed to Do?',
    intro:
      'When a major religious leader publishes a document on artificial intelligence, secular tech leaders pay attention. Religious institutions speak for billions of people whose values shape consumer choices, voting patterns, and the legitimacy of new technologies. The question is whether faith-based ethics belongs in the room where AI policy is written — and if so, whose faith. The answer used to be optional. As AI touches medicine, end-of-life care, surveillance, and identity itself, it has become unavoidable. A century from now, ethicists may look back at this moment as the one where humans decided whether to let centuries of moral reasoning shape silicon, or to start the moral vocabulary over from scratch.',
    primaryScenarioId: 'pope-ai-encyclical',
    relatedScenarioIds: ['religious-ai-ethics', 'ai-prayer-app', 'robot-judge', 'mandatory-vaccine'],
    relatedTopicSlugs: ['ai-ethics-dilemmas', 'ai-companions-and-teens', 'moral-foundations'],
    researchNote:
      'The Vatican\'s engagement with AI ethics — including the Rome Call for AI Ethics signed in 2020 — sits alongside formal positions from Buddhist, Islamic, and Jewish institutions on automated decision-making. Academic centres like Oxford\'s Institute for Ethics in AI and Stanford\'s HAI have published on the role of religious moral traditions in shaping AI policy frameworks.',
    researchSources: [
      {
        title: 'Rome Call for AI Ethics',
        institution: 'Pontifical Academy for Life',
        url: 'https://www.romecall.org/',
      },
      {
        title: 'Institute for Ethics in AI',
        institution: 'University of Oxford',
        url: 'https://www.oxford-aiethics.ox.ac.uk/',
      },
    ],
    status: 'published',
    noindexUntilReady: false,
  },

  // ── Religion & AI Ethics (IT) ─────────────────────────────────────────
  {
    slug: 'religione-e-etica-ai',
    locale: 'it',
    alternateSlug: 'religion-and-ai-ethics',
    topic: 'Religione ed Etica AI',
    searchIntent: 'religione intelligenza artificiale, etica ai vaticano, enciclica papale ai, fede intelligenza artificiale, magnifica humanitas, autorità religiose ai',
    tension: 'cornici morali costruite in secoli vs sistemi che nessuna scrittura ha anticipato',
    headline: 'Religione ed Etica AI — Chi Decide Cosa È Lecito Fare alle Macchine?',
    intro:
      'Quando un\'autorità religiosa di grande influenza pubblica un documento sull\'intelligenza artificiale, i leader tech laici ascoltano. Le istituzioni religiose parlano per miliardi di persone i cui valori plasmano scelte di consumo, comportamenti di voto e la legittimità sociale di una nuova tecnologia. La domanda è se l\'etica basata sulla fede debba sedere al tavolo dove si scrive la policy AI — e in caso affermativo, quale fede. Un tempo la risposta era opzionale. Ora che l\'AI tocca medicina, fine vita, sorveglianza e identità, è diventata inevitabile. Tra un secolo gli storici dell\'etica potrebbero guardare a questo momento come a quello in cui l\'umanità ha deciso se lasciare che secoli di ragionamento morale plasmassero il silicio, o se ricominciare il vocabolario etico da zero.',
    primaryScenarioId: 'pope-ai-encyclical',
    relatedScenarioIds: ['religious-ai-ethics', 'ai-prayer-app', 'robot-judge', 'mandatory-vaccine'],
    relatedTopicSlugs: ['dilemmi-etici-intelligenza-artificiale', 'ai-companion-adolescenti', 'fondamenti-morali'],
    researchNote:
      'L\'impegno del Vaticano sull\'etica AI — incluso il Rome Call for AI Ethics firmato nel 2020 — si affianca a posizioni ufficiali di istituzioni buddiste, islamiche ed ebraiche sulle decisioni automatizzate. Centri accademici come l\'Institute for Ethics in AI di Oxford e Stanford HAI hanno pubblicato sul ruolo delle tradizioni morali religiose nel modellare le policy AI.',
    researchSources: [
      {
        title: 'Rome Call for AI Ethics',
        institution: 'Pontifical Academy for Life',
        url: 'https://www.romecall.org/',
      },
      {
        title: 'Institute for Ethics in AI',
        institution: 'University of Oxford',
        url: 'https://www.oxford-aiethics.ox.ac.uk/',
      },
    ],
    status: 'published',
    noindexUntilReady: false,
  },

  // ── The decline of sleepovers (EN-only — Anglo-cultural artefact) ─────
  {
    slug: 'sleepover-decline-parenting',
    locale: 'en',
    topic: 'Sleepover Decline',
    searchIntent: 'are sleepovers safe, sleepover age, kids sleepover decline, why parents stopped letting kids sleep over, helicopter parenting sleepovers',
    tension: 'protective parenting vs the small risks that practice independence is built on',
    headline: 'The Decline of the Sleepover — When Did Childhood Stop Risking the Night?',
    intro:
      'A generation ago, the first sleepover was a rite of passage. Today, in many neighborhoods, it has quietly become an opt-out event most families skip. The shift is partly about safety, partly about not knowing the other parents well enough, partly about a culture that has narrowed what childhood is allowed to risk. Researchers studying adolescent development describe a slow erosion of low-stakes, away-from-home experiences — the ones that used to teach children how to be away from a parent before being away counted. The question is whether the modern caution has prevented harm or just shifted it onto a slower timeline.',
    primaryScenarioId: 'sleepover-9yo',
    relatedScenarioIds: ['helicopter-gps-teen', 'ai-companion-teen', 'delete-social-media'],
    relatedTopicSlugs: ['ai-companions-and-teens', 'moral-foundations'],
    researchNote:
      'Developmental psychologists including Jonathan Haidt and Lenore Skenazy have argued that the decline in unsupervised time — including sleepovers and walking-to-school — correlates with rising anxiety in adolescents. The clinical consensus is unsettled: protective gains and developmental costs are both real and hard to disentangle in a single generation.',
    researchSources: [
      {
        title: 'Let Grow — Research on Childhood Independence',
        institution: 'Let Grow Foundation',
        url: 'https://letgrow.org/research/',
      },
      {
        title: 'The Anxious Generation — Research Hub',
        institution: 'After Babel / Jonathan Haidt',
        url: 'https://www.anxiousgeneration.com/research',
      },
    ],
    status: 'published',
    noindexUntilReady: false,
  },

  // ── AI scam economy (IT-only — IT used-market context) ─────────────────
  {
    slug: 'mercato-ai-truffe-online',
    locale: 'it',
    topic: 'Truffe AI Online',
    searchIntent: 'truffe ai online, recensioni false ai, bagarini bot biglietti, mercato usato truffe ia, scalper italia, recensioni amazon false',
    tension: 'la sopravvivenza nel mercato vs la complicità con un sistema che si sta degradando',
    headline: 'Truffe AI Online — Quando il Mercato Premia Chi Bara Meglio',
    intro:
      'Il mercato dell\'usato tech in Italia è arrivato a un punto di rottura quotidiano: recensioni gonfiate da AI generative, foto di prodotto false, bagarini con bot che esauriscono ogni drop limitato in trenta secondi. Le piattaforme verificano poco, i clienti non riescono a distinguere, e i venditori onesti si trovano a competere contro avversari che hanno semplicemente smesso di seguire le regole. La domanda non è più se il sistema sia rotto — lo è — ma se valga la pena, eticamente, comportarsi come se non lo fosse. Ogni piccolo commerciante affronta questo bivio ogni mese: aderire alla degenerazione o pagare il prezzo dell\'onestà unilaterale.',
    primaryScenarioId: 'ai-fake-review',
    relatedScenarioIds: ['scalper-bot', 'deepfake-expose', 'ai-replaces-jobs'],
    relatedTopicSlugs: ['dilemmi-etici-intelligenza-artificiale', 'ai-companion-adolescenti'],
    researchNote:
      'L\'Autorità Garante della Concorrenza e del Mercato (AGCM) ha avviato negli ultimi anni istruttorie su piattaforme di e-commerce per pratiche di recensione e prezzo opache. La letteratura sui mercati a "lemons" di George Akerlof descrive il meccanismo: quando i compratori non possono distinguere qualità, il prezzo crolla e i venditori onesti escono per primi.',
    researchSources: [
      {
        title: 'AGCM — Comunicati su pratiche commerciali scorrette',
        institution: 'Autorità Garante della Concorrenza e del Mercato',
        url: 'https://www.agcm.it/dotcmsdoc/allegati-news/',
      },
      {
        title: 'The Market for Lemons (Akerlof 1970)',
        institution: 'Quarterly Journal of Economics',
        url: 'https://www.jstor.org/stable/1879431',
      },
    ],
    status: 'published',
    noindexUntilReady: false,
  },
  {
    slug: 'test-situazionali',
    locale: 'it',
    alternateSlug: 'situational-dilemmas',
    topic: 'Dilemmi situazionali',
    searchIntent: 'dilemmi situazionali, test situazionale, cosa faresti se, domande etiche sul lavoro, test scelte morali, dilemmi quotidiani, come reagisci sotto pressione',
    tension: 'fare la cosa giusta in astratto contro proteggere le persone vicine quando la scelta è concreta e quotidiana',
    headline: 'Dilemmi Situazionali — Cosa Faresti Davvero Quando Nessuno Ti Guarda',
    intro:
      "Un collega si prende il merito della tua idea. Un amico bara a un concorso e batte un candidato onesto. Sei tu a dover decidere se fare un\'eccezione a una regola per chi se la merita. I dilemmi situazionali sono le scelte di tutti i giorni in cui due cose giuste si scontrano: l\'onestà e la lealtà, l\'equità e la cura, il momento e il precedente. Non hanno una risposta corretta e non misurano nessuna attitudine — servono a vedere come ragioni davvero quando la posta è reale ma piccola, e a confrontare il tuo istinto con quello di chi sceglie il contrario. Scegli, scopri come si divide il voto, e chiediti perché.",
    primaryScenarioId: 'stolen-credit',
    relatedScenarioIds: ['rule-exception-manager', 'friend-cheats-exam', 'cover-coworker-error', 'promotion-fire-teammate', 'group-project-freeloader'],
    relatedTopicSlugs: ['lealta-vs-onesta', 'psicologia-morale-sperimentale', 'fondamenti-morali'],
    researchNote:
      "La ricerca sul giudizio in situazioni realistiche studia come le persone scelgono di fronte a piccoli conflitti quotidiani di valori, non come dicono che sceglierebbero. Questi scenari sono pensati per riflessione e confronto: non sono un test psicometrico, una diagnosi o uno strumento di selezione del personale.",
    status: 'published',
    noindexUntilReady: false,
  },
  {
    slug: 'situational-dilemmas',
    locale: 'en',
    alternateSlug: 'test-situazionali',
    topic: 'Situational Dilemmas',
    searchIntent: 'situational dilemmas, what would you do if, everyday ethical dilemmas at work, moral choice scenarios, situational judgment questions, hard choices test',
    tension: 'doing the abstractly right thing vs protecting the people close to you when the choice is concrete and everyday',
    headline: 'Situational Dilemmas — What You\'d Really Do When No One Is Watching',
    intro:
      "A coworker takes credit for your idea. A friend cheats on a test and beats an honest candidate. You're the one who has to decide whether to bend a rule for someone who deserves it. Situational dilemmas are the everyday choices where two right things collide: honesty and loyalty, fairness and care, the moment and the precedent. They have no correct answer and measure no aptitude — they're a way to see how you actually reason when the stakes are real but small, and to compare your gut with people who chose the opposite. Pick a side, see how the vote splits, and ask yourself why.",
    primaryScenarioId: 'stolen-credit',
    relatedScenarioIds: ['rule-exception-manager', 'friend-cheats-exam', 'cover-coworker-error', 'promotion-fire-teammate', 'group-project-freeloader'],
    relatedTopicSlugs: ['loyalty-vs-honesty', 'experimental-moral-psychology', 'moral-foundations'],
    researchNote:
      "Research on judgment in realistic situations studies how people actually choose when small everyday value conflicts arise, not how they say they would. These scenarios are built for reflection and discussion: they are not a psychometric test, a diagnosis, or a personnel-selection tool.",
    status: 'published',
    noindexUntilReady: false,
  },

  // ── New clusters (Jun 2026) ─────────────────────────────────────────────
{
    slug: 'ethical-dilemmas',
    locale: 'en',
    alternateSlug: 'dilemmi-etici',
    topic: 'Ethical Dilemmas',
    searchIntent: 'ethical dilemmas, what are ethical dilemmas, ethical dilemma examples, moral dilemmas philosophy, famous ethical dilemmas, ethical dilemma definition, real life ethical dilemmas, ethical dilemma questions',
    tension: 'Ethical dilemmas expose the fault lines between our deepest values — revealing that doing the right thing often means choosing which principle to betray.',
    headline: 'Ethical Dilemmas: What Would You Actually Do?',
    intro: 'Every ethical dilemma is a stress test for your values. Philosophers have constructed them for millennia — from Plato\'s question of whether you should return a borrowed weapon to a man who has gone mad, to the trolley problems that filled twentieth-century journals — precisely because they expose the moments when our moral instincts pull in opposite directions and no clean answer survives scrutiny. The discomfort you feel reading a dilemma is not a sign that you are thinking about it wrong; it is a sign that you are taking it seriously. What makes these thought experiments powerful is not that they give us answers, but that they force us to discover what we actually believe when the comfortable abstractions of everyday ethics fall away. Thousands of people have faced the same choices here — see how your instincts compare, cast your vote, and find out what your pattern of decisions reveals about your moral personality.',
    primaryScenarioId: 'trolley',
    relatedScenarioIds: ['organ-harvest', 'mandatory-vaccine', 'ai-hiring', 'lifeboat', 'mercy-kill'],
    relatedTopicSlugs: ['trolley-problem', 'consequentialism', 'deontology', 'bioethics'],
    researchNote: 'The systematic study of ethical dilemmas as empirical tools was shaped decisively by Philippa Foot\'s 1967 paper introducing the trolley problem and Judith Jarvis Thomson\'s subsequent elaborations at MIT. Joshua Greene\'s dual-process theory, developed at Princeton and later Harvard, used fMRI evidence to argue that utilitarian and deontological responses arise from distinct neural systems — a finding that has generated both enthusiasm and sustained critique from philosophers including Fiery Cushman at Harvard\'s Moral Psychology Research Lab.',
    researchSources: [
      {
        title: 'The Problem of Abortion and the Doctrine of the Double Effect',
        institution: 'Oxford Review — Philippa Foot (via Stanford Encyclopedia of Philosophy)',
        url: 'https://plato.stanford.edu/entries/double-effect/'
      },
      {
        title: 'An fMRI Investigation of Emotional Engagement in Moral Judgment',
        institution: 'Science / Harvard University — Joshua Greene et al.',
        url: 'https://www.science.org/doi/10.1126/science.1062872'
      }
    ],
    status: 'published',
    noindexUntilReady: false
  },
  {
    slug: 'dilemmi-etici',
    locale: 'it',
    alternateSlug: 'ethical-dilemmas',
    topic: 'Dilemmi Etici',
    searchIntent: 'dilemmi etici, cosa sono i dilemmi etici, esempi di dilemmi etici, dilemmi morali filosofia, dilemmi etici famosi, dilemmi etici nella vita reale, domande sui dilemmi morali, dilemma etico definizione',
    tension: 'I dilemmi etici mettono a nudo le contraddizioni tra i nostri valori più profondi — rivelando che fare la cosa giusta significa spesso scegliere quale principio tradire.',
    headline: 'Dilemmi Etici: Cosa Faresti Davvero?',
    intro: 'Un dilemma etico è una prova di resistenza per i tuoi valori. I filosofi li costruiscono da millenni — dalla domanda di Platone se restituire un\'arma a chi è diventato pericoloso, ai problemi del carrello che hanno riempito le riviste accademiche del Novecento — proprio perché rivelano il momento in cui i nostri impulsi morali tirano in direzioni opposte e nessuna risposta netta sopravvive all\'esame. Il disagio che si prova di fronte a un dilemma non è un segnale che stai ragionando male; è il segnale che stai prendendo la questione sul serio. La forza di questi esperimenti mentali non sta nelle risposte che forniscono, ma nella capacità di farci scoprire cosa crediamo davvero quando le confortanti astrazioni dell\'etica quotidiana cedono il passo alla necessità concreta. Migliaia di persone hanno già affrontato le stesse scelte — scopri come si confrontano i tuoi istinti, vota e lascia che il tuo profilo morale emerga dalle tue stesse decisioni.',
    primaryScenarioId: 'trolley',
    relatedScenarioIds: ['organ-harvest', 'mandatory-vaccine', 'ai-hiring', 'lifeboat', 'mercy-kill'],
    relatedTopicSlugs: ['problema-del-carrello', 'consequenzialismo', 'deontologia', 'bioetica'],
    researchNote: 'Lo studio sistematico dei dilemmi etici come strumenti empirici deve molto a Philippa Foot, che nel 1967 introdusse il problema del carrello, e alle successive elaborazioni di Judith Jarvis Thomson al MIT. In Italia, la riflessione su etica e neuroscienze morali ha trovato spazio nelle ricerche di Corrado Sinigaglia all\'Università di Milano e nel lavoro di Salvatore Veca sull\'etica pubblica. A livello internazionale, la teoria del doppio processo di Joshua Greene — sviluppata a Princeton e Harvard — ha aperto un dibattito tuttora vivace sulla natura delle nostre intuizioni morali.',
    researchSources: [
      {
        title: 'The Problem of Abortion and the Doctrine of the Double Effect',
        institution: 'Stanford Encyclopedia of Philosophy — voce sul principio del doppio effetto',
        url: 'https://plato.stanford.edu/entries/double-effect/'
      },
      {
        title: 'An fMRI Investigation of Emotional Engagement in Moral Judgment',
        institution: 'Science / Harvard University — Joshua Greene et al.',
        url: 'https://www.science.org/doi/10.1126/science.1062872'
      }
    ],
    status: 'published',
    noindexUntilReady: false
  }
,
{
    slug: 'would-you-rather-hard',
    locale: 'en',
    alternateSlug: 'domande-impossibili-difficili',
    topic: 'Hard Would You Rather',
    searchIntent: 'hard would you rather questions, difficult would you rather dilemmas, impossible would you rather choices, would you rather questions with no good answer, deep would you rather questions, challenging would you rather moral, would you rather hard edition',
    tension: 'When every available option carries real moral cost, choosing reveals not just preference but the hierarchy of values you actually live by.',
    headline: 'Hard Would You Rather Questions That Actually Make You Think',
    intro: 'Most "would you rather" questions are trivially easy — would you rather be rich or famous, fly or be invisible. The hard ones are different. They are hard precisely because both options are genuinely bad, and refusing to choose is its own kind of answer. Psychologists who study moral cognition call this a "genuine dilemma": a situation where every path forward sacrifices something you care about, and the sacrifice is irreversible. These questions do not test your imagination; they test the shape of your values — which commitments you will protect when protection comes at a price. The scenarios below have no correct answer. They have your answer, and someone else\'s, and the gap between them is worth understanding.',
    primaryScenarioId: 'lifeboat',
    relatedScenarioIds: ['trolley', 'organ-harvest', 'zombie-apocalypse', 'mercy-kill', 'loyalty-job'],
    relatedTopicSlugs: ['consequentialism', 'deontology', 'bioethics', 'moral-foundations'],
    researchNote: 'Psychologist Joshua Greene at Harvard\'s Moral Cognition Lab has shown through fMRI studies that genuinely difficult dilemmas — those where utilitarian and deontological intuitions conflict — activate distinct neural systems, producing measurable response-time delays and higher reported distress. Separately, Fiery Cushman\'s work on model-based versus habitual moral judgment at the same lab suggests that hard binary choices disrupt automatic responding and force deliberate reasoning, which is why they feel cognitively costly in a way that easy choices do not.',
    researchSources: [
      {
        title: 'An fMRI investigation of emotional engagement in moral judgment',
        institution: 'Harvard University / Science',
        url: 'https://www.science.org/doi/10.1126/science.1062872'
      },
      {
        title: 'Action, outcome, and value: A dual-system framework for morality',
        institution: 'Harvard University / Personality and Social Psychology Review',
        url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3693613/'
      }
    ],
    status: 'published',
    noindexUntilReady: false
  },
  {
    slug: 'domande-impossibili-difficili',
    locale: 'it',
    alternateSlug: 'would-you-rather-hard',
    topic: 'Domande Impossibili Difficili',
    searchIntent: 'domande impossibili difficili, domande would you rather difficili, dilemmi morali impossibili, domande senza risposta giusta, domande profonde sul carattere, scelte impossibili etiche, would you rather versione difficile italiano',
    tension: 'Quando entrambe le opzioni costano qualcosa di reale, la scelta non rivela un\'opinione ma la gerarchia di valori che guida davvero la nostra vita.',
    headline: 'Domande impossibili difficili: dilemmi senza risposta giusta',
    intro: 'Le domande facili non dicono nulla di chi siamo. Le domande impossibili — quelle in cui ogni risposta comporta una perdita reale e irreversibile — sono un\'altra cosa: sono uno specchio. La psicologia morale le chiama "dilemmi autentici", situazioni in cui nessuna via d\'uscita lascia le mani pulite. Non si tratta di scegliere tra il bene e il male, ma tra due forme diverse di danno, tra due lealtà incompatibili, tra due principi che normalmente non entriamo mai in conflitto. Quello che scegli in questi scenari non dipende da quanto sei intelligente o quanto sei buono: dipende da quale valore, nel momento della pressione, stai davvero disposto a difendere. Vota, scopri come ragionano gli altri e confronta la tua bussola morale con quella di migliaia di persone.',
    primaryScenarioId: 'lifeboat',
    relatedScenarioIds: ['trolley', 'organ-harvest', 'zombie-apocalypse', 'mercy-kill', 'loyalty-job'],
    relatedTopicSlugs: ['consequenzialismo', 'deontologia', 'bioetica', 'fondamenti-morali'],
    researchNote: 'Il filosofo Bernard Williams ha introdotto il concetto di "integrità morale" per descrivere il costo psicologico e identitario che deriva dal tradire i propri impegni di fondo, anche quando la logica utilitaristica suggerirebbe di farlo. Ricerche successive condotte da Fiery Cushman e colleghi alla Harvard Moral Cognition Lab hanno dimostrato sperimentalmente che i dilemmi binari ad alto costo attivano sistemi cognitivi distinti rispetto alle scelte ordinarie, producendo tempi di risposta più lenti, maggiore attivazione emotiva e, spesso, risposte incoerenti tra soggetti con valori dichiarati simili.',
    researchSources: [
      {
        title: 'A Critique of Utilitarianism — in Utilitarianism: For and Against',
        institution: 'Cambridge University Press',
        url: 'https://www.cambridge.org/core/books/utilitarianism-for-and-against/critique-of-utilitarianism/6C84C6B5E1A6AA7BEB36E1D84AA62D58'
      },
      {
        title: 'Action, outcome, and value: A dual-system framework for morality',
        institution: 'Harvard University / Personality and Social Psychology Review',
        url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3693613/'
      }
    ],
    status: 'published',
    noindexUntilReady: false
  }
,
{
    slug: 'moral-psychology-test',
    locale: 'en',
    alternateSlug: 'test-psicologia-morale',
    topic: 'Moral Psychology Test',
    searchIntent: 'moral psychology test, test your moral values, moral reasoning quiz, how do I make ethical decisions, moral dilemma test online, what kind of moral thinker am I, ethics personality test, trolley problem psychology',
    tension: 'The choices you make in hypothetical dilemmas expose the moral architecture you actually operate by — not the one you think you have.',
    headline: 'Moral Psychology Test: What Do Your Choices Reveal',
    intro: 'Most of us believe we know our own values. We say we care about fairness, loyalty, honesty — and we mean it. But moral psychology research has shown, repeatedly, that what people say they believe and what they actually do when forced to choose can be strikingly different things. Dilemmas are not tricks or riddles. They are controlled situations designed to isolate the factors that drive moral judgment — whether you weight outcomes, duties, relationships, or gut instinct. On SplitVote, each scenario puts you at a genuine crossroads where both paths carry a real cost, and your response tells you something that no personality questionnaire can. Vote on a dilemma, see how tens of thousands of other people reasoned through the same choice, and find out where your moral compass actually points.',
    primaryScenarioId: 'trolley',
    relatedScenarioIds: ['organ-harvest', 'mandatory-vaccine', 'innocent-juror', 'friend-cheats-exam'],
    relatedTopicSlugs: ['experimental-moral-psychology', 'consequentialism', 'deontology', 'moral-foundations'],
    researchNote: 'Jonathan Haidt at NYU and Joshua Greene at Harvard have independently shown that moral intuitions are faster and more emotion-driven than classical rational-choice theory predicts — Greene\'s dual-process model distinguishes automatic "deontological" gut reactions from slower utilitarian deliberation. Haidt\'s Moral Foundations Theory further identifies six universal moral dimensions (care, fairness, loyalty, authority, sanctity, liberty) that explain variation in moral judgment across cultures and political groups.',
    researchSources: [
      {
        title: 'The Emotional Dog and Its Rational Tail: A Social Intuitionist Approach to Moral Judgment',
        institution: 'American Psychological Association / Psychological Review',
        url: 'https://psycnet.apa.org/record/2001-01061-004'
      },
      {
        title: 'An fMRI Investigation of Emotional Engagement in Moral Judgment',
        institution: 'Harvard University / Science',
        url: 'https://www.science.org/doi/10.1126/science.1062872'
      }
    ],
    status: 'published',
    noindexUntilReady: false
  },
  {
    slug: 'test-psicologia-morale',
    locale: 'it',
    alternateSlug: 'moral-psychology-test',
    topic: 'Test Psicologia Morale',
    searchIntent: 'test psicologia morale, test valori morali, quiz etico online, come ragiono moralmente, dilemmi morali test, scopri il tuo profilo morale, test ragionamento etico, problema del carrello psicologia',
    tension: 'Le scelte che compiamo di fronte a dilemmi ipotetici rivelano l\'architettura morale che guida davvero le nostre azioni — non quella che crediamo di avere.',
    headline: 'Test di psicologia morale: cosa rivelano le tue scelte',
    intro: 'La maggior parte di noi è convinta di conoscere i propri valori. Diciamo di credere nell\'equità, nella lealtà, nell\'onestà — e lo diciamo in buona fede. Eppure la ricerca in psicologia morale ha dimostrato, più volte e con metodi rigorosi, che esiste uno scarto significativo tra ciò che le persone dichiarano di credere e ciò che scelgono realmente quando sono costrette a decidere. I dilemmi morali non sono trabocchetti né indovinelli: sono situazioni costruite per isolare le variabili che orientano il giudizio etico — il peso dei risultati, il rispetto delle regole, la fedeltà ai legami personali, l\'istinto immediato. Su SplitVote ogni scenario ti pone di fronte a un bivio autentico in cui entrambe le strade comportano un costo reale, e la tua risposta rivela qualcosa che nessun questionario di personalità riesce a cogliere. Vota un dilemma, scopri come hanno ragionato migliaia di altre persone di fronte alla stessa scelta, e osserva dove punta davvero la tua bussola morale.',
    primaryScenarioId: 'trolley',
    relatedScenarioIds: ['organ-harvest', 'mandatory-vaccine', 'innocent-juror', 'friend-cheats-exam'],
    relatedTopicSlugs: ['psicologia-morale-sperimentale', 'consequenzialismo', 'deontologia', 'fondamenti-morali'],
    researchNote: 'Jonathan Haidt della New York University e Joshua Greene di Harvard hanno dimostrato indipendentemente che le intuizioni morali sono più rapide e più influenzate dall\'emozione di quanto preveda la teoria classica della scelta razionale. Il modello a doppio processo di Greene distingue le reazioni deontologiche automatiche dalla deliberazione utilitaristica più lenta e riflessiva. La Moral Foundations Theory di Haidt individua sei dimensioni morali universali — cura, equità, lealtà, autorità, purezza, libertà — che spiegano le variazioni nel giudizio morale tra culture e orientamenti politici diversi.',
    researchSources: [
      {
        title: 'The Emotional Dog and Its Rational Tail: A Social Intuitionist Approach to Moral Judgment',
        institution: 'American Psychological Association / Psychological Review',
        url: 'https://psycnet.apa.org/record/2001-01061-004'
      },
      {
        title: 'An fMRI Investigation of Emotional Engagement in Moral Judgment',
        institution: 'Harvard University / Science',
        url: 'https://www.science.org/doi/10.1126/science.1062872'
      }
    ],
    status: 'published',
    noindexUntilReady: false
  }
,
{
    slug: 'workplace-dilemmas',
    locale: 'en',
    alternateSlug: 'dilemmi-sul-lavoro',
    topic: 'Workplace Ethics Dilemmas',
    searchIntent: 'ethical dilemmas at work, moral dilemmas in the workplace, workplace ethics scenarios, ethical situations at work examples, work dilemma would you rather, stealing credit at work ethics, should I cover for a coworker mistake, AI disclosure at work ethics',
    tension: 'Loyalty to colleagues and self-preservation pull against honesty, fairness, and institutional integrity — and the workplace makes every choice visible to people who hold power over your future.',
    headline: 'Real Workplace Dilemmas That Test Your Ethics at Work',
    intro: 'The philosophy classroom talks about runaway trolleys, but the dilemmas that actually keep people up at night happen in meeting rooms and Slack threads. A colleague presents your idea as their own. Your manager asks you to bend a rule just this once. A teammate made a serious error and is looking at you to stay quiet. These are not hypotheticals — they are the moral terrain of every working life, and the choices people make in them reveal more about character than any performance review ever could. The stakes are real: careers, reputations, and the unspoken social contracts that hold teams together. Vote on the scenarios below to see where your instincts sit — and how millions of others have weighed the same impossible calls.',
    primaryScenarioId: 'stolen-credit',
    relatedScenarioIds: ['stolen-credit', 'cover-coworker-error', 'rule-exception-manager', 'promotion-fire-teammate', 'ai-work-disclosure'],
    relatedTopicSlugs: ['loyalty-vs-honesty', 'ai-ethics-dilemmas', 'virtue-ethics', 'deontology'],
    researchNote: 'Research by Linda Treviño at Penn State and her collaborators has shown that ethical decision-making in organizations is heavily shaped by perceived managerial modeling and psychological safety — people are far less likely to report misconduct when they believe leadership implicitly condones it. A landmark study by James Rest (University of Minnesota) using the Defining Issues Test found that professional context, including workplace hierarchies, substantially alters how individuals reason through moral scenarios compared to abstract philosophical framing.',
    researchSources: [
      {
        title: 'Ethical Leadership: A Social Learning Perspective for Construct Development and Testing',
        institution: 'Penn State University / Organizational Behavior and Human Decision Processes',
        url: 'https://www.sciencedirect.com/science/article/pii/S0749597804000890'
      },
      {
        title: 'The Defining Issues Test: A Review of Development, Revisions, and Scoring',
        institution: 'University of Minnesota / Journal of Moral Education',
        url: 'https://www.tandfonline.com/doi/abs/10.1080/0305724960250402'
      }
    ],
    status: 'published',
    noindexUntilReady: false
  },
  {
    slug: 'dilemmi-sul-lavoro',
    locale: 'it',
    alternateSlug: 'workplace-dilemmas',
    topic: 'Dilemmi Etici sul Lavoro',
    searchIntent: 'dilemmi etici sul lavoro, situazioni morali in ufficio, dilemmi morali lavorativi, cosa fare se il collega si prende il merito, coprire un errore del collega, etica professionale esempi, dilemma intelligenza artificiale al lavoro, decisioni difficili in azienda',
    tension: 'La lealtà verso i colleghi e la tutela di sé stessi entrano in collisione con l\'onestà, l\'equità e l\'integrità istituzionale — e il contesto lavorativo rende ogni scelta visibile a chi ha potere sul tuo futuro.',
    headline: 'Dilemmi Etici sul Lavoro: Scenari Reali che Mettono alla Prova la Tua Morale',
    intro: 'I grandi dilemmi morali non si trovano solo nei libri di filosofia: si presentano nelle riunioni, nelle email, nei corridoi dell\'ufficio. Un collega si appropria della tua idea davanti al capo. Il manager ti chiede di fare un\'eccezione alla procedura, solo questa volta. Un errore grave è stato commesso, e chi ti sta accanto ti guarda sperando nel silenzio. Queste situazioni non sono esercizi astratti — sono la realtà quotidiana di chi lavora, e le scelte che si fanno in quei momenti dicono molto più di qualsiasi valutazione delle prestazioni. In gioco ci sono carriere, reputazioni e i patti non scritti che tengono insieme i team. Vota gli scenari qui sotto per scoprire dove ti portano i tuoi istinti — e come milioni di altre persone hanno affrontato le stesse scelte impossibili.',
    primaryScenarioId: 'stolen-credit',
    relatedScenarioIds: ['stolen-credit', 'cover-coworker-error', 'rule-exception-manager', 'promotion-fire-teammate', 'ai-work-disclosure'],
    relatedTopicSlugs: ['lealta-vs-onesta', 'dilemmi-etici-intelligenza-artificiale', 'etica-della-virtu', 'deontologia'],
    researchNote: 'Le ricerche di Linda Treviño della Penn State University dimostrano che il comportamento etico nelle organizzazioni dipende in larga misura dai modelli manageriali percepiti e dalla sicurezza psicologica: le persone sono molto meno propense a segnalare comportamenti scorretti quando credono che la leadership li tolleri implicitamente. Gli studi di James Rest dell\'Università del Minnesota, condotti attraverso il Defining Issues Test, hanno inoltre evidenziato che il contesto professionale — incluse le gerarchie aziendali — modifica significativamente il ragionamento morale rispetto alla formulazione filosofica astratta.',
    researchSources: [
      {
        title: 'Ethical Leadership: A Social Learning Perspective for Construct Development and Testing',
        institution: 'Penn State University / Organizational Behavior and Human Decision Processes',
        url: 'https://www.sciencedirect.com/science/article/pii/S0749597804000890'
      },
      {
        title: 'The Defining Issues Test: A Review of Development, Revisions, and Scoring',
        institution: 'University of Minnesota / Journal of Moral Education',
        url: 'https://www.tandfonline.com/doi/abs/10.1080/0305724960250402'
      }
    ],
    status: 'published',
    noindexUntilReady: false
  },
  {
    slug: 'types-of-ethical-dilemmas',
    locale: 'en',
    alternateSlug: 'tipi-di-dilemmi-etici',
    topic: 'Types of Ethical Dilemmas',
    searchIntent: 'informational — taxonomy and framework',
    tension: 'How do we categorise moral conflicts so we can reason about them more clearly?',
    headline: 'The 4 Types of Ethical Dilemmas — and Where You Stand on Each',
    intro: "Most moral conflicts are not between good and evil. They are between two goods: honesty and loyalty, individual rights and community welfare, immediate needs and long-term consequences, justice and mercy. Philosopher Rushworth Kidder identified these four core paradigms in 1995. On SplitVote, every dilemma maps onto at least one of them — and the data shows which type splits people most persistently.",
    primaryScenarioId: 'truth-friend',
    relatedScenarioIds: ['innocent-juror', 'zombie-apocalypse', 'mandatory-vaccine', 'river-factory', 'reformed-offender', 'mercy-kill', 'climate-flight', 'confess-crime'],
    relatedTopicSlugs: ['ethical-dilemmas', 'would-you-rather-hard', 'workplace-dilemmas'],
    researchNote: "Framework from Rushworth Kidder, How Good People Make Tough Choices (1995). Truth vs Loyalty: honesty versus allegiance. Individual vs Community: autonomy versus collective welfare. Short-term vs Long-term: immediate costs versus future consequences. Justice vs Mercy: consistent rules versus compassionate exceptions. SplitVote data shows Justice vs Mercy and Truth vs Loyalty produce the most even splits.",
    researchSources: [
      {
        title: 'How Good People Make Tough Choices',
        institution: 'Free Press / Simon & Schuster',
        url: 'https://www.simonandschuster.com/books/How-Good-People-Make-Tough-Choices/Rushworth-M-Kidder/9780688175337'
      }
    ],
    status: 'published',
    noindexUntilReady: false
  },
  {
    slug: 'tipi-di-dilemmi-etici',
    locale: 'it',
    alternateSlug: 'types-of-ethical-dilemmas',
    topic: 'Tipi di dilemmi etici',
    searchIntent: 'informazionale — tassonomia e quadro concettuale',
    tension: "Come categorizziamo i conflitti morali per ragionarci con più chiarezza?",
    headline: 'I 4 tipi di dilemmi etici — e dove ti posizioni su ciascuno',
    intro: "La maggior parte dei conflitti morali non contrappone il bene al male. Contrappone il bene al bene: onestà e lealtà, diritti individuali e benessere comunitario, bisogni immediati e conseguenze a lungo termine, giustizia e misericordia. Il filosofo Rushworth Kidder ha identificato questi quattro paradigmi nel 1995. Su SplitVote, ogni dilemma mappa su almeno uno di essi — e i dati mostrano quale tipo divide le persone più persistentemente.",
    primaryScenarioId: 'truth-friend',
    relatedScenarioIds: ['innocent-juror', 'zombie-apocalypse', 'mandatory-vaccine', 'river-factory', 'reformed-offender', 'mercy-kill', 'climate-flight', 'confess-crime'],
    relatedTopicSlugs: ['dilemmi-etici', 'domande-impossibili-difficili', 'dilemmi-sul-lavoro'],
    researchNote: "Quadro da Rushworth Kidder, Come le persone oneste affrontano le scelte difficili (1995). I dati di SplitVote mostrano che Giustizia vs. Misericordia e Verità vs. Lealtà producono le divisioni più equilibrate tra le quattro categorie.",
    researchSources: [
      {
        title: 'How Good People Make Tough Choices',
        institution: 'Free Press / Simon & Schuster',
        url: 'https://www.simonandschuster.com/books/How-Good-People-Make-Tough-Choices/Rushworth-M-Kidder/9780688175337'
      }
    ],
    status: 'published',
    noindexUntilReady: false
  },
  {
    slug: 'animal-ethics',
    locale: 'en',
    alternateSlug: 'etica-animale',
    topic: 'Animal Ethics',
    searchIntent: 'informational — animal rights, speciesism, ethics of eating meat and animal testing',
    tension: "Do animals' interests count morally — and how much — when respecting them costs us something?",
    headline: 'Animal Ethics: Where Do You Draw the Line?',
    intro: "Almost everyone agrees animals deserve some moral consideration. The disagreement starts the moment it costs us something — a meal, a medicine, a pet, a zoo ticket. Animal ethics asks one underlying question: if a creature can suffer, how much weight do its interests carry against ours? These dilemmas move the line by changing the price of the principle — from giving up meat to approving research that harms animals to save human lives. Vote, then see where you stand against everyone else.",
    primaryScenarioId: 'eat-meat',
    relatedScenarioIds: ['eat-meat', 'animal-testing-cure', 'breeder-vs-shelter', 'zoo-conservation'],
    relatedTopicSlugs: ['ethical-dilemmas', 'bioethics', 'moral-psychology-test'],
    researchNote: "Modern animal ethics is shaped by Peter Singer's argument that the capacity to suffer, not species, grounds moral consideration, and by Tom Regan's rights-based view that some animals are 'subjects of a life' with inherent value.",
    researchSources: [
      {
        title: 'Animal Liberation',
        institution: 'HarperCollins',
        url: 'https://www.harpercollins.com/products/animal-liberation-now-peter-singer'
      }
    ],
    status: 'published',
    noindexUntilReady: false
  },
  {
    slug: 'etica-animale',
    locale: 'it',
    alternateSlug: 'animal-ethics',
    topic: 'Etica animale',
    searchIntent: 'informazionale — diritti degli animali, specismo, etica del mangiare carne e della sperimentazione',
    tension: "Gli interessi degli animali contano moralmente — e quanto — quando rispettarli ci costa qualcosa?",
    headline: 'Etica animale: dove tracci il confine?',
    intro: "Quasi tutti concordano che gli animali meritino una qualche considerazione morale. Il disaccordo inizia nel momento in cui ci costa qualcosa — un pasto, una medicina, un animale domestico, un biglietto dello zoo. L'etica animale pone una domanda di fondo: se una creatura può soffrire, quanto pesano i suoi interessi rispetto ai nostri? Questi dilemmi spostano il confine cambiando il prezzo del principio — dal rinunciare alla carne all'approvare una ricerca che danneggia gli animali per salvare vite umane. Vota, poi scopri dove ti collochi rispetto a tutti gli altri.",
    primaryScenarioId: 'eat-meat',
    relatedScenarioIds: ['eat-meat', 'animal-testing-cure', 'breeder-vs-shelter', 'zoo-conservation'],
    relatedTopicSlugs: ['dilemmi-etici', 'bioetica', 'test-psicologia-morale'],
    researchNote: "L'etica animale moderna è plasmata dall'argomento di Peter Singer secondo cui è la capacità di soffrire, non la specie, a fondare la considerazione morale, e dalla prospettiva dei diritti di Tom Regan, per cui alcuni animali sono 'soggetti di una vita' con valore intrinseco.",
    researchSources: [
      {
        title: 'Animal Liberation',
        institution: 'HarperCollins',
        url: 'https://www.harpercollins.com/products/animal-liberation-now-peter-singer'
      }
    ],
    status: 'published',
    noindexUntilReady: false
  },
]

export function getTopicBySlugAndLocale(slug: string, locale: 'en' | 'it'): SeoTopic | undefined {
  return SEO_TOPICS.find((t) => t.slug === slug && t.locale === locale)
}

/** EN-only: app/[topicSlug] only serves EN topics. */
export function getPublishedTopics(): SeoTopic[] {
  return SEO_TOPICS.filter((t) => t.status === 'published' && t.locale === 'en')
}

/** Topics that are published, EN-only, not noindex-gated, and have sufficient content for indexing. */
export function getIndexableTopics(): SeoTopic[] {
  return SEO_TOPICS.filter(
    (t) => t.status === 'published' && t.locale === 'en' && !t.noindexUntilReady && t.relatedScenarioIds.length >= 3,
  )
}

/** IT-only: app/it/[topicSlug] only serves IT topics. */
export function getPublishedITTopics(): SeoTopic[] {
  return SEO_TOPICS.filter((t) => t.status === 'published' && t.locale === 'it')
}

/** Topics that are published, IT-only, not noindex-gated, and have sufficient content for indexing. */
export function getIndexableITTopics(): SeoTopic[] {
  return SEO_TOPICS.filter(
    (t) => t.status === 'published' && t.locale === 'it' && !t.noindexUntilReady && t.relatedScenarioIds.length >= 3,
  )
}
