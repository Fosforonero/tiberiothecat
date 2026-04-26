import type { NextConfig } from "next";

const securityHeaders = [
  // Prevent clickjacking – only same origin can frame the site
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Prevent MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Safe referrer policy – sends origin on cross-site requests, full URL on same-site
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disable browser features we don't use
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  // Force HTTPS for 2 years (preload-ready)
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Basic XSS protection for legacy browsers
  { key: "X-XSS-Protection", value: "1; mode=block" },
  // NOTE: Content-Security-Policy is intentionally omitted here.
  // AdSense and GA4 require broad script/frame permissions that a strict
  // CSP would block. Google's CMP handles script consent at runtime.
];

const nextConfig: NextConfig = {
  eslint: {
    // Disable ESLint during build — the eslint.config.mjs uses flat config format
    // (ESLint 9 syntax) which is incompatible with the eslint@8 package.
    // Linting is handled separately in CI / local dev.
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
