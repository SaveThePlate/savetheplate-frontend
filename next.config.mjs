import nextPWA from 'next-pwa';

const withPWA = nextPWA({
  dest: 'public',      // service worker will be generated in /public
  register: true,      // auto-register the service worker
  skipWaiting: true,   // activate new service worker immediately
  // Disable during non-production builds to avoid Workbox/GenerateSW being
  // invoked multiple times (Next.js compiles client + server). Enable only
  // in production to generate a single, stable service worker.
  disable: process.env.NODE_ENV !== 'production',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', pathname: '/storage/**' },
      { protocol: 'https', hostname: 'leftover-be.ccdev.space', pathname: '/storage/**' },
      // Allow images from any domain (for flexibility)
      { protocol: 'http', hostname: '**', pathname: '/storage/**' },
      { protocol: 'https', hostname: '**', pathname: '/storage/**' },
    ],
    unoptimized: false, // Enable optimization for better performance
  },

  async headers() {
    const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || 'https://leftover-be.ccdev.space').replace(/\/$/, '');
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
      "style-src 'self' 'unsafe-inline' https:",
      "img-src 'self' data: blob: https:",
      "media-src 'self' data: blob: https:",
      `connect-src 'self' ${backendUrl} http://localhost:*/ https: ws: wss:`,
      "font-src 'self' data: https:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');

    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy-Report-Only',
            value: csp,
          },
        ],
      },
    ];
  },
};

export default withPWA(nextConfig);