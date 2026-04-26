/** @type {import('next').NextConfig} */

const securityHeaders = [
  // Prevent clickjacking — only same origin can frame the site
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  // Prevent MIME-type sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Safe referrer policy
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Disable browser features we don't use
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  // Force HTTPS for 2 years (preload-ready)
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // Basic XSS protection for legacy browsers
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  // NOTE: Content-Security-Policy intentionally omitted.
  // AdSense + GA4 require broad script/frame permissions that a strict CSP would block.
]

const nextConfig = {
  eslint: {
    // ESLint 9 flat config incompatible with eslint@8 — handled separately in dev
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
