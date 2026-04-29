'use client'

import { useEffect, useState } from 'react'
import type { UserRole } from '@/lib/admin-auth'

interface RoleUser {
  id: string
  display_name: string | null
  email: string
  role: UserRole
  created_at: string
}

const ROLE_COLORS: Record<UserRole, string> = {
  super_admin: 'text-red-400 border-red-500/30 bg-red-500/10',
  admin:       'text-orange-400 border-orange-500/30 bg-orange-500/10',
  moderator:   'text-blue-400 border-blue-500/30 bg-blue-500/10',
  creator:     'text-purple-400 border-purple-500/30 bg-purple-500/10',
  user:        'text-[var(--muted)] border-white/10 bg-white/5',
}

export default function RolesPanel() {
  const [users, setUsers] = useState<RoleUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Record<string, string>>({})

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/roles')
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Error'); return }
      setUsers(data.users ?? [])
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function assign(targetUserId: string, newRole: UserRole) {
    setPending(targetUserId)
    setFeedback(f => ({ ...f, [targetUserId]: '' }))
    try {
      const res = await fetch('/api/admin/roles/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId, newRole }),
      })
      const data = await res.json()
      if (!res.ok) {
        setFeedback(f => ({ ...f, [targetUserId]: data.error ?? 'Error' }))
      } else {
        const msg = data.auditWarning
          ? `✓ ${data.oldRole} → ${data.newRole} (audit warning: ${data.auditWarning})`
          : `✓ ${data.oldRole} → ${data.newRole}`
        setFeedback(f => ({ ...f, [targetUserId]: msg }))
        await load()
      }
    } catch {
      setFeedback(f => ({ ...f, [targetUserId]: 'Network error' }))
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 flex items-start gap-3">
        <span className="text-red-400 text-sm flex-shrink-0 mt-0.5">🛡️</span>
        <div>
          <p className="text-sm font-bold text-red-300 mb-1">Role management — super_admin only</p>
          <p className="text-xs text-white/50 leading-relaxed">
            Changes take effect immediately. <code className="font-mono text-red-300">super_admin</code> cannot be
            assigned via this UI — only via SQL migration. All changes are audit-logged.
          </p>
        </div>
      </div>

      {loading && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center text-[var(--muted)] text-sm">
          Loading…
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-400 text-sm">{error}</div>
      )}

      {!loading && !error && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-xs font-black uppercase tracking-widest text-[var(--muted)] px-5 py-3">User</th>
                <th className="text-left text-xs font-black uppercase tracking-widest text-[var(--muted)] px-5 py-3">Current role</th>
                <th className="text-left text-xs font-black uppercase tracking-widest text-[var(--muted)] px-5 py-3">Assign role</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center text-[var(--muted)] text-xs py-6">
                    No privileged users found.
                  </td>
                </tr>
              )}
              {users.map(u => (
                <tr key={u.id} className="border-b border-white/5 last:border-0">
                  <td className="px-5 py-3">
                    <p className="text-white font-semibold text-sm truncate max-w-[180px]">{u.display_name ?? '—'}</p>
                    <p className="text-[var(--muted)] text-xs font-mono truncate max-w-[180px]">{u.email}</p>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-black px-2.5 py-1 rounded-full border ${ROLE_COLORS[u.role]}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {u.role === 'super_admin' ? (
                      <span className="text-xs text-[var(--muted)]">—</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <select
                          defaultValue={u.role}
                          disabled={pending === u.id}
                          onChange={e => assign(u.id, e.target.value as UserRole)}
                          className="text-xs bg-[#0d0d1f] border border-white/10 text-white rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-500/50 disabled:opacity-50"
                        >
                          <option value="user">user</option>
                          <option value="moderator">moderator</option>
                          <option value="admin">admin</option>
                        </select>
                        {feedback[u.id] && (
                          <span className={`text-xs ${feedback[u.id].startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>
                            {feedback[u.id]}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
