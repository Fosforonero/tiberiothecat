import { Redis } from '@upstash/redis'

export const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

export async function incrementVote(scenarioId: string, option: 'a' | 'b'): Promise<void> {
  await redis.hincrby(`votes:${scenarioId}`, option, 1)
}

/**
 * Atomically swap a vote using a Lua script: one round-trip, no partial failure.
 * Reads old field value before decrementing — skips decrement if already 0
 * to prevent negative counts even under concurrent writes.
 */
export async function replaceVote(
  scenarioId: string,
  oldOption: 'a' | 'b',
  newOption: 'a' | 'b',
): Promise<void> {
  if (oldOption === newOption) return
  const key = `votes:${scenarioId}`
  const lua = [
    'local v = tonumber(redis.call("HGET", KEYS[1], ARGV[1])) or 0',
    'if v > 0 then redis.call("HINCRBY", KEYS[1], ARGV[1], -1) end',
    'redis.call("HINCRBY", KEYS[1], ARGV[2], 1)',
    'return 1',
  ].join('\n')
  await redis.eval(lua, [key], [oldOption, newOption])
}

export async function getVotes(scenarioId: string): Promise<{ a: number; b: number }> {
  const result = await redis.hgetall(`votes:${scenarioId}`)
  return {
    a: Math.max(0, Number(result?.a ?? 0)),
    b: Math.max(0, Number(result?.b ?? 0)),
  }
}

/**
 * Batch-fetch vote totals for multiple dilemmas in a single HTTP round-trip.
 * Uses Upstash pipeline to batch all HGETALL commands into one request.
 * Returns a map: dilemmaId → total votes.
 */
export async function getVotesBatch(
  ids: string[],
): Promise<Map<string, number>> {
  if (ids.length === 0) return new Map()
  const p = redis.pipeline()
  for (const id of ids) p.hgetall(`votes:${id}`)
  const results = await p.exec() as Array<Record<string, string> | null>
  const map = new Map<string, number>()
  ids.forEach((id, i) => {
    const r = results[i]
    const a = Math.max(0, Number(r?.a ?? 0))
    const b = Math.max(0, Number(r?.b ?? 0))
    map.set(id, a + b)
  })
  return map
}
