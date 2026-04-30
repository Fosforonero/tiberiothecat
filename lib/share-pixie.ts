export type ShareResult = 'shared' | 'copied' | 'error'

interface SharePixieOptions {
  stage: number
  stageLabel: string
  profileUrl: string
  locale: string
}

export async function sharePixieLevelUp(opts: SharePixieOptions): Promise<ShareResult> {
  const { locale, profileUrl } = opts
  const text =
    locale === 'it'
      ? 'Il mio Pixie è salito di livello su SplitVote.'
      : 'My Pixie leveled up on SplitVote.'
  const title =
    locale === 'it'
      ? 'Il mio Pixie è salito di livello!'
      : 'My Pixie leveled up!'

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text, url: profileUrl })
      return 'shared'
    } catch {
      // User cancelled or browser denied — fall through to clipboard
    }
  }

  try {
    await navigator.clipboard.writeText(`${text}\n${profileUrl}`)
    return 'copied'
  } catch {
    return 'error'
  }
}
