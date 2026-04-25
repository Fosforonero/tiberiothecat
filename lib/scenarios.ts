export interface Scenario {
  id: string
  question: string
  optionA: string
  optionB: string
  emoji: string
  category: 'morality' | 'survival' | 'loyalty' | 'justice' | 'freedom'
}

export const scenarios: Scenario[] = [
  {
    id: 'trolley',
    question: 'A runaway trolley is heading toward 5 people. You can pull a lever to divert it — but it will kill 1 person instead.',
    optionA: 'Pull the lever. Save 5, sacrifice 1.',
    optionB: 'Do nothing. Let fate decide.',
    emoji: '🚋',
    category: 'morality',
  },
  {
    id: 'lifeboat',
    question: 'A lifeboat holds 8 people maximum. There are 9 survivors. Someone must go overboard or everyone drowns.',
    optionA: 'Vote to push someone off.',
    optionB: 'Refuse. Sink or swim together.',
    emoji: '🚤',
    category: 'survival',
  },
  {
    id: 'truth-friend',
    question: "Your best friend asks if you like their new partner. You think the partner is terrible for them.",
    optionA: 'Be brutally honest.',
    optionB: 'Keep the peace. Stay silent.',
    emoji: '🤫',
    category: 'loyalty',
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
    id: 'time-machine',
    question: "You can go back in time and kill one person as a baby — preventing a genocide that kills 10 million people. The baby is innocent.",
    optionA: 'Do it. 10 million lives matter more.',
    optionB: 'Refuse. You cannot kill an innocent child.',
    emoji: '⏳',
    category: 'justice',
  },
  {
    id: 'privacy-terror',
    question: "Governments can prevent terrorist attacks by reading everyone's private messages — but there will be zero privacy. No exceptions.",
    optionA: 'Allow it. Safety first.',
    optionB: 'Refuse. Privacy is non-negotiable.',
    emoji: '🔒',
    category: 'freedom',
  },
  {
    id: 'rich-or-fair',
    question: "You can press a button: everyone on Earth becomes equally poor, or the world stays as-is with extreme inequality.",
    optionA: 'Press it. Equal poverty is fairer.',
    optionB: "Don't press. Keep the current world.",
    emoji: '⚖️',
    category: 'justice',
  },
  {
    id: 'memory-erase',
    question: "A pill erases all your painful memories — but also the lessons you learned from them. You become happier but more naive.",
    optionA: 'Take the pill. Happiness matters.',
    optionB: 'Refuse. Pain made you who you are.',
    emoji: '💊',
    category: 'morality',
  },
  {
    id: 'steal-medicine',
    question: "Your child is dying and needs medicine you cannot afford. You could steal it. The store owner is not evil — just running a business.",
    optionA: 'Steal it. Your child comes first.',
    optionB: "Don't steal. Find another way.",
    emoji: '💉',
    category: 'morality',
  },
  {
    id: 'robot-judge',
    question: "AI is proven to be 30% more accurate than human judges. Would you replace human judges with AI in criminal trials?",
    optionA: 'Yes. Better accuracy saves lives.',
    optionB: 'No. Justice needs a human touch.',
    emoji: '🤖',
    category: 'justice',
  },
]

export function getScenario(id: string): Scenario | undefined {
  return scenarios.find((s) => s.id === id)
}
