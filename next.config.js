/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // ESLint 9 flat config is incompatible with eslint@8 — skip during builds
    ignoreDuringBuilds: true,
  },
  poweredByHeader: false,
  experimental: {},

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options',        value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Referrer-Policy',         value: 'strict-origin-when-cross-origin' },
          {
            key:   'Permissions-Policy',
            // payment=(self) required for Stripe redirect checkout
            value: 'camera=(), microphone=(), geolocation=(), payment=(self)',
          },
          {
            key:   'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          // NOTE: Content-Security-Policy intentionally omitted.
          // AdSense + GA4 require broad script/frame permissions that a strict CSP would block.
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
