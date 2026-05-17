import { describe, it, expect } from 'vitest'
import { freshFirst } from '@/lib/voted-ids'

describe('freshFirst', () => {
  const items = [
    { id: 'a', label: 'A' },
    { id: 'b', label: 'B' },
    { id: 'c', label: 'C' },
    { id: 'd', label: 'D' },
  ]

  it('returns input unchanged when no voted IDs', () => {
    const result = freshFirst(items, new Set())
    expect(result.map(i => i.id)).toEqual(['a', 'b', 'c', 'd'])
  })

  it('moves voted items to the end, preserving relative order in both halves', () => {
    const result = freshFirst(items, new Set(['a', 'c']))
    expect(result.map(i => i.id)).toEqual(['b', 'd', 'a', 'c'])
  })

  it('returns same order when all items are voted', () => {
    const result = freshFirst(items, new Set(['a', 'b', 'c', 'd']))
    expect(result.map(i => i.id)).toEqual(['a', 'b', 'c', 'd'])
  })

  it('guarantees position 0 is unvoted when any unvoted item exists', () => {
    const result = freshFirst(items, new Set(['a']))
    expect(result[0].id).toBe('b')
  })

  it('handles empty input', () => {
    expect(freshFirst([], new Set(['x']))).toEqual([])
  })

  it('does not mutate the input array', () => {
    const original = [...items]
    freshFirst(items, new Set(['a', 'c']))
    expect(items).toEqual(original)
  })
})
