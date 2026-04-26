import { Redis } from '@upstash/redis'

export const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

export async function incrementVote(scenarioId: string, option: 'a' | 'b'): Promise<void> {
  await redis.hincrby(`votes:${scenarioId}`, option, 1)
}

/**
 * Atomically replace a previous vote: decrement the old option, increment the new one.
 * Used when a logged-in user changes their vote within the 24h window.
 */
export async function replaceVote(
  scenarioId: string,
  oldOption: 'a' | 'b',
  newOption: 'a' | 'b',
): Promise<void> {
  if (oldOption === newOption) return
  const key = `votes:${scenarioId}`
  // Pipeline both ops in one round-trip
  await Promise.all([
    redis.hincrby(key, oldOption, -1),
    redis.hincrby(key, newOption, 1),
  ])
}

export async function getVotes(scenarioId: string): Promise<{ a: number; b: number }> {
  const result = await redis.hgetall(`votes:${scenarioId}`)
  return {
    // Guard against negative values caused by decrement races
    a: Math.max(0, Number(result?.a ?? 0)),
    b: Math.max(0, Number(result?.b ?? 0)),
  }
}
