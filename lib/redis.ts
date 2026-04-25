import { Redis } from '@upstash/redis'

export const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

export async function incrementVote(scenarioId: string, option: 'a' | 'b'): Promise<void> {
  await redis.hincrby(`votes:${scenarioId}`, option, 1)
}

export async function getVotes(scenarioId: string): Promise<{ a: number; b: number }> {
  const result = await redis.hgetall(`votes:${scenarioId}`)
  return {
    a: Number(result?.a ?? 0),
    b: Number(result?.b ?? 0),
  }
}
