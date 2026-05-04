export type SeoTopicStatus = 'published' | 'draft'

export interface SeoTopic {
  /** URL slug — must not appear in RESERVED_SLUGS, no proper nouns */
  slug: string
  /**
   * Route affinity: 'en' → served by app/[topicSlug] (root route).
   * 'it' → schema-ready but requires app/it/[topicSlug] (not yet implemented).
   * getPublishedTopics() and getIndexableTopics() guard the root route to EN-only.
   */
  locale: 'en' | 'it'
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

// ─── Collision guard ────────────────────────────────────────────────────────
// All slugs reserved by existing Next.js routes at app/ root level.
// generateStaticParams() in app/[topicSlug]/page.tsx throws if any topic slug matches.
export const RESERVED_SLUGS = new Set([
  'it', 'play', 'results', 'category', 'blog', 'admin', 'api', 'login',
  'privacy', 'terms', 'faq', 'trending', 'profile', 'dashboard',
  'personality', 'moral-dilemmas', 'would-you-rather-questions',
  'submit-poll', 'reset-password', 'auth', 'business', 'offline', 'u',
  'sitemap', 'robots', 'favicon', 'icon', 'not-found',
])

// ─── Landing page QA checklist (verify before setting status='published') ───
// [ ] Unique intro — not copy-pasted from another topic
// [ ] primaryScenarioId is a valid id in lib/scenarios.ts
// [ ] relatedScenarioIds has ≥ 3 entries, all valid ids in lib/scenarios.ts
// [ ] slug is not in RESERVED_SLUGS (enforced at build — throws if violated)
// [ ] No proper nouns or brand names in headline, intro, topic, or tension
// [ ] canonical URL matches the slug exactly
// [ ] status='published' && noindexUntilReady=false → appears in sitemap
// [ ] noindexUntilReady=true OR relatedScenarioIds.length < 3 → noindex meta

export const SEO_TOPICS: SeoTopic[] = [
  {
    slug: 'trolley-problem',
    locale: 'en',
    topic: 'Trolley Problem',
    searchIntent: 'trolley problem moral dilemma, trolley problem ethics, would you pull the lever',
    tension: 'utilitarian calculus vs the prohibition on causing direct harm',
    headline: 'The Trolley Problem — Would You Pull the Lever?',
    intro:
      'A runaway trolley is heading toward five people tied to the tracks. You stand beside a lever that diverts it — but the alternate track holds one person. Pull the lever and you actively cause one death to prevent five. Do nothing and five die without your hand on the switch. This thought experiment has shaped moral philosophy for decades: it forces a choice between maximising the number of lives saved and the absolute constraint against causing harm directly.',
    primaryScenarioId: 'trolley',
    relatedScenarioIds: ['organ-harvest', 'time-machine', 'lifeboat', 'plane-parachute'],
    relatedTopicSlugs: ['ai-ethics-dilemmas', 'loyalty-vs-honesty'],
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
    topic: 'AI Ethics',
    searchIntent: 'AI ethics dilemma, self-driving car moral dilemma, artificial intelligence ethical questions',
    tension: 'algorithmic optimisation vs human moral judgment and accountability',
    headline: 'AI Ethics Dilemmas — When Machines Must Choose',
    intro:
      'Autonomous systems now make decisions that were once reserved for human judgment. A vehicle\'s brakes fail and the algorithm must decide who bears the risk. A sentencing tool assigns a score that shapes years of someone\'s life. An AI produces work no human authored — and ownership law has no clear answer. These are not speculative futures: they are decisions being encoded today. When a machine chooses wrong, who is accountable?',
    primaryScenarioId: 'self-driving-crash',
    relatedScenarioIds: ['robot-judge', 'ai-replaces-jobs', 'brain-upload', 'ai-art-copyright'],
    relatedTopicSlugs: ['trolley-problem', 'loyalty-vs-honesty'],
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
    topic: 'Loyalty vs Honesty',
    searchIntent: 'loyalty vs honesty dilemma, ethical dilemma betraying a friend, should I tell the truth when it hurts',
    tension: 'personal loyalty and protecting loved ones vs moral duty to honesty and justice',
    headline: 'Loyalty vs Honesty — When Telling the Truth Has a Price',
    intro:
      'The people closest to us make mistakes — sometimes serious ones. When a partner, friend, or family member does something wrong, the pull between protecting them and telling the truth is one of the sharpest tensions in everyday ethics. Staying loyal can mean shielding wrongdoing from the people it harmed. Speaking honestly can destroy a relationship built over years. These dilemmas test whether loyalty is a moral virtue or a cover for harm that should come to light.',
    primaryScenarioId: 'cover-accident',
    relatedScenarioIds: ['sibling-secret', 'report-friend', 'truth-friend', 'whistleblower'],
    relatedTopicSlugs: ['trolley-problem', 'ai-ethics-dilemmas'],
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
]

export function getTopicBySlug(slug: string): SeoTopic | undefined {
  return SEO_TOPICS.find((t) => t.slug === slug)
}

/** EN-only: app/[topicSlug] only serves EN topics. IT topics require app/it/[topicSlug] (not yet built). */
export function getPublishedTopics(): SeoTopic[] {
  return SEO_TOPICS.filter((t) => t.status === 'published' && t.locale === 'en')
}

/** Topics that are published, EN-only, not noindex-gated, and have sufficient content for indexing. */
export function getIndexableTopics(): SeoTopic[] {
  return SEO_TOPICS.filter(
    (t) => t.status === 'published' && t.locale === 'en' && !t.noindexUntilReady && t.relatedScenarioIds.length >= 3,
  )
}
