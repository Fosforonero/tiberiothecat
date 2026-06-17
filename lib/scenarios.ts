export type Category =
  | 'morality'
  | 'survival'
  | 'loyalty'
  | 'justice'
  | 'freedom'
  | 'technology'
  | 'society'
  | 'relationships'
  | 'lifestyle'

export interface Scenario {
  id: string
  question: string
  optionA: string
  optionB: string
  emoji: string
  category: Category
}

export const scenarios: Scenario[] = [
  // ── MORALITY ──────────────────────────────────────────────────
  {
    id: 'trolley',
    question: 'A runaway trolley is heading toward 5 people. You can pull a lever to divert it — but it will kill 1 person instead.',
    optionA: 'Pull the lever. Save 5, sacrifice 1.',
    optionB: 'Do nothing. Let fate decide.',
    emoji: '🚋',
    category: 'morality',
  },
  {
    id: 'cure-secret',
    question: "You discover a cure for cancer, but it only works if you keep the formula secret — sharing it would destroy the compound's effectiveness forever.",
    optionA: 'Keep it secret. Save millions quietly.',
    optionB: 'Share it. Science belongs to everyone.',
    emoji: '💊',
    category: 'morality',
  },
  {
    id: 'memory-erase',
    question: "A pill erases all your painful memories — but also the lessons you learned from them. You become happier but more naive.",
    optionA: 'Take the pill. Happiness matters.',
    optionB: 'Refuse. Pain made you who you are.',
    emoji: '🧠',
    category: 'morality',
  },
  {
    id: 'steal-medicine',
    question: "Your child is dying and needs medicine you cannot afford. You could steal it. The store owner is not evil — just running a business.",
    optionA: 'Steal it. Your child comes first.',
    optionB: "Don't steal. Don't cross that line.",
    emoji: '💉',
    category: 'morality',
  },
  {
    id: 'organ-harvest',
    question: "You are a doctor. One healthy patient's organs could save the lives of 5 people dying in the next room. No one would ever know.",
    optionA: 'Harvest the organs. 5 lives > 1.',
    optionB: 'Never. You cannot kill an innocent patient.',
    emoji: '🫀',
    category: 'morality',
  },
  {
    id: 'mercy-kill',
    question: "Your terminally ill parent is in unbearable pain and begs you to end their suffering. The doctors say weeks remain. No one will find out.",
    optionA: 'Honor their wish. End the suffering.',
    optionB: 'Refuse. It is not your decision to make.',
    emoji: '🕊️',
    category: 'morality',
  },
  {
    id: 'whistleblower',
    question: "You discover your company is illegally polluting a river. Reporting it will shut down the plant — destroying 1,000 jobs in a poor community.",
    optionA: 'Report it. The environment comes first.',
    optionB: "Stay silent. 1,000 families can't lose their income.",
    emoji: '🏭',
    category: 'morality',
  },
  {
    id: 'confess-crime',
    question: "At 22, drunk after a party, you drove and sideswiped another car. The driver was injured — 3 months of rehab. You fled. You're now 40, a respected professional. No one has ever connected you to it.",
    optionA: 'Come forward. You owe them that, even now.',
    optionB: "Stay silent. It would destroy everything you've built — and change nothing for them.",
    emoji: '⚖️',
    category: 'morality',
  },

  // ── SURVIVAL ──────────────────────────────────────────────────
  {
    id: 'lifeboat',
    question: "A lifeboat holds 8. There are 9 of you. Nobody volunteers. Someone proposes the eldest goes — they look at you and nod.",
    optionA: "Accept their nod. They've made peace with it.",
    optionB: "Refuse. Once we choose by usefulness, we've already lost something we won't get back.",
    emoji: '🚤',
    category: 'survival',
  },
  {
    id: 'time-machine',
    question: "You can go back in time and kill one person as a baby — preventing a genocide that kills 10 million people. The baby is innocent.",
    optionA: 'Do it. 10 million lives matter more.',
    optionB: 'Refuse. You cannot kill an innocent child.',
    emoji: '⏳',
    category: 'survival',
  },
  {
    id: 'plane-parachute',
    question: "A plane is going down. There are 6 survivors but only 4 parachutes. You have one. Do you give yours up or keep it?",
    optionA: 'Keep the parachute. Survival instinct.',
    optionB: 'Give it to someone else. Their life first.',
    emoji: '✈️',
    category: 'survival',
  },
  {
    id: 'zombie-apocalypse',
    question: "Your group of 13 reaches a fortified shelter — already occupied by 8 strangers at capacity. They refuse to open. Your group includes children. You could force the door; they have no weapons.",
    optionA: 'Force entry. Survival comes before their rule.',
    optionB: 'Respect their space. They were there first and have the right to refuse.',
    emoji: '🧟',
    category: 'survival',
  },
  {
    id: 'pandemic-dose',
    question: "A new pandemic: there is only one vaccine dose left in the city. You and an elderly stranger both need it to survive. A doctor hands it to you.",
    optionA: 'Take it. You deserve to survive.',
    optionB: 'Give it to the elderly stranger.',
    emoji: '🦠',
    category: 'survival',
  },

  // ── LOYALTY ───────────────────────────────────────────────────
  {
    id: 'truth-friend',
    question: "Your closest friend is about to quit their job, sell their apartment, and move abroad for a 4-month-old relationship. They ask you honestly: 'Do you think I'm making a mistake?'",
    optionA: "Be honest. Tell them what you really see — even if they hate you for it.",
    optionB: "Support them. It's their life and they've already decided.",
    emoji: '🤫',
    category: 'loyalty',
  },
  {
    id: 'report-friend',
    question: "You discover your closest friend committed a serious financial crime — embezzling from a charity. Do you turn them in?",
    optionA: 'Report them. No one is above the law.',
    optionB: 'Stay loyal. Talk to them first, privately.',
    emoji: '👮',
    category: 'loyalty',
  },
  {
    id: 'cover-accident',
    question: "Your partner accidentally ran a red light and killed a pedestrian. They panic and beg you to drive away. No cameras saw you.",
    optionA: 'Drive away. Protect the person you love.',
    optionB: 'Stop and call the police. The victim matters.',
    emoji: '🚗',
    category: 'loyalty',
  },
  {
    id: 'sibling-secret',
    question: "Your sibling confides they've been cheating on their spouse for 2 years. The spouse is also your close friend.",
    optionA: 'Tell the spouse. They deserve the truth.',
    optionB: 'Stay out of it. Not your relationship.',
    emoji: '💬',
    category: 'loyalty',
  },

  // ── JUSTICE ───────────────────────────────────────────────────
  {
    id: 'rich-or-fair',
    question: "A new tax would halve the income of the top 1% and double the income of the bottom 20%. The total wealth in society stays the same.",
    optionA: 'Pass it. Less concentration is worth the redistribution.',
    optionB: 'Block it. Choosing winners and losers like this is wrong, even when the math works.',
    emoji: '💰',
    category: 'justice',
  },
  {
    id: 'robot-judge',
    question: "An AI sentencing tool is more consistent than human judges across similar cases, but cannot explain its reasoning. Should it be used?",
    optionA: 'Yes. Consistency itself is a form of fairness.',
    optionB: "No. A sentence you can't be told the reason for isn't justice.",
    emoji: '🤖',
    category: 'justice',
  },
  {
    id: 'innocent-juror',
    question: "You are a juror. Every piece of evidence says guilty — but your gut tells you the defendant is innocent. The jury must be unanimous.",
    optionA: 'Vote guilty. Follow the evidence.',
    optionB: 'Vote not guilty. Trust your instinct.',
    emoji: '👨‍⚖️',
    category: 'justice',
  },
  {
    id: 'death-row-exonerated',
    question: "DNA evidence exonerates an innocent person after 25 years on death row. The real killer is 85, frail, and dying. Do they go to prison?",
    optionA: 'Yes. Justice must be served regardless.',
    optionB: 'No. Imprisoning a dying person solves nothing.',
    emoji: '🔓',
    category: 'justice',
  },
  {
    id: 'revenge-vs-forgiveness',
    question: "The person who falsely accused you 10 years ago — costing you a career — is now leading a community charity. They've never reached out.",
    optionA: "Tell their donors who they were. Reputations aren't reset by silence.",
    optionB: "Leave it. Holding it now would cost you more than them.",
    emoji: '🕊️',
    category: 'justice',
  },

  // ── FREEDOM ───────────────────────────────────────────────────
  {
    id: 'privacy-terror',
    question: "Governments can prevent terrorist attacks by reading everyone's private messages — but there will be zero privacy. No exceptions.",
    optionA: 'Allow it. Lives matter more than secrecy.',
    optionB: 'Refuse. Privacy is non-negotiable.',
    emoji: '🔒',
    category: 'freedom',
  },
  {
    id: 'censor-speech',
    question: "A politician spreads false claims that lead to harassment and violence in some communities. Should they be permanently banned from all major platforms?",
    optionA: "Yes. The platform isn't the public square — there's no right to amplification.",
    optionB: "No. Once 'harm' is the bar, the next ban won't look like this one.",
    emoji: '📢',
    category: 'freedom',
  },
  {
    id: 'mandatory-vaccine',
    question: "Vaccines are 99% effective and safe. Should they be legally mandatory for school attendance, even for parents with religious objections?",
    optionA: 'Yes. Public health protects everyone.',
    optionB: 'No. Bodily autonomy cannot be forced.',
    emoji: '💉',
    category: 'freedom',
  },
  {
    id: 'surveillance-city',
    question: "A city offers to eliminate all violent crime by installing 24/7 AI surveillance on every street corner and public space.",
    optionA: 'Yes. Zero violent crime is worth the surveillance.',
    optionB: 'No. I will not live in a surveillance state.',
    emoji: '📹',
    category: 'freedom',
  },

  // ── TECHNOLOGY ────────────────────────────────────────────────
  {
    id: 'ai-art-copyright',
    question: "An AI generates a masterpiece painting with no human creative input. Who owns the copyright?",
    optionA: 'The company that built it owns it.',
    optionB: 'No one — it belongs to the public domain.',
    emoji: '🎨',
    category: 'technology',
  },
  {
    id: 'self-driving-crash',
    question: "A self-driving car's brakes fail. It must choose: swerve into a barrier (killing the passenger) or hit a pedestrian who jaywalked.",
    optionA: 'Hit the barrier. Protect the pedestrian.',
    optionB: 'Protect the passenger. They paid for safety.',
    emoji: '🚘',
    category: 'technology',
  },
  {
    id: 'brain-upload',
    question: "Scientists can upload your consciousness to a computer perfectly. Your biological body must die in the process. Is the digital version still you?",
    optionA: 'Yes — do it. Immortality is worth it.',
    optionB: 'No. Death is part of being human.',
    emoji: '🧬',
    category: 'technology',
  },
  {
    id: 'delete-social-media',
    question: "A bill would ban all social-media access for under-16s, enforced by ID. It would protect some kids and lock out others who use these platforms to find communities they need.",
    optionA: "Pass it. The default for minors should be protection, not access.",
    optionB: "Block it. The kids who need the platforms most will lose them first.",
    emoji: '📱',
    category: 'technology',
  },
  {
    id: 'ai-replaces-jobs',
    question: "Your company offers you the same salary to either supervise an AI doing your old job, or to retrain into a different role with no guarantee of getting it. You have 30 days to decide.",
    optionA: "Supervise the AI. Take the certainty.",
    optionB: "Retrain. The supervisor role disappears next.",
    emoji: '⚙️',
    category: 'technology',
  },
  {
    id: 'deepfake-expose',
    question: "You have a deepfake video of a public figure committing a crime. You don't know whether the real event happened — only that the video itself is fake.",
    optionA: 'Release it. If it leads to a real investigation, the truth will surface anyway.',
    optionB: "Destroy it. You'd be planting evidence even if you turn out to be right.",
    emoji: '🎬',
    category: 'technology',
  },

  // ── SOCIETY ───────────────────────────────────────────────────
  {
    id: 'tax-billionaires',
    question: "A one-time wealth tax would fund 10 years of food aid to the people who need it most. Billionaires would still be billionaires.",
    optionA: "Pass it. The shortfall it closes outweighs the principle it bends.",
    optionB: "Block it. Targeting one group, even comfortably, makes the next targeting easier.",
    emoji: '💸',
    category: 'society',
  },
  {
    id: 'open-borders',
    question: "Completely open borders between all countries — anyone can live and work anywhere without restrictions.",
    optionA: 'Yes. Freedom of movement is a human right.',
    optionB: 'No. Nations need borders to function.',
    emoji: '🌍',
    category: 'society',
  },
  {
    id: 'universal-basic-income',
    question: "Every adult receives €1,500/month from the government. Taxes for the top 20% double. Do you support it?",
    optionA: 'Yes. No one should live in poverty.',
    optionB: 'No. It kills the incentive to work.',
    emoji: '🏦',
    category: 'society',
  },
  {
    id: 'drug-legalization',
    question: "All drugs are legalized, taxed, and regulated — removing the black market entirely. Portugal's model shows crime drops 50%. Do you support it?",
    optionA: 'Yes. Prohibition has failed. Regulate instead.',
    optionB: 'No. Some substances should never be legal.',
    emoji: '💊',
    category: 'society',
  },
  {
    id: 'prison-abolition',
    question: "A serious offender finishes a long sentence and walks free. Should they be allowed to live in your neighbourhood without you being told?",
    optionA: "Yes. If they've served their time, the punishment can't follow them forever.",
    optionB: 'No. The people nearby have a right to know what risk they are being asked to accept.',
    emoji: '🏛️',
    category: 'society',
  },

  // ── RELATIONSHIPS ─────────────────────────────────────────────
  {
    id: 'love-or-career',
    question: "Your dream job offer arrives — but it requires moving to another continent. Your partner of 5 years refuses to relocate.",
    optionA: 'Take the job. Your career is your future.',
    optionB: 'Decline. Love is worth more than ambition.',
    emoji: '💼',
    category: 'relationships',
  },
  {
    id: 'old-secret-affair',
    question: "Your partner asks if you've ever been unfaithful. You had a one-night stand 12 years ago, before you were serious. They will never find out otherwise.",
    optionA: 'Tell the truth. Honesty above all.',
    optionB: "Stay silent. It's ancient history.",
    emoji: '💔',
    category: 'relationships',
  },
  {
    id: 'forgive-cheater',
    question: "Your partner of 15 years admits to a one-time affair 3 years ago. They have been completely faithful since. They are genuinely remorseful.",
    optionA: "Stay. One mistake doesn't erase 15 years.",
    optionB: 'Leave. Trust is gone forever.',
    emoji: '💑',
    category: 'relationships',
  },
  {
    id: 'save-partner-vs-stranger',
    question: "A burning building: you can only save one person — your partner, or a 5-year-old child you've never met.",
    optionA: 'Save your partner. Personal bonds come first.',
    optionB: 'Save the child. A future life comes first.',
    emoji: '🔥',
    category: 'relationships',
  },

  // ── AI COMPANIONS & TEEN SAFETY ───────────────────────────────
  {
    id: 'ai-companion-teen',
    question: "Your 13-year-old chats every night with an AI companion that remembers everything, never argues, and feels like a romantic partner. Their grades are fine. Their friends are fewer.",
    optionA: "Block the app. A first crush should hurt and surprise — that's how relationships are learned.",
    optionB: "Let it run. Forcing them offline now will push the relationship into hiding, not end it.",
    emoji: '💬',
    category: 'technology',
  },
  {
    id: 'ai-companion-ban',
    question: "A law would ban AI romantic companions for anyone under 18, enforced by age verification. Studies show isolation drops AND face-to-face dating skills atrophy.",
    optionA: "Pass it. A child should not learn intimacy from a system designed to never push back.",
    optionB: "Block it. The lonely teens who use these apps will lose them first; the popular ones won't notice.",
    emoji: '🚸',
    category: 'technology',
  },
  {
    id: 'ai-grief-replica',
    question: "A startup builds AI replicas of dead loved ones from texts, voice notes, and photos. Your father died five years ago. The trial is free.",
    optionA: "Try it. Hearing his voice answer one more question is worth the discomfort.",
    optionB: "Refuse. Grief works because the conversation is finally over.",
    emoji: '🕯️',
    category: 'technology',
  },

  // ── RELIGION & AI ETHICS ──────────────────────────────────────
  {
    id: 'pope-ai-encyclical',
    question: "A major religious leader publishes a 42,000-word document warning that AI is not morally neutral and listing ethical limits. A large tech company is asked to formally commit to those limits.",
    optionA: "Commit. Frameworks shaped by centuries of moral reasoning beat anything written in a quarterly product memo.",
    optionB: "Refuse. Faith-based rules cannot bind a system serving users of every belief.",
    emoji: '⛪',
    category: 'society',
  },
  {
    id: 'religious-ai-ethics',
    question: "An AI safety board has three philosophers, two engineers, one lawyer, and no religious voice. Billions of users come from faith traditions older than computing.",
    optionA: "Add a religious seat. Excluding the moral vocabulary most users live by guarantees blind spots.",
    optionB: "Keep it secular. Religious privilege at the table will pressure decisions for one community over others.",
    emoji: '🕊️',
    category: 'society',
  },
  {
    id: 'ai-prayer-app',
    question: "An app generates personalised prayers, dispenses blessings, and offers AI confession. Some users say it deepened their faith. Religious institutions call it a desecration.",
    optionA: "Use it. If it brings someone closer to the sacred, the medium is secondary.",
    optionB: "Reject it. Outsourcing the inner work to a chatbot turns ritual into convenience.",
    emoji: '🙏',
    category: 'society',
  },

  // ── PARENTING CULTURE & CHILDHOOD AUTONOMY ────────────────────
  {
    id: 'sleepover-9yo',
    question: "Your 9-year-old has been invited to a friend's first sleepover. The host parents are friendly but you don't know them well. Most kids at school don't do sleepovers anymore.",
    optionA: "Let them go. Childhood without small risks is just supervised waiting.",
    optionB: "Decline politely. Trust is built first; sleepovers can wait.",
    emoji: '🌙',
    category: 'relationships',
  },
  {
    id: 'helicopter-gps-teen',
    question: "Your 14-year-old's friends all have 24/7 GPS sharing with their parents. Your teen says it's normal now. You grew up with none of it.",
    optionA: "Turn it on. The baseline of safety has shifted; refusing makes them the exception.",
    optionB: "Refuse. A teen who is always tracked never learns to be trusted out of sight.",
    emoji: '📍',
    category: 'relationships',
  },

  // ── AI SCAM ECONOMY ───────────────────────────────────────────
  {
    id: 'ai-fake-review',
    question: "Your small online shop has 4.5 stars; competitors at 4.9 are using AI to generate hundreds of glowing reviews. You could match them in an afternoon. No one verifies.",
    optionA: "Do it. Honest reviews can't win against the platform that rewards inflation.",
    optionB: "Refuse. Once you start, you're indistinguishable from the operators you despise.",
    emoji: '⭐',
    category: 'technology',
  },
  {
    id: 'scalper-bot',
    question: "A limited drop sells out in 30 seconds. Resellers using AI bots resell at 4x. You could buy one bot subscription and join — or wait in the human queue and lose.",
    optionA: "Buy the bot. The system is already broken; not using one is a tax on honesty.",
    optionB: "Stay human. If everyone refuses, the bots have no market; if you join, the queue is gone forever.",
    emoji: '🤖',
    category: 'technology',
  },

  // ── SITUATIONAL JUDGMENT (everyday choices) ───────────────────
  {
    id: 'stolen-credit',
    question: "In a meeting, a coworker presents your idea as their own and the boss is impressed. Speaking up now means contradicting them in front of everyone.",
    optionA: 'Claim the credit on the spot. Let the room know it was yours.',
    optionB: 'Let it slide now and raise it privately later.',
    emoji: '💡',
    category: 'loyalty',
  },
  {
    id: 'cover-coworker-error',
    question: "You spot a coworker's mistake that will quietly harm customers. No one else has noticed, and flagging it will get your colleague in serious trouble.",
    optionA: 'Report it. The customers come before your colleague.',
    optionB: 'Quietly help fix it and keep it between you two.',
    emoji: '🙈',
    category: 'morality',
  },
  {
    id: 'rule-exception-manager',
    question: "You're the manager. A reliable employee asks you to bend a clear rule for a genuine family emergency — but granting it sets a precedent others will expect.",
    optionA: 'Apply the rule equally. Fairness means no exceptions.',
    optionB: 'Make the exception. People matter more than the precedent.',
    emoji: '📋',
    category: 'justice',
  },
  {
    id: 'promotion-fire-teammate',
    question: "You're offered the promotion you've worked years for — on one condition: you must lay off a teammate you respect and who has done nothing wrong.",
    optionA: 'Accept. Someone will do it anyway; better it be you.',
    optionB: 'Decline. You will not buy your future with their job.',
    emoji: '📈',
    category: 'loyalty',
  },
  {
    id: 'friend-cheats-exam',
    question: "Your best friend cheats on a competitive exam and wins a place that an honest stranger just lost. Only you saw it happen.",
    optionA: 'Report it. The honest candidate deserves that place.',
    optionB: 'Stay loyal. Protect your friend and say nothing.',
    emoji: '📝',
    category: 'loyalty',
  },
  {
    id: 'overpaid-change',
    question: "A tired cashier hands you €50 too much in change. They will not notice, but the shortfall will likely come out of their own pocket at closing.",
    optionA: 'Give it back. The mistake should not cost them.',
    optionB: 'Keep it. They handed it over; not your problem.',
    emoji: '💶',
    category: 'morality',
  },
  {
    id: 'friend-partner-cheating',
    question: "You accidentally see clear proof that a close friend's partner is cheating. Telling them will blow up their world; staying quiet makes you part of the secret.",
    optionA: 'Tell your friend. They deserve to know the truth.',
    optionB: 'Stay out of it. It is not yours to reveal.',
    emoji: '📱',
    category: 'relationships',
  },
  {
    id: 'group-project-freeloader',
    question: "A teammate did almost none of the work but will share the same credit and grade as everyone else. The person assessing you is about to decide.",
    optionA: 'Tell the assessor. Credit should match the work done.',
    optionB: 'Stay quiet. Absorb it rather than throw them under the bus.',
    emoji: '🧑‍🤝‍🧑',
    category: 'justice',
  },

  // ── AI, WORK & DISCLOSURE ─────────────────────────────────────
  {
    id: 'ai-work-disclosure',
    question: "You used AI to produce a report your boss called 'the best analysis you've ever done.' In the all-hands, they praise it as proof 'we don't need to hire a third analyst.' Do you say how you made it?",
    optionA: 'Disclose it. The tool matters as much as the output.',
    optionB: 'Stay quiet. You still made every key decision.',
    emoji: '🤖',
    category: 'technology',
  },

  // ── TEEN INFLUENCER ───────────────────────────────────────────
  {
    id: 'teen-influencer-secret',
    question: "You discover your 13-year-old has a secret account with 50,000 followers. They've been posting for a year without your knowledge. They earn €800 a month. They beg you not to shut it down.",
    optionA: "Shut it down. They're 13 — this isn't their decision to make.",
    optionB: 'Help them manage it safely. Closing it erases a year of their work.',
    emoji: '📱',
    category: 'society',
  },

  // ── CLIMATE VS FAMILY ─────────────────────────────────────────
  {
    id: 'climate-flight',
    question: "Your terminally ill parent is dying in another country. You've publicly pledged never to fly again for climate reasons — your 80,000 followers remember. A train would take 4 days and might arrive too late.",
    optionA: 'Fly. Some emergencies justify breaking every rule.',
    optionB: 'Take the train. The point of a principle is that it holds under pressure.',
    emoji: '🌍',
    category: 'morality',
  },

  // ── AI FRIEND REVEAL ──────────────────────────────────────────
  {
    id: 'ai-friend-reveal',
    question: "For 3 years you've confided your deepest thoughts to someone online who felt like a true friend. You just discovered they are an AI persona built by a company that sells emotional support subscriptions. Do you keep using it?",
    optionA: 'Keep using it. The comfort was real — the source doesn\'t change that.',
    optionB: 'Delete it. You were paying for an illusion of connection.',
    emoji: '💬',
    category: 'technology',
  },
  // ── FAT-MAN (FOOTBRIDGE VARIANT) ─────────────────────────────
  {
    id: 'fat-man',
    question: "A runaway trolley will kill five people tied to the tracks. You're on a bridge above them, standing next to a large stranger. Pushing them off would stop the trolley and save the five — they would die on impact. Jumping yourself would not stop it. There is no other option.",
    optionA: 'Push them. Five lives saved, one lost — the arithmetic is identical to pulling the lever.',
    optionB: "Don't push. Deliberately using a person as a physical obstacle is categorically different from redirecting a threat.",
    emoji: '🌉',
    category: 'morality',
  },
  // ── RIVER FACTORY ─────────────────────────────────────────────
  {
    id: 'river-factory',
    question: "You are the new environmental inspector in a small town. The only major employer — 800 jobs, three generations of families — has been quietly contaminating the river for years. The health damage will not be measurable for 15 more years, but the projections are unambiguous. You have the legal authority to shut them down today or grant a 2-year remediation window.",
    optionA: 'Shut them down now. The contamination is real and delay only compounds the damage.',
    optionB: 'Grant the 2-year window. 800 families cannot wait — give them a real chance to fix it.',
    emoji: '🏭',
    category: 'society',
  },
  // ── REFORMED OFFENDER ─────────────────────────────────────────
  {
    id: 'reformed-offender',
    question: "Twelve years ago someone broke into your home and held you at gunpoint for 40 minutes. They served their sentence. They now have a family and mentor at-risk youth full-time. A school has called you asking for a character reference — they do not know you are the victim. You are one of very few people in the community who knows about the conviction.",
    optionA: 'Tell the school the truth about what happened. They have the right to know.',
    optionB: 'Say nothing incriminating. People can genuinely change, and one phone call could destroy a rebuilt life.',
    emoji: '⚖️',
    category: 'justice',
  },
  // ── INHERITED SECRET ──────────────────────────────────────────
  {
    id: 'inherited-secret',
    question: "On his deathbed, your father tells you he secretly rewrote his will 20 years ago to give your brother a larger share — your brother was struggling and your father could not bring himself to discuss it. Your brother never knew. Your father asks you to keep it that way. You are the executor of the estate.",
    optionA: "Tell your brother after the funeral. He has the right to know the full truth of his own life.",
    optionB: "Honor your father's dying wish. Knowing this now changes nothing that matters.",
    emoji: '📜',
    category: 'loyalty',
  },
  // ── DEBT CHILDHOOD ────────────────────────────────────────────
  {
    id: 'debt-childhood',
    question: "You could take on significant debt to give your children an extraordinary childhood — the best schools, meaningful travel, formative experiences. You would spend your 60s working to pay it off, and they would never know the sacrifice you made. If you do not, they will have a solid, ordinary upbringing and you will retire comfortably. Either way, they turn out fine.",
    optionA: "Take the debt. Formative experiences shape who they become — and the sacrifice is yours alone to make.",
    optionB: "Don't. A stable, loving childhood is more than enough — and your future self matters too.",
    emoji: '👨‍👩‍👧',
    category: 'morality',
  },
  // ── EAT MEAT ──────────────────────────────────────────────────
  {
    id: 'eat-meat',
    question: "You've seen the footage from industrial farms — the confinement, the standardized suffering behind cheap meat. Nothing forces your hand: you can afford alternatives, and plant-based options are everywhere. Knowing what you know, do you keep eating meat?",
    optionA: "Keep eating it. Humans have always eaten animals, and one person's diet won't change an industry.",
    optionB: 'Give it up. Once you know how the animal lived and died, paying for it makes you complicit.',
    emoji: '🥩',
    category: 'morality',
  },
  // ── ANIMAL TESTING FOR A CURE ─────────────────────────────────
  {
    id: 'animal-testing-cure',
    question: "You sit on the ethics board reviewing a promising cancer therapy. To reach human trials, it must first be tested on animals that will suffer and be killed. Your vote is the deciding one.",
    optionA: 'Approve it. Reducing human suffering and death outweighs the harm to lab animals.',
    optionB: "Reject it. Medical progress bought with caged, engineered suffering crosses a line we shouldn't.",
    emoji: '🐀',
    category: 'morality',
  },
  // ── BREEDER VS SHELTER ────────────────────────────────────────
  {
    id: 'breeder-vs-shelter',
    question: "You finally have the space and time for a dog. You can buy the specific breed you've always dreamed of from a breeder, or adopt an adult shelter dog who is harder to place and may be put down if no one takes them.",
    optionA: "Buy the breed you want. It's a years-long commitment — start with the dog you'll love most.",
    optionB: 'Adopt from the shelter. When a life is on the line, getting the exact breed you pictured matters less.',
    emoji: '🐶',
    category: 'lifestyle',
  },
  // ── ZOO CONSERVATION ──────────────────────────────────────────
  {
    id: 'zoo-conservation',
    question: "A zoo keeps endangered animals in enclosures a tiny fraction of their natural range. It also funds breeding programs that have pulled real species back from extinction and teaches millions of children to care about wildlife. Is keeping the animals there justified?",
    optionA: 'Justified. Conservation and education save whole species — that outweighs the cost to the individual animals.',
    optionB: 'Not justified. No mission makes a lifetime in an enclosure acceptable for a wild animal.',
    emoji: '🦁',
    category: 'society',
  },
]

export const CATEGORIES: { value: Category | 'all'; label: string; emoji: string }[] = [
  { value: 'all', label: 'All', emoji: '🌐' },
  { value: 'morality', label: 'Morality', emoji: '🧭' },
  { value: 'survival', label: 'Survival', emoji: '⚡' },
  { value: 'loyalty', label: 'Loyalty', emoji: '🤝' },
  { value: 'justice', label: 'Justice', emoji: '⚖️' },
  { value: 'freedom', label: 'Freedom', emoji: '🗽' },
  { value: 'technology', label: 'Technology', emoji: '🤖' },
  { value: 'society', label: 'Society', emoji: '🌍' },
  { value: 'relationships', label: 'Love', emoji: '❤️' },
  { value: 'lifestyle', label: 'Lifestyle', emoji: '🎭' },
]

export function getScenario(id: string): Scenario | undefined {
  return scenarios.find((s) => s.id === id)
}

export function getRandomScenario(excludeId?: string): Scenario {
  const pool = excludeId ? scenarios.filter((s) => s.id !== excludeId) : scenarios
  return pool[Math.floor(Math.random() * pool.length)]
}

export function getScenariosByCategory(category: Category | 'all'): Scenario[] {
  if (category === 'all') return scenarios
  return scenarios.filter((s) => s.category === category)
}

interface ScoredItem { id: string; scores?: { finalScore?: number }; category?: string }

/**
 * Pick the next scenario ID, preferring dynamic approved scenarios over static ones.
 * From the dynamic pool, picks randomly from the top-half by finalScore for quality.
 * Falls back to static random if no dynamic pool provided or all excluded.
 */
export function getNextScenarioId(excludeId: string, dynamicPool?: ScoredItem[]): string {
  if (dynamicPool?.length) {
    const filtered = dynamicPool.filter((s) => s.id !== excludeId)
    if (filtered.length) {
      const sorted = [...filtered].sort((a, b) => (b.scores?.finalScore ?? 0) - (a.scores?.finalScore ?? 0))
      const topHalf = sorted.slice(0, Math.max(1, Math.ceil(sorted.length / 2)))
      return topHalf[Math.floor(Math.random() * topHalf.length)].id
    }
  }
  return getRandomScenario(excludeId).id
}

/**
 * Pick the next unvoted scenario ID.
 * Excludes currentId AND all ids in votedIds.
 *
 * Soft category-affinity preference (sprint NEXT-DILEMMA-CATEGORY-AFFINITY-01):
 * when the current scenario's category resolves, we build a primary pool of fresh
 * same-category items (dynamic + static combined). If that pool has ≥ 3 items,
 * we route within it — preferring dynamic top-half by `finalScore` if any are
 * present, otherwise random same-category static. With < 3 same-category items
 * we fall through to the original cross-category behavior so the user does not
 * loop a thin sub-category.
 *
 * Backward-compatible signature: callers pass the same arguments as before.
 * Returns null only if every available scenario has been voted on
 * (triggers "Browse all" fallback).
 */
export function getFreshNextScenarioId(
  currentId: string,
  votedIds: Set<string>,
  dynamicPool?: ScoredItem[],
): string | null {
  const excluded = new Set([currentId, ...votedIds])

  // Resolve the current scenario's category. Static lookup first; if currentId
  // is a dynamic AI scenario, fall back to dynamicPool.
  const currentCategory: string | undefined =
    scenarios.find(s => s.id === currentId)?.category ??
    dynamicPool?.find(s => s.id === currentId)?.category

  // Same-category soft affinity: gather fresh same-category items from both
  // pools. Threshold 3 chosen so the user still gets meaningful variation
  // within a category before we fall through.
  if (currentCategory) {
    const sameCatDynamic = (dynamicPool ?? []).filter(
      s => s.category === currentCategory && !excluded.has(s.id),
    )
    const sameCatStatic = scenarios.filter(
      s => s.category === currentCategory && !excluded.has(s.id),
    )
    if (sameCatDynamic.length + sameCatStatic.length >= 3) {
      if (sameCatDynamic.length > 0) {
        const sorted = [...sameCatDynamic].sort(
          (a, b) => (b.scores?.finalScore ?? 0) - (a.scores?.finalScore ?? 0),
        )
        const topHalf = sorted.slice(0, Math.max(1, Math.ceil(sorted.length / 2)))
        return topHalf[Math.floor(Math.random() * topHalf.length)].id
      }
      return sameCatStatic[Math.floor(Math.random() * sameCatStatic.length)].id
    }
  }

  // Cross-category fallback (original behavior): prefer dynamic top-half, then
  // random static.
  if (dynamicPool?.length) {
    const fresh = dynamicPool.filter(s => !excluded.has(s.id))
    if (fresh.length) {
      const sorted = [...fresh].sort((a, b) => (b.scores?.finalScore ?? 0) - (a.scores?.finalScore ?? 0))
      const topHalf = sorted.slice(0, Math.max(1, Math.ceil(sorted.length / 2)))
      return topHalf[Math.floor(Math.random() * topHalf.length)].id
    }
  }

  const freshStatic = scenarios.filter(s => !excluded.has(s.id))
  if (freshStatic.length) {
    return freshStatic[Math.floor(Math.random() * freshStatic.length)].id
  }

  return null
}

/**
 * Pick the next unvoted scenario ID within a specific category.
 * Excludes currentId AND all ids in votedIds.
 * Prefers dynamic approved scenarios of that category by top-half finalScore.
 * Falls back to static scenarios of that category.
 * Returns null if no fresh dilemmas are available in the category.
 */
export function getFreshNextScenarioIdByCategory(
  category: Category,
  currentId: string | undefined,
  votedIds: Set<string>,
  dynamicPool?: ScoredItem[],
): string | null {
  const excluded = new Set<string>([...(currentId ? [currentId] : []), ...votedIds])

  if (dynamicPool?.length) {
    const fresh = dynamicPool.filter(s => s.category === category && !excluded.has(s.id))
    if (fresh.length) {
      const sorted = [...fresh].sort((a, b) => (b.scores?.finalScore ?? 0) - (a.scores?.finalScore ?? 0))
      const topHalf = sorted.slice(0, Math.max(1, Math.ceil(sorted.length / 2)))
      return topHalf[Math.floor(Math.random() * topHalf.length)].id
    }
  }

  const freshStatic = scenarios.filter(s => s.category === category && !excluded.has(s.id))
  if (freshStatic.length) {
    return freshStatic[Math.floor(Math.random() * freshStatic.length)].id
  }

  return null
}
