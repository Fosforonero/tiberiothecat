export async function shareQuestion(opts: {
  title: string
  text: string
  url: string
}): Promise<'shared' | 'copied' | 'cancelled'> {
  if (typeof navigator === 'undefined') return 'cancelled'
  if (navigator.share) {
    try {
      await navigator.share(opts)
      return 'shared'
    } catch {
      return 'cancelled'
    }
  }
  await navigator.clipboard.writeText(`${opts.text}\n${opts.url}`)
  return 'copied'
}
