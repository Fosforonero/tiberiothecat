import { describe, it, expect } from 'vitest'
import { safeRedirect } from '@/lib/safe-redirect'

describe('safeRedirect', () => {
  it('falls back to default when input is null or undefined', () => {
    expect(safeRedirect(null)).toBe('/dashboard')
    expect(safeRedirect(undefined)).toBe('/dashboard')
    expect(safeRedirect('')).toBe('/dashboard')
  })

  it('respects a custom fallback', () => {
    expect(safeRedirect(null, '/home')).toBe('/home')
    expect(safeRedirect('', '/it')).toBe('/it')
  })

  it('allows relative paths starting with a single slash', () => {
    expect(safeRedirect('/dashboard')).toBe('/dashboard')
    expect(safeRedirect('/it/profile')).toBe('/it/profile')
    expect(safeRedirect('/play/trolley?ref=abc')).toBe('/play/trolley?ref=abc')
  })

  it('blocks protocol-relative URLs (//evil.com)', () => {
    expect(safeRedirect('//evil.com')).toBe('/dashboard')
    expect(safeRedirect('//evil.com/path')).toBe('/dashboard')
  })

  it('blocks absolute URLs', () => {
    expect(safeRedirect('https://evil.com')).toBe('/dashboard')
    expect(safeRedirect('http://evil.com/path')).toBe('/dashboard')
    expect(safeRedirect('javascript:alert(1)')).toBe('/dashboard')
  })

  it('blocks backslash paths (Windows-style traversal)', () => {
    expect(safeRedirect('/\\evil')).toBe('/dashboard')
    expect(safeRedirect('/foo\\bar')).toBe('/dashboard')
  })

  it('blocks redirects into /api/*', () => {
    expect(safeRedirect('/api/admin/delete')).toBe('/dashboard')
    expect(safeRedirect('/api/auth/callback')).toBe('/dashboard')
  })

  it('allows paths that contain "api" but do not start with /api/', () => {
    expect(safeRedirect('/profile/api-keys')).toBe('/profile/api-keys')
    expect(safeRedirect('/blog/what-is-api')).toBe('/blog/what-is-api')
  })
})
