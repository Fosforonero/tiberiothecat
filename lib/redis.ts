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
 */
export async function replaceVote(
  scenarioId: string,
  oldOption: 'a' | 'b',
  newOption: 'a' | 'b',
): Promise<void> {
  if (oldOption === newOption) return
  const key = `votes:${scenarioId}`
  await Promise.all([
    redis.hincrby(key, oldOption, -1),
    redis.hincrby(key, newOption, 1),
  ])
}

export async function getVotes(scenarioId: string): Promise<{ a: number; b: number }> {
  const result = await redis.hgetall(`votes:${scenarioId}`)
  return {
    a: Math.max(0, Number(result?.a ?? 0)),
    b: Math.max(0, Number(result?.b ?? 0)),
  }
}

/**
 * Batch-fetch vote totals for multiple dilemmas in parallel.
 * Returns a map: dilemmaId → total votes.
 */
export async function getVotesBatch(
  ids: string[],
): Promise<Map<string, number>> {
  if (ids.length === 0) return new Map()
  const results = await Promise.all(ids.map(id => getVotes(id)))
  const map = new Map<string, number>()
  ids.forEach((id, i) => {
    map.set(id, results[i].a + results[i].b)
  })
  return map
}
