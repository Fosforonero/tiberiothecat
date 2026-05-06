/**
 * Client-side cache for server-fetched voted dilemma IDs.
 * One HTTP request per JS runtime lifetime, shared across all components
 * (VotedDilemmaCard, DailyDilemma) via module-level Promise.
 *
 * Cookie fast path covers votes made on the current device; this covers
 * cross-device votes for logged-in users. Anonymous callers receive [].
 */

let _fetch: Promise<Set<string>> | null = null

export function getServerVotedIds(): Promise<Set<string>> {
  if (!_fetch) {
    _fetch = fetch('/api/me/voted-ids')
      .then((r) => (r.ok ? r.json() : { ids: [] }))
      .then(({ ids }: { ids: string[] }) => new Set(ids))
      .catch(() => new Set<string>())
  }
  return _fetch
}
